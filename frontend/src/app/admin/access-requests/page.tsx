"use client";
import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { accessRequests as accessRequestsApi, ApiError } from '@/lib/api';
import { Search, RefreshCw, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  PENDING:  { color: 'text-amber-400',  bg: 'bg-amber-500/10',   label: 'Pending' },
  REVIEWED: { color: 'text-indigo-400', bg: 'bg-indigo-500/10',  label: 'Reviewed' },
  APPROVED: { color: 'text-emerald-400',bg: 'bg-emerald-500/10', label: 'Approved' },
  REJECTED: { color: 'text-rose-400',   bg: 'bg-rose-500/10',    label: 'Rejected' },
};

export default function AccessRequestsPage() {
  const { addNotification } = useNotifications();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await accessRequestsApi.list(statusFilter || undefined);
      setRequests(data);
    } catch {
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleReview = async (status: 'APPROVED' | 'REJECTED' | 'REVIEWED') => {
    if (!selectedRequest) return;
    setProcessing(true);
    try {
      await accessRequestsApi.review(selectedRequest.id, status, adminNote || undefined);
      addNotification({ type: status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'error' : 'info', title: `Request ${status.charAt(0) + status.slice(1).toLowerCase()}`, message: selectedRequest.email, category: 'system' });
      setSelectedRequest(null);
      setAdminNote('');
      await fetchRequests();
    } catch (err) {
      addNotification({ type: 'error', title: 'Failed', message: err instanceof ApiError ? err.message : 'Could not update request.', category: 'system' });
    } finally {
      setProcessing(false);
    }
  };

  const filtered = requests.filter(r =>
    r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.phone.includes(searchTerm)
  );

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="p-6 md:p-8 relative z-10 w-full max-w-6xl mx-auto text-[var(--text-primary)]">
      <header className="mb-10 flex flex-col sm:flex-row justify-between sm:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)]">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Access Requests</span>
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black">{pendingCount}</span>
            )}
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Network <span className="text-gradient">Applications</span></h1>
          <p className="text-[var(--text-secondary)]">Review and respond to access requests from the landing page.</p>
        </div>
        <button onClick={fetchRequests} className="p-3 rounded-2xl glass-panel hover:bg-[var(--glass-bg-hover)] transition-all self-start sm:self-auto">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Filters */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
          <input type="text" placeholder="Search by name, email, or phone…" value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full theme-input rounded-2xl pl-12 py-4" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="theme-input rounded-2xl px-4 py-4 min-w-[160px]">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="glass-panel rounded-3xl p-6 animate-pulse h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-3xl p-16 text-center opacity-50">
          <Clock className="w-12 h-12 mx-auto mb-4" />
          <p className="font-semibold">No access requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const style = STATUS_STYLE[req.status] || STATUS_STYLE.PENDING;
            return (
              <div key={req.id} className="glass-panel rounded-3xl px-6 py-5 border border-white/5 hover:border-indigo-500/20 transition-all flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold truncate">{req.fullName}</h4>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${style.bg} ${style.color}`}>{style.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)] font-medium">
                    <span>{req.email}</span>
                    <span>•</span>
                    <span>{req.phone}</span>
                    <span>•</span>
                    <span>{req.experience}</span>
                    <span>•</span>
                    <span>{new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {req.adminNote && (
                    <p className="mt-1 text-xs text-[var(--text-muted)] italic">Note: {req.adminNote}</p>
                  )}
                </div>
                <button
                  onClick={() => { setSelectedRequest(req); setAdminNote(req.adminNote || ''); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all flex-shrink-0"
                >
                  <Eye className="w-4 h-4" /> Review
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && (
        <p className="text-center text-sm text-[var(--text-muted)] mt-8">{filtered.length} of {requests.length} requests</p>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-[32px] p-8 border border-white/10 shadow-2xl">
            <h3 className="text-xl font-bold mb-1">Review Application</h3>
            <p className="text-[var(--text-muted)] text-sm mb-6">from <span className="font-bold text-[var(--text-primary)]">{selectedRequest.fullName}</span></p>

            <div className="space-y-3 mb-6">
              {[
                { label: 'Email', value: selectedRequest.email },
                { label: 'Phone', value: selectedRequest.phone },
                { label: 'Experience', value: selectedRequest.experience },
                { label: 'Applied', value: new Date(selectedRequest.createdAt).toLocaleString('en-IN') },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">{item.label}</span>
                  <span className="text-sm font-bold">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Admin Note (optional)</label>
              <textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                rows={3}
                placeholder="Internal note or reason for decision…"
                className="w-full theme-input rounded-2xl px-4 py-3 resize-none"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => handleReview('APPROVED')}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-black font-bold py-3 rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-40"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => handleReview('REJECTED')}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold py-3 rounded-xl hover:bg-rose-500/20 transition-all disabled:opacity-40"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button
                onClick={() => handleReview('REVIEWED')}
                disabled={processing}
                className="px-5 flex items-center justify-center gap-2 bg-white/5 text-[var(--text-secondary)] font-bold py-3 rounded-xl hover:bg-white/10 transition-all disabled:opacity-40"
              >
                Mark Reviewed
              </button>
              <button onClick={() => { setSelectedRequest(null); setAdminNote(''); }} className="px-5 py-3 rounded-xl bg-white/5 text-[var(--text-primary)] font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
