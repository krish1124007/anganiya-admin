importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js");

firebase.initializeApp({
  apiKey: "AIzaSyDw0Rmwvkgiss6Nn0iAZZ_jZduJiOuQ0VM",
  authDomain: "notification-web-397df.firebaseapp.com",
  projectId: "notification-web-397df",
  messagingSenderId: "402072326118",
  appId: "1:402072326118:web:e5d085e483bb03d7205027"
});



const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image || "/favicon.ico",
    data: payload.data // Pass data so it can be accessed in notificationclick
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  // Extract transactionId from notification data if available
  // Adjust this based on your actual payload structure. 
  // Assuming payload.data.transactionId or similar was passed.
  // Note: 'payload' in onBackgroundMessage is event.notification.data here?
  // Usually data is passed in 'data' field of notification options.
  const transactionId = event.notification.data?.transactionId ||
    event.notification.data?.transaction_id;

  let url = '/';
  if (transactionId) {
    url = '/?transactionId=' + transactionId;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      // If a window is already open, focus it and navigate
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url.indexOf(url) !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
