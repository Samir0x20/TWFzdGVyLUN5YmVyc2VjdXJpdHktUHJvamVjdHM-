"use client";
import * as React from "react";
import type { AuthResponse, AuthProvider } from "@toolpad/core";
import { SignInPage } from "@toolpad/core/SignInPage";
import { signIn as webauthnSignIn } from "next-auth/webauthn";
import { providerMap } from "../../../auth";
import serverSignIn, { handleEmailVerification } from "./actions";
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import emailValidation from "../../utils/input_validation/emailValidation";

type SignInResponse = {
  error?: string;
};

export default function SignIn() {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const verifyToken = async (): Promise<boolean> => {
    if (!executeRecaptcha) {
      return false;
    }
    const token = await executeRecaptcha('login');

    try {
      const response = await fetch('/api/recaptcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Time': new Date().toISOString(), // Add the current date to the headers
          'X-Recaptcha-Token': token, // Add the token to the headers
        },
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error verifying reCAPTCHA:', error);
      return false;
    }
  };

  // Wrap your signIn in a function that *always*
  // returns something matching `AuthResponse`.
  const signIn = async (
    provider: AuthProvider,
    formData?: FormData,
    callbackUrl?: string
  ): Promise<AuthResponse> => {

    // Verify reCAPTCHA token
    const isCaptchaVerified = await verifyToken();
    if (!isCaptchaVerified) {
      return {
        error: "reCAPTCHA verification failed",
        type: "ReCaptchaError",
      };
    }
    
    // Validate email
    try {
      const email = formData?.get("email");
      emailValidation.parse(email); // This will throw an error if the email is invalid
    } catch (error) {
      console.error(`[DEBUG] Error validating email:`, error);
      return {
        error: "Invalid email from grammar-based input validation",
        type: "ValidationError",
      };
    }


    if (provider.id === "passkey") {
      try {
        const result = (await webauthnSignIn("passkey", {
          email: formData?.get("email") ?? undefined,
          callbackUrl: "/auth/2FA",
        })) as SignInResponse | undefined;

        // If NextAuth returns an error or you want to manually handle success/failure:
        if (result?.error) {
          // Return an object that matches `AuthResponse`
          return {
            error: result.error,
            type: "WebAuthnError",
          };
        }

        const email = formData?.get("email") as string;
        // Perform email verification after successful sign-in
        await handleEmailVerification(email);

        // If it’s a success, you could return an empty object
        // or whichever AuthResponse properties you want to indicate success.
        // Or you could allow NextAuth to redirect (which typically doesn't return).
        return {};
      } catch (error) {
        console.error(error);
        return {
          error: (error as Error)?.message || "Something went wrong",
          type: "WebAuthnError",
        };

      }
    }

    // For other providers, reuse your serverSignIn to return an AuthResponse
    // Make sure `serverSignIn` returns the correct AuthResponse shape, too.
    return serverSignIn(provider, formData, callbackUrl);
  };

  // Filter the providerMap to include only the Passkey provider
  const passkeyProviderMap = providerMap.filter(provider => provider.id === "passkey");

  return <SignInPage providers={passkeyProviderMap} signIn={signIn} />;
}