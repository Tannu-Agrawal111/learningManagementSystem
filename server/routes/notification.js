// server/routes/notification.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// All notification routes require authentication
router.use(authMiddleware);

// GET /api/notifications?type=...&unread=...
router.get('/', notificationController.getUserNotifications);

// PATCH /api/notifications/:id/read
router.patch('/:id/read', notificationController.markOneAsRead);

// PATCH /api/notifications/markAllRead
router.patch('/markAllRead', notificationController.markAllAsRead);

module.exports = router;
