"use client";
import * as React from "react";
import { Container, Typography, Box, Button } from '@mui/material';
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function VerifyEmail() {
  const router = useRouter();

  const refresh = async () => {
    router.push('/');
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Verify Your Email
        </Typography>
        <Typography component="p" sx={{ mt: 2 }}>
          Please check your email and click on the verification link to verify your email address.
        </Typography>
        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          onClick={refresh}
        >
          Refresh
        </Button>
      </Box>
    </Container>
  );
}
