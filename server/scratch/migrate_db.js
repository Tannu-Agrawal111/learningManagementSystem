const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    db.run('ALTER TABLE lessons ADD COLUMN type TEXT DEFAULT "text"', (err) => {
        if (err) console.log('Type column might already exist or error:', err.message);
        else console.log('Type column added');
    });
    db.run('ALTER TABLE lessons ADD COLUMN url TEXT', (err) => {
        if (err) console.log('Url column might already exist or error:', err.message);
        else console.log('Url column added');
    });
});
db.close();
