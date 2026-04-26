---
read_when:
    - 你想安全地更新一个源代码检出副本
    - 你需要了解 `--update` 简写行为
summary: '`openclaw update` 的 CLI 参考（相对安全的源更新 + Gateway 网关自动重启）'
title: 更新
x-i18n:
    generated_at: "2026-04-26T05:40:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 67da56f0281b6268063952fc8cab70842a0882a6c7d0add65cd2654c3bff41fa
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

安全地更新 OpenClaw，并在 stable/beta/dev 渠道之间切换。

如果你是通过 **npm/pnpm/bun** 安装的（全局安装，没有 git 元数据），
更新会通过 [更新](/zh-CN/install/updating) 中的软件包管理器流程进行。

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

- `--no-restart`：成功更新后跳过重启 Gateway 网关服务。对于确实会重启 Gateway 网关的软件包管理器更新，命令只有在验证重启后的服务报告了预期的更新版本后才会成功。
- `--channel <stable|beta|dev>`：设置更新渠道（git + npm；会持久化到配置中）。
- `--tag <dist-tag|version|spec>`：仅为此次更新覆盖软件包目标。对于软件包安装，`main` 会映射到 `github:openclaw/openclaw#main`。
- `--dry-run`：预览计划执行的更新操作（渠道/标签/目标/重启流程），不会写入配置、安装、同步插件或重启。
- `--json`：打印机器可读的 `UpdateRunResult` JSON；当在更新后插件同步期间检测到 npm 插件产物漂移时，其中包含 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每个步骤的超时时间（默认是 `1200s`）。
- `--yes`：跳过确认提示（例如降级确认）

注意：降级需要确认，因为旧版本可能会破坏配置。

## `update status`

显示当前激活的更新渠道 + git 标签/分支/SHA（对于源代码检出副本），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项：

- `--json`：打印机器可读的 Status JSON。
- `--timeout <seconds>`：检查的超时时间（默认是 `3s`）。

## `update wizard`

交互式流程，用于选择更新渠道并确认更新后是否重启 Gateway 网关
（默认会重启）。如果你在没有 git 检出副本的情况下选择 `dev`，它会
提供创建检出副本的选项。

选项：

- `--timeout <seconds>`：每个更新步骤的超时时间（默认 `1200`）

## 它会执行什么

当你显式切换渠道（`--channel ...`）时，OpenClaw 也会保持
安装方式一致：

- `dev` → 确保存在一个 git 检出副本（默认：`~/openclaw`，可通过 `OPENCLAW_GIT_DIR` 覆盖），
  更新它，并从该检出副本安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm 的 `beta` dist-tag，但当 beta 不存在或比当前 stable 版本更旧时，会回退到 `latest`。

Gateway 网关核心自动更新器（在配置中启用时）会复用这一路径进行更新。

对于软件包管理器安装，`openclaw update` 会在调用软件包管理器之前解析目标软件包
版本。如果已安装版本与目标完全匹配，且不需要持久化任何更新渠道变更，
则命令会在软件包安装、插件同步、completion 刷新
或 Gateway 网关重启工作开始前以已跳过状态退出。

## Git 检出副本流程

渠道：

- `stable`：检出最新的非 beta 标签，然后执行 build + doctor。
- `beta`：优先选择最新的 `-beta` 标签，但当 beta 不存在或更旧时回退到最新的 stable 标签。
- `dev`：检出 `main`，然后执行 fetch + rebase。

高级流程：

1. 需要一个干净的工作区（没有未提交的更改）。
2. 切换到所选渠道（标签或分支）。
3. 拉取上游（仅 `dev`）。
4. 仅 `dev`：在临时工作区中执行预检 lint + TypeScript build；如果最新提交失败，则最多回退 10 个提交以找到最新的可干净构建版本。
5. rebase 到所选提交（仅 `dev`）。
6. 使用仓库的软件包管理器安装依赖。对于 pnpm 检出副本，更新器会按需引导安装 `pnpm`（优先通过 `corepack`，然后回退为临时执行 `npm install pnpm@10`），而不是在 pnpm workspace 中运行 `npm run build`。
7. 执行 build + 构建 Control UI。
8. 将运行 `openclaw doctor` 作为最终的“安全更新”检查。
9. 将插件同步到当前激活的渠道（`dev` 使用内置插件；`stable`/`beta` 使用 npm），并更新通过 npm 安装的插件。

如果某个精确固定版本的 npm 插件更新解析到的产物，其完整性与已存储的安装记录
不同，`openclaw update` 会中止该插件产物更新，而不是安装它。只有在确认
你信任该新产物后，才应显式重新安装或更新该插件。

如果 pnpm 引导安装仍然失败，更新器现在会提前停止，并报告一个与软件包管理器相关的错误，而不是尝试在检出副本中执行 `npm run build`。

## `--update` 简写

`openclaw --update` 会被重写为 `openclaw update`（对 shell 和启动脚本很有用）。

## 相关内容

- `openclaw doctor`（在 git 检出副本上会提供先运行 update 的选项）
- [开发渠道](/zh-CN/install/development-channels)
- [更新](/zh-CN/install/updating)
- [CLI 参考](/zh-CN/cli)
