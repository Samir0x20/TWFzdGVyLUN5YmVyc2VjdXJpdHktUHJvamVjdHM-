import { NextRequest, NextResponse } from "next/server";
import forge from "node-forge";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { isValidCertificate } from "../../../utils/certificates";
import { log } from "../../../../log";
import { extractRequestDetails } from "../../../utils/extractRequestDetails";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { certificatePem } = await req.json();
  const { header } = await extractRequestDetails(req);
   

  if (!certificatePem) {
    log("error", "Certificate is required", { req: header });
    return NextResponse.json(
      { message: "Certificate is required" },
      { status: 400 }
    );
  }

  try {
    const cert = forge.pki.certificateFromPem(certificatePem);

    // 1. Check certificate expiration, chain, and custom attributes
    if (!isValidCertificate(cert)) {
      log("error", "Invalid certificate", { req: header });
      return NextResponse.json(
        { message: "Invalid certificate" },
        { status: 401 }
      );
    }
    const email = cert.subject.getField("E").value;

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
      select: {
        encryptedPrivateKeyAuth: true,
        id: true,
      },
    });
    if (!user || !user.encryptedPrivateKeyAuth) {
      log("error", "User not found", { req: header });  
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Generate a challenge and store it in the database
    const challenge = crypto.randomBytes(32).toString("hex");
    await prisma.challenge.create({
      data: {
        userId: user.id,
        challenge: challenge,
        expiresAt: new Date(Date.now() + 1 * 60 * 1000), // Expires in 1 minutes
      },
    });

    log("info", "Challenge generated", { email, req: header});
    return NextResponse.json({ encryptedPrivateKey: user.encryptedPrivateKeyAuth, challenge: challenge });
  } catch (error) {
    log("error", "Error handling request", { error: error, req: header });
    console.error("Error handling request:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
