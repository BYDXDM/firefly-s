"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, MessageSquare, Coffee, Upload, MapPin, Sparkles,
  Tag, ArrowLeft, Loader2, Image as ImageIcon, X, Shield, CheckCircle,
  Settings, LogOut, ShieldAlert, NotebookPen, Pencil, Trash2
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { useAdminAuth } from '../../components/AdminAuth';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import { siteConfig } from '../../siteConfig';
import { detectVisitorLocation } from '../../lib/visitorGeo';

export default function AdminPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { passkey, authenticated, authRequired, logout, LoginGate } = useAdminAuth();

  // 全局状态
  const [activeTab, setActiveTab] = useState<'post' | 'moment' | 'chatter' | 'manage' | 'settings'>('moment');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 内容管理（文章的删除与编辑）
  const [manageList, setManageList] = useState<{ slug: string; title: string; date: string; tags: string[] }[] | null>(null);
  const [manageLoading, setManageLoading] = useState(false);
  const [editSlug, setEditSlug] = useState('');

  // 头像设置
  const [currentAvatar, setCurrentAvatar] = useState(siteConfig.avatarUrl);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // 表单字段
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [cover, setCover] = useState('');
  const [mood, setMood] = useState('思考');
  const [location, setLocation] = useState('江西省 南昌市');
  const [content, setContent] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');

  // 媒体管理
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // 实时编译 Markdown
  useEffect(() => {
    if (activeTab === 'moment') return; // 说说不需要复杂的 md 渲染
    
    const processMarkdown = async () => {
      try {
        const file = await unified()
          .use(remarkParse)
          .use(remarkHtml)
          .process(content || '');
        setPreviewHtml(String(file));
      } catch (error) {
        console.error('Markdown 解析失败:', error);
      }
    };
    
    const timer = setTimeout(() => processMarkdown(), 300);
    return () => clearTimeout(timer);
  }, [content, activeTab]);

  // 自动淡出提示信息
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // 📍 发布位置自动定位：登录后探测管理员真实 IP 归属地（走国内直连服务，规则模式代理下不被代理出口干扰）；手动改过就不覆盖
  useEffect(() => {
    if (!authenticated) return;
    if (location.trim() && location.trim() !== '江西省 南昌市') return;
    let cancelled = false;
    detectVisitorLocation().then((loc) => {
      if (cancelled || !loc) return;
      const prov = (loc.province || '').replace(/省$/, '').trim();
      const city = (loc.city || '').replace(/市$/, '').trim();
      const label = prov && city ? (prov === city ? prov : `${prov} ${city}`) : (city || prov);
      if (label) setLocation(label);
    });
    return () => { cancelled = true; };
  }, [authenticated, location]);

  // 拉取文章管理列表
  const fetchManageList = async (key: string) => {
    setManageLoading(true);
    try {
      const res = await fetch('/api/admin/posts', { headers: { 'X-Admin-Passkey': key }, cache: 'no-store' });
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      setManageList(data.items || []);
    } catch {
      setNotification({ type: 'error', text: '文章列表加载失败' });
    } finally {
      setManageLoading(false);
    }
  };

  // 进入内容管理页时自动加载
  useEffect(() => {
    if (authenticated && activeTab === 'manage' && manageList === null) {
      fetchManageList(passkey);
    }
  }, [authenticated, activeTab, manageList, passkey]);

  // 进入编辑模式：拉取文章内容填充表单
  const handleEditPost = async (slug: string) => {
    try {
      const res = await fetch(`/api/admin/posts?slug=${encodeURIComponent(slug)}`, {
        headers: { 'X-Admin-Passkey': passkey },
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.post) throw new Error(data.error || '文章加载失败');
      const post = data.post;
      setEditSlug(slug);
      setTitle(post.title || '');
      setDescription(post.description || '');
      setTags(Array.isArray(post.tags) ? post.tags.join(', ') : '');
      setCover(post.cover || '');
      setContent(post.content || '');
      setActiveTab('post');
      setNotification({ type: 'success', text: `已载入《${post.title || slug}》，修改后点击「保存修改」` });
    } catch (err) {
      setNotification({ type: 'error', text: err instanceof Error ? err.message : '文章加载失败' });
    }
  };

  // 删除文章
  const handleDeletePost = async (slug: string) => {
    if (!confirm(`确定删除文章《${slug}》吗？此操作不可撤销。`)) return;
    try {
      const res = await fetch(`/api/admin/posts?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Passkey': passkey },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || '删除失败');
      setNotification({ type: 'success', text: data.message || '文章已删除' });
      setManageList(null);
    } catch (err) {
      setNotification({ type: 'error', text: err instanceof Error ? err.message : '删除失败' });
    }
  };

  // 头像上传
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setNotification({ type: 'error', text: '仅支持 JPG / PNG / WebP / GIF 格式喵~' });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setNotification({ type: 'error', text: '图片太大了，请控制在 3MB 以内' });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/avatar', {
        method: 'POST',
        headers: { 'X-Admin-Passkey': passkey },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || '头像更新失败');
      setCurrentAvatar(`${data.previewUrl || data.avatarUrl}?t=${Date.now()}`);
      setNotification({ type: 'success', text: data.message || '头像已更新' });
    } catch (err) {
      setNotification({ type: 'error', text: err instanceof Error ? err.message : '头像更新失败' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // 拖拽上传文件处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };

  // 真正的上传函数
  const uploadFiles = async (files: FileList) => {
    setIsUploading(true);
    setNotification(null);
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // 仅限图片格式
      if (!file.type.startsWith('image/')) {
        setNotification({ type: 'error', text: '仅支持上传图片格式哦喵~' });
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'X-Admin-Passkey': passkey },
          body: formData,
        });

        if (!res.ok) throw new Error('服务器上传出错');
        const data = await res.json();
        if (data.url) {
          newUrls.push(data.url);
        }
      } catch (err: any) {
        console.error('上传失败:', err);
        setNotification({ type: 'error', text: `图片「${file.name}」上传失败，请重试` });
      }
    }

    if (newUrls.length > 0) {
      if (activeTab === 'moment') {
        setUploadedImages(prev => [...prev, ...newUrls]);
      } else {
        // 文章或杂谈的封面图，只保留最新一张
        setCover(newUrls[0]);
      }
      setNotification({ type: 'success', text: `成功上传了 ${newUrls.length} 张图片喵呜！` });
    }
    setIsUploading(false);
  };

  // 移除已上传的图片
  const removeImage = (index: number) => {
    if (activeTab === 'moment') {
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setCover('');
    }
  };

  // 提交发布（编辑模式下改为更新已有文章）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setNotification({ type: 'error', text: '写点什么内容吧，内容不能为空哦喵~' });
      return;
    }

    if (activeTab === 'post' && !title.trim()) {
      setNotification({ type: 'error', text: '文章标题是必填的喵！' });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    const payload = {
      type: activeTab === 'manage' ? 'post' : activeTab,
      title: activeTab !== 'moment' ? title : undefined,
      description: activeTab !== 'moment' ? description : undefined,
      tags: activeTab !== 'moment' ? tags : undefined,
      cover: activeTab !== 'moment' ? cover : undefined,
      mood: activeTab === 'chatter' ? mood : undefined,
      location: activeTab === 'moment' ? location : undefined,
      images: activeTab === 'moment' ? uploadedImages : undefined,
      content: content,
    };

    try {
      // 编辑模式：更新已有文章
      if (activeTab === 'post' && editSlug) {
        const res = await fetch('/api/admin/posts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Passkey': passkey },
          body: JSON.stringify({ slug: editSlug, title, description, tags, cover, content }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || '更新失败');
        setNotification({ type: 'success', text: data.message || '文章已更新' });
        setEditSlug('');
        setTitle(''); setDescription(''); setTags(''); setCover(''); setContent('');
        setManageList(null); // 让内容管理列表下次进入时刷新
        setIsSubmitting(false);
        return;
      }

      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Passkey': passkey },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '发布失败');
      }

      const result = await res.json().catch(() => ({}));
      setNotification({
        type: 'success',
        text: result.mode === 'github'
          ? '已提交到仓库，站点将在 1-2 分钟内自动重新部署后生效喵～'
          : '恭喜！发布成功，正在传送至对应星域...',
      });
      setManageList(null); // 让内容管理列表下次进入时刷新

      // 重置表单
      setTitle('');
      setDescription('');
      setTags('');
      setCover('');
      setContent('');
      setUploadedImages([]);

      // 1.5秒后自动跳转（GitHub 模式下内容需重新部署才生效，留在原地让用户看到提示）
      if (result.mode !== 'github') {
        setTimeout(() => {
          if (activeTab === 'post') router.push('/timeline');
          else if (activeTab === 'moment') router.push('/moments');
          else if (activeTab === 'chatter') router.push('/chatter');
        }, 1500);
      }

    } catch (err: any) {
      console.error('发布失败:', err);
      setNotification({ type: 'error', text: err.message || '发布时发生了古怪的错误' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LoginGate>
    <div className="min-h-screen relative pb-20 flex flex-col">
      <Navbar />

      <PageTransition>
        <div className="w-[92%] md:w-[85%] max-w-4xl mx-auto py-10 mt-24 relative z-10 flex-1 flex flex-col min-h-[85vh]">
          
          {/* 顶部标题与卡片 */}
          <div className="mb-10 text-center relative">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 tracking-tighter"
            >
              唯花控制台
            </motion.h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium italic opacity-80 flex items-center justify-center gap-1.5 md:gap-2">
              <Sparkles size={12} className="text-indigo-500 animate-pulse" />
              在这里自由发布你的文章、生活说说以及杂谈随笔吧喵~
            </p>
            <button
              type="button"
              onClick={logout}
              className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-rose-500 px-3 py-1.5 rounded-full transition-colors"
            >
              <LogOut size={13} /> 退出登录
            </button>
          </div>

          {authRequired === false && (
            <div className="mb-6 flex items-start gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>服务器未设置 ADMIN_PASSKEY 环境变量，后台当前对所有人开放。请在部署平台配置密钥后重新部署。</span>
            </div>
          )}

          {/* 通知浮层 */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border ${
                  notification.type === 'success' 
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30 text-rose-600 dark:text-rose-400'
                }`}
              >
                {notification.type === 'success' ? (
                  <CheckCircle size={18} className="shrink-0 text-emerald-500" />
                ) : (
                  <X size={18} className="shrink-0 text-rose-500" />
                )}
                <span className="text-sm font-bold tracking-wide">{notification.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 控制台面板 */}
          <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl rounded-3xl md:rounded-[40px] shadow-xl md:shadow-2xl border border-white/40 dark:border-white/10 p-6 md:p-12 w-full flex flex-col gap-8">
            
            {/* Tab 切换栏 */}
            <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200/40 dark:border-white/5 shadow-inner">
              <button
                type="button"
                onClick={() => { setActiveTab('moment'); setNotification(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs md:text-sm font-black transition-all ${
                  activeTab === 'moment' 
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-slate-500 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Coffee size={14} className="md:w-4 md:h-4" /> 记录说说 (Moment)
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('post'); setNotification(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs md:text-sm font-black transition-all ${
                  activeTab === 'post' 
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-slate-500 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <FileText size={14} className="md:w-4 md:h-4" /> 写篇文章 (Post)
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('chatter'); setNotification(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs md:text-sm font-black transition-all ${
                  activeTab === 'chatter' 
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-slate-500 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <MessageSquare size={14} className="md:w-4 md:h-4" /> 云端杂谈 (Chatter)
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('manage'); setNotification(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs md:text-sm font-black transition-all ${
                  activeTab === 'manage'
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-500 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <NotebookPen size={14} className="md:w-4 md:h-4" /> 内容管理
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('settings'); setNotification(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs md:text-sm font-black transition-all ${
                  activeTab === 'settings'
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-500 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Settings size={14} className="md:w-4 md:h-4" /> 站点设置
              </button>
            </div>

            {/* 内容管理面板：文章的编辑与删除 */}
            {activeTab === 'manage' && (
              <div className="flex flex-col gap-4">
                {manageLoading && (
                  <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-sm font-bold">
                    <Loader2 size={16} className="animate-spin text-indigo-400" /> 正在加载文章列表...
                  </div>
                )}
                {!manageLoading && manageList && manageList.length === 0 && (
                  <div className="text-center py-16 text-slate-400 dark:text-slate-500 font-bold">
                    还没有文章，去「写篇文章」发布第一篇吧～
                  </div>
                )}
                {!manageLoading && manageList && manageList.map((post) => (
                  <div
                    key={post.slug}
                    className="flex items-center gap-4 bg-white/40 dark:bg-slate-800/40 border border-slate-200/40 dark:border-white/5 rounded-2xl px-5 py-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-800 dark:text-white truncate">{post.title || post.slug}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-1">
                        {post.date}
                        {post.tags.length > 0 && <span className="ml-2 text-indigo-400">{post.tags.map((t) => `#${t}`).join(' ')}</span>}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditPost(post.slug)}
                      className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-600 px-3 py-2 rounded-full bg-indigo-500/10 transition-colors"
                    >
                      <Pencil size={12} /> 编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.slug)}
                      className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 px-3 py-2 rounded-full bg-rose-500/10 transition-colors"
                    >
                      <Trash2 size={12} /> 删除
                    </button>
                  </div>
                ))}
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1.5">
                  <Shield size={12} className="text-indigo-500" />
                  列表基于当前部署的站点快照；线上模式下的增删改会在重新部署后反映到列表中
                </p>
              </div>
            )}

            {/* 站点设置面板：头像等 */}
            {activeTab === 'settings' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-white/40 dark:bg-slate-800/40 border border-slate-200/40 dark:border-white/5 rounded-2xl p-6">
                  <img
                    src={currentAvatar}
                    alt="当前头像"
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-500/30 bg-white"
                  />
                  <div className="flex flex-col gap-2 text-center sm:text-left">
                    <p className="text-sm font-black text-slate-800 dark:text-white">站长头像</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                      支持 JPG / PNG / WebP / GIF，3MB 以内。保存后会自动更新全站头像；
                      线上模式需等待 1-2 分钟重新部署生效。
                    </p>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingAvatar}
                      onClick={() => avatarInputRef.current?.click()}
                      className="self-center sm:self-start mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-xs font-black shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                    >
                      {isUploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {isUploadingAvatar ? '上传中…' : '选择图片并保存'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1.5">
                  <Shield size={12} className="text-indigo-500" />
                  已通过密钥验证，发布与设置操作均受 ADMIN_PASSKEY 保护
                </p>
              </div>
            )}

            {/* 提交表单（管理与设置页不显示） */}
            {(activeTab === 'post' || activeTab === 'moment' || activeTab === 'chatter') && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

              {/* 编辑模式横幅 */}
              {activeTab === 'post' && editSlug && (
                <div className="flex items-center justify-between gap-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-4 py-3">
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-300">
                    正在编辑文章：{editSlug}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setEditSlug(''); setTitle(''); setDescription(''); setTags(''); setCover(''); setContent(''); }}
                    className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    取消编辑
                  </button>
                </div>
              )}
              
              {/* PC/杂谈专属字段：标题 */}
              {activeTab !== 'moment' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span>文章标题</span>
                    <span className="text-indigo-500 font-serif">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="请输入极富创意的标题..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-xs md:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                  />
                </div>
              )}

              {/* PC/杂谈专属字段：简要描述 */}
              {activeTab !== 'moment' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-300">简要描述</label>
                  <input
                    type="text"
                    placeholder="一句话介绍一下这篇大作吧..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-xs md:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
              )}

              {/* 标签与特定属性并列栏 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 标签栏：文章和杂谈可用 */}
                {activeTab !== 'moment' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Tag size={13} /> 标签 (英文逗号分隔)
                    </label>
                    <input
                      type="text"
                      placeholder="例如: GROMACS, 脑洞, 摸鱼"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-xs md:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold"
                    />
                  </div>
                )}

                {/* 杂谈专属：心情心情 */}
                {activeTab === 'chatter' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-300">随笔心情</label>
                    <select
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-xs md:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                    >
                      <option value="思考" className="bg-slate-900 text-white">🤔 思考中</option>
                      <option value="摸鱼" className="bg-slate-900 text-white">🐟 摸鱼中</option>
                      <option value="快乐" className="bg-slate-900 text-white">😄 快乐喵</option>
                      <option value="日常" className="bg-slate-900 text-white">💤 碎碎念</option>
                      <option value="学术" className="bg-slate-900 text-white">🧬 炼丹中</option>
                    </select>
                  </div>
                )}

                {/* 说说专属：发布地点 */}
                {activeTab === 'moment' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MapPin size={13} /> 所在地点
                    </label>
                    <input
                      type="text"
                      placeholder="例如: 江西省 南昌市"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-xs md:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                    />
                  </div>
                )}
              </div>

              {/* 拖拽式智能图片上传区域 */}
              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon size={14} /> 
                  {activeTab === 'moment' ? '图片相册上传 (可多张)' : '文章封面图'}
                </label>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl md:rounded-3xl p-6 md:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 relative overflow-hidden group ${
                    dragOver 
                      ? 'border-indigo-500 bg-indigo-500/5' 
                      : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/10 hover:bg-slate-100/10'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple={activeTab === 'moment'}
                    accept="image/*"
                    className="hidden"
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={36} className="text-indigo-500 animate-spin" />
                      <p className="text-xs md:text-sm text-slate-500 font-bold">后台加载数据并传送中，请稍候...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                        <Upload size={22} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200">
                          将图片拖拽至此，或 <span className="text-indigo-500 underline">点击浏览本地文件</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          支持 PNG、JPG、WEBP 格式，大小建议在 5MB 以内喵呜~
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* 上传图片展示面板 */}
                {((activeTab === 'moment' && uploadedImages.length > 0) || (activeTab !== 'moment' && cover)) && (
                  <div className="mt-4 bg-slate-100/30 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">
                      {activeTab === 'moment' ? `已上传图集 (${uploadedImages.length}张)` : '当前封面图'}
                    </p>
                    
                    <div className="flex flex-wrap gap-3">
                      {activeTab === 'moment' ? (
                        uploadedImages.map((imgUrl, index) => (
                          <div key={index} className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 group shadow-sm">
                            <img src={imgUrl} alt={`Uploaded ${index}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="relative w-32 aspect-video rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 group shadow-md">
                          <img src={cover} alt="Cover preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeImage(0); }}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 手写核心 Markdown 内容输入区域及实时预览 */}
              <div className="flex flex-col gap-2">
                <label className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText size={14} /> {activeTab !== 'moment' ? '内容正文与实时预览' : '内容正文'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium font-mono">
                    {activeTab !== 'moment' ? '支持标准 Markdown 语法' : '输入日常想说的话'}
                  </span>
                </label>
                {activeTab !== 'moment' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <textarea
                      required
                      placeholder="在这里挥洒你的汗水与墨水吧！\n\n## 甚至可以用 Markdown 语法噢喵呜~\n- 点两下回车开辟新天地。\n- 输入你的 GROMACS 模拟经验，或者泰拉大陆的源石病机制研究..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={12}
                      className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl p-4 md:p-6 text-xs md:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all leading-relaxed font-sans scrollbar-thin resize-none"
                    />
                    <div className="w-full h-full min-h-[300px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl p-4 md:p-6 text-xs md:text-sm text-slate-800 dark:text-white overflow-y-auto leading-relaxed font-sans scrollbar-thin">
                      {content ? (
                        <div 
                          className="prose dark:prose-invert prose-sm max-w-none prose-indigo break-words" 
                          dangerouslySetInnerHTML={{ __html: previewHtml }} 
                        />
                      ) : (
                        <div className="text-slate-400/80 italic flex items-center justify-center h-full w-full select-none">
                          在此实时预览 Markdown 渲染效果...
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <textarea
                    required
                    placeholder="今天发生了什么有趣的事？在这里记下来吧，说说能像朋友圈那样瞬间记录你所有的温度..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl p-4 md:p-6 text-xs md:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all leading-relaxed font-sans scrollbar-thin"
                  />
                )}
              </div>

              {/* 发布操作栏 */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 pt-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-500 transition-colors text-xs md:text-sm font-bold"
                >
                  <ArrowLeft size={14} /> 返回上一页
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/40 text-white rounded-xl md:rounded-2xl text-xs md:text-sm font-black tracking-widest shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.03] active:scale-[0.98] flex items-center gap-2 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      正在提交中...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      {activeTab === 'post' && editSlug ? '保存修改 (Save)' : '确认发布内容 (Publish)'}
                    </>
                  )}
                </button>
              </div>

            </form>
            )}

          </div>

        </div>
      </PageTransition>
    </div>
    </LoginGate>
  );
}
