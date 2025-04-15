import * as React from "react";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { PageContainer } from "@toolpad/core/PageContainer";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MasterKeyProvider } from "./contexts/MasterKeyContext";
import { TrustedRedirectionProvider } from "./contexts/TrsutedRedirectionContext";

export default async function DashboardPagesLayout(props: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/role");
  }

  if(!session.isTwoFactorEnabled || !session.isSession2FA) {
    redirect("/auth/2FA");
  }

  if (!session.emailVerified) {
    redirect(`/auth/verify-email`);
  }

  if (session.redirectToFirstSignin) {
    redirect(`/auth/firstSignin`);
  }

  

  return (
    <TrustedRedirectionProvider>
      <MasterKeyProvider>
        <DashboardLayout>
          <PageContainer>{props.children}</PageContainer>
        </DashboardLayout>
      </MasterKeyProvider>
    </TrustedRedirectionProvider>
  );
}