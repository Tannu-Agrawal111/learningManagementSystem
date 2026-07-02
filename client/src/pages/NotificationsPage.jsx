import React from 'react';
import { useNotification } from '../context/NotificationContext';
import NotificationCard from '../components/NotificationCard';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotification();

  const handleMarkAll = async () => {
    await markAllAsRead();
  };

  return (
    <div className="notifications-page">
      <h1 className="page-title">Notifications</h1>
      {notifications.length === 0 ? (
        <p>No notifications.</p>
      ) : (
        <>
          <button className="mark-all-btn" onClick={handleMarkAll}>Mark All as Read</button>
          <ul className="notification-list">
            {notifications.map((n) => (
              <NotificationCard key={n._id} notification={n} onMarkAsRead={markAsRead} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default NotificationsPage;
