---
read_when:
    - 你想在 stable/beta/dev 之间切换
    - 你想固定特定版本、标签或 SHA
    - 你正在标记或发布预发布版本
sidebarTitle: Release Channels
summary: 稳定版、测试版和开发版渠道：语义、切换、固定和标记
title: 发布渠道
x-i18n:
    generated_at: "2026-05-07T13:19:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw 发布三个更新渠道：

- **stable**：npm dist-tag `latest`。推荐大多数用户使用。
- **beta**：当前可用时使用 npm dist-tag `beta`；如果 beta 缺失或早于
  最新 stable 版本，更新流程会回退到 `latest`。
- **dev**：`main` 的移动头（git）。npm dist-tag：`dev`（发布时）。
  `main` 分支用于实验和活跃开发。它可能包含
  未完成的功能或破坏性变更。不要将它用于生产 Gateway 网关。

我们通常先把 stable 构建发布到 **beta**，在那里测试，然后运行一个
显式提升步骤，把经过验证的构建移动到 `latest`，而不
更改版本号。维护者也可以在需要时直接把 stable 版本
发布到 `latest`。dist-tag 是 npm 安装的事实来源。

## 切换渠道

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 会将你的选择持久化到配置（`update.channel`）中，并对齐
安装方式：

- **`stable`**（包安装）：通过 npm dist-tag `latest` 更新。
- **`beta`**（包安装）：优先使用 npm dist-tag `beta`，但当 `beta` 缺失或早于当前 stable 标签时回退到
  `latest`。
- **`stable`**（git 安装）：检出最新的 stable git 标签。
- **`beta`**（git 安装）：优先使用最新的 beta git 标签，但当 beta 缺失或更旧时回退到
  最新的 stable git 标签。
- **`dev`**：确保存在一个 git 检出（默认 `~/openclaw`，可用
  `OPENCLAW_GIT_DIR` 覆盖），切换到 `main`，基于上游变基，构建，并
  从该检出安装全局 CLI。

<Tip>
如果你想并行使用 stable 和 dev，请保留两个克隆，并将你的 Gateway 网关指向 stable 克隆。
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
- 标签不会持久化。下一次 `openclaw update` 会照常使用你配置的
  渠道。
- 降级保护：如果目标版本早于当前版本，
  OpenClaw 会提示确认（可用 `--yes` 跳过）。
- `--channel beta` 不同于 `--tag beta`：渠道流程可以在 beta 缺失或更旧时
  回退到 stable/latest，而 `--tag beta` 会在该次运行中直接指定
  原始 `beta` dist-tag。

## 试运行

预览 `openclaw update` 会执行什么操作，而不进行更改：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

试运行会显示有效渠道、目标版本、计划操作，以及
是否需要降级确认。

## 插件和渠道

当你使用 `openclaw update` 切换渠道时，OpenClaw 也会同步插件
来源：

- `dev` 优先使用 git 检出中的内置插件。
- `stable` 和 `beta` 会恢复通过 npm 安装的插件包。
- 通过 npm 安装的插件会在核心更新完成后更新。

## 检查当前状态

```bash
openclaw update status
```

显示当前活动渠道、安装类型（git 或包）、当前版本，以及
来源（配置、git 标签、git 分支或默认值）。

## 打标签最佳实践

- 为希望 git 检出落到的版本打标签（stable 使用 `vYYYY.M.D`，
  beta 使用 `vYYYY.M.D-beta.N`）。
- 为兼容性也识别 `vYYYY.M.D.beta.N`，但优先使用 `-beta.N`。
- 旧版 `vYYYY.M.D-<patch>` 标签仍被识别为 stable（非 beta）。
- 保持标签不可变：绝不要移动或复用标签。
- npm dist-tag 仍是 npm 安装的事实来源：
  - `latest` -> stable
  - `beta` -> 候选构建或 beta 优先的 stable 构建
  - `dev` -> main 快照（可选）

## macOS 应用可用性

Beta 和 dev 构建可能**不**包含 macOS 应用发布。这没问题：

- 仍然可以发布 git 标签和 npm dist-tag。
- 在发行说明或变更日志中说明“此 beta 没有 macOS 构建”。

## 相关内容

- [更新](/zh-CN/install/updating)
- [安装器内部机制](/zh-CN/install/installer)
