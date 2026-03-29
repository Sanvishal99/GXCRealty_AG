"use client";
import { useState, useEffect, useCallback } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { analytics as analyticsApi } from '@/lib/api';
import { isAdmin } from '@/lib/constants';
import {
  BarChart3, Users, Building2, TrendingUp, ShieldCheck,
  RefreshCw, ShieldAlert, Activity, Clock, CheckCircle,
  XCircle, AlertCircle, DollarSign, Handshake, Eye
} from 'lucide-react';
import Link from 'next/link';

interface PlatformStats {
  users: {
    total: number;
    byRole: Record<string, number>;
    byStatus: Record<string, number>;
    pendingKyc: number;
    recent: { id: string; email: string; role: string; status: string; createdAt: string }[];
  };
  properties: {
    total: number;
    byStatus: Record<string, number>;
  };
  deals: {
    total: number;
    totalRevenue: number;
    totalCommission: number;
    recent: { id: string; salePrice: number; totalCommission: number; createdAt: string; property?: { title: string; city?: string }; agent?: { email: string } }[];
  };
  visits: {
    total: number;
    byStatus: Record<string, number>;
  };
  monthlyRevenue: { month: string; revenue: number; deals: number }[];
}

const ROLE_COLOR: Record<string, string> = {
  ADMIN:   'text-rose-400 bg-rose-500/10',
  COMPANY: 'text-indigo-400 bg-indigo-500/10',
  AGENT:   'text-emerald-400 bg-emerald-500/10',
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:           'text-emerald-400',
  PENDING_KYC:      'text-amber-400',
  PENDING_APPROVAL: 'text-indigo-400',
  SUSPENDED:        'text-rose-400',
};

export default function AdminAnalyticsPage() {
  const { profile } = useUserProfile();
  const { formatCurrency } = useCurrency();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await analyticsApi.platform();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (!isAdmin(profile.role)) {
    return (
      <div className="p-24 text-center">
        <ShieldAlert className="w-16 h-16 mx-auto mb-6 text-rose-500 opacity-20" />
        <h2 className="text-3xl font-black mb-2 text-rose-500">Access Restricted</h2>
        <p className="text-[var(--text-secondary)]">Admin access required.</p>
        <Link href="/dashboard" className="inline-block mt-8 px-8 py-3 rounded-2xl bg-indigo-600 text-white font-bold">Return to Dashboard</Link>
      </div>
    );
  }

  const maxRevenue = stats ? Math.max(...stats.monthlyRevenue.map(m => m.revenue), 1) : 1;

  return (
    <div className="p-6 md:p-8 relative z-10 w-full max-w-7xl mx-auto text-[var(--text-primary)]">
      {/* Ambient */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] glow-orb-1 rounded-full blur-[140px] pointer-events-none opacity-20 -translate-y-1/4 translate-x-1/3" />

      {/* Header */}
      <header className="mb-10 flex flex-col sm:flex-row justify-between sm:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)]">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">Platform Intelligence</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            Admin <span className="text-gradient">Analytics</span>
          </h1>
          <p className="text-[var(--text-secondary)]">Real-time platform health, revenue, and network activity.</p>
        </div>
        <button onClick={fetchStats} className="p-3 rounded-2xl glass-panel hover:bg-[var(--glass-bg-hover)] transition-all self-start sm:self-auto">
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="glass-panel rounded-3xl p-6 animate-pulse space-y-3">
              <div className="h-10 w-10 rounded-xl bg-white/10" />
              <div className="h-3 bg-white/10 rounded w-2/3" />
              <div className="h-8 bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : !stats ? (
        <div className="glass-panel rounded-3xl p-16 text-center opacity-50">
          <Activity className="w-12 h-12 mx-auto mb-4" />
          <p className="font-semibold">Failed to load analytics</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Platform Revenue', value: formatCurrency(stats.deals.totalRevenue), sub: `${stats.deals.total} deals closed`, icon: <DollarSign className="w-5 h-5 text-emerald-500" />, color: 'emerald', glow: 'stat-card-emerald' },
              { label: 'Total Users', value: stats.users.total.toLocaleString(), sub: `${stats.users.byRole.AGENT || 0} advisors · ${stats.users.byRole.COMPANY || 0} companies`, icon: <Users className="w-5 h-5 text-indigo-500" />, color: 'indigo', glow: 'stat-card-indigo' },
              { label: 'Properties', value: stats.properties.total.toLocaleString(), sub: `${stats.properties.byStatus.AVAILABLE || 0} available`, icon: <Building2 className="w-5 h-5 text-purple-500" />, color: 'purple', glow: '' },
              { label: 'Pending KYC', value: stats.users.pendingKyc.toLocaleString(), sub: 'Awaiting verification', icon: <ShieldCheck className="w-5 h-5 text-amber-500" />, color: 'amber', glow: 'stat-card-amber' },
            ].map((s, i) => (
              <div key={i} className={`glass-panel ${s.glow} rounded-3xl p-6 relative overflow-hidden group hover:border-${s.color}-500/20 transition-all`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">{s.icon}</div>
                </div>
                <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-1">{s.label}</p>
                <h3 className="text-2xl font-black mb-1">{s.value}</h3>
                <p className="text-xs text-[var(--text-muted)]">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 glass-panel rounded-3xl p-8 border border-white/5">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" /> Monthly Revenue
                </h3>
                <span className="text-xs text-[var(--text-muted)]">Last 6 months</span>
              </div>
              <div className="h-48 flex items-end gap-3 px-2">
                {stats.monthlyRevenue.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-full flex flex-col items-center gap-0.5">
                      {m.revenue > 0 && (
                        <span className="text-[9px] font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatCurrency(m.revenue)}
                        </span>
                      )}
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-indigo-500/60 to-indigo-400/20 group-hover:from-indigo-500 group-hover:to-indigo-400/40 transition-all"
                        style={{ height: `${Math.max((m.revenue / maxRevenue) * 160, m.revenue > 0 ? 4 : 0)}px` }}
                      />
                    </div>
                    <span className="text-[10px] opacity-40 font-bold uppercase">{m.month}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-[var(--border-subtle)]">
                <div>
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">Total Incentive</p>
                  <p className="text-lg font-black text-indigo-400">{formatCurrency(stats.deals.totalCommission)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">Avg Deal Size</p>
                  <p className="text-lg font-black text-purple-400">{stats.deals.total > 0 ? formatCurrency(stats.deals.totalRevenue / stats.deals.total) : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">Deals This Month</p>
                  <p className="text-lg font-black text-emerald-400">{stats.monthlyRevenue[stats.monthlyRevenue.length - 1]?.deals || 0}</p>
                </div>
              </div>
            </div>

            {/* Network Breakdown */}
            <div className="space-y-6">
              {/* User Status */}
              <div className="glass-panel rounded-3xl p-6 border border-white/5">
                <h3 className="text-sm font-black uppercase tracking-widest opacity-40 mb-4">User Status</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Active', count: stats.users.byStatus.ACTIVE || 0, icon: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
                    { label: 'Pending KYC', count: stats.users.byStatus.PENDING_KYC || 0, icon: <AlertCircle className="w-4 h-4 text-amber-500" /> },
                    { label: 'Pending Approval', count: stats.users.byStatus.PENDING_APPROVAL || 0, icon: <Clock className="w-4 h-4 text-indigo-400" /> },
                    { label: 'Suspended', count: stats.users.byStatus.SUSPENDED || 0, icon: <XCircle className="w-4 h-4 text-rose-500" /> },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                      <div className="flex items-center gap-2 text-sm">
                        {s.icon}
                        <span className="text-[var(--text-secondary)]">{s.label}</span>
                      </div>
                      <span className="font-black text-lg">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visit Stats */}
              <div className="glass-panel rounded-3xl p-6 border border-white/5">
                <h3 className="text-sm font-black uppercase tracking-widest opacity-40 mb-4">Visit Pipeline</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Pending',   count: stats.visits.byStatus.PENDING   || 0, color: 'text-amber-400' },
                    { label: 'Approved',  count: stats.visits.byStatus.APPROVED  || 0, color: 'text-emerald-400' },
                    { label: 'Completed', count: stats.visits.byStatus.COMPLETED || 0, color: 'text-indigo-400' },
                    { label: 'Rejected',  count: stats.visits.byStatus.REJECTED  || 0, color: 'text-rose-400' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                      <span className="text-sm text-[var(--text-secondary)]">{s.label}</span>
                      <span className={`font-black text-lg ${s.color}`}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Deals */}
            <div className="glass-panel rounded-3xl overflow-hidden border border-white/5">
              <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-indigo-500" /> Recent Deals
                </h3>
                <span className="text-xs text-[var(--text-muted)]">{stats.deals.total} total</span>
              </div>
              <div className="divide-y divide-[var(--border-subtle)]">
                {stats.deals.recent.length === 0 ? (
                  <div className="p-8 text-center opacity-40 text-sm">No deals yet</div>
                ) : (
                  stats.deals.recent.map(deal => (
                    <div key={deal.id} className="flex items-center justify-between px-6 py-4 hover:bg-[var(--glass-bg-hover)] transition-colors">
                      <div>
                        <p className="font-semibold text-sm">{deal.property?.title || 'Property'}</p>
                        <p className="text-xs text-[var(--text-muted)]">{deal.agent?.email} · {new Date(deal.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-emerald-400">{formatCurrency(deal.salePrice)}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">incentive: {formatCurrency(deal.totalCommission)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Users */}
            <div className="glass-panel rounded-3xl overflow-hidden border border-white/5">
              <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" /> Recent Signups
                </h3>
                <Link href="/admin/users" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">View All →</Link>
              </div>
              <div className="divide-y divide-[var(--border-subtle)]">
                {stats.users.recent.length === 0 ? (
                  <div className="p-8 text-center opacity-40 text-sm">No users yet</div>
                ) : (
                  stats.users.recent.map(user => (
                    <div key={user.id} className="flex items-center justify-between px-6 py-4 hover:bg-[var(--glass-bg-hover)] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400">
                          {user.email.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{user.email.split('@')[0]}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${ROLE_COLOR[user.role] || 'text-white bg-white/10'}`}>{user.role}</span>
                        <span className={`text-[10px] font-bold ${STATUS_COLOR[user.status] || 'text-white'}`}>{user.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Property breakdown */}
          <div className="mt-8 glass-panel rounded-3xl p-8 border border-white/5">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-500" /> Inventory Status
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: 'Available',    count: stats.properties.byStatus.AVAILABLE    || 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'Sold',         count: stats.properties.byStatus.SOLD         || 0, color: 'text-indigo-400',  bg: 'bg-indigo-500/10'  },
                { label: 'Under Review', count: stats.properties.byStatus.UNDER_REVIEW || 0, color: 'text-amber-400',  bg: 'bg-amber-500/10'   },
                { label: 'Inactive',     count: stats.properties.byStatus.INACTIVE     || 0, color: 'text-rose-400',   bg: 'bg-rose-500/10'    },
                { label: 'Total',        count: stats.properties.total,                      color: 'text-white',      bg: 'bg-white/5'        },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-2xl p-5 text-center`}>
                  <p className={`text-3xl font-black ${s.color} mb-1`}>{s.count}</p>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-50">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
