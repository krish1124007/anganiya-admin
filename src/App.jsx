import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import { messaging } from "./firebase";
import { getToken } from "firebase/messaging";
import { useEffect } from 'react';
import { api } from './utils/api';

function AppContent() {
  const { user, loading } = useAuth();

  async function registerSW() {
    try {
      const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      console.log("Service Worker registered:", reg);
    } catch (error) {
      console.error("SW registration failed:", error);
    }
  }

  async function requestPermission() {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey:
          "BMEp2jHyYOot5nfM1EA7r971jXqBz5BOIKN220wRoYCY_Hp54KyajrWHiRkGLbbJ6HyQQVn0Jbjr0PKNrA5C4LY",
      });

      console.log("Token Generated:", token);
      if (user && user._id) {
        try {
          await api.updateAdmin(user._id, { deviceToken: token });
          console.log("Token saved to DB");
        } catch (error) {
          console.error("Error saving token to DB:", error);
        }
      }
    } else {
      alert("You denied notification permission");
    }
  }

  useEffect(() => {
    if (user) {
      // 1️⃣ Register SW first
      registerSW().then(() => {
        // 2️⃣ Then ask for permission
        requestPermission();
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return user ? <DashboardLayout /> : <Login />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
