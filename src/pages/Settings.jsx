import { useState } from "react";
import { motion } from "framer-motion";
import {
  Cog6ToothIcon,
  BellAlertIcon,
  ShieldCheckIcon,
  KeyIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

const SECTIONS = [
  { id: "general", label: "عام", icon: Cog6ToothIcon },
  { id: "security", label: "الأمان والصلاحيات", icon: ShieldCheckIcon },
  { id: "notifications", label: "الإشعارات", icon: BellAlertIcon },
  { id: "api", label: "ربط الأنظمة", icon: KeyIcon },
  { id: "locale", label: "اللغة والمنطقة", icon: GlobeAltIcon },
];

export default function Settings() {
  const [active, setActive] = useState("general");
  const current = SECTIONS.find((s) => s.id === active);

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
          className="absolute top-0.5 start-0.5 w-5 h-5 rounded-full bg-white shadow"
          animate={{ x: on ? -20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
