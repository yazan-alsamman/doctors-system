import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { APPOINTMENTS, DOCTORS } from "../data/mock.js";

const AppointmentsContext = createContext(null);

export function AppointmentsProvider({ children }) {
  const [items, setItems] = useState(APPOINTMENTS);
  const [toast, setToast] = useState(null);

  const addAppointment = useCallback((appt) => {
    const id = `A-${Date.now()}`;
    const doctor = DOCTORS.find((d) => d.id === appt.doctor) || DOCTORS[0];
    const next = {
      id,
      day: Number(appt.day),
      start: Number(appt.start),
      duration: Number(appt.duration),
      patient: appt.patient,
      reason: appt.reason,
      doctor: appt.doctor,
      color: doctor.color,
      urgent: !!appt.urgent,
    };
    setItems((arr) => [...arr, next]);
    setToast({ message: "تم إنشاء الحجز بنجاح", id: Date.now() });
    setTimeout(() => setToast(null), 2600);
    return next;
  }, []);

  const value = useMemo(() => ({ items, addAppointment, toast }), [items, addAppointment, toast]);

  return <AppointmentsContext.Provider value={value}>{children}</AppointmentsContext.Provider>;
}

export function useAppointments() {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error("useAppointments must be used within AppointmentsProvider");
  return ctx;
}
