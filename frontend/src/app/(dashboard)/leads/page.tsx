"use client";
import { useState, useEffect, useCallback } from 'react';
import { leads as leadsApi, properties as propertiesApi } from '@/lib/api';
import { SkeletonLeads } from '@/components/Skeleton';
import { useNotifications } from '@/context/NotificationContext';
import { useCurrency } from '@/context/CurrencyContext';
import {
  Plus, Phone, Mail, MapPin, Building2, IndianRupee, ChevronRight,
  Edit3, Trash2, X, Check, Search, LayoutGrid, List,
  Clock, TrendingUp, UserCheck, Handshake, XCircle, RefreshCw, User,
  Calendar, Flag, Trophy,
} from 'lucide-react';

// ── Gold palette ──────────────────────────────────────────────────────────────
const GOLD        = '#C9A227';
const GOLD_LIGHT  = '#D4A843';
const GOLD_DARK   = '#A07208';
const IVORY       = '#FFFDF5';
const IVORY_BG    = '#FDF8ED';
const BORDER      = 'rgba(180,130,30,0.18)';
const BORDER_MID  = 'rgba(180,130,30,0.30)';
const TEXT_DARK   = '#1a1200';
const TEXT_MID    = '#5a4a28';
const TEXT_SOFT   = '#9a8060';

// ── Stage config ──────────────────────────────────────────────────────────────
const STAGES = [
  { key: 'NEW',              label: 'New Lead',        color: 'bg-stone-100 text-stone-600 border-stone-200',          dot: 'bg-stone-400',    icon: User },
  { key: 'CONTACTED',        label: 'Contacted',       color: 'bg-amber-50 text-amber-700 border-amber-200',           dot: 'bg-amber-400',    icon: Phone },
  { key: 'VISIT_SCHEDULED',  label: 'Visit Scheduled', color: 'bg-yellow-50 text-yellow-700 border-yellow-200',        dot: 'bg-yellow-500',   icon: Clock },
  { key: 'VISIT_DONE',       label: 'Visit Done',      color: 'bg-orange-50 text-orange-700 border-orange-200',        dot: 'bg-orange-400',   icon: UserCheck },
  { key: 'NEGOTIATING',      label: 'Negotiating',     color: 'bg-amber-100 text-amber-700 border-amber-200',          dot: 'bg-amber-400',    icon: TrendingUp },
  { key: 'DEAL_CLOSED',      label: 'Deal Closed',     color: 'bg-emerald-100 text-emerald-700 border-emerald-200',    dot: 'bg-emerald-500',  icon: Handshake },
  { key: 'LOST',             label: 'Lost',            color: 'bg-rose-100 text-rose-700 border-rose-200',             dot: 'bg-rose-400',     icon: XCircle },
] as const;

type StageKey = typeof STAGES[number]['key'];

function stageMeta(key: string) {
  return STAGES.find(s => s.key === key) || STAGES[0];
}

const LOSS_REASONS = [
  'Budget exceeded',
  'Went with competition',
  'No longer interested',
  'Project on hold',
  'Bought elsewhere',
  'Other',
];

const BLANK_FORM = {
  buyerName: '', buyerPhone: '', buyerEmail: '', budget: '',
  preferredCity: '', preferredType: '', notes: '', propertyId: '', stage: 'NEW' as StageKey,
};

// ── Shared form helpers ───────────────────────────────────────────────────────
const inputCls = "w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-all";
const inputStyle = {
  background: IVORY,
  border: `1px solid ${BORDER_MID}`,
  color: TEXT_DARK,
} as React.CSSProperties;
const inputFocusStyle = {
  borderColor: GOLD_LIGHT,
  boxShadow: `0 0 0 3px rgba(212,168,67,0.12)`,
};

function GoldInput({ className = '', style, onFocus, onBlur, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      className={inputCls + (className ? ' ' + className : '')}
      style={{ ...inputStyle, ...(focused ? inputFocusStyle : {}), ...style }}
      onFocus={e => { setFocused(true); onFocus?.(e); }}
      onBlur={e => { setFocused(false); onBlur?.(e); }}
      {...props}
    />
  );
}

function GoldSelect({ className = '', style, onFocus, onBlur, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      className={inputCls + (className ? ' ' + className : '')}
      style={{ ...inputStyle, ...(focused ? inputFocusStyle : {}), ...style }}
      onFocus={e => { setFocused(true); onFocus?.(e); }}
      onBlur={e => { setFocused(false); onBlur?.(e); }}
      {...props}
    >
      {children}
    </select>
  );
}

function GoldTextarea({ className = '', style, onFocus, onBlur, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      className={inputCls + ' resize-none' + (className ? ' ' + className : '')}
      style={{ ...inputStyle, ...(focused ? inputFocusStyle : {}), ...style }}
      onFocus={e => { setFocused(true); onFocus?.(e); }}
      onBlur={e => { setFocused(false); onBlur?.(e); }}
      {...props}
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ color: TEXT_SOFT }} className="text-[10px] font-black uppercase tracking-widest mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

const modalCardStyle: React.CSSProperties = {
  background: IVORY,
  border: `1px solid ${BORDER}`,
};
const modalDividerStyle: React.CSSProperties = {
  borderColor: BORDER,
};
const cancelBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${BORDER_MID}`,
  color: TEXT_MID,
};
const goldBtnStyle: React.CSSProperties = {
  background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD}, ${GOLD_DARK})`,
  color: '#fff',
  boxShadow: `0 4px 14px rgba(180,130,30,0.28)`,
};

// ── Lead Form Modal ───────────────────────────────────────────────────────────
function LeadModal({
  initial, properties, onSave, onClose,
}: {
  initial?: any; properties: any[];
  onSave: (data: any) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState(initial ? {
    buyerName: initial.buyerName || '',
    buyerPhone: initial.buyerPhone || '',
    buyerEmail: initial.buyerEmail || '',
    budget: initial.budget != null ? String(initial.budget) : '',
    preferredCity: initial.preferredCity || '',
    preferredType: initial.preferredType || '',
    notes: initial.notes || '',
    propertyId: initial.propertyId || '',
    stage: initial.stage || 'NEW',
  } : { ...BLANK_FORM });
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        budget: form.budget ? Number(form.budget) : undefined,
        propertyId: form.propertyId || undefined,
        buyerEmail: form.buyerEmail || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" style={modalCardStyle}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={modalDividerStyle}>
          <h2 className="font-black text-lg" style={{ color: TEXT_DARK }}>{initial ? 'Edit Lead' : 'Add New Lead'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl transition-all hover:bg-amber-50" style={{ color: TEXT_SOFT }}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Buyer Name *">
              <GoldInput required placeholder="Rahul Sharma" value={form.buyerName} onChange={set('buyerName')} />
            </Field>
            <Field label="Phone *">
              <GoldInput required placeholder="+91 98765 43210" value={form.buyerPhone} onChange={set('buyerPhone')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email">
              <GoldInput type="email" placeholder="email@example.com" value={form.buyerEmail} onChange={set('buyerEmail')} />
            </Field>
            <Field label="Budget (₹)">
              <GoldInput type="number" placeholder="5000000" value={form.budget} onChange={set('budget')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Preferred City">
              <GoldInput placeholder="Bangalore" value={form.preferredCity} onChange={set('preferredCity')} />
            </Field>
            <Field label="Preferred Type">
              <GoldSelect value={form.preferredType} onChange={set('preferredType')}>
                <option value="">Any</option>
                {['APARTMENT', 'VILLA', 'PLOT', 'COMMERCIAL'].map(t => (
                  <option key={t} value={t}>{t[0] + t.slice(1).toLowerCase()}</option>
                ))}
              </GoldSelect>
            </Field>
          </div>
          <Field label="Primary Interested Property">
            <GoldSelect value={form.propertyId} onChange={set('propertyId')}>
              <option value="">None selected</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.title} — {p.city}</option>
              ))}
            </GoldSelect>
          </Field>
          {initial && (
            <Field label="Stage">
              <GoldSelect value={form.stage} onChange={set('stage')}>
                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </GoldSelect>
            </Field>
          )}
          <Field label="Notes">
            <GoldTextarea
              rows={3}
              placeholder="Budget preference, timeline, requirements..."
              value={form.notes} onChange={set('notes')}
            />
          </Field>
        </form>
        <div className="px-6 py-4 border-t flex gap-3" style={modalDividerStyle}>
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:bg-amber-50"
            style={cancelBtnStyle}>
            Cancel
          </button>
          <button
            onClick={e => { e.preventDefault(); handleSubmit(e as any); }}
            disabled={saving}
            className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            style={goldBtnStyle}>
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            {initial ? 'Save Changes' : 'Add Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Visit Scheduling Modal ────────────────────────────────────────────────────
function VisitModal({
  lead, properties, onSchedule, onClose,
}: {
  lead: any; properties: any[];
  onSchedule: (data: any) => Promise<void>; onClose: () => void;
}) {
  const interestedIds = (lead.interestedProperties || []).map((ip: any) => ip.propertyId);
  const interestedProps = properties.filter(p => interestedIds.includes(p.id));
  const otherProps = properties.filter(p => !interestedIds.includes(p.id));

  const defaultProp = lead.propertyId || (interestedProps[0]?.id) || (properties[0]?.id) || '';

  const [form, setForm] = useState({
    propertyId: defaultProp,
    clientName: lead.buyerName,
    clientPhone: lead.buyerPhone,
    scheduledAt: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.propertyId || !form.scheduledAt) return;
    setSaving(true);
    try {
      await onSchedule({
        propertyId: form.propertyId,
        clientName: form.clientName,
        clientPhone: form.clientPhone,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" style={modalCardStyle}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={modalDividerStyle}>
          <div>
            <h2 className="font-black text-lg" style={{ color: TEXT_DARK }}>Schedule Site Visit</h2>
            <p className="text-xs font-medium mt-0.5" style={{ color: TEXT_SOFT }}>for <span className="font-bold" style={{ color: TEXT_MID }}>{lead.buyerName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-amber-50 transition-all" style={{ color: TEXT_SOFT }}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <Field label="Property *">
            <GoldSelect required value={form.propertyId} onChange={set('propertyId')}>
              <option value="">Select property...</option>
              {interestedProps.length > 0 && (
                <optgroup label="⭐ Interested Properties">
                  {interestedProps.map(p => (
                    <option key={p.id} value={p.id}>{p.title} — {p.city}</option>
                  ))}
                </optgroup>
              )}
              {otherProps.length > 0 && (
                <optgroup label="All Properties">
                  {otherProps.map(p => (
                    <option key={p.id} value={p.id}>{p.title} — {p.city}</option>
                  ))}
                </optgroup>
              )}
            </GoldSelect>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Client Name *">
              <GoldInput required value={form.clientName} onChange={set('clientName')} />
            </Field>
            <Field label="Client Phone *">
              <GoldInput required value={form.clientPhone} onChange={set('clientPhone')} />
            </Field>
          </div>
          <Field label="Date & Time *">
            <GoldInput
              required type="datetime-local"
              value={form.scheduledAt} onChange={set('scheduledAt')}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
            />
          </Field>
          <div className="rounded-xl p-3 text-xs font-semibold" style={{ background: 'rgba(212,168,67,0.08)', border: `1px solid ${BORDER}`, color: TEXT_MID }}>
            The visit request will be sent to the property company for approval. Stage will auto-advance to <strong>Visit Scheduled</strong>.
          </div>
        </form>
        <div className="px-6 py-4 border-t flex gap-3" style={modalDividerStyle}>
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:bg-amber-50"
            style={cancelBtnStyle}>
            Cancel
          </button>
          <button
            onClick={e => { e.preventDefault(); handleSubmit(e as any); }}
            disabled={saving || !form.propertyId || !form.scheduledAt}
            className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            style={goldBtnStyle}>
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Calendar className="w-4 h-4" />}
            Schedule Visit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Close Opportunity Modal ───────────────────────────────────────────────────
function CloseModal({
  lead, onClose, onCancel,
}: {
  lead: any;
  onClose: (data: { outcome: 'WON' | 'LOST'; closedReason?: string; closedPrice?: number }) => Promise<void>;
  onCancel: () => void;
}) {
  const [outcome, setOutcome] = useState<'WON' | 'LOST'>('WON');
  const [closedPrice, setClosedPrice] = useState('');
  const [closedReason, setClosedReason] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (outcome === 'LOST' && !closedReason) return;
    setSaving(true);
    try {
      await onClose({
        outcome,
        closedPrice: closedPrice ? Number(closedPrice) : undefined,
        closedReason: outcome === 'LOST'
          ? closedReason + (notes ? ` — ${notes}` : '')
          : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" style={modalCardStyle}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={modalDividerStyle}>
          <div>
            <h2 className="font-black text-lg" style={{ color: TEXT_DARK }}>Close Opportunity</h2>
            <p className="text-xs font-medium mt-0.5" style={{ color: TEXT_SOFT }}>{lead.buyerName}</p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-amber-50 transition-all" style={{ color: TEXT_SOFT }}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Outcome selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setOutcome('WON')}
              className={`p-4 rounded-2xl border-2 text-center transition-all ${outcome === 'WON' ? 'border-emerald-500 bg-emerald-50' : 'border-amber-100 hover:border-amber-200'}`}
            >
              <div className="text-2xl mb-1">🎉</div>
              <p className={`font-black text-sm ${outcome === 'WON' ? 'text-emerald-700' : ''}`} style={outcome !== 'WON' ? { color: TEXT_MID } : {}}>Deal Won</p>
              <p className={`text-[10px] font-medium mt-0.5 ${outcome === 'WON' ? 'text-emerald-500' : ''}`} style={outcome !== 'WON' ? { color: TEXT_SOFT } : {}}>Lead converted</p>
            </button>
            <button
              onClick={() => setOutcome('LOST')}
              className={`p-4 rounded-2xl border-2 text-center transition-all ${outcome === 'LOST' ? 'border-rose-500 bg-rose-50' : 'border-amber-100 hover:border-amber-200'}`}
            >
              <div className="text-2xl mb-1">😞</div>
              <p className={`font-black text-sm ${outcome === 'LOST' ? 'text-rose-700' : ''}`} style={outcome !== 'LOST' ? { color: TEXT_MID } : {}}>Lost Lead</p>
              <p className={`text-[10px] font-medium mt-0.5 ${outcome === 'LOST' ? 'text-rose-500' : ''}`} style={outcome !== 'LOST' ? { color: TEXT_SOFT } : {}}>Not converted</p>
            </button>
          </div>

          {outcome === 'WON' && (
            <Field label="Final Sale Price (₹) — Optional">
              <GoldInput
                type="number"
                placeholder="e.g. 7500000"
                value={closedPrice}
                onChange={e => setClosedPrice(e.target.value)}
              />
            </Field>
          )}

          {outcome === 'LOST' && (
            <>
              <Field label="Loss Reason *">
                <GoldSelect value={closedReason} onChange={e => setClosedReason(e.target.value)}>
                  <option value="">Select reason...</option>
                  {LOSS_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </GoldSelect>
              </Field>
              <Field label="Additional Notes">
                <GoldTextarea
                  rows={2}
                  placeholder="Any context for future reference..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </Field>
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t flex gap-3" style={modalDividerStyle}>
          <button type="button" onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:bg-amber-50"
            style={cancelBtnStyle}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || (outcome === 'LOST' && !closedReason)}
            className={`flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg transition-all ${
              outcome === 'WON'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
            }`}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : outcome === 'WON' ? (
              <Trophy className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {outcome === 'WON' ? 'Mark as Won' : 'Mark as Lost'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Property Tagger Dropdown ──────────────────────────────────────────────────
function PropertyTagger({
  properties, taggedIds, onTag, onUntag,
}: {
  properties: any[];
  taggedIds: string[];
  onTag: (propertyId: string) => void;
  onUntag: (propertyId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const unique = properties.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
  const filtered = unique.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.city || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black border border-dashed transition-all hover:bg-amber-50"
        style={{ borderColor: GOLD, color: GOLD }}
      >
        <Plus className="w-3 h-3" /> Tag
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => { setOpen(false); setSearch(''); }} />
          <div className="absolute top-full left-0 mt-1 z-30 rounded-2xl shadow-xl overflow-hidden w-64" style={{ background: IVORY, border: `1px solid ${BORDER_MID}` }}>
            <div className="p-2 border-b" style={{ borderColor: BORDER }}>
              <input
                autoFocus
                value={search}
                onChange={e => { e.stopPropagation(); setSearch(e.target.value); }}
                onClick={e => e.stopPropagation()}
                placeholder="Search properties..."
                className="w-full text-xs px-3 py-2 rounded-xl focus:outline-none transition-all"
                style={{ background: IVORY_BG, border: `1px solid ${BORDER}`, color: TEXT_DARK }}
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="text-xs p-3 text-center" style={{ color: TEXT_SOFT }}>No properties found</p>
              )}
              {filtered.map(p => {
                const isTagged = taggedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={e => { e.stopPropagation(); isTagged ? onUntag(p.id) : onTag(p.id); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors"
                    style={{ background: isTagged ? 'rgba(212,168,67,0.08)' : 'transparent' }}
                    onMouseEnter={e => { if (!isTagged) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,168,67,0.05)'; }}
                    onMouseLeave={e => { if (!isTagged) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <div className="w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
                      style={isTagged
                        ? { background: GOLD, borderColor: GOLD }
                        : { background: 'transparent', borderColor: BORDER_MID }}>
                      {isTagged && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: TEXT_DARK }}>{p.title}</p>
                      <p className="text-[10px]" style={{ color: TEXT_SOFT }}>{p.city}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Stage Move Dropdown ───────────────────────────────────────────────────────
function StageDropdown({ lead, onChange }: { lead: any; onChange: (stage: StageKey) => void }) {
  const [open, setOpen] = useState(false);
  const meta = stageMeta(lead.stage);

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${meta.color} hover:shadow-sm transition-all`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
        {meta.label}
        <ChevronRight className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 rounded-2xl shadow-xl overflow-hidden min-w-[180px]" style={{ background: IVORY, border: `1px solid ${BORDER_MID}` }}>
            {STAGES.map(s => (
              <button
                key={s.key}
                onClick={e => { e.stopPropagation(); onChange(s.key); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold transition-colors text-left`}
                style={s.key === lead.stage
                  ? { background: 'rgba(212,168,67,0.12)', color: GOLD }
                  : { color: TEXT_MID }}
                onMouseEnter={e => { if (s.key !== lead.stage) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,168,67,0.06)'; }}
                onMouseLeave={e => { if (s.key !== lead.stage) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <span className={`w-2 h-2 rounded-full ${s.dot} shrink-0`} />
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Lead Card ─────────────────────────────────────────────────────────────────
function LeadCard({
  lead, properties, onEdit, onDelete, onStageChange,
  onTagProperty, onUntagProperty, onScheduleVisit, onCloseOpportunity,
}: {
  lead: any; properties: any[];
  onEdit: () => void; onDelete: () => void;
  onStageChange: (s: StageKey) => void;
  onTagProperty: (propertyId: string) => void;
  onUntagProperty: (propertyId: string) => void;
  onScheduleVisit: () => void;
  onCloseOpportunity: () => void;
}) {
  const { formatCurrency } = useCurrency();
  const taggedIds = (lead.interestedProperties || []).map((ip: any) => ip.propertyId);
  const isTerminal = lead.stage === 'DEAL_CLOSED' || lead.stage === 'LOST';

  const showPrimary = lead.property && !taggedIds.includes(lead.propertyId);
  const nextVisit = (lead.leadVisits || []).find(
    (v: any) => v.status === 'PENDING' || v.status === 'APPROVED'
  );

  const avatarStyle: React.CSSProperties = lead.stage === 'DEAL_CLOSED'
    ? { background: 'rgba(16,185,129,0.12)', color: '#065f46' }
    : lead.stage === 'LOST'
    ? { background: 'rgba(244,63,94,0.10)', color: '#be123c' }
    : { background: `rgba(212,168,67,0.14)`, color: GOLD_DARK };

  return (
    <div className="rounded-2xl p-4 shadow-sm transition-all group"
      style={{ background: IVORY, border: `1px solid ${BORDER}` }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = BORDER_MID; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px rgba(180,130,30,0.12)`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = BORDER; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0" style={avatarStyle}>
            {lead.buyerName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-black text-sm truncate" style={{ color: TEXT_DARK }}>{lead.buyerName}</p>
            <a href={`tel:${lead.buyerPhone}`} onClick={e => e.stopPropagation()}
              className="text-xs font-semibold flex items-center gap-1 transition-colors"
              style={{ color: TEXT_SOFT }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = GOLD; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = TEXT_SOFT; }}>
              <Phone className="w-3 h-3" /> {lead.buyerPhone}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-lg transition-all hover:bg-amber-50" style={{ color: TEXT_SOFT }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = GOLD; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = TEXT_SOFT; }}>
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-rose-50 text-neutral-400 hover:text-rose-500 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <StageDropdown lead={lead} onChange={onStageChange} />

      {/* Budget / Location */}
      <div className="mt-3 space-y-1.5">
        {lead.budget > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold flex-wrap" style={{ color: TEXT_SOFT }}>
            <IndianRupee className="w-3 h-3 text-emerald-500 shrink-0" />
            <span>Budget: <span className="font-black" style={{ color: TEXT_DARK }}>{formatCurrency(lead.budget)}</span></span>
            {lead.closedPrice && (
              <span className="text-emerald-600 font-black">→ Closed @ {formatCurrency(lead.closedPrice)}</span>
            )}
          </div>
        )}
        {(lead.preferredCity || lead.preferredType) && (
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: TEXT_SOFT }}>
            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
            {[lead.preferredCity, lead.preferredType && lead.preferredType.charAt(0) + lead.preferredType.slice(1).toLowerCase()].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>

      {/* Interested Properties */}
      <div className="mt-3">
        <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: TEXT_SOFT }}>Interested In</p>
        <div className="flex flex-wrap gap-1.5 items-center">
          {showPrimary && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border"
              style={{ background: 'rgba(212,168,67,0.10)', color: GOLD_DARK, borderColor: BORDER }}>
              <Building2 className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate max-w-[100px]">{lead.property.title}</span>
            </span>
          )}
          {(lead.interestedProperties || []).filter((ip: any, idx: number, arr: any[]) => arr.findIndex((x: any) => x.propertyId === ip.propertyId) === idx).map((ip: any) => (
            <span key={ip.id} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border"
              style={{ background: 'rgba(212,168,67,0.10)', color: GOLD_DARK, borderColor: BORDER }}>
              <Building2 className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate max-w-[100px]">{ip.property?.title || 'Property'}</span>
              {!isTerminal && (
                <button
                  onClick={e => { e.stopPropagation(); onUntagProperty(ip.propertyId); }}
                  className="ml-0.5 transition-colors hover:text-rose-500"
                  style={{ color: 'rgba(180,130,30,0.5)' }}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </span>
          ))}
          {taggedIds.length === 0 && !showPrimary && (
            <span className="text-[10px] font-semibold" style={{ color: 'rgba(180,130,30,0.35)' }}>None tagged yet</span>
          )}
          {!isTerminal && (
            <PropertyTagger
              properties={properties}
              taggedIds={[...taggedIds, ...(lead.propertyId ? [lead.propertyId] : [])]}
              onTag={onTagProperty}
              onUntag={onUntagProperty}
            />
          )}
        </div>
      </div>

      {/* Upcoming visit indicator */}
      {nextVisit && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold rounded-lg px-2.5 py-1.5 border"
          style={{ color: GOLD_DARK, background: 'rgba(212,168,67,0.08)', borderColor: BORDER }}>
          <Calendar className="w-3 h-3 shrink-0" />
          Visit {nextVisit.status === 'APPROVED' ? 'confirmed' : 'pending approval'} ·{' '}
          {new Date(nextVisit.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
          {new Date(nextVisit.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          {nextVisit.property && <span className="ml-1 opacity-60">· {nextVisit.property.title}</span>}
        </div>
      )}

      {/* Notes */}
      {lead.notes && (
        <p className="text-xs font-medium line-clamp-2 mt-2 italic" style={{ color: TEXT_SOFT }}>"{lead.notes}"</p>
      )}

      {/* Loss reason */}
      {lead.stage === 'LOST' && lead.closedReason && (
        <div className="mt-2 text-[10px] font-bold text-rose-500 bg-rose-50 rounded-lg px-2.5 py-1.5 border border-rose-100">
          Lost: {lead.closedReason}
        </div>
      )}

      {/* Action buttons */}
      {!isTerminal && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={e => { e.stopPropagation(); onScheduleVisit(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all border hover:bg-amber-50"
            style={{ borderColor: BORDER_MID, color: GOLD_DARK }}
          >
            <Calendar className="w-3 h-3" /> Schedule Visit
          </button>
          <button
            onClick={e => { e.stopPropagation(); onCloseOpportunity(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all border hover:bg-stone-50"
            style={{ borderColor: BORDER, color: TEXT_MID }}
          >
            <Flag className="w-3 h-3" /> Close Lead
          </button>
        </div>
      )}

      {/* Won badge */}
      {lead.stage === 'DEAL_CLOSED' && (
        <div className="mt-3 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black">
          <Trophy className="w-3 h-3" /> Deal Won!
          {lead.closedPrice ? ` · ${formatCurrency(lead.closedPrice)}` : ''}
        </div>
      )}

      <p className="text-[9px] font-bold mt-3 uppercase tracking-widest" style={{ color: 'rgba(180,130,30,0.35)' }}>
        Added {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState<StageKey | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [schedulingFor, setSchedulingFor] = useState<any | null>(null);
  const [closingFor, setClosingFor] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsData, propsData] = await Promise.all([leadsApi.list(), propertiesApi.list()]);
      setAllLeads(leadsData);
      setAvailableProperties(propsData);
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Load Failed', message: err?.message, category: 'system' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = allLeads.filter(l => {
    if (filterStage !== 'ALL' && l.stage !== filterStage) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.buyerName.toLowerCase().includes(q) ||
        l.buyerPhone.includes(q) ||
        (l.buyerEmail || '').toLowerCase().includes(q) ||
        (l.preferredCity || '').toLowerCase().includes(q) ||
        (l.property?.title || '').toLowerCase().includes(q) ||
        (l.interestedProperties || []).some((ip: any) => ip.property?.title?.toLowerCase().includes(q));
    }
    return true;
  });

  const handleSave = async (data: any) => {
    try {
      if (editing) {
        await leadsApi.update(editing.id, data);
        addNotification({ type: 'success', title: 'Lead Updated', message: `${data.buyerName} updated.`, category: 'system' });
      } else {
        await leadsApi.create(data);
        addNotification({ type: 'success', title: 'Lead Added', message: `${data.buyerName} added to pipeline.`, category: 'system' });
      }
      setShowModal(false);
      setEditing(null);
      await load();
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Failed', message: err?.message, category: 'system' });
      throw err;
    }
  };

  const handleDelete = async (lead: any) => {
    if (!confirm(`Remove ${lead.buyerName} from your leads?`)) return;
    try {
      await leadsApi.remove(lead.id);
      setAllLeads(prev => prev.filter(l => l.id !== lead.id));
      addNotification({ type: 'info', title: 'Lead Removed', message: `${lead.buyerName} removed.`, category: 'system' });
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Failed', message: err?.message, category: 'system' });
    }
  };

  const handleStageChange = async (lead: any, stage: StageKey) => {
    try {
      await leadsApi.update(lead.id, { stage });
      setAllLeads(prev => prev.map(l => l.id === lead.id ? { ...l, stage } : l));
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Update Failed', message: err?.message, category: 'system' });
    }
  };

  const handleTagProperty = async (lead: any, propertyId: string) => {
    try {
      const tagged = await leadsApi.tagProperty(lead.id, propertyId);
      setAllLeads(prev => prev.map(l => l.id === lead.id
        ? { ...l, interestedProperties: [...(l.interestedProperties || []), tagged] }
        : l));
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Failed', message: err?.message, category: 'system' });
    }
  };

  const handleUntagProperty = async (lead: any, propertyId: string) => {
    setAllLeads(prev => prev.map(l => l.id === lead.id
      ? { ...l, interestedProperties: (l.interestedProperties || []).filter((ip: any) => ip.propertyId !== propertyId) }
      : l));
    try {
      await leadsApi.untagProperty(lead.id, propertyId);
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Failed', message: err?.message, category: 'system' });
      await load();
    }
  };

  const handleScheduleVisit = async (lead: any, data: any) => {
    try {
      await leadsApi.scheduleVisit(lead.id, data);
      setSchedulingFor(null);
      if (lead.stage === 'NEW' || lead.stage === 'CONTACTED') {
        setAllLeads(prev => prev.map(l => l.id === lead.id ? { ...l, stage: 'VISIT_SCHEDULED' } : l));
      }
      await load();
      addNotification({ type: 'success', title: 'Visit Scheduled', message: `Visit for ${lead.buyerName} submitted for approval.`, category: 'system' });
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Failed', message: err?.message, category: 'system' });
      throw err;
    }
  };

  const handleCloseOpportunity = async (
    lead: any,
    data: { outcome: 'WON' | 'LOST'; closedReason?: string; closedPrice?: number }
  ) => {
    const stage = data.outcome === 'WON' ? 'DEAL_CLOSED' : 'LOST';
    try {
      await leadsApi.update(lead.id, {
        stage,
        closedReason: data.closedReason,
        closedPrice: data.closedPrice,
      });
      setClosingFor(null);
      setAllLeads(prev => prev.map(l => l.id === lead.id
        ? { ...l, stage, closedReason: data.closedReason, closedPrice: data.closedPrice }
        : l));
      addNotification({
        type: 'success',
        title: data.outcome === 'WON' ? '🎉 Deal Won!' : 'Lead Closed',
        message: `${lead.buyerName} marked as ${stage === 'DEAL_CLOSED' ? 'deal closed' : 'lost'}.`,
        category: 'system',
      });
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Failed', message: err?.message, category: 'system' });
      throw err;
    }
  };

  const stats = STAGES.map(s => ({ ...s, count: allLeads.filter(l => l.stage === s.key).length }));

  if (loading) return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <SkeletonLeads />
    </div>
  );

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto min-h-screen" style={{ color: TEXT_DARK }}>

      {/* Modals */}
      {(showModal || editing) && (
        <LeadModal
          initial={editing}
          properties={availableProperties}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
      {schedulingFor && (
        <VisitModal
          lead={schedulingFor}
          properties={availableProperties}
          onSchedule={data => handleScheduleVisit(schedulingFor, data)}
          onClose={() => setSchedulingFor(null)}
        />
      )}
      {closingFor && (
        <CloseModal
          lead={closingFor}
          onClose={data => handleCloseOpportunity(closingFor, data)}
          onCancel={() => setClosingFor(null)}
        />
      )}

      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border"
            style={{ background: 'rgba(212,168,67,0.08)', borderColor: BORDER }}>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>Lead Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-1">
            My <span style={{ color: GOLD }}>Pipeline</span>
          </h1>
          <p className="font-medium" style={{ color: TEXT_SOFT }}>
            {allLeads.length} leads · {allLeads.filter(l => l.stage === 'DEAL_CLOSED').length} won · {allLeads.filter(l => l.stage === 'LOST').length} lost
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={load}
            className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm hover:bg-amber-50"
            style={{ border: `1px solid ${BORDER_MID}`, background: IVORY, color: TEXT_MID }}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all"
            style={goldBtnStyle}>
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </header>

      {/* Stage Summary Strip */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-7">
        {stats.map(s => (
          <button key={s.key}
            onClick={() => setFilterStage(prev => prev === s.key ? 'ALL' : s.key)}
            className={`rounded-2xl p-3 text-center border transition-all ${filterStage === s.key ? s.color + ' shadow-sm' : 'hover:border-amber-200'}`}
            style={filterStage !== s.key ? { background: IVORY, borderColor: BORDER } : {}}
          >
            <p className={`text-xl font-black ${filterStage === s.key ? '' : ''}`} style={filterStage !== s.key ? { color: TEXT_DARK } : {}}>{s.count}</p>
            <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5`} style={filterStage !== s.key ? { color: TEXT_SOFT } : {}}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: TEXT_SOFT }} />
          <GoldInput
            type="text" placeholder="Search by name, phone, city, property..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>
        <div className="flex rounded-xl overflow-hidden shadow-sm border" style={{ background: IVORY, borderColor: BORDER }}>
          <button onClick={() => setViewMode('board')}
            className="px-3 py-2.5 transition-all"
            style={viewMode === 'board' ? goldBtnStyle : { color: TEXT_SOFT, background: 'transparent' }}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')}
            className="px-3 py-2.5 transition-all"
            style={viewMode === 'list' ? goldBtnStyle : { color: TEXT_SOFT, background: 'transparent' }}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-3xl p-16 text-center border border-dashed"
          style={{ background: IVORY, borderColor: BORDER_MID }}>
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-xl font-black mb-2" style={{ color: TEXT_DARK }}>
            {allLeads.length === 0 ? 'No leads yet' : 'No leads match your filter'}
          </h3>
          <p className="font-medium mb-6" style={{ color: TEXT_SOFT }}>
            {allLeads.length === 0 ? 'Add your first lead to start tracking your pipeline.' : 'Try a different stage filter or clear the search.'}
          </p>
          {allLeads.length === 0 && (
            <button onClick={() => setShowModal(true)}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-all inline-flex items-center gap-2"
              style={goldBtnStyle}>
              <Plus className="w-4 h-4" /> Add First Lead
            </button>
          )}
        </div>
      )}

      {/* Board View */}
      {viewMode === 'board' && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {(filterStage === 'ALL' ? STAGES : STAGES.filter(s => s.key === filterStage)).map(stage => {
            const stageLeads = filtered.filter(l => l.stage === stage.key);
            if (filterStage === 'ALL' && stageLeads.length === 0) return null;
            return (
              <div key={stage.key}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.dot}`} />
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: TEXT_SOFT }}>{stage.label}</span>
                  <span className="ml-auto text-xs font-black" style={{ color: TEXT_SOFT }}>{stageLeads.length}</span>
                </div>
                <div className="space-y-3">
                  {stageLeads.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      properties={availableProperties}
                      onEdit={() => setEditing(lead)}
                      onDelete={() => handleDelete(lead)}
                      onStageChange={s => handleStageChange(lead, s)}
                      onTagProperty={propertyId => handleTagProperty(lead, propertyId)}
                      onUntagProperty={propertyId => handleUntagProperty(lead, propertyId)}
                      onScheduleVisit={() => setSchedulingFor(lead)}
                      onCloseOpportunity={() => setClosingFor(lead)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && filtered.length > 0 && (
        <div className="rounded-2xl overflow-hidden shadow-sm overflow-x-auto border" style={{ background: IVORY, borderColor: BORDER }}>
          <table className="w-full text-sm min-w-[700px]">
            <thead className="border-b" style={{ borderColor: BORDER }}>
              <tr>
                {['Buyer', 'Contact', 'Budget', 'Interested In', 'Stage', 'Visit', 'Added', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap" style={{ color: TEXT_SOFT }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => {
                const meta = stageMeta(lead.stage);
                const allInterested = [
                  ...(lead.property && !(lead.interestedProperties || []).find((ip: any) => ip.propertyId === lead.propertyId) ? [lead.property] : []),
                  ...(lead.interestedProperties || []).map((ip: any) => ip.property).filter(Boolean),
                ];
                const nextVisit = (lead.leadVisits || []).find((v: any) => v.status === 'PENDING' || v.status === 'APPROVED');
                const isTerminal = lead.stage === 'DEAL_CLOSED' || lead.stage === 'LOST';
                const rowAvatarStyle: React.CSSProperties = lead.stage === 'DEAL_CLOSED'
                  ? { background: 'rgba(16,185,129,0.12)', color: '#065f46' }
                  : lead.stage === 'LOST'
                  ? { background: 'rgba(244,63,94,0.10)', color: '#be123c' }
                  : { background: `rgba(212,168,67,0.14)`, color: GOLD_DARK };
                return (
                  <tr key={lead.id} className="border-b last:border-0 transition-colors group"
                    style={{ borderColor: BORDER }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(212,168,67,0.04)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0" style={rowAvatarStyle}>
                          {lead.buyerName.charAt(0)}
                        </div>
                        <span className="font-black text-sm" style={{ color: TEXT_DARK }}>{lead.buyerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <a href={`tel:${lead.buyerPhone}`} className="text-xs font-semibold flex items-center gap-1 transition-colors"
                          style={{ color: TEXT_MID }}
                          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = GOLD; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = TEXT_MID; }}>
                          <Phone className="w-3 h-3" /> {lead.buyerPhone}
                        </a>
                        {lead.buyerEmail && (
                          <a href={`mailto:${lead.buyerEmail}`} className="text-xs font-semibold flex items-center gap-1 transition-colors"
                            style={{ color: TEXT_SOFT }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = GOLD; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = TEXT_SOFT; }}>
                            <Mail className="w-3 h-3" /> {lead.buyerEmail}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-black text-xs whitespace-nowrap" style={{ color: TEXT_DARK }}>
                      {lead.budget ? `₹${(lead.budget / 100000).toFixed(1)}L` : '—'}
                      {lead.closedPrice ? <span className="block text-emerald-600 text-[10px]">Won: ₹{(lead.closedPrice / 100000).toFixed(1)}L</span> : null}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        {allInterested.slice(0, 2).map((p: any) => (
                          <span key={p.id} className="text-[10px] font-bold truncate max-w-[130px] flex items-center gap-1" style={{ color: GOLD_DARK }}>
                            <Building2 className="w-2.5 h-2.5 shrink-0" /> {p.title}
                          </span>
                        ))}
                        {allInterested.length === 0 && (
                          <span className="text-xs font-semibold" style={{ color: TEXT_SOFT }}>
                            {[lead.preferredCity, lead.preferredType].filter(Boolean).join(' · ') || '—'}
                          </span>
                        )}
                        {allInterested.length > 2 && (
                          <span className="text-[10px] font-semibold" style={{ color: TEXT_SOFT }}>+{allInterested.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StageDropdown lead={lead} onChange={s => handleStageChange(lead, s)} />
                    </td>
                    <td className="px-4 py-3.5">
                      {nextVisit ? (
                        <div className="text-[10px] font-bold flex items-center gap-1" style={{ color: GOLD_DARK }}>
                          <Calendar className="w-3 h-3" />
                          {new Date(nextVisit.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          <span className={`ml-1 px-1.5 py-0.5 rounded-md ${nextVisit.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {nextVisit.status === 'APPROVED' ? '✓' : '⏳'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px]" style={{ color: TEXT_SOFT }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold whitespace-nowrap" style={{ color: TEXT_SOFT }}>
                      {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isTerminal && (
                          <>
                            <button onClick={() => setSchedulingFor(lead)} title="Schedule Visit"
                              className="p-1.5 rounded-lg transition-all hover:bg-amber-50"
                              style={{ color: TEXT_SOFT }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = GOLD; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = TEXT_SOFT; }}>
                              <Calendar className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setClosingFor(lead)} title="Close Lead"
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-neutral-400 hover:text-emerald-600 transition-all">
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button onClick={() => setEditing(lead)}
                          className="p-1.5 rounded-lg transition-all hover:bg-amber-50"
                          style={{ color: TEXT_SOFT }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = GOLD; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = TEXT_SOFT; }}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(lead)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-neutral-400 hover:text-rose-500 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
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
  );
}
