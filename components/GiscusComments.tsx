"use client";

import { useEffect, useRef, createElement } from 'react';
import { usePathname } from 'next/navigation';
import { siteConfig } from '../siteConfig';

export default function GiscusComments({
  pageId,
}: {
  pageId?: string;
}) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  const { repo, repoId, category, categoryId } = siteConfig.giscusConfig || ({} as any);
  const term = pageId || pathname.replace(/\/$/, '') || '/';

  // 首次挂载时加载 giscus client.js 并注册 <giscus-widget>
  useEffect(() => {
    if (!repo || !repoId || !categoryId) return;
    if (document.querySelector('script[src*="giscus.app/client.js"]')) return;
    const s = document.createElement('script');
    s.src = 'https://giscus.app/client.js';
    s.setAttribute('data-repo', repo);
    s.setAttribute('data-repo-id', repoId);
    s.setAttribute('data-category', category || '');
    s.setAttribute('data-category-id', categoryId || '');
    s.setAttribute('data-mapping', 'specific');
    s.setAttribute('data-term', term);
    s.setAttribute('data-reactions-enabled', '1');
    s.setAttribute('data-emit-metadata', '0');
    s.setAttribute('data-input-position', 'bottom');
    s.setAttribute('data-theme', 'preferred_color_scheme');
    s.setAttribute('data-lang', 'zh-CN');
    s.setAttribute('data-loading', 'lazy');
    s.async = true;
    document.head.appendChild(s);
    return () => {
      // 页面卸载时移除脚本，避免重复加载（保留自定义元素注册）
    };
  }, [repo, repoId, category, categoryId]);

  if (!repo || !repoId || !categoryId) {
    return (
      <div className="w-full rounded-2xl border border-indigo-200/40 dark:border-indigo-400/20 bg-indigo-500/5 dark:bg-indigo-400/5 px-6 py-8 text-center">
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">评论区待开启</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">博主正在配置评论区，稍后再来看看喵~</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      {/* giscus 官方 widget 标签,client.js 会把它替换为 iframe */}
      {createElement('giscus-widget' as any, {
        repo,
        'repo-id': repoId,
        category,
        'category-id': categoryId,
        mapping: 'specific',
        term,
        strict: '0',
        'reactions-enabled': '1',
        'emit-metadata': '0',
        'input-position': 'bottom',
        theme: 'preferred_color_scheme',
        lang: 'zh-CN',
        loading: 'lazy',
      } as object)}
    </div>
  );
}
