"use client";
import * as React from "react";
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { Container, TextField, Button, Typography, Box, Snackbar, Alert } from '@mui/material';
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import passwordValidator from "../../utils/input_validation/passwordValidation";
import { deriveMasterKey, hashMasterKey, arrayBufferToBase64 } from "@/app/utils/crypto";

type RegisterResponse = {
  error?: string;
};

export default function RegisterPassword() {
  const router = useRouter();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [popupMessage, setPopupMessage] = React.useState<string | null>(null);
  const [popupSeverity, setPopupSeverity] = React.useState<'success' | 'error'>('error');
  const { data: session, status } = useSession();
  const email = session?.email;

  const verifyToken = async (): Promise<boolean> => {
    if (!executeRecaptcha) {
      return false;
    }
    const token = await executeRecaptcha('setpassword');

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

  const register = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);

    // Verify reCAPTCHA token
    const isCaptchaVerified = await verifyToken();
    if (!isCaptchaVerified) {
      setPopupMessage("reCAPTCHA verification failed");
      setPopupSeverity('error');
      return;
    }

    const masterPassword = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validate password using grammar-based input validation
    try {
      passwordValidator.parse(masterPassword); // This will throw an error if the password is invalid
    } catch (error) {
      setPopupMessage("Invalid password: " + (error as Error).message);
      setPopupSeverity('error');
      return;
    }

    if (masterPassword !== confirmPassword) {
      setPopupMessage("Passwords do not match");
      setPopupSeverity('error');
      return;
    }

    // Create masterKey using PBKDF2 with masterPassword and email as salt
    if (!email) {
      setPopupMessage("Email is required");
      setPopupSeverity('error');
      return;
    }

    // Derive master key from email and master password
    const masterKeyBits = await deriveMasterKey(email, masterPassword);
    // Create masterPasswordHash using PBKDF2 with masterKey and masterPassword as salt
    const masterPasswordHash = await hashMasterKey(masterPassword, masterKeyBits);
    
    // Perform registration logic here
    try {
      const response = await fetch('/api/setpassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Time': new Date().toISOString(), // Add the current date to the headers
        },
        body: JSON.stringify({ masterPasswordHash: arrayBufferToBase64(masterPasswordHash.buffer as ArrayBuffer) }),
      });
      const data = await response.json();
      if (data.error) {
        setPopupMessage(data.error);
        setPopupSeverity('error');
      } else {
        setPopupMessage("Password set successfully");
        setPopupSeverity('success');
        router.push('/');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setPopupMessage("Failed to set password");
      setPopupSeverity('error');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Set Password
        </Typography>
        <Box component="form" onSubmit={register} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Set Password
          </Button>
          <Button
            fullWidth
            variant="outlined"
            sx={{ mt: 1 }}
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          >
            Sign Out
          </Button>
        </Box>
      </Box>
      <Snackbar
        open={!!popupMessage}
        autoHideDuration={6000}
        onClose={() => setPopupMessage(null)}
      >
        <Alert onClose={() => setPopupMessage(null)} severity={popupSeverity} sx={{ width: '100%' }}>
          {popupMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}