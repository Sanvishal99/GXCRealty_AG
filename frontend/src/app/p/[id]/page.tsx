import { notFound } from 'next/navigation';

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

const TYPE_LABEL: Record<string, string> = {
  APARTMENT: 'Apartment', VILLA: 'Villa', PLOT: 'Plot',
  COMMERCIAL: 'Commercial', PENTHOUSE: 'Penthouse', STUDIO: 'Studio',
};
const STAGE_LABEL: Record<string, string> = {
  UNDER_CONSTRUCTION: 'Under Construction', READY_TO_MOVE: 'Ready to Move',
  NEW_LAUNCH: 'New Launch', COMPLETED: 'Completed',
};
const TYPE_COLOR: Record<string, string> = {
  APARTMENT: 'bg-indigo-100 text-indigo-700', VILLA: 'bg-purple-100 text-purple-700',
  PLOT: 'bg-amber-100 text-amber-700', COMMERCIAL: 'bg-slate-100 text-slate-700',
  PENTHOUSE: 'bg-rose-100 text-rose-700', STUDIO: 'bg-cyan-100 text-cyan-700',
};
const STAGE_COLOR: Record<string, string> = {
  UNDER_CONSTRUCTION: 'bg-amber-100 text-amber-700', READY_TO_MOVE: 'bg-emerald-100 text-emerald-700',
  NEW_LAUNCH: 'bg-blue-100 text-blue-700', COMPLETED: 'bg-teal-100 text-teal-700',
};

function formatPrice(price: number) {
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(2)} Cr`;
  if (price >= 100_000)    return `₹${(price / 100_000).toFixed(2)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
}

export default async function PublicPropertyPage({ params }: { params: { id: string } }) {
  const property = await getProperty(params.id);
  if (!property) notFound();

  const images: string[] = property.images || [];
  const units: any[]     = property.unitConfigs || property.units || [];
  const amenities: string[] = property.amenities || [];
  const whatsappMsg = encodeURIComponent(
    `Hi, I'm interested in "${property.title}" listed on GXCRealty. Please share more details.`
  );
  const whatsappLink = property.builderContact
    ? `https://wa.me/${property.builderContact.replace(/\D/g, '')}?text=${whatsappMsg}`
    : `https://wa.me/?text=${whatsappMsg}`;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">

      {/* ── Header ── */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="font-black text-base">
              GXC<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500">Realty</span>
            </span>
          </div>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/30">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contact via WhatsApp
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Image Gallery ── */}
        {images.length > 0 && (
          <section className="rounded-3xl overflow-hidden bg-neutral-200 aspect-[16/7] relative">
            <img src={images[0]} alt={property.title}
              className="w-full h-full object-cover" />
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                {images.slice(1, 4).map((img: string, i: number) => (
                  <div key={i} className="w-16 h-12 rounded-xl overflow-hidden border-2 border-white shadow-md">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {images.length > 4 && (
                  <div className="w-16 h-12 rounded-xl bg-black/60 border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold">
                    +{images.length - 4}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── Title + Badges ── */}
        <section className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              {property.projectType && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${TYPE_COLOR[property.projectType] || 'bg-neutral-100 text-neutral-600'}`}>
                  {TYPE_LABEL[property.projectType] || property.projectType}
                </span>
              )}
              {property.projectStage && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${STAGE_COLOR[property.projectStage] || 'bg-neutral-100 text-neutral-600'}`}>
                  {STAGE_LABEL[property.projectStage] || property.projectStage}
                </span>
              )}
              {property.reraId && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  RERA: {property.reraId}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">{property.title}</h1>
            {(property.locality || property.city) && (
              <p className="flex items-center gap-1.5 text-neutral-500 font-medium">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {[property.locality, property.city, property.state].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-black text-indigo-600">{formatPrice(property.price)}</p>
            {property.maxPrice && property.maxPrice !== property.price && (
              <p className="text-sm text-neutral-400 font-medium">up to {formatPrice(property.maxPrice)}</p>
            )}
          </div>
        </section>

        {/* ── Description ── */}
        {property.description && (
          <section className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm">
            <h2 className="text-lg font-bold mb-3">About This Property</h2>
            <p className="text-neutral-600 leading-relaxed whitespace-pre-line">{property.description}</p>
          </section>
        )}

        {/* ── Unit Configurations ── */}
        {units.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4">Unit Configurations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map((unit: any, i: number) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
                      {unit.bedrooms ? `${unit.bedrooms} BHK` : unit.type || `Unit ${i + 1}`}
                    </span>
                    {unit.price && (
                      <span className="font-black text-indigo-600">{formatPrice(unit.price)}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {unit.bedrooms != null && (
                      <div className="bg-neutral-50 rounded-xl p-2">
                        <p className="text-xs text-neutral-400 font-medium mb-0.5">Beds</p>
                        <p className="font-black text-neutral-900">{unit.bedrooms}</p>
                      </div>
                    )}
                    {unit.bathrooms != null && (
                      <div className="bg-neutral-50 rounded-xl p-2">
                        <p className="text-xs text-neutral-400 font-medium mb-0.5">Baths</p>
                        <p className="font-black text-neutral-900">{unit.bathrooms}</p>
                      </div>
                    )}
                    {unit.area != null && (
                      <div className="bg-neutral-50 rounded-xl p-2">
                        <p className="text-xs text-neutral-400 font-medium mb-0.5">Area</p>
                        <p className="font-black text-neutral-900 text-sm">{unit.area} <span className="text-[10px] font-medium text-neutral-400">sq.ft</span></p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Amenities ── */}
        {amenities.length > 0 && (
          <section className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {amenities.map((a: string, i: number) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-100">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {a}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Builder Info ── */}
        {(property.builderName || property.builderContact) && (
          <section className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Builder Information</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                {property.builderName && (
                  <p className="font-bold text-neutral-900">{property.builderName}</p>
                )}
                {property.builderContact && (
                  <p className="text-neutral-500 text-sm font-medium">{property.builderContact}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA: Contact Agent ── */}
        <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-600/20">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
            <div>
              <h2 className="text-2xl font-black mb-2">Interested in this property?</h2>
              <p className="text-indigo-200 font-medium">Get in touch with our team for pricing, availability, and site visits.</p>
            </div>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white text-indigo-700 font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg flex-shrink-0 whitespace-nowrap">
              <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contact via WhatsApp
            </a>
          </div>
        </section>
      </main>

      {/* ── Footer Watermark ── */}
      <footer className="mt-12 pb-8 text-center">
        <p className="text-xs text-neutral-400 font-medium">
          Powered by{' '}
          <span className="font-bold text-neutral-600">
            GXC<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500">Realty</span>
          </span>
          {' '}· Exclusive Real Estate Network
        </p>
      </footer>
    </div>
  );
}
