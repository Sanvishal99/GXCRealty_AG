"use client";
import { useState } from "react";
import { useNotifications } from "@/context/NotificationContext";

const KYC_REQUESTS = [
  { id: '1', user: 'Sarah Lee', email: 'sarah.lee@gxcrealty.com', aadhaar: 'XXXX-XXXX-8901', pan: 'XXXXX1234P', document: 'Selfie + ID Proof', status: 'PENDING', submitted: '2 hours ago', avatar: 'SL', grad: 'from-indigo-500 to-purple-600' },
  { id: '2', user: 'John Doe', email: 'john@gxcrealty.com', aadhaar: 'XXXX-XXXX-5566', pan: 'XXXXX9988A', document: 'ID Proof Only', status: 'REJECTED', submitted: '1 day ago', avatar: 'JD', grad: 'from-emerald-500 to-teal-500' },
  { id: '3', user: 'Mike Patel', email: 'mike@builders.inc', aadhaar: 'XXXX-XXXX-4433', pan: 'XXXXX0011Z', document: 'Selfie Only', status: 'PENDING', submitted: '3 hours ago', avatar: 'MP', grad: 'from-amber-500 to-yellow-500' },
];

export default function AdminKycPage() {
  const [requests, setRequests] = useState(KYC_REQUESTS);
  const [viewingRequest, setViewingRequest] = useState<any>(null);
  const { addNotification } = useNotifications();

  const handleAction = (id: string, action: 'APPROVE' | 'REJECT') => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: action === 'APPROVE' ? 'VERIFIED' : 'REJECTED' } : r));
    setViewingRequest(null);
    addNotification({
      type: action === 'APPROVE' ? 'success' : 'error',
      title: action === 'APPROVE' ? 'KYC Approved' : 'KYC Rejected',
      message: `The user has been notified of the ${action.toLowerCase()}al.`,
      category: 'system'
    });
  };

  return (
    <div className="p-8 relative z-10 w-full max-w-7xl mx-auto text-[var(--text-primary)]">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full glass-panel border-[var(--border-medium)]">
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Verification Services</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">KYC <span className="text-gradient">Review Queue</span></h1>
          <p className="text-[var(--text-secondary)]">Examine identify documents and verify agent credentials for the network.</p>
        </div>
        <div className="flex items-center gap-4 py-2 px-4 rounded-2xl glass-panel text-sm text-[var(--text-secondary)]">
          <span className="font-bold text-emerald-500">{requests.filter(r => r.status === 'PENDING').length}</span> Pending Requests
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map((request) => (
          <div key={request.id} className="glass-panel-glow rounded-3xl p-6 relative overflow-hidden group border border-[var(--border-subtle)] hover:-translate-y-1.5 transition-all">
            <div className="absolute top-0 right-0 p-8 bg-indigo-500/5 blur-[50px] rounded-full" />
            
            <div className="flex items-center gap-4 mb-6 relative">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${request.grad} flex items-center justify-center text-white font-bold shadow-lg`}>
                {request.avatar}
              </div>
              <div>
                <p className="font-bold text-lg leading-tight">{request.user}</p>
                <p className="text-xs text-[var(--text-secondary)]">{request.email}</p>
              </div>
              <div className="ml-auto">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                  request.status === 'PENDING' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : 
                  request.status === 'VERIFIED' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' :
                  'text-rose-500 bg-rose-500/10 border-rose-500/20'
                }`}>
                  {request.status}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-8 relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-3 rounded-2xl border border-[var(--border-subtle)]">
                   <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-1">Aadhaar</p>
                   <p className="text-xs font-mono">{request.aadhaar}</p>
                </div>
                <div className="glass-panel p-3 rounded-2xl border border-[var(--border-subtle)]">
                   <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-1">PAN Card</p>
                   <p className="text-xs font-mono">{request.pan}</p>
                </div>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-[var(--border-subtle)] flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                   </svg>
                   <p className="text-sm font-semibold">{request.document}</p>
                 </div>
                 <p className="text-[10px] text-[var(--text-muted)]">{request.submitted}</p>
              </div>
            </div>

            <div className="flex gap-3 relative">
               <button 
                 onClick={() => setViewingRequest(request)}
                 className="flex-1 py-3 rounded-2xl glass-panel text-sm font-bold border border-[var(--border-subtle)] hover:bg-[var(--glass-bg-hover)] transition-all"
               >
                 View Files
               </button>
               {request.status === 'PENDING' && (
                 <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => handleAction(request.id, 'APPROVE')}
                      className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleAction(request.id, 'REJECT')}
                      className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                 </div>
               )}
            </div>
          </div>
        ))}
      </div>

      {/* Viewer Modal */}
      {viewingRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md" onClick={() => setViewingRequest(null)}>
           <div className="glass-panel-glow w-full max-w-4xl h-[80vh] rounded-[40px] p-6 lg:p-12 relative flex flex-col lg:flex-row gap-8 overflow-hidden" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setViewingRequest(null)}
                className="absolute top-6 right-6 p-2 rounded-full glass-panel hover:bg-white/10 text-white transition-all z-20"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Sidebar Info */}
              <div className="w-full lg:w-72 flex flex-col h-full relative z-10">
                 <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${viewingRequest.grad} flex items-center justify-center text-white text-3xl font-bold shadow-2xl mb-6`}>
                   {viewingRequest.avatar}
                 </div>
                 <h3 className="text-3xl font-black tracking-tighter mb-2">{viewingRequest.user}</h3>
                 <p className="text-sm text-[var(--text-secondary)] mb-8">{viewingRequest.email}</p>
                 
                 <div className="space-y-4 flex-1">
                    <div className="p-4 rounded-2xl glass-panel border border-white/5 bg-white/5">
                       <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Verification Checklist</p>
                       <ul className="space-y-2 text-sm font-semibold">
                          <li className="flex items-center gap-2 text-emerald-400">
                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                             Government ID Photo
                          </li>
                          <li className="flex items-center gap-2 text-emerald-400">
                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                             Selfie Verification
                          </li>
                          <li className="flex items-center gap-2 text-amber-500">
                             <div className="w-4 h-1 border-b-2 border-amber-500" />
                             Address Match
                          </li>
                       </ul>
                    </div>
                 </div>

                 {viewingRequest.status === 'PENDING' && (
                   <div className="pt-8 flex flex-col gap-3 mt-auto">
                      <button 
                        onClick={() => handleAction(viewingRequest.id, 'APPROVE')}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-500/20 hover:-translate-y-1 transition-all"
                      >
                        APPROVE VERIFICATION
                      </button>
                      <button 
                        onClick={() => handleAction(viewingRequest.id, 'REJECT')}
                        className="w-full py-4 rounded-2xl glass-panel text-rose-500 font-black text-sm hover:bg-rose-500 hover:text-white transition-all"
                      >
                        REJECT & NOTIFY
                      </button>
                   </div>
                 )}
              </div>

              {/* Main Document Viewer (Placeholder) */}
              <div className="flex-1 bg-black/40 rounded-[32px] border border-white/5 flex items-center justify-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 opacity-50" />
                 <div className="text-center relative z-10">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10 group-hover:scale-110 transition-transform">
                       <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                       </svg>
                    </div>
                    <p className="font-bold text-lg mb-1 tracking-tight">Main ID Document Preview</p>
                    <p className="text-sm text-[var(--text-secondary)]">Secure document view — Encrypted AES-256</p>
                 </div>
                 
                 {/* Decorative elements */}
                 <div className="absolute bottom-6 left-6 flex gap-2">
                    <div className="px-3 py-1 rounded-full glass-panel text-[10px] font-bold text-emerald-500 border-white/10 uppercase tracking-widest">Aadhaar (Front)</div>
                    <div className="px-3 py-1 rounded-full glass-panel text-[10px] font-bold text-white/50 border-white/10 uppercase tracking-widest">Aadhaar (Back)</div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
