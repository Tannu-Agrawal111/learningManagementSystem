const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    db.run('ALTER TABLE lessons ADD COLUMN resources TEXT DEFAULT "[]"', (err) => {
        if (err) console.log('Resources column might already exist or error:', err.message);
        else console.log('Resources column added');
    });
});
db.close();
