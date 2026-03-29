"use client";
import { useState } from 'react';
import { useProperties, Property } from '@/context/PropertyContext';
import { useNotifications } from '@/context/NotificationContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuditLog } from '@/context/LogContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { 
  Plus, Building2, MapPin, CheckCircle2, Trash2, Clock, 
  ShieldAlert, BarChart3, ChevronRight, Edit3,
  Train, Plane, GraduationCap, Waves, Dumbbell, Car, Shield
} from 'lucide-react';
import PostProjectModal from '@/components/modals/PostProjectModal';

import Link from 'next/link';

export default function PortfolioPage() {
  const { properties, updateProperty, deleteProperty } = useProperties();
  const { profile } = useUserProfile();
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const { addLog } = useAuditLog();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [negotiatedPct, setNegotiatedPct] = useState<number>(0);

  const isAdmin = profile.role === 'ADMIN' || profile.role === 'Admin';
  const isCompany = profile.role === 'COMPANY' || profile.role === 'Company';
  
  const filteredProperties = properties.filter(() => {
    if (isAdmin) return true;
    if (isCompany) return true; // company/mine already scoped to this company
    return false;
  });

  const pending = filteredProperties.filter(p => p.status === 'PENDING_APPROVAL');
  const active  = filteredProperties.filter(p => p.status === 'AVAILABLE');

  const handleApprove = (p: Property) => {
    updateProperty(p.id, { 
      status: 'approved',
      pricing: { ...(p.pricing || {} as any), commissionValue: negotiatedPct || p.pricing?.commissionValue }
    });
    setEditingId(null);
    addNotification({ type: 'success', title: 'Listing Approved', message: `${p.name} is now live.`, category: 'system' });
    addLog(`APPROVED Property: ${p.name}`, 'inventory');
  };

  return (
    <div className="p-6 md:p-8 relative z-10 w-full max-w-7xl mx-auto text-[var(--text-primary)]">
      <header className="mb-10 flex flex-col sm:flex-row justify-between sm:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)] bg-indigo-500/5">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest leading-none">Developer Suite</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-2">Project <span className="text-gradient">Portfolio</span></h1>
          <p className="text-[var(--text-secondary)] font-medium">Manage your active listings and track the verification pipeline.</p>
        </div>
        
        <div className="flex gap-4">
           {isCompany && (
             <Link 
               href="/portfolio/new"
               className="px-8 py-3.5 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-2"
             >
                <Plus className="w-5 h-5" /> Post New Project
             </Link>
           )}
           <div className="glass-panel px-6 py-3.5 rounded-2xl hidden md:flex items-center gap-4 border border-white/5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">{isAdmin ? 'Pending Total' : 'In Verification'}</span>
              <span className="text-2xl font-black text-indigo-500">{pending.length}</span>
           </div>
        </div>
      </header>

      {/* Verification Queue */}
      <section className="mb-16">
        <h3 className="text-xl font-black mb-8 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          {isAdmin ? 'Awaiting Global Review' : 'Verification Queue'}
        </h3>
        
        {pending.length === 0 ? (
          <div className="glass-panel rounded-[42px] p-16 text-center border-dashed border-2 border-white/5 bg-white/5/5">
             <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl mx-auto mb-6 opacity-40">📂</div>
             <p className="font-black text-2xl mb-2 opacity-60">Status: Clear</p>
             <p className="font-bold text-[var(--text-secondary)]">No properties are currently awaiting {isAdmin ? 'your' : 'GXC Admin'} review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pending.map(p => (
              <div key={p.id} className="glass-panel rounded-[32px] p-6 border border-white/10 shadow-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:translate-y-[-4px] transition-all duration-500">
                <div className="flex gap-6 items-center">
                   <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">{p.emoji}</div>
                   <div>
                    <h3 className="text-xl font-black mb-1 group-hover:text-indigo-500 transition-colors uppercase tracking-tight">{p.name}</h3>
                    <p className="text-[10px] font-black opacity-30 flex items-center gap-1.5 leading-none uppercase tracking-widest">
                       <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {typeof p.location === 'string' ? p.location : `${p.location?.area || ''}, ${p.location?.city || ''}`}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                       <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">{formatCurrency(p.pricing?.minPrice || 0)}</div>
                       <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-500 text-[10px] font-black uppercase tracking-widest border border-purple-500/20">Incentive: {p.pricing?.commissionValue || 2}%</div>
                    </div>


                  </div>
                </div>

                <div className="w-full lg:w-auto relative z-10">
                  {isAdmin ? (
                    <div className="flex gap-4">
                       <button onClick={() => setEditingId(p.id)} className="flex-1 lg:flex-none px-8 py-3.5 rounded-2xl bg-indigo-500/10 text-indigo-500 font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Review Audit</button>
                       <button onClick={() => handleApprove(p)} className="flex-1 lg:flex-none px-8 py-3.5 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-neutral-200 shadow-xl">Approve</button>
                    </div>
                  ) : (
                    <div className="flex gap-3 items-center">
                       <Link 
                         href={`/portfolio/new?id=${p.id}`}
                         className="flex-1 lg:flex-none p-3 rounded-xl bg-white/5 text-[var(--text-muted)] hover:text-indigo-500 hover:bg-indigo-500/10 transition-all border border-white/10"
                         title="Edit Pending Project"
                       >
                         <Edit3 className="w-4 h-4" />
                       </Link>
                       <div className="p-3 px-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                             <Clock className="w-4 h-4" />
                          </div>
                          <div className="pr-2 text-left">
                             <p className="text-[8px] font-black uppercase tracking-widest text-amber-500">Pipeline</p>
                             <p className="text-[10px] font-bold opacity-40 uppercase">Awaiting Audit</p>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Live Assets */}
      <section>
        <h3 className="text-lg font-black mb-8 opacity-30 uppercase tracking-[0.2em] flex items-center gap-3">
          <BarChart3 className="w-5 h-5" /> Portfolio Assets
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {active.map(p => (
              <div key={p.id} className="glass-panel rounded-[32px] p-6 border border-white/5 hover:border-indigo-500/20 transition-all group overflow-hidden flex items-center gap-5">
                 <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-3xl shadow-lg group-hover:scale-105 transition-transform`}>
                    {p.emoji}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="font-black truncate text-lg group-hover:text-indigo-500 transition-colors">{p.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1 mb-2">
                       {/* Amenities are now tracked differently, we'll adapt gracefully */}
                       <span className="px-2 py-0.5 rounded-md bg-white/5 text-[8px] font-black uppercase text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                          {p.units?.length || 0} Units Available
                       </span>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <Link href={`/portfolio/new?id=${p.id}`} className="p-2.5 rounded-xl hover:bg-indigo-500/10 text-indigo-500/40 hover:text-indigo-500 transition-all opacity-0 group-hover:opacity-100">
                       <Edit3 className="w-4 h-4" />
                    </Link>
                    <button onClick={() => deleteProperty(p.id)} className="p-2.5 rounded-xl hover:bg-rose-500/10 text-rose-500/20 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                       <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
                 <ChevronRight className="w-5 h-5 opacity-10" />
              </div>
           ))}
        </div>
      </section>
    </div>
  );
}
