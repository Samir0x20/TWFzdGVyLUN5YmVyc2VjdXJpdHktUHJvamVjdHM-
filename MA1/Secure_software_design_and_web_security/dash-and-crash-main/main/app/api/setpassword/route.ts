import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import argon2 from "argon2";
import crypto from "crypto";
import { log } from "./../../../log.js";
import { extractRequestDetails } from "../../utils/extractRequestDetails";
import { sanitize } from "../../utils/utils";


const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  let session: any;
  let header: any;

  try {
    session = await auth();
    ({ header } = await extractRequestDetails(req));
     

    if (!session?.user) {
      log("error", "Unauthorized", { req: header });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownerId = session.user.id;
    if (!ownerId) {
      log("error", "Unauthorized, user ID not found", { req: header });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { masterPasswordHash } = await req.json();

    if (!masterPasswordHash && masterPasswordHash.length !== 44 ) {
      log("error", "Master password hash is required", { email: session.email, req: header });
      return NextResponse.json({ error: "Master password hash is required" }, { status: 400 });
    }

    const sanitizedmasterPasswordHash = sanitize(masterPasswordHash);

    if (session.user.masterPasswordHash) {
      log("error", "Master password hash already exists", { email: session.email, req: header });
      return NextResponse.json({ error: "Unauthorized action" }, { status: 400 });
    }

    // Generate a random salt
    const salt = crypto.randomBytes(16);

    // Hash the masterPasswordHash server-side with Argon2 and the generated salt
    const hashedKey = await argon2.hash(sanitizedmasterPasswordHash, {
      salt,
      timeCost: 5, // Number of iterations
      memoryCost: 7168, // Memory usage in KB
      hashLength: 128, // Output length in bytes
    });// based on https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#argon2id

    await prisma.user.update({
      where: { id: ownerId },
      data: { 
        masterPasswordHash: hashedKey
      },
    });
    log("info", "Master password hash updated successfully", { email: session.email, req: header });
    return NextResponse.json({ message: "Master password hash updated successfully" });
    
  } catch (error) {
    log("error", "Error updating master password hash", { error: error, req: header });
    console.error('Error updating master password hash:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}