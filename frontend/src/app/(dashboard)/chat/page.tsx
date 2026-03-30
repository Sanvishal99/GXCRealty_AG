"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import dynamic from 'next/dynamic';
import { useAppConfig } from '@/context/AppConfigContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useNotifications } from '@/context/NotificationContext';
import { chat as chatApi } from '@/lib/api';
import { SkeletonChatContact } from '@/components/Skeleton';
import { getToken } from '@/lib/api';
import { Send, Search, MessageSquare, Circle, ArrowLeft, Building2, AtSign, Users, Smile } from 'lucide-react';

// Lazy-load emoji picker (heavy bundle — only loaded when user clicks the button)
const EmojiPicker = dynamic(
  () => import('@emoji-mart/react').then(m => ({ default: m.default ?? (m as any) })),
  { ssr: false, loading: () => null }
);

interface Contact {
  user: { id: string; email: string; role: string; phone?: string };
  lastMessage: { content: string; createdAt: string; mentions?: string[] } | null;
  context: { propertyTitle: string; propertyId: string; visitId: string } | null;
  connectionType: 'network' | 'visit' | null;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  mentions?: string[];
  sender?: { id: string; email: string; role: string };
}

function getInitials(email: string) {
  return email.split('@')[0].slice(0, 2).toUpperCase();
}

function getGradient(role: string) {
  if (role === 'ADMIN') return 'from-rose-500 to-pink-500';
  if (role === 'COMPANY') return 'from-indigo-500 to-purple-600';
  return 'from-emerald-500 to-teal-500';
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function renderContent(content: string, myEmail: string) {
  // Split on @mention patterns and highlight them
  const parts = content.split(/(@[\w.+-]+(?:@[\w.-]+\.\w+)?)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (!part.startsWith('@')) return <span key={i}>{part}</span>;
        const handle = part.slice(1).toLowerCase();
        const isMe = myEmail.toLowerCase() === handle || myEmail.toLowerCase().startsWith(handle + '@');
        return (
          <span
            key={i}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-bold mx-0.5 ${
              isMe
                ? 'bg-indigo-500/30 text-indigo-200 ring-1 ring-indigo-400/40'
                : 'bg-white/15 text-white/90'
            }`}
          >
            {part}
          </span>
        );
      })}
    </>
  );
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';

export default function ChatPage() {
  const { config } = useAppConfig();
  const { profile } = useUserProfile();
  const { addNotification } = useNotifications();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // ── Socket setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const s = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });

    s.on('connect', () => s.emit('getOnlineUsers'));

    s.on('onlineUsers', (ids: string[]) => setOnlineUsers(new Set(ids)));
    s.on('userOnline',  ({ userId }: { userId: string }) =>
      setOnlineUsers(prev => new Set([...prev, userId])));
    s.on('userOffline', ({ userId }: { userId: string }) =>
      setOnlineUsers(prev => { const n = new Set(prev); n.delete(userId); return n; }));

    s.on('newMessage', (msg: Message) => {
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
      setContacts(prev => prev.map(c =>
        c.user.id === msg.senderId ? { ...c, lastMessage: msg } : c
      ));
    });

    s.on('messageSent', (msg: Message) => {
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
      // Update last message for selected contact
      setContacts(prev => prev.map(c =>
        c.user.id === msg.receiverId ? { ...c, lastMessage: msg } : c
      ));
    });

    s.on('mentionNotification', (data: { fromEmail: string; content: string }) => {
      addNotification({
        type: 'info',
        title: `@mention from ${data.fromEmail.split('@')[0]}`,
        message: data.content.length > 80 ? data.content.slice(0, 80) + '…' : data.content,
        category: 'system',
      });
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  // ── Close emoji picker on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmojiPicker]);

  const insertEmoji = (emoji: { native: string }) => {
    const el = inputRef.current;
    if (!el) { setInput(prev => prev + emoji.native); return; }
    const start = el.selectionStart ?? input.length;
    const end   = el.selectionEnd   ?? input.length;
    const next  = input.slice(0, start) + emoji.native + input.slice(end);
    setInput(next);
    // Restore caret after the inserted emoji
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.native.length;
      el.setSelectionRange(pos, pos);
    });
  };

  // ── Load contacts ───────────────────────────────────────────────────────────
  useEffect(() => {
    chatApi.contacts()
      .then(data => setContacts(data as Contact[]))
      .catch(() => setContacts([]))
      .finally(() => setIsLoadingContacts(false));
  }, []);

  // ── Load message history ────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedContact) return;
    setIsLoadingMessages(true);
    chatApi.history(selectedContact.user.id)
      .then(data => setMessages(data as Message[]))
      .catch(() => setMessages([]))
      .finally(() => setIsLoadingMessages(false));
  }, [selectedContact]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── @mention detection ──────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    const lastAt = val.lastIndexOf('@');
    const charBefore = lastAt > 0 ? val[lastAt - 1] : ' ';
    if (lastAt !== -1 && (charBefore === ' ' || lastAt === 0)) {
      const query = val.slice(lastAt + 1).toLowerCase();
      // Only show if no space after @
      if (!query.includes(' ')) {
        setMentionQuery(query);
        setShowMentionMenu(true);
        return;
      }
    }
    setShowMentionMenu(false);
  };

  const insertMention = (email: string) => {
    const lastAt = input.lastIndexOf('@');
    setInput(input.slice(0, lastAt) + '@' + email + ' ');
    setShowMentionMenu(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const mentionSuggestions = contacts.filter(c =>
    c.user.email.toLowerCase().includes(mentionQuery) ||
    c.user.email.split('@')[0].toLowerCase().includes(mentionQuery)
  );

  // ── Send ────────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    if (!input.trim() || !selectedContact || !socket) return;
    socket.emit('sendMessage', { receiverId: selectedContact.user.id, content: input.trim() });
    setInput('');
    setShowMentionMenu(false);
    setShowEmojiPicker(false);
  }, [input, selectedContact, socket]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentionMenu && e.key === 'Escape') { setShowMentionMenu(false); return; }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const filteredContacts = contacts.filter(c =>
    c.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  for (const msg of messages) {
    const date = formatDate(msg.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) last.messages.push(msg);
    else groupedMessages.push({ date, messages: [msg] });
  }

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col p-4 md:p-6 pb-0 overflow-hidden relative z-10 text-[var(--text-primary)]">
      <div className="fixed top-1/2 right-0 w-[400px] h-[400px] glow-orb-1 rounded-full blur-[140px] pointer-events-none opacity-30 translate-x-1/2" />

      {/* Header */}
      <header className="mb-5 shrink-0">
        <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full glass-panel">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Advisor Network Chat</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {config.chat.pageTitle.split(' ').slice(0, -1).join(' ')}{' '}
          <span className="text-gradient">{config.chat.pageTitle.split(' ').slice(-1)}</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">{config.chat.pageSubtitle}</p>
      </header>

      <div className="flex-1 glass-panel rounded-t-3xl border-b-0 overflow-hidden flex flex-col md:flex-row">

        {/* ── Contacts Sidebar ─────────────────────────────────────────────── */}
        <div className={`${mobileShowChat ? 'hidden' : 'flex'} md:flex w-full md:w-80 border-r border-[var(--border-subtle)] flex-col`}
          style={{ background: 'var(--glass-bg)' }}>

          <div className="p-4 border-b border-[var(--border-subtle)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search contacts…" className="w-full theme-input rounded-xl pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {isLoadingContacts ? (
              <div className="space-y-1 p-3">
                {[0,1,2,3,4,5].map(i => <SkeletonChatContact key={i} />)}
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 opacity-20" />
                </div>
                <p className="text-sm font-bold text-[var(--text-secondary)] mb-1">No connections yet</p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Recruit team members or get a visit approved to start chatting
                </p>
              </div>
            ) : (() => {
              const networkContacts = filteredContacts.filter(c => c.connectionType === 'network');
              const visitContacts   = filteredContacts.filter(c => c.connectionType === 'visit');
              const otherContacts   = filteredContacts.filter(c => !c.connectionType);

              const renderContact = (c: Contact) => {
                const isActive = selectedContact?.user.id === c.user.id;
                const isOnline = onlineUsers.has(c.user.id);
                return (
                  <div
                    key={c.user.id}
                    onClick={() => { setSelectedContact(c); setMobileShowChat(true); }}
                    className={`p-3 flex items-center gap-3 cursor-pointer rounded-2xl transition-all mb-1 ${
                      isActive
                        ? 'bg-indigo-500/10 border border-indigo-500/30'
                        : 'hover:bg-[var(--glass-bg-hover)]'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${getGradient(c.user.role)} flex items-center justify-center font-bold text-sm text-white shadow-lg`}>
                        {getInitials(c.user.email)}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--glass-bg)] transition-colors ${isOnline ? 'bg-emerald-500' : 'bg-neutral-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-sm font-bold truncate">{c.user.email.split('@')[0]}</h4>
                        {c.lastMessage && (
                          <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">
                            {formatRelativeTime(c.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {c.connectionType === 'visit' && c.context && (
                        <p className="text-[10px] font-bold text-indigo-400 flex items-center gap-1 truncate mb-0.5">
                          <Building2 className="w-2.5 h-2.5 flex-shrink-0" />
                          {c.context.propertyTitle}
                        </p>
                      )}
                      <p className="text-[11px] text-[var(--text-muted)] truncate">
                        {c.lastMessage
                          ? c.lastMessage.content.length > 35
                            ? c.lastMessage.content.slice(0, 35) + '…'
                            : c.lastMessage.content
                          : `${c.user.role} · No messages yet`}
                      </p>
                    </div>
                  </div>
                );
              };

              return (
                <div className="px-3 py-2">
                  {networkContacts.length > 0 && (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 px-2 mb-2 mt-2 flex items-center gap-1.5">
                        <Users className="w-3 h-3" />
                        Your Team · {networkContacts.length}
                      </p>
                      {networkContacts.map(renderContact)}
                    </>
                  )}
                  {visitContacts.length > 0 && (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 px-2 mb-2 mt-4 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3" />
                        Companies · {visitContacts.length}
                      </p>
                      {visitContacts.map(renderContact)}
                    </>
                  )}
                  {otherContacts.length > 0 && (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-2 mb-2 mt-4">
                        All · {otherContacts.length}
                      </p>
                      {otherContacts.map(renderContact)}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── Chat Area ────────────────────────────────────────────────────── */}
        <div
          className={`${mobileShowChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-w-0`}
          style={{ background: 'var(--bg-primary)' }}
        >
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4 opacity-40 p-8 text-center">
              <MessageSquare className="w-14 h-14" />
              <div>
                <p className="font-bold mb-1">Select a contact to start chatting</p>
                <p className="text-sm text-[var(--text-muted)]">Type @ in a message to mention and notify someone</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[var(--border-subtle)] flex items-center gap-3 bg-[var(--bg-elevated)] shrink-0">
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-1.5 rounded-xl hover:bg-[var(--glass-bg-hover)] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${getGradient(selectedContact.user.role)} flex items-center justify-center font-bold text-sm text-white shadow-lg`}>
                    {getInitials(selectedContact.user.email)}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--bg-elevated)] ${onlineUsers.has(selectedContact.user.id) ? 'bg-emerald-500' : 'bg-neutral-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{selectedContact.user.email.split('@')[0]}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-xs flex items-center gap-1 ${onlineUsers.has(selectedContact.user.id) ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>
                      <Circle className="w-1.5 h-1.5 fill-current" />
                      {onlineUsers.has(selectedContact.user.id) ? 'Online' : 'Offline'}
                    </p>
                    {selectedContact.context && (
                      <>
                        <span className="text-[var(--text-muted)] text-xs opacity-40">·</span>
                        <span className="text-xs text-indigo-400 flex items-center gap-1 truncate">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          {selectedContact.context.propertyTitle}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-5">
                {isLoadingMessages ? (
                  <div className="space-y-4 p-2">
                    {[0,1,2,3].map(i => (
                      <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                        <div className="skeleton h-8 w-8 rounded-full flex-shrink-0" />
                        <div className={`skeleton h-12 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
                      </div>
                    ))}
                  </div>
                ) : groupedMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full flex-col gap-3 opacity-40 text-center px-6">
                    <MessageSquare className="w-10 h-10" />
                    <p className="text-sm font-semibold">No messages yet. Say hello!</p>
                    <p className="text-xs text-[var(--text-muted)]">Use @ to mention someone in your message</p>
                  </div>
                ) : (
                  groupedMessages.map(group => (
                    <div key={group.date}>
                      {/* Date separator */}
                      <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-2 py-0.5 rounded-full border border-[var(--border-subtle)]">
                          {group.date}
                        </span>
                        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                      </div>

                      {group.messages.map((msg, idx) => {
                        const isMine = msg.senderId === profile?.id;
                        const prevMsg = group.messages[idx - 1];
                        const showSenderLabel = !prevMsg || prevMsg.senderId !== msg.senderId;
                        const hasMentions = Array.isArray(msg.mentions) && msg.mentions.length > 0;

                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-2 ${isMine ? 'flex-row-reverse ml-auto' : ''} ${showSenderLabel ? 'mt-4' : 'mt-1'} max-w-[82%]`}
                          >
                            {/* Avatar */}
                            {showSenderLabel ? (
                              <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${isMine ? 'from-indigo-500 to-purple-600' : getGradient(selectedContact.user.role)} flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white self-end mb-5`}>
                                {isMine ? getInitials(profile?.email || '') : getInitials(selectedContact.user.email)}
                              </div>
                            ) : (
                              <div className="w-7 flex-shrink-0" />
                            )}

                            <div className={isMine ? 'items-end flex flex-col' : 'items-start flex flex-col'}>
                              {showSenderLabel && (
                                <p className={`text-[10px] text-[var(--text-muted)] font-medium mb-1 ${isMine ? 'mr-1' : 'ml-1'}`}>
                                  {isMine ? 'You' : selectedContact.user.email.split('@')[0]}
                                </p>
                              )}
                              <div className={`px-4 py-2.5 ${
                                isMine
                                  ? 'bg-gradient-to-br from-indigo-500/25 to-purple-500/15 backdrop-blur-md rounded-2xl rounded-tr-sm border border-indigo-500/25'
                                  : 'glass-panel rounded-2xl rounded-tl-sm'
                                } ${hasMentions ? 'border-l-2 border-l-indigo-400' : ''}`}
                              >
                                <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                                  {renderContent(msg.content, profile?.email || '')}
                                </p>
                              </div>
                              <span className={`text-[10px] text-[var(--text-muted)] mt-1 block ${isMine ? 'mr-1' : 'ml-1'}`}>
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
              <div className="p-4 border-t border-[var(--border-subtle)] shrink-0 bg-[var(--bg-elevated)] relative">

                {/* @mention dropdown */}
                {showMentionMenu && mentionSuggestions.length > 0 && (
                  <div className="absolute bottom-full left-4 right-4 mb-2 glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-20">
                    <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
                      <AtSign className="w-3.5 h-3.5 text-indigo-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Mention someone</p>
                    </div>
                    <div className="max-h-44 overflow-y-auto">
                      {mentionSuggestions.map(c => (
                        <button
                          key={c.user.id}
                          onMouseDown={e => { e.preventDefault(); insertMention(c.user.email); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--glass-bg-hover)] transition-colors text-left"
                        >
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${getGradient(c.user.role)} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}>
                            {getInitials(c.user.email)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold">{c.user.email.split('@')[0]}</p>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">{c.user.email}</p>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-400 opacity-60 flex-shrink-0">@mention</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emoji picker */}
                {showEmojiPicker && (
                  <div ref={emojiPickerRef} className="absolute bottom-full right-4 mb-2 z-30 shadow-2xl">
                    <EmojiPicker
                      onEmojiSelect={insertEmoji}
                      theme="dark"
                      previewPosition="none"
                      skinTonePosition="search"
                      maxFrequentRows={2}
                      perLine={8}
                      set="native"
                    />
                  </div>
                )}

                <div className="flex items-end gap-2">
                  {/* Emoji button */}
                  <button
                    onClick={() => { setShowEmojiPicker(p => !p); setShowMentionMenu(false); }}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shrink-0 mb-0.5 ${
                      showEmojiPicker
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'hover:bg-[var(--glass-bg-hover)] text-[var(--text-muted)] hover:text-amber-400'
                    }`}
                    title="Emoji"
                    type="button"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  <div className="flex-1">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message… (@ to mention)"
                      rows={1}
                      className="w-full theme-input rounded-2xl px-5 py-3 text-sm resize-none focus:border-indigo-500/50 transition-all"
                      style={{ minHeight: '48px', maxHeight: '120px' }}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 mb-0.5"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-2 ml-1 opacity-60">
                  Enter to send · Shift+Enter for new line · @ to mention &amp; notify
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
