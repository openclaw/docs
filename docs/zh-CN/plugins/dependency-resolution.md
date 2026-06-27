---
read_when:
    - 你正在调试插件包安装
    - 你正在更改插件启动、Doctor 或包管理器安装行为
    - 你正在维护打包版 OpenClaw 安装或内置插件清单
sidebarTitle: Dependencies
summary: OpenClaw 如何安装插件包并解析插件依赖
title: 插件依赖解析
x-i18n:
    generated_at: "2026-06-27T02:40:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5d2f3efe40c50433bd44961f6f5b8d03f3c69d3f5112163613b8efbd0f17c65
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw 将插件依赖工作保留在安装/更新时间。运行时加载
不会运行包管理器、修复依赖树，或变更 OpenClaw
包目录。

## 职责划分

插件包拥有自己的依赖图：

- 运行时依赖位于插件包的 `dependencies` 或
  `optionalDependencies`
- SDK/核心导入是 peer 依赖或由 OpenClaw 提供的导入
- 本地开发插件自带已安装的依赖
- npm 和 git 插件会安装到 OpenClaw 拥有的包根目录中

OpenClaw 只负责插件生命周期：

- 发现插件来源
- 在明确请求时安装或更新包
- 记录安装元数据
- 加载插件入口点
- 依赖缺失时，以可操作的错误失败

## 安装根目录

OpenClaw 使用稳定的按来源划分的根目录：

- npm 包安装到
  `~/.openclaw/npm/projects/<encoded-package>` 下的按插件划分项目中
- git 包克隆到 `~/.openclaw/git` 下
- local/path/archive 安装会被复制或引用，不进行依赖修复

npm 安装会在该按插件划分的项目根目录中运行：

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` 对本地 npm-pack tarball 使用同一个按插件划分的 npm
项目根目录。OpenClaw 会读取 tarball 的 npm
元数据，将其作为复制的 `file:` 依赖添加到托管项目中，运行
普通的 npm install，然后在信任该插件之前验证已安装 lockfile 的元数据。
这用于 package-acceptance 和 release-candidate 证明，在这些场景中，
本地 pack 构件应当像其模拟的 registry 构件一样工作。

npm 可能会将传递依赖提升到按插件划分项目的
`node_modules` 中，与插件包并列。OpenClaw 会在信任安装之前扫描托管项目
根目录，并在卸载期间移除该项目，因此提升的运行时依赖会留在该插件的清理边界内。

已发布的 npm 插件包可以随附 `npm-shrinkwrap.json`。npm 会在安装期间使用该
可发布的 lockfile，而 OpenClaw 的托管 npm 项目根目录
会通过普通 npm install 路径支持它。OpenClaw 拥有的可发布
插件包必须包含一个包本地 shrinkwrap，该文件从该
插件包的已发布依赖图生成：

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

生成器会剥离插件 `devDependencies`，应用 workspace override
策略，并为每个 `publishToNpm` 插件写入 `extensions/<id>/npm-shrinkwrap.json`。
第三方插件包也可以随附 shrinkwrap；OpenClaw 不要求
社区包提供它，但存在时 npm 会尊重它。

OpenClaw 拥有的 npm 插件包也可以使用显式
`bundledDependencies` 发布。npm 发布路径会叠加运行时依赖
名称列表，从已发布包 manifest 中移除仅开发用的 workspace 元数据，
为包本地运行时依赖运行无脚本 npm install，
然后打包或发布包含这些依赖文件的插件 tarball。包含 Codex 和 ACP 运行时在内的
原生依赖较重的包，会使用 `openclaw.release.bundleRuntimeDependencies: false` 选择退出；
这些包仍会随附 shrinkwrap，但 npm 会在安装期间解析运行时依赖，
而不是把每个平台二进制都嵌入插件 tarball。根
`openclaw` 包不会打包其完整依赖树。

导入 `openclaw/plugin-sdk/*` 的插件会将 `openclaw` 声明为 peer
依赖。OpenClaw 不允许 npm 将宿主包的单独 registry 副本
安装到托管项目中，因为过期的宿主包可能影响该插件内的 npm
peer 解析。托管 npm 安装会跳过 npm peer
解析/物化，并且 OpenClaw 会在安装或更新之后，为声明宿主 peer 的已安装包重新确保插件本地
`node_modules/openclaw` 链接。

git 安装会克隆或刷新仓库，然后运行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

随后，已安装插件会从该包目录加载，因此包本地和父级
`node_modules` 解析的工作方式与普通 Node 包相同。

## 本地插件

本地插件会被视为开发者控制的目录。OpenClaw 不会为它们运行
`npm install`、`pnpm install` 或依赖修复。如果本地
插件有依赖，请在加载它之前在该插件中安装这些依赖。

第三方 TypeScript 本地插件可以使用紧急 Jiti 路径。打包的
JavaScript 插件和内置的内部插件会通过原生
import/require 加载，而不是通过 Jiti。

## 启动和重新加载

Gateway 网关启动和配置重新加载永远不会安装插件依赖。它们会读取
插件安装记录，计算入口点，并加载它。

如果运行时缺少依赖，插件会加载失败，并且错误
应当指引操作员执行明确的修复：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 可以清理旧版 OpenClaw 生成的依赖状态，并在配置
引用可下载插件但本地安装记录中缺失这些插件时恢复它们。Doctor 不会
修复已经安装的本地插件的依赖。

## 内置插件

轻量级且对核心关键的内置插件会作为 OpenClaw 的一部分交付。
它们要么不应拥有较重的运行时依赖树，要么应迁移到
ClawHub/npm 上的可下载包。

如需查看当前随核心包交付、外部安装或仅保留源码的插件生成列表，
请参阅 [插件清单](/zh-CN/plugins/plugin-inventory)。

内置插件 manifest 不得请求依赖暂存。大型或可选的
插件功能应当打包为普通插件，并通过与第三方插件相同的
npm/git/ClawHub 路径安装。

在源码 checkout 中，OpenClaw 将仓库视为 pnpm monorepo。在
`pnpm install` 之后，内置插件会从 `extensions/<id>` 加载，因此包本地
workspace 依赖可用，并且编辑会被直接拾取。源码
checkout 开发仅支持 pnpm；在仓库根目录运行普通 `npm install`
不是准备内置插件依赖的受支持方式。

| 安装形态                         | 内置插件位置                          | 依赖所有者                                                           |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 包内构建后的运行时树                  | OpenClaw 包以及显式插件安装/更新/Doctor 流程                        |
| Git checkout 加 `pnpm install`   | `extensions/<id>` workspace 包        | pnpm workspace，包括每个插件包自己的依赖                             |
| `openclaw plugins install ...`   | 托管 npm 项目/git/ClawHub 根目录      | 插件安装/更新流程                                                    |

## 旧版清理

较旧的 OpenClaw 版本会在启动时或 Doctor 修复期间生成内置插件依赖根目录。
当前 Doctor 清理会在使用 `--fix` 时移除这些陈旧目录和
符号链接，包括旧的 `plugin-runtime-deps` 根目录、指向已修剪
`plugin-runtime-deps` 目标的全局 Node-prefix 包符号链接、
`.openclaw-runtime-deps*` manifest、生成的插件 `node_modules`、安装
暂存目录，以及包本地 pnpm store。打包的 postinstall 也会
在修剪旧版目标根目录之前移除这些全局符号链接，因此升级
不会留下悬空的 ESM 包导入。

较旧的 npm 安装也使用共享的 `~/.openclaw/npm/node_modules` 根目录。
当前安装、更新、卸载和 Doctor 流程仍会识别该旧版
扁平根目录，但仅用于恢复和清理。新的 npm 安装应当改为创建
按插件划分的项目根目录。
