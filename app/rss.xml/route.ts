// app/rss.xml/route.ts — RSS 2.0 订阅源（二次元博客圈的标配，供 Follow / RSSHub / 各类阅读器订阅）
import { getSortedPosts } from '../../lib/content';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://firefly-s.vercel.app';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const posts = getSortedPosts().slice(0, 20);

  const items = posts
    .map((post) => {
      const link = `${SITE_URL}/posts/${post.slug}`;
      const pubDate = post.date ? new Date(post.date).toUTCString() : new Date().toUTCString();
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(post.description || '')}</description>
      ${post.cover ? `<enclosure url="${escapeXml(post.cover)}" type="image/jpeg" />` : ''}
      ${(post.tags || []).map((tag) => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
    </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>唯花不落</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>唯花不落，探索、构思、记录我的个人世界。</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  });
}
