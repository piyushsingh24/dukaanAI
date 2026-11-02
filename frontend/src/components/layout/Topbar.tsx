'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/store/auth';
import { Avatar } from '@/components/ui/avatar';
import { Bell, Search, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSocket } from '@/hooks/useSocket';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function Topbar() {
  const { merchant, logout } = useAuth();
  const { on } = useSocket();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/notifications').then(({ data }) => {
      const items = data.data ?? [];
      setNotifications(items);
      setUnreadCount(items.filter((n: NotificationItem) => !n.isRead).length);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const unsub = on('notification:new', (data: NotificationItem) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((c) => c + 1);
    });
    return () => unsub?.();
  }, [on]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  return (
    <header className="fixed left-[280px] right-0 top-0 z-30 h-[72px] border-b border-border bg-background">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="relative w-[320px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search orders, customers..." className="pl-9 h-9" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <Button variant="ghost" size="icon" className="relative" onClick={() => setShowDropdown(!showDropdown)}>
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-popover shadow-lg overflow-hidden"
                >
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <p className="text-sm font-semibold">Notifications</p>
                    {unreadCount > 0 && (
                      <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet</div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkRead(n.id)}
                          className={`flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-accent ${!n.isRead ? 'bg-accent/50' : ''}`}
                        >
                          <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!n.isRead ? 'bg-primary' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{n.title}</p>
                            {n.message && <p className="text-xs text-muted-foreground truncate">{n.message}</p>}
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{merchant?.businessName || 'DukaanAI'}</p>
              <p className="text-xs text-muted-foreground">{merchant?.ownerName || 'Merchant'}</p>
            </div>
            <Avatar name={merchant?.businessName || 'M'} size="md" />
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
