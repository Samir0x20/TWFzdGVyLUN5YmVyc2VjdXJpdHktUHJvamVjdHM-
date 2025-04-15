import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { log } from "../../../../log";
import * as crypto from "crypto";
import { extractRequestDetails } from "../../../utils/extractRequestDetails";
import argon2 from "argon2";
import { sendVerificationEmail } from "../../../utils/emailVerification";


const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { header } = await extractRequestDetails(req);
   

  try {
    const { email, publicKeyAuth, encryptedPrivateKeyAuth, publicKeyEnc, encryptedPrivateKeyEnc, masterPasswordHash } = await req.json();

    if (!email || !publicKeyAuth || !encryptedPrivateKeyAuth || !masterPasswordHash 
      || !publicKeyEnc || !encryptedPrivateKeyEnc) {
      log("error", "All fields are required", { req: header });
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      log("error", "User already exists", { req: header });
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    // Generate a random salt
    const salt = crypto.randomBytes(16);

    // Hash the masterPasswordHash server-side with Argon2 and the generated salt
    const hashedKey = await argon2.hash(masterPasswordHash, {
      salt,
      timeCost: 5, // Number of iterations
      memoryCost: 7168, // Memory usage in KB
      hashLength: 128, // Output length in bytes
    });// based on https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#argon2id
  

    // Create user in the database
    await prisma.user.create({
      data: {
        email: email,
        role: "trusted",
        publicKeyAuth: publicKeyAuth,
        encryptedPrivateKeyAuth: encryptedPrivateKeyAuth,
        publicKeyEnc: publicKeyEnc,
        encryptedPrivateKeyEnc: encryptedPrivateKeyEnc,
        masterPasswordHash: hashedKey,
      },
    });

    if (process.env.NODE_ENV === "development") {
      await prisma.user.update({
        where: { email },
        data: { emailVerified: new Date(Date.now()) },
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user && !user.emailVerified) {
      // Send verification email
      await sendVerificationEmail(email);
    }

    log("info", "User registered successfully", { email, req: header });
    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 200 }
    );
  } catch (error) {
    log("error", "Error registering user", { error: error, req: header });
    console.error(error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
