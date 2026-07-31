import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🚨 保持关闭纯静态导出，让 Vercel 帮你把 API 跑起来（聊天/评论/天气等）
  // output: 'export',

  // 🚨 保持关闭强制斜杠，避免 API 路径匹配错误
  // trailingSlash: true,

  // 开发模式严格模式：帮助早期发现潜在问题
  reactStrictMode: true,

  // 生产环境自动压缩传输（gzip/brotli，Vercel 默认开启，设为 true 确保）
  compress: true,

  // 图片资源：本站多数为远程/外部图床，跳过 next/image 优化以兼容外部域名
  images: {
    unoptimized: true,
  },

  // ✅ 类型错误已在源码修复，去掉忽略开关让 Vercel 部署时进行类型检查，杜绝带 bug 上线
  // typescript: {
  //   ignoreBuildErrors: false,
  // },
};

export default nextConfig;
