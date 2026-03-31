"use client";
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';
import { useAppConfig } from '@/context/AppConfigContext';
import { useProperties, Property } from '@/context/PropertyContext';
import { SkeletonPropertiesGrid } from '@/components/Skeleton';
import {
  Search, SlidersHorizontal, X, Building2, MapPin, ChevronDown,
  LayoutGrid, List, Group, ArrowUpDown, Filter, Bed, Bath, Ruler,
  GitCompare, CheckSquare, Square,
} from 'lucide-react';

type GroupMode = 'none' | 'city' | 'builder';
type SortMode = 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

const PROJECT_TYPES = ['Apartment', 'Villa', 'Plot', 'Commercial'];
const PROJECT_STATUSES = ['Upcoming', 'Under Construction', 'Ready to Move'];

const STAGE_LABEL: Record<string, string> = {
  UPCOMING: 'Upcoming',
  UNDER_CONSTRUCTION: 'Under Construction',
  READY_TO_MOVE: 'Ready to Move',
};

// ── Theme constants ────────────────────────────────────────────────────────────
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
const GOLD_BTN_STYLE = {
  background: 'linear-gradient(135deg, #D4A843, #C9A227, #A07208)',
  color: '#fff',
  boxShadow: '0 4px 14px rgba(180,130,30,0.28)',
} as const;

function getLocationStr(p: Property) {
  if (typeof p.location === 'string') return p.location as string;
  return [p.location?.area, p.location?.city, p.location?.state].filter(Boolean).join(', ');
}
function getCityStr(p: Property) {
  if (typeof p.location === 'string') return p.location as string;
  return p.location?.city || 'Unknown City';
}
function getBuilderStr(p: Property) {
  return p.builder?.name || p.companyEmail || 'Unknown Builder';
}
function getMinPrice(p: Property) {
  return Number(p.pricing?.minPrice) || 0;
}
function getMaxPrice(p: Property) {
  return Number(p.pricing?.maxPrice) || 0;
}
function getPossessionDate(p: Property) {
  const d = p.possessionDate;
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

interface FilterState {
  search: string;
  types: string[];
  statuses: string[];
  cities: string[];
  builders: string[];
  minPrice: string;
  maxPrice: string;
  minBeds: string;
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
      style={{ background: 'rgba(212,168,67,0.12)', color: GOLD_DARK, borderColor: BORDER_MID }}
    >
      {label}
      <button onClick={onRemove} className="transition-colors" style={{ color: GOLD_DARK }}>
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ── Compare Checkbox ──────────────────────────────────────────────────────────
function CompareCheckbox({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled: boolean }) {
  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); onChange(); }}
      disabled={disabled && !checked}
      title={disabled && !checked ? 'Max 3 properties' : checked ? 'Remove from compare' : 'Add to compare'}
      className={`absolute top-3 right-3 z-20 p-1 rounded-lg transition-all shadow-sm backdrop-blur-sm ${
        disabled && !checked
          ? 'bg-white/30 text-white/40 border border-white/20 cursor-not-allowed'
          : !checked
          ? 'bg-white/80 border border-neutral-200 hover:bg-amber-50'
          : ''
      }`}
      style={checked
        ? { background: GOLD, color: '#fff', borderColor: GOLD, border: `1px solid ${GOLD}` }
        : (!disabled ? { color: TEXT_SOFT } : undefined)
      }
    >
      {checked
        ? <CheckSquare className="w-4 h-4" />
        : <Square className="w-4 h-4" />
      }
    </button>
  );
}

// ── Property Card ─────────────────────────────────────────────────────────────
function PropertyCard({
  prop,
  formatCurrency,
  isSelected,
  onToggleCompare,
  compareDisabled,
}: {
  prop: Property;
  formatCurrency: (n: number) => string;
  isSelected: boolean;
  onToggleCompare: () => void;
  compareDisabled: boolean;
}) {
  const locationStr = getLocationStr(prop);
  const minPrice = getMinPrice(prop);
  const firstUnit = prop.units?.[0];

  const statusColor: Record<string, string> = {
    'Upcoming': 'bg-amber-100 text-amber-700 border-amber-200',
    'Under Construction': 'bg-blue-100 text-blue-700 border-blue-200',
    'Ready to Move': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  return (
    <div className="relative">
      {/* Compare checkbox */}
      <CompareCheckbox
        checked={isSelected}
        onChange={onToggleCompare}
        disabled={compareDisabled}
      />
      <Link href={`/properties/${prop.id}`}
        className={`border rounded-2xl overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-200/60 hover:border-amber-300 transition-all duration-300 flex flex-col ${
          isSelected ? '' : 'border-neutral-200'
        }`}
        style={{
          background: IVORY,
          ...(isSelected ? { borderColor: GOLD, boxShadow: '0 0 0 2px rgba(201,162,39,0.20)' } : {}),
        }}
      >
        {/* Image / Gradient Hero */}
        <div className={`h-48 bg-gradient-to-br ${prop.gradient || 'from-indigo-500 to-purple-600'} relative overflow-hidden shrink-0`}>
          {prop.images?.[0] ? (
            <img src={prop.images[0]} alt={prop.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[80px] opacity-20 select-none group-hover:scale-110 transition-transform duration-700">
              {prop.emoji || '🏢'}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${prop.projectType === 'Villa' ? 'bg-purple-100 text-purple-700 border-purple-200' : prop.projectType === 'Plot' ? 'bg-amber-100 text-amber-700 border-amber-200' : prop.projectType === 'Commercial' ? 'bg-rose-100 text-rose-700 border-rose-200' : ''}`}
              style={(!prop.projectType || prop.projectType === 'Apartment') ? { background: 'rgba(212,168,67,0.10)', color: GOLD_DARK, borderColor: BORDER } : undefined}
            >
              {prop.projectType || 'Apartment'}
            </span>
            {prop.projectStage && (
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${statusColor[prop.projectStage] || 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>
                {prop.projectStage}
              </span>
            )}
          </div>
          {/* Price */}
          <div className="absolute bottom-3 left-3 z-10">
            <p className="text-lg font-black text-white drop-shadow-lg">
              {minPrice > 0 ? formatCurrency(minPrice) : 'Price on Request'}
            </p>
          </div>
          {prop.settings?.featured && (
            <div className="absolute top-3 right-10 z-10 bg-amber-400 text-amber-900 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wide border border-amber-300">
              ⭐ Featured
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-black text-base group-hover:text-amber-700 transition-colors leading-tight mb-1 truncate" style={{ color: TEXT_DARK }}>{prop.name}</h3>
          <p className="text-xs flex items-center gap-1 mb-3 font-medium" style={{ color: TEXT_SOFT }}>
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{locationStr || 'Location TBA'}</span>
          </p>

          {/* Unit Specs */}
          {firstUnit && (
            <div className="flex gap-3 mb-3">
              {firstUnit.beds > 0 && (
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: TEXT_SOFT }}>
                  <Bed className="w-3.5 h-3.5" /> {firstUnit.beds} Beds
                </div>
              )}
              {firstUnit.baths > 0 && (
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: TEXT_SOFT }}>
                  <Bath className="w-3.5 h-3.5" /> {firstUnit.baths} Baths
                </div>
              )}
              {firstUnit.carpetArea > 0 && (
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: TEXT_SOFT }}>
                  <Ruler className="w-3.5 h-3.5" /> {firstUnit.carpetArea} sqft
                </div>
              )}
            </div>
          )}

          {/* Units available */}
          {prop.units?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {prop.units.slice(0, 3).map(u => (
                <span key={u.id} className="px-2 py-0.5 rounded-md text-[10px] font-bold border" style={{ background: IVORY_BG, borderColor: BORDER, color: TEXT_MID }}>
                  {u.name}
                </span>
              ))}
              {prop.units.length > 3 && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border" style={{ background: IVORY_BG, borderColor: BORDER, color: TEXT_SOFT }}>
                  +{prop.units.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="mt-auto pt-3 border-t flex items-center justify-between" style={{ borderColor: BORDER }}>
            <div className="text-xs font-semibold" style={{ color: TEXT_SOFT }}>
              {prop.builder?.name ? `by ${prop.builder.name}` : prop.companyEmail}
            </div>
            {prop.reraId && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-[9px] font-black text-emerald-700 uppercase">
                RERA: {prop.reraId}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

// ── Compare Overlay ───────────────────────────────────────────────────────────
function CompareOverlay({
  properties,
  formatCurrency,
  onClose,
}: {
  properties: Property[];
  formatCurrency: (n: number) => string;
  onClose: () => void;
}) {
  const rows: Array<{ label: string; getValue: (p: Property) => string }> = [
    { label: 'Property Name', getValue: p => p.name || p.title || '—' },
    { label: 'Location',      getValue: p => getLocationStr(p) || '—' },
    { label: 'Price',         getValue: p => {
        const min = getMinPrice(p);
        const max = getMaxPrice(p);
        if (!min) return 'Price on Request';
        if (max && max !== min) return `${formatCurrency(min)} – ${formatCurrency(max)}`;
        return formatCurrency(min);
      },
    },
    { label: 'Type',          getValue: p => p.projectType || '—' },
    { label: 'Stage',         getValue: p => STAGE_LABEL[p.projectStage || ''] || p.projectStage || '—' },
    { label: 'Possession',    getValue: p => getPossessionDate(p) },
    { label: 'Units',         getValue: p => p.units?.length ? `${p.units.length} config${p.units.length !== 1 ? 's' : ''}` : '—' },
    { label: 'Amenities',     getValue: p => {
        const amenities = Array.isArray(p.amenities)
          ? p.amenities
          : typeof p.amenities === 'object' && p.amenities !== null
          ? [
              ...((p.amenities as any).common || []),
              ...((p.amenities as any).lifestyle || []),
              ...((p.amenities as any).premium || []),
            ]
          : [];
        return amenities.length ? `${amenities.length} amenities` : '—';
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col backdrop-blur-md" style={{ background: 'rgba(253,248,237,0.97)' }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between shadow-sm border-b" style={{ background: IVORY, borderColor: BORDER }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl border" style={{ background: 'rgba(212,168,67,0.10)', borderColor: BORDER }}>
            <GitCompare className="w-5 h-5" style={{ color: GOLD }} />
          </div>
          <div>
            <h2 className="text-lg font-black" style={{ color: TEXT_DARK }}>Property Comparison</h2>
            <p className="text-xs font-medium" style={{ color: TEXT_SOFT }}>Comparing {properties.length} properties side by side</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 rounded-xl bg-neutral-100 hover:bg-amber-50 text-neutral-600 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-5xl mx-auto">

          {/* Property Header Row */}
          <div className="grid gap-4 mb-2" style={{ gridTemplateColumns: `180px repeat(${properties.length}, 1fr)` }}>
            <div /> {/* spacer */}
            {properties.map((p, i) => (
              <div key={p.id} className="rounded-2xl p-4 text-center border-2" style={{ background: IVORY, borderColor: BORDER_MID }}>
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-white font-black text-xl"
                  style={{ background: 'linear-gradient(135deg, #D4A843, #A07208)' }}
                >
                  {(p.name || p.title || 'P').charAt(0).toUpperCase()}
                </div>
                <p className="font-black text-sm leading-tight" style={{ color: TEXT_DARK }}>{p.name || p.title}</p>
                <p className="text-[10px] font-semibold mt-1 truncate" style={{ color: TEXT_SOFT }}>{getCityStr(p)}</p>
              </div>
            ))}
          </div>

          {/* Data Rows */}
          <div className="space-y-2">
            {rows.map((row, ri) => (
              <div
                key={row.label}
                className="grid gap-4 rounded-2xl overflow-hidden"
                style={{
                  gridTemplateColumns: `180px repeat(${properties.length}, 1fr)`,
                  ...(ri % 2 === 0
                    ? { background: IVORY, border: `1px solid ${BORDER}` }
                    : { background: 'rgba(212,168,67,0.04)' }),
                }}
              >
                {/* Row label */}
                <div className="px-4 py-4 flex items-center">
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: TEXT_SOFT }}>{row.label}</span>
                </div>
                {/* Values */}
                {properties.map((p, i) => (
                  <div key={p.id} className="px-4 py-4 flex items-center">
                    <span
                      className="font-bold text-sm"
                      style={row.label === 'Price' ? { color: GOLD_DARK } : { color: TEXT_DARK }}
                    >
                      {row.getValue(p)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* View Detail links */}
          <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: `180px repeat(${properties.length}, 1fr)` }}>
            <div />
            {properties.map((p, i) => (
              <Link
                key={p.id}
                href={`/properties/${p.id}`}
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm transition-all"
                style={{ background: 'linear-gradient(135deg, #D4A843, #A07208)', color: '#fff' }}
              >
                View Details →
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PropertiesPage() {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { formatCurrency } = useCurrency();
  const { config } = useAppConfig();

  const approvedProperties = properties.filter(p => p.status === 'AVAILABLE');

  // Derive dynamic filter options from data
  const allCities = useMemo(() => [...new Set(approvedProperties.map(getCityStr).filter(Boolean))].sort(), [approvedProperties]);
  const allBuilders = useMemo(() => [...new Set(approvedProperties.map(getBuilderStr).filter(Boolean))].sort(), [approvedProperties]);

  const [filters, setFilters] = useState<FilterState>({
    search: '', types: [], statuses: [], cities: [], builders: [], minPrice: '', maxPrice: '', minBeds: ''
  });
  const [groupMode, setGroupMode] = useState<GroupMode>('none');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Comparison state
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  };

  const compareProperties = useMemo(
    () => approvedProperties.filter(p => compareIds.includes(p.id)),
    [approvedProperties, compareIds]
  );

  const toggleFilter = (key: 'types' | 'statuses' | 'cities' | 'builders', val: string) => {
    setFilters(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val]
    }));
  };

  const clearAll = () => setFilters({ search: '', types: [], statuses: [], cities: [], builders: [], minPrice: '', maxPrice: '', minBeds: '' });

  const activeFilterCount = filters.types.length + filters.statuses.length + filters.cities.length + filters.builders.length + (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0) + (filters.minBeds ? 1 : 0);

  const filtered = useMemo(() => {
    let result = [...approvedProperties];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        getLocationStr(p).toLowerCase().includes(q) ||
        p.builder?.name?.toLowerCase().includes(q) ||
        p.reraId?.toLowerCase().includes(q)
      );
    }
    if (filters.types.length) result = result.filter(p => filters.types.includes(p.projectType));
    if (filters.statuses.length) result = result.filter(p => filters.statuses.includes(p.projectStage));
    if (filters.cities.length) result = result.filter(p => filters.cities.includes(getCityStr(p)));
    if (filters.builders.length) result = result.filter(p => filters.builders.includes(getBuilderStr(p)));
    if (filters.minPrice) result = result.filter(p => getMinPrice(p) >= Number(filters.minPrice));
    if (filters.maxPrice) result = result.filter(p => getMinPrice(p) <= Number(filters.maxPrice));
    if (filters.minBeds) result = result.filter(p => (p.units?.[0]?.beds || 0) >= Number(filters.minBeds));

    result.sort((a, b) => {
      if (sortMode === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      if (sortMode === 'price_asc') return getMinPrice(a) - getMinPrice(b);
      if (sortMode === 'price_desc') return getMinPrice(b) - getMinPrice(a);
      if (sortMode === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

    return result;
  }, [approvedProperties, filters, sortMode]);

  // Grouped output
  const grouped = useMemo(() => {
    if (groupMode === 'none') return { 'All Properties': filtered };
    const map: Record<string, Property[]> = {};
    filtered.forEach(p => {
      const key = groupMode === 'city' ? getCityStr(p) : getBuilderStr(p);
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [filtered, groupMode]);

  const totalVolume = approvedProperties.reduce((acc, p) => acc + getMinPrice(p), 0);

  if (propertiesLoading) return (
    <div className="p-6 md:p-8 w-full max-w-7xl mx-auto">
      <SkeletonPropertiesGrid />
    </div>
  );

  return (
    <div className="p-6 md:p-8 w-full min-h-screen" style={{ background: IVORY_BG, color: TEXT_DARK }}>

      {/* Compare Overlay */}
      {showCompare && compareProperties.length > 0 && (
        <CompareOverlay
          properties={compareProperties}
          formatCurrency={formatCurrency}
          onClose={() => setShowCompare(false)}
        />
      )}

      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border" style={{ background: 'rgba(212,168,67,0.08)', borderColor: BORDER }}>
            <Building2 className="w-4 h-4" style={{ color: GOLD }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>Premium Portfolio</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-1" style={{ color: TEXT_DARK }}>
            Property <span style={{ color: GOLD }}>Marketplace</span>
          </h1>
          <p className="font-medium" style={{ color: TEXT_SOFT }}>{config?.properties?.pageSubtitle || 'Browse verified real estate listings.'}</p>
        </div>
        {/* Stats strip */}
        <div className="flex gap-3 shrink-0">
          {[
            { label: 'Listed', value: approvedProperties.length },
            { label: 'Cities', value: allCities.length },
            { label: 'Portfolio Vol.', value: totalVolume > 0 ? formatCurrency(totalVolume) : '—' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl px-5 py-3 text-center shadow-sm border" style={{ background: IVORY, borderColor: BORDER }}>
              <p className="text-xl font-black" style={{ color: GOLD_DARK }}>{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_SOFT }}>{s.label}</p>
            </div>
          ))}
        </div>
      </header>

      {/* Controls Bar */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: TEXT_SOFT }} />
          <input
            type="text" placeholder="Search by name, city, builder, RERA..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 transition-all border"
            style={{ background: IVORY, borderColor: BORDER, color: TEXT_DARK }}
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all"
          style={showFilters
            ? { ...GOLD_BTN_STYLE, border: 'none' }
            : { background: IVORY, borderColor: BORDER, color: TEXT_MID, border: `1px solid ${BORDER}` }
          }
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-white/30 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
          )}
        </button>

        {/* Group By */}
        <div className="relative">
          <select
            value={groupMode}
            onChange={e => setGroupMode(e.target.value as GroupMode)}
            className="appearance-none rounded-xl pl-9 pr-8 py-2.5 text-sm font-bold cursor-pointer focus:outline-none focus:ring-2 transition-all border"
            style={{ background: IVORY, borderColor: BORDER, color: TEXT_DARK }}
          >
            <option value="none">No Grouping</option>
            <option value="city">Group by City</option>
            <option value="builder">Group by Builder</option>
          </select>
          <Group className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: TEXT_SOFT }} />
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: TEXT_SOFT }} />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value as SortMode)}
            className="appearance-none rounded-xl pl-9 pr-8 py-2.5 text-sm font-bold cursor-pointer focus:outline-none focus:ring-2 transition-all border"
            style={{ background: IVORY, borderColor: BORDER, color: TEXT_DARK }}
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="name_asc">Name A–Z</option>
          </select>
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: TEXT_SOFT }} />
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: TEXT_SOFT }} />
        </div>

        {/* View Mode */}
        <div className="flex rounded-xl overflow-hidden shadow-sm border" style={{ background: IVORY, borderColor: BORDER }}>
          <button
            onClick={() => setViewMode('grid')}
            className="p-2.5 transition-all"
            style={viewMode === 'grid' ? GOLD_BTN_STYLE : { color: TEXT_SOFT }}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="p-2.5 transition-all"
            style={viewMode === 'list' ? GOLD_BTN_STYLE : { color: TEXT_SOFT }}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-2xl p-6 mb-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 border" style={{ background: IVORY, borderColor: BORDER }}>
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-black flex items-center gap-2" style={{ color: TEXT_DARK }}>
              <Filter className="w-4 h-4" style={{ color: GOLD }} /> Advanced Filters
            </h3>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1">
                <X className="w-3 h-3" /> Clear All ({activeFilterCount})
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Project Type */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest mb-2 block" style={{ color: TEXT_SOFT }}>Project Type</label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_TYPES.map(t => (
                  <button key={t} onClick={() => toggleFilter('types', t)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                    style={filters.types.includes(t)
                      ? GOLD_BTN_STYLE
                      : { background: IVORY_BG, color: TEXT_MID, borderColor: BORDER }
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {/* Status */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest mb-2 block" style={{ color: TEXT_SOFT }}>Project Status</label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_STATUSES.map(s => (
                  <button key={s} onClick={() => toggleFilter('statuses', s)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                    style={filters.statuses.includes(s)
                      ? GOLD_BTN_STYLE
                      : { background: IVORY_BG, color: TEXT_MID, borderColor: BORDER }
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {/* Min Beds */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest mb-2 block" style={{ color: TEXT_SOFT }}>Min. Bedrooms</label>
              <div className="flex gap-2">
                {['1', '2', '3', '4', '5'].map(n => (
                  <button key={n} onClick={() => setFilters(f => ({ ...f, minBeds: f.minBeds === n ? '' : n }))}
                    className="w-10 h-9 rounded-lg text-xs font-black border transition-all"
                    style={filters.minBeds === n
                      ? GOLD_BTN_STYLE
                      : { background: IVORY_BG, color: TEXT_MID, borderColor: BORDER }
                    }
                  >
                    {n}+
                  </button>
                ))}
              </div>
            </div>
            {/* Price Range */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest mb-2 block" style={{ color: TEXT_SOFT }}>Min Price (₹)</label>
              <input type="number" placeholder="e.g. 5000000" value={filters.minPrice}
                onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 border"
                style={{ background: IVORY_BG, borderColor: BORDER, color: TEXT_DARK }}
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest mb-2 block" style={{ color: TEXT_SOFT }}>Max Price (₹)</label>
              <input type="number" placeholder="e.g. 50000000" value={filters.maxPrice}
                onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 border"
                style={{ background: IVORY_BG, borderColor: BORDER, color: TEXT_DARK }}
              />
            </div>
            {/* City */}
            {allCities.length > 0 && (
              <div>
                <label className="text-xs font-black uppercase tracking-widest mb-2 block" style={{ color: TEXT_SOFT }}>City</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {allCities.map(c => (
                    <button key={c} onClick={() => toggleFilter('cities', c)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                      style={filters.cities.includes(c)
                        ? GOLD_BTN_STYLE
                        : { background: IVORY_BG, color: TEXT_MID, borderColor: BORDER }
                      }
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Builder */}
            {allBuilders.length > 0 && (
              <div>
                <label className="text-xs font-black uppercase tracking-widest mb-2 block" style={{ color: TEXT_SOFT }}>Builder / Developer</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {allBuilders.map(b => (
                    <button key={b} onClick={() => toggleFilter('builders', b)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                      style={filters.builders.includes(b)
                        ? GOLD_BTN_STYLE
                        : { background: IVORY_BG, color: TEXT_MID, borderColor: BORDER }
                      }
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {filters.types.map(t => <FilterChip key={t} label={`Type: ${t}`} onRemove={() => toggleFilter('types', t)} />)}
          {filters.statuses.map(s => <FilterChip key={s} label={`Status: ${s}`} onRemove={() => toggleFilter('statuses', s)} />)}
          {filters.cities.map(c => <FilterChip key={c} label={`City: ${c}`} onRemove={() => toggleFilter('cities', c)} />)}
          {filters.builders.map(b => <FilterChip key={b} label={`Builder: ${b}`} onRemove={() => toggleFilter('builders', b)} />)}
          {filters.minPrice && <FilterChip label={`Min: ₹${Number(filters.minPrice).toLocaleString()}`} onRemove={() => setFilters(f => ({ ...f, minPrice: '' }))} />}
          {filters.maxPrice && <FilterChip label={`Max: ₹${Number(filters.maxPrice).toLocaleString()}`} onRemove={() => setFilters(f => ({ ...f, maxPrice: '' }))} />}
          {filters.minBeds && <FilterChip label={`${filters.minBeds}+ Beds`} onRemove={() => setFilters(f => ({ ...f, minBeds: '' }))} />}
        </div>
      )}

      {/* Results Summary */}
      <p className="text-sm font-semibold mb-5" style={{ color: TEXT_SOFT }}>
        Showing <span className="font-black" style={{ color: TEXT_DARK }}>{filtered.length}</span> of {approvedProperties.length} properties
        {groupMode !== 'none' && <span> · Grouped by <span className="font-black" style={{ color: GOLD }}>{groupMode === 'city' ? 'City' : 'Builder'}</span></span>}
        {compareIds.length > 0 && (
          <span className="ml-3 font-black" style={{ color: GOLD }}>
            · {compareIds.length} selected for compare
          </span>
        )}
      </p>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="border border-dashed rounded-3xl p-16 text-center" style={{ background: IVORY, borderColor: BORDER_MID }}>
          <div className="text-5xl mb-4">🏘️</div>
          <h3 className="text-xl font-black mb-2" style={{ color: TEXT_DARK }}>No Properties Found</h3>
          <p className="font-medium mb-4" style={{ color: TEXT_SOFT }}>Try adjusting your filters or broaden your search.</p>
          <button onClick={clearAll} className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all" style={GOLD_BTN_STYLE}>
            Clear All Filters
          </button>
        </div>
      )}

      {/* Property Groups */}
      {Object.entries(grouped).map(([groupKey, props]) => (
        <div key={groupKey} className="mb-10">
          {groupMode !== 'none' && (
            <div className="flex items-center gap-3 mb-5">
              <div className="w-2 h-6 rounded-full" style={{ background: GOLD }} />
              <h2 className="text-lg font-black" style={{ color: TEXT_DARK }}>{groupKey}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black border" style={{ background: 'rgba(212,168,67,0.10)', color: GOLD_DARK, borderColor: BORDER }}>
                {props.length}
              </span>
              <div className="flex-1 h-px" style={{ background: BORDER }} />
            </div>
          )}

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {props.map(prop => (
                <PropertyCard
                  key={prop.id}
                  prop={prop}
                  formatCurrency={formatCurrency}
                  isSelected={compareIds.includes(prop.id)}
                  onToggleCompare={() => toggleCompare(prop.id)}
                  compareDisabled={compareIds.length >= 3}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {props.map(prop => (
                <div key={prop.id} className="relative">
                  {/* Compare checkbox for list view */}
                  <button
                    onClick={e => { e.preventDefault(); toggleCompare(prop.id); }}
                    disabled={compareIds.length >= 3 && !compareIds.includes(prop.id)}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-lg transition-all ${
                      compareIds.includes(prop.id)
                        ? ''
                        : compareIds.length >= 3
                        ? 'opacity-30 cursor-not-allowed border'
                        : 'border hover:text-amber-700'
                    }`}
                    style={compareIds.includes(prop.id)
                      ? { background: GOLD, color: '#fff' }
                      : compareIds.length >= 3
                      ? { background: IVORY, borderColor: BORDER, color: TEXT_SOFT }
                      : { background: IVORY, borderColor: BORDER, color: TEXT_SOFT }
                    }
                    title={compareIds.includes(prop.id) ? 'Remove' : compareIds.length >= 3 ? 'Max 3' : 'Compare'}
                  >
                    {compareIds.includes(prop.id) ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  </button>
                  <Link href={`/properties/${prop.id}`}
                    className={`rounded-2xl p-4 flex items-center gap-5 group hover:shadow-md transition-all pl-12 border`}
                    style={{
                      background: IVORY,
                      borderColor: compareIds.includes(prop.id) ? GOLD : BORDER,
                      ...(compareIds.includes(prop.id) ? { boxShadow: '0 0 0 1px rgba(201,162,39,0.20)' } : {}),
                    }}
                  >
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background: `linear-gradient(135deg, #D4A843, #A07208)` }}
                    >
                      {prop.emoji || '🏢'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black group-hover:text-amber-700 transition-colors truncate" style={{ color: TEXT_DARK }}>{prop.name}</h3>
                      <p className="text-xs flex items-center gap-1 mt-0.5 font-medium" style={{ color: TEXT_SOFT }}>
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{getLocationStr(prop)}</span>
                      </p>
                      <div className="flex gap-2 mt-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[10px] font-black">{prop.projectType}</span>
                        {prop.projectStage && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black" style={{ background: 'rgba(212,168,67,0.10)', color: GOLD_DARK }}>
                            {prop.projectStage}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black" style={{ color: TEXT_DARK }}>{getMinPrice(prop) > 0 ? formatCurrency(getMinPrice(prop)) : 'POR'}</p>
                      {prop.units?.[0]?.beds > 0 && <p className="text-xs font-medium" style={{ color: TEXT_SOFT }}>{prop.units[0].beds} BHK</p>}
                      <p className="text-xs font-semibold mt-0.5" style={{ color: TEXT_SOFT }}>{prop.builder?.name || '—'}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* ── Floating Comparison Bar ── */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-3rem)] max-w-2xl animate-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl shadow-2xl shadow-neutral-900/20 p-4 flex items-center gap-4 border" style={{ background: IVORY, borderColor: BORDER }}>
            {/* Selected names */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <GitCompare className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
              <div className="flex flex-wrap gap-1.5 min-w-0">
                {compareProperties.map(p => (
                  <span key={p.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border" style={{ background: 'rgba(212,168,67,0.10)', borderColor: BORDER, color: GOLD_DARK }}>
                    <span className="truncate max-w-[100px]">{p.name || p.title}</span>
                    <button
                      onClick={() => toggleCompare(p.id)}
                      className="ml-0.5 transition-colors"
                      style={{ color: GOLD_DARK }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {compareIds.length < 3 && (
                  <span className="px-2.5 py-1 rounded-lg border border-dashed text-xs font-semibold" style={{ borderColor: BORDER, color: TEXT_SOFT }}>
                    + add more (max 3)
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setCompareIds([])}
                className="px-3 py-2 rounded-xl text-xs font-bold hover:bg-amber-50 transition-all"
                style={{ color: TEXT_SOFT }}
              >
                Clear
              </button>
              <button
                onClick={() => setShowCompare(true)}
                disabled={compareIds.length < 2}
                className="px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                style={GOLD_BTN_STYLE}
              >
                <GitCompare className="w-4 h-4" />
                Compare Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
