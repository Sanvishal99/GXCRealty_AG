"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { useUserProfile } from '@/context/UserProfileContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, isLoading, isAuthenticated } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || profile.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, profile.role, router]);

  // Show nothing while checking auth / redirecting
  if (isLoading || !isAuthenticated || profile.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative pt-[56px] pb-[70px] md:pt-0 md:pb-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2"
             style={{ background: 'rgba(244,63,94,0.1)' }} />
        {children}
      </main>
    </div>
  );
}
