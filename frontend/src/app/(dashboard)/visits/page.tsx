"use client";
import { useState, useEffect } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { useAppConfig } from '@/context/AppConfigContext';
import { useCurrency } from '@/context/CurrencyContext';

const properties = [
  { id: '1', name: 'Luxury Villa 1' },
  { id: '2', name: 'Penthouse Suite' },
  { id: '3', name: 'Modern Condo' },
  { id: '4', name: 'Luxury Villa 4' },
  { id: '5', name: 'Luxury Villa 5' },
  { id: '6', name: 'Luxury Villa 6' }
];

export default function VisitsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addNotification } = useNotifications();
  const { config } = useAppConfig();
  const { formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState('upcoming');
  
  const [visits, setVisits] = useState([
    { id: 1, tag: 'Tomorrow, 10:00 AM', title: 'Penthouse Suite View', client: 'Mr. Anderson', status: 'Approved',
      color: 'text-emerald-500', bg: 'bg-emerald-500/10', borderColor: 'border-emerald-500',
      glowClass: 'stat-card-emerald', icon: '🏙️' },
    { id: 2, tag: 'Tomorrow, 2:30 PM', title: 'Luxury Villa #5', client: 'Jane Doe', status: 'Pending',
      color: 'text-amber-500', bg: 'bg-amber-500/10', borderColor: 'border-amber-500',
      glowClass: '', icon: '🏡' },
    { id: 3, tag: 'Friday, 11:00 AM', title: 'Commercial Space Downtown', client: 'Tech Corp', status: 'Approved',
      color: 'text-emerald-500', bg: 'bg-emerald-500/10', borderColor: 'border-emerald-500',
      glowClass: 'stat-card-emerald', icon: '🏢' },
  ]);

  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openModal') === 'true') setIsModalOpen(true);
      if (params.get('propertyId')) setSelectedPropertyId(params.get('propertyId') || "");
      if (params.get('clientName')) setClientName(params.get('clientName') || "");
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsModalOpen(false);
      addNotification({
        type: 'success',
        title: 'Visit Scheduled!',
        message: 'Your visit request has been sent to the Listing Agency for approval.',
        category: 'visit'
      });
      setVisits(prev => [
        { id: Date.now(), tag: 'Just now', title: 'Newly Scheduled Property', client: 'New Client',
          status: 'Pending', color: 'text-amber-500', bg: 'bg-amber-500/10', borderColor: 'border-amber-500',
          glowClass: '', icon: '🏠' },
        ...prev
      ]);
    }, 1000);
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDay = new Date().getDate();

  return (
    <div className="p-6 md:p-8 relative z-10 w-full max-w-6xl mx-auto text-[var(--text-primary)]">
      {/* Ambient glow orbs */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] glow-orb-1 rounded-full blur-[140px] pointer-events-none opacity-50 -translate-y-1/2 translate-x-1/3" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] glow-orb-3 rounded-full blur-[140px] pointer-events-none opacity-40 translate-y-1/3" />

      {/* Header */}
      <header className="mb-10 flex flex-col sm:flex-row justify-between sm:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)]">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Live Schedule</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">{config.visits.pageTitle}</h1>
          <p className="text-[var(--text-secondary)]">{config.visits.pageSubtitle}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="relative flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 hover:shadow-indigo-500/40 transition-all text-sm overflow-hidden group shrink-0"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <svg className="relative w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="relative">Schedule Visit</span>
        </button>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Visits', value: '24', color: 'text-indigo-500', grad: 'grad-indigo', glow: 'stat-card-indigo' },
          { label: 'Approved', value: '18', color: 'text-emerald-500', grad: 'grad-emerald', glow: 'stat-card-emerald' },
          { label: 'Pending', value: '6', color: 'text-amber-500', grad: 'grad-amber', glow: '' },
        ].map((s, i) => (
          <div key={i} className={`glass-panel ${s.glow} ${s.grad} rounded-2xl p-4 relative overflow-hidden transition-all`}>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-current opacity-[0.07] blur-2xl" style={{ color: 'currentColor' }} />
            <p className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-3xl font-extrabold font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visits List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <span className="w-1 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500 inline-block" />
            Upcoming Schedule
          </h3>
          {visits.map((visit, idx) => (
            <div key={visit.id}
              className={`glass-panel ${visit.glowClass} rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center relative overflow-hidden group cursor-pointer hover:-translate-y-0.5 transition-all duration-300`}
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              {/* Left glow bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${visit.borderColor} rounded-l-2xl opacity-80`} />
              {/* Shimmer */}
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />

              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center grad-indigo border border-[var(--border-medium)] text-3xl shadow-inner group-hover:scale-110 transition-transform">
                {visit.icon}
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1 block">{visit.tag}</span>
                <h4 className="text-lg font-bold truncate text-[var(--text-primary)]">{visit.title}</h4>
                <p className="text-sm mt-1 text-[var(--text-secondary)] flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {visit.client}
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-3">
                <span className={`badge ${visit.color} ${visit.bg}`}>{visit.status}</span>
                <button className="text-xs text-[var(--text-secondary)] hover:text-indigo-500 transition-colors glass-panel px-3 py-1.5 rounded-lg border-[var(--border-subtle)] hover:border-indigo-500/30">
                  Manage →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Calendar */}
          <div className="glass-panel grad-indigo rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 glow-orb-1 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none glow-pulse" />
            <h3 className="text-lg font-bold mb-4 relative z-10 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              October 2026
            </h3>
            <div className="relative z-10">
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {days.map(d => (
                  <div key={d} className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 31 }).map((_, i) => {
                  const dayNum = i + 1;
                  const isToday = dayNum === currentDay;
                  const hasVisit = dayNum === currentDay + 1 || dayNum === currentDay + 3;
                  return (
                    <div key={i}
                      className={`relative aspect-square flex items-center justify-center text-xs rounded-lg transition-all cursor-pointer
                        ${isToday
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold shadow-lg shadow-indigo-500/40 scale-105'
                          : 'hover:bg-[var(--glass-bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }
                      `}
                    >
                      {dayNum}
                      {hasVisit && !isToday && (
                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="glass-panel grad-emerald rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-32 h-32 glow-orb-4 rounded-full blur-3xl -mr-10 -mb-10 pointer-events-none glow-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-wider mb-1 text-emerald-500 relative z-10">Visit Success Rate</h3>
            <div className="flex items-end gap-2 mb-2 relative z-10">
              <span className="text-5xl font-extrabold font-mono text-gradient-emerald">42%</span>
              <span className="text-sm text-[var(--text-secondary)] mb-1.5">conversion</span>
            </div>
            <div className="w-full h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden relative z-10">
              <div className="h-full w-[42%] bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow shadow-emerald-500/50" />
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-3 relative z-10">42% of property visits convert to closed deals.</p>
          </div>

          {/* Quick Links */}
          <div className="glass-panel grad-rose rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-pink-500 relative z-10">Quick Actions</h3>
            <div className="space-y-2 relative z-10">
              {['Export Schedule PDF', 'Send Reminder to Clients', 'Sync to Calendar'].map((a, i) => (
                <button key={i}
                  className="w-full text-left text-sm px-4 py-2.5 rounded-xl glass-panel text-[var(--text-primary)] hover:text-pink-500 hover:border-pink-500/20 transition-all flex items-center justify-between gap-2 group"
                  onClick={() => alert(`${a}...`)}
                >
                  <span>{a}</span>
                  <svg className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative glass-panel-glow w-full max-w-md rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl">
            {/* Top gradient bar */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="p-6 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Schedule New Visit</h2>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Book an appointment with the listing agency.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Property</label>
                <select 
                  required 
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full theme-input rounded-xl px-4 py-3 appearance-none"
                >
                  <option value="">Choose a property...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Client Full Name</label>
                <input 
                  required type="text" placeholder="e.g. Jane Doe" 
                  value={clientName} onChange={(e) => setClientName(e.target.value)}
                  className="w-full theme-input rounded-xl px-4 py-3"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Date</label>
                  <input required type="date" className="w-full theme-input rounded-xl px-4 py-3 [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Time</label>
                  <input required type="time" className="w-full theme-input rounded-xl px-4 py-3 [color-scheme:dark]" />
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl glass-panel text-[var(--text-primary)] font-semibold hover:bg-[var(--glass-bg-hover)] transition-colors border-[var(--border-medium)]">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-indigo-500/40 transition-all">
                  {isSubmitting ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <>Confirm Visit <span>→</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
