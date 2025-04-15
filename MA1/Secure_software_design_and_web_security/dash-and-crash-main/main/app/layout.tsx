import * as React from "react";
import { AppProvider } from "@toolpad/core/nextjs";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import SettingsIcon from "@mui/icons-material/Dashboard";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import FilterDramaIcon from "@mui/icons-material/FilterDrama";
import VideocamIcon from "@mui/icons-material/Videocam";
import { Navigation } from "@toolpad/core";
import { CertificateProvider } from "./(dashboard)/contexts/CertificateContext";
import { SessionProvider, signIn, signOut } from "next-auth/react";
import { auth } from "../auth";
import { VideoProvider } from "./(dashboard)/contexts/VideoContext";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import GoogleReCaptchaWrapper from "./wrapper/GoogleReCaptchaWrapper";

const USER_NAVIGATION: Navigation = [
  {
    kind: "header",
    title: "Dashcam",
  },
  {
    title: "Dashcam",
    icon: <VideocamIcon />,
  },
  {
    kind: "header",
    title: "Dashboard",
  },
  {
    segment: "account",
    title: "Account",
    icon: <ManageAccountsIcon />,
  },
  {
    segment: "preferences",
    title: "Preferences",
    icon: <SettingsIcon />,
  },
];

const TRUSTED_NAVIGATION: Navigation = [
  {
    kind: "header",
    title: "Dashboard",
  },
  {
    segment: "account",
    title: "Account",
    icon: <ManageAccountsIcon />,
  },
  {
    kind: "header",
    title: "Police Dashboard",
  },
  {
    segment: "police",
    title: "Police Dashboard",
    icon: <LocalPoliceIcon />,
  },
];

const BRANDING = {
  logo: <FilterDramaIcon fontSize="large" sx={{ color: "#1976d2" }} />,
  title: "Dash and Crash",
};

const AUTHENTICATION = {
  signIn,
  signOut,
};

export default async function RootLayout(props: { children: React.ReactNode }) {
  const session = await auth();
  const userRoles: string[] = Array.isArray(session?.role) ? session.role : [session?.role || ""];

  let filteredNavigation: Navigation = [];

  if (userRoles.includes("user")) {
    filteredNavigation = [...filteredNavigation, ...USER_NAVIGATION];
  }

  if (userRoles.includes("trusted")) {
    filteredNavigation = [...filteredNavigation, ...TRUSTED_NAVIGATION];
  }


  return (
    <html lang="en" data-toolpad-color-scheme="light" suppressHydrationWarning>
      <body>
        <SessionProvider session={session}>
          <CertificateProvider>
            <GoogleReCaptchaWrapper>
              <AppRouterCacheProvider options={{ enableCssLayer: true }}>
                <AppProvider
                  navigation={filteredNavigation}
                  branding={BRANDING}
                  session={session}
                  authentication={AUTHENTICATION}
                >
                  <VideoProvider>{props.children}</VideoProvider>
                </AppProvider>
              </AppRouterCacheProvider>
            </GoogleReCaptchaWrapper>
          </CertificateProvider>
        </SessionProvider>
      </body>
    </html>
  );
}