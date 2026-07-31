import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

type SearchItem = {
  slug: string;
  title: string;
  type: 'post' | 'chatter' | 'moment';
  date: string;
  description: string;
  tags: string[];
  url: string;
};

async function readDir(type: 'post' | 'chatter' | 'moment'): Promise<SearchItem[]> {
  const dirMap = { post: 'posts', chatter: 'chatters', moment: 'moments' };
  const dirName = dirMap[type];
  const dirPath = path.join(process.cwd(), dirName);
  if (!fs.existsSync(dirPath)) return [];

  const items: SearchItem[] = [];
  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.md'));

  for (const file of files) {
    try {
      const fullPath = path.join(dirPath, file);
      const raw = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(raw);
      const slug = file.replace(/\.md$/, '');
      // 取正文前80字作为摘要
      const plainText = content
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/[#>*`\-_[\]()!]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      items.push({
        slug,
        title: data.title || file.replace('.md', ''),
        type,
        date: data.date || '',
        description: data.description || plainText.slice(0, 80),
        tags: Array.isArray(data.tags) ? data.tags : [],
        url:
          type === 'post'
            ? `/posts/${slug}`
            : type === 'chatter'
              ? `/chatter/${slug}`
              : `/moments`,
      });
    } catch (e) {
      // 跳过无法解析的文件
    }
  }
  return items;
}

export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();
    const [posts, chatters, moments] = await Promise.all([
      readDir('post'),
      readDir('chatter'),
      readDir('moment'),
    ]);

    let all = [...posts, ...chatters, ...moments];

    // 按日期倒序
    all.sort((a, b) => {
      const da = new Date(a.date).getTime() || 0;
      const db = new Date(b.date).getTime() || 0;
      return db - da;
    });

    // 可选：按查询过滤
    if (q) {
      const match = (s: string) => s.toLowerCase().includes(q);
      all = all.filter(
        (item) =>
          match(item.title) ||
          match(item.description) ||
          (item.tags || []).some(match),
      );
    }

    return NextResponse.json({ items: all });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '搜索索引生成失败' },
      { status: 500 },
    );
  }
}
