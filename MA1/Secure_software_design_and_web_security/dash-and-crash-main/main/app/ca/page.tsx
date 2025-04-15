"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Snackbar,
} from "@mui/material";

const trustedOrganizations = [
  "Insurance Company A",
  "Police Department",
  "Government Agency",
  "Malicious Organization",
];

const SignCsrPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [organization, setOrganization] = useState("");
  const [signedCertificate, setSignedCertificate] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file || !organization) {
      alert("Please upload a file and select an organization.");
      return;
    }

    try {
      const csrPem = await file.text(); // Convert file to string
      
      const response = await fetch('/api/ca', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csrPem, organization }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit CSR');
      }
      
      const responseData = await response.json();

      setSignedCertificate(responseData.cert);
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Failed to submit CSR", error);
    }
  };

  const handleDownload = () => {
    if (signedCertificate) {
      const blob = new Blob([signedCertificate], { type: "application/x-pem-file" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "signed_certificate.pem";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: "500px",
        margin: "auto",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <Typography variant="h4" textAlign="center" gutterBottom>
        DEV interface: Sign CSR
      </Typography>

      <TextField
        type="file"
        onChange={handleFileChange}
        helperText={file ? `File selected: ${file.name}` : "Upload a CSR PEM file"}
      />

      <FormControl fullWidth>
        <InputLabel>Trusted Organization</InputLabel>
        <Select
          value={organization}
          onChange={(event) => setOrganization(event.target.value)}
          label="Trusted Organization"
        >
          {trustedOrganizations.map((org) => (
            <MenuItem key={org} value={org}>
              {org}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={!file || !organization}
      >
        Submit for Signing
      </Button>

      {signedCertificate && (
        <Button
          variant="contained"
          color="secondary"
          onClick={handleDownload}
        >
          Download Signed Certificate
        </Button>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="CSR Submitted Successfully!"
      />
    </Box>
  );
};

export default SignCsrPage;
