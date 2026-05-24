'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
  type MessagePayload,
} from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyB5Dwei_QwnIUn3bTfZf06yRWKoRhDpUjM',
  authDomain: 'sisarasa-65427.firebaseapp.com',
  projectId: 'sisarasa-65427',
  storageBucket: 'sisarasa-65427.firebasestorage.app',
  messagingSenderId: '250510547682',
  appId: '1:250510547682:web:05688c1f2c52e5f4621cbb',
  measurementId: 'G-ELV0G3201R',
};

const VAPID_KEY =
  'BLcsrZf7AV7Shk9w8DB2JEuY-MedUg18JSyXBfED9jZRZMeHk5FYve9ITrOfLY_7-Jk0LerobciW6NuVwtf-cFk';

let app: FirebaseApp | undefined;
let messaging: Messaging | undefined;

/** Initialize Firebase app (singleton) */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return app;
}

/** Initialize Messaging (only in browser, only once) */
export async function getMessagingInstance(): Promise<Messaging | undefined> {
  if (typeof window === 'undefined') return undefined;
  if (messaging) return messaging;

  const supported = await isSupported();
  if (!supported) {
    console.warn('[SisaRasa] Firebase Cloud Messaging is not supported in this browser.');
    return undefined;
  }

  try {
    const fbApp = getFirebaseApp();
    messaging = getMessaging(fbApp);
    return messaging;
  } catch (err) {
    console.error('[SisaRasa] Failed to initialize FCM messaging:', err);
    return undefined;
  }
}

/** Request permission and get FCM token */
export async function requestFcmToken(): Promise<string | null> {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[SisaRasa] Notification permission denied.');
      return null;
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token;
  } catch (err) {
    console.error('[SisaRasa] Failed to get FCM token:', err);
    return null;
  }
}

/** Listen for foreground messages */
export function onForegroundMessage(
  callback: (payload: MessagePayload) => void,
): () => void {
  let unsubscribe: (() => void) | undefined;

  (async () => {
    const msg = await getMessagingInstance();
    if (msg) {
      unsubscribe = onMessage(msg, callback);
    }
  })();

  return () => {
    if (unsubscribe) unsubscribe();
  };
}
