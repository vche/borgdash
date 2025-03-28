"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import { useColorScheme } from "@mui/material/styles";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import ContrastIcon from "@mui/icons-material/Contrast";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from '@mui/material/Stack';
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RefreshIcon from '@mui/icons-material/Refresh';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import { ReportContext } from "@/components/dashboard_layout"
import { ShowNotification, useNotifications } from '@toolpad/core/useNotifications';
import type { tRescanStatus } from "@/lib/rescan";
import CircularProgress from '@mui/material/CircularProgress';

// Reload and extract report from file
async function reload_reports() {
  const response = await fetch("/api/reload");
  return await response.json()
}

// Reload and extract report from file
async function rescan_reports(scan = false) {
  const response = await fetch("/api/rescan", { method: scan ? "put" : "get" });
  return await response.json()
}

// dark/light theme switcher component
export function ModeSwitcher() {
  const { mode, setMode } = useColorScheme();
  const handleThemeChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setMode(event.target.value as "light" | "dark" | "system");
    },
    [setMode],
  );
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<HTMLElement | null>(null,);
  const toggleMenu = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setMenuAnchorEl(isMenuOpen ? null : event.currentTarget);
      setIsMenuOpen((previousIsMenuOpen) => !previousIsMenuOpen);
    },
    [isMenuOpen],
  );

  if (!mode) { return null; }
  return (
    <React.Fragment>
      <Tooltip title="Theme settings" enterDelay={1000}>
        <div>
          <IconButton type="button" aria-label="settings" onClick={toggleMenu}>
            <ContrastIcon />
          </IconButton>
        </div>
      </Tooltip>
      <Popover
        open={isMenuOpen}
        anchorEl={menuAnchorEl}
        onClose={toggleMenu}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        disableAutoFocus
      >
        <Box sx={{ p: 2 }}>
          <FormControl>
            <FormLabel id="custom-theme-switcher-label">Theme</FormLabel>
            <RadioGroup
              aria-labelledby="custom-theme-switcher-label"
              defaultValue="system"
              name="custom-theme-switcher"
              onChange={handleThemeChange}
            >
              <FormControlLabel
                value="light"
                control={<Radio />}
                label="Light"
              />
              <FormControlLabel
                value="system"
                control={<Radio />}
                label="System"
              />
              <FormControlLabel value="dark" control={<Radio />} label="Dark" />
            </RadioGroup>
          </FormControl>
        </Box>
      </Popover>
    </React.Fragment>
  );
}

function rescanStatusCheck(
  rescan_response: tRescanStatus,
  notify: ShowNotification, reloadCallback: () => void,
  setLoader: React.Dispatch<React.SetStateAction<boolean>>
) {
  if (rescan_response.status == "success") {
    setLoader(false);
    console.log(rescan_response.stdout);
    notify("Repo rescan complete", { autoHideDuration: 3000 });
    reloadCallback();
  }
  else if (rescan_response.status == "error") {
    setLoader(false);
    notify("Error, failed to rescan report", { severity: "error", autoHideDuration: 3000 });
  }
  else if (rescan_response.status == "running") {
    const timeoutId = setTimeout(() => {
      console.log('Delayed message after 2 seconds!');
      rescan_reports().then((rescan_response) => {
        console.log(rescan_response.stdout);
        rescanStatusCheck(rescan_response, notify, reloadCallback, setLoader);
      });
    }, 3000);

    // Cleanup function to clear the timeout if the component unmounts
    return () => clearTimeout(timeoutId);
  }
}

export function RescanRepo({ reloadCallback }: { reloadCallback: () => void }) {
  const notifications = useNotifications();
  const [loader, setLoader] = React.useState(false);
  const rescan = React.useCallback(
    () => {
      console.log("Rescanning");
      rescan_reports(true).then((rescan_response) => {
        setLoader(true);
        notifications.show("Repo rescan started, it can take several minutes", { autoHideDuration: 3000 });
        rescanStatusCheck(rescan_response, notifications.show, reloadCallback, setLoader);
      }).catch((error) => { console.log("Error, failed to rescan report: " + error); });
    },
    [reloadCallback, notifications],
  );

  return (
    <Tooltip title="Rescan the repositories (long operation)" enterDelay={1000}>
      <div>
        {loader ? (
          <IconButton type="button" aria-label="rescan" onClick={() => { console.log("gnou") }}>
            <CircularProgress size={20} />
          </IconButton>
        ) : (
          <IconButton type="button" aria-label="rescan" onClick={rescan}>
            <TroubleshootIcon />
          </IconButton>
        )}
      </div>
    </Tooltip>
  )
}

// Component reloading data from file and refreshing the UI
export function ReloadRepoData({ reloadCallback }: { reloadCallback: () => void }) {
  return (
    <Tooltip title="Reload the repository data" enterDelay={1000}>
      <div>
        <IconButton type="button" aria-label="reload" onClick={reloadCallback}>
          <RefreshIcon />
        </IconButton>
      </div>
    </Tooltip>
  )
}

export default function ToolbarActions() {
  const notifications = useNotifications();
  const [, set_report_data] = React.useContext(ReportContext);
  const reload = React.useCallback(
    () => {
      reload_reports().then((report_response) => {
        if (set_report_data) {
          set_report_data(report_response.reportdata);
          notifications.show("Report data reloaded", { autoHideDuration: 3000 });
        }
        else { console.log("Error, report data context is not set"); }
      }).catch((error) => {
        console.log(`Error, failed to reload report: ${error}`);
        notifications.show(`Error, failed to reload report: ${error}`, { severity: "error", autoHideDuration: 3000 });
      });
    },
    [set_report_data, notifications],
  );

  return (
    <Stack direction="row">
      <ReloadRepoData reloadCallback={reload} />
      <RescanRepo reloadCallback={reload} />
      <ModeSwitcher />
    </Stack>
  )
}
