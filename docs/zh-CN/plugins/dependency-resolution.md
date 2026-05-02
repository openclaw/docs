---
read_when:
    - 你正在调试插件包安装
    - 你正在更改插件启动、Doctor 或包管理器安装行为
    - 你正在维护打包的 OpenClaw 安装或内置插件清单
sidebarTitle: Dependencies
summary: OpenClaw 如何安装插件包并解析插件依赖
title: 插件依赖解析
x-i18n:
    generated_at: "2026-05-02T02:01:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43d8008c837d519fd7c886f9615ad53941da340d753b559dfb0a32877716bc1f
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# 插件依赖解析

OpenClaw 将插件依赖工作保留在安装/更新时间。运行时加载
不会运行包管理器、修复依赖树，也不会改变 OpenClaw
包目录。

## 职责划分

插件包自行负责其依赖图：

- 运行时依赖位于插件包的 `dependencies` 或
  `optionalDependencies`
- SDK/核心导入项是 peer 依赖或由 OpenClaw 提供的导入项
- 本地开发插件自带已安装的依赖
- npm 和 git 插件安装到 OpenClaw 拥有的包根目录中

OpenClaw 只负责插件生命周期：

- 发现插件来源
- 在明确请求时安装或更新包
- 记录安装元数据
- 加载插件入口点
- 当依赖缺失时，以可操作的错误失败

## 安装根目录

OpenClaw 使用稳定的按来源划分的根目录：

- npm 包安装在 `~/.openclaw/npm` 下
- git 包克隆到 `~/.openclaw/git` 下
- 本地/路径/归档安装会被复制或引用，不进行依赖修复

npm 安装会在 npm 根目录中运行：

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm 可能会将传递依赖提升到插件包旁边的
`~/.openclaw/npm/node_modules`。OpenClaw 会先扫描托管的 npm 根目录，
再信任该安装，并在卸载期间使用 npm 移除 npm 托管的包，因此提升后的
运行时依赖会留在托管清理边界内。

git 安装会克隆或刷新仓库，然后运行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

已安装的插件随后会从该包目录加载，因此包本地和父级 `node_modules`
解析的工作方式与普通 Node 包相同。

## 本地插件

本地插件被视为开发者控制的目录。OpenClaw 不会为它们运行
`npm install`、`pnpm install` 或依赖修复。如果本地
插件有依赖，请在加载它之前在该插件中安装依赖。

第三方 TypeScript 本地插件可以使用应急 Jiti 路径。打包的
JavaScript 插件和内置内部插件通过原生 import/require 加载，
而不是通过 Jiti。

## 启动和重载

Gateway 网关启动和配置重载绝不会安装插件依赖。它们会读取
插件安装记录、计算入口点并加载它。

如果运行时缺少依赖，插件会加载失败，并且错误应将操作员指向明确的修复方法：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 可以清理旧版 OpenClaw 生成的依赖状态，并安装
已配置但本地安装记录缺失的可下载插件。它不会为已安装的本地插件修复依赖。

## 内置插件

轻量级和核心关键的内置插件作为 OpenClaw 的一部分交付。
它们应该要么没有庞大的运行时依赖树，要么被移出为 ClawHub/npm 上的
可下载包。

内置插件清单不得请求依赖暂存。大型或可选插件功能应作为普通插件打包，
并通过与第三方插件相同的 npm/git/ClawHub 路径安装。

在源码 checkout 中，OpenClaw 将仓库视为 pnpm monorepo。执行
`pnpm install` 后，内置插件会从 `extensions/<id>` 加载，
因此包本地的 workspace 依赖可用，编辑也会被直接采用。源码
checkout 开发仅支持 pnpm；在仓库根目录执行普通 `npm install`
不是准备内置插件依赖的受支持方式。

| 安装形态                         | 内置插件位置                          | 依赖所有者                                                           |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 包内构建好的运行时树                  | OpenClaw 包以及显式的插件安装/更新/Doctor 流程                      |
| Git checkout 加 `pnpm install`   | `extensions/<id>` workspace 包        | pnpm workspace，包括每个插件包自己的依赖                             |
| `openclaw plugins install ...`   | 托管的 npm/git/ClawHub 插件根目录     | 插件安装/更新流程                                                    |

## 旧版清理

旧版 OpenClaw 会在启动时或 Doctor 修复期间生成内置插件依赖根目录。
当前 Doctor 清理会在使用 `--fix` 时移除这些陈旧目录和符号链接，
包括旧的 `plugin-runtime-deps` 根目录、`.openclaw-runtime-deps*`
清单、生成的插件 `node_modules`、安装暂存目录，以及包本地的 pnpm 存储。

这些路径只是旧版残留。新安装不应创建它们。
