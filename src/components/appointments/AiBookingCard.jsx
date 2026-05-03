import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import {
  SparklesIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XMarkIcon,
  CalendarDaysIcon,
  UserIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { DOCTORS, PATIENTS } from "../../data/mock.js";
import { DAYS_AR, fmtTime } from "../../data/strings.js";
import { useAppointments } from "../../context/AppointmentsContext.jsx";

const EXAMPLES = [
  "احجز فحصاً عاماً للسيد محمد آل سعد غداً الساعة 10 صباحاً",
  "موعد مع د. هدى الفهد للسيدة سارة العتيبي يوم الثلاثاء 11 ص",
  "استشارة جراحية عاجلة لعبدالله الزهراني الخميس 2 م",
  "متابعة لـ ليلى الغامدي مع د. أحمد المنصور الإثنين 9 ص",
];

const PLACEHOLDER_LOOP = [
  "اكتب طلب الحجز بلغتك الطبيعية...",
  "مثال: احجز موعداً لخالد المحمدي غداً 10ص",
  "مثال: استشارة قلب عاجلة لسارة العتيبي مع د. هدى",
];

export default function AiBookingCard({
  onMagicPreview,
  onMagicClear,
  onDraftChange,
  inputId = "ai-booking-input",
}) {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [successFx, setSuccessFx] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const { addAppointment } = useAppointments();
  const [aiActive, setAiActive] = useState(false);

  // Cycle placeholder when input is empty
  useEffect(() => {
    if (text) return;
    const id = setInterval(() => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_LOOP.length), 3500);
    return () => clearInterval(id);
  }, [text]);

  useEffect(() => {
    onDraftChange?.(text);
  }, [text, onDraftChange]);

  const livePreview = useMemo(() => (text.length > 6 ? parse(text) : null), [text]);

  const onAnalyze = () => {
    if (!text.trim()) return;
    setParsing(true);
    setAiActive(true);
    gsap.fromTo(
      ".ai-card",
      { boxShadow: "0 0 0 rgba(0,0,0,0)" },
      { boxShadow: "0 0 0 8px rgba(11,167,173,0.12), 0 18px 35px rgba(11,167,173,0.18)", duration: 0.25, yoyo: true, repeat: 1 }
    );
    setTimeout(() => {
      const parsed = parse(text);
      setParsing(false);
      setAiActive(false);
      setPreview(parsed);
      onMagicPreview?.(parsed);
    }, 1150);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="ai-card rounded-2xl shadow-card"
      >
        <div className="p-5 md:p-6">
          <div className="flex items-start gap-3 flex-wrap">
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-11 h-11 rounded-lg bg-primary text-white grid place-items-center shadow-card overflow-hidden"
            >
              <SparklesIcon className="w-5 h-5" />
            </motion.div>
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2">
                <h3 className="h3">الحجز الذكي بالذكاء الاصطناعي</h3>
                <span className="chip bg-primary text-white">جديد</span>
              </div>
              <p className="text-sm text-ink-variant mt-1">
                اكتب طلب الحجز بلغة طبيعية وسيقوم النظام بفهم اسم المريض والطبيب والوقت تلقائياً.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-stretch gap-2 flex-wrap md:flex-nowrap">
            <div className="flex-1 min-w-[260px] relative">
              <textarea
                id={inputId}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onAnalyze();
                  }
                }}
                rows={2}
                placeholder={PLACEHOLDER_LOOP[placeholderIdx]}
                className={`w-full rounded-xl border border-surface-high magic-input px-4 py-3 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:border-primary focus:shadow-glow transition resize-none ${
                  parsing ? "ai-processing-border" : ""
                }`}
              />
              {livePreview && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex flex-wrap gap-1.5 text-[11px]"
                >
                  {livePreview.patient && <Tag color="blue">المريض · {livePreview.patient}</Tag>}
                  {livePreview.doctorName && <Tag color="green">الطبيب · {livePreview.doctorName}</Tag>}
                  {livePreview.dayLabel && <Tag color="purple">اليوم · {livePreview.dayLabel}</Tag>}
                  {livePreview.start != null && <Tag color="orange">الوقت · {fmtTime(livePreview.start)}</Tag>}
                  {livePreview.urgent && <Tag color="red">عاجل</Tag>}
                </motion.div>
              )}
            </div>
            <button
              onClick={onAnalyze}
              disabled={!text.trim() || parsing}
              className="btn-primary h-auto py-3 px-5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {parsing ? (
                <>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse [animation-delay:140ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse [animation-delay:280ms]" />
                  </span>
                  يعالج الطلب
                </>
              ) : (
                <>
                  تحليل وحجز
                  <ArrowLeftIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          {aiActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-2 h-1 rounded-full overflow-hidden bg-primary-soft/70"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-secondary to-primary"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
              />
            </motion.div>
          )}

          <div className="mt-4">
            <div className="label-caps mb-2">جرّب أحد الأمثلة السريعة:</div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setText(ex)}
                  className="text-xs text-ink-variant hover:text-primary hover:bg-primary-soft/50 transition px-3 py-1.5 rounded-full border border-surface-high bg-white/70 text-end"
                >
                  {ex}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {preview && (
          <PreviewModal
            preview={preview}
            onClose={() => {
              setPreview(null);
              onMagicClear?.();
            }}
            onConfirm={(edited) => {
              const result = addAppointment({
                patient: edited.patient,
                doctor: edited.doctorId,
                day: edited.day,
                start: edited.start,
                duration: edited.duration,
                reason: edited.reason,
                visitType: edited.visitType || edited.reason,
                urgent: edited.urgent,
              }, edited.confirmOptions || {});
              if (!result?.ok) return result;
              setPreview(null);
              setText("");
              setSuccessFx(true);
              setTimeout(() => setSuccessFx(false), 1400);
              onMagicClear?.();
              return result;
            }}
            onLiveEdit={(draft) => onMagicPreview?.(draft)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successFx && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.88 }}
            transition={{ type: "spring", stiffness: 460, damping: 20, mass: 0.7 }}
            className="fixed bottom-6 end-6 z-[60] px-4 py-2 rounded-xl bg-surface-base shadow-pop border border-secondary/30 flex items-center gap-2 dark-glass-panel"
          >
            <CheckCircleIcon className="w-5 h-5 text-secondary" />
            <span className="text-sm font-semibold text-ink">تم الحجز بنجاح</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Tag({ color = "blue", children }) {
  const map = {
    blue: "bg-primary-soft text-primary",
    green: "bg-secondary-soft text-secondary",
    purple: "bg-tertiary-soft/45 text-tertiary",
    orange: "bg-warn-soft/45 text-warn",
    red: "bg-danger-soft text-danger",
  };
  return <span className={`${map[color]} px-2 py-0.5 rounded-full font-semibold`}>{children}</span>;
}

function PreviewModal({ preview, onClose, onConfirm, onLiveEdit }) {
  const [form, setForm] = useState(preview);
  const [overrideConflict, setOverrideConflict] = useState(false);
  const [repeatOverbookConfirm, setRepeatOverbookConfirm] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const doctorName = DOCTORS.find((d) => d.id === form.doctorId)?.name || form.doctorName;
  const { getConflictsForDraft } = useAppointments();
  const conflictInfo = useMemo(
    () =>
      getConflictsForDraft({
        day: form.day,
        start: form.start,
        duration: form.duration,
        doctor: form.doctorId,
        visitType: form.visitType || form.reason,
        reason: form.reason,
      }),
    [form, getConflictsForDraft]
  );
  const hasConflict = conflictInfo.conflicts.length > 0;

  useEffect(() => {
    onLiveEdit?.(form);
  }, [form, onLiveEdit]);

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
        className="bg-surface-base rounded-xl shadow-pop max-w-lg w-full overflow-hidden card-modal dark-glass-panel"
        initial={{ y: 20, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 10, opacity: 0 }}
      >
        <div className="px-6 pt-6 pb-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary text-white grid place-items-center">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="h3">معاينة الحجز الذكي</h3>
            <p className="text-xs text-ink-mute mt-1">تم استخراج البيانات التالية من طلبك:</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-surface-low grid place-items-center">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.08 } },
            }}
            className="rounded-lg border border-surface-high p-4 space-y-3"
          >
            <EditableRow icon={UserIcon} label="المريض" confidence={preview.conf.patient}>
              <input
                className="input h-9"
                value={form.patient}
                onChange={(e) => setForm((f) => ({ ...f, patient: e.target.value }))}
              />
            </EditableRow>
            <EditableRow icon={ClipboardDocumentListIcon} label="سبب الزيارة" confidence={preview.conf.reason}>
              <input
                className="input h-9"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </EditableRow>
            <EditableRow icon={ClipboardDocumentListIcon} label="نوع الزيارة" confidence={preview.conf.reason}>
              <select
                className="input h-9"
                value={form.visitType || form.reason}
                onChange={(e) => setForm((f) => ({ ...f, visitType: e.target.value }))}
              >
                {["فحص عام", "متابعة", "استشارة", "استشارة جراحية", "جلسة علاج طبيعي", "تنظيف أسنان"].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </EditableRow>
            <EditableRow icon={CalendarDaysIcon} label="اليوم" confidence={preview.conf.day}>
              <select
                className="input h-9"
                value={form.day}
                onChange={(e) => {
                  const d = Number(e.target.value);
                  setForm((f) => ({ ...f, day: d, dayLabel: DAYS_AR[d].label }));
                }}
              >
                {DAYS_AR.map((d, idx) => (
                  <option key={d.key} value={idx}>{d.label}</option>
                ))}
              </select>
            </EditableRow>
            <EditableRow icon={ClockIcon} label="الوقت" confidence={preview.conf.time}>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="input h-9"
                  value={form.start}
                  onChange={(e) => setForm((f) => ({ ...f, start: Number(e.target.value) }))}
                >
                  {[8, 9, 10, 11, 12, 13, 14, 15, 16].map((h) => (
                    <option key={h} value={h}>{fmtTime(h)}</option>
                  ))}
                </select>
                <select
                  className="input h-9"
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
                >
                  <option value={0.5}>30 دقيقة</option>
                  <option value={1}>ساعة</option>
                  <option value={1.5}>ساعة ونصف</option>
                  <option value={2}>ساعتان</option>
                </select>
              </div>
            </EditableRow>
            <EditableRow icon={UserIcon} label="الطبيب" confidence={preview.conf.doctor}>
              <select
                className="input h-9"
                value={form.doctorId}
                onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}
              >
                {DOCTORS.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </EditableRow>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-danger"
                checked={form.urgent}
                onChange={(e) => setForm((f) => ({ ...f, urgent: e.target.checked }))}
              />
              <span className="text-sm text-ink">حالة عاجلة</span>
            </label>
          </motion.div>
          {hasConflict ? (
            <div className="mt-4 p-3 rounded-lg border border-danger/40 bg-danger-soft/60 text-sm text-ink-variant space-y-2">
              <div className="flex gap-2">
                <CheckCircleIcon className="w-5 h-5 text-danger shrink-0" />
                <div>
                  هذا الوقت محجوز لـ {doctorName}. سيتم تمييز الموعد كـ overbooked عند المتابعة.
                </div>
              </div>
              {conflictInfo.suggestedStart != null && (
                <button
                  className="btn-ghost h-8 px-3 text-xs"
                  onClick={() => {
                    setForm((f) => ({ ...f, start: conflictInfo.suggestedStart }));
                    setSubmitError("");
                  }}
                >
                  أقرب وقت متاح: {fmtTime(conflictInfo.suggestedStart)}
                </button>
              )}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-warn"
                  checked={overrideConflict}
                  onChange={(e) => setOverrideConflict(e.target.checked)}
                />
                متابعة الحجز رغم التعارض
              </label>
              {overrideConflict && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-danger"
                    checked={repeatOverbookConfirm}
                    onChange={(e) => setRepeatOverbookConfirm(e.target.checked)}
                  />
                  أؤكد مجددًا عند تكرار overbooking بنفس الخانة
                </label>
              )}
            </div>
          ) : (
            <div className="mt-4 p-3 rounded-lg bg-secondary-soft/50 text-sm text-ink-variant flex gap-2">
              <CheckCircleIcon className="w-5 h-5 text-secondary shrink-0" />
              الموعد متاح للطبيب {doctorName}. لم يتم اكتشاف أي تعارض مع الحجوزات الحالية.
            </div>
          )}
          {submitError && <div className="mt-2 text-xs text-danger font-semibold">{submitError}</div>}
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={onClose} className="btn-ghost">رجوع</button>
            <button
              onClick={() => {
                if (hasConflict && !overrideConflict) {
                  setSubmitError("يلزم تأكيد الحجز فوق الطاقة قبل الإرسال.");
                  return;
                }
                const result = onConfirm({
                  ...form,
                  confirmOptions: {
                    allowOverride: hasConflict,
                    confirmRepeatedOverbook: repeatOverbookConfirm,
                  },
                });
                if (result?.ok === false) {
                  if (result.code === "REQUIRES_REPEAT_CONFIRMATION") {
                    setSubmitError("هذه الخانة مزدحمة بالفعل بـ overbooking. فعّل التأكيد الثاني.");
                  } else {
                    setSubmitError("تعذر تثبيت الموعد بسبب التعارض.");
                  }
                }
              }}
              className="btn-primary"
            >
              تأكيد بعد التعديل
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EditableRow({ icon: Icon, label, confidence, children }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-surface-low text-ink-mute grid place-items-center">
          <Icon className="w-4 h-4" />
        </div>
        <span className="label-caps">{label}</span>
      </div>
        <ConfBadge level={confidence} />
      </div>
      {children}
    </motion.div>
  );
}

function ConfBadge({ level }) {
  if (level === "high") return <span className="chip bg-secondary-soft text-secondary">دقة عالية</span>;
  if (level === "medium") return <span className="chip bg-warn-soft text-warn">متوسطة</span>;
  return <span className="chip bg-surface-mid text-ink-mute">افتراضي</span>;
}

// ─── Naive Arabic NLP parser (demo) ─────────────────────────────────────────
function parse(text) {
  const conf = {};

  // Patient — match any known patient name partial OR fallback to "name"
  let patient = null;
  for (const p of PATIENTS) {
    if (text.includes(p.name) || text.includes(p.name.split(" ")[0])) {
      patient = p.name;
      conf.patient = "high";
      break;
    }
  }
  if (!patient) {
    // try to extract a name after "للسيد", "للسيدة", "للسيدة"
    const m = text.match(/(?:للسيد(?:ة)?|لـ|ل)\s*([\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+){0,2})/);
    if (m) {
      patient = m[1].trim();
      conf.patient = "medium";
    } else {
      patient = "مريض جديد";
      conf.patient = "low";
    }
  }

  // Doctor
  let doctor = null;
  for (const d of DOCTORS) {
    if (text.includes(d.name) || text.includes(d.name.replace("د. ", ""))) {
      doctor = d;
      conf.doctor = "high";
      break;
    }
    if (text.includes(d.dept)) {
      doctor = d;
      conf.doctor = "medium";
      break;
    }
  }
  if (!doctor) {
    doctor = DOCTORS[0];
    conf.doctor = "low";
  }

  // Day
  let day = 0;
  let dayLabel = DAYS_AR[0].label;
  conf.day = "low";
  if (/غد(اً|ا)?|بكرا|بكرة/.test(text)) {
    day = 1;
    dayLabel = "غداً (" + DAYS_AR[1].label + ")";
    conf.day = "high";
  } else if (/اليوم/.test(text)) {
    day = 0;
    dayLabel = "اليوم (" + DAYS_AR[0].label + ")";
    conf.day = "high";
  } else {
    const dayMap = [
      ["الأحد", 0], ["الاحد", 0],
      ["الإثنين", 1], ["الاثنين", 1],
      ["الثلاثاء", 2],
      ["الأربعاء", 3], ["الاربعاء", 3],
      ["الخميس", 4],
    ];
    for (const [k, v] of dayMap) {
      if (text.includes(k)) {
        day = v;
        dayLabel = DAYS_AR[v].label;
        conf.day = "high";
        break;
      }
    }
  }

  // Time
  let start = 9;
  conf.time = "low";
  const tm = text.match(/(\d{1,2})\s*(?::|\.)?\s*(\d{0,2})?\s*(ص|م|صباح|مساء|عصر)?/);
  if (tm) {
    let h = parseInt(tm[1], 10);
    const period = tm[3] || "";
    if (h >= 1 && h <= 12) {
      if ((period.includes("م") || period.includes("مساء") || period.includes("عصر")) && h < 12) h += 12;
      start = h;
      conf.time = "high";
    }
  }

  // Reason — derived from keywords
  let reason = "استشارة";
  conf.reason = "low";
  const reasons = [
    [/فحص(\s+عام)?/, "فحص عام"],
    [/فحص\s+نظر/, "فحص نظر"],
    [/ليزر/, "جلسة ليزر"],
    [/تنظيف\s+أسنان/, "تنظيف أسنان"],
    [/استشارة\s+جراحية/, "استشارة جراحية"],
    [/متابعة/, "متابعة"],
    [/تحاليل|نتائج/, "مراجعة نتائج تحاليل"],
    [/علاج\s+طبيعي/, "جلسة علاج طبيعي"],
    [/قلب|قلبية/, "أمراض القلب"],
  ];
  for (const [re, label] of reasons) {
    if (re.test(text)) {
      reason = label;
      conf.reason = "high";
      break;
    }
  }

  // Duration
  let duration = 1;
  if (/نصف\s+ساعة/.test(text)) duration = 0.5;
  if (/ساعتان|ساعتين/.test(text)) duration = 2;

  // Urgent
  const urgent = /عاجل(ة)?|طارئ(ة)?|سريع/.test(text);

  return {
    patient,
    doctorId: doctor.id,
    doctorName: doctor.name,
    day,
    dayLabel,
    start,
    duration,
    reason,
    urgent,
    conf,
  };
}
