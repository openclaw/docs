---
read_when:
    - 你正在调试插件包安装问题
    - 你正在更改插件启动、Doctor 或包管理器安装行为
    - 你正在维护打包的 OpenClaw 安装或内置插件清单
sidebarTitle: Dependencies
summary: OpenClaw 如何安装插件包并解析插件依赖关系
title: 插件依赖解析
x-i18n:
    generated_at: "2026-07-11T20:44:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw 仅在安装/更新时间处理插件依赖项。运行时加载绝不会运行包管理器、修复依赖树或修改 OpenClaw 包目录。

## 职责划分

插件包负责自己的依赖关系图：

- 运行时依赖项位于插件包的 `dependencies` 或 `optionalDependencies` 中。
- SDK/核心导入项属于对等依赖，或由 OpenClaw 提供。
- 本地开发插件自行提供已安装的依赖项。
- npm 和 git 插件安装到 OpenClaw 所有的包根目录中。

OpenClaw 仅负责插件生命周期：

- 发现插件源。
- 仅在明确请求时安装或更新软件包。
- 记录安装元数据。
- 加载插件入口点。
- 缺少依赖项时，给出可操作的错误并加载失败。

## 安装根目录

OpenClaw 为每个来源使用稳定的独立根目录：

- npm 软件包安装到 `~/.openclaw/npm/projects/<encoded-package>` 下各插件独立的项目中。
- git 软件包克隆到 `~/.openclaw/git` 下。
- 本地/路径/归档安装通过复制或引用完成，不修复依赖项。

npm 安装在对应插件的项目根目录中运行：

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` 对本地 npm-pack tarball 使用同一个插件独立 npm 项目根目录：OpenClaw 读取 tarball 的 npm 元数据，将其作为复制的 `file:` 依赖项添加到托管项目，执行上述常规 npm 安装，然后验证已安装的锁文件元数据，之后才信任该插件。此路径用于软件包验收和候选版本验证，其中本地打包产物应表现得像它所模拟的注册表产物。

在发布前测试官方或外部插件包时，请使用 `npm-pack:`。原始归档或路径安装适合本地调试，但无法验证与已安装的 npm 或 ClawHub 软件包相同的依赖路径。`npm-pack:` 验证托管软件包的安装形态；它本身不能证明插件是与目录关联的官方内容。

当行为取决于内置插件或受信任官方插件的状态时，应将本地软件包验证与由目录支持的官方安装，或记录官方信任状态的已发布软件包路径结合使用。特权辅助程序访问和受信任官方作用域处理应在该受信任安装路径上验证，而不能根据本地 tarball 安装推断。

如果插件在运行时因缺少导入项而失败，请修复软件包清单，而不是手动修复托管项目。运行时导入项应位于插件包的 `dependencies` 或 `optionalDependencies` 中；托管运行时项目不会安装 `devDependencies`。在 `~/.openclaw/npm/projects/<encoded-package>` 中执行本地 `npm install` 可以暂时解除诊断阻碍，但这不能作为软件包验收证明，因为下次安装或更新会根据软件包元数据重新创建项目。

npm 可能会将传递依赖项提升到插件包旁边、对应插件项目的 `node_modules` 中。OpenClaw 会先扫描托管项目根目录再信任安装，并在卸载时移除该项目，因此提升的运行时依赖项始终位于该插件的清理边界内。

已发布的 npm 插件包可以附带 `npm-shrinkwrap.json`；npm 会在安装期间使用这个可发布的锁文件，而 OpenClaw 的托管 npm 项目根目录通过常规安装路径支持它。OpenClaw 所有的可发布插件包必须包含根据该软件包已发布依赖关系图生成的包内 shrinkwrap：

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

生成器会移除插件的 `devDependencies`、应用工作区覆盖策略，并为每个设有 `openclaw.release.publishToNpm: true` 的插件写入 `extensions/<id>/npm-shrinkwrap.json`。第三方插件包也可以附带 shrinkwrap；OpenClaw 不要求社区软件包提供该文件，但如果存在，npm 会采用它。

在将本地软件包视为候选版本验证依据之前，请检查将要安装的 tarball：

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

对于依赖项变更，还要验证生产环境安装能够在没有开发依赖项的情况下解析运行时软件包：

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

OpenClaw 所有的 npm 插件包也可以使用显式的 `bundledDependencies` 发布。npm 发布路径会覆盖运行时依赖项名称列表，从已发布清单中移除仅用于开发的工作区元数据，为包内运行时依赖项执行禁用脚本的 npm 安装，然后打包或发布包含这些依赖项文件的插件 tarball。大量使用原生组件的软件包（Codex、ACPX、Copilot、llama.cpp、memory-lancedb、Tlon）通过 `openclaw.release.bundleRuntimeDependencies: false` 选择退出；它们仍会附带 shrinkwrap，但 npm 会在安装期间解析运行时依赖项，而不是将每个平台的二进制文件嵌入插件 tarball。根 `openclaw` 软件包不会捆绑其完整依赖树。

导入 `openclaw/plugin-sdk/*` 的插件将 `openclaw` 声明为对等依赖项。OpenClaw 不允许 npm 将宿主软件包在注册表中的独立副本安装到托管项目中，因为过时的宿主软件包可能会影响 npm 在该插件内解析对等依赖项。托管 npm 安装会跳过 npm 的对等依赖项解析/实体化，并在安装或更新后，为声明宿主对等依赖项的已安装软件包重新建立插件本地 `node_modules/openclaw` 链接。

git 安装会克隆或刷新仓库，然后运行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

随后，已安装的插件从该软件包目录加载，因此软件包本地和父级 `node_modules` 的解析方式与普通 Node 软件包相同。

## 本地插件

本地插件是由开发者控制的目录。OpenClaw 绝不会为它们运行 `npm install`、`pnpm install` 或依赖项修复；如果本地插件存在依赖项，请先在该插件中安装这些依赖项，再加载插件。

第三方 TypeScript 本地插件通过 Jiti 作为应急路径加载。已打包的 JavaScript 插件和内置内部插件则通过原生 import/require 加载。

## 启动和重新加载

Gateway 网关启动和配置重新加载绝不会安装插件依赖项。它们会读取插件安装记录、计算入口点并加载插件。

运行时缺少依赖项会导致插件加载失败，并给出错误，指引操作员执行明确的修复：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 会清理 OpenClaw 旧版本生成的依赖项状态；当配置仍引用可下载插件，但本地安装记录中缺少这些插件时，它还可以恢复这些插件。Doctor 不会修复已安装本地插件的依赖项。

## 内置插件

轻量级和核心关键型内置插件作为 OpenClaw 的一部分发布。它们要么不应包含庞大的运行时依赖树，要么应迁移为 ClawHub/npm 上的可下载软件包。

有关随核心软件包发布、从外部安装或仅保留源代码的插件的当前生成列表，请参阅[插件清单](/zh-CN/plugins/plugin-inventory)。

内置插件清单不得请求依赖项暂存。大型或可选插件功能应打包为普通插件，并通过与第三方插件相同的 npm/git/ClawHub 路径安装。

在源代码检出中，OpenClaw 将仓库视为 pnpm 单体仓库。执行 `pnpm install` 后，内置插件从 `extensions/<id>` 加载，因此包内工作区依赖项可用，并且编辑会直接生效。源代码检出开发仅支持 pnpm；在仓库根目录执行普通 `npm install` 不会准备内置插件依赖项。

| 安装形态                         | 内置插件位置                     | 依赖项所有者                                                       |
| -------------------------------- | -------------------------------- | ------------------------------------------------------------------ |
| `npm install -g openclaw`        | 软件包内构建后的运行时树         | OpenClaw 软件包及显式插件安装/更新/Doctor 流程                     |
| Git 检出加 `pnpm install`        | `extensions/<id>` 工作区软件包   | pnpm 工作区，包括各插件包自身的依赖项                              |
| `openclaw plugins install ...`   | 托管 npm 项目/git/ClawHub 根目录 | 插件安装/更新流程                                                   |

## 旧版清理

较旧的 OpenClaw 版本会在启动时或 Doctor 修复期间生成内置插件依赖项根目录。当前 Doctor 清理会通过 `--fix` 移除这些过时的目录和符号链接，包括旧 `plugin-runtime-deps` 根目录、指向已清理 `plugin-runtime-deps` 目标的全局 Node 前缀软件包符号链接、`.openclaw-runtime-deps*` 清单、生成的插件 `node_modules`、安装暂存目录和包内 pnpm 存储。软件包安装后脚本也会在清理旧版目标根目录之前移除这些全局符号链接，因此升级不会留下失效的 ESM 软件包导入项。

较旧的 npm 安装还使用共享的 `~/.openclaw/npm/node_modules` 根目录。当前安装、更新、卸载和 Doctor 流程仍会识别此旧版扁平根目录，但仅用于恢复和清理。新的 npm 安装会改为创建各插件独立的项目根目录。
