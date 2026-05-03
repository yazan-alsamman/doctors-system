import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Squares2X2Icon,
  CalendarDaysIcon,
  UsersIcon,
  CreditCardIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { ROLES, useAuth } from "../../context/AuthContext.jsx";
import { useAppointments } from "../../context/AppointmentsContext.jsx";
import { useBilling } from "../../context/BillingContext.jsx";
import mediflowLogo from "../../assets/mediflow-logo.png";

const ICONS = {
  dashboard: Squares2X2Icon,
  appointments: CalendarDaysIcon,
  schedule: CalendarDaysIcon,
  patients: UsersIcon,
  billing: CreditCardIcon,
  inventory: ArchiveBoxIcon,
  reports: ChartBarIcon,
  procedures: ClipboardDocumentListIcon,
  settings: Cog6ToothIcon,
};

function navForRole(role) {
  if (role === ROLES.RECEPTIONIST) {
    return [
      { to: "/dashboard", label: "الرئيسية", icon: "dashboard" },
      { to: "/appointments", label: "المواعيد", icon: "appointments", badgeKey: "appointments" },
      { to: "/patients", label: "المرضى", icon: "patients" },
      { to: "/billing", label: "الفوترة", icon: "billing", badgeKey: "billing" },
    ];
  }
  if (role === ROLES.DOCTOR) {
    return [
      { to: "/dashboard", label: "الرئيسية", icon: "dashboard" },
      { to: "/appointments", label: "المواعيد", icon: "schedule", badgeKey: "appointments" },
      { to: "/patients", label: "المرضى", icon: "patients" },
      { to: "/procedures", label: "إجراءاتي", icon: "procedures" },
    ];
  }
  return [
    { to: "/dashboard", label: "الرئيسية", icon: "dashboard" },
    { to: "/appointments", label: "المواعيد", icon: "appointments", badgeKey: "appointments" },
    { to: "/patients", label: "المرضى", icon: "patients" },
    { to: "/billing", label: "الفوترة", icon: "billing", badgeKey: "billing" },
    { to: "/inventory", label: "المخزون", icon: "inventory" },
    { to: "/reports", label: "التقارير", icon: "reports" },
    { to: "/procedures", label: "إجراءات الأطباء", icon: "procedures" },
    { to: "/settings", label: "الإعدادات", icon: "settings" },
  ];
}

export default function Sidebar() {
  const { role, user, logout } = useAuth();
  const { items: appts } = useAppointments();
  const { invoices } = useBilling();
  const [collapsed, setCollapsed] = useState(false);

  const items = navForRole(role);

  const badges = {
    appointments: appts.filter((a) => a.day === 0).length || appts.length,
    billing: invoices.filter((i) => i.status === "overdue" || i.status === "due").length,
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 244 }}
      transition={{ type: "spring", stiffness: 340, damping: 34 }}
      className="sidebar-dark shrink-0 hidden md:flex flex-col h-screen sticky top-0 z-20 overflow-hidden border-s border-[rgba(255,255,255,0.05)]"
      style={{ minWidth: collapsed ? 72 : 244 }}
    >
      {/* Logo */}
      <div className={`px-4 pt-6 pb-5 flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
        <div className="w-9 h-9 rounded-xl overflow-hidden bg-surface-base/90 shrink-0 shadow-[0_4px_12px_rgba(6,182,212,0.35)] ring-1 ring-surface-high/60">
          <img
            src={mediflowLogo}
            alt="MediFlow logo"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="leading-tight overflow-hidden"
            >
              <div className="font-display font-bold text-white text-[15px] whitespace-nowrap">
                ميدي فلو
              </div>
              <div className="text-[10px] font-semibold text-night-dim uppercase tracking-wider whitespace-nowrap">
                بوابة العيادة
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="mx-3 mb-3 flex items-center justify-center h-8 rounded-lg hover:bg-[rgba(255,255,255,0.07)] text-night-mute hover:text-night-text transition-colors"
        title={collapsed ? "توسيع القائمة" : "طي القائمة"}
      >
        {collapsed ? (
          <ChevronLeftIcon className="w-4 h-4" />
        ) : (
          <div className="w-full flex items-center gap-2 px-2 text-xs">
            <ChevronRightIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-medium whitespace-nowrap">طي القائمة</span>
          </div>
        )}
      </button>

      {/* Divider */}
      <div className="mx-4 mb-3 h-px bg-[rgba(255,255,255,0.07)]" />

      {/* Navigation */}
      <nav className="px-2.5 flex-1 space-y-0.5 overflow-hidden">
        {items.map((it, idx) => {
          const Icon = ICONS[it.icon];
          const badgeCount = it.badgeKey ? badges[it.badgeKey] : 0;
          return (
            <NavLink
              key={it.to}
              to={it.to}
              title={collapsed ? it.label : undefined}
              className={({ isActive }) =>
                [
                  "relative flex items-center rounded-xl text-sm font-medium cursor-pointer",
                  collapsed ? "h-11 justify-center px-0" : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-[rgba(6,182,212,0.2)] text-[#67e8f9] font-semibold shadow-[inset_0_0_0_1px_rgba(103,232,249,0.28)]"
                    : "text-[#94a3b8] hover:bg-[rgba(255,255,255,0.09)] hover:text-[#f1f5f9]",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.035 }}
                    className={`shrink-0 ${collapsed ? "w-full flex justify-center" : ""}`}
                  >
                    <Icon
                      className={`w-[22px] h-[22px] ${
                        isActive ? "text-[#06b6d4]" : "text-current"
                      }`}
                    />
                  </motion.div>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex-1 whitespace-nowrap"
                      >
                        {it.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!collapsed && badgeCount > 0 && (
                    <span
                      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                        it.badgeKey === "billing"
                          ? "bg-[rgba(220,38,38,0.25)] text-[#fca5a5]"
                          : "bg-[rgba(6,182,212,0.22)] text-[#67e8f9]"
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-glow"
                      className="absolute inset-0 rounded-xl bg-[rgba(6,182,212,0.08)] -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-[rgba(255,255,255,0.07)] px-3 py-3 space-y-0.5`}>
        {!collapsed && (
          <>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#94a3b8] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#e2e8f0] transition-colors">
              <QuestionMarkCircleIcon className="w-5 h-5 shrink-0" />
              مركز المساعدة
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#94a3b8] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#e2e8f0] transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0 scale-x-[-1]" />
              تسجيل خروج
            </button>
          </>
        )}
        <div className={`px-2 pt-3 pb-1 flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0891b2] to-[#0e7490] text-white grid place-items-center font-semibold text-xs shrink-0">
            {user.initials}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="text-xs font-semibold text-[#e2e8f0] whitespace-nowrap truncate max-w-[140px]">
                  {user.name}
                </div>
                <div className="text-[10px] text-night-dim whitespace-nowrap">{user.title}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
