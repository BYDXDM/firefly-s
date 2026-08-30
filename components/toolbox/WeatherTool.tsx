"use client";

import { useState, useEffect, useCallback } from 'react';
import { Cloud, Sun, CloudRain, Snowflake, CloudLightning, Loader2, Wind } from 'lucide-react';
import { detectVisitorLocation } from '../../lib/visitorGeo';

const CITY_CACHE_KEY = 'visitor-city';

interface WeatherData {
  city: string;
  temp: number;
  text: string;
  icon: string;
  source: 'qweather' | 'open-meteo';
}

/** 访客所在城市（国内直连 IP 服务，规则模式代理下取真实归属地；结果缓存本会话） */
async function getVisitorCity(): Promise<string | null> {
  try {
    const cached = sessionStorage.getItem(CITY_CACHE_KEY);
    if (cached) return cached;
  } catch { /* 隐私模式等场景忽略 */ }
  const loc = await detectVisitorLocation();
  const city = loc?.city || loc?.province || null;
  if (city) {
    try { sessionStorage.setItem(CITY_CACHE_KEY, city); } catch { /* ignore */ }
  }
  return city;
}

/** Open-Meteo 的 WMO 天气码 → 文案 + 图标 */
function mapWmoCode(code: number): { text: string; icon: string } {
  const table: Record<number, { text: string; icon: string }> = {
    0: { text: '晴', icon: '100' },
    1: { text: '晴间多云', icon: '103' },
    2: { text: '多云', icon: '101' },
    3: { text: '阴', icon: '104' },
    45: { text: '雾', icon: '501' },
    48: { text: '雾凇', icon: '501' },
    51: { text: '小雨', icon: '305' },
    53: { text: '小雨', icon: '305' },
    55: { text: '中雨', icon: '306' },
    56: { text: '冻雨', icon: '313' },
    57: { text: '冻雨', icon: '313' },
    61: { text: '小雨', icon: '305' },
    63: { text: '中雨', icon: '306' },
    65: { text: '大雨', icon: '307' },
    66: { text: '冻雨', icon: '313' },
    67: { text: '冻雨', icon: '313' },
    71: { text: '小雪', icon: '400' },
    73: { text: '中雪', icon: '401' },
    75: { text: '大雪', icon: '402' },
    77: { text: '小雪', icon: '400' },
    80: { text: '阵雨', icon: '300' },
    81: { text: '阵雨', icon: '300' },
    82: { text: '强阵雨', icon: '301' },
    85: { text: '阵雪', icon: '406' },
    86: { text: '阵雪', icon: '406' },
    95: { text: '雷阵雨', icon: '302' },
    96: { text: '雷阵雨伴冰雹', icon: '304' },
    99: { text: '雷阵雨伴冰雹', icon: '304' },
  };
  return table[code] || { text: '多云', icon: '101' };
}

/**
 * 浏览器端直连 Open-Meteo（原生支持 CORS、免密钥）：
 * 城市名 → 经纬度 → 实时天气。定位不到或请求失败返回 null，由站内接口兜底。
 */
async function fetchOpenMeteoForCity(city: string): Promise<WeatherData | null> {
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`,
      { signal: AbortSignal.timeout(5000), cache: 'no-store' }
    );
    const geo = await geoRes.json();
    const hit = geo?.results?.[0];
    if (typeof hit?.latitude !== 'number' || typeof hit?.longitude !== 'number') return null;

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}&longitude=${hit.longitude}&current=temperature_2m,weather_code&timezone=Asia%2FShanghai`,
      { signal: AbortSignal.timeout(5000), cache: 'no-store' }
    );
    const data = await res.json();
    const current = data?.current;
    if (typeof current?.temperature_2m !== 'number') return null;
    const { text, icon } = mapWmoCode(current.weather_code ?? -1);
    return { city, temp: Math.round(current.temperature_2m), text, icon, source: 'open-meteo' };
  } catch {
    return null;
  }
}

function getWeatherIcon(iconCode: string) {
  const code = parseInt(iconCode);
  if (code === 100) return <Sun className="text-amber-400" size={38} />;
  if (code >= 101 && code <= 104) return <Cloud className="text-slate-300" size={38} />;
  if (code >= 300 && code <= 399) return <CloudRain className="text-blue-400" size={38} />;
  if (code >= 400 && code <= 499) return <Snowflake className="text-indigo-200" size={38} />;
  if (code >= 302 && code <= 304) return <CloudLightning className="text-violet-400" size={38} />;
  return <Wind className="text-slate-400" size={38} />;
}

export default function WeatherTool() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const city = await getVisitorCity();
      let data = city ? await fetchOpenMeteoForCity(city) : null;

      // 兜底：站内接口（固定默认城市）
      if (!data) {
        const res = await fetch('/api/weather');
        const d = await res.json();
        if (d.code === '200' && d.now) {
          data = {
            city: d.city || '东莞',
            temp: parseInt(d.now.temp, 10),
            text: d.now.text,
            icon: d.now.icon,
            source: d.source === 'qweather' ? 'qweather' : 'open-meteo',
          };
        }
      }

      if (data) setWeather(data);
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await fetchWeather();
    };
    run();
    // 每 10 分钟自动刷新一次
    const timer = setInterval(() => { if (!cancelled) fetchWeather(); }, 10 * 60 * 1000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [fetchWeather]);

  if (loading) {
    return (
      <div className="h-48 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="animate-spin text-indigo-400" size={28} />
        <span className="text-[10px] font-black tracking-widest uppercase">定位中 · 同步气象云...</span>
      </div>
    );
  }

  if (failed || !weather) {
    return (
      <div className="h-48 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs font-serif text-center px-4">
        <span>☁️ 天气服务暂时不可用</span>
        <button
          onClick={fetchWeather}
          className="text-xs font-bold text-indigo-500 hover:text-indigo-600 px-3 py-1.5 rounded-full bg-indigo-500/10 transition-colors"
        >
          ↻ 重试
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest mb-1 text-indigo-500 dark:text-indigo-400">
            {weather.source === 'qweather' ? '和风天气 · 实时' : 'Open-Meteo · 实时'}
          </span>
          <span className="text-base font-bold text-slate-800 dark:text-white">{weather.city}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{weather.temp}°</span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{weather.text}</span>
          </div>
        </div>
        <div className="drop-shadow-md">{getWeatherIcon(weather.icon)}</div>
      </div>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
        按访客归属地自动定位；免费数据源，无需 API Key
      </p>
    </div>
  );
}
