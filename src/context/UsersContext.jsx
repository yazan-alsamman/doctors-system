/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react";
import { buildInitialUsers, normalizeInitials, validateUserPayload } from "../services/usersAdapter.js";

const UsersContext = createContext(null);

export function UsersProvider({ children }) {
  const [users, setUsers] = useState(buildInitialUsers);

  const createUser = (payload) => {
    const validationError = validateUserPayload(users, payload);
    if (validationError) return { ok: false, message: validationError };

    const role = payload.role;
    const next = {
      id: `U-${Date.now()}`,
      role,
      name: String(payload.name || "").trim(),
      title: String(payload.title || "").trim() || (role === "doctor" ? "طبيب" : "موظف استقبال"),
      initials: normalizeInitials(payload.name),
      username: String(payload.username || "").trim(),
      email: String(payload.email || "").trim(),
      active: true,
      tempPassword: String(payload.tempPassword || "").trim() || "123456",
      doctorId: role === "doctor" ? String(payload.doctorId || "").trim() || null : null,
    };
    setUsers((prev) => [next, ...prev]);
    return { ok: true, user: next };
  };

  const updateUser = (id, patch) => {
    const current = users.find((u) => u.id === id);
    if (!current) return { ok: false, message: "الحساب غير موجود" };
    const merged = { ...current, ...patch };
    const validationError = validateUserPayload(users, merged, id);
    if (validationError) return { ok: false, message: validationError };

    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              ...patch,
              initials: normalizeInitials(patch.name ?? u.name),
              doctorId:
                (patch.role ?? u.role) === "doctor"
                  ? String(patch.doctorId ?? u.doctorId ?? "").trim() || null
                  : null,
            }
          : u
      )
    );
    return { ok: true };
  };

  const toggleUserActive = (id) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));
  };

  const value = useMemo(
    () => ({ users, createUser, updateUser, toggleUserActive }),
    [users]
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers must be used within UsersProvider");
  return ctx;
}
