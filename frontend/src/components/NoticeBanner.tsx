"use client";
import { useState, useEffect } from 'react';
import { useAppConfig, Notice, NoticeType } from '@/context/AppConfigContext';

const SESSION_KEY = 'gxc-dismissed-notices';

function getDismissed(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function dismiss(id: string) {
  const prev = getDismissed();
  sessionStorage.setItem(SESSION_KEY, JSON.stringify([...prev, id]));
}

const TYPE_STYLES: Record<NoticeType, { bg: string; border: string; text: string; icon: string }> = {
  info: {
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.30)',
    text: '#60a5fa',
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  warning: {
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.30)',
    text: '#fbbf24',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  success: {
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.30)',
    text: '#34d399',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  error: {
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.30)',
    text: '#f87171',
    icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
};

function NoticeBannerItem({ notice, onDismiss }: { notice: Notice; onDismiss: () => void }) {
  const s = TYPE_STYLES[notice.type];
  return (
    <div className="flex items-center gap-3 px-5 py-2.5 border-b backdrop-blur-md"
      style={{ background: s.bg, borderColor: s.border }}>
      <svg className="w-4 h-4 flex-shrink-0" style={{ color: s.text }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
      </svg>
      <p className="text-sm font-medium flex-1" style={{ color: s.text }}>{notice.text}</p>
      {notice.dismissible && (
        <button onClick={onDismiss}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: s.text }}
          aria-label="Dismiss">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function NoticeBanner() {
  const { config } = useAppConfig();
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(getDismissed());
  }, []);

  const active = (config.notices ?? []).filter(n => n.active && !dismissed.includes(n.id));
  if (active.length === 0) return null;

  const handleDismiss = (id: string) => {
    dismiss(id);
    setDismissed(prev => [...prev, id]);
  };

  return (
    <div className="sticky top-0 z-40">
      {active.map(n => (
        <NoticeBannerItem key={n.id} notice={n} onDismiss={() => handleDismiss(n.id)} />
      ))}
    </div>
  );
}
