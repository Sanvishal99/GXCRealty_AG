"use client";
import { useState, useEffect, useCallback } from 'react';
import { leads as leadsApi, properties as propertiesApi } from '@/lib/api';
import { useNotifications } from '@/context/NotificationContext';
import { useCurrency } from '@/context/CurrencyContext';
import {
  Plus, Phone, Mail, MapPin, Building2, IndianRupee, ChevronRight,
  Edit3, Trash2, X, Check, Search, LayoutGrid, List,
  Clock, TrendingUp, UserCheck, Handshake, XCircle, RefreshCw, User,
  Calendar, Flag, Trophy,
} from 'lucide-react';

// ── Stage config ──────────────────────────────────────────────────────────────
const STAGES = [
  { key: 'NEW',              label: 'New Lead',        color: 'bg-slate-100 text-slate-700 border-slate-200',    dot: 'bg-slate-400',    icon: User },
  { key: 'CONTACTED',        label: 'Contacted',       color: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-400',     icon: Phone },
  { key: 'VISIT_SCHEDULED',  label: 'Visit Scheduled', color: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-400',   icon: Clock },
  { key: 'VISIT_DONE',       label: 'Visit Done',      color: 'bg-indigo-100 text-indigo-700 border-indigo-200', dot: 'bg-indigo-400',   icon: UserCheck },
  { key: 'NEGOTIATING',      label: 'Negotiating',     color: 'bg-amber-100 text-amber-700 border-amber-200',    dot: 'bg-amber-400',    icon: TrendingUp },
  { key: 'DEAL_CLOSED',      label: 'Deal Closed',     color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: Handshake },
  { key: 'LOST',             label: 'Lost',            color: 'bg-rose-100 text-rose-700 border-rose-200',       dot: 'bg-rose-400',     icon: XCircle },
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

// ── Shared form helpers (must be outside any component to avoid remount) ─────
const inputCls = "w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-neutral-50 transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <h2 className="font-black text-neutral-900 text-lg">{initial ? 'Edit Lead' : 'Add New Lead'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-400 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Buyer Name *">
              <input required className={inputCls} placeholder="Rahul Sharma" value={form.buyerName} onChange={set('buyerName')} />
            </Field>
            <Field label="Phone *">
              <input required className={inputCls} placeholder="+91 98765 43210" value={form.buyerPhone} onChange={set('buyerPhone')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email">
              <input type="email" className={inputCls} placeholder="email@example.com" value={form.buyerEmail} onChange={set('buyerEmail')} />
            </Field>
            <Field label="Budget (₹)">
              <input type="number" className={inputCls} placeholder="5000000" value={form.budget} onChange={set('budget')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Preferred City">
              <input className={inputCls} placeholder="Bangalore" value={form.preferredCity} onChange={set('preferredCity')} />
            </Field>
            <Field label="Preferred Type">
              <select className={inputCls} value={form.preferredType} onChange={set('preferredType')}>
                <option value="">Any</option>
                {['APARTMENT', 'VILLA', 'PLOT', 'COMMERCIAL'].map(t => (
                  <option key={t} value={t}>{t[0] + t.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Primary Interested Property">
            <select className={inputCls} value={form.propertyId} onChange={set('propertyId')}>
              <option value="">None selected</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.title} — {p.city}</option>
              ))}
            </select>
          </Field>
          {initial && (
            <Field label="Stage">
              <select className={inputCls} value={form.stage} onChange={set('stage')}>
                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </Field>
          )}
          <Field label="Notes">
            <textarea
              rows={3} className={inputCls + ' resize-none'}
              placeholder="Budget preference, timeline, requirements..."
              value={form.notes} onChange={set('notes')}
            />
          </Field>
        </form>
        <div className="px-6 py-4 border-t border-neutral-100 flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-700 font-bold text-sm hover:bg-neutral-50 transition-all">
            Cancel
          </button>
          <button
            onClick={e => { e.preventDefault(); handleSubmit(e as any); }}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <div>
            <h2 className="font-black text-neutral-900 text-lg">Schedule Site Visit</h2>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">for <span className="font-bold text-neutral-700">{lead.buyerName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-400 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <Field label="Property *">
            <select required className={inputCls} value={form.propertyId} onChange={set('propertyId')}>
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
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Client Name *">
              <input required className={inputCls} value={form.clientName} onChange={set('clientName')} />
            </Field>
            <Field label="Client Phone *">
              <input required className={inputCls} value={form.clientPhone} onChange={set('clientPhone')} />
            </Field>
          </div>
          <Field label="Date & Time *">
            <input
              required type="datetime-local" className={inputCls}
              value={form.scheduledAt} onChange={set('scheduledAt')}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
            />
          </Field>
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-xs text-violet-700 font-semibold">
            The visit request will be sent to the property company for approval. Stage will auto-advance to <strong>Visit Scheduled</strong>.
          </div>
        </form>
        <div className="px-6 py-4 border-t border-neutral-100 flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-700 font-bold text-sm hover:bg-neutral-50 transition-all">
            Cancel
          </button>
          <button
            onClick={e => { e.preventDefault(); handleSubmit(e as any); }}
            disabled={saving || !form.propertyId || !form.scheduledAt}
            className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20">
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <div>
            <h2 className="font-black text-neutral-900 text-lg">Close Opportunity</h2>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">{lead.buyerName}</p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-400 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Outcome selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setOutcome('WON')}
              className={`p-4 rounded-2xl border-2 text-center transition-all ${outcome === 'WON' ? 'border-emerald-500 bg-emerald-50' : 'border-neutral-200 hover:border-neutral-300'}`}
            >
              <div className="text-2xl mb-1">🎉</div>
              <p className={`font-black text-sm ${outcome === 'WON' ? 'text-emerald-700' : 'text-neutral-600'}`}>Deal Won</p>
              <p className={`text-[10px] font-medium mt-0.5 ${outcome === 'WON' ? 'text-emerald-500' : 'text-neutral-400'}`}>Lead converted</p>
            </button>
            <button
              onClick={() => setOutcome('LOST')}
              className={`p-4 rounded-2xl border-2 text-center transition-all ${outcome === 'LOST' ? 'border-rose-500 bg-rose-50' : 'border-neutral-200 hover:border-neutral-300'}`}
            >
              <div className="text-2xl mb-1">😞</div>
              <p className={`font-black text-sm ${outcome === 'LOST' ? 'text-rose-700' : 'text-neutral-600'}`}>Lost Lead</p>
              <p className={`text-[10px] font-medium mt-0.5 ${outcome === 'LOST' ? 'text-rose-500' : 'text-neutral-400'}`}>Not converted</p>
            </button>
          </div>

          {outcome === 'WON' && (
            <Field label="Final Sale Price (₹) — Optional">
              <input
                type="number" className={inputCls}
                placeholder="e.g. 7500000"
                value={closedPrice}
                onChange={e => setClosedPrice(e.target.value)}
              />
            </Field>
          )}

          {outcome === 'LOST' && (
            <>
              <Field label="Loss Reason *">
                <select className={inputCls} value={closedReason} onChange={e => setClosedReason(e.target.value)}>
                  <option value="">Select reason...</option>
                  {LOSS_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Additional Notes">
                <textarea
                  rows={2} className={inputCls + ' resize-none'}
                  placeholder="Any context for future reference..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </Field>
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-neutral-100 flex gap-3">
          <button type="button" onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-700 font-bold text-sm hover:bg-neutral-50 transition-all">
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
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black border border-dashed border-indigo-300 text-indigo-500 hover:bg-indigo-50 transition-all"
      >
        <Plus className="w-3 h-3" /> Tag
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => { setOpen(false); setSearch(''); }} />
          <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden w-64">
            <div className="p-2 border-b border-neutral-100">
              <input
                autoFocus
                value={search}
                onChange={e => { e.stopPropagation(); setSearch(e.target.value); }}
                onClick={e => e.stopPropagation()}
                placeholder="Search properties..."
                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="text-xs text-neutral-400 p-3 text-center">No properties found</p>
              )}
              {filtered.map(p => {
                const isTagged = taggedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={e => { e.stopPropagation(); isTagged ? onUntag(p.id) : onTag(p.id); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-neutral-50 transition-colors ${isTagged ? 'bg-indigo-50/50' : ''}`}
                  >
                    <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 ${isTagged ? 'bg-indigo-600 border-indigo-600' : 'border-neutral-300'}`}>
                      {isTagged && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-800 truncate">{p.title}</p>
                      <p className="text-[10px] text-neutral-400">{p.city}</p>
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
          <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden min-w-[180px]">
            {STAGES.map(s => (
              <button
                key={s.key}
                onClick={e => { e.stopPropagation(); onChange(s.key); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold hover:bg-neutral-50 transition-colors text-left ${s.key === lead.stage ? 'bg-indigo-50 text-indigo-700' : 'text-neutral-700'}`}
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

  // Show primary property if not in tagged list
  const showPrimary = lead.property && !taggedIds.includes(lead.propertyId);

  // Next upcoming visit
  const nextVisit = (lead.leadVisits || []).find(
    (v: any) => v.status === 'PENDING' || v.status === 'APPROVED'
  );

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
            lead.stage === 'DEAL_CLOSED' ? 'bg-emerald-100 text-emerald-700' :
            lead.stage === 'LOST' ? 'bg-rose-100 text-rose-500' :
            'bg-indigo-100 text-indigo-700'
          }`}>
            {lead.buyerName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-black text-neutral-900 text-sm truncate">{lead.buyerName}</p>
            <a href={`tel:${lead.buyerPhone}`} onClick={e => e.stopPropagation()}
              className="text-xs text-neutral-500 font-semibold flex items-center gap-1 hover:text-indigo-600 transition-colors">
              <Phone className="w-3 h-3" /> {lead.buyerPhone}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-indigo-50 text-neutral-400 hover:text-indigo-600 transition-all">
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
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold flex-wrap">
            <IndianRupee className="w-3 h-3 text-emerald-500 shrink-0" />
            <span>Budget: <span className="text-neutral-800 font-black">{formatCurrency(lead.budget)}</span></span>
            {lead.closedPrice && (
              <span className="text-emerald-600 font-black">→ Closed @ {formatCurrency(lead.closedPrice)}</span>
            )}
          </div>
        )}
        {(lead.preferredCity || lead.preferredType) && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold">
            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
            {[lead.preferredCity, lead.preferredType && lead.preferredType.charAt(0) + lead.preferredType.slice(1).toLowerCase()].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>

      {/* Interested Properties */}
      <div className="mt-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Interested In</p>
        <div className="flex flex-wrap gap-1.5 items-center">
          {showPrimary && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
              <Building2 className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate max-w-[100px]">{lead.property.title}</span>
            </span>
          )}
          {(lead.interestedProperties || []).filter((ip: any, idx: number, arr: any[]) => arr.findIndex((x: any) => x.propertyId === ip.propertyId) === idx).map((ip: any) => (
            <span key={ip.id} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
              <Building2 className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate max-w-[100px]">{ip.property?.title || 'Property'}</span>
              {!isTerminal && (
                <button
                  onClick={e => { e.stopPropagation(); onUntagProperty(ip.propertyId); }}
                  className="ml-0.5 text-indigo-300 hover:text-rose-500 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </span>
          ))}
          {taggedIds.length === 0 && !showPrimary && (
            <span className="text-[10px] text-neutral-300 font-semibold">None tagged yet</span>
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
        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-violet-600 bg-violet-50 rounded-lg px-2.5 py-1.5 border border-violet-100">
          <Calendar className="w-3 h-3 shrink-0" />
          Visit {nextVisit.status === 'APPROVED' ? 'confirmed' : 'pending approval'} ·{' '}
          {new Date(nextVisit.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
          {new Date(nextVisit.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          {nextVisit.property && <span className="text-violet-400 ml-1">· {nextVisit.property.title}</span>}
        </div>
      )}

      {/* Notes */}
      {lead.notes && (
        <p className="text-xs text-neutral-400 font-medium line-clamp-2 mt-2 italic">"{lead.notes}"</p>
      )}

      {/* Loss reason */}
      {lead.stage === 'LOST' && lead.closedReason && (
        <div className="mt-2 text-[10px] font-bold text-rose-500 bg-rose-50 rounded-lg px-2.5 py-1.5 border border-rose-100">
          Lost: {lead.closedReason}
        </div>
      )}

      {/* Action buttons — only for active leads */}
      {!isTerminal && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={e => { e.stopPropagation(); onScheduleVisit(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold border border-violet-200 text-violet-600 hover:bg-violet-50 transition-all"
          >
            <Calendar className="w-3 h-3" /> Schedule Visit
          </button>
          <button
            onClick={e => { e.stopPropagation(); onCloseOpportunity(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-all"
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

      <p className="text-[9px] text-neutral-300 font-bold mt-3 uppercase tracking-widest">
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
    // Optimistic update
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
      // Auto-advance stage locally
      if (lead.stage === 'NEW' || lead.stage === 'CONTACTED') {
        setAllLeads(prev => prev.map(l => l.id === lead.id ? { ...l, stage: 'VISIT_SCHEDULED' } : l));
      }
      await load(); // Reload to get the new visit in leadVisits
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

  // Stats
  const stats = STAGES.map(s => ({ ...s, count: allLeads.filter(l => l.stage === s.key).length }));

  if (loading) return (
    <div className="p-8 space-y-4 max-w-7xl mx-auto">
      {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-neutral-100 animate-pulse" />)}
    </div>
  );

  return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto text-neutral-900 min-h-screen bg-neutral-50">

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
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-violet-50 border border-violet-100">
            <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Lead Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-1">
            My <span className="text-indigo-600">Pipeline</span>
          </h1>
          <p className="text-neutral-500 font-medium">
            {allLeads.length} leads · {allLeads.filter(l => l.stage === 'DEAL_CLOSED').length} won · {allLeads.filter(l => l.stage === 'LOST').length} lost
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-600 hover:border-neutral-300 transition-all flex items-center gap-2 shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </header>

      {/* Stage Summary Strip */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-7">
        {stats.map(s => (
          <button key={s.key}
            onClick={() => setFilterStage(prev => prev === s.key ? 'ALL' : s.key)}
            className={`rounded-2xl p-3 text-center border transition-all ${filterStage === s.key ? s.color + ' shadow-sm' : 'bg-white border-neutral-200 hover:border-neutral-300'}`}
          >
            <p className={`text-xl font-black ${filterStage === s.key ? '' : 'text-neutral-800'}`}>{s.count}</p>
            <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${filterStage === s.key ? '' : 'text-neutral-400'}`}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text" placeholder="Search by name, phone, city, property..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          />
        </div>
        <div className="flex bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          <button onClick={() => setViewMode('board')}
            className={`px-3 py-2.5 transition-all ${viewMode === 'board' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-neutral-700'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')}
            className={`px-3 py-2.5 transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-neutral-700'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white border border-dashed border-neutral-300 rounded-3xl p-16 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-xl font-black text-neutral-700 mb-2">
            {allLeads.length === 0 ? 'No leads yet' : 'No leads match your filter'}
          </h3>
          <p className="text-neutral-500 font-medium mb-6">
            {allLeads.length === 0 ? 'Add your first lead to start tracking your pipeline.' : 'Try a different stage filter or clear the search.'}
          </p>
          {allLeads.length === 0 && (
            <button onClick={() => setShowModal(true)}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">
              <Plus className="w-4 h-4 inline mr-2" /> Add First Lead
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
                  <span className="text-xs font-black uppercase tracking-widest text-neutral-500">{stage.label}</span>
                  <span className="ml-auto text-xs font-black text-neutral-400">{stageLeads.length}</span>
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
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="border-b border-neutral-100">
              <tr>
                {['Buyer', 'Contact', 'Budget', 'Interested In', 'Stage', 'Visit', 'Added', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-[9px] font-black uppercase tracking-widest text-neutral-400 whitespace-nowrap">{h}</th>
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
                return (
                  <tr key={lead.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          lead.stage === 'DEAL_CLOSED' ? 'bg-emerald-100 text-emerald-700' :
                          lead.stage === 'LOST' ? 'bg-rose-100 text-rose-500' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {lead.buyerName.charAt(0)}
                        </div>
                        <span className="font-black text-neutral-900 text-sm">{lead.buyerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <a href={`tel:${lead.buyerPhone}`} className="text-xs font-semibold text-neutral-600 hover:text-indigo-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {lead.buyerPhone}
                        </a>
                        {lead.buyerEmail && (
                          <a href={`mailto:${lead.buyerEmail}`} className="text-xs font-semibold text-neutral-400 hover:text-indigo-600 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {lead.buyerEmail}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-black text-neutral-800 text-xs whitespace-nowrap">
                      {lead.budget ? `₹${(lead.budget / 100000).toFixed(1)}L` : '—'}
                      {lead.closedPrice ? <span className="block text-emerald-600 text-[10px]">Won: ₹{(lead.closedPrice / 100000).toFixed(1)}L</span> : null}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        {allInterested.slice(0, 2).map((p: any) => (
                          <span key={p.id} className="text-[10px] font-bold text-indigo-700 truncate max-w-[130px] flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5 shrink-0" /> {p.title}
                          </span>
                        ))}
                        {allInterested.length === 0 && (
                          <span className="text-xs text-neutral-300 font-semibold">
                            {[lead.preferredCity, lead.preferredType].filter(Boolean).join(' · ') || '—'}
                          </span>
                        )}
                        {allInterested.length > 2 && (
                          <span className="text-[10px] text-neutral-400 font-semibold">+{allInterested.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StageDropdown lead={lead} onChange={s => handleStageChange(lead, s)} />
                    </td>
                    <td className="px-4 py-3.5">
                      {nextVisit ? (
                        <div className="text-[10px] font-bold text-violet-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(nextVisit.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          <span className={`ml-1 px-1.5 py-0.5 rounded-md ${nextVisit.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {nextVisit.status === 'APPROVED' ? '✓' : '⏳'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-neutral-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-neutral-400 font-semibold whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isTerminal && (
                          <>
                            <button onClick={() => setSchedulingFor(lead)} title="Schedule Visit"
                              className="p-1.5 rounded-lg hover:bg-violet-50 text-neutral-400 hover:text-violet-600 transition-all">
                              <Calendar className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setClosingFor(lead)} title="Close Lead"
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-neutral-400 hover:text-emerald-600 transition-all">
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button onClick={() => setEditing(lead)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-neutral-400 hover:text-indigo-600 transition-all">
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
