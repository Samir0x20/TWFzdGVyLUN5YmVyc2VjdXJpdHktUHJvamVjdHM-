"use server";
import { AuthError } from "next-auth";
import type { AuthProvider } from "@toolpad/core";
import emailValidation from "../../utils/input_validation/emailValidation";
import { signIn as signInAction } from "../../../auth";
import { sendVerificationEmail } from "../../utils/emailVerification";
import { PrismaClient } from "@prisma/client";
import { log } from "../../../log";

const prisma = new PrismaClient();

export async function handleEmailVerification(email: string) {
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
}

async function signIn(
  provider: AuthProvider,
  formData?: FormData,
  callbackUrl?: string
) {
  try {
    const email = formData?.get("email");

    // Validate email
    try {
      emailValidation.parse(email);
    } catch (error) {
      log("error", "Invalid email from grammar-based input validation", {invalidEmail: email});
      console.error(`[DEBUG] Error validating email:`, error);
      return {
        error: "Invalid email from grammar-based input validation",
        type: "ValidationError",
      };
    }

    await signInAction(provider.id, {
      ...(formData && {
        email: formData.get("email"),
        password: formData.get("password"),
      }),
      redirectTo: callbackUrl,
    });

    return {};
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    if (error instanceof AuthError) {
      return {
        error:
          error.type === "CredentialsSignin"
            ? "Invalid credentials."
            : "An error with Auth.js occurred.",
        type: error.type,
      };
    }

    return {
      error: "Something went wrong.",
      type: "UnknownError",
    };
  }
}

export default signIn;
