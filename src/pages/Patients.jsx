import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext.jsx";
import { usePatients } from "../context/PatientsContext.jsx";
import { STATUS_AR } from "../data/strings.js";
import Chip from "../components/ui/Chip.jsx";
import StatCard from "../components/ui/StatCard.jsx";

const TABS = [
  { id: "all", label: "جميع المرضى" },
  { id: "active", label: "نشط" },
  { id: "inactive", label: "غير نشط" },
  { id: "new", label: "جديد" },
];

export default function Patients() {
  const { can } = useAuth();
  const { patients, addPatient, updatePatient, deletePatient } = usePatients();
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const filtered = useMemo(() => {
    return patients
      .filter((p) => {
      if (tab === "all") return true;
      return p.status === tab;
      })
      .filter((p) =>
      [p.name, p.id].join(" ").toLowerCase().includes(query.toLowerCase())
      );
  }, [tab, query, patients]);

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
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3 border-b border-surface-high">
          <div className="flex bg-surface-low p-1 rounded-full">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="relative px-3.5 h-8 text-xs font-semibold rounded-full"
              >
                {tab === t.id && (
                  <motion.span
                    layoutId="patient-tab"
                    className="absolute inset-0 bg-white shadow-card rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative ${tab === t.id ? "text-primary" : "text-ink-mute"}`}>{t.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالاسم أو الرقم..."
              className="input h-9 w-56"
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

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-start">
                <Th>رقم المريض</Th>
                <Th>الاسم</Th>
                <Th>آخر زيارة</Th>
                <Th>الموعد القادم</Th>
                <Th>الحالة</Th>
                <Th className="text-end pe-6">الإجراءات</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-t border-surface-low hover:bg-surface-low/60 transition"
                >
                  <td className="px-5 py-4 text-primary font-semibold text-sm font-latin">#{p.id}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold text-xs">
                        {initials(p.name)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-ink">{p.name}</div>
                        <div className="text-xs text-ink-mute">{p.sex}، {p.age} سنة</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-ink-variant">{p.lastVisit}</td>
                  <td className="px-5 py-4 text-sm text-ink-variant">{p.nextAppointment}</td>
                  <td className="px-5 py-4">
                    <Chip tone={p.status}>{STATUS_AR[p.status]}</Chip>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      {can("patients.edit") && (
                        <IconBtn title="تعديل" onClick={() => setEditor({ mode: "edit", patient: p })}>
                          <PencilSquareIcon className="w-4 h-4" />
                        </IconBtn>
                      )}
                      <Link to={`/patients/${p.id}`}>
                        <IconBtn title="عرض"><EyeIcon className="w-4 h-4" /></IconBtn>
                      </Link>
                      {can("patients.edit") && (
                        <IconBtn title="حذف" onClick={() => setDeleting(p)}>
                          <ArchiveBoxIcon className="w-4 h-4" />
                        </IconBtn>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 flex items-center justify-between text-xs text-ink-mute">
          <span>عرض 1 إلى {filtered.length} من 1,248 مريضاً</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                className={`w-8 h-8 rounded-lg text-sm font-semibold ${
                  p === 1 ? "bg-primary text-white" : "hover:bg-surface-low text-ink-mute"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard label="إجمالي المرضى" value={String(patients.length)} hint="+12٪ هذا الشهر" icon={UserGroupIcon} tone="primary" />
        <StatCard label="نشط اليوم" value={String(patients.filter((p) => p.status === "active").length)} hint="حالات نشطة" icon={ShieldCheckIcon} tone="success" />
        <StatCard label="سجلات جديدة" value={String(patients.filter((p) => p.status === "new").length)} hint="تحتاج متابعة" icon={ClockIcon} tone="warn" />
      </div>

      {editor && (
        <PatientEditorModal
          mode={editor.mode}
          patient={editor.patient}
          onClose={() => setEditor(null)}
          onSave={(payload) => {
            if (editor.mode === "create") {
              addPatient(payload);
            } else {
              updatePatient(editor.patient.id, payload);
            }
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

function Th({ children, className = "" }) {
  return (
    <th className={`px-5 py-3 label-caps text-start ${className}`}>{children}</th>
  );
}

function IconBtn({ title, children, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 rounded-lg hover:bg-surface-mid grid place-items-center text-ink-mute hover:text-primary transition"
    >
      {children}
    </button>
  );
}

function initials(name) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
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
    <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-xl p-6"
      >
        <h3 className="h3 mb-4">{mode === "create" ? "إضافة مريض جديد" : "تعديل بيانات المريض"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="الاسم">
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="العمر">
            <input type="number" className="input" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} />
          </Field>
          <Field label="الجنس">
            <select className="input" value={form.sex} onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))}>
              <option>ذكر</option>
              <option>أنثى</option>
            </select>
          </Field>
          <Field label="فصيلة الدم">
            <select className="input" value={form.bloodType} onChange={(e) => setForm((f) => ({ ...f, bloodType: e.target.value }))}>
              {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>
          <Field label="الحالة">
            <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="new">جديد</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
          </Field>
          <Field label="الموعد القادم">
            <input className="input" value={form.nextAppointment} onChange={(e) => setForm((f) => ({ ...f, nextAppointment: e.target.value }))} />
          </Field>
        </div>
        {error && <div className="text-xs text-danger mt-2">{error}</div>}
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-ghost" onClick={onClose}>إلغاء</button>
          <button className="btn-primary" onClick={submit}>{mode === "create" ? "إضافة" : "حفظ التعديل"}</button>
        </div>
      </motion.div>
    </div>
  );
}

function DeleteDialog({ title, description, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-md p-6"
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
