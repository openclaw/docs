---
read_when:
    - 你想在 stable/beta/dev 之间切换
    - 你想固定特定版本、标签或 SHA
    - 你正在标记或发布预发布版本
sidebarTitle: Release Channels
summary: 稳定版、Beta 版和开发版渠道：语义、切换、固定和标记
title: 发布渠道
x-i18n:
    generated_at: "2026-06-27T02:17:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw 提供三个更新渠道：

- **stable**：npm dist-tag `latest`。推荐大多数用户使用。
- **beta**：当它是当前版本时，对应 npm dist-tag `beta`；如果 beta 缺失或早于
  最新稳定版，更新流程会回退到 `latest`。
- **dev**：`main` 的移动头部（git）。npm dist-tag：`dev`（发布时）。
  `main` 分支用于实验和活跃开发。它可能包含
  未完成的功能或破坏性变更。不要将它用于生产 Gateway 网关。

我们通常会先将稳定构建发布到 **beta**，在那里测试，然后运行一个
显式的提升步骤，将已验证的构建移动到 `latest`，且不
更改版本号。维护者也可以在需要时直接将稳定版本
发布到 `latest`。dist-tags 是 npm 安装的事实来源。

## 切换渠道

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 会将你的选择持久化到配置（`update.channel`）中，并对齐
安装方式：

- **`stable`**（包安装）：通过 npm dist-tag `latest` 更新。
- **`beta`**（包安装）：优先使用 npm dist-tag `beta`，但当 `beta`
  缺失或早于当前稳定标签时回退到 `latest`。
- **`stable`**（git 安装）：检出最新的稳定 git 标签，排除
  semver 预发布标签，例如 `-alpha.N`、`-beta.N`、`-rc.N`、`-dev.N`、
  `-next.N`、`-preview.N`、`-canary.N`、`-nightly.N`，以及其他预发布
  后缀。
- **`beta`**（git 安装）：优先使用最新的 beta git 标签，但当 beta 缺失或更旧时
  回退到最新的稳定 git 标签。
- **`dev`**：确保存在一个 git checkout（默认 `~/openclaw`，或在设置
  `OPENCLAW_HOME` 时使用 `$OPENCLAW_HOME/openclaw`；可用
  `OPENCLAW_GIT_DIR` 覆盖），切换到 `main`，基于上游 rebase，构建，并
  从该 checkout 安装全局 CLI。

<Tip>
如果你想并行使用 stable 和 dev，请保留两个 clone，并将你的 Gateway 网关指向 stable 那个。
</Tip>

## 一次性指定版本或标签

使用 `--tag` 为单次更新指定特定 dist-tag、版本或包 spec，
**不会**更改你持久化的渠道：

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

说明：

- `--tag` **仅适用于包（npm）安装**。git 安装会忽略它。
- 该标签不会被持久化。你下一次运行 `openclaw update` 时会照常使用
  已配置的渠道。
- 对于包安装，OpenClaw 会在分阶段 npm 安装之前，将 GitHub/git 源 spec
  预先打包为一个临时 tarball。当你希望将移动的 `main`
  checkout 作为持久安装时，请使用 `--channel dev` 或
  `--install-method git --version main`。
- 降级保护：如果目标版本早于你的当前版本，
  OpenClaw 会提示确认（可用 `--yes` 跳过）。
- `--channel beta` 不同于 `--tag beta`：渠道流程可以在 beta 缺失或更旧时
  回退到 stable/latest，而 `--tag beta` 会在那一次运行中直接指向
  原始的 `beta` dist-tag。

## 试运行

预览 `openclaw update` 会执行什么操作，而不实际更改：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

试运行会显示生效渠道、目标版本、计划操作，以及
是否需要降级确认。

## 插件和渠道

当你使用 `openclaw update` 切换渠道时，OpenClaw 也会同步插件
来源：

- `dev` 优先使用 git checkout 中的内置插件。
- `stable` 和 `beta` 会恢复 npm 安装的插件包。
- npm 安装的插件会在核心更新完成后更新。

## 检查当前状态

```bash
openclaw update status
```

显示活动渠道、安装类型（git 或包）、当前版本，以及
来源（配置、git 标签、git 分支或默认值）。

## 打标签最佳实践

- 为你希望 git checkout 落到的版本打标签（稳定版使用 `vYYYY.M.PATCH`，
  beta 使用 `vYYYY.M.PATCH-beta.N`；命名的 semver 预发布后缀，例如
  `-alpha.N`、`-rc.N` 和 `-next.N`，不是稳定目标）。
- 为兼容性，旧版数字稳定标签，例如 `vYYYY.M.PATCH-1` 和 `v1.0.1-1`，仍会
  被识别为稳定 git 标签。
- 为兼容性，`vYYYY.M.PATCH.beta.N` 也会被识别，但首选 `-beta.N`。
- 保持标签不可变：绝不要移动或复用标签。
- npm dist-tags 仍然是 npm 安装的事实来源：
  - `latest` -> stable
  - `beta` -> 候选构建或 beta 优先的稳定构建
  - `dev` -> main 快照（可选）

## macOS app 可用性

Beta 和 dev 构建可能**不**包含 macOS app 发布。这没问题：

- git 标签和 npm dist-tag 仍然可以发布。
- 在发行说明或 changelog 中指出“此 beta 没有 macOS 构建”。

## 相关

- [更新](/zh-CN/install/updating)
- [安装器内部机制](/zh-CN/install/installer)
