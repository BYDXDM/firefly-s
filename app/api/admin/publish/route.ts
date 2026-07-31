import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isAuthorized, unauthorizedResponse } from '../../../../lib/adminAuth';

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
title: "${cleanTitle}"
date: "${displayDateString}"
description: "${description || ''}"
cover: "${cover || 'https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg'}"
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
title: "${cleanTitle}"
date: "${displayDateString}"
tags: ${JSON.stringify(formattedTags)}
mood: "${mood || '一般'}"
cover: "${cover || 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg'}"
description: "${description || ''}"
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
location: "${location || ''}"
images:
${imageList.map(img => `  - '${img}'`).join('\n')}
---

${content.trim()}
`;
    } else {
      return NextResponse.json({ error: '无效的发布类型' }, { status: 400 });
    }

    // 确保文件夹存在
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, fileName);
    fs.writeFileSync(filePath, fileContent, 'utf8');

    return NextResponse.json({ success: true, fileName, type });
  } catch (error: any) {
    console.error('保存失败:', error);
    return NextResponse.json({ error: error.message || '保存失败' }, { status: 500 });
  }
}
