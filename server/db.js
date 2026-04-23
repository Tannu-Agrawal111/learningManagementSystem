const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK( role IN ('instructor', 'student') ) NOT NULL DEFAULT 'student'
    )`);

    // Courses table
    db.run(`CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instructor_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY (instructor_id) REFERENCES users (id)
    )`);

    // Lessons table - updated to support multiple content types
    db.run(`CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT, -- Text content or description
      type TEXT CHECK( type IN ('text', 'video', 'pdf', 'test') ) NOT NULL DEFAULT 'text',
      url TEXT, -- URL for video/pdf
      order_index INTEGER NOT NULL,
      FOREIGN KEY (course_id) REFERENCES courses (id)
    )`);

    // Ratings table
    db.run(`CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      review TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses (id),
      FOREIGN KEY (student_id) REFERENCES users (id),
      UNIQUE(course_id, student_id)
    )`);

    // Enrollments table
    db.run(`CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users (id),
      FOREIGN KEY (course_id) REFERENCES courses (id),
      UNIQUE(student_id, course_id)
    )`);

    // Progress table
    db.run(`CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users (id),
      FOREIGN KEY (lesson_id) REFERENCES lessons (id),
      UNIQUE(student_id, lesson_id)
    )`);

    // Quizzes table
    db.run(`CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL, -- JSON string of options
      correct_answer TEXT NOT NULL,
      FOREIGN KEY (lesson_id) REFERENCES lessons (id)
    )`);

    // Doubts table
    db.run(`CREATE TABLE IF NOT EXISTS doubts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      lesson_id INTEGER,
      question TEXT NOT NULL,
      answer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users (id),
      FOREIGN KEY (course_id) REFERENCES courses (id),
      FOREIGN KEY (lesson_id) REFERENCES lessons (id)
    )`);

    console.log('Database tables initialized.');
  });
}

module.exports = db;
