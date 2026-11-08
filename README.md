# 唯花不落的数字庭院 (firefly-s)

一个基于 **Next.js 16 + Tailwind CSS 4** 的蔚蓝档案主题个人博客，支持文章、说说、杂谈、照片墙、音乐播放器、AI 猫娘（煤球）、天童爱丽丝看板娘（Spine 立绘 + 语音）等功能。

## 快速开始

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # 生产构建
npm run lint   # 代码检查
```

## 部署方式（Vercel + Git 即 CMS）

- 托管在 **Vercel**，GitHub 仓库 `BYDXDM/firefly-s`（remote `origin`），push 到 `main` 自动触发构建部署（无 vercel.json，纯 Git 集成）。
- 站长在 `/admin` 发文 / 传图 / 处理建议时，后端用 `GITHUB_TOKEN` 以 Git 提交形式把内容写回仓库（`GITHUB_REPO` / `GITHUB_BRANCH` 可配），push 后再次触发 Vercel 部署——**内容管理即部署**。
- 本地开发：`npm install && npm run dev`（http://localhost:3000，dev 绑定 `0.0.0.0` 便于局域网预览）；未配 `GITHUB_TOKEN` 时内容只写本地文件，仅本地可见。

## 内容管理

- `posts/` — 博客文章（Markdown + frontmatter）
- `chatters/` — 杂谈
- `moments/` — 说说
- `data/` — 友链、项目、相册配置
- `siteConfig.ts` — 全站配置中心（站点标题、社交账号、评论、弹幕等）
- `lib/alice/voice.ts` + `public/alice-*`、`public/spine/`、`public/voice/` — 爱丽丝看板娘立绘与语音资源（含语音轮换、Bang Bang Bang 触发逻辑）

`/admin` 是文章发布后台，入口有管理员登录门：**无账号，仅需密钥**（环境变量 `ADMIN_PASSKEY`），登录后可发布文章/说说/杂谈、上传图片、更换站长头像（「站点设置」），以及在「内容管理」中对已发布文章进行**编辑与删除**。若设置了环境变量 `ADMIN_PASSKEY`，发布/上传/头像/建议管理接口均需携带该密钥；未设置时放行（仅建议本地使用）。登录尝试有频率限制（同 IP 每 5 分钟 10 次）。

## 建议箱功能

- 访客访问 `/feedback` 提交建议（功能建议 / 问题反馈 / 随便聊聊）
- 数据以 Markdown 文件形式存放在 `feedback/` 目录（已在 `.gitignore` 中忽略）
- `POST /api/feedback` 公开提交，内置频率限制（同 IP 每 10 分钟 3 条）
- `GET /api/feedback` 与 `DELETE /api/feedback?id=...` 需要管理密钥
- 站长在 `/admin/feedback` 输入密钥后可查看与删除建议

## 环境变量（均可选）

| 变量 | 作用 | 缺省行为 |
| --- | --- | --- |
| `GITHUB_TOKEN` | **线上部署必配**：后台发文/传图/建议箱通过 GitHub API 提交到仓库（Git 即 CMS），push 自动触发重新部署 | 写本地文件（仅本地开发可用） |
| `GITHUB_REPO` | 目标仓库，默认 `BYDXDM/firefly-s` | — |
| `GITHUB_BRANCH` | 目标分支，默认 `main` | — |
| `GEMINI_API_KEY` | AI 猫「煤球」聊天 | 猫不回复 |
| `ADMIN_PASSKEY` | 后台/建议管理鉴权 | 放行（仅限本地使用） |
| `QWEATHER_KEY` | 和风天气数据源 | 自动改用 Open-Meteo 免费源，无需注册 |

> Token 权限：Fine-grained token 勾选该仓库的 **Contents: Read and write** 即可（经典 token 勾 `repo`）。
> 注意：后台发布与建议数据以 Git 提交形式保存，每次写入会触发一次 Vercel 自动部署（免费额度 100 次/天，个人博客足够）。

## 技术栈

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS 4 · Framer Motion · rehype/remark (Markdown + KaTeX + 代码高亮) · gray-matter

## 当前状态与注意事项（2026-11-07 盘点）

- Git：`main` 与 `origin/main`（BYDXDM/firefly-s）完全同步，工作区干净，最新提交 `730f541`；近期已升级 next 16.3.5 修安全通告，`npm audit` 归零。
- `.env.local` 存在本地凭据文件（含 `ADMIN_PASSKEY`，已被 .gitignore 忽略），勿提交、勿外传。
- 根目录 `fix.js` / `fix_dynamic.js` / `fix_syntax.js` 为一次性修复脚本，`dev.log`、`tsconfig.tsbuildinfo` 为本地日志/构建产物，均可忽略。
- 根级 `app/` + `components/` + `lib/` 是主要代码；`src/` 仅存静态资源。
- 移动端性能已专门优化（关闭 backdrop-filter、隐藏光斑、渐变静止化），改样式时注意保持；爱丽丝语音相关改动见 `lib/alice/voice.ts`。
