"use client";

import { usePathname } from 'next/navigation';
import Giscus from '@giscus/react';
import { siteConfig } from '../siteConfig';

// 通用 Giscus 评论组件
// 依赖 siteConfig.giscusConfig 中的 repo / repoId。
// 若未配置 repo，则渲染一个友好的提示占位，不抛错。
export default function GiscusComments({
  pageId,
}: {
  pageId?: string;
}) {
  const pathname = usePathname();

  const { repo, repoId, category, categoryId } = siteConfig.giscusConfig || ({} as any);

  // 用页面路径做唯一映射（不同页面自动对应不同 discussion）
  const term = pageId || pathname.replace(/\/$/, '') || '/';

  if (!repo || !repoId || !categoryId) {
    return (
      <div className="w-full rounded-2xl border border-indigo-200/40 dark:border-indigo-400/20 bg-indigo-500/5 dark:bg-indigo-400/5 px-6 py-8 text-center">
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
          评论区待开启
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          博主正在配置评论区，稍后再来看看喵~
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Giscus
        repo={repo as `${string}/${string}`}
        repoId={repoId}
        category={category}
        categoryId={categoryId}
        mapping="specific"
        term={term}
        theme="preferred_color_scheme"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        lang="zh-CN"
        loading="lazy"
      />
    </div>
  );
}
