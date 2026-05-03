/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react";
import { DOCTORS } from "../data/mock.js";
import { buildInitialProcedures, validateProcedurePayload } from "../services/proceduresAdapter.js";

const ProceduresContext = createContext(null);

export function ProceduresProvider({ children }) {
  const [procedures, setProcedures] = useState(() => buildInitialProcedures(DOCTORS));

  const createProcedure = (doctorId, payload) => {
    const err = validateProcedurePayload(payload);
    if (err) return { ok: false, message: err };
    const next = {
      id: `PR-${Date.now()}`,
      doctorId,
      name: String(payload.name || "").trim(),
      price: Number(payload.price),
      duration: Number(payload.duration),
      category: String(payload.category || "general").trim(),
      aliases: String(payload.aliases || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      active: payload.active ?? true,
    };
    setProcedures((prev) => [next, ...prev]);
    return { ok: true, procedure: next };
  };

  const updateProcedure = (id, patch) => {
    const current = procedures.find((p) => p.id === id);
    if (!current) return { ok: false, message: "الإجراء غير موجود" };
    const merged = { ...current, ...patch };
    const err = validateProcedurePayload(merged);
    if (err) return { ok: false, message: err };
    setProcedures((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...patch,
              price: Number(patch.price ?? p.price),
              duration: Number(patch.duration ?? p.duration),
            }
          : p
      )
    );
    return { ok: true };
  };

  const deleteProcedure = (id) => {
    setProcedures((prev) => prev.filter((p) => p.id !== id));
  };

  const getProceduresByDoctor = (doctorId, includeInactive = false) =>
    procedures.filter((p) => p.doctorId === doctorId && (includeInactive || p.active));

  const value = useMemo(
    () => ({
      procedures,
      createProcedure,
      updateProcedure,
      deleteProcedure,
      getProceduresByDoctor,
    }),
    [procedures]
  );

  return <ProceduresContext.Provider value={value}>{children}</ProceduresContext.Provider>;
}

export function useProcedures() {
  const ctx = useContext(ProceduresContext);
  if (!ctx) throw new Error("useProcedures must be used within ProceduresProvider");
  return ctx;
}
