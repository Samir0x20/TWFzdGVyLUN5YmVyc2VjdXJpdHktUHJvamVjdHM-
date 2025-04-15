"use client";
import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

const AutoStartToggle: React.FC = () => {
  const STORAGE_KEY = "videoAutoStart";

  const [autoStart, setAutoStart] = useState<boolean>(true); // Default to true
  const [isClient, setIsClient] = useState(false);

  // Ensure the component is mounted on the client
  useEffect(() => {
    setIsClient(true);
    const savedValue = localStorage.getItem(STORAGE_KEY);
    if (savedValue !== null) {
      setAutoStart(savedValue === "true");
    }
  }, []);

  // Update localStorage whenever autoStart changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(STORAGE_KEY, autoStart.toString());
    }
  }, [autoStart, isClient]);

  const handleToggleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    setAutoStart(checked);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: 300,
        height: 200,
        p: 3,
        borderRadius: 2,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            marginBottom: 5,
          }}
        >
          Video Auto-Start
        </Typography>
        <Tooltip
          title="Toggle auto-start to begin recording video as soon as the page loads."
          arrow
          placement="right"
        >
          <IconButton size="small" sx={{ mb: 5 }}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
      <FormControlLabel
        control={
          <Switch
            checked={autoStart}
            onChange={handleToggleChange}
            color="primary"
            aria-label="auto-start toggle"
          />
        }
        label={autoStart ? "Enabled" : "Disabled"}
      />
    </Paper>
  );
};

export default AutoStartToggle;
