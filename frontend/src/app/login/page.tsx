"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/context/UserProfileContext';

const DEMO_USERS: Record<string, { role: string; name: string; redirect: string; grad: string; emoji: string }> = {
  'admin@gxcrealty.com':   { role: 'ADMIN',   name: 'Super Admin',  redirect: '/admin',     grad: 'from-rose-500 to-orange-500', emoji: '👑' },
  'company@gxcrealty.com': { role: 'COMPANY', name: 'GXC Builders', redirect: '/dashboard', grad: 'from-amber-500 to-yellow-500', emoji: '🏗️' },
  'agent1@gxcrealty.com':  { role: 'AGENT',   name: 'John Doe',     redirect: '/dashboard', grad: 'from-indigo-500 to-purple-600', emoji: '🏠' },
  'agent2@gxcrealty.com':  { role: 'AGENT',   name: 'Jane Smith',   redirect: '/dashboard', grad: 'from-pink-500 to-rose-500', emoji: '🌟' },
};

const ROLE_BADGE: Record<string, string> = {
  ADMIN:   'text-rose-500 bg-rose-500/10 border-rose-500/30',
  COMPANY: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  AGENT:   'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
};

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const router = useRouter();

  const { updateProfile } = useUserProfile();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = DEMO_USERS[email.toLowerCase()];
    if (!user || password !== 'password123') {
      setError('Invalid email or password. Try one of the demo accounts below.');
      return;
    }
    setIsLoading(true);
    
    // Set profile data so sidebar shows correct user info
    updateProfile({
      name: user.name,
      email: email.toLowerCase(),
      role: user.role,
    });

    setTimeout(() => router.push(user.redirect), 900);
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}>

      {/* Rich ambient background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] glow-orb-1 rounded-full blur-[120px] opacity-60 glow-pulse" />
        <div className="absolute -bottom-1/4 right-0 w-[600px] h-[600px] glow-orb-2 rounded-full blur-[120px] opacity-50 glow-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] glow-orb-3 rounded-full blur-[100px] opacity-30 glow-pulse" style={{ animationDelay: '1s' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(140,120,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(140,120,255,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="w-full max-w-md space-y-4 relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-indigo-500/30 mb-4 float">
            <span className="text-2xl">🏛️</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-1">
            GXC<span className="text-gradient">Realty</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">Exclusive Invite-Only Network</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel-glow rounded-3xl overflow-hidden">
          {/* Gradient top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="p-8">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Sign In to Portal</h2>
            <form className="space-y-5" onSubmit={handleLogin}>
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="theme-input w-full rounded-2xl pl-12 pr-4 py-3.5 text-sm"
                    placeholder="agent@gxcrealty.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    className="theme-input w-full rounded-2xl pl-12 pr-12 py-3.5 text-sm"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-indigo-500 transition-colors">
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
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" disabled={isLoading}
                className="relative w-full flex justify-center items-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-base shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                {isLoading ? (
                  <><svg className="animate-spin w-5 h-5 relative" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg><span className="relative">Signing In...</span></>
                ) : (
                  <><span className="relative">Access Portal</span>
                  <svg className="relative w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg></>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Demo Accounts */}
        <div className="glass-panel rounded-3xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest mb-4 text-[var(--text-muted)] flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Demo Accounts — password: password123
          </p>
          <div className="space-y-2">
            {Object.entries(DEMO_USERS).map(([demoEmail, info]) => (
              <button key={demoEmail} onClick={() => fillDemo(demoEmail)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-[var(--glass-bg-hover)] transition-all text-left group"
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${info.grad} flex items-center justify-center text-base flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                  {info.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{info.name}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{demoEmail}</p>
                </div>
                <span className={`badge ${ROLE_BADGE[info.role]} flex-shrink-0`}>{info.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
