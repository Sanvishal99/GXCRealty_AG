"use client";
import { useState, useEffect } from 'react';
import { deals as dealsApi } from '@/lib/api';
import { CheckCircle2, XCircle, Clock, IndianRupee, User, Building2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_CONFIG = {
  PENDING_VERIFICATION: { label: 'Pending',  color: 'bg-amber-100 text-amber-700 border-amber-200',   icon: Clock,         dot: 'bg-amber-400' },
  VERIFIED:             { label: 'Verified', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2,  dot: 'bg-emerald-500' },
  REJECTED:             { label: 'Rejected', color: 'bg-rose-100 text-rose-700 border-rose-200',       icon: XCircle,       dot: 'bg-rose-500' },
} as const;

const fmt = (n: number) =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(2)} Cr` : `₹${(n / 100000).toFixed(2)} L`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING_VERIFICATION;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function ReviewPanel({ deal, onDone }: { deal: any; onDone: (updated: any) => void }) {
  const [note, setNote] = useState(deal.adminNote || '');
  const [acting, setActing] = useState<'VERIFIED' | 'REJECTED' | null>(null);

  const submit = async (status: 'VERIFIED' | 'REJECTED') => {
    setActing(status);
    try {
      const updated = await dealsApi.updateStatus(deal.id, status, note.trim() || undefined);
      onDone(updated);
    } catch {}
    setActing(null);
  };

  return (
    <div className="mt-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
      <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Admin Review</p>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Optional note to agent (visible after decision)…"
        rows={2}
        className="w-full text-sm border border-neutral-200 rounded-xl px-3 py-2 resize-none outline-none focus:ring-2 focus:ring-indigo-300/40 focus:border-indigo-400 bg-white"
      />
      <div className="flex gap-2">
        <button
          onClick={() => submit('VERIFIED')}
          disabled={!!acting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          {acting === 'VERIFIED' ? 'Verifying…' : 'Verify Deal'}
        </button>
        <button
          onClick={() => submit('REJECTED')}
          disabled={!!acting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
        >
          <XCircle className="w-4 h-4" />
          {acting === 'REJECTED' ? 'Rejecting…' : 'Reject Deal'}
        </button>
      </div>
    </div>
  );
}

function parseCommission(deal: any) {
  const txns: { amount: number; description: string }[] = deal.transactions ?? [];
  const pool = deal.salePrice * deal.totalCommission;
  const advisor = txns
    .filter(t => t.description?.startsWith('Closing Agent Commission'))
    .reduce((s, t) => s + t.amount, 0);
  const company = txns
    .filter(t => t.description?.startsWith('Company Fixed Share') || t.description?.startsWith('Unclaimed Network Residue'))
    .reduce((s, t) => s + t.amount, 0);
  const network = txns
    .filter(t => t.description?.startsWith('Level'))
    .reduce((s, t) => s + t.amount, 0);
  return { pool, advisor, company, network };
}

function DealCard({ deal, onUpdate }: { deal: any; onUpdate: (d: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const { pool, advisor, company, network } = parseCommission(deal);

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer select-none"
        onClick={() => setExpanded(p => !p)}
      >
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-neutral-800 truncate">{deal.property?.title ?? '—'}</p>
          <p className="text-xs text-neutral-400 font-medium">{deal.property?.city ?? ''}</p>
        </div>
        <StatusBadge status={deal.status} />
        <span className="text-neutral-400">{expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 divide-x divide-neutral-100 border-t border-neutral-100">
        <div className="px-5 py-3">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Sale Value</p>
          <p className="text-sm font-black text-neutral-800">{fmt(deal.salePrice)}</p>
        </div>
        <div className="px-5 py-3">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Commission Pool</p>
          <p className="text-sm font-black text-emerald-700">{fmt(pool)}</p>
        </div>
        <div className="px-5 py-3">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Closed On</p>
          <p className="text-sm font-black text-neutral-800">{fmtDate(deal.createdAt)}</p>
        </div>
      </div>

      {/* Commission breakup row */}
      <div className="grid grid-cols-3 divide-x divide-neutral-100 border-t border-dashed border-neutral-100 bg-neutral-50/60">
        <div className="px-5 py-2.5">
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Incentive to Advisor</p>
          <p className="text-sm font-bold text-indigo-700">{advisor > 0 ? fmt(advisor) : '—'}</p>
        </div>
        <div className="px-5 py-2.5">
          <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-0.5">Company Part</p>
          <p className="text-sm font-bold text-violet-700">{company > 0 ? fmt(company) : '—'}</p>
        </div>
        <div className="px-5 py-2.5">
          <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-0.5">Network Pool</p>
          <p className="text-sm font-bold text-sky-700">{network > 0 ? fmt(network) : '—'}</p>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5 pt-4 border-t border-neutral-100 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-neutral-600">
              <User className="w-4 h-4 text-neutral-400 shrink-0" />
              <span className="font-medium truncate">{deal.agent?.email ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-600">
              <IndianRupee className="w-4 h-4 text-neutral-400 shrink-0" />
              <span className="font-medium">{(deal.totalCommission * 100).toFixed(2)}% incentive rate</span>
            </div>
            {deal.reviewedAt && (
              <div className="flex items-center gap-2 text-neutral-600 col-span-2">
                <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                <span className="font-medium">Reviewed {fmtDate(deal.reviewedAt)}</span>
              </div>
            )}
            {deal.adminNote && (
              <div className="col-span-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">Admin Note</p>
                <p className="text-sm text-amber-800">{deal.adminNote}</p>
              </div>
            )}
          </div>

          {deal.status === 'PENDING_VERIFICATION' && (
            <ReviewPanel deal={deal} onDone={updated => onUpdate(updated)} />
          )}

          {deal.status !== 'PENDING_VERIFICATION' && (
            <button
              onClick={e => { e.stopPropagation(); onUpdate({ ...deal, status: 'PENDING_VERIFICATION', adminNote: null, reviewedAt: null }); }}
              className="text-xs font-bold text-neutral-400 hover:text-neutral-600 underline underline-offset-2"
            >
              Re-open for review
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED'>('ALL');

  useEffect(() => {
    dealsApi.list()
      .then(setDeals)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateDeal = (updated: any) =>
    setDeals(prev => prev.map(d => d.id === updated.id ? updated : d));

  const filtered = filter === 'ALL' ? deals : deals.filter(d => d.status === filter);
  const counts = {
    ALL: deals.length,
    PENDING_VERIFICATION: deals.filter(d => d.status === 'PENDING_VERIFICATION').length,
    VERIFIED: deals.filter(d => d.status === 'VERIFIED').length,
    REJECTED: deals.filter(d => d.status === 'REJECTED').length,
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-neutral-800">Deal Management</h1>
        <p className="text-sm text-neutral-500 mt-1">Review and verify deals submitted by agents</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
              filter === s
                ? 'bg-neutral-800 text-white border-neutral-800'
                : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300'
            }`}
          >
            {s === 'ALL' ? 'All' : STATUS_CONFIG[s].label}
            <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-black ${filter === s ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Deal list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-neutral-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-bold">No deals found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(deal => (
            <DealCard key={deal.id} deal={deal} onUpdate={updateDeal} />
          ))}
        </div>
      )}
    </div>
  );
}
