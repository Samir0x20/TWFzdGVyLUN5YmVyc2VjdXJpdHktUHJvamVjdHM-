"use client";

import React, { useState } from "react";
import forge from "node-forge";
import { useCertificates } from "../../contexts/CertificateContext";
import {
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  Box,
  TextField,
  SelectChangeEvent,
} from "@mui/material";

const POLICE_CERT_PEM = `-----BEGIN CERTIFICATE-----
MIIFXzCCA0egAwIBAgIHAXNFZFk5VDANBgkqhkiG9w0BAQsFADBwMQ8wDQYDVQQD
EwZQT0xJQ0UxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMRYwFAYD
VQQHEw1TYW4gRnJhbmNpc2NvMRUwEwYDVQQKEwxFeGFtcGxlIEluYy4xDDAKBgNV
BAsTA0RldjAeFw0yNDEyMTgyMzI5NTNaFw0yNTEyMTgyMzI5NTNaMHAxDzANBgNV
BAMTBlBPTElDRTELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAU
BgNVBAcTDVNhbiBGcmFuY2lzY28xFTATBgNVBAoTDEV4YW1wbGUgSW5jLjEMMAoG
A1UECxMDRGV2MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAjd33LiTa
fcrqdxhHXMDw/yfNG71CXf8iZd8Mjf2+DocYCwGjMMAZThcOkomvu3yH25asKwiK
YSL4QIR3KmlfRwo1KHC/qmpHQESPLW1Ec9br4Z8N0aP9wfq35QuByyYAkM/5U04b
cYMCtZ2KmwGEpaHX0MABTWcvr6messSx0JAWNDOrJPFvXXxUCUAKR/O2Kh3AyKUb
MdMpyKehxEd7lP1yQ0F1X8Ywj00Tx5sgDc2Q0JjVWfkVTUfWp6C0D+6ha4GJVOUS
rYF4HLQZRli9UrSpEx/HKKZNQsSCytQIGYgAL0RHKg5NBAC14aSxjUBZ6bdP7Utg
+4bhqPtk+jFGD0b3is7jmerCvX4LgSaUMc7TSyBMIkDuw6HJv38T6UjoUMLKcn/l
q0pV6W9WPzxxlrBRFXu3q2IE92/nMrw0vlcCH3EZ8DvjZV8U3fqxXUHbuqQHuhjA
cIOZkMTtug9lvlrW5Fs+iGuq2D4GAihGUFCH2aRoeGUncAkFmJD+NWFCJ0X3zKTP
DEqubtpKJZ10FGRtUIgXixh+SesIEP2/7AmjJI10/p0z2HMaqyfseuzdxJ3WMuDF
nC0IKA1qWkJsUP6PuPa4JU9KPlWCLUdPU2fY8kSRyONlJ7ZbxeMZruNum1d1pmWI
f6FC3iSqo7OejH6D1CKiHo+63sot2OQppVMCAwEAATANBgkqhkiG9w0BAQsFAAOC
AgEAPCwuweLE4UGMI+I9pR0H+aeYUEhoNZyaTTduiDupNW5YVg3s5CTcxbTitW+D
QVGhn3/IcxNIlsZcpm6fB/uO+TLsjiEebfRFoAUzTd0GrhUq3ltaUo7ucDMEaV9s
sFygPPbsLNRF3hTrVX7jREjAMTzvPb6xB6rhSRtfGIDPN1zj5wJFj8iXMVPOi0pX
EDyXyPI8IdCYJJtBRO7OXoNwgE7al5ujpCLrqAV69nZUc8MRZTuNwEt+b5LFghR1
EMDGwyz5Tbe9gb0Blj1NXx34QDrLCznHg4jcfx7ETRaaoUn7z5YglgFlhmE/Ifgf
egGOOcX825YW7Yj6ktbhPONm1O761dFwjwy8qHAbnEcJND6w/KRdxli0MoEsDIxZ
0WHuRdblbINS4J+jesP1BTXALNZfKViDCuNaFIMBjcBSXCn2roDNgI9xHbEpGeAo
0upplTSbS+2KseGtkJF8XqaOUDyCUTHQrXnm2CqOH7e64v0qtYs/XaUs86rDHQCN
OLC5aayI8kmeW8NYXIE1Vuv/YIRz6gURsPVInYh2gcJ9dZOmwl4vT50dAEV2FfIx
626z84Bp6NNz5d8sfaPsDY/pRxYC5yK3UszgQOK9BuDCxXRuKT5Tw45M22vMbrg4
3wW/XWVk8xPaVpAQmCSlhHBliYnb7ffjoR/aJkZmZpH2U2c=
-----END CERTIFICATE-----`;

export default function HybridCipherTest() {
  const { certificates } = useCertificates();
  const [selectedCertId, setSelectedCertId] = useState<string>("");
  const [selectedDecCertId, setSelectedDecCertId] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const [aesKey, setAesKey] = useState<string>(""); // Clear AES Key
  const [cipheredAesKey, setCipheredAesKey] = useState<string>(""); // Ciphered AES Key
  const [decipheredAesKey, setDecipheredAesKey] = useState<string>(""); // Deciphered AES Key

  const [encryptedText, setEncryptedText] = useState<ArrayBuffer | null>(null);
  const [encryptedKey, setEncryptedKey] = useState<ArrayBuffer | null>(null);

  function handleCertChange(event: SelectChangeEvent<string>) {
    setSelectedCertId(event.target.value as string);
  }

  function handleDecCertChange(event: SelectChangeEvent<string>) {
    setSelectedDecCertId(event.target.value as string);
  }

  function generateRandomInput() {
    const randomText = Array.from({ length: 255 }, () =>
      String.fromCharCode(Math.floor(Math.random() * 94) + 32)
    ).join("");
    setInputText(randomText);
  }

  async function cipherText() {
    if (!inputText) {
      //alert("Input text cannot be empty.");
      return;
    }
    const cert = certificates.find((c) => c.id === selectedCertId);
    if (!cert) {
      //alert("Please select a certificate.");
      return;
    }

    try {
      console.log("hihiii");
      const policePublicKey = await importPublicKey(POLICE_CERT_PEM);
      console.log("hihi");
      console.log(cert);
      const userPublicKey = await importPublicKey(cert.pem);
      console.log("hihi2");

      const { encryptedData, exportedAesKey } = await encryptWithAES(inputText);
      setEncryptedText(encryptedData);

      const rsaEncryptedKey = await encryptAESKeyWithRSA(
        exportedAesKey,
        userPublicKey
      );
      const policeRsaEncryptedKey = await encryptAESKeyWithRSA(
        exportedAesKey,
        policePublicKey
      );

      setEncryptedKey(rsaEncryptedKey);
      setCipheredAesKey(Buffer.from(rsaEncryptedKey).toString("hex"));

      //alert("Encryption successful.");
    } catch (error) {
      console.error("Error during encryption:", error);
    }
  }

  async function decipherKey() {
    const cert = certificates.find((c) => c.id === selectedDecCertId);
    if (!cert) {
      //alert("Please select a certificate for decryption.");
      return;
    }

    try {
      const privateKey = await importPrivateKey(cert.privateKeyPem);
      if (!encryptedKey) {
        //alert("No encrypted key available.");
        return;
      }
      const decryptedKey = await decryptAESKeyWithRSA(encryptedKey, privateKey);
      const decryptedKeyHex = Buffer.from(decryptedKey).toString("hex");
      setDecipheredAesKey(decryptedKeyHex);

      if (decryptedKeyHex === aesKey) {
        //alert("Deciphered AES Key matches the original key!");
      } else {
        alert("Deciphered AES Key does NOT match the original key!");
      }
    } catch (error) {
      console.error("Error during decryption:", error);
    }
  }

  async function encryptWithAES(plainText: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt"]
    );
  
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
  
    const exportedKey = await crypto.subtle.exportKey("raw", key);
  
    // Convert the exported AES key to a hex string for display
    const aesKeyHex = Array.from(new Uint8Array(exportedKey))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  
    setAesKey(aesKeyHex); // Set the AES key in the readable format
    return { encryptedData, exportedAesKey: exportedKey };
  }
  

  async function encryptAESKeyWithRSA(
    aesKey: ArrayBuffer,
    publicKey: CryptoKey
  ) {
    return crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, aesKey);
  }

  async function decryptAESKeyWithRSA(
    encryptedKey: ArrayBuffer,
    privateKey: CryptoKey
  ) {
    return crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedKey
    );
  }

  /**
   * Imports a public key from a PEM-formatted certificate and converts it into a Web Crypto API CryptoKey.
   *
   * @param pem - PEM-formatted certificate string
   * @returns {Promise<CryptoKey>} The imported CryptoKey
   */
  async function importPublicKey(pem: string): Promise<CryptoKey> {
    try {
      console.log("Importing public key from PEM...");

      // Parse the PEM certificate
      const cert = forge.pki.certificateFromPem(pem);

      // Extract the public key
      const publicKeyAsn1 = forge.pki.publicKeyToAsn1(cert.publicKey);

      // Wrap the public key ASN.1 in SPKI format
      const spkiAsn1 = forge.pki.publicKeyToAsn1(cert.publicKey);

      // Convert SPKI ASN.1 structure to DER
      const spkiDer = forge.asn1.toDer(spkiAsn1).getBytes();

      // Convert DER to a Uint8Array
      const spkiUint8Array = Uint8Array.from(spkiDer, (char) =>
        char.charCodeAt(0)
      );

      console.log("SPKI DER format extracted:", spkiUint8Array);

      // Import the public key into Web Crypto API
      return await crypto.subtle.importKey(
        "spki",
        spkiUint8Array.buffer,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        true,
        ["encrypt"]
      );
    } catch (error) {
      console.error("Error importing public key:", error);
      throw error;
    }
  }

  async function importPrivateKey(pem: string): Promise<CryptoKey> {
    try {
      console.log("Importing private key from PEM...");

      // Parse the PEM private key
      const privateKey = forge.pki.privateKeyFromPem(pem);

      // Convert the private key to ASN.1 format
      const privateKeyAsn1 = forge.pki.privateKeyToAsn1(privateKey);

      // Wrap the private key ASN.1 in PKCS#8 format
      const pkcs8Asn1 = forge.pki.wrapRsaPrivateKey(privateKeyAsn1);

      // Convert PKCS#8 ASN.1 structure to DER
      const pkcs8Der = forge.asn1.toDer(pkcs8Asn1).getBytes();

      // Convert DER to a Uint8Array
      const pkcs8Uint8Array = Uint8Array.from(pkcs8Der, (char) =>
        char.charCodeAt(0)
      );

      console.log("PKCS#8 DER format extracted:", pkcs8Uint8Array);

      // Import the private key into Web Crypto API
      return await crypto.subtle.importKey(
        "pkcs8",
        pkcs8Uint8Array.buffer,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        true,
        ["decrypt"]
      );
    } catch (error) {
      console.error("Error importing private key:", error);
      throw error;
    }
  }

  return (
    <Box padding={3}>
      <Typography variant="h4" gutterBottom>
        Hybrid Cipher Test
      </Typography>
      <Box marginBottom={2}>
        <TextField
          label="Input Text"
          multiline
          rows={4}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          fullWidth
        />
      </Box>
      <Box marginBottom={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={generateRandomInput}
        >
          Generate Random Input
        </Button>
      </Box>
      <FormControl fullWidth margin="normal">
        <InputLabel id="cert-select-label">Choose Certificate</InputLabel>
        <Select
        label="Choose Certificate"
          labelId="cert-select-label"
          value={selectedCertId}
          onChange={handleCertChange}
        >
          <MenuItem value="">--Select a Cert--</MenuItem>
          {certificates.map((cert) => (
            <MenuItem key={cert.id} value={cert.id}>
              {cert.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box marginBottom={2}>
        <Button variant="contained" color="secondary" onClick={cipherText}>
          Cipher
        </Button>
      </Box>
      {aesKey && (
        <Typography>
          AES Key (Clear): <code>{aesKey}</code>
        </Typography>
      )}

      {cipheredAesKey && (
        <Typography>
          AES Key (Ciphered): <code>{cipheredAesKey}</code>
        </Typography>
      )}

      {decipheredAesKey && (
        <Typography>
          AES Key (Deciphered): <code>{decipheredAesKey}</code>
        </Typography>
      )}

      <FormControl fullWidth margin="normal">
        <InputLabel id="dec-cert-select-label">
          Choose Decryption Cert
        </InputLabel>
        <Select
        label="Choose Decryption Cert"
          labelId="dec-cert-select-label"
          value={selectedDecCertId}
          onChange={handleDecCertChange}
        >
          <MenuItem value="">--Select a Cert--</MenuItem>
          {certificates.map((cert) => (
            <MenuItem key={cert.id} value={cert.id}>
              {cert.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box marginTop={2}>
        <Button variant="contained" color="secondary" onClick={decipherKey}>
          Decipher
        </Button>
      </Box>
    </Box>
  );
}
