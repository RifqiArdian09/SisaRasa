'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Bell, X, CheckCheck } from 'lucide-react';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
  product_id?: string | null;
  store_id?: string | null;
}

function getNotificationLink(notif: Notification): string {
  if (notif.product_id) return `/foods/${notif.product_id}`;
  if (notif.store_id)   return `/stores/${notif.store_id}`;
  switch (notif.type) {
    case 'new_product':   return '/foods';
    case 'order_status':  return '/orders';
    case 'review':        return '/store/reviews';
    default:              return '#';
  }
}

function formatTime(dateStr: string): string {
  const date    = new Date(dateStr);
  const diffMs  = Date.now() - date.getTime();
  const mins    = Math.floor(diffMs / 60_000);
  const hours   = Math.floor(diffMs / 3_600_000);
  const days    = Math.floor(diffMs / 86_400_000);
  if (mins  < 1)  return 'Baru saja';
  if (mins  < 60) return `${mins} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days  < 7)  return `${days} hari lalu`;
  return date.toLocaleDateString('id-ID');
}

function typeIcon(type: string): string {
  switch (type) {
    case 'new_product':  return '🍽️';
    case 'order_status': return '📦';
    case 'review':       return '⭐';
    case 'favorite_store': return '❤️';
    default:             return '🔔';
  }
}

export default function NotificationBell() {
  const router            = useRouter();
  const supabase          = createClient();
  const dropdownRef       = useRef<HTMLDivElement>(null);
  const [userId, setUserId]         = useState<string | null>(null);
  const [notifications, setNotifs]  = useState<Notification[]>([]);
  const [unread, setUnread]         = useState(0);
  const [isOpen, setIsOpen]         = useState(false);
  const [loading, setLoading]       = useState(true);

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch notifications ─────────────────────────────────────────────────────
  const fetchNotifs = useCallback(async (uid: string) => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(30);

      if (data) {
        setNotifs(data);
        setUnread(data.filter((n: Notification) => !n.is_read).length);
      }
    } catch (err) {
      console.error('[NotificationBell] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // ── Init user + subscribe realtime ─────────────────────────────────────────
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      await fetchNotifs(user.id);

      // Realtime: listen for INSERT on this user's notifications
      channel = supabase
        .channel(`notifs:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const n = payload.new as Notification;
            setNotifs((prev) => [n, ...prev]);
            setUnread((prev) => prev + 1);
          }
        )
        .subscribe();
    };

    init();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, fetchNotifs]);

  // ── Mark single as read & navigate ────────────────────────────────────────
  const handleClick = async (notif: Notification) => {
    if (!notif.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
      setNotifs((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnread((prev) => Math.max(0, prev - 1));
    }
    const link = getNotificationLink(notif);
    if (link !== '#') {
      setIsOpen(false);
      router.push(link);
    }
  };

  // ── Mark all as read ───────────────────────────────────────────────────────
  const markAllRead = async () => {
    if (!userId) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).is('is_read', false);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  };

  if (!userId) return null;

  return (
    <div ref={dropdownRef} className="relative">
      {/* ── Bell button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-primary-teal/10 transition-colors"
        aria-label="Notifikasi"
      >
        <Bell className="w-5 h-5 text-dark/70" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-primary-orange rounded-full px-0.5">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 max-h-[70vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-dark font-poppins">Notifikasi</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-primary-teal hover:text-light-teal flex items-center gap-1 font-semibold"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tandai dibaca
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-dark/40 hover:text-dark/70">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-dark/40">
                <Bell className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">Belum ada notifikasi</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                    !notif.is_read ? 'bg-primary-teal/5' : ''
                  }`}
                >
                  {/* Type icon */}
                  <span className="text-xl leading-none mt-0.5 shrink-0">
                    {typeIcon(notif.type)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] leading-snug text-dark ${!notif.is_read ? 'font-semibold' : 'font-medium'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-dark/55 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.body}
                    </p>
                    <span className="text-[10px] text-dark/35 mt-1 block">
                      {formatTime(notif.created_at)}
                    </span>
                  </div>

                  {/* Unread dot */}
                  {!notif.is_read && (
                    <span className="w-2 h-2 rounded-full bg-primary-orange flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
