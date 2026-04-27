import { createContext, useContext, useMemo, useState } from "react";
import { PATIENTS } from "../data/mock.js";

const PatientsContext = createContext(null);

function makeId() {
  return `PT-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function PatientsProvider({ children }) {
  const [patients, setPatients] = useState(PATIENTS);

  const addPatient = (payload) => {
    const newPatient = {
      id: makeId(),
      name: payload.name,
      sex: payload.sex || "ذكر",
      age: Number(payload.age) || 0,
      bloodType: payload.bloodType || "O+",
      status: payload.status || "new",
      lastVisit: payload.lastVisit || "—",
      nextAppointment: payload.nextAppointment || "—",
      allergies: payload.allergies || [],
      meds: payload.meds || [],
      vitals: payload.vitals || { bp: "120/80", hr: 72, spo2: 98 },
    };
    setPatients((arr) => [newPatient, ...arr]);
    return newPatient;
  };

  const updatePatient = (id, patch) => {
    setPatients((arr) => arr.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const deletePatient = (id) => {
    setPatients((arr) => arr.filter((p) => p.id !== id));
  };

  const value = useMemo(
    () => ({ patients, addPatient, updatePatient, deletePatient }),
    [patients]
  );

  return (
    <PatientsContext.Provider value={value}>{children}</PatientsContext.Provider>
  );
}

export function usePatients() {
  const ctx = useContext(PatientsContext);
  if (!ctx) throw new Error("usePatients must be used within PatientsProvider");
  return ctx;
}
