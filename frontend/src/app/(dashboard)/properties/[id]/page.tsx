"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrency } from '@/context/CurrencyContext';
import { useNotifications } from '@/context/NotificationContext';
import { useProperties } from '@/context/PropertyContext';
import { properties as propertiesApi } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Building2, CalendarDays, ShieldCheck,
  Bed, Bath, Maximize2, CheckCircle2, Phone, Mail,
  Clock, FileText, ExternalLink, Home, ChevronRight,
  X, ChevronLeft, ChevronRight as ChevronRightIcon, Images,
  File, FileSpreadsheet, Camera, Users, TrendingUp, Activity,
} from 'lucide-react';

// ── Gold / Ivory palette ───────────────────────────────────────────────────────
const GOLD = '#C9A227';
const GOLD_LIGHT = '#D4A843';
const GOLD_DARK = '#A07208';
const IVORY = '#FFFDF5';
const IVORY_BG = '#FDF8ED';
const BORDER = 'rgba(180,130,30,0.18)';
const BORDER_MID = 'rgba(180,130,30,0.30)';
const TEXT_DARK = '#1a1200';
const TEXT_MID = '#5a4a28';
const TEXT_SOFT = '#9a8060';
const GOLD_BTN: React.CSSProperties = { background: 'linear-gradient(135deg, #D4A843, #C9A227, #A07208)', color: '#fff', boxShadow: '0 4px 14px rgba(180,130,30,0.28)' };

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(raw: string | undefined | null): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function docIcon(url: string, type?: string) {
  const ext = url?.split('.').pop()?.toLowerCase() || '';
  const t = (type || '').toLowerCase();
  if (ext === 'pdf' || t.includes('pdf'))
    return <FileText className="w-5 h-5 text-rose-500" />;
  if (['jpg','jpeg','png','webp','gif'].includes(ext) || t.includes('image'))
    return <Camera className="w-5 h-5 text-indigo-500" />;
  if (['xls','xlsx','csv'].includes(ext) || t.includes('sheet'))
    return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
  return <File className="w-5 h-5 text-neutral-400" />;
}

function docBg(url: string, type?: string) {
  const ext = url?.split('.').pop()?.toLowerCase() || '';
  const t = (type || '').toLowerCase();
  if (ext === 'pdf' || t.includes('pdf')) return 'bg-rose-50 border-rose-100';
  if (['jpg','jpeg','png','webp','gif'].includes(ext) || t.includes('image')) return 'bg-amber-50 border-amber-100';
  if (['xls','xlsx','csv'].includes(ext) || t.includes('sheet')) return 'bg-emerald-50 border-emerald-100';
  return 'bg-neutral-50 border-neutral-200';
}

const STAGE_LABEL: Record<string, string> = {
  UPCOMING: 'Upcoming',
  UNDER_CONSTRUCTION: 'Under Construction',
  READY_TO_MOVE: 'Ready to Move',
};
const STAGE_COLOR: Record<string, string> = {
  UPCOMING: 'bg-amber-100 text-amber-700 border-amber-200',
  UNDER_CONSTRUCTION: 'bg-blue-100 text-blue-700 border-blue-200',
  READY_TO_MOVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};
const TYPE_COLOR: Record<string, string> = {
  APARTMENT: 'bg-amber-100 text-amber-700 border-amber-200',
  VILLA: 'bg-purple-100 text-purple-700 border-purple-200',
  PLOT: 'bg-amber-100 text-amber-700 border-amber-200',
  COMMERCIAL: 'bg-rose-100 text-rose-700 border-rose-200',
};

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ images, index, onClose }: { images: string[]; index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index);
  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length);
  const next = () => setCurrent(i => (i + 1) % images.length);

  return (
    <div className="fixed inset-0 z-[60] bg-black/96 flex flex-col select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0">
        <span className="text-white/50 text-sm font-bold tabular-nums">
          {current + 1} <span className="text-white/30">/ {images.length}</span>
        </span>
        <button onClick={onClose}
          className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main image */}
      <div className="flex-1 flex items-center justify-center relative min-h-0 px-4 md:px-16">
        <button onClick={prev}
          className="absolute left-3 md:left-5 z-10 p-2.5 md:p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm border border-white/10">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <img
          src={images[current]}
          alt={`Photo ${current + 1}`}
          className="max-h-full max-w-full object-contain rounded-xl"
          draggable={false}
        />
        <button onClick={next}
          className="absolute right-3 md:right-5 z-10 p-2.5 md:p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm border border-white/10">
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div className="shrink-0 flex gap-2 overflow-x-auto px-5 py-4 justify-start md:justify-center scrollbar-hide">
        {images.map((img, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`shrink-0 w-14 h-10 md:w-16 md:h-12 rounded-lg overflow-hidden border-2 transition-all ${
              i === current ? 'border-white opacity-100 scale-105' : 'border-white/20 opacity-40 hover:opacity-70'
            }`}
          >
            <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Photo Grid (top of page) ──────────────────────────────────────────────────
function PhotoGrid({ images, title, onOpen }: {
  images: string[]; title: string; onOpen: (i: number) => void;
}) {
  if (!images?.length) {
    return (
      <div
        className="w-full h-[280px] md:h-[400px] flex items-center justify-center border-b"
        style={{ background: 'rgba(212,168,67,0.08)', borderColor: BORDER }}
      >
        <div className="text-center text-neutral-400">
          <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold">No photos uploaded yet</p>
        </div>
      </div>
    );
  }

  const [m, ...rest] = images;
  const grid = rest.slice(0, 4);
  const hidden = Math.max(0, images.length - 5);

  // Mobile: just show main image with count badge
  // Desktop: Airbnb-style 5-cell grid
  return (
    <div className="relative bg-neutral-900">
      {/* Mobile — single image */}
      <div
        className="md:hidden w-full h-[260px] cursor-pointer overflow-hidden"
        onClick={() => onOpen(0)}
      >
        <img src={m} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      </div>

      {/* Desktop — grid */}
      <div className="hidden md:flex h-[420px] lg:h-[500px] gap-0.5">
        {/* Main image — 58% */}
        <div
          className="flex-[58] cursor-pointer overflow-hidden relative group"
          onClick={() => onOpen(0)}
        >
          <img
            src={m} alt={title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
          />
        </div>

        {/* Right side — adapts to available image count */}
        {grid.length > 0 && (
          <div className={`flex-[42] gap-0.5 ${
            grid.length === 1 ? 'flex' :
            grid.length === 2 ? 'grid grid-cols-1 grid-rows-2' :
            grid.length === 3 ? 'grid grid-cols-2 grid-rows-2' :
            'grid grid-cols-2 grid-rows-2'
          }`}>
            {grid.map((img, i) => {
              const showOverlay = i === grid.length - 1 && hidden > 0;
              const spanFull = grid.length === 3 && i === 0;
              return (
                <div
                  key={i}
                  className={`relative cursor-pointer overflow-hidden group ${spanFull ? 'col-span-2' : ''}`}
                  onClick={() => onOpen(i + 1)}
                >
                  <img
                    src={img} alt={`Photo ${i + 2}`}
                    className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
                  />
                  {showOverlay && (
                    <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center text-white pointer-events-none">
                      <span className="text-3xl font-black">+{hidden + 1}</span>
                      <span className="text-[11px] font-bold mt-1 opacity-70">more photos</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View all button (bottom-right) */}
      <button
        onClick={() => onOpen(0)}
        className="absolute bottom-3 right-3 md:bottom-4 md:right-4 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-neutral-800 font-bold text-xs shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all border border-neutral-100"
      >
        <Images className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">View all {images.length} photos</span>
        <span className="sm:hidden">{images.length} photos</span>
      </button>
    </div>
  );
}

// ── Document Card ─────────────────────────────────────────────────────────────
function DocCard({ doc }: { doc: any }) {
  const label = doc.title || doc.type || 'Document';
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${docBg(doc.url, doc.type)} group`}>
      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
        {docIcon(doc.url, doc.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-neutral-800 text-sm truncate">{label}</p>
        {doc.type && doc.title && (
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{doc.type}</p>
        )}
      </div>
      <a href={doc.url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs font-bold text-neutral-600 hover:text-amber-700 hover:border-amber-300 transition-all shadow-sm shrink-0">
        <ExternalLink className="w-3 h-3" /> View
      </a>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PropertyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const { properties } = useProperties();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [interests, setInterests] = useState<any[]>([]);

  const property = properties.find(p => p.id === params.id);

  useEffect(() => {
    if (!params.id) return;
    propertiesApi.interests(params.id as string, 30)
      .then(setInterests)
      .catch(() => {});
  }, [params.id]);

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center" style={{ background: IVORY_BG }}>
        <div className="text-6xl mb-4">🏚️</div>
        <h2 className="text-2xl font-black text-neutral-800 mb-2">Property Not Found</h2>
        <p className="text-neutral-500 mb-6">This listing may have been removed.</p>
        <Link href="/properties"
          className="px-6 py-3 rounded-xl text-white font-bold hover:-translate-y-0.5 transition-all"
          style={GOLD_BTN}>
          Back to Listings
        </Link>
      </div>
    );
  }

  const p = property;
  const loc = p.location || {};
  const pricing = p.pricing || {};

  const title = p.title || p.name || 'Property';
  const minPrice = Number(p.price || pricing.minPrice) || 0;
  const maxPrice = Number(p.maxPrice || pricing.maxPrice) || 0;
  const projectType = p.projectType || '';
  const projectStage = p.projectStage || '';
  const images: string[] = Array.isArray(p.images) ? p.images : [];
  const amenities: string[] = Array.isArray(p.amenities)
    ? p.amenities
    : typeof p.amenities === 'object' && p.amenities !== null
      ? [
          ...((p.amenities as any).common || []),
          ...((p.amenities as any).lifestyle || []),
          ...((p.amenities as any).premium || []),
        ]
      : [];
  const documents: any[] = p.documents || [];
  const mapsUrl = (p.latitude && p.longitude)
    ? `https://www.google.com/maps?q=${p.latitude},${p.longitude}`
    : (loc.lat && loc.lng)
    ? `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
    : null;
  const builderName = p.builderName || p.builder?.name;
  const builderEmail = p.builderEmail || p.builder?.email;
  const builderContact = p.builderContact || p.builder?.contact;

  const locationStr = [loc.area || p.locality, loc.city || p.city, loc.state || p.state]
    .filter(Boolean).join(', ') || 'Location TBA';

  return (
    <div className="min-h-screen pb-20" style={{ background: IVORY_BG }}>

      {/* Lightbox (portal-like — rendered at root) */}
      {lightboxIndex !== null && (
        <Lightbox images={images} index={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}

      {/* ── Top Nav ── */}
      <div className="sticky top-0 z-40 backdrop-blur-md border-b" style={{ background: 'rgba(255,253,245,0.85)', borderColor: BORDER }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-13 flex items-center justify-between gap-4 py-3">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-amber-800 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex items-center gap-2 overflow-hidden">
            {projectType && (
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${TYPE_COLOR[projectType] || 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>
                {projectType}
              </span>
            )}
            <span className="text-sm font-black text-neutral-800 truncate max-w-[180px] md:max-w-xs">{title}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {p.reraId && (
              <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-600 text-white border border-emerald-500">
                <ShieldCheck className="w-3 h-3" /> RERA
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Photo Grid ── */}
      <PhotoGrid
        images={images}
        title={title}
        onOpen={setLightboxIndex}
      />

      {/* ── Title + Meta ── */}
      <div className="max-w-6xl mx-auto px-5 md:px-8">

        <div className="pt-6 pb-2">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold mb-5">
            <Link href="/properties" className="hover:text-amber-700 transition-colors flex items-center gap-1">
              <Home className="w-3 h-3" /> Properties
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-neutral-600 truncate max-w-[200px]">{title}</span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            {projectType && (
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${TYPE_COLOR[projectType] || 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>
                {projectType}
              </span>
            )}
            {projectStage && (
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${STAGE_COLOR[projectStage] || 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>
                {STAGE_LABEL[projectStage] || projectStage}
              </span>
            )}
            {p.reraId && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3" /> RERA: {p.reraId}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-4xl font-black text-neutral-900 tracking-tight mb-2 leading-tight">{title}</h1>

          {/* Location */}
          <p className="text-neutral-500 text-sm flex items-center gap-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            {locationStr}
          </p>
        </div>

        {/* ── Two Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">

          {/* ── LEFT ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Quick stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Type',        value: projectType || '—',                     icon: <Building2   className="w-4 h-4 text-amber-400" /> },
                { label: 'Stage',       value: STAGE_LABEL[projectStage] || projectStage || '—', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
                { label: 'Launch',      value: fmtDate(p.launchDate),                  icon: <CalendarDays className="w-4 h-4 text-amber-400" /> },
                { label: 'Possession',  value: fmtDate(p.possessionDate),              icon: <Clock       className="w-4 h-4 text-amber-400" /> },
              ].map(item => (
                <div key={item.label} className="rounded-2xl px-4 py-3.5 shadow-sm border" style={{ background: IVORY, borderColor: BORDER }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {item.icon}
                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: TEXT_SOFT }}>{item.label}</span>
                  </div>
                  <p className="font-black text-neutral-800 text-sm leading-tight">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {p.description && (
              <div className="rounded-2xl p-6 shadow-sm border" style={{ background: IVORY, borderColor: BORDER }}>
                <h2 className="font-black text-neutral-900 mb-3 text-base">About this Project</h2>
                <p className="text-neutral-600 text-sm leading-relaxed">{p.description}</p>
              </div>
            )}

            {/* Photo strip — quick scroll for mobile after main grid */}
            {images.length > 5 && (
              <div className="rounded-2xl overflow-hidden shadow-sm border" style={{ background: IVORY, borderColor: BORDER }}>
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: BORDER }}>
                  <h2 className="font-black text-neutral-900 text-base flex items-center gap-2">
                    <Images className="w-4 h-4" style={{ color: GOLD }} /> All Photos
                    <span className="text-neutral-400 font-semibold text-sm">({images.length})</span>
                  </h2>
                  <button onClick={() => setLightboxIndex(0)}
                    className="text-xs font-bold transition-colors" style={{ color: GOLD }}>
                    View all →
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto px-5 py-4 scrollbar-hide">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setLightboxIndex(i)}
                      className={`shrink-0 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${i === 0 ? '' : 'border-transparent hover:border-neutral-300'}`}
                      style={i === 0 ? { borderColor: GOLD } : undefined}
                      {...(i !== 0 ? {} : {})}
                    >
                      <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" style={{ width: 120, height: 80 }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Unit Configurations */}
            {p.units?.length > 0 && (
              <div className="rounded-2xl p-6 shadow-sm border" style={{ background: IVORY, borderColor: BORDER }}>
                <h2 className="font-black text-neutral-900 mb-5 text-base flex items-center gap-2">
                  <Maximize2 className="w-4 h-4" style={{ color: GOLD }} /> Unit Configurations
                </h2>
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-sm min-w-[540px]">
                    <thead>
                      <tr className="border-b" style={{ borderColor: BORDER }}>
                        {['Unit', 'Beds', 'Baths', 'Carpet Area', 'Super Area', 'Price Range'].map(h => (
                          <th key={h} className="text-left py-2 px-3 text-[9px] font-black uppercase tracking-widest" style={{ color: TEXT_SOFT }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {p.units.map((u: any) => (
                        <tr key={u.id} className="border-b border-neutral-50 last:border-0 hover:bg-amber-50/30 transition-colors">
                          <td className="py-3.5 px-3 font-black" style={{ color: TEXT_DARK }}>{u.name}</td>
                          <td className="py-3.5 px-3 text-neutral-600 font-semibold">
                            <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5 text-neutral-300" />{u.beds}</span>
                          </td>
                          <td className="py-3.5 px-3 text-neutral-600 font-semibold">
                            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5 text-neutral-300" />{u.baths}</span>
                          </td>
                          <td className="py-3.5 px-3 text-neutral-600 font-semibold">{u.carpetArea ? `${u.carpetArea.toLocaleString()} sqft` : '—'}</td>
                          <td className="py-3.5 px-3 text-neutral-600 font-semibold">{u.superArea ? `${u.superArea.toLocaleString()} sqft` : '—'}</td>
                          <td className="py-3.5 px-3">
                            <span className="font-black" style={{ color: GOLD_DARK }}>{(u.minPrice || u.price) > 0 ? formatCurrency(u.minPrice || u.price) : '—'}</span>
                            {u.maxPrice > 0 && u.maxPrice !== (u.minPrice || u.price) && (
                              <span className="text-neutral-400 font-semibold text-xs block">up to {formatCurrency(u.maxPrice)}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="rounded-2xl p-6 shadow-sm border" style={{ background: IVORY, borderColor: BORDER }}>
                <h2 className="font-black text-neutral-900 mb-4 text-base">Amenities & Features</h2>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((a: string) => (
                    <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border" style={{ background: IVORY_BG, borderColor: BORDER, color: TEXT_MID }}>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      {a.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="rounded-2xl p-6 shadow-sm border" style={{ background: IVORY, borderColor: BORDER }}>
              <h2 className="font-black text-neutral-900 mb-4 text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" /> Location Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 mb-5">
                {[
                  { label: 'Locality', value: loc.area || p.locality },
                  { label: 'City',     value: loc.city || p.city },
                  { label: 'State',    value: loc.state || p.state },
                  { label: 'Pincode',  value: loc.pincode || p.pincode },
                  { label: 'Address',  value: loc.address || p.address },
                ].filter(i => i.value).map(i => (
                  <div key={i.label}>
                    <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: TEXT_SOFT }}>{i.label}</p>
                    <p className="font-bold text-neutral-800 text-sm">{i.value}</p>
                  </div>
                ))}
              </div>
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-neutral-700 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all border"
                  style={{ background: IVORY_BG, borderColor: BORDER }}>
                  <ExternalLink className="w-3.5 h-3.5" /> View on Google Maps
                </a>
              )}
            </div>

            {/* Documents */}
            {documents.length > 0 && (
              <div className="rounded-2xl p-6 shadow-sm border" style={{ background: IVORY, borderColor: BORDER }}>
                <h2 className="font-black text-neutral-900 mb-4 text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" /> Documents & Attachments
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 text-xs font-black">{documents.length}</span>
                </h2>
                <div className="space-y-2">
                  {documents.map((doc: any) => <DocCard key={doc.id} doc={doc} />)}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT (sticky sidebar) ── */}
          <div className="space-y-5">
            <div className="sticky top-[57px] space-y-5">

              {/* Price + CTA */}
              <div className="rounded-2xl p-6 shadow-sm border" style={{ background: IVORY, borderColor: BORDER }}>
                <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: TEXT_SOFT }}>Starting from</p>
                <p className="text-3xl font-black mb-1 leading-none" style={{ color: GOLD_DARK }}>
                  {minPrice > 0 ? formatCurrency(minPrice) : 'Price on Request'}
                </p>
                {maxPrice > 0 && maxPrice !== minPrice && (
                  <p className="text-sm text-neutral-500 font-semibold mb-1 mt-1">
                    Up to {formatCurrency(maxPrice)}
                  </p>
                )}
                {images.length > 0 && (
                  <button
                    onClick={() => setLightboxIndex(0)}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-neutral-500 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all border"
                    style={{ background: IVORY_BG, borderColor: BORDER }}
                  >
                    <Camera className="w-3.5 h-3.5" /> {images.length} photo{images.length !== 1 ? 's' : ''}
                  </button>
                )}
                <div className="space-y-2.5 mt-5">
                  <button
                    onClick={() => {
                      router.push(`/visits?openModal=true&propertyId=${p.id}`);
                      addNotification({ type: 'info', title: 'Visit Request', message: `Scheduling a visit for ${title}.`, category: 'system' });
                    }}
                    className="w-full font-bold py-3.5 rounded-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm"
                    style={GOLD_BTN}
                  >
                    <CalendarDays className="w-4 h-4" /> Request Site Visit
                  </button>
                  <Link href="/deals"
                    className="w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-all text-sm border"
                    style={{ background: IVORY_BG, borderColor: BORDER, color: TEXT_MID }}>
                    <FileText className="w-4 h-4" /> Draft a Deal
                  </Link>
                  {/* WhatsApp Share */}
                  <button
                    onClick={() => {
                      const publicUrl = `${window.location.origin}/p/${p.id}`;
                      const priceStr = minPrice > 0
                        ? (maxPrice > 0 && maxPrice !== minPrice
                          ? `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`
                          : formatCurrency(minPrice))
                        : 'Price on Request';
                      const text = encodeURIComponent(
                        `Check out this property: ${title} in ${(loc.city || p.city || 'India')}\n${priceStr}\nProject: ${projectType || 'Real Estate'} | ${STAGE_LABEL[projectStage] || projectStage || 'Available'}\n\nView details: ${publicUrl}`
                      );
                      window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3.5 rounded-xl hover:bg-[#1ebe5d] hover:-translate-y-0.5 transition-all text-sm shadow-sm shadow-[#25D366]/20"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Share on WhatsApp
                  </button>
                </div>
              </div>

              {/* Interest Tracker */}
              <div className="rounded-2xl p-6 shadow-sm border" style={{ background: IVORY, borderColor: BORDER }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-neutral-900 flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4 text-rose-500" /> Interest Tracker
                    <span className="text-[10px] font-bold text-neutral-400 normal-case">last 30 days</span>
                  </h3>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-100">
                    <Users className="w-3 h-3 text-rose-500" />
                    <span className="text-[11px] font-black text-rose-600">{interests.length}</span>
                  </div>
                </div>

                {interests.length === 0 ? (
                  <div className="text-center py-6">
                    <TrendingUp className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-neutral-400">No interest tracked yet</p>
                    <p className="text-[10px] text-neutral-300 mt-0.5">Leads who tag this property will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {interests.map((entry: any) => {
                      const lead = entry.lead;
                      const daysAgo = Math.floor((Date.now() - new Date(entry.createdAt).getTime()) / 86400000);
                      const stageColor: Record<string, string> = {
                        NEW: 'bg-slate-100 text-slate-600',
                        CONTACTED: 'bg-blue-50 text-blue-600',
                        VISIT_SCHEDULED: 'bg-amber-50 text-amber-700',
                        VISITED: 'bg-purple-50 text-purple-700',
                        NEGOTIATING: 'bg-orange-50 text-orange-700',
                        DEAL_CLOSED: 'bg-emerald-50 text-emerald-700',
                        LOST: 'bg-rose-50 text-rose-500',
                      };
                      return (
                        <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 transition-colors" style={{ background: IVORY_BG }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-xs" style={{ background: 'rgba(212,168,67,0.12)', color: GOLD_DARK }}>
                            {(lead?.buyerName || '?')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-neutral-800 truncate">{lead?.buyerName || 'Unknown Lead'}</p>
                            <p className="text-[10px] text-neutral-400 truncate">{lead?.agent?.email || 'Direct'}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide ${stageColor[lead?.stage] || 'bg-neutral-100 text-neutral-500'}`}>
                              {(lead?.stage || '').replace(/_/g, ' ')}
                            </span>
                            <span className="text-[9px] text-neutral-400 font-semibold">
                              {daysAgo === 0 ? 'today' : `${daysAgo}d ago`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Builder / Developer */}
              {builderName && (
                <div className="rounded-2xl p-6 shadow-sm border" style={{ background: IVORY, borderColor: BORDER }}>
                  <h3 className="font-black text-neutral-900 mb-4 flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-blue-500" /> Developer
                  </h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shrink-0 border" style={{ background: 'rgba(212,168,67,0.12)', borderColor: BORDER, color: GOLD_DARK }}>
                      {builderName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-neutral-900 text-sm">{builderName}</p>
                      <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3 h-3" /> Verified Developer
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-1 border-t" style={{ borderColor: BORDER }}>
                    {builderEmail && (
                      <a href={`mailto:${builderEmail}`}
                        className="flex items-center gap-2 text-xs text-neutral-600 hover:text-amber-700 transition-colors font-semibold py-1">
                        <Mail className="w-3.5 h-3.5 shrink-0 text-neutral-400" /> {builderEmail}
                      </a>
                    )}
                    {builderContact && (
                      <a href={`tel:${builderContact}`}
                        className="flex items-center gap-2 text-xs text-neutral-600 hover:text-amber-700 transition-colors font-semibold py-1">
                        <Phone className="w-3.5 h-3.5 shrink-0 text-neutral-400" /> {builderContact}
                      </a>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
