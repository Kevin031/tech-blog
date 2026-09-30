# Kevin 的技术博客

使用 vitepress 搭建

## 一条命令准备 CMS 迁移

```sh
pnpm cms:migrate
```

命令会扫描正式文章、转换草稿并生成本地预览，终端只显示篇数和待处理项。预览入口在 `.cms-import/previews/index.html`，结果见 [准备报告](reports/cms-import-prepared.md)。默认不会上传图片、写入 CMS 或发布文章。

需要实际上传图片并写入 CMS 草稿时，在当前终端提供 `CMS_SESSION_COOKIE` 后执行 `pnpm cms:migrate --apply`。脚本会先上传图片，再多轮生成并导入草稿，以便站内链接在目标文章获得 CMS ID 后自动改写。此操作仍不会发布文章；Cookie 不要发送到对话中。可用 `pnpm cms:migrate:test` 检查总流程。

## 导入本地 CMS 数据库

本地开发环境可直接运行 `pnpm cms:import-local --apply`，将 105 篇正式文章写入 `../peanut-cms/apps/api/data/peanut-cms.sqlite`，并把 16 张本地图片复制到 `../peanut-cms/apps/blog/public/tech-blog-assets`。文章均为未发布草稿；`about`、`posts` 使用 CMS 已有的「随笔」标签，其余目录使用已有的「前端」标签。导入程序不会新增标签，也不会给这些文章添加「测试数据」标签。源文件的 `cms-import-ready` 只用于筛选，不会成为 CMS 标签。

去掉 `--apply` 运行 `pnpm cms:import-local` 可先查看导入数量。正式执行前会在 `.cms-import/backups` 备份数据库；重复执行会跳过内容未变的文章。若源文更新，脚本只更新尚未发布、且上次导入后未在 CMS 修改的草稿。可用 `CMS_LOCAL_DB` 和 `CMS_BLOG_PUBLIC_DIR` 指定其他本地数据库及图片目录。新复制的图片若在已运行的 Nuxt 开发服务器中返回 404，重启 blog 开发服务器后即可访问。

## CMS 文章导入标记

计划导入 `../peanut-cms` 线上文章库的正式文章，在 Markdown 文件开头添加 Frontmatter 标签：

```yaml
---
tags:
  - cms-import-ready
---
```

后续导入程序只选择包含 `cms-import-ready` 的正文文章；此标签是源文件中的导入标记，不代表文章已在 CMS 发布，也不应作为面向读者的内容标签写入 CMS。

当前标记范围：`docs/about`、`docs/challenge`、`docs/frontend`、`docs/learning` 和 `docs/posts` 中的正文。目录导航页、空文件和只有「待整理」或章节标题的占位页暂不标记；`docs/tools`、`docs/playground` 及项目示例页暂不纳入。`challenge` 中使用 `<<< ./index.js` 等 VitePress 引用语法的文章，正式导入时需要先展开引用内容，并处理本地图片等资源。

运行 `pnpm cms:preflight` 可重新扫描带标记的文章，更新 [迁移预检报告](reports/cms-import-preflight.md) 和 [逐项 JSON](reports/cms-import-preflight.json)。预检会区分资源缺失、需要转换的 VitePress 语法和人工复核项；`ready` 仅表示未发现脚本已知的格式障碍，不等于已发布或已完成内容审核。

运行 `pnpm cms:prepare` 会根据最新预检结果生成 [草稿准备报告](reports/cms-import-prepared.md)，并在本地生成被 Git 忽略的 `.cms-import/drafts.json` 和 `.cms-import/assets.json`。目前 105 篇中有 96 篇可生成草稿数据；脚本会展开代码引用、转换 VitePress 容器，并把 HTML 与 Vue 页面演示转为静态源码示例。其余 9 篇涉及本地图片或站内链接，列在报告中等待处理；图片清单记录文件哈希和引用文章，供上传后改写链接。生成数据不会写入 CMS；交互演示的呈现、远程图片、回退标题、摘要和少数原文代码块仍须在导入前复核。

对 14 篇代码或提纲为主的文章，草稿使用 [人工整理的摘要](scripts/cms-summary-overrides.json)；源 Markdown 不因此改写。

源文修改后重新运行 `pnpm cms:migrate` 即可。`cms:preflight`、`cms:prepare` 和 `cms:preview` 等分步命令用于排错；各步测试可单独运行。

图片上传到 CMS 后，可在 `.cms-import/asset-urls.json` 中记录文件 SHA-256 与公开 HTTPS 地址的对应关系，例如 `{"图片哈希":"https://example.com/image.png"}`。再次运行 `pnpm cms:prepare` 会改写匹配图片的链接并放行对应文章；哈希取自 `.cms-import/assets.json`，源图片变动时旧映射不会误用。

`pnpm cms:upload-assets` 默认只读预览 16 个待上传图片；提供 `CMS_SESSION_COOKIE` 后执行 `pnpm cms:upload-assets --apply` 才会通过 CMS 媒体接口上传。可添加 `--limit 1` 先上传一张。命令会将已上传图片的 ID、URL 和哈希记录在被 Git 忽略的 `.cms-import/`，并自动写入 `asset-urls.json`。如果一次上传结果不明，命令会暂停后续上传，需先在 CMS 媒体库核对，避免重复创建。使用 `pnpm cms:upload-assets:test` 检查上传逻辑。

站内链接目标已在 CMS 发布后，可在 `.cms-import/article-urls.json` 中按源路径记录目标文章地址，例如 `{"docs/frontend/浏览器/网页性能优化指标.md":"https://example.com/articles/文章ID"}`，再运行 `pnpm cms:prepare` 改写引用。两个映射文件均在被 Git 忽略的目录中。
若目标文章已由本导入器创建草稿，`cms:prepare` 也会读取 `.cms-import/import-state.json`，自动生成 `/articles/文章ID` 链接；目标发布后仍须确认该链接可访问。

运行 `pnpm cms:import` 可只读查看本批草稿数量。确认草稿数据后，以环境变量 `CMS_SESSION_COOKIE` 提供当前 CMS 登录会话的 Cookie 值，执行 `pnpm cms:import --apply` 创建或更新草稿；默认 API 为 `http://localhost:3001/api`，可由 `CMS_API_BASE` 覆盖。也可添加 `--limit 1` 先导入一篇。导入状态保存在被 Git 忽略的 `.cms-import/import-state.json`，重跑会按最终草稿内容哈希跳过相同版本，包含外部代码引用的变化；已发布文章和在管理端修改过的草稿不会被覆盖，也不会调用发布接口。使用 `pnpm cms:import:test` 检查导入逻辑。

运行 `pnpm cms:preview` 可在 `.cms-import/previews/index.html` 生成本地预览目录。预览使用 `../peanut-cms/apps/blog` 当前安装的 Markdown 渲染器，并显示各篇的复核提示。

```shell
// 本地开发
npm run docs:dev

// 生产构建
npm run docs:build
```
