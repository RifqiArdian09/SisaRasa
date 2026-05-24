'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { requestFcmToken, onForegroundMessage } from '@/lib/firebase/client';
import { toast } from 'sonner';

/**
 * FCMProvider handles:
 * 1. Requesting notification permission and registering FCM token
 *    - On initial load (if user already logged in)
 *    - On sign-in via onAuthStateChange
 * 2. Listening for foreground messages and showing toast notifications
 *    with a click action to navigate to the product/store.
 *
 * This component should be placed inside Providers (client-side only).
 * It renders nothing — purely side-effect-based.
 */
export default function FCMProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const initialized = useRef(false);
  const supabase = createClient();

  /** Register FCM token for the currently authenticated user */
  const registerToken = async () => {
    try {
      const token = await requestFcmToken();
      if (!token) return;

      await fetch('/api/fcm/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fcm_token: token }),
      });

      console.log('[FCM] Token registered successfully');
    } catch (err) {
      // Not critical — user may have denied notification permission
      console.warn('[FCM] Could not register token:', err);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let unsubscribeForeground: (() => void) | undefined;

    const init = async () => {
      // ── 1. Register token if already signed in on first load ──
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await registerToken();
      }

      // ── 2. Register token whenever the user signs in ──
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            await registerToken();
          }
          if (event === 'SIGNED_OUT') {
            // Optionally clear token on sign-out
            try {
              await fetch('/api/fcm/subscribe', { method: 'DELETE' });
            } catch {}
          }
        }
      );

      // ── 3. Foreground message handler — shows in-app toast ──
      unsubscribeForeground = onForegroundMessage((payload) => {
        const title = payload.notification?.title || 'SisaRasa';
        const body  = payload.notification?.body  || '';
        const data  = (payload.data || {}) as Record<string, string>;

        if (!body) return;

        // Determine navigation target from notification data
        const navigateTo = data.product_id
          ? `/foods/${data.product_id}`
          : data.store_id
          ? `/stores/${data.store_id}`
          : null;

        toast(title, {
          description: body,
          duration: 6000,
          icon: '🍽️',
          action: navigateTo
            ? {
                label: 'Lihat Sekarang',
                onClick: () => router.push(navigateTo),
              }
            : undefined,
        });
      });

      // ── 4. Handle background notification clicks (forwarded from SW) ──
      const handleSWMessage = (event: MessageEvent) => {
        if (event.data?.type === 'NAVIGATE' && event.data?.url) {
          router.push(event.data.url);
        }
      };
      navigator.serviceWorker?.addEventListener('message', handleSWMessage);

      return () => {
        navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
        subscription.unsubscribe();
      };
    };

    const cleanup = init();

    return () => {
      cleanup.then((fn) => fn?.());
      if (unsubscribeForeground) unsubscribeForeground();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
