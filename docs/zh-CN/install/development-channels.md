---
read_when:
    - 你想在 stable/extended-stable/beta/dev 之间切换
    - 你想固定特定版本、标签或 SHA
    - 你正在标记或发布预发布版本
sidebarTitle: Release Channels
summary: stable、extended-stable、beta 和 dev 渠道：语义、切换、固定和打标签
title: 发布渠道
x-i18n:
    generated_at: "2026-07-05T01:57:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0bfe2efcd25c74dc165759a8a26f9bebce58a4fdb9711a94713c2ae294172894
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw 提供四个更新渠道：

- **stable**：npm dist-tag `latest`。建议大多数用户使用。
- **extended-stable**：npm dist-tag `extended-stable`。一个全新的、滞后的受支持月份包渠道。此版本中它仅支持前台运行。
- **beta**：当前可用时为 npm dist-tag `beta`；如果 beta 缺失或早于最新 stable 版本，更新流程会回退到 `latest`。
- **dev**：`main` 的移动头部（git）。npm dist-tag：`dev`（发布时）。`main` 分支用于实验和活跃开发。它可能包含未完成的功能或破坏性更改。不要将它用于生产 Gateway 网关。

我们通常会先将 stable 构建发布到 **beta**，在那里测试，然后运行一个显式的提升步骤，将已验证的构建移动到 `latest`，且不更改版本号。维护者也可以在需要时直接将 stable 版本发布到 `latest`。dist-tag 是 npm 安装的事实来源。

## 切换渠道

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 会在配置中持久保存你的选择（`update.channel`），并对齐安装方式：

- **`stable`**（包安装）：通过 npm dist-tag `latest` 更新。
- **`extended-stable`**（仅包安装）：解析公开 npm `extended-stable` 选择器，验证精确选定的包版本，并安装该精确版本。解析会以失败关闭方式处理，不会回退到 `latest`、`beta` 或 `dev`。
- **`beta`**（包安装）：优先使用 npm dist-tag `beta`，但当 `beta` 缺失或早于当前 stable 标签时，会回退到 `latest`。
- **`stable`**（git 安装）：检出最新 stable git 标签，排除 semver 预发布标签，例如 `-alpha.N`、`-beta.N`、`-rc.N`、`-dev.N`、`-next.N`、`-preview.N`、`-canary.N`、`-nightly.N` 以及其他预发布后缀。
- **`beta`**（git 安装）：优先使用最新 beta git 标签，但当 beta 缺失或更旧时，会回退到最新 stable git 标签。
- **`extended-stable`**（git 安装）：不支持。OpenClaw 会保持检出不变，并要求你使用包安装。
- **`dev`**：确保存在一个 git 检出（默认 `~/openclaw`，或在设置 `OPENCLAW_HOME` 时为 `$OPENCLAW_HOME/openclaw`；可用 `OPENCLAW_GIT_DIR` 覆盖），切换到 `main`，基于上游 rebase，构建，并从该检出安装全局 CLI。

<Tip>
如果你想并行使用 stable 和 dev，请保留两个克隆，并将你的 Gateway 网关指向 stable 那个。
</Tip>

## 一次性指定版本或标签

使用 `--tag` 可为单次更新指定特定 dist-tag、版本或包规范，且**不会**更改你持久保存的渠道：

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

- `--tag` 仅适用于**包（npm）安装**。git 安装会忽略它。
- 标签不会被持久保存。下一次 `openclaw update` 会照常使用你配置的渠道。
- 对于包安装，OpenClaw 会在分阶段 npm 安装前，将 GitHub/git 源规范预打包为临时 tarball。如果你希望将移动的 `main` 检出作为持久安装，请使用 `--channel dev` 或 `--install-method git --version main`。
- 降级保护：如果目标版本早于你的当前版本，OpenClaw 会提示确认（可用 `--yes` 跳过）。
- Extended-stable 始终使用其已验证的精确包目标。它不是 `--tag extended-stable` 的一次性别名，并且 `--tag` 不能与实际生效的 extended-stable 渠道组合使用。
- `--channel beta` 不同于 `--tag beta`：渠道流程可以在 beta 缺失或更旧时回退到 stable/latest，而 `--tag beta` 会为该次运行指定原始 `beta` dist-tag。

## 试运行

预览 `openclaw update` 会执行什么操作，而不做出更改：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

试运行会显示实际生效的渠道、目标版本、计划操作，以及是否需要降级确认。

## 插件和渠道

当你使用 `openclaw update` 切换渠道时，OpenClaw 也会同步插件来源：

- `dev` 优先使用 git 检出中的内置插件。
- `stable` 和 `beta` 会恢复 npm 安装的插件包。
- `extended-stable` 目前会在核心包成功后使用现有 stable/latest 插件线。尚未查询官方插件 `@extended-stable` 选择器。
- npm 安装的插件会在核心更新完成后更新。

## 检查当前状态

```bash
openclaw update status
```

显示活动渠道、安装类型（git 或包）、当前版本和来源（配置、git 标签、git 分支或默认值）。

## 打标签最佳实践

- 为你希望 git 检出落到的版本打标签（stable 使用 `vYYYY.M.PATCH`，beta 使用 `vYYYY.M.PATCH-beta.N`；命名的 semver 预发布后缀，例如 `-alpha.N`、`-rc.N` 和 `-next.N`，不是 stable 目标）。
- 为了兼容性，仍会将旧版数字 stable 标签（例如 `vYYYY.M.PATCH-1` 和 `v1.0.1-1`）识别为 stable git 标签。
- 为了兼容性，也会识别 `vYYYY.M.PATCH.beta.N`，但请优先使用 `-beta.N`。
- 保持标签不可变：绝不要移动或复用标签。
- npm dist-tag 仍是 npm 安装的事实来源：
  - `latest` -> stable
  - `extended-stable` -> 滞后的受支持月份包版本
  - `beta` -> 候选构建或 beta 优先的 stable 构建
  - `dev` -> main 快照（可选）

## macOS 应用可用性

Beta 和 dev 构建可能**不**包含 macOS 应用版本。这是可以的：

- 仍然可以发布 git 标签和 npm dist-tag。
- 在发布说明或 changelog 中注明“此 beta 没有 macOS 构建”。

## 相关内容

- [更新](/zh-CN/install/updating)
- [安装器内部机制](/zh-CN/install/installer)
