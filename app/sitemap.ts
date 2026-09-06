import type { MetadataRoute } from 'next';
import { getSortedPosts } from '../lib/content';

const BASE = 'https://firefly-s.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getSortedPosts().map((post: any) => ({
    url: `${BASE}/posts/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : new Date(),
  }));
  const staticPages = ['', '/projects', '/timeline', '/photowall', '/music', '/games', '/tree', '/moments', '/chatter', '/friends', '/feedback', '/about'].map(
    (path) => ({
      url: `${BASE}${path}`,
      lastModified: new Date(),
    })
  );
  return [...staticPages, ...posts];
}
