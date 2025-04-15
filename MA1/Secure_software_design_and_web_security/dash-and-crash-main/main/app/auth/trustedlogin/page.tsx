"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import forge from "node-forge";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Backdrop,
} from "@mui/material";
import { arrayBufferToBase64, base64ToArrayBuffer, createCryptoKey, deriveMasterKey } from "@/app/utils/crypto";
import passwordValidation from '../../utils/input_validation/passwordValidation.js';



const LoginPage = () => {
  const [certificate, setCertificate] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setCertificate(event.target.files[0]);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null); 
    try {
      if (!certificate || !password) {
        throw new Error("Both certificate file and password are required.");
      }
      try {
        passwordValidation.parse(password);
      } catch (error) {
        throw new Error('Invalid password');
      }

      const certContent = await certificate.text(); // Convert file to string

      // Step 1: Request a challenge from the server
      const challengeResponse = await fetch("/api/auth/get-challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'X-Request-Time': new Date().toISOString(), // Add the current date to the headers
        },
        body: JSON.stringify({
          certificatePem: certContent,
        }),
      });
      if (!challengeResponse.ok) {
        throw new Error("Failed to fetch the challenge.");
      }
    

      // get challenge + encrypted private key
      const { challenge, encryptedPrivateKey } = await challengeResponse.json();
      const encryptedData = base64ToArrayBuffer(encryptedPrivateKey);
      
      // get email from certificate to use as salt for the master key
      const email = forge.pki.certificateFromPem(certContent).subject.getField("E").value;
      
      // Step 2: Solve the challenge using the certificate and password
      const signature = await solveChallenge(challenge, encryptedData, email, password);
      
      const response = await signIn("credentials", {
        certificatePem: certContent,
        signedChallenge: signature,
        callbackUrl: "/police",
      });

      // If NextAuth returns an error or you want to manually handle success/failure:
      if (response?.error) {
        // Return an object that matches `AuthResponse`
        return {
          error: response.error,
          type: "WebAuthnError",
        };
      }

      // if (!response || !response.ok) {
      //   throw new Error("Failed to sign in.");
      // }

      // User is authenticated successfully
      alert("Successfully connected!");
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  async function solveChallenge(challenge: string, encryptedData: ArrayBuffer, email: string, password: string) {
    const masterKeyBits = await deriveMasterKey(email, password);
    const masterKey = await createCryptoKey(masterKeyBits);

    // Decrypt the private key using the master key
    const iv = encryptedData.slice(0, 12);
    const encryptedPrivateKey = encryptedData.slice(12);
    const decryptedPrivateKey = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      masterKey,
      encryptedPrivateKey
    );
    
    // Import the decrypted private key
    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      decryptedPrivateKey,
      {
        name: "RSA-PSS",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

    // Sign the challenge using the private key
    const signature = await window.crypto.subtle.sign(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      privateKey,
      new TextEncoder().encode(challenge)
    );

    return arrayBufferToBase64(signature);
  }

  return (
    <Container maxWidth="sm">
      <Backdrop
        open={loading}
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Login
        </Typography>
        <Typography variant="body1" gutterBottom>
          Please provide your certificate file and password to connect.
        </Typography>
        {error && (
          <Typography
            variant="body2"
            color="error"
            sx={{ mt: 2, mb: 2 }}
          >
            {error}
          </Typography>
        )}
        <Button
          variant="outlined"
          component="label"
          fullWidth
          sx={{ mb: 2 }}
        >
          Upload Certificate
          <input
            type="file"
            hidden
            accept=".pem,.crt,.key,.cer"
            onChange={handleFileChange}
          />
        </Button>
        {certificate && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Selected File: {certificate.name}
          </Typography>
        )}
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleConnect}
          disabled={loading}
        >
          Connect
        </Button>
      </Box>
    </Container>
  );
};

export default LoginPage;
