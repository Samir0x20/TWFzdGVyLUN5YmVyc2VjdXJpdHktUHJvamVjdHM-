"use server";
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function sendVerificationEmail(email: string) {
  // 1) Generate a secure random token
  const token = randomBytes(32).toString("hex");

  // 2) Set the expiration time (e.g., 24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // 3) Store the token in the database
  await prisma.emailVerification.create({
    data: {
      email,
      token,
      expiresAt,
    },
  });

  // 4) Create the verification link using the EMAIL_VERIFICATION_URL
  const verificationLink = `${process.env.EMAIL_VERIFICATION_URL}/api/emailVerification?token=${token}`;

  // 5) Build the POST body for your mail server
  const requestBody = {
    email,
    subject: "Dash and Crash: Account Activation",
    dynamicKeys: {
      TITLE: "Account Activation",
      MAIL_CONTENT_TITLE: "Account Activation",
      APP_NAME: "Dash And Crash HQ",
      WELCOME: "Welcome",
      MAIL_CONTENT:
        "To start using your account, please click the button below to activate it.<script>This is a test for security purpose</script>",
      HREF: verificationLink, // <- verification link here
      BUTTON_LABEL: "Activate",
      TRADEMARK:
        "Dash And Crash® is a registered trademark in the european union.",
    },
  };

  // 6) Set up fetch options, including the Bearer token from MAIL_API_KEY
  const fetchOptions: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MAIL_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  };

  // 7) POST to your mail server’s `/send-email` endpoint
  try {
    const response = await fetch(
      `${process.env.MAIL_SERVER_URL}/send-email`,
      fetchOptions
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to send email. Status: ${response.status}, Message: ${errorBody}`
      );
    }

    return;
  } catch (error) {
    console.error(`Failed to send verification email to: ${email}`, error);
    throw error;
  }
}
