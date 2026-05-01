---
read_when:
    - 你正在调试插件包安装
    - 你正在更改插件启动、Doctor 或包管理器安装行为
    - 你正在维护打包的 OpenClaw 安装或内置插件清单
sidebarTitle: Dependencies
summary: OpenClaw 如何安装插件包并解析插件依赖项
title: 插件依赖解析
x-i18n:
    generated_at: "2026-05-01T20:39:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e66d3f9c50a5705e3331ca68d62df0fd55569f804182741b6d363e542639ff2b
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# 插件依赖解析

OpenClaw 将插件依赖工作保留在安装/更新时间。运行时加载不会运行包管理器、修复依赖树，或修改 OpenClaw 包目录。

## 责任划分

插件包拥有自己的依赖图：

- 运行时依赖位于插件包的 `dependencies` 或 `optionalDependencies`
- SDK/核心导入是 peer 或由 OpenClaw 提供的导入
- 本地开发插件自带已安装的依赖
- npm 和 git 插件安装到 OpenClaw 拥有的包根目录中

OpenClaw 只负责插件生命周期：

- 发现插件来源
- 在明确请求时安装或更新包
- 记录安装元数据
- 加载插件入口点
- 在依赖缺失时以可操作的错误失败

## 安装根目录

OpenClaw 使用稳定的按来源划分的根目录：

- npm 包安装在 `~/.openclaw/npm` 下
- git 包克隆在 `~/.openclaw/git` 下
- 本地/路径/归档安装会被复制或引用，不进行依赖修复

npm 安装在 npm 根目录中运行：

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

git 安装会克隆或刷新仓库，然后运行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

随后，已安装的插件会从该包目录加载，因此包本地 `node_modules` 解析的工作方式与普通 Node 包相同。

## 本地插件

本地插件被视为开发者控制的目录。OpenClaw 不会为它们运行 `npm install`、`pnpm install` 或依赖修复。如果本地插件有依赖，请在加载它之前在该插件中安装这些依赖。

TypeScript 本地插件可以使用紧急 Jiti 路径。打包的 JavaScript 插件通过原生 import/require 加载，而不是通过 Jiti。

## 启动和重新加载

Gateway 网关启动和配置重新加载绝不会安装插件依赖。它们会读取插件安装记录、计算入口点并加载它。

如果运行时缺少依赖，插件会加载失败，并且错误应指向面向操作者的明确修复方式：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 可以清理旧版 OpenClaw 生成的依赖状态，并安装本地安装记录中缺失的已配置可下载插件。它不会修复已安装本地插件的依赖。

## 内置插件

轻量级且对核心关键的内置插件会作为 OpenClaw 的一部分发布。它们应当没有繁重的运行时依赖树，或迁移到 ClawHub/npm 上的可下载包。

内置插件清单不得请求依赖暂存。大型或可选的插件功能应作为普通插件打包，并通过与第三方插件相同的 npm/git/ClawHub 路径安装。

## 旧版清理

较旧的 OpenClaw 版本会在启动时或 doctor 修复期间生成内置插件依赖根目录。当前的 doctor 清理会在使用 `--fix` 时移除这些过时目录和符号链接，包括旧的 `plugin-runtime-deps` 根目录、`.openclaw-runtime-deps*` 清单、生成的插件 `node_modules`、安装暂存目录以及包本地 pnpm store。

这些路径只是旧版残留。新的安装不应创建它们。
