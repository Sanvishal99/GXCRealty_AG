"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/context/UserProfileContext';
import { auth as authApi, ApiError } from '@/lib/api';
import { ROLE, ROLE_BADGE_CLASS, ROLE_GRADIENT, ROLE_EMOJI } from '@/lib/constants';

// Demo accounts for development — remove in production
const DEMO_ACCOUNTS = [
  { email: 'admin@gxcrealty.com',   role: ROLE.ADMIN,   name: 'Super Admin',  grad: ROLE_GRADIENT[ROLE.ADMIN] },
  { email: 'company@gxcrealty.com', role: ROLE.COMPANY, name: 'GXC Builders', grad: ROLE_GRADIENT[ROLE.COMPANY] },
  { email: 'agent1@gxcrealty.com',  role: ROLE.AGENT,   name: 'John Doe',     grad: ROLE_GRADIENT[ROLE.AGENT] },
];

function getRedirectForRole(role: string) {
  if (role === ROLE.ADMIN) return '/admin';
  return '/dashboard';
}

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#fafafa]">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.15] glow-pulse" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.8) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-1/4 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.1] glow-pulse" style={{ animationDelay: '2s', background: 'radial-gradient(circle, rgba(236,72,153,0.8) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.2]" style={{ backgroundImage: 'linear-gradient(rgba(140,120,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(140,120,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="w-full max-w-md space-y-4 relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-indigo-600 shadow-xl shadow-indigo-600/20 mb-4 float">
            <span className="text-2xl text-white drop-shadow-md">🏛️</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-neutral-900">
            GXC<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500">Realty</span>
          </h1>
          <p className="text-neutral-500 text-sm font-medium">Exclusive Invite-Only Network</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-200/80">
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="p-5 sm:p-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-6">Sign In to Portal</h2>
            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-neutral-400"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-wider ml-1">Password</label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-11 pr-12 py-3.5 text-sm font-medium text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-neutral-400"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-indigo-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPass
                        ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"}
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" disabled={isLoading}
                className="relative w-full flex justify-center items-center gap-2 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-base shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
              >
                {isLoading ? (
                  <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg><span>Signing In...</span></>
                ) : (
                  <><span>Access Portal</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg></>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Demo Accounts */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4 text-neutral-400 flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Dev Accounts
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(account => (
                <button key={account.email} onClick={() => fillDemo(account.email)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-neutral-50 transition-all text-left border border-transparent hover:border-neutral-100 group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${account.grad} flex items-center justify-center text-lg flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                    {ROLE_EMOJI[account.role]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neutral-900 truncate">{account.name}</p>
                    <p className="text-[13px] text-neutral-500 font-medium truncate">{account.email}</p>
                  </div>
                  <span className={`badge ${ROLE_BADGE_CLASS[account.role]} flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border`}>{account.role}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
