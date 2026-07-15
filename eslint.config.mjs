import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // TypeScript — restored strict rules (brief §3)
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/prefer-as-const": "off",

      // React — restored strict rules (brief §3)
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "react/prop-types": "off",
      "react-compiler/react-compiler": "off",
      "react/jsx-no-comment-textnodes": "error",

      // Next.js
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",

      // General — restored strict rules (brief §3)
      "prefer-const": "error",
      "no-unused-vars": "off", // handled by @typescript-eslint/no-unused-vars
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-irregular-whitespace": "error",
      "no-case-declarations": "error",
      "no-fallthrough": "error",
      "no-mixed-spaces-and-tabs": "error",
      "no-redeclare": "off",
      "no-undef": "off", // TS handles this; false positives for React.ReactNode etc.
      "no-unreachable": "error",
      "no-useless-escape": "warn",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "examples/**",
      "skills/**",
      "tests/e2e/node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
];

export default eslintConfig;
