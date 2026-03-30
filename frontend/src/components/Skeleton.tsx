// Reusable skeleton loading primitives — gold wave shimmer theme

function Bone({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

// ── Primitives ────────────────────────────────────────────────────────────────

export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Bone key={i} className="h-4 rounded-lg" style={{ width: i === lines - 1 && lines > 1 ? '65%' : '100%' }} />
      ))}
    </div>
  );
}

export function SkeletonTitle({ className = '' }: { className?: string }) {
  return <Bone className={`h-7 rounded-xl ${className}`} style={{ width: '55%' }} />;
}

export function SkeletonBadge({ className = '' }: { className?: string }) {
  return <Bone className={`h-6 w-20 rounded-full ${className}`} />;
}

export function SkeletonAvatar({ size = 10 }: { size?: number }) {
  return <Bone className={`rounded-xl flex-shrink-0`} style={{ width: `${size * 4}px`, height: `${size * 4}px` }} />;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
export function SkeletonStatCard() {
  return (
    <div className="glass-panel rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Bone className="h-4 w-28 rounded-lg" />
        <Bone className="h-10 w-10 rounded-2xl" />
      </div>
      <Bone className="h-9 w-36 rounded-xl" />
      <Bone className="h-3 w-24 rounded-lg" />
    </div>
  );
}

// ── Property / listing card ───────────────────────────────────────────────────
export function SkeletonPropertyCard() {
  return (
    <div className="glass-panel rounded-3xl overflow-hidden">
      <Bone className="h-44 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Bone className="h-6 w-3/4 rounded-xl" />
        <Bone className="h-4 w-1/2 rounded-lg" />
        <div className="flex gap-2 pt-1">
          <Bone className="h-6 w-16 rounded-full" />
          <Bone className="h-6 w-16 rounded-full" />
          <Bone className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <Bone className="h-7 w-32 rounded-xl" />
          <Bone className="h-9 w-24 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────────
export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  const widths = ['w-32', 'w-44', 'w-24', 'w-28', 'w-20', 'w-16'];
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
      <Bone className="h-9 w-9 rounded-xl flex-shrink-0" />
      {Array.from({ length: cols - 1 }).map((_, i) => (
        <Bone key={i} className={`h-4 ${widths[i % widths.length]} rounded-lg flex-1`} />
      ))}
    </div>
  );
}

// ── List item (deals, transactions, visits) ───────────────────────────────────
export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl">
      <Bone className="h-12 w-12 rounded-2xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Bone className="h-4 w-40 rounded-lg" />
        <Bone className="h-3 w-24 rounded-md" />
      </div>
      <div className="space-y-2 text-right">
        <Bone className="h-5 w-24 rounded-lg ml-auto" />
        <Bone className="h-5 w-16 rounded-full ml-auto" />
      </div>
    </div>
  );
}

// ── Chat contact item ─────────────────────────────────────────────────────────
export function SkeletonChatContact() {
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-2xl">
      <Bone className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Bone className="h-3.5 w-28 rounded-md" />
        <Bone className="h-3 w-20 rounded-md" />
      </div>
    </div>
  );
}

// ── Network node card ─────────────────────────────────────────────────────────
export function SkeletonNetworkNode() {
  return (
    <div className="glass-panel rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Bone className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <Bone className="h-4 w-28 rounded-md" />
          <Bone className="h-3 w-16 rounded-md" />
        </div>
      </div>
      <div className="flex gap-2">
        <Bone className="h-6 w-14 rounded-full" />
        <Bone className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

// ── Wallet transaction ────────────────────────────────────────────────────────
export function SkeletonTransaction() {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <Bone className="h-10 w-10 rounded-2xl flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Bone className="h-4 w-32 rounded-md" />
        <Bone className="h-3 w-20 rounded-md" />
      </div>
      <Bone className="h-5 w-24 rounded-lg" />
    </div>
  );
}

// ── Page-level composite skeletons ────────────────────────────────────────────

/** Stats row (4 cards) + content area */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <SkeletonStatCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-panel rounded-3xl p-5 space-y-3">
          <Bone className="h-6 w-40 rounded-xl mb-4" />
          {[0,1,2,3,4].map(i => <SkeletonListItem key={i} />)}
        </div>
        <div className="glass-panel rounded-3xl p-5 space-y-3">
          <Bone className="h-6 w-32 rounded-xl mb-4" />
          {[0,1,2,3].map(i => <SkeletonNetworkNode key={i} />)}
        </div>
      </div>
    </div>
  );
}

export function SkeletonPropertiesGrid() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex gap-3">
        <Bone className="h-11 flex-1 rounded-2xl" />
        <Bone className="h-11 w-24 rounded-2xl" />
        <Bone className="h-11 w-24 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0,1,2,3,4,5].map(i => <SkeletonPropertyCard key={i} />)}
      </div>
    </div>
  );
}

export function SkeletonDeals() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <SkeletonStatCard key={i} />)}
      </div>
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="px-5 py-4 border-b flex gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <Bone className="h-10 flex-1 rounded-2xl" />
          <Bone className="h-10 w-28 rounded-2xl" />
        </div>
        {[0,1,2,3,4,5].map(i => <SkeletonTableRow key={i} cols={5} />)}
      </div>
    </div>
  );
}

export function SkeletonWallet() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="glass-panel rounded-3xl p-8 flex flex-col items-center gap-4">
        <Bone className="h-5 w-32 rounded-lg" />
        <Bone className="h-14 w-52 rounded-2xl" />
        <div className="flex gap-3 mt-2">
          <Bone className="h-11 w-36 rounded-2xl" />
          <Bone className="h-11 w-36 rounded-2xl" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <SkeletonStatCard key={i} />)}
      </div>
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <Bone className="h-6 w-40 rounded-xl" />
        </div>
        {[0,1,2,3,4].map(i => <SkeletonTransaction key={i} />)}
      </div>
    </div>
  );
}

export function SkeletonVisits() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <SkeletonStatCard key={i} />)}
      </div>
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="px-5 py-4 border-b flex gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <Bone className="h-10 flex-1 rounded-2xl" />
          <Bone className="h-10 w-28 rounded-2xl" />
        </div>
        {[0,1,2,3,4,5].map(i => <SkeletonTableRow key={i} cols={6} />)}
      </div>
    </div>
  );
}

export function SkeletonLeads() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex gap-3 mb-2">
        <Bone className="h-11 flex-1 rounded-2xl" />
        <Bone className="h-11 w-28 rounded-2xl" />
      </div>
      <div className="glass-panel rounded-3xl overflow-hidden">
        {[0,1,2,3,4,5,6].map(i => <SkeletonTableRow key={i} cols={5} />)}
      </div>
    </div>
  );
}

export function SkeletonNetwork() {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="glass-panel rounded-3xl p-5 space-y-4">
        <Bone className="h-6 w-36 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[0,1,2].map(i => <SkeletonStatCard key={i} />)}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0,1,2,3,4,5].map(i => <SkeletonNetworkNode key={i} />)}
      </div>
    </div>
  );
}

export function SkeletonChat() {
  return (
    <div className="flex h-full gap-0 animate-in fade-in duration-300">
      {/* Contacts sidebar */}
      <div className="w-72 flex-shrink-0 border-r space-y-1 p-3" style={{ borderColor: 'var(--border-subtle)' }}>
        <Bone className="h-10 w-full rounded-2xl mb-3" />
        {[0,1,2,3,4,5,6].map(i => <SkeletonChatContact key={i} />)}
      </div>
      {/* Message area */}
      <div className="flex-1 flex flex-col p-5 gap-4">
        <div className="flex-1 space-y-4">
          {[0,1,2,3].map(i => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
              <Bone className="h-8 w-8 rounded-full flex-shrink-0" />
              <Bone className={`h-12 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
            </div>
          ))}
        </div>
        <Bone className="h-14 w-full rounded-2xl" />
      </div>
    </div>
  );
}
