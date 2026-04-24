const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'database.sqlite'); // Go up one level
const db = new sqlite3.Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Tables found:");
    rows.forEach(row => console.log(`- ${row.name}`));
    
    if (rows.find(r => r.name === 'users')) {
        db.all("PRAGMA table_info(users)", (err, cols) => {
            console.log("\nUsers Table Columns:");
            cols.forEach(c => console.log(`- ${c.name}`));
            db.close();
        });
    } else {
        console.log("Users table not found!");
        db.close();
    }
});
