"use client";
import React from 'react';
import { useUserProfile } from '@/context/UserProfileContext';
import { useNotifications } from '@/context/NotificationContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Wallet, Users, Share2, TrendingUp, Calendar, ArrowUpRight, Clock } from 'lucide-react';

export default function AgentDashboard() {
  const { profile } = useUserProfile();
  const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();

  const handleInvite = () => {
    navigator.clipboard.writeText("https://gxcrealty.com/invite/" + profile.agentId);
    addNotification({ type: 'success', title: 'Invite Link Copied!', message: 'Grow your network, grow your wealth.', category: 'system' });
  };

  return (
    <div className="p-6 md:p-8 animate-in slide-in-from-bottom-6 duration-700">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black mb-2 tracking-tight">Agent <span className="text-gradient">Hub</span></h1>
          <p className="text-[var(--text-secondary)] font-medium">Tracking your personal network performance and incentive split.</p>
        </div>
        <button onClick={handleInvite} className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
          <Share2 className="w-4 h-4" /> Invite Partner
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Earning Today', value: formatCurrency(12400), trend: '+₹1,2k', icon: <Wallet className="w-5 h-5 text-emerald-500" /> },
          { label: 'Network Points', value: '4,820', trend: '+124', icon: <Users className="w-5 h-5 text-indigo-500" /> },
          { label: 'Network Size', value: '24', trend: '+2', icon: <TrendingUp className="w-5 h-5 text-purple-500" /> },
          { label: 'Visits Planned', value: '6', trend: 'Next: 2h', icon: <Calendar className="w-5 h-5 text-amber-500" /> },
        ].map((s, i) => (
          <div key={i} className="glass-panel p-6 rounded-[32px] relative overflow-hidden group hover:border-indigo-500/30 transition-all">
            <div className="flex justify-between items-start mb-4">
               <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">{s.icon}</div>
               <span className="text-[10px] font-black text-emerald-500 uppercase">{s.trend}</span>
            </div>
            <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-1">{s.label}</p>
            <h3 className="text-2xl font-black">{s.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Network Tree View */}
        <div className="lg:col-span-2 glass-panel rounded-[42px] p-8 min-h-[500px] border border-white/5 relative overflow-hidden flex flex-col items-center justify-center">
           <div className="absolute top-0 right-0 p-12 opacity-[0.02] rotate-12"><Users className="w-64 h-64" /></div>
           <h3 className="text-xl font-bold mb-12">Tiered Network Visualization</h3>
           
           <div className="relative w-full max-w-lg space-y-6">
              {[1, 2, 3, 4, 5].map((tier, i) => (
                <div key={tier} className="flex items-center gap-4 group">
                  <div className="w-12 text-[10px] font-black opacity-30 uppercase">Tier {tier}</div>
                  <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-1000 group-hover:from-indigo-400 group-hover:to-pink-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${100 - (tier * 15)}%` }} />
                  </div>
                  <div className="w-20 text-right text-xs font-black">{100 - (tier * 15)} Agents</div>
                </div>
              ))}
           </div>
           
           <div className="mt-16 p-6 rounded-[32px] bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/10 flex items-center justify-between gap-8">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><TrendingUp className="w-5 h-5" /></div>
                 <div>
                    <p className="font-bold text-sm">Target Reached: 84%</p>
                    <p className="text-[10px] opacity-40">Add 4 more agents to unlock Tier 6 global pool.</p>
                 </div>
              </div>
              <button className="text-xs font-black text-indigo-500 uppercase tracking-widest p-2 hover:bg-indigo-500/10 rounded-xl transition-all">View Goals →</button>
           </div>
        </div>

        {/* Incentive Logs */}
        <div className="glass-panel p-8 rounded-[42px] border border-white/5">
           <h3 className="text-xl font-bold mb-6">Recent Rewards</h3>
           <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                      T{i}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">Sub-agent Sale Reward</p>
                      <p className="text-[10px] opacity-40 flex items-center gap-1 uppercase tracking-tight"><Clock className="w-3 h-3" /> {i*2}h ago</p>
                   </div>
                   <span className="text-emerald-500 font-bold text-sm">+{formatCurrency(i*2500)}</span>
                </div>
              ))}
           </div>
           <button className="w-full mt-10 py-4 rounded-2xl bg-indigo-500/10 text-indigo-600 font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all">View All Settlements</button>
        </div>
      </div>
    </div>
  );
}
