import { motion } from "framer-motion";
import {
  CalendarDaysIcon,
  UsersIcon,
  ClockIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { ROLES, useAuth } from "../context/AuthContext.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import Chip from "../components/ui/Chip.jsx";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import { REVENUE } from "../data/mock.js";
import { useAppointments } from "../context/AppointmentsContext.jsx";

export default function Dashboard() {
  const { role, user } = useAuth();
  const { items: appts } = useAppointments();
  const greeting = `${getGreeting()}، ${user.name}`;
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        <div className="label-caps text-primary">نظرة عامة · {roleLabel(role)}</div>
        <h1 className="h1 mt-1">{greeting}</h1>
        <p className="text-ink-variant mt-1">
          هذه نظرة سريعة على نشاط العيادة اليوم مخصصة لدورك في النظام.
        </p>
      </motion.div>

      {role === ROLES.RECEPTIONIST && <ReceptionistDashboard />}
      {role === ROLES.DOCTOR && <DoctorDashboard appts={appts} />}
      {role === ROLES.ADMIN && <AdminDashboard />}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "صباح الخير";
  if (h < 18) return "مساء الخير";
  return "مساء الخير";
}

function roleLabel(role) {
  if (role === ROLES.RECEPTIONIST) return "استقبال";
  if (role === ROLES.DOCTOR) return "طبيب";
  return "إدارة";
}

function ReceptionistDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard index={0} label="حجوزات اليوم" value="42" hint="+8 مقارنة بالأمس" icon={CalendarDaysIcon} tone="primary" />
        <StatCard index={1} label="حضور المرضى" value="29" hint="13 في غرفة الانتظار" icon={UsersIcon} tone="success" />
        <StatCard index={2} label="متوسط الانتظار" value="9 د" delta="-2 د" icon={ClockIcon} tone="success" />
        <StatCard index={3} label="بانتظار التأكيد" value="6" hint="تتطلب إجراءً" icon={CheckCircleIcon} tone="warn" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card-pad lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="h3">تدفق الحجوزات اليومي</h2>
            <Chip tone="today">مباشر</Chip>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyFlow}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0077b6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0077b6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceef0" />
                <XAxis dataKey="hour" tick={{ fill: "#707881", fontSize: 12 }} axisLine={false} tickLine={false} reversed />
                <YAxis tick={{ fill: "#707881", fontSize: 12 }} axisLine={false} tickLine={false} orientation="right" />
                <Tooltip />
                <Area type="monotone" dataKey="bookings" stroke="#005d90" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-pad">
          <h2 className="h3 mb-3">إجراءات معلقة</h2>
          <div className="space-y-3">
            {pendingActions.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-low"
              >
                <div>
                  <div className="text-sm font-semibold text-ink">{p.title}</div>
                  <div className="text-xs text-ink-mute">{p.subtitle}</div>
                </div>
                <Chip tone={p.tone}>{p.tag}</Chip>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DoctorDashboard({ appts }) {
  const own = appts.filter((a) => a.doctor === "D1").slice(0, 4);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard index={0} label="مرضى اليوم" value="12" hint="3 استشارات جديدة" icon={UsersIcon} tone="primary" />
        <StatCard index={1} label="المريض القادم" value="9:30 ص" hint="سارة العتيبي · ما بعد العملية" icon={ClockIcon} tone="success" />
        <StatCard index={2} label="متوسط الزيارة" value="22 د" hint="+1 د عن الأسبوع الماضي" icon={HeartIcon} tone="primary" />
      </div>

      <div className="card-pad">
        <div className="flex items-center justify-between mb-4">
          <h2 className="h3">جدول اليوم</h2>
          <Chip tone="today">عرض للقراءة فقط</Chip>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {own.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-lg border ${
                i === 0 ? "border-primary bg-primary-soft/40" : "border-surface-high bg-surface-low"
              }`}
            >
              <div className="label-caps text-primary">{i === 0 ? "حالي" : `${(9 + i)}:00 ص`}</div>
              <div className="mt-1 font-semibold text-ink">{a.patient}</div>
              <div className="text-xs text-ink-mute mt-0.5">{a.reason}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard index={0} label="نمو الإيرادات" value="142,850 ر.س" delta="+12.4٪" hint="من بداية الشهر" icon={CurrencyDollarIcon} tone="success" />
        <StatCard index={1} label="متوسط الانتظار" value="14.2 د" delta="+2 د" hint="جميع الأقسام" icon={ClockIcon} tone="warn" />
        <StatCard index={2} label="رضا المرضى" value="4.8/5" hint="98.2٪ تقييم إيجابي" icon={HeartIcon} tone="success" />
        <StatCard index={3} label="إنتاجية الكادر" value="87.5٪" hint="ذروة الكفاءة" icon={ChartBarIcon} tone="primary" />
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

        <div className="card-pad">
          <h2 className="h3 mb-3">مؤشر صحة العيادة</h2>
          <Gauge value={90} />
          <p className="text-xs text-ink-mute text-center mt-3">
            أداء النظام في القمة. ارتفع رضا المرضى بنسبة 5٪ عن الربع السابق.
          </p>
        </div>
      </div>
    </div>
  );
}

function Gauge({ value }) {
  const r = 60;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative grid place-items-center">
      <svg width="180" height="180" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} stroke="#eceef0" strokeWidth="10" fill="none" />
        <motion.circle
          cx="80" cy="80" r={r}
          stroke="#005d90"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          transform="rotate(-90 80 80)"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-3xl font-bold text-primary">{value}</div>
          <div className="label-caps">ممتاز</div>
        </div>
      </div>
    </div>
  );
}

const hourlyFlow = [
  { hour: "8 ص", bookings: 4 },
  { hour: "9 ص", bookings: 7 },
  { hour: "10 ص", bookings: 9 },
  { hour: "11 ص", bookings: 6 },
  { hour: "12 م", bookings: 3 },
  { hour: "1 م", bookings: 5 },
  { hour: "2 م", bookings: 8 },
  { hour: "3 م", bookings: 6 },
  { hour: "4 م", bookings: 4 },
];

const pendingActions = [
  { title: "تأكيد موعد 4:00 م", subtitle: "سارة العتيبي", tag: "اليوم", tone: "today" },
  { title: "إعادة جدولة إيمان الصبيحي", subtitle: "جلسة علاج", tag: "معلق", tone: "pending" },
  { title: "التحقق من التأمين", subtitle: "خالد المحمدي", tag: "اليوم", tone: "today" },
];
