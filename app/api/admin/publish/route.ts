import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isAuthorized, unauthorizedResponse } from '../../../../lib/adminAuth';
import { getGithubConfig, githubCommitFile, githubListDir } from '../../../../lib/github';

// YAML 双引号标量：JSON.stringify 的产出本身就是合法的 YAML 标量，引号/反斜杠/换行都会被正确转义，
// 防止标题里的特殊字符打挂 frontmatter 解析（tags 数组本来就用的它）
function yamlScalar(value: unknown): string {
  return JSON.stringify(typeof value === 'string' ? value : '');
}

export async function POST(req: Request) {
  try {
    // 🔐 管理后台鉴权
    if (!isAuthorized(req)) return unauthorizedResponse();

    const body = await req.json();
    const { type, title, description, tags, content, location, mood, cover, images } = body;

    if (!type || !content) {
      return NextResponse.json({ error: '类型和内容不能为空' }, { status: 400 });
    }

    const now = new Date();
    const timestamp = now.getTime();
    const dateString = now.toISOString(); // e.g. "2026-04-25T14:54:43.968Z"
    
    // 补零函数
    const pad = (n: number) => String(n).padStart(2, '0');
    const displayDateString = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    let fileName = '';
    let fileContent = '';
    let targetDir = '';

    if (type === 'post') {
      targetDir = path.join(process.cwd(), 'posts');
      // 用标题做 Slug，不支持的字符用减号代替，中文字符保留
      const cleanTitle = title ? title.trim() : 'untitled';
      const slug = cleanTitle.toLowerCase()
        .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '') || `post-${timestamp}`;
      fileName = `${slug}.md`;
      
      const formattedTags = Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
      
      fileContent = `---
title: ${yamlScalar(cleanTitle)}
date: "${displayDateString}"
description: ${yamlScalar(description)}
cover: ${yamlScalar(cover || 'https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg')}
tags: ${JSON.stringify(formattedTags)}
---

${content.trim()}
`;
    } else if (type === 'chatter') {
      targetDir = path.join(process.cwd(), 'chatters');
      const cleanTitle = title ? title.trim() : 'untitled-chatter';
      const slug = cleanTitle.toLowerCase()
        .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '') || `chatter-${timestamp}`;
      fileName = `${slug}.md`;
      
      const formattedTags = Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
      
      fileContent = `---
title: ${yamlScalar(cleanTitle)}
date: "${displayDateString}"
tags: ${JSON.stringify(formattedTags)}
mood: ${yamlScalar(mood || '一般')}
cover: ${yamlScalar(cover || 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg')}
description: ${yamlScalar(description)}
---

${content.trim()}
`;
    } else if (type === 'moment') {
      targetDir = path.join(process.cwd(), 'moments');
      fileName = `moment-${timestamp}.md`;
      
      const imageList = Array.isArray(images) ? images : (images ? [images] : []);
      
      fileContent = `---
id: "moment-${timestamp}"
date: "${dateString}"
location: ${yamlScalar(location)}
images:
${imageList.map(img => `  - ${yamlScalar(img)}`).join('\n')}
---

${content.trim()}
`;
    } else {
      return NextResponse.json({ error: '无效的发布类型' }, { status: 400 });
    }

    const repoDir = type === 'post' ? 'posts' : type === 'chatter' ? 'chatters' : 'moments';

    // 同名内容不再静默覆盖：目标文件已存在时追加 -2/-3 序号
    // （本地模式查目录，GitHub 模式查仓库目录，避免后发布者无声覆盖先发布者）
    const ghCfg = getGithubConfig();
    const existingNames = new Set(
      ghCfg
        ? (await githubListDir(ghCfg, repoDir)).map((f) => f.name)
        : (fs.existsSync(targetDir) ? fs.readdirSync(targetDir) : []),
    );
    if (type === 'post' || type === 'chatter') {
      const baseSlug = fileName.replace(/\.md$/, '');
      for (let i = 2; existingNames.has(fileName); i++) fileName = `${baseSlug}-${i}.md`;
    }

    // 确保文件夹存在
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.resolve(targetDir, fileName);
    // 文件名由 slug/时间戳生成，最终必须仍位于目标目录内（防路径穿越）
    if (!filePath.startsWith(targetDir + path.sep) || fileName.includes('..')) {
      return NextResponse.json({ error: '文件名非法' }, { status: 400 });
    }

    // 线上（Vercel 等只读文件系统）：提交到 GitHub 仓库，push 自动触发重新部署
    if (ghCfg) {
      await githubCommitFile(ghCfg, `${repoDir}/${fileName}`, fileContent, `content: 发布${type === 'post' ? '文章' : type === 'chatter' ? '杂谈' : '说说'} ${fileName}`);
      return NextResponse.json({
        success: true,
        fileName,
        type,
        mode: 'github',
        message: '已提交到仓库，站点将在 1-2 分钟内自动重新部署后生效',
      });
    }

    fs.writeFileSync(filePath, fileContent, 'utf8');

    return NextResponse.json({ success: true, fileName, type, mode: 'local' });
  } catch (error: unknown) {
    console.error('保存失败:', error);
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === 'EROFS') {
      return NextResponse.json(
        { error: '服务器文件系统只读：请在部署平台配置 GITHUB_TOKEN 环境变量以启用云端发布，配置后重新部署即可' },
        { status: 500 }
      );
    }
    const message = error instanceof Error ? error.message : '保存失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
