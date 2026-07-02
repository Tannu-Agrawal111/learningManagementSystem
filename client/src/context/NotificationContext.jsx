import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { socket, connectSocket } from '../utils/socket';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/notifications?unread=false`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        const unread = data.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  const markAsRead = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(c - 1, 0));
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5000/api/notifications/markAllRead`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  // Initialize socket for real‑time notifications
  useEffect(() => {
    if (user && user.id) {
      connectSocket(user.id);
      socket.on('notification', (payload) => {
        setNotifications((prev) => [payload, ...prev]);
        setUnreadCount((c) => c + 1);
      });
    }
    return () => {
      socket.off('notification');
    };
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
