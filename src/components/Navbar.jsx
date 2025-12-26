import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { LayoutDashboard, Building2, Sun, Moon, LogOut, Menu, X, ArrowLeftRight, UserPlus, Globe, Landmark, Bell, Check, Settings } from 'lucide-react';
import { api } from '../utils/api';

export default function Navbar({ currentPage, setCurrentPage }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { notifications, notificationCount, refreshNotifications } = useNotifications();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [approvingId, setApprovingId] = useState(null);
    const notificationRef = useRef(null);

    const navItems = [
        { id: 'transactions', label: 'Kgs', icon: ArrowLeftRight },
        { id: 'commission-report', label: 'Commission', icon: Building2 },
        { id: 'all-branches', label: 'Branch Ledger', icon: Landmark },
        { id: 'ho-branch-leader', label: 'HO Branch Leader', icon: Building2 },
        { id: 'create-user', label: 'Users', icon: UserPlus },
        { id: 'ip-tracing', label: 'IP', icon: Globe },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        }

        if (isNotificationOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isNotificationOpen]);

    const handleApprove = async (transactionId) => {
        setApprovingId(transactionId);
        try {
            const response = await api.giveTransactionPermission(transactionId);
            if (response.success) {
                await refreshNotifications();
                alert('Transaction approved successfully!');
            } else {
                alert(response.message || 'Failed to approve transaction');
            }
        } catch (error) {
            console.error('Error approving transaction:', error);
            alert('Error approving transaction');
        } finally {
            setApprovingId(null);
        }
    };

    return (
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo & Desktop Nav */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('transactions')}>
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl text-gray-900 dark:text-white">Angadia Admin</span>
                        </div>

                        <div className="hidden md:block ml-10">
                            <div className="flex items-baseline space-x-4">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setCurrentPage(item.id)}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${currentPage === item.id
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Side Actions */}
                    <div className="hidden md:flex items-center gap-4 ml-auto">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>

                        {/* Notification Bell */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 relative"
                                title="Notifications"
                            >
                                <Bell className="w-5 h-5" />
                                {notificationCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {notificationCount > 9 ? '9+' : notificationCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {isNotificationOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Pending Approvals</h3>
                                        <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                                            {notificationCount}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                                No pending approvals
                                            </div>
                                        ) : (
                                            notifications.slice(0, 10).map((notification) => (
                                                <div key={notification._id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {notification.sender_name} → {notification.receiver_name}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                ₹{notification.points.toLocaleString()} • {new Date(notification.createdAt).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleApprove(notification._id)}
                                                            disabled={approvingId === notification._id}
                                                            className="ml-2 p-1.5 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white rounded transition-colors disabled:cursor-not-allowed"
                                                            title="Approve"
                                                        >
                                                            {approvingId === notification._id ? (
                                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                            ) : (
                                                                <Check className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                            <div className="text-sm text-right hidden lg:block">
                                <p className="font-medium text-gray-900 dark:text-white">{user?.username}</p>
                                <p className="text-xs text-gray-500">Admin</p>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        >
                            {isMobileMenuOpen ? (
                                <X className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <Menu className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setCurrentPage(item.id);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center px-3 py-2 rounded-md text-base font-medium ${currentPage === item.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <item.icon className="w-5 h-5 mr-3" />
                                {item.label}
                            </button>
                        ))}

                        <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-4 pb-3">
                            <div className="flex items-center px-3 gap-3">
                                <div className="flex-1">
                                    <div className="text-base font-medium text-gray-800 dark:text-white">{user?.username}</div>
                                    <div className="text-sm font-medium text-gray-500">Admin</div>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={logout}
                                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
