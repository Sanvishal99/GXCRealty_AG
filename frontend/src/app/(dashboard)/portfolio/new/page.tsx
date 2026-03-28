"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProperties } from '@/context/PropertyContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAuditLog } from '@/context/LogContext';
import { 
  Building2, MapPin, IndianRupee, Percent, 
  Compass, Train, Plane, GraduationCap, 
  CheckCircle2, ChevronRight, ChevronLeft, 
  Layout, Image as ImageIcon, Map as MapIcon, 
  ShieldCheck, Info, PlusCircle, Copy, AlertTriangle, X, Edit3,
  Waves, Dumbbell, Car, Shield, Wind, Coffee,
  Video, Lock, Flame, Library, Tv, Lamp, TreePine, 
  Gamepad2, Activity, Home, ShoppingCart, Scissors, Users, 
  Sun, Droplets, Recycle, PhoneCall, Zap, Trash2
} from 'lucide-react';

const AMENITY_OPTIONS = [
  // Core Essentials
  { id: 'lift', label: 'High-Speed Lift', icon: Shield },
  { id: 'power', label: '24/7 Power Backup', icon: Zap },
  { id: 'security', label: 'Multi-Tier Security', icon: Lock },
  { id: 'cctv', label: 'CCTV Surveillance', icon: Video },
  { id: 'intercom', label: 'Intercom Facility', icon: PhoneCall },
  { id: 'fire', label: 'Fire Fighting System', icon: Flame },
  
  // Leisure & Lifestyle
  { id: 'pool', label: 'Swimming Pool', icon: Waves },
  { id: 'gym', label: 'Modern Gym', icon: Dumbbell },
  { id: 'club', label: 'Grand Clubhouse', icon: Coffee },
  { id: 'theatre', label: 'Mini Theatre', icon: Tv },
  { id: 'library', label: 'Reading Room', icon: Library },
  { id: 'spa', label: 'Spa & Sauna', icon: Wind },
  { id: 'garden', label: 'Podium Garden', icon: TreePine },
  { id: 'hall', label: 'Party Hall', icon: Home },

  // Sports & Wellness
  { id: 'jogging', label: 'Jogging Track', icon: Activity },
  { id: 'tennis', label: 'Tennis Court', icon: Activity },
  { id: 'badminton', label: 'Badminton Court', icon: Activity },
  { id: 'games', label: 'Indoor Games', icon: Gamepad2 },
  { id: 'children', label: 'Kids Play Area', icon: Users },
  { id: 'senior', label: 'Senior Citizen Zone', icon: Users },

  // Convenience & Eco
  { id: 'parking', label: 'EV Charging Point', icon: Car },
  { id: 'store', label: 'Grocery Store', icon: ShoppingCart },
  { id: 'salon', label: 'Salon/Spa', icon: Scissors },
  { id: 'rain', label: 'Rainwater Harvest', icon: Droplets },
  { id: 'solar', label: 'Solar Lighting', icon: Sun },
  { id: 'sewage', label: 'STP Plant', icon: Recycle },
];

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { properties, addProperty, updateProperty } = useProperties();
  const { addNotification } = useNotifications();
  const { addLog } = useAuditLog();

  const [step, setStep] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [isDecoding, setIsDecoding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Apartment',
    reraId: '',
    location: '',
    mapUrl: '',
    price: '',
    isNegotiable: true,
    commType: 'percentage',
    commissionValue: '2',
    facing: 'East',
    vastuCompliant: true,
    floor: '12',
    carpetArea: '1450',
    description: '',
    proximity: {
      station: '1.2 km',
      airport: '4.5 km',
      metro: '0.5 km',
      school: '0.8 km'
    },
    amenities: [] as string[],
    units: [{ type: '3BHK Type A', area: '1450', count: '10' }]
  });

  const DRAFT_KEY = 'gxc-project-draft';

  // Draft Recovery Logic
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved && !editId) {
      const parsed = JSON.parse(saved);
      setFormData(parsed.formData);
      setStep(parsed.step || 1);
      setImages(parsed.images || []);
      addNotification({ type: 'info', title: 'Draft Restored!', message: 'Resuming your last project onboarding session.', category: 'system' });
    }
  }, []);

  // Autosave triggers on step change
  useEffect(() => {
    if (!editId) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, step, images }));
    }
  }, [formData, step, images]);

  useEffect(() => {
    if (editId) {
      const p = properties.find(x => x.id === editId);
      if (p) {
        setFormData({
          name: p.name,
          type: p.emoji === '🏙️' ? 'Apartment' : 'Villa',
          reraId: 'RERA-' + p.id.toUpperCase(),
          location: p.location,
          mapUrl: '',
          price: (p.price || 0).toString(),
          isNegotiable: true,
          commType: 'percentage',
          commissionValue: (p.commissionPct || 0).toString(),
          facing: 'East',
          vastuCompliant: true,
          floor: '12',
          carpetArea: (p.area || '').replace(/[^0-9]/g, ''),
          description: '',
          proximity: p.proximity || { station: '1 km', airport: '5 km', metro: '1 km', school: '1 km' },
          amenities: (p.amenities || []).map(a => a.toLowerCase()),
          units: [{ type: 'Standard BHK', area: (p.area || '').replace(/[^0-9]/g, ''), count: '1' }]
        });
        setImages(p.images || []);
      }
    }
  }, [editId, properties]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    window.location.reload(); 
  };

  const handleMapDrill = (url: string) => {
    if (!url.includes('google.com/maps')) return;
    setIsDecoding(true);
    addNotification({ type: 'info', title: 'Geographic Audit Initiated', message: 'Decoding coordinates...', category: 'system' });
    setTimeout(() => {
      setIsDecoding(false);
      setFormData(prev => ({
        ...prev,
        proximity: {
          station: (Math.random() * 2 + 0.5).toFixed(1) + ' km',
          airport: (Math.random() * 15 + 5).toFixed(1) + ' km',
          metro: (Math.random() * 1 + 0.2).toFixed(1) + ' km',
          school: (Math.random() * 1.5 + 0.3).toFixed(1) + ' km'
        }
      }));
      addNotification({ type: 'success', title: 'Connectivity Solved!', message: 'Distances calculated.', category: 'system' });
    }, 2000);
  };

  const toggleAmenity = (id: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(id) 
        ? prev.amenities.filter(a => a !== id) 
        : [...prev.amenities, id]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      location: formData.location,
      price: parseFloat(formData.price),
      commissionPct: formData.commType === 'percentage' ? parseFloat(formData.commissionValue) : (parseFloat(formData.commissionValue) / (parseFloat(formData.price) || 1) * 100),
      beds: 3, baths: 3, area: formData.carpetArea,
      tag: editId ? 'Updated' : 'New Project',
      tagColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
      gradient: 'from-indigo-500/20 to-purple-500/10',
      emoji: formData.type === 'Apartment' ? '🏙️' : '🏡',
      status: 'pending' as any,
      images: images,
      proximity: formData.proximity,
      amenities: formData.amenities
    };

    if (editId) {
      updateProperty(editId, payload);
    } else {
      addProperty(payload);
      localStorage.removeItem(DRAFT_KEY);
    }
    router.push('/portfolio');
  };

  const STEPS = [
    { label: 'Identity' },
    { label: 'Map' },
    { label: 'Vastu' },
    { label: 'Finance' },
    { label: 'Media' },
    { label: 'Amenities' }
  ];

  return (
    <div className="h-screen flex flex-col w-full max-w-7xl mx-auto p-4 md:p-8 lg:p-12 text-[var(--text-primary)] relative overflow-hidden">
      {/* 🔮 Immersive Background Orbs */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] glow-orb-1 rounded-full blur-[120px] opacity-10 pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] glow-orb-2 rounded-full blur-[120px] opacity-10 pointer-events-none translate-y-1/2 -translate-x-1/2" />

      <header className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-6 relative z-10 px-2 shrink-0">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full glass-panel border-[var(--border-medium)] bg-indigo-500/10">
             <PlusCircle className="w-4 h-4 text-indigo-500" />
             <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none">Command Hub</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 lowercase">
            {editId ? 'refine' : 'initialize'} <span className="text-gradient">project</span>
          </h1>
          <p className="font-bold opacity-30 text-[10px] flex items-center gap-2 tracking-tight uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure Asset Sharding
          </p>
        </div>
        <div className="flex gap-3">
           {!editId && <button type="button" onClick={clearDraft} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-rose-500/10 text-rose-500/40 hover:text-rose-500 transition-all shadow-xl group" title="Discard Draft"><Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" /></button>}
           <button type="button" onClick={() => router.back()} className="px-6 py-3.5 rounded-2xl border border-white/10 hover:bg-white/10 font-black text-[10px] uppercase tracking-widest transition-all shadow-xl">Abort</button>
        </div>
      </header>

      {/* 🚀 Electric Navigator HUD */}
      <div className="flex justify-between gap-3 mb-12 relative z-10 px-2 shrink-0">
        {STEPS.map((s, i) => {
          const isActive = step === i + 1;
          const isDone = step > i + 1;
          return (
            <button 
              key={i} type="button" onClick={() => (isDone || isActive) && setStep(i+1)}
              className="flex-1 text-left group transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                 <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-indigo-500' : isDone ? 'text-emerald-500' : 'opacity-10'}`}>0{i+1}</span>
                 {isActive && <div className="h-[2px] flexible-glow flex-1 rounded-full bg-indigo-500" />}
              </div>
              <div className={`h-1 rounded-full overflow-hidden relative ${isActive ? 'bg-indigo-500/20' : isDone ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
                 <div className={`absolute inset-0 transition-all duration-1000 ${isActive ? 'w-full bg-indigo-500' : isDone ? 'w-full bg-emerald-500' : 'w-0'}`} />
              </div>
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-32 relative z-10 w-full">
        <div className="max-w-4xl mx-auto w-full">
          {/* Phase 1: Identity */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-12 duration-700 glass-panel rounded-[40px] p-8 md:p-10 border border-white/10 shadow-3xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] -translate-y-1/2 translate-x-1/2" />
               <h3 className="text-2xl font-black mb-8 flex items-center gap-4 tracking-tighter lowercase">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 shadow-xl shadow-indigo-500/20 flex items-center justify-center text-white text-sm font-black">1</div>
                  Identity & Asset Architecture
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest opacity-30 ml-4">Full Project Title</label>
                     <input required placeholder="Skyline Luxury Towers" className="theme-input w-full px-8 py-4.5 rounded-2xl text-lg font-bold border-indigo-500/10 focus:border-indigo-500 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest opacity-30 ml-4">Classification</label>
                     <div className="relative">
                        <select className="theme-input w-full px-8 py-4.5 rounded-2xl text-lg font-bold appearance-none cursor-pointer" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                          {['Apartment', 'Villa', 'Plot'].map(t => <option key={t} className="bg-slate-900">{t}</option>)}
                        </select>
                        <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 opacity-40" />
                     </div>
                  </div>
                  <div className="md:col-span-2 space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest opacity-30 ml-4">RERA ID</label>
                     <div className="relative">
                        <ShieldCheck className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 opacity-50" />
                        <input placeholder="P518000XXXXX" className="theme-input w-full pl-16 py-4.5 rounded-2xl text-lg font-black tracking-widest uppercase border-emerald-500/5 focus:border-emerald-500/30" value={formData.reraId} onChange={e => setFormData({...formData, reraId: e.target.value})} />
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* Phase 2: Map Intelligence */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-12 duration-700 glass-panel rounded-[40px] p-8 md:p-10 border border-white/10 shadow-3xl space-y-10">
               <h3 className="text-2xl font-black flex items-center gap-4 tracking-tighter lowercase">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 shadow-xl shadow-indigo-500/20 flex items-center justify-center text-white text-sm font-black">2</div>
                  Geographic Telemetry
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-30 ml-4">Market Hub</label>
                        <input required placeholder="Bandra West, Mumbai" className="theme-input w-full px-8 py-4.5 rounded-2xl text-lg font-bold" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-30 ml-4">Maps Pipeline</label>
                        <div className="relative">
                           <MapIcon className={`absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 transition-all ${isDecoding ? 'animate-spin text-indigo-500' : 'opacity-20'}`} />
                           <input 
                              placeholder="Paste project URL to auto-calculate distances" 
                              className={`theme-input w-full pl-16 py-4.5 rounded-2xl text-sm font-medium transition-all ${isDecoding ? 'bg-indigo-500/5 border-indigo-500' : ''}`}
                              value={formData.mapUrl} 
                              onChange={e => { setFormData({...formData, mapUrl: e.target.value}); if (e.target.value.length > 20) handleMapDrill(e.target.value); }} 
                           />
                        </div>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 p-8 rounded-[40px] bg-white/5 border border-white/5 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                     {Object.entries(formData.proximity).map(([key, value]) => {
                        const Icon = key === 'station' ? Train : key === 'airport' ? Plane : key === 'school' ? GraduationCap : MapIcon;
                        return (
                          <div key={key} className="space-y-2 relative z-10">
                             <label className="text-[10px] font-black uppercase opacity-20 ml-2 tracking-widest">{key}</label>
                             <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 focus-within:border-indigo-500/30 transition-all">
                                <Icon className="w-4 h-4 text-indigo-500" />
                                <input className="bg-transparent outline-none w-full text-sm font-black" value={value} onChange={e => setFormData({...formData, proximity: {...formData.proximity, [key]: e.target.value}})} />
                             </div>
                          </div>
                        )
                     })}
                  </div>
               </div>
            </div>
          )}

          {/* Phase 3: Vastu & Config */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-12 duration-700 glass-panel rounded-[40px] p-8 md:p-10 border border-white/10 shadow-3xl space-y-10">
               <h3 className="text-2xl font-black flex items-center gap-4 tracking-tighter lowercase">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 shadow-xl shadow-indigo-500/20 flex items-center justify-center text-white text-sm font-black">3</div>
                  Vastu Architecture & Volume
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest opacity-30 ml-4">Facing</label>
                     <div className="relative">
                        <Compass className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-500/40" />
                        <select className="theme-input w-full pl-16 py-4.5 rounded-2xl text-lg font-bold appearance-none cursor-pointer" value={formData.facing} onChange={e => setFormData({...formData, facing: e.target.value})}>
                          {['East', 'West', 'North', 'South', 'North-East', 'South-East'].map(d => <option key={d} className="bg-slate-900">{d}</option>)}
                        </select>
                     </div>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest opacity-30 ml-4">Floor</label>
                     <input placeholder="e.g. 15th" className="theme-input w-full px-8 py-4.5 rounded-2xl text-lg font-bold" value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest opacity-30 ml-4">Net Area</label>
                     <input placeholder="1850" className="theme-input w-full px-8 py-4.5 rounded-2xl text-lg font-bold" value={formData.carpetArea} onChange={e => setFormData({...formData, carpetArea: e.target.value})} />
                  </div>
               </div>
               <div className={`p-6 rounded-[32px] border transition-all flex justify-between items-center ${formData.vastuCompliant ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${formData.vastuCompliant ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/30' : 'bg-white/10 opacity-30'}`}>
                        <ShieldCheck className="w-6 h-6" />
                     </div>
                     <div>
                        <p className={`text-lg font-black ${formData.vastuCompliant ? 'text-emerald-500' : 'opacity-40'}`}>Vastu Compliant</p>
                        <p className="text-[9px] opacity-40 font-bold uppercase tracking-widest">Alignment Optimized.</p>
                     </div>
                  </div>
                  <input type="checkbox" className="w-6 h-6 accent-emerald-500 scale-125 cursor-pointer" checked={formData.vastuCompliant} onChange={e => setFormData({...formData, vastuCompliant: e.target.checked})} />
               </div>
            </div>
          )}

          {/* Phase 4: Financial Ledger */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-12 duration-700 glass-panel rounded-[40px] p-8 md:p-10 border border-white/10 shadow-3xl space-y-10">
               <h3 className="text-2xl font-black flex items-center gap-4 tracking-tighter lowercase">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 shadow-xl shadow-indigo-500/20 flex items-center justify-center text-white text-sm font-black">4</div>
                  Exchange Economics
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-30 ml-4">Base Asset Value (₹)</label>
                        <div className="relative">
                           <IndianRupee className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500" />
                           <input required placeholder="1,45,00,000" className="theme-input w-full pl-20 py-6 rounded-[32px] text-3xl font-black border-indigo-500/10 focus:border-indigo-500" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                        </div>
                     </div>
                     <div className="flex items-center justify-between p-6 rounded-[28px] bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                           <Zap className="w-6 h-6 text-indigo-500" />
                           <span className="text-lg font-black tracking-tighter">Negotiable</span>
                        </div>
                        <input type="checkbox" className="w-6 h-6 accent-indigo-500 scale-110 cursor-pointer" checked={formData.isNegotiable} onChange={e => setFormData({...formData, isNegotiable: e.target.checked})} />
                     </div>
                  </div>
                  <div className="glass-panel p-8 rounded-[40px] border border-white/5 relative overflow-hidden group">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-6">Commission Structure</h4>
                     <div className="relative">
                        <Percent className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500/50" />
                        <input className="theme-input w-full pl-16 py-6 rounded-2xl text-4xl font-black text-indigo-500 bg-indigo-500/5" placeholder="2.4" value={formData.commissionValue} onChange={e => setFormData({...formData, commissionValue: e.target.value})} />
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* Phase 5: Media Repository */}
          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right-12 duration-700 glass-panel rounded-[48px] p-8 md:p-12 border border-white/10 shadow-3xl space-y-10">
               <h3 className="text-3xl font-black flex items-center gap-4 tracking-tighter lowercase">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/20 flex items-center justify-center text-white text-lg font-black">5</div>
                  Visual Telemetry
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {images.map((img, i) => (
                    <div key={i} className="aspect-video relative rounded-3xl overflow-hidden group border border-white/5 shadow-2xl">
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                          <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="p-4 bg-rose-500 rounded-2xl text-white shadow-xl hover:scale-110 transition-all"><Trash2 className="w-6 h-6" /></button>
                       </div>
                       <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Asset Preview" />
                    </div>
                  ))}
                  <label className="aspect-video rounded-[36px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center bg-white/5 cursor-pointer hover:bg-white/10 hover:border-indigo-500/30 transition-all group overflow-hidden">
                     <input type="file" multiple accept="image/*" className="hidden" onChange={e => { if(e.target.files) setImages([...images, ...Array.from(e.target.files).map(f => URL.createObjectURL(f))]) }} />
                     <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                        <ImageIcon className="w-8 h-8" />
                     </div>
                     <p className="font-black text-xs uppercase tracking-widest opacity-40">Inject Media Rendering</p>
                  </label>
               </div>
               <div className="p-8 rounded-[40px] bg-amber-500/5 border border-amber-500/10 flex gap-6 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 shadow-lg"><Info className="w-8 h-8" /></div>
                  <p className="text-xs font-bold leading-relaxed opacity-60 uppercase tracking-widest">Optimized visual assets drive 64% faster agent cluster formation and listing liquidity.</p>
               </div>
            </div>
          )}

          {/* Phase 6: Amenities */}
          {step === 6 && (
            <div className="animate-in fade-in slide-in-from-right-12 duration-700 glass-panel rounded-[40px] p-8 md:p-10 border border-white/10 shadow-3xl space-y-10">
               <h3 className="text-2xl font-black flex items-center gap-4 tracking-tighter lowercase">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 shadow-xl shadow-indigo-500/20 flex items-center justify-center text-white text-sm font-black">6</div>
                  Asset Infrastructure Matrix
               </h3>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {AMENITY_OPTIONS.map(opt => {
                     const Icon = opt.icon;
                     const isActive = formData.amenities.includes(opt.id);
                     return (
                       <button 
                         key={opt.id}
                         type="button"
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           toggleAmenity(opt.id);
                         }}
                         className={`p-6 rounded-[32px] border transition-all flex flex-col gap-3 items-center text-center group relative overflow-hidden ${isActive ? 'bg-indigo-600 border-indigo-400 shadow-xl' : 'glass-panel border-white/5 hover:border-white/20'}`}
                       >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-white text-indigo-600 shadow-xl' : 'bg-indigo-500/10 text-indigo-500 group-hover:scale-110'}`}>
                             <Icon className="w-5 h-5" />
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-widest leading-tight ${isActive ? 'text-white' : 'opacity-40'}`}>{opt.label}</span>
                       </button>
                     );
                  })}
               </div>
            </div>
          )}
        </div>

        <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-4xl p-3 md:p-4 glass-panel rounded-[28px] border border-white/10 flex gap-3 z-50 shadow-2xl backdrop-blur-3xl animate-in slide-in-from-bottom-12 duration-700">
           {step > 1 && (
             <button 
               type="button" onClick={() => setStep(step-1)} 
               className="p-4 md:px-6 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-all text-[var(--text-secondary)] text-sm"
             >
                <ChevronLeft className="w-5 h-5 md:mr-2 inline" /> <span className="hidden md:inline">Back</span>
             </button>
           )}
           
           {step < 6 ? (
             <button 
               type="button" onClick={() => setStep(step+1)} 
               className="flex-1 py-4 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 group text-xs"
             >
                Continue to {STEPS[step]?.label || 'Next'} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
             </button>
           ) : (
             <button 
               type="submit" 
               className="flex-1 py-4 rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 group text-xs"
             >
                <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" /> Publish Listing
             </button>
           )}
        </footer>
      </form>
    </div>
  );
}
