"use client";
import { createContext, useContext, useState, useCallback, useRef } from "react";

export type NotifType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: "deal" | "kyc" | "visit" | "commission" | "system" | "chat";
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  toasts: Notification[];
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
  dismissToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  toasts: [],
  addNotification: () => {},
  markAllRead: () => {},
  markRead: () => {},
  dismiss: () => {},
  dismissToast: () => {},
});

// Pre-seeded demo notifications
const SEED: Omit<Notification, "id">[] = [
  { type: "success", title: "Deal Confirmed", message: "Your deal on Luxury Villa #3 has been approved by GXC Builders.", timestamp: new Date(Date.now() - 3600000 * 1), read: false, category: "deal" },
  { type: "info",    title: "Incentive Credited", message: "$4,200 incentive from Advisor Sarah's deal credited to your wallet.", timestamp: new Date(Date.now() - 3600000 * 3), read: false, category: "commission" },
  { type: "warning", title: "KYC Pending Review", message: "3 advisors in your downline have pending KYC documents.", timestamp: new Date(Date.now() - 3600000 * 5), read: false, category: "kyc" },
  { type: "info",    title: "Visit Approved", message: "Your visit request for Penthouse Suite has been approved for tomorrow.", timestamp: new Date(Date.now() - 3600000 * 8), read: true, category: "visit" },
  { type: "info",    title: "New Message", message: "Alex (Upline) sent you a message: 'Did you check the new listing?'", timestamp: new Date(Date.now() - 3600000 * 12), read: true, category: "chat" },
  { type: "error",   title: "Visit Rejected", message: "Client Mr. Jones' visit request for Commercial Space was rejected.", timestamp: new Date(Date.now() - 3600000 * 24), read: true, category: "visit" },
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(
    SEED.map((n, i) => ({ ...n, id: `seed-${i}` }))
  );
  const [toasts, setToasts] = useState<Notification[]>([]);
  const toastTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const addNotification = useCallback((n: Omit<Notification, "id" | "timestamp" | "read">) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const notif: Notification = { ...n, id, timestamp: new Date(), read: false };

    setNotifications(prev => [notif, ...prev]);
    setToasts(prev => [notif, ...prev.slice(0, 4)]); // max 5 toasts at once

    // Auto-dismiss toast after 5s
    toastTimers.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    clearTimeout(toastTimers.current[id]);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, toasts, addNotification, markAllRead, markRead, dismiss, dismissToast }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
