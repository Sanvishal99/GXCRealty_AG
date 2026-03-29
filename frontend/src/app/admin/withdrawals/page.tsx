"use client";
import { useState, useEffect, useCallback } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { useNotifications } from '@/context/NotificationContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { withdrawals as withdrawalsApi, ApiError } from '@/lib/api';
import { isAdmin } from '@/lib/constants';
import {
  Banknote, RefreshCw, Clock, CheckCircle2, XCircle,
  Check, CreditCard, ShieldAlert, ChevronDown, X,
} from 'lucide-react';
import Link from 'next/link';

// ── Module-level constants ────────────────────────────────────────────────────
const inputCls =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all';

type FilterTab = 'ALL' | 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL',      label: 'All'      },
  { key: 'PENDING',  label: 'Pending'  },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'PAID',     label: 'Paid'     },
  { key: 'REJECTED', label: 'Rejected' },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING:  'bg-amber-100 text-amber-700 border border-amber-200',
  APPROVED: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  REJECTED: 'bg-rose-100 text-rose-700 border border-rose-200',
  PAID:     'bg-emerald-100 text-emerald-700 border border-emerald-200',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:  <Clock className="w-3 h-3" />,
  APPROVED: <CheckCircle2 className="w-3 h-3" />,
  REJECTED: <XCircle className="w-3 h-3" />,
  PAID:     <Check className="w-3 h-3" />,
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AdminWithdrawalsPage() {
  const { profile } = useUserProfile();
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab]     = useState<FilterTab>('ALL');
  const [items, setItems]             = useState<any[]>([]);
  const [isLoading, setIsLoading]     = useState(true);

  // Reject modal state
  const [rejectId, setRejectId]       = useState<string | null>(null);
  const [rejectNote, setRejectNote]   = useState('');
  const [processing, setProcessing]   = useState<string | null>(null); // tracks which id is in-flight

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = activeTab === 'ALL' ? undefined : activeTab;
      const data = await withdrawalsApi.list(status);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleAction = async (
    id: string,
    action: 'APPROVE' | 'REJECT' | 'PAY',
    adminNote?: string,
  ) => {
    setProcessing(id);
    try {
      await withdrawalsApi.process(id, action, adminNote);
      const label = action === 'APPROVE' ? 'Approved' : action === 'REJECT' ? 'Rejected' : 'Marked as Paid';
      addNotification({ type: 'success', title: `Withdrawal ${label}`, message: `Request #${id.slice(-6)} has been ${label.toLowerCase()}.`, category: 'system' });
      setRejectId(null);
      setRejectNote('');
      await fetchData();
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Action Failed',
        message: err instanceof ApiError ? err.message : 'Something went wrong.',
        category: 'system',
      });
    } finally {
      setProcessing(null);
    }
  };

  // ── Computed stats ────────────────────────────────────────────────────────
  // Always compute from full list — but since we filter server-side for non-ALL tabs,
  // we show best-effort from whatever is loaded.
  const pendingCount   = items.filter(r => r.status === 'PENDING').length;
  const approvedTotal  = items.filter(r => r.status === 'APPROVED').reduce((a, r) => a + r.amount, 0);
  const now            = new Date();
  const paidThisMonth  = items
    .filter(r => {
      if (r.status !== 'PAID') return false;
      const d = new Date(r.updatedAt || r.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((a, r) => a + r.amount, 0);

  if (!isAdmin(profile.role)) {
    return (
      <div className="p-24 text-center">
        <ShieldAlert className="w-16 h-16 mx-auto mb-6 text-rose-500 opacity-20" />
        <h2 className="text-3xl font-black mb-2 text-rose-500">Access Restricted</h2>
        <p className="text-gray-500">Admin access required.</p>
        <Link href="/dashboard" className="inline-block mt-8 px-8 py-3 rounded-2xl bg-indigo-600 text-white font-bold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
            <Banknote className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">Finance</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-1">
            Withdrawal Requests
          </h1>
          <p className="text-gray-500 text-sm">Review, approve, and pay out advisor withdrawal requests.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Pending Requests',
            value: pendingCount.toString(),
            sub: 'Awaiting review',
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            icon: <Clock className="w-5 h-5 text-amber-500" />,
          },
          {
            label: 'Approved (Awaiting Pay)',
            value: formatCurrency(approvedTotal),
            sub: 'Ready to disburse',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            border: 'border-indigo-100',
            icon: <CheckCircle2 className="w-5 h-5 text-indigo-500" />,
          },
          {
            label: 'Paid This Month',
            value: formatCurrency(paidThisMonth),
            sub: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            icon: <Check className="w-5 h-5 text-emerald-500" />,
          },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} border ${s.border} rounded-2xl p-5 flex items-start gap-4`}>
            <div className="p-2 rounded-xl bg-white shadow-sm border border-gray-100 flex-shrink-0">
              {s.icon}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{s.label}</p>
              <p className={`text-2xl font-black ${s.color} font-mono leading-tight`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-6 p-1 bg-gray-100 rounded-2xl w-fit flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin opacity-40" />
            <p className="text-sm">Loading requests…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <Banknote className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No withdrawal requests</p>
            <p className="text-sm mt-1">
              {activeTab === 'ALL' ? 'No requests have been submitted yet.' : `No ${activeTab.toLowerCase()} requests.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase text-[11px] tracking-wider">User</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase text-[11px] tracking-wider">Amount</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase text-[11px] tracking-wider">Payout Details</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase text-[11px] tracking-wider">Status</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-gray-500 uppercase text-[11px] tracking-wider">Date</th>
                  <th className="text-right px-6 py-3.5 font-semibold text-gray-500 uppercase text-[11px] tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((req) => {
                  const isUpi      = !!req.upiId;
                  const badge      = STATUS_BADGE[req.status] || STATUS_BADGE.PENDING;
                  const statusIcon = STATUS_ICON[req.status]  || STATUS_ICON.PENDING;
                  const busy       = processing === req.id;

                  return (
                    <tr key={req.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600 flex-shrink-0">
                            {(req.user?.email || req.user?.phone || '?').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">
                              {req.user?.email?.split('@')[0] || req.user?.phone || 'Unknown'}
                            </p>
                            <p className="text-[11px] text-gray-400">{req.user?.email || req.user?.phone || ''}</p>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <span className="font-black text-gray-900 font-mono text-base">
                          {formatCurrency(req.amount)}
                        </span>
                      </td>

                      {/* Payout details */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <div className="p-1.5 rounded-lg bg-gray-100 flex-shrink-0 mt-0.5">
                            {isUpi
                              ? <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                              : <Banknote className="w-3.5 h-3.5 text-gray-500" />
                            }
                          </div>
                          <div className="min-w-0">
                            {isUpi ? (
                              <>
                                <p className="font-semibold text-gray-700 text-xs">UPI Transfer</p>
                                <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{req.upiId}</p>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold text-gray-700 text-xs">{req.bankName || 'Bank Transfer'}</p>
                                <p className="text-[11px] text-gray-400">
                                  {req.accountName && <span>{req.accountName} · </span>}
                                  {req.accountNumber ? `····${req.accountNumber.slice(-4)}` : ''}
                                  {req.ifscCode && <span> · {req.ifscCode}</span>}
                                </p>
                              </>
                            )}
                            {req.adminNote && req.status === 'REJECTED' && (
                              <p className="text-[11px] text-rose-500 mt-0.5 italic">Note: {req.adminNote}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg ${badge}`}>
                          {statusIcon} {req.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-500">{formatDate(req.createdAt)}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {req.status === 'PENDING' && (
                            <>
                              <button
                                disabled={busy}
                                onClick={() => handleAction(req.id, 'APPROVE')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                {busy ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                Approve
                              </button>
                              <button
                                disabled={busy}
                                onClick={() => { setRejectId(req.id); setRejectNote(''); }}
                                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                <X className="w-3 h-3" /> Reject
                              </button>
                            </>
                          )}

                          {req.status === 'APPROVED' && (
                            <button
                              disabled={busy}
                              onClick={() => handleAction(req.id, 'PAY')}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {busy
                                ? <RefreshCw className="w-3 h-3 animate-spin" />
                                : <Banknote className="w-3 h-3" />
                              }
                              Mark Paid
                            </button>
                          )}

                          {(req.status === 'PAID' || req.status === 'REJECTED') && (
                            <span className="text-xs text-gray-400 italic">
                              {req.status === 'PAID' ? 'Completed' : 'Closed'}
                            </span>
                          )}
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

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-7 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-500" /> Reject Request
              </h3>
              <button
                onClick={() => { setRejectId(null); setRejectNote(''); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-all"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Provide an optional reason — it will be visible to the advisor.
            </p>

            <textarea
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none mb-5`}
              placeholder="Reason for rejection (optional)…"
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setRejectId(null); setRejectNote(''); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={processing === rejectId}
                onClick={() => handleAction(rejectId, 'REJECT', rejectNote || undefined)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing === rejectId
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <XCircle className="w-4 h-4" />
                }
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
