"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppConfig } from '@/context/AppConfigContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { chat as chatApi } from '@/lib/api';
import { getToken } from '@/lib/api';
import { Send, Search, MessageSquare, Circle, ArrowLeft } from 'lucide-react';

interface Contact {
  user: { id: string; email: string; role: string };
  lastMessage: { content: string; createdAt: string } | null;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

function getInitials(email: string) {
  return email.split('@')[0].slice(0, 2).toUpperCase();
}

function getGradient(role: string) {
  if (role === 'ADMIN') return 'from-rose-500 to-pink-500';
  if (role === 'COMPANY') return 'from-indigo-500 to-purple-600';
  return 'from-emerald-500 to-teal-500';
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';

export default function ChatPage() {
  const { config } = useAppConfig();
  const { profile } = useUserProfile();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect socket
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const s = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    s.on('connect', () => console.log('Socket connected'));
    s.on('newMessage', (msg: Message) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    s.on('messageSent', (msg: Message) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  // Load contacts
  useEffect(() => {
    chatApi.contacts()
      .then(setContacts)
      .catch(() => setContacts([]))
      .finally(() => setIsLoadingContacts(false));
  }, []);

  // Load message history when contact changes
  useEffect(() => {
    if (!selectedContact) return;
    setIsLoadingMessages(true);
    chatApi.history(selectedContact.user.id)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setIsLoadingMessages(false));
  }, [selectedContact]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !selectedContact || !socket) return;
    socket.emit('sendMessage', { receiverId: selectedContact.user.id, content: input.trim() });
    setInput('');
  }, [input, selectedContact, socket]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const filteredContacts = contacts.filter(c =>
    c.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  for (const msg of messages) {
    const date = formatDate(msg.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) last.messages.push(msg);
    else groupedMessages.push({ date, messages: [msg] });
  }

  const [mobileShowChat, setMobileShowChat] = useState(false);

  return (
    <div className="h-screen w-full flex flex-col p-4 md:p-6 pb-0 overflow-hidden relative z-10 text-[var(--text-primary)]">
      <div className="fixed top-1/2 right-0 w-[400px] h-[400px] glow-orb-1 rounded-full blur-[140px] pointer-events-none opacity-30 translate-x-1/2" />

      {/* Header */}
      <header className="mb-5 shrink-0">
        <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full glass-panel">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Network Secure</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {config.chat.pageTitle.split(' ').slice(0, -1).join(' ')}{' '}
          <span className="text-gradient">{config.chat.pageTitle.split(' ').slice(-1)}</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">{config.chat.pageSubtitle}</p>
      </header>

      <div className="flex-1 glass-panel rounded-t-3xl border-b-0 overflow-hidden flex flex-col md:flex-row">
        {/* Contacts Sidebar */}
        <div className={`${mobileShowChat ? 'hidden' : 'flex'} md:flex w-full md:w-80 border-r border-[var(--border-subtle)] flex-col bg-[var(--glass-bg)]`}>
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search advisors..." className="w-full theme-input rounded-xl pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            <div className="px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-2 mb-2">Network</p>

              {isLoadingContacts ? (
                <div className="space-y-2 p-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                      <div className="w-10 h-10 rounded-2xl bg-white/10 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-white/10 rounded w-3/4" />
                        <div className="h-2 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredContacts.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-8 opacity-50">No contacts found</p>
              ) : (
                filteredContacts.map((c) => {
                  const isActive = selectedContact?.user.id === c.user.id;
                  return (
                    <div key={c.user.id} onClick={() => { setSelectedContact(c); setMobileShowChat(true); }}
                      className={`p-3 flex items-center gap-3 cursor-pointer rounded-2xl transition-all mb-1 ${
                        isActive ? 'glass-panel border border-indigo-500/30 bg-indigo-500/10' : 'hover:bg-[var(--glass-bg-hover)]'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${getGradient(c.user.role)} flex items-center justify-center font-bold text-sm text-white shadow-lg`}>
                          {getInitials(c.user.email)}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--glass-bg)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate">{c.user.email.split('@')[0]}</h4>
                        <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                          {c.lastMessage ? c.lastMessage.content : c.user.role}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${mobileShowChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-w-0`} style={{ background: 'var(--bg-primary)' }}>
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4 opacity-40">
              <MessageSquare className="w-16 h-16" />
              <p className="font-semibold">Select a contact to start chatting</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[var(--border-subtle)] flex items-center gap-3 bg-[var(--bg-elevated)] shrink-0">
                <button onClick={() => setMobileShowChat(false)} className="md:hidden p-1.5 rounded-xl hover:bg-[var(--glass-bg-hover)] transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${getGradient(selectedContact.user.role)} flex items-center justify-center font-bold text-sm text-white shadow-lg`}>
                    {getInitials(selectedContact.user.email)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--bg-elevated)]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{selectedContact.user.email.split('@')[0]}</h3>
                  <p className="text-xs text-emerald-500 flex items-center gap-1">
                    <Circle className="w-1.5 h-1.5 fill-emerald-500" /> Online · {selectedContact.user.role}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full opacity-50">Loading messages…</div>
                ) : groupedMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full flex-col gap-2 opacity-40">
                    <MessageSquare className="w-10 h-10" />
                    <p className="text-sm">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  groupedMessages.map(group => (
                    <div key={group.date}>
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                        <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">{group.date}</span>
                        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                      </div>
                      {group.messages.map(msg => {
                        const isMine = msg.senderId === profile.id;
                        return (
                          <div key={msg.id} className={`flex gap-3 max-w-[80%] mb-4 ${isMine ? 'ml-auto flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${isMine ? 'from-indigo-500 to-purple-600' : getGradient(selectedContact.user.role)} flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-auto`}>
                              {isMine ? getInitials(profile.email) : getInitials(selectedContact.user.email)}
                            </div>
                            <div>
                              <div className={isMine
                                ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/10 backdrop-blur-md rounded-2xl rounded-tr-sm p-4 border border-indigo-500/20'
                                : 'glass-panel rounded-2xl rounded-tl-sm p-4 border-[var(--border-subtle)]'
                              }>
                                <p className="text-sm text-[var(--text-primary)]">{msg.content}</p>
                              </div>
                              <span className={`text-[10px] text-[var(--text-muted)] mt-1.5 block ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-[var(--border-subtle)] shrink-0 bg-[var(--bg-elevated)]">
                <div className="flex items-center gap-3">
                  <input
                    type="text" value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message… (Enter to send)"
                    className="flex-1 theme-input rounded-2xl px-5 py-3 text-sm focus:border-indigo-500/50 transition-all"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
