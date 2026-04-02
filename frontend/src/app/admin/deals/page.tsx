"use client";
import { useState, useEffect } from 'react';
import { deals as dealsApi } from '@/lib/api';
import { CheckCircle2, XCircle, Clock, IndianRupee, User, Building2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

const GOLD       = '#B8860B';
const GOLD_LIGHT = '#D4A843';
const GOLD_BG    = '#FDF8ED';
const GOLD_CARD  = '#FFFDF5';
const BORDER     = 'rgba(180,130,30,0.18)';
const BORDER_MID = 'rgba(180,130,30,0.12)';
const TEXT_DARK  = '#1a1200';
const TEXT_MID   = '#5a4a28';
const TEXT_SOFT  = '#9a8060';

const STATUS_CONFIG = {
  PENDING_VERIFICATION: { label: 'Pending',  bg: 'rgba(184,134,11,0.1)',  text: '#92650a', border: 'rgba(184,134,11,0.25)', dot: '#D4A843' },
  VERIFIED:             { label: 'Verified', bg: 'rgba(22,163,74,0.08)',  text: '#15803d', border: 'rgba(22,163,74,0.2)',   dot: '#16a34a' },
  REJECTED:             { label: 'Rejected', bg: 'rgba(220,38,38,0.08)',  text: '#dc2626', border: 'rgba(220,38,38,0.2)',   dot: '#ef4444' },
} as const;

const fmt = (n: number) =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(2)} Cr` : `₹${(n / 100000).toFixed(2)} L`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING_VERIFICATION;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}

function ReviewPanel({ deal, onDone }: { deal: any; onDone: (updated: any) => void }) {
  const [note, setNote]     = useState(deal.adminNote || '');
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
    <div className="mt-4 p-4 rounded-2xl space-y-3 border"
      style={{ background: 'rgba(180,130,30,0.04)', borderColor: BORDER }}>
      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: TEXT_SOFT }}>Admin Review</p>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Optional note to agent (visible after decision)…"
        rows={2}
        className="w-full text-sm rounded-xl px-3 py-2 resize-none outline-none transition-all"
        style={{
          background: GOLD_BG,
          border: `1px solid ${BORDER}`,
          color: TEXT_DARK,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = `rgba(180,130,30,0.5)`; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(212,168,67,0.1)`; }}
        onBlur={e  => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; }}
      />
      <div className="flex gap-2">
        <button
          onClick={() => submit('VERIFIED')}
          disabled={!!acting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          style={{ background: 'rgba(22,163,74,0.12)', color: '#15803d', border: '1px solid rgba(22,163,74,0.25)' }}
          onMouseEnter={e => { if (!acting) (e.currentTarget as HTMLElement).style.background = 'rgba(22,163,74,0.2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(22,163,74,0.12)'; }}
        >
          <CheckCircle2 className="w-4 h-4" />
          {acting === 'VERIFIED' ? 'Verifying…' : 'Verify Deal'}
        </button>
        <button
          onClick={() => submit('REJECTED')}
          disabled={!!acting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)' }}
          onMouseEnter={e => { if (!acting) (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.15)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.08)'; }}
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
  const pool    = deal.salePrice * deal.totalCommission;
  const advisor = txns.filter(t => t.description?.startsWith('Closing Agent Commission')).reduce((s, t) => s + t.amount, 0);
  const company = txns.filter(t => t.description?.startsWith('Company Fixed Share') || t.description?.startsWith('Unclaimed Network Residue')).reduce((s, t) => s + t.amount, 0);
  const network = txns.filter(t => t.description?.startsWith('Level')).reduce((s, t) => s + t.amount, 0);
  return { pool, advisor, company, network };
}

function DealCard({ deal, onUpdate }: { deal: any; onUpdate: (d: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const { pool, advisor, company, network } = parseCommission(deal);

  return (
    <div className="rounded-2xl overflow-hidden border transition-shadow hover:shadow-lg"
      style={{ background: GOLD_CARD, borderColor: BORDER, boxShadow: `0 2px 12px rgba(180,130,30,0.07)` }}>

      {/* Gold top accent */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${GOLD_LIGHT}, ${GOLD}, #A07208)` }} />

      {/* Header */}
      <div className="flex items-center gap-4 p-5 cursor-pointer select-none" onClick={() => setExpanded(p => !p)}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, rgba(212,168,67,0.2), rgba(184,134,11,0.1))`, border: `1px solid ${BORDER}` }}>
          <Building2 className="w-5 h-5" style={{ color: GOLD }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate" style={{ color: TEXT_DARK }}>{deal.property?.title ?? '—'}</p>
          <p className="text-xs font-medium" style={{ color: TEXT_SOFT }}>{deal.property?.city ?? ''}</p>
        </div>
        <StatusBadge status={deal.status} />
        <span style={{ color: TEXT_SOFT }}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 divide-x border-t" style={{ borderColor: BORDER_MID, borderTopColor: BORDER_MID }}>
        {[
          { label: 'Sale Value',       value: fmt(deal.salePrice),       valueColor: TEXT_DARK },
          { label: 'Commission Pool',  value: fmt(pool),                  valueColor: GOLD },
          { label: 'Closed On',        value: fmtDate(deal.createdAt),   valueColor: TEXT_DARK },
        ].map(({ label, value, valueColor }) => (
          <div key={label} className="px-5 py-3" style={{ borderColor: BORDER_MID }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: TEXT_SOFT }}>{label}</p>
            <p className="text-sm font-black" style={{ color: valueColor }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Commission breakup row */}
      <div className="grid grid-cols-3 divide-x border-t border-dashed" style={{ borderColor: BORDER_MID, background: 'rgba(180,130,30,0.03)' }}>
        {[
          { label: 'Incentive to Advisor', value: advisor, color: '#92650a' },
          { label: 'Company Part',         value: company, color: TEXT_MID },
          { label: 'Network Pool',         value: network, color: '#0369a1' },
        ].map(({ label, value, color }) => (
          <div key={label} className="px-5 py-2.5" style={{ borderColor: BORDER_MID }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: TEXT_SOFT }}>{label}</p>
            <p className="text-sm font-bold" style={{ color }}>{value > 0 ? fmt(value) : '—'}</p>
          </div>
        ))}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5 pt-4 border-t space-y-3" style={{ borderColor: BORDER_MID }}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2" style={{ color: TEXT_MID }}>
              <User className="w-4 h-4 shrink-0" style={{ color: TEXT_SOFT }} />
              <span className="font-medium truncate">{deal.agent?.email ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2" style={{ color: TEXT_MID }}>
              <IndianRupee className="w-4 h-4 shrink-0" style={{ color: TEXT_SOFT }} />
              <span className="font-medium">{(deal.totalCommission * 100).toFixed(2)}% incentive rate</span>
            </div>
            {deal.reviewedAt && (
              <div className="flex items-center gap-2 col-span-2" style={{ color: TEXT_MID }}>
                <Calendar className="w-4 h-4 shrink-0" style={{ color: TEXT_SOFT }} />
                <span className="font-medium">Reviewed {fmtDate(deal.reviewedAt)}</span>
              </div>
            )}
            {deal.adminNote && (
              <div className="col-span-2 p-3 rounded-xl border"
                style={{ background: 'rgba(184,134,11,0.06)', borderColor: BORDER }}>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: TEXT_SOFT }}>Admin Note</p>
                <p className="text-sm" style={{ color: TEXT_MID }}>{deal.adminNote}</p>
              </div>
            )}
          </div>

          {deal.status === 'PENDING_VERIFICATION' && (
            <ReviewPanel deal={deal} onDone={updated => onUpdate(updated)} />
          )}

          {deal.status !== 'PENDING_VERIFICATION' && (
            <button
              onClick={e => { e.stopPropagation(); onUpdate({ ...deal, status: 'PENDING_VERIFICATION', adminNote: null, reviewedAt: null }); }}
              className="text-xs font-bold underline underline-offset-2 transition-colors"
              style={{ color: TEXT_SOFT }}
              onMouseEnter={e => (e.currentTarget.style.color = TEXT_MID)}
              onMouseLeave={e => (e.currentTarget.style.color = TEXT_SOFT)}
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
  const [deals, setDeals]   = useState<any[]>([]);
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
    ALL:                  deals.length,
    PENDING_VERIFICATION: deals.filter(d => d.status === 'PENDING_VERIFICATION').length,
    VERIFIED:             deals.filter(d => d.status === 'VERIFIED').length,
    REJECTED:             deals.filter(d => d.status === 'REJECTED').length,
  };

  const TABS: { key: typeof filter; label: string }[] = [
    { key: 'ALL',                  label: 'All' },
    { key: 'PENDING_VERIFICATION', label: 'Pending' },
    { key: 'VERIFIED',             label: 'Verified' },
    { key: 'REJECTED',             label: 'Rejected' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: TEXT_DARK }}>Deal Management</h1>
        <p className="text-sm mt-1" style={{ color: TEXT_SOFT }}>Review and verify deals submitted by agents</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-4 py-2 rounded-xl text-sm font-bold border transition-all"
              style={{
                background:   active ? `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})` : GOLD_CARD,
                color:        active ? '#fff' : TEXT_MID,
                borderColor:  active ? 'transparent' : BORDER,
                boxShadow:    active ? `0 4px 12px rgba(180,130,30,0.3)` : 'none',
              }}
            >
              {label}
              <span className="ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-black"
                style={{ background: active ? 'rgba(255,255,255,0.25)' : 'rgba(180,130,30,0.1)', color: active ? '#fff' : TEXT_SOFT }}>
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Deal list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'rgba(180,130,30,0.08)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: TEXT_SOFT }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(180,130,30,0.08)', border: `1px solid ${BORDER}` }}>
            <Building2 className="w-7 h-7" style={{ color: GOLD }} />
          </div>
          <p className="font-bold" style={{ color: TEXT_MID }}>No deals found</p>
          <p className="text-sm mt-1" style={{ color: TEXT_SOFT }}>
            {filter === 'ALL' ? 'No deals have been submitted yet.' : `No ${filter.toLowerCase().replace('_', ' ')} deals.`}
          </p>
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
