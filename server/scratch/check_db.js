const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    db.all("PRAGMA table_info(lessons)", (err, rows) => {
        console.log('LESSONS_COLUMNS:', JSON.stringify(rows));
    });
    db.all("PRAGMA table_info(enrollments)", (err, rows) => {
        console.log('ENROLLMENTS_COLUMNS:', JSON.stringify(rows));
    });
    db.all("SELECT * FROM enrollments LIMIT 5", (err, rows) => {
        console.log('ENROLLMENTS_DATA:', JSON.stringify(rows));
    });
});
db.close();
