---
read_when:
    - 你想安全地更新一个源码检出副本
    - 你需要了解 `--update` 简写行为
summary: '`openclaw update` 的 CLI 参考（相对安全的源码更新 + Gateway 网关自动重启）'
title: update
x-i18n:
    generated_at: "2026-04-05T08:20:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12c8098654b644c3666981d379f6c018e84fde56a5420f295d78052f9001bdad
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

安全地更新 OpenClaw，并在 stable/beta/dev 渠道之间切换。

如果你是通过 **npm/pnpm/bun** 安装的（全局安装，无 git 元数据），
更新会通过[更新](/install/updating)中的包管理器流程进行。

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
- `--tag <dist-tag|version|spec>`：仅为此次更新覆盖软件包目标。对于包安装，`main` 会映射到 `github:openclaw/openclaw#main`。
- `--dry-run`：预览计划中的更新操作（渠道/标签/目标/重启流程），但不写入配置、不安装、不同步插件，也不重启。
- `--json`：输出机器可读的 `UpdateRunResult` JSON。
- `--timeout <seconds>`：每一步的超时时间（默认 1200 秒）。
- `--yes`：跳过确认提示（例如降级确认）

注意：降级需要确认，因为旧版本可能会破坏配置。

## `update status`

显示当前激活的更新渠道 + git 标签/分支/SHA（适用于源码检出副本），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项：

- `--json`：输出机器可读的状态 JSON。
- `--timeout <seconds>`：检查超时时间（默认 3 秒）。

## `update wizard`

交互式流程，用于选择更新渠道并确认更新后是否重启 Gateway 网关
（默认会重启）。如果你在没有 git 检出副本的情况下选择 `dev`，
它会提供创建一个检出副本的选项。

选项：

- `--timeout <seconds>`：每个更新步骤的超时时间（默认 `1200`）

## 它会做什么

当你显式切换渠道（`--channel ...`）时，OpenClaw 也会保持
安装方式与之对齐：

- `dev` → 确保存在一个 git 检出副本（默认：`~/openclaw`，可通过 `OPENCLAW_GIT_DIR` 覆盖），
  更新它，并从该检出副本安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm 的 `beta` dist-tag，但当 beta
  不存在或比当前 stable 版本更旧时，会回退到 `latest`。

Gateway 网关核心自动更新器（当通过配置启用时）会复用同一条更新路径。

## Git 检出副本流程

渠道：

- `stable`：检出最新的非 beta 标签，然后执行 build + Doctor。
- `beta`：优先使用最新的 `-beta` 标签，但当 beta 不存在或更旧时，回退到最新 stable 标签。
- `dev`：检出 `main`，然后执行 fetch + rebase。

高级流程：

1. 要求工作树干净（没有未提交的更改）。
2. 切换到选定渠道（标签或分支）。
3. 拉取上游（仅 `dev`）。
4. 仅 `dev`：在临时 worktree 中执行预检 lint + TypeScript build；如果最新提交失败，则最多回退 10 个提交，以找到最新的可正常构建版本。
5. 变基到选定提交（仅 `dev`）。
6. 安装依赖（优先 `pnpm`；回退到 `npm`；`bun` 仍作为次级兼容性回退可用）。
7. 构建 + 构建 Control UI。
8. 运行 `openclaw doctor` 作为最终的“安全更新”检查。
9. 将插件同步到当前渠道（`dev` 使用内置扩展；`stable`/`beta` 使用 npm），并更新通过 npm 安装的插件。

## `--update` 简写

`openclaw --update` 会重写为 `openclaw update`（适用于 shell 和启动脚本）。

## 另请参阅

- `openclaw doctor`（在 git 检出副本中会先提供运行更新的选项）
- [开发渠道](/install/development-channels)
- [更新](/install/updating)
- [CLI 参考](/cli)
