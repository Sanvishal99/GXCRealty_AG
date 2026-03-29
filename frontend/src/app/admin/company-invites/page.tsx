"use client";
import { useState, useEffect, useCallback } from 'react';
import { companyInvites as invitesApi, ApiError } from '@/lib/api';

interface Invite {
  id: string;
  token: string;
  email?: string;
  note?: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

function getStatus(invite: Invite): 'Pending' | 'Used' | 'Expired' {
  if (invite.usedAt) return 'Used';
  if (new Date(invite.expiresAt) < new Date()) return 'Expired';
  return 'Pending';
}

const STATUS_BADGE: Record<string, string> = {
  Pending:  'bg-amber-100 text-amber-700 border-amber-200',
  Used:     'bg-emerald-100 text-emerald-700 border-emerald-200',
  Expired:  'bg-neutral-100 text-neutral-500 border-neutral-200',
};

export default function CompanyInvitesPage() {
  const [invites, setInvites]           = useState<Invite[]>([]);
  const [loading, setLoading]           = useState(true);
  const [createEmail, setCreateEmail]   = useState('');
  const [createNote, setCreateNote]     = useState('');
  const [creating, setCreating]         = useState(false);
  const [createError, setCreateError]   = useState('');
  const [copied, setCopied]             = useState<string | null>(null);
  const [deleting, setDeleting]         = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invitesApi.list();
      setInvites(data);
    } catch {
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInvites(); }, [loadInvites]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      await invitesApi.create({ email: createEmail.trim() || undefined, note: createNote.trim() || undefined });
      setCreateEmail('');
      setCreateNote('');
      await loadInvites();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Failed to create invite.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (token: string) => {
    const link = `${window.location.origin}/register/company?token=${token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invite? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await invitesApi.remove(id);
      setInvites(prev => prev.filter(i => i.id !== id));
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6 md:p-8 relative z-10 w-full max-w-5xl mx-auto text-[var(--text-primary)]">
      {/* Ambient */}
      <div className="fixed top-0 right-0 w-[400px] h-[400px] rounded-full blur-[140px] pointer-events-none opacity-10 -translate-y-1/4 translate-x-1/3"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.8) 0%, transparent 70%)' }} />

      {/* Header */}
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)]">
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-semibold text-blue-500 uppercase tracking-widest">Admin</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-2">
          Company <span className="text-gradient">Invites</span>
        </h1>
        <p className="text-[var(--text-secondary)]">Generate and manage invite links for onboarding company accounts.</p>
      </header>

      {/* Create Form */}
      <div className="glass-panel rounded-3xl p-6 mb-8 border border-white/5">
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Generate New Invite
        </h2>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={createEmail}
            onChange={e => setCreateEmail(e.target.value)}
            placeholder="Email (optional)"
            className="flex-1 bg-[var(--glass-bg)] border border-[var(--border-medium)] rounded-2xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-[var(--text-muted)]"
          />
          <input
            type="text"
            value={createNote}
            onChange={e => setCreateNote(e.target.value)}
            placeholder="Note (optional, e.g. company name)"
            className="flex-1 bg-[var(--glass-bg)] border border-[var(--border-medium)] rounded-2xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-[var(--text-muted)]"
          />
          <button type="submit" disabled={creating}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60 whitespace-nowrap shadow-lg shadow-indigo-600/20">
            {creating ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
            Generate Invite
          </button>
        </form>
        {createError && (
          <p className="mt-3 text-sm text-rose-500 font-medium">{createError}</p>
        )}
      </div>

      {/* Invites Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/5">
        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            All Invites
          </h2>
          <button onClick={loadInvites}
            className="p-2 rounded-xl glass-panel hover:bg-[var(--glass-bg-hover)] transition-all" title="Refresh">
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center gap-3 opacity-40">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span className="text-sm font-medium">Loading invites...</span>
          </div>
        ) : invites.length === 0 ? (
          <div className="p-12 text-center opacity-40">
            <svg className="w-10 h-10 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium">No invites yet. Generate one above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Token', 'Email', 'Note', 'Status', 'Expires', 'Created', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {invites.map(invite => {
                  const status = getStatus(invite);
                  return (
                    <tr key={invite.id} className="hover:bg-[var(--glass-bg-hover)] transition-colors">
                      <td className="px-6 py-4">
                        <code className="text-xs font-mono bg-[var(--glass-bg)] px-2 py-1 rounded-lg border border-[var(--border-subtle)]">
                          {invite.token.slice(0, 8)}...
                        </code>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)]">
                        {invite.email || <span className="opacity-30">—</span>}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)] max-w-[180px] truncate">
                        {invite.note || <span className="opacity-30">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[status]}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-muted)] text-xs">
                        {new Date(invite.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-muted)] text-xs">
                        {new Date(invite.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(invite.token)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold glass-panel hover:bg-[var(--glass-bg-hover)] transition-all border border-[var(--border-subtle)]"
                            title="Copy invite link"
                          >
                            {copied === invite.token ? (
                              <><svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg><span className="text-emerald-400">Copied!</span></>
                            ) : (
                              <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg><span>Copy Link</span></>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(invite.id)}
                            disabled={deleting === invite.id}
                            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                            title="Delete invite"
                          >
                            {deleting === invite.id ? (
                              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
