---
read_when:
    - 你想在 stable/beta/dev 之间切换
    - 你想固定某个特定版本、标签或 SHA
    - 你正在为预发布版本打标签或发布
sidebarTitle: Release Channels
summary: stable、beta 和 dev 渠道：语义、切换、固定版本和打标签
title: 发布渠道
x-i18n:
    generated_at: "2026-04-05T08:26:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f33a77bf356f989cd4de5f8bb57f330c276e7571b955bea6994a4527e40258d
    source_path: install/development-channels.md
    workflow: 15
---

# 开发渠道

OpenClaw 提供三个更新渠道：

- **stable**：npm dist-tag `latest`。推荐大多数用户使用。
- **beta**：当 npm dist-tag `beta` 是最新时使用它；如果 beta 不存在，或比
  最新 stable 版本更旧，更新流程会回退到 `latest`。
- **dev**：`main`（git）的移动头部。npm dist-tag：`dev`（发布时）。
  `main` 分支用于实验和活跃开发。它可能包含
  未完成的功能或破坏性变更。不要将其用于生产 Gateway 网关。

我们通常会先将 stable 构建发布到 **beta**，在那里进行测试，然后执行一个
显式晋升步骤，将经过验证的构建移动到 `latest`，而不
更改版本号。维护者也可以在需要时直接将 stable 版本
发布到 `latest`。对于 npm 安装，dist-tag 是唯一事实来源。

## 切换渠道

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 会将你的选择持久化到配置中（`update.channel`），并使
安装方式保持一致：

- **`stable`**（包安装）：通过 npm dist-tag `latest` 更新。
- **`beta`**（包安装）：优先使用 npm dist-tag `beta`，但当 `beta` 不存在或比当前 stable 标签更旧时，会回退到
  `latest`。
- **`stable`**（git 安装）：检出最新 stable git 标签。
- **`beta`**（git 安装）：优先使用最新 beta git 标签，但当 beta 不存在或更旧时，会回退到
  最新 stable git 标签。
- **`dev`**：确保存在 git 检出副本（默认 `~/openclaw`，可通过
  `OPENCLAW_GIT_DIR` 覆盖），切换到 `main`，对上游执行 rebase，构建，并从该检出副本安装全局 CLI。

提示：如果你想并行保留 stable + dev，请维护两个 clone，并将你的
gateway 指向 stable 的那个。

## 一次性指定版本或标签目标

使用 `--tag` 可在单次
更新中指定特定的 dist-tag、版本或包规范，**而不会**更改你已持久化的渠道：

```bash
# 安装特定版本
openclaw update --tag 2026.4.1-beta.1

# 从 beta dist-tag 安装（一次性，不会持久化）
openclaw update --tag beta

# 从 GitHub main 分支安装（npm tarball）
openclaw update --tag main

# 安装特定的 npm 包规范
openclaw update --tag openclaw@2026.4.1-beta.1
```

说明：

- `--tag` **仅适用于包（npm）安装**。git 安装会忽略它。
- 标签不会被持久化。你下一次执行 `openclaw update` 时，仍会照常使用已配置的
  渠道。
- 降级保护：如果目标版本比当前版本更旧，
  OpenClaw 会提示确认（可用 `--yes` 跳过）。
- `--channel beta` 与 `--tag beta` 不同：渠道流程可以在 beta 不存在或更旧时回退
  到 stable/latest，而 `--tag beta` 会在那一次运行中直接指定
  原始 `beta` dist-tag。

## Dry run

预览 `openclaw update` 会执行什么，而不实际更改任何内容：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Dry run 会显示生效的渠道、目标版本、计划操作，以及
是否需要降级确认。

## 插件和渠道

当你使用 `openclaw update` 切换渠道时，OpenClaw 也会同步插件
来源：

- `dev` 优先使用 git 检出副本中的内置插件。
- `stable` 和 `beta` 会恢复通过 npm 安装的插件包。
- 通过 npm 安装的插件会在核心更新完成后更新。

## 检查当前状态

```bash
openclaw update status
```

显示当前激活的渠道、安装类型（git 或包）、当前版本，以及
来源（配置、git 标签、git 分支或默认值）。

## 打标签最佳实践

- 为你希望 git 检出副本落到的版本打标签（stable 用 `vYYYY.M.D`，
  beta 用 `vYYYY.M.D-beta.N`）。
- 出于兼容性，`vYYYY.M.D.beta.N` 也能识别，但优先使用 `-beta.N`。
- 旧版 `vYYYY.M.D-<patch>` 标签仍会被识别为 stable（非 beta）。
- 保持标签不可变：绝不要移动或重复使用某个标签。
- 对于 npm 安装，npm dist-tags 仍然是唯一事实来源：
  - `latest` -> stable
  - `beta` -> 候选构建或 beta-first stable 构建
  - `dev` -> `main` 快照（可选）

## macOS app 可用性

beta 和 dev 构建**可能不会**包含 macOS app 版本。这是正常的：

- git 标签和 npm dist-tag 仍然可以发布。
- 在发行说明或 changelog 中注明“此 beta 没有 macOS 构建”。
