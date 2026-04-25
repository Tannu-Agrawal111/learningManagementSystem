const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, instructorMiddleware } = require('../middleware/auth');

// All routes in this file require authentication and instructor role
router.use(authMiddleware);

// Public route - MUST BE ABOVE instructorMiddleware so students can access it
// @route GET /api/instructor/public/:instructorId
router.get('/public/:instructorId', (req, res) => {
    const { instructorId } = req.params;
    db.get('SELECT id, name, bio, headline, experience, avatar, upi_id, qr_code, bank_account, ifsc_code FROM users WHERE id = ? AND role = "instructor"', [instructorId], (err, instructor) => {
        if (err || !instructor) return res.status(404).json({ message: 'Instructor not found' });
        
        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM courses WHERE instructor_id = ?) as total_courses,
                (SELECT COUNT(*) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.instructor_id = ?) as total_students
        `;
        
        db.get(statsQuery, [instructorId, instructorId], (err, stats) => {
            db.all('SELECT id, title, description, average_rating, total_ratings FROM courses WHERE instructor_id = ?', [instructorId], (err, courses) => {
                res.json({ instructor: { ...instructor, ...stats }, courses });
            });
        });
    });
});

router.use(instructorMiddleware);

// @route GET /api/instructor/courses
// @desc Get ALL courses (Global Catalog for Instructors)
router.get('/courses', (req, res) => {
  const query = `
    SELECT 
      c.*,
      u.name as instructor_name,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as total_students,
      (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons
    FROM courses c
    JOIN users u ON c.instructor_id = u.id
  `;

  db.all(query, [], (err, courses) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(courses);
  });
});

// @route POST /api/instructor/courses
// @desc Create a new course
router.post('/courses', (req, res) => {
  const { title, description, benefits } = req.body;
  const instructorId = req.user.id;

  if (!title) return res.status(400).json({ message: 'Course title is required' });

  const courseBenefits = Array.isArray(benefits) ? JSON.stringify(benefits) : '[]';

  db.run(
    'INSERT INTO courses (instructor_id, title, description, is_paid, price, benefits) VALUES (?, ?, ?, ?, ?, ?)',
    [instructorId, title, description, 0, 0, courseBenefits],
    function (err) {
      if (err) return res.status(500).json({ message: 'Failed to create course' });
      res.json({ id: this.lastID, instructor_id: instructorId, title, description, is_paid: 0, price: 0, benefits: courseBenefits });
    }
  );
});

// @route POST /api/instructor/courses/:courseId/edit
// @desc Update a course (Edit)
router.post('/courses/:courseId/edit', (req, res) => {
  const { courseId } = req.params;
  const { title, description, benefits } = req.body;
  const instructorId = req.user.id;

  const courseBenefits = Array.isArray(benefits) ? JSON.stringify(benefits) : '[]';

  db.run(
    'UPDATE courses SET title = ?, description = ?, benefits = ? WHERE id = ? AND instructor_id = ?',
    [title, description, courseBenefits, courseId, instructorId],
    function (err) {
      if (err) return res.status(500).json({ message: 'Failed to update course' });
      res.json({ message: 'Course updated successfully' });
    }
  );
});

// @route GET /api/instructor/courses/:courseId/lessons
// @desc Get all lessons for a specific course
router.get('/courses/:courseId/lessons', (req, res) => {
  const { courseId } = req.params;
  db.all('SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC', [courseId], (err, lessons) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(lessons);
  });
});

// @route POST /api/instructor/courses/:courseId/lessons
// @desc Add a new lesson to a course
router.post('/courses/:courseId/lessons', (req, res) => {
  const { courseId } = req.params;
  const { title, content, type, url, order_index, resources, is_preview } = req.body;

  db.run(
    'INSERT INTO lessons (course_id, title, content, type, url, order_index, resources, is_preview) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [courseId, title, content, type || 'text', url, order_index, resources || '[]', is_preview ? 1 : 0],
    function (err) {
      if (err) return res.status(500).json({ message: 'Failed to create lesson' });
      res.json({ id: this.lastID, course_id: courseId, title, content, type: type || 'text', url, order_index, resources: resources || '[]', is_preview: is_preview ? 1 : 0 });
    }
  );
});

// @route PUT /api/instructor/lessons/:lessonId
// @desc Update a lesson (Edit)
router.put('/lessons/:lessonId', (req, res) => {
  const { lessonId } = req.params;
  const { title, content, type, url, resources, is_preview } = req.body;
  
  db.run(
    'UPDATE lessons SET title = ?, content = ?, type = ?, url = ?, resources = ?, is_preview = ? WHERE id = ?',
    [title, content, type, url, resources || '[]', is_preview ? 1 : 0, lessonId],
    function(err) {
      if (err) return res.status(500).json({ message: 'Failed to update lesson' });
      res.json({ message: 'Lesson updated successfully' });
    }
  );
});

// @route PATCH /api/instructor/lessons/:lessonId/preview
// @desc Toggle preview flag on a lesson
router.patch('/lessons/:lessonId/preview', (req, res) => {
  const { lessonId } = req.params;
  const { is_preview } = req.body;
  db.run(
    'UPDATE lessons SET is_preview = ? WHERE id = ?',
    [is_preview ? 1 : 0, lessonId],
    function(err) {
      if (err) return res.status(500).json({ message: 'Failed to update preview' });
      res.json({ message: 'Preview updated' });
    }
  );
});

// @route DELETE /api/instructor/lessons/:lessonId
// @desc Delete a lesson
router.delete('/lessons/:lessonId', (req, res) => {
  const { lessonId } = req.params;
  db.run('DELETE FROM lessons WHERE id = ?', [lessonId], (err) => {
    if (err) return res.status(500).json({ message: 'Failed to delete lesson' });
    res.json({ message: 'Lesson deleted' });
  });
});

// @route POST /api/instructor/lessons/:lessonId/quizzes
// @desc Add a quiz to a lesson
router.post('/lessons/:lessonId/quizzes', (req, res) => {
  const { lessonId } = req.params;
  const { question, options, correct_answer } = req.body;
  db.run(
    'INSERT INTO quizzes (lesson_id, question, options, correct_answer) VALUES (?, ?, ?, ?)',
    [lessonId, question, JSON.stringify(options), correct_answer],
    function (err) {
      if (err) return res.status(500).json({ message: 'Failed to add quiz' });
      res.json({ id: this.lastID, lessonId, question, options, correct_answer });
    }
  );
});

// @route GET /api/instructor/lessons/:lessonId/quizzes
router.get('/lessons/:lessonId/quizzes', (req, res) => {
  const { lessonId } = req.params;
  db.all('SELECT * FROM quizzes WHERE lesson_id = ?', [lessonId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    const quizzes = rows.map(row => ({ ...row, options: JSON.parse(row.options) }));
    res.json(quizzes);
  });
});

// @route DELETE /api/instructor/lessons/:lessonId/quizzes/:quizId
router.delete('/lessons/:lessonId/quizzes/:quizId', (req, res) => {
  const { quizId } = req.params;
  db.run('DELETE FROM quizzes WHERE id = ?', [quizId], (err) => {
    if (err) return res.status(500).json({ message: 'Failed to delete quiz' });
    res.json({ message: 'Quiz deleted' });
  });
});

// @route GET /api/instructor/courses/:courseId/analytics
router.get('/courses/:courseId/analytics', (req, res) => {
  const { courseId } = req.params;
  const query = `
    SELECT u.name, 
           (SELECT COUNT(*) FROM progress p JOIN lessons l ON p.lesson_id = l.id WHERE l.course_id = ? AND p.student_id = u.id) as completed,
           (SELECT COUNT(*) FROM lessons WHERE course_id = ?) as total
    FROM users u
    JOIN enrollments e ON u.id = e.student_id
    WHERE e.course_id = ?
  `;
  db.all(query, [courseId, courseId, courseId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows.map(row => ({ name: row.name, percentage: row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0 })));
  });
});

// @route GET /api/instructor/courses/:courseId/students
router.get('/courses/:courseId/students', (req, res) => {
  const { courseId } = req.params;
  const query = `
    SELECT u.id, u.name, u.email, e.enrolled_at
    FROM users u
    JOIN enrollments e ON u.id = e.student_id
    WHERE e.course_id = ?
  `;
  db.all(query, [courseId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

// @route GET /api/instructor/doubts
router.get('/doubts', (req, res) => {
  const instructorId = req.user.id;
  const query = `
    SELECT d.*, u.name as student_name, c.title as course_title, l.title as lesson_title
    FROM doubts d
    JOIN users u ON d.student_id = u.id
    JOIN courses c ON d.course_id = c.id
    LEFT JOIN lessons l ON d.lesson_id = l.id
    WHERE c.instructor_id = ?
    ORDER BY d.created_at DESC
  `;
  db.all(query, [instructorId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

// @route POST /api/instructor/doubts/:doubtId/answer
router.post('/doubts/:doubtId/answer', (req, res) => {
  const { doubtId } = req.params;
  const { answer } = req.body;
  db.run('UPDATE doubts SET answer = ? WHERE id = ?', [answer, doubtId], (err) => {
    if (err) return res.status(500).json({ message: 'Failed to save answer' });
    res.json({ message: 'Answered successfully' });
  });
});

// @route DELETE /api/instructor/courses/:courseId
// @desc TASK 6: Delete a course with enrollment rules
router.delete('/courses/:courseId', (req, res) => {
    const { courseId } = req.params;
    const instructorId = req.user.id;

    db.get('SELECT id FROM courses WHERE id = ? AND instructor_id = ?', [courseId, instructorId], (err, row) => {
        if (err || !row) return res.status(404).json({ message: 'Course not found' });

        db.serialize(() => {
            db.run('DELETE FROM lessons WHERE course_id = ?', [courseId]);
            db.run('DELETE FROM enrollments WHERE course_id = ?', [courseId]);
            db.run('DELETE FROM courses WHERE id = ?', [courseId], function(err) {
                if (err) return res.status(500).json({ message: 'Delete failed' });
                res.json({ message: 'Course deleted successfully' });
            });
        });
    });
});

// @route GET /api/instructor/activity
// @desc  Get student engagement trends
router.get('/activity', authMiddleware, (req, res) => {
    const instructorId = req.user.id;
    // Simple aggregation of enrollments by date as a proxy for activity
    const query = `
      SELECT date(enrolled_at) as date, COUNT(*) as count 
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE c.instructor_id = ?
      GROUP BY date(enrolled_at)
      ORDER BY date ASC
      LIMIT 14
    `;
    db.all(query, [instructorId], (err, rows) => {
      if (err) return res.status(500).json({ message: 'DB Error' });
      res.json(rows);
    });
});


// @route POST /api/instructor/ai/generate-quiz
router.post('/ai/generate-quiz', (req, res) => {
  const { content, title } = req.body;
  if (!content) return res.status(400).json({ message: 'Content is required' });

  const keywords = content.match(/\b(\w{6,})\b/g) || ["concept", "method", "process", "outcome", "framework"];
  const uniqueKeywords = [...new Set(keywords)].slice(0, 15);
  
  const questionTypes = [
    (kw) => ({
      question: `Which of the following best describes the role of "${kw}" in "${title}"?`,
      options: [
        `It serves as a primary driver for organizational efficiency.`,
        `It acts as a secondary support mechanism for legacy systems.`,
        `It is a critical component for ensuring structural integrity.`,
        `It represents a theoretical model with limited practical application.`
      ],
      correct_answer: `It is a critical component for ensuring structural integrity.`
    }),
    (kw) => ({
      question: `How does "${kw}" interact with other core elements within this module?`,
      options: [
        `By creating a modular interface for data exchange.`,
        `Through a centralized command and control structure.`,
        `Via an asynchronous communication protocol.`,
        `It operates independently without any direct interaction.`
      ],
      correct_answer: `By creating a modular interface for data exchange.`
    }),
    (kw) => ({
      question: `What is the most significant challenge when implementing "${kw}"?`,
      options: [
        `Ensuring compatibility with older software versions.`,
        `Maintaining high performance under heavy load conditions.`,
        `Scaling the infrastructure to meet growing user demands.`,
        `Allocating sufficient resources for long-term maintenance.`
      ],
      correct_answer: `Maintaining high performance under heavy load conditions.`
    }),
    (kw) => ({
        question: `In "${title}", what would be the result of omitting "${kw}"?`,
        options: [
          `Increased flexibility at the cost of stability.`,
          `Complete failure of the system's primary functions.`,
          `Marginal improvement in overall processing speed.`,
          `No significant impact on the final outcome.`
        ],
        correct_answer: `Complete failure of the system's primary functions.`
      })
  ];

  const mockQuizzes = Array.from({ length: 10 }).map((_, i) => {
    const kw = uniqueKeywords[i % uniqueKeywords.length] || "core concept";
    const typeFn = questionTypes[i % questionTypes.length];
    const q = typeFn(kw);
    // TASK 12: Ensure structured validation
    return {
        ...q,
        options: q.options,
        correct_answer: q.correct_answer
    };
  });

  setTimeout(() => res.json(mockQuizzes), 1500);
});

module.exports = router;
