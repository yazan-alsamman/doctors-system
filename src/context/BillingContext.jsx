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

  const deleteInvoice = (id) => {
    setInvoices((arr) => arr.filter((inv) => inv.id !== id));
  };

  const value = useMemo(
    () => ({ invoices, addInvoice, updateInvoice, deleteInvoice }),
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
