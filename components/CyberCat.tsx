"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CyberCat() {
  const [isPetted, setIsPetted] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const [displayedSpeech, setDisplayedSpeech] = useState<string>('');
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [catMood, setCatMood] = useState<'idle' | 'happy' | 'thinking'>('idle');

  const chatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);

  // --- 📝 逐字打字机效果 ---
  useEffect(() => {
    if (!speech) {
      setDisplayedSpeech('');
      return;
    }
    let currentText = '';
    let i = 0;
    const interval = setInterval(() => {
      currentText += speech.charAt(i);
      setDisplayedSpeech(currentText);
      i++;
      if (i >= speech.length) {
        clearInterval(interval);
      }
    }, 25); // 25ms per character for smooth speedy feel
    return () => clearInterval(interval);
  }, [speech]);

  // --- 💬 说话功能 ---
  const speak = (text: string, duration = 8000) => {
    setSpeech(text);
    if (chatTimeoutRef.current) clearTimeout(chatTimeoutRef.current);
    chatTimeoutRef.current = setTimeout(() => {
      setSpeech(null);
    }, duration);
  };

  // --- 🖱️ 交互事件：摸猫猫 ---
  const petLines = [
    "诶嘿嘿…被Sensei摸头的话，爱丽丝会充满干劲的！攻击力暂时提升！",
    "邦吧咔邦！", // 游戏内语音台词
  ];
  const handlePetCat = () => {
    if (isDraggingRef.current) return;
    if (isPetted) return;
    setIsPetted(true);
    setCatMood('happy');
    speak(petLines[Math.floor(Math.random() * petLines.length)], 3000);
    setTimeout(() => {
      setIsPetted(false);
      setCatMood('idle');
    }, 3000);
  };

  // --- 🍓 交互事件：喂草莓牛奶 ---
  const handleFeed = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发摸猫或拖拽
    if (isThinking) return;

    setShowInput(false); // 喂食时关掉输入框
    setIsThinking(true);
    setCatMood('thinking');
    if (chatTimeoutRef.current) clearTimeout(chatTimeoutRef.current);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "我刚刚给了你一瓶甜甜的草莓牛奶！你有什么表示？" }),
      });

      if (!res.ok) throw new Error('API Error');

      const data = await res.json();
      setCatMood('happy');
      speak(`咕嘟咕嘟… 好耶！草莓牛奶补给完成！\n\n${data.reply}`, 8000);
      setTimeout(() => setCatMood('idle'), 8000);
    } catch (error) {
      setCatMood('idle');
      speak("草莓牛奶很好喝…但爱丽丝的线路卡壳了……", 4000);
    } finally {
      setIsThinking(false);
    }
  };

  // --- 💬 交互事件：发送聊天 ---
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isThinking) return;

    const userMessage = inputValue;
    setInputValue('');
    setShowInput(false);
    setIsThinking(true);
    setCatMood('thinking');
    if (chatTimeoutRef.current) clearTimeout(chatTimeoutRef.current);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!res.ok) throw new Error('API Error');

      const data = await res.json();
      setCatMood('idle');
      speak(data.reply, 8500);
    } catch (error) {
      setCatMood('idle');
      speak("通信中断了！这一定是主线剧情里才会出现的强敌……", 4000);
    } finally {
      setIsThinking(false);
    }
  };

  // --- ✨ 交互事件：快捷提问 ---
  const handleQuickChat = async (promptText: string) => {
    if (isThinking) return;
    setShowInput(false);
    setIsThinking(true);
    setCatMood('thinking');
    if (chatTimeoutRef.current) clearTimeout(chatTimeoutRef.current);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptText }),
      });

      if (!res.ok) throw new Error('API Error');

      const data = await res.json();
      setCatMood('idle');
      speak(data.reply, 9000);
    } catch (error) {
      setCatMood('idle');
      speak("教官，爱丽丝的大脑连接超时了……", 4000);
    } finally {
      setIsThinking(false);
    }
  };

  // --- ⏳ 随机挂机语录 ---
  useEffect(() => {
    const randomBarks = [
      "今天也是适合推主线的好天气！",
      "好困哦…爱丽丝的MP快耗尽了……",
      "教官，快去开发新游戏！",
      "我的草莓牛奶藏哪里去了？",
      "怎么没人理爱丽丝……",
    ];
    const randomTalkInterval = setInterval(() => {
      if (!speech && !showInput && !isThinking && Math.random() > 0.8) {
        const randomMsg = randomBarks[Math.floor(Math.random() * randomBarks.length)];
        speak(randomMsg, 4000);
      }
    }, 20000);

    return () => clearInterval(randomTalkInterval);
  }, [speech, showInput, isThinking]);

  // 快捷问题预设
  const quickPrompts = [
    { label: "🎮 今日运势", text: "给爱丽丝测一测今天的运势吧！用你独特的游戏抽卡方式！" },
    { label: "🚀 催更教官", text: "用爱丽丝的方式催我去写代码和更新博客！" },
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
      className="fixed bottom-20 right-20 z-[9999] flex flex-col items-center group cursor-grab active:cursor-grabbing"
    >
      {/* 💬 聊天气泡 */}
      <div className="relative w-full flex justify-center mb-6">
        <AnimatePresence>
          {(speech || isThinking) && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="absolute bottom-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md text-slate-700 dark:text-gray-200 px-4 py-3 rounded-2xl shadow-2xl border border-gray-100/50 dark:border-slate-700/50 text-sm w-[240px] max-w-[240px] break-words text-center leading-relaxed"
              style={{ pointerEvents: 'none', transformOrigin: 'bottom center' }}
            >
              {isThinking ? (
                <div className="flex items-center gap-1.5 justify-center py-1 px-2">
                  <span className="text-xs text-indigo-500 dark:text-indigo-400 font-extrabold animate-pulse">爱丽丝思考中</span>
                  <motion.span animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block" />
                  <motion.span animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block" />
                  <motion.span animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block" />
                </div>
              ) : (
                <span className="whitespace-pre-line font-medium text-xs md:text-sm">{displayedSpeech}</span>
              )}
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
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
            {/* 💬 聊天按钮 */}
            <button
              onClick={(e) => {
                 e.stopPropagation();
                 setShowInput(!showInput);
              }}
              className="bg-white/90 dark:bg-slate-700/90 p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border border-gray-100 dark:border-slate-600 text-indigo-500 hover:text-indigo-600 flex items-center justify-center backdrop-blur-sm"
              title="聊天"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
              </svg>
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
          className="w-[140px] h-[210px] relative cursor-pointer"
          onClick={handlePetCat}
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
          <div className={`cat-sprite drop-shadow-2xl ${isPetted ? 'cat-petted' : isThinking ? 'cat-thinking' : 'cat-idle'}`} />
        </div>
      </div>

      {/* ⌨️ 互动面板（向左优雅划出，包含快捷问题与手动输入框） */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.9 }}
            className="absolute right-[135px] bottom-0 flex flex-col gap-2.5 z-20 items-end"
          >
            {/* 💡 快捷问题气泡群 (只有当未在思考时展现) */}
            {!isThinking && (
              <div className="flex flex-col gap-1.5 items-end max-w-[260px] md:max-w-[320px]">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt.label}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickChat(prompt.text);
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
              onSubmit={handleChatSubmit}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-1.5 rounded-full shadow-2xl flex items-center border border-gray-200/80 dark:border-slate-700/80 w-56 md:w-64"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isThinking ? "爱丽丝正在飞速思考..." : "跟爱丽丝说点啥……"}
                className="bg-transparent border-none outline-none text-sm px-3 py-1 w-full dark:text-white placeholder-gray-400 font-medium"
                disabled={isThinking}
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
