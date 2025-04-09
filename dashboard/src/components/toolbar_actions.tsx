"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Button from '@mui/material/Button';
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
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from "@mui/material/Typography";
import TerminalIcon from '@mui/icons-material/Terminal';
import { DialogsProvider, useDialogs } from '@toolpad/core/useDialogs';

// Reload and extract report from file
async function reload_reports() {
  const response = await fetch("/api/reload");
  return await response.json()
}

// Reload and extract report from file
async function rescan_reports(scan = false, cancel = false) {
  const response = await fetch("/api/rescan", { method: scan ? "put" : (cancel ? "delete" : "get") });
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
  setLoader: React.Dispatch<React.SetStateAction<boolean>>,
  setContent: React.Dispatch<React.SetStateAction<string | null>>
) {
  setContent(`--------- Standard output ---------\n${rescan_response.stdout}\n\n--------- Error output ---------\n${rescan_response.stderr}`);

  if (rescan_response.status == "success") {
    setLoader(false);
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
        rescanStatusCheck(rescan_response, notify, reloadCallback, setLoader, setContent);
      });
    }, 3000);

    // Cleanup function to clear the timeout if the component unmounts
    return () => clearTimeout(timeoutId);
  }
}

export function RescanOutput({ isOpen, handleCloseAction, content }:
  {
    isOpen: boolean,
    handleCloseAction: () => void,
    content: string | null
  }
) {
  const dialogs = useDialogs();
  const cancelProcess = async () => {
    const confirmed = await dialogs.confirm('Abort the running rescan operation ?', {
      okText: 'Yes',
      cancelText: 'No',
    });
    if (confirmed) {
      await rescan_reports(false, true);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={handleCloseAction}
      scroll='paper'
      fullWidth
      maxWidth='lg'
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
    >
      <DialogTitle id="scroll-dialog-title" align="center">
        <Typography>Rescan process output</Typography>
      </DialogTitle>
      <DialogContent dividers={true}>
        <DialogContentText
          id="scroll-dialog-description"
          tabIndex={-1}
          sx={{ whiteSpace: "pre-wrap" }}
        >
          {content ? content : "No output, no scan ran yet."}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <DialogsProvider>
          <Button onClick={cancelProcess}>Cancel operation</Button>
        </DialogsProvider>
        <Button onClick={handleCloseAction}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export function RescanRepo({ reloadCallbackAction }: { reloadCallbackAction: () => void }) {
  const notifications = useNotifications();
  const [loader, setLoader] = React.useState(false);
  const [openOutput, setOpenOutput] = React.useState(false);
  const [content, setContent] = React.useState<string | null>(null);
  const rescan = React.useCallback(
    () => {
      console.log("Rescanning");
      rescan_reports(true).then((rescan_response) => {
        setLoader(true);
        notifications.show("Repo rescan started, it can take several minutes", { autoHideDuration: 3000 });
        rescanStatusCheck(rescan_response, notifications.show, reloadCallbackAction, setLoader, setContent);
      }).catch((error) => { console.log("Error, failed to rescan report: " + error); });
    },
    [reloadCallbackAction, notifications],
  );
  const handleOutputClose = () => { setOpenOutput(false); };

  return (
    <Tooltip title="Rescan the repositories (long operation)" enterDelay={1000}>
      <div>
        {loader ? (
          <CircularProgress size={20} />
        ) : (
          <IconButton type="button" aria-label="rescan" onClick={rescan}>
            <TroubleshootIcon />
          </IconButton>
        )}
        <IconButton type="button" aria-label="output" onClick={() => { setOpenOutput(true); }}>
          <TerminalIcon />
        </IconButton>
        <RescanOutput isOpen={openOutput} handleCloseAction={handleOutputClose} content={content} />
      </div>
    </Tooltip>
  )
}

// Component reloading data from file and refreshing the UI
export function ReloadRepoData({ reloadCallbackAction }: { reloadCallbackAction: () => void }) {
  return (
    <Tooltip title="Reload the repository data" enterDelay={1000}>
      <div>
        <IconButton type="button" aria-label="reload" onClick={reloadCallbackAction}>
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
      <ReloadRepoData reloadCallbackAction={reload} />
      <RescanRepo reloadCallbackAction={reload} />
      <ModeSwitcher />
    </Stack>
  )
}
