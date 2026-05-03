import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { APPOINTMENTS, DOCTORS, PATIENTS } from "../data/mock.js";
import { useBilling } from "./BillingContext.jsx";
import { getServiceByName } from "../data/services.js";
import { useProcedures } from "./ProceduresContext.jsx";

const AppointmentsContext = createContext(null);
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const DEFAULT_NO_SHOW_DELAY_MINUTES = 25;


function getAppointmentDate(day, start) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() - now.getDay()); // Sunday start

  const target = new Date(weekStart);
  target.setDate(weekStart.getDate() + Number(day || 0));

  const hour = Math.floor(Number(start || 0));
  const minutes = Math.round((Number(start || 0) - hour) * 60);
  target.setHours(hour, minutes, 0, 0);
  return target;
}

function normalizeReason(reason, procedures, doctorId) {
  return getServiceByName(reason, { procedures, doctorId }).name;
}

function resolveDuration(appt, procedures) {
  if (Number(appt.duration) > 0) return Number(appt.duration);
  const visitType = (appt.visitType || appt.reason || "").trim();
  const resolved = getServiceByName(visitType, { procedures, doctorId: appt.doctor });
  if (visitType && Number(resolved?.duration) > 0) return Number(resolved.duration);
  const doctor = DOCTORS.find((d) => d.id === appt.doctor);
  if (doctor?.defaultDuration) return doctor.defaultDuration;
  return 1;
}

function overlaps(a, b) {
  const aStart = Number(a.start);
  const aEnd = aStart + Number(a.duration);
  const bStart = Number(b.start);
  const bEnd = bStart + Number(b.duration);
  return aStart < bEnd && bStart < aEnd;
}

function findConflicts(items, candidate, ignoreId = null) {
  return items.filter((item) => {
    if (ignoreId && item.id === ignoreId) return false;
    if (item.day !== candidate.day) return false;
    if (item.doctor !== candidate.doctor) return false;
    if (item.status === "cancelled") return false;
    return overlaps(item, candidate);
  });
}

function findNearestAvailableStart(items, candidate) {
  const step = 0.5;
  let pointer = Math.max(8, Number(candidate.start));
  const lastStart = 16;
  while (pointer <= lastStart) {
    const nextCandidate = { ...candidate, start: pointer };
    if (findConflicts(items, nextCandidate).length === 0) return pointer;
    pointer = Number((pointer + step).toFixed(1));
  }
  return null;
}

function normalizeAppointment(appt, procedures) {
  const doctor = DOCTORS.find((d) => d.id === appt.doctor) || DOCTORS[0];
  const service = getServiceByName(appt.treatmentName || appt.visitType || appt.reason, {
    procedures,
    doctorId: appt.doctor || doctor.id,
  });
  return {
    ...appt,
    doctor: appt.doctor || doctor.id,
    color: appt.color || doctor.color,
    visitType: appt.visitType || normalizeReason(appt.reason, procedures, appt.doctor || doctor.id),
    duration: resolveDuration(appt, procedures),
    status: appt.status || "scheduled",
    treatmentName: appt.treatmentName || service.name,
    treatmentPrice: Number(appt.treatmentPrice) > 0 ? Number(appt.treatmentPrice) : service.price,
    priceConfirmed: !!appt.priceConfirmed,
    handoffReady: !!appt.handoffReady,
    overbooked: !!appt.overbooked,
    reminderStatus: appt.reminderStatus || "idle",
    reminderWindow: appt.reminderWindow || "2h",
    reminderText: appt.reminderText || "",
  };
}

export function AppointmentsProvider({ children }) {
  const { procedures } = useProcedures();
  const [items, setItems] = useState(() => APPOINTMENTS.map((appt) => normalizeAppointment(appt, [])));
  const [toast, setToast] = useState(null);
  const [noShowDelayMinutes] = useState(DEFAULT_NO_SHOW_DELAY_MINUTES);
  const { ensureDraftInvoiceForAppointment, updateInvoice, invoices } = useBilling();

  const showToast = useCallback((message) => {
    setToast({ message, id: Date.now() });
    setTimeout(() => setToast(null), 2600);
  }, []);

  const createDraftInvoiceForAppointment = useCallback(
    (appointment) => {
      const service = getServiceByName(appointment.treatmentName || appointment.visitType || appointment.reason, {
        procedures,
        doctorId: appointment.doctor,
      });
      const patient = PATIENTS.find((p) => p.name === appointment.patient);
      return ensureDraftInvoiceForAppointment({
        appointmentId: appointment.id,
        patient: appointment.patient,
        patientId: patient?.id || null,
        services: [{ name: service.name, price: service.price, qty: 1 }],
        amount: Number(appointment.treatmentPrice) > 0 ? Number(appointment.treatmentPrice) : service.price,
      });
    },
    [ensureDraftInvoiceForAppointment, procedures]
  );

  const addAppointment = useCallback((appt, options = {}) => {
    const duration = resolveDuration(appt, procedures);
    const id = `A-${Date.now()}`;
    const doctor = DOCTORS.find((d) => d.id === appt.doctor) || DOCTORS[0];
    const selectedService = getServiceByName(appt.visitType || appt.reason, {
      procedures,
      doctorId: appt.doctor || doctor.id,
    });
    const base = {
      day: Number(appt.day),
      start: Number(appt.start),
      duration,
      patient: appt.patient,
      reason: normalizeReason(appt.reason, procedures, appt.doctor || doctor.id),
      visitType: appt.visitType || normalizeReason(appt.reason, procedures, appt.doctor || doctor.id),
      treatmentName: selectedService.name,
      treatmentPrice: selectedService.price,
      priceConfirmed: false,
      handoffReady: false,
      doctor: appt.doctor,
      color: doctor.color,
      urgent: !!appt.urgent,
      status: appt.status || "scheduled",
      overbooked: false,
      reminderStatus: "idle",
      reminderWindow: appt.reminderWindow || "2h",
      reminderText: appt.reminderText || "",
    };
    const conflicts = findConflicts(items, base);
    const nearestStart = findNearestAvailableStart(items, base);
    if (conflicts.length && !options.allowOverride) {
      return {
        ok: false,
        code: "CONFLICT",
        conflicts,
        suggestedStart: nearestStart,
      };
    }

    const sameSlotOverbookCount = conflicts.filter(
      (c) => !!c.overbooked && Number(c.start) === Number(base.start)
    ).length;
    if (conflicts.length && options.allowOverride && sameSlotOverbookCount > 0 && !options.confirmRepeatedOverbook) {
      return {
        ok: false,
        code: "REQUIRES_REPEAT_CONFIRMATION",
        conflicts,
        suggestedStart: nearestStart,
      };
    }

    const next = normalizeAppointment({ id, ...base, overbooked: conflicts.length > 0 }, procedures);
    setItems((arr) => [...arr, next]);
    showToast(conflicts.length ? "تم الحجز كـ Overbooking بعد التأكيد" : "تم إنشاء الحجز بنجاح");
    return { ok: true, appointment: next, conflicts, suggestedStart: nearestStart };
  }, [items, procedures, showToast]);

  const updateAppointment = useCallback((id, patch) => {
    setItems((arr) =>
      arr.map((a) => (a.id === id ? normalizeAppointment({ ...a, ...patch }, procedures) : a))
    );
  }, [procedures]);

  const setAppointmentStatus = useCallback((id, status) => {
    let nextAppointment = null;
    setItems((arr) =>
      arr.map((a) => {
        if (a.id !== id) return a;
        nextAppointment = { ...a, status };
        return nextAppointment;
      })
    );

    if (status === "completed" && nextAppointment) {
      createDraftInvoiceForAppointment(nextAppointment);
      showToast("تم إنهاء المعاينة وإنشاء فاتورة غير مدفوعة");
    }

    if (status === "paid") {
      let linked = invoices.find((inv) => inv.appointmentId === id);
      if (!linked && nextAppointment) {
        linked = createDraftInvoiceForAppointment(nextAppointment);
      }
      if (linked && linked.status !== "paid") {
        updateInvoice(linked.id, { status: "paid" });
      }
      showToast("تم تسجيل الدفع");
    }
  }, [createDraftInvoiceForAppointment, invoices, showToast, updateInvoice]);

  const confirmDoctorSession = useCallback((id, payload) => {
    let updated = null;
    setItems((arr) =>
      arr.map((a) => {
        if (a.id !== id) return a;
        updated = normalizeAppointment({
          ...a,
          treatmentName: payload.treatmentName || a.treatmentName || a.visitType || a.reason,
          treatmentPrice: Number(payload.treatmentPrice) || a.treatmentPrice || 0,
          priceConfirmed: true,
          handoffReady: true,
          status: "completed",
        }, procedures);
        return updated;
      })
    );
    if (!updated) return;

    const services = [{ name: updated.treatmentName, price: Number(updated.treatmentPrice) || 0, qty: 1 }];
    const linked = invoices.find((inv) => inv.appointmentId === id);
    if (linked) {
      const paidAmount = Number(linked.paidAmount) || 0;
      const amount = Number(updated.treatmentPrice) || 0;
      const status = paidAmount >= amount ? "paid" : paidAmount > 0 ? "partial" : "unpaid";
      updateInvoice(linked.id, { services, amount, status });
    } else {
      createDraftInvoiceForAppointment(updated);
    }
    showToast("تم اعتماد العلاج والسعر وتحويل الحالة للاستقبال");
  }, [createDraftInvoiceForAppointment, invoices, procedures, showToast, updateInvoice]);

  const advanceAppointment = useCallback((id) => {
    const appt = items.find((item) => item.id === id);
    if (!appt) return;
    const flow = {
      scheduled: "confirmed",
      confirmed: "arrived",
      arrived: "in_consultation",
      in_consultation: "completed",
      completed: "paid",
    };
    const next = flow[appt.status];
    if (!next) return;
    setAppointmentStatus(id, next);
  }, [items, setAppointmentStatus]);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      setItems((arr) => arr.map((appt) => normalizeAppointment(appt, procedures)));
    });
    return () => window.cancelAnimationFrame(raf);
  }, [procedures]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setItems((arr) =>
        arr.map((appt) => {
          if (appt.status !== "confirmed") return appt;
          const apptDate = getAppointmentDate(appt.day, appt.start);
          if (apptDate.getTime() > now.getTime()) return appt; // future safeguard
          const cutoff = new Date(apptDate.getTime() + noShowDelayMinutes * 60 * 1000);
          if (now.getTime() < cutoff.getTime()) return appt;
          return normalizeAppointment({ ...appt, status: "no_show" }, procedures);
        })
      );
    }, FIVE_MINUTES_MS);
    return () => clearInterval(timer);
  }, [noShowDelayMinutes, procedures]);

  const getConflictsForDraft = useCallback((draft, ignoreId = null) => {
    const candidate = {
      ...draft,
      day: Number(draft.day),
      start: Number(draft.start),
      duration: resolveDuration(draft, procedures),
    };
    const conflicts = findConflicts(items, candidate, ignoreId);
    return {
      conflicts,
      suggestedStart: findNearestAvailableStart(items, candidate),
      duration: candidate.duration,
    };
  }, [items, procedures]);

  const setReminderStatus = useCallback((id, status, patch = {}) => {
    setItems((arr) =>
      arr.map((a) =>
        a.id === id ? normalizeAppointment({ ...a, reminderStatus: status, ...patch }, procedures) : a
      )
    );
  }, [procedures]);

  const bulkUpdateStatus = useCallback((ids, status) => {
    setItems((arr) =>
      arr.map((a) => (ids.includes(a.id) ? normalizeAppointment({ ...a, status }, procedures) : a))
    );
  }, [procedures]);

  const deleteAppointment = useCallback((id) => {
    setItems((arr) => arr.filter((a) => a.id !== id));
    showToast("تم حذف الموعد");
  }, [showToast]);

  const value = useMemo(
    () => ({
      items,
      addAppointment,
      updateAppointment,
      setAppointmentStatus,
      confirmDoctorSession,
      advanceAppointment,
      getConflictsForDraft,
      setReminderStatus,
      bulkUpdateStatus,
      deleteAppointment,
      noShowDelayMinutes,
      toast,
    }),
    [
      items,
      addAppointment,
      updateAppointment,
      setAppointmentStatus,
      confirmDoctorSession,
      advanceAppointment,
      getConflictsForDraft,
      setReminderStatus,
      bulkUpdateStatus,
      deleteAppointment,
      noShowDelayMinutes,
      toast,
    ]
  );

  return <AppointmentsContext.Provider value={value}>{children}</AppointmentsContext.Provider>;
}

export function useAppointments() {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error("useAppointments must be used within AppointmentsProvider");
  return ctx;
}
