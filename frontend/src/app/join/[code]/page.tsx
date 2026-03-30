"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth as authApi, ApiError } from '@/lib/api';

interface ReferrerInfo {
  valid: boolean;
  referrerEmail: string;
  referrerName: string;
  code: string;
}

function JoinForm() {
  const router = useRouter();
  const params = useParams();
  const code = (params?.code as string || '').toUpperCase();

  const [validating, setValidating] = useState(true);
  const [referrer, setReferrer]     = useState<ReferrerInfo | null>(null);
  const [invalidMsg, setInvalidMsg] = useState('');

  // Form
  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');
  const [success, setSuccess]       = useState(false);

  useEffect(() => {
    if (!code) {
      setInvalidMsg('No invite code in this link.');
      setValidating(false);
      return;
    }
    authApi.validateInvite(code)
      .then(data => setReferrer(data))
      .catch(err => setInvalidMsg(err instanceof ApiError ? err.message : 'This invite link is invalid or has expired.'))
      .finally(() => setValidating(false));
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (password !== confirm) { setFormError('Passwords do not match.'); return; }
    if (password.length < 8)  { setFormError('Password must be at least 8 characters.'); return; }
    if (!phone.trim())        { setFormError('Phone number is required.'); return; }

    setSubmitting(true);
    try {
      await authApi.register({
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        referralCode: code,
      });
      setSuccess(true);
      setTimeout(() => router.push('/login?registered=agent'), 2000);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Eye icon ────────────────────────────────────────────────────────────────
  const EyeIcon = ({ visible }: { visible: boolean }) => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d={visible
          ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
          : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"}
      />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#fafafa]">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.8) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-1/4 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.8) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: 'linear-gradient(rgba(140,120,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(140,120,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-600 to-amber-500 shadow-xl shadow-indigo-600/20 mb-4">
            <span className="text-2xl">🏛️</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-neutral-900">
            GXC<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500">Realty</span>
          </h1>
          <p className="text-neutral-500 text-sm font-medium">Agent Onboarding</p>
        </div>

        <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-neutral-200/80">
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-amber-400 to-orange-500" />
          <div className="p-8">

            {/* Loading */}
            {validating && (
              <div className="flex flex-col items-center py-12 gap-4">
                <svg className="animate-spin w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <p className="text-neutral-500 text-sm font-medium">Validating invite link...</p>
              </div>
            )}

            {/* Invalid */}
            {!validating && invalidMsg && (
              <div className="flex flex-col items-center py-10 gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
                  <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 mb-2">Invalid Invite Link</h2>
                  <p className="text-neutral-500 text-sm">{invalidMsg}</p>
                </div>
                <a href="/login" className="mt-2 text-indigo-600 font-semibold text-sm hover:underline">Back to Login</a>
              </div>
            )}

            {/* Success */}
            {!validating && !invalidMsg && success && (
              <div className="flex flex-col items-center py-10 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl">
                  🎉
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 mb-2">Welcome to GXCRealty!</h2>
                  <p className="text-neutral-500 text-sm">Your account has been created. Redirecting to login...</p>
                </div>
                <div className="flex gap-1 mt-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            {!validating && !invalidMsg && !success && referrer && (
              <>
                {/* Invite context banner */}
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-amber-50 border border-indigo-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {referrer.referrerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900">
                        <span className="text-indigo-600">{referrer.referrerName}</span> invited you to join GXCRealty
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        You'll be added to their network as a Level 1 agent
                      </p>
                    </div>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-neutral-900 mb-5">Create Your Agent Account</h2>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-neutral-400"
                        placeholder="Your full name"
                      />
                    </div>
                    <p className="mt-1 ml-1 text-[11px] text-neutral-400">For display in your profile.</p>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-neutral-400"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-wider ml-1">Phone Number</label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-neutral-400"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-11 pr-12 py-3.5 text-sm font-medium text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-neutral-400"
                        placeholder="At least 8 characters"
                      />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-indigo-500 transition-colors">
                        <EyeIcon visible={showPass} />
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-wider ml-1">Confirm Password</label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <input type={showConf ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} required
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-11 pr-12 py-3.5 text-sm font-medium text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-neutral-400"
                        placeholder="Repeat password"
                      />
                      <button type="button" onClick={() => setShowConf(p => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-indigo-500 transition-colors">
                        <EyeIcon visible={showConf} />
                      </button>
                    </div>
                  </div>

                  {/* Invite code (read-only) */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-wider ml-1">Invite Code</label>
                    <div className="flex items-center gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                      <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span className="font-black text-amber-700 tracking-widest text-sm">{code}</span>
                      <span className="ml-auto text-xs text-amber-600 font-medium">Auto-applied</span>
                    </div>
                  </div>

                  {/* Error */}
                  {formError && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formError}
                    </div>
                  )}

                  <button type="submit" disabled={submitting}
                    className="relative w-full flex justify-center items-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-amber-500 text-white font-bold text-base shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  >
                    {submitting ? (
                      <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg><span>Creating Account...</span></>
                    ) : (
                      <><span>Join GXCRealty Network</span>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg></>
                    )}
                  </button>
                </form>

                <p className="mt-5 text-center text-xs text-neutral-400">
                  Already have an account?{' '}
                  <a href="/login" className="text-indigo-600 font-semibold hover:underline">Sign in</a>
                </p>
              </>
            )}
          </div>
        </div>

        {/* What you get section */}
        {!validating && !invalidMsg && !success && (
          <div className="mt-4 bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4 text-neutral-400">What you get as an agent</p>
            <div className="space-y-3">
              {[
                { icon: '🏠', title: 'Access to property listings', desc: 'Browse and share exclusive real estate projects' },
                { icon: '💸', title: 'Incentive on every deal', desc: 'Earn on your deals and your downline\'s deals (5 levels)' },
                { icon: '📊', title: 'Lead & pipeline management', desc: 'Track buyers from first contact to deal closure' },
                { icon: '🤝', title: 'Build your own team', desc: 'Invite others and earn on their performance too' },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                    <p className="text-xs text-neutral-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <svg className="animate-spin w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    }>
      <JoinForm />
    </Suspense>
  );
}
