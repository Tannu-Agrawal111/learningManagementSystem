const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Logging helper
const logUnenroll = (msg) => {
    const logPath = path.join(__dirname, '../unenroll_debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
};

// All routes in this file require authentication
router.use(authMiddleware);

// @route GET /api/student/courses
router.get('/courses', (req, res) => {
  const query = `
    SELECT c.id, c.title, c.description, u.name as instructor_name,
    (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as total_enrolled
    FROM courses c
    JOIN users u ON c.instructor_id = u.id
  `;
  db.all(query, [], (err, courses) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(courses);
  });
});

// @route GET /api/student/enrollments
router.get('/enrollments', (req, res) => {
  const studentId = req.user.id;
  const query = `
    SELECT 
      e.id as enrollment_id, c.id, c.title, c.description, u.name as instructor_name, e.enrolled_at,
      (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
      (SELECT COUNT(*) FROM progress p JOIN lessons l ON p.lesson_id = l.id WHERE l.course_id = c.id AND p.student_id = ?) as completed_lessons,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as total_enrolled
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN users u ON c.instructor_id = u.id
    WHERE e.student_id = ?
  `;
  db.all(query, [studentId, studentId], (err, courses) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    
    const coursesWithProgress = courses.map(course => {
      const percentage = course.total_lessons > 0 
        ? Math.round((course.completed_lessons / course.total_lessons) * 100) 
        : 0;
      return { ...course, progress_percentage: percentage };
    });
    
    res.json(coursesWithProgress);
  });
});

// @route POST /api/student/enrollments/:enrollmentId/delete
// @desc Fail-safe unenrollment using POST
router.post('/enrollments/:enrollmentId/delete', (req, res) => {
    const enrollmentId = req.params.enrollmentId;
    const studentId = req.user.id;
    
    logUnenroll(`POST Request - Enrollment: ${enrollmentId}, Student: ${studentId}`);

    db.get('SELECT course_id FROM enrollments WHERE id = ? AND student_id = ?', [enrollmentId, studentId], (err, row) => {
        if (err) {
            logUnenroll(`DB Error fetching enrollment: ${err.message}`);
            return res.status(500).json({ message: 'DB Error' });
        }
        if (!row) {
            logUnenroll(`Enrollment not found for student ${studentId}`);
            return res.status(404).json({ message: 'Enrollment record not found' });
        }

        const courseId = row.course_id;
        db.run('DELETE FROM enrollments WHERE id = ?', [enrollmentId], function(delErr) {
            if (delErr) {
                logUnenroll(`Delete error: ${delErr.message}`);
                return res.status(500).json({ message: 'Failed to delete' });
            }
            
            logUnenroll(`Deleted successfully. Changes: ${this.changes}`);
            
            // Clean up progress
            db.run('DELETE FROM progress WHERE student_id = ? AND lesson_id IN (SELECT id FROM lessons WHERE course_id = ?)', [studentId, courseId], (pErr) => {
                res.json({ message: 'Successfully unenrolled' });
            });
        });
    });
});

// @route DELETE /api/student/enrollments/:enrollmentId
router.delete('/enrollments/:enrollmentId', (req, res) => {
  const enrollmentId = req.params.enrollmentId;
  const studentId = req.user.id;

  logUnenroll(`DELETE Request - Enrollment: ${enrollmentId}, Student: ${studentId}`);

  db.get('SELECT course_id FROM enrollments WHERE id = ? AND student_id = ?', [enrollmentId, studentId], (err, row) => {
    if (err || !row) return res.status(404).json({ message: 'Enrollment not found' });
    
    const courseId = row.course_id;
    db.run('DELETE FROM enrollments WHERE id = ?', [enrollmentId], function(err) {
      if (err) return res.status(500).json({ message: 'Failed to unenroll' });
      
      db.run('DELETE FROM progress WHERE student_id = ? AND lesson_id IN (SELECT id FROM lessons WHERE course_id = ?)', [studentId, courseId], (pErr) => {
        res.json({ message: 'Successfully unenrolled' });
      });
    });
  });
});

// @route POST /api/student/courses/:courseId/enroll
router.post('/courses/:courseId/enroll', (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.id;

  db.get('SELECT id FROM courses WHERE id = ?', [courseId], (err, course) => {
    if (err || !course) return res.status(404).json({ message: 'Course not found' });

    db.run(
      'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
      [studentId, courseId],
      function (err) {
        if (err) return res.status(500).json({ message: 'Failed to enroll' });
        res.json({ message: 'Successfully enrolled', id: this.lastID });
      }
    );
  });
});

// @route GET /api/student/courses/:courseId
router.get('/courses/:courseId', (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.id;

  db.get('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, courseId], (err, enrollment) => {
    if (err || !enrollment) return res.status(403).json({ message: 'Not enrolled' });

    db.get('SELECT * FROM courses WHERE id = ?', [courseId], (err, course) => {
      db.all('SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC', [courseId], (err, lessons) => {
        db.all('SELECT lesson_id FROM progress WHERE student_id = ? AND lesson_id IN (SELECT id FROM lessons WHERE course_id = ?)', [studentId, courseId], (err, progressRows) => {
          const completedLessonIds = progressRows.map(row => row.lesson_id);
          const lessonsWithProgress = lessons.map(lesson => ({
            ...lesson,
            is_completed: completedLessonIds.includes(lesson.id)
          }));
          const progress_percentage = lessons.length > 0 ? Math.round((completedLessonIds.length / lessons.length) * 100) : 0;
          res.json({ course: { ...course, progress_percentage }, lessons: lessonsWithProgress });
        });
      });
    });
  });
});

// @route GET /api/student/courses/:courseId/public
router.get('/courses/:courseId/public', (req, res) => {
  const { courseId } = req.params;
  db.get('SELECT c.*, u.name as instructor_name FROM courses c JOIN users u ON c.instructor_id = u.id WHERE c.id = ?', [courseId], (err, course) => {
    if (err || !course) return res.status(404).json({ message: 'Course not found' });
    db.all('SELECT title, type, order_index FROM lessons WHERE course_id = ? ORDER BY order_index ASC', [courseId], (err, lessons) => {
      res.json({ course, lessons });
    });
  });
});

// @route POST /api/student/lessons/:lessonId/complete
router.post('/lessons/:lessonId/complete', (req, res) => {
  const { lessonId } = req.params;
  const studentId = req.user.id;
  db.run('INSERT INTO progress (student_id, lesson_id) VALUES (?, ?)', [studentId, lessonId], (err) => {
    if (err) return res.status(500).json({ message: 'Failed to mark complete' });
    res.json({ message: 'Completed' });
  });
});

// @route GET /api/student/lessons/:lessonId/quizzes
router.get('/lessons/:lessonId/quizzes', (req, res) => {
  const { lessonId } = req.params;
  db.all('SELECT id, question, options FROM quizzes WHERE lesson_id = ?', [lessonId], (err, rows) => {
    res.json(rows.map(row => ({ ...row, options: JSON.parse(row.options) })));
  });
});

// @route POST /api/student/lessons/:lessonId/quizzes/check
router.post('/lessons/:lessonId/quizzes/check', (req, res) => {
  const { lessonId } = req.params;
  const { answers } = req.body;
  db.all('SELECT id, correct_answer FROM quizzes WHERE lesson_id = ?', [lessonId], (err, rows) => {
    let score = 0;
    const results = rows.map(row => {
      const isCorrect = answers[row.id] === row.correct_answer;
      if (isCorrect) score++;
      return { quizId: row.id, isCorrect, correctAnswer: row.correct_answer };
    });
    res.json({ score, total: rows.length, results });
  });
});

// @route POST /api/student/doubts
router.post('/doubts', (req, res) => {
  const { courseId, lessonId, question } = req.body;
  const studentId = req.user.id;
  db.run('INSERT INTO doubts (student_id, course_id, lesson_id, question) VALUES (?, ?, ?, ?)', [studentId, courseId, lessonId, question], (err) => {
    if (err) return res.status(500).json({ message: 'Failed' });
    res.json({ message: 'Success' });
  });
});

// @route GET /api/student/doubts
router.get('/doubts', (req, res) => {
  const studentId = req.user.id;
  db.all('SELECT d.*, c.title as course_title FROM doubts d JOIN courses c ON d.course_id = c.id WHERE d.student_id = ? ORDER BY d.created_at DESC', [studentId], (err, rows) => {
    res.json(rows);
  });
});

// @route POST /api/student/ai/practice
router.post('/ai/practice', (req, res) => {
  const { content, title } = req.body;
  const keywords = content?.match(/\b(\w{6,})\b/g) || ["concept"];
  const uniqueKeywords = [...new Set(keywords)].slice(0, 5);
  const mock = uniqueKeywords.map(kw => ({
    question: `Practice: What is the role of ${kw}?`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    correct_answer: "Option A"
  }));
  res.json(mock);
});

module.exports = router;
