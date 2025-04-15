import NextAuth, { CredentialsSignin } from 'next-auth';
import Passkey from 'next-auth/providers/passkey';
import Credentials from 'next-auth/providers/credentials';
import forge from "node-forge";
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import type { Provider } from 'next-auth/providers';
import type { Session } from 'next-auth';
import { verifySignature } from './app/utils/crypto';
import { isValidCertificate } from './app/utils/certificates';
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient();

const providers: Provider[] = [
  Passkey,
  Credentials({
    credentials: {
      certificatePem: {},
      signedChallenge: {}, // signature in base64
    },
    // TODO how to throw error ?
    authorize: async (credentials) => {
      const certificatePemString = credentials?.certificatePem as string;
      const signedChallenge = credentials?.signedChallenge as string;
      
      if (!certificatePemString || !signedChallenge) {
        throw new CredentialsSignin("Both certificate and signed challenge are required");
      }

      // Check certificate expiration, chain, and custom attributes
      const certificate = forge.pki.certificateFromPem(certificatePemString);
      if (!await isValidCertificate(certificate)) {
        throw new Error("Invalid certificate");
      }
      const email = certificate.subject.getField("E").value;

      // Get the latest challenge entry for the user
      const challengeEntry = await prisma.challenge.findFirst({
        where: {
          user: {
            email: email,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!challengeEntry || challengeEntry.expiresAt < new Date()) {
        throw new CredentialsSignin("Challenge expired or not found");
      }

      const publicKeyPem = forge.pki.publicKeyToPem(certificate.publicKey);

      const publicKeyClean = publicKeyPem
        .replace(/-----BEGIN PUBLIC KEY-----/g, '')
        .replace(/-----END PUBLIC KEY-----/g, '')
        .replace(/[\r\n]+/gm, '');

      const isValid = await verifySignature(challengeEntry.challenge, signedChallenge, publicKeyClean);

      if (!isValid) {
        throw new CredentialsSignin("Invalid signature");
      }
      const user = await prisma.user.findUnique({ 
        where: { 
          publicKeyAuth: publicKeyClean,
          email: email
        } 
      });

      if (!user) {
        throw new CredentialsSignin("User not found");
      }
      return user;
    },  
  })
];

export const providerMap = providers.map((provider) => {
  if (typeof provider === 'function') {
    const providerData = provider();
    return { id: providerData.id, name: providerData.name };
  }
  return { id: provider.id, name: provider.name };
});

declare module 'next-auth' {
  interface Session {
    publicKey?: string;
    redirectToFirstSignin?: boolean;
    email?: string;
    emailVerified?: boolean;
    role?: string;
    isTwoFactorEnabled: boolean;
    isSession2FA: boolean;
    sessionToken: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  adapter: PrismaAdapter(prisma),
  experimental: {
    enableWebAuthn: true,
  },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    // Extend JWT to include session
    async jwt({ account, user, token }) {
      if (account?.provider === 'credentials' ) { // user?.role doesnt work.
        const sessionToken = uuidv4()
        const expires = new Date(Date.now() + 60 * 60 * 24 * 30 * 1000) // 30 days

        const session = await PrismaAdapter(prisma).createSession!({
          userId: user.id!,
          sessionToken,
          expires,
        })
        
        token.sessionId = session.sessionToken
      }
      return token
    },
    // Extend session to include WebAuthn credentialPublicKey
    async session({ session, user }) {
      if (user?.id) {
        try {
          const authenticator = await prisma.authenticator.findFirst({
            where: { userId: user.id },
            select: {
              credentialPublicKey: true,
            },
          });

          if (authenticator?.credentialPublicKey) {
            session.publicKey = authenticator.credentialPublicKey;
          }

          const userRecord = await prisma.user.findUnique({
            where: { id: user.id },
            select: { 
              masterPasswordHash: true,
              email: true, 
              emailVerified: true,
              role: true,
              twoFactorEnabled: true,
            },
          });

          const session2FA = await prisma.session.findUnique({
            where: { sessionToken: session.sessionToken },
            select: {
              session2FA: true,
            },
          });

          
          session.email = userRecord?.email;
          if (process.env.NODE_ENV === 'development') {
            session.emailVerified = true;
          } else {
            session.emailVerified = !!userRecord?.emailVerified;
          }
          session.role = userRecord?.role;
          session.isTwoFactorEnabled = userRecord?.twoFactorEnabled ?? false;
          session.isSession2FA = session2FA?.session2FA ?? false;
          session.sessionToken = session.sessionToken;

          if (userRecord?.masterPasswordHash === null || userRecord?.masterPasswordHash === '') {
            session.redirectToFirstSignin = true;
          } else {
            session.redirectToFirstSignin = false;
          }
        } catch (error) {
          console.error("[NextAuth] Error fetching authenticator:", error);
        }
      }
      return session;
    },

    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isPublicPage = nextUrl.pathname.startsWith('/public');

      if (isPublicPage || isLoggedIn) {
        return true;
      }

      return false; // Redirect unauthenticated users to login page
    },
  },
  jwt: {
    async encode({ token }) {
      return token?.sessionId as unknown as string
    },
  },
});
