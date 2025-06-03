// web/firebase-messaging-sw.js

// Firebase App (the core Firebase SDK) is always required and must be listed first
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
// Add Firebase products that you want to use
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// ★★★ あなたのFirebaseプロジェクトの構成情報 ★★★
const firebaseConfig = {
  apiKey: "AIzaSyA4O0XxERBTymf5d4WwQJ1HnegoWnw9vdc",
  authDomain: "npo-database-351f0.firebaseapp.com",
  projectId: "npo-database-351f0",
  storageBucket: "npo-database-351f0.appspot.com",
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
    // webpushペイロードでiconが指定されている場合はそちらが優先されます
    // ここで直接iconを指定しても、FCMの通知ペイロードとしては無効です
    // そのため、ここではiconを含めず、webpushオプションで制御するのがベストです
    // icon: payload.notification?.icon || '/icons/Icon-192.png', // この行は削除が推奨
    data: payload.data // dataペイロードはタップ時のURL情報などに利用
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event);
  event.notification.close();

  const relativeUrl = event.notification.data?.url; // 例: "/chat/B2wCdqzxAMS7Y5LuyS5w"

  // PWAがデプロイされているサブディレクトリパスを明示的に指定
  // flutter build web --base-href の値と一致させる
  const pwaSubdirectory = '/lplaceweb'; 
  
  // 完全な絶対URLを構築
  // 例: https://osamu0221.github.io/lplaceweb/chat/B2wCdqzxAMS7Y5LuyS5w
  const absoluteTargetUrl = `${self.location.origin}${pwaSubdirectory}${relativeUrl}`;

  console.log('[firebase-messaging-sw.js] Navigating to:', absoluteTargetUrl); // デバッグ用ログ

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // 既存のクライアントがPWAのベースURLで開かれているか確認し、フォーカス
        // そして、そのクライアント内で目的のチャットパスに移動させる
        if (client.url.startsWith(`${self.location.origin}${pwaSubdirectory}/`) && 'focus' in client) {
          console.log('[firebase-messaging-sw.js] Found existing client, focusing and navigating.');
          return client.focus().then(focusedClient => {
            // 既に目的のURLであれば何もしない、そうでなければナビゲート
            if (focusedClient.url !== absoluteTargetUrl) {
              focusedClient.navigate(absoluteTargetUrl); 
            }
            return focusedClient;
          });
        }
      }
      // 既存のクライアントが見つからない場合は新しいウィンドウを開く
      if (clients.openWindow) {
        console.log('[firebase-messaging-sw.js] Opening new window.');
        return clients.openWindow(absoluteTargetUrl);
      }
    })
  );
});