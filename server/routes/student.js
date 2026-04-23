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
// @desc  Get all courses with price info and enrollment status
router.get('/courses', (req, res) => {
  const studentId = req.user.id;
  const query = `
    SELECT c.id, c.title, c.description, c.is_paid, c.price, c.average_rating, c.total_ratings, u.name as instructor_name,
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
      e.id as enrollment_id, c.id, c.title, c.description, c.is_paid, c.price, u.name as instructor_name, e.enrolled_at,
      (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
      (SELECT COUNT(*) FROM progress p JOIN lessons l ON p.lesson_id = l.id WHERE l.course_id = c.id AND p.student_id = ?) as completed_lessons,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as total_enrolled
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN users u ON c.instructor_id = u.id
    WHERE e.student_id = ?
    AND (c.is_paid = 0 OR EXISTS (SELECT 1 FROM payments WHERE student_id = e.student_id AND course_id = e.course_id AND status = 'paid'))
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
// @desc  Free enrollment only — paid courses must use /api/payment/verify
router.post('/courses/:courseId/enroll', (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.id;

  db.get('SELECT * FROM courses WHERE id = ?', [courseId], (err, course) => {
    if (err || !course) return res.status(404).json({ message: 'Course not found' });

    if (course.is_paid === 1) {
      return res.status(403).json({ message: 'Payment required. This is a paid course.' });
    }

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
router.get('/courses/:courseId', (req, res) => {
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
      // 2. User is an instructor and course is FREE
      // 3. User is an enrolled student
      const hasAccess = isOwner || (isInstructor && isFree) || enrollment;

      if (!hasAccess) {
        return res.status(403).json({ message: 'Not enrolled' });
      }

      // STRICT PAYMENT CHECK for students in paid courses
      if (!isInstructor && course.is_paid === 1) {
        db.get('SELECT status FROM payments WHERE student_id = ? AND course_id = ? AND status = "paid"', [studentId, courseId], (payErr, payment) => {
          if (payErr || !payment) {
            return res.status(403).json({ message: 'Access denied. Payment required.' });
          }
          fetchFullData();
        });
      } else {
        fetchFullData();
      }

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
// @desc  Public view — shows preview lessons for paid, all titles for free
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

      db.all('SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC', [courseId], (err, allLessons) => {
        if (err) return res.status(500).json({ message: 'Database error' });

        const isInstructor = req.user.role === 'instructor';
        const isOwner = isInstructor && course.instructor_id === req.user.id;
        const isFree = course.is_paid === 0;

        if (isFree || isOwner) {
          // Full access
          return res.json({
            course,
            lessons: allLessons.map(l => ({ ...l, is_preview: 1 })),
            isPreview: false
          });
        }

        // Paid course — compute which lessons are preview
        const markedPreview = allLessons.filter(l => l.is_preview === 1);
        const previewCount = Math.max(1, Math.ceil(allLessons.length * 0.1));
        const autoPreview = allLessons.slice(0, previewCount);
        
        const previewLessons = markedPreview.length > 0 ? markedPreview : autoPreview;
        const previewIds = new Set(previewLessons.map(l => l.id));

        const lessonsForView = allLessons.map(l => {
          const isP = previewIds.has(l.id);
          return {
            id: l.id,
            title: l.title,
            type: l.type,
            order_index: l.order_index,
            is_preview: isP ? 1 : 0,
            content: isP ? l.content : null,
            url: isP ? l.url : null,
            resources: isP ? l.resources : null,
          };
        });

        res.json({ 
          course, 
          lessons: lessonsForView, 
          isPreview: true, 
          previewCount: previewLessons.length 
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

module.exports = router;
