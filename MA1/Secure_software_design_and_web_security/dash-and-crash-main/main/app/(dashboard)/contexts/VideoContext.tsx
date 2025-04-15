"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ClientVideo } from "../../types/ClientVideo";
import { base64ToArrayBuffer } from "@/app/utils/crypto";

interface VideoContextProps {
  videos: ClientVideo[];
  addVideo: (video: ClientVideo) => void;
  mergeVideos: (newVideos: ClientVideo[]) => void;
  removeVideo: (code: string) => void;
}

const VideoContext = createContext<VideoContextProps | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [videos, setVideos] = useState<ClientVideo[]>([]);

  useEffect(() => {
    const syncVideos = async () => {
      try {
        const response = await fetch("/api/videos",
          {
            headers: {
              'X-Request-Time': new Date().toISOString(), // Add the current date to the headers
            },
          }
        );
        if (!response.ok) {
          console.error("[DEBUG] Failed to fetch videos from backend");
          return;
        }

        const { videos: backendVideos } = await response.json();

        // convert backend videos to ClientVideos
        const video = backendVideos.map((video: any) => {
          const iv = base64ToArrayBuffer(video.encryptedKey).slice(0, 12);
          const encryptedAesKey = base64ToArrayBuffer(video.encryptedKey).slice(12);
          return {
            code: video.code,
            dateStarted: video.dateStarted,
            chunkCount: video.chunkCount,
            encryptedAesKey: encryptedAesKey,
            iv: iv,
          };
        });

        setVideos(video);
      } catch (error) {
        console.error("[DEBUG] Error syncing videos with backend:", error);
      }
    };

    syncVideos();
  }, []);

  const addVideo = (video: ClientVideo) => {
    setVideos((prev) => [...prev, video]);
  };

  const mergeVideos = (newVideos: ClientVideo[]) => {
    setVideos((prev) => [
      ...prev,
      ...newVideos.filter(
        (newVideo) => !prev.some((video) => video.code === newVideo.code)
      ),
    ]);
  };

  const removeVideo = (code: string) => {
    setVideos((prev) => prev.filter((video) => video.code !== code));
  };

  return (
    <VideoContext.Provider
      value={{ videos, addVideo, mergeVideos, removeVideo }}
    >
      {children}
    </VideoContext.Provider>
  );
};

export const useVideos = (): VideoContextProps => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error("useVideos must be used within a VideoProvider");
  }
  return context;
};
