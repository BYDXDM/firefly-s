const fs = require('fs');
const files = ['components/Comments.tsx', 'components/LabComments.tsx', 'components/MomentComments.tsx'];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  // Remove direct import if exists
  content = content.replace(/import Gitalk from "gitalk";\n?/g, '');
  content = content.replace(/import "gitalk\/dist\/gitalk\.css";\n?/g, '');
  
  // Replace the fake gitalk with dynamic import
  content = content.replace(
    /const gitalk = \{ render: \(el: any\) => \{\} \};/,
    `import('gitalk/dist/gitalk.css');
    import('gitalk').then((module) => {
      const Gitalk = module.default || module;
      const gitalk = new Gitalk({
        clientID: siteConfig.gitalkConfig.clientID,
        clientSecret: siteConfig.gitalkConfig.clientSecret,
        repo: siteConfig.gitalkConfig.repo,
        owner: siteConfig.gitalkConfig.owner,
        admin: siteConfig.gitalkConfig.admin,
        proxy: '/api/github',
        id: (pathname.replace(/\\/$/, '') || '/').substring(0, 49),
        distractionFreeMode: false,
      });
      if (containerRef.current) gitalk.render(containerRef.current);
    });`
  );
  
  // Also remove the old gitalk.render because it's now inside the then() block
  content = content.replace(/gitalk\.render\(containerRef\.current\);\n?/, '');
  
  fs.writeFileSync(f, content);
});
