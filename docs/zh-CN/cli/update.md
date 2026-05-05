---
read_when:
    - 你想安全地更新源码检出副本
    - 你正在调试 `openclaw update` 的输出或选项
    - 你需要了解 `--update` 的简写行为
summary: '`openclaw update` 的 CLI 参考（相对安全的源更新 + Gateway 网关自动重启）'
title: 更新
x-i18n:
    generated_at: "2026-05-05T23:10:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eff9aeaecd4bf4eaa98fa511a3b9ebaedaf5872ff9407398665f2a8c2ab7d9
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

安全更新 OpenClaw，并在 stable/beta/dev 渠道之间切换。

如果你通过 **npm/pnpm/bun** 安装（全局安装，无 git 元数据），
更新会通过 [更新](/zh-CN/install/updating) 中的包管理器流程进行。

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

- `--no-restart`：成功更新后跳过重启 Gateway 网关服务。会重启 Gateway 网关的包管理器更新，会在命令成功前验证重启后的服务报告预期的已更新版本。
- `--channel <stable|beta|dev>`：设置更新渠道（git + npm；会持久化到配置中）。
- `--tag <dist-tag|version|spec>`：仅为本次更新覆盖包目标。对于包安装，`main` 映射到 `github:openclaw/openclaw#main`。
- `--dry-run`：预览计划的更新操作（渠道/标签/目标/重启流程），不会写入配置、安装、同步插件或重启。
- `--json`：打印机器可读的 `UpdateRunResult` JSON，包括核心更新成功后有损坏或无法卸载的托管插件需要修复时的
  `postUpdate.plugins.warnings`，以及更新后插件同步期间检测到 npm 插件工件漂移时的 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每个步骤的超时时间（默认 1800 秒）。
- `--yes`：跳过确认提示（例如降级确认）。

`openclaw update` 没有 `--verbose` 标志。使用 `--dry-run` 预览
计划的渠道/标签/安装/重启操作，使用 `--json` 获取机器可读结果，
当你只需要渠道和可用性详情时，使用 `openclaw update status --json`。
如果你正在调试更新期间的 Gateway 网关日志，控制台详细程度和文件日志级别是分开的：Gateway 网关 `--verbose` 影响
终端/WebSocket 输出，而文件日志需要在配置中设置 `logging.level: "debug"` 或
`"trace"`。参见 [Gateway 网关日志](/zh-CN/gateway/logging)。

<Warning>
降级需要确认，因为旧版本可能会破坏配置。
</Warning>

## `update status`

显示当前更新渠道 + git 标签/分支/SHA（用于源码 checkout），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项：

- `--json`：打印机器可读的状态 JSON。
- `--timeout <seconds>`：检查超时时间（默认 3 秒）。

## `update wizard`

用于选择更新渠道的交互式流程，并确认更新后是否重启 Gateway 网关
（默认会重启）。如果你选择 `dev` 但没有 git checkout，它会提议创建一个。

选项：

- `--timeout <seconds>`：每个更新步骤的超时时间（默认 `1800`）

## 它会做什么

当你显式切换渠道（`--channel ...`）时，OpenClaw 也会保持
安装方式一致：

- `dev` → 确保存在 git checkout（默认：`~/openclaw`，可用 `OPENCLAW_GIT_DIR` 覆盖），
  更新它，并从该 checkout 安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm dist-tag `beta`，但当 beta 缺失或比当前稳定版更旧时，
  回退到 `latest`。

Gateway 网关核心自动更新器（通过配置启用时）会在实时 Gateway 网关请求处理程序之外
启动 CLI 更新路径。控制平面的 `update.run` 包管理器
更新会在包替换后强制执行非延迟、无冷却的更新重启，
因为旧 Gateway 网关进程可能仍有内存中的分块指向
新包已移除的文件。

对于包管理器安装，`openclaw update` 会先解析目标包
版本，再调用包管理器。npm 全局安装使用分阶段
安装：OpenClaw 将新包安装到临时 npm 前缀中，在那里验证
打包的 `dist` 清单，然后把这个干净的包树替换到
真实的全局前缀中。如果验证失败，更新后 Doctor、插件同步和
重启工作不会从可疑的树中运行。即使已安装版本
已经匹配目标，命令也会刷新全局包安装，
然后运行插件同步、核心命令补全刷新和重启工作。这
会让打包的 sidecar 和渠道拥有的插件记录与
已安装的 OpenClaw 构建保持一致，同时把完整的插件命令补全重建留给
显式的 `openclaw completion --write-state` 运行。

当本地托管的 Gateway 网关服务已安装且启用了重启时，
包管理器更新会在替换包树之前停止正在运行的服务，
然后从更新后的安装刷新服务元数据，重启
服务，并在报告成功前验证重启后的 Gateway 网关报告预期版本。在 macOS 上，更新后检查还会验证 LaunchAgent
已为当前配置文件加载/运行，并且配置的 loopback 端口
健康。如果 plist 已安装但 launchd 没有监管它，OpenClaw
会自动重新 bootstrap LaunchAgent，然后重新运行
健康/版本/渠道就绪检查。全新 bootstrap 会直接加载 RunAtLoad
任务，因此更新恢复不会立即对新生成的 Gateway 网关执行 `kickstart -k`。
如果 Gateway 网关仍未变为健康，命令会以非零状态退出，
并打印重启日志路径以及明确的重启、重新安装和
包回滚说明。使用 `--no-restart` 时，
包替换仍会运行，但托管服务不会停止或
重启，因此正在运行的 Gateway 网关可能会继续使用旧代码，直到你手动重启它。

## Git checkout 流程

### 渠道选择

- `stable`：checkout 最新的非 beta 标签，然后构建并运行 Doctor。
- `beta`：优先使用最新的 `-beta` 标签，但当 beta 缺失或更旧时回退到最新稳定标签。
- `dev`：checkout `main`，然后 fetch 并 rebase。

### 更新步骤

<Steps>
  <Step title="Verify clean worktree">
    要求没有未提交的更改。
  </Step>
  <Step title="Switch channel">
    切换到选定渠道（标签或分支）。
  </Step>
  <Step title="Fetch upstream">
    仅 dev。
  </Step>
  <Step title="Preflight build (dev only)">
    在临时 worktree 中运行 TypeScript 构建。如果顶端提交失败，会向前回退最多 10 个提交，以找到最新可构建的提交。设置 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` 也会在该预检期间运行 lint；lint 会以受限的串行模式运行，因为用户更新主机通常比 CI runner 更小。
  </Step>
  <Step title="Rebase">
    rebase 到选定提交（仅 dev）。
  </Step>
  <Step title="Install dependencies">
    使用仓库包管理器。对于 pnpm checkout，更新器会按需 bootstrap `pnpm`（先通过 `corepack`，然后回退到临时 `npm install pnpm@10`），而不是在 pnpm workspace 内运行 `npm run build`。
  </Step>
  <Step title="Build Control UI">
    构建 Gateway 网关和 Control UI。
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` 作为最终安全更新检查运行。
  </Step>
  <Step title="Sync plugins">
    将插件同步到当前渠道。Dev 使用内置插件；stable 和 beta 使用 npm。更新已跟踪的插件安装。
  </Step>
</Steps>

在 beta 更新渠道上，遵循默认/latest 线的已跟踪 npm 和 ClawHub 插件安装
会先尝试插件 `@beta` 发布。如果插件没有
beta 发布，OpenClaw 会回退到记录的默认/latest spec。对于 npm
插件，当 beta 包存在但安装验证失败时，OpenClaw 也会回退。
精确版本和显式标签不会被重写。

<Warning>
如果精确固定的 npm 插件更新解析到的工件完整性与存储的安装记录不同，`openclaw update` 会中止该插件工件更新，而不是安装它。只有在验证你信任新工件后，才显式重新安装或更新该插件。
</Warning>

<Note>
更新后插件同步失败如果仅限于某个托管插件，会在核心更新成功后作为警告报告。JSON 结果会保持顶层更新 `status: "ok"`，并报告 `postUpdate.plugins.status: "warning"`，同时给出 `openclaw doctor --fix` 和 `openclaw plugins inspect <id> --runtime --json` 指引。意外的更新器或同步异常仍会使更新结果失败。修复插件安装或更新错误，然后重新运行 `openclaw doctor --fix` 或 `openclaw update`。

更新后的 Gateway 网关启动时，插件加载只做验证：启动不会运行包管理器或变异依赖树。包管理器 `update.run` 重启会在包树已替换后绕过正常的空闲延迟和重启冷却，因此旧进程无法继续惰性加载已移除的分块。

如果 pnpm bootstrap 仍然失败，更新器会提前停止并给出包管理器特定错误，而不是尝试在 checkout 内运行 `npm run build`。
</Note>

## `--update` 简写

`openclaw --update` 会重写为 `openclaw update`（对 shell 和启动器脚本有用）。

## 相关内容

- `openclaw doctor`（在 git checkout 上会提议先运行 update）
- [开发渠道](/zh-CN/install/development-channels)
- [更新](/zh-CN/install/updating)
- [CLI 参考](/zh-CN/cli)
