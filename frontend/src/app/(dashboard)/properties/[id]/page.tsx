"use client";
import { useParams, useRouter } from 'next/navigation';
import { useCurrency } from '@/context/CurrencyContext';
import { useNotifications } from '@/context/NotificationContext';
import Link from 'next/link';

export default function PropertyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();

  // Mock property data based on ID
  const idNum = parseInt(propertyId) || 1;
  const price = (1.2 * idNum) * 1000000;
  
  const handleRequestVisit = () => {
    router.push(`/visits?openModal=true&propertyId=${idNum}&clientName=Jane%20Doe`);
  };

  return (
    <div className="p-8 relative z-10 w-full max-w-5xl mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Properties
        </button>
      </header>

      <div className="glass-panel p-2 rounded-3xl mb-8">
        <div className="w-full h-[400px] md:h-[500px] bg-zinc-800 rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
          
          <div className="absolute top-6 left-6 z-20 flex gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-indigo-500/80 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm shadow-lg">
              Available
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-black/50 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm border border-white/10 shadow-lg">
              New Listing
            </span>
          </div>

          <div className="absolute bottom-8 left-8 right-8 z-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">Luxury Villa {idNum}</h1>
              <p className="text-zinc-300 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Prime Estate Location, Sector {idNum * 12}
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm text-zinc-400 uppercase tracking-widest font-semibold mb-1">Asking Price</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{formatCurrency(price)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">Property Description</h2>
            <p className="text-zinc-300 leading-relaxed mb-6">
              A stunning contemporary masterpiece with panoramic views, featuring an infinity pool, smart home technology, and expansive outdoor entertainment areas. Designed by award-winning architects, this property blends seamless indoor-outdoor living with the finest luxury finishes.
            </p>
            <p className="text-zinc-300 leading-relaxed">
              The gourmet chef's kitchen features imported Italian marble countertops, professional-grade appliances, and a climate-controlled wine cellar. The master suite offers a private terrace, dual walk-in closets, and an opulent spa-like bathroom with sweeping vistas of the surrounding landscape.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-6">Key Specifications</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Bedrooms', value: '5', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                { label: 'Bathrooms', value: '6.5', icon: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z' },
                { label: 'Area', value: '8,500 sq ft', icon: 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4' },
                { label: 'Lot Size', value: '1.2 Acres', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
              ].map((spec, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl border border-white/5">
                  <svg className="w-6 h-6 text-indigo-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={spec.icon} />
                  </svg>
                  <span className="text-xl font-bold text-white">{spec.value}</span>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">{spec.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="glass-panel p-6 rounded-2xl border-indigo-500/30 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
             <h3 className="text-xl font-bold mb-4">Agent Actions</h3>
             <div className="space-y-4 relative z-10">
               <button 
                onClick={handleRequestVisit}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
               >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
                 Request Visit
               </button>
               <Link 
                href="/deals"
                className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white font-bold py-3.5 rounded-xl hover:bg-white/10 transition-colors"
               >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 Draft Deal
               </Link>
             </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-4">Commission Structure</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Total Pool</span>
                <span className="font-mono text-white text-base">{formatCurrency(price * 0.05)} (5%)</span>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Your Direct Share</span>
                <span className="font-mono text-emerald-400 font-bold text-base">{formatCurrency(price * 0.025)} (50%)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Upline Distribution</span>
                <span className="font-mono text-indigo-400 text-base">{formatCurrency(price * 0.025)} (50%)</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-4">Listing Agency</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center border border-white/10">
                <span className="font-bold text-zinc-300">GXC</span>
              </div>
              <div>
                <p className="font-semibold text-white">GXC Builders & Co.</p>
                <p className="text-xs text-emerald-400">Verified Partner</p>
              </div>
            </div>
            <button className="w-full mt-4 bg-white/5 border border-white/10 text-zinc-300 font-medium py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm">
              Contact Agency
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
