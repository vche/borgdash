import * as React from "react";
import LinearProgress from "@mui/material/LinearProgress";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import type { Metadata, Viewport } from "next";
import { geistSans, geistMono, roboto } from "@/lib/font";
import CssBaseline from "@mui/material/CssBaseline";
import BorgdashLayout from "@/components/dashboard_layout";
import { load_report_data } from "@/lib/report";

export const metadata: Metadata = {
  title: "Borgdash",
  description: "Bord backup monitor",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const report_data = await load_report_data();
  return (
    <html lang="en">
      <head></head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable}`}
      >
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <CssBaseline />
          <React.Suspense fallback={<LinearProgress />}>
            <BorgdashLayout reportdata={report_data}>{children}</BorgdashLayout>
          </React.Suspense>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
