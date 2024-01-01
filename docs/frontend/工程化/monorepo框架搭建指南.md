# monorepo 框架搭建指南

以下指南以 pnpm 为基础展开

## 1. 创建新目录

```shell
mkdir my-project

cd my-project
```

## 2. 初始化 package.json

```shell
pnpm init
```

## 3. 创建文件 pnpm-workspace.yaml 和目录 packages

pnpm-workspace.yaml 示例

```yaml
packages:
  - packages/*
  # 下面这些是没有放在packages下的其它目录
  # - mobile-renderer
  # - page-editor

  # exclude packages
  - '!**/test/**'
```

## 4. 在 packages 下的子目录创建 package.json 开始开发即可
