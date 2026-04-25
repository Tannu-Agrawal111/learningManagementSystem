const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../transactions.log');

const logger = {
  info: (message) => {
    const log = `[INFO] [${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(logFile, log);
    console.log(log.trim());
  },
  error: (message, err) => {
    const log = `[ERROR] [${new Date().toISOString()}] ${message} - ${err?.message || err}\n`;
    fs.appendFileSync(logFile, log);
    console.error(log.trim());
  },
  transaction: (type, data) => {
    const log = `[TRANSACTION] [${new Date().toISOString()}] ${type}: ${JSON.stringify(data)}\n`;
    fs.appendFileSync(logFile, log);
  }
};

module.exports = logger;
