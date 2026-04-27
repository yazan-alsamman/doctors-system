import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
  ClockIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useAuth, ROLES } from "../context/AuthContext.jsx";
import { useAppointments } from "../context/AppointmentsContext.jsx";
import { DOCTORS } from "../data/mock.js";
import { DAYS_AR, fmtTime } from "../data/strings.js";
import Chip from "../components/ui/Chip.jsx";
import Toast from "../components/ui/Toast.jsx";
import AiBookingCard from "../components/appointments/AiBookingCard.jsx";
import NewAppointmentDialog from "../components/appointments/NewAppointmentDialog.jsx";

const HOURS = Array.from({ length: 9 }, (_, i) => 8 + i);

const COLOR_MAP = {
  blue: { bar: "bg-primary", bg: "bg-primary-soft/60", text: "text-primary", border: "border-primary/30" },
  green: { bar: "bg-secondary", bg: "bg-secondary-soft/60", text: "text-secondary", border: "border-secondary/30" },
  red: { bar: "bg-danger", bg: "bg-danger-soft", text: "text-danger", border: "border-danger/30" },
  purple: { bar: "bg-[#7c3aed]", bg: "bg-[#ede9fe]", text: "text-[#6d28d9]", border: "border-[#c4b5fd]" },
  orange: { bar: "bg-[#d97706]", bg: "bg-[#fff1d6]", text: "text-[#b45309]", border: "border-[#fcd34d]" },
};

export default function Appointments() {
  const { role, can } = useAuth();
  const { items: appointments, toast } = useAppointments();
  const canEdit = can("appointments.edit");
  const canCreate = can("appointments.create");

  const [view, setView] = useState("أسبوع");
  const [selected, setSelected] = useState(null);
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [showNewDialog, setShowNewDialog] = useState(false);

  const events = useMemo(() => {
    let list = appointments;
    if (role === ROLES.DOCTOR) list = list.filter((a) => a.doctor === "D1");
    if (doctorFilter !== "all" && role === ROLES.ADMIN) list = list.filter((a) => a.doctor === doctorFilter);
    return list;
  }, [role, doctorFilter, appointments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <div className="label-caps text-primary">
            {role === ROLES.DOCTOR ? "جدولي اليومي" : "نظرة عامة على المواعيد"}
          </div>
          <h1 className="h1 mt-1">
            {role === ROLES.DOCTOR ? "مرضى اليوم" : "إدارة المواعيد"}
          </h1>
          <p className="text-ink-variant mt-1 max-w-xl">
            {role === ROLES.DOCTOR
              ? "راجع مواعيدك اليومية. اضغط على الموعد لفتح ملف المريض."
              : "إدارة وتنظيم مواعيد المرضى للأسبوع الحالي بكل سلاسة."}
          </p>
        </div>

        {canCreate && (
          <button onClick={() => setShowNewDialog(true)} className="btn-primary self-start lg:self-auto">
            <PlusIcon className="w-4 h-4" />
            حجز موعد جديد
          </button>
        )}
      </div>

      {can("aiBooking") && <AiBookingCard />}

      {role === ROLES.ADMIN && (
        <div className="card-pad py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="label-caps">الطبيب</span>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="input h-9 max-w-[260px]"
            >
              <option value="all">جميع الأطباء</option>
              {DOCTORS.map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.dept}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 flex-wrap">
            {DOCTORS.map((d) => (
              <div key={d.id} className="flex items-center gap-1.5 text-xs text-ink-mute">
                <span className={`w-2.5 h-2.5 rounded-full ${COLOR_MAP[d.color].bar}`} />
                {d.dept}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-high">
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-lg hover:bg-surface-low grid place-items-center">
              <ChevronRightIcon className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-lg hover:bg-surface-low grid place-items-center">
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <div className="font-display font-bold text-ink">23 – 27 شوال 1446</div>
          </div>
          <div className="flex bg-surface-low p-1 rounded-full">
            {["أسبوع", "يوم", "شهر"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="relative px-3.5 h-8 text-xs font-semibold rounded-full"
              >
                {view === v && (
                  <motion.span
                    layoutId="cal-pill"
                    className="absolute inset-0 bg-white shadow-card rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative ${view === v ? "text-primary" : "text-ink-mute"}`}>{v}</span>
              </button>
            ))}
          </div>
        </div>

        <CalendarGrid events={events} canEdit={canEdit} onSelect={setSelected} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <InfoCard title="إجراءات معلقة" items={[
          { label: "تأكيد موعد 4:00 م", tag: "اليوم", tone: "today" },
          { label: "إعادة جدولة إيمان الصبيحي", tag: "معلق", tone: "pending" },
        ]} />
        <CompletionCard />
        <UpcomingSlots />
      </div>

      <AnimatePresence>
        {selected && (
          <EventDrawer event={selected} onClose={() => setSelected(null)} canEdit={canEdit} />
        )}
        {showNewDialog && (
          <NewAppointmentDialog open={showNewDialog} onClose={() => setShowNewDialog(false)} />
        )}
      </AnimatePresence>

      <Toast toast={toast} />
    </div>
  );
}

function CalendarGrid({ events, canEdit, onSelect }) {
  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[80px_repeat(5,minmax(140px,1fr))] min-w-[760px]">
        <div className="bg-surface-low border-b border-surface-high" />
        {DAYS_AR.map((d, i) => (
          <div
            key={d.key}
            className={`text-center py-3 border-b border-surface-high ${
              i === 2 ? "bg-primary-soft/30" : "bg-surface-low"
            }`}
          >
            <div className="label-caps">{d.label}</div>
            <div className={`font-display text-xl font-bold ${i === 2 ? "text-primary" : "text-ink"}`}>{d.date}</div>
          </div>
        ))}

        {HOURS.map((h) => (
          <Row key={h} hour={h} events={events} canEdit={canEdit} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function Row({ hour, events, canEdit, onSelect }) {
  const isLunch = hour === 12;
  return (
    <>
      <div className="text-end pe-3 py-2 text-[11px] font-semibold tracking-wide text-ink-mute border-b border-surface-low font-latin">
        {fmtTime(hour)}
      </div>
      {DAYS_AR.map((_, dayIdx) => {
        const cellEvents = events.filter((e) => e.day === dayIdx && Math.floor(e.start) === hour);
        return (
          <div
            key={dayIdx}
            className={`relative min-h-[72px] border-b border-s border-surface-low ${
              isLunch ? "bg-surface-low" : ""
            } ${dayIdx === 2 ? "bg-primary-soft/10" : ""}`}
          >
            {isLunch && dayIdx === 0 && (
              <div className="absolute inset-0 grid place-items-center label-caps text-ink-mute">
                استراحة الكادر
              </div>
            )}
            {cellEvents.map((evt) => (
              <EventCard key={evt.id} evt={evt} canEdit={canEdit} onClick={() => onSelect(evt)} />
            ))}
          </div>
        );
      })}
    </>
  );
}

function EventCard({ evt, canEdit, onClick }) {
  const c = COLOR_MAP[evt.color] || COLOR_MAP.blue;
  const height = evt.duration * 72 - 6;
  return (
    <motion.button
      layout
      drag={canEdit ? "y" : false}
      dragConstraints={{ top: -200, bottom: 200 }}
      dragElastic={0.1}
      whileHover={{ y: -1, boxShadow: "0px 8px 18px rgba(0,0,0,0.06)" }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className={`absolute start-1 end-1 top-1 rounded-md border-s-4 ${c.bar} ${c.bg} ${c.border} text-start px-2.5 py-1.5 cursor-pointer overflow-hidden`}
      style={{ height }}
    >
      <div className={`text-[13px] font-semibold ${c.text}`}>{evt.patient}</div>
      <div className="text-[11px] text-ink-variant truncate">{evt.reason}</div>
      {evt.urgent && (
        <div className="text-[10px] mt-1 font-bold text-danger">
          ● حالة عاجلة
        </div>
      )}
    </motion.button>
  );
}

function InfoCard({ title, items }) {
  return (
    <div className="card-pad">
      <h3 className="h3 mb-3 flex items-center gap-2">
        <ClockIcon className="w-5 h-5 text-primary" /> {title}
      </h3>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-ink">{it.label}</span>
            <Chip tone={it.tone}>{it.tag}</Chip>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompletionCard() {
  return (
    <div className="card-pad">
      <h3 className="h3 mb-3 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-secondary-soft grid place-items-center">
          <span className="w-2 h-2 rounded-full bg-secondary" />
        </span>
        إنجاز اليوم
      </h3>
      <div className="font-display font-bold text-3xl text-ink">75٪</div>
      <div className="text-xs text-ink-mute mb-2">12 من 16 موعد</div>
      <div className="h-1.5 w-full bg-surface-mid rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "75%" }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full bg-secondary rounded-full"
        />
      </div>
    </div>
  );
}

function UpcomingSlots() {
  return (
    <div className="card-pad">
      <h3 className="h3 mb-3 flex items-center gap-2">
        <ClockIcon className="w-5 h-5 text-primary" /> المواعيد القادمة
      </h3>
      <div className="space-y-2 text-sm">
        {[
          "غداً 8:30 ص",
          "غداً 11:00 ص",
          "الخميس 2:30 م",
        ].map((s, i) => (
          <div key={i} className="px-3 py-2 rounded-lg bg-surface-low text-ink">{s}</div>
        ))}
      </div>
    </div>
  );
}

function EventDrawer({ event, onClose, canEdit }) {
  const c = COLOR_MAP[event.color] || COLOR_MAP.blue;
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex justify-start"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.aside
        onClick={(e) => e.stopPropagation()}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="w-full max-w-md bg-white h-full overflow-y-auto"
      >
        <div className="px-6 py-5 border-b border-surface-high flex items-center justify-between">
          <h3 className="h3">تفاصيل الموعد</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-surface-low grid place-items-center">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className={`rounded-lg ${c.bg} ${c.border} border-s-4 ${c.bar} px-4 py-3`}>
            <div className="label-caps">المريض</div>
            <div className="font-display text-xl font-bold text-ink mt-0.5">{event.patient}</div>
            <div className="text-sm text-ink-variant mt-0.5">{event.reason}</div>
          </div>

          <DetailRow icon={ClockIcon} label="الوقت" value={`${fmtTime(event.start)} · ${event.duration === 0.5 ? "30 د" : event.duration + " ساعة"}`} />
          <DetailRow icon={UserIcon} label="الطبيب" value={DOCTORS.find(d => d.id === event.doctor)?.name || "—"} />

          {canEdit ? (
            <div className="flex gap-2 pt-2">
              <button className="btn-secondary flex-1">إعادة جدولة</button>
              <button className="btn-primary flex-1">تعديل</button>
            </div>
          ) : (
            <div className="text-xs text-ink-mute pt-2">عرض فقط — يرجى التواصل مع الاستقبال للتعديل.</div>
          )}
        </div>
      </motion.aside>
    </motion.div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-ink-mute mt-0.5" />
      <div>
        <div className="label-caps">{label}</div>
        <div className="text-sm text-ink font-medium">{value}</div>
      </div>
    </div>
  );
}
