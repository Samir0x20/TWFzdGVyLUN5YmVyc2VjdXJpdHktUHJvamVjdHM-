import forge from "node-forge";
const { subtle } = globalThis.crypto;

/**
 * Imports a private key from a PEM-formatted string and returns a CryptoKey.
 * 
 * @param pem - PEM-formatted private key string
 * @returns {Promise<CryptoKey>} The imported private CryptoKey
 */
export async function importPrivateKey(pem: string): Promise<CryptoKey> {
  try {

    // Parse private key from PEM
    const privateKey = forge.pki.privateKeyFromPem(pem);

    // Convert private key to PKCS#8 ASN.1
    const privateKeyAsn1 = forge.pki.privateKeyToAsn1(privateKey);

    // Convert ASN.1 to DER
    const der = forge.asn1.toDer(privateKeyAsn1).getBytes();

    // Convert DER to Uint8Array
    const uint8Array = Uint8Array.from(der, (char) => char.charCodeAt(0));

    // Import private key into Web Crypto API
    return await crypto.subtle.importKey(
      "pkcs8",
      uint8Array.buffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["decrypt"]
    );
  } catch (error) {
    console.error("Error importing private key:", error);
    throw error;
  }
}

/**
 * Imports a public key from a PEM-formatted string and returns a CryptoKey.
 * 
 * @param pem - PEM-formatted public key string
 * @returns {Promise<CryptoKey>} The imported public CryptoKey
 */
export async function importPublicKey(pem: string): Promise<CryptoKey> {
  try {

    // Parse public key from PEM
    const cert = forge.pki.certificateFromPem(pem);
    const publicKeyAsn1 = forge.pki.publicKeyToAsn1(cert.publicKey);

    // Convert ASN.1 to DER
    const der = forge.asn1.toDer(publicKeyAsn1).getBytes();

    // Convert DER to Uint8Array
    const uint8Array = Uint8Array.from(der, (char) => char.charCodeAt(0));

    // Import public key into Web Crypto API
    return await crypto.subtle.importKey(
      "spki",
      uint8Array.buffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt"]
    );
  } catch (error) {
    console.error("Error importing public key:", error);
    throw error;
  }
}

/**
 * Verifies a cryptographic signature using RSA-PSS and SHA-256.
 *
 * @param {string} challenge - The original challenge string that was signed.
 * @param {string} signatureBase64 - The base64-encoded signature to verify.
 * @param {string} publicKeyPem - The PEM-encoded public key used for verification.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the signature is valid, otherwise `false`.
 */
export async function verifySignature(challenge: string, signatureBase64: string, publicKeyPem: string) {
  try {
    const signature = new DataView(base64ToArrayBuffer(signatureBase64));
    
    // Create a buffer of the challenge
    const challengeBuffer = Buffer.from(challenge);
      
    const publicKey = await subtle.importKey(
      'spki',
      base64ToArrayBuffer(publicKeyPem),
      {
        name: "RSA-PSS",
        hash: "SHA-256",
      },
      false,
      ["verify"]
    );
  
    const isValid = await subtle.verify(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      publicKey,
      signature,
      challengeBuffer
    );
  
    return isValid;
  } catch (error) {
    console.error("Error verifying signature: ", error);
    return false;
  }
}

/**
 * Derives a 256-bit master key from a given salt and password using PBKDF2.
 * This function is intended to be used in a client-side environment only.
 *
 * @param salt - The salt to use for key derivation.
 * @param password - The password to use for key derivation.
 * @returns A promise that resolves to a Uint8Array containing the derived master key.
 */
export async function deriveMasterKey(salt: string, password: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const saltBuffer = enc.encode(salt);
  const passwordBuffer = enc.encode(password);

  // Import the password for PBKDF2
  const baseKey = await window.crypto.subtle.importKey(
      "raw", 
      passwordBuffer, 
      { name: "PBKDF2" }, 
      false, 
      ["deriveKey", "deriveBits"]
  );

  // Derive the 256-bit Master Key using PBKDF2
  const masterKeyBits = await window.crypto.subtle.deriveBits(
    {
        name: "PBKDF2",
        salt: saltBuffer, 
        iterations: 600000,
        hash: "SHA-256"
    },
    baseKey,
    256
  );

  return new Uint8Array(masterKeyBits);
}

/**
 * Hashes the master key using the provided password and PBKDF2 with SHA-256.
 * This function is intended for client-side use only.
 *
 * @param password - The password to use as the salt for the PBKDF2 algorithm.
 * @param masterKey - The master key to be hashed.
 * @returns A promise that resolves to a Uint8Array containing the derived hash.
 */
export async function hashMasterKey(password: string, masterKey: Uint8Array): Promise<Uint8Array> {
  const encoder = new TextEncoder();

  // Convert the password to ArrayBuffer to use as the salt
  const passwordBuffer = encoder.encode(password);

  // Import the master key as the base key for PBKDF2
  const baseKey = await window.crypto.subtle.importKey(
      "raw",
      masterKey,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
  );

  // Derive the Master Password Hash using PBKDF2 with SHA-256
  const hashBits = await window.crypto.subtle.deriveBits(
      {
          name: "PBKDF2",
          salt: passwordBuffer,
          iterations: 600000,
          hash: "SHA-256"
      },
      baseKey,
      256
  );

  return new Uint8Array(hashBits);
}

/**
 * Creates a CryptoKey from a given master key using the AES-GCM algorithm.
 * This function is intended for client-side use only.
 *
 * @param {Uint8Array} masterKey - The master key to be used for creating the CryptoKey.
 * @returns {Promise<CryptoKey>} A promise that resolves to the created CryptoKey.
 */
export async function createCryptoKey(masterKey: Uint8Array): Promise<CryptoKey> {
  // Import the key using subtle crypto
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    masterKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );

  return cryptoKey;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)).buffer;
}