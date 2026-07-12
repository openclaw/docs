---
read_when:
    - 你想在 stable/extended-stable/beta/dev 之间切换
    - 你想固定使用特定版本、标签或 SHA
    - 你正在标记或发布预发行版本
sidebarTitle: Release Channels
summary: 稳定版、长期稳定版、测试版和开发版渠道：语义、切换、固定版本和标签管理
title: 发布渠道
x-i18n:
    generated_at: "2026-07-12T14:31:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw 提供四个更新渠道：

- **stable**：npm dist-tag `latest`。推荐大多数用户使用。
- **extended-stable**：npm dist-tag `extended-stable`。这是一个全新的、滞后一个受支持月份的软件包渠道。它仅支持软件包安装，且只能在前台安装。启用 `update.checkOnStart` 后，已保存此选项的用户会收到只读更新提示，但绝不会自动应用更新。
- **beta**：npm dist-tag `beta`。当 `beta` 不存在或早于当前稳定版本时，回退到 `latest`。
- **dev**：`main` 的滚动最新版本（git）。发布时使用 npm dist-tag `dev`。`main` 用于实验和活跃开发；其中可能包含未完成的功能或破坏性变更。请勿将其用于生产环境的 Gateway 网关。

稳定构建通常先发布到 **beta**，经过验证后，再提升为 **latest**，版本号保持不变。维护者也可以直接发布到 `latest`。对于 npm 安装，dist-tag 是唯一事实来源。

## 切换渠道

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 会将选择持久化到配置中的 `update.channel`，并控制两种安装路径：

| 渠道              | npm/软件包安装                                                                                                                                                                         | git 安装                                                                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`          | dist-tag `latest`                                                                                                                                                                      | 最新稳定版 git 标签（不包括 `-alpha.N`、`-beta.N`、`-rc.N`、`-dev.N`、`-next.N`、`-preview.N`、`-canary.N`、`-nightly.N` 及其他命名的预发布后缀） |
| `extended-stable` | 解析公开的 npm `extended-stable` 选择器，验证选定的确切软件包，并安装该确切版本。失败时关闭，不会回退到 `latest`、`beta` 或 `dev`。 | 不支持：OpenClaw 保持检出内容不变，并提示你使用软件包安装                                                                     |
| `beta`            | dist-tag `beta`；当 `beta` 不存在或版本更旧时，回退到 `latest`                                                                                                              | 最新 beta git 标签；当 beta 不存在或版本更旧时，回退到最新稳定版 git 标签                                                                       |
| `dev`             | dist-tag `dev`（很少使用；大多数 dev 用户使用 git 安装）                                                                                                                                 | 获取更新、将检出内容变基到上游 `main` 分支、构建，并重新安装全局 CLI                                                                 |

对于 `dev` git 安装，默认检出目录为 `~/openclaw`（设置 `OPENCLAW_HOME` 时则为 `$OPENCLAW_HOME/openclaw`）；可通过 `OPENCLAW_GIT_DIR` 覆盖。

<Tip>
若要同时保留 stable 和 dev，请使用两个独立的检出目录，并将每个 Gateway 网关分别指向各自的目录。
</Tip>

## 一次性指定版本或标签

使用 `--tag` 可在单次更新中指定特定的 dist-tag、版本或软件包规范，且**不会**更改持久化的渠道：

```bash
# 安装特定版本
openclaw update --tag 2026.4.1-beta.1

# 从 beta dist-tag 安装（仅一次，不持久化）
openclaw update --tag beta

# 切换到滚动更新的 GitHub main 检出目录（持久化）
openclaw update --channel dev

# 安装特定的 npm 软件包规范
openclaw update --tag openclaw@2026.4.1-beta.1

# 从 GitHub main 安装一次，不持久化渠道
openclaw update --tag main
```

注意：

- `--tag` **仅适用于软件包（npm）安装**；git 安装会忽略它。
- 该标签不会持久化；下一次运行 `openclaw update` 时会使用已配置的渠道。
- `--tag main` 会在该次运行中映射到与 npm 兼容的规范 `github:openclaw/openclaw#main`。若要持久使用滚动更新的 `main` 安装，请使用 `openclaw update --channel dev`（软件包安装会切换到 git 检出目录），或使用安装程序的 git 方法重新安装：`curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`。npm 安装路径会直接拒绝 GitHub/git 源目标，并提示你改用 git 方法。
- 降级保护：如果目标版本早于当前版本，OpenClaw 会提示确认（可使用 `--yes` 跳过）。
- extended-stable 始终使用经过验证的确切软件包目标。它不是 `--tag extended-stable` 的一次性别名，并且 `--tag` 不能与实际生效的 extended-stable 渠道同时使用。
- `--channel beta` 与 `--tag beta` 不同：当 beta 不存在或版本更旧时，渠道流程可以回退到 stable/latest，而 `--tag beta` 在该次运行中始终以原始 `beta` dist-tag 为目标。

## 试运行

预览 `openclaw update` 将执行的操作，而不进行任何更改：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

试运行会报告实际生效的渠道、目标版本、计划执行的操作，以及是否需要确认降级。

## 插件和渠道

使用 `openclaw update` 切换渠道时，也会同步插件来源：

- `dev` 会将具有内置对应项的已安装插件切换回其内置（git 检出目录）来源。
- `stable` 和 `beta` 会恢复通过 npm 或 ClawHub 安装的插件软件包。
- `extended-stable` 会将使用裸版本/默认意图或 `latest` 意图的符合条件的官方 npm 插件解析为已安装核心的确切版本。运行时不会查询插件的 `@extended-stable` 标签。
- 通过 npm 安装的插件会在核心更新完成后进行更新。

## 检查当前状态

```bash
openclaw update status
```

显示当前渠道（以及决定该渠道的来源：配置、git 标签、git 分支、已安装版本或默认值）、安装类型（git 或软件包）、当前版本和更新可用性。

## 标签最佳实践

- 为希望 git 检出目录落到的版本添加标签：稳定版使用 `vYYYY.M.PATCH`，beta 版使用 `vYYYY.M.PATCH-beta.N`。诸如 `-alpha.N`、`-rc.N` 和 `-next.N` 等命名的预发布后缀不属于稳定版或 beta 版目标。
- 为实现兼容性，仍会将 `vYYYY.M.PATCH-1` 和 `v1.0.1-1` 等旧式数字稳定版标签识别为稳定版 git 标签。
- 为实现兼容性，也会识别 `vYYYY.M.PATCH.beta.N`（点号分隔）；建议使用 `-beta.N`。
- 保持标签不可变：切勿移动或重复使用标签。
- npm dist-tag 仍是 npm 安装的唯一事实来源：
  - `latest` -> stable
  - `extended-stable` -> 滞后一个受支持月份的软件包版本
  - `beta` -> 候选构建或优先发布至 beta 的稳定构建
  - `dev` -> main 快照（可选）

## macOS 应用可用性

Beta 和 dev 构建可能**不**包含 macOS 应用版本。这没有问题：

- git 标签和 npm dist-tag 仍可单独发布。
- 在发布说明或变更日志中注明“此 beta 版本没有 macOS 构建”。

## 相关内容

- [更新](/zh-CN/install/updating)
- [安装程序内部机制](/zh-CN/install/installer)
