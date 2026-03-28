"use client";
import { useState } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useAppConfig } from '@/context/AppConfigContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useProperties } from '@/context/PropertyContext';
import { Check, X, ShieldCheck, TrendingUp, Search } from 'lucide-react';

export default function DealsPage() {
  const { profile } = useUserProfile();
  const { properties } = useProperties();
  const { formatCurrency, currency } = useCurrency();
  const { config } = useAppConfig();
  const { addNotification } = useNotifications();
  
  const isAdmin = profile.role === 'ADMIN' || profile.role === 'Admin';
  const isCompany = profile.role === 'COMPANY' || profile.role === 'Company';
  const isAgent = !isAdmin && !isCompany;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Mock Deals for Approval Flow
  const [deals, setDeals] = useState([
    { id: 'deal-1', propertyId: '2', agentName: 'Agent Smith', salePrice: 85000000, status: 'Pending', createdAt: '2026-03-27' },
    { id: 'deal-2', propertyId: '1', agentName: 'Agent Sarah', salePrice: 125000000, status: 'Approved', createdAt: '2026-03-25' },
  ]);

  const ownedPropertyIds = properties.filter(p => p.companyEmail === profile.email).map(p => p.id);
  const filteredDeals = deals.filter(d => {
    if (isAdmin) return true;
    if (isCompany) return ownedPropertyIds.includes(d.propertyId);
    return true; // Agents see their own
  });

  const handleApproveDeal = (id: string) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, status: 'Approved' } : d));
    addNotification({ type: 'success', title: 'Deal Finalized', message: 'Commission distribution triggered.', category: 'deal' });
  };

  const handleSelectProperty = (property: any) => {
    setSearchQuery(property.name);
    setSalePrice(property.price);
    setIsDropdownOpen(false);
  };

  const commissionPercentage = config.deals.commissionPoolPct;
  const agentSplitShare = config.deals.agentSplitPct;
  const totalCommissionPool = salePrice ? (Number(salePrice) * (commissionPercentage / 100)) : 0;
  const agentIncentive = totalCommissionPool * (agentSplitShare / 100);

  const handleSubmitDeal = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      addNotification({ type: 'success', title: 'Deal Submitted', message: 'The Listing Agency has been notified for approval.', category: 'deal' });
    }, 1500);
  };

  return (
    <div className="p-6 md:p-8 relative z-10 w-full max-w-6xl mx-auto text-[var(--text-primary)]">
      <header className="mb-10 flex flex-col sm:flex-row justify-between sm:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)]">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Financial Settlement</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Deal <span className="text-gradient">Settlements</span></h1>
          <p className="text-[var(--text-secondary)]">{isCompany ? 'Verify and Approve agent submissions for your projects.' : 'Submit a new deal and verify your incentive split.'}</p>
        </div>
      </header>

      {isCompany ? (
        <div className="space-y-6">
          <h3 className="text-xl font-bold mb-4">Pending Confirmations</h3>
          {filteredDeals.filter(d => d.status === 'Pending').length === 0 ? (
            <div className="glass-panel p-12 text-center opacity-50 rounded-3xl">No pending deals to approve.</div>
          ) : (
            filteredDeals.filter(d => d.status === 'Pending').map(deal => (
              <div key={deal.id} className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-xl">📄</div>
                  <div>
                    <h4 className="font-bold text-lg">{properties.find(p => p.id === deal.propertyId)?.name || 'Property'}</h4>
                    <p className="text-sm text-[var(--text-secondary)]">Agent: {deal.agentName} | Submitted: {deal.createdAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Sale Value</p>
                    <p className="text-xl font-black text-emerald-500">{formatCurrency(deal.salePrice)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveDeal(deal.id)} className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all flex items-center gap-2">
                       <Check className="w-4 h-4" /> Approve & Distribute
                    </button>
                    <button className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all">
                       <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {isSuccess ? (
            <div className="glass-panel p-16 text-center rounded-[40px] animate-in zoom-in-95 duration-500">
               <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/20">
                  <Check className="w-10 h-10" />
               </div>
               <h2 className="text-3xl font-black mb-4">Deal Reported Successfully!</h2>
               <p className="text-[var(--text-secondary)] mb-8">The Listing Agency has been notified. Once approved, your commission will reflect in your wallet.</p>
               <button onClick={() => setIsSuccess(false)} className="px-8 py-3 rounded-2xl bg-indigo-600 text-white font-bold">Process Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmitDeal} className="glass-panel rounded-[40px] p-8 md:p-12 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="relative">
                      <label className="block text-xs font-black text-indigo-500 uppercase tracking-widest mb-2">Search Project</label>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input 
                          type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                          onFocus={() => setIsDropdownOpen(true)}
                          className="w-full theme-input rounded-2xl pl-12 py-4" placeholder="Start typing..."
                        />
                      </div>
                      {isDropdownOpen && searchQuery && (
                        <div className="absolute z-50 w-full mt-2 glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                           {properties.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                             <div key={p.id} onClick={() => handleSelectProperty(p)} className="p-4 hover:bg-indigo-500/10 cursor-pointer flex justify-between border-b border-white/5 last:border-0 transition-colors">
                               <span className="font-bold">{p.name}</span>
                               <span className="opacity-50 text-sm">{formatCurrency(p.price)}</span>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-black text-indigo-500 uppercase tracking-widest mb-2">Final Closing Price</label>
                      <input 
                        required type="number" value={salePrice} onChange={e => setSalePrice(Number(e.target.value))}
                        className="w-full theme-input rounded-2xl px-6 py-4 text-2xl font-black font-mono text-emerald-500" placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-3xl p-8 border border-white/5 flex flex-col justify-center text-center">
                     <TrendingUp className="w-8 h-8 text-indigo-400 mx-auto mb-4" />
                     <p className="text-sm font-bold opacity-50 uppercase tracking-widest mb-2">Your Expected Incentive</p>
                     <p className="text-4xl font-black text-indigo-600">{formatCurrency(agentIncentive)}</p>
                     <p className="text-[10px] mt-4 opacity-40">Calculated based on {commissionPercentage}% Pool at {agentSplitShare}% Split.</p>
                  </div>
               </div>
               <button type="submit" disabled={!salePrice || isSubmitting} className="w-full mt-12 py-5 rounded-2xl bg-indigo-600 text-white font-black text-xl hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3">
                  {isSubmitting ? 'Processing Transaction...' : 'Submit Deal for Approval'}
               </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
