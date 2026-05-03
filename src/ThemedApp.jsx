import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { createAppTheme } from "./theme.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import { UsersProvider } from "./context/UsersContext.jsx";
import { ProceduresProvider } from "./context/ProceduresContext.jsx";
import { AppointmentsProvider } from "./context/AppointmentsContext.jsx";
import { PatientsProvider } from "./context/PatientsContext.jsx";
import { BillingProvider } from "./context/BillingContext.jsx";
import { useThemeMode } from "./context/ThemeModeContext.jsx";
import App from "./App.jsx";

export default function ThemedApp() {
  const { darkMode } = useThemeMode();
  const theme = createAppTheme(darkMode ? "dark" : "light");

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <UsersProvider>
          <ProceduresProvider>
            <AuthProvider>
              <BillingProvider>
                <AppointmentsProvider>
                  <PatientsProvider>
                    <App />
                  </PatientsProvider>
                </AppointmentsProvider>
              </BillingProvider>
            </AuthProvider>
          </ProceduresProvider>
        </UsersProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
