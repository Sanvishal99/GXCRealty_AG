"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search, MapPin, Building2, Lock, ArrowRight,
  Home, SlidersHorizontal, ChevronDown, AlertCircle, RefreshCw,
} from 'lucide-react';
import { getToken } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// ── Gold palette ──────────────────────────────────────────────────────────────
const GOLD      = '#B8860B';
const GOLD_MID  = '#C9A227';
const GOLD_BG   = '#FDF8ED';
const GOLD_CARD = '#FFFDF5';
const BORDER     = 'rgba(180,130,30,0.18)';
const BORDER_MED = 'rgba(180,130,30,0.30)';
const TEXT_DARK  = '#1a1200';
const TEXT_MID   = '#5a4a28';
const TEXT_SOFT  = '#9a8060';
const GOLD_BTN: React.CSSProperties = {
  background: 'linear-gradient(135deg, #D4A843, #C9A227, #A07208)',
  boxShadow: '0 4px 14px rgba(180,130,30,0.28)',
};

// ── Label maps ────────────────────────────────────────────────────────────────
const TYPE_LABEL: Record<string, string> = {
  APARTMENT: 'Apartment', VILLA: 'Villa', PLOT: 'Plot',
  COMMERCIAL: 'Commercial', PENTHOUSE: 'Penthouse', STUDIO: 'Studio',
};
const STAGE_LABEL: Record<string, string> = {
  UNDER_CONSTRUCTION: 'Under Construction', READY_TO_MOVE: 'Ready to Move',
  NEW_LAUNCH: 'New Launch', COMPLETED: 'Completed', UPCOMING: 'Upcoming',
};
const STAGE_DOT: Record<string, string> = {
  UNDER_CONSTRUCTION: '#F59E0B', READY_TO_MOVE: '#10B981',
  NEW_LAUNCH: '#3B82F6', COMPLETED: '#14B8A6', UPCOMING: '#8B5CF6',
};
const TYPE_BG: Record<string, [string, string]> = {
  APARTMENT: ['rgba(245,158,11,0.14)', '#92400E'],
  VILLA:     ['rgba(139,92,246,0.14)', '#5B21B6'],
  PLOT:      ['rgba(16,185,129,0.14)', '#065F46'],
  COMMERCIAL:['rgba(100,116,139,0.14)', '#1E293B'],
  PENTHOUSE: ['rgba(244,63,94,0.14)',  '#9F1239'],
  STUDIO:    ['rgba(6,182,212,0.14)',  '#0E7490'],
};

const BUDGET_OPTIONS = [
  { label: 'Any Budget',  min: 0,        max: 0        },
  { label: 'Under ₹50L',  min: 0,        max: 5000000  },
  { label: '₹50L – ₹1Cr', min: 5000000,  max: 10000000 },
  { label: '₹1Cr – ₹2Cr', min: 10000000, max: 20000000 },
  { label: '₹2Cr – ₹5Cr', min: 20000000, max: 50000000 },
  { label: 'Above ₹5Cr',  min: 50000000, max: 0        },
];

const TYPE_CHIPS = ['ALL', 'APARTMENT', 'VILLA', 'PLOT', 'COMMERCIAL', 'PENTHOUSE'] as const;

function fmt(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

// ── Filter state shape ────────────────────────────────────────────────────────
interface Filters {
  city: string;
  type: string;        // '' = all
  budgetIdx: number;
}

// ── Property Card ─────────────────────────────────────────────────────────────
function PropertyCard({ property, isLoggedIn }: { property: any; isLoggedIn: boolean }) {
  const images: string[] = Array.isArray(property.images)
    ? property.images.filter(Boolean)
    : [];
  const units: any[] = property.units || [];
  const unitLabels = [
    ...new Set(units.map((u: any) => (u.beds ? `${u.beds} BHK` : u.name)).filter(Boolean)),
  ].slice(0, 4) as string[];
  const [bgColor, textColor] = TYPE_BG[property.projectType] ?? ['rgba(180,130,30,0.10)', GOLD_MID];

  return (
    <div
      className="flex flex-col rounded-3xl overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        background: GOLD_CARD,
        border: `1px solid ${BORDER}`,
        boxShadow: '0 2px 16px rgba(180,130,30,0.06)',
      }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden shrink-0" style={{ background: 'rgba(245,230,184,0.3)' }}>
        {images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[0]}
            alt={property.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #F5E6B8 0%, #FDF8ED 100%)' }}
          >
            <Building2 size={36} style={{ color: GOLD, opacity: 0.3 }} />
            <p className="text-xs font-bold" style={{ color: TEXT_SOFT }}>No photos yet</p>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[calc(100%-60px)]">
          {property.projectType && (
            <span
              className="text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-sm"
              style={{ background: bgColor, color: textColor }}
            >
              {TYPE_LABEL[property.projectType] ?? property.projectType}
            </span>
          )}
          {property.projectStage && (
            <span
              className="text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1"
              style={{ background: 'rgba(255,253,245,0.90)', color: TEXT_MID }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
                style={{ background: STAGE_DOT[property.projectStage] ?? '#9ca3af' }}
              />
              {STAGE_LABEL[property.projectStage] ?? property.projectStage}
            </span>
          )}
        </div>

        {property.reraId && (
          <span
            className="absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-sm"
            style={{ background: 'rgba(20,184,166,0.88)', color: '#fff' }}
          >
            RERA ✓
          </span>
        )}

        {images.length > 1 && (
          <span
            className="absolute bottom-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.50)', color: '#fff' }}
          >
            +{images.length - 1} photos
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div>
          <h3 className="font-black text-[15px] leading-snug mb-1.5 line-clamp-2" style={{ color: TEXT_DARK }}>
            {property.title}
          </h3>
          {(property.locality || property.city) && (
            <p className="flex items-center gap-1 text-xs font-semibold" style={{ color: TEXT_SOFT }}>
              <MapPin size={11} className="shrink-0" />
              {[property.locality, property.city, property.state].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        {unitLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {unitLabels.map((u, i) => (
              <span
                key={i}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(180,130,30,0.08)', color: GOLD_MID, border: `1px solid ${BORDER}` }}
              >
                {u}
              </span>
            ))}
          </div>
        )}

        {/* Price gate */}
        <div className="mt-auto pt-1">
          {isLoggedIn ? (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: TEXT_SOFT }}>
                Starting From
              </p>
              <p className="text-lg font-black" style={{ color: GOLD }}>
                {fmt(property.price)}
                {property.maxPrice && property.maxPrice !== property.price && (
                  <span className="text-sm font-semibold ml-1.5" style={{ color: TEXT_SOFT }}>
                    – {fmt(property.maxPrice)}
                  </span>
                )}
              </p>
            </div>
          ) : (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(180,130,30,0.06)', border: `1.5px dashed ${BORDER_MED}` }}
            >
              <Lock size={14} style={{ color: GOLD }} className="shrink-0" />
              <div>
                <p className="text-xs font-black leading-tight" style={{ color: GOLD_MID }}>Login to view price</p>
                <p className="text-[10px] font-medium" style={{ color: TEXT_SOFT }}>Register free to unlock pricing</p>
              </div>
            </div>
          )}
        </div>

        <Link
          href={`/p/${property.id}`}
          className="flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
          style={GOLD_BTN}
        >
          View Details <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-3xl overflow-hidden" style={{ border: `1px solid ${BORDER}`, background: GOLD_CARD }}>
      <div className="aspect-[4/3] animate-pulse" style={{ background: 'rgba(180,130,30,0.08)' }} />
      <div className="p-5 space-y-3">
        <div className="h-4 rounded-full animate-pulse w-3/4" style={{ background: 'rgba(180,130,30,0.08)' }} />
        <div className="h-3 rounded-full animate-pulse w-1/2" style={{ background: 'rgba(180,130,30,0.06)' }} />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-5 w-12 rounded-full animate-pulse" style={{ background: 'rgba(180,130,30,0.06)' }} />
          ))}
        </div>
        <div className="h-12 rounded-2xl animate-pulse" style={{ background: 'rgba(180,130,30,0.06)' }} />
        <div className="h-10 rounded-2xl animate-pulse" style={{ background: 'rgba(180,130,30,0.10)' }} />
      </div>
    </div>
  );
}

// ── Budget select ─────────────────────────────────────────────────────────────
function BudgetSelect({ value, onChange }: { value: number; onChange: (idx: number) => void }) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="appearance-none text-xs font-bold pl-3 pr-7 py-2.5 rounded-xl outline-none cursor-pointer h-full"
        style={{ background: 'rgba(180,130,30,0.06)', color: TEXT_MID, border: `1px solid ${BORDER}` }}
      >
        {BUDGET_OPTIONS.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: TEXT_SOFT }}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BrowsePage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cityInput, setCityInput]   = useState('');          // controlled hero input
  const [filters, setFilters]       = useState<Filters>({ city: '', type: '', budgetIdx: 0 });
  const abortRef                    = useRef<AbortController | null>(null);

  // ── Auth check (client-only) ────────────────────────────────────────────────
  useEffect(() => { setIsLoggedIn(!!getToken()); }, []);

  // ── Fetch whenever filters change — with abort on re-run ───────────────────
  useEffect(() => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(false);

    const params = new URLSearchParams();
    if (filters.city.trim()) params.set('city', filters.city.trim());
    if (filters.type)        params.set('type', filters.type);
    const b = BUDGET_OPTIONS[filters.budgetIdx];
    if (b.max > 0) params.set('maxPrice', String(b.max));
    if (b.min > 0) params.set('minPrice', String(b.min));

    fetch(`${API_BASE}/properties?${params}`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setProperties(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;   // ignore cancelled requests
        setProperties([]);
        setError(true);
        setLoading(false);
      });

    return () => controller.abort();
  }, [filters]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  // Commit city input to filters (triggered by button click or Enter key)
  const commitSearch = () =>
    setFilters(f => ({ ...f, city: cityInput.trim() }));

  // Type chip — updates API filter + immediately re-fetches via useEffect
  const handleTypeChip = (chip: typeof TYPE_CHIPS[number]) =>
    setFilters(f => ({ ...f, type: chip === 'ALL' ? '' : chip }));

  // Budget dropdown — immediate re-fetch via useEffect
  const handleBudget = (idx: number) =>
    setFilters(f => ({ ...f, budgetIdx: idx }));

  // City pill (popular cities)
  const handleCityPill = (city: string) => {
    setCityInput(city);
    setFilters(f => ({ ...f, city }));
  };

  // Clear all
  const clearAll = () => {
    setCityInput('');
    setFilters({ city: '', type: '', budgetIdx: 0 });
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const cities = [...new Set(properties.map(p => p.city).filter(Boolean))].slice(0, 8) as string[];
  const activeChip = (filters.type || 'ALL') as typeof TYPE_CHIPS[number];
  const hasActiveFilters = filters.city || filters.type || filters.budgetIdx > 0;

  return (
    <div
      className="min-h-screen"
      style={{ background: GOLD_BG, color: TEXT_DARK, fontFamily: 'var(--font-outfit, sans-serif)' }}
    >

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: 'rgba(253,248,237,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: BORDER,
          boxShadow: '0 1px 16px rgba(180,130,30,0.08)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={GOLD_BTN}>
              <Home size={16} className="text-white" />
            </div>
            <span className="font-black text-lg hidden sm:block" style={{ color: TEXT_DARK }}>
              GXC<span style={{ color: GOLD }}>Realty</span>
            </span>
          </Link>

          <span
            className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide hidden md:block shrink-0"
            style={{ background: 'rgba(180,130,30,0.10)', color: GOLD }}
          >
            Browse Properties
          </span>

          {/* Inline search bar — desktop only */}
          <div
            className="hidden lg:flex flex-1 items-center gap-2 px-4 py-2 rounded-xl mx-2"
            style={{ background: '#fff', border: `1px solid ${BORDER_MED}` }}
          >
            <Search size={14} style={{ color: TEXT_SOFT }} className="shrink-0" />
            <input
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && commitSearch()}
              placeholder="Search city or locality…"
              className="flex-1 bg-transparent text-sm outline-none min-w-0"
              style={{ color: TEXT_DARK }}
            />
            <button
              onClick={commitSearch}
              className="px-3 py-1 rounded-lg text-xs font-bold text-white shrink-0"
              style={GOLD_BTN}
            >
              Search
            </button>
          </div>

          {/* Auth CTAs */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                style={GOLD_BTN}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-bold border transition-colors hidden sm:block"
                  style={{ borderColor: BORDER_MED, color: TEXT_MID }}
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                  style={GOLD_BTN}
                >
                  Register Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section
        className="px-4 py-14 md:py-20"
        style={{
          background: 'linear-gradient(160deg, #FDF8ED 0%, rgba(245,230,184,0.45) 45%, #FDF8ED 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest"
            style={{ background: 'rgba(180,130,30,0.10)', color: GOLD, border: `1px solid ${BORDER_MED}` }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            Premium Real Estate
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-black leading-[1.1] tracking-tight">
            <span style={{ color: TEXT_DARK }}>Discover Your</span>
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #D4A843 0%, #C9A227 50%, #A07208 100%)' }}
            >
              Dream Property
            </span>
          </h1>

          <p className="text-base md:text-lg font-medium max-w-xl mx-auto" style={{ color: TEXT_MID }}>
            Browse verified premium projects across India.{' '}
            <span style={{ color: TEXT_SOFT }}>Login to unlock pricing, floor plans &amp; builder contact.</span>
          </p>

          {/* Search bar */}
          <div
            className="flex flex-col sm:flex-row gap-2 p-2 rounded-2xl mt-2"
            style={{
              background: '#fff',
              border: `1.5px solid ${BORDER_MED}`,
              boxShadow: '0 8px 32px rgba(180,130,30,0.12)',
            }}
          >
            {/* City input */}
            <div className="flex flex-1 items-center gap-2.5 px-3 py-1">
              <Search size={16} style={{ color: TEXT_SOFT }} className="shrink-0" />
              <input
                value={cityInput}
                onChange={e => setCityInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && commitSearch()}
                placeholder="Enter city or locality…"
                className="flex-1 bg-transparent text-sm font-medium outline-none py-1 min-w-0"
                style={{ color: TEXT_DARK }}
              />
            </div>

            {/* Budget + Search — wraps on mobile */}
            <div className="flex gap-2 px-1 flex-wrap sm:flex-nowrap">
              <BudgetSelect value={filters.budgetIdx} onChange={handleBudget} />
              <button
                onClick={commitSearch}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-black text-white whitespace-nowrap transition-all hover:-translate-y-0.5"
                style={GOLD_BTN}
              >
                Search
              </button>
            </div>
          </div>

          {/* Popular city pills (derived from loaded data) */}
          {cities.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <span className="text-xs font-semibold self-center" style={{ color: TEXT_SOFT }}>Popular:</span>
              {cities.map(city => (
                <button
                  key={city}
                  onClick={() => handleCityPill(city)}
                  className="text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:-translate-y-0.5"
                  style={{
                    background: filters.city === city ? 'rgba(180,130,30,0.16)' : 'rgba(180,130,30,0.08)',
                    color: filters.city === city ? GOLD : TEXT_MID,
                    border: `1px solid ${filters.city === city ? BORDER_MED : BORDER}`,
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <div className="border-y" style={{ borderColor: BORDER, background: 'rgba(255,253,245,0.85)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
          {[
            { icon: '🏠', label: `${properties.length} Properties` },
            { icon: '🌆', label: `${cities.length}+ Cities` },
            { icon: '✅', label: 'RERA Verified' },
            { icon: '🏗️', label: 'Trusted Builders' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 text-xs font-bold" style={{ color: TEXT_MID }}>
              <span className="text-sm">{s.icon}</span>
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32 space-y-6">

        {/* Type filter chips — horizontally scrollable on mobile */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold shrink-0" style={{ color: TEXT_SOFT }}>
            <SlidersHorizontal size={13} />
            <span className="hidden xs:inline">Type:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1" style={{ scrollbarWidth: 'none' }}>
            {TYPE_CHIPS.map(chip => {
              const isActive = activeChip === chip;
              const count = chip === 'ALL'
                ? properties.length
                : properties.filter(p => p.projectType === chip).length;
              return (
                <button
                  key={chip}
                  onClick={() => handleTypeChip(chip)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all hover:-translate-y-0.5 shrink-0"
                  style={
                    isActive
                      ? { ...GOLD_BTN, color: '#fff', border: 'none' }
                      : { background: 'transparent', color: TEXT_MID, borderColor: BORDER }
                  }
                >
                  {chip === 'ALL' ? 'All' : TYPE_LABEL[chip]}
                  <span
                    className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-black"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(180,130,30,0.10)',
                      color: isActive ? '#fff' : TEXT_SOFT,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors"
              style={{ borderColor: BORDER, color: TEXT_SOFT }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Results header */}
        {!loading && !error && (
          <div className="flex items-baseline gap-2">
            <p className="text-base font-black" style={{ color: TEXT_DARK }}>
              {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
              {activeChip !== 'ALL' && ` · ${TYPE_LABEL[activeChip] ?? activeChip}`}
            </p>
            {filters.city && (
              <p className="text-sm font-medium" style={{ color: TEXT_SOFT }}>in &ldquo;{filters.city}&rdquo;</p>
            )}
            {filters.budgetIdx > 0 && (
              <p className="text-sm font-medium" style={{ color: TEXT_SOFT }}>
                · {BUDGET_OPTIONS[filters.budgetIdx].label}
              </p>
            )}
          </div>
        )}

        {/* States: loading / error / empty / grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>

        ) : error ? (
          <div className="text-center py-24 space-y-4">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto"
              style={{ background: 'rgba(180,130,30,0.10)' }}
            >
              <AlertCircle size={28} style={{ color: GOLD }} />
            </div>
            <p className="text-lg font-black" style={{ color: TEXT_DARK }}>Failed to load properties</p>
            <p className="text-sm font-medium" style={{ color: TEXT_SOFT }}>
              Check your connection and try again
            </p>
            <button
              onClick={() => setFilters(f => ({ ...f }))}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              style={GOLD_BTN}
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>

        ) : properties.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="text-5xl">🔍</div>
            <p className="text-xl font-black" style={{ color: TEXT_DARK }}>No properties found</p>
            <p className="text-sm font-medium" style={{ color: TEXT_SOFT }}>
              Try a different city, type, or budget range
            </p>
            <button
              onClick={clearAll}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              style={GOLD_BTN}
            >
              Clear Filters
            </button>
          </div>

        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties
              .filter(p => activeChip === 'ALL' || p.projectType === activeChip)
              .map(p => (
                <PropertyCard key={p.id} property={p} isLoggedIn={isLoggedIn} />
              ))}
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════
          STICKY UNLOCK BANNER
      ══════════════════════════════════════════ */}
      {!isLoggedIn && !loading && properties.length > 0 && (
        <div
          className="fixed bottom-0 inset-x-0 z-40 border-t"
          style={{
            background: 'rgba(253,248,237,0.97)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderColor: BORDER_MED,
            boxShadow: '0 -8px 40px rgba(180,130,30,0.16)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(180,130,30,0.12)', border: `1px solid ${BORDER}` }}
              >
                <Lock size={18} style={{ color: GOLD }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black truncate" style={{ color: TEXT_DARK }}>Unlock Full Property Details</p>
                <p className="text-xs font-medium hidden sm:block" style={{ color: TEXT_SOFT }}>
                  Login to view prices, floor plans &amp; builder contacts
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0 w-full sm:w-auto">
              <Link
                href="/login"
                className="flex-1 sm:flex-none text-center px-4 py-2.5 rounded-xl text-sm font-bold border transition-all"
                style={{ borderColor: BORDER_MED, color: TEXT_MID }}
              >
                Login
              </Link>
              <Link
                href="/login"
                className="flex-1 sm:flex-none text-center px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                style={GOLD_BTN}
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="border-t mt-8 py-8 text-center" style={{ borderColor: BORDER }}>
        <p className="text-xs font-medium" style={{ color: TEXT_SOFT }}>
          © {new Date().getFullYear()}{' '}
          <span className="font-black" style={{ color: GOLD }}>GXCRealty</span>
          {' '}· Exclusive Real Estate Network · All rights reserved
        </p>
      </footer>
    </div>
  );
}
