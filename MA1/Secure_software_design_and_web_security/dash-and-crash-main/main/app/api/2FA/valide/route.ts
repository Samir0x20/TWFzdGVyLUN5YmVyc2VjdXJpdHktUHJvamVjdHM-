import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import { PrismaClient } from "@prisma/client";
import { auth } from '@/auth';
import { log } from '../../../../log';
import { extractRequestDetails } from "../../../utils/extractRequestDetails";
import crypto from 'crypto';
import { sanitize } from "../../../utils/utils";

const prisma = new PrismaClient();
const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY; // Must be 256 bits (32 characters)
const IV_LENGTH = 12; // For AES-GCM, the recommended IV length is 12 bytes

if (!ENCRYPTION_KEY_HEX) {
  throw new Error("ENCRYPTION_KEY environment variable is not set");
}

const encryption_key = Buffer.from(ENCRYPTION_KEY_HEX, 'hex');

function decrypt(text: string) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.shift()!, 'hex');
  const authTag = Buffer.from(textParts.shift()!, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(encryption_key), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText,undefined, 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function POST(req: NextRequest) {
  const { header } = await extractRequestDetails(req);                                                       
   

  try {
    const { token } = await req.json();
    const sanitizedtoken = sanitize(token);

    const session = await auth();
    if (!session) {
      log("info", "Unauthorized access attempt", { req: header });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const email = session.email;
    const sessionToken = session.sessionToken;

    if (!sanitizedtoken || typeof sanitizedtoken !== 'string' || !/^\d{6}$/.test(sanitizedtoken)) {
      log("error", "Invalid 2FA token format", { email: email, req: header });
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user || !user.twoFactorSecret) {
      log("error", "2FA not enabled", { email: email, req: header });
      return NextResponse.json({ error: '2FA not enabled' }, { status: 404 });
    }

    const decryptedSecret = decrypt(user.twoFactorSecret);

    const isValid = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: token,
    });

    if (!isValid) {
      log("error", "Invalid 2FA token", { email: email, req: header });
      return NextResponse.json({ error: 'Invalid 2FA token' }, { status: 403 });
    }

    if (isValid) {
      await prisma.user.update({
        where: { email: email },
        data: { twoFactorEnabled: true },
      });

      await prisma.session.update({
        where: { sessionToken: sessionToken },
        data: { session2FA: true },
      });
    }

    log("info", "2FA token validated", { email: email, req: header });
    return NextResponse.json({ success: true });
  } catch (error) {
    log("error", "Error validating 2FA token", { error: error, req: header });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}