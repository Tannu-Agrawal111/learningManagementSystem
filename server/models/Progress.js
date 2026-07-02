const mongoose = require('mongoose');

const videoWatchTimeSchema = new mongoose.Schema({
  lectureId: { type: String, required: true },
  watchTimeSeconds: { type: Number, default: 0 },
  lastPositionSeconds: { type: Number, default: 0 },
  completed: { type: Boolean, default: false }
});

const progressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  
  completedLectures: [{
    lectureId: { type: String, required: true },
    completedAt: { type: Date, default: Date.now }
  }],
  
  videoWatchTimes: [videoWatchTimeSchema],
  completedSteps: [String], // Array of generic completed steps (e.g. "quiz-123")
  
  overallPercentage: { type: Number, default: 0 },
  lastAccessed: { type: Date, default: Date.now }
});

// Compound index to ensure uniqueness per student & course
progressSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
