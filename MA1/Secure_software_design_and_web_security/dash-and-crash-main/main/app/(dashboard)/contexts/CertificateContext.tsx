// app/CertificateContext.tsx
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

// Certificate Interface
interface Certificate {
  id: string;
  name: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  pem: string;
  privateKeyPem: string;
}

interface CertificateContextProps {
  certificates: Certificate[];
  addCertificate: (cert: Certificate) => void;
  mergeCertificates: (newCertificates: Certificate[]) => void;
  removeCertificate: (id: string) => void;
}

// Create the context
const CertificateContext = createContext<CertificateContextProps | undefined>(
  undefined
);

// Certificate Provider
export const CertificateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  // Load certificates from localStorage on initialization
  useEffect(() => {
    const storedCerts = localStorage.getItem("certificates");
    if (storedCerts) {
      setCertificates(JSON.parse(storedCerts));
    }
  }, []);

  // Save certificates to localStorage whenever the list changes
  useEffect(() => {
    localStorage.setItem("certificates", JSON.stringify(certificates));
  }, [certificates]);

  const addCertificate = (cert: Certificate) => {
    setCertificates((prev) => [...prev, cert]);
  };

  const mergeCertificates = (newCertificates: Certificate[]) => {
    setCertificates((prev) => [
      ...prev,
      ...newCertificates.filter(
        (newCertificate) => !prev.some((cert) => cert.id === newCertificate.id)
      ),
    ]);
  };

  const removeCertificate = (id: string) => {
    setCertificates((prev) => prev.filter((cert) => cert.id !== id));
  };

  return (
    <CertificateContext.Provider
      value={{
        certificates,
        addCertificate,
        mergeCertificates,
        removeCertificate,
      }}
    >
      {children}
    </CertificateContext.Provider>
  );
};

// Custom hook to use the context
export const useCertificates = (): CertificateContextProps => {
  const context = useContext(CertificateContext);
  if (!context) {
    throw new Error(
      "useCertificates must be used within a CertificateProvider"
    );
  }
  return context;
};
