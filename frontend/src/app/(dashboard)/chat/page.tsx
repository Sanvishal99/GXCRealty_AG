"use client";
import { useAppConfig } from '@/context/AppConfigContext';

const CONTACTS = [
  { name: 'Alex Kumar', role: 'Upline', status: 'Online', initials: 'AK', grad: 'from-indigo-500 to-purple-600', statusColor: 'bg-emerald-500', unread: 2 },
  { name: 'Sarah Lee', role: 'Tier 1', status: 'Online', initials: 'SL', grad: 'from-pink-500 to-rose-500', statusColor: 'bg-emerald-500', unread: 0 },
  { name: 'Mike Patel', role: 'Tier 1', status: 'Away', initials: 'MP', grad: 'from-amber-500 to-orange-500', statusColor: 'bg-amber-400', unread: 0 },
  { name: 'Elite Team', role: 'Group Chat', status: '', initials: 'ET', grad: 'from-emerald-500 to-teal-500', statusColor: '', unread: 5 },
  { name: 'David Chen', role: 'Tier 2', status: 'Offline', initials: 'DC', grad: 'from-cyan-500 to-blue-500', statusColor: 'bg-zinc-400', unread: 0 },
];

export default function ChatPage() {
  const { config } = useAppConfig();
  return (
    <div className="h-screen w-full flex flex-col p-4 md:p-6 pb-0 overflow-hidden relative z-10 text-[var(--text-primary)]">
      {/* Ambient glow */}
      <div className="fixed top-1/2 right-0 w-[400px] h-[400px] glow-orb-1 rounded-full blur-[140px] pointer-events-none opacity-30 translate-x-1/2" />
      <div className="fixed bottom-0 left-1/3 w-[300px] h-[300px] glow-orb-3 rounded-full blur-[100px] pointer-events-none opacity-20" />

      {/* Header */}
      <header className="mb-5 shrink-0">
        <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full glass-panel">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Network Secure</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {config.chat.pageTitle.split(' ').slice(0,-1).join(' ')} <span className="text-gradient">{config.chat.pageTitle.split(' ').slice(-1)}</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">{config.chat.pageSubtitle}</p>
      </header>

      <div className="flex-1 glass-panel rounded-t-3xl border-b-0 overflow-hidden flex flex-col md:flex-row">
        {/* Contacts Sidebar */}
        <div className="w-full md:w-80 border-r border-[var(--border-subtle)] flex flex-col bg-[var(--glass-bg)]">
          {/* Search */}
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search agents..." className="w-full theme-input rounded-xl pl-10 pr-4 py-2.5 text-sm" />
            </div>
          </div>

          {/* Contact List */}
          <div className="overflow-y-auto flex-1">
            <div className="px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-2 mb-2">Conversations</p>
              {CONTACTS.map((c, i) => (
                <div key={i}
                  className={`p-3 flex items-center gap-3 cursor-pointer rounded-2xl transition-all mb-1 ${
                    i === 1 ? 'glass-panel-glow grad-indigo border-[var(--border-medium)]' : 'hover:bg-[var(--glass-bg-hover)]'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${c.grad} flex items-center justify-center font-bold text-sm text-white shadow-lg`}>
                      {c.initials}
                    </div>
                    {c.statusColor && (
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${c.statusColor} border-2 border-[var(--glass-bg)]`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate">{c.name}</h4>
                      {c.unread > 0 && (
                        <span className="ml-1 w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">{c.role} · {c.status || 'Offline'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--bg-primary)' }}>
          {/* Chat Header */}
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center gap-3 bg-[var(--bg-elevated)] shrink-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex-shrink-0 flex items-center justify-center font-bold text-sm text-white shadow-lg">
                SL
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--bg-elevated)]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[var(--text-primary)] text-sm">Sarah Lee</h3>
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Online — Tier 1 Agent
              </p>
            </div>
            <div className="flex gap-2">
              {['M5 3a2 2 0 00-2 2v3.28...', 'M3 5a2 2 0 012-2h3.28...'].slice(0,1).map((_, j) => (
                <button key={j} className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center text-[var(--text-secondary)] hover:text-indigo-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
              ))}
              <button className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center text-[var(--text-secondary)] hover:text-indigo-500 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Date divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--border-subtle)]" />
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Today</span>
              <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            </div>

            {/* Received message */}
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-auto">SL</div>
              <div>
                <div className="glass-panel rounded-2xl rounded-tl-sm p-4 border-[var(--border-subtle)]">
                  <p className="text-sm text-[var(--text-primary)]">Hello! Have you seen the new penthouse on 5th avenue? My client is very interested. 🏙️</p>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] mt-1.5 ml-1 block">10:42 AM</span>
              </div>
            </div>

            {/* Sent message */}
            <div className="flex gap-3 max-w-[80%] ml-auto flex-row-reverse">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-auto">ME</div>
              <div>
                <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/10 backdrop-blur-md rounded-2xl rounded-tr-sm p-4 border border-indigo-500/20">
                  <p className="text-sm text-[var(--text-primary)]">Yes! I have the keys. We can schedule a visit for tomorrow if you'd like. ✅</p>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] mt-1.5 block text-right mr-1">10:45 AM</span>
              </div>
            </div>

            {/* Another received */}
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-auto">SL</div>
              <div>
                <div className="glass-panel rounded-2xl rounded-tl-sm p-4">
                  <p className="text-sm text-[var(--text-primary)]">Perfect! My client is free at 10 AM. Let's lock it in! 🙌</p>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] mt-1.5 ml-1 block">10:47 AM</span>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-[var(--border-subtle)] shrink-0 bg-[var(--bg-elevated)]">
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-[var(--text-secondary)] hover:text-purple-500 hover:border-purple-500/30 transition-all flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <input type="text" placeholder="Type your message..."
                className="flex-1 theme-input rounded-2xl px-5 py-3 text-sm focus:border-indigo-500/50 transition-all"
              />
              <button onClick={() => alert("Message sent!")}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all shrink-0">
                <svg className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
