import { readRawMarkdown } from '../../lib/content';

// 引入前台客户端组件
import CreativeWorkshopClient from './CreativeWorkshopClient';

function getLocalItems(directoryName: 'posts' | 'chatters' | 'moments', typeName: string) {
  return readRawMarkdown(directoryName).map(({ slug, data, content }) => ({
    id: (data.id as string) || slug,
    slug,
    title: (data.title as string) || '',
    type: typeName,
    date: (data.date as string) || '2026-05-01',
    // 兼容 image 字段写法；没有封面则传 null
    cover: (data.cover as string) || (data.image as string) || null,
    content: content.trim()
  }));
}

export default function CreativeWorkshopPage() {
  const posts = getLocalItems('posts', 'post');
  const chatters = getLocalItems('chatters', 'chatter');
  const moments = getLocalItems('moments', 'moment');

  return (
    <CreativeWorkshopClient
      posts={posts}
      chatters={chatters}
      moments={moments}
    />
  );
}