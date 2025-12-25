import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { decrypt_text, decrypt_number } from '../utils/decrypt';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await api.getAllTransactions();
            if (response.success) {
                // Filter for pending transactions (admin_permission === false)
                const pendingTransactions = response.data
                    .filter(t => !t.admin_permission)
                    .map(t => ({
                        ...t,
                        sender_name: t.sender_name ? decrypt_text(t.sender_name) : '-',
                        receiver_name: t.receiver_name ? decrypt_text(t.receiver_name) : '-',
                        points: t.points ? Number(decrypt_number(t.points)) : 0,
                    }))
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                setNotifications(pendingTransactions);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);

        return () => clearInterval(interval);
    }, []);

    const value = {
        notifications,
        notificationCount: notifications.length,
        loading,
        refreshNotifications: fetchNotifications,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
}
