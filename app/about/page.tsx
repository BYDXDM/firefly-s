// src/app/about/page.tsx
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { renderMarkdown } from '../../lib/markdown';

// 引入高亮主题
import 'highlight.js/styles/atom-one-dark.css';
import 'katex/dist/katex.min.css';

import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import AboutClient from '../../components/AboutClient';
import { Suspense } from 'react';
import { readRawMarkdown } from '../../lib/content';

function getDirActivities(dirName: 'posts' | 'chatters' | 'moments', typeLabel: '文章' | '杂谈' | '说说', linkPrefix: string) {
  return readRawMarkdown(dirName).map(({ slug, data }) => ({
    id: `${dirName}-${slug}`,
    type: typeLabel,
    title: (data.title as string) || slug,
    date: data.date ? new Date(data.date as string).toISOString() : '1970-01-01T00:00:00Z',
    url: `/${linkPrefix}/${slug}`
  }));
}

export default async function AboutPage() {
  const fullPath = path.join(process.cwd(), 'app', 'about', 'about.md');
  let contentHtml = "博主很懒，还没有写自我介绍哦...";
  let coverImage = "https://bu.dusays.com/2026/03/24/69c23dc278c78.jpg";

  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    if (data.cover) coverImage = data.cover;

    // 清洗 + 消毒 + 高亮 + 公式统一走 lib/markdown
    contentHtml = (await renderMarkdown(content)).html;
  } catch (e) {
    console.error("读取 about.md 失败", e);
  }

  const posts = getDirActivities('posts', '文章', 'posts');
  const chatters = getDirActivities('chatters', '杂谈', 'chatter');
  const moments = getDirActivities('moments', '说说', 'moments');

  const allActivities = [...posts, ...chatters, ...moments].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-4xl mx-auto mt-24 md:mt-28 relative z-10">

          <Suspense fallback={<div className="h-96 flex items-center justify-center text-slate-500 font-bold animate-pulse">正在载入档案...</div>}>
            {/* 🌟 组件原封不动，安全可靠 */}
            <AboutClient
              contentHtml={contentHtml}
              coverImage={coverImage}
              activities={allActivities}
            />
          </Suspense>
        </main>
      </PageTransition>
    </div>
  );
}