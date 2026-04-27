import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  direction: "rtl",
  palette: {
    mode: "light",
    primary: {
      main: "#005d90",
      light: "#0077b6",
      dark: "#004b74",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#126c40",
      light: "#a1f5bc",
      contrastText: "#ffffff",
    },
    error: { main: "#ba1a1a", light: "#ffdad6" },
    warning: { main: "#c2780b", light: "#ffe2bf" },
    background: { default: "#f7f9fb", paper: "#ffffff" },
    text: { primary: "#191c1e", secondary: "#404850" },
    divider: "#e0e3e5",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'IBM Plex Sans Arabic', 'Inter', ui-sans-serif, system-ui, sans-serif",
    h1: { fontFamily: "'Cairo', sans-serif", fontWeight: 700 },
    h2: { fontFamily: "'Cairo', sans-serif", fontWeight: 700 },
    h3: { fontFamily: "'Cairo', sans-serif", fontWeight: 700 },
    h4: { fontFamily: "'Cairo', sans-serif", fontWeight: 700 },
    h5: { fontFamily: "'Cairo', sans-serif", fontWeight: 600 },
    h6: { fontFamily: "'Cairo', sans-serif", fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, height: 44, paddingLeft: 18, paddingRight: 18 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { fontSize: 12, borderRadius: 8 } },
    },
  },
});
