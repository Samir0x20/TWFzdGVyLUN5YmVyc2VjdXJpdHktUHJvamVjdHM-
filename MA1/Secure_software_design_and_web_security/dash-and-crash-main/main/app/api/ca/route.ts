import forge from 'node-forge';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { sanitize } from '../../utils/utils';

interface CertificateAuthority {
  privateKeyPem: string;
  certPem: string;
}
const certificateAuthorities: { [key: string]: CertificateAuthority } = {
  "Insurance Company A": {
    privateKeyPem: fs.readFileSync(path.join(process.cwd(), '../insurance.key'), 'utf8'),
    certPem: fs.readFileSync(path.join(process.cwd(), '../insurance_root_ca.cert'), 'utf8'),
  },
  "Police Department": {
    privateKeyPem: fs.readFileSync(path.join(process.cwd(), '../police.key'), 'utf8'),
    certPem: fs.readFileSync(path.join(process.cwd(), '../police_root_ca.cert'), 'utf8'),
  },
  "Government Agency": {
    privateKeyPem: fs.readFileSync(path.join(process.cwd(), '../government.key'), 'utf8'),
    certPem: fs.readFileSync(path.join(process.cwd(), '../government_root_ca.cert'), 'utf8'),
  },
  "Malicious Organization": {
    privateKeyPem: fs.readFileSync(path.join(process.cwd(), '../malicious.key'), 'utf8'),
    certPem: fs.readFileSync(path.join(process.cwd(), '../malicious_root_ca.cert'), 'utf8'),
  }
};

export async function POST(req: NextRequest) {
  const { csrPem, organization } = await req.json();
  const sanitizedOrganization = sanitize(organization);
  const sanitizedCsrPem = sanitize(csrPem);

  if (!sanitizedCsrPem || !sanitizedOrganization) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  try {
    const ca = certificateAuthorities[sanitizedOrganization];
    if (!ca) {
      throw new Error('Invalid organization');
    }
    const caPrivateKeyPem = ca.privateKeyPem;
    const caCertPem = ca.certPem;


    const caPrivateKey = forge.pki.privateKeyFromPem(caPrivateKeyPem);
    const caCert = forge.pki.certificateFromPem(caCertPem);

    const csr = forge.pki.certificationRequestFromPem(sanitizedCsrPem);

    if (!csr.verify()) {
      throw new Error('CSR verification failed');
    }


    // Generate a certificate
    const cert = forge.pki.createCertificate();
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 90);  // Expire after 90 years


    cert.setSubject(csr.subject.attributes);
    cert.setIssuer(caCert.subject.attributes);
    if (!csr.publicKey) {
      throw new Error('CSR public key is null');
    }
    cert.publicKey = csr.publicKey;

    cert.sign(caPrivateKey);

    const certPem = forge.pki.certificateToPem(cert);

    return NextResponse.json({ message: "Certificate signed successfully", cert: certPem });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", dev: error.message },
      { status: 500 }
    );
  }
}