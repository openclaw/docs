---
read_when:
    - 你想在 stable/extended-stable/beta/dev 之间切换
    - 你想固定到特定版本、标签或 SHA
    - 你正在标记或发布预发布版本
sidebarTitle: Release Channels
summary: 稳定版、扩展稳定版、beta 和 dev 渠道：语义、切换、固定和打标签
title: 发布渠道
x-i18n:
    generated_at: "2026-07-06T10:51:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 00b35a9dd74a2a5ffad67b28538d0e210634fa474b70b65aeba49a09c0a73368
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw 提供四个更新频道：

- **stable**：npm dist-tag `latest`。推荐大多数用户使用。
- **extended-stable**：npm dist-tag `extended-stable`。一个全新的、滞后的
  受支持月份包频道。本版本中它仅适用于包安装，且仅支持前台运行。
- **beta**：npm dist-tag `beta`。当 `beta` 缺失或早于当前稳定版本时，
  回退到 `latest`。
- **dev**：`main` 的移动头（git）。发布时使用 npm dist-tag `dev`。`main`
  用于实验和活跃开发；它可能包含未完成的功能或破坏性变更。不要将它用于生产 Gateway 网关。

稳定构建通常会先发布到 **beta**，经过验证后再提升到 **latest**，且不递增版本号。维护者也可以直接发布到 `latest`。dist-tag 是 npm 安装的事实来源。

## 切换频道

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 会把选择持久化到配置中的 `update.channel`，并驱动两种
安装路径：

| 频道              | npm/包安装                                                                                                                                                                            | git 安装                                                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | dist-tag `latest`                                                                                                                                                                      | 最新稳定 git 标签（排除 `-alpha.N`、`-beta.N`、`-rc.N`、`-dev.N`、`-next.N`、`-preview.N`、`-canary.N`、`-nightly.N` 以及其他命名预发布后缀） |
| `extended-stable` | 解析公开 npm `extended-stable` 选择器，验证精确选中的包，并安装该精确版本。失败时关闭，不回退到 `latest`、`beta` 或 `dev`。 | 不支持：OpenClaw 保持检出不变，并要求你使用包安装                                                                     |
| `beta`            | dist-tag `beta`，当 `beta` 缺失或更旧时回退到 `latest`                                                                                                              | 最新 beta git 标签；当 beta 缺失或更旧时回退到最新稳定 git 标签                                                                       |
| `dev`             | dist-tag `dev`（少见；大多数 dev 用户使用 git 安装）                                                                                                                                 | 拉取、将检出变基到上游 `main` 分支、构建，并重新安装全局 CLI                                                                 |

对于 `dev` git 安装，默认检出位置是 `~/openclaw`（或在设置
`OPENCLAW_HOME` 时为 `$OPENCLAW_HOME/openclaw`）；可用
`OPENCLAW_GIT_DIR` 覆盖。

<Tip>
要并行保留 stable 和 dev，请使用两个独立检出，并让每个 Gateway 网关指向自己的检出。
</Tip>

## 一次性指定版本或标签

使用 `--tag` 为单次更新指定特定 dist-tag、版本或包规范，**不会**更改持久化频道：

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout (persistent)
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

说明：

- `--tag` **仅适用于包（npm）安装**；git 安装会忽略它。
- 该标签不会持久化；下一次 `openclaw update` 会使用配置的频道。
- `--tag main` 会在那一次运行中映射到 npm 兼容规范 `github:openclaw/openclaw#main`。对于持久化的移动 `main` 安装，请使用
  `openclaw update --channel dev`（包安装会切换到 git 检出）
  或使用安装器的 git 方法重新安装：
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`。
  npm 安装路径会直接拒绝 GitHub/git 源目标，并改为提示你使用 git 方法。
- 降级保护：如果目标版本早于当前版本，OpenClaw 会提示确认（可用 `--yes` 跳过）。
- Extended-stable 始终使用其已验证的精确包目标。它不是
  `--tag extended-stable` 的一次性别名，且 `--tag` 不能与有效的 extended-stable 频道组合使用。
- `--channel beta` 不同于 `--tag beta`：频道流程可以在 beta 缺失或更旧时回退到 stable/latest，而 `--tag beta` 始终只在那一次运行中指向原始 `beta` dist-tag。

## Dry run

预览 `openclaw update` 会执行什么操作，而不实际更改：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

dry run 会报告有效频道、目标版本、计划操作，以及是否需要降级确认。

## 插件和频道

使用 `openclaw update` 切换频道也会同步插件来源：

- `dev` 会将已安装且存在内置对应项的插件切回其内置（git 检出）来源。
- `stable` 和 `beta` 会恢复 npm 安装或 ClawHub 安装的插件包。
- `extended-stable` 会将符合条件、意图为裸/default 或 `latest` 的官方 npm 插件解析到精确的已安装核心版本。它不会在运行时查询插件 `@extended-stable` 标签。
- npm 安装的插件会在核心更新完成后更新。

## 检查当前状态

```bash
openclaw update status
```

显示活动频道（以及决定它的来源：配置、git 标签、git 分支、已安装版本或默认值）、安装类型（git 或包）、当前版本和更新可用性。

## 打标签最佳实践

- 为你希望 git 检出落到的版本打标签：稳定版使用 `vYYYY.M.PATCH`，
  beta 使用 `vYYYY.M.PATCH-beta.N`。诸如 `-alpha.N`、`-rc.N` 和 `-next.N`
  这样的命名预发布后缀不是稳定或 beta 目标。
- 旧版数字稳定标签（如 `vYYYY.M.PATCH-1` 和 `v1.0.1-1`）仍会被识别为稳定 git 标签，以保持兼容。
- `vYYYY.M.PATCH.beta.N`（点分隔）也会被识别以保持兼容；优先使用 `-beta.N`。
- 保持标签不可变：绝不要移动或复用标签。
- npm dist-tag 仍是 npm 安装的事实来源：
  - `latest` -> stable
  - `extended-stable` -> 滞后的受支持月份包版本
  - `beta` -> 候选构建或 beta 优先的稳定构建
  - `dev` -> main 快照（可选）

## macOS 应用可用性

Beta 和 dev 构建可能**不**包含 macOS 应用发布。这没问题：

- git 标签和 npm dist-tag 仍可独立发布。
- 在发布说明或更新日志中注明“此 beta 没有 macOS 构建”。

## 相关

- [更新](/zh-CN/install/updating)
- [安装器内部机制](/zh-CN/install/installer)
