---
tags:
  - cms-import-ready
---

# Monorepo搭建清单

## 初始化项目目录

```shell
pnpm --workspace-root init
```

## 目录结构划分

```
├── apps # 业务目录
│   ├── frontend # 前端业务目录
│   ├── backend # 后端业务目录
├── packages # 组件库目录
│   ├── package-a
│   ├── package-b
| package.json
```

## 环境版本锁定

在`/package.json`中配置：

```json
{
  "engines": {
    "node": ">=16.0.0",
    "pnpm": ">=7.0.0",
    "git": ">=2.0.0"
  }
}
```

以上仅在版本不符时抛出警告，不影响项目运行。

可选项：强制限制版本，版本不符时停止执行

创建`.npmrc`文件，添加以下配置：

```
engine-strict=true
```

## 创建ts环境

根目录安装typescript环境

```shell
pnpm add -Dw typescript @types/node
```

根目录创建 tsconfig.json 文件，添加以下配置：

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

子目录创建 tsconfig.json文件，引用根目录的配置

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {}
}
```

注意区分客户端和服务端的环境，可添加以下配置：

客户端：

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "types": [],
    "lib": ["ESNEXT", "DOM"]
  }
}
```

服务端：

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "types": ["node"],
    "lib": ["ESNext"]
  }
}
```

## 代码风格和质量检查

### prettier

安装prettier

```shell
pnpm add -Dw prettier
```

配置 prettier 脚本

```json
{
  "scripts": {
    "lint:prettier": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,scss,md}\""
  }
}
```

配置 vscode 默认格式化配置

在 vscode 中安装 prettier 插件，添加以下配置：

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

配置prettier格式化规则

在根目录创建 `.prettierrc.json` 文件，添加以下配置（示例）：

```json
{
  "printWidth": 120,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "none",
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### EsLint

安装eslint

```shell
pnpm add -Dw eslint @eslint/js globals typescript-eslint @types/node eslint-plugin-prettier eslint-config-prettier eslint-plugin-vue
```

eslint生态

| 类别             | 描述                                               |
| ---------------- | -------------------------------------------------- |
| 核心引擎         | `eslint`                                           |
| 官方规则集       | `@eslint/js`                                       |
| 全局变量支持     | `globals`                                          |
| typescript支持   | `typescript-eslint`                                |
| 类型定义（辅助） | `@types/node`                                      |
| Prettier集成     | `eslint-plugin-prettier`, `eslint-config-prettier` |
| Vue.js支持       | `eslint-plugin-vue`                                |

创建`eslint.config.js`，示例如下

```js
const ignores = [
  "**/dist/**",
  "**/node_modules/**",
  ".*",
  "scripts/**",
  "**/.d.ts"
]

export default defineConfig(
  // 通用配置
  {
    ignores, // 忽略项
    extends: {
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      eslintConfigPrettier,
    }, // 继承规则
    plugins: {
      prettier: eslintPluginPrettier
    },
    languageOptions: {
      ecmaVersion: "lastest", // esma语法支持版本
      sourceType: 'module', // 模块化类型
      parser: testlint.parser, // 解析器
    },
    rules: {
      // 自定义
      // 示例：禁止 var
      "no-var": "error"
    },
  }
  // 前端配置
  {
    ignores,
    files: [
      "apps/frontend/**/*.{js,jsx,ts,tsx,vue}",
      "packages/components/**/*.{js,jsx,ts,tsx,vue}"
    ],
    extends: [
      ...eslintPluginVue.configs['flat/recommended'],
      eslintConfigPrettier,
    ],
    languageOptions: {
      globals: {
        ...globals.browser // 添加window, document等全局变量
      }
    }
  }
  // 后端配置
  {
    ignores,
    files: [
      "apps/backend/**/*.{js,jsx,ts,tsx}"
    ],
    languageOptions: {
      globals: {
        ...globals.node // 添加node全局变量
      }
    }
  }
)
```

添加脚本命令

```json
{
  "scripts": {
    "lint:eslint": "eslint \"**/*.{js,jsx,ts,tsx,json,css,scss,md}\""
  }
}
```

### 拼写检查

vscode插件：Code Spell Checker

或者通过 cspell 库解决

```shell
pnpm -Dw cspell @cspell/dict-lorem-ipsum
```

创建`.cspell.json`文件，添加以下配置：

```json
{
  "import": ["@cspell/dict-lorem-ipsum/cspell-ext.json"],
  "caseSensitive": false,
  "dictionaries": ["custom-dictionary"],
  "dictionaryDefinitions": [
    {
      "name": "custom-dictionary",
      "path": "./.cspell/custom-dictionary.txt",
      "addwords": true
    }
  ]
}
```

添加脚本

```json
{
  "scripts": {
    "lint:spell": "cspell \"**/*.{js,jsx,ts,tsx,json,css,scss,md}\""
  }
}
```

## git提交规范

### commitizen

用于生成规范的提交信息

### husky

用于连接 git hooks，在提交前或提交后做一些事情，例如检查代码风格

### lintstage

配置 lint 脚本，和 husky 配合使用
