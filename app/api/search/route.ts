import { NextRequest, NextResponse } from 'next/server';
import { getSortedPosts, getSortedChatters, getMoments } from '@/lib/content';

type SearchItem = {
  slug: string;
  title: string;
  type: 'post' | 'chatter' | 'moment';
  date: string;
  description: string;
  tags: string[];
  url: string;
};

function toPlainText(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*`\-_[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fallbackDescription(description: string, content: string): string {
  if (description) return description;
  return toPlainText(content).slice(0, 80);
}

export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();

    const posts: SearchItem[] = getSortedPosts().map((p) => ({
      slug: p.slug,
      title: p.title,
      type: 'post',
      date: p.date,
      description: fallbackDescription(p.description, p.content),
      tags: p.tags,
      url: `/posts/${p.slug}`,
    }));

    const chatters: SearchItem[] = getSortedChatters().map((c) => ({
      slug: c.slug,
      title: c.title,
      type: 'chatter',
      date: c.date,
      description: fallbackDescription(c.description, c.content),
      tags: c.tags,
      url: `/chatter/${c.slug}`,
    }));

    const moments: SearchItem[] = getMoments().map((m) => ({
      slug: m.id,
      title: '说说',
      type: 'moment',
      date: m.date,
      description: toPlainText(m.content).slice(0, 80),
      tags: [],
      url: '/moments',
    }));

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '搜索索引生成失败';
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
