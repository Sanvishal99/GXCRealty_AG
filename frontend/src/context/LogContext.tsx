"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUserProfile } from './UserProfileContext';

export interface AuditEntry {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  action: string;
  category: 'financial' | 'inventory' | 'security' | 'system';
  metadata?: any;
}

interface LogContextType {
  logs: AuditEntry[];
  addLog: (action: string, category: AuditEntry['category'], metadata?: any) => void;
  clearLogs: () => void;
}

const LogContext = createContext<LogContextType>({
  logs: [],
  addLog: () => {},
  clearLogs: () => {},
});

const STORAGE_KEY = 'gxc-audit-trail';

export function LogProvider({ children }: { children: ReactNode }) {
  const { profile } = useUserProfile();
  const [logs, setLogs] = useState<AuditEntry[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLogs(JSON.parse(saved));
    } catch {}
  }, []);

  const persist = (next: AuditEntry[]) => {
    setLogs(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const addLog = (action: string, category: AuditEntry['category'], metadata?: any) => {
    const entry: AuditEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      userId: profile?.agentId || 'guest',
      userName: profile?.name || 'Guest User',
      action,
      category,
      metadata
    };
    persist([entry, ...logs.slice(0, 99)]); // Keep last 100 logs
  };

  const clearLogs = () => persist([]);

  return (
    <LogContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LogContext.Provider>
  );
}

export const useAuditLog = () => useContext(LogContext);
