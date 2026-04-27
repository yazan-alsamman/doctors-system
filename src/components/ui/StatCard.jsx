import { motion } from "framer-motion";

export default function StatCard({ label, value, delta, hint, icon: Icon, tone = "primary", index = 0 }) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-secondary-soft text-secondary",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger",
  }[tone];

  return (
    <motion.div
      className="card-pad flex items-start gap-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
    >
      {Icon && (
        <div className={`w-11 h-11 rounded-lg grid place-items-center ${toneClasses}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="label-caps">{label}</div>
        <div className="mt-1 flex items-baseline gap-2">
          <div className="font-display font-bold text-2xl text-ink">{value}</div>
          {delta && (
            <span className={`text-xs font-semibold ${delta.startsWith("-") ? "text-danger" : "text-secondary"}`}>
              {delta}
            </span>
          )}
        </div>
        {hint && <div className="mt-1 text-xs text-ink-mute">{hint}</div>}
      </div>
    </motion.div>
  );
}
