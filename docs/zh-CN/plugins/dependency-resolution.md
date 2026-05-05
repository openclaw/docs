---
read_when:
    - 你正在调试插件包安装
    - 你正在更改插件启动、Doctor 或包管理器安装行为
    - 你正在维护打包版 OpenClaw 安装或内置插件清单
sidebarTitle: Dependencies
summary: OpenClaw 如何安装插件包并解析插件依赖项
title: 插件依赖解析
x-i18n:
    generated_at: "2026-05-05T01:21:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a832f705e51bba8ac77e2a8715a7213fd2caf10bfa42059d53db4a6d5ad8c20
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# 插件依赖项解析

OpenClaw 将插件依赖项工作保留在安装/更新时间。运行时加载
不会运行包管理器、修复依赖项树，或更改 OpenClaw
包目录。

## 责任划分

插件包负责自己的依赖图：

- 运行时依赖项位于插件包的 `dependencies` 或
  `optionalDependencies`
- SDK/核心导入是 peer 或由 OpenClaw 提供的导入
- 本地开发插件自带已安装的依赖项
- npm 和 git 插件会安装到 OpenClaw 拥有的包根目录中

OpenClaw 只负责插件生命周期：

- 发现插件来源
- 在明确请求时安装或更新包
- 记录安装元数据
- 加载插件入口点
- 依赖项缺失时，以可操作的错误失败

## 安装根目录

OpenClaw 使用稳定的按来源划分的根目录：

- npm 包安装在 `~/.openclaw/npm` 下
- git 包克隆到 `~/.openclaw/git` 下
- 本地/路径/归档安装会被复制或引用，不进行依赖项修复

npm 安装在 npm 根目录中运行：

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm 可能会将传递依赖项提升到插件包旁边的 `~/.openclaw/npm/node_modules`。
OpenClaw 会在信任安装前扫描受管 npm 根目录，并在卸载期间使用 npm
移除 npm 管理的包，因此提升后的运行时依赖项仍留在受管清理边界内。

git 安装会克隆或刷新仓库，然后运行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

安装后的插件会从该包目录加载，因此包本地和父级 `node_modules`
解析的工作方式与普通 Node 包相同。

## 本地插件

本地插件会被视为开发者控制的目录。OpenClaw 不会为它们运行
`npm install`、`pnpm install` 或依赖项修复。如果本地插件有依赖项，
请在加载它之前在该插件中安装这些依赖项。

第三方 TypeScript 本地插件可以使用紧急 Jiti 路径。打包的 JavaScript
插件和内置内部插件会通过原生 import/require 加载，而不是通过 Jiti。

## 启动和重新加载

Gateway 网关启动和配置重新加载绝不会安装插件依赖项。它们会读取
插件安装记录，计算入口点，然后加载它。

如果运行时缺少某个依赖项，插件加载会失败，并且错误应指引操作员执行明确的修复：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 可以清理旧版 OpenClaw 生成的依赖项状态，并恢复在配置
引用它们时本地安装记录中缺失的可下载插件。Doctor 不会为已经安装的
本地插件修复依赖项。

## 内置插件

轻量级且对核心关键的内置插件会作为 OpenClaw 的一部分发布。
它们应当没有沉重的运行时依赖项树，或者被移出为 ClawHub/npm 上的
可下载包。

有关当前随核心包发布、外部安装或仅保留源码的插件生成列表，请参阅
[插件清单](/zh-CN/plugins/plugin-inventory)。

内置插件清单不得请求依赖项暂存。大型或可选插件功能应作为普通插件打包，
并通过与第三方插件相同的 npm/git/ClawHub 路径安装。

在源码检出中，OpenClaw 会将仓库视为 pnpm monorepo。执行
`pnpm install` 后，内置插件会从 `extensions/<id>` 加载，因此包本地
workspace 依赖项可用，编辑也会被直接拾取。源码检出开发仅支持 pnpm；
在仓库根目录执行普通 `npm install` 不是准备内置插件依赖项的受支持方式。

| 安装形态                         | 内置插件位置                          | 依赖项所有者                                                         |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 包内部构建出的运行时树                | OpenClaw 包以及显式的插件安装/更新/Doctor 流程                      |
| Git 检出加 `pnpm install`        | `extensions/<id>` workspace 包        | pnpm workspace，包括每个插件包自己的依赖项                           |
| `openclaw plugins install ...`   | 受管 npm/git/ClawHub 插件根目录       | 插件安装/更新流程                                                    |

## 旧版清理

较早的 OpenClaw 版本会在启动时或 Doctor 修复期间生成内置插件依赖项根目录。
当前的 Doctor 清理会在使用 `--fix` 时移除这些陈旧目录和符号链接，包括旧的
`plugin-runtime-deps` 根目录、指向已清理 `plugin-runtime-deps` 目标的全局
Node-prefix 包符号链接、`.openclaw-runtime-deps*` 清单、生成的插件
`node_modules`、安装暂存目录以及包本地 pnpm 存储。打包后的 postinstall
也会在清理旧版目标根目录之前移除这些全局符号链接，这样升级不会留下悬空的
ESM 包导入。

这些路径只是旧版残留。新安装不应创建它们。
