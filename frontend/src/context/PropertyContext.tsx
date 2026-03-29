"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { properties as propertiesApi } from '@/lib/api';
import { useUserProfile } from './UserProfileContext';
import { isCompany, isAdmin } from '@/lib/constants';

// ── Types (aligned with Prisma schema) ───────────────────────────────────────
export interface UnitType {
  id: string;
  name: string;
  beds: number;
  baths: number;
  balconies?: number;
  superArea: number;
  carpetArea: number;
  minPrice: number;
  maxPrice?: number;
  totalUnits: number;
  availableUnits: number;
}

export interface Property {
  id: string;
  title: string;
  description?: string;
  price: number;
  maxPrice?: number;
  currency: string;
  projectType: string;
  projectStage: string;
  reraId?: string;
  launchDate?: string;
  possessionDate?: string;
  country?: string;
  state?: string;
  city?: string;
  locality?: string;
  address?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  pricePerSqFt?: number;
  bookingAmount?: number;
  maintenanceCharge?: number;
  builderName?: string;
  builderContact?: string;
  builderEmail?: string;
  builderAddress?: string;
  images?: string[];
  amenities?: string[];
  seoTags?: string[];
  visitAvailability?: any;
  approvalType?: string;
  companyId: string;
  company?: { id: string; email: string; phone: string };
  status: string;
  commissionPoolPct: number;
  units: UnitType[];
  documents?: { id: string; type: string; title?: string; url: string }[];
  createdAt: string;
  updatedAt: string;
  // Legacy shape helpers (used in existing UI)
  name?: string;
  location?: any;
  pricing?: any;
  builder?: any;
  settings?: any;
  emoji?: string;
  gradient?: string;
  tag?: string;
  tagColor?: string;
  companyEmail?: string;
}

interface PropertyContextType {
  properties: Property[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addProperty: (data: any) => Promise<Property>;
  updateProperty: (id: string, data: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => void;
}

const PropertyContext = createContext<PropertyContextType>({
  properties: [],
  isLoading: false,
  error: null,
  refresh: async () => {},
  addProperty: async () => { throw new Error('Not initialised'); },
  updateProperty: async () => {},
  deleteProperty: () => {},
});

export function PropertyProvider({ children }: { children: ReactNode }) {
  const { profile, isAuthenticated } = useUserProfile();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data: Property[];
      if (isAuthenticated && isAdmin(profile?.role)) {
        data = await propertiesApi.adminAll();
      } else if (isAuthenticated && isCompany(profile?.role)) {
        data = await propertiesApi.mine();
      } else {
        data = await propertiesApi.list();
      }
      setProperties(normaliseProperties(data));
    } catch (err: any) {
      setError(err.message || 'Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, profile?.role]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addProperty = useCallback(async (data: any): Promise<Property> => {
    const created = await propertiesApi.create(data);
    const normalised = normaliseProperty(created);
    setProperties(prev => [normalised, ...prev]);
    return normalised;
  }, []);

  const updateProperty = useCallback(async (id: string, data: Partial<Property>) => {
    const updated = await propertiesApi.update(id, data);
    const normalised = normaliseProperty(updated);
    setProperties(prev => prev.map(p => p.id === id ? normalised : p));
  }, []);

  const deleteProperty = useCallback((id: string) => {
    // Soft delete: update status to INACTIVE via API
    propertiesApi.update(id, { status: 'INACTIVE' }).then(() => {
      setProperties(prev => prev.filter(p => p.id !== id));
    });
  }, []);

  return (
    <PropertyContext.Provider value={{ properties, isLoading, error, refresh, addProperty, updateProperty, deleteProperty }}>
      {children}
    </PropertyContext.Provider>
  );
}

export const useProperties = () => useContext(PropertyContext);

// ── Normalise API response → unified shape consumed by existing UI ────────────
function normaliseProperty(p: any): Property {
  return {
    ...p,
    // Legacy UI expects `name` → map from `title`
    name: p.name || p.title,
    companyEmail: p.company?.email || p.companyEmail || '',
    // Legacy nested shapes used in PropertyCard / portfolio
    location: p.location || {
      country: p.country, state: p.state, city: p.city,
      area: p.locality, address: p.address, pincode: p.pincode,
      lat: String(p.latitude || ''), lng: String(p.longitude || ''), mapUrl: '',
    },
    pricing: p.pricing || {
      minPrice: p.price, maxPrice: p.maxPrice, pricePerSqFt: p.pricePerSqFt,
      bookingAmount: p.bookingAmount, maintenance: p.maintenanceCharge,
      commissionValue: p.commissionPoolPct, requiredApproval: p.approvalType !== 'AUTO',
    },
    builder: p.builder || {
      name: p.builderName, contact: p.builderContact,
      email: p.builderEmail, address: p.builderAddress,
    },
    units: (p.units || []).map((u: any) => ({
      ...u,
      price: u.price || u.minPrice,
    })),
    // UI decorators (generated locally, not stored)
    emoji: p.emoji || PROJECT_TYPE_EMOJI[p.projectType] || '🏢',
    gradient: p.gradient || PROJECT_TYPE_GRADIENT[p.projectType] || 'from-indigo-500 to-purple-600',
  };
}

function normaliseProperties(data: any[]): Property[] {
  return data.map(normaliseProperty);
}

const PROJECT_TYPE_EMOJI: Record<string, string> = {
  APARTMENT: '🏢', VILLA: '🏡', PLOT: '🌿', COMMERCIAL: '🏬',
};

const PROJECT_TYPE_GRADIENT: Record<string, string> = {
  APARTMENT: 'from-indigo-500 to-purple-600',
  VILLA:     'from-emerald-500 to-teal-600',
  PLOT:      'from-amber-500 to-orange-500',
  COMMERCIAL:'from-rose-500 to-pink-600',
};
