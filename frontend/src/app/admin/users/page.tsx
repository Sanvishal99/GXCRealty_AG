"use client";
import { useState, useEffect, useCallback } from 'react';
import { useUserProfile } from '@/context/UserProfileContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAuditLog } from '@/context/LogContext';
import { users as usersApi, ApiError } from '@/lib/api';
import { isAdmin } from '@/lib/constants';
import { User, Shield, LogIn, Search, RefreshCw, CheckCircle, XCircle, ExternalLink, UserPlus, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

interface NetworkUser {
  id: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  inviteCode?: string;
  name?: string;
}

const ROLE_GRAD: Record<string, string> = {
  ADMIN:   'from-rose-500 to-pink-600',
  COMPANY: 'from-indigo-500 to-purple-600',
  AGENT:   'from-emerald-500 to-teal-500',
};

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  ACTIVE:           { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  PENDING_KYC:      { color: 'text-amber-500',   bg: 'bg-amber-500/10'   },
  PENDING_APPROVAL: { color: 'text-indigo-400',  bg: 'bg-indigo-500/10'  },
  SUSPENDED:        { color: 'text-rose-500',     bg: 'bg-rose-500/10'    },
};

const DEFAULT_STATUSES: Record<string, string> = {
  AGENT:   'PENDING_KYC',
  COMPANY: 'PENDING_APPROVAL',
  ADMIN:   'ACTIVE',
};

const BLANK_FORM = { email: '', phone: '', password: '', role: 'AGENT', status: 'PENDING_KYC', referralCode: '' };

export default function AdminUsersPage() {
  const { profile: currentProfile, impersonateUser, isImpersonating, stopImpersonating } = useUserProfile();
  const { addNotification } = useNotifications();
  const { addLog } = useAuditLog();

  const [networkUsers, setNetworkUsers] = useState<NetworkUser[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [roleFilter, setRoleFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [togglingId, setTogglingId]     = useState<string | null>(null);

  // Create user modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(BLANK_FORM);
  const [showPwd, setShowPwd]       = useState(false);
  const [creating, setCreating]     = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await usersApi.list(params);
      setNetworkUsers(data);
    } catch {
      setNetworkUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleLoginAs = (user: NetworkUser) => {
    impersonateUser(user as any);
    addNotification({ type: 'info', title: 'Session Switched', message: `Now viewing as ${user.email}.`, category: 'system' });
    addLog(`IMPERSONATED User: ${user.email}`, 'security', { targetUser: user.email });
    window.location.href = '/dashboard';
  };

  const handleToggleStatus = async (user: NetworkUser) => {
    setTogglingId(user.id);
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await usersApi.updateStatus(user.id, newStatus);
      addNotification({ type: newStatus === 'SUSPENDED' ? 'error' : 'success', title: `User ${newStatus === 'SUSPENDED' ? 'Suspended' : 'Activated'}`, message: user.email, category: 'system' });
      addLog(`STATUS_CHANGE: ${user.email} → ${newStatus}`, 'security', { targetUser: user.email, newStatus });
      await fetchUsers();
    } catch (err) {
      addNotification({ type: 'error', title: 'Failed', message: err instanceof ApiError ? err.message : 'Could not update status.', category: 'system' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      addNotification({ type: 'error', title: 'Invalid', message: 'Password must be at least 8 characters.', category: 'system' });
      return;
    }
    setCreating(true);
    try {
      const payload: any = { email: form.email, phone: form.phone, password: form.password, role: form.role, status: form.status };
      if (form.referralCode) payload.referralCode = form.referralCode;
      const created = await usersApi.create(payload);
      addNotification({ type: 'success', title: 'User Created', message: `${form.email} (${form.role}) created successfully.`, category: 'system' });
      addLog(`ADMIN_CREATE_USER: ${form.email} (${form.role})`, 'security', { email: form.email, role: form.role });
      setShowCreate(false);
      setForm(BLANK_FORM);
      await fetchUsers();
    } catch (err) {
      addNotification({ type: 'error', title: 'Failed to create user', message: err instanceof ApiError ? err.message : 'Something went wrong.', category: 'system' });
    } finally {
      setCreating(false);
    }
  };

  if (!isAdmin(currentProfile.role)) {
    return (
      <div className="p-24 text-center">
        <Shield className="w-16 h-16 mx-auto mb-6 text-rose-500 opacity-20" />
        <h2 className="text-3xl font-black mb-2 text-rose-500">Access Restricted</h2>
        <p className="text-[var(--text-secondary)]">Only GXC Network Administrators can manage the user directory.</p>
        <Link href="/dashboard" className="inline-block mt-8 px-8 py-3 rounded-2xl bg-indigo-600 text-white font-bold">Return to Station</Link>
      </div>
    );
  }

  const filteredUsers = networkUsers.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 relative z-10 w-full max-w-6xl mx-auto text-[var(--text-primary)]">
      <header className="mb-10 flex flex-col sm:flex-row justify-between sm:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)]">
            <Shield className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">User Governance</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Network <span className="text-gradient">Directory</span></h1>
          <p className="text-[var(--text-secondary)]">Manage system access and troubleshoot accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          {isImpersonating && (
            <button onClick={stopImpersonating} className="px-5 py-2.5 rounded-2xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition-all">
              Stop Impersonation
            </button>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            <UserPlus className="w-4 h-4" /> Create User
          </button>
          <button onClick={fetchUsers} className="p-3 rounded-2xl glass-panel hover:bg-[var(--glass-bg-hover)] transition-all">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
          <input type="text" placeholder="Search by email or name…" value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full theme-input rounded-2xl pl-12 py-4" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="theme-input rounded-2xl px-4 py-4 min-w-[140px]">
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="COMPANY">Company</option>
          <option value="AGENT">Advisor</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="theme-input rounded-2xl px-4 py-4 min-w-[160px]">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_KYC">Pending KYC</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="glass-panel rounded-3xl p-6 animate-pulse space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
              <div className="h-10 bg-white/5 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="glass-panel rounded-3xl p-16 text-center opacity-50">
          <User className="w-12 h-12 mx-auto mb-4" />
          <p className="font-semibold">No users found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const statusStyle = STATUS_STYLE[user.status] || STATUS_STYLE.ACTIVE;
            const isSelf = user.email === currentProfile.email;
            return (
              <div key={user.id} className="glass-panel rounded-3xl p-6 border border-white/5 hover:border-indigo-500/20 transition-all group overflow-hidden">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${ROLE_GRAD[user.role] || ROLE_GRAD.AGENT} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                    {user.email.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{user.name || user.email.split('@')[0]}</h4>
                    <p className="text-[10px] opacity-40 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-400">{user.role}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${statusStyle.bg} ${statusStyle.color}`}>{user.status.replace(/_/g, ' ')}</span>
                </div>

                <div className="flex gap-2">
                  <Link href={`/admin/users/${user.id}`}
                    className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-white/10 transition-all"
                    title="View full profile">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button onClick={() => handleLoginAs(user)} disabled={isSelf}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 disabled:opacity-30 flex items-center justify-center gap-1.5 transition-all">
                    <LogIn className="w-3.5 h-3.5" /> Login As
                  </button>
                  <button
                    onClick={() => handleToggleStatus(user)}
                    disabled={isSelf || togglingId === user.id}
                    title={user.status === 'ACTIVE' ? 'Suspend user' : 'Activate user'}
                    className={`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-30 ${
                      user.status === 'ACTIVE'
                        ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30'
                    }`}>
                    {togglingId === user.id
                      ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      : user.status === 'ACTIVE' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && (
        <p className="text-center text-sm text-[var(--text-muted)] mt-8">{filteredUsers.length} of {networkUsers.length} users</p>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-[32px] p-8 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold leading-tight">Create User</h3>
                <p className="text-[var(--text-muted)] text-xs">Provision a new account directly</p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Email Address</label>
                  <input required type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="user@example.com"
                    className="w-full theme-input rounded-2xl px-4 py-3" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Phone Number</label>
                  <input required type="tel" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full theme-input rounded-2xl px-4 py-3" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Password</label>
                  <div className="relative">
                    <input required type={showPwd ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Min. 8 characters"
                      className="w-full theme-input rounded-2xl px-4 py-3 pr-12 font-mono" />
                    <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 transition-opacity">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Role</label>
                  <select value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value, status: DEFAULT_STATUSES[e.target.value] || 'ACTIVE' }))}
                    className="w-full theme-input rounded-2xl px-4 py-3">
                    <option value="AGENT">Agent / Advisor</option>
                    <option value="COMPANY">Company</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Status</label>
                  <select value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full theme-input rounded-2xl px-4 py-3">
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING_KYC">Pending KYC</option>
                    <option value="PENDING_APPROVAL">Pending Approval</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
                {form.role === 'AGENT' && (
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Referral / Upline Code <span className="normal-case font-normal opacity-60">(optional)</span></label>
                    <input type="text" value={form.referralCode}
                      onChange={e => setForm(f => ({ ...f, referralCode: e.target.value }))}
                      placeholder="e.g. A1B2C3D4"
                      className="w-full theme-input rounded-2xl px-4 py-3 font-mono uppercase" />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-40">
                  {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {creating ? 'Creating…' : 'Create User'}
                </button>
                <button type="button" onClick={() => { setShowCreate(false); setForm(BLANK_FORM); }} className="px-6 py-3 rounded-xl bg-white/5 text-[var(--text-primary)] font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
