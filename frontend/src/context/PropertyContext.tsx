"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUserProfile } from './UserProfileContext';

export interface Property {
  id: string;
  name: string;
  location: string;
  beds: number;
  baths: number;
  area: string;
  price: number;
  commissionPct: number;
  tag: string;
  tagColor: string;
  gradient: string;
  emoji: string;
  companyEmail: string; // Ownership
  status: 'pending' | 'approved' | 'rejected';
  images: string[]; // Mock or real Cloud storage URLs
  proximity: {
    station: string;
    airport: string;
    metro: string;
    school: string;
  };
  amenities: string[];
  createdAt: number;
}

interface PropertyContextType {
  properties: Property[];
  addProperty: (prop: Omit<Property, 'id' | 'companyEmail' | 'createdAt'>) => void;
  updateProperty: (id: string, prop: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
}

const DEFAULT_PROPERTIES: Property[] = [
  { id: '1', name: 'Luxury Villa', location: 'South Mumbai', beds: 5, baths: 4, area: '6,200', price: 120000000, commissionPct: 2, tag: 'Featured', tagColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30', gradient: 'from-amber-500/20 to-orange-500/10', emoji: '🌴', companyEmail: 'company@gxcrealty.com', status: 'approved', images: [], proximity: { station: '0.5 km', airport: '12 km', metro: '1 km', school: '0.2 km' }, amenities: ['pool', 'gym', 'club'], createdAt: Date.now() - 10000 },
  { id: '2', name: 'Sky Penthouse', location: 'BKC, Mumbai', beds: 4, baths: 3, area: '4,800', price: 85000000, commissionPct: 2, tag: 'New', tagColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30', gradient: 'from-indigo-500/20 to-purple-500/10', emoji: '🏙️', companyEmail: 'company@gxcrealty.com', status: 'approved', images: [], proximity: { station: '2 km', airport: '6 km', metro: '0.1 km', school: '1 km' }, amenities: ['security'], createdAt: Date.now() - 20000 },
  { id: '3', name: 'Modern Condo', location: 'Bandra West', beds: 3, baths: 2, area: '2,100', price: 35000000, commissionPct: 2, tag: 'Available', tagColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', gradient: 'from-emerald-500/20 to-teal-500/10', emoji: '🏠', companyEmail: 'other@gxcrealty.com', status: 'pending', images: [], proximity: { station: '1 km', airport: '8 km', metro: '0.5 km', school: '0.4 km' }, amenities: ['parking', 'garden'], createdAt: Date.now() - 30000 },
];

const PropertyContext = createContext<PropertyContextType>({
  properties: [],
  addProperty: () => {},
  updateProperty: () => {},
  deleteProperty: () => {},
});

const STORAGE_KEY = 'gxc-properties';

export function PropertyProvider({ children }: { children: ReactNode }) {
  const { profile } = useUserProfile();
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setProperties(JSON.parse(saved));
      } else {
        setProperties(DEFAULT_PROPERTIES);
      }
    } catch {
      setProperties(DEFAULT_PROPERTIES);
    }
  }, []);

  const persist = (next: Property[]) => {
    setProperties(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const addProperty = (prop: Omit<Property, 'id' | 'companyEmail' | 'createdAt'>) => {
    const isAdmin = profile.role?.toUpperCase() === 'ADMIN';
    const newProp: Property = {
      ...prop,
      id: Math.random().toString(36).substr(2, 9),
      companyEmail: profile.email || '',
      status: isAdmin ? 'approved' : 'pending',
      createdAt: Date.now(),
    };
    persist([newProp, ...properties]);
  };

  const updateProperty = (id: string, updates: Partial<Property>) => {
    persist(properties.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProperty = (id: string) => {
    persist(properties.filter(p => p.id !== id));
  };

  return (
    <PropertyContext.Provider value={{ properties, addProperty, updateProperty, deleteProperty }}>
      {children}
    </PropertyContext.Provider>
  );
}

export const useProperties = () => useContext(PropertyContext);
