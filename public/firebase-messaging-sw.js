// SisaRasa - Firebase Cloud Messaging Service Worker
// Handles background push notifications when the app is not in the foreground.

importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB5Dwei_QwnIUn3bTfZf06yRWKoRhDpUjM',
  authDomain: 'sisarasa-65427.firebaseapp.com',
  projectId: 'sisarasa-65427',
  storageBucket: 'sisarasa-65427.firebasestorage.app',
  messagingSenderId: '250510547682',
  appId: '1:250510547682:web:05688c1f2c52e5f4621cbb',
  measurementId: 'G-ELV0G3201R',
});

const messaging = firebase.messaging();

// ─── Background message handler ───────────────────────────────────────────────
// This fires when the app is in the background or closed.
// FCM delivers the notification automatically if `notification` field is set,
// but we override here to add custom icon, badge, vibration, and click data.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const data = payload.data || {};
  const notificationTitle = payload.notification?.title || 'SisaRasa';
  const notificationBody  = payload.notification?.body  || '';

  // Build the URL to open when the notification is clicked
  let clickUrl = '/';
  if (data.product_id) {
    clickUrl = `/foods/${data.product_id}`;
  } else if (data.store_id) {
    clickUrl = `/stores/${data.store_id}`;
  }

  const notificationOptions = {
    body: notificationBody,
    icon: '/images/logo.png',
    badge: '/images/logo.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.type || 'sisarasa-notif',   // replace duplicate notifications of same type
    renotify: true,
    data: {
      ...data,
      clickUrl,
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ─── Notification click handler ───────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickUrl = event.notification.data?.clickUrl || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If the app is already open, navigate the existing tab
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({ type: 'NAVIGATE', url: clickUrl });
            return client.focus();
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(clickUrl);
        }
      })
  );
});
