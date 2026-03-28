"use client";
import { useState, useEffect } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { useAppConfig } from '@/context/AppConfigContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useProperties } from '@/context/PropertyContext';
import { TrendingUp, Calendar, Plus, Check, X, Clock } from 'lucide-react';

export default function VisitsPage() {
  const { profile } = useUserProfile();
  const { properties } = useProperties();
  const { addNotification } = useNotifications();
  const { config } = useAppConfig();
  const { formatCurrency } = useCurrency();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  const isAdmin = profile.role === 'ADMIN' || profile.role === 'Admin';
  const isCompany = profile.role === 'COMPANY' || profile.role === 'Company';
  const isAgent = !isAdmin && !isCompany;

  // Filter properties owned by this company for approval context
  const ownedPropertyIds = properties.filter(p => p.companyEmail === profile.email).map(p => p.id);
  
  const [visits, setVisits] = useState([
    { id: 1, propertyId: '2', tag: 'Tomorrow, 10:00 AM', title: 'Sky Penthouse View', client: 'Mr. Anderson', status: 'Approved',
      color: 'text-emerald-500', bg: 'bg-emerald-500/10', borderColor: 'border-emerald-500', icon: '🏙️' },
    { id: 2, propertyId: '3', tag: 'Tomorrow, 2:30 PM', title: 'Modern Condo Bandra', client: 'Jane Doe', status: 'Pending',
      color: 'text-amber-500', bg: 'bg-amber-500/10', borderColor: 'border-amber-500', icon: '🏠' },
    { id: 3, propertyId: '1', tag: 'Friday, 11:00 AM', title: 'Luxury Villa Parel', client: 'Tech Corp', status: 'Approved',
      color: 'text-emerald-500', bg: 'bg-emerald-500/10', borderColor: 'border-emerald-500', icon: '🏡' },
  ]);

  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [clientName, setClientName] = useState("");

  // 🛡️ RBAC DATA FILTER
  const filteredVisits = visits.filter(v => {
    if (isAdmin) return true;
    if (isCompany) return ownedPropertyIds.includes(v.propertyId);
    return true; // Agents see their own or all for coordination
  });

  const handleApproveVisit = (id: number) => {
    setVisits(prev => prev.map(v => v.id === id ? { ...v, status: 'Approved', color: 'text-emerald-500', bg: 'bg-emerald-500/10', borderColor: 'border-emerald-500' } : v));
    addNotification({ type: 'success', title: 'Visit Approved', message: 'Agent notified.', category: 'visit' });
  };

  const handleRejectVisit = (id: number) => {
    setVisits(prev => prev.map(v => v.id === id ? { ...v, status: 'Rejected', color: 'text-rose-500', bg: 'bg-rose-500/10', borderColor: 'border-rose-500' } : v));
    addNotification({ type: 'info', title: 'Visit Rejected', message: 'Request declined.', category: 'visit' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsModalOpen(false);
      addNotification({
        type: 'success',
        title: 'Visit Scheduled!',
        message: 'Request sent to listing agency.',
        category: 'visit'
      });
      setVisits(prev => [{
        id: Date.now(), propertyId: selectedPropertyId, tag: 'Just now', title: 'New Schedule', client: clientName,
        status: 'Pending', color: 'text-amber-500', bg: 'bg-amber-500/10', borderColor: 'border-amber-500', icon: '🏠'
      }, ...prev]);
    }, 1000);
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDay = new Date().getDate();

  return (
    <div className="p-6 md:p-8 relative z-10 w-full max-w-6xl mx-auto text-[var(--text-primary)]">
      <header className="mb-10 flex flex-col sm:flex-row justify-between sm:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)]">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Live Logistics</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">{config.visits.pageTitle}</h1>
          <p className="text-[var(--text-secondary)]">{isCompany ? 'Manage incoming agent visits and approvals.' : config.visits.pageSubtitle}</p>
        </div>
        {isAgent && (
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 transition-all text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Schedule Visit
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            {isCompany ? 'Approval Queue' : 'Your Schedule'}
          </h3>
          {filteredVisits.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center opacity-50">No visits found.</div>
          ) : (
            filteredVisits.map((visit) => (
              <div key={visit.id} className="glass-panel rounded-2xl p-5 flex items-center gap-5 border border-white/5 shadow-sm">
                <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center bg-indigo-500/10 text-2xl">
                  {visit.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase block mb-1">{visit.tag}</span>
                  <h4 className="text-lg font-bold truncate">{visit.title}</h4>
                  <p className="text-sm text-[var(--text-secondary)]">Client: {visit.client}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${visit.bg} ${visit.color}`}>
                    {visit.status}
                  </span>
                  {isCompany && visit.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveVisit(visit.id)} className="p-2 bg-emerald-500 text-white rounded-lg hover:scale-105 transition-all"><Check className="w-4 h-4" /></button>
                      <button onClick={() => handleRejectVisit(visit.id)} className="p-2 bg-rose-500 text-white rounded-lg hover:scale-105 transition-all"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-500" /> Logistics View</h3>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {days.map(d => <div key={d} className="text-[10px] font-bold opacity-30 uppercase">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 31 }).map((_, i) => (
                <div key={i} className={`aspect-square flex items-center justify-center text-xs rounded-lg ${i + 1 === currentDay ? 'bg-indigo-600 text-white' : 'opacity-40'}`}>{i+1}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="glass-panel w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Schedule Visit</h2>
            <div className="space-y-4">
              <select required value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none">
                <option value="" className="bg-slate-900">Select Project...</option>
                {properties.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
              </select>
              <input required type="text" placeholder="Client Name" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" />
              <div className="flex gap-4">
                <input required type="date" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" />
                <input required type="time" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl border border-white/10 font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold">Confirm</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
