import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isAuthorized, unauthorizedResponse } from '../../../../lib/adminAuth';
import { getGithubConfig, githubCommitFile } from '../../../../lib/github';

export async function POST(req: Request) {
  try {
    // 🔐 管理后台鉴权
    if (!isAuthorized(req)) return unauthorizedResponse();

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 清洗文件名，防止路径注入
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    if (cleanFileName.includes('..')) {
      return NextResponse.json({ error: '文件名非法' }, { status: 400 });
    }
    const uniqueName = `${Date.now()}-${cleanFileName}`;

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
      return NextResponse.json({ url: `/uploads/${uniqueName}`, mode: 'github' });
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
    const message = error instanceof Error ? error.message : '上传失败';
    return NextResponse.json({ error: message || '上传失败' }, { status: 500 });
  }
}
