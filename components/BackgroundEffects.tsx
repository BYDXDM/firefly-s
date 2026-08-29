"use client";
import { useTheme } from './ThemeProvider';
import Fireflies from './Fireflies';
import Sakura from './Sakura';
import WindyGrass from './WindyGrass';

export default function BackgroundEffects() {
  const { isDark } = useTheme();

  // 性能关键：只渲染当前主题对应的粒子特效。
  // 之前用 opacity-0 隐藏另一个，但 CSS 动画在透明状态下依然全速运行，白白消耗一半性能。
  return (
    <>
      {isDark ? <Fireflies /> : <Sakura />}
      {/* 草地一直存在，但它内部会自动改变颜色 */}
      <WindyGrass />
    </>
  );
}
