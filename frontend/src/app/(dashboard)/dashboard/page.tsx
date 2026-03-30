"use client";
import { useUserProfile } from '@/context/UserProfileContext';
import AgentDashboard from '../../../components/dashboards/AgentDashboard';
import AdminDashboard from '../../../components/dashboards/AdminDashboard';
import CompanyDashboard from '../../../components/dashboards/CompanyDashboard';
import { SkeletonDashboard } from '@/components/Skeleton';

export default function DashboardPage() {
  const { profile } = useUserProfile();

  if (!profile.role) return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <SkeletonDashboard />
    </div>
  );

  const role = profile.role.toUpperCase();

  return (
    <div className="min-h-screen w-full relative">
       {/* Global Background Ambient Glows */}
       <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
       <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />
       
       <main className="relative z-10 w-full animate-in fade-in duration-700">
         {role === 'ADMIN' && <AdminDashboard />}
         {(role === 'COMPANY' || role === 'DEVELOPER') && <CompanyDashboard />}
         {(role === 'AGENT' || role !== 'ADMIN' && role !== 'COMPANY') && <AgentDashboard />}
       </main>
    </div>
  );
}
