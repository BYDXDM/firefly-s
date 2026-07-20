const fs = require('fs');
const files = ['components/Comments.tsx', 'components/LabComments.tsx', 'components/MomentComments.tsx'];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/if \(containerRef\.current\)[\s]*\}\);/g, 'if (containerRef.current) gitalk.render(containerRef.current); });');
  fs.writeFileSync(f, content);
});
