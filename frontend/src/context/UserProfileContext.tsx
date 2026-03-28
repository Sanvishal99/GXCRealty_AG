"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  bio: string;
  role: string;
  agentId: string;
  avatarUrl: string | null; // base64 or null
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifsc: string;
  };
  kycDocuments?: {
    idFront: string | null; // base64
    idBack: string | null; // base64
    addressProof: string | null; // base64
  };
}

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setAvatar: (base64: string) => void;
  clearAvatar: () => void;
  impersonateUser: (user: UserProfile) => void;
  stopImpersonating: () => void;
  isImpersonating: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'John Doe',
  email: 'agent1@gxcrealty.com',
  phone: '+91 98765 43210',
  bio: 'Senior real estate agent specializing in luxury properties across Mumbai.',
  role: 'Elite Agent',
  agentId: 'GXC-AG-00142',
  avatarUrl: null,
  bankDetails: {
    accountName: '',
    accountNumber: '',
    bankName: '',
    ifsc: '',
  },
  kycDocuments: {
    idFront: null,
    idBack: null,
    addressProof: null,
  },
};

const UserProfileContext = createContext<UserProfileContextType>({
  profile: DEFAULT_PROFILE,
  updateProfile: () => {},
  setAvatar: () => {},
  clearAvatar: () => {},
  impersonateUser: () => {},
  stopImpersonating: () => {},
  isImpersonating: false
});

const STORAGE_KEY = 'gxc-user-profile';

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const impersonated = localStorage.getItem('gxc-impersonation-active');
      
      if (impersonated) {
        setProfile(JSON.parse(impersonated));
        const orig = localStorage.getItem('gxc-admin-original');
        if (orig) setOriginalProfile(JSON.parse(orig));
      } else if (saved) {
        setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(saved) });
      }
    } catch {}
  }, []);

  const persist = (next: UserProfile) => {
    if (!originalProfile) {
      setProfile(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    } else {
      // If impersonating, only update the temporary profile
      setProfile(next);
      try { localStorage.setItem('gxc-impersonation-active', JSON.stringify(next)); } catch {}
    }
  };

  const impersonateUser = (user: UserProfile) => {
    setOriginalProfile(profile);
    setProfile(user);
    try {
      localStorage.setItem('gxc-admin-original', JSON.stringify(profile));
      localStorage.setItem('gxc-impersonation-active', JSON.stringify(user));
    } catch {}
  };

  const stopImpersonating = () => {
    if (originalProfile) {
      setProfile(originalProfile);
      setOriginalProfile(null);
      try {
        localStorage.removeItem('gxc-admin-original');
        localStorage.removeItem('gxc-impersonation-active');
      } catch {}
    }
  };

  const updateProfile = (patch: Partial<UserProfile>) =>
    persist({ ...profile, ...patch });

  const setAvatar = (base64: string) => persist({ ...profile, avatarUrl: base64 });
  const clearAvatar = () => persist({ ...profile, avatarUrl: null });

  return (
    <UserProfileContext.Provider value={{ 
      profile, 
      updateProfile, 
      setAvatar, 
      clearAvatar,
      impersonateUser,
      stopImpersonating,
      isImpersonating: !!originalProfile
    }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export const useUserProfile = () => useContext(UserProfileContext);
