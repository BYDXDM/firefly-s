"use client";

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../../components/Navbar';

interface FeedbackItem {
  id: string;
  nickname: string;
  contact: string;
  type: string;
  date: string;
  content: string;
}

const TYPE_LABELS: Record<string, string> = {
  suggestion: '💡 建议',
  bug: '🐛 问题',
  other: '💬 闲聊',
};

const PASSKEY_STORAGE = 'admin-passkey';

export default function AdminFeedbackPage() {
  const [passkey, setPasskey] = useState('');
  const [items, setItems] = useState<FeedbackItem[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadList = useCallback(async (key: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/feedback', { headers: { 'X-Admin-Passkey': key }, cache: 'no-store' });
      if (res.status === 401) {
        setError('密钥不对，请检查 ADMIN_PASSKEY');
        setItems(null);
        return;
      }
      const data = await res.json();
      setItems(data.items || []);
      localStorage.setItem(PASSKEY_STORAGE, key);
    } catch {
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(PASSKEY_STORAGE);
    if (saved) {
      setPasskey(saved);
      loadList(saved);
    }
  }, [loadList]);

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条建议吗？')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/feedback?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Passkey': passkey },
      });
      if (res.ok) {
        setItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const formatType = (t: string) => TYPE_LABELS[t] || '💬 闲聊';
  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString('zh-CN', { hour12: false });
    } catch {
      return d;
    }
  };

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <div className="w-[95%] md:w-[90%] max-w-3xl mx-auto mt-24 md:mt-28 relative z-10">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">📮 建议箱管理</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            查看访客投递的建议。<a href="/admin" className="text-indigo-500 hover:underline">返回发布后台 →</a>
          </p>
        </header>

        {/* 密钥输入 */}
        {items === null && (
          <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-white/10 p-8">
            <label htmlFor="admin-fb-passkey" className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              管理密钥（环境变量 ADMIN_PASSKEY）
            </label>
            <div className="flex gap-3">
              <input
                id="admin-fb-passkey"
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && passkey) loadList(passkey); }}
                placeholder="输入管理密钥"
                className="flex-1 bg-white/50 dark:bg-slate-900/50 border border-white/50 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <button
                onClick={() => passkey && loadList(passkey)}
                disabled={loading}
                className="px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-black shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
              >
                {loading ? '验证中…' : '解锁'}
              </button>
            </div>
            {error && <p className="mt-4 text-sm font-bold text-rose-500">{error}</p>}
          </div>
        )}

        {/* 列表 */}
        {items !== null && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">共 {items.length} 条建议</p>
              <button
                onClick={() => loadList(passkey)}
                className="text-xs font-bold text-indigo-500 hover:text-indigo-600 px-3 py-1.5 rounded-full bg-indigo-500/10 transition-colors"
              >
                ↻ 刷新
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500 font-bold">
                箱子还是空的，等第一条建议吧～
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.article
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 dark:border-white/10 p-5 transition-colors"
                    >
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                          {formatType(item.type)}
                        </span>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">{item.nickname}</span>
                        {item.contact && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">（{item.contact}）</span>
                        )}
                        <span className="ml-auto text-[11px] text-slate-400 dark:text-slate-500 font-bold">{formatDate(item.date)}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words">{item.content}</p>
                      <div className="mt-3 text-right">
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="text-xs font-bold text-rose-500 hover:bg-rose-500/10 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                        >
                          {deletingId === item.id ? '删除中…' : '删除'}
                        </button>
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
