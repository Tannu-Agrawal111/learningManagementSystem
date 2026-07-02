const fs = require('fs');
const path = require('path');

const clientSrcDir = path.join(__dirname, '..', 'client', 'src');

function walkDir(currentPath) {
  const files = fs.readdirSync(currentPath);
  for (const file of files) {
    const fullPath = path.join(currentPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.tsx') || file.endsWith('.ts'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Match single-quoted strings starting with http://localhost:5000
      const singleQuoteRegex = /'http:\/\/localhost:5000([^']*)'/g;
      if (singleQuoteRegex.test(content)) {
        content = content.replace(singleQuoteRegex, (match, path) => {
          return `\`\${window.API_BASE_URL || 'http://localhost:5000'}${path}\``;
        });
        changed = true;
      }

      // Match double-quoted strings starting with http://localhost:5000
      const doubleQuoteRegex = /"http:\/\/localhost:5000([^"]*)"/g;
      if (doubleQuoteRegex.test(content)) {
        content = content.replace(doubleQuoteRegex, (match, path) => {
          return `\`\${window.API_BASE_URL || 'http://localhost:5000'}${path}\``;
        });
        changed = true;
      }

      // Match template literals (backticks) starting with http://localhost:5000
      const templateLiteralRegex = /`http:\/\/localhost:5000([^`]*)`/g;
      if (templateLiteralRegex.test(content)) {
        content = content.replace(templateLiteralRegex, (match, path) => {
          return `\`\${window.API_BASE_URL || 'http://localhost:5000'}${path}\``;
        });
        changed = true;
      }

      if (changed) {
        console.log(`Updated endpoints in: ${fullPath}`);
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

console.log('Starting migration to dynamic API endpoints...');
walkDir(clientSrcDir);
console.log('Migration completed successfully.');
