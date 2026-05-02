---
read_when:
    - 你正在调试插件包安装
    - 你正在更改插件启动、Doctor 或包管理器安装行为
    - 你正在维护打包的 OpenClaw 安装或内置插件清单
sidebarTitle: Dependencies
summary: OpenClaw 如何安装插件包并解析插件依赖
title: 插件依赖解析
x-i18n:
    generated_at: "2026-05-02T09:29:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9476529ad1d44ed1b17caca628c58acfbb1d8c73393f58fa7d3d76944a71aea
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# 插件依赖项解析

OpenClaw 将插件依赖项工作保留在安装/更新时间。运行时加载
不会运行包管理器、修复依赖项树，或更改 OpenClaw
包目录。

## 职责划分

插件包拥有自己的依赖关系图：

- 运行时依赖项位于插件包的 `dependencies` 或
  `optionalDependencies`
- SDK/核心导入是 peer，或是 OpenClaw 提供的导入
- 本地开发插件自带已安装的依赖项
- npm 和 git 插件会安装到 OpenClaw 拥有的包根目录

OpenClaw 只拥有插件生命周期：

- 发现插件源
- 在明确请求时安装或更新包
- 记录安装元数据
- 加载插件入口点
- 依赖项缺失时，以可操作的错误失败

## 安装根目录

OpenClaw 使用稳定的按来源划分的根目录：

- npm 包安装在 `~/.openclaw/npm` 下
- git 包克隆到 `~/.openclaw/git` 下
- local/path/archive 安装会被复制或引用，不进行依赖项修复

npm 安装会在 npm 根目录中运行：

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm 可能会将传递依赖项提升到插件包旁边的
`~/.openclaw/npm/node_modules`。OpenClaw 会先扫描托管的 npm 根目录再信任
安装，并在卸载期间使用 npm 移除 npm 管理的包，因此被提升的
运行时依赖项仍位于托管清理边界内。

git 安装会克隆或刷新仓库，然后运行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

安装后的插件随后会从该包目录加载，因此包本地
和父级 `node_modules` 解析的工作方式与普通
Node 包相同。

## 本地插件

本地插件被视为由开发者控制的目录。OpenClaw 不会为它们
运行 `npm install`、`pnpm install` 或依赖项修复。如果本地
插件有依赖项，请先在该插件中安装它们再加载。

第三方 TypeScript 本地插件可以使用应急 Jiti 路径。打包后的
JavaScript 插件和内置内部插件通过原生
import/require 加载，而不是通过 Jiti。

## 启动和重新加载

Gateway 网关启动和配置重新加载绝不会安装插件依赖项。它们会读取
插件安装记录，计算入口点，并加载它。

如果运行时缺少依赖项，插件会加载失败，错误
应指向操作员可明确执行的修复方式：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 可以清理旧版 OpenClaw 生成的依赖项状态，并安装
已配置但本地安装记录中缺失的可下载插件。
它不会为已经安装的本地插件修复依赖项。

## 内置插件

轻量且对核心关键的内置插件会作为 OpenClaw 的一部分交付。
它们应当没有繁重的运行时依赖项树，或被移出为
ClawHub/npm 上的可下载包。

有关在核心包中随附、外部安装或仅保留源码的插件的当前生成列表，请参阅 [插件清单](/zh-CN/plugins/plugin-inventory)。

内置插件清单不得请求依赖项暂存。大型或可选
插件功能应作为普通插件打包，并通过与第三方插件相同的 npm/git/ClawHub 路径安装。

在源码检出中，OpenClaw 会将仓库视为 pnpm monorepo。在
`pnpm install` 之后，内置插件会从 `extensions/<id>` 加载，因此包本地
workspace 依赖项可用，并且编辑会被直接拾取。源码
检出开发仅支持 pnpm；在仓库根目录执行普通 `npm install`
不是准备内置插件依赖项的受支持方式。

| 安装形态                         | 内置插件位置                          | 依赖项所有者                                                           |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 包内的构建后运行时树                  | OpenClaw 包以及显式的插件安装/更新/doctor 流程                       |
| Git 检出加 `pnpm install`        | `extensions/<id>` workspace 包        | pnpm workspace，包括每个插件包自己的依赖项                           |
| `openclaw plugins install ...`   | 托管的 npm/git/ClawHub 插件根目录     | 插件安装/更新流程                                                     |

## 旧版清理

旧版 OpenClaw 会在启动时或 doctor 修复期间生成内置插件依赖项根目录。当前的 doctor 清理会在使用 `--fix` 时移除这些陈旧目录和
符号链接，包括旧的 `plugin-runtime-deps` 根目录、
`.openclaw-runtime-deps*` 清单、生成的插件 `node_modules`、安装
暂存目录，以及包本地 pnpm stores。

这些路径只是旧版残留物。新安装不应创建它们。
