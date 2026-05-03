import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  SparklesIcon,
  ClockIcon,
  CalendarDaysIcon,
  UsersIcon,
  UserCircleIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { ROLES, useAuth } from "../context/AuthContext.jsx";
import { useAppointments } from "../context/AppointmentsContext.jsx";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { DOCTORS, REVENUE } from "../data/mock.js";
import { fmtNumberAr, fmtTime } from "../data/strings.js";
import { useChartTheme } from "../hooks/useChartTheme.js";

export default function Dashboard() {
  const { role, user } = useAuth();
  const { items: appts } = useAppointments();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(id);
  }, []);

  const scopedAppointments = useMemo(() => {
    if (role === ROLES.DOCTOR && user?.doctorId) {
      return appts.filter((a) => a.doctor === user.doctorId);
    }
    return appts;
  }, [appts, role, user?.doctorId]);

  const today = useMemo(() => scopedAppointments.filter((a) => a.day === 0), [scopedAppointments]);
  const queue = useMemo(
    () => ({
      waiting: today.filter((a) => ["confirmed", "arrived"].includes(a.status)),
      inConsultation: today.filter((a) => a.status === "in_consultation"),
      done: today.filter((a) => a.status === "paid"),
      waitingPayment: today.filter((a) => a.status === "completed"),
    }),
    [today]
  );

  const operationalPressure = useMemo(() => {
    const score =
      queue.waiting.length * 9 +
      queue.inConsultation.length * 7 +
      queue.waitingPayment.length * 4 +
      today.filter((a) => a.urgent).length * 14 +
      today.filter((a) => a.overbooked).length * 12;
    if (score >= 65) return { label: "حرج", tone: "text-danger" };
    if (score >= 38) return { label: "مرتفع", tone: "text-warn" };
    if (score >= 20) return { label: "متوسط", tone: "text-primary" };
    return { label: "مستقر", tone: "text-secondary" };
  }, [queue, today]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-44 rounded-2xl skeleton-shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((k) => <div key={k} className="h-24 rounded-xl skeleton-shimmer" />)}
        </div>
        <div className="h-72 rounded-xl skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <MorningBriefing userName={user.name} today={today} />
      <OperationalKpis queue={queue} todayCount={today.length} />
      <QuickCalendarView today={today} />
      {role === ROLES.ADMIN ? (
        <AdminAnalyticsSection operationalPressure={operationalPressure} />
      ) : (
        <LiveClinicView queue={queue} role={role} />
      )}
    </div>
  );
}

function MorningBriefing({ userName, today }) {
  const first = [...today].sort((a, b) => a.start - b.start)[0];
  const waiting = today.filter((a) => ["confirmed", "arrived"].includes(a.status)).length;
  const unconfirmed = today.filter((a) => a.status === "scheduled").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="briefing-card p-6 md:p-7"
    >
      <div className="relative z-10 flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="text-pulse text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <SparklesIcon className="w-3.5 h-3.5" />
            نظرة عامة اليوم
          </div>
          <h1 className="text-3xl font-display font-bold text-white mt-1.5">
            {getGreeting()}، {userName}
          </h1>
          <p className="text-white/70 mt-1 text-sm">
            {fmtNumberAr(today.length)} موعد اليوم
            {today.length > 8 ? " · ضغط مرتفع" : " · حمل معتدل"}
          </p>
        </div>
        <div className="flex items-center gap-5 md:gap-7">
          <div className="text-center">
            <div className="text-4xl font-display font-bold text-white leading-none">
              {fmtNumberAr(today.length)}
            </div>
            <div className="text-pulse text-xs mt-1.5 font-medium">موعد اليوم</div>
          </div>
          <div className="w-px h-10 bg-white/15" />
          <div className="text-center">
            <div className="text-4xl font-display font-bold text-amber-300 leading-none">
              {fmtNumberAr(unconfirmed)}
            </div>
            <div className="text-amber-200/80 text-xs mt-1.5 font-medium">غير مؤكدة</div>
          </div>
        </div>
      </div>
      <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
          <span className="text-white text-sm font-semibold">
            أول موعد: {first ? fmtTime(first.start) : "لا يوجد"}
          </span>
          {first && <span className="text-white/70 text-sm">— {first.patient}</span>}
        </div>
        <div className="text-sm text-white/70">
          المنتظرون الآن: <span className="text-white font-semibold">{fmtNumberAr(waiting)}</span>
        </div>
      </div>
    </motion.div>
  );
}

function QuickCalendarView({ today }) {
  const START = 8;
  const END = 17;
  const span = END - START;
  const sorted = [...today].sort((a, b) => a.start - b.start);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-pad"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="h3">عرض سريع للتقويم</h2>
        <span className="text-xs text-ink-mute">{fmtNumberAr(today.length)} مواعيد اليوم</span>
      </div>

      <div dir="ltr" className="flex justify-between text-[10px] text-ink-mute mb-1 px-1">
        {[8, 10, 12, 14, 16].map((h) => (
          <span key={h}>{h < 12 ? `${h}ص` : h === 12 ? "12م" : `${h - 12}م`}</span>
        ))}
      </div>

      <div dir="ltr" className="relative h-14 rounded-xl bg-surface-low border border-surface-high overflow-hidden">
        {[10, 12, 14, 16].map((h) => (
          <div
            key={h}
            className="absolute top-0 bottom-0 w-px bg-surface-high"
            style={{ left: `${((h - START) / span) * 100}%` }}
          />
        ))}
        {sorted.map((item) => {
          const left = ((item.start - START) / span) * 100;
          const width = (Math.max(0.5, item.duration || 1) / span) * 100;
          return (
            <div
              key={item.id}
              className={`absolute top-2 h-10 rounded-lg px-2 py-1 text-[10px] text-white overflow-hidden ${
                item.overbooked ? "bg-danger" : "bg-primary"
              }`}
              style={{ left: `${left}%`, width: `max(68px, calc(${width}% - 4px))` }}
              title={`${item.patient} - ${fmtTime(item.start)}`}
            >
              <div className="truncate font-semibold">{item.patient}</div>
              <div className="truncate opacity-90">{fmtTime(item.start)}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
        {sorted.slice(0, 4).map((item) => (
          <div
            key={item.id}
            className="rounded-xl surface-elevated px-3 py-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-ink truncate">{item.patient}</div>
              <span className="chip bg-primary-soft text-primary">{fmtTime(item.start)}</span>
            </div>
            <div className="text-[11px] text-ink-mute mt-1 truncate">
              {DOCTORS.find((d) => d.id === item.doctor)?.name || "الطبيب"}
            </div>
          </div>
        ))}
        {sorted.length === 0 && <div className="text-xs text-ink-mute">لا يوجد مواعيد اليوم.</div>}
      </div>
    </motion.div>
  );
}

function AdminAnalyticsSection({ operationalPressure }) {
  const chartTheme = useChartTheme();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="card-pad lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="h3">تحليل الإيرادات الشهرية</h2>
            <p className="text-xs text-ink-mute">متابعة الأداء المالي</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={REVENUE}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.cartesianGrid} />
              <XAxis dataKey="month" tick={{ fill: chartTheme.axisTick, fontSize: 11 }} axisLine={false} tickLine={false} reversed />
              <YAxis tick={{ fill: chartTheme.axisTick, fontSize: 12 }} axisLine={false} tickLine={false} orientation="right" />
              <Tooltip
                contentStyle={{ ...chartTheme.tooltipStyle, fontSize: 12 }}
                labelStyle={chartTheme.tooltipLabelStyle}
                itemStyle={chartTheme.tooltipItemStyle}
                wrapperStyle={chartTheme.tooltipWrapperStyle}
              />
              <Line
                type="monotone"
                dataKey="2026"
                stroke={chartTheme.linePrimary}
                strokeWidth={3}
                dot={chartTheme.linePrimaryDot}
                activeDot={chartTheme.linePrimaryActiveDot}
                isAnimationActive
              />
              <Line
                type="monotone"
                dataKey="2025"
                stroke={chartTheme.lineSecondary}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={chartTheme.lineSecondaryActiveDot}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card-pad">
        <h2 className="h3 mb-3">ملخص تشغيلي</h2>
        <div className="space-y-2 text-sm">
          <div className="rounded-lg bg-surface-low px-3 py-2 flex items-center justify-between">
            <span className="text-ink-mute">الحالة الحالية</span>
            <span className="font-semibold text-secondary">مستقر</span>
          </div>
          <div className="rounded-lg bg-surface-low px-3 py-2 flex items-center justify-between">
            <span className="text-ink-mute">الضغط</span>
            <span className={`font-semibold ${operationalPressure.tone}`}>{operationalPressure.label}</span>
          </div>
          <div className="rounded-lg bg-surface-low px-3 py-2 flex items-center justify-between">
            <span className="text-ink-mute">المتابعة</span>
            <span className="font-semibold text-primary">لحظية</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OperationalKpis({ queue, todayCount }) {
  const cards = [
    {
      label: "عدد المرضى اليوم",
      value: todayCount,
      icon: CalendarDaysIcon,
      tone: "from-primary-soft/35 to-primary-soft/10",
      iconTone: "bg-primary-soft text-primary",
      valueTone: "text-primary",
    },
    {
      label: "عدد المنتظرين الآن",
      value: queue.waiting.length,
      icon: UsersIcon,
      tone: "from-warn-soft/35 to-warn-soft/10",
      iconTone: "bg-warn-soft text-warn",
      valueTone: "text-warn",
    },
    {
      label: "عدد عند الطبيب",
      value: queue.inConsultation.length,
      icon: UserCircleIcon,
      tone: "from-secondary-soft/35 to-secondary-soft/10",
      iconTone: "bg-secondary-soft text-secondary",
      valueTone: "text-secondary",
    },
    {
      label: "عدد بانتظار الدفع",
      value: queue.waitingPayment.length,
      icon: CreditCardIcon,
      tone: "from-danger-soft/30 to-danger-soft/10",
      iconTone: "bg-danger-soft text-danger",
      valueTone: "text-danger",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`rounded-2xl border border-surface-high bg-gradient-to-b ${card.tone} px-4 py-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] text-ink-mute leading-relaxed">{card.label}</div>
                <div className={`font-display text-[30px] leading-none font-bold mt-1.5 ${card.valueTone}`}>
                  {fmtNumberAr(card.value)}
                </div>
              </div>
              <div className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${card.iconTone}`}>
                <Icon className="w-[18px] h-[18px]" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LiveClinicView({ queue, role }) {
  const rows = [
    {
      title: "بانتظار",
      items: queue.waiting,
      icon: UsersIcon,
      tone: "from-warn-soft/35 to-warn-soft/10",
      iconTone: "bg-warn-soft text-warn",
      valueTone: "text-warn",
    },
    {
      title: "عند الطبيب",
      items: queue.inConsultation,
      icon: UserCircleIcon,
      tone: "from-primary-soft/35 to-primary-soft/10",
      iconTone: "bg-primary-soft text-primary",
      valueTone: "text-primary",
    },
    {
      title: "انتهى",
      items: queue.done,
      icon: ClockIcon,
      tone: "from-secondary-soft/35 to-secondary-soft/10",
      iconTone: "bg-secondary-soft text-secondary",
      valueTone: "text-secondary",
    },
    {
      title: "بانتظار الدفع",
      items: queue.waitingPayment,
      icon: CreditCardIcon,
      tone: "from-danger-soft/30 to-danger-soft/10",
      iconTone: "bg-danger-soft text-danger",
      valueTone: "text-danger",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-pad"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="h3">ما يحدث الآن في العيادة</h2>
        <span className="text-xs text-ink-mute">{role === ROLES.RECEPTIONIST ? "عرض الاستقبال" : "عرض تشغيلي"}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
          <div
            key={row.title}
            className={`rounded-2xl border border-surface-high bg-gradient-to-b ${row.tone} p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]`}
          >
            <div className="flex items-start justify-between mb-2.5 gap-2">
              <div>
                <div className="text-sm font-semibold text-ink">{row.title}</div>
                <div className={`font-display text-2xl mt-1 leading-none ${row.valueTone}`}>
                  {fmtNumberAr(row.items.length)}
                </div>
              </div>
              <div className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${row.iconTone}`}>
                <Icon className="w-[18px] h-[18px]" />
              </div>
            </div>
            <div className="space-y-1.5">
              {row.items.length === 0 ? (
                <div className="text-xs text-ink-mute">لا يوجد</div>
              ) : (
                row.items.slice(0, 5).map((item) => (
                  <div key={item.id} className="text-xs flex items-center justify-between gap-2">
                    <span className="text-ink truncate">{item.patient}</span>
                    <span className="text-ink-mute">{fmtTime(item.start)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )})}
      </div>
    </motion.div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "صباح الخير";
  if (h < 18) return "مساء الخير";
  return "مساء النور";
}
