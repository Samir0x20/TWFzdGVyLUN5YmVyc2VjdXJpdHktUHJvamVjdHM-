import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/app/utils/withAuth';
import { log } from '@/log';
import { extractRequestDetails } from "../../utils/extractRequestDetails";
import { auth } from '@/auth';
import { sanitize } from '../../utils/utils';

const prisma = new PrismaClient();

async function handleGet(req: NextRequest) {
  const session = await auth();
  const { header } = await extractRequestDetails(req);
   


  if (!session || !session.user) {
    log('error', 'Unauthorized', { req: header });
    return NextResponse.json({ error: "Unauthorize" }, { status: 401 });
  }
  const userId = session.user.id;

  const email = req.nextUrl.searchParams.get('email');
  if (!email) {
    log('error', 'Email is required', { fromUserId: userId, req: header });
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  const sanitizedemail = sanitize(email);

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: sanitizedemail,
        role: "trusted",
      },
      select: {
        publicKeyEnc: true,
      },
    });
    if (!user || !user.publicKeyEnc) {
      log('error', 'User not found or missing public key', { fromUserId: userId, toUser: sanitizedemail, req: header });
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
    
    log('info', 'Getting public key', { fromUserId: userId, keyOfUserId: user.publicKeyEnc, req: header });
    return NextResponse.json({ publicKey: user.publicKeyEnc });
  } catch (error) {
    log('error', 'Error getting public key', { fromUserId: userId, error: (error as Error).message, req: header });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = withAuth(handleGet);