"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAppConfig } from '@/context/AppConfigContext';
import NotificationBell from '@/components/NotificationBell';

const adminNav = [
  { name: 'Overview',       href: '/admin',          icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', color: 'from-rose-500 to-pink-500' },
  { name: 'Content Editor', href: '/admin/content',   icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'from-amber-500 to-orange-500' },
  { name: 'Users',          href: '/admin/users',     icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', color: 'from-indigo-500 to-purple-600' },
  { name: 'KYC Review',     href: '/admin/kyc',       icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'from-emerald-500 to-teal-500' },
  { name: 'Commissions',    href: '/admin/commissions', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-cyan-500 to-blue-500' },
  { name: 'Analytics',      href: '/admin/analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'from-purple-500 to-pink-500' },
];

export default function AdminSidebar() {
  const { theme, toggleTheme } = useTheme();
  const { config } = useAppConfig();
  const pathname = usePathname();

  return (
    <aside className="w-64 hidden md:flex flex-col h-screen glass-panel border-r border-t-0 border-b-0 border-l-0 sticky top-0"
      style={{ borderRightColor: 'var(--border-subtle)' }}>
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/25 text-lg">
            {config.branding.logoEmoji}
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {config.branding.appName}
          </h1>
        </div>
        <span className="ml-12 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30">
          Admin Panel
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto">
        {adminNav.map(item => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link key={item.name} href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 font-semibold text-sm group border ${
                isActive
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/25'
                  : 'hover:bg-[var(--glass-bg-hover)] border-transparent'
              }`}
              style={{ color: isActive ? undefined : 'var(--text-secondary)' }}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                isActive ? `bg-gradient-to-br ${item.color} shadow-md` : 'glass-panel'
              }`}>
                <svg className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </div>
              <span>{item.name}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 mt-auto space-y-2">
        <NotificationBell />
        <div className="glass-panel rounded-2xl px-3 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <span className="text-lg">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span className="text-xs font-semibold capitalize">{theme} Mode</span>
          </div>
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
            <div className="theme-toggle-knob" />
          </button>
        </div>
        <div className="glass-panel rounded-2xl p-3 flex items-center gap-3 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.12) 0%, rgba(249,115,22,0.08) 100%)' }}>
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-lg relative z-10">
            SA
          </div>
          <div className="min-w-0 relative z-10">
            <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>Super Admin</p>
            <p className="text-[10px] font-semibold text-rose-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
              Full Access
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
