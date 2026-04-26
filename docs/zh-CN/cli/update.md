---
read_when:
    - 你想要安全地更新一个源代码检出副本
    - 你需要了解 `--update` 简写行为
summary: '`openclaw update` 的 CLI 参考（相对安全的源更新 + Gateway 网关自动重启）'
title: 更新
x-i18n:
    generated_at: "2026-04-26T08:13:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: b06cab7f4eee12e0fa474b2ea0fb2848fb4899517f9446369888391d2eb3ea9e
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

安全地更新 OpenClaw，并在 stable/beta/dev 渠道之间切换。

如果你通过 **npm/pnpm/bun** 安装（全局安装，没有 git 元数据），更新会通过 [更新](/zh-CN/install/updating) 中的包管理器流程进行。

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

- `--no-restart`：成功更新后跳过重启 Gateway 网关服务。对于确实会重启 Gateway 网关的包管理器更新，命令只有在验证重启后的服务报告了预期的更新版本后才会成功。
- `--channel <stable|beta|dev>`：设置更新渠道（git + npm；会持久化到配置中）。
- `--tag <dist-tag|version|spec>`：仅对此次更新覆盖包目标。对于包安装，`main` 会映射到 `github:openclaw/openclaw#main`。
- `--dry-run`：预览计划执行的更新操作（渠道/tag/目标/重启流程），不会写入配置、安装、同步插件或重启。
- `--json`：打印机器可读的 `UpdateRunResult` JSON；当在更新后插件同步期间检测到 npm 插件构件漂移时，其中包括 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每一步的超时时间（默认 1200 秒）。
- `--yes`：跳过确认提示（例如降级确认）

注意：降级需要确认，因为旧版本可能会破坏配置。

## `update status`

显示当前活动的更新渠道 + git tag/branch/SHA（针对源代码检出副本），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项：

- `--json`：打印机器可读的状态 JSON。
- `--timeout <seconds>`：检查超时时间（默认 3 秒）。

## `update wizard`

交互式流程，用于选择更新渠道并确认更新后是否重启 Gateway 网关（默认会重启）。如果你在没有 git 检出副本的情况下选择 `dev`，它会提供创建一个检出副本的选项。

选项：

- `--timeout <seconds>`：每个更新步骤的超时时间（默认 `1200`）

## 它会做什么

当你显式切换渠道（`--channel ...`）时，OpenClaw 还会保持安装方式一致：

- `dev` → 确保存在一个 git 检出副本（默认：`~/openclaw`，可通过 `OPENCLAW_GIT_DIR` 覆盖），更新它，并从该检出副本安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm dist-tag `beta`，但当 beta 缺失或比当前 stable 版本更旧时，会回退到 `latest`。

Gateway 网关核心自动更新器（在配置中启用时）会复用同一条更新路径。

对于包管理器安装，`openclaw update` 会先解析目标包版本，然后再调用包管理器。即使已安装版本已经与目标一致，该命令仍会刷新全局包安装，然后执行插件同步、补全刷新和重启工作。这样可以确保已打包的 sidecar 和渠道所属的插件记录与已安装的 OpenClaw 构建保持一致。

## Git 检出副本流程

渠道：

- `stable`：检出最新的非 beta tag，然后 build + doctor。
- `beta`：优先选择最新的 `-beta` tag，但如果 beta 缺失或更旧，则回退到最新的 stable tag。
- `dev`：检出 `main`，然后 fetch + rebase。

高级流程：

1. 需要一个干净的工作树（没有未提交的更改）。
2. 切换到所选渠道（tag 或 branch）。
3. 获取上游更新（仅 `dev`）。
4. 仅 `dev`：在临时工作树中执行预检 lint + TypeScript build；如果最新提交失败，则最多回退 10 个提交，以找到最新一个可干净构建的提交。
5. 变基到所选提交之上（仅 `dev`）。
6. 使用仓库的包管理器安装依赖。对于 pnpm 检出副本，更新器会按需引导 `pnpm`（优先通过 `corepack`，然后使用临时的 `npm install pnpm@10` 作为回退），而不是在 pnpm workspace 中运行 `npm run build`。
7. build，并构建 Control UI。
8. 运行 `openclaw doctor`，作为最终的“安全更新”检查。
9. 将插件同步到当前活动渠道（`dev` 使用内置插件；`stable`/`beta` 使用 npm），并更新通过 npm 安装的插件。

如果一个精确固定版本的 npm 插件更新解析到的构件，其完整性与已存储的安装记录不同，`openclaw update` 会中止该插件构件更新，而不是安装它。只有在确认你信任这个新构件之后，才应显式重新安装或更新该插件。

更新后的插件同步失败会导致更新结果失败，并停止后续的重启工作。修复插件安装/更新错误后，再重新运行 `openclaw update`。

如果 pnpm 引导仍然失败，更新器现在会提前停止，并报告一个特定于包管理器的错误，而不是尝试在检出副本中运行 `npm run build`。

## `--update` 简写

`openclaw --update` 会重写为 `openclaw update`（对 shell 和启动脚本很有用）。

## 相关内容

- `openclaw doctor`（在 git 检出副本上会先提供运行更新的选项）
- [开发渠道](/zh-CN/install/development-channels)
- [更新](/zh-CN/install/updating)
- [CLI 参考](/zh-CN/cli)
