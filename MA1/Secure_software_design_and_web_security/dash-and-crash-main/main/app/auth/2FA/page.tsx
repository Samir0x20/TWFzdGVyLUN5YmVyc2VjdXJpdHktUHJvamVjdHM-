"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Container, TextField, Typography, Alert } from "@mui/material";
import { useSession } from "next-auth/react";

export default function TwoFactorAuth() {
  const [twoFactorToken, setTwoFactorToken] = React.useState("");
  const [qrCodeUrl, setQrCodeUrl] = React.useState("");
  const [showQrCode, setShowQrCode] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === "authenticated") {
      if (!session) {
        router.push("/auth/role");
        return;
      }
      if (session.isTwoFactorEnabled) {
        setShowQrCode(false);
      } else {
        // Fetch the QR code URL if 2FA is not enabled
        const fetchQrCodeUrl = async () => {
          try {
            const response = await fetch('/api/2FA/generate', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            const data = await response.json();
            if (data.qrCodeUrl) {
              setQrCodeUrl(data.qrCodeUrl);
            } else {
              setError('Failed to generate QR code URL');
            }
          } catch (error) {
            console.error('Error fetching QR code URL:', error);
            setError('Error fetching QR code URL');
          }
        };
        fetchQrCodeUrl();
      }
    } else{
      router.push('/auth/role');
    }
  }, [session, status]);

  const handle2FASubmit = async () => {
    try {
      const response = await fetch('/api/2FA/valide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: twoFactorToken }),
      });
      const data = await response.json();
      if (data.success) {
        // Handle successful 2FA validation
        router.push('/'); // Redirect to the home page or dashboard
      } else {
        // Handle 2FA validation error
        setError('Invalid 2FA token');
      }
    } catch (error) {
      console.error('Error validating 2FA token:', error);
      setError('Error validating 2FA token');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 6) {
      setTwoFactorToken(value);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Two-Factor Authentication
        </Typography>
        {showQrCode && (
          <>
            <Typography variant="body1" gutterBottom>
              Scan the QR Code with your Authenticator App
            </Typography>
            {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" />}
          </>
        )}
        <Typography variant="body1" gutterBottom>
          Enter 2FA Token
        </Typography>
        {session && session.user && (
          <Typography variant="body2" gutterBottom>
            Email: {session.user.email}
          </Typography>
        )}
        <TextField
          fullWidth
          variant="outlined"
          margin="normal"
          label="2FA Token"
          value={twoFactorToken}
          onChange={handleChange}
          inputProps={{ inputMode: 'numeric', maxLength: 6 }}
        />
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handle2FASubmit}
          sx={{ mt: 2 }}
        >
          Submit
        </Button>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Container>
  );
}