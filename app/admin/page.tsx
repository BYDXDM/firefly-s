"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, MessageSquare, Coffee, Upload, MapPin, Sparkles, 
  Tag, ArrowLeft, Loader2, Image as ImageIcon, X, Shield, CheckCircle 
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';

export default function AdminPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 全局状态
  const [activeTab, setActiveTab] = useState<'post' | 'moment' | 'chatter'>('moment');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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

  // 提交发布
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
      type: activeTab,
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
      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Passkey': passkey },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '发布失败');
      }

      setNotification({ type: 'success', text: '恭喜！发布成功，正在传送至对应星域...' });

      // 重置表单
      setTitle('');
      setDescription('');
      setTags('');
      setCover('');
      setContent('');
      setUploadedImages([]);

      // 1.5秒后自动跳转
      setTimeout(() => {
        if (activeTab === 'post') router.push('/timeline');
        else if (activeTab === 'moment') router.push('/moments');
        else if (activeTab === 'chatter') router.push('/chatter');
      }, 1500);

    } catch (err: any) {
      console.error('发布失败:', err);
      setNotification({ type: 'error', text: err.message || '发布时发生了古怪的错误' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
          </div>

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
            </div>

            {/* 提交表单 */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
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

              {/* 简易安全令牌（作为发布防刷屏的安全门面） */}
              <div className="flex flex-col gap-2 md:max-w-xs">
                <label className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Shield size={13} className="text-indigo-500" /> 控制台通行密钥
                </label>
                <input
                  type="password"
                  placeholder="密钥保护(若未设置，随意输入即可喵)"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-xl md:rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                />
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
                      正在发布中...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      确认发布内容 (Publish)
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

        </div>
      </PageTransition>
    </div>
  );
}
