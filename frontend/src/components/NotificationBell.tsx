"use client";
import { useState } from "react";
import { useNotifications, Notification, NotifType } from "@/context/NotificationContext";
import { useTheme } from "@/context/ThemeContext";

const TYPE_COLOR: Record<NotifType, string> = {
  success: "bg-emerald-500",
  error:   "bg-rose-500",
  warning: "bg-amber-400",
  info:    "bg-indigo-500",
};

const CAT_ICON: Record<Notification["category"], string> = {
  deal:       "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  kyc:        "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  visit:      "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  commission: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  system:     "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  chat:       "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
};

function timeAgo(date: Date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead, dismiss } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { theme } = useTheme();

  // Fully opaque, hardcoded per theme – no CSS variables so there's zero bleed-through
  const panelBg     = theme === "dark" ? "#1e1e24" : "#f0f0f4";
  const headerBg    = theme === "dark" ? "#17171c" : "#e8e8ec";
  const borderColor = theme === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.12)";
  const textPrimary = theme === "dark" ? "#fafafa" : "#09090b";
  const textMuted   = theme === "dark" ? "#71717a" : "#a1a1aa";
  const textSec     = theme === "dark" ? "#a1a1aa" : "#52525b";
  const hoverBg     = theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const unreadBg    = theme === "dark" ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)";

  const displayed = filter === "unread" ? notifications.filter(n => !n.read) : notifications;

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        id="notification-bell"
        onClick={() => setIsOpen(o => !o)}
        className="relative p-2 rounded-xl glass-panel hover:bg-white/5 transition-colors w-full flex items-center gap-2"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: textSec }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="text-sm font-medium" style={{ color: textSec }}>Notifications</span>
        {unreadCount > 0 && (
          <span className="ml-auto w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-indigo-500/40">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <>
          {/* Click-away backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Panel: fixed, anchored from top of sidebar bottom section, width fits within sidebar */}
          <div
            className="fixed z-50 rounded-2xl overflow-hidden flex flex-col"
            style={{
              backgroundColor: panelBg,    // solid, no alpha — guaranteed opaque
              border: `1px solid ${borderColor}`,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              width: '240px',              // fits within the 256px sidebar
              maxHeight: '480px',
              bottom: '220px',
              left: '8px',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ backgroundColor: headerBg, borderBottom: `1px solid ${borderColor}` }}
            >
              <div>
                <h3 className="font-bold text-sm" style={{ color: textPrimary }}>Notifications</h3>
                <p className="text-[11px]" style={{ color: textMuted }}>{unreadCount} unread</p>
              </div>
              <button
                onClick={markAllRead}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Mark all read
              </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 px-2 py-1.5 flex-shrink-0" style={{ borderBottom: `1px solid ${borderColor}`, backgroundColor: headerBg }}>
              {(["all", "unread"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 text-[11px] px-2 py-1 rounded-md font-semibold capitalize transition-colors ${
                    filter === f ? "bg-indigo-500/20 text-indigo-400" : ""
                  }`}
                  style={filter !== f ? { color: textMuted } : {}}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Notification list */}
            <div className="overflow-y-auto flex-1">
              {displayed.length === 0 ? (
                <div className="py-10 text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" style={{ color: textMuted }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-xs" style={{ color: textMuted }}>No notifications</p>
                </div>
              ) : (
                displayed.map(notif => {
                  const isExpanded = expandedId === notif.id;
                  return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      markRead(notif.id);
                      setExpandedId(prev => prev === notif.id ? null : notif.id);
                    }}
                    className="flex gap-2.5 px-3 py-3 cursor-pointer transition-all group relative"
                    style={{
                      borderBottom: `1px solid ${borderColor}`,
                      backgroundColor: isExpanded
                        ? (theme === 'dark' ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)')
                        : (!notif.read ? unreadBg : 'transparent'),
                    }}
                    onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = hoverBg; }}
                    onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = !notif.read ? unreadBg : 'transparent'; }}
                  >
                    {/* Unread dot */}
                    {!notif.read && (
                      <div className={`absolute left-1.5 top-4 w-1 h-1 rounded-full ${TYPE_COLOR[notif.type]}`} />
                    )}

                    {/* Icon */}
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: theme === 'dark' ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)' }}>
                      <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={CAT_ICON[notif.category]} />
                      </svg>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0 pl-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-semibold leading-tight" style={{ color: textPrimary }}>{notif.title}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[10px]" style={{ color: textMuted }}>{timeAgo(notif.timestamp)}</span>
                          <svg
                            className="w-3 h-3 transition-transform duration-200"
                            style={{ color: textMuted, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <p
                        className={`text-[11px] mt-0.5 leading-relaxed transition-all duration-200 ${isExpanded ? '' : 'line-clamp-2'}`}
                        style={{ color: textSec }}
                      >
                        {notif.message}
                      </p>
                    </div>

                    {/* Dismiss X — appears on hover */}
                    <button
                      onClick={e => { e.stopPropagation(); dismiss(notif.id); }}
                      className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                      style={{ color: textMuted }}
                      aria-label="Dismiss"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
