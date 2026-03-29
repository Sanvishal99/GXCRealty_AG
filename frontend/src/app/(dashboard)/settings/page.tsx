"use client";
import { useState, useRef, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useCurrency, CurrencyCode } from '@/context/CurrencyContext';
import { useNotifications } from '@/context/NotificationContext';
import { useUserProfile } from '@/context/UserProfileContext';

type SettingsSection = 'profile' | 'bank' | 'kyc' | 'appearance' | 'notifications' | 'security' | 'billing';

const SECTIONS: { id: SettingsSection; label: string; icon: string; color: string; grad: string }[] = [
  { id: 'profile',       label: 'Profile',       icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'text-indigo-500', grad: 'from-indigo-500 to-purple-600' },
  { id: 'bank',          label: 'Banking',       icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', color: 'text-emerald-500', grad: 'from-emerald-500 to-teal-500' },
  { id: 'kyc',           label: 'KYC Docs',      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'text-rose-500', grad: 'from-rose-500 to-orange-500' },
  { id: 'appearance',    label: 'Appearance',     icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01', color: 'text-purple-500', grad: 'from-purple-500 to-pink-500' },
  { id: 'notifications', label: 'Notifications',  icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', color: 'text-amber-500', grad: 'from-amber-500 to-orange-500' },
  { id: 'security',      label: 'Security',       icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'text-emerald-500', grad: 'from-emerald-500 to-teal-500' },
  { id: 'billing',       label: 'Billing',        icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', color: 'text-cyan-500', grad: 'from-cyan-500 to-blue-500' },
];

const CURRENCIES: { code: CurrencyCode; label: string; symbol: string; flag: string }[] = [
  { code: 'INR', label: 'Indian Rupee',   symbol: '₹', flag: '🇮🇳' },
  { code: 'USD', label: 'US Dollar',      symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', label: 'Euro',           symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', label: 'British Pound',  symbol: '£', flag: '🇬🇧' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
        checked ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30' : 'bg-[var(--bg-elevated)]'
      }`}
      style={{ border: '1px solid var(--border-medium)' }}>
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${checked ? 'left-6' : 'left-0.5'}`} />
    </button>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-[var(--border-subtle)] last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
        {desc && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{desc}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const { profile, updateProfile, setAvatar, clearAvatar } = useUserProfile();

  const [active, setActive] = useState<SettingsSection>('profile');
  const [isDragging, setIsDragging] = useState(false);

  // local editable copies
  const [name, setName]   = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [bio, setBio]     = useState(profile.bio);

  // Bank Copy
  const [bank, setBank] = useState(profile.bankDetails || { accountName: '', accountNumber: '', bankName: '', ifsc: '' });
  
  // KYC Copy (Base64 strings)
  const [kyc, setKyc] = useState(profile.kycDocuments || { idFront: null, idBack: null, addressProof: null });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    dealAlerts: true, commissionPay: true, visitReminders: true,
    networkActivity: false, marketingEmails: false, smsAlerts: true,
  });

  // Security
  const [twoFA, setTwoFA]       = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');

  const handleSave = (section: string) => {
    if (section === 'profile') updateProfile({ name, email, phone, bio });
    if (section === 'bank')    updateProfile({ bankDetails: bank });
    if (section === 'kyc')     updateProfile({ kycDocuments: kyc });
    addNotification({ type: 'success', title: 'Settings Saved', message: `Your ${section} settings updated.`, category: 'system' });
  };

  const uploadKyc = (key: keyof typeof kyc) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = res => setKyc(prev => ({ ...prev, [key]: res.target?.result as string }));
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => { if (e.target?.result) setAvatar(e.target.result as string); };
    reader.readAsDataURL(file);
  }, [setAvatar]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const initials = profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const activeSection = SECTIONS.find(s => s.id === active)!;

  return (
    <div className="p-6 md:p-8 relative z-10 w-full max-w-6xl mx-auto text-[var(--text-primary)]">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] glow-orb-1 rounded-full blur-[140px] pointer-events-none opacity-25 -translate-y-1/4 translate-x-1/3" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] glow-orb-2 rounded-full blur-[120px] pointer-events-none opacity-20" />

      <header className="mb-8">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel">
          <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">Account</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">User <span className="text-gradient">Settings</span></h1>
        <p className="text-[var(--text-secondary)]">Manage your profile, preferences, and account security.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {/* Avatar Card */}
          <div className="glass-panel rounded-3xl p-5 mb-4 relative overflow-hidden text-center"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 glow-orb-1 rounded-full blur-3xl pointer-events-none opacity-50" />
            <div className="relative z-10">
              {/* Avatar with upload */}
              <div className="relative w-20 h-20 mx-auto mb-3">
                <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-xl shadow-indigo-500/30 float">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-2xl font-extrabold text-white">
                      {initials}
                    </div>
                  )}
                </div>
                <button onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform border-2 border-[var(--bg-primary)]">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
              <p className="font-bold text-[var(--text-primary)]">{profile.name}</p>
              <p className="text-xs text-indigo-400 flex items-center justify-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                {profile.role}
              </p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 rounded-xl glass-panel text-xs font-semibold text-[var(--text-secondary)] hover:text-indigo-500 hover:border-indigo-500/30 transition-all">
                  Change Photo
                </button>
                {profile.avatarUrl && (
                  <button onClick={clearAvatar}
                    className="py-2 px-3 rounded-xl glass-panel text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-all">
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section tabs */}
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-semibold text-left group ${
                active === s.id
                  ? `bg-gradient-to-r ${s.grad} text-white shadow-lg`
                  : 'glass-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)]'
              }`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
              </svg>
              {s.label}
              {active === s.id && (
                <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Main Panel */}
        <div className="lg:col-span-3">
          <div className="glass-panel rounded-3xl overflow-hidden">
            {/* Panel Header */}
            <div className="p-6 border-b border-[var(--border-subtle)] flex items-center gap-4"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, transparent 100%)' }}>
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${activeSection.grad} flex items-center justify-center shadow-md`}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activeSection.icon} />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{activeSection.label}</h2>
                <p className="text-xs text-[var(--text-secondary)]">Manage your {activeSection.label.toLowerCase()} settings</p>
              </div>
            </div>

            <div className="p-6">

              {/* ── PROFILE ── */}
              {active === 'profile' && (
                <div className="space-y-5">
                  {/* Drag & Drop avatar upload zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-[var(--border-medium)] hover:border-indigo-500/50 hover:bg-indigo-500/5'
                    }`}
                  >
                    {profile.avatarUrl ? (
                      <div className="flex items-center justify-center gap-4">
                        <img src={profile.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
                        <div className="text-left">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">Profile photo uploaded</p>
                          <p className="text-xs text-[var(--text-secondary)]">Click to change or drag a new image</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Upload Profile Picture</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">Click or drag & drop · JPG, PNG, WEBP up to 5MB</p>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Full Name</label>
                      <input value={name} onChange={e => setName(e.target.value)} className="w-full theme-input rounded-2xl px-4 py-3 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Email Address</label>
                      <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full theme-input rounded-2xl px-4 py-3 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Phone Number</label>
                      <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="w-full theme-input rounded-2xl px-4 py-3 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Advisor ID</label>
                      <input readOnly value={profile.agentId} className="w-full theme-input rounded-2xl px-4 py-3 text-sm opacity-60 cursor-not-allowed" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Bio</label>
                    <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)}
                      className="w-full theme-input rounded-2xl px-4 py-3 text-sm resize-none" />
                  </div>
                  <div className="glass-panel rounded-2xl p-4 grad-indigo">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3">Account Type</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md text-lg">🏠</div>
                      <div>
                        <p className="font-bold text-[var(--text-primary)] text-sm">{profile.role}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Full incentive access · Priority listings</p>
                      </div>
                      <span className="ml-auto badge text-indigo-500 bg-indigo-500/10 border-indigo-500/30">Active</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => handleSave('profile')}
                      className="px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all">
                      Save Profile
                    </button>
                  </div>
                </div>
              )}

              {/* ── BANKING ── */}
              {active === 'bank' && (
                <div className="space-y-6">
                  <div className="glass-panel grad-emerald rounded-2xl p-4">
                     <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Settlement Details</p>
                     <p className="text-xs text-[var(--text-secondary)]">Your incentives will be credited to this account.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Account Holder Name</label>
                      <input value={bank.accountName} onChange={e => setBank({...bank, accountName: e.target.value})} className="w-full theme-input rounded-2xl px-4 py-3 text-sm" placeholder="As per bank record" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Bank Name</label>
                      <input value={bank.bankName} onChange={e => setBank({...bank, bankName: e.target.value})} className="w-full theme-input rounded-2xl px-4 py-3 text-sm" placeholder="e.g. HDFC Bank" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Account Number</label>
                      <input value={bank.accountNumber} onChange={e => setBank({...bank, accountNumber: e.target.value})} className="w-full theme-input rounded-2xl px-4 py-3 text-sm" placeholder="0000 0000 0000" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">IFSC Code</label>
                      <input value={bank.ifsc} onChange={e => setBank({...bank, ifsc: e.target.value})} className="w-full theme-input rounded-2xl px-4 py-3 text-sm uppercase" placeholder="HDFC0001234" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button onClick={() => handleSave('bank')}
                      className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all">
                      Save Bank Details
                    </button>
                  </div>
                </div>
              )}

              {/* ── KYC ── */}
              {active === 'kyc' && (
                <div className="space-y-6">
                  <div className="glass-panel grad-rose rounded-2xl p-4">
                     <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Identity Verification</p>
                     <p className="text-xs text-[var(--text-secondary)]">Upload clear photos of your identity documents for compliance.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'idFront', label: 'Govt. ID Front' },
                      { key: 'idBack', label: 'Govt. ID Back' },
                      { key: 'addressProof', label: 'Address Proof' },
                    ].map((item) => (
                      <div key={item.key} onClick={() => uploadKyc(item.key as any)} className="glass-panel rounded-3xl p-4 border-2 border-dashed border-white/5 hover:border-indigo-500/50 cursor-pointer transition-all text-center h-48 flex flex-col items-center justify-center">
                        {kyc[item.key as keyof typeof kyc] ? (
                          <div className="w-full h-full relative overflow-hidden rounded-xl">
                             <img src={kyc[item.key as keyof typeof kyc]!} className="w-full h-full object-cover opacity-60" />
                             <div className="absolute inset-0 flex items-center justify-center flex-col bg-black/40">
                               <p className="text-[10px] font-black uppercase text-white shadow-sm">Click to Change</p>
                               <span className="text-xl mt-1">✅</span>
                             </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3">📄</div>
                            <p className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">{item.label}</p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-1">Click to Upload</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-4">
                    <button onClick={() => handleSave('kyc')}
                      className="px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black text-xs shadow-lg shadow-rose-500/25 hover:-translate-y-0.5 transition-all tracking-widest">
                      SUBMIT FOR VERIFICATION
                    </button>
                  </div>
                </div>
              )}

              {/* ── APPEARANCE ── */}
              {active === 'appearance' && (
                <div className="space-y-2">
                  <SettingRow label="Theme" desc="Switch between dark and light mode">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--text-secondary)] capitalize">{theme}</span>
                      <Toggle checked={theme === 'light'} onChange={toggleTheme} />
                    </div>
                  </SettingRow>
                  <div className="py-4 border-b border-[var(--border-subtle)]">
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Currency</p>
                    <p className="text-xs text-[var(--text-secondary)] mb-4">Set your preferred display currency</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {CURRENCIES.map(c => (
                        <button key={c.code} onClick={() => setCurrency(c.code)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                            currency === c.code
                              ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                              : 'border-[var(--border-subtle)] glass-panel hover:border-[var(--border-medium)]'
                          }`}>
                          <span className="text-2xl">{c.flag}</span>
                          <span className={`text-lg font-extrabold font-mono ${currency === c.code ? 'text-indigo-500' : 'text-[var(--text-primary)]'}`}>{c.symbol}</span>
                          <div className="text-center">
                            <p className={`text-xs font-bold ${currency === c.code ? 'text-indigo-500' : 'text-[var(--text-primary)]'}`}>{c.code}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">{c.label}</p>
                          </div>
                          {currency === c.code && (
                            <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <SettingRow label="Compact Mode" desc="Reduce spacing for a denser layout">
                    <Toggle checked={false} onChange={() => {}} />
                  </SettingRow>
                  <SettingRow label="Animations" desc="Enable UI micro-animations and transitions">
                    <Toggle checked={true} onChange={() => {}} />
                  </SettingRow>
                  <SettingRow label="High Contrast" desc="Increase contrast ratios for accessibility">
                    <Toggle checked={false} onChange={() => {}} />
                  </SettingRow>
                  <div className="flex justify-end pt-2">
                    <button onClick={() => handleSave('appearance')}
                      className="px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all">
                      Save Appearance
                    </button>
                  </div>
                </div>
              )}

              {/* ── NOTIFICATIONS ── */}
              {active === 'notifications' && (
                <div className="space-y-1">
                  <div className="glass-panel grad-amber rounded-2xl p-4 mb-4">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Notification Preferences</p>
                    <p className="text-xs text-[var(--text-secondary)]">Control what updates you receive and how.</p>
                  </div>
                  {(Object.entries(notifPrefs) as [keyof typeof notifPrefs, boolean][]).map(([key, val]) => {
                    const labels: Record<string, { label: string; desc: string }> = {
                      dealAlerts:      { label: 'Deal Alerts',        desc: 'Notify when a deal is closed or updated' },
                      commissionPay:   { label: 'Commission Payouts', desc: 'Alert when commission is credited to your wallet' },
                      visitReminders:  { label: 'Visit Reminders',    desc: 'Reminders 1 hour before scheduled property visits' },
                      networkActivity: { label: 'Network Activity',   desc: 'Updates when your downline closes deals' },
                      marketingEmails: { label: 'Marketing Emails',   desc: 'Platform announcements and promotions' },
                      smsAlerts:       { label: 'SMS Alerts',         desc: 'Critical alerts sent via SMS to your phone' },
                    };
                    return (
                      <SettingRow key={key} label={labels[key].label} desc={labels[key].desc}>
                        <Toggle checked={val} onChange={() => setNotifPrefs(p => ({ ...p, [key]: !p[key] }))} />
                      </SettingRow>
                    );
                  })}
                  <div className="flex justify-end pt-4">
                    <button onClick={() => handleSave('notification')}
                      className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5 transition-all">
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}

              {/* ── SECURITY ── */}
              {active === 'security' && (
                <div className="space-y-2">
                  <div className="glass-panel grad-emerald rounded-2xl p-4 mb-4">
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Account Security</p>
                    <p className="text-xs text-[var(--text-secondary)]">Keep your account protected with advanced security options.</p>
                  </div>
                  <SettingRow label="Two-Factor Authentication" desc="Require OTP on every login">
                    <Toggle checked={twoFA} onChange={() => setTwoFA(v => !v)} />
                  </SettingRow>
                  <SettingRow label="Biometric Login" desc="Use fingerprint or face recognition on supported devices">
                    <Toggle checked={biometric} onChange={() => setBiometric(v => !v)} />
                  </SettingRow>
                  <SettingRow label="Session Timeout" desc="Auto-logout after inactivity">
                    <select value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)}
                      className="theme-input rounded-xl px-3 py-1.5 text-sm">
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="60">1 hour</option>
                      <option value="never">Never</option>
                    </select>
                  </SettingRow>
                  <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
                    <p className="text-sm font-bold text-[var(--text-primary)]">Change Password</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Current Password</label>
                        <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                          placeholder="••••••••" className="w-full theme-input rounded-2xl px-4 py-3 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">New Password</label>
                        <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                          placeholder="••••••••" className="w-full theme-input rounded-2xl px-4 py-3 text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <button onClick={() => { addNotification({ type: 'info', title: 'Sessions Revoked', message: 'All active sessions have been logged out.', category: 'system' }); }}
                      className="px-5 py-2.5 rounded-xl glass-panel text-rose-500 text-sm font-semibold border border-rose-500/20 hover:bg-rose-500/10 transition-all">
                      Revoke All Sessions
                    </button>
                    <button onClick={() => handleSave('security')}
                      className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all">
                      Save Security
                    </button>
                  </div>
                </div>
              )}

              {/* ── BILLING ── */}
              {active === 'billing' && (
                <div className="space-y-5">
                  <div className="glass-panel rounded-2xl p-5 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.12) 0%, rgba(99,102,241,0.08) 100%)' }}>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[60px] opacity-10 select-none">💎</div>
                    <div className="relative z-10">
                      <span className="badge text-cyan-500 bg-cyan-500/10 border-cyan-500/30 mb-3 inline-flex">Current Plan</span>
                      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">Elite Advisor Plan</h3>
                      <p className="text-sm text-[var(--text-secondary)]">Full feature access · Priority support · 0% platform fee</p>
                      <p className="text-2xl font-extrabold text-cyan-500 font-mono mt-3">₹4,999 <span className="text-sm font-normal text-[var(--text-muted)]">/ month</span></p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)] mb-3">Payment Method</p>
                    <div className="glass-panel rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-12 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-extrabold tracking-wider flex-shrink-0">VISA</div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">•••• •••• •••• 4592</p>
                        <p className="text-xs text-[var(--text-secondary)]">Expires 08/27</p>
                      </div>
                      <button className="ml-auto text-xs text-indigo-500 font-semibold hover:text-indigo-400 transition-colors">Change</button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)] mb-3">Billing History</p>
                    <div className="space-y-2">
                      {['Mar 2026', 'Feb 2026', 'Jan 2026'].map((month, i) => (
                        <div key={i} className="flex items-center justify-between p-4 glass-panel rounded-2xl hover:bg-[var(--glass-bg-hover)] transition-colors">
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">Elite Advisor Plan</p>
                            <p className="text-xs text-[var(--text-secondary)]">{month}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold font-mono text-emerald-500">₹4,999</p>
                            <button className="text-[10px] text-indigo-500 hover:text-indigo-400 transition-colors mt-0.5">Download</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <button className="px-5 py-2.5 rounded-xl glass-panel text-rose-500 text-sm font-semibold border border-rose-500/20 hover:bg-rose-500/10 transition-all">
                      Cancel Plan
                    </button>
                    <button onClick={() => alert('Redirecting to upgrade...')}
                      className="px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all">
                      Upgrade Plan →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
