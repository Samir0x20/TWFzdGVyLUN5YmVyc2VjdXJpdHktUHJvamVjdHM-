"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardActionArea,
  CardMedia,
  CircularProgress,
  Container,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import UploadIcon from "@mui/icons-material/Upload";
import TimerIcon from "@mui/icons-material/Timer";
import DataUsageIcon from "@mui/icons-material/DataUsage";
import { useVideos } from "../../contexts/VideoContext";
import { useMasterKey } from "../../contexts/MasterKeyContext";
import { ClientVideo } from "../../../types/ClientVideo";
import { arrayBufferToBase64 } from "@/app/utils/crypto";

export default function WebcamRecorder() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadProgress, setCurrentUploadProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { addVideo } = useVideos();
  const { masterKey } = useMasterKey();
  // Fetch available video input devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
      const videoDevices = deviceInfos.filter(
        (device) => device.kind === "videoinput"
      );
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    });
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;

    if (selectedDeviceId) {
      navigator.mediaDevices
        .getUserMedia({
          video: { deviceId: { exact: selectedDeviceId } },
          audio: true,
        })
        .then((mediaStream) => {
          stream = mediaStream;
          setMediaStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play();
          }
          console.log(
            "[DEBUG] Media stream initialized with device:",
            selectedDeviceId
          );
        })
        .catch((err) => {
          setError("Failed to access webcam. Please check your permissions.");
          console.error("[DEBUG] Failed to initialize media stream:", err);
        });

      // Cleanup previous stream
      return () => {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      };
    }
  }, [selectedDeviceId]); // Re-run whenever `selectedDeviceId` changes

  const stopRecording = useCallback(() => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
    setMediaRecorder(null);
    setIsUploading(false);
    setCurrentUploadProgress(0);
  }, [mediaRecorder]);

  // Separate effect for handling recording cleanup
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, [isRecording, stopRecording]);

  // Handle auto-recording
  useEffect(() => {
    const savedValue = localStorage.getItem("videoAutoStart");
    const autoRecord = savedValue
      ? savedValue === "true"
      : process.env.NEXT_PUBLIC_AUTO_RECORD === "true";

    if (mediaStream && autoRecord && !isRecording) {
      startRecording();
    }
  }, [mediaStream]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  async function startRecording() {
    if (!mediaStream) {
      console.error("[DEBUG] Media stream not available");
      return;
    }

    try {
      setIsUploading(true);
      setElapsedTime(0);
      setTotalSize(0);

      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      const videoKey = await crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"]
      );

      const newClientVideo = await createNewVideo(videoKey);

      if (!newClientVideo) {
        setError("Failed to create new video");
        return;
      }

      await captureAndUploadThumbnail(newClientVideo.code);
      addVideo(newClientVideo);

      const mimeType = "video/webm; codecs=vp9";
      const recorder = new MediaRecorder(mediaStream, { mimeType });

      let currentChunkIndex = 0;

      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const chunkBuffer = await event.data.arrayBuffer();
          const { iv, encryptedChunk } = await encryptChunk(
            videoKey,
            chunkBuffer
          );
          const success = await uploadChunk(
            newClientVideo.code,
            currentChunkIndex,
            iv,
            await encryptedChunk
          );
          if (success) {
            setTotalSize((prev) => prev + chunkBuffer.byteLength);
            setCurrentUploadProgress((prev) => prev + 1);
            currentChunkIndex += 1;
          } else {
            setError(`Failed to upload chunk ${currentChunkIndex}`);
          }
        }
      };
      const savedValue = localStorage.getItem("videoBufferSize");
      const bufferLength = savedValue
        ? parseInt(savedValue, 10) * 1000
        : parseInt(
            process.env.NEXT_PUBLIC_DASHCAM_DEFAULT_BUFFER_LENGTH || "1000",
            10
          );

      recorder.start(bufferLength);

      setMediaRecorder(recorder);
      setIsRecording(true);
      setCurrentUploadProgress(0);
    } catch (err) {
      setError("Failed to start recording");
      setIsUploading(false);
    }
  }

  async function captureAndUploadThumbnail(videoCode: string) {
    if (!videoRef.current || !canvasRef.current) {
      console.error("[DEBUG] Video or canvas not available for thumbnail");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Ensure video has loaded data
    await new Promise<void>((resolve) => {
      if (video.readyState >= 2) {
        resolve();
      } else {
        video.addEventListener("loadeddata", () => resolve(), { once: true });
      }
    });

    // Set canvas dimensions and capture frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Create and upload thumbnail
    const thumbnailBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg")
    );

    if (thumbnailBlob) {
      const success = await uploadThumbnail(videoCode, thumbnailBlob);
      console.log(
        success
          ? "[DEBUG] Thumbnail uploaded successfully"
          : "[DEBUG] Failed to upload thumbnail"
      );
    }
  }

  async function uploadThumbnail(videoCode: string, thumbnail: Blob) {
    try {
      const formData = new FormData();
      formData.append("thumbnail", thumbnail);

      const response = await fetch(
        `/api/upload-thumbnail?videoCode=${videoCode}`,
        {
          method: "POST",
          headers: {
            "X-Request-Time": new Date().toISOString(),
          },
          body: formData,
        }
      );

      return response.ok;
    } catch (error) {
      console.error("[DEBUG] Error uploading thumbnail:", error);
      return false;
    }
  }

  async function createNewVideo(
    videoKey: CryptoKey
  ): Promise<ClientVideo | null> {
    try {
      if (!masterKey) {
        throw new Error("Master key is not available");
      }

      // Encrypt video key with masterKey AES-GCM
      const videoKeyRaw = await crypto.subtle.exportKey("raw", videoKey);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedVideoKey = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        masterKey,
        videoKeyRaw
      );

      // Combine IV and encrypted video key into a single buffer
      const combinedBuffer = new Uint8Array(iv.length + encryptedVideoKey.byteLength);
      combinedBuffer.set(iv, 0);
      combinedBuffer.set(new Uint8Array(encryptedVideoKey), iv.length);

      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "X-Request-Time": new Date().toISOString(),
        },
        body: JSON.stringify({ videoKey: arrayBufferToBase64(combinedBuffer.buffer) }),
      });

      if (!response.ok) {
        console.error("[DEBUG] Error creating video:", await response.text());
        return null;
      }

      const { video } = await response.json();

      // Return a ClientVideo object
      return {
        code: video.code,
        dateStarted: video.dateStarted,
        encryptedAesKey: encryptedVideoKey,
        iv: iv,
        chunkCount: undefined,
      };
    } catch (error) {
      console.error("[DEBUG] Error creating video:", error);
      return null;
    }
  }

  async function uploadChunk(
    videoCode: string,
    chunkIndex: number,
    iv: Uint8Array,
    chunk: ArrayBuffer
  ) {
    try {
      const ivUint8 = new Uint8Array(iv);
      const chunkUint8 = new Uint8Array(chunk);
      const combinedData = new Uint8Array(ivUint8.length + chunkUint8.length);
      combinedData.set(ivUint8);
      combinedData.set(chunkUint8, ivUint8.length);
      const response = await fetch(
        `/api/upload?videoCode=${videoCode}&chunkIndex=${chunkIndex}`,
        {
          method: "POST",
          headers: {
            'X-Request-Time': new Date().toISOString(), // Add the current date to the headers
          },
          body: combinedData.buffer,
        }
      );
      return response.ok;
    } catch (error) {
      console.error("[DEBUG] Error uploading chunk:", error);
      return false;
    }
  }

  async function encryptChunk(videoKey: CryptoKey, chunk: ArrayBuffer) {
    const iv = crypto.getRandomValues(new Uint8Array(16));

    const encryptedChunk = crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      videoKey,
      chunk
    );

    return { iv, encryptedChunk };
  }

  return (
    <Container maxWidth="md">
      <Typography
        variant="caption"
        color="error"
        gutterBottom
        sx={{ display: "block" }}
      ></Typography>
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel id="webcam-selector-label">Select Camera Source</InputLabel>
        <Select
          labelId="webcam-selector-label"
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          label="Select Camera Source"
        >
          {devices.map((device) => (
            <MenuItem key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId}`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Card
        sx={{
          mt: 4,
          overflow: "visible",
        }}
      >
        <CardActionArea>
          <CardMedia
            component="div"
            sx={{
              position: "relative",
              bgcolor: "black",
              minHeight: 400,
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {isRecording && (
              <Box
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  zIndex: 1,
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: "error.main",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
                <Typography variant="caption" color="white">
                  REC
                </Typography>
              </Box>
            )}
          </CardMedia>
        </CardActionArea>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 3,
              mb: 3,
            }}
          >
            <IconButton
              color="primary"
              size="large"
              onClick={startRecording}
              disabled={isRecording}
              sx={{
                p: 2,
                "&:hover": {
                  backgroundColor: "rgba(236, 98, 34, 0.04)",
                },
              }}
            >
              <RadioButtonCheckedIcon sx={{ fontSize: 40 }} color="error" />
            </IconButton>

            <IconButton
              color="error"
              size="large"
              onClick={stopRecording}
              disabled={!isRecording}
              sx={{
                p: 2,
                "&:hover": {
                  backgroundColor: "rgba(68, 255, 124, 0.04)",
                },
              }}
            >
              <StopCircleIcon sx={{ fontSize: 40 }} />
            </IconButton>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{ display: "flex", justifyContent: "center", gap: 4, mb: 2 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TimerIcon color="action" />
              <Typography variant="body2" color="text.secondary">
                Time Elapsed: {formatTime(elapsedTime)}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <DataUsageIcon color="action" />
              <Typography variant="body2" color="text.secondary">
                Total Size: {formatSize(totalSize)}
              </Typography>
            </Box>
          </Box>

          {isUploading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "success.main",
                }}
              >
                <UploadIcon fontSize="small" />
                <Typography variant="body2">Uploading chunks...</Typography>
              </Box>
              <CircularProgress size={20} color="success" />
              {currentUploadProgress > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {currentUploadProgress} chunks uploaded
                </Typography>
              )}
            </Box>
          )}

          <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
        </CardContent>
      </Card>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}
