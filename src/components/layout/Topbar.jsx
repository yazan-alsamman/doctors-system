import { MagnifyingGlassIcon, BellIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { ROLES, ROLE_LABEL_AR, useAuth } from "../../context/AuthContext.jsx";

export default function Topbar() {
  const { role, setRole, user } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-surface-high">
      <div className="px-6 lg:px-10 py-3 flex items-center gap-4">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute end-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-mute" />
            <input
              className="input pe-10"
              placeholder="ابحث عن مريض، موعد، أو سجل..."
            />
          </div>
        </div>

        <RoleSwitcher role={role} setRole={setRole} />

        <button className="w-10 h-10 rounded-lg hover:bg-surface-low grid place-items-center relative">
          <BellIcon className="w-5 h-5 text-ink-variant" />
          <span className="absolute top-2 start-2 w-2 h-2 rounded-full bg-danger animate-pulse-soft" />
        </button>
        <button className="w-10 h-10 rounded-lg hover:bg-surface-low grid place-items-center">
          <Squares2X2Icon className="w-5 h-5 text-ink-variant" />
        </button>

        <div className="hidden lg:flex items-center gap-3 ps-3 border-s border-surface-high">
          <div className="text-end leading-tight">
            <div className="text-sm font-semibold text-ink">{user.name}</div>
            <div className="label-caps">{ROLE_LABEL_AR[role]} · {user.title}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold text-sm">
            {user.initials}
          </div>
        </div>
      </div>
    </header>
  );
}

function RoleSwitcher({ role, setRole }) {
  const roles = [ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN];
  return (
    <div className="hidden md:flex items-center bg-surface-low p-1 rounded-full">
      {roles.map((r) => (
        <button
          key={r}
          onClick={() => setRole(r)}
          className="relative px-3.5 h-8 text-xs font-semibold rounded-full transition-colors"
        >
          {role === r && (
            <motion.span
              layoutId="role-pill"
              className="absolute inset-0 bg-white shadow-card rounded-full"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className={`relative ${role === r ? "text-primary" : "text-ink-mute"}`}>
            {ROLE_LABEL_AR[r]}
          </span>
        </button>
      ))}
    </div>
  );
}
