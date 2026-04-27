import { motion } from "framer-motion";
import {
  PlusIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { INVENTORY } from "../data/mock.js";
import { STATUS_AR } from "../data/strings.js";
import StatCard from "../components/ui/StatCard.jsx";
import Chip from "../components/ui/Chip.jsx";

export default function Inventory() {
  const ok = INVENTORY.filter((i) => i.status === "ok").length;
  const low = INVENTORY.filter((i) => i.status === "low").length;
  const crit = INVENTORY.filter((i) => i.status === "critical").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <div className="label-caps text-primary">المستلزمات والصيدلية</div>
          <h1 className="h1 mt-1">المخزون</h1>
          <p className="text-ink-variant mt-1 max-w-xl">
            تتبع مستويات المخزون وحدود الطلب وإدارة المستلزمات الجديدة.
          </p>
        </div>
        <button className="btn-primary self-start lg:self-auto">
          <PlusIcon className="w-4 h-4" /> إضافة عنصر
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard label="متوفر" value={ok} hint="مستويات صحية" icon={CheckBadgeIcon} tone="success" />
        <StatCard label="منخفض" value={low} hint="تحت الحد الأدنى" icon={ArchiveBoxIcon} tone="warn" />
        <StatCard label="حرج" value={crit} hint="يجب الطلب فوراً" icon={ExclamationTriangleIcon} tone="danger" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <Th>العنصر</Th>
                <Th>الفئة</Th>
                <Th className="text-end">الكمية</Th>
                <Th className="text-end">الحد الأدنى</Th>
                <Th>المستوى</Th>
                <Th>الحالة</Th>
              </tr>
            </thead>
            <tbody>
              {INVENTORY.map((it, i) => {
                const pct = Math.min(100, Math.round((it.stock / Math.max(it.threshold * 4, 1)) * 100));
                const tone = it.status;
                const barColor = tone === "ok" ? "bg-secondary" : tone === "low" ? "bg-warn" : "bg-danger";
                return (
                  <motion.tr
                    key={it.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-t border-surface-low hover:bg-surface-low/60 transition"
                  >
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-ink">{it.name}</div>
                      <div className="text-xs text-ink-mute font-latin">{it.id}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-ink-variant">{it.category}</td>
                    <td className="px-5 py-4 text-sm font-display font-bold text-ink text-end font-latin">{it.stock}</td>
                    <td className="px-5 py-4 text-sm text-ink-variant text-end font-latin">{it.threshold}</td>
                    <td className="px-5 py-4 w-48">
                      <div className="h-1.5 bg-surface-mid rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.04 }}
                          className={`h-full ${barColor} rounded-full`}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Chip tone={tone}>{STATUS_AR[tone]}</Chip>
                    </td>
                  </motion.tr>
                );
              })}
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
