import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isAuthorized, unauthorizedResponse } from '../../../../lib/adminAuth';
import { getGithubConfig, githubCommitFile } from '../../../../lib/github';

// MIME 白名单 + 大小上限：与 avatar 路由同款模式（review P1-3），
// 不设限的话任意类型任意大小的文件都能进 public/uploads 并拿到 jsdelivr 公网 URL
const UPLOAD_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  try {
    // 🔐 管理后台鉴权
    if (!isAuthorized(req)) return unauthorizedResponse();

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 });
    }
    const ext = UPLOAD_TYPES[file.type];
    if (!ext) {
      return NextResponse.json({ error: '仅支持 JPG / PNG / WebP / GIF 格式' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: '图片太大了，请控制在 5MB 以内' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 清洗文件名，防止路径注入
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    if (cleanFileName.includes('..')) {
      return NextResponse.json({ error: '文件名非法' }, { status: 400 });
    }
    // 扩展名以白名单为准（丢弃原扩展名），杜绝 .html/.svg 之类载体借道获得可分发 URL
    const baseName = cleanFileName.replace(/\.[^.]*$/, '') || 'image';
    const uniqueName = `${Date.now()}-${baseName}.${ext}`;

    // 线上（Vercel 等只读文件系统）：提交到 GitHub 仓库 public/uploads，部署后即可访问
    const ghCfg = getGithubConfig();
    if (ghCfg) {
      await githubCommitFile(
        ghCfg,
        `public/uploads/${uniqueName}`,
        buffer.toString('base64'),
        `content: 上传图片 ${uniqueName}`,
        true
      );
      const url = `https://cdn.jsdelivr.net/gh/${ghCfg.repo}@${encodeURIComponent(ghCfg.branch)}/public/uploads/${encodeURIComponent(uniqueName)}`;
      return NextResponse.json({ url, mode: 'github' });
    }

    // 本地开发：直接写 public/uploads
    const uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.resolve(uploadDir, uniqueName);
    if (!filePath.startsWith(uploadDir + path.sep)) {
      return NextResponse.json({ error: '文件名非法' }, { status: 400 });
    }
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${uniqueName}`;
    return NextResponse.json({ url: fileUrl, mode: 'local' });
  } catch (error: unknown) {
    console.error('上传失败:', error);
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === 'EROFS') {
      return NextResponse.json(
        { error: '服务器文件系统只读：请配置 GITHUB_TOKEN 环境变量以启用云端上传，配置后重新部署即可' },
        { status: 500 }
      );
    }
    const message = error instanceof Error ? error.message : '上传失败';
    return NextResponse.json({ error: message || '上传失败' }, { status: 500 });
  }
}
