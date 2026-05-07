---
read_when:
    - 你想在 stable/beta/dev 之间切换
    - 你想固定特定版本、标签或 SHA
    - 你正在标记或发布预发布版本
sidebarTitle: Release Channels
summary: 稳定版、beta 和 dev 渠道：语义、切换、固定和标记
title: 发布渠道
x-i18n:
    generated_at: "2026-05-07T01:52:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6579110cc5c0e62ef238d7e4200db5fea188f35dc9366a17b3cf92a58c8935cc
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw 提供三个更新渠道：

- **stable**：npm dist-tag `latest`。推荐给大多数用户。
- **beta**：当它是当前版本时，对应 npm dist-tag `beta`；如果 beta 缺失或早于
  最新 stable 版本，更新流程会回退到 `latest`。
- **dev**：`main`（git）的移动最新提交。npm dist-tag：`dev`（发布时）。
  `main` 分支用于实验和活跃开发。它可能包含
  未完成的功能或破坏性变更。不要将它用于生产 Gateway 网关。

我们通常会先将 stable 构建发布到 **beta**，在那里进行测试，然后运行一个
显式的提升步骤，将已验证的构建移动到 `latest`，且不
更改版本号。维护者也可以在需要时直接将 stable 版本
发布到 `latest`。dist-tag 是 npm
安装的事实来源。

## 计划中的每月支持线

OpenClaw 尚未提供 LTS 或每月支持渠道。我们正在努力
实现与 SemVer 兼容的每月支持线，让用户可以停留在更安静的
支持线上，而 `latest` 继续快速前进。

计划中的版本形态是 `YYYY.M.PATCH`：

- `YYYY` 是年份。
- `M` 是每月发布线，不带前导零。
- `PATCH` 在该每月发布线内递增，必要时可以超过 100。

未来标签示例：

- `v2026.6.0`、`v2026.6.1`、`v2026.6.2` 用于六月发布线。
- `v2026.6.3-beta.1` 用于 fast/latest 轨道上的预发布版本。
- 未来的支持线 dist-tag，例如 `stable-2026-6` 或 `lts-2026-6`，可能
  指向某条每月发布线，但今天还没有这样的渠道可用。

在该迁移落地之前，公开更新渠道仍为 `stable`、`beta`
和 `dev`。

## 切换渠道

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 会将你的选择持久化到配置（`update.channel`）中，并对齐
安装方式：

- **`stable`**（包安装）：通过 npm dist-tag `latest` 更新。
- **`beta`**（包安装）：优先使用 npm dist-tag `beta`，但当 `beta` 缺失或早于
  当前 stable 标签时会回退到 `latest`。
- **`stable`**（git 安装）：检出最新的 stable git 标签。
- **`beta`**（git 安装）：优先使用最新的 beta git 标签，但当 beta 缺失或更早时
  会回退到最新的 stable git 标签。
- **`dev`**：确保存在一个 git 检出（默认 `~/openclaw`，可用
  `OPENCLAW_GIT_DIR` 覆盖），切换到 `main`，在上游基础上 rebase，构建，并
  从该检出安装全局 CLI。

<Tip>
如果你想并行使用 stable 和 dev，请保留两个克隆，并将你的 Gateway 网关指向 stable 的那个。
</Tip>

## 一次性指定版本或标签

使用 `--tag` 为单次更新指定特定 dist-tag、版本或包规范，
**不会**更改你持久化的渠道：

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

注意：

- `--tag` 仅适用于**包（npm）安装**。git 安装会忽略它。
- 标签不会被持久化。你下一次运行 `openclaw update` 时会照常使用你配置的
  渠道。
- 降级保护：如果目标版本早于你的当前版本，
  OpenClaw 会提示确认（可用 `--yes` 跳过）。
- `--channel beta` 不同于 `--tag beta`：渠道流程可以在 beta 缺失或更早时回退到
  stable/latest，而 `--tag beta` 会在那一次运行中指定原始的
  `beta` dist-tag。

## Dry run

预览 `openclaw update` 将执行的操作，而不做任何更改：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

dry run 会显示生效渠道、目标版本、计划操作，以及
是否需要降级确认。

## 插件和渠道

当你使用 `openclaw update` 切换渠道时，OpenClaw 也会同步插件
来源：

- `dev` 优先使用 git 检出中的内置插件。
- `stable` 和 `beta` 会恢复 npm 安装的插件包。
- npm 安装的插件会在核心更新完成后更新。

## 检查当前 Status

```bash
openclaw update status
```

显示当前激活的渠道、安装类型（git 或包）、当前版本，以及
来源（配置、git 标签、git 分支或默认值）。

## 标签最佳实践

- 为你希望 git 检出落到的版本打标签（当前 stable 版本使用 `vYYYY.M.D`，
  当前 beta 版本使用 `vYYYY.M.D-beta.N`）。
- `vYYYY.M.D.beta.N` 也会被识别以保持兼容性，但优先使用 `-beta.N`。
- 旧版 `vYYYY.M.D-<patch>` 标签仍会被识别为 stable（非 beta），
  但计划中的每月支持模型会使用普通补丁号
  （`vYYYY.M.PATCH`），而不是连字符修正后缀。
- 保持标签不可变：永远不要移动或复用标签。
- npm dist-tag 仍是 npm 安装的事实来源：
  - `latest` -> stable
  - `beta` -> 候选构建或先发 beta 的 stable 构建
  - `dev` -> main 快照（可选）

## macOS 应用可用性

Beta 和 dev 构建可能**不**包含 macOS 应用发布。这没问题：

- git 标签和 npm dist-tag 仍然可以发布。
- 在发布说明或 changelog 中注明“此 beta 没有 macOS 构建”。

## 相关

- [更新](/zh-CN/install/updating)
- [安装器内部机制](/zh-CN/install/installer)
