"use client";

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { siteConfig } from '../siteConfig';

// 【增强版 LRC 歌词解析】
function parseLrc(lrcText: string) {
  if (!lrcText || lrcText.length > 30000) return [];

  const lines = lrcText.split(/\r?\n/);
  const result = [];

  for (let line of lines) {
    const matches = [...line.matchAll(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g)];
    if (matches.length > 0) {
      let text = line.replace(/\[\d{2,}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();

      // 剔除控制字符
      const cleanText = text.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "");

      if (cleanText) {
        for (const match of matches) {
          const min = parseInt(match[1]);
          const sec = parseInt(match[2]);
          const ms = match[3] ? parseInt(match[3]) : 0;
          const divisor = match[3] && match[3].length === 3 ? 1000 : 100;
          const time = min * 60 + sec + ms / divisor;
          result.push({ time, text: cleanText });
        }
      }
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

// 🌟 1. 扩充 Context 类型，加入 MusicPage 需要的所有属性
type PlayMode = 'loop' | 'single' | 'random';

interface MusicContextType {
  playlist: any[];
  currentIndex: number;
  currentSong: any; // 扩展了 lyrics 属性
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  currentLyric: string;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;

  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  playSong: (index: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  togglePlayMode: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([]);
  const [currentLyric, setCurrentLyric] = useState("正在连接高可用神经云端...");
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 2. 新增音量和播放模式状态
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('loop');

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const trackGainsRef = useRef<Record<string, number>>({});
  const calibrationRef = useRef({ trackId: '', startedAt: 0, sumSquares: 0, samples: 0, done: false });

  const ensureAudioGraph = () => {
    const el = audioRef.current;
    if (!el || typeof window === 'undefined') return null;
    if (!audioContextRef.current) {
      const context = new AudioContext();
      const source = context.createMediaElementSource(el);
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      const gain = context.createGain();
      source.connect(gain).connect(analyser).connect(context.destination);
      audioContextRef.current = context;
      gainNodeRef.current = gain;
      analyserRef.current = analyser;
    }
    return audioContextRef.current;
  };

  const applyOutputGain = (trackGain = 1) => {
    const node = gainNodeRef.current;
    const context = audioContextRef.current;
    if (!node || !context) return;
    const nextGain = isMuted ? 0 : volume * trackGain;
    node.gain.setTargetAtTime(nextGain, context.currentTime, 0.05);
  };

  const calibrateCurrentTrack = (trackId: string) => {
    const analyser = analyserRef.current;
    if (!analyser || trackGainsRef.current[trackId] || calibrationRef.current.trackId === trackId) {
      applyOutputGain(trackGainsRef.current[trackId] || 1);
      return;
    }

    const data = new Uint8Array(analyser.fftSize);
    calibrationRef.current = { trackId, startedAt: performance.now(), sumSquares: 0, samples: 0, done: false };

    const sample = (now: number) => {
      const state = calibrationRef.current;
      if (state.trackId !== trackId || state.done) return;
      analyser.getByteTimeDomainData(data);
      for (const value of data) {
        const normalized = (value - 128) / 128;
        state.sumSquares += normalized * normalized;
      }
      state.samples += data.length;

      if (now - state.startedAt >= 1200 && state.samples > 0) {
        const rms = Math.sqrt(state.sumSquares / state.samples);
        const gain = Math.min(1.5, Math.max(0.65, 0.13 / Math.max(rms, 0.04)));
        trackGainsRef.current[trackId] = gain;
        state.done = true;
        applyOutputGain(gain);
        return;
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  };

  useEffect(() => {
    const localPlaylist = (siteConfig.localMusic || []).map((song, index) => ({
      id: `local-${index + 1}`,
      title: song.title,
      artist: song.artist,
      cover: 'https://bu.dusays.com/2026/03/24/69c24230a5ff8.jpg',
      src: song.src,
      lrcUrl: null,
      lyrics: [],
    }));

    setPlaylist(localPlaylist);
    setIsLoading(false);
    if (localPlaylist.length === 0) setCurrentLyric("暂无音乐");
  }, []);

  useEffect(() => {
    if (playlist.length === 0) return;
    let isMounted = true;
    const currentSong = playlist[currentIndex];
    setLyrics([]);
    setCurrentLyric("♪ 正在缓冲 ♪");
    if (currentSong.lyrics && currentSong.lyrics.length > 0) {
      if (isMounted) {
        setLyrics(currentSong.lyrics);
        setCurrentLyric(currentSong.lyrics[0]?.text || "\u266a \u7eaf\u4eab\u97f3\u4e50 \u266a");
      }
    } else if (currentSong.lrcUrl) {
      fetch(currentSong.lrcUrl)
        .then(res => res.text())
        .then(text => {
          if (isMounted) {
             const parsed = parseLrc(text);
             setLyrics(parsed);
             setPlaylist(prev => {
                const newPlaylist = [...prev];
                newPlaylist[currentIndex].lyrics = parsed;
                return newPlaylist;
             });
          }
        })
        .catch(() => { if (isMounted) setCurrentLyric("\u266a \u7eaf\u4eab\u97f3\u4e50 \u266a"); });
    }

    // 切歌：先复位播放状态，避免旧歌状态残留（进度条/按钮错位）
    setCurrentTime(0);
    setDuration(0);
    setProgress(0);

    if (isPlaying && audioRef.current) {
      const context = ensureAudioGraph();
      if (context?.state === 'suspended') void context.resume();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsPlaying(false));
      }
    }
    return () => { isMounted = false; };
  }, [currentIndex, playlist.length]); // 移除 playlist 依赖防止无限循环，只依赖长度

  // 🌟 4. 同步音量到 audio 元素
  useEffect(() => {
    applyOutputGain(trackGainsRef.current[playlist[currentIndex]?.id] || 1);
  }, [volume, isMuted, currentIndex, playlist]);

  // 🌟 togglePlay：先真正调用 play/pause，成功与否由 onPlay/onPause 事件回写状态，
  // 避免"按钮显示暂停但实际没播/还在播"的乐观更新错位
  const togglePlay = () => {
    const el = audioRef.current;
    if (!el || !el.src) return;
    if (el.paused) {
      const context = ensureAudioGraph();
      if (context?.state === 'suspended') void context.resume();
      el.play().then(() => calibrateCurrentTrack(playlist[currentIndex]?.id)).catch(() => { /* 失败时 onPlay 不触发，按钮保持暂停态 */ });
    } else {
      el.pause();
    }
  };

  // 🌟 5. 重写 nextSong，加入对随机模式的处理
  const nextSong = () => {
    if (playMode === 'random') {
      setCurrentIndex(Math.floor(Math.random() * playlist.length));
    } else {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }
  };

  const prevSong = () => {
    if (playMode === 'random') {
      setCurrentIndex(Math.floor(Math.random() * playlist.length));
    } else {
      setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    }
  };

  // 🌟 6. 暴露直接播放指定歌曲的方法
  const playSong = (index: number) => {
    setCurrentIndex(index);
    // 切歌后自动播放：等 src 切换、音频就绪后再 play，由 onPlay 事件驱动按钮状态
    requestAnimationFrame(() => {
      const el = audioRef.current;
      if (el) {
        const context = ensureAudioGraph();
        if (context?.state === 'suspended') void context.resume();
        el.play().then(() => calibrateCurrentTrack(playlist[index]?.id)).catch(() => { /* 自动播放被拦截时保持暂停态 */ });
      }
    });
  };

    // 🌟 节流：timeupdate 触发频率约 4次/秒，Context 值一变所有消费组件全量重渲染，
  // 是移动端卡顿主因。仅在整数秒变化时更新（1次/秒），视觉上无差异。
  const lastSecondRef = useRef(-1);
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      const sec = Math.floor(currentTime);
      if (sec === lastSecondRef.current && duration) return;
      lastSecondRef.current = sec;
      setCurrentTime(currentTime);
      setDuration(duration || 0);
      setProgress((currentTime / (duration || 1)) * 100);

      if (lyrics.length > 0) {
        const activeLyric = lyrics.slice().reverse().find(l => currentTime >= l.time);
        if (activeLyric && activeLyric.text !== currentLyric) {
          setCurrentLyric(activeLyric.text);
        }
      }
    }
  };

  // 🌟 7. 处理歌曲结束
  const handleEnded = () => {
    if (playMode === 'single' && audioRef.current) {
       audioRef.current.currentTime = 0;
       const context = ensureAudioGraph();
       if (context?.state === 'suspended') void context.resume();
       audioRef.current.play().then(() => calibrateCurrentTrack(playlist[currentIndex]?.id));
    } else {
       nextSong();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    if (audioRef.current && audioRef.current.duration) {
      const t = (newProgress / 100) * audioRef.current.duration;
      audioRef.current.currentTime = t;
      lastSecondRef.current = Math.floor(t); // 同步节流基准，避免 seek 后 1 秒内进度不刷新
      setCurrentTime(t);
    }
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (isMuted && val > 0) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const togglePlayMode = () => {
    setPlayMode(prev => {
      if (prev === 'loop') return 'single';
      if (prev === 'single') return 'random';
      return 'loop';
    });
  };

  const currentSong = playlist[currentIndex];

  return (
    <MusicContext.Provider value={{
        playlist, currentIndex, currentSong, isPlaying, progress, currentTime, duration, currentLyric, isLoading,
        volume, isMuted, playMode, // 暴露新状态
        togglePlay, nextSong, prevSong, handleSeek,
        playSong, setVolume, toggleMute, togglePlayMode // 暴露新方法
    }}>
      {children}
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.src}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded} // 使用我们重写的结束处理
          onLoadedMetadata={handleTimeUpdate}
          onPlay={() => {
            setIsPlaying(true);
            calibrateCurrentTrack(currentSong.id);
          }}
          onPause={() => setIsPlaying(false)}
        />
      )}
    </MusicContext.Provider>
  );
}

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used within MusicProvider");
  return context;
};
