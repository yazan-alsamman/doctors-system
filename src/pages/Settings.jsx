import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Cog6ToothIcon,
  BellAlertIcon,
  ShieldCheckIcon,
  KeyIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext.jsx";
import { useUsers } from "../context/UsersContext.jsx";
import { DOCTORS } from "../data/mock.js";

const SECTIONS = [
  { id: "general", label: "عام", icon: Cog6ToothIcon },
  { id: "security", label: "الأمان والصلاحيات", icon: ShieldCheckIcon },
  { id: "notifications", label: "الإشعارات", icon: BellAlertIcon },
  { id: "api", label: "ربط الأنظمة", icon: KeyIcon },
  { id: "locale", label: "اللغة والمنطقة", icon: GlobeAltIcon },
  { id: "accounts", label: "إدارة الحسابات", icon: KeyIcon },
];

export default function Settings() {
  const { can } = useAuth();
  const { users, createUser, updateUser, toggleUserActive } = useUsers();
  const [active, setActive] = useState("general");
  const current = SECTIONS.find((s) => s.id === active);
  const [form, setForm] = useState({
    name: "",
    title: "",
    role: "doctor",
    username: "",
    email: "",
    tempPassword: "",
    doctorId: "D1",
  });
  const [formError, setFormError] = useState("");
  const accounts = useMemo(
    () => users.filter((u) => u.role === "doctor" || u.role === "receptionist"),
    [users]
  );

  const submitAccount = (event) => {
    event.preventDefault();
    const result = createUser(form);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    setFormError("");
    setForm({
      name: "",
      title: "",
      role: "doctor",
      username: "",
      email: "",
      tempPassword: "",
      doctorId: "D1",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="label-caps text-primary">النظام</div>
        <h1 className="h1 mt-1">الإعدادات</h1>
        <p className="text-ink-variant mt-1">ضبط تفضيلات العيادة وإدارة صلاحيات الوصول.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="card p-2 h-fit">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-start transition ${
                  isActive ? "bg-primary-soft/60 text-primary" : "text-ink-variant hover:bg-surface-low"
                }`}
              >
                <Icon className="w-5 h-5" />
                {s.label}
              </button>
            );
          })}
        </aside>

        <motion.div
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-pad"
        >
          <h2 className="h3 mb-1">{current.label}</h2>
          <p className="text-sm text-ink-mute mb-6">
            إدارة إعدادات {current.label} للعيادة.
          </p>

          {active !== "accounts" ? (
            <>
              <div className="space-y-5">
                <Field label="اسم العيادة" value="عيادة ميدي فلو الذكية" />
                <Field label="البريد الإلكتروني الرئيسي" value="admin@mediflow.health" />
                <Field label="الهاتف" value="+966 11 010 2030" />
                <Toggle label="تفعيل الحجز الذكي بالذكاء الاصطناعي" defaultChecked />
                <Toggle label="السماح بدخول بوابة المريض" defaultChecked />
                <Toggle label="المصادقة الثنائية للمدراء" defaultChecked />
              </div>

              <div className="flex justify-end gap-2 mt-8">
                <button className="btn-ghost">إعادة تعيين</button>
                <button className="btn-primary">حفظ التغييرات</button>
              </div>
            </>
          ) : can("users.manage") ? (
            <div className="space-y-6">
              <form onSubmit={submitAccount} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="input"
                  placeholder="الاسم الكامل"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="المسمى الوظيفي"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
                <select
                  className="input"
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                >
                  <option value="doctor">طبيب</option>
                  <option value="receptionist">استقبال</option>
                </select>
                {form.role === "doctor" ? (
                  <select
                    className="input"
                    value={form.doctorId}
                    onChange={(e) => setForm((prev) => ({ ...prev, doctorId: e.target.value }))}
                  >
                    {DOCTORS.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input className="input opacity-70" value="لا ينطبق على موظف الاستقبال" readOnly />
                )}
                <input
                  className="input"
                  placeholder="اسم المستخدم"
                  value={form.username}
                  onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                />
                <input
                  className="input"
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
                <input
                  className="input md:col-span-2"
                  placeholder="كلمة المرور المؤقتة"
                  value={form.tempPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, tempPassword: e.target.value }))}
                />
                <div className="md:col-span-2 flex items-center justify-between">
                  <span className="text-sm text-ink-mute">
                    التحقق المحلي يشمل تفرد اسم المستخدم والبريد الإلكتروني.
                  </span>
                  <button className="btn-primary">إنشاء الحساب</button>
                </div>
                {formError ? <div className="md:col-span-2 text-sm text-red-500">{formError}</div> : null}
              </form>

              <div className="card p-0 overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-surface-low/60 text-ink-mute">
                    <tr>
                      <th className="px-3 py-2 text-start">الاسم</th>
                      <th className="px-3 py-2 text-start">الدور</th>
                      <th className="px-3 py-2 text-start">البريد</th>
                      <th className="px-3 py-2 text-start">الحالة</th>
                      <th className="px-3 py-2 text-start">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id} className="border-t border-surface-low">
                        <td className="px-3 py-2">
                          <input
                            className="input h-9"
                            value={account.name}
                            onChange={(e) => updateUser(account.id, { name: e.target.value })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="input h-9"
                            value={account.role}
                            onChange={(e) =>
                              updateUser(account.id, {
                                role: e.target.value,
                                doctorId: e.target.value === "doctor" ? account.doctorId || "D1" : null,
                              })
                            }
                          >
                            <option value="doctor">طبيب</option>
                            <option value="receptionist">استقبال</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className="input h-9"
                            value={account.email}
                            onChange={(e) => updateUser(account.id, { email: e.target.value })}
                          />
                        </td>
                        <td className="px-3 py-2">{account.active ? "مفعل" : "معطل"}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <input
                              className="input h-9 w-[160px]"
                              value={account.title}
                              onChange={(e) => updateUser(account.id, { title: e.target.value })}
                              placeholder="المسمى"
                            />
                            <button className="btn-ghost !h-8 !px-3" onClick={() => toggleUserActive(account.id)}>
                              {account.active ? "تعطيل" : "تفعيل"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-surface-high bg-surface-low/40 px-4 py-6 text-sm text-ink-mute">
              هذا القسم متاح لمدير النظام فقط.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <label className="label-caps">{label}</label>
      <input className="input mt-1.5" defaultValue={value} />
    </div>
  );
}

function Toggle({ label, defaultChecked }) {
  const [on, setOn] = useState(!!defaultChecked);
  return (
    <div className="flex items-center justify-between py-2 border-t border-surface-low first:border-0">
      <span className="text-sm text-ink">{label}</span>
      <button
        onClick={() => setOn((o) => !o)}
        className={`relative w-11 h-6 rounded-full transition ${on ? "bg-primary" : "bg-surface-high"}`}
      >
        <motion.span
          layout
          className="absolute top-0.5 start-0.5 w-5 h-5 rounded-full bg-surface-base shadow"
          animate={{ x: on ? -20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
