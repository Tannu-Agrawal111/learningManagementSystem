const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const { getOrCreateMongoUser, getOrCreateMongoCourse } = require('../utils/dbSync');

// Notification utilities
const Notification = require('../models/Notification');
const { sendNotification } = require('../utils/notifications');

const db = require('../db');
const { generatePDFCertificate } = require('../utils/certificateGenerator');

// Helper to calculate XP based on lesson duration (placeholder logic)
function calculateXP(durationSeconds) {
  // Simple: 10 XP per lesson, bonus for fast completion (<5 mins)
  if (durationSeconds < 300) return 15;
  return 10;
}

// POST /api/gamification/complete-lesson
router.post('/complete-lesson', authMiddleware, async (req, res) => {
  const { lessonId, courseId, duration } = req.body; // duration in seconds
  const userId = req.user.id;
  try {
    // Optional: verify lesson belongs to the course. If Lesson model is not available,
    // skip this validation to avoid runtime errors.
    // const lesson = await Lesson.findById(lessonId);
    // if (lesson && lesson.course_id.toString() !== courseId) {
    //   return res.status(400).json({ message: 'Invalid lesson/course combination' });
    // }

    const xpEarned = calculateXP(duration || 0);

    // Update XP and streak
    const user = await getOrCreateMongoUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const now = new Date();
    const last = user.lastActiveDate || now;
    const diffDays = Math.floor((now - new Date(last)) / (1000 * 60 * 60 * 24));
    const newStreak = diffDays === 1 ? user.learningStreak + 1 : diffDays > 1 ? 1 : user.learningStreak;

    user.xp += xpEarned;
    user.learningStreak = newStreak;
    user.lastActiveDate = now;
    await user.save();

    // If streak broken (diffDays > 1)
    if (diffDays > 1) {
      const message = 'Your learning streak has broken! Start a lesson today to rebuild it.';
      const newNotif = new Notification({
        recipient: userId.toString(),
        triggerType: 'streak_broken',
        message
      });
      newNotif.save()
        .then(savedNotif => {
          sendNotification(userId, user.email || '', 'Streak Broken', message, { 
            actionUrl: '/student/streak',
            dbNotification: savedNotif
          });
        })
        .catch(e => {
          console.error('Notification save error:', e);
          sendNotification(userId, user.email || '', 'Streak Broken', message, { actionUrl: '/student/streak' });
        });
    }

    // Record lesson progress (optional, using lecture_progress table)
    db.run(
      `INSERT OR REPLACE INTO lecture_progress (user_id, lecture_id, completed, last_position_seconds) VALUES (?, ?, ?, ?)`,
      [userId, lessonId, 1, duration || 0],
      err => {
        if (err) console.error('SQLite progress insert error:', err.message);
      }
    );

    res.json({ message: 'Lesson completed', xpEarned, newStreak, totalXP: user.xp });
  } catch (err) {
    console.error('Gamification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/gamification/certificates/:courseId - generate certificate for completed course
router.get('/certificates/:courseId', authMiddleware, async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;
  try {
    // Verify enrollment
    const enrollment = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
        [userId, courseId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    if (!enrollment) return res.status(403).json({ message: 'Not enrolled in this course' });

    const student = await getOrCreateMongoUser(userId);
    const course = await getOrCreateMongoCourse(courseId);
    const { pdfUrl, verificationHash } = await generatePDFCertificate(
      student.name,
      course.title,
      userId.toString(),
      courseId.toString()
    );

    // Store verification hash for future lookup (use payments table as generic storage)
    db.run(
      `INSERT INTO payments (student_id, instructor_id, course_id, amount, status, verification_hash, stripe_session_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, course.instructor_id, courseId, 0, 'succeeded', verificationHash, null],
      err => {
        if (err) console.error('SQLite payment insert error:', err.message);
      }
    );

    res.json({ pdfUrl, verificationHash });
  } catch (err) {
    console.error('Certificate generation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/gamification/certificates/verify/:hash - verify certificate
router.get('/certificates/verify/:hash', async (req, res) => {
  const { hash } = req.params;
  try {
    db.get(
      'SELECT * FROM payments WHERE verification_hash = ?',
      [hash],
      (err, row) => {
        if (err) {
          console.error('SQLite verify error:', err.message);
          return res.status(500).json({ message: 'Server error' });
        }
        if (!row) return res.status(404).json({ valid: false, message: 'Invalid verification hash' });
        // Return minimal info for external verification
        res.json({ valid: true, studentId: row.student_id, courseId: row.course_id, issuedAt: row.created_at });
      }
    );
  } catch (e) {
    console.error('Verification route error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/gamification/activity/streak - return user streak, xp and badges
router.get('/activity/streak', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await getOrCreateMongoUser(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if streak is broken
    const now = new Date();
    const last = user.lastActiveDate || now;
    const diffDays = Math.floor((now - new Date(last)) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1 && user.learningStreak > 0) {
      const oldStreak = user.learningStreak;
      user.learningStreak = 0;
      user.lastActiveDate = now;
      await user.save();

      const message = `Your ${oldStreak}-day learning streak has broken! Start a lesson today to rebuild it.`;
      
      // Save notification in MongoDB and send real-time update
      const newNotif = new Notification({
        recipient: userId.toString(),
        triggerType: 'streak_broken',
        message
      });
      newNotif.save()
        .then(savedNotif => {
          sendNotification(userId, user.email || '', 'Streak Broken', message, { 
            actionUrl: '/student/courses',
            dbNotification: savedNotif
          });
        })
        .catch(e => {
          console.error('Notification save error:', e);
          sendNotification(userId, user.email || '', 'Streak Broken', message, { actionUrl: '/student/courses' });
        });
    }

    // Sync to SQLite users table just in case
    db.run(
      'UPDATE users SET learningStreak = ?, xp = ? WHERE id = ?',
      [user.learningStreak, user.xp, userId],
      (err) => {
        if (err) console.error('SQLite streak sync error:', err.message);
      }
    );

    res.json({ streak: user.learningStreak, xp: user.xp });
  } catch (err) {
    console.error('Streak fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/gamification/certificates - list all certificates for logged‑in student
router.get('/certificates', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  db.all(
    `SELECT p.course_id AS courseId, c.title AS courseTitle, p.pdf_url AS pdfUrl, p.verification_hash AS verificationHash, p.created_at AS issuedAt
     FROM payments p JOIN courses c ON p.course_id = c.id
     WHERE p.student_id = ? AND p.verification_hash IS NOT NULL`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Certificates list error:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      const certificates = rows.map(r => ({
        id: r.courseId,
        courseId: r.courseId,
        title: r.courseTitle,
        pdfUrl: r.pdfUrl,
        verificationHash: r.verificationHash,
      }));
      res.json({ certificates });
    }
  );
});

module.exports = router;
