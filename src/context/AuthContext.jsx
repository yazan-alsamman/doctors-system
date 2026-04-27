import { createContext, useContext, useMemo, useState } from "react";

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

const PROFILES = {
  receptionist: {
    name: "نورة الشهري",
    title: "موظفة استقبال",
    initials: "نش",
    role: ROLES.RECEPTIONIST,
  },
  doctor: {
    name: "د. أحمد المنصور",
    title: "طبيب باطنية",
    initials: "أم",
    role: ROLES.DOCTOR,
    doctorId: "D1",
  },
  admin: {
    name: "د. هدى الفهد",
    title: "المديرة الطبية",
    initials: "هف",
    role: ROLES.ADMIN,
  },
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
    aiBooking: true,
  },
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Default to admin so all sections are visible on first load.
  const [role, setRole] = useState(ROLES.ADMIN);

  const value = useMemo(
    () => ({
      role,
      setRole,
      user: PROFILES[role],
      perms: PERMS[role],
      can: (path) => {
        const parts = path.split(".");
        let cur = PERMS[role];
        for (const p of parts) {
          if (cur == null) return false;
          if (typeof cur === "boolean") return cur;
          cur = cur[p];
        }
        return Boolean(cur);
      },
    }),
    [role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
