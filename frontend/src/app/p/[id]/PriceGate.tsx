"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, Download } from 'lucide-react';
import { getToken } from '@/lib/api';

// ── Gold palette ─────────────────────────────────────────────────────────────
const GOLD       = '#B8860B';
const GOLD_MID   = '#C9A227';
const BORDER     = 'rgba(180,130,30,0.18)';
const BORDER_MED = 'rgba(180,130,30,0.30)';
const TEXT_DARK  = '#1a1200';
const TEXT_MID   = '#5a4a28';
const TEXT_SOFT  = '#9a8060';
const GOLD_BTN: React.CSSProperties = {
  background: 'linear-gradient(135deg, #D4A843, #C9A227, #A07208)',
  boxShadow: '0 4px 14px rgba(180,130,30,0.28)',
};

function fmt(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function useAuth() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [mounted, setMounted]   = useState(false);
  useEffect(() => { setMounted(true); setLoggedIn(!!getToken()); }, []);
  return { loggedIn, mounted };
}

// ── Main price display ────────────────────────────────────────────────────────
export function PriceDisplay({ price, maxPrice }: { price: number; maxPrice?: number }) {
  const { loggedIn, mounted } = useAuth();
  if (!mounted) return <div className="h-10 w-40 rounded-xl animate-pulse" style={{ background: 'rgba(180,130,30,0.08)' }} />;

  if (loggedIn) {
    return (
      <div>
        <p className="text-3xl font-black" style={{ color: GOLD }}>{fmt(price)}</p>
        {maxPrice && maxPrice !== price && (
          <p className="text-sm font-semibold mt-0.5" style={{ color: TEXT_SOFT }}>up to {fmt(maxPrice)}</p>
        )}
      </div>
    );
  }

  return (
    <Link href="/login">
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-2xl cursor-pointer transition-all hover:shadow-lg"
        style={{ background: 'rgba(180,130,30,0.06)', border: `1.5px dashed ${BORDER_MED}` }}
      >
        <Lock size={20} style={{ color: GOLD }} className="shrink-0" />
        <div className="flex-1">
          <p className="font-black text-base" style={{ color: GOLD_MID }}>Login to view price</p>
          <p className="text-xs font-medium" style={{ color: TEXT_SOFT }}>
            Register free — unlock pricing, floor plans & more
          </p>
        </div>
        <ArrowRight size={16} style={{ color: GOLD }} />
      </div>
    </Link>
  );
}

// ── Unit price cell ───────────────────────────────────────────────────────────
export function UnitPrice({ minPrice, maxPrice }: { minPrice?: number; maxPrice?: number }) {
  const { loggedIn, mounted } = useAuth();
  if (!mounted) return <span className="inline-block w-16 h-4 rounded animate-pulse" style={{ background: 'rgba(180,130,30,0.08)' }} />;

  if (loggedIn && (minPrice || maxPrice)) {
    return (
      <span className="font-black" style={{ color: GOLD }}>
        {minPrice ? fmt(minPrice) : ''}
        {maxPrice && maxPrice !== minPrice ? ` – ${fmt(maxPrice)}` : ''}
      </span>
    );
  }
  if (!loggedIn) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(180,130,30,0.08)', color: GOLD_MID }}>
        <Lock size={9} />
        Login
      </span>
    );
  }
  return null;
}

// ── Documents / floor plans ───────────────────────────────────────────────────
export function DocumentsSection({ documents }: { documents: any[] }) {
  const { loggedIn, mounted } = useAuth();
  if (!mounted) return null;
  if (!documents || documents.length === 0) return null;

  if (loggedIn) {
    return (
      <section className="rounded-3xl p-6 border" style={{ background: '#FFFDF5', borderColor: BORDER }}>
        <h2 className="text-lg font-black mb-4" style={{ color: TEXT_DARK }}>Documents &amp; Floor Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {documents.map((doc: any, i: number) => (
            <a
              key={i}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3.5 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ borderColor: BORDER, background: 'rgba(253,248,237,0.6)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(180,130,30,0.10)' }}
              >
                <svg className="w-4 h-4" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: TEXT_DARK }}>{doc.title || doc.type}</p>
                <p className="text-xs font-medium" style={{ color: TEXT_SOFT }}>{doc.type}</p>
              </div>
              <Download size={15} style={{ color: TEXT_SOFT }} className="shrink-0" />
            </a>
          ))}
        </div>
      </section>
    );
  }

  // ── Locked state ──────────────────────────────────────────────────────────
  return (
    <section
      className="rounded-3xl p-6 relative overflow-hidden"
      style={{ border: `1.5px dashed ${BORDER_MED}`, background: 'rgba(253,248,237,0.5)' }}
    >
      <h2 className="text-lg font-black mb-4" style={{ color: TEXT_DARK }}>Documents &amp; Floor Plans</h2>

      {/* Ghost rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
        {[1,2,3].map(i => (
          <div
            key={i}
            className="flex items-center gap-3 p-3.5 rounded-2xl"
            style={{ border: `1px solid ${BORDER}`, background: 'rgba(180,130,30,0.03)' }}
          >
            <div className="w-9 h-9 rounded-xl shrink-0 animate-pulse" style={{ background: 'rgba(180,130,30,0.10)' }} />
            <div className="flex-1 space-y-2">
              <div className="h-3 rounded-full animate-pulse w-3/5" style={{ background: 'rgba(180,130,30,0.10)' }} />
              <div className="h-2 rounded-full animate-pulse w-2/5" style={{ background: 'rgba(180,130,30,0.07)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Blur lock overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center rounded-3xl"
        style={{
          backdropFilter: 'blur(7px)',
          WebkitBackdropFilter: 'blur(7px)',
          background: 'rgba(253,248,237,0.72)',
        }}
      >
        <Link href="/login" className="text-center px-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={GOLD_BTN}
          >
            <Lock size={24} className="text-white" />
          </div>
          <p className="font-black text-base mb-1" style={{ color: TEXT_DARK }}>Floor Plans Locked</p>
          <p className="text-xs mb-3 max-w-[200px] mx-auto" style={{ color: TEXT_SOFT }}>
            Create a free account to download floor plans, brochures &amp; more
          </p>
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={GOLD_BTN}
          >
            Unlock Access <ArrowRight size={14} />
          </div>
        </Link>
      </div>
    </section>
  );
}

// ── Builder contact ───────────────────────────────────────────────────────────
export function BuilderContact({
  builderName, builderContact, builderEmail, builderAddress,
}: {
  builderName?: string;
  builderContact?: string;
  builderEmail?: string;
  builderAddress?: string;
}) {
  const { loggedIn, mounted } = useAuth();
  if (!mounted || (!builderName && !builderContact && !builderEmail)) return null;

  return (
    <section className="rounded-3xl p-6 border" style={{ background: '#FFFDF5', borderColor: BORDER }}>
      <h2 className="text-lg font-black mb-4" style={{ color: TEXT_DARK }}>Builder Information</h2>
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={GOLD_BTN}
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="flex-1">
          {builderName && (
            <p className="font-black text-base mb-1" style={{ color: TEXT_DARK }}>{builderName}</p>
          )}
          {loggedIn ? (
            <div className="space-y-1">
              {builderContact && (
                <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: TEXT_MID }}>
                  <span className="text-base">📞</span> {builderContact}
                </p>
              )}
              {builderEmail && (
                <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: TEXT_MID }}>
                  <span className="text-base">✉️</span> {builderEmail}
                </p>
              )}
              {builderAddress && (
                <p className="text-sm font-medium" style={{ color: TEXT_SOFT }}>{builderAddress}</p>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold mt-1 px-3 py-1.5 rounded-full transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(180,130,30,0.10)', color: GOLD_MID, border: `1px solid ${BORDER}` }}
            >
              <Lock size={11} />
              Login to view contact details
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Sticky CTA for unregistered users ────────────────────────────────────────
export function UnlockBanner() {
  const { loggedIn, mounted } = useAuth();
  if (!mounted || loggedIn) return null;

  return (
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
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(180,130,30,0.12)', border: `1px solid ${BORDER}` }}
          >
            <Lock size={16} style={{ color: GOLD }} />
          </div>
          <div>
            <p className="text-sm font-black" style={{ color: TEXT_DARK }}>
              Unlock Full Property Details
            </p>
            <p className="text-xs font-medium" style={{ color: TEXT_SOFT }}>
              Login to view price, floor plans, builder contact &amp; schedule a visit
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-sm font-bold border transition-all"
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
    </div>
  );
}
