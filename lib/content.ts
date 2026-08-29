import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { siteConfig } from '../siteConfig';

/** 文章/杂谈的列表项 */
export interface ContentItem {
  slug: string;
  title: string;
  description: string;
  /** frontmatter 中的原始日期字符串 */
  date: string;
  /** 格式化后的展示日期 */
  formattedDate: string;
  tags: string[];
  cover: string;
  content: string;
}

/** 说说列表项 */
export interface MomentItem {
  id: string;
  date: string;
  location: string;
  images: string[];
  content: string;
}

function toTags(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

function normalizeDate(value: unknown): string {
  return typeof value === 'string' && value ? value : '1970-01-01';
}

export function formatUpdateTime(dateString: string): string {
  if (!dateString || dateString === '1970-01-01') return '刚刚更新';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    if (h === '00' && min === '00') return `${y}.${m}.${day}`;
    return `${y}.${m}.${day} ${h}:${min}`;
  } catch {
    return dateString;
  }
}

const CONTENT_ROOT = process.cwd();
const ALLOWED_DIRS = ['posts', 'chatters', 'moments'] as const;

/** 解析项目内内容目录，目录名白名单 + 根目录边界校验，杜绝路径穿越 */
function resolveContentDir(dirName: string): string | null {
  if (!(ALLOWED_DIRS as readonly string[]).includes(dirName)) return null;
  const dirPath = path.resolve(CONTENT_ROOT, dirName);
  if (dirPath !== CONTENT_ROOT && !dirPath.startsWith(CONTENT_ROOT + path.sep)) return null;
  return dirPath;
}

/** 读取目录下全部 Markdown 的原始 frontmatter + 正文（仅限白名单目录） */
export function readRawMarkdown(dirName: 'posts' | 'chatters' | 'moments'): { slug: string; data: Record<string, unknown>; content: string }[] {
  const dirPath = resolveContentDir(dirName);
  if (!dirPath || !fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter((f) => f.endsWith('.md') && !f.includes('..'))
    .map((fileName) => {
      const { data, content } = matter(fs.readFileSync(path.join(dirPath, fileName), 'utf8'));
      return { slug: fileName.replace(/\.md$/, ''), data, content: content || '' };
    });
}

/** 目录名只能是代码内的白名单常量，且解析后必须仍位于项目根目录内 */
function readMarkdownDir(dirName: string): { slug: string; data: Record<string, unknown>; content: string }[] {
  return readRawMarkdown(dirName as 'posts' | 'chatters' | 'moments');
}

/** 按日期倒序（同日按 slug 倒序），保证顺序稳定 */
function sortByDateDesc<T extends { slug: string; date: string }>(items: T[]): T[] {
  return items.sort((a, b) => {
    const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (diff !== 0) return diff;
    return b.slug.localeCompare(a.slug);
  });
}

export function getSortedPosts(): ContentItem[] {
  return sortByDateDesc(
    readMarkdownDir('posts').map(({ slug, data, content }) => {
      const date = normalizeDate(data.date);
      return {
        slug,
        title: (data.title as string) || '无标题',
        description: (data.description as string) || '',
        date,
        formattedDate: formatUpdateTime(date),
        tags: toTags(data.tags),
        cover: (data.cover as string) || siteConfig.defaultPostCover,
        content,
      };
    })
  );
}

export function getPostSlugs(): string[] {
  return readMarkdownDir('posts').map((p) => p.slug);
}

export function getSortedChatters(): ContentItem[] {
  const defaultCover = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop';
  return sortByDateDesc(
    readMarkdownDir('chatters').map(({ slug, data, content }) => {
      const date = normalizeDate(data.date);
      return {
        slug,
        title: (data.title as string) || '碎片记录',
        description: (data.description as string) || content.substring(0, 60),
        date,
        formattedDate: formatUpdateTime(date),
        tags: toTags(data.tags),
        cover: (data.cover as string) || defaultCover,
        content,
      };
    })
  );
}

export function getMoments(): MomentItem[] {
  // 同时扫描 posts/moments 与根目录 moments，按 id 去重
  const dirs = ['moments', path.join('posts', 'moments')].map((d) => path.resolve(CONTENT_ROOT, d));
  const byId = new Map<string, MomentItem>();
  for (const dirPath of dirs) {
    if (dirPath !== CONTENT_ROOT && !dirPath.startsWith(CONTENT_ROOT + path.sep)) continue;
    if (!fs.existsSync(dirPath)) continue;
    for (const fileName of fs.readdirSync(dirPath).filter((f) => f.endsWith('.md') && !f.includes('..'))) {
      const { data, content } = matter(fs.readFileSync(path.join(dirPath, fileName), 'utf8'));
      const id = fileName.replace(/\.md$/, '');
      if (byId.has(id)) continue;
      byId.set(id, {
        id,
        date: normalizeDate(data.date),
        location: (data.location as string) || '',
        images: toTags(data.images),
        content: (content || '').trim(),
      });
    }
  }
  return Array.from(byId.values());
}

/** 文章详情页侧栏「推荐阅读」：排除当前文章后的前 N 篇 */
export function getRecentPostLinks(excludeSlug: string, limit = 3): { slug: string; title: string; date: string }[] {
  return getSortedPosts()
    .filter((p) => p.slug !== excludeSlug)
    .slice(0, limit)
    .map(({ slug, title, date }) => ({ slug, title, date }));
}
