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
        // 官方 spine-pixi 只有 4.x 运行时（读不了 3.8 骨架，报 "String in string table must not be null"）；
        // 资产是 Spine 3.8.96 二进制，改用 @pixi-spine/all-3.8（pixijs 官方 3.8 运行时）
        const { Spine, TextureAtlas, AtlasAttachmentLoader, SkeletonBinary }: any =
          await import('@pixi-spine/all-3.8');

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

        // 手动组装：并行取两页贴图 + 图集原文 + 骨架二进制。
        // 不走 Assets 自动 loader——它对多页 atlas 的贴图自动加载不可靠（整只渲染成白色），
        // images 元数据路径返回的 atlas 又缺 findRegion，手动构建是唯一稳妥路径
        const [tex1, tex2, atlasText, skelBuf]: any[] = await Promise.all([
          PIXI.Assets.load('/spine/alice/Aris_home.png'),
          PIXI.Assets.load('/spine/alice/Aris_home2.png'),
          fetch('/spine/alice/Aris_home.atlas').then((r) => r.text()),
          fetch('/spine/alice/Aris_home.skel').then((r) => r.arrayBuffer()),
        ]);
        if (destroyed) return;
        const textures: Record<string, any> = {
          'Aris_home.png': tex1.baseTexture,
          'Aris_home2.png': tex2.baseTexture,
        };
        const atlas = new TextureAtlas(
          atlasText,
          (line: string, callback: (t: any) => void) => callback(textures[line] || textures['Aris_home.png']),
          () => { /* 构建完成回调（pixi-spine 签名的第三参） */ },
        );
        const attachmentLoader = new AtlasAttachmentLoader(atlas);
        const binary = new SkeletonBinary(attachmentLoader);
        const spineData = binary.readSkeletonData(new Uint8Array(skelBuf));
        const spine: any = new Spine(spineData);
        spineRef.current = spine;
        app.stage.addChild(spine);

        // 模型自带房间场景（背景/三盏灯/椅子/双光环/顶部光效，共 8 个场景插槽），
        // 场景把可见范围撑到 12944 单位宽，不隐藏的话自动拟合会把镜头拉成全景条。
        // 挂件里只保留角色本体：attachment 置空 + color.a=0。
        // 注意遍历 spine.skeleton.slots（运行时活实例），spineData.slots 只是 SlotData 定义
        const SCENE_SLOT = /^(background|game_light_\d+|chair|halo \d+|top_light)$/i;
        const hiddenSlots: any[] = [];
        for (const slot of spine.skeleton?.slots || []) {
          // pixi-spine 的 Slot 实例没有 .name，名字在 slot.data.name 上
          const slotName: string = slot?.data?.name ?? slot?.name ?? '';
          if (SCENE_SLOT.test(slotName)) {
            try { slot.setAttachment(null); } catch { /* ignore */ }
            try { slot.color.a = 0; } catch { /* ignore */ }
            hiddenSlots.push(slot);
          }
        }
        // 动画播放中 attachment/color 时间线会把场景插槽复活（表现为一整块白布盖住角色），
        // 每帧渲染前强制压制一次
        if (hiddenSlots.length) {
          app.ticker.add(
            () => {
              for (const s of hiddenSlots) {
                if (s.attachment) { try { s.setAttachment(null); } catch { /* ignore */ } }
                if (s.color && s.color.a !== 0) s.color.a = 0;
              }
            },
            undefined,
            PIXI.UPDATE_PRIORITY.LOW
          );
        }

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

        // 两段式拟合，全程在画布空间做仿射修正，不碰骨骼单位坐标系（规避 spine 与 pixi 的 y 轴翻转差异）：
        // 1) 先把声明范围整体居中投进画布（居中锚点下内容必落在画布内，且与翻转方向无关）
        // 2) 采样角色实际占用的画布区域，等比放大到 92% 画布，把角色底边中心锚到画布底部
        const fitToCanvas = () => {
          const w = el.clientWidth || 140;
          const h = el.clientHeight || 210;
          app.renderer.resize(w, h);
          const declared = spine.getBounds();
          if (!declared || !isFinite(declared.width) || declared.width <= 1) return;
          const s0 = Math.min(w / declared.width, h / declared.height);
          const p0x = w / 2 - (declared.x + declared.width / 2) * s0;
          const p0y = h / 2 - (declared.y + declared.height / 2) * s0;
          spine.scale.set(s0);
          spine.position.set(p0x, p0y);
          app.render();
          const px = sampleAlphaBBox();
          // 采样不出内容，或内容几乎铺满画布（被大面积特效污染）时，保留粗适配结果
          if (!px || px.w < 4 || px.h < 4) return;
          if (px.w > w * 0.98 && px.h > h * 0.98) return;
          // 第二段：内容点满足 C' = P1 + R·(C − P0)，据此反解新位移，把角色底边中心锚到画布底部
          const R = Math.min((w * 0.92) / px.w, (h * 0.92) / px.h);
          if (!isFinite(R) || R <= 0) return;
          const cx = px.x + px.w / 2;
          const by = px.y + px.h;
          spine.scale.set(s0 * R);
          spine.position.set(w / 2 - (cx - p0x) * R, h - 2 - (by - p0y) * R);
          dbg(`fit: canvas=${w}x${h} px=${px.w.toFixed(0)}x${px.h.toFixed(0)} R=${R.toFixed(2)} scale=${(s0 * R).toFixed(4)} hidden=${hiddenSlots.length}`);
        };
        fitToCanvas();
        if (debug) {
          // 调试模式：同步渲染一帧并导出，供外部抓取查看拟合效果
          try {
            app.render();
            (window as any).__spineShot = (app.view as HTMLCanvasElement).toDataURL('image/png');
          } catch { /* 导出失败不影响运行 */ }
        }
        const ro = new ResizeObserver(fitToCanvas);
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
