// SisaRasa - Firebase Cloud Messaging Service Worker
importScripts(
  'https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js'
);

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

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'SisaRasa';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/images/logo.png',
    badge: '/images/logo.png',
    vibrate: [200, 100, 200],
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const urlToOpen = data.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({ type: 'NAVIGATE', url: urlToOpen });
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
