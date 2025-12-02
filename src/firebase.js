import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDw0Rmwvkgiss6Nn0iAZZ_jZduJiOuQ0VM",
  authDomain: "notification-web-397df.firebaseapp.com",
  projectId: "notification-web-397df",
  storageBucket: "notification-web-397df.firebasestorage.app",
  messagingSenderId: "402072326118",
  appId: "1:402072326118:web:e5d085e483bb03d7205027"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);