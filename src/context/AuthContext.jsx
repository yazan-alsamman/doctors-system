/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react";
import { useUsers } from "./UsersContext.jsx";
import { loginWithLocalUsers } from "../services/authAdapter.js";

export const ROLES = {
  RECEPTIONIST: "receptionist",
  DOCTOR: "doctor",
  ADMIN: "admin",
};

export const ROLE_LABEL_AR = {
  [ROLES.RECEPTIONIST]: "موظف الاستقبال",
  [ROLES.DOCTOR]: "طبيب",
  [ROLES.ADMIN]: "مدير النظام",
};

const PERMS = {
  [ROLES.RECEPTIONIST]: {
    dashboard: true,
    appointments: { view: true, create: true, edit: true },
    patients: { view: true, create: true, edit: true, notes: false },
    billing: { view: true, create: true, reports: false },
    inventory: false,
    reports: false,
    settings: false,
    procedures: { view: false, manage: false },
    users: { manage: false },
    aiBooking: true,
  },
  [ROLES.DOCTOR]: {
    dashboard: true,
    appointments: { view: true, create: false, edit: false },
    patients: { view: true, create: false, edit: false, notes: true },
    billing: false,
    inventory: false,
    reports: false,
    settings: false,
    procedures: { view: true, manage: true },
    users: { manage: false },
    aiBooking: false,
  },
  [ROLES.ADMIN]: {
    dashboard: true,
    appointments: { view: true, create: true, edit: true },
    patients: { view: true, create: true, edit: true, notes: true },
    billing: { view: true, create: true, reports: true },
    inventory: true,
    reports: true,
    settings: true,
    procedures: { view: true, manage: false },
    users: { manage: true },
    aiBooking: true,
  },
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { users } = useUsers();
  const [sessionUserId, setSessionUserId] = useState(() => {
    const admin = users.find((u) => u.role === ROLES.ADMIN && u.active);
    return admin?.id || users[0]?.id || null;
  });

  const user = users.find((u) => u.id === sessionUserId && u.active) || users.find((u) => u.active) || null;
  const role = user?.role || ROLES.RECEPTIONIST;
  const perms = PERMS[role] || {};

  const setRole = (nextRole) => {
    const candidate = users.find((u) => u.active && u.role === nextRole);
    if (candidate) setSessionUserId(candidate.id);
  };

  const login = (credentials) => {
    const result = loginWithLocalUsers(users, credentials);
    if (result.ok) {
      setSessionUserId(result.userId);
    }
    return result;
  };

  const logout = () => {
    setSessionUserId(null);
  };

  const value = useMemo(
    () => ({
      role,
      setRole,
      user:
        user || {
          name: "زائر",
          title: "بدون جلسة",
          initials: "ز",
          role: ROLES.RECEPTIONIST,
        },
      perms,
      isAuthenticated: Boolean(user),
      login,
      logout,
      can: (path) => {
        const parts = path.split(".");
        let cur = perms;
        for (const p of parts) {
          if (cur == null) return false;
          if (typeof cur === "boolean") return cur;
          cur = cur[p];
        }
        return Boolean(cur);
      },
    }),
    [role, user, perms]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
