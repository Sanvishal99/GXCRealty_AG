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
}

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setAvatar: (base64: string) => void;
  clearAvatar: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'John Doe',
  email: 'agent1@gxcrealty.com',
  phone: '+91 98765 43210',
  bio: 'Senior real estate agent specializing in luxury properties across Mumbai.',
  role: 'Elite Agent',
  agentId: 'GXC-AG-00142',
  avatarUrl: null,
};

const UserProfileContext = createContext<UserProfileContextType>({
  profile: DEFAULT_PROFILE,
  updateProfile: () => {},
  setAvatar: () => {},
  clearAvatar: () => {},
});

const STORAGE_KEY = 'gxc-user-profile';

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(saved) });
    } catch {}
  }, []);

  const persist = (next: UserProfile) => {
    setProfile(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const updateProfile = (patch: Partial<UserProfile>) =>
    persist({ ...profile, ...patch });

  const setAvatar = (base64: string) => persist({ ...profile, avatarUrl: base64 });
  const clearAvatar = () => persist({ ...profile, avatarUrl: null });

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile, setAvatar, clearAvatar }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export const useUserProfile = () => useContext(UserProfileContext);
