"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '../siteConfig';

// 开机画面：什亭之匣（Shittim Chest）启动主题
const BOOT_LINES = [
  '正在与联邦学生会同步…',
  '检测到老师的访问…',
  '阿罗娜系统启动中…',
  '什亭之匣就绪，欢迎回来，老师',
];

export default function SplashScreen() {
  const [show, setShow] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [bootLine, setBootLine] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    let hasSeenSplash = false;
    try {
      hasSeenSplash = sessionStorage.getItem('hasSeenSplash') === 'true';
    } catch (e) {
      // If sessionStorage access is denied (e.g., in a sandboxed iframe), fall back to skipping splash to prevent a blank page
      hasSeenSplash = true;
    }

    if (!hasSeenSplash) {
      setShow(true);
      const lineTimer = setInterval(() => {
        setBootLine((prev) => Math.min(prev + 1, BOOT_LINES.length - 1));
      }, 550);
      const timer = setTimeout(() => {
        exitSplash();
      }, 2200);
      return () => { clearTimeout(timer); clearInterval(lineTimer); };
    } else {
      // 容错处理：确保直接访问时类名存在
      try {
        document.documentElement.classList.add('splash-seen');
      } catch (e) {}
    }
  }, []);

  const exitSplash = () => {
    setShow(false);
    try {
      sessionStorage.setItem('hasSeenSplash', 'true');
    } catch (e) {}

    // 【核心解封】：动画快结束时，给 html 加上类名，CSS 会自动把内容显示出来
    setTimeout(() => {
      try {
        document.documentElement.classList.add('splash-seen');
      } catch (e) {}
    }, 500);
  };

  if (!isMounted) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash-screen-container"
          exit={{ opacity: 0, scale: 1.08, filter: "blur(18px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-slate-950"
        >
          {/* 背景光晕 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-indigo-600/15 blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col items-center px-6">
            {/* 什亭之匣平板轮廓 + 站长头像 */}
            <div className="relative w-28 h-20 mb-8">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500 opacity-50 blur-md"
              />
              <div className="relative w-full h-full rounded-xl border-2 border-sky-300/60 bg-slate-900 shadow-[0_0_28px_rgba(56,189,248,0.35)] p-1.5 flex items-center justify-center">
                <img src={siteConfig.avatarUrl} alt="Avatar" className="w-full h-full rounded-lg object-cover" />
                {/* 摄像头点 */}
                <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sky-300/80" />
              </div>
            </div>

            <h1 className="text-xl font-black text-sky-50 mb-1 tracking-[0.35em] uppercase">
              什亭之匣
            </h1>
            <p className="text-[10px] font-black text-sky-400/70 tracking-[0.45em] mb-8">SHITTIM CHEST · BOOT</p>

            <div className="w-48 h-[1.5px] bg-slate-800 relative mb-4">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.9, ease: "easeInOut" }}
                className="absolute top-0 left-0 h-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]"
              />
            </div>

            {/* 启动台词轮播 */}
            <div className="h-5 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={bootLine}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="text-[11px] font-bold text-slate-400 tracking-widest text-center"
                >
                  {BOOT_LINES[bootLine]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
