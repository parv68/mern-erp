import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';
import axios from '../../utils/axios';
import { useAuth } from '../../hooks/useAuth';

const Notifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        fetchNotifications();
        // Set up polling for new notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get('/api/communication/notifications');
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.read_at).length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await axios.post(`/api/communication/notifications/${notificationId}/read`);
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const getNotificationLink = (type, referenceId) => {
        switch (type) {
            case 'message':
                return `/communication/messaging?conversation=${referenceId}`;
            case 'announcement':
                return '/communication/announcements';
            case 'newsletter':
                return '/communication/newsletter';
            default:
                return '#';
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'message':
                return '💬';
            case 'announcement':
                return '📢';
            case 'newsletter':
                return '📧';
            default:
                return '🔔';
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-600 hover:text-primary-600 focus:outline-none"
            >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
                    <div className="py-2">
                        <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b">
                            Notifications
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500">
                                    No notifications
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <Link
                                        key={notification.id}
                                        to={getNotificationLink(notification.type, notification.reference_id)}
                                        className={`block px-4 py-3 hover:bg-gray-50 ${
                                            !notification.read_at ? 'bg-blue-50' : ''
                                        }`}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className="flex items-start">
                                            <span className="text-lg mr-3">
                                                {getNotificationIcon(notification.type)}
                                            </span>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {notification.content}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(notification.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications; 