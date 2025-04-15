import * as React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "../../auth";
import { Box, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import WebcamRecorder from "./components/dashcam/WebcamRecorderComponent";
import WebcamPlayback from "./components/dashcam/WebcamPlaybackComponent";

export default async function HomePage() {
  const session = await auth();
  const currentUrl =
    (await headers()).get("referer") ||
    process.env.AUTH_URL ||
    "http://localhost:3000";

  if (!session) {
    const redirectUrl = new URL("/auth/role", currentUrl);
    redirect(redirectUrl.toString());
  }

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: "100%",
        }}
      >
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
          Video Recorder
        </Typography>

        <Grid container spacing={3} columns={6}>
          <Grid size={{ xs: 12, md: 6 }}>
            <WebcamRecorder />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <WebcamPlayback />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
