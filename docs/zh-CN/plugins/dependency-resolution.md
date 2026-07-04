---
read_when:
    - 你正在调试插件包安装
    - 你正在更改插件启动、Doctor 或包管理器安装行为
    - 你正在维护打包的 OpenClaw 安装或内置插件清单
sidebarTitle: Dependencies
summary: OpenClaw 如何安装插件包并解析插件依赖
title: 插件依赖解析
x-i18n:
    generated_at: "2026-07-04T15:08:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw 将插件依赖相关工作保留在安装/更新时间。运行时加载
不会运行包管理器、修复依赖树，或变更 OpenClaw
包目录。

## 职责划分

插件包拥有自己的依赖图：

- 运行时依赖位于插件包的 `dependencies` 或
  `optionalDependencies`
- SDK/核心导入是对等依赖，或由 OpenClaw 提供的导入
- 本地开发插件自带已经安装好的依赖
- npm 和 git 插件会安装到 OpenClaw 拥有的包根目录中

OpenClaw 只拥有插件生命周期：

- 发现插件来源
- 在明确请求时安装或更新包
- 记录安装元数据
- 加载插件入口点
- 依赖缺失时，以可操作的错误失败

## 安装根目录

OpenClaw 使用稳定的按来源划分的根目录：

- npm 包安装到
  `~/.openclaw/npm/projects/<encoded-package>` 下的按插件划分的项目中
- git 包克隆到 `~/.openclaw/git` 下
- 本地/路径/归档安装会被复制或引用，不进行依赖修复

npm 安装在该按插件划分的项目根目录中运行：

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` 会为本地 npm-pack tarball
使用同一个按插件划分的 npm 项目根目录。OpenClaw 读取 tarball 的 npm
元数据，将其作为复制的 `file:` 依赖添加到托管项目中，运行
正常的 npm install，然后在信任插件之前验证已安装的 lockfile 元数据。
这用于包验收和候选发布证明，其中本地打包制品应当像它模拟的
注册表制品一样工作。

在发布前测试官方或外部插件包时，请使用 `npm-pack:`。原始归档或路径安装
适合本地调试，但它不能证明与已安装的 npm 或 ClawHub 包相同的依赖路径。
`npm-pack:` 证明的是托管包安装形态；它本身并不能证明该插件是目录关联的官方内容。

当行为依赖内置插件或受信任的官方插件状态时，请将本地包证明与基于目录的官方安装
或记录官方信任状态的已发布包路径配对。特权辅助工具访问和
受信任官方作用域处理应在该受信任安装路径上验证，
而不是从本地 tarball 安装中推断。

如果插件在运行时因为缺失导入而失败，请修复包清单，
而不是手动修复托管项目。运行时导入属于插件包的
`dependencies` 或 `optionalDependencies`；`devDependencies`
不会为托管运行时项目安装。在
`~/.openclaw/npm/projects/<encoded-package>` 中执行本地 `npm install`
可以解除临时诊断阻塞，但它不是包验收证明，因为下一次安装或更新会
根据包元数据重新创建项目。

npm 可能会把传递依赖提升到插件包旁边、按插件划分的项目的
`node_modules` 中。OpenClaw 会在信任安装前扫描托管项目根目录，
并在卸载期间移除该项目，因此被提升的运行时依赖会留在该插件的清理边界内。

已发布的 npm 插件包可以附带 `npm-shrinkwrap.json`。npm 会在安装期间使用
该可发布 lockfile，而 OpenClaw 的托管 npm 项目根目录会通过正常的
npm install 路径支持它。OpenClaw 拥有的可发布插件包必须包含一个
包本地 shrinkwrap，它从该插件包的已发布依赖图生成：

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

生成器会移除插件 `devDependencies`，应用工作区 override 策略，
并为每个 `publishToNpm` 插件写入
`extensions/<id>/npm-shrinkwrap.json`。第三方插件包也可以附带 shrinkwrap；
OpenClaw 不要求社区包这样做，但当它存在时 npm 会遵循它。

在将本地包视为候选发布证明之前，请检查将要安装的 tarball：

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

对于依赖变更，还要验证生产安装可以在没有开发依赖的情况下解析
运行时包：

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

OpenClaw 拥有的 npm 插件包也可以使用显式
`bundledDependencies` 发布。npm 发布路径会叠加运行时依赖
名称列表，从已发布包清单中移除仅开发用的工作区元数据，
为包本地运行时依赖运行无脚本的 npm install，
然后在包含这些依赖文件的情况下打包或发布插件 tarball。包含
Codex 和 ACP 运行时在内的原生依赖较重的包，会通过
`openclaw.release.bundleRuntimeDependencies: false` 选择退出；这些包仍然
附带 shrinkwrap，但 npm 会在安装期间解析运行时依赖，
而不是把每个平台二进制文件都嵌入插件 tarball。根
`openclaw` 包不会捆绑它的完整依赖树。

导入 `openclaw/plugin-sdk/*` 的插件会将 `openclaw` 声明为对等依赖。
OpenClaw 不允许 npm 将主机包的单独注册表副本安装到
托管项目中，因为过时的主机包可能会影响该插件内部的 npm
对等依赖解析。托管 npm 安装会跳过 npm 对等依赖
解析/实体化，并且 OpenClaw 会在安装或更新后，为声明主机对等依赖的已安装包
重新确立插件本地的 `node_modules/openclaw` 链接。

git 安装会克隆或刷新仓库，然后运行：

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

已安装插件随后会从该包目录加载，因此包本地和父级
`node_modules` 解析会像普通 Node 包一样工作。

## 本地插件

本地插件被视为由开发者控制的目录。OpenClaw 不会为它们运行
`npm install`、`pnpm install` 或依赖修复。如果本地
插件有依赖，请先在该插件中安装依赖，再加载它。

第三方 TypeScript 本地插件可以使用紧急 Jiti 路径。打包的
JavaScript 插件和内置内部插件会通过原生
import/require 加载，而不是通过 Jiti。

## 启动和重载

Gateway 网关启动和配置重载绝不会安装插件依赖。它们会读取
插件安装记录，计算入口点，并加载它。

如果运行时缺少依赖，插件加载会失败，错误应当将操作员指向明确的修复方式：

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` 可以清理旧版 OpenClaw 生成的依赖状态，并在配置引用
可下载插件、但本地安装记录缺失时恢复这些插件。Doctor 不会为已经安装的
本地插件修复依赖。

## 内置插件

轻量级和核心关键的内置插件会作为 OpenClaw 的一部分交付。
它们应当没有较重的运行时依赖树，或者被移出为 ClawHub/npm
上的可下载包。

如需查看当前生成的插件列表，包括哪些插件随核心包交付、外部安装或仅保留源码，
请参阅 [插件清单](/zh-CN/plugins/plugin-inventory)。

内置插件清单不得请求依赖暂存。大型或可选的
插件功能应当打包为普通插件，并通过与第三方插件相同的
npm/git/ClawHub 路径安装。

在源码检出中，OpenClaw 会将仓库视为 pnpm monorepo。在
`pnpm install` 之后，内置插件会从 `extensions/<id>` 加载，
因此包本地工作区依赖可用，并且编辑会被直接拾取。源码检出开发
仅支持 pnpm；在仓库根目录执行普通 `npm install` 不是
准备内置插件依赖的受支持方式。

| 安装形态                         | 内置插件位置                          | 依赖所有者                                                           |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 包内的已构建运行时树                  | OpenClaw 包和显式插件安装/更新/Doctor 流程                          |
| Git 检出加 `pnpm install`        | `extensions/<id>` 工作区包            | pnpm 工作区，包括每个插件包自己的依赖                                |
| `openclaw plugins install ...`   | 托管 npm 项目/git/ClawHub 根目录      | 插件安装/更新流程                                                    |

## 旧版清理

较旧的 OpenClaw 版本会在启动时或 Doctor 修复期间生成内置插件依赖根目录。
当前 Doctor 清理会在使用 `--fix` 时移除这些过时目录和符号链接，
包括旧的 `plugin-runtime-deps` 根目录、指向已裁剪
`plugin-runtime-deps` 目标的全局 Node-prefix 包符号链接、
`.openclaw-runtime-deps*` 清单、生成的插件 `node_modules`、安装
暂存目录和包本地 pnpm 存储。打包的 postinstall 也会在裁剪旧版目标根目录前
移除这些全局符号链接，因此升级不会留下悬空的 ESM 包导入。

较旧的 npm 安装还使用共享的 `~/.openclaw/npm/node_modules` 根目录。
当前安装、更新、卸载和 Doctor 流程仍然只为恢复和清理识别
该旧版扁平根目录。新的 npm 安装应当改为创建按插件划分的项目根目录。
