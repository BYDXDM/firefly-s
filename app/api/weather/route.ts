// app/api/weather/route.ts
// 天气数据源：设置了 QWEATHER_KEY 时走和风天气；否则自动使用 Open-Meteo（免费、无需注册）
import { NextResponse } from 'next/server';

// 北京（与前端展示文案一致），想换城市改这里的经纬度即可
const LAT = 39.9042;
const LON = 116.4074;

/** Open-Meteo 的 WMO 天气码 → 和风风格 { text, icon } 映射，供前端图标逻辑复用 */
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

async function fetchFromQWeather(token: string) {
  const apiHosts = [
    'https://api.qweather.com/v7/weather/now',
    'https://devapi.qweather.com/v7/weather/now',
  ];
  for (const host of apiHosts) {
    try {
      const res = await fetch(`${host}?location=101010100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Encoding': 'gzip',
        },
        next: { revalidate: 600 },
      });
      const data = await res.json();
      if (data.code === '200' && data.now) {
        return { temp: String(data.now.temp), text: data.now.text, icon: String(data.now.icon) };
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function fetchFromOpenMeteo() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&timezone=Asia%2FShanghai`;
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const current = data?.current;
    if (!current || typeof current.temperature_2m !== 'number') return null;
    const { text, icon } = mapWmoCode(current.weather_code ?? -1);
    return { temp: String(Math.round(current.temperature_2m)), text, icon };
  } catch {
    return null;
  }
}

export async function GET() {
  const token = process.env.QWEATHER_KEY;

  const now = (token && await fetchFromQWeather(token)) || await fetchFromOpenMeteo();

  if (!now) {
    return NextResponse.json({ code: '500', message: '天气数据获取失败' }, { status: 500 });
  }

  return NextResponse.json({
    code: '200',
    source: token ? 'qweather' : 'open-meteo',
    now,
  });
}
