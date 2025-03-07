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

export function ModeSwitcher() {
  const { mode, setMode } = useColorScheme();

  const handleThemeChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setMode(event.target.value as "light" | "dark" | "system");
    },
    [setMode],
  );

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<HTMLElement | null>(
    null,
  );

  const toggleMenu = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setMenuAnchorEl(isMenuOpen ? null : event.currentTarget);
      setIsMenuOpen((previousIsMenuOpen) => !previousIsMenuOpen);
    },
    [isMenuOpen],
  );

  if (!mode) {
    return null;
  }

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

export function RescanRepo() {
  return (
    <Tooltip title="Rescan the repositories (long operation)" enterDelay={1000}>
      <div>
        <IconButton type="button" aria-label="rescan">
          <TroubleshootIcon />
        </IconButton>
      </div>
    </Tooltip>
  )
}

async function reload_reports() {
  const response = await fetch("/api/reload");
  return await response.json()
}

export function ReloadRepoData() {
  const reload = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      reload_reports().then((report_data) => {
        console.log("pipo prout")
        console.log(report_data);
        // use the provided setter from the layout to reload all pages...
      }).catch((error) => {
        console.log(error);
      });
    },
    [],
  );

  return (
    <Tooltip title="Reload the repository data" enterDelay={1000}>
      <div>
        <IconButton type="button" aria-label="reload" onClick={reload}>
          <RefreshIcon />
        </IconButton>
      </div>
    </Tooltip>
  )
}

export default function ToolbarActions() {
  return (
    <Stack direction="row">
      <ReloadRepoData />
      <RescanRepo />
      <ModeSwitcher />
    </Stack>
  )
}
