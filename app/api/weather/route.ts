// app/api/weather/route.ts
// 天气数据源兜底链：设置了 QWEATHER_KEY 时走和风天气；
// 否则依次尝试 Open-Meteo 与 wttr.in（均免费、无需注册）。
// 注意：必须 force-dynamic + no-store，避免构建期预渲染把失败结果冻结到线上。
import { NextResponse } from 'next/server';

// 东莞（与前端展示文案一致），想换城市改这里的经纬度即可
const LAT = 23.0207;
const LON = 113.7518;

export const dynamic = 'force-dynamic';

interface NowWeather {
  temp: string;
  text: string;
  icon: string;
}

/** 天气文案 + 图标码（温度由数据源单独提供） */
interface WeatherDescriptor {
  text: string;
  icon: string;
}

/** Open-Meteo 的 WMO 天气码 → 和风风格 { text, icon } 映射，供前端图标逻辑复用 */
function mapWmoCode(code: number): WeatherDescriptor {
  const table: Record<number, WeatherDescriptor> = {
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

/** wttr.in 的天气码 → 和风风格 { text, icon }（常用码兜底，中文文案优先用接口自带的） */
function mapWttrCode(code: number): WeatherDescriptor {
  const table: Record<number, WeatherDescriptor> = {
    113: { text: '晴', icon: '100' },
    116: { text: '晴间多云', icon: '103' },
    119: { text: '多云', icon: '101' },
    122: { text: '阴', icon: '104' },
    143: { text: '薄雾', icon: '500' },
    176: { text: '阵雨', icon: '300' },
    182: { text: '冻雨', icon: '313' },
    185: { text: '冻雨', icon: '313' },
    200: { text: '雷阵雨', icon: '302' },
    227: { text: '小雪', icon: '400' },
    230: { text: '暴雪', icon: '402' },
    248: { text: '雾', icon: '501' },
    260: { text: '雾', icon: '501' },
    263: { text: '小雨', icon: '305' },
    266: { text: '小雨', icon: '305' },
    281: { text: '冻雨', icon: '313' },
    284: { text: '冻雨', icon: '313' },
    293: { text: '阵雨', icon: '300' },
    296: { text: '小雨', icon: '305' },
    299: { text: '阵雨', icon: '300' },
    302: { text: '雷阵雨', icon: '302' },
    305: { text: '大雨', icon: '307' },
    308: { text: '大雨', icon: '307' },
    311: { text: '冻雨', icon: '313' },
    314: { text: '冻雨', icon: '313' },
    320: { text: '阵雪', icon: '406' },
    323: { text: '小雪', icon: '400' },
    326: { text: '小雪', icon: '400' },
    329: { text: '中雪', icon: '401' },
    332: { text: '中雪', icon: '401' },
    335: { text: '大雪', icon: '402' },
    338: { text: '大雪', icon: '402' },
    350: { text: '冻雨', icon: '313' },
    353: { text: '阵雨', icon: '300' },
    356: { text: '阵雨', icon: '300' },
    359: { text: '暴雨', icon: '310' },
    362: { text: '雨夹雪', icon: '313' },
    365: { text: '雨夹雪', icon: '313' },
    368: { text: '阵雪', icon: '406' },
    371: { text: '阵雪', icon: '406' },
    374: { text: '冻雨', icon: '313' },
    377: { text: '冻雨', icon: '313' },
    386: { text: '雷阵雨', icon: '302' },
    389: { text: '雷暴', icon: '302' },
    392: { text: '雷阵雪', icon: '302' },
    395: { text: '大雪', icon: '402' },
  };
  return table[code] || { text: '多云', icon: '101' };
}

/** 校验上游响应并解析 JSON（只接收 Response，不接触 URL，杜绝 SSRF 面） */
async function parseOkJson(res: Response): Promise<unknown> {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const REQUEST_INIT: RequestInit = {
  headers: { 'User-Agent': 'firefly-blog-weather/1.0 (personal blog widget)' },
  signal: AbortSignal.timeout(6000),
  cache: 'no-store',
};

async function fetchFromQWeather(token: string): Promise<NowWeather | null> {
  // 和风天气 API Host 因账号类型而异，两个都试一遍（101281601 = 东莞）
  const hosts = ['https://api.qweather.com', 'https://devapi.qweather.com'];
  for (const host of hosts) {
    try {
      const data = await parseOkJson(await fetch(`${host}/v7/weather/now?location=101281601`, REQUEST_INIT)) as { code?: string; now?: { temp: string; text: string; icon: string } };
      if (data.code === '200' && data.now) {
        return { temp: String(data.now.temp), text: data.now.text, icon: String(data.now.icon) };
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function fetchFromOpenMeteo(): Promise<NowWeather | null> {
  try {
    const data = await parseOkJson(await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&timezone=Asia%2FShanghai`,
      REQUEST_INIT
    )) as { current?: { temperature_2m?: number; weather_code?: number } };
    const current = data?.current;
    if (!current || typeof current.temperature_2m !== 'number') return null;
    const { text, icon } = mapWmoCode(current.weather_code ?? -1);
    return { temp: String(Math.round(current.temperature_2m)), text, icon };
  } catch {
    return null;
  }
}

async function fetchFromWttr(): Promise<NowWeather | null> {
  try {
    // lang_zh 字段自带中文天气描述
    const data = await parseOkJson(await fetch('https://wttr.in/Dongguan?format=j1', REQUEST_INIT)) as {
      current_condition?: Array<{
        temp_C?: string;
        weatherCode?: string;
        lang_zh?: Array<{ value?: string }>;
        weatherDesc?: Array<{ value?: string }>;
      }>;
    };
    const current = data?.current_condition?.[0];
    if (!current || !current.temp_C) return null;
    const mapped = mapWttrCode(parseInt(current.weatherCode || '', 10));
    const textZh = current.lang_zh?.[0]?.value?.trim();
    return { temp: String(parseInt(current.temp_C, 10)), text: textZh || mapped.text, icon: mapped.icon };
  } catch {
    return null;
  }
}

export async function GET() {
  const token = process.env.QWEATHER_KEY;

  const now =
    (token && await fetchFromQWeather(token)) ||
    await fetchFromOpenMeteo() ||
    await fetchFromWttr();

  if (!now) {
    return NextResponse.json({ code: '500', message: '天气数据获取失败' }, { status: 500 });
  }

  return NextResponse.json({
    code: '200',
    source: token ? 'qweather' : 'open-meteo',
    now,
  });
}
