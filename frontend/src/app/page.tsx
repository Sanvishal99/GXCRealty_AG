"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, Key, Shield, Building2, Wallet, X, TrendingUp, Calculator } from "lucide-react";
import { useAppConfig } from '@/context/AppConfigContext';
import Link from 'next/link';

const MARQUEE_ITEMS = [
  "🟢 Level 2 Override: ₹45,000 paid to advisor in Delhi",
  "🔵 Deal Closed: 3BHK in Mumbai (₹2.5Cr)",
  "🟣 New Advisor onboarded under Level 1 network",
  "🟢 Level 1 Override: ₹1,20,000 paid to advisor in Bangalore",
  "🔵 KYC Approved for Premium Advisor in Pune",
];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } }
};

export default function Home() {
  const { config } = useAppConfig();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [recruits, setRecruits] = useState(10);
  const [avgDealSize, setAvgDealSize] = useState(5000000); // 50L

  // 🧮 REALISTIC FINANCIAL ENGINE: 
  // Derived from Global Commission Config (Prisma/Context)
  // Total Deal -> Pool (2%) -> Network Split (15%) -> Tier 1 (40%)
  const commissionPool = (config.deals.commissionPoolPct || 2) / 100;
  const networkPoolFactor = (config.deals.networkPoolPct || 15) / 100;
  const tier1Factor = (config.deals.tierSplits?.[0] || 40) / 100;

  const monthlyVolume = recruits * avgDealSize;
  const passiveIncome = monthlyVolume * commissionPool * networkPoolFactor * tier1Factor;

  // For the marquee animation
  const [marqueePosition, setMarqueePosition] = useState(0);

  // 🖱️ INTERACTIVE PHYSICS: Mouse tracking for orbs
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 30, stiffness: 100 };
  const orb1X = useSpring(mouseX, springConfig);
  const orb1Y = useSpring(mouseY, springConfig);
  
  const orb2X = useSpring(mouseX, springConfig);
  const orb2Y = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize cursor position to center of screen for natural parallax
      mouseX.set(e.clientX - (window.innerWidth / 2));
      mouseY.set(e.clientY - (window.innerHeight / 2));
    };
    window.addEventListener("mousemove", handleMouseMove);
    
    // Marquee logic
    const interval = setInterval(() => {
      setMarqueePosition((prev) => (prev <= -100 ? 0 : prev - 0.05));
    }, 20);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(interval);
    };
  }, [mouseX, mouseY]);

  return (
    <main className="relative flex flex-col items-center justify-start min-h-screen overflow-x-hidden font-sans pb-32 bg-[#fafafa] text-[#0f172a]">
      {/* Optimized Light Mode Overlay */}
      <div className="noise-overlay opacity-[0.02]" />
      
      {/* Soft Light Mode Orbs */}
      <div className="fixed inset-0 pointer-events-none z-[-2] overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute w-[70vw] h-[70vw] opacity-[0.15] rounded-full"
          style={{ 
            x: orb1X, 
            y: orb1Y,
            background: "radial-gradient(circle, rgba(99,102,241,0.8) 0%, transparent 70%)",
            filter: "blur(70px)"
          }} 
        />
        <motion.div 
          animate={{ scale: [1.05, 1, 1.05] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute w-[60vw] h-[60vw] opacity-[0.10] rounded-full"
          style={{ 
            x: orb2X, 
            y: orb2Y,
            background: "radial-gradient(circle, rgba(16,185,129,0.8) 0%, transparent 70%)",
            filter: "blur(80px)",
            bottom: "-10%", left: "-5%"
          }} 
        />
      </div>

      {/* Navigation */}
      <nav className="w-full p-6 flex justify-between items-center max-w-7xl mx-auto bg-white/70 backdrop-blur-xl mt-4 rounded-2xl z-40 sticky top-4 mb-16 border border-neutral-200/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md overflow-hidden bg-indigo-600">
            {config.branding.logoImage ? (
              <img src={config.branding.logoImage} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-white drop-shadow-md">{config.branding.logoEmoji}</span>
            )}
          </div>
          <span className="text-xl font-extrabold tracking-tight text-neutral-900">{config.branding.appName}</span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="px-6 py-2 text-sm font-semibold transition-colors text-neutral-600 hover:text-indigo-600 cursor-pointer"
          >
            {config.landing.heroCta}
          </button>
          <Link href="/login" className="px-6 py-2 text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-all shadow-md shadow-neutral-900/10 cursor-pointer">
            {config.landing.heroSecondary}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="z-10 flex flex-col items-center text-center px-4 max-w-5xl mt-8">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-5 py-2 mb-10 rounded-full font-bold text-xs uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 shadow-sm"
        >
          <Key className="w-4 h-4" />
          Strictly Invite-Only Network
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl md:text-[5.5rem] font-extrabold tracking-tight mb-8 text-neutral-900 leading-[1.05] relative"
        >
          {config.landing.heroTitle.split(' ').slice(0, -2).join(' ')} <br className="hidden md:block"/>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 block mt-2 drop-shadow-sm">{config.landing.heroTitle.split(' ').slice(-2).join(' ')}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl md:text-2xl text-neutral-600 mb-14 max-w-3xl leading-relaxed tracking-tight"
        >
          {config.landing.heroSubtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-6 w-full justify-center px-4"
        >
          <button 
            className="group relative flex items-center justify-center gap-3 px-10 py-5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/20 transition-all overflow-hidden text-lg cursor-pointer"
            onClick={() => setIsApplyModalOpen(true)}
          >
            <span className="relative z-10">Request Access Pipeline</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
          </button>
        </motion.div>
      </div>

      {/* Dynamic Income Calculator Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-5xl mt-40 px-4"
      >
        <div className="bg-white p-8 md:p-14 rounded-[2rem] relative overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-neutral-200/60">
          <div className="flex flex-col md:flex-row gap-16 items-center relative z-10">
            <div className="flex-1 space-y-10 w-full">
              <div>
                <h2 className="text-4xl font-extrabold mb-3 flex items-center gap-4 text-emerald-600">
                  <Calculator className="w-10 h-10 text-emerald-500" />
                  Scale Your Wealth
                </h2>
                <p className="text-neutral-500 text-lg leading-relaxed font-medium">Calculate your potential monthly passive income based on your Level 1 downline overrides ({((commissionPool * networkPoolFactor * tier1Factor) * 100).toFixed(4)}%). Incentive rates are set per property.</p>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-sm font-bold tracking-wide text-neutral-500 uppercase">Advisors Recruited</label>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full text-sm border border-emerald-100">{recruits} Advisors</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={recruits}
                    onChange={(e) => setRecruits(parseInt(e.target.value))}
                    className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-600 transition-all"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-sm font-bold tracking-wide text-neutral-500 uppercase">Avg. Deal Volume per Advisor</label>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full text-sm border border-emerald-100">₹{(avgDealSize / 100000).toFixed(1)}L Monthly</span>
                  </div>
                  <input
                    type="range"
                    min="1000000"
                    max="50000000"
                    step="500000"
                    value={avgDealSize}
                    onChange={(e) => setAvgDealSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-600 transition-all"
                  />
                </div>
              </div>
            </div>

            <motion.div 
              className="w-full md:w-auto min-w-[360px] p-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl border border-emerald-400 flex flex-col items-center justify-center text-center shadow-2xl shadow-emerald-500/30 relative overflow-hidden"
              whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 300 } }}
            >
              <div className="absolute inset-0 bg-white/5 pointer-events-none" />
              <span className="text-xs tracking-widest text-emerald-100 uppercase font-black mb-4 relative z-10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
                Projected Passive Monthly
              </span>
              <div className="text-5xl md:text-6xl font-extrabold text-white mb-8 flex items-center justify-center gap-2 drop-shadow-md relative z-10">
                <motion.span 
                  key={passiveIncome} 
                  initial={{ opacity: 0.5, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  ₹{passiveIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </motion.span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700 text-sm bg-white px-5 py-2.5 rounded-full font-bold shadow-md relative z-10">
                <TrendingUp className="w-4 h-4" />
                Automated Network Payout
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Feature Highlights */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-40 mb-32 max-w-7xl w-full px-4"
      >
        {[
          { icon: Building2, title: config.landing.feature1Title, desc: config.landing.feature1Desc, colorClass: "text-indigo-600", bgClass: "bg-indigo-50", hoverBorder: "hover:border-indigo-300" },
          { icon: Shield, title: config.landing.feature2Title, desc: config.landing.feature2Desc, colorClass: "text-emerald-600", bgClass: "bg-emerald-50", hoverBorder: "hover:border-emerald-300" },
          { icon: Wallet, title: config.landing.feature3Title, desc: config.landing.feature3Desc, colorClass: "text-purple-600", bgClass: "bg-purple-50", hoverBorder: "hover:border-purple-300" },
          { icon: TrendingUp, title: config.landing.feature4Title, desc: config.landing.feature4Desc, colorClass: "text-rose-600", bgClass: "bg-rose-50", hoverBorder: "hover:border-rose-300" }
        ].map((feature, i) => (
          <motion.div 
            key={i} 
            variants={staggerItem}
            className={`flex flex-col items-center text-center p-8 rounded-3xl bg-white border border-neutral-200/80 shadow-sm hover:shadow-xl transition-all duration-300 cursor-default group ${feature.hoverBorder}`}
          >
            <div className={`p-4 rounded-2xl mb-6 shadow-sm ${feature.colorClass} ${feature.bgClass} group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 relative`}>
              <feature.icon className="w-8 h-8 relative z-10" />
            </div>
            <h3 className="font-extrabold text-xl mb-3 text-neutral-900 tracking-tight">{feature.title}</h3>
            <p className="text-neutral-500 leading-relaxed text-sm font-medium">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Live Marquee Ticker */}
      <div className="fixed bottom-0 left-0 w-full overflow-hidden bg-white/90 backdrop-blur-md border-t border-neutral-200 py-3 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
        <div
          className="flex whitespace-nowrap gap-8 text-sm font-bold text-neutral-600"
          style={{ transform: `translateX(${marqueePosition}%)` }}
        >
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <span key={idx} className="flex-shrink-0 flex items-center gap-2">
              {item} <span className="opacity-30 mx-4 text-neutral-400">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Apply Modal overlay */}
      <AnimatePresence>
        {isApplyModalOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/40"
            onClick={() => setIsApplyModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] p-10 max-w-md w-full relative shadow-2xl border border-neutral-100"
            >
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-800 transition-colors bg-neutral-100 p-2 rounded-full hover:bg-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 border border-indigo-100 shadow-sm">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-extrabold mb-2 text-neutral-900">Request Access</h3>
                <p className="text-neutral-500 text-sm leading-relaxed font-medium">Join the exclusive GXCRealty network. We will review your application within 24 hours.</p>
              </div>

              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 ml-1">Full Name</label>
                  <input type="text" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" placeholder="James Bond" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 ml-1">Email Address</label>
                  <input type="email" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" placeholder="james@secret.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 ml-1">Real Estate Experience</label>
                  <select className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer">
                    <option>Select experience...</option>
                    <option>0-2 Years</option>
                    <option>3-5 Years</option>
                    <option>5+ Years (Executive/Advisor)</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full relative group overflow-hidden bg-neutral-900 text-white font-bold rounded-xl py-4 transition-all text-lg flex items-center justify-center gap-2 hover:bg-neutral-800 shadow-lg shadow-neutral-900/20">
                    <span>Submit Application</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
