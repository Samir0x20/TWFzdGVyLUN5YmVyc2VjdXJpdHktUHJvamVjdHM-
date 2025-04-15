"use client";
import React, { useState, useEffect } from "react";
import {
  Paper,
  TextField,
  Typography,
  Tooltip,
  IconButton,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

const VideoParameters: React.FC = () => {
  const STORAGE_KEY = "videoBufferSize";
  const MIN_VALUE = 1;
  const MAX_VALUE = 60;

  const [bufferSize, setBufferSize] = useState<number>(10); // Default to 10 seconds
  const [isClient, setIsClient] = useState(false);

  // Ensure the component is mounted on the client
  useEffect(() => {
    setIsClient(true);
    const savedValue = localStorage.getItem(STORAGE_KEY);
    if (savedValue) {
      setBufferSize(parseInt(savedValue, 10));
    }
  }, []);

  // Update localStorage whenever bufferSize changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(STORAGE_KEY, bufferSize.toString());
    }
  }, [bufferSize, isClient]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value === "" ? "" : Number(event.target.value);
    if (typeof value === "number" && value >= MIN_VALUE && value <= MAX_VALUE) {
      setBufferSize(value);
    }
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
          sx={{
            marginBottom: 5,
          }}
        >
          Video Buffer Size
        </Typography>
        <Tooltip
          title="Buffer size determines how long individual chunks are. A lower value (1-10s) reduces is more responsive."
          arrow
          placement="right"
        >
          <IconButton size="small" sx={{ mb: 5 }}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
      <TextField
        label="Buffer Size (seconds)"
        type="number"
        value={bufferSize}
        onChange={handleInputChange}
        sx={{ mt: 2 }}
        fullWidth
      />
    </Paper>
  );
};

export default VideoParameters;
