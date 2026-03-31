"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { properties as propertiesApi } from '@/lib/api';
import {
  X, CheckCircle2, XCircle, Eye, Building2, MapPin, IndianRupee,
  Users, FileText, Image as ImageIcon, Layers, Phone, Mail,
  Calendar, Tag, BarChart2, RefreshCw, ChevronDown, ChevronUp, Pencil, Check
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number | null | undefined) =>
  n == null ? '—' : n >= 10000000 ? `₹${(n / 10000000).toFixed(2)}Cr` : n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${n.toLocaleString()}`;

const badge = (label: string, color: string) => (
  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${color}`}>{label}</span>
);

// ── Doc Row ───────────────────────────────────────────────────────────────────
function DocRow({ doc, onRenamed }: { doc: any; onRenamed: (id: string, title: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(doc.title || doc.type);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const save = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === (doc.title || doc.type)) { setEditing(false); return; }
    setSaving(true);
    try {
      await propertiesApi.renameDocument(doc.id, trimmed);
      onRenamed(doc.id, trimmed);
    } catch {}
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100 group">
      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
            className="w-full text-sm font-bold text-neutral-800 bg-white border border-indigo-300 rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-indigo-300/40"
            disabled={saving}
            autoFocus
          />
        ) : (
          <p className="text-sm font-bold text-neutral-800 truncate">{value}</p>
        )}
        <p className="text-xs text-neutral-400 font-medium uppercase">{doc.type}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {editing ? (
          <button onClick={save} disabled={saving}
            className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">
            <Check className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button onClick={startEdit}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100 transition-all">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        <a href={doc.url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-indigo-600 font-bold hover:underline">
          View →
        </a>
      </div>
    </div>
  );
}

// ── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({ p, onClose, onApprove, onReject, onDocRenamed }: {
  p: any; onClose: () => void;
  onApprove: (id: string, pct: number) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onDocRenamed: (propId: string, docId: string, title: string) => void;
}) {
  const [commissionPct, setCommissionPct] = useState<number>(p.commissionPoolPct || 2);
  const [acting, setActing] = useState<'approve' | 'reject' | null>(null);
  const [section, setSection] = useState<string | null>(null);

  const toggle = (s: string) => setSection(prev => prev === s ? null : s);

  const doApprove = async () => {
    setActing('approve');
    await onApprove(p.id, commissionPct);
    setActing(null);
  };
  const doReject = async () => {
    setActing('reject');
    await onReject(p.id);
    setActing(null);
  };

  const Section = ({ id, title, icon: Icon, children }: any) => (
    <div className="border border-neutral-200 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => toggle(id)}
        className="w-full flex items-center justify-between px-5 py-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
      >
        <div className="flex items-center gap-3 font-bold text-neutral-800 text-sm">
          <Icon className="w-4 h-4 text-indigo-500" />
          {title}
        </div>
        {section === id ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
      </button>
      {section === id && <div className="px-5 py-4 bg-white text-sm text-neutral-700">{children}</div>}
    </div>
  );

  const Row = ({ label, value }: { label: string; value?: string | number | null }) => (
    value != null && value !== '' && value !== 0 ? (
      <div className="flex justify-between py-1.5 border-b border-neutral-50 last:border-0">
        <span className="text-neutral-500 font-medium">{label}</span>
        <span className="font-semibold text-neutral-900 text-right max-w-[60%]">{String(value)}</span>
      </div>
    ) : null
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-neutral-200 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {badge('PENDING REVIEW', 'bg-amber-100 text-amber-700')}
              {badge(p.projectType || '—', 'bg-indigo-50 text-indigo-700')}
              {badge((p.projectStage || '').replace(/_/g, ' '), 'bg-neutral-100 text-neutral-600')}
            </div>
            <h2 className="text-xl font-black text-neutral-900 mt-2">{p.title}</h2>
            <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {[p.locality, p.city, p.state].filter(Boolean).join(', ') || '—'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">

          {/* Basic Info */}
          <Section id="basic" title="Basic Information" icon={Building2}>
            <Row label="RERA ID" value={p.reraId} />
            <Row label="Launch Date" value={p.launchDate ? new Date(p.launchDate).toLocaleDateString('en-IN') : null} />
            <Row label="Possession Date" value={p.possessionDate ? new Date(p.possessionDate).toLocaleDateString('en-IN') : null} />
            <Row label="Submitted On" value={new Date(p.createdAt).toLocaleString('en-IN')} />
            <Row label="Submitted By" value={p.company?.email} />
            <Row label="Company Phone" value={p.company?.phone} />
            {p.description && (
              <div className="pt-2 text-neutral-600 text-sm leading-relaxed">{p.description}</div>
            )}
          </Section>

          {/* Location */}
          <Section id="location" title="Location Details" icon={MapPin}>
            <Row label="Address" value={p.address} />
            <Row label="Locality" value={p.locality} />
            <Row label="City" value={p.city} />
            <Row label="State" value={p.state} />
            <Row label="Pincode" value={p.pincode} />
            <Row label="Latitude" value={p.latitude} />
            <Row label="Longitude" value={p.longitude} />
            {p.latitude && p.longitude && (
              <a
                href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
              >
                <MapPin className="w-3 h-3" /> View on Google Maps
              </a>
            )}
          </Section>

          {/* Pricing */}
          <Section id="pricing" title="Pricing & Financials" icon={IndianRupee}>
            <Row label="Min Price" value={fmt(p.price)} />
            <Row label="Max Price" value={fmt(p.maxPrice)} />
            <Row label="Price / Sq.Ft" value={p.pricePerSqFt ? `₹${p.pricePerSqFt}/sqft` : null} />
            <Row label="Booking Amount" value={fmt(p.bookingAmount)} />
            <Row label="Maintenance Charge" value={p.maintenanceCharge ? `₹${p.maintenanceCharge}/month` : null} />
            <Row label="Incentive Pool" value={`${p.commissionPoolPct || 2}%`} />
          </Section>

          {/* Builder */}
          {(p.builderName || p.builderContact || p.builderEmail) && (
            <Section id="builder" title="Builder / Developer Info" icon={Users}>
              <Row label="Builder Name" value={p.builderName} />
              <Row label="Contact" value={p.builderContact} />
              <Row label="Email" value={p.builderEmail} />
              <Row label="Address" value={p.builderAddress} />
            </Section>
          )}

          {/* Units */}
          {p.units?.length > 0 && (
            <Section id="units" title={`Unit Configurations (${p.units.length})`} icon={Layers}>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      {['Name','Beds','Baths','Carpet','Super','Min Price','Total','Avail'].map(h => (
                        <th key={h} className="text-left py-2 px-1 font-bold text-neutral-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {p.units.map((u: any) => (
                      <tr key={u.id} className="border-b border-neutral-50 last:border-0">
                        <td className="py-2 px-1 font-semibold">{u.name}</td>
                        <td className="py-2 px-1">{u.beds}</td>
                        <td className="py-2 px-1">{u.baths}</td>
                        <td className="py-2 px-1">{u.carpetArea} sqft</td>
                        <td className="py-2 px-1">{u.superArea} sqft</td>
                        <td className="py-2 px-1">{fmt(u.minPrice)}</td>
                        <td className="py-2 px-1">{u.totalUnits}</td>
                        <td className="py-2 px-1 text-emerald-600 font-bold">{u.availableUnits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Amenities */}
          {p.amenities?.length > 0 && (
            <Section id="amenities" title={`Amenities (${p.amenities.length})`} icon={Tag}>
              <div className="flex flex-wrap gap-2">
                {p.amenities.map((a: string) => (
                  <span key={a} className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold capitalize">
                    {a.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Images */}
          {p.images?.length > 0 && (
            <Section id="images" title={`Images (${p.images.length})`} icon={ImageIcon}>
              <div className="grid grid-cols-3 gap-2">
                {p.images.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`Image ${i+1}`} className="w-full aspect-video object-cover rounded-xl hover:opacity-80 transition-opacity border border-neutral-100" />
                  </a>
                ))}
              </div>
            </Section>
          )}

          {/* Documents */}
          <Section id="docs" title={`Documents (${p.documents?.length || 0})`} icon={FileText}>
            {!p.documents?.length ? (
              <p className="text-neutral-400 text-xs">No documents attached.</p>
            ) : (
              <div className="space-y-2">
                {p.documents.map((d: any) => (
                  <DocRow key={d.id} doc={d} onRenamed={(id, title) => {
                    onDocRenamed(p.id, id, title);
                  }} />
                ))}
              </div>
            )}
          </Section>

          {/* Stats */}
          <Section id="stats" title="Platform Activity" icon={BarChart2}>
            <Row label="Total Visits" value={p._count?.visits ?? 0} />
            <Row label="Total Deals" value={p._count?.deals ?? 0} />
          </Section>
        </div>

        {/* Sticky Action Footer */}
        <div className="shrink-0 border-t border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-bold text-neutral-700 shrink-0">Incentive %</label>
            <input
              type="number" step="0.5" min="0" max="20"
              value={commissionPct}
              onChange={e => setCommissionPct(parseFloat(e.target.value))}
              className="w-24 border border-neutral-200 rounded-xl px-3 py-2 text-sm font-bold text-center bg-neutral-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
            />
            <span className="text-xs text-neutral-400 font-medium">Negotiate before approving</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={doReject}
              disabled={!!acting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-rose-200 text-rose-600 font-bold text-sm hover:bg-rose-50 disabled:opacity-50 transition-all"
            >
              {acting === 'reject' ? <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
              Reject Listing
            </button>
            <button
              onClick={doApprove}
              disabled={!!acting}
              className="flex-2 flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 disabled:opacity-50 shadow-lg shadow-emerald-500/20 transition-all"
            >
              {acting === 'approve' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Approve & Go Live
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminPropertiesPage() {
  const { profile } = useUserProfile();
  const { addNotification } = useNotifications();

  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<any | null>(null);

  const isAdmin = !profile?.role || profile.role === 'ADMIN';
  const isCompany = profile?.role === 'COMPANY';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await propertiesApi.adminAll();
      setAllProperties(data);
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Load Failed', message: err?.message || 'Could not load properties.', category: 'system' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending = allProperties.filter(p => p.status === 'PENDING_APPROVAL');
  const active  = allProperties.filter(p => p.status === 'AVAILABLE');

  const handleApprove = async (id: string, pct: number) => {
    try {
      await propertiesApi.updateStatus(id, 'AVAILABLE');
      if (pct) await propertiesApi.update(id, { commissionPoolPct: pct });
      setReviewing(null);
      await load();
      addNotification({ type: 'success', title: 'Approved', message: 'Property is now live for advisors.', category: 'system' });
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Approval Failed', message: err?.message, category: 'system' });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await propertiesApi.updateStatus(id, 'REJECTED');
      setReviewing(null);
      await load();
      addNotification({ type: 'info', title: 'Rejected', message: 'The listing has been declined.', category: 'system' });
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Rejection Failed', message: err?.message, category: 'system' });
    }
  };

  const cityLocality = (p: any) => [p.locality, p.city].filter(Boolean).join(', ') || p.address || '—';

  if (loading) return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-28 rounded-3xl glass-panel animate-pulse" />)}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 relative z-10 w-full max-w-7xl mx-auto text-[var(--text-primary)]">
      {reviewing && (
        <ReviewModal
          p={reviewing}
          onClose={() => setReviewing(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onDocRenamed={(propId, docId, title) => {
            setAllProperties(prev => prev.map(prop =>
              prop.id === propId
                ? { ...prop, documents: prop.documents.map((dd: any) => dd.id === docId ? { ...dd, title } : dd) }
                : prop
            ));
          }}
        />
      )}

      {/* Header */}
      <header className="mb-10 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel">
            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest font-black">Inventory Control</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Project <span className="text-gradient">Portfolio</span></h1>
          <p className="text-[var(--text-secondary)]">System-wide inventory control and listing approvals.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="glass-panel px-4 py-2.5 rounded-2xl text-xs font-bold text-[var(--text-muted)] hover:text-white transition-all flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <div className="glass-panel px-6 py-2.5 rounded-2xl flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-tighter text-[var(--text-muted)]">Pending Review</span>
            <span className="text-xl font-black text-amber-400">{pending.length}</span>
          </div>
        </div>
      </header>

      {/* Approval Queue */}
      <section className="mb-12">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2">
          <span className="animate-pulse w-2 h-2 rounded-full bg-amber-500" />
          Approval Queue
          {pending.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black">{pending.length}</span>
          )}
        </h3>

        {pending.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border-dashed border-2 border-white/5">
            <div className="text-4xl mb-4 opacity-30">📂</div>
            <p className="font-bold text-[var(--text-secondary)]">No properties awaiting review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pending.map(p => (
              <div key={p.id} className="glass-panel rounded-[28px] p-5 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/5 hover:border-amber-500/20 transition-all">
                <div className="flex items-center gap-5 flex-1 w-full min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center text-2xl shrink-0">
                    {p.projectType === 'VILLA' ? '🏡' : p.projectType === 'PLOT' ? '🌿' : p.projectType === 'COMMERCIAL' ? '🏬' : '🏢'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-black text-base truncate">{p.title}</h4>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 uppercase">Pending</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3 shrink-0" /> {cityLocality(p)}
                      <span className="opacity-30 mx-1">·</span>
                      {p.projectType} · {(p.projectStage || '').replace(/_/g, ' ')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-black">
                        {p.price ? `₹${(p.price/100000).toFixed(1)}L` : '—'}
                        {p.maxPrice ? ` – ₹${(p.maxPrice/100000).toFixed(1)}L` : ''}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-black">{p.commissionPoolPct || 2}% incentive</span>
                      <span className="px-2 py-0.5 rounded-lg bg-white/5 text-[var(--text-muted)] text-[10px] font-black">{p.units?.length || 0} units</span>
                      {p.documents?.length > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-black">{p.documents.length} docs</span>
                      )}
                      <span className="px-2 py-0.5 rounded-lg bg-white/5 text-[var(--text-muted)] text-[10px] font-black">by {p.company?.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setReviewing(p)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold text-sm hover:bg-indigo-500/20 transition-all"
                  >
                    <Eye className="w-4 h-4" /> Full Review
                  </button>
                  <button
                    onClick={() => handleApprove(p.id, p.commissionPoolPct || 2)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(p.id)}
                    className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all"
                    title="Reject"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Live Inventory */}
      <section>
        <h3 className="text-xl font-black mb-6 flex items-center gap-2 opacity-60">
          Live Inventory
          {active.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black">{active.length}</span>
          )}
        </h3>
        {active.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] font-medium">No live listings yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map(p => (
              <div
                key={p.id}
                className="glass-panel rounded-3xl p-5 flex items-center gap-4 border border-white/5 hover:border-emerald-500/20 transition-all cursor-pointer group"
                onClick={() => setReviewing(p)}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-2xl shrink-0">
                  {p.projectType === 'VILLA' ? '🏡' : p.projectType === 'PLOT' ? '🌿' : p.projectType === 'COMMERCIAL' ? '🏬' : '🏢'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate text-sm">{p.title}</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-medium truncate">{cityLocality(p)}</p>
                  <p className="text-[10px] text-emerald-400 font-black">{p.commissionPoolPct || 2}% incentive</p>
                </div>
                <Eye className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
