import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { log } from '../../../log';
import { extractRequestDetails } from "../../utils/extractRequestDetails";
import { sanitize } from "../../utils/utils";

const prisma = new PrismaClient();

//TODO: check if the token is from the correct email

export async function GET(req: NextRequest) {
  const { header } = await extractRequestDetails(req);
   

  try {
    // Parse the query parameters from the URL
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    // Check if the token is missing
    if (!token) {
      log('error', 'Missing token in request query', { req: header });
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }
    
    const sanitizedtoken = sanitize(token);

    // Find the email verification record by token
    const record = await prisma.emailVerification.findUnique({
      where: { token },
    });

    if (!record) {
      log('error', 'Invalid token', { req: header });
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Check if the token has expired
    if (new Date() > record.expiresAt) {
      log('error', 'Token has expired', { req: header });
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
    }

    // Update the user's email verification status
    await prisma.user.update({
      where: { email: record.email },
      data: { emailVerified: new Date() },
    });

    // Delete the email verification record
    await prisma.emailVerification.delete({
      where: { token },
    });

    log('info', 'Email verified', { email: record.email, req: header });
    return NextResponse.json({ message: 'Email verified successfully' });
  } catch (error) {
    log('error', 'Error during email verification', { error: (error as Error).message, req: header });
    console.error('Error during email verification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
