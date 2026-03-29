"use client";
import { useState } from 'react';
import { useAppConfig } from '@/context/AppConfigContext';
import { useNotifications } from '@/context/NotificationContext';

export default function AdminCommissionsPage() {
  const { config, updateConfig } = useAppConfig();
  const { addNotification } = useNotifications();
  
  // Local state for the editor
  const [pool, setPool] = useState(config.deals.commissionPoolPct);
  const [agentSplit, setAgentSplit] = useState(config.deals.agentSplitPct);
  const [networkSplit, setNetworkSplit] = useState(config.deals.networkPoolPct);
  const [companySplit, setCompanySplit] = useState(config.deals.companySplitPct);

  // Auto-balancing helper for 3-way split
  const handleSplitChange = (type: 'agent' | 'network' | 'company', newVal: number) => {
    // Current values
    let a = agentSplit;
    let b = networkSplit;
    let c = companySplit;

    if (type === 'agent') {
      const delta = newVal - a;
      const otherSum = b + c;
      if (otherSum === 0) {
        b = (100 - newVal) / 2;
        c = (100 - newVal) / 2;
      } else {
        // Reduce others proportionally
        b = Math.max(0, b - (delta * (b / otherSum)));
        c = 100 - newVal - b; // Ensure exact 100
      }
      a = newVal;
    } else if (type === 'network') {
      const delta = newVal - b;
      const otherSum = a + c;
      if (otherSum === 0) {
        a = (100 - newVal) / 2;
        c = (100 - newVal) / 2;
      } else {
        a = Math.max(0, a - (delta * (a / otherSum)));
        c = 100 - newVal - a;
      }
      b = newVal;
    } else if (type === 'company') {
      const delta = newVal - c;
      const otherSum = a + b;
      if (otherSum === 0) {
        a = (100 - newVal) / 2;
        b = (100 - newVal) / 2;
      } else {
        a = Math.max(0, a - (delta * (a / otherSum)));
        b = 100 - newVal - a;
      }
      c = newVal;
    }

    setAgentSplit(Math.round(a));
    setNetworkSplit(Math.round(b));
    setCompanySplit(Math.round(100 - Math.round(a) - Math.round(b)));
  };
  const [tiers, setTiers] = useState([...(config.deals.tierSplits || [40, 25, 15, 10, 10])]);

  // Simulation state
  const [simSale, setSimSale] = useState(10000000); // 1Cr

  const saveConfig = () => {
    // Basic validation to ensure splits add up to 100
    if (agentSplit + networkSplit + companySplit !== 100) {
      addNotification({ type: 'error', title: 'Invalid Total Split', message: `Your Advisor (${agentSplit}%) + Network (${networkSplit}%) + Company (${companySplit}%) must add up exactly to 100%. Currently: ${agentSplit + networkSplit + companySplit}%`, category: 'system' });
      return;
    }

    updateConfig({
      deals: {
        commissionPoolPct: pool,
        agentSplitPct: agentSplit,
        networkPoolPct: networkSplit,
        companySplitPct: companySplit,
        tierSplits: tiers
      }
    });
    addNotification({
      type: 'success',
      title: 'Incentives Mastered',
      message: 'New 3-Way split structure (Advisor/Network/Company) is now active.',
      category: 'system'
    });
  };

  const updateTier = (idx: number, val: number) => {
    const next = [...tiers];
    next[idx] = val;
    setTiers(next);
  };

  // Math for simulation (based on 80/15/5 model)
  const totalCommissionRupees = simSale * (pool / 100);
  const closingAgentRupees = totalCommissionRupees * (agentSplit / 100);
  const networkPoolRupees = totalCommissionRupees * (networkSplit / 100);
  const companyRupees = totalCommissionRupees * (companySplit / 100);

  return (
    <div className="p-8 relative z-10 w-full max-w-7xl mx-auto text-[var(--text-primary)]">
       <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)]">
            <span className="text-xs font-semibold text-rose-500 uppercase tracking-widest">Financial Engineering</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Incentive <span className="text-gradient">Architect</span></h1>
          <p className="text-[var(--text-secondary)]">Design how the property incentive pool is divided between advisors, network, and company.</p>
        </div>
        <button 
          onClick={saveConfig}
          className="px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black text-sm shadow-xl shadow-rose-500/20 hover:-translate-y-1 transition-all"
        >
          SAVE FINANCIAL MODEL
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Configuration */}
        <div className="space-y-6">
           <div className="glass-panel-glow rounded-[32px] p-8 border border-white/5">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center text-sm">🏛️</span>
                The 3-Way Split (The "Incentive Pool" = 100%)
              </h3>
              
              <div className="space-y-8">
                 {/* Agent Split */}
                 <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Closing Advisor Portion</label>
                      <span className="text-rose-500 font-black">{agentSplit}%</span>
                    </div>
                    <input type="range" min="0" max="100" step="1" value={agentSplit} onChange={e => handleSplitChange('agent', parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500" />
                 </div>

                 {/* Network Pool */}
                 <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Network Payouts (MLM Pool)</label>
                      <span className="text-indigo-400 font-black">{networkSplit}%</span>
                    </div>
                    <input type="range" min="0" max="100" step="1" value={networkSplit} onChange={e => handleSplitChange('network', parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-400" />
                 </div>

                 {/* Company Retention */}
                 <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Company Retention</label>
                      <span className="text-emerald-500 font-black">{companySplit}%</span>
                    </div>
                    <input type="range" min="0" max="100" step="1" value={companySplit} onChange={e => handleSplitChange('company', parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                 </div>

                 <div className={`p-4 rounded-2xl text-center text-xs font-bold transition-all ${agentSplit + networkSplit + companySplit === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    Total Pool Allocation: {agentSplit + networkSplit + companySplit}% 
                    {agentSplit + networkSplit + companySplit !== 100 && ' (Must be exactly 100%)'}
                 </div>
              </div>
           </div>

           <div className="glass-panel-glow rounded-[32px] p-8 border border-white/5">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-sm">📂</span>
                Downline Tier Splitting (of the {networkSplit}% Network Pool)
              </h3>
              
              <div className="space-y-4">
                 {tiers.map((val, idx) => (
                   <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl glass-panel border border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-xs text-indigo-400">L{idx+1}</div>
                      <div className="flex-1">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter mb-1.5 opacity-60">
                           <span>Upline Level {idx+1} Override</span>
                           <span>{val}% of Network Pool</span>
                         </div>
                         <input type="range" min="0" max="50" step="1" value={val} onChange={e => updateTier(idx, parseInt(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                      </div>
                   </div>
                 ))}
                 <div className="p-3 text-[10px] text-center font-bold text-[var(--text-muted)] border-t border-white/5 pt-4">
                    Current sum: {tiers.reduce((a,b)=>a+b, 0)}% of Network Pool
                 </div>
              </div>
           </div>
        </div>

        {/* Right: Real-time Simulator */}
        <div className="sticky top-8">
           <div className="glass-panel-glow rounded-[40px] p-8 border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[100px] rounded-full" />
              
              <div className="relative z-10">
                 <h4 className="text-2xl font-black mb-1 tracking-tighter uppercase text-[var(--text-primary)]">Payout Simulator</h4>
                 <p className="text-xs text-[var(--text-secondary)] mb-8">Visualization based on a property-specific incentive.</p>

                 <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-1.5 block">Property Value</label>
                          <div className="relative">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold opacity-50 text-xs">₹</span>
                             <input type="number" value={simSale} onChange={e => setSimSale(parseInt(e.target.value))} className="w-full theme-input rounded-xl pl-6 pr-3 py-3 font-bold text-sm" />
                          </div>
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-1.5 block">Property Incentive Pct</label>
                          <div className="relative">
                             <input type="number" value={pool} onChange={e => setPool(parseFloat(e.target.value))} className="w-full theme-input rounded-xl px-3 py-3 font-bold text-sm" />
                             <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold opacity-50 text-xs">%</span>
                          </div>
                       </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-5">
                       <div className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
                          <span className="font-bold text-[var(--text-secondary)]">Total Incentive Pool</span>
                          <span className="font-black text-[var(--text-primary)]">₹{totalCommissionRupees.toLocaleString('en-IN')}</span>
                       </div>

                       <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-lg shadow-rose-500/5">
                             <div>
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Advisor Closing Deal ({agentSplit}%)</p>
                                <p className="text-xl font-black text-rose-500">₹{closingAgentRupees.toLocaleString('en-IN')}</p>
                             </div>
                             <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white/90">🤝</div>
                          </div>

                          <div className="p-5 rounded-3xl bg-indigo-500/5 border border-indigo-500/20">
                             <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Network Pool ({networkSplit}%)</span>
                                <span className="text-sm font-black text-indigo-400">₹{networkPoolRupees.toLocaleString('en-IN')}</span>
                             </div>
                             <div className="space-y-2.5">
                                {tiers.map((t, idx) => (
                                   <div key={idx} className="flex justify-between items-center text-[10px]">
                                      <span className="text-[var(--text-muted)] font-bold">Level {idx+1} Override ({t}%)</span>
                                      <span className="text-[var(--text-primary)] font-bold">₹{(networkPoolRupees * (t/100)).toLocaleString('en-IN')}</span>
                                   </div>
                                ))}
                             </div>
                          </div>

                          <div className="flex justify-between items-center p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                             <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-[var(--text-muted)]">Company Retention ({companySplit}%)</span>
                             </div>
                             <span className="text-sm font-black text-emerald-500">₹{companyRupees.toLocaleString('en-IN')}</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
