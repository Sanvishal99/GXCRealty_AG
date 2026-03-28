"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ── Types ──────────────────────────────────────────────────────────
export interface AppConfig {
  branding: {
    appName: string;
    tagline: string;
    logoEmoji: string;
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
    pageTitle: string;
    pageSubtitle: string;
    stat1Label: string;
    stat2Label: string;
    stat3Label: string;
    stat4Label: string;
    networkTitle: string;
    activityTitle: string;
  };
  deals: {
    pageTitle: string;
    pageSubtitle: string;
    commissionPoolPct: number;
    directSharePct: number;
  };
  wallet: {
    pageTitle: string;
    pageSubtitle: string;
    upgradeBannerTitle: string;
    upgradeBannerSubtitle: string;
  };
  visits: {
    pageTitle: string;
    pageSubtitle: string;
  };
  properties: {
    pageTitle: string;
    pageSubtitle: string;
  };
  chat: {
    pageTitle: string;
    pageSubtitle: string;
  };
  settings: {
    pageTitle: string;
    pageSubtitle: string;
  };
  features: {
    enableChat: boolean;
    enableWallet: boolean;
    enableVisits: boolean;
    enableDeals: boolean;
    maintenanceMode: boolean;
    maintenanceMessage: string;
  };
}

const DEFAULT_CONFIG: AppConfig = {
  branding: {
    appName: 'GXCRealty',
    tagline: 'Exclusive Invite-Only Network',
    logoEmoji: '🏛️',
    primaryColor: '#818cf8',
    footerText: '© 2026 GXCRealty. All rights reserved.',
  },
  landing: {
    heroTitle: 'The Future of Real Estate Investment',
    heroSubtitle: 'Join our exclusive invite-only network of premium agents and unlock industry-leading commission structures.',
    heroCta: 'Request an Invite',
    heroSecondary: 'Agent Login →',
    stat1Label: 'Active Agents', stat1Value: '1,200+',
    stat2Label: 'Properties Listed', stat2Value: '340+',
    stat3Label: 'Revenue Generated', stat3Value: '₹480Cr+',
    feature1Title: 'MLM Commission Engine', feature1Desc: 'Earn passive income from your entire downline network with our transparent multi-tier commission system.',
    feature2Title: 'KYC Verified Network', feature2Desc: 'Every agent is fully verified ensuring a trustworthy and compliant network for everyone.',
    feature3Title: 'Exclusive Properties', feature3Desc: 'Access premium off-market listings not available on public platforms.',
    feature4Title: 'Real-Time Analytics', feature4Desc: 'Track your network growth, earnings, and performance with live dashboards.',
    ctaTitle: 'Ready to Join the Network?',
    ctaSubtitle: 'GXCRealty is invite only. Request access from an existing agent or administrator.',
  },
  dashboard: {
    pageTitle: 'Welcome Back',
    pageSubtitle: "Here's your network overview and recent activity.",
    stat1Label: 'Total Earnings',
    stat2Label: 'Network Size',
    stat3Label: 'Deals Closed',
    stat4Label: 'Active Visits',
    networkTitle: 'Downline Tree View',
    activityTitle: 'Recent Activity',
  },
  deals: {
    pageTitle: 'Close a Deal & Verify Incentive',
    pageSubtitle: 'See your exact commission payout before finalizing the transaction.',
    commissionPoolPct: 5,
    directSharePct: 50,
  },
  wallet: {
    pageTitle: 'Earnings & Wallet',
    pageSubtitle: 'Manage your commissions and network payouts.',
    upgradeBannerTitle: 'Upgrade to Elite Agent Status',
    upgradeBannerSubtitle: 'Earn 15% more on all tier commissions and unlock priority listings.',
  },
  visits: {
    pageTitle: 'Visit Scheduler',
    pageSubtitle: 'Manage client viewings and property access in real time.',
  },
  properties: {
    pageTitle: 'Exclusive Properties',
    pageSubtitle: 'Discover premium real estate for your high-net-worth clients.',
  },
  chat: {
    pageTitle: 'Agent Network Chat',
    pageSubtitle: 'Communicate securely with your upline and downline.',
  },
  settings: {
    pageTitle: 'User Settings',
    pageSubtitle: 'Manage your profile, preferences, and account security.',
  },
  features: {
    enableChat: true,
    enableWallet: true,
    enableVisits: true,
    enableDeals: true,
    maintenanceMode: false,
    maintenanceMessage: 'We are performing scheduled maintenance. Please check back shortly.',
  },
};

// ── Context ────────────────────────────────────────────────────────
interface AppConfigContextType {
  config: AppConfig;
  updateConfig: (patch: DeepPartial<AppConfig>) => void;
  resetConfig: () => void;
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

const AppConfigContext = createContext<AppConfigContextType>({
  config: DEFAULT_CONFIG,
  updateConfig: () => {},
  resetConfig: () => {},
});

function deepMerge<T>(base: T, patch: DeepPartial<T>): T {
  const result = { ...base };
  for (const key in patch) {
    const patchVal = patch[key as keyof typeof patch];
    const baseVal = base[key as keyof T];
    if (patchVal && typeof patchVal === 'object' && !Array.isArray(patchVal) && typeof baseVal === 'object') {
      (result as any)[key] = deepMerge(baseVal as any, patchVal as any);
    } else if (patchVal !== undefined) {
      (result as any)[key] = patchVal;
    }
  }
  return result;
}

const STORAGE_KEY = 'gxc-app-config';

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setConfig(deepMerge(DEFAULT_CONFIG, JSON.parse(saved)));
    } catch {}
  }, []);

  const updateConfig = (patch: DeepPartial<AppConfig>) => {
    setConfig(prev => {
      const next = deepMerge(prev, patch);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <AppConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export const useAppConfig = () => useContext(AppConfigContext);
