"use client";

import { useEffect, useRef } from 'react';

// 爱丽丝 Spine 看板娘：BA 主页同款小人（Spine 3.8 二进制骨架）
// pixi 只在浏览器端动态加载；任何一步失败都回调 onError，由父组件回退到静态立绘
export default function AliceSpine({
  playSignal,
  onReady,
  onError,
}: {
  playSignal: number;
  onReady: () => void;
  onError: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<any>(null);
  const appRef = useRef<any>(null);
  const animsRef = useRef<{ idle: string; tap: string[] }>({ idle: '', tap: [] });
  const lastSignalRef = useRef(playSignal);
  const stateRef = useRef<'loading' | 'ready' | 'error'>('loading');

  // 初始化 pixi + 加载骨架
  useEffect(() => {
    let destroyed = false;
    const el = wrapRef.current;
    if (!el) return;

    let cleanupResize: (() => void) | undefined;
    let cleanupVisibility: (() => void) | undefined;

    (async () => {
      try {
        const PIXI: any = await import('pixi.js');
        const { Spine }: any = await import('@esotericsoftware/spine-pixi');

        if (destroyed) return;
        const app = new PIXI.Application({
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          width: el.clientWidth || 140,
          height: el.clientHeight || 210,
        });
        const canvas = app.view as HTMLCanvasElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        el.appendChild(canvas);
        appRef.current = app;

        // 官方 spine-pixi 运行时：先用它注册的解析器预载骨架(→Uint8Array)与图集(→TextureAtlas，连带加载贴图)，
        // 再调用 Spine.from 从 pixi Assets 缓存同步构建
        await PIXI.Assets.load(['/spine/alice/Aris_home.skel', '/spine/alice/Aris_home.atlas']);
        if (destroyed) return;
        const spine: any = Spine.from('/spine/alice/Aris_home.skel', '/spine/alice/Aris_home.atlas');
        spineRef.current = spine;
        app.stage.addChild(spine);

        // 动画分组：优先 start_idle_01 常驻循环（与 BA 官方查看器一致），tap 组用于摸头/喂食插播
        const names: string[] = (spine.spineData?.animations || []).map((a: any) => a.name);
        const idle =
          names.find((n) => n.toLowerCase() === 'start_idle_01') ||
          names.find((n) => /idle/i.test(n)) ||
          names[0] || '';
        const tap = names.filter((n) => n !== idle && /touch|special|event|move|tap/i.test(n));
        animsRef.current = { idle, tap };
        if (idle) spine.state.setAnimation(0, idle, true);

        // 适配容器：渲染一帧后按"非透明像素"反推真实可见范围
        // （骨架网格声明范围近万单位，含大量不可见特效占位，按全网格适配会把人缩没）
        const debug = typeof window !== 'undefined' && window.location.search.includes('spinedebug');
        const dbg = (msg: string) => {
          if (!debug) return;
          let d = document.getElementById('spine-debug');
          if (!d) { d = document.createElement('div'); d.id = 'spine-debug'; d.style.cssText = 'position:fixed;left:8px;top:8px;z-index:99999;background:#000c;color:#0f0;font:12px/1.5 monospace;padding:6px 10px;white-space:pre;pointer-events:none'; document.body.appendChild(d); }
          d.textContent = msg;
        };
        dbg('fit: init');

        /** 从 WebGL 画布采样非透明像素的包围盒（CSS 像素） */
        const sampleAlphaBBox = (): { x: number; y: number; w: number; h: number } | null => {
          try {
            const src = app.view as HTMLCanvasElement;
            const c2 = document.createElement('canvas');
            c2.width = src.width; c2.height = src.height;
            const ctx = c2.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(src, 0, 0);
            const img = ctx.getImageData(0, 0, c2.width, c2.height).data;
            let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
            for (let y = 0; y < c2.height; y++) {
              for (let x = 0; x < c2.width; x++) {
                if (img[(y * c2.width + x) * 4 + 3] > 16) {
                  if (x < minX) minX = x; if (x > maxX) maxX = x;
                  if (y < minY) minY = y; if (y > maxY) maxY = y;
                }
              }
            }
            if (maxX < minX || maxY < minY) return null;
            const r = Math.min(window.devicePixelRatio || 1, 2);
            return { x: minX / r, y: minY / r, w: (maxX - minX + 1) / r, h: (maxY - minY + 1) / r };
          } catch { return null; }
        };

        // 第一步：1 倍缩放渲染一帧，采样"真正画出来了"的内容范围（单位坐标系）
        let unitBox: { x: number; y: number; w: number; h: number } | null = null;
        try {
          const w = el.clientWidth || 140, h = el.clientHeight || 210;
          app.renderer.resize(w, h);
          spine.scale.set(1);
          spine.position.set(0, 0);
          app.render();
          const px = sampleAlphaBBox();
          if (px && px.w > 2 && px.h > 2) {
            unitBox = { x: px.x / 1, y: px.y / 1, w: px.w / 1, h: px.h / 1 };
          }
        } catch { /* 采样失败走 bounds 兜底 */ }

        if (!unitBox) {
          const b = spine.getBounds();
          if (b && isFinite(b.width) && b.width > 1) unitBox = { x: b.x, y: b.y, w: b.width, h: b.height };
        }

        /** 按 unitBox 等比缩放、底部居中 */
        const applyFit = () => {
          if (!unitBox) return;
          const w = el.clientWidth || 140;
          const h = el.clientHeight || 210;
          app.renderer.resize(w, h);
          const s = Math.min(Math.min(w / unitBox.w, h / unitBox.h) * 0.92, 3);
          if (!isFinite(s) || s <= 0) return;
          spine.scale.set(s);
          spine.position.set(w / 2 - (unitBox.x + unitBox.w / 2) * s, h - 2 - (unitBox.y + unitBox.h) * s);
          dbg(`fit: canvas=${w}x${h} unitBox=${unitBox.w.toFixed(0)}x${unitBox.h.toFixed(0)} @(${unitBox.x.toFixed(0)},${unitBox.y.toFixed(0)}) scale=${s.toFixed(3)} anims=${names.length} idle=${idle}`);
        };
        applyFit();
        const ro = new ResizeObserver(applyFit);
        ro.observe(el);
        cleanupResize = () => ro.disconnect();

        // 标签页隐藏时停渲染，省电省性能
        const onVis = () => {
          if (document.hidden) app.ticker.stop();
          else app.ticker.start();
        };
        document.addEventListener('visibilitychange', onVis);
        cleanupVisibility = () => document.removeEventListener('visibilitychange', onVis);

        stateRef.current = 'ready';
        onReady();
      } catch (e) {
        console.warn('[AliceSpine] 加载失败，回退静态立绘:', e);
        if (!destroyed) {
          stateRef.current = 'error';
          onError();
        }
      }
    })();

    return () => {
      destroyed = true;
      cleanupResize?.();
      cleanupVisibility?.();
      try { appRef.current?.destroy(true, { children: true, texture: true, baseTexture: true }); } catch { /* ignore */ }
      appRef.current = null;
      spineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 摸头/喂食信号：插播一个 tap 动画，播完自动回 idle
  useEffect(() => {
    if (playSignal === lastSignalRef.current) return;
    lastSignalRef.current = playSignal;
    const spine = spineRef.current;
    if (stateRef.current !== 'ready' || !spine) return;
    const { idle, tap } = animsRef.current;
    if (!tap.length || !idle) return;
    const name = tap[Math.floor(Math.random() * tap.length)];
    try {
      spine.state.setAnimation(0, name, false);
      spine.state.addAnimation(0, idle, true, 0);
    } catch { /* 动画名异常时保持当前状态 */ }
  }, [playSignal]);

  return <div ref={wrapRef} className="w-full h-full pointer-events-none select-none" />;
}
