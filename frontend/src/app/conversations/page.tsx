'use client';

import React, { useEffect, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Search, Send, Bot, User, Sparkles, Check, RefreshCw } from 'lucide-react';
import { Conversation, Message } from '@/types';
import api from '@/services/api';
import { useSocket } from '@/hooks/useSocket';

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [socketAiData, setSocketAiData] = useState<any>(null);
  const [socketReply, setSocketReply] = useState('');
  const [draftOrder, setDraftOrder] = useState<any>(null);
  const { on } = useSocket();

  useEffect(() => {
    api.get('/conversations')
      .then(({ data }) => setConversations(data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    api.get(`/conversations/${activeConv.id}`)
      .then(({ data }) => setMessages(data.data?.messages ?? []))
      .catch(console.error);
  }, [activeConv?.id]);

  useEffect(() => {
    const unsub1 = on('chat:newMessage', (data: any) => {
      if (activeConv?.id === data.conversationId) {
        setMessages((prev) => [...prev, data.message]);
      }
    });
    const unsub2 = on('ai:parsed', (data: any) => {
      if (activeConv?.id === data.conversationId) setSocketAiData(data);
    });
    const unsub3 = on('ai:suggestedReply', (data: any) => {
      if (activeConv?.id === data.conversationId) setSocketReply(data.reply);
    });
    const unsub4 = on('order:created', (data: any) => {
      setDraftOrder(data);
    });
    return () => { unsub1?.(); unsub2?.(); unsub3?.(); unsub4?.(); };
  }, [activeConv?.id, on]);

  const handleSend = async () => {
    if (!input.trim() || !activeConv) return;
    try {
      await api.post('/messages/send', { conversationId: activeConv.id, content: input });
      setInput('');
      setSocketReply('');
      setSocketAiData(null);
    } catch (err) { console.error(err); }
  };

  const handleApproveReply = async () => {
    if (!socketReply || !activeConv || messages.length === 0) return;
    try {
      await api.post(`/messages/${messages[messages.length - 1].id}/approve`, { reply: socketReply });
      setSocketReply('');
      setSocketAiData(null);
    } catch (err) { console.error(err); }
  };

  if (loading) return <Shell><PageSkeleton /></Shell>;

  return (
    <Shell>
      <PageHeader title="Conversations" description="Customer messages and AI suggestions" />

      <div className="grid grid-cols-[320px_1fr_340px] rounded-xl border border-border h-[calc(100vh-220px)] overflow-hidden">
        {/* Conversations List */}
        <div className="border-r border-border bg-muted/20">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search chats..." className="pl-9 h-9" />
            </div>
          </div>
          <div className="overflow-y-auto h-[calc(100%-57px)]">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No conversations yet</div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-accent ${activeConv?.id === conv.id ? 'bg-accent' : ''}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                    {conv.customer?.fullName?.split(' ').map((n) => n[0]).join('') || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{conv.customer?.fullName || 'Unknown'}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ''}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage || 'No messages'}</p>
                  </div>
                  {(conv.unreadCount ?? 0) > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {activeConv ? (
          <div className="flex flex-col border-r border-border">
            <div className="p-3 border-b border-border bg-muted/20">
              <p className="text-sm font-medium">{activeConv.customer?.fullName}</p>
              <p className="text-xs text-muted-foreground">{activeConv.customer?.phone}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.senderType === 'CUSTOMER' ? '' : 'flex-row-reverse'}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.senderType === 'CUSTOMER' ? 'bg-primary/10' : msg.senderType === 'AI' ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-primary'}`}>
                    {msg.senderType === 'AI' ? <Bot className="h-4 w-4 text-emerald-600" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[70%] ${msg.senderType === 'CUSTOMER' ? '' : 'items-end flex flex-col'}`}>
                    <div className={`rounded-lg px-3 py-2 text-sm ${msg.senderType === 'CUSTOMER' ? 'bg-muted' : msg.senderType === 'AI' ? 'bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800' : 'bg-primary text-primary-foreground'}`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1">{timeAgo(msg.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input placeholder="Type a message..." className="h-9" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
                <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend}><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center border-r border-border bg-muted/10">
            <div className="text-center">
              <svg className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              <p className="text-sm text-muted-foreground">Select a conversation to start</p>
            </div>
          </div>
        )}

        {/* AI Panel */}
        <div className="bg-muted/10 p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold">AI Assistant</h3>
          </div>

          {socketAiData ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/50 p-3 border border-emerald-200">
                <p className="text-xs font-medium text-emerald-700 mb-1">Detected Intent</p>
                <p className="text-sm font-semibold">{socketAiData.intent}</p>
                <p className="text-xs text-muted-foreground mt-1">Confidence: {Math.round((socketAiData.confidence || 0) * 100)}%</p>
              </div>

              {socketAiData.products?.length > 0 && (
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Extracted Items</p>
                  {socketAiData.products.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm mb-1 last:mb-0"><span className="text-muted-foreground">Item {i + 1}</span><span className="font-medium">{p.name} ({p.quantity})</span></div>
                  ))}
                </div>
              )}

              {draftOrder && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/50 p-3 border border-blue-200">
                  <p className="text-xs font-medium text-blue-700 mb-1">Draft Order Created</p>
                  <p className="text-sm font-semibold">₹{draftOrder.total?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Customer: {draftOrder.customerName}</p>
                </div>
              )}

              {socketReply && (
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Suggested Reply</p>
                  <p className="text-sm mb-3">{socketReply}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" className="flex-1" onClick={handleApproveReply}><Check className="h-3 w-3 mr-1" /> Approve</Button>
                    <Button size="sm" variant="outline" className="flex-1"><RefreshCw className="h-3 w-3 mr-1" /> Regenerate</Button>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Language</p>
                <p className="text-sm capitalize">{socketAiData.language || 'Unknown'}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Bot className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">AI analysis will appear here when a customer sends a message</p>
            </div>
          )}

          {activeConv && (
            <div className="mt-4 rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Customer Info</p>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Name:</span> {activeConv.customer?.fullName}</p>
                <p><span className="text-muted-foreground">Phone:</span> {activeConv.customer?.phone}</p>
                <p><span className="text-muted-foreground">Orders:</span> {activeConv.customer?.totalOrders || 0}</p>
                <p><span className="text-muted-foreground">Outstanding:</span> ₹{(activeConv.customer?.outstandingAmount || 0).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
