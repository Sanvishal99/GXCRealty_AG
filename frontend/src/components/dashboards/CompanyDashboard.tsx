"use client";
import React from 'react';
import { useUserProfile } from '@/context/UserProfileContext';
import { useProperties } from '@/context/PropertyContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Building2, MousePointer2, Calendar, CheckCircle2, Plus, BarChart3, Users, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function CompanyDashboard() {
  const { profile } = useUserProfile();
  const { properties } = useProperties();
  const { formatCurrency } = useCurrency();

  const myProps = properties.filter(p => p.companyEmail === profile.email);
  const totalVal = myProps.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="p-6 md:p-8 animate-in slide-in-from-bottom-6 duration-700">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black mb-2 tracking-tight">Developer <span className="text-gradient">Portal</span></h1>
          <p className="text-[var(--text-secondary)] font-medium">Managing project logistics and portfolio growth.</p>
        </div>
        <Link href="/portfolio" className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Post New Project
        </Link>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Portfolio Value', value: formatCurrency(totalVal), trend: 'Active', icon: <Building2 className="w-5 h-5 text-indigo-500" />, color: 'indigo' },
          { label: 'Active Projects', value: myProps.length.toString(), trend: 'Portfolio', icon: <Plus className="w-5 h-5 text-emerald-500" />, color: 'emerald' },
          { label: 'Pending Deals', value: '3', trend: 'Approval Req.', icon: <CheckCircle2 className="w-5 h-5 text-amber-500" />, color: 'amber' },
          { label: 'Visit Requests', value: '12', trend: '+4', icon: <Calendar className="w-5 h-5 text-rose-500" />, color: 'rose' },
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
        {/* Visitor Intel Section */}
        <div className="lg:col-span-2 glass-panel rounded-[42px] p-8 border border-white/5 min-h-[500px] flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2">
                 <MousePointer2 className="w-5 h-5 text-indigo-500" />
                 Engagement Intel
              </h3>
              <Link href="/analytics" className="text-xs font-black text-indigo-500 uppercase tracking-widest hover:underline">Deep Audit →</Link>
           </div>
           
           <div className="flex-1 flex items-end gap-2 px-6">
              {[40, 85, 45, 90, 65, 75, 80, 50, 95, 60].map((h, i) => (
                <div key={i} className="flex-1 group relative h-48">
                   <div className="h-full bg-white/5 rounded-t-xl relative flex items-end">
                      <div 
                        className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-xl transition-all duration-1000 group-hover:from-indigo-400 group-hover:to-pink-500 group-hover:scale-y-110 shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
                        style={{ height: `${h}%` }} 
                      />
                   </div>
                </div>
              ))}
           </div>
           
           <div className="mt-12 grid grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase opacity-40 mb-1">Total Digital Interest</p>
                    <p className="text-xl font-bold">12,840 Views</p>
                 </div>
                 <Users className="w-8 h-8 opacity-10" />
              </div>
              <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase opacity-40 mb-1">Conversion Target</p>
                    <p className="text-xl font-bold text-emerald-500">2.4% tours</p>
                 </div>
                 <ArrowUpRight className="w-8 h-8 opacity-10" />
              </div>
           </div>
        </div>

        {/* Pending Actions for Company */}
        <div className="glass-panel p-8 rounded-[42px] border border-white/5">
           <h3 className="text-xl font-bold mb-6">Approval Queue</h3>
           <div className="space-y-4">
              {[
                { title: 'Skyline Penthouse', action: 'Approve Visit', id: '#V-82', color: 'indigo' },
                { title: 'Azure Villa Sale', action: 'Confirm Settlement', id: '#D-11', color: 'emerald' },
                { title: 'Site Inspection', action: 'Confirm Guide', id: '#V-90', color: 'rose' },
                { title: 'Project Update', action: 'Verify Listing', id: '#P-04', color: 'amber' },
              ].map(i => (
                <div key={i.id} className="p-4 rounded-3xl bg-white/5 border border-white/10 flex flex-col gap-3 group hover:border-indigo-500/20 transition-all">
                   <div className="flex justify-between items-start">
                      <p className="font-bold text-sm truncate">{i.title}</p>
                      <span className="text-[10px] opacity-40">{i.id}</span>
                   </div>
                   <button className="w-full py-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                      {i.action}
                   </button>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
