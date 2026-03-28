"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, Key, Shield, Building2, Wallet, X, TrendingUp, Calculator } from "lucide-react";
import { useAppConfig } from '@/context/AppConfigContext';
import Link from 'next/link';

const MARQUEE_ITEMS = [
  "🟢 Level 2 Override: ₹45,000 paid to agent in Delhi",
  "🔵 Deal Closed: 3BHK in Mumbai (₹2.5Cr)",
  "🟣 New Agent onboarded under Level 1 network",
  "🟢 Level 1 Override: ₹1,20,000 paid to agent in Bangalore",
  "🔵 KYC Approved for Premium Agent in Pune",
];

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
    <main className="relative flex flex-col items-center justify-start min-h-screen overflow-x-hidden font-sans pb-32 bg-[#f8fafc] text-[#0f172a]">
      {/* Optimized Antigravity Layers */}
      <div className="noise-overlay" />
      <div className="fixed inset-0 aurora-glow-1 pointer-events-none z-[-1]" />
      <div className="fixed inset-0 aurora-glow-2 pointer-events-none z-[-1]" />

      {/* Hardware-Accelerated Kinetic Orbs */}
      <div className="fixed inset-0 pointer-events-none z-[-2] overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute w-[70vw] h-[70vw] opacity-30 rounded-full mesh-orb-1"
          style={{ x: orb1X, y: orb1Y }} 
        />
        <motion.div 
          className="absolute w-[60vw] h-[60vw] opacity-20 rounded-full mesh-orb-2"
          style={{ x: orb2X, y: orb2Y }} 
          animate={{ scale: [1.05, 1, 1.05] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Navigation */}
      <nav className="w-full p-6 flex justify-between items-center max-w-7xl mx-auto glass-panel mt-4 rounded-2xl z-40 sticky top-4"
        style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 overflow-hidden">
            {config.branding.logoImage ? (
              <img src={config.branding.logoImage} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm">{config.branding.logoEmoji}</span>
            )}
          </div>
          <span className="text-xl font-bold tracking-tight text-[#0f172a]">{config.branding.appName}</span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="px-6 py-2 text-sm font-medium transition-colors text-[#64748b] hover:text-indigo-600 cursor-pointer"
          >
            {config.landing.heroCta}
          </button>
          <Link href="/login" className="px-6 py-2 text-sm font-medium bg-[#0f172a] text-white rounded-lg hover:bg-[#334155] transition-all shadow-lg cursor-pointer">
            {config.landing.heroSecondary}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="z-10 flex flex-col items-center text-center px-4 mt-24 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full glass-panel text-sm text-indigo-300"
        >
          <Key className="w-4 h-4" />
          Strictly Invite-Only Network
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl md:text-8xl font-bold tracking-tight mb-8 text-[#0f172a] leading-[1.05]"
        >
          {config.landing.heroTitle.split(' ').slice(0, -2).join(' ')} <br className="hidden md:block"/>
          <span className="text-indigo-600 block mt-2 opacity-90">{config.landing.heroTitle.split(' ').slice(-2).join(' ')}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl md:text-2xl text-[#64748b] mb-12 max-w-2xl leading-relaxed tracking-tight"
        >
          {config.landing.heroSubtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full justify-center px-4"
        >
          <button className="group relative flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-neutral-200 transition-all overflow-hidden text-lg cursor-pointer">
            <span>Enter Invite Code</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 border-2 border-white/20 rounded-xl pointer-events-none" />
          </button>
        </motion.div>
      </div>

      {/* Dynamic Income Calculator Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full max-w-5xl mt-32 px-4"
      >
        <div className="glass-panel p-8 md:p-12 rounded-3xl relative overflow-hidden border border-white/10">
          <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[100px] rounded-full" />
          <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
            <div className="flex-1 space-y-8 w-full">
              <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Calculator className="w-8 h-8 text-indigo-400" />
                  Scale Your Wealth
                </h2>
                <p className="text-[#64748b]">Calculate your potential monthly passive income based on your Level 1 downline overrides ({((commissionPool * networkPoolFactor * tier1Factor) * 100).toFixed(4)}%).</p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-neutral-300">Agents Recruited</label>
                    <span className="text-indigo-600 font-bold">{recruits} Agents</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={recruits}
                    onChange={(e) => setRecruits(parseInt(e.target.value))}
                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-neutral-300">Avg. Deal Volume per Agent (Monthly)</label>
                    <span className="text-indigo-600 font-bold">₹{(avgDealSize / 100000).toFixed(1)}L</span>
                  </div>
                  <input
                    type="range"
                    min="1000000"
                    max="50000000"
                    step="500000"
                    value={avgDealSize}
                    onChange={(e) => setAvgDealSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto min-w-[340px] p-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl border border-indigo-400/30 flex flex-col items-center justify-center text-center shadow-2xl shadow-indigo-500/20">
              <span className="text-xs tracking-widest text-indigo-100 uppercase font-bold mb-3">Projected Passive Monthly</span>
              <div className="text-5xl font-extrabold text-white mb-6 flex items-center gap-2 drop-shadow-sm">
                ₹{passiveIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="flex items-center gap-2 text-indigo-900 text-xs bg-white/90 px-4 py-2 rounded-full font-semibold shadow-sm">
                <TrendingUp className="w-4 h-4" />
                Automated Network Payout
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Feature Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 mb-24 max-w-6xl w-full px-4"
      >
        {[
          { icon: Building2, title: config.landing.feature1Title, desc: config.landing.feature1Desc },
          { icon: Shield, title: config.landing.feature2Title, desc: config.landing.feature2Desc },
          { icon: Wallet, title: config.landing.feature3Title, desc: config.landing.feature3Desc },
          { icon: TrendingUp, title: config.landing.feature4Title, desc: config.landing.feature4Desc }
        ].map((feature, i) => (
          <div key={i} className="flex flex-col items-center text-center p-8 rounded-2xl glass-panel group hover:bg-[var(--glass-bg-hover)] transition-colors cursor-default border border-[var(--border-subtle)] shadow-2xl">
            <div className="p-4 bg-indigo-500/10 rounded-2xl mb-6 text-indigo-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <feature.icon className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-[var(--text-primary)] tracking-wide">{feature.title}</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </motion.div>

      {/* Live Marquee Ticker */}
      <div className="fixed bottom-0 left-0 w-full overflow-hidden bg-black/80 backdrop-blur-md border-t border-white/10 py-3 z-30">
        <div
          className="flex whitespace-nowrap gap-8 text-sm font-medium text-neutral-300"
          style={{ transform: `translateX(${marqueePosition}%)` }}
        >
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <span key={idx} className="flex-shrink-0 flex items-center gap-2">
              {item} <span className="opacity-30 mx-4">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Apply Modal overlay */}
      <AnimatePresence>
        {isApplyModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
            onClick={() => setIsApplyModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f0f13] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-2xl font-bold mb-2">Request Access</h3>
              <p className="text-neutral-400 text-sm mb-8">Join the exclusive GXCRealty network. We will review your application within 24 hours.</p>

              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1 ml-1">Full Name</label>
                  <input type="text" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="James Bond" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1 ml-1">Email Address</label>
                  <input type="email" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="james@secret.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1 ml-1">Real Estate Experience</label>
                  <select className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
                    <option>Select experience...</option>
                    <option>0-2 Years</option>
                    <option>3-5 Years</option>
                    <option>5+ Years (Executive/Agent)</option>
                  </select>
                </div>

                <button type="submit" className="w-full bg-white text-black font-semibold rounded-xl py-4 mt-6 hover:bg-neutral-200 transition-all text-lg">
                  Submit Application
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
