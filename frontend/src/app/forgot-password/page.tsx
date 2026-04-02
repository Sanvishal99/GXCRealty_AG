"use client";
import { useState } from 'react';
import Link from 'next/link';
import { auth as authApi, ApiError } from '@/lib/api';

const GOLD       = '#B8860B';
const GOLD_LIGHT = '#D4A843';
const GOLD_BG    = '#FDF8ED';
const GOLD_CARD  = '#FFFDF5';
const BORDER     = 'rgba(180,130,30,0.18)';
const TEXT_DARK  = '#1a1200';
const TEXT_SOFT  = '#9a8060';

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Cannot reach the server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: GOLD_BG }}>
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl mb-4 shadow-xl"
            style={{ background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD}, #A07208)` }}>
            <span className="text-2xl">🏛️</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span style={{ color: GOLD }}>GXC</span>
            <span style={{ color: TEXT_DARK }}>Realty</span>
          </h1>
        </div>

        <div className="rounded-3xl overflow-hidden border"
          style={{ background: GOLD_CARD, borderColor: BORDER, boxShadow: `0 20px 60px rgba(180,130,30,0.12)` }}>
          <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${GOLD_LIGHT}, ${GOLD}, #A07208)` }} />

          <div className="p-6 sm:p-8">
            {sent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'rgba(180,130,30,0.1)' }}>
                  <svg className="w-7 h-7" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold mb-2" style={{ color: TEXT_DARK }}>Check your inbox</h2>
                <p className="text-sm leading-relaxed mb-6" style={{ color: TEXT_SOFT }}>
                  If <strong>{email}</strong> is registered, you'll receive a password reset link shortly. Check your spam folder if you don't see it.
                </p>
                <Link href="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
                  style={{ color: GOLD }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-2" style={{ color: TEXT_DARK }}>Forgot password?</h2>
                <p className="text-sm mb-6" style={{ color: TEXT_SOFT }}>
                  Enter your registered email and we'll send you a reset link.
                </p>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 ml-1" style={{ color: TEXT_SOFT }}>
                      Email Address
                    </label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: TEXT_SOFT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                      <input
                        type="email" value={email} onChange={e => setEmail(e.target.value)} required
                        placeholder="your@email.com"
                        className="w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium outline-none transition-all"
                        style={{ background: GOLD_BG, border: `1px solid ${BORDER}`, color: TEXT_DARK }}
                        onFocus={e => { e.currentTarget.style.borderColor = `rgba(180,130,30,0.55)`; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(212,168,67,0.12)`; }}
                        onBlur={e =>  { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl text-sm font-medium"
                      style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', color: '#dc2626' }}>
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit" disabled={loading}
                    className="w-full flex justify-center items-center gap-2 py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD}, #A07208)`, color: '#fff', boxShadow: `0 6px 20px rgba(180,130,30,0.35)` }}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Sending…</span>
                      </>
                    ) : (
                      <span>Send Reset Link</span>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link href="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                    style={{ color: TEXT_SOFT }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to sign in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
