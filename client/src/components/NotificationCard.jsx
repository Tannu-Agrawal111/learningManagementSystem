import React from 'react';
import './NotificationCard.css';

/**
 * NotificationCard – colourful, well‑structured card for a single notification.
 * Props:
 *   - notification: { _id, message, isRead, createdAt, type? }
 *   - onMarkAsRead: (id) => void
 */
const NotificationCard = ({ notification, onMarkAsRead }) => {
  // Icon mapping – extendable for more types
  const iconMap = {
    lesson: '📚',
    streak: '⚡️',
    default: '🔔',
  };
  const icon = iconMap[notification.type] || iconMap['default'];

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification._id);
    }
  };

  // CSS class for theming based on type (e.g., .lesson, .streak)
  const typeClass = notification.type ? ` ${notification.type}` : '';

  return (
    <li
      className={`notification-card${typeClass} ${notification.isRead ? 'read' : 'unread'}`}
      onClick={handleClick}
    >
      <div className="notification-icon" aria-hidden="true">{icon}</div>
      <div className="notification-content">
        <p className="notification-message">{notification.message}</p>
        <small className="notification-time">{new Date(notification.createdAt).toLocaleString()}</small>
      </div>
    </li>
  );
};

export default NotificationCard;
