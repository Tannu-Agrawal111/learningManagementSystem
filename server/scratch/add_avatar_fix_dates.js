// Migration: Add avatar column + fix created_at for existing users
const db = require('../db');

db.serialize(() => {
  // Add avatar column (base64 string)
  db.run(`ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT ''`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Avatar column error:', err.message);
    } else {
      console.log('✓ avatar column ready');
    }
  });

  // Set created_at to now for any user that has the hardcoded placeholder
  db.run(`UPDATE users SET created_at = datetime('now') WHERE created_at = '2024-01-01' OR created_at IS NULL OR created_at = ''`, (err) => {
    if (err) {
      console.error('created_at fix error:', err.message);
    } else {
      console.log('✓ created_at corrected for existing users');
    }
  });

  console.log('Migration complete.');
});
