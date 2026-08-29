import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { siteConfig } from '../../siteConfig';
import TimelineClient from '../../components/TimelineClient';
// 🌟 1. 引入 ToastProvider 喵！
import { ToastProvider } from '../../components/ToastProvider';
import { getSortedPosts } from '../../lib/content';

export const metadata = {
  title: "归档与探索 | " + siteConfig.title,
};

export default function Timeline() {
  const posts = getSortedPosts();
  const tagCounts: Record<string, number> = {};

  posts.forEach(post => {
    const postTags = post.tags.length > 0 ? post.tags : ['未分类'];
    postTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const tagsArray = Object.keys(tagCounts)
    .map(name => ({ name, count: tagCounts[name] }))
    .sort((a, b) => b.count - a.count);

  return (
    // 🌟 2. 在最外层用 ToastProvider 包裹整个页面
    <ToastProvider>
      <div className="min-h-screen relative pb-32">
        <Navbar />
        <PageTransition>
          <TimelineClient posts={posts} tags={tagsArray} />
        </PageTransition>
      </div>
    </ToastProvider>
  );
}