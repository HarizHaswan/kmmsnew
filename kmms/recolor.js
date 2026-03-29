const fs = require('fs');
const path = require('path');

function walk(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      if(file !== 'node_modules' && file !== '.git') walk(p, filelist);
    } else if (p.endsWith('.jsx') || p.endsWith('.js')) {
      filelist.push(p);
    }
  }
  return filelist;
}

const files = walk('./src');
let changedCount = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Pink replacements
  newContent = newContent.replace(/\bpink-600\b/g, 'primary');
  newContent = newContent.replace(/\bpink-700\b/g, 'primary-dark');
  newContent = newContent.replace(/\bpink-500\b/g, 'primary');
  newContent = newContent.replace(/\bpink-100\b/g, 'primary-light');
  newContent = newContent.replace(/\bpink-200\b/g, 'primary-light');
  newContent = newContent.replace(/\bpink-50\b/g, 'brand-bg');

  // Blue replacements
  newContent = newContent.replace(/\bblue-600\b/g, 'accent');
  newContent = newContent.replace(/\bblue-700\b/g, 'accent-dark');
  newContent = newContent.replace(/\bblue-500\b/g, 'accent');
  newContent = newContent.replace(/\bblue-100\b/g, 'accent-light');
  newContent = newContent.replace(/\bblue-50\b/g, 'brand-bg');

  // Gray overrides (optional) for background sections if needed. Let's just do light ones.
  // Many wrappers use bg-gray-50 or bg-gray-100. Let's swap these out for bg-brand-bg to apply the new soft background globally.
  // Actually, wait, doing that broadly might wash out forms. Let's leave gray-50/100, and just apply it to the main wrapper in Dashboard etc.
  
  // Specific main wrapper colors 
  newContent = newContent.replace(/bg-gray-100/g, 'bg-brand-bg');
  newContent = newContent.replace(/bg-gray-50/g, 'bg-white'); // Since brand-bg is gray-100 replacement, gray-50 can just be white to contrast it

  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
    console.log(`Updated ${file}`);
  }
}

console.log(`Successfully updated colors in ${changedCount} files.`);
