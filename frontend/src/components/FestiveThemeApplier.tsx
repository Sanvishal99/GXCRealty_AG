"use client";
import { useEffect } from 'react';
import { useAppConfig, FestiveTheme } from '@/context/AppConfigContext';

const FESTIVE_CLASSES: FestiveTheme[] = ['diwali', 'christmas', 'newyear', 'holi', 'eid'];

export default function FestiveThemeApplier() {
  const { config } = useAppConfig();

  useEffect(() => {
    const root = document.documentElement;
    // Remove all festive classes
    FESTIVE_CLASSES.forEach(t => root.classList.remove(`festive-${t}`));
    // Apply the active one
    if (config.festiveTheme && config.festiveTheme !== 'none') {
      root.classList.add(`festive-${config.festiveTheme}`);
    }
  }, [config.festiveTheme]);

  return null;
}
