import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PriceDisplay, UnitPrice, DocumentsSection, BuilderContact, UnlockBanner } from './PriceGate';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

async function getProperty(id: string) {
  try {
    const res = await fetch(`${API_BASE}/properties/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── Label / color maps ────────────────────────────────────────────────────────
const TYPE_LABEL: Record<string, string> = {
  APARTMENT: 'Apartment', VILLA: 'Villa', PLOT: 'Plot',
  COMMERCIAL: 'Commercial', PENTHOUSE: 'Penthouse', STUDIO: 'Studio',
};
const STAGE_LABEL: Record<string, string> = {
  UNDER_CONSTRUCTION: 'Under Construction', READY_TO_MOVE: 'Ready to Move',
  NEW_LAUNCH: 'New Launch', COMPLETED: 'Completed', UPCOMING: 'Upcoming',
};
const TYPE_BG: Record<string, [string, string]> = {
  APARTMENT: ['rgba(245,158,11,0.12)', '#92400E'],
  VILLA:     ['rgba(139,92,246,0.12)', '#5B21B6'],
  PLOT:      ['rgba(16,185,129,0.12)', '#065F46'],
  COMMERCIAL:['rgba(100,116,139,0.12)','#1E293B'],
  PENTHOUSE: ['rgba(244,63,94,0.12)',  '#9F1239'],
};
const STAGE_DOT: Record<string, string> = {
  UNDER_CONSTRUCTION: '#F59E0B', READY_TO_MOVE: '#10B981',
  NEW_LAUNCH: '#3B82F6', COMPLETED: '#14B8A6', UPCOMING: '#8B5CF6',
};

// ── Gold constants ────────────────────────────────────────────────────────────
const GOLD       = '#B8860B';
const GOLD_MID   = '#C9A227';
const GOLD_BG    = '#FDF8ED';
const GOLD_CARD  = '#FFFDF5';
const BORDER     = 'rgba(180,130,30,0.18)';
const BORDER_MED = 'rgba(180,130,30,0.30)';
const TEXT_DARK  = '#1a1200';
const TEXT_MID   = '#5a4a28';
const TEXT_SOFT  = '#9a8060';
const GOLD_BTN: React.CSSProperties = {
  background: 'linear-gradient(135deg, #D4A843, #C9A227, #A07208)',
  boxShadow: '0 4px 14px rgba(180,130,30,0.28)',
};

// ── Amenity icon (simple lookup) ─────────────────────────────────────────────
function amenityIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('pool') || n.includes('swim'))   return '🏊';
  if (n.includes('gym') || n.includes('fitness'))  return '🏋️';
  if (n.includes('park') || n.includes('garden'))  return '🌳';
  if (n.includes('security') || n.includes('cctv'))return '🔐';
  if (n.includes('club'))                           return '🏛️';
  if (n.includes('lift') || n.includes('elevator'))return '🛗';
  if (n.includes('parking'))                        return '🅿️';
  if (n.includes('play') || n.includes('kids'))     return '🛝';
  if (n.includes('power'))                          return '⚡';
  if (n.includes('spa'))                            return '💆';
  if (n.includes('tennis') || n.includes('court'))  return '🎾';
  if (n.includes('yoga') || n.includes('meditat'))  return '🧘';
  return '✦';
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function PublicPropertyPage({ params }: { params: { id: string } }) {
  const property = await getProperty(params.id);
  if (!property) notFound();

  const images: string[]   = (property.images || []).filter(Boolean);
  const units: any[]       = property.units || [];
  const documents: any[]   = property.documents || [];

  // Flatten amenities — may be string[] or { common:[], lifestyle:[], premium:[] }
  let amenities: string[] = [];
  if (Array.isArray(property.amenities)) {
    amenities = property.amenities.filter((a: any) => typeof a === 'string');
  } else if (property.amenities && typeof property.amenities === 'object') {
    amenities = [
      ...(property.amenities.common    || []),
      ...(property.amenities.lifestyle || []),
      ...(property.amenities.premium   || []),
    ].filter((a: any) => typeof a === 'string');
  }

  const [typeBg, typeText] = TYPE_BG[property.projectType] ?? ['rgba(180,130,30,0.10)', GOLD_MID];

  return (
    <div className="min-h-screen pb-24" style={{ background: GOLD_BG, color: TEXT_DARK, fontFamily: 'var(--font-outfit, sans-serif)' }}>

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          background: 'rgba(253,248,237,0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: BORDER,
          boxShadow: '0 1px 16px rgba(180,130,30,0.08)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/browse" className="flex items-center gap-2.5 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={GOLD_BTN}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="font-black text-base hidden sm:block" style={{ color: TEXT_DARK }}>
              GXC<span style={{ color: GOLD }}>Realty</span>
            </span>
          </Link>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold" style={{ color: TEXT_SOFT }}>
            <Link href="/browse" className="hover:underline" style={{ color: GOLD_MID }}>Browse</Link>
            <span>›</span>
            <span className="truncate max-w-[200px]">{property.title}</span>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
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
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ══════════════════════════════════════════
            IMAGE GALLERY
        ══════════════════════════════════════════ */}
        {images.length > 0 && (
          <section className="rounded-3xl overflow-hidden" style={{ background: 'rgba(245,230,184,0.3)' }}>
            {images.length === 1 && (
              <div className="aspect-[16/7]">
                <img src={images[0]} alt={property.title} className="w-full h-full object-cover" />
              </div>
            )}
            {images.length === 2 && (
              <div className="grid grid-cols-2 gap-1 aspect-[16/7]">
                <img src={images[0]} alt="" className="w-full h-full object-cover" />
                <img src={images[1]} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            {images.length === 3 && (
              <div className="grid grid-cols-3 gap-1 aspect-[16/7]">
                <img src={images[0]} alt="" className="w-full h-full object-cover col-span-2" />
                <div className="grid grid-rows-2 gap-1">
                  <img src={images[1]} alt="" className="w-full h-full object-cover" />
                  <img src={images[2]} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            {images.length >= 4 && (
              <div className="grid grid-cols-4 gap-1 aspect-[16/7]">
                <img src={images[0]} alt="" className="w-full h-full object-cover col-span-2 row-span-2" />
                <img src={images[1]} alt="" className="w-full h-full object-cover" />
                <img src={images[2]} alt="" className="w-full h-full object-cover" />
                <img src={images[3]} alt="" className="w-full h-full object-cover" />
                {images.length > 4 && (
                  <div className="relative">
                    <img src={images[4]} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center rounded-sm">
                      <span className="text-white font-black text-sm">+{images.length - 4} more</span>
                    </div>
                  </div>
                )}
                {images.length === 4 && <div />}
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════════════════════════
            TITLE + PRICE SECTION
        ══════════════════════════════════════════ */}
        <section
          className="rounded-3xl p-6 border"
          style={{ background: GOLD_CARD, borderColor: BORDER }}
        >
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {property.projectType && (
              <span
                className="text-xs font-black px-3 py-1 rounded-full"
                style={{ background: typeBg, color: typeText }}
              >
                {TYPE_LABEL[property.projectType] ?? property.projectType}
              </span>
            )}
            {property.projectStage && (
              <span
                className="text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5"
                style={{ background: 'rgba(180,130,30,0.08)', color: TEXT_MID }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: STAGE_DOT[property.projectStage] ?? '#9ca3af' }}
                />
                {STAGE_LABEL[property.projectStage] ?? property.projectStage}
              </span>
            )}
            {property.reraId && (
              <span
                className="text-xs font-black px-3 py-1 rounded-full flex items-center gap-1"
                style={{ background: 'rgba(20,184,166,0.10)', color: '#0F766E', border: '1px solid rgba(20,184,166,0.25)' }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                RERA: {property.reraId}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-6 justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: TEXT_DARK }}>
                {property.title}
              </h1>
              {(property.locality || property.city) && (
                <p className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: TEXT_SOFT }}>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {[property.locality, property.city, property.state].filter(Boolean).join(', ')}
                </p>
              )}

              {/* Key project facts */}
              <div className="flex flex-wrap gap-4 mt-4">
                {property.possessionDate && (
                  <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: TEXT_MID }}>
                    <span className="text-sm">🗓️</span>
                    Possession: {new Date(property.possessionDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </div>
                )}
                {property.launchDate && (
                  <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: TEXT_MID }}>
                    <span className="text-sm">🚀</span>
                    Launched: {new Date(property.launchDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </div>
                )}
                {units.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: TEXT_MID }}>
                    <span className="text-sm">🏢</span>
                    {units.length} unit {units.length === 1 ? 'type' : 'types'}
                  </div>
                )}
              </div>
            </div>

            {/* Price gate */}
            <div className="shrink-0 sm:text-right sm:min-w-[200px]">
              <PriceDisplay price={property.price} maxPrice={property.maxPrice} />
              {property.pricePerSqFt && (
                <p className="text-xs font-semibold mt-1" style={{ color: TEXT_SOFT }}>
                  ₹{property.pricePerSqFt.toLocaleString('en-IN')}/sq.ft
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            DESCRIPTION
        ══════════════════════════════════════════ */}
        {property.description && (
          <section
            className="rounded-3xl p-6 border"
            style={{ background: GOLD_CARD, borderColor: BORDER }}
          >
            <h2 className="text-lg font-black mb-3" style={{ color: TEXT_DARK }}>About This Project</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: TEXT_MID }}>
              {property.description}
            </p>
          </section>
        )}

        {/* ══════════════════════════════════════════
            UNIT CONFIGURATIONS
        ══════════════════════════════════════════ */}
        {units.length > 0 && (
          <section>
            <h2 className="text-lg font-black mb-4" style={{ color: TEXT_DARK }}>Unit Configurations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map((unit: any, i: number) => (
                <div
                  key={i}
                  className="rounded-2xl p-5 border"
                  style={{ background: GOLD_CARD, borderColor: BORDER }}
                >
                  {/* Unit header */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="text-sm font-black px-3 py-1 rounded-full"
                      style={{ background: 'rgba(180,130,30,0.10)', color: GOLD_MID }}
                    >
                      {unit.name || (unit.beds ? `${unit.beds} BHK` : `Unit ${i + 1}`)}
                    </span>
                    {/* Price gated */}
                    <UnitPrice minPrice={unit.minPrice} maxPrice={unit.maxPrice} />
                  </div>

                  {/* Unit specs */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {unit.beds != null && (
                      <div className="rounded-xl p-2.5" style={{ background: 'rgba(180,130,30,0.05)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: TEXT_SOFT }}>Beds</p>
                        <p className="font-black" style={{ color: TEXT_DARK }}>{unit.beds}</p>
                      </div>
                    )}
                    {unit.baths != null && (
                      <div className="rounded-xl p-2.5" style={{ background: 'rgba(180,130,30,0.05)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: TEXT_SOFT }}>Baths</p>
                        <p className="font-black" style={{ color: TEXT_DARK }}>{unit.baths}</p>
                      </div>
                    )}
                    {(unit.superArea || unit.carpetArea) != null && (
                      <div className="rounded-xl p-2.5" style={{ background: 'rgba(180,130,30,0.05)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: TEXT_SOFT }}>Area</p>
                        <p className="font-black text-sm" style={{ color: TEXT_DARK }}>
                          {unit.superArea ?? unit.carpetArea}
                          <span className="text-[9px] font-medium ml-0.5" style={{ color: TEXT_SOFT }}>sq.ft</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Available units */}
                  {unit.availableUnits != null && (
                    <p className="text-[10px] font-bold mt-3 text-center" style={{ color: unit.availableUnits > 0 ? '#10B981' : '#EF4444' }}>
                      {unit.availableUnits > 0 ? `${unit.availableUnits} units available` : 'Sold Out'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════
            AMENITIES
        ══════════════════════════════════════════ */}
        {amenities.length > 0 && (
          <section
            className="rounded-3xl p-6 border"
            style={{ background: GOLD_CARD, borderColor: BORDER }}
          >
            <h2 className="text-lg font-black mb-4" style={{ color: TEXT_DARK }}>Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {amenities.map((a: string, i: number) => (
                <span
                  key={i}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-semibold border"
                  style={{ background: 'rgba(180,130,30,0.05)', borderColor: BORDER, color: TEXT_MID }}
                >
                  <span className="text-base">{amenityIcon(a)}</span>
                  {a}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════
            DOCUMENTS (gated)
        ══════════════════════════════════════════ */}
        <DocumentsSection documents={documents} />

        {/* ══════════════════════════════════════════
            BUILDER INFO (gated contact)
        ══════════════════════════════════════════ */}
        <BuilderContact
          builderName={property.builderName}
          builderContact={property.builderContact}
          builderEmail={property.builderEmail}
          builderAddress={property.builderAddress}
        />

        {/* ══════════════════════════════════════════
            CTA SECTION
        ══════════════════════════════════════════ */}
        <section
          className="rounded-3xl p-8 text-white"
          style={{
            background: 'linear-gradient(135deg, #C9A227 0%, #A07208 50%, #8B6200 100%)',
            boxShadow: '0 16px 48px rgba(180,130,30,0.35)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
            <div>
              <h2 className="text-2xl font-black mb-2">Interested in this property?</h2>
              <p className="text-amber-100 font-medium text-sm">
                Register for free to get pricing, schedule a visit, and connect with the builder directly.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                Login
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-xl whitespace-nowrap"
                style={{ background: '#fff', color: GOLD }}
              >
                Get Full Access →
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            BROWSE MORE
        ══════════════════════════════════════════ */}
        <div className="text-center">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 text-sm font-bold transition-colors"
            style={{ color: GOLD_MID }}
          >
            ← Browse all properties
          </Link>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer
        className="mt-4 pb-8 text-center border-t pt-6"
        style={{ borderColor: BORDER }}
      >
        <p className="text-xs font-medium" style={{ color: TEXT_SOFT }}>
          Powered by{' '}
          <span className="font-black" style={{ color: GOLD }}>GXCRealty</span>
          {' '}· Exclusive Real Estate Network
        </p>
      </footer>

      {/* ── Sticky unlock banner (client) ── */}
      <UnlockBanner />
    </div>
  );
}
