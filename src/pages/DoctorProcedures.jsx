import { useMemo, useState } from "react";
import { DOCTORS } from "../data/mock.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useProcedures } from "../context/ProceduresContext.jsx";

const CATEGORY_OPTIONS = [
  { value: "dental", label: "أسنان" },
  { value: "laser", label: "ليزر" },
  { value: "skin", label: "عناية البشرة" },
  { value: "aesthetic", label: "تجميل" },
  { value: "general", label: "عام" },
];

export default function DoctorProcedures() {
  const { user, role } = useAuth();
  const { getProceduresByDoctor, createProcedure, updateProcedure, deleteProcedure } = useProcedures();
  const isDoctor = role === "doctor";
  const managedDoctorId = isDoctor ? user.doctorId : user.doctorId || "D1";
  const [selectedDoctor, setSelectedDoctor] = useState(managedDoctorId);
  const doctorId = isDoctor ? managedDoctorId : selectedDoctor;
  const canManage = isDoctor;
  const doctor = DOCTORS.find((d) => d.id === doctorId);
  const rows = useMemo(() => getProceduresByDoctor(doctorId, true), [doctorId, getProceduresByDoctor]);
  const [form, setForm] = useState({
    name: "",
    price: "",
    duration: "1",
    category: "general",
    aliases: "",
    active: true,
  });
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const result = createProcedure(doctorId, form);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError("");
    setForm({
      name: "",
      price: "",
      duration: "1",
      category: "general",
      aliases: "",
      active: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="label-caps text-primary">العيادة</div>
          <h1 className="h1 mt-1">إدارة الإجراءات الطبية</h1>
          <p className="text-ink-variant mt-1">
            {canManage
              ? "أضف وعدّل إجراءاتك الخاصة مع التسعير المبدئي والمدة."
              : "عرض إشرافي لإجراءات الأطباء. التعديل متاح فقط للطبيب صاحب الإجراء."}
          </p>
        </div>
        {!isDoctor && (
          <select
            className="input h-10 w-[260px]"
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
          >
            {DOCTORS.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name} — {doc.dept}
              </option>
            ))}
          </select>
        )}
      </div>

      {canManage && (
        <form onSubmit={submit} className="card-pad grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            className="input"
            placeholder="اسم الإجراء"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            className="input"
            type="number"
            min="1"
            placeholder="السعر"
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
          />
          <input
            className="input"
            type="number"
            min="0.25"
            step="0.25"
            placeholder="المدة (ساعة)"
            value={form.duration}
            onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))}
          />
          <select
            className="input"
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <button className="btn-primary h-11">إضافة إجراء</button>
          <input
            className="input md:col-span-4"
            placeholder="أسماء بديلة (اختياري) مثال: consult, checkup"
            value={form.aliases}
            onChange={(e) => setForm((prev) => ({ ...prev, aliases: e.target.value }))}
          />
          <label className="inline-flex items-center gap-2 text-sm text-ink-variant">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
            />
            مفعل
          </label>
          {error ? <div className="md:col-span-5 text-sm text-red-500">{error}</div> : null}
        </form>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-low text-sm text-ink-variant">
          {doctor ? `إجراءات ${doctor.name}` : "الإجراءات"}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-low/60 text-ink-mute">
              <tr>
                <th className="text-start px-3 py-2">الاسم</th>
                <th className="text-start px-3 py-2">الفئة</th>
                <th className="text-start px-3 py-2">المدة</th>
                <th className="text-start px-3 py-2">السعر</th>
                <th className="text-start px-3 py-2">الحالة</th>
                <th className="text-start px-3 py-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-surface-low">
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{row.category}</td>
                  <td className="px-3 py-2">{row.duration} ساعة</td>
                  <td className="px-3 py-2">{row.price} ر.س</td>
                  <td className="px-3 py-2">{row.active ? "مفعل" : "غير مفعل"}</td>
                  <td className="px-3 py-2">
                    {canManage ? (
                      <div className="flex items-center gap-2">
                        <button
                          className="btn-ghost !h-8 !px-3"
                          onClick={() => updateProcedure(row.id, { active: !row.active })}
                        >
                          {row.active ? "تعطيل" : "تفعيل"}
                        </button>
                        <button
                          className="btn-ghost !h-8 !px-3 text-red-500 hover:text-red-400"
                          onClick={() => deleteProcedure(row.id)}
                        >
                          حذف
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-ink-mute">عرض فقط</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-ink-mute" colSpan={6}>
                    لا توجد إجراءات لهذا الطبيب حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
