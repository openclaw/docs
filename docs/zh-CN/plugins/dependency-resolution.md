---
read_when:
    - 你正在调试插件包的安装
    - 你正在更改插件启动、Doctor 或包管理器安装行为
    - 你正在维护打包版 OpenClaw 安装或内置插件清单
sidebarTitle: Dependencies
summary: OpenClaw 如何安装插件包并解析插件依赖项
title: 插件依赖解析
x-i18n:
    generated_at: "2026-05-06T19:22:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: d51785b67d491d09e3a7a3ffcd6c991f7415c46b207596151dbc29b0c43e9341
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw 将插件依赖工作保留在安装/更新时间。运行时加载不会运行包管理器、修复依赖树，也不会修改 OpenClaw 包目录。

## 责任划分

插件包拥有自己的依赖关系图：

- 运行时依赖位于插件包的 `dependencies` 或 `optionalDependencies`
- SDK/核心导入是 peer 依赖或由 OpenClaw 提供的导入
- 本地开发插件携带自己已安装好的依赖
- npm 和 git 插件会安装到 OpenClaw 拥有的包根目录中

OpenClaw 只拥有插件生命周期：

- 发现插件来源
- 在明确请求时安装或更新包
- 记录安装元数据
- 加载插件入口点
- 依赖缺失时给出可操作的错误并失败

## 安装根目录

OpenClaw 使用稳定的按来源划分的根目录：

- npm 包安装在 `~/.openclaw/npm` 下
- git 包克隆在 `~/.openclaw/git` 下
- 本地/路径/归档安装会被复制或引用，不做依赖修复

npm 安装会在 npm 根目录中运行：

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` 会为本地 npm-pack tarball 使用同一个托管的 npm 根目录。OpenClaw 读取 tarball 的 npm 元数据，将它作为复制的 `file:` 依赖添加到托管根目录，运行普通的 npm install，然后在信任该插件之前验证已安装的 lockfile 元数据。这用于 package-acceptance 和候选发布证明，在这些场景中，本地 pack 制品应当表现得像它模拟的 registry 制品。

npm 可能会将传递依赖提升到插件包旁边的 `~/.openclaw/npm/node_modules`。OpenClaw 会在信任安装之前扫描托管的 npm 根目录，并在卸载期间使用 npm 移除 npm 托管的包，因此被提升的运行时依赖会留在托管清理边界内。

导入 `openclaw/plugin-sdk/*` 的插件会将 `openclaw` 声明为 peer 依赖。OpenClaw 不允许 npm 将宿主包的单独 registry 副本安装到托管根目录中，因为过期的宿主包可能会在后续插件安装期间影响 npm peer 解析。托管的 npm 安装会为共享根目录跳过 npm peer 解析/物化，并且 OpenClaw 会在安装、更新或卸载之后，为声明宿主 peer 的已安装包重新断言插件本地的 `node_modules/openclaw` 链接。

git 安装会克隆或刷新仓库，然后运行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

安装后的插件随后会从该包目录加载，因此包本地和父级 `node_modules` 解析的工作方式与普通 Node 包相同。

## 本地插件

本地插件会被视为由开发者控制的目录。OpenClaw 不会为它们运行 `npm install`、`pnpm install` 或依赖修复。如果本地插件有依赖，请在加载它之前在该插件中安装这些依赖。

第三方 TypeScript 本地插件可以使用应急 Jiti 路径。打包的 JavaScript 插件和内置内部插件会通过原生 import/require 加载，而不是通过 Jiti。

## 启动和重新加载

Gateway 网关启动和配置重新加载绝不会安装插件依赖。它们会读取插件安装记录、计算入口点并加载它。

如果运行时缺少依赖，插件会加载失败，并且错误应指向操作员可明确执行的修复方式：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 可以清理旧版 OpenClaw 生成的依赖状态，并恢复配置引用但本地安装记录中缺失的可下载插件。Doctor 不会为已经安装的本地插件修复依赖。

## 内置插件

轻量级和核心关键的内置插件会作为 OpenClaw 的一部分发布。它们应当没有繁重的运行时依赖树，或者被移出为 ClawHub/npm 上的可下载包。

有关当前随核心包发布、外部安装或仅保留源码的插件生成列表，请参阅[插件清单](/zh-CN/plugins/plugin-inventory)。

内置插件清单不得请求依赖预备。大型或可选的插件功能应打包为普通插件，并通过与第三方插件相同的 npm/git/ClawHub 路径安装。

在源码 checkout 中，OpenClaw 会将仓库视为 pnpm monorepo。执行 `pnpm install` 后，内置插件会从 `extensions/<id>` 加载，因此包本地的 workspace 依赖可用，并且编辑会被直接拾取。源码 checkout 开发仅支持 pnpm；在仓库根目录运行普通的 `npm install` 不是准备内置插件依赖的受支持方式。

| 安装形态                         | 内置插件位置                          | 依赖所有者                                                           |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 包内构建好的运行时树                  | OpenClaw 包以及明确的插件安装/更新/Doctor 流程                      |
| Git checkout plus `pnpm install` | `extensions/<id>` workspace 包        | pnpm workspace，包括每个插件包自己的依赖                             |
| `openclaw plugins install ...`   | 托管的 npm/git/ClawHub 插件根目录     | 插件安装/更新流程                                                    |

## 旧版清理

较旧的 OpenClaw 版本会在启动时或 Doctor 修复期间生成内置插件依赖根目录。当前的 Doctor 清理会在使用 `--fix` 时移除这些过期目录和符号链接，包括旧的 `plugin-runtime-deps` 根目录、指向已修剪的 `plugin-runtime-deps` 目标的全局 Node-prefix 包符号链接、`.openclaw-runtime-deps*` 清单、生成的插件 `node_modules`、安装阶段目录，以及包本地 pnpm store。打包的 postinstall 也会在修剪旧版目标根目录之前移除这些全局符号链接，因此升级不会留下悬空的 ESM 包导入。

这些路径只是旧版残留。新安装不应创建它们。
