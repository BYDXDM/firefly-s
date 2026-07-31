"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';

type SearchItem = {
  slug: string;
  title: string;
  type: 'post' | 'chatter' | 'moment';
  date: string;
  description: string;
  tags: string[];
  url: string;
};

const TYPE_LABEL: Record<SearchItem['type'], string> = {
  post: '文章',
  chatter: '杂谈',
  moment: '说说',
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function Highlight({ text = '', query = '' }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>;
  const re = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  const parts = String(text).split(re);
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-300/80 dark:bg-yellow-500/70 text-slate-900 dark:text-white px-0.5 rounded">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ctrl+K / Cmd+K 唤起
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 打开时聚焦输入框
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  // 点击外部关闭
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // 防抖搜索
  useEffect(() => {
    if (!open) return;
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setResults(data.items || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q, open]);

  return (
    <>
      {/* 唤起按钮（右下角悬浮） */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full bg-indigo-500/90 hover:bg-indigo-600 text-white pl-3.5 pr-4 py-2.5 shadow-lg shadow-indigo-500/30 backdrop-blur transition-all hover:scale-105 active:scale-95"
        aria-label="搜索"
      >
        <Search size={16} />
        <span className="text-xs font-bold tracking-widest">按 Ctrl+K 搜索</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
          >
            <motion.div
              ref={boxRef}
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 12, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="w-full max-w-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/50 dark:border-slate-700/50">
                <Search size={18} className="text-slate-400" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="搜索文章、杂谈、说说...（ESC 关闭）"
                  className="w-full bg-transparent outline-none text-sm text-slate-800 dark:text-white placeholder:text-slate-400"
                />
                <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-500 font-bold">
                  ESC
                </kbd>
              </div>

              <div className="max-h-[50vh] overflow-y-auto p-2">
                {loading && (
                  <div className="px-4 py-6 text-center text-xs text-slate-400 font-bold animate-pulse">
                    正在搜索...
                  </div>
                )}
                {!loading && q.trim() && results.length === 0 && (
                  <div className="px-4 py-8 text-center text-xs text-slate-400 font-bold">
                    没有找到相关的内容喵~
                  </div>
                )}
                {!loading && results.map((item) => (
                  <Link
                    key={`${item.type}-${item.slug}`}
                    href={item.url}
                    onClick={() => setOpen(false)}
                    className="flex flex-col gap-1 px-4 py-3 rounded-2xl hover:bg-indigo-500/10 dark:hover:bg-indigo-400/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/15 dark:bg-indigo-400/15 text-indigo-600 dark:text-indigo-300 font-black">
                        {TYPE_LABEL[item.type]}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">
                        <Highlight text={item.title} query={q} />
                      </h4>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        <Highlight text={item.description} query={q} />
                      </p>
                    )}
                    {item.tags.length > 0 && (
                      <div className="flex gap-1.5 mt-0.5">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] text-slate-400 font-bold">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
                {!loading && !q.trim() && (
                  <div className="px-4 py-8 text-center text-xs text-slate-400 font-bold">
                    输入关键词开始搜索吧~
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
