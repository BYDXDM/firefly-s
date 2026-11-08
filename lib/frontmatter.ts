/**
 * YAML 双引号标量：JSON.stringify 的产出本身就是合法的 YAML 标量，
 * 引号/反斜杠/换行都会被正确转义，防止值里的特殊字符打挂 frontmatter 解析
 * （一次坏标题曾能让 getSortedPosts 在构建期抛异常、全站部署失败）。
 * publish 与 posts PUT 的 frontmatter 拼接统一走这里。
 */
export function yamlScalar(value: unknown): string {
  return JSON.stringify(typeof value === 'string' ? value : '');
}
