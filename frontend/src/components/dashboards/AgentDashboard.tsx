"use client";
import { useState, useEffect } from 'react';
import { useUserProfile } from '@/context/UserProfileContext';
import { useNotifications } from '@/context/NotificationContext';
import { useCurrency } from '@/context/CurrencyContext';
import { agentAnalytics } from '@/lib/api';
import {
  Wallet, Users, TrendingUp, Calendar, Share2, ArrowUpRight,
  Handshake, Phone, IndianRupee, Trophy, Clock, Target
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface AgentStats {
  deals: {
    total: number;
    totalRevenue: number;
    totalCommission: number;
    recent: Array<{ id: string; salePrice: number; totalCommission: number; createdAt: string; property: { title: string; city: string } }>;
    monthly: Array<{ month: string; revenue: number; deals: number }>;
  };
  visits: {
    total: number;
    byStatus: { PENDING: number; APPROVED: number; COMPLETED: number; REJECTED: number };
    recent: Array<{ id: string; scheduledAt: string; status: string; property: { title: string } }>;
  };
  leads: {
    byStage: Record<string, number>;
    total: number;
  };
  wallet: {
    balance: number;
    recentTransactions: Array<{ amount: number; type: string; description: string; createdAt: string }>;
  };
}

const PIPELINE_STAGES = [
  'NEW',
  'CONTACTED',
  'VISIT_SCHEDULED',
  'VISIT_DONE',
  'NEGOTIATING',
  'DEAL_CLOSED',
];

const STAGE_COLORS: Record<string, string> = {
  NEW:             'from-slate-400 to-slate-500',
  CONTACTED:       'from-blue-400 to-blue-500',
  VISIT_SCHEDULED: 'from-amber-400 to-amber-500',
  VISIT_DONE:      'from-indigo-400 to-indigo-500',
  NEGOTIATING:     'from-purple-400 to-purple-500',
  DEAL_CLOSED:     'from-emerald-400 to-emerald-500',
};

const STAGE_LABELS: Record<string, string> = {
  NEW:             'New',
  CONTACTED:       'Contacted',
  VISIT_SCHEDULED: 'Visit Sched.',
  VISIT_DONE:      'Visit Done',
  NEGOTIATING:     'Negotiating',
  DEAL_CLOSED:     'Closed',
};

function SkeletonCard() {
  return (
    <div className="glass-panel p-6 rounded-[32px] animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/10" />
        <div className="w-12 h-4 rounded bg-white/10" />
      </div>
      <div className="h-3 w-20 bg-white/10 rounded mb-2" />
      <div className="h-7 w-28 bg-white/10 rounded" />
    </div>
  );
}

export default function AgentDashboard() {
  const { profile } = useUserProfile();
  const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();

  const [stats, setStats] = useState<AgentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    agentAnalytics.me()
      .then(data => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setIsLoading(false));
  }, []);

  const handleInvite = () => {
    const link = `${window.location.origin}/invite/${profile.agentId || profile.id}`;
    navigator.clipboard.writeText(link);
    addNotification({
      type: 'success',
      title: 'Invite Link Copied!',
      message: 'Share it with your network to earn referral incentives.',
      category: 'system',
    });
  };

  // Derived data
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = profile.name?.split(' ')[0] || 'Advisor';

  const visitCompleted = stats?.visits?.byStatus?.COMPLETED ?? 0;
  const activeLeads = stats?.leads?.total ?? 0;
  const walletBalance = stats?.wallet?.balance ?? 0;
  const totalDeals = stats?.deals?.total ?? 0;

  // Monthly chart
  const monthly = stats?.deals?.monthly?.slice(-6) ?? [];
  const maxDeals = Math.max(...monthly.map(m => m.deals), 1);

  // Pipeline funnel
  const byStage = stats?.leads?.byStage ?? {};
  const maxStageCount = Math.max(...PIPELINE_STAGES.map(s => byStage[s] ?? 0), 1);

  // Upcoming visits (APPROVED or PENDING, sorted by date)
  const upcomingVisits = [...(stats?.visits?.recent ?? [])]
    .filter(v => v.status === 'APPROVED' || v.status === 'PENDING')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);

  const recentDeals = stats?.deals?.recent?.slice(0, 5) ?? [];

  return (
    <div className="p-6 md:p-8 animate-in slide-in-from-bottom-6 duration-700">

      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-[var(--text-secondary)] text-sm font-medium mb-1">{greeting},</p>
          <h1 className="text-2xl md:text-4xl font-black mb-1 tracking-tight">
            {firstName} <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm">
            Your real-time performance at a glance.
          </p>
        </div>
        <button
          onClick={handleInvite}
          className="self-start md:self-auto px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" /> Copy Invite Link
        </button>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="glass-panel p-6 rounded-[32px] relative overflow-hidden group hover:border-indigo-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <Wallet className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> Balance
                </span>
              </div>
              <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-1">Wallet Balance</p>
              <h3 className="text-2xl font-black">{formatCurrency(walletBalance)}</h3>
            </div>

            <div className="glass-panel p-6 rounded-[32px] relative overflow-hidden group hover:border-indigo-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <Handshake className="w-5 h-5 text-indigo-500" />
                </div>
                <span className="text-[10px] font-black text-indigo-400 uppercase flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> Deals
                </span>
              </div>
              <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-1">Total Deals</p>
              <h3 className="text-2xl font-black">{totalDeals}</h3>
              {stats?.deals?.totalCommission ? (
                <p className="text-xs text-emerald-500 font-bold mt-1">{formatCurrency(stats.deals.totalCommission)} incentive earned</p>
              ) : null}
            </div>

            <div className="glass-panel p-6 rounded-[32px] relative overflow-hidden group hover:border-indigo-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <Calendar className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-[10px] font-black text-purple-400 uppercase flex items-center gap-1">
                  <Target className="w-3 h-3" /> Activity
                </span>
              </div>
              <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-1">Visits Completed</p>
              <h3 className="text-2xl font-black">{visitCompleted}</h3>
              {stats?.visits?.total ? (
                <p className="text-xs text-[var(--text-secondary)] font-bold mt-1">{stats.visits.total} total</p>
              ) : null}
            </div>

            <div className="glass-panel p-6 rounded-[32px] relative overflow-hidden group hover:border-indigo-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <Users className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-[10px] font-black text-amber-400 uppercase flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Pipeline
                </span>
              </div>
              <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-1">Active Leads</p>
              <h3 className="text-2xl font-black">{activeLeads}</h3>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-8">

        {/* Pipeline Funnel */}
        <div className="lg:col-span-2 glass-panel rounded-[42px] p-5 sm:p-8 border border-white/5">
          <h3 className="text-xl font-bold mb-2">Lead Pipeline</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-6 uppercase tracking-widest font-bold">Funnel by stage</p>

          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-28 h-3 rounded bg-white/10" />
                  <div className="flex-1 h-6 rounded-full bg-white/10" />
                  <div className="w-6 h-3 rounded bg-white/10" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {PIPELINE_STAGES.map(stage => {
                const count = byStage[stage] ?? 0;
                const pct = maxStageCount > 0 ? Math.max((count / maxStageCount) * 100, count > 0 ? 4 : 0) : 0;
                return (
                  <div key={stage} className="flex items-center gap-4 group">
                    <div className="w-28 text-xs font-bold text-[var(--text-secondary)] shrink-0">
                      {STAGE_LABELS[stage]}
                    </div>
                    <div className="flex-1 h-7 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                      <div
                        className={`h-full bg-gradient-to-r ${STAGE_COLORS[stage]} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-8 text-right text-sm font-black">
                      {count > 0 ? count : <span className="opacity-20">0</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly Performance Chart */}
        <div className="glass-panel p-5 sm:p-8 rounded-[42px] border border-white/5 flex flex-col">
          <h3 className="text-xl font-bold mb-1">Monthly Deals</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-6 uppercase tracking-widest font-bold">Last 6 months</p>

          {isLoading ? (
            <div className="flex-1 flex items-end gap-3 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-white/10 rounded-t-xl" style={{ height: `${40 + Math.random() * 80}px` }} />
                  <div className="h-2 w-8 rounded bg-white/10" />
                </div>
              ))}
            </div>
          ) : monthly.length === 0 ? (
            <div className="flex-1 flex items-center justify-center opacity-30">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-bold">No data yet</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-end gap-2 min-h-[140px]">
              {monthly.map((m, i) => {
                const heightPct = maxDeals > 0 ? Math.max((m.deals / maxDeals) * 100, m.deals > 0 ? 8 : 0) : 0;
                const shortMonth = m.month?.slice(0, 3) || `M${i + 1}`;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                    {m.deals > 0 && (
                      <span className="text-[9px] font-black text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {m.deals}
                      </span>
                    )}
                    <div className="w-full relative flex items-end" style={{ height: 120 }}>
                      <div
                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-xl transition-all duration-700 group-hover:from-indigo-500 group-hover:to-purple-400 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">{shortMonth}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">

        {/* Recent Deals */}
        <div className="glass-panel p-5 sm:p-8 rounded-[42px] border border-white/5">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Handshake className="w-5 h-5 text-emerald-500" /> Recent Deals
          </h3>

          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                  <div className="w-20 h-4 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          ) : recentDeals.length === 0 ? (
            <div className="text-center opacity-30 py-8">
              <Handshake className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-bold">No deals yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDeals.map(deal => (
                <div key={deal.id} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <Handshake className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{deal.property?.title || 'Property'}</p>
                    <p className="text-[10px] opacity-40 flex items-center gap-1 uppercase tracking-tight">
                      <Clock className="w-3 h-3" />
                      {deal.property?.city || ''}
                      {' · '}
                      {new Date(deal.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-sm text-emerald-500">+{formatCurrency(deal.totalCommission)}</p>
                    <p className="text-[10px] opacity-40">{formatCurrency(deal.salePrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Visits */}
        <div className="glass-panel p-5 sm:p-8 rounded-[42px] border border-white/5">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" /> Upcoming Visits
          </h3>

          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingVisits.length === 0 ? (
            <div className="text-center opacity-30 py-8">
              <Calendar className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-bold">No upcoming visits</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingVisits.map(visit => {
                const d = new Date(visit.scheduledAt);
                const day = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
                const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={visit.id} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex flex-col items-center justify-center shrink-0 text-indigo-400 border border-indigo-500/10">
                      <span className="text-[10px] font-black uppercase">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                      <span className="text-xl font-black leading-none">{d.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{visit.property?.title || 'Property'}</p>
                      <p className="text-[10px] opacity-50 font-semibold mt-0.5">{day} · {time}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shrink-0 ${
                      visit.status === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {visit.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Wallet snapshot */}
          {!isLoading && stats?.wallet?.recentTransactions?.length ? (
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-xs font-black opacity-30 uppercase tracking-widest mb-3">Recent Wallet Activity</p>
              <div className="space-y-2">
                {stats.wallet.recentTransactions.slice(0, 3).map((tx, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)] text-xs truncate max-w-[160px]">{tx.description || tx.type}</span>
                    <span className={`font-black text-xs ${tx.type === 'CREDIT' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
