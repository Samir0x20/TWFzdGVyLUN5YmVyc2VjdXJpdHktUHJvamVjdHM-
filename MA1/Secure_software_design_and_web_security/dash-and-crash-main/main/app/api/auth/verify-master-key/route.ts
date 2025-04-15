import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { auth } from "@/auth";
import { log } from "../../../../log";
import { extractRequestDetails } from "../../../utils/extractRequestDetails";
import { sanitize } from "../../../utils/utils";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {

  const { header } = await extractRequestDetails(req);
   

  try {
    const session = await auth();
    const email = session?.email;
    if (!email) {
      log("error", "Unauthorized", { req: header });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { masterPasswordHash } = await req.json();
    const sanitizedmasterPasswordHash = sanitize(masterPasswordHash);
  
    if (!sanitizedmasterPasswordHash) {
      log("error", "Master password hash is required", { email, req: header });
      return NextResponse.json(
        { error: "Master password hash is required" },
        { status: 400 }
      );
    }
    
    if (await verifyMasterPasswordHash(email, sanitizedmasterPasswordHash)) {
      log("info", "Master password hash verified", { email, req: header });
      return NextResponse.json({ message: 'Master password hash verified' }, { status: 200 });
    } else {
      log("error", "Invalid master password hash", { email, req: header });
      return NextResponse.json({ error: 'Invalid master password hash' }, { status: 401 });
    }
  } catch (error) {
    log("error", "Error verifying master password hash", { error: error, req: header });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function verifyMasterPasswordHash(email: string, masterPasswordHash: string): Promise<boolean> {
  const savedMasterPasswordHash = await prisma.user.findUnique({
    where: { email: email },
    select: { 
      masterPasswordHash: true,
    },
  });

  if (!savedMasterPasswordHash || !savedMasterPasswordHash.masterPasswordHash) {
    console.log('No master key hash found for user');
    return false;
  }

  return await argon2.verify(savedMasterPasswordHash.masterPasswordHash, masterPasswordHash);
}