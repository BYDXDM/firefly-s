# 唯花不落的数字庭院 (firefly-s)

一个基于 **Next.js 16 + Tailwind CSS 4** 的个人博客，支持文章、说说、杂谈、照片墙、音乐播放器、AI 猫娘等功能。

## 快速开始

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # 生产构建
npm run lint   # 代码检查
```

## 内容管理

- `posts/` — 博客文章（Markdown + frontmatter）
- `chatters/` — 杂谈
- `moments/` — 说说
- `data/` — 友链、项目、相册配置
- `siteConfig.ts` — 全站配置中心（站点标题、社交账号、评论、弹幕等）

`/admin` 是文章发布后台。若设置了环境变量 `ADMIN_PASSKEY`，发布/上传接口与管理接口需要携带该密钥；未设置时放行（仅建议本地使用）。

## 建议箱功能

- 访客访问 `/feedback` 提交建议（功能建议 / 问题反馈 / 随便聊聊）
- 数据以 Markdown 文件形式存放在 `feedback/` 目录（已在 `.gitignore` 中忽略）
- `POST /api/feedback` 公开提交，内置频率限制（同 IP 每 10 分钟 3 条）
- `GET /api/feedback` 与 `DELETE /api/feedback?id=...` 需要管理密钥
- 站长在 `/admin/feedback` 输入密钥后可查看与删除建议

## 环境变量（均可选）

| 变量 | 作用 | 缺省行为 |
| --- | --- | --- |
| `GEMINI_API_KEY` | AI 猫「煤球」聊天 | 猫不回复 |
| `ADMIN_PASSKEY` | 后台/建议管理鉴权 | 放行（仅限本地使用） |
| `QWEATHER_KEY` | 和风天气数据源 | 自动改用 Open-Meteo 免费源，无需注册 |

> 注意：`feedback/` 与后台发布的文章一样基于本地文件系统存储。部署到 Vercel 等只读/临时文件系统的平台时，新写入的数据会随重新部署丢失；如需持久化请接入数据库或对象存储。

## 技术栈

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS 4 · Framer Motion · rehype/remark (Markdown + KaTeX + 代码高亮) · gray-matter
