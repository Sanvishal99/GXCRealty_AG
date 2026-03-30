"use client";
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';
import { useAppConfig } from '@/context/AppConfigContext';
import { useProperties, Property } from '@/context/PropertyContext';
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
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200">
      {label}
      <button onClick={onRemove} className="hover:text-indigo-900 transition-colors">
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
        checked
          ? 'bg-indigo-600 text-white border border-indigo-500'
          : disabled
          ? 'bg-white/30 text-white/40 border border-white/20 cursor-not-allowed'
          : 'bg-white/80 text-neutral-600 border border-neutral-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300'
      }`}
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
        className={`bg-white border rounded-2xl overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-200/60 hover:border-indigo-200 transition-all duration-300 flex flex-col ${
          isSelected ? 'border-indigo-400 ring-2 ring-indigo-500/20' : 'border-neutral-200'
        }`}
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
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${prop.projectType === 'Villa' ? 'bg-purple-100 text-purple-700 border-purple-200' : prop.projectType === 'Plot' ? 'bg-amber-100 text-amber-700 border-amber-200' : prop.projectType === 'Commercial' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
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
          <h3 className="font-black text-neutral-900 text-base group-hover:text-indigo-600 transition-colors leading-tight mb-1 truncate">{prop.name}</h3>
          <p className="text-xs text-neutral-500 flex items-center gap-1 mb-3 font-medium">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{locationStr || 'Location TBA'}</span>
          </p>

          {/* Unit Specs */}
          {firstUnit && (
            <div className="flex gap-3 mb-3">
              {firstUnit.beds > 0 && (
                <div className="flex items-center gap-1 text-xs text-neutral-500 font-semibold">
                  <Bed className="w-3.5 h-3.5" /> {firstUnit.beds} Beds
                </div>
              )}
              {firstUnit.baths > 0 && (
                <div className="flex items-center gap-1 text-xs text-neutral-500 font-semibold">
                  <Bath className="w-3.5 h-3.5" /> {firstUnit.baths} Baths
                </div>
              )}
              {firstUnit.carpetArea > 0 && (
                <div className="flex items-center gap-1 text-xs text-neutral-500 font-semibold">
                  <Ruler className="w-3.5 h-3.5" /> {firstUnit.carpetArea} sqft
                </div>
              )}
            </div>
          )}

          {/* Units available */}
          {prop.units?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {prop.units.slice(0, 3).map(u => (
                <span key={u.id} className="px-2 py-0.5 rounded-md bg-neutral-50 border border-neutral-200 text-[10px] font-bold text-neutral-600">
                  {u.name}
                </span>
              ))}
              {prop.units.length > 3 && (
                <span className="px-2 py-0.5 rounded-md bg-neutral-50 border border-neutral-200 text-[10px] font-bold text-neutral-400">
                  +{prop.units.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="mt-auto pt-3 border-t border-neutral-100 flex items-center justify-between">
            <div className="text-xs text-neutral-500 font-semibold">
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

  const colColors = ['indigo', 'purple', 'emerald'];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-50/95 backdrop-blur-md">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100">
            <GitCompare className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-black text-neutral-900">Property Comparison</h2>
            <p className="text-xs text-neutral-500 font-medium">Comparing {properties.length} properties side by side</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-all"
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
              <div key={p.id} className={`bg-white border-2 rounded-2xl p-4 text-center border-${colColors[i]}-200`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.gradient || (i === 0 ? 'from-indigo-500 to-purple-600' : i === 1 ? 'from-purple-500 to-pink-600' : 'from-emerald-500 to-teal-600')} mx-auto mb-3 flex items-center justify-center text-white font-black text-xl`}>
                  {(p.name || p.title || 'P').charAt(0).toUpperCase()}
                </div>
                <p className="font-black text-neutral-900 text-sm leading-tight">{p.name || p.title}</p>
                <p className="text-[10px] text-neutral-400 font-semibold mt-1 truncate">{getCityStr(p)}</p>
              </div>
            ))}
          </div>

          {/* Data Rows */}
          <div className="space-y-2">
            {rows.map((row, ri) => (
              <div
                key={row.label}
                className={`grid gap-4 rounded-2xl overflow-hidden ${ri % 2 === 0 ? 'bg-white border border-neutral-100' : 'bg-neutral-50/70'}`}
                style={{ gridTemplateColumns: `180px repeat(${properties.length}, 1fr)` }}
              >
                {/* Row label */}
                <div className="px-4 py-4 flex items-center">
                  <span className="text-xs font-black text-neutral-500 uppercase tracking-widest">{row.label}</span>
                </div>
                {/* Values */}
                {properties.map((p, i) => (
                  <div key={p.id} className="px-4 py-4 flex items-center">
                    <span className={`font-bold text-sm ${
                      row.label === 'Price' ? `text-${colColors[i]}-700` : 'text-neutral-800'
                    }`}>
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
                className={`flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm transition-all bg-${colColors[i]}-600 text-white hover:bg-${colColors[i]}-700`}
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
  const { properties } = useProperties();
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

  return (
    <div className="p-6 md:p-8 w-full text-neutral-900 min-h-screen bg-[#fafafa]">

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
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Premium Portfolio</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-1">
            Property <span className="text-indigo-600">Marketplace</span>
          </h1>
          <p className="text-neutral-500 font-medium">{config?.properties?.pageSubtitle || 'Browse verified real estate listings.'}</p>
        </div>
        {/* Stats strip */}
        <div className="flex gap-3 shrink-0">
          {[
            { label: 'Listed', value: approvedProperties.length, color: 'text-indigo-600' },
            { label: 'Cities', value: allCities.length, color: 'text-emerald-600' },
            { label: 'Portfolio Vol.', value: totalVolume > 0 ? formatCurrency(totalVolume) : '—', color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-neutral-200 rounded-2xl px-5 py-3 text-center shadow-sm">
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </header>

      {/* Controls Bar */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text" placeholder="Search by name, city, builder, RERA..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="w-full bg-white border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${showFilters ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-white border-neutral-200 text-neutral-700 hover:border-indigo-300'}`}
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
            className="appearance-none bg-white border border-neutral-200 rounded-xl pl-9 pr-8 py-2.5 text-sm font-bold text-neutral-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            <option value="none">No Grouping</option>
            <option value="city">Group by City</option>
            <option value="builder">Group by Builder</option>
          </select>
          <Group className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value as SortMode)}
            className="appearance-none bg-white border border-neutral-200 rounded-xl pl-9 pr-8 py-2.5 text-sm font-bold text-neutral-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="name_asc">Name A–Z</option>
          </select>
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
        </div>

        {/* View Mode */}
        <div className="flex bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-neutral-700'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2.5 transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-neutral-700'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 mb-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-black text-neutral-800 flex items-center gap-2"><Filter className="w-4 h-4 text-indigo-500" /> Advanced Filters</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1">
                <X className="w-3 h-3" /> Clear All ({activeFilterCount})
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Project Type */}
            <div>
              <label className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-2 block">Project Type</label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_TYPES.map(t => (
                  <button key={t} onClick={() => toggleFilter('types', t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${filters.types.includes(t) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-neutral-600 border-neutral-200 hover:border-indigo-300'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {/* Status */}
            <div>
              <label className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-2 block">Project Status</label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_STATUSES.map(s => (
                  <button key={s} onClick={() => toggleFilter('statuses', s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${filters.statuses.includes(s) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-neutral-600 border-neutral-200 hover:border-indigo-300'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {/* Min Beds */}
            <div>
              <label className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-2 block">Min. Bedrooms</label>
              <div className="flex gap-2">
                {['1', '2', '3', '4', '5'].map(n => (
                  <button key={n} onClick={() => setFilters(f => ({ ...f, minBeds: f.minBeds === n ? '' : n }))}
                    className={`w-10 h-9 rounded-lg text-xs font-black border transition-all ${filters.minBeds === n ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-neutral-600 border-neutral-200 hover:border-indigo-300'}`}>
                    {n}+
                  </button>
                ))}
              </div>
            </div>
            {/* Price Range */}
            <div>
              <label className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-2 block">Min Price (₹)</label>
              <input type="number" placeholder="e.g. 5000000" value={filters.minPrice}
                onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-2 block">Max Price (₹)</label>
              <input type="number" placeholder="e.g. 50000000" value={filters.maxPrice}
                onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            {/* City */}
            {allCities.length > 0 && (
              <div>
                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-2 block">City</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {allCities.map(c => (
                    <button key={c} onClick={() => toggleFilter('cities', c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${filters.cities.includes(c) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-neutral-600 border-neutral-200 hover:border-indigo-300'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Builder */}
            {allBuilders.length > 0 && (
              <div>
                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-2 block">Builder / Developer</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {allBuilders.map(b => (
                    <button key={b} onClick={() => toggleFilter('builders', b)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${filters.builders.includes(b) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-neutral-600 border-neutral-200 hover:border-indigo-300'}`}>
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
      <p className="text-sm text-neutral-500 font-semibold mb-5">
        Showing <span className="text-neutral-900 font-black">{filtered.length}</span> of {approvedProperties.length} properties
        {groupMode !== 'none' && <span> · Grouped by <span className="text-indigo-600 font-black">{groupMode === 'city' ? 'City' : 'Builder'}</span></span>}
        {compareIds.length > 0 && (
          <span className="ml-3 text-indigo-600 font-black">
            · {compareIds.length} selected for compare
          </span>
        )}
      </p>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="bg-white border border-dashed border-neutral-300 rounded-3xl p-16 text-center">
          <div className="text-5xl mb-4">🏘️</div>
          <h3 className="text-xl font-black text-neutral-700 mb-2">No Properties Found</h3>
          <p className="text-neutral-500 font-medium mb-4">Try adjusting your filters or broaden your search.</p>
          <button onClick={clearAll} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all">
            Clear All Filters
          </button>
        </div>
      )}

      {/* Property Groups */}
      {Object.entries(grouped).map(([groupKey, props]) => (
        <div key={groupKey} className="mb-10">
          {groupMode !== 'none' && (
            <div className="flex items-center gap-3 mb-5">
              <div className="w-2 h-6 bg-indigo-600 rounded-full" />
              <h2 className="text-lg font-black text-neutral-800">{groupKey}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black border border-indigo-100">{props.length}</span>
              <div className="flex-1 h-px bg-neutral-200" />
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
                        ? 'bg-indigo-600 text-white'
                        : compareIds.length >= 3
                        ? 'opacity-30 cursor-not-allowed bg-white border border-neutral-200 text-neutral-400'
                        : 'bg-white border border-neutral-200 text-neutral-400 hover:text-indigo-600 hover:border-indigo-300'
                    }`}
                    title={compareIds.includes(prop.id) ? 'Remove' : compareIds.length >= 3 ? 'Max 3' : 'Compare'}
                  >
                    {compareIds.includes(prop.id) ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  </button>
                  <Link href={`/properties/${prop.id}`}
                    className={`bg-white border rounded-2xl p-4 flex items-center gap-5 group hover:border-indigo-200 hover:shadow-md transition-all pl-12 ${
                      compareIds.includes(prop.id) ? 'border-indigo-400 ring-1 ring-indigo-500/20' : 'border-neutral-200'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${prop.gradient || 'from-indigo-500 to-purple-600'} flex items-center justify-center text-2xl shrink-0`}>
                      {prop.emoji || '🏢'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-neutral-900 group-hover:text-indigo-600 transition-colors truncate">{prop.name}</h3>
                      <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5 font-medium">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{getLocationStr(prop)}</span>
                      </p>
                      <div className="flex gap-2 mt-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[10px] font-black">{prop.projectType}</span>
                        {prop.projectStage && <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black">{prop.projectStage}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-neutral-900">{getMinPrice(prop) > 0 ? formatCurrency(getMinPrice(prop)) : 'POR'}</p>
                      {prop.units?.[0]?.beds > 0 && <p className="text-xs text-neutral-500 font-medium">{prop.units[0].beds} BHK</p>}
                      <p className="text-xs text-neutral-400 font-semibold mt-0.5">{prop.builder?.name || '—'}</p>
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
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xl shadow-neutral-900/20 p-4 flex items-center gap-4">
            {/* Selected names */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <GitCompare className="w-5 h-5 text-indigo-600 shrink-0" />
              <div className="flex flex-wrap gap-1.5 min-w-0">
                {compareProperties.map(p => (
                  <span key={p.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
                    <span className="truncate max-w-[100px]">{p.name || p.title}</span>
                    <button
                      onClick={() => toggleCompare(p.id)}
                      className="ml-0.5 text-indigo-400 hover:text-indigo-700 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {compareIds.length < 3 && (
                  <span className="px-2.5 py-1 rounded-lg border border-dashed border-neutral-300 text-neutral-400 text-xs font-semibold">
                    + add more (max 3)
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setCompareIds([])}
                className="px-3 py-2 rounded-xl text-xs font-bold text-neutral-500 hover:bg-neutral-100 transition-all"
              >
                Clear
              </button>
              <button
                onClick={() => setShowCompare(true)}
                disabled={compareIds.length < 2}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-500/25"
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
