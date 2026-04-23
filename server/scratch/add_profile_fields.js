// Migration: Add created_at to users table with a safe default
const db = require('../db');

db.serialize(() => {
  db.run(`ALTER TABLE users ADD COLUMN created_at TEXT DEFAULT '2024-01-01'`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Migration error:', err.message);
    } else {
      console.log('created_at column added (or already exists).');
    }
  });
});
