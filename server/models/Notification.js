const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: String, ref: 'User', required: true },
  triggerType: { type: String, enum: ['new_lesson', 'streak_broken'], required: true },
  courseRef: { type: String, ref: 'Course' }, // optional, for lesson notifications
  lessonRef: { type: String }, // optional, for lesson notifications
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
