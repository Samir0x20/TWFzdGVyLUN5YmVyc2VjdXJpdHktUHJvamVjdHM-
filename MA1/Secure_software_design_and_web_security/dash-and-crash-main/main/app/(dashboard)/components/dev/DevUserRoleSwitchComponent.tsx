"use client";
import React, { useState } from "react";
import {
  Paper,
  Typography,
  Button,
  Tooltip,
  IconButton,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import PoliceIcon from "@mui/icons-material/LocalPolice";
import PersonIcon from "@mui/icons-material/Person";

export const DevUserRoleSwitchComponent: React.FC = () => {
  const [isPolice, setIsPolice] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleBecomePolice = () => {
    // to do fetch requrest to become police
    setIsPolice(true);
    setSuccess("You are now a police officer");
  };

  const handleBecomeNormal = () => {
    // to do fetch requrest to become police
    setIsPolice(false);
    setSuccess("You are now a normal user");
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: 300,
        height: 300,
        p: 3,
        borderRadius: 2,
      }}
    >
      <Typography
        variant="caption"
        color="error"
        gutterBottom
        sx={{ display: "block" }}
      >
        Not implemented see issue #6
      </Typography>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            marginBottom: 5,
          }}
        >
          Role Switcher
        </Typography>
        <Tooltip
          title="Switch between police officer and normal user roles for development purposes."
          arrow
          placement="right"
        >
          <IconButton size="small" sx={{ mb: 5 }}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>

      <Stack spacing={2}>
        <Button
          variant="contained"
          startIcon={<PoliceIcon />}
          onClick={handleBecomePolice}
          disabled={isPolice}
          sx={{
            textTransform: "none",
            justifyContent: "flex-start",
            px: 2,
          }}
        >
          Become a police officer
        </Button>
        <Button
          variant="contained"
          startIcon={<PersonIcon />}
          onClick={handleBecomeNormal}
          disabled={!isPolice}
          sx={{
            textTransform: "none",
            justifyContent: "flex-start",
            px: 2,
          }}
        >
          Become a normal user
        </Button>
      </Stack>

      {/* Notification */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Paper>
  );
};
