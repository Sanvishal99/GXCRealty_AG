"use client";
import { useCurrency } from '@/context/CurrencyContext';

export default function AdminDashboard() {
  const { formatCurrency } = useCurrency();
  const stats = [
    { label: 'Total Users',       value: '1,842',  sub: '+24 this week',  color: 'from-rose-500 to-orange-500' },
    { label: 'Pending KYC',       value: '37',     sub: 'Needs review',   color: 'from-amber-500 to-yellow-500' },
    { label: 'Total Commissions', value: formatCurrency(2400000),  sub: 'Distributed',    color: 'from-emerald-500 to-teal-500' },
    { label: 'Active Agents',     value: '1,204',  sub: 'Network nodes',  color: 'from-indigo-500 to-purple-500' },
  ];

  const pendingKyc = [
    { name: 'Rahul Sharma',  email: 'rahul@ex.com',  submitted: '2h ago' },
    { name: 'Priya Mehta',   email: 'priya@ex.com',  submitted: '4h ago' },
    { name: 'Ankit Verma',   email: 'ankit@ex.com',  submitted: '6h ago' },
  ];

  const recentUsers = [
    { name: 'Alex Carter',  role: 'AGENT',   status: 'ACTIVE',      avatar: 'AC' },
    { name: 'GXC Builders', role: 'COMPANY', status: 'ACTIVE',      avatar: 'GB' },
    { name: 'Nina Patel',   role: 'AGENT',   status: 'PENDING_KYC', avatar: 'NP' },
    { name: 'Mark Stone',   role: 'AGENT',   status: 'SUSPENDED',   avatar: 'MS' },
  ];

  const statusColor: Record<string, string> = {
    ACTIVE:      'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    PENDING_KYC: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    SUSPENDED:   'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };

  return (
    <div className="p-8 relative z-10 w-full">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Platform Overview</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage users, KYC, commissions, and system health.</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((s, i) => (
          <div key={i} className="glass-panel p-6 rounded-2xl overflow-hidden relative group hover:scale-[1.02] transition-transform">
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${s.color} opacity-10 group-hover:opacity-20 transition-opacity blur-xl`} />
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
            <h3 className={`text-3xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>
          </div>
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
                  <button className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors font-semibold">
                    Approve
                  </button>
                  <button className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition-colors font-semibold">
                    Reject
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
            <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View all →</button>
          </div>
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
                <tr key={i} className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                        {u.avatar}
                      </div>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{u.role}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${statusColor[u.status]}`}>
                      {u.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
