"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { auditLogs } from '@/lib/api';

const ENTITIES = ['All', 'PROPERTY', 'DEAL', 'CONFIG', 'USER', 'VISIT'] as const;

type EntityFilter = typeof ENTITIES[number];

interface AuditLog {
  id: string;
  createdAt: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
}

const ACTION_COLOR: Record<string, string> = {
  CREATE: 'text-emerald-400 bg-emerald-500/10',
  UPDATE: 'text-blue-400 bg-blue-500/10',
  DELETE: 'text-rose-400 bg-rose-500/10',
  PATCH:  'text-blue-400 bg-blue-500/10',
  STATUS: 'text-amber-400 bg-amber-500/10',
};

const ENTITY_COLOR: Record<string, string> = {
  PROPERTY: 'text-purple-400 bg-purple-500/10',
  DEAL:     'text-amber-400 bg-amber-500/10',
  CONFIG:   'text-cyan-400 bg-cyan-500/10',
  USER:     'text-indigo-400 bg-indigo-500/10',
  VISIT:    'text-emerald-400 bg-emerald-500/10',
};

function trunc(str?: string, n = 10) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '...' : str;
}

function diffSummary(oldV: any, newV: any): string {
  try {
    const o = oldV ? (typeof oldV === 'string' ? JSON.parse(oldV) : oldV) : {};
    const n = newV ? (typeof newV === 'string' ? JSON.parse(newV) : newV) : {};
    const keys = [...new Set([...Object.keys(o), ...Object.keys(n)])];
    const changed = keys.filter(k => JSON.stringify(o[k]) !== JSON.stringify(n[k]));
    if (changed.length === 0) return 'No changes';
    if (changed.length <= 3) return changed.join(', ') + ' changed';
    return `${changed.slice(0, 2).join(', ')} +${changed.length - 2} more changed`;
  } catch {
    return newV ? 'Values updated' : 'Values recorded';
  }
}

function JsonDiff({ oldValues, newValues }: { oldValues?: any; newValues?: any }) {
  const fmt = (v: any) => {
    if (!v) return null;
    try {
      const parsed = typeof v === 'string' ? JSON.parse(v) : v;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(v);
    }
  };
  const oldStr = fmt(oldValues);
  const newStr = fmt(newValues);
  if (!oldStr && !newStr) return <p className="text-xs opacity-40 italic">No data</p>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
      {oldStr && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-1">Before</p>
          <pre className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 overflow-auto max-h-32 text-[var(--text-secondary)] font-mono">{oldStr}</pre>
        </div>
      )}
      {newStr && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">After</p>
          <pre className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 overflow-auto max-h-32 text-[var(--text-secondary)] font-mono">{newStr}</pre>
        </div>
      )}
    </div>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs]             = useState<AuditLog[]>([]);
  const [loading, setLoading]       = useState(true);
  const [entity, setEntity]         = useState<EntityFilter>('All');
  const [expanded, setExpanded]     = useState<string | null>(null);
  const intervalRef                 = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await auditLogs.list(entity === 'All' ? undefined : entity, 200);
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    fetchLogs();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchLogs, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchLogs]);

  return (
    <div className="p-6 md:p-8 relative z-10 w-full max-w-7xl mx-auto text-[var(--text-primary)]">
      {/* Ambient */}
      <div className="fixed top-0 right-0 w-[400px] h-[400px] rounded-full blur-[140px] pointer-events-none opacity-10 -translate-y-1/4 translate-x-1/3"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.6) 0%, transparent 70%)' }} />

      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)]">
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Admin</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            Audit <span className="text-gradient">Logs</span>
          </h1>
          <p className="text-[var(--text-secondary)]">Track all platform changes. Auto-refreshes every 30 seconds.</p>
        </div>
        <button onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl glass-panel hover:bg-[var(--glass-bg-hover)] transition-all text-sm font-semibold self-start sm:self-auto">
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </header>

      {/* Entity Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ENTITIES.map(e => (
          <button key={e} onClick={() => setEntity(e)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border ${
              entity === e
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                : 'glass-panel border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)]'
            }`}
          >{e}</button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/5">
        {loading && logs.length === 0 ? (
          <div className="p-16 flex items-center justify-center gap-3 opacity-40">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span className="text-sm font-medium">Loading audit logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center opacity-40">
            <svg className="w-10 h-10 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">No audit logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'Changes', ''].map((h, i) => (
                    <th key={i} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <>
                    <tr key={log.id}
                      className="border-b border-[var(--border-subtle)] hover:bg-[var(--glass-bg-hover)] transition-colors cursor-pointer"
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    >
                      <td className="px-5 py-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <code className="text-xs font-mono bg-[var(--glass-bg)] px-2 py-0.5 rounded-lg border border-[var(--border-subtle)]">
                          {trunc(log.userId, 12)}
                        </code>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${ACTION_COLOR[log.action] || 'text-neutral-400 bg-neutral-500/10'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${ENTITY_COLOR[log.entity] || 'text-neutral-400 bg-neutral-500/10'}`}>
                          {log.entity}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <code className="text-xs font-mono text-[var(--text-muted)]">
                          {trunc(log.entityId, 12)}
                        </code>
                      </td>
                      <td className="px-5 py-4 text-xs text-[var(--text-secondary)] max-w-[200px] truncate">
                        {diffSummary(log.oldValues, log.newValues)}
                      </td>
                      <td className="px-5 py-4">
                        <svg className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${expanded === log.id ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </td>
                    </tr>
                    {expanded === log.id && (
                      <tr key={`${log.id}-expand`} className="bg-[var(--glass-bg)] border-b border-[var(--border-subtle)]">
                        <td colSpan={7} className="px-5 py-4">
                          <JsonDiff oldValues={log.oldValues} newValues={log.newValues} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)]">{logs.length} entries</p>
          <p className="text-xs text-[var(--text-muted)]">Auto-refreshing every 30s</p>
        </div>
      </div>
    </div>
  );
}
