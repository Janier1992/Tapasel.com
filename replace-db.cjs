const fs = require('fs');

const files = [
  'src/App.tsx',
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/insforge\.database\.from\((['"`])(.*?)\1\)\.insert\(([\s\S]*?)\)/g, (match, quote, table, data) => {
    return `apiInsert('${table}', ${data})`;
  });

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
});
