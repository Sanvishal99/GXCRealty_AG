"use client";
import { useState, useEffect, useCallback } from "react";
import { useNotifications } from "@/context/NotificationContext";
import { kyc as kycApi, users as usersApi, ApiError } from "@/lib/api";
import { RefreshCw, X, ShieldCheck } from "lucide-react";

interface KycUser {
  id: string;
  email: string;
  role: string;
  status: string;
  aadhaarNumber?: string;
  panNumber?: string;
  selfieUrl?: string;
  kycSubmittedAt?: string;
}

function getInitials(email: string) {
  return email.split('@')[0].slice(0, 2).toUpperCase();
}

const GRAD = ['from-indigo-500 to-purple-600', 'from-emerald-500 to-teal-500', 'from-amber-500 to-yellow-500', 'from-rose-500 to-pink-500'];

export default function AdminKycPage() {
  const [users, setUsers]               = useState<KycUser[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [viewingUser, setViewingUser]   = useState<KycUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActing, setIsActing]         = useState(false);
  const { addNotification } = useNotifications();

  const fetchKycUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch users with PENDING_KYC or PENDING_APPROVAL status
      const data = await usersApi.list({ status: 'PENDING_KYC' });
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchKycUsers(); }, [fetchKycUsers]);

  const handleAction = async (userId: string, isVerified: boolean) => {
    setIsActing(true);
    try {
      await kycApi.verify(userId, isVerified, isVerified ? undefined : (rejectionReason || 'Rejected by admin'));
      addNotification({
        type: isVerified ? 'success' : 'error',
        title: isVerified ? 'KYC Approved' : 'KYC Rejected',
        message: `The user has been notified.`,
        category: 'system',
      });
      setViewingUser(null);
      setRejectionReason('');
      await fetchKycUsers();
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Action Failed',
        message: err instanceof ApiError ? err.message : 'Failed to update KYC status.',
        category: 'system',
      });
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 relative z-10 w-full max-w-7xl mx-auto text-[var(--text-primary)]">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)]">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Verification Services</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2">KYC <span className="text-gradient">Review Queue</span></h1>
          <p className="text-[var(--text-secondary)]">Examine identity documents and verify advisor credentials for the network.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchKycUsers} className="p-3 rounded-2xl glass-panel hover:bg-[var(--glass-bg-hover)] transition-all" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="py-2 px-4 rounded-2xl glass-panel text-sm text-[var(--text-secondary)]">
            <span className="font-bold text-emerald-500">{users.length}</span> Pending Requests
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="glass-panel rounded-3xl p-6 animate-pulse space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
              <div className="h-20 bg-white/5 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="glass-panel rounded-3xl p-16 text-center">
          <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-emerald-500 opacity-30" />
          <h3 className="text-xl font-bold mb-2">All Clear</h3>
          <p className="text-[var(--text-secondary)]">No pending KYC requests at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user, idx) => (
            <div key={user.id} className="glass-panel-glow rounded-3xl p-6 relative overflow-hidden group border border-[var(--border-subtle)] hover:-translate-y-1.5 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${GRAD[idx % GRAD.length]} flex items-center justify-center text-white font-bold shadow-lg`}>
                  {getInitials(user.email)}
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">{user.email.split('@')[0]}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
                </div>
                <div className="ml-auto">
                  <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border text-amber-500 bg-amber-500/10 border-amber-500/20">
                    PENDING KYC
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {user.aadhaarNumber && (
                  <div className="glass-panel p-3 rounded-2xl border border-[var(--border-subtle)]">
                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-1">Aadhaar</p>
                    <p className="text-xs font-mono">{user.aadhaarNumber.replace(/\d(?=\d{4})/g, 'X')}</p>
                  </div>
                )}
                {user.panNumber && (
                  <div className="glass-panel p-3 rounded-2xl border border-[var(--border-subtle)]">
                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-1">PAN Card</p>
                    <p className="text-xs font-mono">{user.panNumber.slice(0, 3)}XX{user.panNumber.slice(-1)}</p>
                  </div>
                )}
                {user.kycSubmittedAt && (
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Submitted: {new Date(user.kycSubmittedAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setViewingUser(user)}
                  className="flex-1 py-3 rounded-2xl glass-panel text-sm font-bold border border-[var(--border-subtle)] hover:bg-[var(--glass-bg-hover)] transition-all">
                  Review
                </button>
                <button onClick={() => handleAction(user.id, true)} disabled={isActing}
                  className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button onClick={() => setViewingUser(user)}
                  className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setViewingUser(null)}>
          <div className="glass-panel-glow w-full max-w-lg rounded-[40px] p-5 sm:p-8 relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingUser(null)}
              className="absolute top-6 right-6 p-2 rounded-full glass-panel hover:bg-white/10 transition-all z-20">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${GRAD[0]} flex items-center justify-center text-white text-2xl font-bold shadow-2xl`}>
                {getInitials(viewingUser.email)}
              </div>
              <div>
                <h3 className="text-2xl font-black">{viewingUser.email.split('@')[0]}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{viewingUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-4 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Aadhaar</p>
                <p className="text-sm font-mono">{viewingUser.aadhaarNumber || '—'}</p>
              </div>
              <div className="glass-panel p-4 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">PAN Card</p>
                <p className="text-sm font-mono">{viewingUser.panNumber || '—'}</p>
              </div>
            </div>

            {viewingUser.selfieUrl && (
              <div className="glass-panel rounded-2xl overflow-hidden">
                <img src={viewingUser.selfieUrl} alt="KYC selfie" className="w-full h-48 object-cover" />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-rose-400 mb-2">Rejection Reason (if rejecting)</label>
              <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                className="w-full theme-input rounded-2xl px-4 py-3 text-sm resize-none" rows={2}
                placeholder="Document unclear, mismatch, etc." />
            </div>

            <div className="flex gap-3">
              <button onClick={() => handleAction(viewingUser.id, false)} disabled={isActing}
                className="flex-1 py-4 rounded-2xl glass-panel text-rose-500 font-black text-sm hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {isActing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Reject
              </button>
              <button onClick={() => handleAction(viewingUser.id, true)} disabled={isActing}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {isActing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
