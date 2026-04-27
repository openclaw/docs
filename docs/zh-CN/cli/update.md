---
read_when:
    - 你想安全地更新一个源代码检出副本
    - 你需要理解 `--update` 简写行为
summary: '`openclaw update` 的 CLI 参考（相对安全的源更新 + Gateway 网关自动重启）'
title: 更新
x-i18n:
    generated_at: "2026-04-27T04:33:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e25774db66e013dd9f1727f3d917719cd5346d2bc8e91bec2802f64315fecd0
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

安全地更新 OpenClaw，并在 stable/beta/dev 渠道之间切换。

如果你通过 **npm/pnpm/bun** 安装（全局安装，没有 git 元数据），更新将通过 [更新](/zh-CN/install/updating) 中的软件包管理器流程进行。

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
- `--tag <dist-tag|version|spec>`：仅为本次更新覆盖软件包目标。对于软件包安装，`main` 会映射到 `github:openclaw/openclaw#main`。
- `--dry-run`：预览计划中的更新操作（渠道/标签/目标/重启流程），但不写入配置、不安装、不同步插件，也不重启。
- `--json`：打印机器可读的 `UpdateRunResult` JSON，包括当在更新后插件同步期间检测到 npm 插件制品漂移时的 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每个步骤的超时时间（默认 1800 秒）。
- `--yes`：跳过确认提示（例如降级确认）。

<Warning>
降级需要确认，因为旧版本可能会破坏配置。
</Warning>

## `update status`

显示当前激活的更新渠道 + git 标签/分支/SHA（适用于源代码检出副本），以及更新可用性。

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

- `--timeout <seconds>`：每个更新步骤的超时时间（默认 `1800`）

## 它的作用

当你显式切换渠道（`--channel ...`）时，OpenClaw 还会保持安装方式一致：

- `dev` → 确保存在一个 git 检出副本（默认：`~/openclaw`，可通过 `OPENCLAW_GIT_DIR` 覆盖），更新该检出副本，并从该检出副本安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm 的 `beta` dist-tag，但当 beta 缺失或比当前 stable 发布版本更旧时，会回退到 `latest`。

Gateway 网关核心自动更新器（在配置中启用时）会复用这一路径进行更新。

对于软件包管理器安装，`openclaw update` 会在调用软件包管理器之前解析目标软件包版本。即使已安装版本已经与目标匹配，该命令仍会刷新全局软件包安装，然后执行插件同步、补全刷新和重启操作。这可以让打包的 sidecar 和渠道所拥有的插件记录与已安装的 OpenClaw 构建保持一致。

## Git 检出副本流程

### 渠道选择

- `stable`：检出最新的非 beta 标签，然后构建并运行 doctor。
- `beta`：优先选择最新的 `-beta` 标签，但如果 beta 缺失或更旧，则回退到最新的 stable 标签。
- `dev`：检出 `main`，然后获取更新并执行 rebase。

### 更新步骤

<Steps>
  <Step title="验证工作区干净">
    要求没有未提交的更改。
  </Step>
  <Step title="切换渠道">
    切换到所选渠道（标签或分支）。
  </Step>
  <Step title="获取上游更新">
    仅适用于 dev。
  </Step>
  <Step title="预检构建（仅 dev）">
    在临时 worktree 中运行 lint 和 TypeScript 构建。如果最新提交失败，会最多回退 10 个提交，以找到最新一个能干净构建的提交。
  </Step>
  <Step title="Rebase">
    Rebase 到所选提交之上（仅适用于 dev）。
  </Step>
  <Step title="安装依赖">
    使用仓库的软件包管理器。对于 pnpm 检出副本，更新器会按需引导 `pnpm`（优先通过 `corepack`，然后回退到临时执行 `npm install pnpm@10`），而不是在 pnpm workspace 中运行 `npm run build`。
  </Step>
  <Step title="构建 Control UI">
    构建 gateway 和 Control UI。
  </Step>
  <Step title="运行 doctor">
    `openclaw doctor` 会作为最终的安全更新检查运行。
  </Step>
  <Step title="同步插件">
    将插件同步到当前激活的渠道。dev 使用内置插件；stable 和 beta 使用 npm。会更新通过 npm 安装的插件。
  </Step>
</Steps>

<Warning>
如果某个精确固定版本的 npm 插件更新解析出的制品，其完整性与已存储的安装记录不同，`openclaw update` 会中止该插件制品更新，而不是安装它。只有在确认你信任这个新制品之后，才显式重新安装或更新该插件。
</Warning>

<Note>
更新后的插件同步失败会导致更新结果失败，并停止后续重启操作。请修复插件安装或更新错误，然后重新运行 `openclaw update`。

如果 pnpm 引导仍然失败，更新器会提前停止，并给出特定于软件包管理器的错误，而不是尝试在检出副本内运行 `npm run build`。
</Note>

## `--update` 简写

`openclaw --update` 会被重写为 `openclaw update`（对于 shell 和启动脚本很有用）。

## 相关内容

- `openclaw doctor`（在 git 检出副本上会先提供运行更新）
- [开发渠道](/zh-CN/install/development-channels)
- [更新](/zh-CN/install/updating)
- [CLI 参考](/zh-CN/cli)
