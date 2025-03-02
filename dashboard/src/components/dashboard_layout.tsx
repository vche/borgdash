import DashboardIcon from "@mui/icons-material/Dashboard";
import BackupTableIcon from "@mui/icons-material/BackupTable";
import SettingsIcon from "@mui/icons-material/Settings";
import BackupIcon from "@mui/icons-material/Backup";
import { type Navigation, Branding } from "@toolpad/core/AppProvider";
import Chip from "@mui/material/Chip";
import Image from "next/image";
import borgLogo from "../../public/borg.svg";

export const BORGDASH_NAVIGATION: Navigation = [
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
    action: (
      <>
        <Chip label={12} color="success" size="small" />
        <Chip label={1} color="error" size="small" />
      </>
    ),
    children: [
      {
        segment: "repo1",
        title: "repo1",
        icon: <BackupIcon />,
      },
      {
        segment: "repo2",
        title: "repo2",
        icon: <BackupIcon />,
      },
    ],
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
