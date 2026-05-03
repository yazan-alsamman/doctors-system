import { createContext, useContext, useMemo, useState } from "react";
import { INVOICES } from "../data/mock.js";

const BillingContext = createContext(null);

function makeId() {
  return `INV-${new Date().getFullYear()}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;
}

export function BillingProvider({ children }) {
  const [invoices, setInvoices] = useState(INVOICES);

  const addInvoice = (payload) => {
    const newInvoice = {
      id: makeId(),
      patient: payload.patient,
      date: payload.date || "اليوم",
      amount: Number(payload.amount) || 0,
      status: payload.status || "due",
    };
    setInvoices((arr) => [newInvoice, ...arr]);
    return newInvoice;
  };

  const updateInvoice = (id, patch) => {
    setInvoices((arr) => arr.map((inv) => (inv.id === id ? { ...inv, ...patch } : inv)));
  };

  const ensureDraftInvoiceForAppointment = (payload) => {
    let created = null;
    setInvoices((arr) => {
      if (arr.some((inv) => inv.appointmentId === payload.appointmentId)) return arr;
      const services = Array.isArray(payload.services) && payload.services.length > 0
        ? payload.services
        : [{ name: "استشارة", price: Number(payload.amount) || 0, qty: 1 }];
      const total = services.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1), 0);
      created = {
        id: makeId(),
        patient: payload.patient,
        patientId: payload.patientId || null,
        appointmentId: payload.appointmentId,
        date: payload.date || "اليوم",
        services,
        amount: total,
        paidAmount: 0,
        paymentMethod: null,
        status: "unpaid",
      };
      return [created, ...arr];
    });
    return created;
  };

  const recordPayment = (id, patch) => {
    setInvoices((arr) =>
      arr.map((inv) => {
        if (inv.id !== id) return inv;
        const total = Number(inv.amount) || 0;
        const paidAmount = Math.max(0, Number(patch.paidAmount) || 0);
        return {
          ...inv,
          paidAmount,
          paymentMethod: patch.paymentMethod || inv.paymentMethod || "cash",
          status: paidAmount >= total ? "paid" : paidAmount > 0 ? "partial" : "unpaid",
        };
      })
    );
  };

  const deleteInvoice = (id) => {
    setInvoices((arr) => arr.filter((inv) => inv.id !== id));
  };

  const value = useMemo(
    () => ({ invoices, addInvoice, updateInvoice, deleteInvoice, ensureDraftInvoiceForAppointment, recordPayment }),
    [invoices]
  );

  return (
    <BillingContext.Provider value={value}>{children}</BillingContext.Provider>
  );
}

export function useBilling() {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error("useBilling must be used within BillingProvider");
  return ctx;
}
