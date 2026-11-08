import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

export interface TocItem {
  level: number;
  text: string;
  id: string;
}

export interface RenderedMarkdown {
  html: string;
  toc: TocItem[];
}

// 代码高亮的自动侦测白名单（与原 posts/chatter/about 三处管线保持一致）
const HLJS_SUBSET = ['cpp', 'c', 'python', 'java', 'javascript', 'typescript', 'go', 'rust', 'bash', 'json', 'html', 'css', 'sql', 'xml'];

/**
 * 前台渲染清洗区（原 posts/chatter/about 三处复制管线的合并版）：
 * 1. 统一换行符，剔除零宽字符与纯空格废行
 * 2. 修复数字列表缺空格（1.百度 -> 1. 百度）
 * 3. 代码块（``` 与 ~~~）切开保护，只对正文把 3+ 连续换行注入 <br/>，拯救被引擎吞掉的连续空行
 */
function cleanMarkdown(content: string): string {
  content = content.replace(/\r\n/g, '\n');
  content = content.replace(/[\u200B-\u200D\uFEFF]/g, '');
  content = content.replace(/^[ \t]+$/gm, '');
  content = content.replace(/^(\s*\d+)\.([^ \n])/gm, '$1. $2');

  const blocks = content.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g);
  return blocks.map((block, index) => {
    // 奇数索引是代码块，原样返回，绝对不碰！
    if (index % 2 === 1) return block;
    // 偶数索引是正文。3 个连续 \n 相当于中间空了 1 行真正的空白
    return block.replace(/\n{3,}/g, (match) => '\n\n' + '<br/>'.repeat(match.length - 2) + '\n\n');
  }).join('');
}

/**
 * 提取目录：跳过代码围栏内的 # 注释行（Python/C 注释），避免幽灵目录项。
 * id 生成规则与 ClientTOC 的 getSafeId 保持一致（小写 + 空白转 -）。
 */
function extractToc(content: string): TocItem[] {
  const toc: TocItem[] = [];
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const blocks = content.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g);
  for (let i = 0; i < blocks.length; i += 2) {
    // 偶数索引才是正文
    let match;
    while ((match = headingRegex.exec(blocks[i])) !== null) {
      const text = match[2].trim();
      toc.push({ level: match[1].length, text, id: text.toLowerCase().replace(/\s+/g, '-') });
    }
    headingRegex.lastIndex = 0;
  }
  return toc;
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  // 🌟 allowDangerousHtml 保留 raw 节点，清洗注入的 <br/> 才能进来
  .use(remarkRehype, { allowDangerousHtml: true })
  // 🌟 把原始 HTML 解析成真实元素，交给 rehype-sanitize 统一消毒：
  // script/iframe/object/embed 等危险标签、on* 事件属性、javascript: 协议链接全部剥离，
  // 堵死“持 passkey 者写入任意 HTML → 全站访客存储型 XSS”的通路
  .use(rehypeRaw)
  .use(rehypeSanitize)
  // 消毒之后再加高亮与 KaTeX，两者生成的 hljs-* class / MathML / 内联样式不会被 schema 误伤
  // 🌟 核心升级：开启代码语言自动侦测，并限制白名单，大幅提高 C++ 和常用语言的猜中率！
  // @ts-ignore
  .use(rehypeHighlight, {
    detect: true,
    ignoreMissing: true,
    subset: HLJS_SUBSET,
  })
  .use(rehypeKatex)
  .use(rehypeStringify);

/**
 * 全站唯一的 Markdown 渲染入口：清洗 + 消毒 + 高亮 + 公式，返回可直接进
 * dangerouslySetInnerHTML 的 HTML 与目录。posts/chatter/about 与管理端实时预览共用。
 */
export async function renderMarkdown(content: string): Promise<RenderedMarkdown> {
  const cleaned = cleanMarkdown(content);
  const file = await processor.process(cleaned);
  return { html: file.toString(), toc: extractToc(cleaned) };
}
