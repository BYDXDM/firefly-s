import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      // 质量防线（review P1-5）：条件 hook 这类运行期炸弹零容忍；另外两条先降为 warn 逐步收敛
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "no-unused-vars": "off",
      "no-unused-expressions": "off",
      "react/display-name": "off",
      "prefer-const": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "react-hooks/purity": "off",
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 根目录的一次性补丁脚本，不属于应用代码
    "fix*.js",
    "build*.js",
    // 一次性素材生成脚本
    "scripts/**",
  ]),
]);

export default eslintConfig;
