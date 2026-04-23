const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// ─── Register ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  const userRole = role === 'instructor' ? 'instructor' : 'student';

  try {
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (row) return res.status(400).json({ message: 'User already exists' });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // FIX: explicitly store created_at with current timestamp
      db.run(
        `INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
        [name, email, hashedPassword, userRole],
        function (err) {
          if (err) return res.status(500).json({ message: 'Failed to create user' });
          const token = jwt.sign({ id: this.lastID, role: userRole }, JWT_SECRET, { expiresIn: '7d' });
          res.json({ token, user: { id: this.lastID, name, email, role: userRole } });
        }
      );
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!user) return res.status(400).json({ message: 'User does not exist' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });
});

// ─── Me ───────────────────────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    db.get('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id], (err, user) => {
      if (err || !user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    });
  } catch {
    res.status(401).json({ message: 'Token is not valid' });
  }
});

// ─── GET /profile ─────────────────────────────────────────────────────────────
router.get('/profile', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const role   = req.user.role;

  db.get(
    `SELECT id, name, email, role, bio, headline, location, website, avatar,
            strftime('%Y-%m-%dT%H:%M:%SZ', created_at) as created_at
     FROM users WHERE id = ?`,
    [userId],
    (err, user) => {
      if (err || !user) return res.status(404).json({ message: 'User not found' });

      if (role === 'instructor') {
        db.get(
          `SELECT
            (SELECT COUNT(*) FROM courses WHERE instructor_id = ?) AS total_courses,
            (SELECT COUNT(*) FROM enrollments
             WHERE course_id IN (SELECT id FROM courses WHERE instructor_id = ?)) AS total_students`,
          [userId, userId],
          (err, stats) => res.json({ user, stats: { ...(stats || {}), type: 'instructor' } })
        );
      } else {
        // Simple, guaranteed-accurate count of active enrollments
        db.get(
          `SELECT COUNT(*) AS enrolled_count FROM enrollments WHERE student_id = ?`,
          [userId],
          (err, row1) => {
            db.get(
              `SELECT COUNT(*) AS completed_count
               FROM enrollments e
               WHERE e.student_id = ?
                 AND (SELECT COUNT(*) FROM lessons l WHERE l.course_id = e.course_id) > 0
                 AND (SELECT COUNT(*) FROM lessons l WHERE l.course_id = e.course_id)
                   = (SELECT COUNT(*) FROM progress p
                      JOIN lessons l2 ON p.lesson_id = l2.id
                      WHERE l2.course_id = e.course_id AND p.student_id = ?)`,
              [userId, userId],
              (err, row2) => {
                res.json({
                  user,
                  stats: {
                    enrolled_count:  row1?.enrolled_count  ?? 0,
                    completed_count: row2?.completed_count ?? 0,
                    type: 'student'
                  }
                });
              }
            );
          }
        );
      }
    }
  );
});

// ─── PUT /profile ─────────────────────────────────────────────────────────────
router.put('/profile', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { name, bio, headline, location, website, avatar, currentPassword, newPassword } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err || !user) return res.status(404).json({ message: 'User not found' });

      let hashedPassword = user.password;
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: 'Current password is required' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(newPassword, salt);
      }

      // avatar is a base64 data-url string (or empty to keep existing)
      const avatarValue = avatar !== undefined ? avatar : user.avatar;

      db.run(
        `UPDATE users SET name=?, bio=?, headline=?, location=?, website=?, password=?, avatar=? WHERE id=?`,
        [name.trim(), bio || '', headline || '', location || '', website || '', hashedPassword, avatarValue || '', userId],
        (err) => {
          if (err) return res.status(500).json({ message: 'Failed to update profile' });
          res.json({ message: 'Profile updated successfully' });
        }
      );
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
