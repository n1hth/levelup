import fs from 'fs';
import path from 'path';

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Match tailwind responsive classes precisely
      const regex = /(?<=[\s"'`])(?:[a-z0-9-]+:)*(?:sm|md|lg|xl|2xl):[a-zA-Z0-9-\[\]\.\/]+/g;
      
      let newContent = content.replace(regex, '');
      
      // We will also just clean up multiple spaces inside strings slightly if they are surrounded by quotes, but actually tailwind doesn't care about extra spaces. Let's just leave the extra spaces.
      
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory('./src/pages');
processDirectory('./src/components');
