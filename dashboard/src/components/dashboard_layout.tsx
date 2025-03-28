"use client";
import * as React from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BackupTableIcon from "@mui/icons-material/BackupTable";
import SettingsIcon from "@mui/icons-material/Settings";
import HelpIcon from '@mui/icons-material/Help';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { type Navigation, NavigationPageItem, NavigationSubheaderItem, Branding } from "@toolpad/core/AppProvider";
import { PageContainer } from "@toolpad/core/PageContainer";
import Chip from "@mui/material/Chip";
import Image from "next/image";
import borgLogo from "../../public/borg.svg";
import borgdash_theme from "@/lib/theme";
import { datetime_iso_to_short } from "@/lib/utils";
import type { tBorgReport } from "@/lib/report";
import { NextAppProvider } from "@toolpad/core/nextjs";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import ToolbarActions from "@/components/toolbar_actions";


export type tReportContextData = [tBorgReport, React.Dispatch<tBorgReport>?];
export type tReportContext = React.Context<tReportContextData>;

const defaultContext: tReportContextData = [undefined, undefined];
export const ReportContext: tReportContext = React.createContext(defaultContext);

const BORGDASH_NAVIGATION: Navigation = [
  {
    kind: "header",
    title: "Backups",
  },
  {
    segment: "/",
    title: "Dashboard",
    icon: <DashboardIcon />,
  },
  {
    segment: "repos",
    title: "Repositories",
    icon: <BackupTableIcon />,
  },
  {
    kind: "divider",
  },
  {
    kind: "header",
    title: "Settings",
  },
  {
    segment: "reporterconfig",
    title: "Reporter Configuration",
    icon: <SettingsIcon />,
  },
];

export const BORGDASH_BRANDING: Branding = {
  logo: <Image src={borgLogo} height={30} alt="Borg backup logo" />,
  title: "dashboard",
  homeUrl: "/",
};

// Return status count of each report: [successes, errors, unkown]
export function get_repos_statuses(report: tBorgReport) {
  const statuses = [0, 0, 0];
  if (report && report.repos) {
    Object.values(report.repos).map((repo) => {
      if (repo.status == null) statuses[2]++;
      else if (repo.status) statuses[0]++;
      else statuses[1]++;
    });
  }
  return statuses;
}

// Update the default navigation menu with dynamic data from the report
export function getNavigationConfig(report_data: tBorgReport) {
  const statuses = get_repos_statuses(report_data);
  if (report_data) {
    // Update backup header with refresh time
    const backup_header: NavigationSubheaderItem = {
      kind: "header",
      title: `Backups (last refresh ${datetime_iso_to_short(report_data.timestamp)})`,
    }
    // Build the repo section and add item for each repo
    const repo_page_item: NavigationPageItem = {
      segment: "repos",
      title: "Repositories",
      icon: <BackupTableIcon />,
      action: (
        <>
          {statuses[0] > 0 && <Chip label={statuses[0]} color="success" size="small" sx={{ mr: 1 }} />}
          {statuses[1] > 0 && <Chip label={statuses[1]} color="error" size="small" sx={{ mr: 1 }} />}
          {statuses[1] > 0 && <Chip label={statuses[2]} color="primary" size="small" />}
        </>
      ),
      children: [],
    };
    const children: Navigation = []
    Object.values(report_data.repos ?? {}).map((repo) => {
      children.push({
        segment: repo.name,
        title: repo.name,
        icon: <>{repo.status == null ? <HelpIcon /> : repo.status ? <CheckCircleIcon /> : <ErrorIcon />
        }</>
      })
    });
    repo_page_item.children = children;
    BORGDASH_NAVIGATION[0] = backup_header;
    BORGDASH_NAVIGATION[2] = repo_page_item;
  }
  return BORGDASH_NAVIGATION;
}

export default function BorgdashLayout({ reportdata, children }: Readonly<{ reportdata: tBorgReport, children: React.ReactNode }>) {
  const reportState = React.useState<tBorgReport>(reportdata);
  return (
    <NextAppProvider
      navigation={getNavigationConfig(reportState[0])}
      theme={borgdash_theme}
      branding={BORGDASH_BRANDING}
    >
      <ReportContext value={reportState}>
        <DashboardLayout
          slots={{
            toolbarActions: ToolbarActions,
          }}
        >
          <PageContainer>{children}</PageContainer>
        </DashboardLayout>
      </ReportContext>
    </NextAppProvider>
  )
}
