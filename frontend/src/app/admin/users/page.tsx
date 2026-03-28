"use client";
import { useState } from 'react';
import { useUserProfile } from '@/context/UserProfileContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAuditLog } from '@/context/LogContext';
import { User, Shield, Users, LogIn, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function AdminUsersPage() {
  const { profile: currentProfile, impersonateUser, isImpersonating, stopImpersonating } = useUserProfile();
  const { addNotification } = useNotifications();
  const { addLog } = useAuditLog();
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = currentProfile.role === 'ADMIN' || currentProfile.role === 'Admin';

  const MOCK_USERS = [
    { name: 'Sagar Developer', email: 'company@gxcrealty.com', role: 'COMPANY', agentId: 'GXC-CO-8273', bio: 'Main Developer Account', avatarUrl: null },
    { name: 'Elite Agent Alpha', email: 'agent1@gxcrealty.com', role: 'AGENT', agentId: 'GXC-AG-1102', bio: 'Top performing agent', avatarUrl: null },
    { name: 'New Partner Beta', email: 'other@gxcrealty.com', role: 'COMPANY', agentId: 'GXC-CO-9981', bio: 'New developer onboarding', avatarUrl: null },
    { name: 'System Admin', email: 'admin@gxcrealty.com', role: 'ADMIN', agentId: 'GXC-ADM-001', bio: 'System Administrator', avatarUrl: null },
  ];

  const handleLoginAs = (user: any) => {
    impersonateUser(user);
    addNotification({
      type: 'info',
      title: 'Session Switched',
      message: `You are now logged in as ${user.name}.`,
      category: 'system'
    });
    addLog(`IMPERSONATED User: ${user.email}`, 'security', { targetUser: user.email });
    window.location.href = '/dashboard';
  };

  const filteredUsers = MOCK_USERS.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="p-24 text-center">
        <Shield className="w-16 h-16 mx-auto mb-6 text-rose-500 opacity-20" />
        <h2 className="text-3xl font-black mb-2 text-rose-500">Access Restricted</h2>
        <p className="text-[var(--text-secondary)]">Only GXC Network Administrators can manage the user directory.</p>
        <Link href="/dashboard" className="inline-block mt-8 px-8 py-3 rounded-2xl bg-indigo-600 text-white font-bold">Return to Station</Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 relative z-10 w-full max-w-6xl mx-auto text-[var(--text-primary)]">
      <header className="mb-10 flex flex-col sm:flex-row justify-between sm:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)]">
            <Shield className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">User Governance</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Network <span className="text-gradient">Directory</span></h1>
          <p className="text-[var(--text-secondary)]">Manage system access and troubleshoot accounts via impersonation.</p>
        </div>
        
        {isImpersonating && (
          <button onClick={stopImpersonating} className="px-6 py-3 rounded-2xl bg-rose-600 text-white font-bold shadow-lg hover:bg-rose-700 transition-all">
            Stop Impersonation
          </button>
        )}
      </header>

      <div className="mb-8 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
          <input 
            type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full theme-input rounded-2xl pl-12 py-4 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.email} className="glass-panel rounded-3xl p-6 border border-white/5 hover:border-indigo-500/20 transition-all group overflow-hidden">
            <div className="flex items-center gap-4 mb-6 pt-4 border-t border-white/5 transition-all">
               <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center font-black">
                 {user.name.charAt(0)}
               </div>
               <div>
                 <h4 className="font-bold text-sm">{user.name}</h4>
                 <p className="text-[10px] opacity-40">{user.email}</p>
               </div>
            </div>
            <div className="flex gap-2">
               <button onClick={() => handleLoginAs(user)} disabled={user.email === currentProfile.email} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 disabled:opacity-30 flex items-center justify-center gap-2">
                 <LogIn className="w-3.5 h-3.5" /> Login As
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
