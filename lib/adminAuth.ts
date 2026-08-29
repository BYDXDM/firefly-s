// admin 后台访问鉴权工具
// 若设置了环境变量 ADMIN_PASSKEY,则读写接口必须携带匹配的密钥,否则拒绝。
// 未设置时保持放行(后向兼容本地/纯静态场景),但强烈建议公网部署务必设置。
import crypto from 'crypto';

/** 是否启用了密钥认证（未启用时后台对所有人开放） */
export function isAuthRequired(): boolean {
  return Boolean(process.env.ADMIN_PASSKEY);
}

/** 常数时间比较，避免时序攻击逐位猜解密钥 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // 长度不同也要做一次比较，保持耗时稳定
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function isAuthorized(req: Request): boolean {
  const expected = process.env.ADMIN_PASSKEY;
  // 未设置密钥 → 放行(简单场景)
  if (!expected) return true;
  const provided = req.headers.get('x-admin-passkey') || '';
  return safeEqual(expected, provided);
}

export function unauthorizedResponse() {
  return new Response('无权访问管理后台', { status: 401 });
}
