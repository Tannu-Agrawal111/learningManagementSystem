const Notification = require('../models/Notification');

// GET /api/notifications?type=all|new_lesson|streak_broken&unread=true|false
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, unread } = req.query;
    const filter = { recipient: userId.toString() };
    if (type && type !== 'all') filter.triggerType = type;
    if (unread === 'true') filter.isRead = false;
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .populate('courseRef', 'title thumbnail')
      .populate('lessonRef', 'title');
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/notifications/:id/read
exports.markOneAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updated = await Notification.findOneAndUpdate({ _id: id, recipient: userId.toString() }, { isRead: true }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Notification not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error marking as read', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/notifications/markAllRead (fixed route name logic matching notification.js router definition)
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.updateMany({ recipient: userId.toString(), isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all as read', err);
    res.status(500).json({ message: 'Server error' });
  }
};
