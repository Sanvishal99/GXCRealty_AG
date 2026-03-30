"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/context/CurrencyContext';

export default function AdminDashboard() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const stats = [
    { label: 'Total Users',       value: '1,842',  sub: '+24 this week',  color: 'from-rose-500 to-orange-500', href: '/admin/users' },
    { label: 'Pending KYC',       value: '37',     sub: 'Needs review',   color: 'from-amber-500 to-yellow-500', href: '/admin/kyc' },
    { label: 'Total Commissions', value: formatCurrency(2400000),  sub: 'Distributed',    color: 'from-emerald-500 to-teal-500', href: '/admin/commissions' },
    { label: 'Active Advisors',    value: '1,204',  sub: 'Network nodes',  color: 'from-indigo-500 to-purple-500', href: '/admin/users' },
  ];

  const [pendingKyc, setPendingKyc] = useState([
    { name: 'Rahul Sharma',  email: 'rahul@ex.com',  submitted: '2h ago' },
    { name: 'Priya Mehta',   email: 'priya@ex.com',  submitted: '4h ago' },
    { name: 'Ankit Verma',   email: 'ankit@ex.com',  submitted: '6h ago' },
  ]);

  const [recentUsers, setRecentUsers] = useState([
    { id: '1', name: 'Alex Carter',  role: 'AGENT',   status: 'ACTIVE',      avatar: 'AC' },
    { id: '2', name: 'GXC Builders', role: 'COMPANY', status: 'ACTIVE',      avatar: 'GB' },
    { id: '3', name: 'Nina Patel',   role: 'AGENT',   status: 'PENDING_KYC', avatar: 'NP' },
    { id: '4', name: 'Mark Stone',   role: 'AGENT',   status: 'SUSPENDED',   avatar: 'MS' },
  ]);

  const [selectedKyc, setSelectedKyc] = useState<any | null>(null);

  const approveKyc = (id: string) => {
    // 1. Remove from pending queue
    setPendingKyc(prev => prev.filter(k => k.name !== id));
    // 2. Mock update status in main user list
    setRecentUsers((prev: any[]) => prev.map((u: any) => u.name === id ? { ...u, status: 'ACTIVE' } : u));
    setSelectedKyc(null);
  };

  const statusColor: Record<string, string> = {
    ACTIVE:      'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    PENDING_KYC: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    SUSPENDED:   'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 relative z-10 w-full">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Platform Overview</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage users, KYC, incentives, and system health.</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((s, i) => (
          <Link key={i} href={s.href} className="glass-panel p-6 rounded-2xl overflow-hidden relative group hover:scale-[1.02] transition-transform block text-left">
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${s.color} opacity-10 group-hover:opacity-20 transition-opacity blur-xl`} />
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
            <h3 className={`text-3xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Pending KYC */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Pending KYC</h3>
            <span className="px-2 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {pendingKyc.length} pending
            </span>
          </div>
          <div className="space-y-4">
            {pendingKyc.map((k, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
                  {k.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{k.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{k.email}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setSelectedKyc(k)} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors font-semibold">
                    Review Files
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Recent Users</h3>
            <Link href="/admin/users" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View all →</Link>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }} className="text-xs uppercase tracking-wider">
                <th className="text-left pb-4">User</th>
                <th className="text-left pb-4">Role</th>
                <th className="text-left pb-4">Status</th>
                <th className="text-right pb-4">Actions</th>
              </tr>
            </thead>
            <tbody className="space-y-2">
              {recentUsers.map((u, i) => (
                <tr key={i} className="border-t border-[var(--border-subtle)] hover:bg-white/5 transition-colors cursor-pointer" onClick={() => router.push(`/admin/users/${u.id}`)}>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-md">
                        {u.avatar}
                      </div>
                      <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-xs font-black uppercase tracking-widest text-indigo-400 opacity-80" style={{ color: 'var(--text-secondary)' }}>{u.role}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border tracking-widest ${statusColor[u.status]}`}>
                      {u.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <Link href={`/admin/users/${u.id}`} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-black uppercase tracking-widest">Manage Account</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
      {/* KYC Viewer Modal */}
      {selectedKyc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="glass-panel w-full max-w-2xl rounded-[40px] p-5 sm:p-8 relative overflow-hidden shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
              <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
              
              <div className="flex justify-between items-center mb-8 relative z-10">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-xl">
                       {selectedKyc.name[0]}
                    </div>
                    <div>
                       <h3 className="text-2xl font-black">{selectedKyc.name}</h3>
                       <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest leading-none mt-1">KYC Visual Inspection Queue</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedKyc(null)} className="p-3 rounded-full hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-all">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                 <div className="glass-panel rounded-3xl p-4 border border-white/10 group overflow-hidden cursor-pointer hover:border-indigo-500/50 transition-all">
                    <p className="text-[10px] font-black uppercase text-indigo-400 mb-2">Government ID (Front)</p>
                    <div className="h-40 bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden">
                       <img src="https://images.unsplash.com/photo-1554224155-1696413565d3?w=800&auto=format&fit=crop" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    </div>
                 </div>
                 <div className="glass-panel rounded-3xl p-4 border border-white/10 group overflow-hidden cursor-pointer hover:border-indigo-500/50 transition-all">
                    <p className="text-[10px] font-black uppercase text-emerald-400 mb-2">Address Proof (Lease)</p>
                    <div className="h-40 bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden">
                       <img src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 relative z-10 pt-4 border-t border-white/10">
                 <button onClick={() => approveKyc(selectedKyc.name)} className="flex-1 bg-white text-black font-black py-4 rounded-2xl hover:bg-neutral-200 transition-all shadow-xl shadow-white/10">
                    Approve Identity
                 </button>
                 <button onClick={() => setSelectedKyc(null)} className="px-8 bg-rose-500/10 text-rose-500 font-bold py-4 rounded-2xl hover:bg-rose-500/20 transition-all">
                    Flag & Reject
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
