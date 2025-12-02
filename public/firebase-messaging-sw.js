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
    icon: payload.notification.image || "/favicon.ico"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
