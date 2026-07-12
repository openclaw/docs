---
read_when:
    - 你想了解 npm shrinkwrap 在 OpenClaw 发布中的含义
    - 你正在审查软件包锁定文件、依赖项变更或供应链风险
    - 你正在发布前验证根 npm 包或插件 npm 包
summary: OpenClaw 发布中 npm shrinkwrap 的通俗与技术说明
title: npm 收缩包装
x-i18n:
    generated_at: "2026-07-11T20:36:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw 源代码检出使用 `pnpm-lock.yaml`。已发布的 OpenClaw npm 软件包使用 `npm-shrinkwrap.json`，即 npm 可发布的依赖锁文件，因此安装软件包时会使用发布期间已审核的依赖图。

## 为什么这很重要

Shrinkwrap 是随 npm 软件包一同发布的依赖树清单：它会告知 npm 要安装哪些确切的传递依赖版本。

| 文件                  | 适用场景                 | 含义                              |
| --------------------- | ------------------------ | --------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw 源代码检出      | 维护者依赖图                      |
| `npm-shrinkwrap.json` | 已发布的 npm 软件包      | 面向用户的 npm 安装依赖图         |
| `package-lock.json`   | 本地 npm 应用            | 不属于 OpenClaw 发布约定          |

对于 OpenClaw 发布版本，这意味着：

- 已发布的软件包不会要求 npm 在安装时生成全新的依赖图；
- 依赖变更会体现在锁文件差异中，因此可以接受审核；
- 发布验证所测试的依赖图与用户将安装的依赖图相同；
- 软件包大小或原生依赖方面的意外会在发布前暴露。

Shrinkwrap 不是沙箱。它本身不能保证依赖安全，也不能取代主机隔离、`openclaw security audit`、软件包来源验证或安装冒烟测试。

OpenClaw 是 Gateway 网关、插件宿主、模型路由器和智能体运行时，因此默认安装会影响启动时间、磁盘占用、原生软件包下载和供应链风险暴露。Shrinkwrap 为发布审核提供了稳定的边界：审核者可以看到传递依赖的变动，验证器会拒绝意外的锁文件漂移，而插件软件包会携带自身锁定的依赖图，不依赖根软件包的依赖图。

## 生成和检查

根 `openclaw` npm 软件包、OpenClaw 自有的 npm 插件软件包（例如 `@openclaw/discord`），以及 [`@openclaw/ai`](/zh-CN/reference/openclaw-ai) 等可发布的工作区软件包，都会在发布时包含 `npm-shrinkwrap.json`。工作区依赖不会包含在根 shrinkwrap 中，因为它们会与根软件包一同发布；每个可发布的工作区软件包会分别锁定自身的传递依赖树。合适的插件软件包还可以使用显式的 `bundledDependencies` 进行发布，将其运行时依赖文件包含在插件 tarball 中，而不是仅依赖安装时解析。

```bash
# 所有由 shrinkwrap 管理的软件包（根软件包 + 可发布插件）
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# 仅根软件包
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# 仅受当前变更集影响的软件包
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

生成器会解析 npm 的可发布锁文件格式，但会拒绝生成 `pnpm-lock.yaml` 中尚不存在的软件包版本。这可确保 pnpm 依赖版本新旧程度、覆盖配置和补丁审核边界保持不变。

请将以下内容视为安全敏感项进行审核：

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- 内置插件依赖载荷
- 任何 `package-lock.json` 差异

OpenClaw 软件包验证器要求新的根软件包 tarball 包含 shrinkwrap，并拒绝已发布软件包中的 `package-lock.json`。插件 npm 发布路径会检查插件本地的 shrinkwrap、安装软件包本地的内置依赖，然后打包或发布。

## 检查已发布的软件包

根软件包：

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

插件软件包：

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

背景资料：[npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json)。
