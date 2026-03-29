"use client";
import { useState, useEffect, useCallback } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { useAppConfig } from '@/context/AppConfigContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { deals as dealsApi } from '@/lib/api';
import { useProperties } from '@/context/PropertyContext';
import { isAdmin, isCompany } from '@/lib/constants';
import { ShieldCheck, TrendingUp, Calculator, IndianRupee, Users, User, Search, X } from 'lucide-react';

interface Deal {
  id: string;
  propertyId: string;
  agentId: string;
  salePrice: number;
  totalCommission: number;
  createdAt: string;
  property?: { id: string; title: string; city?: string };
  agent?: { id: string; email: string };
}

export default function DealsPage() {
  const { profile } = useUserProfile();
  const { formatCurrency } = useCurrency();
  const { config } = useAppConfig();
  const { properties } = useProperties();

  const userIsAdmin   = isAdmin(profile.role);
  const userIsCompany = isCompany(profile.role);
  const userIsAgent   = !userIsAdmin && !userIsCompany;

  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoadingDeals, setIsLoadingDeals] = useState(true);

  // Calculator state
  const tierSplits: number[] = config.deals.tierSplits ?? [40, 25, 15, 10, 10];
  const [calcAmount, setCalcAmount] = useState<string>('5000000');
  const [myRole, setMyRole] = useState<string>('closing');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  const filteredProps = properties.filter(p =>
    searchQuery.trim() && (p.title || p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectProperty = (prop: any) => {
    setSelectedProperty(prop);
    setSearchQuery(prop.title || prop.name || '');
    setShowDropdown(false);
    if (prop.price) setCalcAmount(String(prop.price));
  };

  const handleClearProperty = () => {
    setSelectedProperty(null);
    setSearchQuery('');
  };

  // Derived commission math (percentages hidden from agent)
  const saleAmt = parseFloat(calcAmount) || 0;
  const pool = saleAmt * ((config.deals.commissionPoolPct ?? 2) / 100);
  const agentEarning = pool * ((config.deals.agentSplitPct ?? 80) / 100);
  const networkPool = pool * ((config.deals.networkPoolPct ?? 15) / 100);
  const tierEarnings = tierSplits.map((t: number) => networkPool * (t / 100));
  const myEarning = myRole === 'closing' ? agentEarning : (tierEarnings[parseInt(myRole)] ?? 0);

  const fetchDeals = useCallback(async () => {
    setIsLoadingDeals(true);
    try {
      const data = await dealsApi.list();
      setDeals(data);
    } catch {
      // non-critical
    } finally {
      setIsLoadingDeals(false);
    }
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  return (
    <div className="p-6 md:p-8 relative z-10 w-full max-w-6xl mx-auto text-[var(--text-primary)]">
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)]">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Financial Settlement</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">
          Deal <span className="text-gradient">Settlements</span>
        </h1>
        <p className="text-[var(--text-secondary)]">
          {userIsCompany
            ? 'Verify and approve advisor deal submissions for your projects.'
            : config.deals.pageSubtitle}
        </p>
      </header>

      {/* Company / Admin — Deals List */}
      {(userIsCompany || userIsAdmin) && (
        <div className="space-y-4 mb-12">
          <h3 className="text-xl font-bold">
            {userIsAdmin ? 'All Deals' : 'Your Project Deals'}
          </h3>
          {isLoadingDeals ? (
            <div className="glass-panel p-12 text-center opacity-50 rounded-3xl">Loading deals…</div>
          ) : deals.length === 0 ? (
            <div className="glass-panel p-12 text-center opacity-50 rounded-3xl">No deals found.</div>
          ) : (
            deals.map(deal => (
              <div key={deal.id} className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-xl">📄</div>
                  <div>
                    <h4 className="font-bold text-lg">{deal.property?.title || 'Property'}</h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Advisor: {deal.agent?.email || deal.agentId} · {new Date(deal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Sale Value</p>
                  <p className="text-xl font-black text-emerald-500">{formatCurrency(deal.salePrice)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Agent — Commission Calculator */}
      {userIsAgent && (
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Calculator Card */}
          <div className="glass-panel rounded-[40px] p-6 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />

            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-black">Incentive Calculator</h2>
                <p className="text-xs text-[var(--text-secondary)]">See how earnings are distributed across your network on any sale</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left — Inputs */}
              <div className="space-y-6">
                {/* Property search */}
                <div>
                  <label className="block text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Search Property (optional)</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); setSelectedProperty(null); }}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                      className="w-full theme-input rounded-2xl pl-10 pr-10 py-3"
                      placeholder="Start typing a project name…"
                    />
                    {searchQuery && (
                      <button onClick={handleClearProperty} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {showDropdown && filteredProps.length > 0 && (
                      <div className="absolute z-50 w-full mt-1.5 glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                        {filteredProps.slice(0, 8).map(p => (
                          <div key={p.id} onMouseDown={() => handleSelectProperty(p)}
                            className="p-3.5 hover:bg-indigo-500/10 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0 transition-colors">
                            <div>
                              <p className="font-bold text-sm">{p.title || p.name}</p>
                              <p className="text-[10px] text-[var(--text-muted)]">{p.city}</p>
                            </div>
                            {p.price > 0 && <span className="text-xs font-black text-emerald-400 shrink-0 ml-3">{formatCurrency(p.price)}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedProperty && (
                    <p className="text-[10px] text-emerald-400 font-semibold mt-1.5">
                      Listing price loaded — edit below if negotiated differently
                    </p>
                  )}
                </div>

                {/* Sale amount */}
                <div>
                  <label className="block text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">
                    Sale Amount (₹)
                    {selectedProperty && <span className="text-[10px] text-[var(--text-muted)] font-semibold normal-case ml-2">editable — adjust for negotiated price</span>}
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="number" min="0" step="100000"
                      value={calcAmount}
                      onChange={e => setCalcAmount(e.target.value)}
                      className="w-full theme-input rounded-2xl pl-10 pr-4 py-4 text-xl font-black font-mono text-emerald-400"
                      placeholder="e.g. 5000000"
                    />
                  </div>
                </div>

                {/* My role in this deal */}
                <div>
                  <label className="block text-xs font-black text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> My Role in This Deal
                  </label>
                  <select
                    value={myRole}
                    onChange={e => setMyRole(e.target.value)}
                    className="w-full theme-input rounded-2xl px-4 py-3 text-sm font-bold"
                  >
                    <option value="closing">I closed this deal (Direct Advisor)</option>
                    {tierSplits.map((_: number, i: number) => (
                      <option key={i} value={String(i)}>
                        I am Level {i + 1} upline of the closing advisor
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right — My earning only */}
              <div className="flex flex-col justify-center items-center text-center">
                <div className="w-full p-8 rounded-3xl bg-emerald-500/8 border border-emerald-500/20">
                  <User className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-3">
                    {myRole === 'closing' ? 'Your Earning (Closing Advisor)' : `Your Earning (Level ${parseInt(myRole) + 1} Upline)`}
                  </p>
                  <p className="text-4xl font-black text-emerald-400 tabular-nums">{formatCurrency(myEarning)}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-3 font-semibold">
                    on a {formatCurrency(saleAmt)} sale
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* My Deals History */}
          <div>
            <h3 className="text-base font-black mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> My Closed Deals
            </h3>
            {isLoadingDeals ? (
              <div className="glass-panel p-8 text-center opacity-50 rounded-3xl text-sm">Loading…</div>
            ) : deals.length === 0 ? (
              <div className="glass-panel p-8 text-center opacity-40 rounded-3xl text-sm">No deals closed yet.</div>
            ) : (
              <div className="space-y-3">
                {deals.map(deal => (
                  <div key={deal.id} className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-base shrink-0">📄</div>
                      <div className="min-w-0">
                        <p className="font-bold truncate">{deal.property?.title || 'Property'}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{new Date(deal.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Sale Value</p>
                      <p className="font-black text-emerald-400">{formatCurrency(deal.salePrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
