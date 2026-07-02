const fs = require('fs');
const path = require('path');

const clientSrcDir = path.join(__dirname, '..', 'client', 'src');
const TARGET_URL = 'https://learningmanagementsystem-backend-lms.onrender.com';
const LOCAL_URL = 'http://localhost:5000';

function walkDir(currentPath) {
  const files = fs.readdirSync(currentPath);
  for (const file of files) {
    const fullPath = path.join(currentPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css') || file.endsWith('.html'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(TARGET_URL)) {
        console.log(`Replacing URL in: ${fullPath}`);
        const updatedContent = content.split(TARGET_URL).join(LOCAL_URL);
        fs.writeFileSync(fullPath, updatedContent, 'utf8');
      }
    }
  }
}

console.log('Starting API endpoint replacement to Localhost...');
walkDir(clientSrcDir);
console.log('API endpoint replacement completed successfully.');
