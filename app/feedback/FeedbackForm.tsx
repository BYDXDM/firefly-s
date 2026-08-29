"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FEEDBACK_OPTIONS = [
  { value: 'suggestion', label: '💡 功能建议', desc: '希望网站增加或改进什么' },
  { value: 'bug', label: '🐛 问题反馈', desc: '页面显示异常、功能坏了' },
  { value: 'other', label: '💬 随便聊聊', desc: '打个招呼、说点什么都可以' },
] as const;

type FeedbackType = (typeof FEEDBACK_OPTIONS)[number]['value'];

const inputClass = "w-full bg-white/50 dark:bg-slate-900/50 border border-white/50 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-medium outline-none focus:border-indigo-400 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all backdrop-blur-sm";

export default function FeedbackForm() {
  const [type, setType] = useState<FeedbackType>('suggestion');
  const [nickname, setNickname] = useState('');
  const [contact, setContact] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const maxLen = 1000;
  const contentLen = content.trim().length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (contentLen < 2) {
      setError('建议内容太短了，至少写两个字吧');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, contact, type, content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || '提交失败，稍后再试');
      } else {
        setDone(true);
      }
    } catch {
      setError('网络异常，请检查连接后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 p-6 md:p-10 transition-colors duration-700">
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 18, stiffness: 200 }}
            className="text-center py-10"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">已收到你的建议！</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">感谢反馈，站长会尽快查看～</p>
            <button
              onClick={() => { setDone(false); setContent(''); setNickname(''); setContact(''); }}
              className="px-6 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
            >
              再写一条
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
          >
            {/* 类型选择 */}
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">想说点什么</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {FEEDBACK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`text-left rounded-2xl px-4 py-3 border transition-all active:scale-[0.98] ${
                      type === opt.value
                        ? 'bg-indigo-500/10 dark:bg-indigo-400/10 border-indigo-400 dark:border-indigo-400/60 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                        : 'bg-white/40 dark:bg-slate-900/40 border-white/50 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-400/40'
                    }`}
                  >
                    <span className={`block text-sm font-black ${type === opt.value ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>{opt.label}</span>
                    <span className="block text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 昵称 + 联系方式 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fb-nickname" className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">昵称（选填）</label>
                <input
                  id="fb-nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                  placeholder="怎么称呼你？"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="fb-contact" className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">联系方式（选填）</label>
                <input
                  id="fb-contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  maxLength={50}
                  placeholder="邮箱 / QQ / 微信，方便回访"
                  className={inputClass}
                />
              </div>
            </div>

            {/* 内容 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="fb-content" className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">建议内容</label>
                <span className={`text-xs font-bold ${contentLen > maxLen - 50 ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}>
                  {contentLen} / {maxLen}
                </span>
              </div>
              <textarea
                id="fb-content"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, maxLen))}
                rows={6}
                placeholder="写下你的想法…（支持换行）"
                className={`${inputClass} resize-none leading-relaxed`}
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5"
              >
                {error}
              </motion.p>
            )}

            {/* 提交 */}
            <button
              type="submit"
              disabled={submitting}
              className="self-start inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-60 text-white text-sm font-black shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  投递中…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  投进建议箱
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
