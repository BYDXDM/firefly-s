// lib/github.ts
// GitHub 作为线上存储层（Git 即 CMS）：
// Vercel 等平台的函数文件系统是只读的，发文/建议等写入操作改为通过 GitHub Contents API
// 提交到仓库，push 自动触发 Vercel 重新部署，1-2 分钟后内容全站生效且永久保存。
// 凭据只从环境变量读取：GITHUB_TOKEN（需要仓库 Contents 读写权限）。

const GITHUB_API = 'https://api.github.com';

export interface GithubConfig {
  token: string;
  repo: string;
  branch: string;
}

export function getGithubConfig(): GithubConfig | null {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  return {
    token,
    repo: process.env.GITHUB_REPO || 'BYDXDM/firefly-s',
    branch: process.env.GITHUB_BRANCH || 'main',
  };
}

/** 仓库内路径编码（保留 / 分隔符） */
function encodeRepoPath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

async function ghFetch(cfg: GithubConfig, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${cfg.token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    cache: 'no-store',
  });
}

/** 创建或更新仓库文件（已存在则先取 sha 覆盖）。isBase64=true 时 content 为二进制内容的 base64 串（如图片） */
export async function githubCommitFile(cfg: GithubConfig, repoPath: string, content: string, message: string, isBase64 = false): Promise<void> {
  const encoded = encodeRepoPath(repoPath);

  let sha: string | undefined;
  const head = await ghFetch(cfg, `/repos/${cfg.repo}/contents/${encoded}?ref=${encodeURIComponent(cfg.branch)}`);
  if (head.ok) {
    const json = await head.json() as { sha?: string };
    sha = json.sha;
  }

  const put = await ghFetch(cfg, `/repos/${cfg.repo}/contents/${encoded}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: isBase64 ? content : Buffer.from(content, 'utf8').toString('base64'),
      branch: cfg.branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!put.ok) {
    throw new Error(`GitHub 提交失败 (${put.status}): ${await put.text()}`);
  }
}

/** 删除仓库文件 */
export async function githubDeleteFile(cfg: GithubConfig, repoPath: string, message: string): Promise<void> {
  const encoded = encodeRepoPath(repoPath);
  const head = await ghFetch(cfg, `/repos/${cfg.repo}/contents/${encoded}?ref=${encodeURIComponent(cfg.branch)}`);
  if (!head.ok) throw new Error('仓库中找不到该文件');
  const json = await head.json() as { sha?: string };
  if (!json.sha) throw new Error('仓库中找不到该文件');

  const del = await ghFetch(cfg, `/repos/${cfg.repo}/contents/${encoded}`, {
    method: 'DELETE',
    body: JSON.stringify({ message, sha: json.sha, branch: cfg.branch }),
  });
  if (!del.ok) {
    throw new Error(`GitHub 删除失败 (${del.status}): ${await del.text()}`);
  }
}

export interface GithubFileEntry {
  name: string;
  path: string;
}

/** 列出仓库目录下的文件 */
export async function githubListDir(cfg: GithubConfig, dirPath: string): Promise<GithubFileEntry[]> {
  const res = await ghFetch(cfg, `/repos/${cfg.repo}/contents/${encodeRepoPath(dirPath)}?ref=${encodeURIComponent(cfg.branch)}`);
  if (!res.ok) return [];
  const json = await res.json() as Array<{ name?: string; path?: string; type?: string }>;
  if (!Array.isArray(json)) return [];
  return json
    .filter((f) => f.type === 'file' && f.name && f.path)
    .map((f) => ({ name: f.name as string, path: f.path as string }));
}

/** 读取仓库单个文件内容 */
export async function githubReadFile(cfg: GithubConfig, repoPath: string): Promise<string | null> {
  const res = await ghFetch(cfg, `/repos/${cfg.repo}/contents/${encodeRepoPath(repoPath)}?ref=${encodeURIComponent(cfg.branch)}`);
  if (!res.ok) return null;
  const json = await res.json() as { content?: string; encoding?: string };
  if (json.encoding !== 'base64' || !json.content) return null;
  return Buffer.from(json.content, 'base64').toString('utf8');
}
