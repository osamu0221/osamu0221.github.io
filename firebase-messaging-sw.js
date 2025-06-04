// web/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyA4O0XxERBTymf5d4WwQJ1HnegoWnw9vdc", // あなたの実際のAPIキー等に置き換えてください
  authDomain: "npo-database-351f0.firebaseapp.com",
  projectId: "npo-database-351f0",
  storageBucket: "npo-database-351f0.appspot.com",
  messagingSenderId: "383958642228",
  appId: "1:383958642228:web:078aaf82853e2ed99d6461",
  measurementId: "G-Y2SXMGQK86"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  const notificationTitle = payload.notification?.title || '新しいメッセージ';
  
  // PWAがデプロイされているサブディレクトリパス (例: '/lplaceweb' またはルートなら '')
  // flutter build web --base-href で設定した値に基づいて調整してください。
  // GitHub Pagesで <username>.github.io/<repositoryname>/ の場合は '/<repositoryname>' になります。
  // ルートにデプロイしている場合は '' (空文字列) または '/' です。
  // あなたのコードでは '/lplaceweb' が指定されていましたので、それをベースにします。
  const pwaSubdirectory = '/lplaceweb'; // ★★★ 要確認 ★★★ (実際のデプロイパスに合わせてください)

  // アイコンパスの構築
  // Cloud Functionから送られてくるiconパス (例: "/icons/Icon-192.png") が
  // ドメインルートからの絶対パスだと仮定した場合、サブディレクトリを考慮して修正します。
  // もしCloud Functionが既に完全なパス (例: "/lplaceweb/icons/Icon-192.png") を送るならこの修正は不要。
  let iconPath = payload.notification?.icon || '/icons/Icon-192.png'; // デフォルトアイコン
  if (iconPath.startsWith('/') && !iconPath.startsWith(pwaSubdirectory) && pwaSubdirectory !== '' && pwaSubdirectory !== '/') {
    iconPath = pwaSubdirectory + iconPath;
  } else if (pwaSubdirectory === '' || pwaSubdirectory === '/') {
    // ルートデプロイの場合は、payload.notification.icon がそのまま使えるか、
    // 'icons/Icon-192.png' のような相対パスにする
    iconPath = payload.notification?.icon || 'icons/Icon-192.png';
  }


  const notificationOptions = {
    body: payload.notification?.body || 'メッセージが届きました',
    icon: iconPath, // 修正されたアイコンパス
    data: payload.data // dataペイロードはタップ時のURL情報などに利用
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event);
  event.notification.close();

  const relativeUrl = event.notification.data?.url; // 例: "/chat/B2wCdqzxAMS7Y5LuyS5w" (Cloud Functionから設定)
  if (!relativeUrl) {
    console.log('[firebase-messaging-sw.js] No URL found in notification data. Opening root.');
    event.waitUntil(clients.openWindow(self.location.origin)); // デフォルトでルートを開く
    return;
  }

  // PWAがデプロイされているサブディレクトリパス
  // messaging.onBackgroundMessage と同じ値を使用
  const pwaSubdirectory = '/lplaceweb'; // ★★★ 要確認 ★★★ (実際のデプロイパスに合わせてください)
  
  // targetUrl の構築: self.location.origin は "https://osamu0221.github.io" のようなドメイン部分
  // relativeUrl が既に "/" で始まっていることを想定
  const targetUrl = `${self.location.origin}${pwaSubdirectory}${relativeUrl}`;

  console.log('[firebase-messaging-sw.js] Attempting to navigate to:', targetUrl);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 既存のウィンドウでPWAのベースURLに一致するものを探す
      const pwaBaseUrl = `${self.location.origin}${pwaSubdirectory}/`;
      for (const client of clientList) {
        if (client.url.startsWith(pwaBaseUrl) && 'focus' in client) {
          console.log('[firebase-messaging-sw.js] Found existing client:', client.url);
          return client.focus().then(focusedClient => {
            if (focusedClient) { // focus() が成功した場合
              // 既に目的のURLでなければナビゲート
              if (focusedClient.url !== targetUrl) {
                console.log('[firebase-messaging-sw.js] Navigating existing client to:', targetUrl);
                return focusedClient.navigate(targetUrl);
              }
              console.log('[firebase-messaging-sw.js] Client already at target URL.');
              return focusedClient; // 何もせずフォーカスされたクライアントを返す
            }
            // フォーカスに失敗した場合などは新しいウィンドウを開くフォールバック
            if (clients.openWindow) {
                console.log('[firebase-messaging-sw.js] Focusing client failed, opening new window to:', targetUrl);
                return clients.openWindow(targetUrl);
            }
          });
        }
      }
      // 適切な既存クライアントが見つからない場合は新しいウィンドウを開く
      if (clients.openWindow) {
        console.log('[firebase-messaging-sw.js] No existing client found, opening new window to:', targetUrl);
        return clients.openWindow(targetUrl);
      }
    })
  );
});