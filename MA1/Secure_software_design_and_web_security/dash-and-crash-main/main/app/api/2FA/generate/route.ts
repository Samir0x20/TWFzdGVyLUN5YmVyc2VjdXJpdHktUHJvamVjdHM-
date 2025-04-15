import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import speakeasy from 'speakeasy';
import { PrismaClient } from "@prisma/client";
import { auth } from '@/auth';
import { log } from '../../../../log';
import { extractRequestDetails } from "../../../utils/extractRequestDetails";
import crypto from 'crypto';

const prisma = new PrismaClient();
const serviceName = "Dash And Crash";
const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY; // Must be 256 bits (32 characters)
const IV_LENGTH = 12; // For AES-GCM, the recommended IV length is 12 bytes

if (!ENCRYPTION_KEY_HEX) {
  throw new Error("ENCRYPTION_KEY environment variable is not set");
}

const encryption_key = Buffer.from(ENCRYPTION_KEY_HEX, 'hex');

function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(encryption_key), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return iv.toString('hex') + ':' + encrypted + ':' + authTag;
}

export async function GET(req: NextRequest) {
  const { header } = await extractRequestDetails(req);
        

  try {
    const session = await auth();

    if (!session) {
      log("info", "Unauthorized access attempt", { req: header });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.isTwoFactorEnabled) {
      log("info", "2FA already enabled", { email: session.email , req: header });
      return NextResponse.json({ error: '2FA already enabled' }, { status: 400 });
    }

    const email = session.email;
    const secret = speakeasy.generateSecret({ name: `${serviceName} (${email})` });

    const encryptedSecret = encrypt(secret.base32);

    await prisma.user.update({
      where: { email: email },
      data: { twoFactorSecret: encryptedSecret },
    });

    const otpauthUrl = secret.otpauth_url;

    if (!otpauthUrl) {
      log("error", "Failed to generate otpauth URL", { email: email, req: header });
      return NextResponse.json({ error: 'Failed to generate otpauth URL' }, { status: 500 });
    }

    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    log("info", "2FA secret generated", { email: email, req: header });

    return NextResponse.json({ qrCodeUrl: qrCodeUrl }, { status: 200 });
  } catch (error) {
    log("error", "Error generating 2FA secret", { error: error, req: header });
    console.error('Error generating 2FA secret:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}