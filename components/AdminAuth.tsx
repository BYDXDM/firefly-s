"use client";

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, LockKeyhole, ShieldAlert } from 'lucide-react';

const PASSKEY_STORAGE = 'admin-passkey';

export interface AdminAuthState {
  /** 已通过校验的密钥（请求后台接口时放进 X-Admin-Passkey 头） */
  passkey: string;
  authenticated: boolean;
  authRequired: boolean | null;
  loading: boolean;
  logout: () => void;
}

/**
 * 管理后台登录态 Hook：
 * 挂载时用 localStorage 里保存的密钥向 /api/admin/session 校验，
 * 未登录时展示登录卡片，登录成功后才渲染 children。
 */
export function useAdminAuth(): AdminAuthState & { LoginGate: (props: { children: React.ReactNode }) => React.ReactNode } {
  const [passkey, setPasskey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authRequired, setAuthRequired] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const verify = useCallback(async (key: string) => {
    try {
      const res = await fetch('/api/admin/login', { headers: { 'X-Admin-Passkey': key }, cache: 'no-store' });
      const data = await res.json();
      setAuthRequired(Boolean(data.authRequired));
      if (res.ok && data.authenticated) {
        setPasskey(key);
        setAuthenticated(true);
        return true;
      }
      return false;
    } catch {
      setAuthRequired(null);
      return false;
    }
  }, []);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(PASSKEY_STORAGE) || '' : '';
    (async () => {
      await verify(saved);
      setLoading(false);
    })();
  }, [verify]);

  const login = useCallback(async (key: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: key }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || '登录失败' };
      }
      localStorage.setItem(PASSKEY_STORAGE, key);
      setAuthRequired(Boolean(data.authRequired));
      setPasskey(key);
      setAuthenticated(true);
      return { ok: true };
    } catch {
      return { ok: false, error: '网络异常，请稍后再试' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(PASSKEY_STORAGE);
    setPasskey('');
    setAuthenticated(false);
  }, []);

  const LoginGate = useCallback(({ children }: { children: React.ReactNode }) => {
    if (loading) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="animate-spin text-indigo-400" size={28} />
          <span className="text-xs font-black tracking-widest uppercase">正在验证身份...</span>
        </div>
      );
    }

    if (!authenticated) {
      return <AdminLoginCard authRequired={authRequired} onLogin={login} />;
    }

    return <>{children}</>;
  }, [loading, authenticated, authRequired, login]);

  return { passkey, authenticated, authRequired, loading, logout, LoginGate };
}

/** 登录卡片（无账号，仅密钥） */
export function AdminLoginCard({ authRequired, onLogin }: {
  authRequired: boolean | null;
  onLogin: (key: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setError('请输入管理密钥');
      return;
    }
    setSubmitting(true);
    setError('');
    const result = await onLogin(value);
    if (!result.ok) {
      setError(result.error || '密钥不正确');
      setValue('');
    }
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 220 }}
      className="max-w-md mx-auto mt-10"
    >
      <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 p-8 md:p-10 transition-colors duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30 mb-4">
            <LockKeyhole className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">管理员登录</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">无需账号，输入管理密钥即可进入控制台</p>
        </div>

        {authRequired === false && (
          <div className="mb-6 flex items-start gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>服务器未设置 ADMIN_PASSKEY 环境变量，后台当前对所有人开放。请在部署平台配置密钥后重新部署。</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="管理密钥"
            autoFocus
            className="w-full bg-white/50 dark:bg-slate-900/50 border border-white/50 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 font-mono outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5"
            >
              {error}
            </motion.p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-60 text-white text-sm font-black shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <LockKeyhole size={16} />}
            {submitting ? '验证中…' : '登录控制台'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
