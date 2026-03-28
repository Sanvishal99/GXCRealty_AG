"use client";
import { useState } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAppConfig } from '@/context/AppConfigContext';
import { useUserProfile } from '@/context/UserProfileContext';

export default function DashboardPage() {
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const { config } = useAppConfig();
  const { profile } = useUserProfile();
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const [zoomStyle, setZoomStyle] = useState({ scale: 1, translateX: 0, translateY: 0 });

  const toggleNode = (id: string, leftVal: number, topVal: number, parentId: string | null = null, depth: number) => {
    // Generate the path chain
    let newActive = [id];
    if (depth === 2 && parentId) newActive = [parentId, id];
    if (depth === 3 && parentId) newActive = ['A1', parentId, id]; // specific hardcode path for MVP example

    setActiveNodes(newActive);
    
    // Exponential scale per depth: Level 1 -> 1.3, Level 2 -> 1.6, Level 3 -> 1.9
    const zoomLevel = 1 + (depth * 0.3);
      
    // Always translate to precisely center the selected node (and slightly pan up to reveal children)
    setZoomStyle({ 
      scale: zoomLevel, 
      translateX: (50 - leftVal) * (zoomLevel * 0.6), 
      translateY: (50 - topVal) * (zoomLevel * 0.6) + (depth * -10)
    });
  };

  const handleReset = () => {
    setActiveNodes([]);
    setZoomStyle({ scale: 1, translateX: 0, translateY: 0 });
  };

  const handleInvite = () => {
    navigator.clipboard.writeText("https://gxcrealty.com/invite/john-doe-123");
    addNotification({
      type: 'success',
      title: 'Invite Link Copied!',
      message: 'Your unique agent referral link has been copied to your clipboard.',
      category: 'system'
    });
  };

  return (
    <div className="p-8 mt-12 md:mt-0 relative z-10 w-full text-[var(--text-primary)]">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">{config.dashboard.pageTitle}, <span className="text-indigo-500">{profile.name.split(' ')[0]}</span></h1>
          <p className="text-[var(--text-secondary)]">{config.dashboard.pageSubtitle}</p>
        </div>
        <button onClick={handleInvite} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2.5 rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.3)] font-semibold hover:-translate-y-0.5 transition-all">
          Invite Agent
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: config.dashboard.stat1Label, value: formatCurrency(45200), trend: '+14%', color: 'text-emerald-500' },
          { label: config.dashboard.stat2Label, value: '1,240', trend: '+5%', color: 'text-indigo-500' },
          { label: config.dashboard.stat3Label, value: '18', trend: '+2', color: 'text-purple-500' },
          { label: config.dashboard.stat4Label, value: '5', trend: '-1', color: 'text-rose-500' },
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-[var(--border-medium)] transition-all">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-[var(--glow-primary)] rounded-full blur-2xl group-hover:scale-150 transition-all opacity-40" />
            <p className="text-[var(--text-secondary)] text-sm font-medium mb-1">{stat.label}</p>
            <div className="flex items-end gap-3 z-10 relative">
              <h3 className="text-3xl font-bold text-[var(--text-primary)]">{stat.value}</h3>
              <span className={`text-sm font-medium mb-1 ${stat.color}`}>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Network Tree Overview - FLAT 2D */}
        <div className="lg:col-span-2 glass-panel p-0 rounded-2xl flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
          <div className="absolute top-6 left-6 right-6 z-30 flex items-center justify-between">
            <h3 className="text-xl font-bold text-[var(--text-primary)] drop-shadow-sm">{config.dashboard.networkTitle}</h3>
            {activeNodes.length > 0 && (
               <button onClick={handleReset} className="px-5 py-1.5 bg-indigo-500 text-white hover:bg-rose-500 border border-[var(--border-subtle)] hover:border-rose-400 text-xs font-bold rounded-full transition-all animate-in fade-in slide-in-from-right-4 shadow-lg flex items-center gap-2 cursor-pointer z-50">
                 Reset ✕
               </button>
            )}
          </div>
          
          {/* Background Trigger removed - User explicitly requires button-only zoom out */}

          <div 
            className="w-full h-full relative mt-0 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] origin-center"
            style={{ 
              transform: `scale(${zoomStyle.scale}) translate(${zoomStyle.translateX}%, ${zoomStyle.translateY}%)` 
            }}
          >
            {/* Connection Lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-lg" style={{ zIndex: 0 }}>
              {/* Root to Tier 1 */}
              <path d="M 50% 15% L 20% 40%" stroke="rgba(16, 185, 129, 0.7)" strokeWidth="3" fill="none" className={activeNodes.length > 0 && !activeNodes.includes('A1') ? "opacity-20" : "animate-[pulse_3s_infinite]"} />
              <path d="M 50% 15% L 50% 40%" stroke="rgba(245, 158, 11, 0.7)" strokeWidth="3" fill="none" className={activeNodes.length > 0 && !activeNodes.includes('A2') ? "opacity-20" : "animate-[pulse_3s_infinite_0.5s]"} />
              <path d="M 50% 15% L 80% 40%" stroke="rgba(244, 63, 94, 0.7)" strokeWidth="3" fill="none" className={activeNodes.length > 0 && !activeNodes.includes('A3') ? "opacity-20" : "animate-[pulse_3s_infinite_1s]"} />
              
              {/* Dynamic lines for Tier 1 -> Tier 2 (A1 Branch / Emerald) */}
              {activeNodes.includes('A1') && (
                <>
                  <path d="M 20% 40% Q 10% 52% 10% 65%" stroke="rgba(52, 211, 153, 0.8)" strokeWidth="2.5" fill="none" className={activeNodes.includes('A1-1') ? 'opacity-30' : 'animate-[dash_1s_linear_infinite]'} strokeDasharray="6 6" />
                  <path d="M 20% 40% L 20% 65%" stroke="rgba(52, 211, 153, 0.8)" strokeWidth="2.5" fill="none" className={activeNodes.includes('A1-1') ? 'opacity-30' : 'animate-[dash_1s_linear_infinite]'} strokeDasharray="6 6" />
                  <path d="M 20% 40% Q 30% 52% 30% 65%" stroke="rgba(52, 211, 153, 0.8)" strokeWidth="2.5" fill="none" className={activeNodes.includes('A1-1') ? 'opacity-30' : 'animate-[dash_1s_linear_infinite]'} strokeDasharray="6 6" />
                </>
              )}
              {/* Dynamic lines for Tier 1 -> Tier 2 (A3 Branch / Rose) */}
              {activeNodes.includes('A3') && (
                <>
                  <path d="M 80% 40% Q 70% 52% 70% 65%" stroke="rgba(251, 113, 133, 0.8)" strokeWidth="2.5" fill="none" className="animate-[dash_1s_linear_infinite]" strokeDasharray="6 6" />
                  <path d="M 80% 40% Q 90% 52% 90% 65%" stroke="rgba(251, 113, 133, 0.8)" strokeWidth="2.5" fill="none" className="animate-[dash_1s_linear_infinite]" strokeDasharray="6 6" />
                </>
              )}

              {/* Dynamic lines for Tier 2 -> Tier 3 (A1-1 downline / Bright Cyan) */}
              {activeNodes.includes('A1-1') && (
                <>
                  <path d="M 10% 65% Q 5% 77% 5% 90%" stroke="rgba(34, 211, 238, 0.9)" strokeWidth="2.5" strokeDasharray="4 4" fill="none" className="animate-[dash_0.8s_linear_infinite]" />
                  <path d="M 10% 65% Q 15% 77% 15% 90%" stroke="rgba(34, 211, 238, 0.9)" strokeWidth="2.5" strokeDasharray="4 4" fill="none" className="animate-[dash_0.8s_linear_infinite]" />
                </>
              )}
            </svg>

            {/* Root Node: High Value Fuchsia */}
            <div className="absolute top-[15%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group cursor-pointer" onClick={handleReset}>
               <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-indigo-500 border border-[var(--border-medium)] flex items-center justify-center shadow-[0_0_25px_rgba(192,38,211,0.5)] transition-all duration-300 ${activeNodes.length > 0 ? 'scale-90 opacity-80' : 'hover:scale-105 hover:shadow-[0_0_40px_rgba(192,38,211,0.7)] rotate-45'}`}>
                 <span className="font-extrabold text-white text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] -rotate-45">You</span>
               </div>
               {!activeNodes.length && <span className="mt-3 text-xs font-bold text-[var(--text-secondary)] glass-panel px-3 py-1 rounded-md">Root Agent</span>}
            </div>

            {/* Tier 1 Nodes (Vibrant Themes) */}
            {[
              { id: 'A1', top: 40, left: 20, subCount: 3, theme: 'emerald' },
              { id: 'A2', top: 40, left: 50, subCount: 0, theme: 'amber' },
              { id: 'A3', top: 40, left: 80, subCount: 2, theme: 'rose' },
            ].map((node) => {
              const isActive = activeNodes.includes(node.id);
              const isDimmed = activeNodes.length > 0 && !isActive;
              
              // Theme color logic switch
              let bg = '', border = '', shadow = '', badge = '', hover = '';
              if (node.theme === 'emerald') { bg='from-emerald-600 to-emerald-400'; border='border-emerald-300'; shadow='shadow-[0_0_30px_rgba(16,185,129,0.5)]'; badge='bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 border-emerald-500/50'; hover='group-hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] group-hover:from-emerald-500 group-hover:to-emerald-300'; }
              if (node.theme === 'amber') { bg='from-amber-600 to-amber-400'; border='border-amber-300'; shadow='shadow-[0_0_30px_rgba(245,158,11,0.5)]'; badge='bg-amber-500/20 text-amber-700 dark:text-amber-200 border-amber-500/50'; hover='group-hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] group-hover:from-amber-500 group-hover:to-amber-300'; }
              if (node.theme === 'rose') { bg='from-rose-600 to-rose-400'; border='border-rose-300'; shadow='shadow-[0_0_30px_rgba(244,63,94,0.5)]'; badge='bg-rose-500/20 text-rose-700 dark:text-rose-200 border-rose-500/50'; hover='group-hover:shadow-[0_0_25px_rgba(244,63,94,0.5)] group-hover:from-rose-500 group-hover:to-rose-300'; }

              return (
                <div 
                  key={node.id}
                  onClick={(e) => { e.stopPropagation(); toggleNode(node.id, node.left, node.top, null, 1); }}
                  className={`absolute z-20 flex flex-col items-center group cursor-pointer transition-all duration-[600ms] ${isDimmed ? 'opacity-30 scale-95 blur-[0.5px]' : 'opacity-100'}`} 
                  style={{ top: `${node.top}%`, left: `${node.left}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                >
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border ${isActive ? `bg-gradient-to-tr ${bg} text-white scale-125 ${shadow} rotate-12` : `bg-[var(--bg-elevated)] border-[var(--border-medium)] text-[var(--text-primary)] ${hover} group-hover:text-white group-hover:scale-110 group-hover:bg-gradient-to-tr ${bg}`}`}>
                     <span className={`font-bold text-sm transition-colors ${isActive ? 'drop-shadow-md -rotate-12' : ''}`}>{node.id}</span>
                   </div>
                   {node.subCount > 0 && !isDimmed && (
                     <span className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 border ${isActive ? `${badge} translate-y-2` : 'glass-panel text-[var(--text-secondary)]'}`}>
                       {isActive ? 'Active Branch' : `${node.subCount} Sub-agents`}
                     </span>
                   )}
                </div>
              );
            })}

            {/* Tier 2 Dynamic Nodes - A1 (Emerald Downlines) */}
            {activeNodes.includes('A1') && [
              { id: 'A1-1', top: 65, left: 10, subCount: 2 },
              { id: 'A1-2', top: 65, left: 20, subCount: 0 },
              { id: 'A1-3', top: 65, left: 30, subCount: 0 },
            ].map((sub) => {
              const isActive = activeNodes.includes(sub.id);
              const isDimmed = activeNodes.includes('A1-1') && !isActive; 
              return (
                 <div 
                   key={sub.id} 
                   onClick={(e) => { e.stopPropagation(); toggleNode(sub.id, sub.left, sub.top, 'A1', 2); }}
                   className={`absolute z-30 animate-in fade-in slide-in-from-top-4 flex flex-col items-center group cursor-pointer transition-all duration-500 ${isDimmed ? 'opacity-25 grayscale' : ''}`} 
                   style={{ top: `${sub.top}%`, left: `${sub.left}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                 >
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isActive ? 'bg-cyan-500 border-cyan-200 text-white scale-125 shadow-[0_0_20px_rgba(6,182,212,0.6)]' : 'bg-[var(--bg-elevated)] border-[var(--border-medium)] text-[var(--text-primary)] hover:bg-emerald-500 hover:text-white hover:border-emerald-200 hover:scale-110 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer'}`}>
                     <span className="font-bold text-xs drop-shadow-md">{sub.id}</span>
                   </div>
                   {sub.subCount > 0 && !isDimmed && (
                     <span className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 border ${isActive ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-200 border-cyan-500/50 translate-y-2' : 'glass-panel text-[var(--text-secondary)] border-[var(--border-subtle)]'}`}>
                       {isActive ? 'Deep Branch' : `${sub.subCount} Linked`}
                     </span>
                   )}
                 </div>
              );
            })}

            {/* Tier 3 Dynamic Nodes - A1-1 (Cyan Downlines) */}
            {activeNodes.includes('A1-1') && [
              { id: 'X1', top: 90, left: 5 },
              { id: 'X2', top: 90, left: 15 },
            ].map((sub, i) => (
               <div key={sub.id} onClick={(e) => { e.stopPropagation(); toggleNode(sub.id, sub.left, sub.top, 'A1-1', 3); }} className="absolute z-40 animate-in fade-in slide-in-from-top-4 flex flex-col items-center group cursor-pointer" style={{ top: `${sub.top}%`, left: `${sub.left}%`, transform: 'translateX(-50%) translateY(-50%)', animationDelay: `${i * 100}ms` }}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-[9px] transition-all ${activeNodes.includes(sub.id) ? 'bg-indigo-500 text-white scale-150 shadow-[0_0_20px_rgba(129,140,248,0.8)]' : 'bg-[var(--bg-elevated)] border-[var(--border-medium)] text-[var(--text-primary)] hover:bg-cyan-500 hover:text-white hover:scale-125'}`}>
                   {sub.id}
                 </div>
               </div>
            ))}

            {/* Tier 2 Dynamic Nodes - A3 (Rose Downlines) */}
            {activeNodes.includes('A3') && [
              { id: 'A3-1', top: 65, left: 70 },
              { id: 'A3-2', top: 65, left: 90 },
            ].map((sub) => (
               <div key={sub.id} onClick={(e) => { e.stopPropagation(); toggleNode(sub.id, sub.left, sub.top, 'A3', 2); }} className="absolute z-30 animate-in fade-in slide-in-from-top-4 flex flex-col items-center group cursor-pointer" style={{ top: `${sub.top}%`, left: `${sub.left}%`, transform: 'translateX(-50%) translateY(-50%)' }}>
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-bold text-xs transition-all ${activeNodes.includes(sub.id) ? 'bg-pink-500 text-white scale-125 shadow-[0_0_20px_rgba(236,72,153,0.6)]' : 'bg-[var(--bg-elevated)] border-[var(--border-medium)] text-[var(--text-primary)] hover:bg-rose-500 hover:text-white hover:scale-110'}`}>
                   {sub.id}
                 </div>
               </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-panel p-6 rounded-2xl h-[500px] overflow-hidden flex flex-col">
          <h3 className="text-xl font-bold mb-6 text-[var(--text-primary)]">{config.dashboard.activityTitle}</h3>
          <div className="space-y-4 overflow-y-auto pr-2 flex-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 items-start p-3 hover:bg-[var(--glass-bg-hover)] rounded-xl transition-all border border-transparent hover:border-[var(--border-subtle)]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-sm font-bold shadow text-white">
                  A{i}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Agent {i} closed a deal</p>
                  <p className="text-xs text-indigo-500 mt-1">Earned {formatCurrency(1200)} commission (Tier {i})</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{i * 2} hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
