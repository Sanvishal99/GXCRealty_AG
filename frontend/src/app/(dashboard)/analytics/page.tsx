"use client";
import { useState } from 'react';
import { useProperties } from '@/context/PropertyContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { 
  BarChart3, Users, Eye, MousePointer2, 
  Map as MapIcon, Calendar, TrendingUp, 
  ChevronRight, Building2, MapPin, Search, ShieldAlert
} from 'lucide-react';

export default function PropertyAnalyticsPage() {
  const { profile } = useUserProfile();
  const { properties } = useProperties();
  const { formatCurrency } = useCurrency();
  const [selectedProperty, setSelectedProperty] = useState(properties[0]?.id || "");

  const isCompany = profile.role === 'COMPANY' || profile.role === 'Company';
  const myProperties = properties.filter(p => p.companyEmail === profile.email);
  const currentProperty = properties.find(p => p.id === selectedProperty) || properties[0];

  // 🌡️ MOCK HEATMAP DATA (Representing Interest zones in a floorplan)
  const HEATMAP_CELLS = Array.from({ length: 48 }).map((_, i) => ({
    id: i,
    intensity: Math.floor(Math.random() * 100), // Random interest level
    label: `Zone ${i+1}`
  }));

  // VISITOR LOGS
  const VISITOR_TRAFFIC = [
    { day: 'Mon', views: 120, tours: 12 },
    { day: 'Tue', views: 154, tours: 18 },
    { day: 'Wed', views: 98, tours: 8 },
    { day: 'Thu', views: 210, tours: 25 },
    { day: 'Fri', views: 320, tours: 42 },
    { day: 'Sat', views: 450, tours: 68 },
    { day: 'Sun', views: 180, tours: 15 },
  ];

  if (!isCompany) {
    return (
      <div className="p-12 text-center opacity-50">
        <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Access Restricted</h2>
        <p>This deep-analytics view is reserved for Project Developers.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 relative z-10 w-full max-w-7xl mx-auto text-[var(--text-primary)]">
      <header className="mb-10 flex flex-col sm:flex-row justify-between sm:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)]">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">Advanced Telemetry</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Visitor <span className="text-gradient">Intelligence</span></h1>
          <p className="text-[var(--text-secondary)]">Tracking interaction density and conversion velocity across your portfolio.</p>
        </div>
        
        <div className="relative group min-w-[240px]">
           <select 
             value={selectedProperty}
             onChange={(e) => setSelectedProperty(e.target.value)}
             className="w-full theme-input rounded-2xl px-6 py-3.5 appearance-none cursor-pointer border-indigo-500/20 hover:border-indigo-500/40 transition-colors pr-12 font-bold text-sm"
           >
             {myProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
           </select>
           <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40 rotate-90" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Intelligence Summary */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Visual: Property Heatmap Grid */}
          <div className="glass-panel rounded-[40px] p-8 relative overflow-hidden border border-white/5 shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5"><MapIcon className="w-64 h-64" /></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-500">
                <MousePointer2 className="w-5 h-5" />
                Floorplan Engagement Heatmap
              </h3>
              <div className="flex gap-2">
                 <span className="text-[10px] font-bold opacity-40 uppercase">Low Interest</span>
                 <div className="w-24 h-2 bg-gradient-to-r from-indigo-500/10 via-indigo-500/50 to-indigo-500 rounded-full" />
                 <span className="text-[10px] font-bold text-indigo-500 uppercase">High Intensity</span>
              </div>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1.5 relative z-10">
              {HEATMAP_CELLS.map((cell) => (
                <div 
                  key={cell.id}
                  className="aspect-square rounded-md transition-all duration-300 hover:scale-110 cursor-help flex items-center justify-center group"
                  style={{ 
                    backgroundColor: `rgba(99, 102, 241, ${cell.intensity / 100})`,
                    border: '1px solid rgba(255,255,255,0.03)'
                  }}
                  title={`${cell.label}: ${cell.intensity}% engagement`}
                >
                  <span className="text-[8px] opacity-0 group-hover:opacity-100 font-bold transition-opacity">{cell.intensity}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex items-center gap-6 relative z-10">
               <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
               </div>
               <div>
                  <p className="font-bold text-sm">Zone 24 (The Master Suite) has 94% higher interest than the average project area.</p>
                  <p className="text-xs opacity-50">Suggestion: Consider prioritizing finishes in this zone to accelerate closing.</p>
               </div>
            </div>
          </div>

          {/* Traffic Velocity */}
          <div className="glass-panel rounded-[40px] p-8 border border-white/5">
             <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                Visit Conversion Velocity
             </h3>
             <div className="h-48 flex items-end gap-3 px-4">
                {VISITOR_TRAFFIC.map((t, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                     <div className="w-full flex items-end justify-center h-full gap-1">
                        <div className="w-full max-w-[12px] bg-indigo-500/20 rounded-t-lg transition-all group-hover:bg-indigo-500/40" style={{ height: `${(t.views / 450) * 100}%` }} />
                        <div className="w-full max-w-[12px] bg-emerald-500 rounded-t-lg shadow-lg shadow-emerald-500/20 group-hover:scale-y-110 transition-transform" style={{ height: `${(t.tours / 150) * 1000}%` }} />
                     </div>
                     <span className="text-[10px] opacity-30 font-bold uppercase">{t.day}</span>
                  </div>
                ))}
             </div>
             <div className="mt-8 flex gap-8">
                <div className="flex items-center gap-2 text-xs font-bold"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500/20" /> Digital Views</div>
                <div className="flex items-center gap-2 text-xs font-bold"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Physical Site Visits</div>
             </div>
          </div>
        </div>

        {/* Right: Project Profile */}
        <div className="space-y-6">
           <div className="glass-panel rounded-[40px] p-8 border border-white/5 relative overflow-hidden bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500 flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-500/20">
                 <Building2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black mb-2">{currentProperty?.name}</h3>
              <p className="text-sm font-bold opacity-40 mb-6 flex items-center gap-1 uppercase tracking-widest leading-none">
                 <MapPin className="w-3.5 h-3.5" /> {currentProperty?.location}
              </p>
              
              <div className="space-y-4 pt-6 border-t border-white/5">
                 <div className="flex justify-between items-center text-sm">
                    <span className="opacity-40">Asking Price</span>
                    <span className="font-bold text-indigo-500">{formatCurrency(currentProperty?.price || 0)}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="opacity-40">Active Leads</span>
                    <span className="font-bold">482 Qualified</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="opacity-40">Avg. Tour Duration</span>
                    <span className="font-bold">24 Minutes</span>
                 </div>
              </div>

              <button className="w-full mt-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-indigo-500 font-black text-sm hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-2">
                 Generate Full Audit Report PDF
              </button>
           </div>

           {/* Competitive Ranking */}
           <div className="glass-panel rounded-[40px] p-6 border border-white/5">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-40 mb-6 px-2">Network Ranking</h3>
              <div className="space-y-4">
                 {[
                   { name: 'Skyline Penthouse', rank: '#1', trend: 'Hot', color: 'rose' },
                   { name: 'Modern Loft Parel', rank: '#4', trend: 'Stable', color: 'indigo' },
                   { name: 'Azure Villa', rank: '#12', trend: 'Slow', color: 'amber' },
                 ].map((p, i) => (
                   <div key={p.name} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group">
                      <div className={`w-10 h-10 rounded-xl bg-${p.color}-500/10 text-${p.color}-500 flex items-center justify-center font-black group-hover:scale-110 transition-transform`}>
                         {p.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="font-bold text-sm truncate">{p.name}</p>
                         <p className={`text-[10px] font-black uppercase text-${p.color}-500`}>{p.trend}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
