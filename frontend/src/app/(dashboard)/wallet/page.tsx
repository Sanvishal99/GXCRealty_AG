"use client";
import { useCurrency } from '@/context/CurrencyContext';
import { useAppConfig } from '@/context/AppConfigContext';

const TRANSACTIONS = [
  { type: 'Commission', desc: 'Direct Sale — Sky Penthouse', amount: 30000, date: 'Today, 10:42 AM', isPositive: true, icon: '💸', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { type: 'Network Bonus', desc: 'Tier 2 Referral — Agent Alex', amount: 1500, date: 'Yesterday, 6:15 PM', isPositive: true, icon: '🤝', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { type: 'Withdrawal', desc: 'Bank Transfer to ****4592', amount: 10000, date: 'Mar 24, 11:00 AM', isPositive: false, icon: '🏦', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { type: 'Network Bonus', desc: 'Tier 1 Referral — Agent Sarah', amount: 4200, date: 'Mar 20, 3:30 PM', isPositive: true, icon: '⭐', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { type: 'Commission', desc: 'Direct Sale — Luxury Villa #3', amount: 18500, date: 'Mar 18, 2:00 PM', isPositive: true, icon: '🏠', color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

export default function WalletPage() {
  const { formatCurrency } = useCurrency();
  const { config } = useAppConfig();
  const totalEarned = TRANSACTIONS.filter(t => t.isPositive).reduce((a, t) => a + t.amount, 0);
  
  return (
    <div className="p-6 md:p-8 relative z-10 w-full max-w-6xl mx-auto text-[var(--text-primary)]">
      {/* Ambient glow */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] glow-orb-4 rounded-full blur-[140px] pointer-events-none opacity-30 -translate-y-1/4 translate-x-1/3" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] glow-orb-1 rounded-full blur-[120px] pointer-events-none opacity-25" />

      {/* Header */}
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel">
          <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Wallet</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          {config.wallet.pageTitle.split(' ').slice(0,-1).join(' ')} <span className="text-gradient-emerald">{config.wallet.pageTitle.split(' ').slice(-1)}</span>
        </h1>
        <p className="text-[var(--text-secondary)]">{config.wallet.pageSubtitle}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Balance Card — Hero */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-8 relative overflow-hidden stat-card-emerald"
          style={{ background: 'linear-gradient(145deg, rgba(16,185,129,0.15) 0%, rgba(34,211,238,0.08) 100%)' }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none glow-pulse" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Card header */}
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <span className="badge text-emerald-500 bg-emerald-500/10 border-emerald-500/30">Live</span>
          </div>

          <p className="text-sm font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-widest relative z-10">Available Balance</p>
          <h2 className="text-3xl font-extrabold font-mono text-gradient-emerald mb-1 relative z-10 break-all leading-tight">{formatCurrency(124500)}</h2>
          <p className="text-xs text-[var(--text-muted)] mb-8 relative z-10">+{formatCurrency(totalEarned)} this month</p>
          
          <div className="space-y-3 relative z-10">
            <button onClick={() => alert("Withdrawal request initiated.")}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Withdraw Funds
            </button>
            <button onClick={() => alert("Transfer network interface opening...")}
              className="w-full glass-panel text-[var(--text-primary)] font-semibold py-3.5 rounded-2xl hover:bg-[var(--glass-bg-hover)] transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Transfer to Network
            </button>
          </div>
        </div>

        {/* Stats + Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Earned', value: formatCurrency(totalEarned), color: 'text-emerald-500', grad: 'grad-emerald', glow: 'stat-card-emerald' },
              { label: 'Network Bonus', value: formatCurrency(5700), color: 'text-indigo-500', grad: 'grad-indigo', glow: 'stat-card-indigo' },
              { label: 'Withdrawn', value: formatCurrency(10000), color: 'text-rose-500', grad: 'grad-rose', glow: 'stat-card-rose' },
            ].map((s, i) => (
              <div key={i} className={`glass-panel ${s.glow} ${s.grad} rounded-2xl p-4 transition-all`}>
                <p className="text-[var(--text-secondary)] text-[11px] font-semibold uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-lg font-extrabold font-mono ${s.color} truncate`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Transactions */}
          <div className="glass-panel rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500 inline-block" />
                Recent Transactions
              </h3>
              <button className="text-xs text-indigo-500 font-semibold hover:text-indigo-400 transition-colors">View All →</button>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {TRANSACTIONS.map((tx, i) => (
                <div key={i}
                  className="flex justify-between items-center px-5 py-4 hover:bg-[var(--glass-bg-hover)] transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${tx.bg} border border-current flex-shrink-0 group-hover:scale-110 transition-transform`} style={{ borderColor: 'transparent' }}>
                      {tx.icon}
                    </div>
                    <div>
                      <h4 className={`font-semibold text-[var(--text-primary)] group-hover:${tx.color} transition-colors`}>{tx.type}</h4>
                      <p className="text-xs text-[var(--text-secondary)]">{tx.desc}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <span className={`font-mono font-bold text-base ${tx.color}`}>
                      {tx.isPositive ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{tx.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 50%, rgba(236,72,153,0.08) 100%)' }}
      >
        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[80px] opacity-10 select-none">💎</div>
        <div className="relative z-10">
          <h4 className="font-bold text-lg mb-1">Upgrade to <span className="text-gradient">Elite Agent</span> Status</h4>
          <p className="text-[var(--text-secondary)] text-sm mb-4">{config.wallet.upgradeBannerSubtitle}</p>
          <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 hover:shadow-indigo-500/40 transition-all">
            Learn More →
          </button>
        </div>
      </div>
    </div>
  );
}
