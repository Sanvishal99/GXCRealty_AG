"use client";
import { useState } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useAppConfig } from '@/context/AppConfigContext';

export default function DealsPage() {
  const { formatCurrency, currency } = useCurrency();
  const { config } = useAppConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { addNotification } = useNotifications();

  const properties = [
    { id: '1', name: 'Luxury Villa 1', price: 1200000 },
    { id: '2', name: 'Penthouse Suite', price: 3500000 },
    { id: '3', name: 'Modern Condo', price: 800000 },
    { id: '4', name: 'Suburban Home', price: 650000 },
    { id: '5', name: 'Oceanfront Estate', price: 5200000 },
    { id: '6', name: 'City Loft', price: 950000 },
  ];

  const filteredProperties = properties.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSelectProperty = (property: typeof properties[0]) => {
    setSearchQuery(property.name);
    setSalePrice(property.price);
    setIsDropdownOpen(false);
  };

  // Uses globally configured AppConfig values
  const commissionPercentage = config.deals.commissionPoolPct;
  const directAgentShare = config.deals.directSharePct;
  
  const estimatedCommission = salePrice ? salePrice * (commissionPercentage / 100) * (directAgentShare / 100) : 0;
  const totalNetworkPool = salePrice ? salePrice * (commissionPercentage / 100) : 0;

  const pool = totalNetworkPool;
  const directShare = estimatedCommission;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      addNotification({
        type: 'success',
        title: 'Deal Executed!',
        message: 'Your deal has been submitted. Commission distribution will be triggered automatically.',
        category: 'deal',
      });
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="p-8 relative z-10 w-full max-w-4xl mx-auto text-[var(--text-primary)]">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          {config.deals.pageTitle.split(' ').slice(0,-1).join(' ')} <span className="text-gradient">{config.deals.pageTitle.split(' ').slice(-1)}</span>
        </h1>
        <p className="text-[var(--text-secondary)]">{config.deals.pageSubtitle}</p>
      </header>

      <div className="glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl shadow-indigo-500/10">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500" />
        
        {isSuccess ? (
          <div className="py-16 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 mx-auto bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3">Deal Successfully Confirmed!</h2>
            <p className="text-[var(--text-secondary)] max-w-md mx-auto text-lg mb-8">The smart contract is verifying the transaction. Your wallet balance will be updated momentarily.</p>
            <button onClick={() => setIsSuccess(false)} className="px-8 py-3 rounded-xl bg-[var(--glow-primary)] border border-[var(--border-medium)] text-[var(--text-primary)] font-bold hover:bg-[var(--glow-secondary)] hover:scale-105 transition-all">
              Process Another Deal
            </button>
          </div>
        ) : (
          <form className="space-y-10" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              
              {/* Input Section */}
              <div className="space-y-6">
                <div className="relative">
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Search Property</label>
                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                        if (!e.target.value) setSalePrice('');
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                      className="w-full theme-input rounded-xl pl-12 pr-4 py-3.5 focus:border-indigo-500/50 hover:border-[var(--border-medium)] transition-colors"
                      placeholder="Start typing to find a property..."
                    />
                  </div>
                  
                  {isDropdownOpen && filteredProperties.length > 0 && (
                    <div className="absolute z-[100] w-full mt-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-hidden">
                      {filteredProperties.map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => handleSelectProperty(p)}
                          className="px-4 py-3 hover:bg-[var(--glass-bg-hover)] cursor-pointer flex justify-between items-center border-b border-[var(--border-subtle)] last:border-0 transition-colors"
                        >
                          <span className="text-[var(--text-primary)] font-medium">{p.name}</span>
                          <span className="text-[var(--text-secondary)] text-sm font-mono">{formatCurrency(p.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {isDropdownOpen && searchQuery && filteredProperties.length === 0 && (
                    <div className="absolute z-[100] w-full mt-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl shadow-2xl p-4 text-center text-[var(--text-secondary)] text-sm">
                      No properties found matching &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Final Sale Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">{currency}</span>
                    <input 
                      required
                      type="number"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : '')}
                      className="w-full theme-input rounded-xl pl-14 pr-4 py-3.5 focus:border-indigo-500/50 hover:border-[var(--border-medium)] transition-colors text-lg font-mono font-bold"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Incentive Display Section */}
              <div className="bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-8 relative overflow-hidden h-full flex flex-col justify-center">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />
                
                <h4 className="text-sm font-bold text-indigo-400 mb-6 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Your Incentive Breakdown
                </h4>
                
                <div className="space-y-4 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-sm text-indigo-500 mb-1">Your Direct Take-Home</span>
                    <span className="text-4xl font-extrabold font-mono text-emerald-500 tracking-tight drop-shadow-sm">
                      {formatCurrency(directShare)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || !salePrice} 
              className="w-full relative group overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xl py-5 rounded-2xl shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:grayscale transition-all hover:scale-[1.01]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <div className="relative flex items-center justify-center gap-3">
                {isSubmitting ? (
                   <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <>
                    Confirm Deal & Claim {formatCurrency(directShare)}
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </div>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
