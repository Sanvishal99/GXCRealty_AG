"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAppConfig } from '@/context/AppConfigContext';
import { useUserProfile } from '@/context/UserProfileContext';
import NotificationBell from '@/components/NotificationBell';
import { isAdmin, isCompany } from '@/lib/constants';
import { X, MoreHorizontal } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  color: string;
  activeText: string;
  activeBg: string;
}

function buildNavItems(role: string, features: Record<string, any>): NavItem[] {
  const admin = isAdmin(role);
  const company = isCompany(role);

  const items: (NavItem | false)[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
      color: 'from-indigo-500 to-purple-600', activeText: 'text-indigo-400', activeBg: 'bg-indigo-500/15 border-indigo-500/25',
    },
    {
      name: admin ? 'Inventory' : company ? 'Portfolio' : 'Properties',
      href: admin ? '/admin/properties' : company ? '/portfolio' : '/properties',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      color: 'from-purple-500 to-pink-500', activeText: 'text-purple-400', activeBg: 'bg-purple-500/15 border-purple-500/25',
    },
    (admin || company) && {
      name: 'Intelligence',
      href: admin ? '/admin/analytics' : '/analytics',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      color: 'from-blue-500 to-indigo-600', activeText: 'text-blue-400', activeBg: 'bg-blue-500/15 border-blue-500/25',
    },
    features.enableVisits && {
      name: 'Visits',
      href: '/visits',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      color: 'from-emerald-500 to-teal-500', activeText: 'text-emerald-400', activeBg: 'bg-emerald-500/15 border-emerald-500/25',
    },
    !admin && !company && {
      name: 'Leads',
      href: '/leads',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      color: 'from-violet-500 to-purple-600', activeText: 'text-violet-400', activeBg: 'bg-violet-500/15 border-violet-500/25',
    },
    features.enableDeals && {
      name: 'Deals',
      href: '/deals',
      icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z',
      color: 'from-amber-500 to-orange-500', activeText: 'text-amber-400', activeBg: 'bg-amber-500/15 border-amber-500/25',
    },
    features.enableWallet && {
      name: 'Wallet',
      href: '/wallet',
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      color: 'from-cyan-500 to-blue-500', activeText: 'text-cyan-400', activeBg: 'bg-cyan-500/15 border-cyan-500/25',
    },
    features.enableChat && {
      name: 'Chat',
      href: '/chat',
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      color: 'from-rose-500 to-pink-500', activeText: 'text-rose-400', activeBg: 'bg-rose-500/15 border-rose-500/25',
    },
    admin && {
      name: 'Users',
      href: '/admin/users',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      color: 'from-slate-500 to-slate-700', activeText: 'text-slate-400', activeBg: 'bg-slate-500/15 border-slate-500/25',
    },
    admin && {
      name: 'Withdrawals',
      href: '/admin/withdrawals',
      icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
      color: 'from-emerald-500 to-teal-600', activeText: 'text-emerald-400', activeBg: 'bg-emerald-500/15 border-emerald-500/25',
    },
    admin && {
      name: 'Company Invites',
      href: '/admin/company-invites',
      icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      color: 'from-blue-500 to-indigo-600', activeText: 'text-blue-400', activeBg: 'bg-blue-500/15 border-blue-500/25',
    },
    admin && {
      name: 'Import',
      href: '/admin/import',
      icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
      color: 'from-slate-500 to-slate-700', activeText: 'text-slate-400', activeBg: 'bg-slate-500/15 border-slate-500/25',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      color: 'from-slate-500 to-zinc-600', activeText: 'text-slate-400', activeBg: 'bg-slate-500/15 border-slate-500/25',
    },
  ];

  return items.filter(Boolean) as NavItem[];
}

// ── Nav icon SVG ──────────────────────────────────────────────────────────────
function NavIcon({ d, active }: { d: string; active?: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? '' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

// ── Desktop Sidebar ───────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { config } = useAppConfig();
  const { profile, logout } = useUserProfile();
  const [moreOpen, setMoreOpen] = useState(false);

  const initials = profile.name
    ? profile.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const navItems = buildNavItems(profile.role, config.features);
  // Bottom nav: first 4 items + "More"
  const bottomPrimary = navItems.slice(0, 4);
  const bottomMore = navItems.slice(4);

  const handleLogout = () => { logout(); router.push('/login'); };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    return (
      <Link key={item.name} href={item.href}
        className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 font-semibold text-sm group ${isActive
            ? `${item.activeBg} ${item.activeText} border`
            : 'hover:bg-[var(--glass-bg-hover)] border border-transparent'
          }`}
        style={{ color: isActive ? undefined : 'var(--text-secondary)' }}
      >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${isActive ? `bg-gradient-to-br ${item.color} shadow-md` : 'glass-panel group-hover:bg-[var(--glass-bg-hover)]'
          }`}>
          <svg className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
          </svg>
        </div>
        <span>{item.name}</span>
        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      </Link>
    );
  };

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="w-64 hidden md:flex flex-col h-screen glass-panel border-r border-t-0 border-b-0 border-l-0 sticky top-0"
        style={{ borderRightColor: 'var(--border-subtle)' }}>
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 overflow-hidden">
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
          <p className="text-[10px] font-bold tracking-widest uppercase ml-12" style={{ color: 'var(--text-muted)' }}>
            {config.branding.tagline}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto">
          {navItems.map(item => <NavLink key={item.name} item={item} />)}
        </nav>

        {/* Bottom section */}
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
          <Link href="/settings"
            className="glass-panel rounded-2xl p-3 flex items-center gap-3 relative overflow-hidden hover:bg-[var(--glass-bg-hover)] transition-all group"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)' }}
          >
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 shadow-lg shadow-indigo-500/25 relative z-10">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                  {initials}
                </div>
              )}
            </div>
            <div className="min-w-0 relative z-10 flex-1">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{profile.name || profile.email}</p>
              <p className="text-[10px] font-semibold text-indigo-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                {profile.role}
              </p>
            </div>
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 group"
            style={{ color: 'var(--text-secondary)' }}
          >
            <div className="w-8 h-8 rounded-xl glass-panel flex items-center justify-center flex-shrink-0 group-hover:bg-rose-500/10 transition-all">
              <svg className="w-4 h-4 group-hover:text-rose-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span className="group-hover:text-rose-400 transition-colors">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile: Top Header ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center overflow-hidden shadow-md">
            {config.branding.logoImage
              ? <img src={config.branding.logoImage} alt="Logo" className="w-full h-full object-cover" />
              : <span className="text-xs">{config.branding.logoEmoji}</span>
            }
          </div>
          <span className="font-black text-base" style={{ color: 'var(--text-primary)' }}>{config.branding.appName}</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link href="/settings">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                : initials
              }
            </div>
          </Link>
        </div>
      </div>

      {/* ── Mobile: Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-stretch">
          {bottomPrimary.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.name} href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1 relative transition-all"
                style={{ color: isActive ? undefined : 'var(--text-muted)' }}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-indigo-500" />
                )}
                <div className={`w-6 h-6 flex items-center justify-center transition-transform ${isActive ? 'scale-110' : ''}`}>
                  <svg className={`w-5 h-5 ${isActive ? 'text-indigo-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 2} d={item.icon} />
                  </svg>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wide ${isActive ? 'text-indigo-500' : ''}`}>{item.name}</span>
              </Link>
            );
          })}

          {/* More button */}
          {bottomMore.length > 0 && (
            <button
              onClick={() => setMoreOpen(true)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1"
              style={{ color: 'var(--text-muted)' }}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase tracking-wide">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* ── Mobile: More Drawer ── */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-5 pb-8"
            style={{ backgroundColor: 'var(--bg-primary)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-neutral-300 mx-auto mb-5" />

            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>More</p>
              <button onClick={() => setMoreOpen(false)} className="p-2 rounded-xl hover:bg-neutral-100/10 transition-all">
                <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-5">
              {bottomMore.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link key={item.name} href={item.href} onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${isActive ? item.activeBg + ' border ' + item.activeText : 'border border-transparent'}`}
                    style={{ color: isActive ? undefined : 'var(--text-secondary)' }}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? `bg-gradient-to-br ${item.color} shadow-md` : 'bg-[var(--glass-bg)]'}`}>
                      <svg className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wide text-center leading-tight">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Profile + actions */}
            <div className="border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" /> : initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm truncate" style={{ color: 'var(--text-primary)' }}>{profile.name || profile.email}</p>
                  <p className="text-[10px] text-indigo-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    {profile.role}
                  </p>
                </div>
                <button onClick={toggleTheme} className="theme-toggle shrink-0" aria-label="Toggle theme">
                  <div className="theme-toggle-knob" />
                </button>
              </div>
              <button onClick={() => { handleLogout(); setMoreOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-rose-200 text-rose-600 font-bold text-sm hover:bg-rose-50 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
