"use client";
import { useState } from 'react';
import { useProperties, Property } from '@/context/PropertyContext';
import { useNotifications } from '@/context/NotificationContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuditLog } from '@/context/LogContext';

import { useUserProfile } from '@/context/UserProfileContext';

export default function AdminPropertiesPage() {
  const { properties, updateProperty, deleteProperty } = useProperties();
  const { profile } = useUserProfile();
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const { addLog } = useAuditLog();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [negotiatedPct, setNegotiatedPct] = useState<number>(0);

  // 🛡️ ROLE-BASED DATA BOUNDARY
  const isAdmin = profile.role === 'ADMIN' || profile.role === 'Admin';
  const isCompany = profile.role === 'COMPANY' || profile.role === 'Company';
  
  // Filter core data based on ownership/role
  const filteredProperties = properties.filter(p => {
    if (isAdmin) return true;
    if (isCompany) return p.companyEmail === profile.email;
    return false; // Agents shouldn't be here
  });

  const pending = filteredProperties.filter(p => p.status === 'pending');
  const active = filteredProperties.filter(p => p.status === 'approved');

  const handleApprove = (p: Property) => {
    updateProperty(p.id, { 
      status: 'approved',
      commissionPct: negotiatedPct || p.commissionPct 
    });
    setEditingId(null);
    addNotification({
      type: 'success',
      title: 'Property Approved',
      message: `${p.name} is now live for all agents.`,
      category: 'system'
    });
    addLog(`APPROVED Property: ${p.name}`, 'inventory', { propertyId: p.id, status: 'approved' });
  };

  const handleReject = (id: string) => {
    updateProperty(id, { status: 'rejected' });
    const p = properties.find(x => x.id === id);
    addNotification({
      type: 'info',
      title: 'Property Rejected',
      message: 'The listing has been declined.',
      category: 'system'
    });
    addLog(`REJECTED Property: ${p?.name || id}`, 'inventory', { propertyId: id, status: 'rejected' });
  };

  const startNegotiation = (p: Property) => {
    setEditingId(p.id);
    setNegotiatedPct(p.commissionPct);
  };

  return (
    <div className="p-8 relative z-10 w-full max-w-7xl mx-auto text-[var(--text-primary)]">
      <header className="mb-10 flex items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)]">
            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest font-black">Inventory Control</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Project <span className="text-gradient">Portfolio</span></h1>
          <p className="text-[var(--text-secondary)]">
            {isAdmin ? 'System-wide inventory control and listing approvals.' : 'Manage your posted projects and track listing status.'}
          </p>
        </div>
        <div className="flex gap-3">
           {isCompany && (
             <button className="px-6 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Post New Project
             </button>
           )}
           <div className="glass-panel px-6 py-2.5 rounded-2xl flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-tighter text-[var(--text-muted)]">{isAdmin ? 'Pending Review' : 'Under Verification'}</span>
              <span className="text-xl font-black text-indigo-500">{pending.length}</span>
           </div>
        </div>
      </header>

      {/* Pending Queue */}
      <section className="mb-12">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2">
          <span className="animate-pulse w-2 h-2 rounded-full bg-amber-500" />
          Approval Queue
        </h3>
        
        {pending.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border-dashed border-2 border-white/5">
             <div className="text-4xl mb-4 opacity-30">📂</div>
             <p className="font-bold text-[var(--text-secondary)]">No properties currently awaiting review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pending.map(p => (
              <div key={p.id} className="glass-panel rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/5 hover:border-indigo-500/20 transition-all">
                <div className="flex items-center gap-6 flex-1 w-full">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-4xl shadow-lg`}>
                    {p.emoji}
                  </div>
                  <div>
                    <h4 className="text-xl font-black mb-1">{p.name}</h4>
                    <p className="text-sm font-medium text-[var(--text-muted)] flex items-center gap-2">
                      <span>📍 {p.location}</span>
                      <span className="opacity-30">|</span>
                      <span>Owner: {p.companyEmail}</span>
                    </p>
                    <div className="mt-3 flex gap-2">
                       <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">{formatCurrency(p.price)}</span>
                       <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest">Comm: {p.commissionPct}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  {isAdmin ? (
                    editingId === p.id ? (
                      <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
                        <div className="px-3">
                            <label className="text-[10px] font-black uppercase block opacity-50 mb-1">Negotiate %</label>
                            <input 
                              type="number" step="0.1" value={negotiatedPct} onChange={e => setNegotiatedPct(parseFloat(e.target.value))}
                              className="bg-transparent text-sm font-black w-20 outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleApprove(p)} className="p-2.5 rounded-xl bg-emerald-500 text-white hover:scale-105 active:scale-95 transition-all">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-2.5 rounded-xl bg-white/5 text-[var(--text-muted)] hover:text-white">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => startNegotiation(p)} className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-indigo-500/10 text-indigo-500 font-bold text-sm hover:bg-indigo-500/20 transition-all">
                          Edit & Approve
                        </button>
                        <button onClick={() => handleApprove(p)} className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-white text-black font-bold text-sm hover:bg-neutral-200 transition-all shadow-lg">
                          Approve
                        </button>
                        <button onClick={() => handleReject(p.id)} className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all" title="Reject Property">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </>
                    )
                  ) : (
                    <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl flex items-center gap-2">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       Awaiting GXC Admin Approval
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Inventory */}
      <section>
        <h3 className="text-xl font-black mb-6 flex items-center gap-2 opacity-50">
          Live Inventory
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {active.map(p => (
              <div key={p.id} className="glass-panel rounded-3xl p-5 flex items-center gap-4 border border-white/5 opacity-80 hover:opacity-100 grayscale hover:grayscale-0 transition-all">
                 <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-2xl`}>
                    {p.emoji}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="font-bold truncate text-sm">{p.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-black uppercase">{p.commissionPct}% commission</p>
                 </div>
                 <button onClick={() => deleteProperty(p.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
           ))}
        </div>
      </section>
    </div>
  );
}
