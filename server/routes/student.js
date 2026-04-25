const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, enrollmentMiddleware } = require('../middleware/auth');
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
// @desc  Get all courses with enrollment status
router.get('/courses', (req, res) => {
  const studentId = req.user.id;
  const query = `
    SELECT c.id, c.title, c.description, c.average_rating, c.total_ratings, c.instructor_id, u.name as instructor_name,
    (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as total_enrolled,
    (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
    CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END as is_enrolled
    FROM courses c
    JOIN users u ON c.instructor_id = u.id
    LEFT JOIN enrollments e ON c.id = e.course_id AND e.student_id = ?
  `;
  db.all(query, [studentId], (err, courses) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(courses);
  });
});

// @route GET /api/student/enrollments
router.get('/enrollments', (req, res) => {
  const studentId = req.user.id;
  const query = `
    SELECT 
      e.id as enrollment_id, c.id, c.title, c.description, c.instructor_id, u.name as instructor_name, e.enrolled_at,
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
// @desc  Direct enrollment for any course
router.post('/courses/:courseId/enroll', (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.id;

  db.get('SELECT id FROM courses WHERE id = ?', [courseId], (err, course) => {
    if (err || !course) return res.status(404).json({ message: 'Course not found' });

    db.run(
      'INSERT OR IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)',
      [studentId, courseId],
      function (err) {
        if (err) return res.status(500).json({ message: 'Failed to enroll' });
        res.json({ message: 'Successfully enrolled', id: this.lastID });
      }
    );
  });
});

// @route GET /api/student/courses/:courseId
// @desc  Get full course data (enrolled students only + payment check)
router.get('/courses/:courseId', enrollmentMiddleware, (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.id;

  db.get('SELECT * FROM courses WHERE id = ?', [courseId], (err, course) => {
    if (err || !course) return res.status(404).json({ message: 'Course not found' });

    const isInstructor = req.user.role === 'instructor';
    const isOwner = isInstructor && course.instructor_id === req.user.id;
    const isFree = course.is_paid === 0;
    
    // Check enrollment
    db.get('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, courseId], (err, enrollment) => {
      // Access allowed if:
      // 1. User is the owner
      // 2. User is an instructor (all free now)
      // 3. User is an enrolled student
      const hasAccess = isOwner || isInstructor || enrollment;

      if (!hasAccess) {
        return res.status(403).json({ message: 'Not enrolled' });
      }

      fetchFullData();

      function fetchFullData() {
        db.all('SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC', [courseId], (err, lessons) => {
          db.all('SELECT lesson_id FROM progress WHERE student_id = ? AND lesson_id IN (SELECT id FROM lessons WHERE course_id = ?)', [studentId, courseId], (err, progressRows) => {
            const completedLessonIds = progressRows.map(row => row.lesson_id);
            const lessonsWithProgress = lessons.map(lesson => ({
              ...lesson,
              is_completed: completedLessonIds.includes(lesson.id)
            }));
            const progress_percentage = lessons.length > 0 ? Math.round((completedLessonIds.length / lessons.length) * 100) : 0;
            
            // Get user's rating for this course
            db.get('SELECT rating FROM ratings WHERE course_id = ? AND student_id = ?', [courseId, studentId], (rErr, userRating) => {
              res.json({ 
                course: { ...course, progress_percentage }, 
                lessons: lessonsWithProgress,
                userRating: userRating ? userRating.rating : null
              });
            });
          });
        });
      }
    });
  });
});

// @route GET /api/student/courses/:courseId/public
// @desc  Public view — shows course details and all lesson titles
router.get('/courses/:courseId/public', (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.id;

  db.get(
    `SELECT c.*, u.name as instructor_name,
     (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as total_enrolled
     FROM courses c JOIN users u ON c.instructor_id = u.id WHERE c.id = ?`,
    [courseId],
    (err, course) => {
      if (err || !course) return res.status(404).json({ message: 'Course not found' });

      db.all('SELECT id, title, type, content, url, resources, order_index FROM lessons WHERE course_id = ? ORDER BY order_index ASC', [courseId], (err, lessons) => {
        if (err) return res.status(500).json({ message: 'Database error' });

        res.json({ 
          course, 
          lessons, 
          isPreview: false
        });
      });
    }
  );
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

  const insertDoubt = () => {
    db.run(
      'INSERT INTO doubts (course_id, lesson_id, student_id, question) VALUES (?, ?, ?, ?)',
      [courseId, lessonId || null, studentId, question],
      function (err) {
        if (err) return res.status(500).json({ message: 'Failed to submit doubt' });
        res.json({ message: 'Doubt submitted successfully', id: this.lastID });
      }
    );
  };

  if (req.user.role === 'student') {
    db.get('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, courseId], (err, row) => {
      if (!row) return res.status(403).json({ message: 'Must be enrolled to ask a doubt' });
      insertDoubt();
    });
  } else {
    insertDoubt();
  }
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
  
  // Dynamic Generation Logic
  // We extract meaningful concepts from content and create structured MCQs
  const lines = content?.split('\n').filter(l => l.trim().length > 20) || [title];
  const questions = [];

  // Limit to 5 questions
  const numQuestions = Math.min(5, lines.length);
  
  for(let i = 0; i < numQuestions; i++) {
    const context = lines[i].trim();
    // Simplified "AI" logic: Pick a word to be the answer, replace it with ____
    const words = context.split(' ').filter(w => w.length > 5);
    if (words.length < 1) continue;
    
    const targetWord = words[Math.floor(Math.random() * words.length)].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const questionText = context.replace(new RegExp(`\\b${targetWord}\\b`, 'i'), "__________");
    
    // Generate options
    const options = [targetWord];
    const distractors = ["optimization", "framework", "architecture", "implementation", "methodology", "integration", "configuration", "scalability"];
    
    while(options.length < 4) {
      const d = distractors[Math.floor(Math.random() * distractors.length)];
      if(!options.includes(d)) options.push(d);
    }
    
    // Shuffle options
    const shuffledOptions = options.sort(() => Math.random() - 0.5);
    
    questions.push({
      id: `ai-${i}`,
      question: `Fill in the blank: "${questionText}"`,
      options: shuffledOptions,
      correct_answer: targetWord
    });
  }

  // Fallback if no lines were long enough
  if (questions.length === 0) {
    questions.push({
      id: 'ai-fallback',
      question: `What is the primary focus of "${title}"?`,
      options: ["Theoretical foundations", "Practical application", "Historical context", "Future trends"],
      correct_answer: "Practical application"
    });
  }

  res.json(questions);
});

// @route POST /api/student/courses/:courseId/rate
router.post('/courses/:courseId/rate', (req, res) => {
  const { courseId } = req.params;
  const { rating } = req.body;
  const studentId = req.user.id;

  if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });

  // Check enrollment
  db.get('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, courseId], (err, enrollment) => {
    if (err || !enrollment) return res.status(403).json({ message: 'Only enrolled students can rate' });

    db.run(
      'INSERT INTO ratings (course_id, student_id, rating) VALUES (?, ?, ?) ON CONFLICT(course_id, student_id) DO UPDATE SET rating = excluded.rating',
      [courseId, studentId, rating],
      function (err) {
        if (err) return res.status(500).json({ message: 'Failed to save rating' });

        // Recalculate average rating
        db.get('SELECT AVG(rating) as avg, COUNT(*) as count FROM ratings WHERE course_id = ?', [courseId], (err, stats) => {
          if (!err) {
            db.run('UPDATE courses SET average_rating = ?, total_ratings = ? WHERE id = ?', [stats.avg, stats.count, courseId]);
          }
          res.json({ message: 'Rating saved', averageRating: stats.avg, totalRatings: stats.count });
        });
      }
    );
  });
});

// @route GET /api/student/activity
router.get('/activity', (req, res) => {
  const studentId = req.user.id;
  const query = `
    SELECT date(completed_at) as date, COUNT(*) as count 
    FROM progress 
    WHERE student_id = ? 
    GROUP BY date(completed_at) 
    ORDER BY date ASC 
    LIMIT 30
  `;
  db.all(query, [studentId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

// @route GET /api/student/lessons/:lessonId/chats
router.get('/lessons/:lessonId/chats', (req, res) => {
  const { lessonId } = req.params;
  db.all('SELECT c.*, u.name as user_name FROM chats c JOIN users u ON c.user_id = u.id WHERE c.lesson_id = ? ORDER BY c.created_at ASC', [lessonId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error fetching chats' });
    res.json(rows);
  });
});

// @route POST /api/student/lessons/:lessonId/chats
router.post('/lessons/:lessonId/chats', (req, res) => {
  const { lessonId } = req.params;
  const { message } = req.body;
  const userId = req.user.id;

  const insertChat = () => {
    db.run('INSERT INTO chats (lesson_id, user_id, message) VALUES (?, ?, ?)', [lessonId, userId, message], function(err) {
      if (err) return res.status(500).json({ message: 'Error sending message' });
      db.get('SELECT c.*, u.name as user_name FROM chats c JOIN users u ON c.user_id = u.id WHERE c.id = ?', [this.lastID], (err, row) => {
        res.json(row);
      });
    });
  };

  if (req.user.role === 'student') {
    db.get('SELECT course_id FROM lessons WHERE id = ?', [lessonId], (err, lesson) => {
      if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
      db.get('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?', [userId, lesson.course_id], (err, row) => {
        if (!row) return res.status(403).json({ message: 'Must be enrolled to chat' });
        insertChat();
      });
    });
  } else {
    // Instructors can chat anywhere
    insertChat();
  }
});

module.exports = router;
