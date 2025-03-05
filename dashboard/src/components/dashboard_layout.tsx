import DashboardIcon from "@mui/icons-material/Dashboard";
import BackupTableIcon from "@mui/icons-material/BackupTable";
import SettingsIcon from "@mui/icons-material/Settings";
import HelpIcon from '@mui/icons-material/Help';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { type Navigation, NavigationPageItem, NavigationSubheaderItem, Branding } from "@toolpad/core/AppProvider";
import Chip from "@mui/material/Chip";
import Image from "next/image";
import borgLogo from "../../public/borg.svg";
import { load_report_data, get_repos_statuses } from "@/lib/report";
import { datetime_iso_to_short } from "@/lib/utils";

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

// <CheckCircleIcon color="success" fontSize="small" />

// Update the default navigation menu with dynamic data from the report
export async function getNavigationConfig() {
  const report_data = await load_report_data();
  const statuses = get_repos_statuses(report_data);
  if (report_data) {
    // Update backup header with refresh time
    const backup_header: NavigationSubheaderItem = {
      kind: "header",
      title: `Backups (refreshed on ${datetime_iso_to_short(report_data.timestamp)})`,
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
    report_data.repos?.map((repo) => {
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
