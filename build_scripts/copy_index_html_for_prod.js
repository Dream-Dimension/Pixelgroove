const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../dist', '/index.html');
const destPath = path.join(__dirname, '../index.html');

// Copy file
fs.copyFileSync(srcPath, destPath);

// Read and replace content
let content = fs.readFileSync(destPath, 'utf8');
content = content.replace('renderer.js', './dist/renderer.js');
fs.writeFileSync(destPath, content);

// We need to do this so npm run make works, unless we can configure it to look inside of dist/ directly