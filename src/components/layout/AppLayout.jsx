import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import { useThemeMode } from "../../context/ThemeModeContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import CommandPalette from "../ui/CommandPalette.jsx";
import { AppDialogProvider } from "../../context/AppDialogContext.jsx";

export default function AppLayout() {
  const reduceMotion = useReducedMotion();
  const { revealActive, revealOrigin } = useThemeMode();
  const { can, role } = useAuth();
  const navigate = useNavigate();
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      const isOpenShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isOpenShortcut) return;
      event.preventDefault();
      setCommandOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const actions = useMemo(
    () =>
      [
        {
          id: "dashboard",
          group: "التنقل",
          label: "الذهاب إلى الرئيسية",
          description: "فتح لوحة القيادة",
          keywords: "dashboard home الرئيسية",
          run: () => navigate("/dashboard"),
        },
        {
          id: "appointments",
          group: "التنقل",
          label: "الذهاب إلى جدول المواعيد",
          description: "عرض جميع المواعيد",
          keywords: "appointments schedule موعد مواعيد",
          run: () => navigate("/appointments"),
        },
        can("patients.view") && {
          id: "patients",
          group: "التنقل",
          label: "الذهاب إلى المرضى",
          description: "فتح سجل المرضى",
          keywords: "patients مرضى patient",
          run: () => navigate("/patients"),
        },
        can("billing.view") && {
          id: "billing",
          group: "التنقل",
          label: "الذهاب إلى الفوترة",
          description: "فتح صفحة الفواتير",
          keywords: "billing invoices فواتير فوترة",
          run: () => navigate("/billing"),
        },
        can("inventory") && {
          id: "inventory",
          group: "التنقل",
          label: "الذهاب إلى المخزون",
          description: "فتح صفحة المستلزمات",
          keywords: "inventory stock مخزون",
          run: () => navigate("/inventory"),
        },
        can("reports") && {
          id: "reports",
          group: "التنقل",
          label: "الذهاب إلى التقارير",
          description: "تحليل الأداء والإيرادات",
          keywords: "reports analytics تقارير",
          run: () => navigate("/reports"),
        },
        can("settings") && {
          id: "settings",
          group: "التنقل",
          label: "فتح الإعدادات",
          description: "تعديل تفضيلات النظام",
          keywords: "settings اعدادات",
          run: () => navigate("/settings"),
        },
        can("appointments.create") && {
          id: "new-appointment",
          group: "إجراءات سريعة",
          label: "إضافة موعد جديد",
          description: "فتح نموذج حجز الموعد مباشرة",
          keywords: "new appointment add موعد جديد",
          run: () => navigate("/appointments?create=1"),
        },
        can("aiBooking") && {
          id: "ai-booking",
          group: "إجراءات سريعة",
          label: "حجز بالذكاء الاصطناعي",
          description: "تركيز فوري على حقل AI Booking",
          keywords: "ai booking ذكاء اصطناعي",
          run: () => navigate("/appointments?focus=ai"),
        },
        can("patients.create") && {
          id: "new-patient",
          group: "إجراءات سريعة",
          label: "إضافة مريض جديد",
          description: "فتح نموذج إنشاء ملف مريض",
          keywords: "new patient add مريض",
          run: () => navigate("/patients?create=1"),
        },
        role === "admin" && {
          id: "go-queue",
          group: "إجراءات سريعة",
          label: "الذهاب للوحة الطابور اللحظي",
          description: "فتح صفحة المواعيد مع الطابور",
          keywords: "queue طابور waiting",
          run: () => navigate("/appointments"),
        },
      ].filter(Boolean),
    [can, navigate, role]
  );

  const runAction = (action) => {
    action.run?.();
    setCommandOpen(false);
  };

  return (
    <div className="h-screen flex bg-surface relative overflow-hidden">
      {/* Animated ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden app-ambient">
        <div className="absolute inset-0 app-ambient-base bg-gradient-to-br from-[#f0f5f9] via-[#edf4f8] to-[#f4f0f9]" />
        <div className="blob-1 app-ambient-blob-1 absolute -top-48 -end-32 w-[500px] h-[500px] rounded-full bg-[#cffafe]/45 blur-[80px]" />
        <div className="blob-2 app-ambient-blob-2 absolute -bottom-48 -start-32 w-[460px] h-[460px] rounded-full bg-[#dbeafe]/40 blur-[80px]" />
        <div className="blob-3 app-ambient-blob-3 absolute top-1/2 start-1/3 w-[380px] h-[380px] rounded-full bg-[#d1fae5]/25 blur-[80px]" />
      </div>

      <Sidebar />

      <AppDialogProvider>
        <div
          className={`content-shell flex-1 flex flex-col min-w-0 min-h-0 relative z-10 ${revealActive ? "theme-reveal-active" : ""}`}
          style={{
            "--theme-reveal-x": revealOrigin.x != null ? `${revealOrigin.x}px` : "92vw",
            "--theme-reveal-y": revealOrigin.y != null ? `${revealOrigin.y}px` : "64px",
          }}
        >
          <Topbar onOpenCommandPalette={() => setCommandOpen(true)} />
          <main className="flex-1 min-h-0 overflow-y-auto">
            <motion.div
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
              className="px-6 lg:px-10 py-4 max-w-[1440px] mx-auto w-full"
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </AppDialogProvider>
      <CommandPalette
        key={commandOpen ? "open" : "closed"}
        open={commandOpen}
        actions={actions}
        onClose={() => setCommandOpen(false)}
        onAction={runAction}
      />
    </div>
  );
}
