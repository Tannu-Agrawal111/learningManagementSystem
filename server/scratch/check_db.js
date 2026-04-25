const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../database.sqlite'); // Corrected path
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, name, email, upi_id, qr_code, bank_account, ifsc_code FROM users WHERE role='instructor'", [], (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log(JSON.stringify(rows, null, 2));
  }
  db.close();
});
