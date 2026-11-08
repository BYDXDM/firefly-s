import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { renderMarkdown } from '../../../lib/markdown';

// 引入高亮主题
import 'highlight.js/styles/atom-one-dark.css';

import Navbar from '../../../components/Navbar';
import PageTransition from '../../../components/PageTransition';
import { siteConfig } from '../../../siteConfig';
import ClientSocials from '../../../components/ClientSocials';
import ClientTOC from '../../../components/ClientTOC';
import BackButton from '../../../components/BackButton';
import Comments from '../../../components/Comments';
import SidebarLyric from '../../../components/SidebarLyric';
import { getPostSlugs, getRecentPostLinks, getSortedPosts } from '../../../lib/content';

export async function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

// 每篇文章的分享卡片用自己的标题/描述/封面（OG），QQ/微信/Twitter 转发时直接出图
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const post = getSortedPosts().find((p) => p.slug === slug);
    if (!post) return { title: '文章未找到 | ' + siteConfig.title };
    return {
      title: post.title + ' | ' + siteConfig.title,
      description: post.description || siteConfig.bio,
      openGraph: {
        title: post.title,
        description: post.description || siteConfig.bio,
        type: 'article',
        images: [{ url: post.cover || siteConfig.defaultPostCover }],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.description || siteConfig.bio,
        images: [post.cover || siteConfig.defaultPostCover],
      },
    };
  } catch {
    return { title: siteConfig.title };
  }
}

// 与 admin/posts 路由同款的 slug 白名单：只允许字母数字、中文与连字符，杜绝 ../ 路径穿越
const SLUG_RE = /^[a-zA-Z0-9\u4e00-\u9fa5]+(?:-[a-zA-Z0-9\u4e00-\u9fa5]+)*$/;

async function getPostData(slug: string) {
  if (!SLUG_RE.test(slug)) notFound();
  const fullPath = path.join(process.cwd(), 'posts', `${slug}.md`);
  let fileContents: string;
  try {
    fileContents = fs.readFileSync(fullPath, 'utf8');
  } catch {
    // 文件不存在（或不可读）时返回 404，而不是整页 500
    notFound();
  }
  const { data, content } = matter(fileContents);

  // 清洗 + 消毒 + 高亮 + 公式统一走 lib/markdown（含 TOC 提取）
  const { html, toc } = await renderMarkdown(content);

  return {
    slug,
    contentHtml: html,
    toc,
    title: data.title,
    date: data.date,
    tags: data.tags && Array.isArray(data.tags) ? data.tags : [],
    cover: data.cover || siteConfig.defaultPostCover
  };
}

function getRecentPosts(currentSlug: string) {
  return getRecentPostLinks(currentSlug, 3);
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const postData = await getPostData(resolvedParams.slug);
  const recentPosts = getRecentPosts(resolvedParams.slug);

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 flex flex-col lg:flex-row gap-6 md:gap-8 relative z-10">

          <article className="flex-1 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700">
            <div className="w-full aspect-video bg-slate-200 dark:bg-slate-700 relative group">
              <img src={postData.cover} alt="封面" className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105" />
            </div>

            <div className="p-5 md:p-12 relative">
              <BackButton />

              <header className="mb-6 md:mb-8 border-b border-slate-300/50 dark:border-slate-700 pb-5 md:pb-6 relative">
                <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight transition-colors duration-700 pr-16 md:pr-24 leading-snug">
                  {postData.title}
                </h1>

                {/* ✅ 前端展示：修改此篇的特权按钮已经彻底移除 */}

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <div className="flex items-center gap-1.5 md:gap-2 text-indigo-700 dark:text-indigo-400 font-bold bg-white/30 dark:bg-slate-900/50 px-3 md:px-4 py-1.5 md:py-2 rounded-full w-max text-xs md:text-sm transition-colors duration-700 shadow-sm border border-white/20 dark:border-white/5">
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    写作时间：{postData.date}
                  </div>

                  {postData.tags.map((tag: string) => (
                    <div key={tag} className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-bold bg-white/30 dark:bg-slate-900/50 px-2.5 md:px-3 py-1.5 md:py-2 rounded-full text-xs md:text-sm transition-colors duration-700 shadow-sm border border-white/20 dark:border-white/5">
                      <span className="text-[10px] md:text-xs opacity-70">#</span> {tag}
                    </div>
                  ))}
                </div>
              </header>

              <div className="relative">
                <div
                  id="article-content"
                  className="prose prose-slate dark:prose-invert prose-base md:prose-lg max-w-none text-slate-800 dark:text-slate-200 transition-colors duration-700 scroll-smooth"
                  dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
                />
              </div>

              <div className="mt-12 md:mt-16">
                <Comments />
              </div>

            </div>
          </article>

          <aside className="w-full lg:w-[320px] flex flex-col gap-6 flex-shrink-0">
            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl text-center">
              <div className="w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md mb-4 transition-transform duration-500 hover:rotate-3">
                <img src={siteConfig.avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover bg-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{siteConfig.authorName}</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-4">{siteConfig.bio}</p>
              <ClientSocials />
            </div>

            <SidebarLyric />

            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl">
              <h3 className="font-black text-slate-900 dark:text-white mb-4 border-l-4 border-indigo-500 pl-2 text-sm">RECOMMENDED</h3>
              <div className="space-y-4">
                {recentPosts.map(p => (
                  <Link key={p.slug} href={`/posts/${p.slug}`} className="group block">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{p.title}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold uppercase">{p.date}</p>
                  </Link>
                ))}
              </div>
            </div>

            {postData.toc.length > 0 && (
              <ClientTOC toc={postData.toc} />
            )}
          </aside>
        </main>
      </PageTransition>
    </div>
  );
}