// 🎧 爱丽丝语音引擎（deep module）
// CyberCat 等 UI 只见得到小 interface：speakVoice / speakText / cancel / askAlice / pickVoice。
// 藏在后面的是：操作计数取消语义、audioCache、音频元数据时长校正、
// 官方语音的轮换池（洗牌不重复 + 邦吧咔邦隔次触发）以及 /api/chat 的对话请求折叠。
// 只有一种声音：官方日配 mp3。AI 回复/报错等中文台词仅显示字幕、不发声（无浏览器 TTS）。
// 台词与场景池数据见 data/alice-voice-lines.ts；取消语义必须整体使用，不可拆散。

import {
  ALICE_VOICE_LINES, VOICE_BANG,
  type AliceVoiceLine,
} from '@/data/alice-voice-lines';

export type AliceLine = { main: string; sub?: string };

export interface AliceVoiceEngine {
  /** 播一条官方日配：日文原话 + 中文翻译字幕，时长跟随音频真实长度 */
  speakVoice(src: string, onDone?: () => void): void;
  /** 纯文字台词（AI 回复 / 报错提示）：仅显示字幕，不发声 */
  speakText(text: string, duration?: number, onDone?: () => void): void;
  /** 取消当前字幕/语音/计时（操作计数 +1，之后所有旧回调作废） */
  cancel(): void;
  /** 组件卸载时调用：作废一切在途回调并释放音频 */
  dispose(): void;
  /** 洗牌轮换取一条语音路径；邦吧咔邦每两次普通触发插入一次且不连续重复 */
  pickVoice(pool: string[], poolName: string): string;
  /** 对话统一入口：调 /api/chat 并解析回复；并发请求只有最后一个生效 */
  askAlice(message: string, opts: { onReply: (reply: string) => void; onError: () => void }): void;
}

export interface AliceVoiceEngineOptions {
  /** 语音总开关（开关本身与持久化归 UI 管） */
  isVoiceOn: () => boolean;
  /** 字幕出口：line 为 null 表示收起气泡 */
  onLine: (line: AliceLine | null) => void;
  /** 可注入的 Audio 构造器（测试时传 fake Audio 即可测取消语义） */
  audioFactory?: (src: string) => HTMLAudioElement;
}

export function createAliceVoiceEngine(options: AliceVoiceEngineOptions): AliceVoiceEngine {
  const { isVoiceOn, onLine } = options;
  const makeAudio = options.audioFactory ?? ((src: string) => new Audio(src));

  let speechOp = 0;        // 字幕/语音操作计数：任何新操作使其作废旧操作
  let requestOp = 0;       // /api/chat 请求计数：并发下只有最后一个请求能落地
  let disposed = false;
  let speechTimer: ReturnType<typeof setTimeout> | null = null;
  const audioCache: Record<string, HTMLAudioElement> = {};
  const metadataCleanup: Record<string, () => void> = {};

  // —— 轮换池状态：洗牌队列 + 触发计数 + 上一条（防邦吧咔邦连续重复）——
  const voiceQueues: Record<string, string[]> = {};
  let lastVoice: string | null = null;
  let voiceTriggerCount = 0;

  const clearSpeechTimer = () => {
    if (speechTimer) {
      clearTimeout(speechTimer);
      speechTimer = null;
    }
  };

  const stopAllAudio = () => {
    Object.values(metadataCleanup).forEach((cleanup) => cleanup());
    Object.keys(metadataCleanup).forEach((k) => delete metadataCleanup[k]);
    Object.values(audioCache).forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
      audio.onended = null;
    });
  };

  const ensureAudio = (src: string) => {
    let audio = audioCache[src];
    if (!audio) {
      audio = makeAudio(src);
      audio.preload = 'metadata';
      audioCache[src] = audio;
    }
    return audio;
  };

  const engine: AliceVoiceEngine = {
    cancel() {
      speechOp += 1;
      clearSpeechTimer();
      stopAllAudio();
      onLine(null);
    },

    dispose() {
      disposed = true;
      engine.cancel();
      speechOp += 1;
      requestOp += 1;
    },

    speakVoice(src, onDone) {
      const line: AliceVoiceLine | undefined = ALICE_VOICE_LINES[src];
      if (!line) return;
      const operation = ++speechOp;
      stopAllAudio();
      onLine({ main: line.jp, sub: line.cn });
      clearSpeechTimer();
      let settled = false;
      const finish = () => {
        if (disposed || settled || operation !== speechOp) return;
        settled = true;
        clearSpeechTimer();
        onLine(null);
        onDone?.();
      };
      // 先按实测时长兜底；元数据 / 播放结束事件到达后再校正
      const arm = (sec: number) => {
        clearSpeechTimer();
        speechTimer = setTimeout(finish, sec * 1000 + 400);
      };
      arm(line.dur);
      if (!isVoiceOn()) return;
      try {
        const audio = ensureAudio(src);
        const sync = () => {
          delete metadataCleanup[src];
          if (operation !== speechOp) return;
          if (Number.isFinite(audio.duration) && audio.duration > 0) arm(audio.duration);
        };
        audio.onended = finish;
        if (Number.isFinite(audio.duration) && audio.duration > 0) sync();
        else {
          const cleanup = () => audio.removeEventListener('loadedmetadata', sync);
          metadataCleanup[src] = cleanup;
          audio.addEventListener('loadedmetadata', sync, { once: true });
        }
        audio.currentTime = 0;
        audio.play().catch(() => { /* 自动播放被拦截：字幕仍按元数据时长显示 */ });
      } catch { /* ignore */ }
    },

    speakText(text, duration = 8000, onDone) {
      const operation = ++speechOp;
      stopAllAudio();
      onLine({ main: text });
      clearSpeechTimer();
      const displayDuration = Math.max(duration, Math.min(30000, text.length * 80));
      speechTimer = setTimeout(() => {
        if (disposed || operation !== speechOp) return;
        onLine(null);
        onDone?.();
      }, displayDuration);
    },

    pickVoice(pool, poolName) {
      // 邦吧咔邦是最高频语音：每两次普通语音触发一次（摸头/喂食/待机共享计数），且不会连续重复。
      voiceTriggerCount += 1;
      if (voiceTriggerCount % 2 === 0 && lastVoice !== VOICE_BANG) {
        lastVoice = VOICE_BANG;
        return VOICE_BANG;
      }
      const queue = voiceQueues[poolName] ?? [];
      if (queue.length === 0) {
        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        voiceQueues[poolName] = shuffled;
      }
      const next = voiceQueues[poolName].pop() as string;
      lastVoice = next;
      return next;
    },

    askAlice(message, { onReply, onError }) {
      engine.cancel();
      const op = ++requestOp;
      (async () => {
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
          });
          if (!res.ok) throw new Error('API Error');
          const data = await res.json();
          if (disposed || op !== requestOp) return;
          // 与旧 getReplyText 一致：非对象/无 reply/空串一律按失败处理
          const reply = (data && typeof data === 'object' && 'reply' in data
            && typeof (data as { reply: unknown }).reply === 'string')
            ? (data as { reply: string }).reply.trim().slice(0, 1000)
            : '';
          if (!reply) throw new Error('Invalid chat response');
          onReply(reply);
        } catch {
          if (disposed || op !== requestOp) return;
          onError();
        }
      })();
    },
  };

  return engine;
}
