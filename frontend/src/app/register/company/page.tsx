"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { companyInvites, ApiError } from '@/lib/api';

function CompanyRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [validating, setValidating]   = useState(true);
  const [inviteData, setInviteData]   = useState<any>(null);
  const [invalidMsg, setInvalidMsg]   = useState('');

  // Form state
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [phone, setPhone]             = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState('');
  const [success, setSuccess]         = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalidMsg('No invite token provided. Please use the link from your invitation email.');
      setValidating(false);
      return;
    }
    companyInvites.validate(token)
      .then(data => {
        setInviteData(data);
        if (data?.invite?.email) setEmail(data.invite.email);
      })
      .catch(err => {
        setInvalidMsg(
          err instanceof ApiError
            ? err.message
            : 'This invite link is invalid or has expired.'
        );
      })
      .finally(() => setValidating(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (password !== confirm) { setFormError('Passwords do not match.'); return; }
    if (password.length < 8)  { setFormError('Password must be at least 8 characters.'); return; }
    setSubmitting(true);
    try {
      await companyInvites.registerCompany(token, { email: email.trim().toLowerCase(), password, phone: phone.trim() });
      setSuccess(true);
      setTimeout(() => router.push('/login?registered=company'), 1800);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#fafafa]">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.8) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-1/4 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.8) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: 'linear-gradient(rgba(140,120,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(140,120,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="w-full max-w-md space-y-4 relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-600 to-emerald-500 shadow-xl shadow-indigo-600/20 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-neutral-900">
            GXC<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500">Realty</span>
          </h1>
          <p className="text-neutral-500 text-sm font-medium">Company Registration</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-neutral-200/80">
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-emerald-500 to-teal-500" />
          <div className="p-8">

            {/* Loading */}
            {validating && (
              <div className="flex flex-col items-center py-10 gap-4">
                <svg className="animate-spin w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <p className="text-neutral-500 text-sm font-medium">Validating invite...</p>
              </div>
            )}

            {/* Invalid token */}
            {!validating && invalidMsg && (
              <div className="flex flex-col items-center py-8 gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
                  <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 mb-2">Invalid Invite</h2>
                  <p className="text-neutral-500 text-sm">{invalidMsg}</p>
                </div>
                <a href="/login" className="mt-2 text-indigo-600 font-semibold text-sm hover:underline">Back to Login</a>
              </div>
            )}

            {/* Success */}
            {!validating && !invalidMsg && success && (
              <div className="flex flex-col items-center py-8 gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 mb-2">Registration Successful!</h2>
                  <p className="text-neutral-500 text-sm">Your company account has been created. Redirecting to login...</p>
                </div>
              </div>
            )}

            {/* Form */}
            {!validating && !invalidMsg && !success && (
              <>
                <h2 className="text-xl font-bold text-neutral-900 mb-1">Create Company Account</h2>

                {/* Invite context */}
                {inviteData?.invite && (
                  <div className="mb-5 p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="font-semibold">You have been invited to join GXCRealty</p>
                        {inviteData.invite.note && (
                          <p className="text-indigo-600 mt-0.5">{inviteData.invite.note}</p>
                        )}
                        {inviteData.invite.email && (
                          <p className="text-indigo-500 text-xs mt-0.5">Invited: {inviteData.invite.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <form className="space-y-4 mt-5" onSubmit={handleSubmit}>
                  {/* Company Name (display only) */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-wider ml-1">Company Name</label>
                    <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-neutral-400"
                      placeholder="Your company name"
                    />
                    <p className="mt-1 ml-1 text-[11px] text-neutral-400">For display purposes only.</p>
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
                        placeholder="company@example.com"
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
                      <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-indigo-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPass
                            ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                        </svg>
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
                      <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} required
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-11 pr-12 py-3.5 text-sm font-medium text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-neutral-400"
                        placeholder="Repeat password"
                      />
                      <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-indigo-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showConfirm
                            ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                        </svg>
                      </button>
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
                    className="relative w-full flex justify-center items-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-600 text-white font-bold text-base shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg><span>Creating Account...</span></>
                    ) : (
                      <><span>Create Company Account</span>
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
      </div>
    </div>
  );
}

export default function CompanyRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <svg className="animate-spin w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    }>
      <CompanyRegisterForm />
    </Suspense>
  );
}
