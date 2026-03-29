"use client";
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrency } from '@/context/CurrencyContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAuditLog } from '@/context/LogContext';
import { users as usersApi, ApiError } from '@/lib/api';
import { ArrowLeft, RefreshCw, Shield, Lock, Eye, EyeOff } from 'lucide-react';

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  ACTIVE:           { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  PENDING_KYC:      { color: 'text-amber-500',   bg: 'bg-amber-500/10'   },
  PENDING_APPROVAL: { color: 'text-indigo-400',  bg: 'bg-indigo-500/10'  },
  SUSPENDED:        { color: 'text-rose-500',     bg: 'bg-rose-500/10'    },
};

const ROLE_GRAD: Record<string, string> = {
  ADMIN:   'from-rose-500 to-pink-600',
  COMPANY: 'from-indigo-500 to-purple-600',
  AGENT:   'from-emerald-500 to-teal-500',
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const { addLog } = useAuditLog();
  const id = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<{ label: string; src: string } | null>(null);

  // Password reset state
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Status toggle
  const [togglingStatus, setTogglingStatus] = useState(false);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await usersApi.getById(id);
      setUser(data);
    } catch {
      addNotification({ type: 'error', title: 'Failed to load user', message: 'Could not fetch user details.', category: 'system' });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const handleToggleStatus = async () => {
    if (!user) return;
    setTogglingStatus(true);
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await usersApi.updateStatus(id, newStatus);
      addNotification({ type: newStatus === 'SUSPENDED' ? 'error' : 'success', title: `User ${newStatus === 'SUSPENDED' ? 'Suspended' : 'Activated'}`, message: user.email, category: 'system' });
      addLog(`STATUS_CHANGE: ${user.email} → ${newStatus}`, 'security', { targetUser: user.email, newStatus });
      await fetchUser();
    } catch (err) {
      addNotification({ type: 'error', title: 'Failed', message: err instanceof ApiError ? err.message : 'Could not update status.', category: 'system' });
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      addNotification({ type: 'error', title: 'Invalid', message: 'Password must be at least 8 characters.', category: 'system' });
      return;
    }
    setResetting(true);
    try {
      await usersApi.resetPassword(id, newPassword);
      addNotification({ type: 'success', title: 'Password Reset', message: `Password for ${user?.email} has been reset.`, category: 'system' });
      addLog(`PASSWORD_RESET for ${user?.email}`, 'security', { targetUser: user?.email });
      setShowResetPwd(false);
      setNewPassword('');
    } catch (err) {
      addNotification({ type: 'error', title: 'Failed', message: err instanceof ApiError ? err.message : 'Could not reset password.', category: 'system' });
    } finally {
      setResetting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addNotification({ type: 'info', title: 'Copied', message: `${label} copied to clipboard`, category: 'system' });
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin opacity-30" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p className="font-bold text-lg">User not found</p>
        <button onClick={() => router.back()} className="mt-4 px-6 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm">Go Back</button>
      </div>
    );
  }

  const statusStyle = STATUS_STYLE[user.status] || STATUS_STYLE.ACTIVE;
  const displayName = user.email.split('@')[0];
  const kyc = user.kyc;
  const wallet = user.wallet;
  const counts = user._count || {};

  return (
    <div className="p-8 relative z-10 w-full max-w-7xl mx-auto text-[var(--text-primary)]">
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to User Directory
      </button>

      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className={`w-24 h-24 rounded-[32px] bg-gradient-to-br ${ROLE_GRAD[user.role] || ROLE_GRAD.AGENT} flex items-center justify-center text-4xl font-black text-white shadow-xl`}>
            {displayName[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-black tracking-tight">{displayName}</h1>
              <span className={`badge ${statusStyle.color} ${statusStyle.bg}`}>{user.status.replace('_', ' ')}</span>
            </div>
            <p className="text-[var(--text-secondary)] font-medium flex items-center gap-4">
              <span>{user.email}</span>
              <span className="opacity-30">|</span>
              <span>{user.phone}</span>
              <span className="opacity-30">|</span>
              <span className="text-indigo-400 font-bold">{user.role}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowResetPwd(true)}
            className="px-5 py-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-sm hover:bg-amber-500/20 transition-all flex items-center gap-2"
          >
            <Lock className="w-4 h-4" /> Reset Password
          </button>
          <button
            onClick={handleToggleStatus}
            disabled={togglingStatus}
            className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
              user.status === 'ACTIVE'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
          >
            {togglingStatus ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            {user.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: General Info + Bank + KYC */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile */}
          <section className="glass-panel rounded-[40px] p-8 border border-white/5">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-sm">👤</span>
              Profile
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-1.5">Email</label>
                <p className="font-bold truncate">{user.email}</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-1.5">Phone</label>
                <p className="font-bold">{user.phone || '—'}</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-1.5">Role</label>
                <p className="font-bold">{user.role}</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-1.5">Invite Code</label>
                <div className="flex items-center gap-2 group">
                  <p className="font-mono font-bold text-sm">{user.inviteCode}</p>
                  <button onClick={() => copyToClipboard(user.inviteCode, 'Invite Code')} className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-1.5">Joined</label>
                <p className="font-bold text-sm">{new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-1.5">Referred By</label>
                <p className="font-bold text-sm">{user.referredById || 'Direct / Admin'}</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bank Details */}
            {kyc && (
              <section className="glass-panel rounded-[40px] p-8 border border-white/5 grad-emerald">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-sm">🏦</span>
                  Settlement Account
                </h3>
                {kyc.bankName ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest block mb-1">Bank Name</label>
                      <div className="flex items-center gap-2 group">
                        <p className="font-bold">{kyc.bankName}</p>
                        <button onClick={() => copyToClipboard(kyc.bankName, 'Bank Name')} className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest block mb-1">Account Number</label>
                      <div className="flex items-center gap-2 group">
                        <p className="font-mono font-bold">{kyc.accountNumber || '—'}</p>
                        {kyc.accountNumber && (
                          <button onClick={() => copyToClipboard(kyc.accountNumber, 'Account Number')} className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest block mb-1">IFSC</label>
                        <p className="font-bold text-sm">{kyc.ifscCode || '—'}</p>
                      </div>
                      <div className="text-right">
                        <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest block mb-1">Holder</label>
                        <p className="font-bold text-sm">{kyc.accountName || '—'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[var(--text-muted)] text-sm">No bank details submitted yet.</p>
                )}
              </section>
            )}

            {/* KYC Documents */}
            <section className="glass-panel rounded-[40px] p-8 border border-white/5 relative overflow-hidden">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center text-sm">📄</span>
                Compliance Docs
              </h3>
              {kyc ? (
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">KYC Status</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${kyc.isVerified ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                      {kyc.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  {kyc.aadhaarNumber && (
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-xs font-bold text-[var(--text-secondary)]">Aadhaar</span>
                      <span className="text-xs font-mono opacity-60">XXXX-XXXX-{kyc.aadhaarNumber.slice(-4)}</span>
                    </div>
                  )}
                  {kyc.panNumber && (
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-xs font-bold text-[var(--text-secondary)]">PAN</span>
                      <span className="text-xs font-mono opacity-60">{kyc.panNumber}</span>
                    </div>
                  )}
                  {[
                    { label: 'Govt ID Front', src: kyc.idFrontUrl },
                    { label: 'Govt ID Back', src: kyc.idBackUrl },
                    { label: 'Address Proof', src: kyc.addressDocUrl },
                    { label: 'Selfie', src: kyc.selfieUrl },
                  ].filter(d => d.src).map((doc, i) => (
                    <div key={i} onClick={() => setSelectedDoc(doc)} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all cursor-pointer">
                      <span className="text-xs font-bold text-[var(--text-secondary)]">{doc.label}</span>
                      <span className="text-[var(--text-muted)] group-hover:text-indigo-400 transition-colors">👁️</span>
                    </div>
                  ))}
                  {kyc.rejectionReason && (
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                      <p className="text-xs font-bold text-rose-400 mb-1">Rejection Reason</p>
                      <p className="text-xs text-[var(--text-secondary)]">{kyc.rejectionReason}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[var(--text-muted)] text-sm">No KYC submitted yet.</p>
              )}
            </section>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="space-y-6">
          <section className="glass-panel rounded-[40px] p-8 border border-indigo-500/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[100px] rounded-full" />
            <h3 className="text-xl font-black mb-8 relative z-10">Account Stats</h3>
            <div className="space-y-6 relative z-10">
              {wallet && (
                <div>
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Wallet Balance</p>
                  <p className="text-3xl font-black text-emerald-400">{formatCurrency(wallet.balance)}</p>
                </div>
              )}
              <div className="space-y-4 pt-2">
                {[
                  { label: 'Deals Closed', value: counts.dealsClosed ?? '—' },
                  { label: 'Active Leads', value: counts.leads ?? '—' },
                  { label: 'Network Size', value: counts.upline ?? '—' },
                  { label: 'Visits', value: counts.agentVisits ?? '—' },
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between text-sm font-bold">
                    <span className="text-[var(--text-secondary)]">{stat.label}</span>
                    <span>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-[40px] p-6 border border-white/5">
            <h3 className="text-sm font-black uppercase text-[var(--text-muted)] tracking-widest mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowResetPwd(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm hover:bg-amber-500/20 transition-all"
              >
                <Lock className="w-4 h-4" /> Reset Password
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={togglingStatus}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                  user.status === 'ACTIVE'
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                {togglingStatus ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {user.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetPwd && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-[32px] p-8 border border-white/10 shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Reset Password</h3>
            <p className="text-[var(--text-muted)] text-sm mb-6">Set a new password for <span className="font-bold text-[var(--text-primary)]">{user.email}</span></p>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password (min. 8 chars)"
                  className="w-full theme-input rounded-2xl px-4 py-3 pr-12 font-mono"
                />
                <button onClick={() => setShowPwd(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 transition-opacity">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleResetPassword}
                  disabled={resetting || newPassword.length < 8}
                  className="flex-1 bg-amber-500 text-black font-bold py-3 rounded-xl hover:bg-amber-400 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {resetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {resetting ? 'Resetting…' : 'Reset Password'}
                </button>
                <button onClick={() => { setShowResetPwd(false); setNewPassword(''); }} className="px-6 py-3 rounded-xl bg-white/5 text-[var(--text-primary)] font-bold">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KYC Document Lightbox */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-8 bg-black/90 backdrop-blur-2xl">
          <button onClick={() => setSelectedDoc(null)} className="absolute top-8 right-8 p-4 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="max-w-4xl w-full h-full flex flex-col items-center justify-center gap-6">
            <h3 className="text-2xl font-black text-white">{selectedDoc.label}</h3>
            <div className="w-full flex-1 rounded-[40px] overflow-hidden border border-white/10">
              <img src={selectedDoc.src} className="w-full h-full object-contain" alt="KYC Document" />
            </div>
            <button onClick={() => setSelectedDoc(null)} className="px-8 py-3 rounded-2xl bg-white/5 text-white font-bold text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
