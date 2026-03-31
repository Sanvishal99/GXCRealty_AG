"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Key, Shield, Building2, Wallet, X, TrendingUp, Calculator, Star, Users, Zap } from "lucide-react";
import { useAppConfig } from '@/context/AppConfigContext';
import Link from 'next/link';

const CityScene = dynamic(() => import('@/components/CityScene'), { ssr: false });

const MARQUEE_ITEMS = [
  "🏅 Level 2 Override: ₹45,000 paid to advisor in Delhi",
  "🏅 Deal Closed: 3BHK in Mumbai (₹2.5Cr)",
  "🏅 New Advisor onboarded under Level 1 network",
  "🏅 Level 1 Override: ₹1,20,000 paid to advisor in Bangalore",
  "🏅 KYC Approved for Premium Advisor in Pune",
];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } }
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 90, damping: 18 } }
};

// Gold palette constants
const GOLD      = '#B8860B';
const GOLD_MID  = '#C9A227';
const GOLD_LIGHT= '#D4A843';
const GOLD_PALE = '#F5E6B8';
const GOLD_BG   = '#FDF8ED';   // warm ivory page bg
const GOLD_CARD = '#FFFDF5';   // card bg
const BORDER    = 'rgba(180,130,30,0.18)';
const TEXT_DARK = '#1a1200';
const TEXT_MID  = '#5a4a28';
const TEXT_SOFT = '#9a8060';

export default function Home() {
  const { config } = useAppConfig();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', experience: '' });
  const [recruits, setRecruits] = useState(10);
  const [avgDealSize, setAvgDealSize] = useState(5000000);
  const [marqueePosition, setMarqueePosition] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const commissionPool   = (config.deals.commissionPoolPct  || 2)  / 100;
  const networkPoolFactor = (config.deals.networkPoolPct     || 15) / 100;
  const tier1Factor       = (config.deals.tierSplits?.[0]   || 40) / 100;
  const passiveIncome     = recruits * avgDealSize * commissionPool * networkPoolFactor * tier1Factor;

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    const id = setInterval(() => setMarqueePosition(p => (p <= -100 ? 0 : p - 0.04)), 20);
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearInterval(id);
    };
  }, []);

  const closeModal = () => {
    setIsApplyModalOpen(false);
    setSubmitState('idle');
    setFormData({ fullName: '', email: '', phone: '', experience: '' });
  };

  return (
    <main className="relative flex flex-col items-center min-h-screen overflow-x-hidden font-sans pb-24"
      style={{ background: GOLD_BG, color: TEXT_DARK }}>

      {/* ── 3D City Background (fixed, full viewport) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CityScene scrollY={scrollY} />
        {/* Page overlay so content is readable */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(253,248,237,0.55) 0%, rgba(253,248,237,0.72) 40%, rgba(253,248,237,0.88) 100%)' }} />
      </div>

      {/* ── Navigation ── */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 z-40 sticky top-3">
        <nav className="relative flex justify-between items-center px-5 py-3 rounded-2xl border"
          style={{
            background: 'rgba(255,253,245,0.85)',
            backdropFilter: 'blur(20px)',
            borderColor: BORDER,
            boxShadow: `0 4px 24px rgba(180,130,30,0.08), 0 1px 0 rgba(255,240,180,0.8) inset`,
          }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shadow"
              style={{
                background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD}, #A07208)`,
                boxShadow: `0 3px 12px rgba(180,130,30,0.35)`
              }}>
              {config.branding.logoImage
                ? <img src={config.branding.logoImage} alt="Logo" className="w-full h-full object-cover" />
                : <span className="text-sm">{config.branding.logoEmoji}</span>}
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              <span style={{ color: GOLD }}>GXC</span>
              <span style={{ color: TEXT_DARK }}>Realty</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/browse"
              className="hidden sm:block px-4 py-2 text-sm font-semibold transition-colors rounded-xl border"
              style={{ color: TEXT_MID, borderColor: BORDER }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GOLD; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_MID; }}
            >
              Browse Properties
            </Link>
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="hidden sm:block px-4 py-2 text-sm font-semibold transition-colors"
              style={{ color: TEXT_MID }}
              onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
              onMouseLeave={e => (e.currentTarget.style.color = TEXT_MID)}
            >
              {config.landing.heroCta}
            </button>
            <Link href="/login"
              className="px-5 py-2.5 text-sm font-bold rounded-xl transition-all"
              style={{
                background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
                color: '#fff',
                boxShadow: `0 3px 14px rgba(180,130,30,0.30)`
              }}>
              {config.landing.heroSecondary}
            </Link>
          </div>
        </nav>
      </div>

      {/* ── Hero ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mt-20 sm:mt-28 w-full">
        <motion.div
          initial={{ opacity: 0, y: -14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-5 py-2 mb-10 rounded-full text-xs font-bold uppercase tracking-widest border"
          style={{
            background: `rgba(212,168,67,0.10)`,
            borderColor: `rgba(180,130,30,0.30)`,
            color: GOLD,
          }}
        >
          <Key className="w-3.5 h-3.5" />
          Strictly Invite-Only Network
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.96, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl md:text-[5.5rem] font-extrabold tracking-tight mb-6 leading-[1.05]"
          style={{ color: TEXT_DARK }}
        >
          {config.landing.heroTitle.split(' ').slice(0, -3).join(' ')}{' '}
          <br className="hidden md:block" />
          <span style={{
            background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_MID} 50%, #A07208 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {config.landing.heroTitle.split(' ').slice(-3).join(' ')}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-lg md:text-xl mb-14 max-w-2xl leading-relaxed"
          style={{ color: TEXT_MID }}
        >
          {config.landing.heroSubtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="group flex items-center justify-center gap-3 px-10 py-5 font-bold rounded-2xl text-lg transition-all"
            style={{
              background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD}, #A07208)`,
              color: '#fff',
              boxShadow: `0 8px 28px rgba(180,130,30,0.35)`
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 12px 36px rgba(180,130,30,0.50)`)}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 8px 28px rgba(180,130,30,0.35)`)}
          >
            Request Access
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <Link href="/login"
            className="flex items-center justify-center gap-2 px-10 py-5 font-bold rounded-2xl text-lg transition-all border"
            style={{
              background: 'rgba(212,168,67,0.07)',
              borderColor: `rgba(180,130,30,0.25)`,
              color: GOLD,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.14)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.07)'; }}
          >
            Advisor Login
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-12 mt-20"
        >
          {[
            { label: config.landing.stat1Label, value: config.landing.stat1Value },
            { label: config.landing.stat2Label, value: config.landing.stat2Value },
            { label: config.landing.stat3Label, value: config.landing.stat3Value },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-3xl font-extrabold" style={{
                background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_MID} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{s.value}</span>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: TEXT_SOFT }}>{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Income Calculator ── */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-5xl mt-20 px-4"
      >
        <div className="rounded-[2.5rem] p-8 sm:p-12 md:p-16 border relative overflow-hidden"
          style={{
            background: '#FFFDF5',
            borderColor: BORDER,
            boxShadow: `0 20px 60px rgba(180,130,30,0.10), 0 0 0 1px rgba(180,130,30,0.06)`
          }}>
          {/* Gold corner accent */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, rgba(212,168,67,0.10) 0%, transparent 70%)`, filter: 'blur(30px)' }} />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, rgba(180,130,30,0.07) 0%, transparent 70%)`, filter: 'blur(30px)' }} />

          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center relative z-10">
            <div className="flex-1 space-y-10 w-full">
              <div>
                <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 flex items-center gap-3" style={{ color: TEXT_DARK }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `rgba(212,168,67,0.12)` }}>
                    <Calculator className="w-5 h-5" style={{ color: GOLD }} />
                  </div>
                  Scale Your Wealth
                </h2>
                <p className="text-base leading-relaxed" style={{ color: TEXT_SOFT }}>
                  Calculate your potential monthly passive income from your Level 1 downline overrides ({((commissionPool * networkPoolFactor * tier1Factor) * 100).toFixed(4)}%). Incentive rates are set per property.
                </p>
              </div>

              <div className="space-y-8">
                {[
                  {
                    label: 'Advisors Recruited',
                    badge: `${recruits} Advisors`,
                    input: <input type="range" min="1" max="100" value={recruits}
                      onChange={e => setRecruits(parseInt(e.target.value))}
                      className="w-full cursor-pointer"
                      style={{
                        accentColor: GOLD,
                        height: '6px',
                        borderRadius: '9999px',
                        appearance: 'none' as any,
                        background: `linear-gradient(to right, ${GOLD} 0%, ${GOLD} ${recruits}%, rgba(180,130,30,0.18) ${recruits}%, rgba(180,130,30,0.18) 100%)`,
                      }} />,
                  },
                  {
                    label: 'Avg. Deal Volume / Advisor',
                    badge: `₹${(avgDealSize / 100000).toFixed(1)}L Monthly`,
                    input: <input type="range" min="1000000" max="50000000" step="500000" value={avgDealSize}
                      onChange={e => setAvgDealSize(parseInt(e.target.value))}
                      className="w-full cursor-pointer"
                      style={{
                        accentColor: GOLD,
                        height: '6px',
                        borderRadius: '9999px',
                        appearance: 'none' as any,
                        background: `linear-gradient(to right, ${GOLD} 0%, ${GOLD} ${((avgDealSize - 1000000) / (50000000 - 1000000)) * 100}%, rgba(180,130,30,0.18) ${((avgDealSize - 1000000) / (50000000 - 1000000)) * 100}%, rgba(180,130,30,0.18) 100%)`,
                      }} />,
                  }
                ].map((row, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-3">
                      <label className="text-xs font-bold tracking-widest uppercase" style={{ color: TEXT_SOFT }}>{row.label}</label>
                      <span className="text-xs font-bold px-3 py-1 rounded-full border"
                        style={{ color: GOLD, borderColor: `rgba(180,130,30,0.25)`, background: `rgba(212,168,67,0.08)` }}>
                        {row.badge}
                      </span>
                    </div>
                    {row.input}
                  </div>
                ))}
              </div>
            </div>

            {/* Result card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-full md:w-auto md:min-w-[300px] p-10 sm:p-12 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden"
              style={{
                background: `linear-gradient(145deg, ${GOLD_LIGHT} 0%, ${GOLD} 55%, #A07208 100%)`,
                boxShadow: `0 20px 50px rgba(180,130,30,0.40)`
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: 'rgba(255,255,255,0.08)', filter: 'blur(20px)' }} />
              <span className="text-xs tracking-widest uppercase font-black mb-4 flex items-center gap-2 relative z-10"
                style={{ color: 'rgba(255,255,255,0.75)' }}>
                <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                Projected Monthly Passive
              </span>
              <motion.div
                key={passiveIncome}
                initial={{ opacity: 0.5, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-4xl sm:text-5xl font-extrabold mb-8 relative z-10"
                style={{ color: '#fff' }}
              >
                ₹{passiveIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </motion.div>
              <div className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-full font-bold relative z-10"
                style={{ background: 'rgba(255,255,255,0.22)', color: '#fff' }}>
                <TrendingUp className="w-4 h-4" />
                Automated Network Payout
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── Feature Cards ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-24 sm:mt-32 max-w-7xl w-full px-4"
      >
        {[
          { icon: Building2, title: config.landing.feature1Title, desc: config.landing.feature1Desc, hue: '212,168,67' },
          { icon: Shield,    title: config.landing.feature2Title, desc: config.landing.feature2Desc, hue: '16,185,129' },
          { icon: Wallet,    title: config.landing.feature3Title, desc: config.landing.feature3Desc, hue: '180,130,30'  },
          { icon: TrendingUp,title: config.landing.feature4Title, desc: config.landing.feature4Desc, hue: '245,158,11' },
        ].map((f, i) => (
          <motion.div
            key={i}
            variants={staggerItem}
            className="flex flex-col items-center text-center p-8 rounded-3xl border group cursor-default transition-all duration-300"
            style={{ background: GOLD_CARD, borderColor: BORDER, boxShadow: `0 4px 20px rgba(180,130,30,0.06)` }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = `0 12px 40px rgba(180,130,30,0.14)`; el.style.borderColor = `rgba(${f.hue},0.35)`; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = `0 4px 20px rgba(180,130,30,0.06)`; el.style.borderColor = BORDER; }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300"
              style={{ background: `rgba(${f.hue},0.10)` }}>
              <f.icon className="w-7 h-7" style={{ color: `rgba(${f.hue},1)` }} />
            </div>
            <h3 className="font-extrabold text-lg mb-3 tracking-tight" style={{ color: TEXT_DARK }}>{f.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: TEXT_SOFT }}>{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Why Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-5xl px-4 mt-24 sm:mt-32"
      >
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4" style={{ color: TEXT_DARK }}>
            Why <span style={{
              background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_MID} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Elite Advisors</span> Choose Us
          </h2>
          <p className="text-base" style={{ color: TEXT_SOFT }}>Everything you need to build a high-performance real estate wealth engine.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: Star,    title: 'Curated Inventory',   desc: 'Access exclusive off-market properties unavailable anywhere else.', num: '01' },
            { icon: Zap,     title: 'Instant Settlements', desc: 'Incentives calculated and distributed automatically after deal closure.', num: '02' },
            { icon: Users,   title: '5-Level Network',     desc: 'Earn passive income across 5 levels of your downline network.', num: '03' },
          ].map((item, i) => (
            <div key={i} className="relative p-8 rounded-3xl border overflow-hidden"
              style={{ background: GOLD_CARD, borderColor: BORDER, boxShadow: `0 4px 20px rgba(180,130,30,0.06)` }}>
              <div className="absolute top-5 right-5 text-5xl font-black" style={{ color: `rgba(180,130,30,0.06)` }}>{item.num}</div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `rgba(212,168,67,0.10)` }}>
                <item.icon className="w-6 h-6" style={{ color: GOLD }} />
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: TEXT_DARK }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: TEXT_SOFT }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── CTA Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-4xl px-4 mt-24 sm:mt-32 mb-16"
      >
        <div className="relative rounded-[2.5rem] p-10 sm:p-16 text-center overflow-hidden border"
          style={{
            background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 55%, #A07208 100%)`,
            borderColor: `rgba(255,255,255,0.15)`,
            boxShadow: `0 24px 60px rgba(180,130,30,0.38)`
          }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.07)', filter: 'blur(30px)' }} />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.05)', filter: 'blur(30px)' }} />

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 relative z-10" style={{ color: '#fff' }}>
            {config.landing.ctaTitle}
          </h2>
          <p className="text-base mb-10 relative z-10" style={{ color: 'rgba(255,255,255,0.78)' }}>
            {config.landing.ctaSubtitle}
          </p>
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="group inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg transition-all relative z-10"
            style={{ background: '#fff', color: GOLD, boxShadow: `0 8px 24px rgba(0,0,0,0.15)` }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.22)`)}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.15)`)}
          >
            Request Access
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>

      {/* ── Marquee ── */}
      <div className="fixed bottom-0 left-0 w-full overflow-hidden border-t py-3 z-30"
        style={{
          background: 'rgba(253,248,237,0.92)',
          backdropFilter: 'blur(16px)',
          borderColor: BORDER,
          boxShadow: `0 -4px 20px rgba(180,130,30,0.07)`
        }}>
        <div className="flex whitespace-nowrap gap-8 text-sm font-bold"
          style={{ transform: `translateX(${marqueePosition}%)`, color: TEXT_MID }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <span key={idx} className="flex-shrink-0 flex items-center gap-2">
              {item}
              <span className="opacity-30 mx-4" style={{ color: GOLD }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Apply Modal ── */}
      <AnimatePresence>
        {isApplyModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(26,18,0,0.55)', backdropFilter: 'blur(8px)' }}
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 24 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              className="relative rounded-[2rem] p-8 sm:p-10 max-w-md w-full border"
              style={{
                background: '#FFFDF5',
                borderColor: BORDER,
                boxShadow: `0 32px 80px rgba(180,130,30,0.25)`
              }}
            >
              <button onClick={closeModal}
                className="absolute top-5 right-5 p-2 rounded-full transition-all"
                style={{ background: `rgba(212,168,67,0.10)`, color: TEXT_SOFT }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GOLD; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_SOFT; }}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: `rgba(212,168,67,0.12)`, color: GOLD }}>
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-extrabold mb-2" style={{ color: TEXT_DARK }}>Request Access</h3>
                <p className="text-sm leading-relaxed" style={{ color: TEXT_SOFT }}>
                  Join the exclusive {config.branding.appName} network. We'll review your application within 24 hours.
                </p>
              </div>

              {submitState === 'success' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.22)' }}>
                    <svg className="w-8 h-8" style={{ color: '#10b981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-extrabold mb-2" style={{ color: TEXT_DARK }}>Application Submitted!</h4>
                  <p className="text-sm" style={{ color: TEXT_SOFT }}>We'll review your request and get back to you within 24 hours.</p>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={async e => {
                  e.preventDefault();
                  if (!formData.fullName || !formData.email || !formData.phone || !formData.experience) return;
                  setSubmitState('loading');
                  try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/access-requests`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(formData),
                    });
                    if (!res.ok) throw new Error('Failed');
                    setSubmitState('success');
                  } catch { setSubmitState('error'); }
                }}>
                  {[
                    { label: 'Full Name',     key: 'fullName', type: 'text',  placeholder: 'James Bond' },
                    { label: 'Email Address', key: 'email',    type: 'email', placeholder: 'james@secret.com' },
                    { label: 'Phone Number',  key: 'phone',    type: 'tel',   placeholder: '+91 98765 43210' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2 ml-1" style={{ color: TEXT_SOFT }}>
                        {field.label}
                      </label>
                      <input
                        required type={field.type}
                        value={(formData as any)[field.key]}
                        onChange={e => setFormData(f => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full rounded-xl px-4 py-3 font-medium outline-none transition-all"
                        style={{ background: GOLD_BG, border: `1px solid ${BORDER}`, color: TEXT_DARK }}
                        onFocus={e => { e.currentTarget.style.borderColor = `rgba(180,130,30,0.55)`; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(212,168,67,0.12)`; }}
                        onBlur={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 ml-1" style={{ color: TEXT_SOFT }}>
                      Real Estate Experience
                    </label>
                    <select
                      required value={formData.experience}
                      onChange={e => setFormData(f => ({ ...f, experience: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 font-medium outline-none transition-all appearance-none cursor-pointer"
                      style={{ background: GOLD_BG, border: `1px solid ${BORDER}`, color: formData.experience ? TEXT_DARK : TEXT_SOFT }}
                      onFocus={e => { e.currentTarget.style.borderColor = `rgba(180,130,30,0.55)`; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(212,168,67,0.12)`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <option value="">Select experience…</option>
                      <option value="0-2 Years">0–2 Years</option>
                      <option value="3-5 Years">3–5 Years</option>
                      <option value="5+ Years">5+ Years (Executive / Advisor)</option>
                    </select>
                  </div>

                  {submitState === 'error' && (
                    <p className="text-center text-xs font-semibold" style={{ color: '#dc2626' }}>
                      Something went wrong. Please try again.
                    </p>
                  )}

                  <div className="pt-3">
                    <button
                      type="submit" disabled={submitState === 'loading'}
                      className="group w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-60"
                      style={{
                        background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD}, #A07208)`,
                        color: '#fff',
                        boxShadow: `0 6px 20px rgba(180,130,30,0.32)`
                      }}
                    >
                      {submitState === 'loading' ? 'Submitting…' : (
                        <>
                          Submit Application
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
