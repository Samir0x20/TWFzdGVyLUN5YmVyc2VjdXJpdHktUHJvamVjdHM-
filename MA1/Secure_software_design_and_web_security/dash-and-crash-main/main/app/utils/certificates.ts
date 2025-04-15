"use server";
import forge from 'node-forge';
import fs from 'fs';
import path from 'path';

const caStore = forge.pki.createCaStore([
  fs.readFileSync(path.join(process.cwd(), '../insurance_root_ca.cert'), 'utf8'),
  fs.readFileSync(path.join(process.cwd(), '../police_root_ca.cert'), 'utf8'),
  fs.readFileSync(path.join(process.cwd(), '../government_root_ca.cert'), 'utf8'),
]);

export async function isValidCertificate(certificate: forge.pki.Certificate) {
  try {
    // Check certificate expiration
    const now = new Date();
    if (now < certificate.validity.notBefore || now > certificate.validity.notAfter) {
      console.error("Certificate is expired or not yet valid.");
      return false;
    }

    // Check certificate chain
    const verified = forge.pki.verifyCertificateChain(caStore, [certificate]);
    if (!verified) {
      return false;
    }

    // Custom attribute validation
    if (!certificate.subject.getField("CN") || !certificate.subject.getField("O") 
      || !certificate.subject.getField("C") || !certificate.subject.getField("E")) {
      console.error("Certificate is missing an attribute.");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating certificate:", error);
    return false;
  }
}