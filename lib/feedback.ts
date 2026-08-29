import fs from 'fs';
import path from 'path';

/** 一条访客建议 */
export interface FeedbackItem {
  id: string;
  nickname: string;
  contact: string;
  /** suggestion | bug | other */
  type: string;
  date: string;
  content: string;
}

const FEEDBACK_ROOT = process.cwd();
const FEEDBACK_DIR = path.resolve(FEEDBACK_ROOT, 'feedback');

export const FEEDBACK_TYPES = ['suggestion', 'bug', 'other'] as const;

function ensureDir() {
  if (!fs.existsSync(FEEDBACK_DIR)) fs.mkdirSync(FEEDBACK_DIR, { recursive: true });
}

function escapeFrontmatter(value: string): string {
  // 防止内容里的换行/--- 破坏 frontmatter 结构
  return value.replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/^---+/g, '- - -').trim();
}

/** 保存一条建议，返回生成的 id */
export function saveFeedback(input: { nickname: string; contact: string; type: string; content: string }): string {
  ensureDir();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const frontmatter = [
    '---',
    `id: ${id}`,
    `nickname: ${escapeFrontmatter(input.nickname)}`,
    `contact: ${escapeFrontmatter(input.contact)}`,
    `type: ${escapeFrontmatter(input.type)}`,
    `date: ${new Date().toISOString()}`,
    '---',
    '',
  ].join('\n');
  // 文件名完全由服务端生成，不含任何用户输入
  fs.writeFileSync(path.join(FEEDBACK_DIR, `${id}.md`), frontmatter + input.content.replace(/\r\n/g, '\n').trim() + '\n', 'utf8');
  return id;
}

function parseFeedbackFile(fileName: string, raw: string): FeedbackItem | null {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;
  const [, fmBlock, content] = match;
  const field = (name: string): string => {
    const m = fmBlock.match(new RegExp(`^${name}:\\s*(.*)$`, 'm'));
    return m ? m[1].trim() : '';
  };
  return {
    id: field('id') || fileName.replace(/\.md$/, ''),
    nickname: field('nickname') || '匿名',
    contact: field('contact'),
    type: field('type') || 'other',
    date: field('date') || '1970-01-01',
    content: content.trim(),
  };
}

/** 全部建议，按时间倒序 */
export function getFeedbackList(): FeedbackItem[] {
  if (!fs.existsSync(FEEDBACK_DIR)) return [];
  return fs.readdirSync(FEEDBACK_DIR)
    .filter((f) => f.endsWith('.md') && !f.includes('..'))
    .map((fileName) => {
      try {
        return parseFeedbackFile(fileName, fs.readFileSync(path.join(FEEDBACK_DIR, fileName), 'utf8'));
      } catch {
        return null;
      }
    })
    .filter((item): item is FeedbackItem => item !== null)
    .sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
}

/** 删除一条建议 */
export function deleteFeedback(id: string): boolean {
  // id 只允许安全字符，杜绝路径穿越
  if (!/^[A-Za-z0-9-]+$/.test(id)) return false;
  const target = path.join(FEEDBACK_DIR, `${id}.md`);
  if (!target.startsWith(FEEDBACK_DIR + path.sep) || !fs.existsSync(target)) return false;
  fs.unlinkSync(target);
  return true;
}
