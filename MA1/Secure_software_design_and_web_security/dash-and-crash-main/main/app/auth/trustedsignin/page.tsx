"use client";
import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Backdrop,
} from "@mui/material";
import forge from "node-forge";
import {
  arrayBufferToBase64,
  createCryptoKey,
  deriveMasterKey,
  hashMasterKey,
} from "@/app/utils/crypto";
import { useRouter } from "next/navigation";
import emailValidation from "../../utils/input_validation/emailValidation.js";
import passwordValidation from "../../utils/input_validation/passwordValidation.js";
import validator from 'validator';

const RegisterPage = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [country, setCountry] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [confirmMasterPassword, setConfirmMasterPassword] = useState("");
  const [csr, setCsr] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function encryptPrivateKeyWithMasterKey(
    privateKey: CryptoKey,
    masterKey: CryptoKey
  ) {
    const exportedPrivateKey = await window.crypto.subtle.exportKey(
      "pkcs8",
      privateKey
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedPrivateKey = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      masterKey,
      exportedPrivateKey
    );

    // Combine IV and encrypted private key into a single buffer
    const combinedBuffer = new Uint8Array(
      iv.length + encryptedPrivateKey.byteLength
    );
    combinedBuffer.set(iv, 0);
    combinedBuffer.set(new Uint8Array(encryptedPrivateKey), iv.length);

    return combinedBuffer.buffer;
  }

  async function generateCSR(keyPair: CryptoKeyPair) {
    const csr = forge.pki.createCertificationRequest();
    // Convert webCrypto key to pem, then to forge key
    const exportedPublicKey = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
    );
    const pemPublicKey = `-----BEGIN PUBLIC KEY-----\n${arrayBufferToBase64(exportedPublicKey)}\n-----END PUBLIC KEY-----`;

    csr.publicKey = forge.pki.publicKeyFromPem(pemPublicKey);
    csr.setSubject([
      { name: "commonName", value: fullName },
      { name: "organizationName", value: organization },
      { name: "countryName", value: country },
      { name: "emailAddress", value: email },
    ]);

    // Convert webCrypto key to pem, then to forge key
    const exportedPrivateKey = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );
    const pemPrivateKey = `-----BEGIN PRIVATE KEY-----\n${arrayBufferToBase64(exportedPrivateKey)}\n-----END PRIVATE KEY-----`;
    const forgePrivateKey = forge.pki.privateKeyFromPem(pemPrivateKey);

    csr.sign(forgePrivateKey);

    return forge.pki.certificationRequestToPem(csr);
  }

  async function handleRegister() {
    setIsLoading(true);
    try {
      if (
        !fullName ||
        !email ||
        !organization ||
        !country ||
        !masterPassword ||
        !confirmMasterPassword
      ) {
        throw new Error("All fields are required");
      }
      if (masterPassword !== confirmMasterPassword) {
        throw new Error("Passwords do not match");
      }

      if (fullName.length > 20) {
        throw new Error("Full name is too long");
      }

      if (organization.length > 20) {
        throw new Error("Organization name is too long");
      }

      if (country.length > 20) {
        throw new Error("Country name is too long");
      }

      try {
        emailValidation.parse(email);
      } catch (error) {
        throw new Error("Invalid email");
      }

      try {
        passwordValidation.parse(masterPassword);
      } catch (error) {
        throw new Error("Invalid password");
      }
  
      // Derive Master key from Master password
      // The iteration should be 600000 for production and we could redirect the user to a page saying to patient few minutes.
      // However for dev purpose, it's set to 100000.
      const masterKeyBits = await deriveMasterKey(email, masterPassword);
      const masterKey = await createCryptoKey(masterKeyBits);

      // Generate auth key pair
      const { keyPairAuth, encryptedPrivateKeyAuth, exportedPublicKeyAuth } = await generateAuthKeyPair(masterKey);

      // Generate encryption/decryption key pair
      const { encryptedPrivateKeyEnc, exportedPublicKeyEnc } = await generateEncKeyPair(masterKey);

      const masterPasswordHash = await hashMasterKey(masterPassword, masterKeyBits);
  
      // Send email, public key, encrypted private key (combined with iv) to the server 
      const response = await fetch('/api/auth/trustedsignin', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "X-Request-Time": new Date().toISOString(), // Add the current date to the headers
        },
        body: JSON.stringify({
          email: email,
          publicKeyAuth: arrayBufferToBase64(exportedPublicKeyAuth),
          encryptedPrivateKeyAuth: arrayBufferToBase64(encryptedPrivateKeyAuth),
          publicKeyEnc: arrayBufferToBase64(exportedPublicKeyEnc),
          encryptedPrivateKeyEnc: arrayBufferToBase64(encryptedPrivateKeyEnc),
          masterPasswordHash: arrayBufferToBase64(masterPasswordHash.buffer as ArrayBuffer),
        }),
      });

      if (response.status !== 200) {
        throw new Error("Failed to register user");
      }

      // Generate CSR
      const csr = await generateCSR(keyPairAuth);
      setCsr(csr);
    } catch (error) {
      // TODO: 'error' is of type 'unknown'.ts(18046)
      // alert(error.message);
    }
    setIsLoading(false);
  }

  async function generateAuthKeyPair(masterKey: CryptoKey) {
    // Generate key pair
    const keyPairAuth = await window.crypto.subtle.generateKey(
      {
        name: "RSA-PSS",
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: { name: "SHA-256" }
      },
      true,
      ["sign", "verify"]
    );

    const encryptedPrivateKeyAuth = await encryptPrivateKeyWithMasterKey(keyPairAuth.privateKey, masterKey);
    
    // extract public key to pem
    const exportedPublicKeyAuth = await window.crypto.subtle.exportKey("spki", keyPairAuth.publicKey);

    return { keyPairAuth, encryptedPrivateKeyAuth, exportedPublicKeyAuth };
  }

  async function generateEncKeyPair(masterKey: CryptoKey) {
    // Generate key pair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: { name: "SHA-256" }
      },
      true,
      ["encrypt", "decrypt"],
    );

    const encryptedPrivateKeyEnc = await encryptPrivateKeyWithMasterKey(keyPair.privateKey, masterKey);
    
    // extract public key to pem
    const exportedPublicKeyEnc = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);

    return { encryptedPrivateKeyEnc, exportedPublicKeyEnc };
  }

  const downloadCSR = () => {
    if (!csr) return;

    const blob = new Blob([csr], { type: "application/x-pem-file" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "csr.pem";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Register
        </Typography>
        <TextField
          label="Full Name"
          variant="outlined"
          fullWidth
          margin="normal"
          value={fullName}
          onChange={(e) => {
            const sanitizedFullName = validator.trim(validator.escape(e.target.value)); // Sanitize
            setFullName(sanitizedFullName);
          }}
          onBlur={() => {
            if (!/^[a-zA-Z\s]+$/.test(fullName)) {
              setFullName(""); // Clear invalid input
            }
          }}
          error={fullName === ""}
          helperText={fullName === "" ? "Only letters and spaces are allowed" : ""}          
          disabled={isLoading}
        />
        <TextField
          label="Email"
          type="email"
          variant="outlined"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
        <TextField
          label="Organization"
          variant="outlined"
          fullWidth
          margin="normal"
          value={organization}
          onChange={(e) => {
            const sanitizedOrganization = validator.trim(validator.escape(e.target.value)); // Sanitize
            setOrganization(sanitizedOrganization);
          }}
          onBlur={() => {
            if (!/^[a-zA-Z0-9\s\-&]+$/.test(organization)) {
              setOrganization(""); // Clear invalid input
            }
          }}
          error={organization === ""}
          helperText={organization === "" ? "Only alphanumeric, spaces, hyphens, and '&' are allowed" : ""}
          disabled={isLoading}
        />
        <TextField
          label="Country"
          variant="outlined"
          fullWidth
          margin="normal"
          value={country}
          onChange={(e) => {
            const sanitizedCountry = validator.trim(validator.escape(e.target.value)); // Sanitize
            setCountry(sanitizedCountry);
          }}
          onBlur={() => {
            if (!/^[a-zA-Z\s]+$/.test(country)) {
              setCountry(""); // Clear invalid input
            }
          }}
          error={country === ""}
          helperText={country === "" ? "Only letters and spaces are allowed" : ""}
          disabled={isLoading}
        />
        <TextField
          label="Master Password"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={masterPassword}
          onChange={(e) => setMasterPassword(e.target.value)}
          disabled={isLoading}
        />
        <TextField
          label="Confirm Master Password"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={confirmMasterPassword}
          onChange={(e) => setConfirmMasterPassword(e.target.value)}
          disabled={isLoading}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleRegister}
          disabled={isLoading}
        >
          Register
        </Button>
        {csr && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Please get this CSR signed by your CA to be able to connect to the
              site.
            </Typography>
            <Button
              onClick={downloadCSR}
              variant="contained"
              color="primary"
              disabled={isLoading}
            >
              Download CSR
            </Button>
          </Box>
        )}
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            onClick={() => router.push("/auth/trustedlogin")}
            disabled={isLoading}
          >
            Already registered?
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterPage;
