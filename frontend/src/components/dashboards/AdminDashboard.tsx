"use client";
import React from 'react';
import { useUserProfile } from '@/context/UserProfileContext';
import { useProperties } from '@/context/PropertyContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ShieldAlert, Users, TrendingUp, BarChart3, ShieldCheck, Mail, ArrowUpRight, Plus, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { profile } = useUserProfile();
  const { properties } = useProperties();
  const { formatCurrency } = useCurrency();

  const pendingProps = properties.filter(p => p.status === 'pending');

  return (
    <div className="p-6 md:p-8 animate-in slide-in-from-bottom-6 duration-700">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black mb-2 tracking-tight">Admin <span className="text-gradient">Console</span></h1>
          <p className="text-[var(--text-secondary)] font-medium">System-wide governance and network health monitoring.</p>
        </div>
        <div className="flex gap-3">
           <Link href="/admin/users" className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
             <Users className="w-4 h-4" /> Network Governance
           </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Platform Revenue', value: formatCurrency(28400000), trend: '+22%', icon: <TrendingUp className="w-5 h-5 text-emerald-500" />, color: 'emerald' },
          { label: 'Global Network', value: '4,840', trend: '+124', icon: <Users className="w-5 h-5 text-indigo-500" />, color: 'indigo' },
          { label: 'Inventory Review', value: pendingProps.length.toString(), trend: 'Urgent', icon: <Plus className="w-5 h-5 text-amber-500" />, color: 'amber' },
          { label: 'Platform Uptime', value: '99.9%', trend: 'Stable', icon: <ShieldCheck className="w-5 h-5 text-cyan-500" />, color: 'cyan' },
        ].map((s, i) => (
          <div key={i} className="glass-panel p-6 rounded-[32px] relative overflow-hidden group hover:border-indigo-500/30 transition-all">
            <div className="flex justify-between items-start mb-4">
               <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">{s.icon}</div>
               <span className={`text-[10px] font-black text-${s.color}-500 uppercase`}>{s.trend}</span>
            </div>
            <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-1">{s.label}</p>
            <h3 className="text-2xl font-black">{s.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global Growth Analytics */}
        <div className="lg:col-span-2 glass-panel rounded-[42px] p-8 border border-white/5 min-h-[500px] flex flex-col relative overflow-hidden bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent">
           <div className="absolute top-0 right-0 p-12 opacity-[0.02] rotate-12"><ShieldAlert className="w-64 h-64" /></div>
           <h3 className="text-xl font-bold flex items-center gap-2 mb-8">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Global Revenue Architecture
           </h3>
           
           <div className="flex-1 flex items-end gap-1 px-4 relative z-10">
              {[60, 45, 80, 55, 95, 75, 85, 90, 65, 80, 100, 70, 90, 85, 95].map((h, i) => (
                <div key={i} className="flex-1 group relative h-48">
                   <div 
                     className="w-full bg-indigo-500/20 rounded-t-lg transition-all absolute bottom-0 hover:bg-indigo-500/60 cursor-pointer" 
                     style={{ height: `${h}%` }} 
                   />
                </div>
              ))}
           </div>
           
           <div className="mt-12 flex gap-8 relative z-10">
              <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex-1">
                 <p className="text-[10px] font-black uppercase opacity-40 mb-1">Avg Incentive Velocity</p>
                 <p className="text-xl font-bold text-emerald-500">₹8,40,000 / Day</p>
              </div>
              <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex-1">
                 <p className="text-[10px] font-black uppercase opacity-40 mb-1">Global Retention</p>
                 <p className="text-xl font-bold text-indigo-500">98.4% Yearly</p>
              </div>
           </div>
        </div>

        {/* Admin Alerts & Security Queue */}
        <div className="glass-panel p-8 rounded-[42px] border border-white/5">
           <h3 className="text-xl font-bold mb-6 flex items-center justify-between">
              Critical Actions
              <span className="p-1 px-3 rounded-xl bg-indigo-500 text-white text-[10px] font-black animate-pulse">LIVE</span>
           </h3>
           
           <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between group cursor-pointer hover:bg-amber-500/20 transition-all">
                 <div className="flex items-center gap-4">
                    <ShieldAlert className="w-8 h-8 text-amber-500" />
                    <div>
                       <p className="font-bold text-sm">{pendingProps.length} Items Awaiting Review</p>
                       <p className="text-xs opacity-50">Manual audit required.</p>
                    </div>
                 </div>
                 <ArrowUpRight className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
              </div>

              {[
                { label: 'KYC Document Sync', owner: 'GXC System', time: '12m ago', icon: <CheckCircle2 className="w-5 h-5" /> },
                { label: 'Direct Invitation Key', owner: 'Admin #001', time: '1h ago', icon: <Mail className="w-5 h-5" /> },
                { label: 'Network Limit Warning', owner: 'Elite Cluster', time: '4h ago', icon: <ShieldAlert className="w-5 h-5" /> },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-white/5 transition-all text-sm group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                     {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{item.label}</p>
                    <p className="text-[10px] opacity-40 uppercase tracking-tighter">{item.owner} • {item.time}</p>
                  </div>
                </div>
              ))}
           </div>
           
           <button className="w-full mt-10 py-4 rounded-2xl bg-indigo-500/10 text-indigo-600 font-bold text-xs hover:bg-neutral-800 transition-all">
              Initialize System-wide Audit
           </button>
        </div>
      </div>
    </div>
  );
}
