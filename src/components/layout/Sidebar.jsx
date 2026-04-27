import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Squares2X2Icon,
  CalendarDaysIcon,
  UsersIcon,
  CreditCardIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { ROLES, useAuth } from "../../context/AuthContext.jsx";

const ICONS = {
  dashboard: Squares2X2Icon,
  appointments: CalendarDaysIcon,
  schedule: CalendarDaysIcon,
  patients: UsersIcon,
  billing: CreditCardIcon,
  inventory: ArchiveBoxIcon,
  reports: ChartBarIcon,
  settings: Cog6ToothIcon,
};

function navForRole(role) {
  if (role === ROLES.RECEPTIONIST) {
    return [
      { to: "/dashboard", label: "الرئيسية", icon: "dashboard" },
      { to: "/appointments", label: "المواعيد", icon: "appointments" },
      { to: "/patients", label: "المرضى", icon: "patients" },
      { to: "/billing", label: "الفوترة", icon: "billing" },
    ];
  }
  if (role === ROLES.DOCTOR) {
    return [
      { to: "/dashboard", label: "الرئيسية", icon: "dashboard" },
      { to: "/appointments", label: "جدولي اليومي", icon: "schedule" },
      { to: "/patients", label: "المرضى", icon: "patients" },
    ];
  }
  return [
    { to: "/dashboard", label: "الرئيسية", icon: "dashboard" },
    { to: "/appointments", label: "المواعيد", icon: "appointments" },
    { to: "/patients", label: "المرضى", icon: "patients" },
    { to: "/billing", label: "الفوترة", icon: "billing" },
    { to: "/inventory", label: "المخزون", icon: "inventory" },
    { to: "/reports", label: "التقارير", icon: "reports" },
    { to: "/settings", label: "الإعدادات", icon: "settings" },
  ];
}

export default function Sidebar() {
  const { role, user } = useAuth();
  const items = navForRole(role);

  return (
    <aside className="w-[244px] shrink-0 hidden md:flex flex-col bg-white border-l border-surface-high min-h-screen sticky top-0">
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary text-white grid place-items-center font-display font-bold">
            م
          </div>
          <div className="leading-tight">
            <div className="font-display font-bold text-primary text-[15px]">
              ميدي فلو
            </div>
            <div className="label-caps">بوابة العيادة</div>
          </div>
        </div>
      </div>

      <nav className="px-3 flex-1 space-y-1">
        {items.map((it, idx) => {
          const Icon = ICONS[it.icon];
          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              {({ isActive }) => (
                <motion.div
                  className="flex items-center gap-3 w-full"
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-ink-mute"}`} />
                  <span>{it.label}</span>
                </motion.div>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 pb-3">
        <button className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-danger/95 text-white font-semibold text-sm hover:bg-danger transition shadow-card">
          <ExclamationTriangleIcon className="w-4 h-4" />
          حالة طارئة
        </button>
      </div>

      <div className="px-3 py-3 border-t border-surface-high space-y-1">
        <div className="nav-item">
          <QuestionMarkCircleIcon className="w-5 h-5 text-ink-mute" />
          مركز المساعدة
        </div>
        <div className="nav-item">
          <ArrowRightOnRectangleIcon className="w-5 h-5 text-ink-mute scale-x-[-1]" />
          تسجيل خروج
        </div>
        <div className="px-2 pt-3 pb-1 text-[11px] text-ink-mute">
          تم تسجيل الدخول كـ <span className="text-ink font-semibold">{user.name}</span>
        </div>
      </div>
    </aside>
  );
}
