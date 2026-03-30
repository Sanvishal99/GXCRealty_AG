"use client";
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useUserProfile } from '@/context/UserProfileContext';
import { useNotifications } from '@/context/NotificationContext';
import { network as networkApi } from '@/lib/api';
import { SkeletonNetwork } from '@/components/Skeleton';
import { getToken } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import {
  Copy, RefreshCw, ChevronRight, ChevronDown, Users, Zap,
  TrendingUp, AlertTriangle, Star, Activity, Clock, Trophy,
  Target, GitBranch, BarChart2,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface NodeStats {
  leadsCount: number;
  activeLeads: number;
  dealsCount: number;
  visitsCount: number;
  walletBalance: number;
  lastActivityAt: string | null;
  performanceScore: number;
}

interface NetworkNode {
  id: string;
  email: string;
  role: string;
  status: string;
  inviteCode: string;
  joinedAt: string;
  level: number;
  stats: NodeStats;
  children: NetworkNode[];
}

interface ActivityEvent {
  type: 'LEAD_CREATED' | 'LEAD_STAGE_CHANGED' | 'DEAL_CLOSED' | 'VISIT_SCHEDULED' | 'VISIT_COMPLETED';
  agentId: string;
  agentEmail: string;
  level: number;
  title: string;
  detail: string;
  timestamp: string;
  meta: Record<string, any>;
}

interface NetworkSummary {
  totalMembers: number;
  activeMembers: number;
  totalLeads: number;
  totalDeals: number;
  totalNetworkEarnings: number;
  levelBreakdown: { level: number; members: number; leads: number; deals: number }[];
  atRiskCount: number;
  risingStarCount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const STAGE_LABEL: Record<string, string> = {
  NEW: 'New', CONTACTED: 'Contacted', VISIT_SCHEDULED: 'Visit Scheduled',
  VISIT_DONE: 'Visit Done', NEGOTIATING: 'Negotiating', DEAL_CLOSED: 'Deal Closed', LOST: 'Lost',
};

const LEVEL_COLORS = [
  'from-indigo-500 to-purple-600',
  'from-emerald-500 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-cyan-400 to-blue-500',
  'from-rose-400 to-pink-500',
];

function scoreColor(score: number) {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-rose-400';
}

function scoreBg(score: number) {
  if (score >= 70) return 'bg-emerald-500/10 border-emerald-500/20';
  if (score >= 40) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-rose-500/10 border-rose-500/20';
}

function activityLabel(score: number) {
  if (score >= 70) return { label: 'High Performer', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  if (score >= 40) return { label: 'Active', color: 'text-amber-400', bg: 'bg-amber-500/10' };
  return { label: 'At Risk', color: 'text-rose-400', bg: 'bg-rose-500/10' };
}

function daysSince(iso: string | null) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function fmt(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${v.toLocaleString('en-IN')}`;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const EVENT_ICON: Record<string, string> = {
  LEAD_CREATED: '➕',
  LEAD_STAGE_CHANGED: '📈',
  DEAL_CLOSED: '🏆',
  VISIT_SCHEDULED: '📅',
  VISIT_COMPLETED: '✅',
};
const EVENT_COLOR: Record<string, string> = {
  LEAD_CREATED: 'border-indigo-500/30 bg-indigo-500/5',
  LEAD_STAGE_CHANGED: 'border-amber-500/30 bg-amber-500/5',
  DEAL_CLOSED: 'border-emerald-500/30 bg-emerald-500/5',
  VISIT_SCHEDULED: 'border-cyan-500/30 bg-cyan-500/5',
  VISIT_COMPLETED: 'border-teal-500/30 bg-teal-500/5',
};

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';

// ── Node Card ─────────────────────────────────────────────────────────────────
const NodeCard = memo(function NodeCard({
  node, isRoot = false, onDrillDown,
}: {
  node: NetworkNode;
  isRoot?: boolean;
  onDrillDown: (node: NetworkNode) => void;
}) {
  const [expanded, setExpanded] = useState(isRoot || node.level <= 2);
  const hasChildren = node.children.length > 0;
  const perf = activityLabel(node.stats.performanceScore);
  const lastActive = daysSince(node.stats.lastActivityAt);
  const levelColor = LEVEL_COLORS[(node.level - 1) % LEVEL_COLORS.length];

  return (
    <div className={`relative ${isRoot ? '' : 'ml-6 md:ml-10'}`}>
      {/* Connector line */}
      {!isRoot && (
        <div className="absolute left-0 top-0 w-px h-full -translate-x-3 md:-translate-x-5 bg-white/5" />
      )}
      {!isRoot && (
        <div className="absolute top-7 left-0 w-3 md:w-5 h-px -translate-x-3 md:-translate-x-5 bg-white/10" />
      )}

      <div className={`mb-3 glass-panel rounded-2xl border transition-all duration-200 ${
        isRoot ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-white/5 hover:border-white/10'
      }`}>
        <div className="p-4 flex items-start gap-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${levelColor} flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-lg`}>
            {node.email.slice(0, 2).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-bold text-sm truncate">{node.email.split('@')[0]}</p>
              {isRoot && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 uppercase">You</span>}
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${perf.bg} ${perf.color}`}>{perf.label}</span>
              {node.status !== 'ACTIVE' && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase bg-rose-500/10 text-rose-400">{node.status}</span>
              )}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mb-2">
              L{node.level} · Joined {new Date(node.joinedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              {lastActive !== null && (
                <span className={lastActive > 7 ? ' text-rose-400' : ''}>
                  {' '}· Active {lastActive === 0 ? 'today' : `${lastActive}d ago`}
                </span>
              )}
              {lastActive === null && <span className="text-rose-400"> · No activity yet</span>}
            </p>

            {/* Mini stats */}
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-muted)] bg-white/5 px-2 py-0.5 rounded-lg">
                <Target className="w-2.5 h-2.5" /> {node.stats.leadsCount} leads
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-muted)] bg-white/5 px-2 py-0.5 rounded-lg">
                <Trophy className="w-2.5 h-2.5 text-amber-400" /> {node.stats.dealsCount} deals
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-muted)] bg-white/5 px-2 py-0.5 rounded-lg">
                <Activity className="w-2.5 h-2.5 text-indigo-400" /> {node.stats.activeLeads} active
              </span>
              {node.stats.walletBalance > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                  {fmt(node.stats.walletBalance)}
                </span>
              )}
            </div>

            {/* Performance bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    node.stats.performanceScore >= 70 ? 'bg-emerald-500' :
                    node.stats.performanceScore >= 40 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${node.stats.performanceScore}%` }}
                />
              </div>
              <span className={`text-[10px] font-black ${scoreColor(node.stats.performanceScore)}`}>
                {node.stats.performanceScore}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {!isRoot && node.level < 5 && node.stats.leadsCount + node.stats.dealsCount > 0 && (
              <button
                onClick={() => onDrillDown(node)}
                className="p-1.5 rounded-lg hover:bg-indigo-500/10 transition-colors text-indigo-400"
                title="View this agent's network"
              >
                <GitBranch className="w-3.5 h-3.5" />
              </button>
            )}
            {hasChildren && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1"
              >
                <span className="text-[10px] font-black text-[var(--text-muted)]">{node.children.length}</span>
                {expanded
                  ? <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="pl-2">
          {node.children.map(child => (
            <NodeCard key={child.id} node={child} onDrillDown={onDrillDown} />
          ))}
        </div>
      )}
    </div>
  );
});

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NetworkPage() {
  const { profile } = useUserProfile();
  const { addNotification } = useNotifications();

  const [tree, setTree] = useState<NetworkNode | null>(null);
  const [viewRoot, setViewRoot] = useState<NetworkNode | null>(null); // drill-down target
  const [summary, setSummary] = useState<NetworkSummary | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [liveEvents, setLiveEvents] = useState<ActivityEvent[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [treeData, summaryData] = await Promise.all([
        networkApi.tree(),
        networkApi.summary(),
      ]);
      setTree(treeData);
      setViewRoot(treeData);
      setSummary(summaryData);
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Failed to load network', message: err?.message, category: 'system' });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const data = await networkApi.activity(50);
      setActivity(data);
    } catch {
      setActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => { load(); loadActivity(); }, [load, loadActivity]);

  // ── Socket: real-time downline activity ──────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const s = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    s.on('networkActivity', (event: ActivityEvent) => {
      setLiveEvents(prev => [event, ...prev].slice(0, 20));
      addNotification({
        type: event.type === 'DEAL_CLOSED' ? 'success' : 'info',
        title: event.title,
        message: event.detail,
        category: 'system',
      });
    });
    socketRef.current = s;
    return () => { s.disconnect(); };
  }, []);

  const copyInvite = () => {
    if (!profile?.inviteCode) return;
    const url = `${window.location.origin}/join/${profile.inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDrillDown = (node: NetworkNode) => setViewRoot(node);
  const resetView = () => setViewRoot(tree);

  const allActivity = useCallback(() => {
    const seen = new Set<string>();
    const merged: ActivityEvent[] = [];
    for (const e of [...liveEvents, ...activity]) {
      const key = `${e.type}:${e.agentId}:${e.timestamp}`;
      if (!seen.has(key)) { seen.add(key); merged.push(e); }
    }
    return merged
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);
  }, [liveEvents, activity])();

  return (
    <div className="p-4 sm:p-6 md:p-8 relative z-10 w-full max-w-7xl mx-auto text-[var(--text-primary)]">

      {/* Header */}
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel">
          <GitBranch className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">MLM Network</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-1">
              My <span className="text-gradient">Network</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">Your downline team, their performance, and real-time activity feed</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Invite link */}
            <div className="glass-panel rounded-2xl px-4 py-2.5 flex items-center gap-3 border border-amber-500/20">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-0.5">Your Invite Link</p>
                <p className="font-black text-amber-400 tracking-widest text-sm">{profile?.inviteCode || '—'}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">/join/{profile?.inviteCode}</p>
              </div>
              <button
                onClick={copyInvite}
                className="p-2 rounded-xl hover:bg-amber-500/10 transition-colors"
                title="Copy invite URL"
              >
                <Copy className={`w-4 h-4 transition-colors ${copied ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`} />
              </button>
            </div>
            <button
              onClick={() => { load(); loadActivity(); }}
              className="p-2.5 rounded-2xl glass-panel hover:bg-[var(--glass-bg-hover)] transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <SkeletonNetwork />
      ) : (
        <>
          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Members', value: summary.totalMembers, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                { label: 'Active Members', value: summary.activeMembers, icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'Network Leads', value: summary.totalLeads, icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { label: 'Network Deals', value: summary.totalDeals, icon: Trophy, color: 'text-rose-400', bg: 'bg-rose-500/10' },
              ].map((stat) => (
                <div key={stat.label} className="glass-panel rounded-2xl p-4 border border-white/5">
                  <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Intelligence Alerts */}
          {summary && (summary.atRiskCount > 0 || summary.risingStarCount > 0) && (
            <div className="flex flex-wrap gap-3 mb-6">
              {summary.atRiskCount > 0 && (
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <p className="text-sm font-bold text-rose-400">
                    {summary.atRiskCount} agent{summary.atRiskCount > 1 ? 's' : ''} inactive for 7+ days
                  </p>
                </div>
              )}
              {summary.risingStarCount > 0 && (
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <Star className="w-4 h-4 text-amber-400" />
                  <p className="text-sm font-bold text-amber-400">
                    {summary.risingStarCount} rising star{summary.risingStarCount > 1 ? 's' : ''} (2+ deals)
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

            {/* ── Tree Panel ────────────────────────────────────────────── */}
            <div className="xl:col-span-2">
              <div className="glass-panel-glow rounded-[32px] p-5 sm:p-6 border border-white/5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-black flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-indigo-400" />
                    Network Tree
                    {viewRoot && viewRoot.id !== tree?.id && (
                      <span className="text-sm font-semibold text-[var(--text-muted)]">
                        · {viewRoot.email.split('@')[0]}'s team
                      </span>
                    )}
                  </h2>
                  {viewRoot && tree && viewRoot.id !== tree.id && (
                    <button
                      onClick={resetView}
                      className="text-xs font-bold text-indigo-400 px-3 py-1.5 rounded-xl hover:bg-indigo-500/10 transition-colors flex items-center gap-1"
                    >
                      ← Back to my tree
                    </button>
                  )}
                </div>

                {!viewRoot || viewRoot.children.length === 0 ? (
                  <div className="text-center py-12 opacity-40">
                    <Users className="w-12 h-12 mx-auto mb-3" />
                    <p className="font-semibold text-sm">No downline yet</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Share your invite code to grow your team</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[300px]">
                      {viewRoot.id === tree?.id && (
                        <NodeCard node={viewRoot} isRoot onDrillDown={handleDrillDown} />
                      )}
                      {viewRoot.children.map(child => (
                        <NodeCard key={child.id} node={child} onDrillDown={handleDrillDown} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Level breakdown */}
                {summary && summary.levelBreakdown.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
                      <BarChart2 className="w-3 h-3" /> Level Breakdown
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {summary.levelBreakdown.map(lv => (
                        <div key={lv.level} className="glass-panel rounded-xl p-3 text-center border border-white/5">
                          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${LEVEL_COLORS[lv.level - 1]} mx-auto mb-1.5 flex items-center justify-center text-white text-[9px] font-black`}>
                            L{lv.level}
                          </div>
                          <p className="text-base font-black">{lv.members}</p>
                          <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase">members</p>
                          <p className="text-[9px] text-amber-400 font-bold mt-0.5">{lv.deals} deals</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Activity Feed ─────────────────────────────────────────── */}
            <div>
              <div className="glass-panel-glow rounded-[32px] p-5 sm:p-6 border border-white/5 h-full">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-black flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    Live Feed
                    {liveEvents.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black animate-pulse">
                        {liveEvents.length} live
                      </span>
                    )}
                  </h2>
                  <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                </div>

                <div className="space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
                  {activityLoading ? (
                    [1,2,3,4].map(i => (
                      <div key={i} className="h-16 rounded-xl glass-panel animate-pulse" />
                    ))
                  ) : allActivity.length === 0 ? (
                    <div className="text-center py-12 opacity-40">
                      <TrendingUp className="w-10 h-10 mx-auto mb-3" />
                      <p className="font-semibold text-sm">No activity yet</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Activity from your team will appear here</p>
                    </div>
                  ) : (
                    allActivity.map((event, idx) => (
                      <div
                        key={`${event.agentId}-${event.timestamp}-${idx}`}
                        className={`p-3.5 rounded-2xl border ${EVENT_COLOR[event.type] || 'border-white/5'} transition-all`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-base flex-shrink-0 mt-0.5">{EVENT_ICON[event.type]}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[var(--text-primary)] leading-snug">
                              {event.detail}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                                LEVEL_COLORS[event.level - 1] ? `text-white` : 'text-[var(--text-muted)]'
                              } bg-white/10`}>
                                L{event.level}
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)]">{relativeTime(event.timestamp)}</span>
                              {event.type === 'DEAL_CLOSED' && event.meta?.salePrice && (
                                <span className="text-[10px] font-black text-emerald-400">{fmt(event.meta.salePrice)}</span>
                              )}
                              {event.type === 'LEAD_STAGE_CHANGED' && event.meta?.newStage && (
                                <span className="text-[10px] font-bold text-amber-400">
                                  {STAGE_LABEL[event.meta.newStage] || event.meta.newStage}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Network Earnings */}
          {summary && summary.totalNetworkEarnings > 0 && (
            <div className="mt-6 glass-panel-glow rounded-2xl p-5 border border-emerald-500/15 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-0.5">Total Network Wallet Earnings</p>
                <p className="text-2xl font-black text-emerald-400">{fmt(summary.totalNetworkEarnings)}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
