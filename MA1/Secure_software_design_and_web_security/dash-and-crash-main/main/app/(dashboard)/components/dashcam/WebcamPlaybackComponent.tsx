"use client";

import React, { useState } from "react";
import HistoryComponent from "./HistoryComponent";
import { Box, Snackbar, Alert, Paper } from "@mui/material";
import PlayerComponent from "./PlayerComponent";
import { useVideos } from "../../contexts/VideoContext";
import { ClientVideo } from "../../../types/ClientVideo";

export default function WebcamPlayback() {
  const { removeVideo } = useVideos();
  const [selectedVideo, setSelectedVideo] = useState<ClientVideo | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Delete video handler
  const handleDeleteVideo = async (videoCode: string) => {
    try {
      const response = await fetch(`/api/videos?videoCode=${videoCode}`, {
        method: "DELETE",
        headers: {
          'X-Request-Time': new Date().toISOString(), // Add the current date to the headers
        },
      });
      if (response.ok) {
        removeVideo(videoCode);
        setSelectedVideo(null);
      } else {
        setError("Failed to delete video. Please try again.");
        console.error(`[DEBUG] Failed to delete video with code: ${videoCode}`);
      }
    } catch (error) {
      setError("An error occurred while deleting the video.");
      console.error(
        `[DEBUG] Error deleting video with code ${videoCode}:`,
        error
      );
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 3,
        width: "100%",
        alignItems: "flex-start", // This prevents stretching
      }}
    >
      <Paper
        elevation={3}
        sx={{
          flex: 1,
          p: 2,
          borderRadius: 2,
        }}
      >
        <HistoryComponent
          onSelectVideo={setSelectedVideo}
          onDeleteVideo={handleDeleteVideo}
          selectedVideo={selectedVideo}
        />
      </Paper>

      <Paper
        elevation={3}
        sx={{
          width: "65%",
          p: 2,
          borderRadius: 2,
          alignSelf: "flex-start", // This prevents stretching
        }}
      >
        <Box sx={{ aspectRatio: "16/9" }}>
          <PlayerComponent video={selectedVideo} />
        </Box>
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
