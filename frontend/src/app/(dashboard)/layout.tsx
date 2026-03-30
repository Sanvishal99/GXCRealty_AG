"use client";
import Sidebar from '@/components/Sidebar';
import { useAppConfig } from '@/context/AppConfigContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { config } = useAppConfig();

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full relative
        pt-[56px] pb-[70px]
        md:pt-0 md:pb-0">

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
