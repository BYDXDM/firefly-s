"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 🎧 official voice语音表（萌娘百科公共存储 · 女仆爱丽丝 CV 线，个人粉丝博客非商用）
// 每条 mp3 都配好「官方日文台词 + 中文翻译」，台词与音频一一对应、不再各自随机，
// 因此字幕说的就是语音正在说的话。dur 为实测时长（秒），仅在拿不到音频元数据时兜底。
const VOICE: Record<string, { jp: string; cn: string; dur: number }> = {
  "/voice/alice/lobby-1.mp3": {
    jp: "今日のアリスはメイドであり勇者！つまりメイド勇者です！メイド勇者とは、メイドと勇者を極めた先にあります。RPGで例えるなら上級職です！",
    cn: "今天的爱丽丝是女仆也是勇者！也就是女仆勇者！所谓女仆勇者，位于女仆和勇者极限的前方。用RPG来举例的话就是高等职业！",
    dur: 15.5,
  },
  "/voice/alice/lobby-2.mp3": {
    jp: "メイド服に着替えると、お掃除スキルが上がった気がします！先生、どこかお掃除するところはありますか？",
    cn: "换上女仆装之后，感觉打扫技能升级了！老师，你有需要打扫的地方吗？",
    dur: 9.1,
  },
  "/voice/alice/lobby-3.mp3": {
    jp: "メイドは様々なお仕事をこなすと聞きました！お料理、お掃除、お洗濯♪破壊に強襲、警備に世界平和まで！",
    cn: "听说女仆会做各种工作！料理、打扫、洗衣服♪从破坏到强袭，从警备到世界和平！",
    dur: 9.5,
  },
  "/voice/alice/lobby-4.mp3": {
    jp: "狙撃手にとって、平常心が大事だと聞きました。せ、先生？そんなに頭を撫でられると…………ふわぁ。アリスは平常心を失ってしまいました……",
    cn: "听说对狙击手来说平常心是很重要的。老，老师？头被这样摸的话…………呼哇。爱丽丝失去了平常心……",
    dur: 16.6,
  },
  "/voice/alice/lobby-5.mp3": {
    jp: "先生、今日のスケジュールを教えてください！一日中、ゴロゴロするんですか……？え、アリスも……？はい！アリスもゴロゴロします！",
    cn: "老师，请告诉爱丽丝你今天的行程！要耍废一整天是吗……？咦，爱丽丝也要……？是！爱丽丝也要耍废！",
    dur: 14.1,
  },
  "/voice/alice/memorial-1.mp3": {
    jp: "せ、先生！？アリス、まだ準備中なので……",
    cn: "老，老师！？爱丽丝，还在准备中……",
    dur: 6,
  },
  "/voice/alice/memorial-2.mp3": {
    jp: "メイドを克服し、ジョブチェンジしたアリスの姿……先生に見せようと思ったのですが……アリスの支度が整うまで、もう少しだけ待っていてください。",
    cn: "克服了对女仆的恐惧，转职后的爱丽丝的身姿……想让老师也看一看……在爱丽丝打理完成之前，还请稍微再等一会儿。",
    dur: 14.6,
  },
  "/voice/alice/memorial-3.mp3": {
    jp: "その通りです！もうメイドは怖くありません！これも全部、先生が居てくれたおかげです。",
    cn: "就是这样！女仆已经没什么好怕的了！这也都是，多亏了老师的帮忙。",
    dur: 8.8,
  },
  "/voice/alice/memorial-4.mp3": {
    jp: "先生と一緒なら……アリスはどんなダンジョンでも攻略できますから。",
    cn: "如果和老师在一起的话……爱丽丝感觉不管是什么地下城都可以攻略下来呢。",
    dur: 7.1,
  },
  "/voice/alice/memorial-5.mp3": {
    jp: "はいっ！アリス、冒険の準備が整いました！",
    cn: "嗯！爱丽丝，已经准备好出发冒险了！",
    dur: 4.8,
  },
  "/voice/alice/cafe-1.mp3": {
    jp: "……どこからお掃除しましょう？",
    cn: "从哪里开始打扫呢？",
    dur: 2.4,
  },
  "/voice/alice/cafe-2.mp3": {
    jp: "サブクエストが発生しそうな場所です……！",
    cn: "是可能发生支线任务的地方……！",
    dur: 2.9,
  },
  "/voice/alice/cafe-3.mp3": {
    jp: "アリス、知ってます。世の中にはメイドカフェというものがあるらしいです！",
    cn: "爱丽丝知道。世界上好像有女仆咖啡店！",
    dur: 6.2,
  },
  // 「获得学生」线：本轮不挂在任何交互上（原先被误配给「喂食」，语义完全不符），
  // 配对信息保留完整，日后想加「首次登场自我介绍」可直接取用
  "/voice/alice/gachaget.mp3": {
    jp: "メイドにジョブチェンジしても、アリスはアリスです。見ていてください、先生！",
    cn: "即使换成女仆，爱丽丝也是爱丽丝。请看着，老师！",
    dur: 6.5,
  },
  "/voice/alice/season-birthday.mp3": {
    jp: "ゲーム開発部のみんな、そして先生と出会った日……あの日の出来事を、アリスは忘れません。先生、これからもよろしくお願いします！",
    cn: "和游戏开发部的大家，还有老师相遇的日子……那天所发生的事情，爱丽丝不会忘记的。老师，今后也请你多多指教！",
    dur: 15.9,
  },
  "/voice/alice/season-newyear.mp3": {
    jp: "あけましておめでとうございます、先生！メイドアリスの初仕事、何が良いですか？……そばに居るだけで良いんですか？",
    cn: "新年快乐，老师！女仆爱丽丝的第一项工作，该做什么好呢？……待在你旁边就好了吗？",
    dur: 10.8,
  },
  "/voice/alice/season-xmas.mp3": {
    jp: "アリス、知っています。ゲームでも現実でも、クリスマスはイベントの時間です！",
    cn: "爱丽丝知道。无论是游戏还是现实，圣诞节就是活动的时间！",
    dur: 6.7,
  },
  "/voice/alice/season-halloween.mp3": {
    jp: "ハッピーハロウィーン！みんなでゲームのキャラクターみたいに仮装する日ですね！それとも……ゲームが現実になる日なのでしょうか？",
    cn: "万圣节快乐！是大家一起打扮成游戏角色的日子呢还是……是游戏成为现实的日子？",
    dur: 11.4,
  },
};

// 🎧 场景语音池：只列 mp3 路径，台词与时长统一从 VOICE 表查，保证语音/字幕同源
// 摸头：大厅4「被摸头会失去平常心」+ 记忆大厅的亲密触摸线
const VOICE_BANG = '/voice/alice/gachaget.mp3';

const POOL_PET = [
  '/voice/alice/lobby-4.mp3',
  '/voice/alice/memorial-1.mp3', '/voice/alice/memorial-3.mp3',
  '/voice/alice/memorial-4.mp3', '/voice/alice/memorial-5.mp3',
];
// 待机：游戏内「大厅」语音线（lobby-1~5），是原作里站在主界面时会说的话
const POOL_IDLE = [
  '/voice/alice/lobby-1.mp3', '/voice/alice/lobby-2.mp3', '/voice/alice/lobby-3.mp3',
  '/voice/alice/lobby-4.mp3', '/voice/alice/lobby-5.mp3',
];
// 喂食：咖啡厅独白（原作里女仆在咖啡厅的独白，与「吃的」语境最贴近）
const POOL_FEED = [
  '/voice/alice/cafe-1.mp3', '/voice/alice/cafe-2.mp3', '/voice/alice/cafe-3.mp3',
];
// 节日专属语音（与日期彩蛋联动）
const VOICE_SEASON: Record<string, string> = {
  '03-25': '/voice/alice/season-birthday.mp3',
  '10-31': '/voice/alice/season-halloween.mp3',
  '12-24': '/voice/alice/season-xmas.mp3',
  '12-25': '/voice/alice/season-xmas.mp3',
  '01-01': '/voice/alice/season-newyear.mp3',
  '01-02': '/voice/alice/season-newyear.mp3',
  '01-03': '/voice/alice/season-newyear.mp3',
};
// 教师节没有官方节日语音，借记忆大厅3「这也都是多亏了老师」的致谢线
const VOICE_TEACHERS_DAY = '/voice/alice/memorial-3.mp3';

const shuffle = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const getReplyText = (data: unknown): string => {
  if (data && typeof data === 'object' && 'reply' in data && typeof data.reply === 'string') {
    const reply = data.reply.trim().slice(0, 1000);
    if (reply) return reply;
  }
  throw new Error('Invalid chat response');
};

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

  // 🖼 看板娘：静态女仆爱丽丝立绘（Spine 动态版已回退，资源保留在 public/spine 备用）
  const speechTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechOpRef = useRef(0);
  const requestOpRef = useRef(0);
  const mountedRef = useRef(true);
  const petResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const voiceQueuesRef = useRef<Record<string, string[]>>({});
  const lastVoiceRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);
  const spriteWrapRef = useRef<HTMLDivElement>(null);

  // 🔊 爱丽丝voice playback (browser TTS can be muted; only user-triggered lines speak)
  const [voiceOn, setVoiceOn] = useState(true);
  useEffect(() => {
    mountedRef.current = true;
    try { setVoiceOn(localStorage.getItem('alice-voice') !== 'off'); } catch { /* ignore */ }
  }, []);
  const stopAllAudio = () => {
    Object.values(metadataCleanupRef.current).forEach((cleanup) => cleanup());
    metadataCleanupRef.current = {};
    Object.values(audioCache.current).forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
      audio.onended = null;
    });
  };
  const toggleVoice = () => {
    setVoiceOn((prev) => {
      const next = !prev;
      try { localStorage.setItem('alice-voice', next ? 'on' : 'off'); } catch { /* ignore */ }
      if (!next) {
        cancelSpeech();
        setIsThinking(false);
        setIsBusy(false);
        setIsPetted(false);
        setCatMood('idle');
      }
      return next;
    });
  };
  const ttsSpeak = (text: string) => {
    if (!voiceOn || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const clean = text.replace(/\s+/g, ' ').replace(/[♪♫]/g, '').slice(0, 140);
      if (!clean.trim()) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = 'zh-CN';
      utter.rate = 1.05;
      utter.pitch = 1.3;
      const zhVoice = synth.getVoices().find((v) => v.lang.startsWith('zh'));
      if (zhVoice) utter.voice = zhVoice;
      synth.speak(utter);
    } catch { /* TTS 失败不影响文字气泡 */ }
  };

  // 🎧 播放official voice语音：字幕停留时长跟着音频真实长度走，不再用写死的毫秒
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});
  const metadataCleanupRef = useRef<Record<string, () => void>>({});
  const ensureAudio = (src: string) => {
    let audio = audioCache.current[src];
    if (!audio) {
      audio = new Audio(src);
      audio.preload = 'metadata';
      audioCache.current[src] = audio;
    }
    return audio;
  };

  const clearSpeechTimer = () => {
    if (speechTimerRef.current) {
      clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
  };
  const cancelSpeech = () => {
    speechOpRef.current += 1;
    clearSpeechTimer();
    stopAllAudio();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeech(null);
  };

  // 说一句official voice：Japanese audio + 中文翻译，两者与音频一一对应，播完才收气泡
  const speakVoice = (src: string, onDone?: () => void) => {
    const line = VOICE[src];
    if (!line) return;
    const operation = ++speechOpRef.current;
    stopAllAudio();
    setSpeech({ main: line.jp, sub: line.cn });
    clearSpeechTimer();
    let settled = false;
    const finish = () => {
      if (settled || operation !== speechOpRef.current) return;
      settled = true;
      clearSpeechTimer();
      if (!mountedRef.current) return;
      setSpeech(null);
      onDone?.();
    };
    // 先按实测时长兜底；元数据 / 播放结束事件到达后再校正
    const arm = (sec: number) => {
      clearSpeechTimer();
      speechTimerRef.current = setTimeout(finish, sec * 1000 + 400);
    };
    arm(line.dur);
    if (!voiceOn) return;
    try {
      const audio = ensureAudio(src);
      const sync = () => {
        delete metadataCleanupRef.current[src];
        if (operation !== speechOpRef.current) return;
        if (Number.isFinite(audio.duration) && audio.duration > 0) arm(audio.duration);
      };
      audio.onended = finish;
      if (Number.isFinite(audio.duration) && audio.duration > 0) sync();
      else {
        const cleanup = () => audio.removeEventListener('loadedmetadata', sync);
        metadataCleanupRef.current[src] = cleanup;
        audio.addEventListener('loadedmetadata', sync, { once: true });
      }
      audio.currentTime = 0;
      audio.play().catch(() => { /* 自动播放被拦截：字幕仍按元数据时长显示 */ });
    } catch { /* ignore */ }
  };

  // 纯文字台词（AI 回复 / 报错提示）：没有日配，用浏览器 TTS 念中文，字幕与语音同为中文
  const speakText = (text: string, duration = 8000, onDone?: () => void) => {
    const operation = ++speechOpRef.current;
    stopAllAudio();
    setSpeech({ main: text });
    clearSpeechTimer();
    const displayDuration = Math.max(duration, Math.min(30000, text.length * 80));
    speechTimerRef.current = setTimeout(() => {
      if (!mountedRef.current || operation !== speechOpRef.current) return;
      setSpeech(null);
      onDone?.();
    }, displayDuration);
    ttsSpeak(text);
  };

  useEffect(() => () => {
    mountedRef.current = false;
    speechOpRef.current += 1;
    requestOpRef.current += 1;
    if (petResetTimerRef.current) clearTimeout(petResetTimerRef.current);
    clearSpeechTimer();
    stopAllAudio();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // 📅 日期彩蛋：生日 / 节日专属台词
  const nextVoice = (pool: string[], poolName: string): string => {
    const queue = voiceQueuesRef.current[poolName] ?? [];
    if (queue.length === 0) voiceQueuesRef.current[poolName] = shuffle(pool);
    const next = voiceQueuesRef.current[poolName].pop() as string;
    lastVoiceRef.current = next;
    return next;
  };

  // 邦吧咔邦是高频彩蛋，但不会连续重复；普通语音仍按洗牌队列轮播。
  const nextPetVoice = (): string => {
    if (lastVoiceRef.current !== VOICE_BANG && Math.random() < 0.5) {
      lastVoiceRef.current = VOICE_BANG;
      return VOICE_BANG;
    }
    return nextVoice(POOL_PET, 'pet');
  };

  const nextIdleVoice = (): string => {
    if (lastVoiceRef.current !== VOICE_BANG && Math.random() < 0.5) {
      lastVoiceRef.current = VOICE_BANG;
      return VOICE_BANG;
    }
    return nextVoice(POOL_IDLE, 'idle');
  };

  const getSeasonKey = () => {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  // 节日当天优先专属日配；教师节借用致谢线；其余日子走摸头池
  const getSeasonVoice = (): string | null => {
    const key = getSeasonKey();
    return VOICE_SEASON[key] ?? (key === '09-10' ? VOICE_TEACHERS_DAY : null);
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
    speakVoice(getSeasonVoice() ?? nextPetVoice(), () => {
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
  const handleFeed = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发摸猫或拖拽
    if (isBusy) return;

    setShowInput(false); // 喂食时关掉输入框
    setIsThinking(true);
    setIsBusy(true);
    setCatMood('thinking');
    cancelSpeech();
    const requestOp = ++requestOpRef.current;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "I just gave you a bottle of sweet strawberry milk! How will you react?" }),
      });

      if (!res.ok) throw new Error('API Error');

      const data = await res.json();
      if (requestOp !== requestOpRef.current) return;
      const reply = getReplyText(data);
      setCatMood('happy');
      // 先播放一条官方语音（日文音频 + 中文翻译），语音播完再显示 AI 的 English reply，
      // 保证字幕全程都跟着正在播放的声音走
      speakVoice(nextVoice(POOL_FEED, 'feed'), () => {
        setCatMood('idle');
        speakText(reply, 9000, () => {
          setIsThinking(false);
          setIsBusy(false);
        });
      });
    } catch (error) {
      if (requestOp !== requestOpRef.current) return;
      setCatMood('idle');
      speakText("草莓牛奶很好喝…但爱丽丝的线路卡壳了……", 4000, () => {
        setIsThinking(false);
        setIsBusy(false);
      });
    }
  };

  // --- 💬 交互事件：发送聊天 ---
  const handle聊天Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isBusy) return;
    const requestOp = ++requestOpRef.current;

    const userMessage = inputValue;
    setInputValue('');
    setShowInput(false);
    setIsThinking(true);
    setIsBusy(true);
    setCatMood('thinking');
    cancelSpeech();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!res.ok) throw new Error('API Error');

      const data = await res.json();
      if (requestOp !== requestOpRef.current) return;
      const reply = getReplyText(data);
      setCatMood('idle');
      speakText(reply, 8500, () => {
        setIsThinking(false);
        setIsBusy(false);
      });
    } catch (error) {
      if (requestOp !== requestOpRef.current) return;
      setCatMood('idle');
      speakText("通信中断了！这一定是主线剧情里才会出现的强敌……", 4000, () => {
        setIsThinking(false);
        setIsBusy(false);
      });
    }
  };

  // --- ✨ 交互事件：快捷提问 ---
  const handleQuick聊天 = async (promptText: string) => {
    if (isBusy) return;
    const requestOp = ++requestOpRef.current;
    setShowInput(false);
    setIsThinking(true);
    setIsBusy(true);
    setCatMood('thinking');
    cancelSpeech();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptText }),
      });

      if (!res.ok) throw new Error('API Error');

      const data = await res.json();
      if (requestOp !== requestOpRef.current) return;
      const reply = getReplyText(data);
      setCatMood('idle');
      speakText(reply, 9000, () => {
        setIsThinking(false);
        setIsBusy(false);
      });
    } catch (error) {
      if (requestOp !== requestOpRef.current) return;
      setCatMood('idle');
      speakText("Sensei，爱丽丝的大脑连接超时了……", 4000, () => {
        setIsThinking(false);
        setIsBusy(false);
      });
    }
  };

  // --- ⏳ 随机挂机语录：接官方「大厅」日配，the subtitle follows the audio (no 中文 TTS fallback) ---
  useEffect(() => {
    const randomTalkInterval = setInterval(() => {
      if (!speech && !showInput && !isThinking && !isBusy && Math.random() > 0.8) {
        speakVoice(nextIdleVoice());
      }
    }, 20000);

    return () => clearInterval(randomTalkInterval);
  }, [speech, showInput, isThinking, isBusy]);

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
