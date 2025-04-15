// /app/(dashboard)/police/page.tsx
import * as React from "react";
import { redirect } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { headers } from "next/headers";
import { auth } from "../../../auth";
import PoliceVideoBrowserComponent from "../components/police/PoliceVideoBrowserComponent";

export default async function PolicePage() {
  const session = await auth();
  const currentUrl =
    (await headers()).get("referer") ||
    process.env.AUTH_URL ||
    "http://localhost:3000";

  if (!session) {
    // Get the current URL to redirect to signIn with `callbackUrl`
    const redirectUrl = new URL("/auth/signin", currentUrl);
    redirectUrl.searchParams.set("callbackUrl", currentUrl);

    redirect(redirectUrl.toString());
  }
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <PoliceVideoBrowserComponent />
    </Box>
  );
}
