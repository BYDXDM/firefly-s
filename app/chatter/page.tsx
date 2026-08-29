import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import ChatterBoard from './ChatterBoard';
import { siteConfig } from '@/siteConfig';
import { getSortedChatters } from '../../lib/content';


export const metadata = {
  title: "杂谈 | "+ siteConfig.title,
  description: "日常碎片与灵感记录",
};

export default function ChatterPage() {
  const chatters = getSortedChatters().map(c => ({
    slug: c.slug,
    title: c.title,
    date: c.date,
    tags: c.tags,
    mood: '',
    cover: c.cover,
    content: c.content.replace(/^#+ .*\n/m, '') // 去除开头的 markdown 标题以优化截取显示
  }));

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        {/* 将解析好的数据传递给客户端组件进行瀑布流渲染 */}
        <ChatterBoard chatters={chatters} />
      </PageTransition>
    </div>
  );
}