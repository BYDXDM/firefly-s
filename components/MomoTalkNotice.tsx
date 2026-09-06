"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// MOMOTALK 风格的新文章通知：
// 访客上次到访后若有新文章发布，下次打开站点时弹一次 BA 蓝气泡提醒。
// localStorage 记录最近读过的文章 slug；sessionStorage 保证一个会话最多弹一次。

interface NoticeData {
  slug: string;
  title: string;
  formattedDate: string;
}

const AVATAR = '/music/covers/01-oracle.jpg'; // 爱丽丝头像

export default function MomoTalkNotice({ latest }: { latest: NoticeData | null }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!latest?.slug) return;
    let timer: ReturnType<typeof setTimeout>;
    try {
      const lastRead = localStorage.getItem('last-read-post');
      if (sessionStorage.getItem('momotalk-shown') === 'true') return;
      // 首次访问只建档不弹窗，避免打扰新访客
      if (!lastRead) {
        localStorage.setItem('last-read-post', latest.slug);
        return;
      }
      if (lastRead === latest.slug) return;
      sessionStorage.setItem('momotalk-shown', 'true');
      const t = setTimeout(() => setShow(true), 3200);
      timer = setTimeout(() => setShow(false), 12000);
      return () => { clearTimeout(t); clearTimeout(timer); };
    } catch {
      return; // 隐私模式等场景直接不弹
    }
  }, [latest?.slug]);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem('last-read-post', latest?.slug || ''); } catch { /* ignore */ }
  };

  return (
    <AnimatePresence>
      {show && latest && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="fixed top-20 right-4 sm:right-6 z-[9500] w-[280px] sm:w-[300px] rounded-2xl overflow-hidden shadow-2xl border border-sky-200/60 dark:border-sky-800/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl"
        >
          {/* MOMOTALK 标题栏 */}
          <div className="bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 flex items-center justify-between">
            <span className="text-white text-[11px] font-black tracking-[0.25em]">MOMOTALK</span>
            <button
              onClick={dismiss}
              className="text-white/80 hover:text-white text-sm leading-none transition-colors"
              aria-label="关闭"
            >
              ✕
            </button>
          </div>

          <Link href={`/posts/${latest.slug}`} onClick={dismiss} className="block px-4 py-3.5 group">
            <div className="flex gap-3">
              <img
                src={AVATAR}
                alt="alice"
                className="w-10 h-10 rounded-full object-cover border-2 border-sky-400/60 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-800 dark:text-slate-100 mb-1">
                  天童爱丽丝 <span className="text-[9px] font-bold text-sky-500">刚刚</span>
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Sensei！新文章
                  <span className="font-bold text-sky-600 dark:text-sky-400 line-clamp-1 mx-1">《{latest.title}》</span>
                  发布啦！快去看看吧，好耶！
                </p>
              </div>
            </div>
            <div className="mt-2.5 text-right">
              <span className="inline-block text-[10px] font-black text-white bg-sky-500 group-hover:bg-indigo-500 transition-colors rounded-full px-3 py-1">
                前往查看 →
              </span>
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
