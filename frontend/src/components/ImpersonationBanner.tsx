"use client";
import { useUserProfile } from '@/context/UserProfileContext';
import { UserCog, LogOut, ShieldAlert } from 'lucide-react';

export default function ImpersonationBanner() {
  const { isImpersonating, profile, stopImpersonating } = useUserProfile();

  if (!isImpersonating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-rose-600 via-rose-500 to-rose-700 text-white px-4 py-2.5 shadow-2xl animate-in slide-in-from-top duration-500 flex items-center justify-between gap-6 backdrop-blur-md border-b border-white/20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center animate-pulse">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <p className="text-sm font-black uppercase tracking-widest">Administrative Impersonation Active</p>
          <span className="hidden sm:inline-block opacity-40">|</span>
          <p className="text-sm font-medium">Viewing as: <span className="font-black bg-white/10 px-2 py-0.5 rounded-md underline decoration-rose-300 underline-offset-4">{profile.name}</span> <span className="text-[10px] opacity-70 ml-1">({profile.role})</span></p>
        </div>
      </div>
      
      <button 
        onClick={stopImpersonating}
        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-rose-600 font-bold text-xs hover:bg-rose-50 transition-all hover:scale-105 shadow-lg active:scale-95 group"
      >
        <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Return to Admin
      </button>
    </div>
  );
}
