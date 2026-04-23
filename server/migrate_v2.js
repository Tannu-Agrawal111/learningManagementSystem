const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  // Update users table
  const userColumns = [
    { name: 'bio', type: 'TEXT' },
    { name: 'experience', type: 'TEXT' },
    { name: 'upi_id', type: 'TEXT' },
    { name: 'qr_code', type: 'TEXT' },
    { name: 'bank_account', type: 'TEXT' },
    { name: 'ifsc_code', type: 'TEXT' }
  ];

  userColumns.forEach(col => {
    db.run(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`, (err) => {
      if (err) console.log(`Column ${col.name} might already exist or error:`, err.message);
      else console.log(`Added column ${col.name} to users`);
    });
  });

  // Update courses table
  db.run(`ALTER TABLE courses ADD COLUMN benefits TEXT`, (err) => {
    if (err) console.log(`Column benefits might already exist or error:`, err.message);
    else console.log(`Added column benefits to courses`);
  });
});

db.close();
