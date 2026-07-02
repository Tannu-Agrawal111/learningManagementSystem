// progress.js - progress tracking endpoints
const express = require('express');
const router = express.Router();
const db = require('../db'); // SQLite DB instance

// Middleware to get user from auth token (reuse from auth.js)
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Save or update progress for a lecture
router.post('/save', authMiddleware, (req, res) => {
  const { lectureId, completed, lastPositionSeconds } = req.body;
  const userId = req.user.id;
  if (!lectureId) return res.status(400).json({ message: 'lectureId required' });
  db.run(
    `INSERT INTO lecture_progress (user_id, lecture_id, completed, last_position_seconds) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, lecture_id) DO UPDATE SET completed = excluded.completed, last_position_seconds = excluded.last_position_seconds`,
    [userId, lectureId, completed ? 1 : 0, lastPositionSeconds || 0],
    function (err) {
      if (err) return res.status(500).json({ message: 'DB error', err });
      res.json({ success: true });
    }
  );
});

// Get progress for a lecture
router.get('/:lectureId', authMiddleware, (req, res) => {
  const { lectureId } = req.params;
  const userId = req.user.id;
  db.get(
    'SELECT completed, last_position FROM progress WHERE user_id = ? AND lecture_id = ?',
    [userId, lectureId],
    (err, row) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      if (!row) return res.json({ completed: false, lastPositionSeconds: 0 });
      res.json({ completed: !!row.completed, lastPositionSeconds: row.last_position });
    }
  );
});

module.exports = router;
