"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { config as configApi } from '@/lib/api';
import { STORAGE_KEY } from '@/lib/constants';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AppConfig {
  branding: {
    appName: string;
    tagline: string;
    logoEmoji: string;
    logoImage: string;
    primaryColor: string;
    footerText: string;
  };
  landing: {
    heroTitle: string;
    heroSubtitle: string;
    heroCta: string;
    heroSecondary: string;
    stat1Label: string; stat1Value: string;
    stat2Label: string; stat2Value: string;
    stat3Label: string; stat3Value: string;
    feature1Title: string; feature1Desc: string;
    feature2Title: string; feature2Desc: string;
    feature3Title: string; feature3Desc: string;
    feature4Title: string; feature4Desc: string;
    ctaTitle: string;
    ctaSubtitle: string;
  };
  dashboard: {
    pageTitle: string; pageSubtitle: string;
    stat1Label: string; stat2Label: string; stat3Label: string; stat4Label: string;
    networkTitle: string; activityTitle: string;
  };
  deals: {
    pageTitle: string; pageSubtitle: string;
    commissionPoolPct: number;
    agentSplitPct: number;
    networkPoolPct: number;
    companySplitPct: number;
    tierSplits: number[];
  };
  wallet: { pageTitle: string; pageSubtitle: string; upgradeBannerTitle: string; upgradeBannerSubtitle: string };
  visits: { pageTitle: string; pageSubtitle: string };
  properties: { pageTitle: string; pageSubtitle: string };
  chat: { pageTitle: string; pageSubtitle: string };
  settings: { pageTitle: string; pageSubtitle: string };
  features: {
    enableChat: boolean; enableWallet: boolean; enableVisits: boolean;
    enableDeals: boolean; maintenanceMode: boolean; maintenanceMessage: string;
  };
}

const DEFAULT_CONFIG: AppConfig = {
  branding: {
    appName: 'GXCRealty',
    tagline: 'Exclusive Invite-Only Network',
    logoEmoji: '🏛️',
    logoImage: '',
    primaryColor: '#818cf8',
    footerText: '© 2026 GXCRealty. All rights reserved.',
  },
  landing: {
    heroTitle: 'The Future of Real Estate Investment',
    heroSubtitle: 'Join our exclusive invite-only network of premium advisors.',
    heroCta: 'Request an Invite', heroSecondary: 'Advisor Login →',
    stat1Label: 'Active Advisors', stat1Value: '—',
    stat2Label: 'Properties Listed', stat2Value: '—',
    stat3Label: 'Revenue Generated', stat3Value: '—',
    feature1Title: 'MLM Incentive Engine', feature1Desc: 'Multi-tier incentive distribution from your downline.',
    feature2Title: 'KYC Verified Network', feature2Desc: 'Every advisor fully verified for compliance.',
    feature3Title: 'Exclusive Properties', feature3Desc: 'Premium off-market listings.',
    feature4Title: 'Real-Time Analytics', feature4Desc: 'Live performance dashboards.',
    ctaTitle: 'Ready to Join the Network?',
    ctaSubtitle: 'GXCRealty is invite only. Request access from an existing advisor.',
  },
  dashboard: {
    pageTitle: 'Welcome Back', pageSubtitle: "Here's your network overview.",
    stat1Label: 'Total Earnings', stat2Label: 'Network Size',
    stat3Label: 'Deals Closed', stat4Label: 'Active Visits',
    networkTitle: 'Downline Tree', activityTitle: 'Recent Activity',
  },
  deals: {
    pageTitle: 'Deal Settlements', pageSubtitle: 'Submit and verify incentive payouts.',
    commissionPoolPct: 2,
    agentSplitPct: 80,
    networkPoolPct: 15,
    companySplitPct: 5,
    tierSplits: [40, 25, 15, 10, 10],
  },
  wallet: {
    pageTitle: 'Earnings & Wallet', pageSubtitle: 'Manage your incentives.',
    upgradeBannerTitle: 'Upgrade to Elite Advisor', upgradeBannerSubtitle: 'Earn more on tier incentives.',
  },
  visits: { pageTitle: 'Visit Scheduler', pageSubtitle: 'Manage client viewings.' },
  properties: { pageTitle: 'Exclusive Properties', pageSubtitle: 'Premium real estate listings.' },
  chat: { pageTitle: 'Advisor Network Chat', pageSubtitle: 'Secure messaging with your network.' },
  settings: { pageTitle: 'User Settings', pageSubtitle: 'Manage your profile and preferences.' },
  features: {
    enableChat: true, enableWallet: true, enableVisits: true, enableDeals: true,
    maintenanceMode: false, maintenanceMessage: 'Scheduled maintenance in progress.',
  },
};

// ── Merge remote GlobalConfig into AppConfig ──────────────────────────────────
function mergeRemoteConfig(local: AppConfig, remote: any): AppConfig {
  if (!remote) return local;

  // Start with local, then overlay saved contentJson (all sections), then deals/branding from DB columns
  const fromContent: Partial<AppConfig> = remote.contentJson ?? {};

  return deepMerge(
    deepMerge(local, fromContent as any),
    {
      branding: {
        ...(remote.brandingEmoji && { logoEmoji: remote.brandingEmoji }),
        ...(remote.brandingLogoUrl && { logoImage: remote.brandingLogoUrl }),
      },
      deals: {
        ...(remote.commissionPoolPct !== undefined && { commissionPoolPct: remote.commissionPoolPct }),
        ...(remote.agentSplitPct !== undefined && { agentSplitPct: remote.agentSplitPct }),
        ...(remote.networkPoolPct !== undefined && { networkPoolPct: remote.networkPoolPct }),
        ...(remote.companySplitPct !== undefined && { companySplitPct: remote.companySplitPct }),
        ...(remote.tierSplits !== undefined && { tierSplits: remote.tierSplits }),
      },
    } as any,
  );
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

function deepMerge<T>(base: T, patch: DeepPartial<T>): T {
  const result = { ...base };
  for (const key in patch) {
    const pv = patch[key as keyof typeof patch];
    const bv = base[key as keyof T];
    if (pv && typeof pv === 'object' && !Array.isArray(pv) && typeof bv === 'object') {
      (result as any)[key] = deepMerge(bv as any, pv as any);
    } else if (pv !== undefined) {
      (result as any)[key] = pv;
    }
  }
  return result;
}

// ── Context ───────────────────────────────────────────────────────────────────
interface AppConfigContextType {
  config: AppConfig;
  isLoading: boolean;
  updateConfig: (patch: DeepPartial<AppConfig>) => void;
  resetConfig: () => void;
}

const AppConfigContext = createContext<AppConfigContextType>({
  config: DEFAULT_CONFIG,
  isLoading: true,
  updateConfig: () => { },
  resetConfig: () => { },
});

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Restore any local admin overrides from previous session
    try {
      const saved = localStorage.getItem(STORAGE_KEY.APP_CONFIG);
      if (saved) setConfig(deepMerge(DEFAULT_CONFIG, JSON.parse(saved)));
    } catch { }

    // 2. Fetch live GlobalConfig from backend and merge
    configApi.get()
      .then(remote => {
        setConfig(prev => mergeRemoteConfig(prev, remote));
      })
      .catch(() => { /* server unavailable — keep defaults */ })
      .finally(() => setIsLoading(false));
  }, []);

  const updateConfig = useCallback((patch: DeepPartial<AppConfig>) => {
    setConfig(prev => {
      const next = deepMerge(prev, patch);
      try { localStorage.setItem(STORAGE_KEY.APP_CONFIG, JSON.stringify(next)); } catch { }
      return next;
    });
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    try { localStorage.removeItem(STORAGE_KEY.APP_CONFIG); } catch { }
  }, []);

  return (
    <AppConfigContext.Provider value={{ config, isLoading, updateConfig, resetConfig }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export const useAppConfig = () => useContext(AppConfigContext);
