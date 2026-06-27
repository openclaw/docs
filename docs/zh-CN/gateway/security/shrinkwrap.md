---
read_when:
    - 你想了解 npm shrinkwrap 在 OpenClaw 发布中的含义
    - 你正在审查包锁文件、依赖项变更或供应链风险
    - 你正在发布前验证根 npm 包或插件 npm 包
summary: OpenClaw 发布中 npm shrinkwrap 的通俗易懂说明和技术说明
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-06-27T02:09:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b71f25f5cecde3c954f71534adc011cd163f2e6344ec2f031ebbc858b55a9cd9
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw 源码检出使用 `pnpm-lock.yaml`。已发布的 OpenClaw npm
包使用 `npm-shrinkwrap.json`，也就是 npm 可发布的依赖锁文件，因此
包安装会使用发布期间已审核的依赖图。

## 简单版本

Shrinkwrap 是随 npm 包发布的依赖树收据。
它告诉 npm 要安装哪些确切的传递依赖包版本。

对于 OpenClaw 发布版，这意味着：

- 已发布的包不会要求 npm 在
  安装时即时生成新的依赖图；
- 依赖变更更容易审核，因为它们会出现在锁文件中；
- 发布验证可以测试用户将要安装的同一张依赖图；
- 在发布前更容易发现包大小或原生依赖方面的意外情况。

Shrinkwrap 不是沙箱。它本身不会让依赖变得安全，也
不能替代主机隔离、`openclaw security audit`、包
来源证明或安装冒烟测试。

简短的理解模型：

| 文件                  | 影响位置                 | 含义                              |
| --------------------- | ------------------------ | --------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw 源码检出        | 维护者依赖图                      |
| `npm-shrinkwrap.json` | 已发布的 npm 包          | 用户的 npm 安装图                 |
| `package-lock.json`   | 本地 npm 应用            | 不是 OpenClaw 发布契约            |

## OpenClaw 使用它的原因

OpenClaw 是 Gateway 网关、插件宿主、模型路由器和智能体运行时。默认
安装可能影响启动时间、磁盘使用、原生包下载和
供应链暴露面。

Shrinkwrap 为发布审核提供了稳定边界：

- 审核者可以看到传递依赖的变动；
- 包验证器可以拒绝意外的锁文件漂移；
- 包验收可以用即将发布的依赖图测试安装；
- 插件包可以携带自己的锁定依赖图，而不是
  依赖根包来拥有仅插件使用的依赖。

目标不是“更多锁文件”。目标是实现可复现的发布安装，
并明确所有权。

## 技术细节

根 `openclaw` npm 包和 OpenClaw 拥有的 npm 插件包在发布时包含
`npm-shrinkwrap.json`。合适的 OpenClaw 拥有的插件
包也可以带显式 `bundledDependencies` 发布，这样其运行时
依赖文件会随插件 tarball 携带，而不是只依赖
安装时解析。

按如下方式维护该边界：

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

生成器会解析 npm 的可发布锁格式，但会拒绝生成
不已存在于 `pnpm-lock.yaml` 中的包版本。这会保持
pnpm 依赖年龄、覆盖项和补丁审核边界不变。

只有在有意刷新根包且不触及插件包时，才使用仅根目录命令：

```bash
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check
```

将这些文件作为安全敏感内容审核：

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- 内置插件依赖载荷
- 任何 `package-lock.json` diff

OpenClaw 包验证器要求新的根包 tarball 中包含 shrinkwrap。
插件 npm 发布路径会检查插件本地 shrinkwrap、安装
包本地的内置依赖，然后打包或发布。包
验证器会拒绝已发布 OpenClaw 包中的 `package-lock.json`。

检查已发布的根包：

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

检查 OpenClaw 拥有的插件包：

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

背景：[npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json)。
