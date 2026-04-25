const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const email = process.argv[2];

if (!email) {
    console.error('Usage: node make_admin.js <email>');
    process.exit(1);
}

db.run('UPDATE users SET role = "admin" WHERE email = ?', [email], function(err) {
    if (err) {
        console.error('Error:', err.message);
    } else if (this.changes === 0) {
        console.error('User not found with email:', email);
    } else {
        console.log(`Successfully promoted ${email} to admin.`);
    }
    db.close();
});
