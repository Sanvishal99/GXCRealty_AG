"use client";
import { useState, useEffect, useCallback } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { useNotifications } from '@/context/NotificationContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { wallet as walletApi, withdrawals as withdrawalsApi, ApiError } from '@/lib/api';
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, RefreshCw, Plus,
  Clock, CheckCircle2, XCircle, Banknote, X, Check, CreditCard,
  TrendingUp,
} from 'lucide-react';

// ── Module-level constants (avoid remounting) ────────────────────────────────
const inputCls =
  'w-full theme-input rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all';

const TX_STYLE: Record<string, { icon: string; color: string; bg: string }> = {
  CREDIT: { icon: '💸', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  DEBIT:  { icon: '🏦', color: 'text-rose-500',    bg: 'bg-rose-500/10'    },
};

const STATUS_BADGE: Record<string, string> = {
  PENDING:  'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  APPROVED: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  REJECTED: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  PAID:     'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:  <Clock className="w-3.5 h-3.5" />,
  APPROVED: <CheckCircle2 className="w-3.5 h-3.5" />,
  REJECTED: <XCircle className="w-3.5 h-3.5" />,
  PAID:     <Check className="w-3.5 h-3.5" />,
};

type PayTab = 'bank' | 'upi';

interface Transaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  createdAt: string;
}

interface WalletData {
  id: string;
  balance: number;
  transactions: Transaction[];
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function WalletPage() {
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const { profile } = useUserProfile();

  // Wallet data
  const [walletData, setWalletData]   = useState<WalletData | null>(null);
  const [isLoading, setIsLoading]     = useState(true);

  // Withdrawal requests list
  const [requests, setRequests]         = useState<any[]>([]);
  const [reqLoading, setReqLoading]     = useState(true);

  // Modal
  const [modalOpen, setModalOpen]       = useState(false);
  const [payTab, setPayTab]             = useState<PayTab>('bank');
  const [amount, setAmount]             = useState<number | ''>('');
  const [bankName, setBankName]         = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode]         = useState('');
  const [accountName, setAccountName]   = useState('');
  const [upiId, setUpiId]               = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState('');

  // ── Data fetchers ────────────────────────────────────────────────────────────
  const fetchWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await walletApi.get();
      setWalletData(data);
    } catch {
      // leave as null → empty state
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setReqLoading(true);
    try {
      const data = await withdrawalsApi.list();
      setRequests(data);
    } catch {
      setRequests([]);
    } finally {
      setReqLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    fetchRequests();
  }, [fetchWallet, fetchRequests]);

  // ── Computed ─────────────────────────────────────────────────────────────────
  const transactions  = walletData?.transactions || [];
  const totalCredited = transactions.filter(t => t.type === 'CREDIT').reduce((a, t) => a + t.amount, 0);
  const totalDebited  = transactions.filter(t => t.type === 'DEBIT').reduce((a, t) => a + t.amount, 0);

  // ── Modal helpers ────────────────────────────────────────────────────────────
  const closeModal = () => {
    setModalOpen(false);
    setFormError('');
    setAmount('');
    setBankName('');
    setAccountNumber('');
    setIfscCode('');
    setAccountName('');
    setUpiId('');
    setPayTab('bank');
  };

  const handleSubmitRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setSubmitting(true);
    setFormError('');

    const payload: Parameters<typeof withdrawalsApi.request>[0] = { amount: Number(amount) };
    if (payTab === 'bank') {
      payload.bankName      = bankName;
      payload.accountNumber = accountNumber;
      payload.ifscCode      = ifscCode;
      payload.accountName   = accountName;
    } else {
      payload.upiId = upiId;
    }

    try {
      await withdrawalsApi.request(payload);
      addNotification({
        type: 'success',
        title: 'Withdrawal Requested',
        message: `Your request for ${formatCurrency(Number(amount))} has been submitted for review.`,
        category: 'system',
      });
      closeModal();
      await Promise.all([fetchWallet(), fetchRequests()]);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 relative z-10 w-full max-w-6xl mx-auto text-[var(--text-primary)]">
      {/* Ambient glow */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] glow-orb-4 rounded-full blur-[140px] pointer-events-none opacity-30 -translate-y-1/4 translate-x-1/3" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] glow-orb-1 rounded-full blur-[120px] pointer-events-none opacity-25" />

      {/* Header */}
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel">
          <Wallet className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Wallet</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">
          My <span className="text-gradient-emerald">Wallet</span>
        </h1>
        <p className="text-[var(--text-secondary)]">Track your earnings and manage withdrawals.</p>
      </header>

      {/* ── Balance + Quick Stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Balance Card */}
        <div
          className="lg:col-span-1 glass-panel rounded-3xl p-8 relative overflow-hidden stat-card-emerald"
          style={{ background: 'linear-gradient(145deg, rgba(16,185,129,0.15) 0%, rgba(34,211,238,0.08) 100%)' }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none glow-pulse" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { fetchWallet(); fetchRequests(); }}
                className="p-2 rounded-xl glass-panel hover:bg-[var(--glass-bg-hover)] transition-all"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <span className="badge text-emerald-500 bg-emerald-500/10 border-emerald-500/30">Live</span>
            </div>
          </div>

          <p className="text-sm font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-widest relative z-10">
            Available Balance
          </p>
          {isLoading ? (
            <div className="h-10 bg-white/10 rounded-xl animate-pulse mb-1 relative z-10" />
          ) : (
            <h2 className="text-3xl font-extrabold font-mono text-gradient-emerald mb-1 relative z-10 break-all leading-tight">
              {formatCurrency(walletData?.balance ?? 0)}
            </h2>
          )}

          <div className="grid grid-cols-2 gap-3 mb-8 mt-4 relative z-10">
            <div className="glass-panel rounded-2xl p-3 text-center">
              <ArrowUpCircle className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-0.5">Credited</p>
              {isLoading
                ? <div className="h-4 bg-white/10 rounded animate-pulse" />
                : <p className="text-sm font-extrabold text-emerald-400 font-mono">{formatCurrency(totalCredited)}</p>
              }
            </div>
            <div className="glass-panel rounded-2xl p-3 text-center">
              <ArrowDownCircle className="w-4 h-4 text-rose-500 mx-auto mb-1" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-0.5">Debited</p>
              {isLoading
                ? <div className="h-4 bg-white/10 rounded animate-pulse" />
                : <p className="text-sm font-extrabold text-rose-400 font-mono">{formatCurrency(totalDebited)}</p>
              }
            </div>
          </div>

          <div className="relative z-10">
            <button
              onClick={() => setModalOpen(true)}
              disabled={!walletData || walletData.balance <= 0}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <Plus className="w-5 h-5" /> Request Withdrawal
            </button>
          </div>
        </div>

        {/* Withdrawal Requests */}
        <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-500 to-orange-500 inline-block" />
              My Withdrawal Requests
            </h3>
            <span className="text-xs text-[var(--text-muted)]">{requests.length} requests</span>
          </div>

          <div className="divide-y divide-[var(--border-subtle)] max-h-72 overflow-y-auto">
            {reqLoading ? (
              <div className="p-12 text-center opacity-40 animate-pulse">Loading…</div>
            ) : requests.length === 0 ? (
              <div className="p-10 text-center opacity-40">
                <Banknote className="w-8 h-8 mx-auto mb-2" />
                <p className="font-semibold text-sm">No withdrawal requests yet</p>
              </div>
            ) : (
              requests.map((req) => {
                const badge = STATUS_BADGE[req.status] || STATUS_BADGE.PENDING;
                const icon  = STATUS_ICON[req.status]  || STATUS_ICON.PENDING;
                const isUpi = !!req.upiId;
                return (
                  <div key={req.id} className="flex justify-between items-start px-5 py-4 hover:bg-[var(--glass-bg-hover)] transition-colors gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {isUpi ? <CreditCard className="w-4 h-4 text-amber-400" /> : <Banknote className="w-4 h-4 text-amber-400" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm">
                            {formatCurrency(req.amount)}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ${badge}`}>
                            {icon} {req.status}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {isUpi ? `UPI: ${req.upiId}` : `${req.bankName || 'Bank'} ····${(req.accountNumber || '').slice(-4)}`}
                        </p>
                        {req.adminNote && req.status === 'REJECTED' && (
                          <p className="text-xs text-rose-400 mt-1 italic">"{req.adminNote}"</p>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] flex-shrink-0 pt-1">{formatDate(req.createdAt)}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Transaction History ─────────────────────────────────────────────────── */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500 inline-block" />
            Transaction History
          </h3>
          <span className="text-xs text-[var(--text-muted)]">{transactions.length} records</span>
        </div>
        <div className="divide-y divide-[var(--border-subtle)] max-h-[480px] overflow-y-auto">
          {isLoading ? (
            <div className="p-12 text-center opacity-40 animate-pulse">Loading…</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center opacity-40">
              <TrendingUp className="w-8 h-8 mx-auto mb-2" />
              <p className="font-semibold">No transactions yet</p>
              <p className="text-sm">Complete a deal to earn incentives</p>
            </div>
          ) : (
            transactions.map((tx) => {
              const style = TX_STYLE[tx.type] || TX_STYLE.CREDIT;
              return (
                <div
                  key={tx.id}
                  className="flex justify-between items-center px-5 py-4 hover:bg-[var(--glass-bg-hover)] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${style.bg} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      {style.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--text-primary)]">
                        {tx.type === 'CREDIT' ? 'Incentive' : 'Withdrawal'}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)]">{tx.description}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <span className={`font-mono font-bold text-base ${style.color}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{formatDate(tx.createdAt)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Withdrawal Request Modal ──────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSubmitRequest}
            className="glass-panel w-full max-w-md rounded-3xl p-5 sm:p-8 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-emerald-500" /> Request Withdrawal
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-xl glass-panel hover:bg-[var(--glass-bg-hover)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-5">
              Available:{' '}
              <span className="font-bold text-emerald-500">{formatCurrency(walletData?.balance ?? 0)}</span>
            </p>

            {/* Error */}
            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
                <X className="w-4 h-4 flex-shrink-0" /> {formError}
              </div>
            )}

            {/* Amount */}
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Amount</label>
              <input
                required
                type="number"
                min={1}
                max={walletData?.balance ?? undefined}
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className={`${inputCls} text-2xl font-black font-mono text-emerald-500`}
                placeholder="0.00"
              />
            </div>

            {/* Payout method tabs */}
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Payout Method</label>
              <div className="flex gap-2 p-1 glass-panel rounded-2xl">
                <button
                  type="button"
                  onClick={() => setPayTab('bank')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    payTab === 'bank'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'hover:bg-[var(--glass-bg-hover)] text-[var(--text-secondary)]'
                  }`}
                >
                  <Banknote className="w-4 h-4" /> Bank Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setPayTab('upi')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    payTab === 'upi'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'hover:bg-[var(--glass-bg-hover)] text-[var(--text-secondary)]'
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> UPI
                </button>
              </div>
            </div>

            {/* Bank fields */}
            {payTab === 'bank' && (
              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. HDFC Bank"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. 123456789012"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">IFSC Code</label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={e => setIfscCode(e.target.value.toUpperCase())}
                    className={inputCls}
                    placeholder="e.g. HDFC0001234"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Account Holder Name</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    className={inputCls}
                    placeholder="Name as on bank account"
                  />
                </div>
              </div>
            )}

            {/* UPI field */}
            {payTab === 'upi' && (
              <div className="mb-5">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. yourname@upi"
                />
              </div>
            )}

            {/* Note */}
            <p className="text-[11px] text-[var(--text-muted)] mb-6 leading-relaxed border-l-2 border-indigo-500/30 pl-3">
              Your request will be reviewed by admin before processing. Bank details entered here are for this request only.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-3 rounded-2xl border border-white/10 font-bold text-sm hover:bg-[var(--glass-bg-hover)] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !amount}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowDownCircle className="w-4 h-4" />}
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
