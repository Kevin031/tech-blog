# Tauri 入门实践

## 认识 Tauri

Tauri 比 Electron 有什么不一样？更小，更快

首先，electron 的问题：由于塞入 Chromium 和 nodejs，一个什么也不做的 electron 项目压缩后也大概要 50m。

其次，electron 还有个问题：内存消耗过大，因为 Chromium 本身就很吃内存，再加上提供操作系统访问能力的 nodejs，有很大的内存消耗，对小工具类的项目不友好。

tauri 看了一下，不再塞入 Chromium 和 nodejs，前端使用操作系统的 webview，后端和操作系统集成这块使用 rust 实现，理论上应该比 nodejs 要精简高效。

## 快速开始

1. 安装 Rust 开发依赖

```shell
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

2. 初始化工程模板

```shell
yarn create tauri-app
```

3. 安装依赖

```shell
yarn
```

4. 初始化 tauri 环境

```shell
npm run tauri init
```

5. 启动 tauri 开发进程

```shell
npm run tauri dev
```

此处注意需要将`vite.config.js`中的端口，改为上一步中指定的 web 端口
