import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownTrayIcon,
  CurrencyDollarIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { useBilling } from "../context/BillingContext.jsx";
import { useAppointments } from "../context/AppointmentsContext.jsx";
import { STATUS_AR } from "../data/strings.js";
import Chip from "../components/ui/Chip.jsx";
import { DAYS_AR, fmtNumberAr, fmtPatientFileId, fmtTime } from "../data/strings.js";

const TABS = [
  { id: "all", label: "الكل" },
  { id: "draft", label: "مسودات" },
  { id: "paid", label: "مدفوعة" },
  { id: "due", label: "مستحقة" },
  { id: "overdue", label: "متأخرة" },
];

const CURRENCY_MODES = [
  { id: "SYP", label: "ل.س", rate: 13000, trend: "متغير" },
  { id: "USD", label: "$", rate: 1, trend: "مرجعي" },
  { id: "USDT", label: "USDT", rate: 1, trend: "مستقر" },
];

function formatMoneyByMode(amount, modeId) {
  const mode = CURRENCY_MODES.find((item) => item.id === modeId) || CURRENCY_MODES[0];
  const converted = amount * mode.rate;
  if (mode.id === "SYP") {
    return `${converted.toLocaleString("ar-SY-u-nu-latn", { maximumFractionDigits: 0 })} ل.س`;
  }
  return `${converted.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${mode.label}`;
}

function exportRows(invoices, modeId, selectedCurrency) {
  return invoices.map((inv) => ({
    invoiceId: inv.id,
    patient: inv.patient,
    patientId: inv.patientId ? fmtPatientFileId(inv.patientId) : "—",
    date: inv.date,
    status: STATUS_AR[inv.status] || inv.status,
    amount: formatMoneyByMode(inv.amount, modeId),
    currency: selectedCurrency.label,
  }));
}

function downloadCsv(rows) {
  const headers = ["رقم الفاتورة", "المريض", "رقم الملف", "التاريخ", "الحالة", "المبلغ", "العملة"];
  const csvBody = rows.map((row) =>
    [
      row.invoiceId,
      row.patient,
      row.patientId,
      row.date,
      row.status,
      row.amount,
      row.currency,
    ]
      .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  const csvContent = [headers.join(","), ...csvBody].join("\n");
  const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `billing-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportPdfPreview(rows) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1000,height=800");
  if (!printWindow) return;
  const tableRows = rows
    .map(
      (row) => `<tr>
        <td>${row.invoiceId}</td>
        <td>${row.patient}</td>
        <td>${row.patientId}</td>
        <td>${row.date}</td>
        <td>${row.status}</td>
        <td>${row.amount}</td>
      </tr>`
    )
    .join("");
  printWindow.document.write(`
    <html dir="rtl" lang="ar">
      <head>
        <title>تقرير الفوترة</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
          h1 { margin: 0 0 8px; font-size: 22px; }
          .meta { margin-bottom: 16px; color: #475569; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-size: 12px; }
          th { background: #f1f5f9; }
        </style>
      </head>
      <body>
        <h1>تقرير الفوترة</h1>
        <div class="meta">تم الإنشاء في ${new Date().toLocaleString("ar-SY-u-ca-gregory-nu-latn")}</div>
        <table>
          <thead>
            <tr>
              <th>رقم الفاتورة</th>
              <th>المريض</th>
              <th>رقم الملف</th>
              <th>التاريخ</th>
              <th>الحالة</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export default function Billing() {
  const { invoices, updateInvoice, deleteInvoice } = useBilling();
  const { items: appointments, setAppointmentStatus } = useAppointments();
  const [tab, setTab] = useState("all");
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [recentlyPaid, setRecentlyPaid] = useState(null);
  const [currencyMode, setCurrencyMode] = useState("SYP");
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  const filtered = invoices.filter((i) => tab === "all" || i.status === tab);
  const handoffDrafts = invoices
    .filter((i) => i.status === "draft" && i.appointmentId)
    .map((inv) => ({
      ...inv,
      appointment: appointments.find((a) => a.id === inv.appointmentId),
    }))
    .sort((a, b) => (a.appointment?.day ?? 99) - (b.appointment?.day ?? 99) || (a.appointment?.start ?? 99) - (b.appointment?.start ?? 99));

  const handleMarkPaid = (inv) => {
    setRecentlyPaid(inv.id);
    updateInvoice(inv.id, { status: "paid" });
    if (inv.appointmentId) {
      setAppointmentStatus(inv.appointmentId, "paid");
    }
    setTimeout(() => setRecentlyPaid(null), 600);
  };

  const totalToday = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices
    .filter((i) => i.status === "due")
    .reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + i.amount, 0);
  const selectedCurrency = CURRENCY_MODES.find((mode) => mode.id === currencyMode) || CURRENCY_MODES[0];
  const rowsForExport = exportRows(filtered, currencyMode, selectedCurrency);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!exportRef.current?.contains(event.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <div className="label-caps text-primary">الإيرادات والفواتير</div>
          <h1 className="h1 mt-1">الفوترة</h1>
          <p className="text-ink-variant mt-1 max-w-xl">
            إنشاء وإدارة فواتير المرضى وتتبع المدفوعات والأرصدة المستحقة.
          </p>
        </div>
        <div className="chip bg-primary-soft text-primary">إنشاء الفاتورة يتم تلقائيًا عند إنهاء المعاينة</div>
      </div>

      <div className="card-pad py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="label-caps">العملة المعروضة</span>
          <div className="flex bg-surface-low p-1 rounded-full border border-surface-high">
            {CURRENCY_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setCurrencyMode(mode.id)}
                className={`px-3 h-8 text-xs font-semibold rounded-full transition-colors ${
                  currencyMode === mode.id
                    ? "bg-surface-base text-primary shadow-card"
                    : "text-ink-mute hover:text-ink"
                }`}
              >
                {mode.id}
              </button>
            ))}
          </div>
        </div>
        <div className="text-sm text-ink-variant">
          وضع السوق السوري: <span className="font-semibold text-ink">{selectedCurrency.trend}</span>
        </div>
      </div>

      {handoffDrafts.length > 0 && (
        <div className="card-pad">
          <div className="flex items-center justify-between mb-3">
            <h2 className="h3">تحويل الدفع من المواعيد</h2>
            <span className="chip bg-warn-soft text-warn">{fmtNumberAr(handoffDrafts.length)} بانتظار الدفع</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {handoffDrafts.slice(0, 6).map((inv) => (
              <div key={inv.id} className="rounded-xl border border-warn/30 bg-warn-soft/20 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-ink">{inv.patient}</div>
                    <div className="text-xs text-ink-mute mt-0.5">
                      {inv.appointment
                        ? `${DAYS_AR[inv.appointment.day]?.label} · ${fmtTime(inv.appointment.start)}`
                        : "موعد مرتبط"}
                    </div>
                  </div>
                  <Chip tone="draft">مسودة</Chip>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-display font-bold text-ink">{formatMoneyByMode(inv.amount, currencyMode)}</span>
                  <button className="btn-primary h-8 px-3 text-xs" onClick={() => handleMarkPaid(inv)}>
                    تأكيد الدفع
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial health banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="billing-health-strip grid grid-cols-3 gap-px bg-surface-high rounded-2xl overflow-hidden shadow-card"
      >
        {/* Today's revenue */}
        <div className="billing-health-card bg-surface-base p-5 hover:bg-surface-low/30 transition-colors">
          <div className="flex items-center gap-1.5 text-xs font-bold text-success uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            إيرادات اليوم
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display font-bold text-[28px] text-ink leading-none">
              {formatMoneyByMode(totalToday, currencyMode).replace(` ${selectedCurrency.label}`, "")}
            </span>
            <span className="text-sm text-ink-mute font-sans">{selectedCurrency.label}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-xs text-success">
            <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
            +9.2٪ عن أمس
          </div>
        </div>

        {/* Pending */}
        <div className="billing-health-card bg-surface-base p-5 border-x border-surface-high hover:bg-surface-low/30 transition-colors">
          <div className="flex items-center gap-1.5 text-xs font-bold text-warn uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-warn" />
            مدفوعات معلقة
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display font-bold text-[28px] text-ink leading-none">
              {formatMoneyByMode(totalPending, currencyMode).replace(` ${selectedCurrency.label}`, "")}
            </span>
            <span className="text-sm text-ink-mute font-sans">{selectedCurrency.label}</span>
          </div>
          <div className="mt-1.5 text-xs text-ink-mute">
            {fmtNumberAr(invoices.filter((i) => i.status === "due").length)} فواتير في الانتظار
          </div>
        </div>

        {/* Overdue */}
        <div
          className={`billing-health-card p-5 transition-colors ${
            totalOverdue > 0
              ? "bg-danger-soft/30 hover:bg-danger-soft/50"
              : "bg-surface-base hover:bg-surface-low/30"
          }`}
        >
          <div
            className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${
              totalOverdue > 0 ? "text-danger" : "text-ink-mute"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                totalOverdue > 0 ? "bg-danger animate-pulse-soft" : "bg-ink-mute"
              }`}
            />
            فواتير متأخرة
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`font-display font-bold text-[28px] leading-none ${
                totalOverdue > 0 ? "text-danger" : "text-ink"
              }`}
            >
              {formatMoneyByMode(totalOverdue, currencyMode).replace(` ${selectedCurrency.label}`, "")}
            </span>
            <span
              className={`text-sm font-sans ${
                totalOverdue > 0 ? "text-danger/60" : "text-ink-mute"
              }`}
            >
              {selectedCurrency.label}
            </span>
          </div>
          <div
            className={`mt-1.5 text-xs ${
              totalOverdue > 0 ? "text-danger/70" : "text-ink-mute"
            }`}
          >
            {totalOverdue > 0 ? "تتطلب متابعة فورية" : "لا توجد فواتير متأخرة"}
          </div>
        </div>
      </motion.div>

      {/* Table card */}
      <div className="card">
        <div className="px-5 py-4 border-b border-surface-high flex items-center justify-between flex-wrap gap-3">
          <div className="flex bg-surface-low p-1 rounded-full border border-surface-high">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="relative px-3.5 h-8 text-xs font-semibold rounded-full"
              >
                {tab === t.id && (
                  <motion.span
                    layoutId="billing-tab"
                    className="absolute inset-0 bg-surface-base shadow-card rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative ${tab === t.id ? "text-primary" : "text-ink-mute"}`}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
          <div className="relative" ref={exportRef}>
            <button
              className="btn-ghost h-9 px-3 text-xs"
              onClick={() => setExportOpen((prev) => !prev)}
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              تصدير
            </button>
            {exportOpen && (
              <div className="absolute z-30 end-0 mt-2 w-56 rounded-xl border border-surface-high bg-surface-base shadow-pop p-1.5">
                <button
                  className="w-full text-start px-3 py-2.5 rounded-lg hover:bg-surface-low text-sm text-ink"
                  onClick={() => {
                    exportPdfPreview(rowsForExport);
                    setExportOpen(false);
                  }}
                >
                  تصدير كـ PDF
                </button>
                <button
                  className="w-full text-start px-3 py-2.5 rounded-lg hover:bg-surface-low text-sm text-ink"
                  onClick={() => {
                    downloadCsv(rowsForExport);
                    setExportOpen(false);
                  }}
                >
                  تصدير كـ Excel / CSV
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full lux-table">
            <thead>
              <tr>
                <Th>الفاتورة</Th>
                <Th>المريض</Th>
                <Th>التاريخ</Th>
                <Th className="text-end">المبلغ</Th>
                <Th>الحالة</Th>
                <Th className="text-left ps-6">الإجراءات</Th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((inv, i) => (
                  <motion.tr
                    key={inv.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}
                    transition={{ delay: i * 0.04 }}
                    className={`border-t border-surface-low transition-colors ${
                      inv.status === "overdue"
                        ? "billing-row-overdue"
                        : inv.status === "due"
                        ? "billing-row-due"
                        : inv.status === "paid"
                        ? "billing-row-paid"
                        : "hover:bg-surface-low/60"
                    }`}
                  >
                    <td
                      className={`px-5 py-4 font-semibold text-sm font-latin border-s-[3px] ps-4 ${
                        inv.status === "overdue"
                          ? "text-danger border-danger"
                          : inv.status === "due"
                          ? "text-warn border-warn"
                          : inv.status === "paid"
                          ? "text-success border-success/60"
                          : "text-primary border-transparent"
                      } ${recentlyPaid === inv.id ? "paid-stamp" : ""}`}
                    >
                      {inv.id}
                    </td>
                    <td className="px-5 py-4 text-sm text-ink font-medium">
                      <div>{inv.patient}</div>
                      {inv.patientId && (
                        <div className="text-[11px] text-ink-mute font-latin">
                          {fmtPatientFileId(inv.patientId)}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-ink-variant">
                      <div>{inv.date}</div>
                      {inv.appointmentId && <div className="text-[10px] text-primary font-latin">{inv.appointmentId}</div>}
                    </td>
                    <td className="px-5 py-4 text-end">
                      <span className="font-display font-bold text-sm text-ink">
                        {formatMoneyByMode(inv.amount, currencyMode)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Chip tone={inv.status}>{STATUS_AR[inv.status]}</Chip>
                    </td>
                    <td className="px-5 py-4 text-left">
                      <div className="flex items-center gap-1 justify-start">
                        <button className="text-xs font-semibold text-ink-mute hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-surface-low">
                          عرض
                        </button>
                        <button
                          onClick={() => setEditor({ mode: "edit", invoice: inv })}
                          className="w-8 h-8 rounded-lg hover:bg-surface-mid grid place-items-center text-ink-mute hover:text-primary transition-colors"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(inv)}
                          className="w-8 h-8 rounded-lg hover:bg-danger-soft grid place-items-center text-ink-mute hover:text-danger transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        {inv.status !== "paid" && (
                          <button
                            onClick={() => handleMarkPaid(inv)}
                            className="flex items-center gap-1 text-xs font-semibold text-success hover:bg-success-soft px-2 py-1 rounded-lg transition-colors"
                          >
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            تأكيد الدفع
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <CurrencyDollarIcon className="w-10 h-10 text-ink-line mx-auto mb-2" />
                    <div className="text-sm font-semibold text-ink">لا توجد فواتير في هذا التصنيف</div>
                    <div className="text-xs text-ink-mute mt-1">ستظهر المسودات تلقائيًا بعد إنهاء المعاينة.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editor && (
        <InvoiceEditorModal
          mode={editor.mode}
          invoice={editor.invoice}
          onClose={() => setEditor(null)}
          onSave={(payload) => {
            updateInvoice(editor.invoice.id, payload);
            setEditor(null);
          }}
        />
      )}

      {deleting && (
        <DeleteDialog
          title="حذف الفاتورة؟"
          description={`سيتم حذف الفاتورة ${deleting.id}. لا يمكن التراجع.`}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            deleteInvoice(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-5 py-3 label-caps text-start ${className}`}>{children}</th>
  );
}

function InvoiceEditorModal({ mode, invoice, onClose, onSave }) {
  const [form, setForm] = useState({
    patient: invoice?.patient || "",
    date: invoice?.date || "اليوم",
    amount: invoice?.amount || "",
    status: invoice?.status || "due",
  });
  const [error, setError] = useState("");

  const submit = () => {
    if (!form.patient.trim()) return setError("اسم المريض مطلوب");
    if (!form.amount) return setError("المبلغ مطلوب");
    onSave({ ...form, amount: Number(form.amount) });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="card-modal w-full max-w-xl p-6"
      >
        <h3 className="h3 mb-5">
          {mode === "create" ? "إضافة فاتورة جديدة" : "تعديل الفاتورة"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="اسم المريض">
            <input
              className="input"
              value={form.patient}
              onChange={(e) => setForm((f) => ({ ...f, patient: e.target.value }))}
            />
          </Field>
          <Field label="التاريخ">
            <input
              className="input"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </Field>
          <Field label="المبلغ (ر.س)">
            <input
              type="number"
              className="input"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </Field>
          <Field label="الحالة">
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="draft">مسودة</option>
              <option value="due">مستحقة</option>
              <option value="paid">مدفوعة</option>
              <option value="overdue">متأخرة</option>
            </select>
          </Field>
        </div>
        {error && <div className="text-xs text-danger mt-2">{error}</div>}
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-ghost" onClick={onClose}>إلغاء</button>
          <button className="btn-primary" onClick={submit}>
            {mode === "create" ? "إضافة" : "حفظ التعديل"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DeleteDialog({ title, description, onClose, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="card-modal w-full max-w-md p-6"
      >
        <h3 className="h3">{title}</h3>
        <p className="text-sm text-ink-variant mt-2">{description}</p>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-ghost" onClick={onClose}>إلغاء</button>
          <button className="btn-danger" onClick={onConfirm}>تأكيد الحذف</button>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label-caps mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
