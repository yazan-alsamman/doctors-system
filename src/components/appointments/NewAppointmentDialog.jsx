import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { DOCTORS } from "../../data/mock.js";
import { DAYS_AR, fmtTime } from "../../data/strings.js";
import { useAppointments } from "../../context/AppointmentsContext.jsx";
import { getServiceByName } from "../../data/services.js";
import { useProcedures } from "../../context/ProceduresContext.jsx";

const HOUR_OPTIONS = [8, 9, 10, 11, 13, 14, 15, 16];
const DURATION_OPTIONS = [
  { v: 0.5, label: "30 دقيقة" },
  { v: 1, label: "ساعة واحدة" },
  { v: 1.5, label: "ساعة ونصف" },
  { v: 2, label: "ساعتان" },
];
function getDefaultDuration(doctorId, visitType, procedures) {
  if (visitType) return getServiceByName(visitType, { procedures, doctorId }).duration;
  return DOCTORS.find((d) => d.id === doctorId)?.defaultDuration || 1;
}

function getInitialForm(prefill) {
  return {
    patient: "",
    doctor: "D1",
    day: 0,
    start: 9,
    duration: 1,
    visitType: "استشارة",
    reason: "استشارة",
    urgent: false,
    ...(prefill || {}),
  };
}

export default function NewAppointmentDialog({ open, onClose, prefill }) {
  const { addAppointment, updateAppointment, getConflictsForDraft } = useAppointments();
  const { getProceduresByDoctor } = useProcedures();
  const [form, setForm] = useState(() => getInitialForm(prefill));
  const [errors, setErrors] = useState({});
  const [durationTouched, setDurationTouched] = useState(Boolean(prefill?.duration));
  const [overrideConflict, setOverrideConflict] = useState(false);
  const [repeatOverbookConfirm, setRepeatOverbookConfirm] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");

  const isEditMode = Boolean(prefill?.id);

  useEffect(() => {
    setForm(getInitialForm(prefill));
    setErrors({});
    setDurationTouched(Boolean(prefill?.duration));
    setOverrideConflict(false);
    setRepeatOverbookConfirm(false);
    setSubmissionMessage("");
  }, [prefill, open]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: null }));
    setSubmissionMessage("");
  };

  const doctorProcedures = useMemo(
    () => getProceduresByDoctor(form.doctor, false),
    [form.doctor, getProceduresByDoctor]
  );
  const hasDoctorProcedures = doctorProcedures.length > 0;
  const fallbackService = getServiceByName(form.visitType || form.reason, { procedures: [], doctorId: form.doctor });
  const activeService = hasDoctorProcedures ? doctorProcedures.find((p) => p.name === form.visitType) : fallbackService;

  useEffect(() => {
    if (!hasDoctorProcedures) return;
    const first = doctorProcedures[0];
    const exists = doctorProcedures.some((p) => p.name === form.visitType);
    if (!exists) {
      setForm((prev) => ({ ...prev, visitType: first.name, reason: first.name }));
    }
  }, [doctorProcedures, form.visitType, hasDoctorProcedures]);

  const effectiveDuration = durationTouched
    ? Number(form.duration)
    : getDefaultDuration(form.doctor, form.visitType, doctorProcedures);

  const conflictInfo = useMemo(
    () => getConflictsForDraft({ ...form, duration: effectiveDuration }, prefill?.id || null),
    [form, effectiveDuration, getConflictsForDraft, prefill?.id]
  );
  const hasConflict = conflictInfo.conflicts.length > 0;

  if (!open) return null;

  const validate = () => {
    const e = {};
    if (!form.patient.trim()) e.patient = "اسم المريض مطلوب";
    if (!form.visitType) e.visitType = "الخدمة مطلوبة";
    if (!hasDoctorProcedures) e.visitType = "هذا الطبيب لا يملك إجراءات مفعّلة بعد";
    if (hasConflict && !overrideConflict) e.conflict = "هذا الموعد متعارض. يجب تأكيد الحجز فوق الطاقة أولاً.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    if (isEditMode && prefill?.id) {
      updateAppointment(prefill.id, {
        ...form,
        duration: effectiveDuration,
      });
      onClose();
      return;
    }
    const result = addAppointment(
      { ...form, duration: effectiveDuration },
      { allowOverride: hasConflict, confirmRepeatedOverbook: repeatOverbookConfirm }
    );
    if (!result?.ok) {
      if (result.code === "REQUIRES_REPEAT_CONFIRMATION") {
        setSubmissionMessage("هذا الوقت لديه حجز فوق الطاقة مسبقًا. يلزم تأكيد إضافي.");
        return;
      }
      if (result.code === "CONFLICT") {
        setSubmissionMessage("تعذر الحجز بسبب تعارض. اختر وقتًا بديلًا أو فعّل الحجز فوق الطاقة.");
        return;
      }
    }
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
        className="bg-surface-base rounded-xl shadow-pop max-w-2xl w-full overflow-hidden card-modal dark-glass-panel"
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
            <h3 className="h3">{isEditMode ? "تعديل الموعد" : "حجز موعد جديد"}</h3>
            <p className="text-xs text-ink-mute mt-1">
              {isEditMode
                ? "عدّل تفاصيل الموعد وسيتم تحديثه مباشرة في التقويم."
                : "أدخل تفاصيل الموعد. سيتم إضافة الحجز إلى التقويم فوراً."}
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
              value={conflictInfo.duration}
              onChange={(e) => {
                setDurationTouched(true);
                set("duration", Number(e.target.value));
              }}
              className="input"
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d.v} value={d.v}>{d.label}</option>
              ))}
            </select>
          </Field>

          <Field label="الخدمة" error={errors.visitType}>
            <select
              value={form.visitType}
              onChange={(e) => {
                const value = e.target.value;
                set("visitType", value);
                set("reason", value);
              }}
              className="input"
              disabled={!hasDoctorProcedures}
            >
              {doctorProcedures.map((service) => (
                <option key={service.id} value={service.name}>{service.name}</option>
              ))}
            </select>
          </Field>
          {!hasDoctorProcedures && (
            <div className="md:col-span-2 rounded-lg border border-warn/40 bg-warn-soft/40 px-3 py-2 text-xs text-ink-variant">
              لا توجد إجراءات مفعّلة لهذا الطبيب حالياً. أضف إجراءً أولاً من صفحة الإجراءات قبل تأكيد الموعد.
            </div>
          )}

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

          {hasConflict && (
            <div className="md:col-span-2 rounded-lg border border-danger/40 bg-danger-soft/60 px-3.5 py-3">
              <div className="text-sm font-bold text-danger">تحذير: هذا الوقت محجوز للطبيب المحدد</div>
              <div className="text-xs text-ink-variant mt-1">
                يوجد {conflictInfo.conflicts.length} تعارض. سيُوسم الموعد كـ overbooked إذا تم الحجز.
              </div>
              {conflictInfo.suggestedStart != null && (
                <button
                  type="button"
                  onClick={() => set("start", conflictInfo.suggestedStart)}
                  className="mt-2 btn-ghost h-8 px-3 text-xs"
                >
                  أقرب وقت متاح: {fmtTime(conflictInfo.suggestedStart)}
                </button>
              )}
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={overrideConflict}
                    onChange={(e) => setOverrideConflict(e.target.checked)}
                    className="w-4 h-4 accent-warn"
                  />
                  متابعة الحجز رغم التعارض (Overbooking)
                </label>
                {overrideConflict && (
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={repeatOverbookConfirm}
                      onChange={(e) => setRepeatOverbookConfirm(e.target.checked)}
                      className="w-4 h-4 accent-danger"
                    />
                    أؤكد مجددًا إذا كان هناك Overbooking سابق بنفس الخانة
                  </label>
                )}
              </div>
              {(errors.conflict || submissionMessage) && (
                <div className="text-[11px] text-danger mt-1 font-semibold">{errors.conflict || submissionMessage}</div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-surface-low/60 border-t border-surface-high flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-ink-mute">
            ملخص: <span className="text-ink font-semibold">{doctor?.name}</span>
            {" · "}
            {DAYS_AR[form.day]?.label} {fmtTime(form.start)}
            {" · "}
            {activeService?.price || 0} ر.س
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost">إلغاء</button>
            <button onClick={submit} className="btn-primary" disabled={!hasDoctorProcedures}>
              {isEditMode ? "حفظ التعديلات" : "تأكيد الحجز"}
            </button>
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
