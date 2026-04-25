const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const instructorMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'instructor') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied, instructor only' });
  }
};

const enrollmentMiddleware = (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  db.get('SELECT instructor_id FROM courses WHERE id = ?', [courseId], (err, course) => {
    if (err || !course) return res.status(404).json({ message: 'Course not found' });
    
    if (course.instructor_id === userId || req.user.role === 'admin') {
      return next(); 
    }

    db.get('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?', [userId, courseId], (err, enrollment) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (!enrollment) return res.status(403).json({ message: 'You must enroll in this course to access it.' });
      next();
    });
  });
};

module.exports = { authMiddleware, instructorMiddleware, enrollmentMiddleware };
