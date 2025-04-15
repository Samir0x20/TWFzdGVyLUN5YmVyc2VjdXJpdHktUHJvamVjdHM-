"use client";

import React, { useEffect, useRef } from "react";
import { Typography, Box } from "@mui/material";
import { base64ToArrayBuffer } from "@/app/utils/crypto";
import { useMasterKey } from "../../contexts/MasterKeyContext";
import { TrustedVideo } from "@/app/types/TrustedVideo";

interface PlayerComponentProps {
  video: TrustedVideo | null; // Allow `null` to handle the state when no video is selected
}

export default function PlayerComponent({ video }: PlayerComponentProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);

  const { masterKey } = useMasterKey();

  useEffect(() => {
    if (!video) {
      console.log("[DEBUG] No video selected");
      return;
    }

    const fetchAndPlay = async () => {
      console.log(`[DEBUG] Starting playback for video: ${video.code}`);

      const mediaSource = new MediaSource();
      mediaSourceRef.current = mediaSource;

      if (videoRef.current) {
        videoRef.current.src = URL.createObjectURL(mediaSource);
      }

      mediaSource.addEventListener("sourceopen", async () => {
        console.log("[DEBUG] MediaSource opened");
        const sourceBuffer = mediaSource.addSourceBuffer(
          'video/webm; codecs="vp9,opus"'
        );
        sourceBufferRef.current = sourceBuffer;

        try {
          const videoKey = await decryptVideoKey(video);

          const maxChunks = 1000; // Cap the loop at 1000 chunks
          for (let chunkIndex = 0; chunkIndex < maxChunks; chunkIndex++) {
            const url = `/api/download?videoCode=${video.code}&chunkIndex=${chunkIndex}`;
            console.log(`[DEBUG] Fetching chunk from URL: ${url}`);

            try {
              const response = await fetch(url, {
                headers: {
                  "X-Request-Time": new Date().toISOString(),
                },
              });

              if (!response.ok) {
                console.warn(
                  `[DEBUG] Fetch for chunk ${chunkIndex} returned status: ${response.status}`
                );
                break; // Exit loop on non-200 response
              }

              const encryptedData = await response.arrayBuffer();
              const chunk = await decryptChunk(videoKey, encryptedData);

              console.log(
                `[DEBUG] Appending chunk ${chunkIndex} with size: ${chunk.byteLength}`
              );
              sourceBuffer.appendBuffer(new Uint8Array(chunk));

              await new Promise((resolve) => {
                sourceBuffer.addEventListener("updateend", resolve, {
                  once: true,
                });
              });
            } catch (fetchError) {
              console.error(
                `[DEBUG] Fetch error for chunk ${chunkIndex}:`,
                fetchError
              );
              break; // Exit loop on fetch error
            }
          }

          console.log(
            "[DEBUG] All available chunks appended or maximum chunks reached. Playback should start now."
          );
          if (mediaSource.readyState === "open") {
            mediaSource.endOfStream();
          }
        } catch (error) {
          console.error("[DEBUG] Error during playback:", error);
        }
      });

      mediaSource.addEventListener("sourceended", () => {
        console.log("[DEBUG] MediaSource ended");
      });

      mediaSource.addEventListener("error", (e) => {
        console.error("[DEBUG] MediaSource error:", e);
      });
    };

    fetchAndPlay();
  }, [video]);

  async function decryptVideoKey(video: TrustedVideo): Promise<CryptoKey> {
    if (!masterKey) {
      throw new Error("Master key is not available");
    }

    if (!video.encryptedPrivateKeyEnc) {
      throw new Error("Video does not have an encrypted private key");
    }

    const encryptedPrivateKeyBuffer = base64ToArrayBuffer(video.encryptedPrivateKeyEnc);
    const encryptedAesKeyBuffer = base64ToArrayBuffer(video.encryptedAesKey);

    // Extract the IV from the combined buffer
    const iv = encryptedPrivateKeyBuffer.slice(0, 12);
    const encryptedPrivateKey = encryptedPrivateKeyBuffer.slice(12);

    // Decrypt the private key using the master key
    const decryptedPrivateKey = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        masterKey,
        encryptedPrivateKey
    );

    // Import the decrypted private key as a CryptoKey
    const privateKey = await window.crypto.subtle.importKey(
        "pkcs8",
        decryptedPrivateKey,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["decrypt"]
    );

    // Now you can use the imported private key to decrypt the video AES key
    const videoKeyRaw = await window.crypto.subtle.decrypt(
        {
            name: "RSA-OAEP",
        },
        privateKey,
        encryptedAesKeyBuffer
    );

    // import the video aes key
    return await window.crypto.subtle.importKey(
      "raw",
      videoKeyRaw,
      "AES-GCM",
      false,
      ["decrypt"]
    );
  }

  async function decryptChunk(videoKey: CryptoKey, encryptedData: ArrayBuffer): Promise<ArrayBuffer> {
    const iv = encryptedData.slice(0, 16);
    const encryptedChunk = encryptedData.slice(16);
    const decryptedChunk = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      videoKey,
      encryptedChunk
    );

    return decryptedChunk;
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: 400, // Fixed height for the player container
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "black",
        borderRadius: 1,
      }}
    >
      {video ? (
        <video
          ref={videoRef}
          controls
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain", // This ensures the video maintains its aspect ratio
          }}
        />
      ) : (
        <Typography variant="body1" color="white">
          No video selected. Please select a video to play.
        </Typography>
      )}
    </Box>
  );
}