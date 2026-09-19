"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createAliceVoiceEngine, type AliceVoiceEngine } from '@/lib/alice/voice';
import {
  POOL_PET, POOL_IDLE, POOL_FEED, pickSeasonVoice,
} from '@/data/alice-voice-lines';

// 🖼 看板娘：静态女仆爱丽丝立绘（Spine 动态版已回退，资源保留在 public/spine 备用）。
// 本组件只负责 UI：拖拽 / 气泡打字机 / 交互按钮 / 情绪状态。
// 语音播放、台词轮换、对话请求全部在 lib/alice/voice.ts，台词数据在 data/alice-voice-lines.ts。
export default function CyberCat() {
  const [isPetted, setIsPetted] = useState(false);
  // speech.main = the displayed line; speech.sub = its 中文翻译
  const [speech, setSpeech] = useState<{ main: string; sub?: string } | null>(null);
  const [displayedSpeech, setDisplayedSpeech] = useState<string>('');
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [catMood, setCatMood] = useState<'idle' | 'happy' | 'thinking'>('idle');

  const mountedRef = useRef(true);
  const petResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const spriteWrapRef = useRef<HTMLDivElement>(null);

  // 🔊 语音引擎（browser TTS can be muted; only user-triggered lines speak）
  const [voiceOn, setVoiceOn] = useState(true);
  const voiceOnRef = useRef(true);
  const engineRef = useRef<AliceVoiceEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = createAliceVoiceEngine({
      isVoiceOn: () => voiceOnRef.current,
      onLine: setSpeech,
    });
  }
  const engine = engineRef.current;

  useEffect(() => {
    mountedRef.current = true;
    let on = true;
    try { on = localStorage.getItem('alice-voice') !== 'off'; } catch { /* ignore */ }
    voiceOnRef.current = on;
    setVoiceOn(on);
    return () => {
      mountedRef.current = false;
      engine.dispose();
      if (petResetTimerRef.current) clearTimeout(petResetTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleVoice = () => {
    setVoiceOn((prev) => {
      const next = !prev;
      voiceOnRef.current = next;
      try { localStorage.setItem('alice-voice', next ? 'on' : 'off'); } catch { /* ignore */ }
      if (!next) {
        engine.cancel();
        setIsThinking(false);
        setIsBusy(false);
        setIsPetted(false);
        setCatMood('idle');
      }
      return next;
    });
  };

  // 对话/语音播完后的统一收尾
  const settle = () => {
    if (!mountedRef.current) return;
    setIsThinking(false);
    setIsBusy(false);
  };

  useEffect(() => {
    if (!speech) {
      setDisplayedSpeech('');
      return;
    }
    const full = speech.main;
    let currentText = '';
    let i = 0;
    const interval = setInterval(() => {
      currentText += full.charAt(i);
      setDisplayedSpeech(currentText);
      i++;
      if (i >= full.length) {
        clearInterval(interval);
      }
    }, 25); // 25ms per character for smooth speedy feel
    return () => clearInterval(interval);
  }, [speech]);

  // --- 🖱️ 交互事件：摸头 ---
  // 台词不再自写中文，改为官方日配原话（节日当天走节日语音）
  const handlePetCat = () => {
    if (isDraggingRef.current || isPetted || isBusy) return;
    setIsPetted(true);
    setCatMood('happy');
    setIsBusy(true);
    engine.speakVoice(pickSeasonVoice() ?? engine.pickVoice(POOL_PET, 'pet'), () => {
      setIsBusy(false);
      setIsPetted(false);
      setCatMood('idle');
    });
    petResetTimerRef.current = setTimeout(() => {
      setIsPetted(false);
      setCatMood('idle');
      petResetTimerRef.current = null;
    }, 3000);
  };

  // --- 🍓 交互事件：喂草莓牛奶 ---
  // 先播一条官方语音（日文音频 + 中文翻译），播完再显示 AI 的回复，字幕全程跟着声音走
  const handleFeed = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发摸猫或拖拽
    if (isBusy) return;
    setShowInput(false); // 喂食时关掉输入框
    setIsThinking(true);
    setIsBusy(true);
    setCatMood('thinking');
    engine.askAlice("I just gave you a bottle of sweet strawberry milk! How will you react?", {
      onReply: (reply) => {
        setCatMood('happy');
        engine.speakVoice(engine.pickVoice(POOL_FEED, 'feed'), () => {
          setCatMood('idle');
          engine.speakText(reply, 9000, settle);
        });
      },
      onError: () => {
        setCatMood('idle');
        engine.speakText("草莓牛奶很好喝…但爱丽丝的线路卡壳了……", 4000, settle);
      },
    });
  };

  // --- 💬 交互事件：发送聊天 ---
  const handle聊天Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isBusy) return;
    const userMessage = inputValue;
    setInputValue('');
    setShowInput(false);
    setIsThinking(true);
    setIsBusy(true);
    setCatMood('thinking');
    engine.askAlice(userMessage, {
      onReply: (reply) => {
        setCatMood('idle');
        engine.speakText(reply, 8500, settle);
      },
      onError: () => {
        setCatMood('idle');
        engine.speakText("通信中断了！这一定是主线剧情里才会出现的强敌……", 4000, settle);
      },
    });
  };

  // --- ✨ 交互事件：快捷提问 ---
  const handleQuick聊天 = (promptText: string) => {
    if (isBusy) return;
    setShowInput(false);
    setIsThinking(true);
    setIsBusy(true);
    setCatMood('thinking');
    engine.askAlice(promptText, {
      onReply: (reply) => {
        setCatMood('idle');
        engine.speakText(reply, 9000, settle);
      },
      onError: () => {
        setCatMood('idle');
        engine.speakText("Sensei，爱丽丝的大脑连接超时了……", 4000, settle);
      },
    });
  };

  // --- ⏳ 随机挂机语录：接官方「大厅」日配，the subtitle follows the audio (no 中文 TTS fallback) ---
  useEffect(() => {
    const randomTalkInterval = setInterval(() => {
      if (!speech && !showInput && !isThinking && !isBusy && Math.random() > 0.8) {
        engine.speakVoice(engine.pickVoice(POOL_IDLE, 'idle'));
      }
    }, 20000);

    return () => clearInterval(randomTalkInterval);
  }, [speech, showInput, isThinking, isBusy, engine]);

  // 快捷问题预设
  const quickPrompts = [
    { label: "🎮 今日运势", text: "给爱丽丝测一测今天的运势吧！用你独特的游戏抽卡方式！" },
    { label: "🚀 催更Sensei", text: "用爱丽丝的方式催我去写代码和更新博客！" },
    { label: "💡 游戏冷知识", text: "给爱丽丝讲一个只有老玩家才懂的游戏冷知识！" },
    { label: "❤️ 夸奖爱丽丝", text: "爱丽丝，你绝对是基沃托斯最勇敢、最可爱的英雄！" },
  ];

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.1}
      whileDrag={{ scale: 1.1, cursor: "grabbing" }}
      onDragStart={() => {
        isDraggingRef.current = true;
      }}
      onDragEnd={() => {
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 100);
      }}
      className="fixed bottom-24 right-4 sm:bottom-20 sm:right-20 z-[9999] flex flex-col items-center group cursor-grab active:cursor-grabbing"
    >
      {/* 💬 聊天气泡 */}
      <div className="relative w-full flex justify-center mb-6">
        <AnimatePresence>
          {(speech || isThinking) && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="absolute bottom-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md text-slate-700 dark:text-gray-200 px-4 py-3 rounded-2xl shadow-2xl border border-gray-100/50 dark:border-slate-700/50 text-sm w-[240px] max-w-[calc(100vw-2.5rem)] sm:w-[300px] sm:max-w-[300px] break-words text-center leading-relaxed"
              style={{ pointerEvents: 'none', transformOrigin: 'bottom center' }}
            >
              {/* 内层单独裁剪：超长回复不会顶出屏幕，同时不影响下方气泡尖角 */}
              <div className="max-h-[40vh] overflow-hidden">
                {speech ? (
                  <div className="space-y-1.5">
                    {/* 主行：与正在播放的语音逐字对应（official voice＝日文原话） */}
                    <p className="whitespace-pre-line font-medium text-xs md:text-sm">{displayedSpeech}</p>
                    {/* 次行：中文翻译；AI 回复等纯中文台词没有翻译行 */}
                    {speech?.sub && (
                      <p className="text-[10px] md:text-[11px] font-normal leading-snug text-slate-400 dark:text-slate-500">{speech.sub}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 justify-center py-1 px-2">
                    <span className="text-xs text-indigo-500 dark:text-indigo-400 font-extrabold animate-pulse">爱丽丝思考中</span>
                    <motion.span animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block" />
                    <motion.span animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block" />
                    <motion.span animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-800 border-b border-r border-gray-100 dark:border-slate-700 transform rotate-45"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🐈 猫咪本体 & 交互按钮区 */}
      <div className="relative">

        {/* 🌈 情绪光环背景 (根据状态产生不同颜色的呼吸流光) */}
        <div className={`absolute inset-0 -m-4 rounded-full blur-2xl transition-all duration-1000 -z-10 opacity-70 ${
          catMood === 'happy'
            ? 'bg-gradient-to-tr from-pink-400 to-rose-400 scale-110 animate-pulse'
            : catMood === 'thinking'
            ? 'bg-gradient-to-tr from-indigo-400 via-purple-400 to-pink-400 scale-125 animate-spin-slow'
            : 'bg-gradient-to-tr from-indigo-500/10 to-indigo-300/10 opacity-0 group-hover:opacity-100 group-hover:scale-100'
        }`} />

        {/* 🌟 交互按钮区 */}
        <div className="absolute -left-10 sm:-left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
            {/* 💬 聊天 */}
            <button
              onClick={(e) => {
                 e.stopPropagation();
                 if (!isBusy) setShowInput(!showInput);
              }}
              className="bg-white/90 dark:bg-slate-700/90 p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border border-gray-100 dark:border-slate-600 text-indigo-500 hover:text-indigo-600 flex items-center justify-center backdrop-blur-sm"
              title="聊天"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
              </svg>
            </button>

            {/* 🔊 语音开关 */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleVoice(); }}
              className="bg-white/90 dark:bg-slate-700/90 p-2 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border border-gray-100 dark:border-slate-600 text-indigo-500 flex items-center justify-center backdrop-blur-sm"
              title={voiceOn ? '关闭语音' : '开启语音'}
            >
              <span className="text-base leading-none">{voiceOn ? '🔊' : '🔇'}</span>
            </button>

            {/* 🍓 喂食按钮 */}
            <button
              onClick={handleFeed}
              disabled={isThinking}
              className={`bg-white/90 dark:bg-slate-700/90 p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border border-gray-100 dark:border-slate-600 flex items-center justify-center backdrop-blur-sm ${isThinking ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="喂草莓牛奶"
            >
              <span className="text-xl leading-none">🥛</span>
            </button>
        </div>

        {/* 爱丽丝立绘容器 */}
        <div
          ref={spriteWrapRef}
          className="w-[96px] h-[140px] sm:w-[140px] sm:h-[210px] relative cursor-pointer transition-transform duration-200 ease-out"
          style={{ perspective: '400px' }}
          onClick={handlePetCat}
          onMouseMove={(e) => {
            const el = spriteWrapRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const dx = (e.clientX - rect.left) / rect.width - 0.5;
            el.style.transform = `rotateY(${(dx * 16).toFixed(1)}deg)`;
          }}
          onMouseLeave={() => { if (spriteWrapRef.current) spriteWrapRef.current.style.transform = ''; }}
        >
          <style>{`
            @keyframes spin-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .animate-spin-slow {
              animation: spin-slow 12s linear infinite;
            }
            .cat-sprite {
              width: 100%;
              height: 100%;
              background-image: url('/alice-sprite.webp');
              background-size: contain;
              background-position: center bottom;
              background-repeat: no-repeat;
            }
            /* 🌙 夜间差分：月光滤镜 */
            html.dark .cat-sprite {
              filter: brightness(0.88) saturate(0.92) drop-shadow(0 14px 20px rgba(30, 27, 75, 0.55));
            }
            /* 单张立绘：不再做精灵图帧动画，改用轻量浮动/摇摆（合成器动画） */
            .cat-idle {
              animation: alice-idle 3.2s ease-in-out infinite;
            }
            .cat-petted {
              animation: alice-pet 0.7s ease-in-out infinite;
            }
            .cat-thinking {
              animation: alice-idle 1.1s ease-in-out infinite;
            }
            @keyframes alice-idle {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
            }
            @keyframes alice-pet {
              0%, 100% { transform: rotate(-4deg) scale(1.05); }
              50% { transform: rotate(4deg) scale(1.05); }
            }
          `}</style>
          <div
            className={`cat-sprite drop-shadow-2xl ${isPetted ? 'cat-petted' : isThinking ? 'cat-thinking' : 'cat-idle'}`}
          />
        </div>
      </div>

      {/* ⌨️ 互动面板（向左优雅划出，包含快捷问题与手动输入框） */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.9 }}
            className="absolute right-[100px] sm:right-[135px] bottom-0 flex flex-col gap-2.5 z-20 items-end"
          >
            {/* 💡 快捷问题气泡群 (只有当未在思考时展现) */}
            {!isThinking && (
              <div className="flex flex-col gap-1.5 items-end max-w-[220px] sm:max-w-[260px] md:max-w-[320px]">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt.label}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuick聊天(prompt.text);
                    }}
                    className="bg-white/90 dark:bg-slate-800/90 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 rounded-full px-3 py-1 text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95 backdrop-blur-sm cursor-pointer whitespace-nowrap"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            )}

            {/* ⌨️ 手动输入栏 */}
            <form
              onSubmit={handle聊天Submit}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-1.5 rounded-full shadow-2xl flex items-center border border-gray-200/80 dark:border-slate-700/80 w-48 sm:w-56 md:w-64"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isThinking ? "爱丽丝正在飞速思考..." : "跟爱丽丝说点啥……"}
                className="bg-transparent border-none outline-none text-sm px-3 py-1 w-full dark:text-white placeholder-gray-400 font-medium"
                disabled={isBusy}
                autoFocus
              />
              <button
                type="submit"
                disabled={isThinking || !inputValue.trim()}
                className={`rounded-full p-1.5 ml-1 flex items-center justify-center transition-colors shrink-0 ${
                  isThinking || !inputValue.trim()
                    ? 'bg-gray-200 text-gray-400 dark:bg-slate-700'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
