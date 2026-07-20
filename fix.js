const fs = require('fs');
const files = ['components/Comments.tsx', 'components/LabComments.tsx', 'components/MomentComments.tsx'];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/const gitalk = { render: \(el: any\) => {} }; \/\/ new Gitalk\(\{[\s\S]*?\}\);/, 'const gitalk = { render: (el: any) => {} };');
  fs.writeFileSync(f, content);
});
