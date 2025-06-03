// web/firebase-messaging-sw.js

// Firebase App (the core Firebase SDK) is always required and must be listed first
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
// Add Firebase products that you want to use
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// ★★★ あなたのFirebaseプロジェクトの構成情報（提供されたものをそのまま使用） ★★★
const firebaseConfig = {
  apiKey: "AIzaSyA4O0XxERBTymf5d4WwQJ1HnegoWnw9vdc",
  authDomain: "npo-database-351f0.firebaseapp.com",
  projectId: "npo-database-351f0",
  storageBucket: "npo-database-351f0.appspot.com", // ★ .firebasestorage.app から .appspot.com に修正されていることが多いので注意
  messagingSenderId: "383958642228",
  appId: "1:383958642228:web:078aaf82853e2ed99d6461",
  measurementId: "G-Y2SXMGQK86"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || '新しいメッセージ';
  const notificationOptions = {
    body: payload.notification?.body || 'メッセージが届きました',
    icon: payload.notification?.icon || '/icons/Icon-192.png',
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event);
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // client.url が targetUrl と完全に一致するか、または適切なパスで終わるかを確認
        // 例: if (new URL(client.url).pathname === new URL(targetUrl, client.url).pathname && 'focus' in client)
        if (client.url === targetUrl && 'focus' in client) { // より単純な比較
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});