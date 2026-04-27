import { motion } from "framer-motion";
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
} from "recharts";
import { REVENUE, STAFF } from "../data/mock.js";
import { STATUS_AR } from "../data/strings.js";
import StatCard from "../components/ui/StatCard.jsx";
import Chip from "../components/ui/Chip.jsx";

export default function Reports() {
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
            <ArrowDownTrayIcon className="w-4 h-4" /> تصدير التقرير
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
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REVENUE}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceef0" />
                <XAxis dataKey="month" tick={{ fill: "#707881", fontSize: 11 }} axisLine={false} tickLine={false} reversed />
                <YAxis tick={{ fill: "#707881", fontSize: 12 }} axisLine={false} tickLine={false} orientation="right" />
                <Tooltip />
                <Line type="monotone" dataKey="2026" stroke="#005d90" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="2025" stroke="#bfc7d1" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
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
                <BarChart data={[
                  { dept: "قلب", v: 240 },
                  { dept: "أعصاب", v: 180 },
                  { dept: "أطفال", v: 220 },
                  { dept: "باطنية", v: 198 },
                  { dept: "أشعة", v: 80 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eceef0" vertical={false} />
                  <XAxis dataKey="dept" tick={{ fill: "#707881", fontSize: 11 }} axisLine={false} tickLine={false} reversed />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="v" fill="#005d90" radius={[6, 6, 0, 0]} />
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
          <table className="min-w-full">
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
              {STAFF.map((s, i) => (
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
                          animate={{ width: `${s.load}%` }}
                          transition={{ duration: 0.8, delay: i * 0.05 }}
                          className={`h-full rounded-full ${
                            s.load >= 90 ? "bg-danger" : s.load >= 70 ? "bg-primary" : "bg-secondary"
                          }`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-ink-mute w-9 text-end font-latin">{s.load}٪</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children, className = "" }) {
  return <th className={`px-5 py-3 label-caps text-start ${className}`}>{children}</th>;
}
