"use client";
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/context/UserProfileContext';
import { auth as authApi, ApiError } from '@/lib/api';
import { ROLE, ROLE_BADGE_CLASS, ROLE_GRADIENT, ROLE_EMOJI } from '@/lib/constants';

const CityScene = dynamic(() => import('@/components/CityScene'), { ssr: false });

const DEMO_ACCOUNTS = [
  { email: 'admin@gxcrealty.com',   role: ROLE.ADMIN,   name: 'Super Admin',  grad: ROLE_GRADIENT[ROLE.ADMIN] },
  { email: 'company@gxcrealty.com', role: ROLE.COMPANY, name: 'GXC Builders', grad: ROLE_GRADIENT[ROLE.COMPANY] },
  { email: 'agent1@gxcrealty.com',  role: ROLE.AGENT,   name: 'John Doe',     grad: ROLE_GRADIENT[ROLE.AGENT] },
];

function getRedirectForRole(role: string) {
  if (role === ROLE.ADMIN) return '/admin';
  return '/dashboard';
}

const GOLD      = '#B8860B';
const GOLD_LIGHT= '#D4A843';
const GOLD_BG   = '#FDF8ED';
const GOLD_CARD = '#FFFDF5';
const BORDER    = 'rgba(180,130,30,0.18)';
const TEXT_DARK = '#1a1200';
const TEXT_MID  = '#5a4a28';
const TEXT_SOFT = '#9a8060';

export default function LoginPage() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const router = useRouter();
  const { login } = useUserProfile();

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { access_token, user } = await authApi.login(email.trim().toLowerCase(), password);
      login(access_token, user);
      router.push(getRedirectForRole(user.role));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 401 ? 'Invalid email or password.' : err.message);
      } else {
        setError('Cannot reach the server. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: GOLD_BG }}>

      {/* 3D City Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CityScene scrollY={0} />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(253,248,237,0.50) 0%, rgba(253,248,237,0.75) 100%)' }} />
      </div>

      <div className="w-full max-w-md space-y-4 relative z-10">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-4 shadow-xl float"
            style={{
              background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD}, #A07208)`,
              boxShadow: `0 8px 24px rgba(180,130,30,0.38)`
            }}>
            <span className="text-2xl drop-shadow-md">🏛️</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            <span style={{ color: GOLD }}>GXC</span>
            <span style={{ color: TEXT_DARK }}>Realty</span>
          </h1>
          <p className="text-sm font-medium" style={{ color: TEXT_SOFT }}>Exclusive Invite-Only Network</p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl overflow-hidden border"
          style={{
            background: GOLD_CARD,
            borderColor: BORDER,
            boxShadow: `0 20px 60px rgba(180,130,30,0.12), 0 0 0 1px rgba(180,130,30,0.06)`
          }}>
          {/* Gold top bar */}
          <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${GOLD_LIGHT}, ${GOLD}, #A07208)` }} />

          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-bold mb-6" style={{ color: TEXT_DARK }}>Sign In to Portal</h2>

            <form className="space-y-5" onSubmit={handleLogin}>
              {/* Email */}
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

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 ml-1" style={{ color: TEXT_SOFT }}>
                  Password
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: TEXT_SOFT }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••"
                    className="w-full rounded-2xl pl-11 pr-12 py-3.5 text-sm font-medium outline-none transition-all"
                    style={{ background: GOLD_BG, border: `1px solid ${BORDER}`, color: TEXT_DARK }}
                    onFocus={e => { e.currentTarget.style.borderColor = `rgba(180,130,30,0.55)`; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(212,168,67,0.12)`; }}
                    onBlur={e =>  { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: TEXT_SOFT }}
                    onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                    onMouseLeave={e => (e.currentTarget.style.color = TEXT_SOFT)}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPass
                        ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-2xl text-sm font-medium"
                  style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', color: '#dc2626' }}>
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Forgot password */}
              <div className="text-right -mt-1">
                <Link href="/forgot-password"
                  className="text-xs font-semibold transition-colors hover:underline"
                  style={{ color: TEXT_SOFT }}>
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD}, #A07208)`,
                  color: '#fff',
                  boxShadow: `0 6px 20px rgba(180,130,30,0.35)`
                }}
                onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 28px rgba(180,130,30,0.48)`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px rgba(180,130,30,0.35)`; }}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Signing In…</span>
                  </>
                ) : (
                  <>
                    <span>Access Portal</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Demo Accounts (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="rounded-3xl p-5 border"
            style={{ background: GOLD_CARD, borderColor: BORDER, boxShadow: `0 4px 20px rgba(180,130,30,0.07)` }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: TEXT_SOFT }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Dev Accounts
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(account => (
                <button key={account.email} onClick={() => fillDemo(account.email)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-left border border-transparent group"
                  style={{ color: TEXT_DARK }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = `rgba(212,168,67,0.07)`; el.style.borderColor = BORDER; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderColor = 'transparent'; }}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${account.grad} flex items-center justify-center text-lg flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                    {ROLE_EMOJI[account.role]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: TEXT_DARK }}>{account.name}</p>
                    <p className="text-[13px] font-medium truncate" style={{ color: TEXT_SOFT }}>{account.email}</p>
                  </div>
                  <span className={`badge ${ROLE_BADGE_CLASS[account.role]} flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border`}>
                    {account.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
