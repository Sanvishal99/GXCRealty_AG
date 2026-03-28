"use client";
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrency } from '@/context/CurrencyContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAuditLog } from '@/context/LogContext';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const { addLog } = useAuditLog();
  const id = params.id as string;
  const [showLimits, setShowLimits] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<{label: string, src: string} | null>(null);
  const [limits, setLimits] = useState({ maxDeal: 50000000, dailyCap: 1000000 });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addNotification({ type: 'info', title: 'Copied', message: `${label} copied to clipboard`, category: 'system' });
  };

  // Mock user data based on ID - in real app, fetch from Supabase
  const user = {
    id,
    name: id === '1' ? 'Alex Carter' : 'Nina Patel',
    email: id === '1' ? 'alex@gxcrealty.com' : 'nina@gxcrealty.com',
    role: 'ELITE AGENT',
    status: 'ACTIVE',
    agentId: `GXC-AG-${id.padStart(5, '0')}`,
    phone: '+91 98765 43210',
    bio: 'Dedicated real estate professional with 5+ years experience in the Mumbai suburbs.',
    performance: {
       dealsClosed: 42,
       totalCommission: 850000,
       activeLeads: 12
    },
    bankDetails: {
       accountName: id === '1' ? 'Alex Carter' : 'Nina Patel',
       accountNumber: '**** **** 4592',
       bankName: 'HDFC Bank',
       ifsc: 'HDFC0001234'
    },
    kycDocuments: {
       status: 'VERIFIED',
       idFront: 'https://images.unsplash.com/photo-1554224155-1696413565d3?w=800',
       idBack: 'https://images.unsplash.com/photo-1554224155-1696413565d3?w=800',
       addressProof: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800'
    }
  };

  const handleAction = (action: string) => {
    addNotification({ type: 'success', title: 'Action Successful', message: `User account has been ${action}.`, category: 'system' });
    addLog(`${action.toUpperCase()} User: ${user.name} (${user.agentId})`, 'security', { userId: id, action });
  };

  return (
    <div className="p-8 relative z-10 w-full max-w-7xl mx-auto text-[var(--text-primary)]">
       <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-white transition-colors">
          <span>←</span> Back to User Directory
       </button>

       <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-6">
             <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-black text-white shadow-xl">
                {user.name[0]}
             </div>
             <div>
                <div className="flex items-center gap-3 mb-2">
                   <h1 className="text-4xl font-black tracking-tight">{user.name}</h1>
                   <span className="badge text-emerald-500 bg-emerald-500/10 border-emerald-500/20">{user.status}</span>
                </div>
                <p className="text-[var(--text-secondary)] font-medium flex items-center gap-4">
                   <span>{user.email}</span>
                   <span className="opacity-30">|</span>
                   <span className="text-indigo-400 font-bold">{user.role}</span>
                </p>
             </div>
          </div>
           <div className="flex gap-3">
              <button onClick={() => handleAction('suspended')} className="px-6 py-3 rounded-2xl bg-rose-500/10 text-rose-500 font-bold text-sm hover:bg-rose-500/20 transition-all">Suspend Account</button>
              <button onClick={() => setShowLimits(true)} className="px-6 py-3 rounded-2xl bg-white text-black font-black text-sm hover:bg-neutral-200 transition-all shadow-lg">Modify Limits</button>
           </div>
       </header>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: General & Bio */}
          <div className="lg:col-span-2 space-y-8">
             <section className="glass-panel rounded-[40px] p-8 border border-white/5">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                   <span className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-sm">👤</span>
                   Agent Profile
                </h3>
                <div className="grid grid-cols-2 gap-8">
                   <div>
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-1.5">Agent Unique ID</label>
                      <p className="font-bold text-lg">{user.agentId}</p>
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-1.5">Phone Contact</label>
                      <p className="font-bold text-lg">{user.phone}</p>
                   </div>
                   <div className="col-span-2 pt-4 border-t border-white/5">
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-1.5">Professional Bio</label>
                      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{user.bio}</p>
                   </div>
                </div>
             </section>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bank Details */}
                <section className="glass-panel rounded-[40px] p-8 border border-white/5 grad-emerald">
                   <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-sm">🏦</span>
                      Settlement Account
                   </h3>
                   <div className="space-y-4">
                      <div>
                         <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest block mb-1">Bank Name</label>
                         <div className="flex items-center gap-2 group">
                            <p className="font-bold">{user.bankDetails.bankName}</p>
                            <button onClick={() => copyToClipboard(user.bankDetails.bankName, 'Bank Name')} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">
                               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                            </button>
                         </div>
                      </div>
                      <div>
                         <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest block mb-1">Account Number</label>
                         <div className="flex items-center gap-2 group">
                            <p className="font-mono font-bold text-lg tracking-wider">{user.bankDetails.accountNumber}</p>
                            <button onClick={() => copyToClipboard(user.bankDetails.accountNumber, 'Account Number')} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">
                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                            </button>
                         </div>
                      </div>
                      <div className="flex justify-between">
                         <div>
                            <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest block mb-1">IFSC Code</label>
                            <div className="flex items-center gap-2 group">
                               <p className="font-bold">{user.bankDetails.ifsc}</p>
                               <button onClick={() => copyToClipboard(user.bankDetails.ifsc, 'IFSC')} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                               </button>
                            </div>
                         </div>
                         <div className="text-right">
                            <label className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest block mb-1">Holder</label>
                            <div className="flex items-center gap-2 justify-end group">
                               <p className="font-bold text-sm">{user.bankDetails.accountName}</p>
                               <button onClick={() => copyToClipboard(user.bankDetails.accountName, 'Account Holder')} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                               </button>
                            </div>
                         </div>
                      </div>
                   </div>
                </section>

                {/* KYC Status */}
                <section className="glass-panel rounded-[40px] p-8 border border-white/5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-16 bg-rose-500/5 blur-[50px] rounded-full" />
                   <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center text-sm">📄</span>
                      Compliance Docs
                   </h3>
                   <div className="space-y-3 relative z-10">
                      {[
                        { label: 'Govt ID Front', src: user.kycDocuments.idFront },
                        { label: 'Govt ID Back', src: user.kycDocuments.idBack },
                        { label: 'Address Proof', src: user.kycDocuments.addressProof },
                      ].map((doc, i) => (
                        <div key={i} onClick={() => setSelectedDoc(doc)} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all cursor-pointer">
                           <span className="text-xs font-bold text-[var(--text-secondary)]">{doc.label}</span>
                           <span className="text-[var(--text-muted)] group-hover:text-indigo-400 transition-colors">👁️</span>
                        </div>
                      ))}
                      <div className="pt-4 text-center">
                         <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Security Audited & Verified
                         </span>
                      </div>
                   </div>
                </section>
             </div>
          </div>

          {/* Right: Performance Stats */}
          <div className="space-y-6">
             <section className="glass-panel rounded-[40px] p-8 border border-indigo-500/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[100px] rounded-full" />
                <h3 className="text-xl font-black mb-8 relative z-10">Network Growth</h3>
                <div className="space-y-8 relative z-10">
                   <div className="flex justify-between items-end">
                      <div>
                         <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Total Earnings</p>
                         <p className="text-3xl font-black text-[var(--text-primary)]">{formatCurrency(user.performance.totalCommission)}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1.5">Success Rate</p>
                         <p className="text-xl font-black text-emerald-400">92%</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex justify-between text-xs font-bold">
                         <span className="text-[var(--text-secondary)]">Deals Closed</span>
                         <span>{user.performance.dealsClosed}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 w-[70%]" />
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                         <span className="text-[var(--text-secondary)]">Lead Response Time</span>
                         <span>1.4h</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 w-[85%]" />
                      </div>
                   </div>
                </div>
             </section>

             <section className="glass-panel rounded-[40px] p-8 border border-white/5">
                <h3 className="text-sm font-black uppercase text-[var(--text-muted)] tracking-widest mb-6">Recent Logins</h3>
                <div className="space-y-4">
                   {[
                      { ip: '102.34.11.92', loc: 'Mumbai, IN', time: '12 mins ago' },
                      { ip: '102.34.11.85', loc: 'Pune, IN', time: 'Yesterday' }
                   ].map((log, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                         <div>
                            <p className="font-bold text-[var(--text-primary)]">{log.ip}</p>
                            <p className="text-[var(--text-muted)] text-[10px]">{log.loc}</p>
                         </div>
                         <span className="text-[var(--text-muted)]">{log.time}</span>
                      </div>
                   ))}
                </div>
             </section>
          </div>
       </div>

       {/* Modify Limits Modal */}
       {showLimits && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="glass-panel w-full max-w-md rounded-[32px] p-8 border border-white/10 shadow-2xl">
               <h3 className="text-xl font-bold mb-6">Modify Transaction Limits</h3>
               
               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Max Property Value (Single Deal)</label>
                    <input type="number" value={limits.maxDeal} onChange={e => setLimits({...limits, maxDeal: parseInt(e.target.value)})} className="w-full theme-input rounded-2xl px-4 py-3 font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Daily Commission Payout Cap</label>
                    <input type="number" value={limits.dailyCap} onChange={e => setLimits({...limits, dailyCap: parseInt(e.target.value)})} className="w-full theme-input rounded-2xl px-4 py-3 font-bold" />
                  </div>

                  <div className="flex gap-3 pt-4">
                     <button onClick={() => { 
                        setShowLimits(false); 
                        handleAction('limits updated'); 
                        addLog(`LIMITS CHANGED for ${user.name}`, 'financial', { prev: limits, current: limits }); 
                     }} className="flex-1 bg-indigo-500 text-white font-bold py-3 rounded-xl hover:bg-indigo-600 transition-all">Save Limits</button>
                     <button onClick={() => setShowLimits(false)} className="px-6 py-3 rounded-xl bg-white/5 text-[var(--text-primary)] font-bold">Cancel</button>
                  </div>
               </div>
            </div>
         </div>
       )}

       {/* KYC Document Viewer Lightbox */}
       {selectedDoc && (
         <div className="fixed inset-0 z-[120] flex items-center justify-center p-8 bg-black/90 backdrop-blur-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setSelectedDoc(null)} className="absolute top-8 right-8 p-4 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="max-w-4xl w-full h-full flex flex-col items-center justify-center gap-6">
               <div className="text-center">
                  <h3 className="text-2xl font-black text-white">{selectedDoc.label}</h3>
                  <p className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Verified Electronic Document</p>
               </div>
               <div className="w-full flex-1 rounded-[40px] overflow-hidden border border-white/10 shadow-3xl shadow-white/5">
                  <img src={selectedDoc.src} className="w-full h-full object-contain" alt="KYC Document Preview" />
               </div>
               <div className="flex gap-4">
                  <button className="px-8 py-3 rounded-2xl bg-white text-black font-black text-sm uppercase">Download Copy</button>
                  <button onClick={() => setSelectedDoc(null)} className="px-8 py-3 rounded-2xl bg-white/5 text-white font-bold text-sm">Close Viewer</button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}
