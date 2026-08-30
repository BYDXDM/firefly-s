import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isAuthorized, unauthorizedResponse } from '../../../../lib/adminAuth';
import { getGithubConfig, githubCommitFile, githubReadFile } from '../../../../lib/github';

const AVATAR_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3MB
const SITE_CONFIG_PATH = 'siteConfig.ts';

/** 把 siteConfig.ts 里的 avatarUrl 替换为新路径，返回更新后的完整文件内容 */
function patchSiteConfig(source: string, avatarUrl: string): string | null {
  const re = /avatarUrl:\s*"[^"]*"/;
  if (!re.test(source)) return null;
  return source.replace(re, `avatarUrl: "${avatarUrl}"`);
}

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) return unauthorizedResponse();

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: '没有选择图片' }, { status: 400 });
    }
    const ext = AVATAR_TYPES[file.type];
    if (!ext) {
      return NextResponse.json({ error: '仅支持 JPG / PNG / WebP / GIF 格式' }, { status: 400 });
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return NextResponse.json({ error: '图片太大了，请控制在 3MB 以内' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `avatar-${Date.now()}.${ext}`;
    const avatarUrl = `/${fileName}`;

    const ghCfg = getGithubConfig();

    if (ghCfg) {
      // 线上：头像写入 public/，并把 siteConfig.ts 的 avatarUrl 一并提交（push 触发重新部署）
      await githubCommitFile(ghCfg, `public/${fileName}`, buffer.toString('base64'), `content: 更新站长头像`, true);
      const source = await githubReadFile(ghCfg, SITE_CONFIG_PATH);
      if (source) {
        const patched = patchSiteConfig(source, avatarUrl);
        if (patched && patched !== source) {
          await githubCommitFile(ghCfg, SITE_CONFIG_PATH, patched, `content: 头像路径更新为 ${avatarUrl}`);
        }
      }
      const previewUrl = `https://cdn.jsdelivr.net/gh/${ghCfg.repo}@${encodeURIComponent(ghCfg.branch)}/public/${encodeURIComponent(fileName)}`;
      return NextResponse.json({
        ok: true,
        avatarUrl,
        previewUrl,
        mode: 'github',
        message: '头像已提交到仓库，站点将在 1-2 分钟内自动重新部署后生效',
      });
    }

    // 本地：直接写 public/ 并同步 siteConfig.ts
    const publicDir = path.resolve(process.cwd(), 'public');
    const filePath = path.resolve(publicDir, fileName);
    if (!filePath.startsWith(publicDir + path.sep)) {
      return NextResponse.json({ error: '文件名非法' }, { status: 400 });
    }
    fs.writeFileSync(filePath, buffer);

    const configPath = path.join(process.cwd(), SITE_CONFIG_PATH);
    if (fs.existsSync(configPath)) {
      const patched = patchSiteConfig(fs.readFileSync(configPath, 'utf8'), avatarUrl);
      if (patched) fs.writeFileSync(configPath, patched, 'utf8');
    }

    return NextResponse.json({ ok: true, avatarUrl, mode: 'local', message: '头像已更新，刷新页面即可看到' });
  } catch (error: unknown) {
    console.error('头像更新失败:', error);
    const message = error instanceof Error ? error.message : '头像更新失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
