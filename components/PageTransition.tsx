"use client";

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, PanInfo } from "framer-motion";
import { ReactNode } from "react";
import { useState, useEffect } from "react";

export default function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  // 移动端性能：不做 y 位移动画。页面滑动时其下所有 backdrop-blur 卡片每帧重算模糊，
  // 是切页掉帧主因。移动端仅做快速淡入，桌面端保留原动画。
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.matchMedia('(max-width: 767px)').matches);
  }, []);

  if (isMobile) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ease: "easeOut", duration: 0.25 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      // 刚加载页面时：往下偏 20px，完全透明
      initial={{ y: 20, opacity: 0 }}
      // 加载完毕后：回到原位，完全不透明
      animate={{ y: 0, opacity: 1 }}
      // 动画怎么演：用优雅的弹性物理动画，持续 0.8 秒
      transition={{ ease: "easeOut", duration: 0.8 }}
    >
      {children}
    </motion.div>
  );
}