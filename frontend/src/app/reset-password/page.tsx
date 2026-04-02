"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth as authApi, ApiError } from '@/lib/api';

const GOLD       = '#B8860B';
const GOLD_LIGHT = '#D4A843';
const GOLD_BG    = '#FDF8ED';
const GOLD_CARD  = '#FFFDF5';
const BORDER     = 'rgba(180,130,30,0.18)';
const TEXT_DARK  = '#1a1200';
const TEXT_SOFT  = '#9a8060';

function ResetPasswordForm() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const token         = searchParams.get('token') ?? '';

  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (!token) setError('Missing or invalid reset link. Please request a new one.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
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
            {done ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'rgba(22,163,74,0.1)' }}>
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold mb-2" style={{ color: TEXT_DARK }}>Password updated!</h2>
                <p className="text-sm mb-4" style={{ color: TEXT_SOFT }}>
                  Your password has been reset. Redirecting to sign in…
                </p>
                <Link href="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: GOLD }}>
                  Go to sign in
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-2" style={{ color: TEXT_DARK }}>Set new password</h2>
                <p className="text-sm mb-6" style={{ color: TEXT_SOFT }}>Choose a strong password for your account.</p>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  {/* New password */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 ml-1" style={{ color: TEXT_SOFT }}>
                      New Password
                    </label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: TEXT_SOFT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                        placeholder="Minimum 8 characters"
                        className="w-full rounded-2xl pl-11 pr-12 py-3.5 text-sm font-medium outline-none transition-all"
                        style={{ background: GOLD_BG, border: `1px solid ${BORDER}`, color: TEXT_DARK }}
                        onFocus={e => { e.currentTarget.style.borderColor = `rgba(180,130,30,0.55)`; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(212,168,67,0.12)`; }}
                        onBlur={e =>  { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: TEXT_SOFT }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPass
                            ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 ml-1" style={{ color: TEXT_SOFT }}>
                      Confirm Password
                    </label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: TEXT_SOFT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={confirm} onChange={e => setConfirm(e.target.value)} required
                        placeholder="Re-enter password"
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
                    type="submit" disabled={loading || !token}
                    className="w-full flex justify-center items-center gap-2 py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD}, #A07208)`, color: '#fff', boxShadow: `0 6px 20px rgba(180,130,30,0.35)` }}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Updating…</span>
                      </>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDF8ED' }}>
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-yellow-600 border-t-transparent" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
