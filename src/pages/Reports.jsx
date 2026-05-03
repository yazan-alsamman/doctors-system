import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownTrayIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  HeartIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  LabelList,
} from "recharts";
import { DOCTORS, REVENUE, STAFF } from "../data/mock.js";
import { STATUS_AR } from "../data/strings.js";
import StatCard from "../components/ui/StatCard.jsx";
import Chip from "../components/ui/Chip.jsx";
import DualToneIcon from "../components/ui/DualToneIcon.jsx";
import { useChartTheme } from "../hooks/useChartTheme.js";
import { useAppointments } from "../context/AppointmentsContext.jsx";

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const chartTheme = useChartTheme();
  const { items: appointments } = useAppointments();

  const deptVolume = useMemo(() => {
    const seed = [
      { dept: "قلب", v: 0 },
      { dept: "أعصاب", v: 0 },
      { dept: "أطفال", v: 0 },
      { dept: "باطنية", v: 0 },
      { dept: "أشعة", v: 0 },
    ];
    const lookup = new Map(seed.map((d) => [d.dept, d]));
    for (const appt of appointments) {
      const doctor = DOCTORS.find((d) => d.id === appt.doctor);
      if (!doctor) continue;
      const deptName = doctor.dept.includes("القلب")
        ? "قلب"
        : doctor.dept.includes("الأعصاب")
        ? "أعصاب"
        : doctor.dept.includes("الأطفال")
        ? "أطفال"
        : doctor.dept.includes("الباطنية")
        ? "باطنية"
        : doctor.dept.includes("الأشعة")
        ? "أشعة"
        : null;
      if (deptName && lookup.has(deptName)) {
        lookup.get(deptName).v += 1;
      }
    }
    return seed.map((entry) => ({ ...entry, v: entry.v || 0 }));
  }, [appointments]);

  const staffWithPressure = useMemo(() => {
    const statusWeight = {
      confirmed: 4,
      arrived: 6,
      in_consultation: 8,
      completed: 3,
      paid: 1,
      scheduled: 2,
    };
    return STAFF.map((staff) => {
      const doctor = DOCTORS.find((d) => d.name === staff.name);
      const relevant = appointments.filter((appt) =>
        doctor ? appt.doctor === doctor.id : DOCTORS.find((d) => d.id === appt.doctor)?.dept === staff.dept
      );
      const weightedLoad = relevant.reduce((sum, appt) => {
        const urgencyBoost = appt.urgent ? 8 : 0;
        const overbookedBoost = appt.overbooked ? 10 : 0;
        return sum + (statusWeight[appt.status] || 2) + urgencyBoost + overbookedBoost;
      }, 0);
      const predictedLoad = Math.min(100, Math.round(staff.load * 0.6 + weightedLoad));
      const pressureLabel =
        predictedLoad >= 90 ? "حرج" : predictedLoad >= 70 ? "مرتفع" : predictedLoad >= 45 ? "متوسط" : "مستقر";
      return { ...staff, predictedLoad, pressureLabel };
    });
  }, [appointments]);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <div className="label-caps text-primary">الأداء والتحليلات</div>
          <h1 className="h1 mt-1">أداء العيادة</h1>
          <p className="text-ink-variant mt-1 max-w-xl">
            نظرة استراتيجية شاملة ومؤشرات الكفاءة التشغيلية.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost">آخر 30 يوم</button>
          <button className="btn-primary">
            <DualToneIcon icon={ArrowDownTrayIcon} className="w-4 h-4" primaryClass="text-white" secondaryClass="text-white/45" /> تصدير التقرير
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="نمو الإيرادات" value="142,850 ر.س" delta="+12.4٪" hint="من بداية الشهر" icon={CurrencyDollarIcon} tone="success" />
        <StatCard label="متوسط الانتظار" value="14.2 د" delta="+2 د" hint="جميع الأقسام" icon={ClockIcon} tone="warn" />
        <StatCard label="رضا المرضى" value="4.8/5" hint="من 1,240 تقييماً" icon={HeartIcon} tone="success" />
        <StatCard label="إنتاجية الكادر" value="87.5٪" hint="ذروة الكفاءة" icon={ChartBarIcon} tone="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card-pad lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="h3">تحليل الإيرادات الشهرية</h2>
              <p className="text-xs text-ink-mute">متابعة أداء السنة المالية</p>
            </div>
            <div className="flex items-center bg-surface-low p-1 rounded-full">
              <button className="px-3 py-1 text-xs font-semibold text-ink-mute rounded-full">2025</button>
              <button className="px-3 py-1 text-xs font-semibold text-white bg-primary rounded-full">2026</button>
            </div>
          </div>
          <div className="h-72">
            {loading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={REVENUE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.cartesianGrid} />
                  <XAxis dataKey="month" tick={{ fill: chartTheme.axisTick, fontSize: 11 }} axisLine={false} tickLine={false} reversed />
                  <YAxis tick={{ fill: chartTheme.axisTick, fontSize: 12 }} axisLine={false} tickLine={false} orientation="right" />
                  <Tooltip
                    contentStyle={chartTheme.tooltipStyle}
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
                    animationDuration={1400}
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
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card-pad">
            <h3 className="h3 flex items-center gap-2">
              <TrophyIcon className="w-5 h-5 text-primary" /> أفضل طبيب أداءً
            </h3>
            <div className="mt-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary grid place-items-center font-display font-bold">
                هف
              </div>
              <div className="flex-1">
                <div className="font-semibold text-ink">د. هدى الفهد</div>
                <div className="text-xs text-ink-mute">أمراض القلب · 240 موعداً</div>
              </div>
              <div className="font-display font-bold text-secondary font-latin">99.1٪</div>
            </div>
          </div>

          <div className="card-pad">
            <h3 className="h3 mb-3">حجم المرضى حسب القسم</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.cartesianGrid} vertical={false} />
                  <XAxis dataKey="dept" tick={{ fill: chartTheme.axisTick, fontSize: 11 }} axisLine={false} tickLine={false} reversed />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={chartTheme.tooltipStyle}
                    labelStyle={chartTheme.tooltipLabelStyle}
                    itemStyle={chartTheme.tooltipItemStyle}
                    wrapperStyle={chartTheme.tooltipWrapperStyle}
                  />
                  <Bar dataKey="v" fill={chartTheme.barPrimary} radius={[6, 6, 0, 0]} isAnimationActive animationDuration={1200}>
                    <LabelList
                      dataKey="v"
                      position="top"
                      formatter={(value) => `${value}`}
                      fill={chartTheme.axisTick}
                      fontSize={11}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="card-pad">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="h3">توزيع الموارد البشرية</h2>
            <p className="text-xs text-ink-mute">مراقبة مباشرة وتوازن الأحمال</p>
          </div>
          <select className="input h-9 max-w-[200px]">
            <option>جميع الأقسام</option>
            <option>أمراض القلب</option>
            <option>الأعصاب</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton />
          ) : (
            <table className="min-w-full lux-table">
            <thead>
              <tr>
                <Th>الطبيب</Th>
                <Th>القسم</Th>
                <Th className="text-end">عدد المرضى</Th>
                <Th>حالة الدوام</Th>
                <Th>مؤشر الحمل</Th>
              </tr>
            </thead>
            <tbody>
              {staffWithPressure.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-t border-surface-low hover:bg-surface-low/60 transition"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
                        {s.name.replace("د. ", "").split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-ink">{s.name}</div>
                        <div className="text-xs text-ink-mute font-latin">رقم: {1000000 + i * 137}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-ink-variant">{s.dept}</td>
                  <td className="px-5 py-4 text-sm font-display font-bold text-ink text-end font-latin">
                    {s.current} / {s.max}
                  </td>
                  <td className="px-5 py-4">
                    <Chip tone={s.status}>{STATUS_AR[s.status]}</Chip>
                  </td>
                  <td className="px-5 py-4 w-48">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-surface-mid rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${s.predictedLoad}%` }}
                          transition={{ duration: 0.8, delay: i * 0.05 }}
                          className={`h-full rounded-full ${
                            s.predictedLoad >= 90 ? "bg-danger" : s.predictedLoad >= 70 ? "bg-primary" : "bg-secondary"
                          }`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-ink-mute w-9 text-end font-latin">{s.predictedLoad}٪</span>
                    </div>
                    <div className="text-[11px] text-ink-mute mt-1">{s.pressureLabel}</div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Th({ children, className = "" }) {
  return <th className={`px-5 py-3 label-caps text-start ${className}`}>{children}</th>;
}

function ChartSkeleton() {
  return (
    <div className="h-full rounded-xl border border-surface-high bg-surface-base/70 p-4 flex flex-col">
      <div className="h-4 w-40 rounded skeleton-shimmer mb-4" />
      <div className="flex-1 rounded-lg skeleton-shimmer" />
      <div className="mt-4 grid grid-cols-6 gap-2">
        {[1, 2, 3, 4, 5, 6].map((k) => (
          <div key={k} className="h-3 rounded skeleton-shimmer" />
        ))}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="grid grid-cols-5 gap-3 p-3 rounded-lg border border-surface-high bg-surface-base/70">
          <div className="h-4 rounded skeleton-shimmer" />
          <div className="h-4 rounded skeleton-shimmer" />
          <div className="h-4 rounded skeleton-shimmer" />
          <div className="h-4 rounded skeleton-shimmer" />
          <div className="h-4 rounded skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}
