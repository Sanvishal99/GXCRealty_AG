"use client";
import { useState } from 'react';
import { useAppConfig, AppConfig } from '@/context/AppConfigContext';
import { useNotifications } from '@/context/NotificationContext';

type EditorSection = 'branding' | 'landing' | 'dashboard' | 'pages' | 'features';

const SECTIONS: { id: EditorSection; label: string; icon: string; color: string; grad: string }[] = [
  { id: 'branding',   label: 'Branding',      icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01', grad: 'from-rose-500 to-pink-500', color: 'text-rose-500' },
  { id: 'landing',    label: 'Landing Page',  icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', grad: 'from-amber-500 to-orange-500', color: 'text-amber-500' },
  { id: 'dashboard',  label: 'Dashboard',     icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', grad: 'from-indigo-500 to-purple-600', color: 'text-indigo-500' },
  { id: 'pages',      label: 'All Pages',     icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', grad: 'from-emerald-500 to-teal-500', color: 'text-emerald-500' },
  { id: 'features',   label: 'Feature Flags', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', grad: 'from-cyan-500 to-blue-500', color: 'text-cyan-500' },
];

function Field({ label, value, onChange, multiline = false, type = 'text', hint }: {
  label: string; value: string | number; onChange: (v: string) => void;
  multiline?: boolean; type?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">{label}</label>
      {hint && <p className="text-[10px] text-[var(--text-muted)] mb-1.5">{hint}</p>}
      {multiline ? (
        <textarea rows={3} value={String(value)} onChange={e => onChange(e.target.value)}
          className="w-full theme-input rounded-xl px-3 py-2.5 text-sm resize-none" />
      ) : (
        <input type={type} value={String(value)} onChange={e => onChange(e.target.value)}
          className="w-full theme-input rounded-xl px-3 py-2.5 text-sm" />
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: () => void; label: string; desc?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--border-subtle)] last:border-0">
      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
        {desc && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{desc}</p>}
      </div>
      <button onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
          checked ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30' : 'bg-[var(--bg-elevated)]'
        }`}
        style={{ border: '1px solid var(--border-medium)' }}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${checked ? 'left-6' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

export default function AdminContentEditor() {
  const { config, updateConfig, resetConfig } = useAppConfig();
  const { addNotification } = useNotifications();
  const [active, setActive] = useState<EditorSection>('branding');

  // local state mirrors — allows editing without immediate save
  const [local, setLocal] = useState<AppConfig>(config);

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

  const saveSection = () => {
    updateConfig(local as any);
    addNotification({ type: 'success', title: 'Content Saved', message: 'Platform content updated successfully.', category: 'system' });
  };

  const handleReset = () => {
    resetConfig();
    addNotification({ type: 'info', title: 'Config Reset', message: 'All settings restored to factory defaults.', category: 'system' });
    window.location.reload();
  };

  const activeSection = SECTIONS.find(s => s.id === active)!;

  return (
    <div className="p-6 md:p-8 relative z-10 w-full text-[var(--text-primary)]">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-20" style={{ background: 'rgba(244,63,94,0.2)' }} />

      {/* Header */}
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel">
            <span className="text-xs font-semibold text-rose-500 uppercase tracking-widest">Admin</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2">Content <span className="text-gradient">Editor</span></h1>
          <p className="text-[var(--text-secondary)]">Configure every piece of text, branding, and feature across the platform.</p>
        </div>
        <button onClick={handleReset}
          className="px-5 py-2.5 rounded-xl glass-panel text-rose-500 text-sm font-semibold border border-rose-500/20 hover:bg-rose-500/10 transition-all flex items-center gap-2 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset to Defaults
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Nav */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-2xl p-4 mb-4 text-center grad-rose hidden lg:block">
            <div className="text-4xl mb-2">⚙️</div>
            <p className="text-sm font-bold text-[var(--text-primary)]">Platform Config</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Changes are saved to localStorage and apply instantly across the app.</p>
          </div>
          <div className="flex overflow-x-auto gap-2 pb-1 lg:flex-col lg:overflow-visible lg:pb-0 lg:space-y-2 -mx-1 px-1">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`flex-shrink-0 lg:flex-shrink lg:w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-semibold text-left ${
                active === s.id ? `bg-gradient-to-r ${s.grad} text-white shadow-lg` : 'glass-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)]'
              }`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
              </svg>
              <span className="whitespace-nowrap lg:whitespace-normal">{s.label}</span>
            </button>
          ))}
          </div>
        </div>

        {/* Editor Panel */}
        <div className="lg:col-span-3">
          <div className="glass-panel rounded-3xl overflow-hidden">
            {/* Panel header */}
            <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.06) 0%, transparent 100%)' }}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${activeSection.grad} flex items-center justify-center shadow-md`}>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activeSection.icon} />
                  </svg>
                </div>
                <div>
                  <h2 className="font-bold text-[var(--text-primary)]">{activeSection.label}</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Edit and save to apply changes live</p>
                </div>
              </div>
              <button onClick={saveSection}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all">
                Save Changes
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* ── BRANDING ── */}
              {active === 'branding' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="App Name" value={local.branding.appName} onChange={set(['branding', 'appName'])} hint="Appears in the sidebar, browser tab, and header" />
                    <Field label="Tagline" value={local.branding.tagline} onChange={set(['branding', 'tagline'])} hint="Short description shown below the logo" />
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Logo Image</label>
                      <p className="text-[10px] text-[var(--text-muted)] mb-2">Upload a PNG/JPG for your premium brand logo</p>
                      <div className="flex gap-2">
                        <input 
                          type="file" accept="image/*" 
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => set(['branding', 'logoImage'])(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden" id="logo-upload"
                        />
                        <label htmlFor="logo-upload" className="flex-1 theme-input rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer hover:bg-[var(--glass-bg-hover)] transition-all flex items-center justify-center gap-2 border-dashed border-2">
                          <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          {local.branding.logoImage ? 'Change Logo' : 'Upload Image'}
                        </label>
                        {local.branding.logoImage && (
                          <button onClick={() => set(['branding', 'logoImage'])('')} className="p-2.5 rounded-xl glass-panel text-rose-500 hover:bg-rose-500/10" title="Remove Image">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <Field label="Logo Emoji" value={local.branding.logoEmoji} onChange={set(['branding', 'logoEmoji'])} hint="Used only if no image is uploaded" />
                    <Field label="Footer Text" value={local.branding.footerText} onChange={set(['branding', 'footerText'])} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Primary Accent Color</label>
                    <p className="text-[10px] text-[var(--text-muted)] mb-2">Hex color for primary UI elements</p>
                    <div className="flex items-center gap-3">
                      <input type="color" value={local.branding.primaryColor} onChange={e => set(['branding', 'primaryColor'])(e.target.value)}
                        className="w-12 h-10 rounded-xl border border-[var(--border-medium)] cursor-pointer bg-transparent" />
                      <input type="text" value={local.branding.primaryColor} onChange={e => set(['branding', 'primaryColor'])(e.target.value)}
                        className="theme-input rounded-xl px-3 py-2.5 text-sm flex-1" placeholder="#818cf8" />
                    </div>
                  </div>
                  <div className="glass-panel rounded-2xl p-4 grad-indigo mt-4">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">Live Preview</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-md overflow-hidden">
                        {local.branding.logoImage ? (
                          <img src={local.branding.logoImage} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          local.branding.logoEmoji
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">{local.branding.appName}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{local.branding.tagline}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── LANDING ── */}
              {active === 'landing' && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4">Hero Section</p>
                    <div className="space-y-3">
                      <Field label="Hero Title" value={local.landing.heroTitle} onChange={set(['landing', 'heroTitle'])} />
                      <Field label="Hero Subtitle" value={local.landing.heroSubtitle} onChange={set(['landing', 'heroSubtitle'])} multiline />
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Primary CTA Button" value={local.landing.heroCta} onChange={set(['landing', 'heroCta'])} />
                        <Field label="Secondary Link Text" value={local.landing.heroSecondary} onChange={set(['landing', 'heroSecondary'])} />
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-[var(--border-subtle)] pt-5">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4">Stats Row</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Field label="Stat 1 Label" value={local.landing.stat1Label} onChange={set(['landing', 'stat1Label'])} />
                        <Field label="Stat 1 Value" value={local.landing.stat1Value} onChange={set(['landing', 'stat1Value'])} />
                      </div>
                      <div className="space-y-2">
                        <Field label="Stat 2 Label" value={local.landing.stat2Label} onChange={set(['landing', 'stat2Label'])} />
                        <Field label="Stat 2 Value" value={local.landing.stat2Value} onChange={set(['landing', 'stat2Value'])} />
                      </div>
                      <div className="space-y-2">
                        <Field label="Stat 3 Label" value={local.landing.stat3Label} onChange={set(['landing', 'stat3Label'])} />
                        <Field label="Stat 3 Value" value={local.landing.stat3Value} onChange={set(['landing', 'stat3Value'])} />
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-[var(--border-subtle)] pt-5">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4">Feature Cards</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map(n => (
                        <div key={n} className="glass-panel rounded-2xl p-4 space-y-2">
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Feature {n}</p>
                          <Field label="Title" value={(local.landing as any)[`feature${n}Title`]} onChange={set(['landing', `feature${n}Title`])} />
                          <Field label="Description" value={(local.landing as any)[`feature${n}Desc`]} onChange={set(['landing', `feature${n}Desc`])} multiline />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-[var(--border-subtle)] pt-5">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4">Bottom CTA Section</p>
                    <div className="space-y-3">
                      <Field label="CTA Title" value={local.landing.ctaTitle} onChange={set(['landing', 'ctaTitle'])} />
                      <Field label="CTA Subtitle" value={local.landing.ctaSubtitle} onChange={set(['landing', 'ctaSubtitle'])} multiline />
                    </div>
                  </div>
                </div>
              )}

              {/* ── DASHBOARD ── */}
              {active === 'dashboard' && (
                <div className="space-y-3">
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
                  <div className="border-t border-[var(--border-subtle)] pt-4 space-y-3">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Deals Settings</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Incentive Pool %" type="number" value={local.deals.commissionPoolPct} onChange={set(['deals', 'commissionPoolPct'])} hint="% of sale price allocated to incentives" />
                      <Field label="Direct Advisor Share %" type="number" value={local.deals.agentSplitPct} onChange={set(['deals', 'agentSplitPct'])} hint="% of pool that goes to the direct advisor" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── ALL PAGES ── */}
              {active === 'pages' && (
                <div className="space-y-6">
                  {[
                    { key: 'wallet', label: 'Wallet Page', color: 'text-emerald-500', extra: [
                      { key: 'upgradeBannerTitle', label: 'Upgrade Banner Title' },
                      { key: 'upgradeBannerSubtitle', label: 'Upgrade Banner Subtitle' },
                    ]},
                    { key: 'visits',      label: 'Visits Page',     color: 'text-amber-500',  extra: [] },
                    { key: 'properties',  label: 'Properties Page', color: 'text-purple-500', extra: [] },
                    { key: 'chat',        label: 'Chat Page',       color: 'text-rose-500',   extra: [] },
                    { key: 'settings',    label: 'Settings Page',   color: 'text-cyan-500',   extra: [] },
                  ].map(page => (
                    <div key={page.key} className="glass-panel rounded-2xl p-4 space-y-3">
                      <p className={`text-xs font-bold uppercase tracking-widest ${page.color}`}>{page.label}</p>
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
                  <div className="glass-panel grad-cyan rounded-2xl p-4 mb-4">
                    <p className="text-xs font-bold text-cyan-500 uppercase tracking-wider mb-1">Feature Flags</p>
                    <p className="text-xs text-[var(--text-secondary)]">Enable or disable entire features. Changes apply instantly without redeployment.</p>
                  </div>
                  <Toggle checked={local.features.enableChat} onChange={setBool(['features', 'enableChat'])} label="Enable Chat" desc="Show the Advisor Chat page in navigation" />
                  <Toggle checked={local.features.enableWallet} onChange={setBool(['features', 'enableWallet'])} label="Enable Wallet" desc="Show Earnings & Wallet page" />
                  <Toggle checked={local.features.enableVisits} onChange={setBool(['features', 'enableVisits'])} label="Enable Visits" desc="Show Visit Scheduler page" />
                  <Toggle checked={local.features.enableDeals} onChange={setBool(['features', 'enableDeals'])} label="Enable Deals" desc="Show Deals Incentive Checker page" />
                  <div className="border-t border-[var(--border-subtle)] pt-4 mt-2">
                    <Toggle checked={local.features.maintenanceMode} onChange={setBool(['features', 'maintenanceMode'])} label="Maintenance Mode" desc="Shows a maintenance banner to all advisors (admin still has full access)" />
                    {local.features.maintenanceMode && (
                      <div className="mt-3">
                        <Field label="Maintenance Message" value={local.features.maintenanceMessage} onChange={set(['features', 'maintenanceMessage'])} multiline hint="Displayed to advisors when they visit the portal" />
                      </div>
                    )}
                  </div>
                  {local.features.maintenanceMode && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mt-3">
                      <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-bold text-amber-500">Maintenance Mode is ON</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">Advisors will see the maintenance message. Save changes to apply.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
