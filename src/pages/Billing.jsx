import { useState } from "react";
import { motion } from "framer-motion";
import {
  PlusIcon,
  ArrowDownTrayIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext.jsx";
import { useBilling } from "../context/BillingContext.jsx";
import { STATUS_AR, fmtMoney } from "../data/strings.js";
import StatCard from "../components/ui/StatCard.jsx";
import Chip from "../components/ui/Chip.jsx";

const TABS = [
  { id: "all", label: "الكل" },
  { id: "paid", label: "مدفوعة" },
  { id: "due", label: "مستحقة" },
  { id: "overdue", label: "متأخرة" },
];

export default function Billing() {
  const { can } = useAuth();
  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useBilling();
  const [tab, setTab] = useState("all");
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const filtered = invoices.filter((i) => tab === "all" || i.status === tab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <div className="label-caps text-primary">الإيرادات والفواتير</div>
          <h1 className="h1 mt-1">الفوترة</h1>
          <p className="text-ink-variant mt-1 max-w-xl">
            إنشاء وإدارة فواتير المرضى وتتبع المدفوعات والأرصدة المستحقة.
          </p>
        </div>
        {can("billing.create") && (
          <button onClick={() => setEditor({ mode: "create" })} className="btn-primary self-start lg:self-auto">
            <PlusIcon className="w-4 h-4" /> فاتورة جديدة
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="إيرادات اليوم" value="2,180 ر.س" delta="+9.2٪" icon={CurrencyDollarIcon} tone="success" />
        <StatCard label="مدفوعات معلقة" value="1,280 ر.س" hint="3 فواتير" icon={ClockIcon} tone="warn" />
        <StatCard label="متأخرة" value="320 ر.س" hint="فاتورة واحدة" icon={ExclamationTriangleIcon} tone="danger" />
        <StatCard label="إجمالي الشهر" value="48,940 ر.س" delta="+12.4٪" icon={CurrencyDollarIcon} tone="primary" />
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-surface-high flex items-center justify-between flex-wrap gap-3">
          <div className="flex bg-surface-low p-1 rounded-full">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="relative px-3.5 h-8 text-xs font-semibold rounded-full"
              >
                {tab === t.id && (
                  <motion.span
                    layoutId="billing-tab"
                    className="absolute inset-0 bg-white shadow-card rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative ${tab === t.id ? "text-primary" : "text-ink-mute"}`}>{t.label}</span>
              </button>
            ))}
          </div>
          <button className="btn-ghost h-9 px-3 text-xs">
            <ArrowDownTrayIcon className="w-4 h-4" /> تصدير
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <Th>الفاتورة</Th>
                <Th>المريض</Th>
                <Th>التاريخ</Th>
                <Th className="text-end">المبلغ</Th>
                <Th>الحالة</Th>
                <Th className="text-end pe-6">الإجراءات</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => (
                <motion.tr
                  key={inv.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-t border-surface-low hover:bg-surface-low/60 transition"
                >
                  <td className="px-5 py-4 text-primary font-semibold text-sm font-latin">{inv.id}</td>
                  <td className="px-5 py-4 text-sm text-ink">{inv.patient}</td>
                  <td className="px-5 py-4 text-sm text-ink-variant">{inv.date}</td>
                  <td className="px-5 py-4 text-sm font-display font-bold text-ink text-end">
                    {fmtMoney(inv.amount)}
                  </td>
                  <td className="px-5 py-4">
                    <Chip tone={inv.status}>{STATUS_AR[inv.status]}</Chip>
                  </td>
                  <td className="px-5 py-4 text-end">
                    <button className="text-xs font-semibold text-primary hover:underline ms-4">عرض</button>
                    <button
                      onClick={() => setEditor({ mode: "edit", invoice: inv })}
                      className="text-xs font-semibold text-primary hover:underline ms-4"
                    >
                      <PencilSquareIcon className="w-4 h-4 inline-block" />
                    </button>
                    <button
                      onClick={() => setDeleting(inv)}
                      className="text-xs font-semibold text-danger hover:underline ms-4"
                    >
                      <TrashIcon className="w-4 h-4 inline-block" />
                    </button>
                    {inv.status !== "paid" && (
                      <button
                        onClick={() => updateInvoice(inv.id, { status: "paid" })}
                        className="text-xs font-semibold text-secondary hover:underline"
                      >
                        تأكيد الدفع
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
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
            if (editor.mode === "create") addInvoice(payload);
            else updateInvoice(editor.invoice.id, payload);
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
  return <th className={`px-5 py-3 label-caps text-start ${className}`}>{children}</th>;
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
    <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-xl p-6"
      >
        <h3 className="h3 mb-4">{mode === "create" ? "إضافة فاتورة جديدة" : "تعديل الفاتورة"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="اسم المريض">
            <input className="input" value={form.patient} onChange={(e) => setForm((f) => ({ ...f, patient: e.target.value }))} />
          </Field>
          <Field label="التاريخ">
            <input className="input" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </Field>
          <Field label="المبلغ (ر.س)">
            <input type="number" className="input" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </Field>
          <Field label="الحالة">
            <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="due">مستحقة</option>
              <option value="paid">مدفوعة</option>
              <option value="overdue">متأخرة</option>
            </select>
          </Field>
        </div>
        {error && <div className="text-xs text-danger mt-2">{error}</div>}
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-ghost" onClick={onClose}>إلغاء</button>
          <button className="btn-primary" onClick={submit}>{mode === "create" ? "إضافة" : "حفظ التعديل"}</button>
        </div>
      </motion.div>
    </div>
  );
}

function DeleteDialog({ title, description, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-md p-6"
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
