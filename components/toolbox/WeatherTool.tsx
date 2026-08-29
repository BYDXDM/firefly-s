"use client";

import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Snowflake, CloudLightning, Loader2, Wind } from 'lucide-react';

interface WeatherData {
  city: string;
  temp: number;
  text: string;
  icon: string;
  source: 'qweather' | 'open-meteo';
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

  useEffect(() => {
    let cancelled = false;
    const fetchWeather = async () => {
      try {
        const res = await fetch('/api/weather');
        const data = await res.json();
        if (cancelled) return;
        if (data.code === '200' && data.now) {
          setWeather({
            city: '北京',
            temp: parseInt(data.now.temp, 10),
            text: data.now.text,
            icon: data.now.icon,
            source: data.source === 'qweather' ? 'qweather' : 'open-meteo',
          });
        } else {
          setFailed(true);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchWeather();
    // 每 10 分钟自动刷新一次
    const timer = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  if (loading) {
    return (
      <div className="h-48 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="animate-spin text-indigo-400" size={28} />
        <span className="text-[10px] font-black tracking-widest uppercase">同步气象云...</span>
      </div>
    );
  }

  if (failed || !weather) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs font-serif text-center px-4">
        ☁️ 天气服务暂时不可用
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
        {weather.source === 'open-meteo' ? '免费数据源，无需 API Key；配置 QWEATHER_KEY 可切换和风天气' : '数据来源：和风天气'}
      </p>
    </div>
  );
}
