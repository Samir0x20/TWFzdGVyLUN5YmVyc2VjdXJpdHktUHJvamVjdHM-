// /app/(dashboard)/dashcam/page.tsx
import * as React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "../../../auth";
import VideoParameters from "../components/dashcam/VideoParametersComponent";
import AutoStartToggle from "../components/dashcam/AutoStartToggleComponent";
import { Box, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
export default async function PreferencesPage() {
  const session = await auth();
  const currentUrl =
    (await headers()).get("referer") ||
    process.env.AUTH_URL ||
    "http://localhost:3000";

  if (!session) {
    const redirectUrl = new URL("/auth/signin", currentUrl);
    redirectUrl.searchParams.set("callbackUrl", currentUrl);
    redirect(redirectUrl.toString());
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Dashcam Preferences
      </Typography>
      <Grid container spacing={3}>
        {/* Video Parameters */}
        <Grid>
          <VideoParameters />
        </Grid>

        {/* Auto Start Toggle */}
        <Grid>
          <AutoStartToggle />
        </Grid>

        {/* You can add more preference components here */}
        {/* Example:
        <Grid item xs={12} sm={6} md={3}>
          <QualitySettings />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StorageSettings />
        </Grid>
        */}
      </Grid>
    </Box>
  );
}
