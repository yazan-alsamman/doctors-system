import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Appointments from "./pages/Appointments.jsx";
import Patients from "./pages/Patients.jsx";
import PatientDetail from "./pages/PatientDetail.jsx";
import Billing from "./pages/Billing.jsx";
import Inventory from "./pages/Inventory.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import NotAllowed from "./pages/NotAllowed.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function Protected({ allow, children }) {
  const { can } = useAuth();
  return can(allow) ? children : <Navigate to="/not-allowed" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/appointments"
          element={
            <Protected allow="appointments.view">
              <Appointments />
            </Protected>
          }
        />
        <Route
          path="/patients"
          element={
            <Protected allow="patients.view">
              <Patients />
            </Protected>
          }
        />
        <Route
          path="/patients/:id"
          element={
            <Protected allow="patients.view">
              <PatientDetail />
            </Protected>
          }
        />
        <Route
          path="/billing"
          element={
            <Protected allow="billing.view">
              <Billing />
            </Protected>
          }
        />
        <Route
          path="/inventory"
          element={
            <Protected allow="inventory">
              <Inventory />
            </Protected>
          }
        />
        <Route
          path="/reports"
          element={
            <Protected allow="reports">
              <Reports />
            </Protected>
          }
        />
        <Route
          path="/settings"
          element={
            <Protected allow="settings">
              <Settings />
            </Protected>
          }
        />
        <Route path="/not-allowed" element={<NotAllowed />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
