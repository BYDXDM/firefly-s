import { NextRequest, NextResponse } from 'next/server';
import { isAuthRequired, safeEqual } from '../../../../lib/adminAuth';

// 简单的内存频率限制：同一 IP 每 5 分钟最多 10 次尝试，拖慢暴力猜解
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attemptLog = new Map<string, number[]>();

function clientKey(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (attemptLog.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) {
    attemptLog.set(key, recent);
    return true;
  }
  recent.push(now);
  attemptLog.set(key, recent);
  return false;
}

/** 会话校验：带 X-Admin-Passkey 头查询当前密钥是否有效 */
export async function GET(req: NextRequest) {
  const authRequired = isAuthRequired();
  const provided = req.headers.get('x-admin-passkey') || '';
  const authenticated = authRequired
    ? safeEqual(process.env.ADMIN_PASSKEY as string, provided)
    : true;
  return NextResponse.json({ authenticated, authRequired });
}

/** 登录：校验密钥 */
export async function POST(req: NextRequest) {
  const authRequired = isAuthRequired();

  if (!authRequired) {
    // 未设置 ADMIN_PASSKEY：放行但明确告知（提示站长去配置环境变量）
    return NextResponse.json({ ok: true, authRequired: false });
  }

  if (isRateLimited(clientKey(req))) {
    return NextResponse.json({ error: '尝试次数过多，请 5 分钟后再试' }, { status: 429 });
  }

  let passkey = '';
  try {
    const body = await req.json();
    passkey = typeof body?.passkey === 'string' ? body.passkey : '';
  } catch {
    return NextResponse.json({ error: '请求格式有误' }, { status: 400 });
  }

  if (safeEqual(process.env.ADMIN_PASSKEY as string, passkey)) {
    return NextResponse.json({ ok: true, authRequired: true });
  }
  return NextResponse.json({ error: '密钥不正确' }, { status: 401 });
}
