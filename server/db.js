const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.NODE_ENV === 'production' 
  ? '/tmp/database.sqlite' 
  : path.join(__dirname, 'database.sqlite');
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
      role TEXT CHECK( role IN ('instructor', 'student', 'admin') ) NOT NULL DEFAULT 'student',
      kyc_status TEXT CHECK( kyc_status IN ('none', 'pending', 'verified', 'rejected') ) DEFAULT 'none',
      kyc_remarks TEXT
    )`);

    // Courses table
    db.run(`CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instructor_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      is_paid INTEGER DEFAULT 0,
      price REAL DEFAULT 0,
      average_rating REAL DEFAULT 0,
      total_ratings INTEGER DEFAULT 0,
      benefits TEXT DEFAULT '[]',
      FOREIGN KEY (instructor_id) REFERENCES users (id)
    )`);

    // Lessons table - updated to support multiple content types + preview flag
    db.run(`CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      type TEXT CHECK( type IN ('text', 'video', 'pdf', 'test') ) NOT NULL DEFAULT 'text',
      url TEXT,
      order_index INTEGER NOT NULL,
      resources TEXT DEFAULT '[]',
      is_preview INTEGER DEFAULT 0,
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

      // Lecture progress table for granular tracking
      db.run(`CREATE TABLE IF NOT EXISTS lecture_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        lecture_id INTEGER NOT NULL,
        completed INTEGER DEFAULT 0,
        last_position_seconds INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (lecture_id) REFERENCES lessons (id),
        UNIQUE(user_id, lecture_id)
      )`);

      // Certificates table to store claimed credentials
      db.run(`CREATE TABLE IF NOT EXISTS certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        uuid TEXT NOT NULL,
        pdf_url TEXT,
        claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (course_id) REFERENCES courses (id)
      )`);

    // Quizzes table
    db.run(`CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      FOREIGN KEY (lesson_id) REFERENCES lessons (id)
    )`);

      // Assessment submissions table (stores answers and proctoring incidents)
      db.run(`CREATE TABLE IF NOT EXISTS assessment_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assessment_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        answers TEXT,
        incidents TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        score INTEGER DEFAULT 0,
        status TEXT DEFAULT 'in-progress',
        FOREIGN KEY (assessment_id) REFERENCES assessments (id),
        FOREIGN KEY (student_id) REFERENCES users (id)
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

    // Chats table for lesson-specific real-time discussion
    db.run(`CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lesson_id) REFERENCES lessons (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Payments table to record transactions
    db.run(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      instructor_id INTEGER NOT NULL,
      course_id INTEGER,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      status TEXT CHECK( status IN ('pending','succeeded','failed') ) DEFAULT 'pending',
      stripe_session_id TEXT,
      pdf_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users (id),
      FOREIGN KEY (instructor_id) REFERENCES users (id),
      FOREIGN KEY (course_id) REFERENCES courses (id)
    )`, (err) => {});
    // Payments migration for existing DB
    db.run(`ALTER TABLE payments ADD COLUMN stripe_session_id TEXT`, (err) => {});
    runMigrations();

    console.log('Database tables initialized.');
  });
}

function runMigrations() {
  db.serialize(() => {
    // Add is_paid to courses if missing
    db.run(`ALTER TABLE courses ADD COLUMN is_paid INTEGER DEFAULT 0`, (err) => {});
    db.run(`ALTER TABLE courses ADD COLUMN price REAL DEFAULT 0`, (err) => {});
    db.run(`ALTER TABLE courses ADD COLUMN average_rating REAL DEFAULT 0`, (err) => {});
    db.run(`ALTER TABLE courses ADD COLUMN total_ratings INTEGER DEFAULT 0`, (err) => {});
    db.run(`ALTER TABLE courses ADD COLUMN benefits TEXT DEFAULT '[]'`, (err) => {});
    
    // Add is_preview to lessons if missing
    db.run(`ALTER TABLE lessons ADD COLUMN is_preview INTEGER DEFAULT 0`, (err) => {});
    // Add resources to lessons if missing
    db.run(`ALTER TABLE lessons ADD COLUMN resources TEXT DEFAULT '[]'`, (err) => {});

    // Add profile columns to users if missing
    db.run(`ALTER TABLE users ADD COLUMN bio TEXT`, (err) => {});
    db.run(`ALTER TABLE users ADD COLUMN headline TEXT`, (err) => {});
    db.run(`ALTER TABLE users ADD COLUMN experience TEXT`, (err) => {});
    db.run(`ALTER TABLE users ADD COLUMN avatar TEXT`, (err) => {});
    db.run(`ALTER TABLE users ADD COLUMN location TEXT`, (err) => {});
    db.run(`ALTER TABLE users ADD COLUMN website TEXT`, (err) => {});
    db.run(`ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {});

    // Enrollment migration
    db.run(`ALTER TABLE enrollments ADD COLUMN status TEXT CHECK( status IN ('active', 'revoked') ) DEFAULT 'active'`, (err) => {});
  });
}

module.exports = db;
