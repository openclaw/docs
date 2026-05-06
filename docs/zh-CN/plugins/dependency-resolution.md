---
read_when:
    - 你正在调试插件包安装
    - 你正在更改插件启动、Doctor 或包管理器安装行为
    - 你正在维护打包的 OpenClaw 安装或内置插件清单
sidebarTitle: Dependencies
summary: OpenClaw 如何安装插件包并解析插件依赖项
title: 插件依赖解析
x-i18n:
    generated_at: "2026-05-06T06:36:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ef307fb034d397a5e2e991254fb881046c73a4e6d860073b90f2b4e0667edc2
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# 插件依赖解析

OpenClaw 将插件依赖工作保留在安装/更新时。运行时加载
不会运行包管理器、修复依赖树，也不会修改 OpenClaw
包目录。

## 职责划分

插件包拥有自己的依赖图：

- 运行时依赖位于插件包的 `dependencies` 或
  `optionalDependencies` 中
- SDK/核心导入是对等依赖，或使用由 OpenClaw 提供的导入
- 本地开发插件自带已安装的依赖
- npm 和 git 插件安装到 OpenClaw 拥有的包根目录中

OpenClaw 只负责插件生命周期：

- 发现插件来源
- 在明确请求时安装或更新包
- 记录安装元数据
- 加载插件入口点
- 当依赖缺失时，以可操作的错误失败

## 安装根目录

OpenClaw 为每种来源使用稳定的根目录：

- npm 包安装在 `~/.openclaw/npm` 下
- git 包克隆到 `~/.openclaw/git` 下
- 本地/路径/归档安装会被复制或引用，不进行依赖修复

npm 安装会在 npm 根目录中运行：

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm 可能会将传递依赖提升到插件包旁边的
`~/.openclaw/npm/node_modules`。OpenClaw 会在信任安装前扫描受管理的
npm 根目录，并在卸载期间使用 npm 删除由 npm 管理的包，因此提升后的
运行时依赖会留在受管理的清理边界内。

导入 `openclaw/plugin-sdk/*` 的插件会将 `openclaw` 声明为对等
依赖。OpenClaw 不允许 npm 将宿主包的单独注册表副本安装到受管理的
根目录中，因为过时的宿主包可能会影响后续插件安装期间的 npm
对等依赖解析。相反，在 npm 于安装、更新或卸载期间完成对共享根目录的
修改后，OpenClaw 会为声明了宿主对等依赖的已安装包重新建立插件本地
`node_modules/openclaw` 链接。

git 安装会克隆或刷新仓库，然后运行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

随后，已安装的插件会从该包目录加载，因此包本地和父级
`node_modules` 解析的工作方式与普通 Node 包相同。

## 本地插件

本地插件被视为由开发者控制的目录。OpenClaw 不会为它们运行
`npm install`、`pnpm install` 或依赖修复。如果本地
插件有依赖，请在加载前先在该插件中安装它们。

第三方 TypeScript 本地插件可以使用应急 Jiti 路径。打包的
JavaScript 插件和内置内部插件通过原生 import/require 加载，而不是
通过 Jiti 加载。

## 启动和重新加载

Gateway 网关启动和配置重新加载永远不会安装插件依赖。它们读取
插件安装记录，计算入口点，并加载它。

如果运行时缺少某个依赖，插件会加载失败，错误应将操作员指向明确的修复方式：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 可以清理旧版 OpenClaw 生成的依赖状态，并在配置引用
可下载插件但本地安装记录中缺失该插件时进行恢复。Doctor 不会为已经安装的
本地插件修复依赖。

## 内置插件

轻量级和核心关键的内置插件作为 OpenClaw 的一部分交付。
它们应当没有沉重的运行时依赖树，或者被移到 ClawHub/npm 上的
可下载包中。

如需查看当前随核心包交付、从外部安装或仅保留源码的插件生成列表，请参阅
[插件清单](/zh-CN/plugins/plugin-inventory)。

内置插件清单不得请求依赖暂存。大型或可选的插件功能应打包为普通插件，并通过与第三方插件相同的
npm/git/ClawHub 路径安装。

在源码检出中，OpenClaw 将仓库视为 pnpm monorepo。执行
`pnpm install` 后，内置插件会从 `extensions/<id>` 加载，因此包本地的
工作区依赖可用，编辑也会被直接拾取。源码检出开发仅支持 pnpm；在仓库根目录执行普通
`npm install` 不是准备内置插件依赖的受支持方式。

| 安装形态                         | 内置插件位置                          | 依赖所有者                                                           |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 包内的已构建运行时树                  | OpenClaw 包和显式插件安装/更新/Doctor 流程                          |
| Git 检出加 `pnpm install`       | `extensions/<id>` 工作区包            | pnpm 工作区，包括每个插件包自己的依赖                                |
| `openclaw plugins install ...`   | 受管理的 npm/git/ClawHub 插件根目录   | 插件安装/更新流程                                                    |

## 旧版清理

较旧的 OpenClaw 版本会在启动时或 Doctor 修复期间生成内置插件依赖根目录。
当前的 Doctor 清理会在使用 `--fix` 时删除这些过时目录和符号链接，包括旧的
`plugin-runtime-deps` 根目录、指向已裁剪 `plugin-runtime-deps` 目标的全局
Node 前缀包符号链接、`.openclaw-runtime-deps*` 清单、生成的插件
`node_modules`、安装暂存目录，以及包本地 pnpm 存储。打包后的 postinstall 也会
在裁剪旧版目标根目录前删除这些全局符号链接，因此升级不会留下悬空的 ESM 包导入。

这些路径只是旧版残留。新安装不应创建它们。
