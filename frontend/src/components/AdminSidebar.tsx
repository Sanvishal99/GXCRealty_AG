"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAppConfig } from '@/context/AppConfigContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useEffect, useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { accessRequests as accessRequestsApi } from '@/lib/api';

const adminNav = [
  { name: 'Overview',          href: '/admin',                 icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', color: 'from-rose-500 to-pink-500' },
  { name: 'Content Editor',    href: '/admin/content',         icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'from-amber-500 to-orange-500' },
  { name: 'Users',             href: '/admin/users',           icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', color: 'from-indigo-500 to-purple-600' },
  { name: 'Access Requests',   href: '/admin/access-requests', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', color: 'from-amber-400 to-orange-500', badge: true },
  { name: 'KYC Review',        href: '/admin/kyc',             icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'from-emerald-500 to-teal-500' },
  { name: 'Incentives',         href: '/admin/commissions',     icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-cyan-500 to-blue-500' },
  { name: 'Properties',        href: '/admin/properties',      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: 'from-blue-500 to-indigo-600' },
  { name: 'Analytics',         href: '/admin/analytics',       icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'from-purple-500 to-pink-500' },
  { name: 'Withdrawals',       href: '/admin/withdrawals',     icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', color: 'from-emerald-500 to-teal-600' },
  { name: 'Company Invites',   href: '/admin/company-invites', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'from-violet-500 to-purple-600' },
  { name: 'Audit Logs',        href: '/admin/audit-logs',      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'from-slate-500 to-slate-700' },
  { name: 'Import',            href: '/admin/import',          icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', color: 'from-slate-500 to-slate-700' },
];

// First 4 for mobile bottom bar; rest go in the drawer
const MOBILE_PRIMARY = adminNav.slice(0, 4);
const MOBILE_MORE    = adminNav.slice(4);

export default function AdminSidebar() {
  const { theme, toggleTheme } = useTheme();
  const { config } = useAppConfig();
  const { profile, logout } = useUserProfile();
  const pathname = usePathname();
  const router = useRouter();
  const [pendingAccessCount, setPendingAccessCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const adminInitials = profile?.fullName
    ? profile.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SA';

  useEffect(() => {
    accessRequestsApi.pendingCount()
      .then(r => setPendingAccessCount(r.count))
      .catch(() => {});
  }, []);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  const NavItem = ({ item, onClick }: { item: typeof adminNav[0]; onClick?: () => void }) => {
    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
    const badgeCount = (item as any).badge ? pendingAccessCount : 0;
    return (
      <Link href={item.href} onClick={onClick}
        className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 font-semibold text-sm group border ${
          isActive ? 'bg-rose-500/15 text-rose-400 border-rose-500/25' : 'hover:bg-[var(--glass-bg-hover)] border-transparent'
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
        {badgeCount > 0 && !isActive && (
          <span className="ml-auto px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black">{badgeCount}</span>
        )}
        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      </Link>
    );
  };

  return (
    <>
      {/* ── Desktop Sidebar ───────────────────────────────────────── */}
      <aside className="w-64 hidden md:flex flex-col h-screen glass-panel border-r border-t-0 border-b-0 border-l-0 sticky top-0"
        style={{ borderRightColor: 'var(--border-subtle)' }}>
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/25 overflow-hidden">
              {config.branding.logoImage ? (
                <img src={config.branding.logoImage} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm">{config.branding.logoEmoji}</span>
              )}
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
          {adminNav.map(item => <NavItem key={item.name} item={item} />)}
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
              {adminInitials}
            </div>
            <div className="min-w-0 relative z-10 flex-1">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{profile?.fullName || 'Super Admin'}</p>
              <p className="text-[10px] font-semibold text-rose-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                Full Access
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="relative z-10 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-rose-500/20 transition-all flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile: Top Header ──────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center overflow-hidden shadow-md">
            {config.branding.logoImage
              ? <img src={config.branding.logoImage} alt="Logo" className="w-full h-full object-cover" />
              : <span className="text-xs">{config.branding.logoEmoji}</span>
            }
          </div>
          <div>
            <span className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{config.branding.appName}</span>
            <span className="ml-2 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400">Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center relative"
          >
            <Menu className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            {pendingAccessCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center">{pendingAccessCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile: Bottom Nav (primary 4 items) ───────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-stretch">
          {MOBILE_PRIMARY.map(item => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const badgeCount = (item as any).badge ? pendingAccessCount : 0;
            return (
              <Link key={item.name} href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1 relative transition-all"
                style={{ color: isActive ? undefined : 'var(--text-muted)' }}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-rose-500" />
                )}
                <div className="relative">
                  <svg className={`w-5 h-5 ${isActive ? 'text-rose-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d={item.icon} />
                  </svg>
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-black text-[8px] font-black flex items-center justify-center">{badgeCount}</span>
                  )}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wide ${isActive ? 'text-rose-400' : ''}`}>{item.name.split(' ')[0]}</span>
              </Link>
            );
          })}
          {/* More */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wide">More</span>
          </button>
        </div>
      </nav>

      {/* ── Mobile: Slide-in Drawer ─────────────────────────────────── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="absolute top-0 right-0 bottom-0 w-[280px] flex flex-col overflow-y-auto"
            style={{ backgroundColor: 'var(--bg-primary)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{config.branding.appName}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-rose-400">Admin Panel</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-xl glass-panel">
                <X className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
              </button>
            </div>

            {/* All nav items */}
            <nav className="flex-1 px-3 py-3 space-y-1">
              {adminNav.map(item => (
                <NavItem key={item.name} item={item} onClick={() => setDrawerOpen(false)} />
              ))}
            </nav>

            {/* Bottom: theme + admin badge */}
            <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="glass-panel rounded-2xl px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <span className="text-lg">{theme === 'dark' ? '🌙' : '☀️'}</span>
                  <span className="text-xs font-semibold capitalize">{theme} Mode</span>
                </div>
                <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
                  <div className="theme-toggle-knob" />
                </button>
              </div>
              <div className="glass-panel rounded-2xl p-3 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.12) 0%, rgba(249,115,22,0.08) 100%)' }}>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {adminInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{profile?.fullName || 'Super Admin'}</p>
                  <p className="text-[10px] font-semibold text-rose-400">Full Access</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-rose-500/20 transition-all flex-shrink-0"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
