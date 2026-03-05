const fs = require('fs');
const path = 'components/Workspace.tsx';
let text = fs.readFileSync(path, 'utf8');
text = text.split('\\`').join('`');
text = text.split('\\${').join('${');
text = text.split('\\n').join('\n');
fs.writeFileSync(path, text);
console.log('Fixed workspace.tsx');
