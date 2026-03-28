"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAppConfig } from '@/context/AppConfigContext';
import { useUserProfile } from '@/context/UserProfileContext';
import NotificationBell from '@/components/NotificationBell';

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { config } = useAppConfig();
  const { profile } = useUserProfile();
  const initials = profile.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', color: 'from-indigo-500 to-purple-600', activeText: 'text-indigo-400', activeBg: 'bg-indigo-500/15 border-indigo-500/25' },
    { name: 'Properties', href: '/properties', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', color: 'from-purple-500 to-pink-500', activeText: 'text-purple-400', activeBg: 'bg-purple-500/15 border-purple-500/25' },
    { name: 'Visits', href: '/visits', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'from-emerald-500 to-teal-500', activeText: 'text-emerald-400', activeBg: 'bg-emerald-500/15 border-emerald-500/25' },
    { name: 'Deals', href: '/deals', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', color: 'from-amber-500 to-orange-500', activeText: 'text-amber-400', activeBg: 'bg-amber-500/15 border-amber-500/25' },
    { name: 'Wallet', href: '/wallet', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', color: 'from-cyan-500 to-blue-500', activeText: 'text-cyan-400', activeBg: 'bg-cyan-500/15 border-cyan-500/25' },
    { name: 'Chat', href: '/chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: 'from-rose-500 to-pink-500', activeText: 'text-rose-400', activeBg: 'bg-rose-500/15 border-rose-500/25' },
    { name: 'Settings', href: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', color: 'from-slate-500 to-zinc-600', activeText: 'text-slate-400', activeBg: 'bg-slate-500/15 border-slate-500/25' },
  ];

  return (
    <aside className="w-64 hidden md:flex flex-col h-screen glass-panel border-r border-t-0 border-b-0 border-l-0 sticky top-0" style={{ borderRightColor: 'var(--border-subtle)' }}>
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="text-sm">{config.branding.logoEmoji}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {config.branding.appName}
          </h1>
        </div>
        <p className="text-[10px] font-bold tracking-widest uppercase ml-12" style={{ color: 'var(--text-muted)' }}>{config.branding.tagline}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 font-semibold text-sm group ${
                isActive
                  ? `${item.activeBg} ${item.activeText} border`
                  : 'hover:bg-[var(--glass-bg-hover)] border border-transparent'
              }`}
              style={{ color: isActive ? undefined : 'var(--text-secondary)' }}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                isActive
                  ? `bg-gradient-to-br ${item.color} shadow-md`
                  : 'glass-panel group-hover:bg-[var(--glass-bg-hover)]'
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

      {/* Bottom section */}
      <div className="p-3 mt-auto space-y-2">
        {/* Notification Bell */}
        <NotificationBell />

        {/* Theme toggle only (currency moved to Settings page) */}
        <div className="glass-panel rounded-2xl px-3 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <span className="text-lg">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span className="text-xs font-semibold capitalize">{theme} Mode</span>
          </div>
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
            <div className="theme-toggle-knob" />
          </button>
        </div>

        {/* User card — linked to Settings */}
        <Link href="/settings" className="glass-panel rounded-2xl p-3 flex items-center gap-3 relative overflow-hidden hover:bg-[var(--glass-bg-hover)] transition-all group"
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
            <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{profile.name}</p>
            <p className="text-[10px] font-semibold text-indigo-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {profile.role}
            </p>
          </div>
          <svg className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-indigo-400 transition-colors relative z-10 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </aside>
  );
}

