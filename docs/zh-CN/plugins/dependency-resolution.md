---
read_when:
    - 你正在调试插件包安装
    - 你正在更改插件启动、Doctor 或包管理器安装行为
    - 你正在维护打包的 OpenClaw 安装或内置插件清单
sidebarTitle: Dependencies
summary: OpenClaw 如何安装插件包并解析插件依赖
title: 插件依赖解析
x-i18n:
    generated_at: "2026-07-05T11:29:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw 只在安装/更新时处理插件依赖。运行时加载绝不会运行包管理器、修复依赖树，也不会改变 OpenClaw 包目录。

## 职责划分

插件包拥有自己的依赖图：

- 运行时依赖放在插件包的 `dependencies` 或 `optionalDependencies` 中。
- SDK/核心导入是 peer 依赖，或由 OpenClaw 提供的导入。
- 本地开发插件自带已经安装好的依赖。
- npm 和 git 插件会安装到 OpenClaw 拥有的包根目录中。

OpenClaw 只拥有插件生命周期：

- 发现插件来源。
- 在明确请求时安装或更新包。
- 记录安装元数据。
- 加载插件入口点。
- 依赖缺失时，以可操作的错误失败。

## 安装根目录

OpenClaw 使用稳定的按来源划分的根目录：

- npm 包安装到 `~/.openclaw/npm/projects/<encoded-package>` 下的按插件划分的项目中。
- git 包克隆到 `~/.openclaw/git` 下。
- 本地/路径/归档安装会被复制或引用，不进行依赖修复。

npm 安装会在该按插件划分的项目根目录中运行：

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` 对本地 npm-pack tarball 使用同一个按插件划分的 npm 项目根目录：OpenClaw 读取 tarball 的 npm 元数据，将它作为复制的 `file:` 依赖加入托管项目，运行上面的正常 npm install，然后在信任插件之前验证已安装 lockfile 的元数据。此路径用于包验收和候选发布证明，此时本地 pack 制品应表现得像它模拟的 registry 制品。

在发布前测试官方或外部插件包时，使用 `npm-pack:`。原始归档或路径安装适合本地调试，但它不能证明与已安装的 npm 或 ClawHub 包相同的依赖路径。`npm-pack:` 证明托管包安装形态；它本身并不能证明该插件是目录关联的官方内容。

当行为依赖于内置插件或受信任官方插件状态时，请将本地包证明与由目录支持的官方安装或记录官方信任状态的已发布包路径配对。特权辅助访问和受信任官方范围处理应在该受信任安装路径上验证，而不是从本地 tarball 安装推断。

如果插件在运行时因缺少导入而失败，请修复包清单，而不是手动修复托管项目。运行时导入属于插件包的 `dependencies` 或 `optionalDependencies`；托管运行时项目不会安装 `devDependencies`。在 `~/.openclaw/npm/projects/<encoded-package>` 内执行本地 `npm install` 可以临时解除诊断阻塞，但它不是包验收证明，因为下一次安装或更新会从包元数据重新创建项目。

npm 可能会将传递依赖提升到按插件划分的项目的 `node_modules` 中，位于插件包旁边。OpenClaw 会在信任安装之前扫描托管项目根目录，并在卸载时移除该项目，因此被提升的运行时依赖仍位于该插件的清理边界内。

已发布的 npm 插件包可以携带 `npm-shrinkwrap.json`；npm 会在安装期间使用该可发布 lockfile，OpenClaw 的托管 npm 项目根目录通过正常安装路径支持它。OpenClaw 拥有的可发布插件包必须包含一个从该包已发布依赖图生成的包本地 shrinkwrap：

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

生成器会剥离插件 `devDependencies`，应用工作区 override 策略，并为每个带有 `openclaw.release.publishToNpm: true` 的插件写入 `extensions/<id>/npm-shrinkwrap.json`。第三方插件包也可以携带 shrinkwrap；OpenClaw 不要求社区包必须提供，但存在时 npm 会遵循它。

在将本地包视为候选发布证明之前，请检查将要安装的 tarball：

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

对于依赖变更，还要验证生产安装可以在没有 dev 依赖的情况下解析运行时包：

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

OpenClaw 拥有的 npm 插件包也可以使用显式 `bundledDependencies` 发布。npm 发布路径会叠加运行时依赖名称列表，从已发布清单中剥离仅用于 dev 的工作区元数据，为包本地运行时依赖运行无脚本的 npm install，然后在包含这些依赖文件的情况下打包或发布插件 tarball。原生依赖较重的包（Codex、ACPX、Copilot、llama.cpp、memory-lancedb、Tlon）通过 `openclaw.release.bundleRuntimeDependencies: false` 选择退出；它们仍会携带 shrinkwrap，但 npm 会在安装期间解析运行时依赖，而不是将每个平台二进制文件都嵌入插件 tarball。根 `openclaw` 包不会打包其完整依赖树。

导入 `openclaw/plugin-sdk/*` 的插件会将 `openclaw` 声明为 peer 依赖。OpenClaw 不允许 npm 将宿主包的单独 registry 副本安装到托管项目中，因为陈旧的宿主包可能影响该插件内部的 npm peer 解析。托管 npm 安装会跳过 npm peer 解析/物化，并且 OpenClaw 会在安装或更新后，为声明宿主 peer 的已安装包重新断言插件本地的 `node_modules/openclaw` 链接。

git 安装会克隆或刷新仓库，然后运行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

随后已安装插件会从该包目录加载，因此包本地和父级 `node_modules` 解析与普通 Node 包的工作方式相同。

## 本地插件

本地插件是由开发者控制的目录。OpenClaw 绝不会为它们运行 `npm install`、`pnpm install` 或依赖修复；如果本地插件有依赖，请先在该插件中安装依赖再加载。

第三方 TypeScript 本地插件会通过 Jiti 作为应急路径加载。打包的 JavaScript 插件和内置内部插件则通过原生 import/require 加载。

## 启动和重新加载

Gateway 网关启动和配置重新加载绝不会安装插件依赖。它们会读取插件安装记录，计算入口点，并加载它。

运行时缺少依赖会导致插件加载失败，并给出指向显式修复的错误：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 会清理旧版 OpenClaw 生成的依赖状态，并且在配置仍引用可下载插件但本地安装记录中缺失它们时恢复这些插件。Doctor 不会为已经安装的本地插件修复依赖。

## 内置插件

轻量级和核心关键的内置插件作为 OpenClaw 的一部分发布。它们要么不应携带沉重的运行时依赖树，要么应迁移到 ClawHub/npm 上的可下载包。

有关随核心包发布、外部安装或仅保留为源代码的当前生成插件列表，请参见 [插件清单](/zh-CN/plugins/plugin-inventory)。

内置插件清单不得请求依赖暂存。大型或可选插件功能应作为普通插件打包，并通过与第三方插件相同的 npm/git/ClawHub 路径安装。

在源代码 checkout 中，OpenClaw 将仓库视为 pnpm monorepo。执行 `pnpm install` 后，内置插件会从 `extensions/<id>` 加载，因此包本地工作区依赖可用，并且编辑会被直接拾取。源代码 checkout 开发仅支持 pnpm；在仓库根目录执行普通 `npm install` 不会准备内置插件依赖。

| 安装形态                         | 内置插件位置                          | 依赖所有者                                                           |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 包内构建好的运行时树                  | OpenClaw 包和显式插件安装/更新/Doctor 流程                           |
| Git checkout plus `pnpm install` | `extensions/<id>` 工作区包            | pnpm 工作区，包括每个插件包自己的依赖                                |
| `openclaw plugins install ...`   | 托管 npm 项目/git/ClawHub 根目录      | 插件安装/更新流程                                                    |

## 旧版清理

较旧的 OpenClaw 版本会在启动时或 Doctor 修复期间生成内置插件依赖根目录。当前 Doctor 清理会使用 `--fix` 移除这些陈旧目录和 symlink，包括旧的 `plugin-runtime-deps` 根目录、指向已裁剪 `plugin-runtime-deps` 目标的全局 Node-prefix 包 symlink、`.openclaw-runtime-deps*` 清单、生成的插件 `node_modules`、安装阶段目录，以及包本地 pnpm store。打包的 postinstall 也会在裁剪旧版目标根目录之前移除这些全局 symlink，因此升级不会留下悬空的 ESM 包导入。

较旧的 npm 安装还使用共享的 `~/.openclaw/npm/node_modules` 根目录。当前的安装、更新、卸载和 Doctor 流程仍会识别该旧版扁平根目录，但仅用于恢复和清理。新的 npm 安装会改为创建按插件划分的项目根目录。
