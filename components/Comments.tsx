"use client";

import GiscusComments from './GiscusComments';

// 通用评论区（基于 Giscus）
// 保留原有 Comments 组件接口，供文章/说说/友链/音乐等页面共用。
export default function Comments() {
  return (
    <div className="w-full mt-16 relative">
      {/* 环境光晕 */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full pointer-events-none z-0"></div>
      <div className="relative z-10 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
        <GiscusComments />
      </div>
    </div>
  );
}
