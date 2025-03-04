import * as React from "react";
import LinearProgress from "@mui/material/LinearProgress";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import type { Metadata, Viewport } from "next";
import { geistSans, geistMono, roboto } from "@/lib/font";
import CssBaseline from "@mui/material/CssBaseline";
import ModeSwitcher from "@/components/mode_switch";
import { NextAppProvider } from "@toolpad/core/nextjs";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { PageContainer } from "@toolpad/core/PageContainer";
import borgdash_theme from "@/lib/theme";
import {
  BORGDASH_NAVIGATION,
  BORGDASH_BRANDING,
} from "@/components/dashboard_layout";

export const metadata: Metadata = {
  title: "Borgdash",
  description: "Bord backup monitor",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head></head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable}`}
      >
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <CssBaseline />
          <React.Suspense fallback={<LinearProgress />}>
            <NextAppProvider
              navigation={BORGDASH_NAVIGATION}
              theme={borgdash_theme}
              branding={BORGDASH_BRANDING}
            >
              <DashboardLayout
                slots={{
                  toolbarActions: ModeSwitcher,
                }}
              >
                <PageContainer>{children}</PageContainer>
              </DashboardLayout>
            </NextAppProvider>
          </React.Suspense>
          );
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
