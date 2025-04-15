"use client";
import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { useRouter } from 'next/navigation';

const RoleSelectionPage = () => {
  const router = useRouter();

  const handleRoleSelection = (role: string) => {
    // Handle role selection logic here
    // Redirect based on the selected role
    if (role === 'normal') {
      router.push('signin');
    } else if (role === 'other') {
      router.push('trustedsignin');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        Select Your Role
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleRoleSelection('normal')}
          sx={{ mb: 2, width: '100%' }}
        >
          Normal User
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => handleRoleSelection('other')}
          sx={{ width: '100%' }}
        >
          Assurance, Policier, etc.
        </Button>
      </Box>
    </Container>
  );
};

export default RoleSelectionPage;