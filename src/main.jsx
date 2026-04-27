import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";
import { theme } from "./theme.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AppointmentsProvider } from "./context/AppointmentsContext.jsx";
import { PatientsProvider } from "./context/PatientsContext.jsx";
import { BillingProvider } from "./context/BillingContext.jsx";
import App from "./App.jsx";
import "./index.css";

const cacheRtl = createCache({
  key: "muirtl",
  stylisPlugins: [rtlPlugin],
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AuthProvider>
            <AppointmentsProvider>
              <PatientsProvider>
                <BillingProvider>
                  <App />
                </BillingProvider>
              </PatientsProvider>
            </AppointmentsProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </CacheProvider>
  </StrictMode>
);
