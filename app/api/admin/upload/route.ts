import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isAuthorized, unauthorizedResponse } from '../../../../lib/adminAuth';

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

    // 确保 public/uploads 文件夹存在
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 清洗文件名，防止路径注入
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${Date.now()}-${cleanFileName}`;
    const filePath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${uniqueName}`;
    return NextResponse.json({ url: fileUrl });
  } catch (error: any) {
    console.error('上传失败:', error);
    return NextResponse.json({ error: error.message || '上传失败' }, { status: 500 });
  }
}
