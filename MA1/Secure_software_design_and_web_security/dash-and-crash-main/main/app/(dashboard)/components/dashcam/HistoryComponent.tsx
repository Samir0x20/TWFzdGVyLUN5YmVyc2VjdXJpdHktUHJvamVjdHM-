"use client";

import React, { useState } from "react";
import {
  List,
  IconButton,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Box,
  Snackbar,
  Alert,
  Popper,
  Paper,
  TextField,
  Button,
  ClickAwayListener,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ShareIcon from "@mui/icons-material/Share";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import { ClientVideo } from "../../../types/ClientVideo";
import { useVideos } from "../../contexts/VideoContext";
import { useMasterKey } from "../../contexts/MasterKeyContext";
import { arrayBufferToBase64, base64ToArrayBuffer } from "@/app/utils/crypto";

interface HistoryProps {
  onSelectVideo: (video: ClientVideo) => void;
  onDeleteVideo: (code: string) => void;
  selectedVideo: ClientVideo | null;
}

export default function HistoryComponent({
  onSelectVideo,
  onDeleteVideo,
  selectedVideo,
}: HistoryProps) {
  const { videos } = useVideos();
  const { masterKey } = useMasterKey();
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
    open: boolean;
  }>({
    message: "",
    type: "info",
    open: false,
  });

  // Share functionality states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [selectedSharedVideo, setSelectedSharedVideo] = useState<ClientVideo | null>(
    null
  );

  const handleDelete = async (code: string) => {
    try {
      await onDeleteVideo(code);
      setNotification({
        message: "Video deleted successfully",
        type: "success",
        open: true,
      });
    } catch (error) {
      setNotification({
        message: "Failed to delete video",
        type: "error",
        open: true,
      });
    }
  };

  const handlePlay = (video: ClientVideo) => {
    onSelectVideo(video);
    setNotification({
      message: "Playing video",
      type: "info",
      open: true,
    });
  };

  const handleShareClick = (
    event: React.MouseEvent<HTMLElement>,
    video: ClientVideo
  ) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
    setSelectedSharedVideo(video);
    setShareEmail("");
  };

  async function decryptVideoKey(video: ClientVideo): Promise<ArrayBuffer> {
    if (!masterKey) {
      throw new Error("Master key is not available");
    }
    // decrypt the video aes key using the master key
    const videoKeyRaw = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: video.iv,
      },
      masterKey,
      video.encryptedAesKey
    );

    // import the video aes key
    return videoKeyRaw;
  }

  async function fetchPublicKey(email: string): Promise<CryptoKey> {
    const response = await fetch(`/api/get-public-key?email=${email}`);
    if (!response.ok) {
      throw new Error("Failed to fetch public key");
    }
    const { publicKey } = await response.json();
    const publicKeyBuffer = base64ToArrayBuffer(publicKey);
    return await window.crypto.subtle.importKey(
      "spki",
      publicKeyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt"]
    );
  }

  const handleShareSubmit = async () => {
    if (!shareEmail || !selectedSharedVideo) return;

    try {
      const videoKeyRaw = await decryptVideoKey(selectedSharedVideo);

      const trustedUserPublicKey = await fetchPublicKey(shareEmail);

      // Encrypt the video key with the trusted user's public key
      const encryptedVideoKey = await crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
        },
        trustedUserPublicKey,
        videoKeyRaw
      );

      const response = await fetch("/api/share-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'X-Request-Time': new Date().toISOString(), // Add the current date to the headers
        },
        body: JSON.stringify({
          videoCode: selectedSharedVideo.code,
          recipientEmail: shareEmail,
          encryptedVideoKey: arrayBufferToBase64(encryptedVideoKey)
        }),
      });

      if (!response.ok) throw new Error("Failed to share video");

      setNotification({
        message: "Video shared successfully",
        type: "success",
        open: true,
      });
      setAnchorEl(null);
      setShareEmail("");
    } catch (error) {
      setNotification({
        message: "Failed to share video",
        type: "error",
        open: true,
      });
    }
  };

  const handleCloseShare = () => {
    setAnchorEl(null);
    setShareEmail("");
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({
      ...prev,
      open: false,
    }));
  };

  const open = Boolean(anchorEl);

  return (
    <Box sx={{ width: "100%", bgcolor: "background.paper", padding: 2 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          mb: 4,
          color: "primary.main",
          fontWeight: "medium",
        }}
      >
        My videos
      </Typography>

      {videos.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 8,
            px: 2,
            textAlign: "center",
            backgroundColor: (theme) => theme.palette.background.default,
            color: (theme) => theme.palette.text.secondary,
            borderRadius: 2,
          }}
        >
          <VideoLibraryIcon
            sx={{
              fontSize: 64,
              color: "grey.400",
              mb: 2,
            }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Videos Yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start recording to see your videos appear here
          </Typography>
        </Box>
      ) : (
        <List sx={{ width: "100%", bgcolor: "background.paper" }}>
          {videos.map((video) => (
            <Card
              key={video.code}
              sx={{
                mb: 2,
                border: selectedVideo?.code === video.code ? 2 : 0,
                borderColor: "primary.main",
              }}
            >
              <CardMedia
                component="img"
                height="140"
                image={`/api/get-thumbnail?videoCode=${video.code}`}
                alt={`Video ${video.code} thumbnail`}
                sx={{ objectFit: "cover" }}
              />
              <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box flexGrow={1}>
                    <Typography variant="subtitle1" component="div">
                      Video {video.code}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(video.dateStarted).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      color="primary"
                      onClick={() => handlePlay(video)}
                    >
                      <PlayArrowIcon />
                    </IconButton>
                    <IconButton
                      color="primary"
                      onClick={(e) => handleShareClick(e, video)}
                    >
                      <ShareIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(video.code)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </List>
      )}

      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-end"
        style={{ zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={handleCloseShare}>
          <Paper sx={{ p: 2, width: 300 }}>
            <Typography variant="h6" gutterBottom>
              Share Video
            </Typography>
            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleShareSubmit}
              disabled={!shareEmail}
            >
              Share
            </Button>
          </Paper>
        </ClickAwayListener>
      </Popper>

      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.type}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
