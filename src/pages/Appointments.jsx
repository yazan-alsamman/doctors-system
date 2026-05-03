import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { gsap } from "gsap";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
  ClockIcon,
  UserIcon,
  CommandLineIcon,
  BoltIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useAuth, ROLES } from "../context/AuthContext.jsx";
import { useAppointments } from "../context/AppointmentsContext.jsx";
import { useBilling } from "../context/BillingContext.jsx";
import { useProcedures } from "../context/ProceduresContext.jsx";
import { DOCTORS } from "../data/mock.js";
import { DAYS_AR, fmtMoney, fmtNumberAr, fmtTime } from "../data/strings.js";
import Toast from "../components/ui/Toast.jsx";
import AiBookingCard from "../components/appointments/AiBookingCard.jsx";
import NewAppointmentDialog from "../components/appointments/NewAppointmentDialog.jsx";
import EmptyStateIllustration from "../components/ui/EmptyStateIllustration.jsx";
import { getServiceByName } from "../data/services.js";
import { useAppDialog } from "../context/AppDialogContext.jsx";

const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i);

const COLOR_MAP = {
  blue: { bar: "bg-primary", bg: "bg-primary-soft/60", text: "text-primary", border: "border-primary/30" },
  green: { bar: "bg-secondary", bg: "bg-secondary-soft/60", text: "text-secondary", border: "border-secondary/30" },
  red: { bar: "bg-danger", bg: "bg-danger-soft", text: "text-danger", border: "border-danger/30" },
  purple: { bar: "bg-tertiary", bg: "bg-tertiary-soft/50", text: "text-tertiary", border: "border-tertiary/35" },
  orange: { bar: "bg-warn", bg: "bg-warn-soft/45", text: "text-warn", border: "border-warn/35" },
};

const QUEUE_LABELS = {
  waiting: "بانتظار",
  inConsultation: "عند الطبيب",
  readyToPay: "جاهز للدفع",
  paidCompleted: "مدفوع",
};

export default function Appointments() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { role, user, can } = useAuth();
  const { invoices, ensureDraftInvoiceForAppointment, recordPayment } = useBilling();
  const {
    items: appointments,
    toast,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    setAppointmentStatus,
    confirmDoctorSession,
  } = useAppointments();
  const canEdit = can("appointments.edit");
  const canCreate = can("appointments.create");
  const { confirm } = useAppDialog();
  const { procedures, getProceduresByDoctor } = useProcedures();

  const [view, setView] = useState("أسبوع");
  const [selected, setSelected] = useState(null);
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const [magic, setMagic] = useState(null);
  const [showFloating, setShowFloating] = useState(false);
  const [zoom, setZoom] = useState(52);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [aiDraft, setAiDraft] = useState("");
  const [whatsappPreview, setWhatsappPreview] = useState(null);
  const [showAiCopilot, setShowAiCopilot] = useState(false);
  const [paymentModal, setPaymentModal] = useState(null);
  const [doctorSessionModal, setDoctorSessionModal] = useState(null);
  const calendarScrollRef = useRef(null);
  const calendarCardRef = useRef(null);
  const floatingCardRef = useRef(null);
  const aiInputId = "ai-booking-input";
  const rowHeight = zoom;
  const currentDoctorId = user?.doctorId || "D1";

  const events = useMemo(() => {
    let list = appointments;
    if (role === ROLES.DOCTOR) list = list.filter((a) => a.doctor === currentDoctorId);
    if (doctorFilter !== "all" && role === ROLES.ADMIN) list = list.filter((a) => a.doctor === doctorFilter);
    return list;
  }, [role, currentDoctorId, doctorFilter, appointments]);

  const resolveService = useCallback(
    (appointment) =>
      getServiceByName(appointment.treatmentName || appointment.visitType || appointment.reason, {
        procedures,
        doctorId: appointment.doctor,
      }),
    [procedures]
  );

  useEffect(() => {
    if (!magic || !calendarScrollRef.current) return;
    const scrollTop = Math.max(0, (magic.start - 8) * rowHeight - 96);
    gsap.timeline()
      .to(calendarCardRef.current, {
        boxShadow: "0 0 0 8px rgba(11, 167, 173, 0.12), 0 20px 35px rgba(11,167,173,0.18)",
        duration: 0.24,
        ease: "power2.out",
      })
      .to(calendarScrollRef.current, {
        scrollTop: scrollTop,
        duration: 0.9,
        ease: "power3.out",
      }, 0)
      .to(calendarCardRef.current, {
        boxShadow: "0 8px 22px rgba(11,167,173,0.08)",
        duration: 0.4,
        ease: "power2.out",
      });
    setShowFloating(true);
  }, [magic, rowHeight]);

  useEffect(() => {
    if (!showFloating || !floatingCardRef.current) return;
    gsap.fromTo(
      floatingCardRef.current.querySelectorAll("[data-stagger]"),
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out" }
    );
  }, [showFloating]);

  const quickSuggestions = useMemo(() => {
    const base = [];
    if (magic) {
      base.push(`أفضل نافذة بديلة: ${DAYS_AR[magic.day]?.label} ${fmtTime(Math.min(16, magic.start + 1))}`);
      base.push(`الطبيب المقترح: ${DOCTORS.find((d) => d.id === magic.doctorId)?.name || "—"}`);
    }
    if (selectedSlots.length >= 2) {
      base.push(`تم تحديد ${fmtNumberAr(selectedSlots.length)} خانات — يمكنك إنشاء حجز مجمّع`);
    }
    if (base.length === 0) base.push("اكتب طلبًا في الذكاء الاصطناعي للحصول على اقتراحات ذكية");
    return base;
  }, [magic, selectedSlots]);

  const calendarRangeLabel = useMemo(() => getCurrentWorkWeekRangeLabel(), []);

  const invoiceByAppointmentId = useMemo(
    () => new Map(invoices.filter((inv) => inv.appointmentId).map((inv) => [inv.appointmentId, inv])),
    [invoices]
  );

  const isAppointmentPaid = useCallback(
    (appt) => {
      const invoice = invoiceByAppointmentId.get(appt.id);
      return appt.status === "paid" || invoice?.status === "paid";
    },
    [invoiceByAppointmentId]
  );

  const queue = (() => {
    const source = [...events].sort((a, b) => a.day - b.day || a.start - b.start);
    return {
      waiting: source.filter((a) => a.status === "confirmed" || a.status === "arrived"),
      inConsultation: source.filter((a) => a.status === "in_consultation"),
      readyToPay: source.filter((a) => a.status === "completed" && !isAppointmentPaid(a)),
      paidCompleted: source.filter((a) => a.status === "paid" || (a.status === "completed" && isAppointmentPaid(a))),
    };
  })();

  const doctorQueue = (() => {
    const source = [...events].sort((a, b) => a.day - b.day || a.start - b.start);
    return {
      waitingExam: source.filter((a) => a.status === "confirmed" || a.status === "arrived"),
      inSession: source.filter((a) => a.status === "in_consultation"),
      needsApproval: source.filter((a) => a.status === "completed" && !a.handoffReady),
      readyForReception: source.filter((a) => a.status === "completed" && a.handoffReady && !isAppointmentPaid(a)),
    };
  })();

  const handleQueueAction = useCallback((appt) => {
    if (appt.status === "completed") {
      const service = resolveService(appt);
      let invoice = invoiceByAppointmentId.get(appt.id);
      if (!invoice) {
        invoice = ensureDraftInvoiceForAppointment({
          appointmentId: appt.id,
          patient: appt.patient,
          services: [{ name: service.name, price: service.price, qty: 1 }],
          amount: service.price,
        });
      }
      setPaymentModal({
        appointmentId: appt.id,
        invoiceId: invoice?.id || null,
        patient: appt.patient,
        service: service.name,
        total: Number(invoice?.amount ?? service.price) || 0,
      });
      return;
    }
    const flow = {
      confirmed: "arrived",
      arrived: "in_consultation",
      in_consultation: "completed",
    };
    const nextStatus = flow[appt.status];
    if (!nextStatus) return;
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(8);
    }
    setAppointmentStatus(appt.id, nextStatus);
  }, [ensureDraftInvoiceForAppointment, invoiceByAppointmentId, resolveService, setAppointmentStatus]);

  const handleDoctorQueueAction = useCallback((appt) => {
    if (appt.status === "confirmed" || appt.status === "arrived") {
      setAppointmentStatus(appt.id, "in_consultation");
      return;
    }
    if (appt.status === "in_consultation") {
      setAppointmentStatus(appt.id, "completed");
      return;
    }
    if (appt.status === "completed" && !appt.handoffReady) {
      const service = resolveService(appt);
      setDoctorSessionModal({
        appointmentId: appt.id,
        doctorId: appt.doctor,
        patient: appt.patient,
        treatmentName: appt.treatmentName || service.name,
        treatmentPrice: Number(appt.treatmentPrice) || service.price,
        basePrice: service.price,
      });
    }
  }, [resolveService, setAppointmentStatus]);

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const isTyping = t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName);
      if (isTyping && e.key.toLowerCase() !== "f") return;

      if (e.key.toLowerCase() === "n" && canCreate) {
        e.preventDefault();
        setPrefill(null);
        setShowNewDialog(true);
      }
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        const el = document.getElementById(aiInputId);
        if (el) el.focus();
      }
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(64, z + 4));
      if (e.key === "-") setZoom((z) => Math.max(40, z - 4));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canCreate]);

  useEffect(() => {
    const shouldCreate = searchParams.get("create") === "1";
    const shouldFocusAi = searchParams.get("focus") === "ai";
    if (!shouldCreate && !shouldFocusAi) return;

    let focusTimer = null;
    let frame = null;
    if (shouldCreate && canCreate) {
      frame = window.requestAnimationFrame(() => {
        setPrefill(null);
        setShowNewDialog(true);
      });
    }
    if (shouldFocusAi && can("aiBooking")) {
      focusTimer = window.setTimeout(() => {
        const el = document.getElementById(aiInputId);
        if (el) el.focus();
      }, 120);
    }

    const next = new URLSearchParams(searchParams);
    next.delete("create");
    next.delete("focus");
    navigate(
      {
        search: next.toString() ? `?${next.toString()}` : "",
      },
      { replace: true }
    );

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (focusTimer) window.clearTimeout(focusTimer);
    };
  }, [aiInputId, can, canCreate, navigate, searchParams]);

  const confirmPayment = useCallback((payload) => {
    if (!paymentModal?.invoiceId) return;
    recordPayment(paymentModal.invoiceId, payload);
    setPaymentModal(null);
  }, [paymentModal, recordPayment]);

  const submitDoctorSession = useCallback((payload) => {
    confirmDoctorSession(payload.appointmentId, payload);
    setDoctorSessionModal(null);
  }, [confirmDoctorSession]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
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

      {can("aiBooking") && (
        <div className="card-pad py-2.5 px-4">
          <div className="text-xs text-ink-mute mb-2">الحجز الذكي بالذكاء الاصطناعي</div>
          <AiBookingCard
            inputId={aiInputId}
            onDraftChange={setAiDraft}
            onMagicPreview={(parsed) => setMagic(parsed)}
            onMagicClear={() => {
              setMagic(null);
              setShowFloating(false);
            }}
          />
        </div>
      )}

      <div className="card-pad py-2.5 px-4 flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <span className="chip bg-primary-soft text-primary">
            <CommandLineIcon className="w-3.5 h-3.5" /> N
            <span className="text-ink-mute">موعد جديد</span>
          </span>
          <span className="chip bg-secondary-soft text-secondary">
            <MagnifyingGlassIcon className="w-3.5 h-3.5" /> F
            <span className="text-ink-mute">تركيز على AI</span>
          </span>
          <span className="chip bg-surface-mid text-ink-variant">
            +/- <span className="text-ink-mute">تكبير/تصغير التقويم</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost h-8 px-3 text-xs" onClick={() => setZoom((z) => Math.max(40, z - 4))}>-</button>
          <span className="text-xs font-semibold text-ink-mute">تكبير التقويم {Math.round((zoom / 44) * 100)}%</span>
          <button className="btn-ghost h-8 px-3 text-xs" onClick={() => setZoom((z) => Math.min(64, z + 4))}>+</button>
        </div>
      </div>

      {role === ROLES.ADMIN && (
        <div className="card-pad py-3 px-4 flex items-center justify-between gap-3 flex-wrap">
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

      <div className="grid grid-cols-1 gap-4">
        <div ref={calendarCardRef} className="card overflow-hidden relative calendar-lux">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-high">
            <div className="flex items-center gap-3">
              <button className="w-8 h-8 rounded-lg hover:bg-surface-low grid place-items-center">
                <ChevronRightIcon className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-lg hover:bg-surface-low grid place-items-center">
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <div className="font-display font-bold text-ink">{calendarRangeLabel}</div>
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
                      className="absolute inset-0 bg-surface-base shadow-card rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className={`relative ${view === v ? "text-primary" : "text-ink-mute"}`}>{v}</span>
                </button>
              ))}
            </div>
          </div>

          <div ref={calendarScrollRef} className="overflow-x-auto overflow-y-hidden">
            <CalendarGrid
              view={view}
              events={events}
              canEdit={canEdit}
              onSelect={setSelected}
              magic={magic}
              rowHeight={rowHeight}
              selectedSlots={selectedSlots}
              onSlotToggle={(slot) => {
                setSelectedSlots((arr) => {
                  const key = `${slot.day}-${slot.start}`;
                  if (arr.some((x) => `${x.day}-${x.start}` === key)) {
                    return arr.filter((x) => `${x.day}-${x.start}` !== key);
                  }
                  return [...arr, slot];
                });
              }}
              onCreate={(slot) => {
                setPrefill(slot);
                setShowNewDialog(true);
              }}
              onMove={(id, next) => updateAppointment(id, next)}
              onResize={(id, next) => updateAppointment(id, next)}
            />
          </div>

          <AnimatePresence>
            {showFloating && magic && (
              <MagicFloatingCard
                cardRef={floatingCardRef}
                magic={magic}
                onClose={() => {
                  setShowFloating(false);
                  setMagic(null);
                }}
                onConfirm={() => {
                  const result = addAppointment({
                    patient: magic.patient,
                    doctor: magic.doctorId,
                    day: magic.day,
                    start: magic.start,
                    duration: magic.duration,
                    reason: magic.reason,
                    visitType: magic.reason,
                    urgent: magic.urgent,
                  });
                  if (!result?.ok) {
                    setPrefill({
                      day: magic.day,
                      start: magic.start,
                      duration: magic.duration,
                      doctor: magic.doctorId,
                      reason: magic.reason,
                      visitType: magic.reason,
                      patient: magic.patient,
                    });
                    setShowNewDialog(true);
                    return;
                  }
                  setShowFloating(false);
                  setMagic(null);
                }}
              />
            )}
          </AnimatePresence>
        </div>

      </div>

      <div className="card-pad py-2.5 px-4">
        <button className="btn-ghost h-9 px-3 text-xs" onClick={() => setShowAiCopilot((v) => !v)}>
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${showAiCopilot ? "rotate-180" : ""}`} />
          AI Copilot (اختياري)
        </button>
        {showAiCopilot && (
          <div className="mt-3">
            <AICopilotPanel
              aiDraft={aiDraft}
              magic={magic}
              selectedSlots={selectedSlots}
              quickSuggestions={quickSuggestions}
              onClearSlots={() => setSelectedSlots([])}
              onCreateBulk={() => {
                if (selectedSlots.length === 0) return;
                const sorted = [...selectedSlots].sort((a, b) => a.day - b.day || a.start - b.start);
                setPrefill({
                  day: sorted[0].day,
                  start: sorted[0].start,
                  duration: Math.min(2.5, sorted.length * 0.5),
                });
                setShowNewDialog(true);
              }}
              onOpenWhatsappPreview={(payload) => setWhatsappPreview(payload)}
            />
          </div>
        )}
      </div>

      {role === ROLES.DOCTOR ? (
        <DoctorQueueBoard queue={doctorQueue} onPrimaryAction={handleDoctorQueueAction} resolveService={resolveService} />
      ) : (
        <QueueBoard
          queue={queue}
          invoiceByAppointmentId={invoiceByAppointmentId}
          onPrimaryAction={handleQueueAction}
          resolveService={resolveService}
        />
      )}

      <AnimatePresence>
        {selected && (
          <EventDrawer
            event={selected}
            allEvents={appointments}
            onClose={() => setSelected(null)}
            canEdit={canEdit}
            onEdit={(event) => {
              setPrefill({ ...event });
              setShowNewDialog(true);
              setSelected(null);
            }}
            onDelete={async (event) => {
              const approved = await confirm({
                title: "تأكيد حذف الموعد",
                message: `هل تريد حذف موعد ${event.patient}؟ لا يمكن التراجع عن هذا الإجراء.`,
                confirmText: "حذف الموعد",
                cancelText: "إلغاء",
                tone: "danger",
              });
              if (!approved) return;
              deleteAppointment(event.id);
              setSelected(null);
            }}
          />
        )}
        {showNewDialog && (
          <NewAppointmentDialog
            open={showNewDialog}
            prefill={prefill || undefined}
            onClose={() => {
              setShowNewDialog(false);
              setPrefill(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {whatsappPreview && (
          <WhatsappPreviewDialog
            preview={whatsappPreview}
            onClose={() => setWhatsappPreview(null)}
          />
        )}
        {paymentModal && (
          <PaymentModal
            payload={paymentModal}
            onClose={() => setPaymentModal(null)}
            onConfirm={confirmPayment}
          />
        )}
        {doctorSessionModal && (
          <DoctorSessionModal
            payload={doctorSessionModal}
            procedures={getProceduresByDoctor(doctorSessionModal.doctorId, false)}
            onClose={() => setDoctorSessionModal(null)}
            onConfirm={submitDoctorSession}
          />
        )}
      </AnimatePresence>

      <Toast toast={toast} />
    </div>
  );
}

function CalendarGrid({
  view,
  events,
  canEdit,
  onSelect,
  magic,
  onCreate,
  onMove,
  onResize,
  rowHeight,
  selectedSlots,
  onSlotToggle,
}) {
  const focusDay = 2;
  const visibleDayIndices = view === "يوم" ? [focusDay] : DAYS_AR.map((_, idx) => idx);
  const overlapByEventId = useMemo(() => {
    const map = new Map();
    for (const dayIdx of visibleDayIndices) {
      const dayEvents = events
        .filter((evt) => evt.day === dayIdx)
        .sort((a, b) => a.start - b.start || String(a.id).localeCompare(String(b.id)));
      const active = [];
      for (const evt of dayEvents) {
        const start = Number(evt.start) || 0;
        const end = start + (Number(evt.duration) || 1);
        for (let i = active.length - 1; i >= 0; i -= 1) {
          if (active[i].end <= start) active.splice(i, 1);
        }
        const used = new Set(active.map((item) => item.col));
        let col = 0;
        while (used.has(col)) col += 1;
        active.push({ id: evt.id, col, end });
        const concurrent = active.length;
        for (const item of active) {
          const prev = map.get(item.id) || { col: item.col, cols: 1 };
          map.set(item.id, { col: prev.col, cols: Math.max(prev.cols, concurrent) });
        }
      }
    }
    return map;
  }, [events, visibleDayIndices]);
  const now = new Date();
  const nowPos = (now.getHours() + now.getMinutes() / 60 - 8) * rowHeight + 50;
  const showNow = nowPos >= 50 && nowPos <= 50 + HOURS.length * rowHeight;

  if (view === "شهر") {
    return (
      <LayoutGroup id="calendar-shared-events">
        <motion.div layout className="p-4">
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
          >
            {DAYS_AR.map((d, dayIdx) => {
              const dayEvents = events
                .filter((e) => e.day === dayIdx)
                .sort((a, b) => a.start - b.start);
              return (
                <motion.div
                  key={d.key}
                  layout
                  className="rounded-xl border border-surface-high bg-surface-base/70 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-ink">{d.label}</div>
                    <div className="text-xs text-ink-mute">{fmtNumberAr(dayEvents.length)} مواعيد</div>
                  </div>
                  {dayEvents.length === 0 ? (
                    <div className="text-xs text-ink-mute py-3">لا يوجد مواعيد</div>
                  ) : (
                    <div className="space-y-2">
                      {dayEvents.map((evt) => (
                        <MonthEventCard
                          key={evt.id}
                          evt={evt}
                          onClick={() => onSelect(evt)}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </LayoutGroup>
    );
  }

  return (
    <LayoutGroup id="calendar-shared-events">
      <div className="overflow-x-auto relative">
      {showNow && (
        <div className="absolute start-0 end-0 z-10 pointer-events-none" style={{ top: nowPos }}>
          <div className="time-now-line h-px w-full" />
          <motion.span
            className="absolute end-2 -top-1.5 w-3 h-3 rounded-full bg-primary"
            animate={{ scale: [1, 1.35, 1], opacity: [0.8, 0.4, 0.8] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className={`grid ${
            view === "يوم"
              ? "grid-cols-[80px_minmax(220px,1fr)] min-w-[360px]"
              : "grid-cols-[80px_repeat(5,minmax(140px,1fr))] min-w-[760px]"
          }`}
        >
        <div className="bg-surface-low border-b border-surface-high" />
        {visibleDayIndices.map((dayIdx) => {
          const d = DAYS_AR[dayIdx];
          const i = dayIdx;
          return (
          <div
            key={d.key}
            className={`text-center py-3 border-b border-surface-high ${
              i === 2 ? "bg-primary-soft/30" : "bg-surface-low"
            }`}
          >
            <div className="label-caps">{d.label}</div>
            <div className={`font-display text-xl font-bold ${i === 2 ? "text-primary" : "text-ink"}`}>{d.date}</div>
          </div>
          );
        })}

        {HOURS.map((h) => (
          <Row
            key={h}
            hour={h}
            dayIndices={visibleDayIndices}
            events={events}
            canEdit={canEdit}
            onSelect={onSelect}
            magic={magic}
            rowHeight={rowHeight}
            selectedSlots={selectedSlots}
            onSlotToggle={onSlotToggle}
            onCreate={onCreate}
            onMove={onMove}
            onResize={onResize}
            overlapByEventId={overlapByEventId}
          />
        ))}
        </motion.div>
      </AnimatePresence>
      {events.length === 0 && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="pointer-events-auto bg-surface-base/80 rounded-xl border border-surface-high">
            <EmptyStateIllustration
              title="لا توجد مواعيد حالياً"
              subtitle="ابدأ بإضافة حجز جديد أو غيّر الطبيب/العرض."
            />
          </div>
        </div>
      )}
      </div>
    </LayoutGroup>
  );
}

function Row({
  hour,
  dayIndices,
  events,
  canEdit,
  onSelect,
  magic,
  onCreate,
  onMove,
  onResize,
  rowHeight,
  selectedSlots,
  onSlotToggle,
  overlapByEventId,
}) {
  const isLunch = hour === 12;
  return (
    <>
      <div className="text-end pe-3 py-1.5 text-sm font-semibold tracking-wide text-ink-mute border-b border-surface-low font-latin">
        {fmtTime(hour)}
      </div>
      {dayIndices.map((dayIdx) => {
        const isBreakSlot = isLunch && dayIdx === 0;
        const cellEvents = events
          .filter((e) => e.day === dayIdx && Math.floor(e.start) === hour)
          .sort((a, b) => a.start - b.start || String(a.id).localeCompare(String(b.id)));
        const isDenseSlot = cellEvents.length >= 3;
        const visibleEvents = isDenseSlot ? cellEvents.slice(0, 2) : cellEvents;
        const hiddenCount = cellEvents.length - visibleEvents.length;
        const loadTone =
          cellEvents.length >= 3
            ? "bg-danger-soft/35"
            : cellEvents.length === 2
            ? "bg-warn-soft/35"
            : cellEvents.length === 1
            ? "bg-secondary-soft/20"
            : "";
        const isMagicSlot =
          magic &&
          magic.day === dayIdx &&
          Math.floor(magic.start) === hour;
        return (
          <div
            key={dayIdx}
            style={{ minHeight: rowHeight }}
            onClick={(e) => {
              if (isBreakSlot) return;
              if (e.ctrlKey || e.metaKey) {
                onSlotToggle?.({ day: dayIdx, start: hour });
              }
            }}
            onDoubleClick={() => {
              if (isBreakSlot) return;
              onCreate?.({ day: dayIdx, start: hour, duration: 1 });
            }}
            className={`relative min-h-0 border-b border-s border-surface-low group ${
              isBreakSlot ? "staff-break-cell" : isLunch ? "bg-surface-low" : loadTone
            } ${dayIdx === 2 ? "bg-primary-soft/10" : ""} hover:bg-primary-soft/20 transition-colors`}
          >
            {cellEvents.length > 0 && (
              <span className="absolute top-1 end-1 text-[10px] text-ink-mute bg-surface-base/80 rounded-full px-1.5 py-0.5">
                {fmtNumberAr(cellEvents.length)}
              </span>
            )}
            {selectedSlots.some((s) => s.day === dayIdx && s.start === hour) && (
              <div className="absolute inset-1 rounded-lg border border-primary/40 bg-primary-soft/35 pointer-events-none" />
            )}
            {isBreakSlot && (
              <div className="absolute inset-0 grid place-items-center label-caps text-ink-mute">
                استراحة الكادر
              </div>
            )}
            {isMagicSlot && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-1 rounded-xl slot-glow pointer-events-none"
                />
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute start-1 end-1 top-1 rounded-lg border border-primary/40 bg-surface-base/70 backdrop-blur-sm px-2.5 py-1.5 pointer-events-none"
                >
                  <div className="text-[12px] text-primary font-semibold">حجز مقترح</div>
                  <div className="text-[11px] text-ink">{magic.patient}</div>
                </motion.div>
              </>
            )}
            {visibleEvents.map((evt) => (
              <EventCard
                key={evt.id}
                evt={evt}
                canEdit={canEdit}
                onClick={() => onSelect(evt)}
                onMove={onMove}
                onResize={onResize}
                rowHeight={rowHeight}
                overlap={overlapByEventId.get(evt.id)}
              />
            ))}
            {isDenseSlot && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(cellEvents[2] || cellEvents[0]);
                }}
                className="dense-more-chip absolute start-1 bottom-1 z-[12] rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                title={`يوجد ${fmtNumberAr(cellEvents.length)} مواعيد في هذه الخانة`}
              >
                +{fmtNumberAr(hiddenCount)} المزيد
              </button>
            )}
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-1 end-1 text-[10px] text-primary/75">
                انقر مرتين للحجز
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function EventCard({ evt, canEdit, onClick, onMove, onResize, rowHeight, overlap }) {
  const c = COLOR_MAP[evt.color] || COLOR_MAP.blue;
  const height = Math.max(44, evt.duration * rowHeight - 6);
  const topOffset = Math.max(4, (evt.start - Math.floor(evt.start)) * rowHeight + 4);
  const compact = height < 64;
  const overlapCols = Math.max(1, Number(overlap?.cols) || 1);
  const overlapCol = Math.max(0, Math.min(overlapCols - 1, Number(overlap?.col) || 0));
  const widthPct = 100 / overlapCols;
  return (
    <motion.button
      layout
      layoutId={`appt-${evt.id}`}
      drag={canEdit ? "y" : false}
      dragConstraints={{ top: -200, bottom: 200 }}
      dragElastic={0.1}
      onDragEnd={(_, info) => {
        if (!canEdit) return;
        const deltaHours = Math.round((info.offset.y || 0) / rowHeight);
        if (!deltaHours) return;
        const nextStart = Math.min(16, Math.max(8, evt.start + deltaHours));
        onMove?.(evt.id, { start: nextStart });
      }}
      onWheel={(e) => {
        if (!canEdit) return;
        if (!e.shiftKey) return;
        e.preventDefault();
        const step = e.deltaY > 0 ? -0.5 : 0.5;
        const nextDuration = Math.min(2.5, Math.max(0.5, evt.duration + step));
        onResize?.(evt.id, { duration: nextDuration });
      }}
      whileHover={{ y: -3, boxShadow: "0px 14px 25px rgba(11,167,173,0.16)" }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      className={`appt-event group absolute rounded-xl border-s-4 ${c.bar} ${c.bg} ${c.border} text-start px-2.5 py-1.5 cursor-pointer overflow-hidden shadow-sm ${
        evt.urgent ? "appt-event-urgent" : ""
      } ${
        evt.overbooked ? "ring-2 ring-danger/70 bg-danger-soft/55" : ""
      }`}
      style={{
        height,
        top: topOffset,
        insetInlineStart: `calc(${(overlapCol * widthPct).toFixed(4)}% + ${overlapCol === 0 ? 4 : 2}px)`,
        width: `calc(${widthPct.toFixed(4)}% - ${overlapCols === 1 ? 8 : 4}px)`,
        zIndex: 11 + overlapCol,
      }}
    >
      <div className="event-title calendar-event-title text-[13px] font-semibold truncate">
        {evt.urgent && (
          <span
            className="inline-flex items-center me-1.5 align-middle"
            title={`حالة طارئة: ${evt.reason} · ${fmtTime(evt.start)}`}
            aria-label="حالة طارئة"
          >
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse-soft" />
          </span>
        )}
        <span>{evt.patient}</span>
      </div>
      {!compact && <div className="event-meta calendar-event-meta text-[11px] truncate">{evt.reason}</div>}
      {evt.overbooked && !compact && (
        <div className="text-[10px] mt-1 font-bold text-danger flex items-center gap-1">
          <span>⚠</span>
          <span>محجوز فوق الطاقة</span>
        </div>
      )}
      {evt.urgent && (
        <div className="pointer-events-none absolute start-2 bottom-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="rounded-md border border-danger/35 bg-surface-base/95 px-2 py-1 text-[10px] text-danger shadow-card whitespace-nowrap">
            حالة طارئة · {fmtTime(evt.start)}
          </div>
        </div>
      )}
    </motion.button>
  );
}

function MonthEventCard({ evt, onClick }) {
  const c = COLOR_MAP[evt.color] || COLOR_MAP.blue;
  return (
    <motion.button
      layout
      layoutId={`appt-${evt.id}`}
      onClick={onClick}
      whileHover={{ y: -1, scale: 1.01 }}
      className={`w-full rounded-lg border ${c.border} ${c.bg} text-start px-2.5 py-2 ${
        evt.urgent ? "appt-event-urgent" : ""
      } ${
        evt.overbooked ? "ring-1 ring-danger/60 bg-danger-soft/25" : ""
      }`}
    >
      <div className="month-event-title text-sm font-semibold">
        {evt.urgent && (
          <span
            className="inline-flex items-center me-1.5 align-middle"
            title={`حالة طارئة: ${evt.reason} · ${fmtTime(evt.start)}`}
            aria-label="حالة طارئة"
          >
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse-soft" />
          </span>
        )}
        <span>{evt.patient}</span>
      </div>
      <div className="month-event-meta text-xs">{fmtTime(evt.start)} · {evt.reason}</div>
      {evt.overbooked && <div className="text-[10px] mt-1 font-bold text-danger">محجوز فوق الطاقة</div>}
    </motion.button>
  );
}

function AICopilotPanel({
  aiDraft,
  magic,
  selectedSlots,
  quickSuggestions,
  onClearSlots,
  onCreateBulk,
  onOpenWhatsappPreview,
}) {
  const whatsappText = magic
    ? `مرحباً ${magic.patient}، نذكرك بموعدك مع ${DOCTORS.find((d) => d.id === magic.doctorId)?.name || "الطبيب"} يوم ${DAYS_AR[magic.day]?.label} الساعة ${fmtTime(magic.start)}.`
    : "مرحباً، نذكرك بموعدك القادم في العيادة. الرجاء تأكيد الحضور.";
  return (
    <aside className="rounded-xl border border-surface-high bg-surface-low/40 p-4">
      <h3 className="h3 flex items-center gap-2">
        <BoltIcon className="w-5 h-5 text-primary" />
        AI Copilot
      </h3>
      <p className="text-xs text-ink-mute mt-1">
        مساعد ذكي يقترح أفضل الخيارات ويقلل خطوات الحجز.
      </p>

      <div className="mt-4 space-y-2">
        {quickSuggestions.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-2.5 rounded-lg bg-surface-low text-xs text-ink-variant"
          >
            {s}
          </motion.div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-surface-high p-3">
        <div className="label-caps mb-1">AI Draft</div>
        <div className="text-xs text-ink-variant min-h-10">{aiDraft || "—"}</div>
      </div>

      <div className="mt-4 space-y-2">
        <button className="btn-primary w-full" onClick={onCreateBulk} disabled={selectedSlots.length === 0}>
          إنشاء حجز مجمّع ({fmtNumberAr(selectedSlots.length)})
        </button>
        <button className="btn-ghost w-full" onClick={onClearSlots}>مسح التحديدات</button>
        <button
          className="btn-secondary w-full"
          onClick={() =>
            onOpenWhatsappPreview?.({
              text: whatsappText,
              patient: magic?.patient || "المريض",
              doctor: magic ? DOCTORS.find((d) => d.id === magic.doctorId)?.name || "—" : "—",
              time: magic ? `${DAYS_AR[magic.day]?.label} ${fmtTime(magic.start)}` : "الموعد القادم",
            })
          }
        >
          <PhoneIcon className="w-4 h-4" />
          إرسال واتساب
        </button>
      </div>
    </aside>
  );
}

function DoctorQueueBoard({ queue, onPrimaryAction, resolveService }) {
  const sections = [
    { key: "waitingExam", title: "بانتظار المعاينة", items: queue.waitingExam, tone: "bg-warn-soft/10 border-warn/35" },
    { key: "inSession", title: "جلسة جارية", items: queue.inSession, tone: "bg-primary-soft/10 border-primary/35" },
    { key: "needsApproval", title: "بحاجة اعتماد", items: queue.needsApproval, tone: "bg-danger-soft/10 border-danger/30" },
    { key: "readyForReception", title: "جاهز للاستقبال", items: queue.readyForReception, tone: "bg-secondary-soft/10 border-secondary/35" },
  ];

  return (
    <div className="card-pad">
      <div className="flex items-center justify-between mb-3">
        <h3 className="h3">لوحة إدارة الجلسات للطبيب</h3>
        <span className="text-xs text-ink-mute">بدء جلسة ← إنهاء ← اعتماد ← تسليم للاستقبال</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {sections.map((section) => (
          <section key={section.key} className={`rounded-2xl border ${section.tone} p-3 max-h-[520px] overflow-y-auto`}>
            <div className="sticky top-0 bg-surface-low/90 px-1 py-2 border-b border-surface-high flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-ink">{section.title}</div>
              <div className="text-xs text-ink-mute">{fmtNumberAr(section.items.length)}</div>
            </div>
            <div className="space-y-2">
              {section.items.length === 0 ? (
                <div className="text-xs text-ink-mute py-2">لا يوجد مرضى</div>
              ) : (
                section.items.map((item, idx) => (
                  <DoctorQueueRow
                    key={item.id}
                    item={item}
                    sectionKey={section.key}
                    isCurrent={section.key === "inSession" && idx === 0}
                    onPrimaryAction={onPrimaryAction}
                    resolveService={resolveService}
                  />
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function DoctorQueueRow({ item, sectionKey, isCurrent, onPrimaryAction, resolveService }) {
  const service = resolveService(item);
  const actionMap = {
    confirmed: "بدء الجلسة",
    arrived: "بدء الجلسة",
    in_consultation: "إنهاء الجلسة",
    completed: item.handoffReady ? null : "اعتماد العلاج والسعر",
  };
  const action = actionMap[item.status];
  const delayMinutes = getDelayMinutes(item);
  const criticalDelay =
    delayMinutes >= 60 && (item.status === "confirmed" || item.status === "arrived");

  return (
    <motion.article
      layout="position"
      className={`rounded-xl px-3 py-3 ${
        isCurrent
          ? "bg-primary text-white shadow-[0_8px_26px_rgba(14,116,144,0.24)] ring-1 ring-primary/40"
          : "bg-surface-base/90 border border-surface-high"
      } ${criticalDelay ? "queue-delay-critical" : ""}`}
      transition={{ layout: { type: "spring", stiffness: 340, damping: 30 } }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={`font-semibold truncate ${isCurrent ? "text-base text-white" : "text-sm text-ink"}`}>{item.patient}</div>
          <div className={`text-[11px] truncate ${isCurrent ? "text-white/85" : "text-ink-mute"}`}>{service.name}</div>
          <div className={`text-xs mt-0.5 ${isCurrent ? "text-white/80" : "text-ink-mute"}`}>{fmtMoney(item.treatmentPrice || service.price)}</div>
        </div>
        {sectionKey === "readyForReception" && <span className="chip bg-secondary-soft text-secondary">جاهز</span>}
      </div>

      {action && (
        <button onClick={() => onPrimaryAction(item)} className={`w-full mt-2 h-9 rounded-lg text-xs font-semibold ${isCurrent ? "bg-surface-base text-primary" : "btn-primary"}`}>
          {action}
        </button>
      )}
    </motion.article>
  );
}

function QueueBoard({ queue, invoiceByAppointmentId, onPrimaryAction, resolveService }) {
  const [density, setDensity] = useState("normal"); // normal | busy
  const isBusy = density === "busy";
  const sections = [
    {
      key: "waiting",
      title: QUEUE_LABELS.waiting,
      items: queue.waiting,
      tone: "bg-warn-soft/10 border-warn/35",
      indicator: "bg-warn",
    },
    {
      key: "inConsultation",
      title: QUEUE_LABELS.inConsultation,
      items: queue.inConsultation,
      tone: "bg-primary-soft/10 border-primary/35",
      indicator: "bg-primary",
    },
    {
      key: "readyToPay",
      title: QUEUE_LABELS.readyToPay,
      items: queue.readyToPay,
      tone: "bg-danger-soft/10 border-danger/30",
      indicator: "bg-danger",
    },
    {
      key: "paidCompleted",
      title: QUEUE_LABELS.paidCompleted,
      items: queue.paidCompleted,
      tone: "bg-secondary-soft/10 border-secondary/35",
      indicator: "bg-secondary",
    },
  ];

  return (
    <div className="card-pad">
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <h3 className="h3">لوحة تشغيل الطابور اللحظي</h3>
        <div className="flex items-center gap-1 rounded-lg bg-surface-low p-1 border border-surface-high">
          <button
            className={`h-8 px-2.5 rounded-md text-xs font-semibold transition-colors ${!isBusy ? "bg-primary text-white" : "text-ink-mute hover:text-ink"}`}
            onClick={() => setDensity("normal")}
          >
            عادي
          </button>
          <button
            className={`h-8 px-2.5 rounded-md text-xs font-semibold transition-colors ${isBusy ? "bg-primary text-white" : "text-ink-mute hover:text-ink"}`}
            onClick={() => setDensity("busy")}
          >
            مزدحم
          </button>
        </div>
      </div>

      <div className="text-xs text-ink-mute mb-3">بانتظار ← عند الطبيب ← جاهز للدفع ← مدفوع</div>

      <LayoutGroup id="queue-operating-flow">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {sections.map((section) => (
            <motion.section
              layout
              key={section.key}
              className={`rounded-2xl border ${section.tone} shadow-[0_2px_8px_rgba(15,23,42,0.04)] max-h-[520px] overflow-y-auto`}
            >
              <div className="sticky top-0 z-[1] px-3 py-2.5 bg-surface-low border-b border-surface-high flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${section.indicator}`} />
                  <div className="text-sm font-bold text-ink">{section.title}</div>
                </div>
                <div className="text-xs text-ink-mute">{fmtNumberAr(section.items.length)}</div>
              </div>
              <motion.div
                layout
                className={`${isBusy ? "p-2 space-y-1.5" : "p-3 space-y-2"} transition-all duration-300`}
              >
                {section.items.length === 0 ? (
                  <div className="text-xs text-ink-mute py-2 px-1">لا يوجد مرضى — لا إجراء مطلوب حالياً</div>
                ) : (
                  section.items.map((item, idx) => (
                    <QueueRow
                      key={item.id}
                      item={item}
                      sectionKey={section.key}
                      isNext={section.key === "waiting" && idx === 0}
                      isCurrentPinned={section.key === "inConsultation" && idx === 0}
                      isBusy={isBusy}
                      invoice={invoiceByAppointmentId.get(item.id)}
                      onPrimaryAction={onPrimaryAction}
                      resolveService={resolveService}
                    />
                  ))
                )}
              </motion.div>
            </motion.section>
          ))}
        </div>
      </LayoutGroup>
    </div>
  );
}

function QueueRow({ item, invoice, sectionKey, isNext, isCurrentPinned, isBusy, onPrimaryAction, resolveService }) {
  const actionMap = {
    confirmed: "تسجيل وصول",
    arrived: "بدء المعاينة",
    in_consultation: "إنهاء المعاينة",
    completed: "تسجيل الدفع",
  };
  const action = actionMap[item.status];
  const isCurrent = sectionKey === "inConsultation" && isCurrentPinned;
  const delayMinutes = getDelayMinutes(item);
  const isLate = delayMinutes > 0 && (item.status === "confirmed" || item.status === "arrived");
  const criticalDelay = isLate && delayMinutes >= 60;
  const latenessTone = isLate && delayMinutes >= 15 ? "text-danger" : isLate ? "text-warn" : "text-ink-mute";
  const service = resolveService(item);
  const amount = Number(invoice?.amount ?? service.price) || 0;
  const paymentStatus = item.status === "paid"
    ? "paid"
    : invoice?.status === "paid"
    ? "paid"
    : invoice?.status === "partial"
    ? "partial"
    : "unpaid";
  const paymentBadgeClass =
    paymentStatus === "paid"
      ? "bg-secondary-soft text-secondary"
      : paymentStatus === "partial"
      ? "bg-warn-soft text-warn"
      : "bg-danger-soft text-danger";
  const paymentLabel =
    paymentStatus === "paid" ? "مدفوع" : paymentStatus === "partial" ? "جزئي" : "غير مدفوع";
  const showPaymentBadge = sectionKey === "readyToPay" || sectionKey === "paidCompleted";

  return (
    <motion.article
      layout="position"
      layoutId={`queue-item-${item.id}`}
      initial={{ opacity: 0, x: 14, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: -14, y: -4 }}
      transition={{ duration: 0.22, ease: "easeOut", layout: { type: "spring", stiffness: 360, damping: 32 } }}
      className={`rounded-xl ${
        isBusy ? "px-2.5 py-2" : "px-3 py-3"
      } ${
        isCurrent
          ? "bg-primary text-white shadow-[0_8px_26px_rgba(14,116,144,0.24)] ring-1 ring-primary/40"
          : isNext
          ? "bg-warn-soft/45 ring-1 ring-warn/35"
          : "bg-surface-base/90 border border-surface-high"
      } ${item.overbooked ? "bg-danger-soft/25 ring-1 ring-danger/40" : ""} ${
        criticalDelay ? "queue-delay-critical" : ""
      } transition-all duration-300`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={`font-semibold truncate leading-6 ${isCurrent ? "text-white text-base" : "text-ink text-sm"}`}>
            {item.patient}
          </div>
          <div className={`text-[11px] truncate ${isCurrent ? "text-white/85" : "text-ink-mute"}`}>{service.name}</div>
          <div className={`text-xs h-5 mt-0.5 flex items-center gap-1.5 ${isCurrent ? "text-white/85" : "text-ink-mute"}`}>
            <span>{fmtTime(item.start)}</span>
            <span>·</span>
            <span>{fmtMoney(amount)}</span>
            <span className={isCurrent ? "text-white/80" : latenessTone}>
              {isLate ? `متأخر +${fmtNumberAr(delayMinutes)} د` : "في الوقت"}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isNext && !isCurrent && <span className="chip bg-warn text-white">التالي</span>}
          {showPaymentBadge && <span className={`chip ${paymentBadgeClass}`}>{paymentLabel}</span>}
          {item.overbooked && <span className="text-[11px] font-bold text-danger">⚠</span>}
        </div>
      </div>
      {isLate && (
        <div className={`mt-1 h-1 rounded-full overflow-hidden ${isCurrent ? "bg-surface-base/25" : "bg-surface-mid"}`}>
          <div
            className={`${delayMinutes >= 15 ? "bg-danger" : "bg-warn"} h-full`}
            style={{ width: `${Math.min(100, 20 + delayMinutes * 2)}%` }}
          />
        </div>
      )}

      {action && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onPrimaryAction(item)}
          className={`w-full mt-2 rounded-lg text-xs font-semibold ${
            isBusy ? "h-8" : "h-9"
          } ${isCurrent ? "bg-surface-base text-primary" : "btn-primary"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55`}
        >
          {action}
        </motion.button>
      )}
    </motion.article>
  );
}

function WhatsappPreviewDialog({ preview, onClose }) {
  const [text, setText] = useState(preview.text);
  const [activeBulk, setActiveBulk] = useState(preview.bulkItems?.[0]?.id || null);
  const currentBulkText = preview.bulkItems?.find((x) => x.id === activeBulk)?.text || "";
  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/30 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-base rounded-xl shadow-pop max-w-lg w-full overflow-hidden card-modal dark-glass-panel"
        initial={{ y: 20, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 10, opacity: 0 }}
      >
        <div className="px-6 pt-6 pb-4 border-b border-surface-high">
          <h3 className="h3">مراجعة رسالة واتساب</h3>
          <p className="text-xs text-ink-mute mt-1">
            {preview.patient} · {preview.doctor} · {preview.time}
          </p>
        </div>
        <div className="p-6 space-y-3">
          {preview.bulkItems?.length > 0 && (
            <div className="rounded-lg border border-surface-high p-2">
              <div className="text-xs text-ink-mute mb-2">معاينة دفعة التذكير</div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {preview.bulkItems.map((item) => (
                  <button
                    key={item.id}
                    className={`chip ${activeBulk === item.id ? "bg-primary text-white" : "bg-surface-mid text-ink-variant"}`}
                    onClick={() => setActiveBulk(item.id)}
                  >
                    {item.id}
                  </button>
                ))}
              </div>
              <div className="text-xs text-ink-variant bg-surface-low rounded-lg p-2">
                {currentBulkText}
              </div>
            </div>
          )}
          <textarea
            rows={5}
            className="input min-h-[140px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="rounded-lg bg-surface-low px-3 py-2 text-xs text-ink-variant">
            لن يتم الإرسال مباشرة. سيتم فتح واتساب بعد تأكيدك.
          </div>
        </div>
        <div className="px-6 py-4 bg-surface-low/60 border-t border-surface-high flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">إلغاء</button>
          <a
            className="btn-primary"
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => preview.onConfirm?.()}
          >
            تأكيد وفتح واتساب
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PaymentModal({ payload, onClose, onConfirm }) {
  const [paidAmount, setPaidAmount] = useState(payload.total);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/30 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-base rounded-xl shadow-pop max-w-md w-full overflow-hidden card-modal dark-glass-panel"
        initial={{ y: 20, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 10, opacity: 0 }}
      >
        <div className="px-6 pt-6 pb-4 border-b border-surface-high">
          <h3 className="h3">تسجيل الدفع</h3>
          <p className="text-xs text-ink-mute mt-1">{payload.patient} · {payload.service}</p>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <label className="label-caps mb-1.5 block">المبلغ المستحق</label>
            <input
              className="input"
              type="number"
              min="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(Number(e.target.value))}
            />
            <div className="text-xs text-ink-mute mt-1">الإجمالي: {fmtMoney(payload.total)}</div>
          </div>
          <div>
            <label className="label-caps mb-1.5 block">طريقة الدفع</label>
            <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="cash">نقدي</option>
              <option value="card">بطاقة</option>
              <option value="other">أخرى</option>
            </select>
          </div>
        </div>
        <div className="px-6 py-4 bg-surface-low/60 border-t border-surface-high flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">إلغاء</button>
          <button
            onClick={() => onConfirm({ paidAmount, paymentMethod })}
            className="btn-primary"
          >
            تأكيد الدفع
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DoctorSessionModal({ payload, procedures, onClose, onConfirm }) {
  const [treatmentName, setTreatmentName] = useState(payload.treatmentName);
  const [treatmentPrice, setTreatmentPrice] = useState(payload.treatmentPrice);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [error, setError] = useState("");
  const available = procedures?.length ? procedures : [{ id: "fallback", name: payload.treatmentName, price: payload.basePrice }];

  const submit = () => {
    if (Number(treatmentPrice) <= 0) {
      setError("السعر النهائي غير صالح");
      return;
    }
    if (Number(treatmentPrice) !== Number(payload.basePrice) && !adjustmentReason.trim()) {
      setError("يرجى إدخال سبب تعديل السعر");
      return;
    }
    onConfirm({
      appointmentId: payload.appointmentId,
      treatmentName,
      treatmentPrice: Number(treatmentPrice),
      adjustmentReason: adjustmentReason.trim(),
    });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/30 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-base rounded-xl shadow-pop max-w-md w-full overflow-hidden card-modal dark-glass-panel"
        initial={{ y: 20, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 10, opacity: 0 }}
      >
        <div className="px-6 pt-6 pb-4 border-b border-surface-high">
          <h3 className="h3">اعتماد الجلسة</h3>
          <p className="text-xs text-ink-mute mt-1">{payload.patient}</p>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <label className="label-caps mb-1.5 block">العلاج</label>
            <select
              className="input"
              value={treatmentName}
              onChange={(e) => {
                const value = e.target.value;
                setTreatmentName(value);
                const service = available.find((item) => item.name === value);
                setTreatmentPrice(Number(service?.price) || payload.basePrice);
                setError("");
              }}
            >
              {available.map((service) => (
                <option key={service.id} value={service.name}>{service.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-caps mb-1.5 block">السعر النهائي (ل.س)</label>
            <input
              type="number"
              min="0"
              className="input"
              value={treatmentPrice}
              onChange={(e) => {
                setTreatmentPrice(e.target.value);
                setError("");
              }}
            />
            <div className="text-xs text-ink-mute mt-1">السعر الافتراضي: {fmtMoney(payload.basePrice)}</div>
          </div>
          {Number(treatmentPrice) !== Number(payload.basePrice) && (
            <div>
              <label className="label-caps mb-1.5 block">سبب تعديل السعر</label>
              <input
                className="input"
                value={adjustmentReason}
                onChange={(e) => {
                  setAdjustmentReason(e.target.value);
                  setError("");
                }}
                placeholder="مثال: إجراء إضافي داخل الجلسة"
              />
            </div>
          )}
          {error && <div className="text-xs text-danger font-semibold">{error}</div>}
        </div>
        <div className="px-6 py-4 bg-surface-low/60 border-t border-surface-high flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">إلغاء</button>
          <button onClick={submit} className="btn-primary">اعتماد وإرسال للاستقبال</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EventDrawer({ event, allEvents, onClose, canEdit, onEdit, onDelete }) {
  const c = COLOR_MAP[event.color] || COLOR_MAP.blue;
  const patientHistory = allEvents
    .filter((item) => item.patient === event.patient && item.id !== event.id)
    .sort((a, b) => b.day - a.day || b.start - a.start)
    .slice(0, 3);
  const noShowCount = allEvents.filter((item) => item.patient === event.patient && item.status === "no_show").length;
  const totalVisits = allEvents.filter((item) => item.patient === event.patient).length || 1;
  const noShowRate = Math.round((noShowCount / totalVisits) * 100);
  const drawer = (
    <motion.div
      className="fixed inset-0 z-[70] bg-ink/30 backdrop-blur-sm flex justify-end"
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
        className="w-full max-w-md bg-surface-base h-full overflow-y-auto dark-glass-panel"
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
          <div className="rounded-lg border border-surface-high bg-surface-low/40 p-3">
            <div className="label-caps mb-2">ملخص المريض السريع</div>
            <div className="text-xs text-ink-variant mb-2">معدل الغياب: <span className="font-semibold text-ink">{noShowRate}%</span></div>
            <div className="space-y-1.5">
              {patientHistory.length === 0 ? (
                <div className="text-xs text-ink-mute">لا يوجد سجل سابق.</div>
              ) : (
                patientHistory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="text-ink">{item.reason}</span>
                    <span className="text-ink-mute">{DAYS_AR[item.day]?.label} · {fmtTime(item.start)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {canEdit ? (
            <div className="flex gap-2 pt-2">
              <button
                className="btn-danger flex-1"
                onClick={() => onDelete?.(event)}
              >
                حذف الموعد
              </button>
              <button
                className="btn-primary flex-1"
                onClick={() => onEdit?.(event)}
              >
                تعديل
              </button>
            </div>
          ) : (
            <div className="text-xs text-ink-mute pt-2">عرض فقط — يرجى التواصل مع الاستقبال للتعديل.</div>
          )}
        </div>
      </motion.aside>
    </motion.div>
  );

  if (typeof document !== "undefined") {
    return createPortal(drawer, document.body);
  }
  return drawer;
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

function getDelayMinutes(appt) {
  if (appt.day !== 0) return 0;
  const now = new Date();
  const nowHours = now.getHours() + now.getMinutes() / 60;
  return Math.max(0, Math.floor((nowHours - Number(appt.start || 0)) * 60));
}

function getCurrentWorkWeekRangeLabel() {
  const now = new Date();
  const day = now.getDay(); // 0 Sunday
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  const fmt = new Intl.DateTimeFormat("ar-SY-u-ca-gregory-nu-latn", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}

function MagicFloatingCard({ magic, onClose, onConfirm, cardRef }) {
  const doctor = DOCTORS.find((d) => d.id === magic.doctorId);
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      className="absolute top-16 start-4 z-20 w-[340px] card-pad shadow-pop border-primary/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div data-stagger>
          <div className="label-caps text-primary">نتيجة AI</div>
          <div className="text-sm font-semibold text-ink mt-1">{magic.patient}</div>
          <div className="text-xs text-ink-mute">{magic.reason}</div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-surface-low grid place-items-center">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 space-y-1 text-xs text-ink-variant">
        <motion.div data-stagger initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
          اليوم: <span className="font-semibold text-ink">{DAYS_AR[magic.day]?.label}</span>
        </motion.div>
        <motion.div data-stagger initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.11 }}>
          الوقت: <span className="font-semibold text-ink">{fmtTime(magic.start)}</span>
        </motion.div>
        <motion.div data-stagger initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.17 }}>
          الطبيب: <span className="font-semibold text-ink">{doctor?.name}</span>
        </motion.div>
      </div>

      <div data-stagger className="mt-4 flex gap-2">
        <button onClick={onConfirm} className="btn-primary flex-1">تأكيد فوري</button>
        <button onClick={onClose} className="btn-ghost flex-1">إغلاق</button>
      </div>
    </motion.div>
  );
}
