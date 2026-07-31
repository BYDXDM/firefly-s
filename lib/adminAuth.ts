// admin 后台访问鉴权工具
// 若设置了环境变量 ADMIN_PASSKEY,则读写接口必须携带匹配的密钥,否则拒绝。
// 未设置时保持放行(后向兼容本地/纯静态场景),但建议公网部署务必设置。

export function isAuthorized(req: Request): boolean {
  const expected = process.env.ADMIN_PASSKEY;
  // 未设置密钥 → 放行(简单场景)
  if (!expected) return true;
  const provided = req.headers.get('x-admin-passkey');
  return provided === expected;
}

export function unauthorizedResponse() {
  return new Response('无权访问管理后台', { status: 401 });
}
