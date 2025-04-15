// app/(dashboard)/account/WebSockets.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import Typography from "@mui/material/Typography";
import { LineChart } from "@mui/x-charts";

export default function WebSocket() {
  const [data, setData] = useState<{ x: number; y: number }[]>([]);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");

  // Use a ref to store the WebSocket connection
  const socketRef = useRef<Socket | null>(null);

  // Connect to the WebSocket once and handle incoming data
  useEffect(() => {
    if (!socketRef.current) {
      // Initialize WebSocket connection
      socketRef.current = io({
        transports: ["websocket"], // Use WebSocket transport
      });

      // Update connection status
      socketRef.current.on("connect", () => {
        setConnectionStatus("Connected");
      });

      socketRef.current.on("disconnect", () => {
        setConnectionStatus("Disconnected");
      });

      // Handle incoming data
      socketRef.current.on("data", (newValue: number) => {
        setData((prevData) => {
          // Append new data point and keep the last 100 points
          const timestamp = Date.now();
          return [...prevData.slice(-99), { x: timestamp, y: newValue }];
        });
      });
    }

    // Cleanup function: disconnect socket on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h4" gutterBottom>
        WebSocket Status: {connectionStatus}
      </Typography>
      <LineChart
        xAxis={[
          {
            scaleType: "time",
            dataKey: "x",
            label: "Time",
            valueFormatter: (value) => new Date(value).toLocaleTimeString(),
          },
        ]}
        yAxis={[{ scaleType: "linear", dataKey: "y", label: "Value" }]}
        series={[{ dataKey: "y", label: "Random Data" }]}
        width={800}
        height={400}
        dataset={data}
      />
    </div>
  );
}