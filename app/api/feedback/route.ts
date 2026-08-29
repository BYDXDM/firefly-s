import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized, unauthorizedResponse } from '../../../lib/adminAuth';
import { saveFeedback, getFeedbackList, deleteFeedback, FEEDBACK_TYPES } from '../../../lib/feedback';

// 简单的内存频率限制：同一 IP 每 10 分钟最多 3 条
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const submissionLog = new Map<string, number[]>();

function clientKey(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (submissionLog.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    submissionLog.set(key, recent);
    return true;
  }
  recent.push(now);
  submissionLog.set(key, recent);
  return false;
}

function sanitize(value: unknown, maxLen: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLen) : '';
}

export async function POST(req: NextRequest) {
  try {
    if (isRateLimited(clientKey(req))) {
      return NextResponse.json({ error: '提交太频繁啦，休息一下再试试～' }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: '请求格式有误' }, { status: 400 });
    }

    const content = sanitize(body.content, 1000);
    const nickname = sanitize(body.nickname, 20) || '匿名';
    const contact = sanitize(body.contact, 50);
    const type = FEEDBACK_TYPES.includes(body.type) ? body.type : 'other';

    if (content.length < 2) {
      return NextResponse.json({ error: '建议内容太短了，至少写两个字吧' }, { status: 400 });
    }

    const id = await saveFeedback({ nickname, contact, type, content });
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error('保存建议失败:', error);
    return NextResponse.json({ error: '服务器开小差了，稍后再试' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorizedResponse();
  const items = await getFeedbackList();
  return NextResponse.json({ items });
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorizedResponse();
  const id = req.nextUrl.searchParams.get('id') || '';
  const ok = await deleteFeedback(id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}
