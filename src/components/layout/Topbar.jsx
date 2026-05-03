import {
  MagnifyingGlassIcon,
  BellIcon,
  ArrowPathIcon,
  WifiIcon,
  MoonIcon,
  SunIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { ROLES, ROLE_LABEL_AR, useAuth } from "../../context/AuthContext.jsx";
import { useEffect, useState } from "react";
import { fmtPercentAr } from "../../data/strings.js";
import { useThemeMode } from "../../context/ThemeModeContext.jsx";
import { useAppDialog } from "../../context/AppDialogContext.jsx";

function getWeekdayAr() {
  return new Intl.DateTimeFormat("ar-SY-u-ca-gregory-nu-latn", {
    weekday: "long",
  }).format(new Date());
}

function getGregorianDateAr() {
  return new Intl.DateTimeFormat("ar-SY-u-ca-gregory-nu-latn", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default function Topbar({ onOpenCommandPalette }) {
  const { role, setRole, user } = useAuth();
  const { darkMode, toggleDarkMode } = useThemeMode();
  const { confirm, alert } = useAppDialog();
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [lastSyncAt, setLastSyncAt] = useState(new Date());

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      setLastSyncAt(new Date());
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const syncTone = isOnline ? "s-pill-teal" : "s-pill-amber";
  const syncDot = isOnline ? "bg-success" : "bg-warn";
  const syncMeta = isOnline
    ? `آخر مزامنة ${lastSyncAt.toLocaleTimeString("ar-SY-u-ca-gregory-nu-latn", { hour: "2-digit", minute: "2-digit" })}`
    : "البيانات تعمل من الذاكرة المحلية";

  const triggerEmergency = async () => {
    const approved = await confirm({
      title: "تأكيد الحالة الطارئة",
      message: "هل تريد تفعيل حالة طارئة الآن؟",
      confirmText: "تأكيد",
      cancelText: "إلغاء",
      tone: "danger",
    });
    if (!approved) return;
    await alert({
      title: "تم التنفيذ",
      message: "تم تسجيل تنبيه الحالة الطارئة بنجاح.",
      confirmText: "حسناً",
    });
  };

  return (
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-surface-high">
      {/* Status strip */}
      <div className="px-4 lg:px-7 py-1 border-b border-surface-mid/50 bg-gradient-to-r from-surface-low/40 via-white/20 to-surface-low/40">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-mute me-1">
            Clinic Pulse
          </span>
          <div className="w-px h-3 bg-surface-high" />
          <div className={syncTone}>
            <span className={`w-1.5 h-1.5 rounded-full ${syncDot}`} />
            <WifiIcon className="w-3 h-3" />
            <span>الاتصال</span>
            <span className="font-bold">{isOnline ? "متصل" : "غير متصل"}</span>
            {isOnline && <ArrowPathIcon className="w-3 h-3 animate-spin-slow" />}
          </div>
          <div className="s-pill-blue">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span>الإشغال</span>
            <span className="font-bold">{fmtPercentAr(87)}</span>
          </div>
          <div className="ms-auto hidden xl:flex items-center gap-1.5 text-[11px] text-ink-mute">
            <span className="font-medium text-ink-variant">{getWeekdayAr()}</span>
            <span>·</span>
            <span>{getGregorianDateAr()}</span>
            <span>·</span>
            <span>{syncMeta}</span>
          </div>
        </div>
      </div>

      {/* Main toolbar */}
      <div className="px-4 lg:px-7 py-1.5 flex items-center gap-2.5">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute end-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-mute" />
            <input
              readOnly
              onFocus={() => onOpenCommandPalette?.()}
              onClick={() => onOpenCommandPalette?.()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpenCommandPalette?.();
                }
              }}
              className="input pe-10 h-10 text-sm bg-surface-low/60 border-surface-high/70"
              placeholder="لوحة أوامر: اكتب إجراءً سريعاً..."
            />
            <kbd className="absolute start-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold text-ink-mute bg-surface-mid border border-surface-high">
              ⌘K
            </kbd>
          </div>
        </div>

        <RoleSwitcher role={role} setRole={setRole} />

        <button className="relative w-10 h-10 rounded-xl hover:bg-surface-low grid place-items-center transition-colors">
          <BellIcon className="w-5 h-5 text-ink-variant" />
          <span className="absolute top-1.5 start-1.5 w-2 h-2 rounded-full bg-danger animate-pulse-soft ring-2 ring-surface-base" />
        </button>
        <button
          onClick={triggerEmergency}
          className="h-9 px-2.5 rounded-lg border border-danger/25 text-danger hover:bg-danger-soft/30 transition-colors text-xs font-semibold flex items-center gap-1.5"
          title="حالة طارئة"
        >
          <ExclamationTriangleIcon className="w-4 h-4" />
          <span className="hidden xl:inline">حالة طارئة</span>
        </button>
        <button
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            toggleDarkMode({
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            });
          }}
          className="w-10 h-10 rounded-xl hover:bg-surface-low grid place-items-center transition-colors"
          title={darkMode ? "الوضع النهاري" : "الوضع الليلي"}
        >
          {darkMode ? (
            <SunIcon className="w-4 h-4 text-amber-400" />
          ) : (
            <MoonIcon className="w-4 h-4 text-ink-variant" />
          )}
        </button>

        <div className="hidden lg:flex items-center gap-2.5 ps-3 border-s border-surface-high">
          <div className="text-end leading-tight">
            <div className="text-sm font-semibold text-ink">{user.name}</div>
            <div className="label-caps">
              {ROLE_LABEL_AR[role]} · {user.title}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0891b2] to-[#0e7490] text-white grid place-items-center font-semibold text-xs shadow-[0_2px_8px_rgba(14,116,144,0.3)]">
            {user.initials}
          </div>
        </div>
      </div>
    </header>
  );
}

function RoleSwitcher({ role, setRole }) {
  const roles = [ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN];
  return (
    <div className="hidden md:flex items-center bg-surface-low p-1 rounded-full border border-surface-high">
      {roles.map((r) => (
        <button
          key={r}
          onClick={() => setRole(r)}
          className="relative px-3 h-9 text-xs font-semibold rounded-full transition-colors"
        >
          {role === r && (
            <motion.span
              layoutId="role-pill"
              className="absolute inset-0 surface-elevated shadow-card rounded-full"
              transition={{ type: "spring", stiffness: 440, damping: 32 }}
            />
          )}
          <span className={`relative ${role === r ? "text-primary" : "text-ink-mute"}`}>
            {ROLE_LABEL_AR[r]}
          </span>
        </button>
      ))}
    </div>
  );
}
