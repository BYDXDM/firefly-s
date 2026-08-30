// lib/visitorGeo.ts — 访客 IP 归属地探测（仅浏览器端使用）
// 思路：优先请求"国内直连"的 IP 归属地服务。代理软件（如 v2rayN 规则模式）
// 对国内域名直连不走代理，因此能拿到真实 IP 的归属地，规避"访问 Vercel 走了
// 代理 → 出口 IP 在境外"导致的定位错误。全部失败返回 null，由调用方兜底。

export interface VisitorLocation {
  province?: string;
  city?: string;
}

function fetchJson(url: string, timeoutMs = 3500): Promise<unknown> {
  return Promise.race([
    fetch(url, { cache: 'no-store' }).then((res) => res.json()),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
  ]);
}

/** JSONP：无 CORS 头的服务的最后兜底 */
function jsonp(url: string, timeoutMs = 3500): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const name = `__geo_cb_${Date.now()}`;
    const script = document.createElement('script');
    const cleanup = () => {
      delete (window as unknown as Record<string, unknown>)[name];
      script.remove();
    };
    (window as unknown as Record<string, unknown>)[name] = (data: Record<string, unknown>) => {
      cleanup();
      resolve(data);
    };
    script.src = `${url}${url.includes('?') ? '&' : '?'}callback=${name}`;
    script.onerror = () => { cleanup(); reject(new Error('jsonp error')); };
    setTimeout(() => { cleanup(); reject(new Error('timeout')); }, timeoutMs);
    document.head.appendChild(script);
  });
}

function isChinaCountry(country?: string): boolean {
  return !country || country.includes('中国');
}

export async function detectVisitorLocation(): Promise<VisitorLocation | null> {
  // 1. ip.useragentinfo.com：国内服务，带 CORS 头
  try {
    const d = await fetchJson('https://ip.useragentinfo.com/json') as { country?: string; province?: string; city?: string };
    if (isChinaCountry(d?.country) && (d.city || d.province)) {
      return { province: d.province, city: d.city };
    }
  } catch { /* 下一个 */ }

  // 2. api.vore.top：国内免费接口
  try {
    const d = await fetchJson('https://api.vore.top/api/IPdata') as { data?: { ipinfo?: { province?: string; city?: string } } };
    const info = d?.data?.ipinfo;
    if (info && (info.city || info.province)) {
      return { province: info.province, city: info.city };
    }
  } catch { /* 下一个 */ }

  // 3. 站长之家 JSONP 兜底（GBK 页面但字段值通常可读，读不出来就算了）
  try {
    const d = await jsonp('https://whois.pconline.com.cn/ipJson.jsp?json=true');
    const pro = typeof d.pro === 'string' ? d.pro : '';
    const city = typeof d.city === 'string' ? d.city : '';
    if (pro || city) return { province: pro, city };
  } catch { /* 放弃 */ }

  return null;
}
