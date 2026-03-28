"use client";
import Sidebar from '@/components/Sidebar';
import { useTheme } from '@/context/ThemeContext';
import { useAppConfig } from '@/context/AppConfigContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, toggleTheme } = useTheme();
  const { config } = useAppConfig();

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-panel px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.branding.logoEmoji}</span>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{config.branding.appName}</h1>
        </div>
        <button onClick={toggleTheme} className="p-2 rounded-lg glass-panel" aria-label="Toggle theme">
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <main className="flex-1 overflow-y-auto w-full relative">
        {/* Maintenance Mode Banner */}
        {config.features.maintenanceMode && (
          <div className="sticky top-0 z-40 flex items-center gap-3 px-5 py-3 bg-amber-500/20 border-b border-amber-500/30 backdrop-blur-md">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-semibold text-amber-500">{config.features.maintenanceMessage}</p>
          </div>
        )}

        {/* Background glow orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] glow-orb-1 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] glow-orb-2 rounded-full blur-[120px] pointer-events-none translate-y-1/2" />
        {children}
      </main>
    </div>
  );
}
