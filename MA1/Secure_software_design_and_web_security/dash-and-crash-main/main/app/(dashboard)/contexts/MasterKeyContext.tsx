// contexts/MasterKeyContext.tsx
"use client";
import React, { createContext, useContext, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Box,
  Button,
  Container,
  CircularProgress,
  TextField,
  Typography,
  Backdrop,
} from "@mui/material";
import { arrayBufferToBase64, createCryptoKey, deriveMasterKey, hashMasterKey } from "@/app/utils/crypto";
import passwordValidation from '../../utils/input_validation/passwordValidation.js';


type MasterKeyContextType = {
  masterKey: CryptoKey | null;
};

const MasterKeyContext = createContext<MasterKeyContextType | undefined>(undefined);

export const MasterKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();

  async function unlockApp(password: string) {
    try {
      passwordValidation.parse(password);
    } catch (error) {
      throw new Error('Invalid password');
    }
    setIsLoading(true);
    try {
      const salt = session?.email;
      if (!salt) {
        throw new Error("No salt found in session");
      }

      const masterKeyBits = await deriveMasterKey(salt, password);
      const masterKey = await createCryptoKey(masterKeyBits);
      
      // Verify master key hash with server
      const masterPasswordHash = await hashMasterKey(password, masterKeyBits);
      const response = await fetch("/api/auth/verify-master-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'X-Request-Time': new Date().toISOString(), // Add the current date to the headers
        },
        body: JSON.stringify({ masterPasswordHash: arrayBufferToBase64(masterPasswordHash.buffer as ArrayBuffer) }),
      });

      if (!response.ok) {
        throw new Error("Invalid master key hash");
      }
      setMasterKey(masterKey);
    } catch (error) {
      console.error(error);
      alert("Error deriving master key. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!masterKey) {
    return (
      <Container maxWidth="sm">
        <Backdrop
          open={isLoading}
          sx={{
            color: "#fff",
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100vh"
          bgcolor="background.default"
          color="text.primary"
        >
          <Container maxWidth="sm">
            <Typography variant="h5" gutterBottom>
              Enter your password to unlock the application:
            </Typography>
            <TextField
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              placeholder="Password"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  unlockApp((e.target as HTMLInputElement).value);
                }
              }}
            />
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => {
                const passwordField = document.querySelector<HTMLInputElement>("input[type=password]");
                if (passwordField) {
                  unlockApp(passwordField.value);
                }
              }}
            >
              Unlock
            </Button>
          </Container>
        </Box>
      </Container>
    );
  }

  return (
    <MasterKeyContext.Provider value={{ masterKey }}>
      {children}
    </MasterKeyContext.Provider>
  );
};

export const useMasterKey = (): MasterKeyContextType => {
  const context = useContext(MasterKeyContext);
  if (!context) {
    throw new Error("useMasterKey must be used within a MasterKeyProvider");
  }
  return context;
};
