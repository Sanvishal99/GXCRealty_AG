"use client";
import { useState, useEffect } from 'react';
import { useAppConfig, AppConfig } from '@/context/AppConfigContext';
import { useNotifications } from '@/context/NotificationContext';
import { config as configApi } from '@/lib/api';

const GOLD       = '#B8860B';
const GOLD_LIGHT = '#D4A843';
const GOLD_BG    = '#FDF8ED';
const GOLD_CARD  = '#FFFDF5';
const BORDER     = 'rgba(180,130,30,0.18)';
const BORDER_MID = 'rgba(180,130,30,0.12)';
const TEXT_DARK  = '#1a1200';
const TEXT_MID   = '#5a4a28';
const TEXT_SOFT  = '#9a8060';

type EditorSection = 'branding' | 'landing' | 'dashboard' | 'pages' | 'features';

const SECTIONS: { id: EditorSection; label: string; icon: string }[] = [
  { id: 'branding',  label: 'Branding',      icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
  { id: 'landing',   label: 'Landing Page',  icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'dashboard', label: 'Dashboard',     icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: 'pages',     label: 'All Pages',     icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'features',  label: 'Feature Flags', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

function Field({ label, value, onChange, multiline = false, type = 'text', hint }: {
  label: string; value: string | number; onChange: (v: string) => void;
  multiline?: boolean; type?: string; hint?: string;
}) {
  const inputStyle = {
    background: GOLD_BG,
    border: `1px solid ${BORDER}`,
    color: TEXT_DARK,
    borderRadius: '12px',
    padding: '10px 12px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    resize: 'none' as const,
  };
  const focusStyle = { borderColor: 'rgba(180,130,30,0.55)', boxShadow: '0 0 0 3px rgba(212,168,67,0.1)' };

  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: TEXT_SOFT }}>{label}</label>
      {hint && <p className="text-[10px] mb-1.5" style={{ color: TEXT_SOFT }}>{hint}</p>}
      {multiline ? (
        <textarea rows={3} value={String(value)} onChange={e => onChange(e.target.value)}
          style={inputStyle}
          onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
          onBlur={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; }}
        />
      ) : (
        <input type={type} value={String(value)} onChange={e => onChange(e.target.value)}
          style={inputStyle}
          onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
          onBlur={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; }}
        />
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: () => void; label: string; desc?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b last:border-0" style={{ borderColor: BORDER_MID }}>
      <div>
        <p className="text-sm font-semibold" style={{ color: TEXT_DARK }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: TEXT_SOFT }}>{desc}</p>}
      </div>
      <button onClick={onChange}
        className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
        style={{
          background: checked ? `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})` : 'rgba(180,130,30,0.08)',
          border: `1px solid ${BORDER}`,
          boxShadow: checked ? `0 2px 8px rgba(180,130,30,0.35)` : 'none',
        }}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${checked ? 'left-6' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: GOLD }}>
      {children}
    </p>
  );
}

export default function AdminContentEditor() {
  const { config, updateConfig, resetConfig } = useAppConfig();
  const { addNotification } = useNotifications();
  const [active, setActive]   = useState<EditorSection>('branding');
  const [local, setLocal]     = useState<AppConfig>(config);
  const [saving, setSaving]   = useState(false);
  const [dirty, setDirty]     = useState(false);
  const [hexInput, setHexInput] = useState(config.branding.primaryColor);

  // Track unsaved changes
  useEffect(() => {
    setDirty(JSON.stringify(local) !== JSON.stringify(config));
  }, [local, config]);

  // Sync hex input when color changes externally
  useEffect(() => {
    setHexInput(local.branding.primaryColor);
  }, [local.branding.primaryColor]);

  const set = (path: string[]) => (value: string) => {
    setLocal(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      let cursor: any = next;
      for (let i = 0; i < path.length - 1; i++) cursor = cursor[path[i]];
      cursor[path[path.length - 1]] = value;
      return next;
    });
  };

  const setBool = (path: string[]) => () => {
    setLocal(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      let cursor: any = next;
      for (let i = 0; i < path.length - 1; i++) cursor = cursor[path[i]];
      cursor[path[path.length - 1]] = !cursor[path[path.length - 1]];
      return next;
    });
  };

  const saveSection = async () => {
    setSaving(true);
    try {
      // Save everything to backend — deals/branding as DB columns, rest as contentJson
      await configApi.update({
        commissionPoolPct: local.deals.commissionPoolPct,
        agentSplitPct: local.deals.agentSplitPct,
        networkPoolPct: local.deals.networkPoolPct,
        companySplitPct: local.deals.companySplitPct,
        tierSplits: local.deals.tierSplits,
        brandingEmoji: local.branding.logoEmoji,
        brandingLogoUrl: local.branding.logoImage,
        contentJson: {
          branding: local.branding,
          landing: local.landing,
          dashboard: local.dashboard,
          wallet: local.wallet,
          visits: local.visits,
          properties: local.properties,
          chat: local.chat,
          settings: local.settings,
          features: local.features,
        },
      });
      // Save everything else to localStorage
      updateConfig(local as any);
      setDirty(false);
      addNotification({ type: 'success', title: 'Content Saved', message: 'Platform content updated successfully.', category: 'system' });
    } catch {
      addNotification({ type: 'error', title: 'Save Failed', message: 'Could not reach server. Changes saved locally only.', category: 'system' });
      // Still save locally even if backend fails
      updateConfig(local as any);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    resetConfig();
    addNotification({ type: 'info', title: 'Config Reset', message: 'All settings restored to factory defaults.', category: 'system' });
    window.location.reload();
  };

  const handleHexInput = (val: string) => {
    setHexInput(val);
    // Only apply to color if it's a valid hex
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      set(['branding', 'primaryColor'])(val);
    }
  };

  const activeSection = SECTIONS.find(s => s.id === active)!;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black" style={{ color: TEXT_DARK }}>Content Editor</h1>
          <p className="text-sm mt-1" style={{ color: TEXT_SOFT }}>Configure text, branding, and features across the platform.</p>
        </div>
        <button onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all"
          style={{ background: 'rgba(220,38,38,0.06)', color: '#dc2626', borderColor: 'rgba(220,38,38,0.2)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.06)')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset to Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Section Nav */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl p-4 mb-4 border hidden lg:block"
            style={{ background: GOLD_CARD, borderColor: BORDER }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})` }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm font-bold mb-1" style={{ color: TEXT_DARK }}>Platform Config</p>
            <p className="text-xs" style={{ color: TEXT_SOFT }}>Changes are saved to localStorage and apply instantly.</p>
          </div>
          <div className="flex overflow-x-auto gap-2 pb-1 lg:flex-col lg:overflow-visible lg:pb-0 lg:space-y-1.5">
            {SECTIONS.map(s => {
              const isActive = active === s.id;
              return (
                <button key={s.id} onClick={() => setActive(s.id)}
                  className="flex-shrink-0 lg:flex-shrink lg:w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-semibold text-left"
                  style={{
                    background:  isActive ? `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})` : GOLD_CARD,
                    color:       isActive ? '#fff' : TEXT_MID,
                    border:      `1px solid ${isActive ? 'transparent' : BORDER}`,
                    boxShadow:   isActive ? `0 4px 12px rgba(180,130,30,0.3)` : 'none',
                  }}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                  </svg>
                  <span className="whitespace-nowrap lg:whitespace-normal">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor Panel */}
        <div className="lg:col-span-3">
          <div className="rounded-3xl overflow-hidden border"
            style={{ background: GOLD_CARD, borderColor: BORDER, boxShadow: `0 4px 24px rgba(180,130,30,0.08)` }}>

            {/* Gold top bar */}
            <div className="h-1" style={{ background: `linear-gradient(90deg, ${GOLD_LIGHT}, ${GOLD}, #A07208)` }} />

            {/* Panel header */}
            <div className="p-5 border-b flex items-center justify-between gap-4" style={{ borderColor: BORDER_MID }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})` }}>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activeSection.icon} />
                  </svg>
                </div>
                <div>
                  <h2 className="font-bold" style={{ color: TEXT_DARK }}>{activeSection.label}</h2>
                  <p className="text-xs" style={{ color: TEXT_SOFT }}>
                    {dirty ? '● Unsaved changes' : 'All changes saved'}
                  </p>
                </div>
              </div>
              <button onClick={saveSection} disabled={saving || !dirty}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: dirty ? `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD}, #A07208)` : 'rgba(180,130,30,0.1)',
                  color: dirty ? '#fff' : TEXT_SOFT,
                  boxShadow: dirty ? `0 4px 14px rgba(180,130,30,0.35)` : 'none',
                }}>
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving…
                  </>
                ) : 'Save Changes'}
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* ── BRANDING ── */}
              {active === 'branding' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="App Name" value={local.branding.appName} onChange={set(['branding', 'appName'])} hint="Appears in sidebar, browser tab, and header" />
                    <Field label="Tagline" value={local.branding.tagline} onChange={set(['branding', 'tagline'])} hint="Short description shown below the logo" />
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: TEXT_SOFT }}>Logo Image</label>
                      <p className="text-[10px] mb-2" style={{ color: TEXT_SOFT }}>Upload a PNG/JPG (stored locally)</p>
                      <div className="flex gap-2">
                        <input type="file" accept="image/*" id="logo-upload" className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => set(['branding', 'logoImage'])(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }} />
                        <label htmlFor="logo-upload"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all border-dashed border-2"
                          style={{ background: GOLD_BG, borderColor: BORDER, color: TEXT_MID }}>
                          <svg className="w-4 h-4" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          {local.branding.logoImage ? 'Change Logo' : 'Upload Image'}
                        </label>
                        {local.branding.logoImage && (
                          <button onClick={() => set(['branding', 'logoImage'])('')}
                            className="p-2.5 rounded-xl transition-all border"
                            style={{ background: 'rgba(220,38,38,0.06)', borderColor: 'rgba(220,38,38,0.2)', color: '#dc2626' }}
                            title="Remove Image">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <Field label="Logo Emoji" value={local.branding.logoEmoji} onChange={set(['branding', 'logoEmoji'])} hint="Fallback if no image is uploaded" />
                    <Field label="Footer Text" value={local.branding.footerText} onChange={set(['branding', 'footerText'])} />
                  </div>

                  {/* Color picker */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: TEXT_SOFT }}>Primary Accent Color</label>
                    <p className="text-[10px] mb-2" style={{ color: TEXT_SOFT }}>Hex color for primary UI elements</p>
                    <div className="flex items-center gap-3">
                      <input type="color" value={local.branding.primaryColor}
                        onChange={e => { set(['branding', 'primaryColor'])(e.target.value); setHexInput(e.target.value); }}
                        className="w-12 h-10 rounded-xl cursor-pointer bg-transparent border"
                        style={{ borderColor: BORDER }} />
                      <input type="text" value={hexInput}
                        onChange={e => handleHexInput(e.target.value)}
                        placeholder="#B8860B"
                        className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                        style={{ background: GOLD_BG, border: `1px solid ${/^#[0-9A-Fa-f]{6}$/.test(hexInput) ? BORDER : 'rgba(220,38,38,0.4)'}`, color: TEXT_DARK }}
                      />
                    </div>
                    {hexInput && !/^#[0-9A-Fa-f]{6}$/.test(hexInput) && (
                      <p className="text-xs mt-1.5 text-red-500">Enter a valid hex color (e.g. #B8860B)</p>
                    )}
                  </div>

                  {/* Live Preview */}
                  <div className="rounded-2xl p-4 border" style={{ background: 'rgba(180,130,30,0.04)', borderColor: BORDER }}>
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: GOLD }}>Live Preview</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})` }}>
                        {local.branding.logoImage
                          ? <img src={local.branding.logoImage} alt="Logo" className="w-full h-full object-cover" />
                          : local.branding.logoEmoji}
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: TEXT_DARK }}>{local.branding.appName}</p>
                        <p className="text-xs" style={{ color: TEXT_SOFT }}>{local.branding.tagline}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── LANDING ── */}
              {active === 'landing' && (
                <div className="space-y-6">
                  <div>
                    <SectionLabel>Hero Section</SectionLabel>
                    <div className="space-y-3">
                      <Field label="Hero Title" value={local.landing.heroTitle} onChange={set(['landing', 'heroTitle'])} />
                      <Field label="Hero Subtitle" value={local.landing.heroSubtitle} onChange={set(['landing', 'heroSubtitle'])} multiline />
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Primary CTA Button" value={local.landing.heroCta} onChange={set(['landing', 'heroCta'])} />
                        <Field label="Secondary Link Text" value={local.landing.heroSecondary} onChange={set(['landing', 'heroSecondary'])} />
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-5" style={{ borderColor: BORDER_MID }}>
                    <SectionLabel>Stats Row</SectionLabel>
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map(n => (
                        <div key={n} className="space-y-2">
                          <Field label={`Stat ${n} Label`} value={(local.landing as any)[`stat${n}Label`]} onChange={set(['landing', `stat${n}Label`])} />
                          <Field label={`Stat ${n} Value`} value={(local.landing as any)[`stat${n}Value`]} onChange={set(['landing', `stat${n}Value`])} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t pt-5" style={{ borderColor: BORDER_MID }}>
                    <SectionLabel>Feature Cards</SectionLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map(n => (
                        <div key={n} className="rounded-2xl p-4 space-y-2 border" style={{ background: GOLD_BG, borderColor: BORDER }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TEXT_SOFT }}>Feature {n}</p>
                          <Field label="Title" value={(local.landing as any)[`feature${n}Title`]} onChange={set(['landing', `feature${n}Title`])} />
                          <Field label="Description" value={(local.landing as any)[`feature${n}Desc`]} onChange={set(['landing', `feature${n}Desc`])} multiline />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t pt-5" style={{ borderColor: BORDER_MID }}>
                    <SectionLabel>Bottom CTA</SectionLabel>
                    <div className="space-y-3">
                      <Field label="CTA Title" value={local.landing.ctaTitle} onChange={set(['landing', 'ctaTitle'])} />
                      <Field label="CTA Subtitle" value={local.landing.ctaSubtitle} onChange={set(['landing', 'ctaSubtitle'])} multiline />
                    </div>
                  </div>
                </div>
              )}

              {/* ── DASHBOARD ── */}
              {active === 'dashboard' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Page Title" value={local.dashboard.pageTitle} onChange={set(['dashboard', 'pageTitle'])} />
                    <Field label="Page Subtitle" value={local.dashboard.pageSubtitle} onChange={set(['dashboard', 'pageSubtitle'])} />
                    <Field label="Stat Card 1 Label" value={local.dashboard.stat1Label} onChange={set(['dashboard', 'stat1Label'])} />
                    <Field label="Stat Card 2 Label" value={local.dashboard.stat2Label} onChange={set(['dashboard', 'stat2Label'])} />
                    <Field label="Stat Card 3 Label" value={local.dashboard.stat3Label} onChange={set(['dashboard', 'stat3Label'])} />
                    <Field label="Stat Card 4 Label" value={local.dashboard.stat4Label} onChange={set(['dashboard', 'stat4Label'])} />
                    <Field label="Network Graph Title" value={local.dashboard.networkTitle} onChange={set(['dashboard', 'networkTitle'])} />
                    <Field label="Activity Feed Title" value={local.dashboard.activityTitle} onChange={set(['dashboard', 'activityTitle'])} />
                  </div>
                  <div className="border-t pt-5" style={{ borderColor: BORDER_MID }}>
                    <SectionLabel>Commission / Deals Settings</SectionLabel>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Incentive Pool %" type="number" value={local.deals.commissionPoolPct} onChange={set(['deals', 'commissionPoolPct'])} hint="% of sale price allocated to incentives" />
                      <Field label="Direct Advisor Share %" type="number" value={local.deals.agentSplitPct} onChange={set(['deals', 'agentSplitPct'])} hint="% of pool that goes to the direct advisor" />
                    </div>
                    <p className="text-xs mt-2" style={{ color: TEXT_SOFT }}>
                      These values sync to the backend database. Other fields are stored locally.
                    </p>
                  </div>
                </div>
              )}

              {/* ── ALL PAGES ── */}
              {active === 'pages' && (
                <div className="space-y-4">
                  {[
                    { key: 'wallet',     label: 'Wallet Page',     extra: [{ key: 'upgradeBannerTitle', label: 'Upgrade Banner Title' }, { key: 'upgradeBannerSubtitle', label: 'Upgrade Banner Subtitle' }] },
                    { key: 'visits',     label: 'Visits Page',     extra: [] },
                    { key: 'properties', label: 'Properties Page', extra: [] },
                    { key: 'chat',       label: 'Chat Page',       extra: [] },
                    { key: 'settings',   label: 'Settings Page',   extra: [] },
                  ].map(page => (
                    <div key={page.key} className="rounded-2xl p-4 space-y-3 border" style={{ background: GOLD_BG, borderColor: BORDER }}>
                      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>{page.label}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field label="Page Title" value={(local as any)[page.key].pageTitle} onChange={set([page.key, 'pageTitle'])} />
                        <Field label="Page Subtitle" value={(local as any)[page.key].pageSubtitle} onChange={set([page.key, 'pageSubtitle'])} />
                        {page.extra.map(ex => (
                          <Field key={ex.key} label={ex.label} value={(local as any)[page.key][ex.key]} onChange={set([page.key, ex.key])} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── FEATURE FLAGS ── */}
              {active === 'features' && (
                <div className="space-y-1">
                  <div className="rounded-2xl p-4 mb-4 border" style={{ background: 'rgba(180,130,30,0.04)', borderColor: BORDER }}>
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>Feature Flags</p>
                    <p className="text-xs" style={{ color: TEXT_SOFT }}>Enable or disable features. Changes apply instantly without redeployment.</p>
                  </div>
                  <Toggle checked={local.features.enableChat}   onChange={setBool(['features', 'enableChat'])}   label="Enable Chat"   desc="Show the Advisor Chat page in navigation" />
                  <Toggle checked={local.features.enableWallet} onChange={setBool(['features', 'enableWallet'])} label="Enable Wallet" desc="Show Earnings & Wallet page" />
                  <Toggle checked={local.features.enableVisits} onChange={setBool(['features', 'enableVisits'])} label="Enable Visits" desc="Show Visit Scheduler page" />
                  <Toggle checked={local.features.enableDeals}  onChange={setBool(['features', 'enableDeals'])}  label="Enable Deals"  desc="Show Deals Incentive Checker page" />
                  <div className="border-t pt-4 mt-2" style={{ borderColor: BORDER_MID }}>
                    <Toggle checked={local.features.maintenanceMode} onChange={setBool(['features', 'maintenanceMode'])} label="Maintenance Mode" desc="Shows a maintenance banner to all advisors (admin retains full access)" />
                    {local.features.maintenanceMode && (
                      <>
                        <div className="mt-3">
                          <Field label="Maintenance Message" value={local.features.maintenanceMessage} onChange={set(['features', 'maintenanceMessage'])} multiline hint="Displayed to advisors when they visit the portal" />
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-2xl mt-3 border"
                          style={{ background: 'rgba(184,134,11,0.06)', borderColor: BORDER }}>
                          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div>
                            <p className="text-sm font-bold" style={{ color: TEXT_DARK }}>Maintenance Mode is ON</p>
                            <p className="text-xs mt-0.5" style={{ color: TEXT_SOFT }}>Advisors will see the maintenance message. Save changes to apply.</p>
                          </div>
                        </div>
                      </>
                    )}
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
