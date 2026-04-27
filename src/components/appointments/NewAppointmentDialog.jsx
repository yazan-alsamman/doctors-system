import { useState } from "react";
import { motion } from "framer-motion";
import { XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { DOCTORS } from "../../data/mock.js";
import { DAYS_AR, fmtTime } from "../../data/strings.js";
import { useAppointments } from "../../context/AppointmentsContext.jsx";

const HOUR_OPTIONS = [8, 9, 10, 11, 13, 14, 15, 16];
const DURATION_OPTIONS = [
  { v: 0.5, label: "30 دقيقة" },
  { v: 1, label: "ساعة واحدة" },
  { v: 1.5, label: "ساعة ونصف" },
  { v: 2, label: "ساعتان" },
];

export default function NewAppointmentDialog({ open, onClose, prefill }) {
  const { addAppointment } = useAppointments();
  const [form, setForm] = useState(() => ({
    patient: "",
    doctor: "D1",
    day: 0,
    start: 9,
    duration: 1,
    reason: "",
    urgent: false,
    ...(prefill || {}),
  }));
  const [errors, setErrors] = useState({});

  if (!open) return null;

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.patient.trim()) e.patient = "اسم المريض مطلوب";
    if (!form.reason.trim()) e.reason = "سبب الزيارة مطلوب";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    addAppointment(form);
    onClose();
  };

  const doctor = DOCTORS.find((d) => d.id === form.doctor);

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/30 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-pop max-w-2xl w-full overflow-hidden"
        initial={{ y: 20, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 10, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      >
        <div className="px-6 pt-6 pb-4 flex items-start gap-3 border-b border-surface-high">
          <div className="w-10 h-10 rounded-lg bg-primary text-white grid place-items-center">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="h3">حجز موعد جديد</h3>
            <p className="text-xs text-ink-mute mt-1">
              أدخل تفاصيل الموعد. سيتم إضافة الحجز إلى التقويم فوراً.
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-surface-low grid place-items-center">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="اسم المريض" error={errors.patient} className="md:col-span-2">
            <input
              value={form.patient}
              onChange={(e) => set("patient", e.target.value)}
              className="input"
              placeholder="مثال: محمد آل سعد"
              autoFocus
            />
          </Field>

          <Field label="الطبيب">
            <select
              value={form.doctor}
              onChange={(e) => set("doctor", e.target.value)}
              className="input"
            >
              {DOCTORS.map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.dept}</option>
              ))}
            </select>
          </Field>

          <Field label="اليوم">
            <select
              value={form.day}
              onChange={(e) => set("day", Number(e.target.value))}
              className="input"
            >
              {DAYS_AR.map((d, i) => (
                <option key={d.key} value={i}>{d.label} {d.date}</option>
              ))}
            </select>
          </Field>

          <Field label="الساعة">
            <select
              value={form.start}
              onChange={(e) => set("start", Number(e.target.value))}
              className="input"
            >
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>{fmtTime(h)}</option>
              ))}
            </select>
          </Field>

          <Field label="المدة">
            <select
              value={form.duration}
              onChange={(e) => set("duration", Number(e.target.value))}
              className="input"
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d.v} value={d.v}>{d.label}</option>
              ))}
            </select>
          </Field>

          <Field label="سبب الزيارة" error={errors.reason} className="md:col-span-2">
            <input
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
              className="input"
              placeholder="مثال: فحص عام، استشارة، متابعة..."
            />
          </Field>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.urgent}
                onChange={(e) => set("urgent", e.target.checked)}
                className="w-4 h-4 accent-danger"
              />
              <span className="text-sm text-ink">حالة عاجلة — تتطلب مراجعة فورية</span>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 bg-surface-low/60 border-t border-surface-high flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-ink-mute">
            ملخص: <span className="text-ink font-semibold">{doctor?.name}</span>
            {" · "}
            {DAYS_AR[form.day]?.label} {fmtTime(form.start)}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost">إلغاء</button>
            <button onClick={submit} className="btn-primary">تأكيد الحجز</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children, error, className = "" }) {
  return (
    <div className={className}>
      <label className="label-caps mb-1.5 block">{label}</label>
      {children}
      {error && <div className="text-[11px] text-danger mt-1 font-medium">{error}</div>}
    </div>
  );
}
