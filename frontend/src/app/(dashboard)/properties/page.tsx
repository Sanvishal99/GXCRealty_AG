"use client";
import { useCurrency } from '@/context/CurrencyContext';
import { useAppConfig } from '@/context/AppConfigContext';
import Link from 'next/link';

const PROPERTY_DATA = [
  { id: 1, name: 'Luxury Villa', location: 'South Mumbai', beds: 5, baths: 4, area: '6,200 sqft', tag: 'Featured', tagColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30', gradient: 'from-amber-500/20 to-orange-500/10', emoji: '🌴' },
  { id: 2, name: 'Sky Penthouse', location: 'BKC, Mumbai', beds: 4, baths: 3, area: '4,800 sqft', tag: 'New', tagColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30', gradient: 'from-indigo-500/20 to-purple-500/10', emoji: '🏙️' },
  { id: 3, name: 'Modern Condo', location: 'Bandra West', beds: 3, baths: 2, area: '2,100 sqft', tag: 'Available', tagColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', gradient: 'from-emerald-500/20 to-teal-500/10', emoji: '🏠' },
  { id: 4, name: 'Garden Estate', location: 'Juhu Beach', beds: 6, baths: 5, area: '9,000 sqft', tag: 'Featured', tagColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30', gradient: 'from-rose-500/20 to-pink-500/10', emoji: '🌺' },
  { id: 5, name: 'Office Tower', location: 'Nariman Point', beds: 0, baths: 4, area: '12,000 sqft', tag: 'Commercial', tagColor: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30', gradient: 'from-cyan-500/20 to-blue-500/10', emoji: '🏢' },
  { id: 6, name: 'Sea View Flat', location: 'Marine Drive', beds: 3, baths: 2, area: '1,900 sqft', tag: 'Available', tagColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', gradient: 'from-purple-500/20 to-indigo-500/10', emoji: '🌊' },
];

export default function PropertiesPage() {
  const { formatCurrency } = useCurrency();
  const { config } = useAppConfig();

  return (
    <div className="p-6 md:p-8 relative z-10 w-full text-[var(--text-primary)]">
      {/* Ambient glow */}
      <div className="fixed top-1/4 right-0 w-[500px] h-[500px] glow-orb-2 rounded-full blur-[140px] pointer-events-none opacity-30 translate-x-1/3" />
      <div className="fixed bottom-0 left-1/4 w-[400px] h-[400px] glow-orb-4 rounded-full blur-[120px] pointer-events-none opacity-25" />

      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)]">
            <span className="text-xs font-semibold text-purple-500 uppercase tracking-widest">Premium Portfolio</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            {config.properties.pageTitle.split(' ').slice(0,-1).join(' ')} <span className="text-gradient">{config.properties.pageTitle.split(' ').slice(-1)}</span>
          </h1>
          <p className="text-[var(--text-secondary)]">{config.properties.pageSubtitle}</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" placeholder="Search properties..."
              className="theme-input rounded-xl pl-10 pr-4 py-2.5 text-sm w-52"
            />
          </div>
          <button className="glass-panel px-4 py-2.5 rounded-xl hover:bg-[var(--glass-bg-hover)] transition-all text-sm font-semibold flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
        </div>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Listed', value: '6', color: 'text-indigo-500', grad: 'grad-indigo', glow: 'stat-card-indigo' },
          { label: 'Sold YTD', value: '18', color: 'text-emerald-500', grad: 'grad-emerald', glow: 'stat-card-emerald' },
          { label: 'Avg Price', value: formatCurrency(2400000), color: 'text-amber-500', grad: 'grad-amber', glow: '' },
          { label: 'Pipeline', value: '₹42Cr', color: 'text-purple-500', grad: 'grad-indigo', glow: 'stat-card-purple' },
        ].map((s, i) => (
          <div key={i} className={`glass-panel ${s.glow} ${s.grad} rounded-2xl p-4 transition-all`}>
            <p className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-extrabold font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PROPERTY_DATA.map((prop) => (
          <Link href={`/properties/${prop.id}`} key={prop.id}
            className="glass-panel block rounded-3xl overflow-hidden group hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
          >
            {/* Property image area */}
            <div className={`h-52 bg-gradient-to-br ${prop.gradient} relative overflow-hidden`}>
              {/* Simulated property image */}
              <div className="absolute inset-0 flex items-center justify-center text-[80px] opacity-30 select-none group-hover:scale-110 transition-transform duration-700">
                {prop.emoji}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10" />
              {/* Top badge */}
              <div className="absolute top-4 left-4 z-20">
                <span className={`badge ${prop.tagColor}`}>{prop.tag}</span>
              </div>
              {/* Price on image */}
              <div className="absolute bottom-4 left-4 z-20">
                <p className="text-2xl font-extrabold text-white font-mono drop-shadow-lg">
                  {formatCurrency((1.2 * prop.id) * 1000000)}
                </p>
              </div>
              {/* Heart icon */}
              <button className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full glass-panel flex items-center justify-center text-white hover:text-red-400 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {/* Card body */}
            <div className="p-5">
              <div className="mb-3">
                <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-indigo-500 transition-colors">{prop.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1 mt-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {prop.location}
                </p>
              </div>

              {/* Specs */}
              <div className="flex gap-3 mb-4">
                {prop.beds > 0 && (
                  <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                    <span>🛏</span> <span>{prop.beds} beds</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                  <span>🚿</span> <span>{prop.baths} baths</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                  <span>📐</span> <span>{prop.area}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-[var(--border-subtle)]">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">View Details</p>
                <span className="w-8 h-8 rounded-xl glass-panel flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
