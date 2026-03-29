"use client";
import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { useAppConfig } from '@/context/AppConfigContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useProperties } from '@/context/PropertyContext';
import { visits as visitsApi, deals as dealsApi, ApiError } from '@/lib/api';
import { isAdmin, isCompany } from '@/lib/constants';
import { Calendar, Plus, Check, X, RefreshCw, Handshake, IndianRupee } from 'lucide-react';

interface Visit {
  id: string;
  propertyId: string;
  clientName: string;
  clientPhone: string;
  scheduledAt: string;
  status: string;
  property?: { id: string; title: string; city?: string };
}

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  PENDING:   { color: 'text-amber-500',   bg: 'bg-amber-500/10',   border: 'border-amber-500' },
  APPROVED:  { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500' },
  REJECTED:  { color: 'text-rose-500',    bg: 'bg-rose-500/10',    border: 'border-rose-500' },
  COMPLETED: { color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500' },
};

// ── Close Deal Modal ───────────────────────────────────────────────────────────
interface CloseDealModalProps {
  visit: Visit;
  onClose: () => void;
  onSuccess: () => void;
}

function CloseDealModal({ visit, onClose, onSuccess }: CloseDealModalProps) {
  const { addNotification } = useNotifications();
  const { properties } = useProperties();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const property = properties.find(p => p.id === visit.propertyId);
  const salePrice = property?.price ?? 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await dealsApi.close({ propertyId: visit.propertyId });
      addNotification({
        type: 'success',
        title: 'Deal Closed!',
        message: `Deal for ${visit.property?.title || 'property'} has been recorded successfully.`,
        category: 'system',
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to close deal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="glass-panel w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Close Deal</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate max-w-[260px]">
              {visit.property?.title || 'Property'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl glass-panel hover:bg-[var(--glass-bg-hover)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
            <X className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Company-defined terms (read-only) */}
        <div className="space-y-3 mb-6">
          <div className="p-4 rounded-2xl bg-[var(--glass-bg)] border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1">Sale Price (set by company)</p>
            <p className="text-2xl font-black flex items-center gap-1">
              <IndianRupee className="w-5 h-5 text-indigo-400" />
              {salePrice > 0 ? salePrice.toLocaleString('en-IN') : <span className="text-sm text-rose-400">Not set — contact company</span>}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-emerald-400 font-semibold">
            Incentive will be distributed to your wallet automatically after the deal is processed.
          </div>
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-400 font-semibold">
            Incentive will be distributed automatically based on your network hierarchy.
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-white/10 font-bold hover:bg-[var(--glass-bg-hover)] transition-all">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting || salePrice <= 0}
            className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isSubmitting
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Closing…</>
              : <><Handshake className="w-4 h-4" /> Confirm & Close</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VisitsPage() {
  const { profile } = useUserProfile();
  const { properties } = useProperties();
  const { addNotification } = useNotifications();
  const { config } = useAppConfig();

  const userIsAdmin   = isAdmin(profile.role);
  const userIsCompany = isCompany(profile.role);
  const userIsAgent   = !userIsAdmin && !userIsCompany;

  const [visits, setVisits]               = useState<Visit[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [submitError, setSubmitError]     = useState('');

  // Close Deal modal state
  const [closeDealVisit, setCloseDealVisit] = useState<Visit | null>(null);

  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [clientName, setClientName]   = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [visitDate, setVisitDate]     = useState('');
  const [visitTime, setVisitTime]     = useState('');

  const fetchVisits = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await visitsApi.list();
      setVisits(data);
    } catch {
      setVisits([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPropertyId || !clientName || !visitDate || !visitTime) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const scheduledAt = new Date(`${visitDate}T${visitTime}`).toISOString();
      await visitsApi.request({ propertyId: selectedPropertyId, clientName, clientPhone, scheduledAt });
      addNotification({ type: 'success', title: 'Visit Scheduled', message: 'Request sent to listing agency.', category: 'visit' });
      setIsModalOpen(false);
      setSelectedPropertyId(''); setClientName(''); setClientPhone(''); setVisitDate(''); setVisitTime('');
      await fetchVisits();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Failed to schedule visit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (visitId: string, status: string) => {
    try {
      await visitsApi.updateStatus(visitId, status);
      addNotification({
        type: status === 'APPROVED' ? 'success' : 'info',
        title: status === 'APPROVED' ? 'Visit Approved' : 'Visit Rejected',
        message: 'Advisor has been notified.',
        category: 'visit',
      });
      await fetchVisits();
    } catch (err) {
      addNotification({ type: 'error', title: 'Action Failed', message: err instanceof ApiError ? err.message : 'Failed to update visit.', category: 'visit' });
    }
  };

  const handleComplete = async (visitId: string) => {
    try {
      await visitsApi.complete(visitId);
      addNotification({ type: 'success', title: 'Visit Completed', message: 'Marked as completed.', category: 'visit' });
      await fetchVisits();
    } catch (err) {
      addNotification({ type: 'error', title: 'Action Failed', message: err instanceof ApiError ? err.message : 'Failed.', category: 'visit' });
    }
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDay = new Date().getDate();

  const formatScheduled = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 md:p-8 relative z-10 w-full max-w-6xl mx-auto text-[var(--text-primary)]">
      <header className="mb-10 flex flex-col sm:flex-row justify-between sm:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)]">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Live Logistics</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">{config.visits.pageTitle}</h1>
          <p className="text-[var(--text-secondary)]">
            {userIsCompany ? 'Manage incoming advisor visits and approvals.' : config.visits.pageSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchVisits} className="p-3 rounded-2xl glass-panel hover:bg-[var(--glass-bg-hover)] transition-all" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {userIsAgent && (
            <button onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 transition-all text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Schedule Visit
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold mb-2">{userIsCompany ? 'Approval Queue' : 'Your Schedule'}</h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="glass-panel rounded-2xl p-5 flex items-center gap-5 animate-pulse">
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-1/3" />
                    <div className="h-5 bg-white/10 rounded w-2/3" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : visits.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center opacity-50">
              <Calendar className="w-10 h-10 mx-auto mb-3" />
              <p className="font-semibold">No visits found</p>
              {userIsAgent && <p className="text-sm mt-1">Click "Schedule Visit" to create your first visit request</p>}
            </div>
          ) : (
            visits.map((visit) => {
              const style = STATUS_STYLE[visit.status] || STATUS_STYLE.PENDING;
              return (
                <div key={visit.id} className="glass-panel rounded-2xl p-5 flex items-center gap-5 border border-white/5 shadow-sm">
                  <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center bg-indigo-500/10 text-2xl">🏠</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase block mb-1">{formatScheduled(visit.scheduledAt)}</span>
                    <h4 className="text-lg font-bold truncate">{visit.property?.title || 'Property'}</h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Client: {visit.clientName}
                      {visit.clientPhone && <span className="ml-2 opacity-60">· {visit.clientPhone}</span>}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${style.bg} ${style.color}`}>
                      {visit.status}
                    </span>
                    {userIsCompany && visit.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateStatus(visit.id, 'APPROVED')}
                          className="p-2 bg-emerald-500 text-white rounded-lg hover:scale-105 transition-all" title="Approve">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleUpdateStatus(visit.id, 'REJECTED')}
                          className="p-2 bg-rose-500 text-white rounded-lg hover:scale-105 transition-all" title="Reject">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {userIsAgent && visit.status === 'APPROVED' && (
                      <button onClick={() => handleComplete(visit.id)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all">
                        Mark Complete
                      </button>
                    )}
                    {/* Close Deal CTA — only on COMPLETED visits for agents */}
                    {userIsAgent && visit.status === 'COMPLETED' && (
                      <button
                        onClick={() => setCloseDealVisit(visit)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <Handshake className="w-3.5 h-3.5" /> Close Deal
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Calendar sidebar */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" /> Logistics View
            </h3>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {days.map(d => <div key={d} className="text-[10px] font-bold opacity-30 uppercase">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 31 }).map((_, i) => (
                <div key={i} className={`aspect-square flex items-center justify-center text-xs rounded-lg ${
                  i + 1 === currentDay ? 'bg-indigo-600 text-white' : 'opacity-40'
                }`}>{i + 1}</div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Summary</h3>
            {[
              { label: 'Pending',   value: visits.filter(v => v.status === 'PENDING').length,   color: 'text-amber-500' },
              { label: 'Approved',  value: visits.filter(v => v.status === 'APPROVED').length,  color: 'text-emerald-500' },
              { label: 'Completed', value: visits.filter(v => v.status === 'COMPLETED').length, color: 'text-indigo-400' },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)] last:border-0">
                <span className="text-sm text-[var(--text-secondary)]">{s.label}</span>
                <span className={`font-bold text-lg ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule Visit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="glass-panel w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Schedule Visit</h2>
              <button type="button" onClick={() => { setIsModalOpen(false); setSubmitError(''); }}
                className="p-2 rounded-xl glass-panel hover:bg-[var(--glass-bg-hover)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
                <X className="w-4 h-4 flex-shrink-0" /> {submitError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Property</label>
                <select required value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)}
                  className="w-full theme-input rounded-2xl px-4 py-3">
                  <option value="">Select Property…</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.title || p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Client Name</label>
                <input required type="text" value={clientName} onChange={e => setClientName(e.target.value)}
                  className="w-full theme-input rounded-2xl px-4 py-3" placeholder="Client full name" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Client Phone</label>
                <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                  className="w-full theme-input rounded-2xl px-4 py-3" placeholder="+91 98765 43210" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Date</label>
                  <input required type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full theme-input rounded-2xl px-4 py-3" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Time</label>
                  <input required type="time" value={visitTime} onChange={e => setVisitTime(e.target.value)}
                    className="w-full theme-input rounded-2xl px-4 py-3" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsModalOpen(false); setSubmitError(''); }}
                  className="flex-1 py-3 rounded-2xl border border-white/10 font-bold hover:bg-[var(--glass-bg-hover)] transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isSubmitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending…</> : 'Confirm Visit'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Close Deal Modal */}
      {closeDealVisit && (
        <CloseDealModal
          visit={closeDealVisit}
          onClose={() => setCloseDealVisit(null)}
          onSuccess={fetchVisits}
        />
      )}
    </div>
  );
}
