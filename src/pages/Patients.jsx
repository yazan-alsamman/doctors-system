import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilSquareIcon,
  ArchiveBoxIcon,
  UserPlusIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext.jsx";
import { usePatients } from "../context/PatientsContext.jsx";
import { STATUS_AR, fmtPatientFileId } from "../data/strings.js";
import Chip from "../components/ui/Chip.jsx";
import StatCard from "../components/ui/StatCard.jsx";

const TABS = [
  { id: "all", label: "جميع المرضى" },
  { id: "active", label: "نشط" },
  { id: "inactive", label: "غير نشط" },
  { id: "new", label: "جديد" },
];

function avatarStyle(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  const accentHue = (hue + 24) % 360;
  return {
    background: `linear-gradient(140deg, hsla(${hue}, 92%, 78%, 0.45), hsla(${accentHue}, 88%, 66%, 0.35))`,
    borderColor: `hsla(${hue}, 78%, 46%, 0.36)`,
    color: `hsl(${hue}, 80%, 28%)`,
  };
}

export default function Patients() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { can } = useAuth();
  const { patients, addPatient, updatePatient, deletePatient } = usePatients();
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const filtered = useMemo(() => {
    return patients
      .filter((p) => (tab === "all" ? true : p.status === tab))
      .filter((p) =>
        [p.name, p.id].join(" ").toLowerCase().includes(query.toLowerCase())
      );
  }, [tab, query, patients]);

  useEffect(() => {
    if (searchParams.get("create") !== "1" || !can("patients.create")) return;
    const frame = window.requestAnimationFrame(() => {
      setEditor({ mode: "create" });
    });
    const next = new URLSearchParams(searchParams);
    next.delete("create");
    navigate(
      {
        search: next.toString() ? `?${next.toString()}` : "",
      },
      { replace: true }
    );
    return () => window.cancelAnimationFrame(frame);
  }, [can, navigate, searchParams]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <div className="label-caps text-primary">سجل المرضى</div>
          <h1 className="h1 mt-1">إدارة المرضى</h1>
          <p className="text-ink-variant mt-1 max-w-xl">
            إدارة بيانات التسجيل وسجل الزيارات والوثائق السريرية بكل سهولة.
          </p>
        </div>
        {can("patients.create") && (
          <button
            onClick={() => setEditor({ mode: "create" })}
            className="btn-primary self-start lg:self-auto"
          >
            <UserPlusIcon className="w-4 h-4" />
            إضافة مريض جديد
          </button>
        )}
      </div>

      <div className="card">
        {/* Toolbar */}
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3 border-b border-surface-high">
          <div className="flex bg-surface-low p-1 rounded-full border border-surface-high">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="relative px-3.5 h-8 text-xs font-semibold rounded-full"
              >
                {tab === t.id && (
                  <motion.span
                    layoutId="patient-tab"
                    className="absolute inset-0 bg-surface-base shadow-card rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative ${tab === t.id ? "text-primary" : "text-ink-mute"}`}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالاسم أو الرقم..."
              className="input h-9 w-56 text-xs"
            />
            <button className="btn-ghost h-9 px-3 text-xs">
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              تصفية
            </button>
            <button className="btn-ghost h-9 px-3 text-xs">
              <ArrowDownTrayIcon className="w-4 h-4" />
              تصدير
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full lux-table">
            <thead>
              <tr className="text-start">
                <Th>رقم المريض</Th>
                <Th>الاسم</Th>
                <Th>آخر زيارة</Th>
                <Th>الموعد القادم</Th>
                <Th>الحالة</Th>
                <Th className="text-left ps-6">الإجراءات</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const av = avatarStyle(p.name);
                const hasAllergies = p.allergies?.length > 0;
                const hasApptToday = p.nextAppointment?.includes("اليوم");
                return (
                  <motion.tr
                    key={p.id}
                    onMouseEnter={() => setHoveredId(p.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`border-t border-surface-low transition-colors ${
                      hasApptToday ? "bg-primary-soft/10" : "hover:bg-surface-low/60"
                    }`}
                  >
                    {/* ID with status border */}
                    <td
                      className={`px-5 py-4 font-semibold text-sm font-latin border-s-[3px] ps-4 ${
                        p.status === "active"
                          ? "text-primary border-primary/70"
                          : p.status === "new"
                          ? "text-secondary border-secondary/70"
                          : "text-ink-mute border-surface-high"
                      }`}
                    >
                      {fmtPatientFileId(p.id)}
                    </td>

                    {/* Name + quick view */}
                    <td className="px-5 py-4 relative">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full grid place-items-center font-semibold text-xs shrink-0 border"
                          style={av}
                        >
                          {initials(p.name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-ink">{p.name}</span>
                            {hasAllergies && (
                              <span title={`حساسية: ${p.allergies.join("، ")}`}>
                                <ExclamationCircleIcon className="w-3.5 h-3.5 text-danger/70" />
                              </span>
                            )}
                            {hasApptToday && (
                              <span className="chip bg-primary-soft text-primary text-[9px] py-0.5 px-2 leading-tight">
                                اليوم
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-ink-mute">
                            {p.sex}، {p.age} سنة
                          </div>
                        </div>
                      </div>

                      {/* Hover quick-view */}
                      <AnimatePresence>
                        {hoveredId === p.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full mt-1 z-30 start-4 w-[260px] card-float p-3.5"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-ink">ملف سريع</span>
                              <span className={`chip text-[9px] ${
                                p.status === "active" ? "bg-primary-soft text-primary" :
                                p.status === "new" ? "bg-secondary-soft text-secondary" :
                                "bg-surface-mid text-ink-mute"
                              }`}>
                                {STATUS_AR[p.status]}
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              <QuickRow icon={ExclamationCircleIcon} iconColor={hasAllergies ? "text-danger" : "text-ink-line"} label="الحساسية">
                                {hasAllergies ? (
                                  <span className="text-danger font-medium">{p.allergies.join("، ")}</span>
                                ) : (
                                  <span className="text-ink-mute">لا يوجد</span>
                                )}
                              </QuickRow>
                              <QuickRow icon={ClockIcon} iconColor="text-ink-mute" label="آخر زيارة">
                                <span className="text-ink-variant">{p.lastVisit}</span>
                              </QuickRow>
                              <QuickRow icon={CalendarDaysIcon} iconColor={hasApptToday ? "text-primary" : "text-ink-mute"} label="القادم">
                                <span className={hasApptToday ? "text-primary font-medium" : "text-ink-variant"}>
                                  {p.nextAppointment}
                                </span>
                              </QuickRow>
                              {p.meds?.length > 0 && (
                                <QuickRow icon={ShieldCheckIcon} iconColor="text-success" label="الأدوية">
                                  <span className="text-ink-variant">{p.meds.length} دواء</span>
                                </QuickRow>
                              )}
                            </div>
                            <button className="mt-3 w-full btn-secondary h-8 text-xs">
                              احجز موعداً
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>

                    <td className="px-5 py-4 text-sm text-ink-variant">{p.lastVisit}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-sm ${
                          hasApptToday ? "text-primary font-semibold" : "text-ink-variant"
                        }`}
                      >
                        {p.nextAppointment}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Chip tone={p.status}>{STATUS_AR[p.status]}</Chip>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-start">
                        <Link to={`/patients/${p.id}`}>
                          <IconBtn title="عرض">
                            <EyeIcon className="w-4 h-4" />
                          </IconBtn>
                        </Link>
                        {can("patients.edit") && (
                          <IconBtn
                            title="تعديل"
                            onClick={() => setEditor({ mode: "edit", patient: p })}
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </IconBtn>
                        )}
                        {can("patients.edit") && (
                          <IconBtn title="حذف" onClick={() => setDeleting(p)} danger>
                            <ArchiveBoxIcon className="w-4 h-4" />
                          </IconBtn>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <UserGroupIcon className="w-10 h-10 text-ink-line mx-auto mb-2" />
                    <div className="text-sm font-semibold text-ink">لا توجد نتائج مطابقة</div>
                    <div className="text-xs text-ink-mute mt-1">جرّب تغيير البحث أو الفلاتر.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 flex items-center justify-between text-xs text-ink-mute border-t border-surface-low">
          <span>عرض 1 إلى {filtered.length} من {patients.length} مريضاً</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                className={`w-8 h-8 rounded-xl text-sm font-semibold transition-colors ${
                  p === 1
                    ? "bg-primary text-white shadow-[0_2px_8px_rgba(14,116,144,0.25)]"
                    : "hover:bg-surface-low text-ink-mute"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="إجمالي المرضى"
          value={String(patients.length)}
          hint="+12٪ هذا الشهر"
          icon={UserGroupIcon}
          tone="primary"
        />
        <StatCard
          label="نشط اليوم"
          value={String(patients.filter((p) => p.status === "active").length)}
          hint="حالات نشطة"
          icon={ShieldCheckIcon}
          tone="success"
        />
        <StatCard
          label="سجلات جديدة"
          value={String(patients.filter((p) => p.status === "new").length)}
          hint="تحتاج متابعة"
          icon={ClockIcon}
          tone="warn"
        />
      </div>

      {editor && (
        <PatientEditorModal
          mode={editor.mode}
          patient={editor.patient}
          onClose={() => setEditor(null)}
          onSave={(payload) => {
            if (editor.mode === "create") addPatient(payload);
            else updatePatient(editor.patient.id, payload);
            setEditor(null);
          }}
        />
      )}

      {deleting && (
        <DeleteDialog
          title="حذف المريض؟"
          description={`سيتم حذف ملف ${deleting.name}. لا يمكن التراجع عن هذا الإجراء.`}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            deletePatient(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}

function QuickRow({ icon: Icon, iconColor, label, children }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-ink-mute">{label}: </span>
        <span className="text-[11px]">{children}</span>
      </div>
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-5 py-3 label-caps text-start ${className}`}>{children}</th>
  );
}

function IconBtn({ title, children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-9 h-9 rounded-full grid place-items-center transition-colors border ${
        danger
          ? "text-ink-mute border-danger/15 bg-danger-soft/10 hover:bg-danger-soft/30 hover:text-danger"
          : "text-ink-mute border-surface-high bg-surface-low/35 hover:bg-surface-mid hover:text-primary"
      }`}
    >
      <span className="scale-110">{children}</span>
    </button>
  );
}

function initials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

function PatientEditorModal({ mode, patient, onClose, onSave }) {
  const [form, setForm] = useState({
    name: patient?.name || "",
    sex: patient?.sex || "ذكر",
    age: patient?.age || "",
    bloodType: patient?.bloodType || "O+",
    status: patient?.status || "new",
    nextAppointment: patient?.nextAppointment || "—",
  });
  const [error, setError] = useState("");

  const submit = () => {
    if (!form.name.trim()) return setError("اسم المريض مطلوب");
    if (!form.age) return setError("العمر مطلوب");
    onSave({
      ...form,
      age: Number(form.age),
      lastVisit: patient?.lastVisit || "اليوم",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="card-modal w-full max-w-xl p-6"
      >
        <h3 className="h3 mb-5">
          {mode === "create" ? "إضافة مريض جديد" : "تعديل بيانات المريض"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="الاسم">
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="العمر">
            <input
              type="number"
              className="input"
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
            />
          </Field>
          <Field label="الجنس">
            <select
              className="input"
              value={form.sex}
              onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))}
            >
              <option>ذكر</option>
              <option>أنثى</option>
            </select>
          </Field>
          <Field label="فصيلة الدم">
            <select
              className="input"
              value={form.bloodType}
              onChange={(e) => setForm((f) => ({ ...f, bloodType: e.target.value }))}
            >
              {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>
          <Field label="الحالة">
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="new">جديد</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
          </Field>
          <Field label="الموعد القادم">
            <input
              className="input"
              value={form.nextAppointment}
              onChange={(e) => setForm((f) => ({ ...f, nextAppointment: e.target.value }))}
            />
          </Field>
        </div>
        {error && <div className="text-xs text-danger mt-2">{error}</div>}
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-ghost" onClick={onClose}>إلغاء</button>
          <button className="btn-primary" onClick={submit}>
            {mode === "create" ? "إضافة" : "حفظ التعديل"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DeleteDialog({ title, description, onClose, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="card-modal w-full max-w-md p-6"
      >
        <h3 className="h3">{title}</h3>
        <p className="text-sm text-ink-variant mt-2">{description}</p>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-ghost" onClick={onClose}>إلغاء</button>
          <button className="btn-danger" onClick={onConfirm}>تأكيد الحذف</button>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label-caps mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
