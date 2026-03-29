"use client";
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto relative pt-[56px] pb-[70px] md:pt-0 md:pb-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2"
             style={{ background: 'rgba(244,63,94,0.1)' }} />
        {children}
      </main>
    </div>
  );
}
