"use client";
import { useNotifications, NotifType } from "@/context/NotificationContext";

const ICONS: Record<NotifType, string> = {
  success: "M5 13l4 4L19 7",
  error:   "M6 18L18 6M6 6l12 12",
  warning: "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  info:    "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

const COLORS: Record<NotifType, { ring: string; icon: string; bg: string }> = {
  success: { ring: "border-emerald-500/40", icon: "text-emerald-400", bg: "bg-emerald-500/10" },
  error:   { ring: "border-rose-500/40",    icon: "text-rose-400",    bg: "bg-rose-500/10" },
  warning: { ring: "border-amber-500/40",   icon: "text-amber-400",   bg: "bg-amber-500/10" },
  info:    { ring: "border-indigo-500/40",  icon: "text-indigo-400",  bg: "bg-indigo-500/10" },
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => {
        const c = COLORS[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border ${c.ring} shadow-2xl min-w-[300px] max-w-[360px] animate-in slide-in-from-right-4 fade-in duration-300`}
            style={{
              background: 'var(--notif-panel-bg)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${c.bg}`}>
              <svg className={`w-4 h-4 ${c.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[toast.type]} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{toast.title}</p>
              <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-secondary)" }}>{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
