---
read_when:
    - 你想了解 npm shrinkwrap 在 OpenClaw 发布中意味着什么
    - 你正在审查包锁文件、依赖变更或供应链风险
    - 你正在发布前验证根 npm 包或插件 npm 包
summary: OpenClaw 发布中 npm shrinkwrap 的通俗说明和技术说明
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-07-05T11:22:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw 源码检出使用 `pnpm-lock.yaml`。已发布的 OpenClaw npm 包使用 `npm-shrinkwrap.json`，也就是 npm 可发布的依赖锁文件，因此包安装会使用发布期间已审核的依赖图。

## 为什么重要

Shrinkwrap 是随 npm 包发布的依赖树凭据：它告诉 npm 要安装哪些精确的传递依赖版本。

| 文件                  | 适用位置                 | 含义                              |
| --------------------- | ------------------------ | --------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw 源码检出        | 维护者依赖图                      |
| `npm-shrinkwrap.json` | 已发布的 npm 包          | 用户的 npm 安装图                 |
| `package-lock.json`   | 本地 npm 应用            | 不是 OpenClaw 发布契约            |

对于 OpenClaw 发布，这意味着：

- 已发布的包不会要求 npm 在安装时生成新的依赖图；
- 依赖变更可审核，因为它们会落入锁文件差异；
- 发布验证会测试用户将要安装的同一依赖图；
- 包大小或原生依赖意外会在发布前暴露。

Shrinkwrap 不是沙箱。它本身不会让依赖变安全，也不能替代主机隔离、`openclaw security audit`、包来源证明或安装冒烟测试。

OpenClaw 是网关、插件宿主、模型路由器和 Agent runtime，因此默认安装会影响启动时间、磁盘使用、原生包下载和供应链暴露面。Shrinkwrap 为发布审核提供了稳定边界：审核者可以看到传递依赖移动，验证器会拒绝意外的锁文件漂移，而插件包会携带自己的锁定依赖图，而不是依赖根包。

## 生成和检查

根 `openclaw` npm 包、OpenClaw 拥有的 npm 插件包（例如 `@openclaw/discord`），以及类似 [`@openclaw/ai`](/reference/openclaw-ai) 的可发布工作区包，在发布时会包含 `npm-shrinkwrap.json`。工作区依赖会从根 shrinkwrap 中省略，因为它们会随根包一起发布；每个可发布工作区包会改为固定自己的传递依赖树。合适的插件包也可以使用显式 `bundledDependencies` 发布，将其运行时依赖文件携带在插件 tarball 中，而不是只依赖安装时解析。

```bash
# All shrinkwrap-managed packages (root + publishable plugins)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# Root package only
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# Only packages affected by the current changeset
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

生成器会解析 npm 的可发布锁格式，但会拒绝生成 `pnpm-lock.yaml` 中尚不存在的包版本。这会保持 pnpm 依赖年龄、覆盖项和补丁审核边界完整。

请将这些视为安全敏感项来审核：

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- 内置插件依赖负载
- 任何 `package-lock.json` 差异

OpenClaw 包验证器要求新的根包 tarball 中包含 shrinkwrap，并拒绝已发布包中的 `package-lock.json`。插件 npm 发布路径会检查插件本地 shrinkwrap，安装包本地内置依赖，然后打包或发布。

## 检查已发布的包

根包：

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

插件包：

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

背景：[npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json)。
