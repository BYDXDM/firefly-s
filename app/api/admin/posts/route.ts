import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isAuthorized, unauthorizedResponse } from '../../../../lib/adminAuth';
import { getGithubConfig, githubCommitFile, githubDeleteFile } from '../../../../lib/github';
import { getSortedPosts, readRawMarkdown } from '../../../../lib/content';

// 文章 slug 只允许字母数字、中文与连字符
const SLUG_RE = /^[a-zA-Z0-9\u4e00-\u9fa5]+(?:-[a-zA-Z0-9\u4e00-\u9fa5]+)*$/;

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function buildMarkdown(post: { title: string; date: string; description: string; cover: string; tags: string[]; content: string }): string {
  return `---
title: "${post.title.replace(/"/g, '\\"')}"
date: "${post.date}"
description: "${post.description.replace(/"/g, '\\"')}"
cover: "${post.cover}"
tags: ${JSON.stringify(post.tags)}
---

${post.content.replace(/\r\n/g, '\n').trim()}
`;
}

/** 列出全部文章（供管理列表使用，读取当前部署快照） */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorizedResponse();

  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) {
    const items = getSortedPosts().map((p) => ({
      slug: p.slug,
      title: p.title,
      date: p.date,
      tags: p.tags,
    }));
    return NextResponse.json({ items });
  }

  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ error: 'slug 非法' }, { status: 400 });
  }
  const found = readRawMarkdown('posts').find((p) => p.slug === slug);
  if (!found) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  }
  return NextResponse.json({
    post: {
      slug,
      title: str(found.data.title),
      description: str(found.data.description),
      cover: str(found.data.cover),
      date: str(found.data.date),
      tags: Array.isArray(found.data.tags) ? found.data.tags : [],
      content: found.content,
    },
  });
}

/** 更新已有文章 */
export async function PUT(req: Request) {
  try {
    if (!isAuthorized(req)) return unauthorizedResponse();

    const body = await req.json();
    const slug = str(body?.slug);
    if (!SLUG_RE.test(slug)) {
      return NextResponse.json({ error: 'slug 非法' }, { status: 400 });
    }
    const exists = readRawMarkdown('posts').some((p) => p.slug === slug);
    if (!exists) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    const title = str(body?.title).trim() || '无标题';
    const original = readRawMarkdown('posts').find((p) => p.slug === slug);
    const date = str(body?.date).trim() || str(original?.data.date) || new Date().toISOString();
    const tags = Array.isArray(body?.tags)
      ? body.tags.map((t: unknown) => str(t)).filter(Boolean)
      : str(body?.tags).split(',').map((t) => t.trim()).filter(Boolean);

    const fileContent = buildMarkdown({
      title,
      date,
      description: str(body?.description).trim(),
      cover: str(body?.cover).trim() || 'https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg',
      tags,
      content: str(body?.content),
    });

    const ghCfg = getGithubConfig();
    if (ghCfg) {
      await githubCommitFile(ghCfg, `posts/${slug}.md`, fileContent, `content: 更新文章 ${slug}`);
      return NextResponse.json({ ok: true, slug, mode: 'github', message: '文章已更新，站点将在 1-2 分钟内自动重新部署后生效' });
    }

    const postsDir = path.resolve(process.cwd(), 'posts');
    const filePath = path.resolve(postsDir, `${slug}.md`);
    if (!filePath.startsWith(postsDir + path.sep)) {
      return NextResponse.json({ error: 'slug 非法' }, { status: 400 });
    }
    fs.writeFileSync(filePath, fileContent, 'utf8');
    return NextResponse.json({ ok: true, slug, mode: 'local', message: '文章已更新' });
  } catch (error: unknown) {
    console.error('更新文章失败:', error);
    const message = error instanceof Error ? error.message : '更新文章失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** 删除文章 */
export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorizedResponse();

  const slug = req.nextUrl.searchParams.get('slug') || '';
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ error: 'slug 非法' }, { status: 400 });
  }
  const exists = readRawMarkdown('posts').some((p) => p.slug === slug);
  if (!exists) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  }

  const ghCfg = getGithubConfig();
  if (ghCfg) {
    try {
      await githubDeleteFile(ghCfg, `posts/${slug}.md`, `content: 删除文章 ${slug}`);
      return NextResponse.json({ ok: true, mode: 'github', message: '文章已删除，站点将在 1-2 分钟内自动重新部署后生效' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '删除失败';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const postsDir = path.resolve(process.cwd(), 'posts');
  const filePath = path.resolve(postsDir, `${slug}.md`);
  if (!filePath.startsWith(postsDir + path.sep)) {
    return NextResponse.json({ error: 'slug 非法' }, { status: 400 });
  }
  fs.unlinkSync(filePath);
  return NextResponse.json({ ok: true, mode: 'local', message: '文章已删除' });
}
