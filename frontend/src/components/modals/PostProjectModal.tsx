"use client";
import React, { useState } from 'react';
import { useProperties } from '@/context/PropertyContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAuditLog } from '@/context/LogContext';
import { X, Building2, MapPin, IndianRupee, Percent, CheckCircle2, Layout, Image as ImageIcon } from 'lucide-react';

interface PostProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PostProjectModal({ isOpen, onClose }: PostProjectModalProps) {
  const { addProperty } = useProperties();
  const { addNotification } = useNotifications();
  const { addLog } = useAuditLog();

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    price: '',
    commissionPct: '2',
    beds: '3',
    baths: '2',
    area: '1500',
    emoji: '🏢'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location || !formData.price) return;

    addProperty({
      name: formData.name,
      location: formData.location,
      price: parseFloat(formData.price),
      commissionPct: parseFloat(formData.commissionPct),
      beds: parseInt(formData.beds),
      baths: parseInt(formData.baths),
      area: formData.area,
      tag: 'New Listing',
      tagColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
      gradient: 'from-indigo-500/20 to-purple-500/10',
      emoji: formData.emoji,
      status: 'pending'
    });

    addNotification({
      type: 'success',
      title: 'Project Submitted!',
      message: `${formData.name} is now in the GXC Admin verification queue.`,
      category: 'system'
    });

    addLog(`SUBMITTED New Project: ${formData.name}`, 'inventory');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl glass-panel rounded-[40px] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
             </div>
             <h2 className="text-2xl font-black">Post <span className="text-gradient">Project</span></h2>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-white/5 transition-all opacity-40 hover:opacity-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-indigo-500/60 ml-2 tracking-widest">Project Name</label>
              <div className="relative">
                 <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                 <input 
                   required type="text" placeholder="e.g. Skyline Residences" 
                   value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                   className="theme-input w-full rounded-2xl pl-12 py-3.5"
                 />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-indigo-500/60 ml-2 tracking-widest">Location</label>
              <div className="relative">
                 <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                 <input 
                   required type="text" placeholder="e.g. Worli, Mumbai" 
                   value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                   className="theme-input w-full rounded-2xl pl-12 py-3.5"
                 />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-indigo-500/60 ml-2 tracking-widest">Base Price (₹)</label>
              <div className="relative">
                 <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                 <input 
                   required type="number" placeholder="95,00,000" 
                   value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                   className="theme-input w-full rounded-2xl pl-12 py-3.5"
                 />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-indigo-500/60 ml-2 tracking-widest">Commission Pct (%)</label>
              <div className="relative">
                 <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                 <input 
                   required type="number" step="0.1" 
                   value={formData.commissionPct} onChange={e => setFormData({...formData, commissionPct: e.target.value})}
                   className="theme-input w-full rounded-2xl pl-12 py-3.5"
                 />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-indigo-500/60 ml-2 tracking-widest">Configuration (BHK)</label>
              <div className="relative">
                 <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                 <input 
                   required type="number"
                   value={formData.beds} onChange={e => setFormData({...formData, beds: e.target.value})}
                   className="theme-input w-full rounded-2xl pl-12 py-3.5"
                 />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-indigo-500/60 ml-2 tracking-widest">Total Area (Sq.ft)</label>
              <div className="relative">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black opacity-30">SQ</div>
                 <input 
                   required type="text"
                   value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})}
                   className="theme-input w-full rounded-2xl pl-12 py-3.5"
                 />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex gap-4">
             <button 
               type="button" onClick={onClose}
               className="flex-1 py-4 rounded-2xl border border-white/10 hover:bg-white/5 font-black text-xs uppercase tracking-widest transition-all"
             >
               Discard
             </button>
             <button 
               type="submit"
               className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
             >
               <CheckCircle2 className="w-4 h-4" /> Submit for Review
             </button>
          </div>
        </form>
        
        <div className="p-6 bg-amber-500/5 border-t border-amber-500/10 flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
           </div>
           <p className="text-[10px] font-bold text-amber-500/60 uppercase leading-relaxed tracking-wider">Note: Multi-angle project rendering and floorplan upload will be requested once the initial listing is verified by the GXC core team.</p>
        </div>
      </div>
    </div>
  );
}
