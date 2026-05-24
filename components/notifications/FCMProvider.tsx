'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { requestFcmToken, onForegroundMessage } from '@/lib/firebase/client';
import { toast } from 'sonner';

/**
 * FCMProvider handles:
 * 1. Requesting notification permission and registering FCM token
 * 2. Listening for foreground messages and showing toast notifications
 *
 * This component should be placed inside Providers (client-side only).
 * It renders nothing (null) - purely side effects.
 */
export default function FCMProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);
  const supabase = createClient();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let unsubscribeForeground: (() => void) | undefined;

    const init = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Listen for auth state changes to register token on login
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            // Try to get and register FCM token
            try {
              const token = await requestFcmToken();
              if (token) {
                // Send token to our API to store in users table
                await fetch('/api/fcm/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ fcm_token: token }),
                });
                console.log('[FCM] Token registered successfully');
              }
            } catch (err) {
              console.warn('[FCM] Could not register token:', err);
              // Not critical - user may have denied permission
            }
          }
        }
      );

      // Listen for foreground push messages
      unsubscribeForeground = onForegroundMessage((payload) => {
        const title = payload.notification?.title || 'SisaRasa';
        const body = payload.notification?.body || '';
        if (body) {
          toast(title, {
            description: body,
            duration: 5000,
          });
        }
      });
    };

    init();

    return () => {
      if (unsubscribeForeground) unsubscribeForeground();
    };
  }, [supabase]);

  return <>{children}</>;
}
