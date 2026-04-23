---
read_when:
    - 你想安全地更新源码检出副本
    - 你需要了解 `--update` 简写行为
summary: '`openclaw update` 的 CLI 参考（相对安全的源码更新 + Gateway 网关自动重启）'
title: update
x-i18n:
    generated_at: "2026-04-23T06:18:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc049ecf3d35fe276a1e5962bb8e5316dbbc3219ef0b91ee64d41cbbea20f9ae
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

安全更新 OpenClaw，并在 stable/beta/dev 渠道之间切换。

如果你通过 **npm/pnpm/bun** 安装（全局安装，无 git 元数据），
更新会通过 [Updating](/zh-CN/install/updating) 中的包管理器流程进行。

## 用法

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## 选项

- `--no-restart`：成功更新后跳过重启 Gateway 网关服务。
- `--channel <stable|beta|dev>`：设置更新渠道（git + npm；会持久化到配置中）。
- `--tag <dist-tag|version|spec>`：仅为本次更新覆盖包目标。对于包安装，`main` 会映射为 `github:openclaw/openclaw#main`。
- `--dry-run`：预览计划中的更新操作（渠道/tag/目标/重启流程），但不写入配置、不安装、不同步插件，也不重启。
- `--json`：打印机器可读的 `UpdateRunResult` JSON，包括
  当在更新后插件同步期间检测到 npm 插件产物漂移时的
  `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每一步的超时时间（默认 1200 秒）。
- `--yes`：跳过确认提示（例如降级确认）

注意：降级需要确认，因为旧版本可能会破坏配置。

## `update status`

显示当前激活的更新渠道 + git tag/branch/SHA（对于源码检出副本），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项：

- `--json`：打印机器可读的状态 JSON。
- `--timeout <seconds>`：检查超时时间（默认 3 秒）。

## `update wizard`

用于选择更新渠道并确认更新后是否重启 Gateway 网关的交互式流程
（默认会重启）。如果你在没有 git 检出副本的情况下选择 `dev`，
它会提供创建检出副本的选项。

选项：

- `--timeout <seconds>`：每个更新步骤的超时时间（默认 `1200`）

## 它会做什么

当你显式切换渠道时（`--channel ...`），OpenClaw 也会保持
安装方式与之对齐：

- `dev` → 确保存在一个 git 检出副本（默认：`~/openclaw`，可通过 `OPENCLAW_GIT_DIR` 覆盖），
  对其进行更新，并从该检出副本安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm dist-tag `beta`，但当 beta 不存在
  或比当前 stable 发布更旧时，会回退到 `latest`。

Gateway 网关核心自动更新器（在配置中启用时）会复用相同的更新路径。

对于包管理器安装，`openclaw update` 会先解析目标包
版本，然后再调用包管理器。如果已安装版本与目标版本完全
匹配，并且不需要持久化任何更新渠道变更，则该
命令会在执行包安装、插件同步、补全刷新
或 Gateway 网关重启之前，以跳过状态退出。

## Git 检出副本流程

渠道：

- `stable`：检出最新的非 beta tag，然后 build + doctor。
- `beta`：优先使用最新的 `-beta` tag，但当 beta 不存在或更旧时，
  会回退到最新的 stable tag。
- `dev`：检出 `main`，然后 fetch + rebase。

高级流程：

1. 需要一个干净的工作树（没有未提交的更改）。
2. 切换到所选渠道（tag 或 branch）。
3. 获取上游更新（仅 `dev`）。
4. 仅 `dev`：在临时工作树中执行预检 lint + TypeScript build；如果最新提交失败，则向后回退最多 10 个提交，以找到最新的可干净构建版本。
5. 变基到所选提交（仅 `dev`）。
6. 使用仓库包管理器安装依赖。对于 pnpm 检出副本，更新器会按需引导安装 `pnpm`（优先通过 `corepack`，然后回退到临时 `npm install pnpm@10`），而不是在 pnpm workspace 中运行 `npm run build`。
7. 执行 build，并构建 Control UI。
8. 运行 `openclaw doctor` 作为最终的“安全更新”检查。
9. 将插件同步到当前渠道（`dev` 使用内置 extensions；`stable`/`beta` 使用 npm），并更新通过 npm 安装的插件。

如果某个精确固定版本的 npm 插件更新解析到的产物，其完整性
与已存储安装记录不同，`openclaw update` 会中止该插件
产物更新，而不是安装它。只有在验证你信任该新产物之后，
才应显式重新安装或更新该插件。

如果 pnpm 引导安装仍然失败，更新器现在会提前停止，并给出包管理器特定错误，而不是尝试在检出副本中运行 `npm run build`。

## `--update` 简写

`openclaw --update` 会重写为 `openclaw update`（对 shell 和启动脚本很有用）。

## 另请参阅

- `openclaw doctor`（对于 git 检出副本，会先提供运行更新的选项）
- [Development channels](/zh-CN/install/development-channels)
- [Updating](/zh-CN/install/updating)
- [CLI reference](/zh-CN/cli)
