"use client";
import { createTheme } from "@mui/material/styles";

const borgdash_theme = createTheme({
  // cssVariables: {
  //   colorSchemeSelector: "data-toolpad-color-scheme",
  // },
  colorSchemes: { light: true, dark: true },
  typography: {
    fontFamily: "var(--font-roboto)",
  },
});

export default borgdash_theme;
