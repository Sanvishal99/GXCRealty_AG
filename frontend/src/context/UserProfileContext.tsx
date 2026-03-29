"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getToken, clearToken, setToken, users as usersApi, ApiError } from '@/lib/api';
import { STORAGE_KEY } from '@/lib/constants';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  role: string;
  status: string;
  inviteCode: string;
  agentId: string;
  avatarUrl: string | null;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifsc: string;
  };
  kycDocuments?: {
    idFront: string | null;
    idBack: string | null;
    addressProof: string | null;
  };
}

interface AuthState {
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isImpersonating: boolean;
}

interface UserProfileContextType extends AuthState {
  login: (token: string, user: any) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setAvatar: (base64: string) => void;
  clearAvatar: () => void;
  impersonateUser: (user: UserProfile) => void;
  stopImpersonating: () => void;
  // Backwards compat — returns profile or safe defaults
  profile: UserProfile;
}

const EMPTY_PROFILE: UserProfile = {
  id: '',
  name: '',
  email: '',
  phone: '',
  bio: '',
  role: '',
  status: '',
  inviteCode: '',
  agentId: '',
  avatarUrl: null,
};

const UserProfileContext = createContext<UserProfileContextType>({
  profile: EMPTY_PROFILE,
  isLoading: true,
  isAuthenticated: false,
  isImpersonating: false,
  login: () => {},
  logout: () => {},
  refreshProfile: async () => {},
  updateProfile: () => {},
  setAvatar: () => {},
  clearAvatar: () => {},
  impersonateUser: () => {},
  stopImpersonating: () => {},
});

function mapApiUser(apiUser: any): UserProfile {
  return {
    id: apiUser.id,
    name: apiUser.name || apiUser.email?.split('@')[0] || '',
    email: apiUser.email,
    phone: apiUser.phone || '',
    bio: apiUser.bio || '',
    role: apiUser.role,
    status: apiUser.status,
    inviteCode: apiUser.inviteCode || '',
    agentId: apiUser.agentId || apiUser.inviteCode || apiUser.id?.slice(0, 8).toUpperCase(),
    avatarUrl: apiUser.avatarUrl || null,
  };
}

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);

  // On mount: try to restore session from stored token
  useEffect(() => {
    const token = getToken();
    if (!token) { setIsLoading(false); return; }

    // Try to restore from cache first for fast load, then refresh
    const cached = localStorage.getItem(STORAGE_KEY.USER_PROFILE);
    if (cached) {
      try { setProfile(JSON.parse(cached)); } catch {}
    }

    // Check for active impersonation
    const impersonated = localStorage.getItem('gxc-impersonation-active');
    const original = localStorage.getItem('gxc-admin-original');
    if (impersonated && original) {
      try {
        setProfile(JSON.parse(impersonated));
        setOriginalProfile(JSON.parse(original));
        setIsLoading(false);
        return;
      } catch {}
    }

    // Refresh from API
    usersApi.me()
      .then(user => {
        const mapped = mapApiUser(user);
        setProfile(mapped);
        localStorage.setItem(STORAGE_KEY.USER_PROFILE, JSON.stringify(mapped));
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          setProfile(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback((token: string, apiUser: any) => {
    setToken(token);
    const mapped = mapApiUser(apiUser);
    setProfile(mapped);
    localStorage.setItem(STORAGE_KEY.USER_PROFILE, JSON.stringify(mapped));
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setProfile(null);
    setOriginalProfile(null);
    localStorage.removeItem('gxc-impersonation-active');
    localStorage.removeItem('gxc-admin-original');
  }, []);

  const refreshProfile = useCallback(async () => {
    const user = await usersApi.me();
    const mapped = mapApiUser(user);
    setProfile(mapped);
    localStorage.setItem(STORAGE_KEY.USER_PROFILE, JSON.stringify(mapped));
  }, []);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY.USER_PROFILE, JSON.stringify(next));
      return next;
    });
  }, []);

  const setAvatar = useCallback((base64: string) => updateProfile({ avatarUrl: base64 }), [updateProfile]);
  const clearAvatar = useCallback(() => updateProfile({ avatarUrl: null }), [updateProfile]);

  const impersonateUser = useCallback((user: UserProfile) => {
    setOriginalProfile(profile);
    setProfile(user);
    try {
      localStorage.setItem('gxc-admin-original', JSON.stringify(profile));
      localStorage.setItem('gxc-impersonation-active', JSON.stringify(user));
    } catch {}
  }, [profile]);

  const stopImpersonating = useCallback(() => {
    if (originalProfile) {
      setProfile(originalProfile);
      setOriginalProfile(null);
      localStorage.removeItem('gxc-admin-original');
      localStorage.removeItem('gxc-impersonation-active');
    }
  }, [originalProfile]);

  return (
    <UserProfileContext.Provider value={{
      profile: profile || EMPTY_PROFILE,
      isLoading,
      isAuthenticated: !!profile,
      isImpersonating: !!originalProfile,
      login,
      logout,
      refreshProfile,
      updateProfile,
      setAvatar,
      clearAvatar,
      impersonateUser,
      stopImpersonating,
    }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export const useUserProfile = () => useContext(UserProfileContext);
