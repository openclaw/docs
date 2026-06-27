---
read_when:
    - 你想安全地更新源代码检出
    - 你正在调试 `openclaw update` 输出或选项
    - 你需要了解 `--update` 简写行为
summary: '`openclaw update` 的 CLI 参考（相对安全的源更新 + Gateway 网关自动重启）'
title: 更新
x-i18n:
    generated_at: "2026-06-27T01:44:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3503e1cd15baa4d4f6c26734b37556831c612f1da0da5ccfe7bcde35b9be64b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

安全更新 OpenClaw，并在 stable/beta/dev 渠道之间切换。

如果你通过 **npm/pnpm/bun** 安装（全局安装，没有 git 元数据），
更新会通过 [更新](/zh-CN/install/updating) 中的包管理器流程进行。

## 用法

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

## 选项

- `--no-restart`：成功更新后跳过重启 Gateway 网关服务。会重启 Gateway 网关的包管理器更新，会在命令成功前验证重启后的服务报告预期的更新版本。
- `--channel <stable|beta|dev>`：设置更新渠道（git + npm；持久化到配置中）。
- `--tag <dist-tag|version|spec>`：仅为本次更新覆盖包目标。对于包安装，`main` 映射到 `github:openclaw/openclaw#main`；GitHub/git 源规范会先打包到临时 tarball，再执行分阶段的全局 npm 安装。
- `--dry-run`：预览计划的更新操作（渠道/标签/目标/重启流程），不写入配置、不安装、不同步插件，也不重启。
- `--json`：打印机器可读的 `UpdateRunResult` JSON，包括核心更新成功后存在损坏或无法加载的托管插件需要修复时的
  `postUpdate.plugins.warnings`、插件没有 beta 发布时的 beta 渠道插件回退详情，以及更新后插件同步期间检测到 npm 插件工件漂移时的 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每个步骤的超时时间（默认 1800 秒）。
- `--yes`：跳过确认提示（例如降级确认）。
- `--acknowledge-clawhub-risk`：在查看社区 ClawHub 信任警告后，允许更新后插件同步在没有交互式提示的情况下继续。没有此选项时，当 OpenClaw 无法提示时，会跳过有风险的社区 ClawHub 插件发布并保持不变。官方 ClawHub 包和内置 OpenClaw 插件源会绕过此发布信任提示。

`openclaw update` 没有 `--verbose` 标志。使用 `--dry-run` 预览计划的渠道/标签/安装/重启操作，使用 `--json` 获取机器可读结果；如果只需要渠道和可用性详情，请使用 `openclaw update status --json`。如果你正在调试更新前后的 Gateway 网关日志，控制台详细程度和文件日志级别是分开的：Gateway 网关 `--verbose` 会影响终端/WebSocket 输出，而文件日志需要在配置中设置 `logging.level: "debug"` 或 `"trace"`。参见 [Gateway 网关日志](/zh-CN/gateway/logging)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，会禁用会变更状态的 `openclaw update` 运行。请改为更新此安装的 Nix 源或 flake 输入；对于 nix-openclaw，请使用 Agent 优先的 [快速开始](https://github.com/openclaw/nix-openclaw#quick-start)。`openclaw update status` 和 `openclaw update --dry-run` 仍保持只读。
</Note>

<Warning>
降级需要确认，因为较旧版本可能会破坏配置。
</Warning>

## `update status`

显示活动更新渠道 + git 标签/分支/SHA（用于源码 checkout），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项：

- `--json`：打印机器可读的状态 JSON。
- `--timeout <seconds>`：检查超时时间（默认 3 秒）。

## `update repair`

在核心包已经变更但后续修复工作没有干净完成时，重新运行更新最终化。这是受支持的恢复路径，适用于 `openclaw update` 已安装新的核心包，但核心后插件同步、托管 npm 插件元数据、注册表刷新或 Doctor 修复仍需要收敛的情况。

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

选项：

- `--channel <stable|beta|dev>`：在修复前持久化更新渠道，并针对该渠道运行插件收敛。
- `--json`：打印机器可读的最终化 JSON。
- `--timeout <seconds>`：修复步骤超时时间（默认 `1800`）。
- `--yes`：跳过确认提示。
- `--acknowledge-clawhub-risk`：在查看社区 ClawHub 信任警告后，允许修复期间的插件收敛在没有交互式提示的情况下继续。官方 ClawHub 包和内置 OpenClaw 插件源会绕过此发布信任提示。
- `--no-restart`：为与 update 命令保持一致而接受；repair 永远不会重启 Gateway 网关。

`openclaw update repair` 会运行 `openclaw doctor --fix`，重新加载修复后的配置和安装记录，为活动更新渠道同步已跟踪插件，更新托管 npm 插件安装，修复缺失的已配置插件载荷，刷新插件注册表，并写入收敛后的安装记录元数据。它不会安装新的核心包，也不会重启 Gateway 网关。

## `update wizard`

用于选择更新渠道并确认更新后是否重启 Gateway 网关的交互式流程（默认重启）。如果你在没有 git checkout 的情况下选择 `dev`，它会提出创建一个 checkout。

选项：

- `--timeout <seconds>`：每个更新步骤的超时时间（默认 `1800`）

## 它会做什么

当你显式切换渠道（`--channel ...`）时，OpenClaw 也会保持安装方法一致：

- `dev` → 确保存在 git checkout（默认：`~/openclaw`；设置了 `OPENCLAW_HOME` 时为 `$OPENCLAW_HOME/openclaw`；可用 `OPENCLAW_GIT_DIR` 覆盖），
  更新它，并从该 checkout 安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm dist-tag `beta`，但当 beta 缺失或早于当前 stable 发布时回退到 `latest`。

Gateway 网关核心自动更新器（通过配置启用时）会在实时 Gateway 网关请求处理器之外启动 CLI 更新路径。控制平面 `update.run` 包管理器更新和受管 git-checkout 更新也使用托管服务交接，而不是在实时 Gateway 网关进程内替换包树或重建 `dist/`。Gateway 网关会启动一个分离的 helper、退出，然后该 helper 在 Gateway 网关进程树之外运行常规的 `openclaw update --yes --json` CLI 路径。如果该交接不可用，`update.run` 会返回包含安全 shell 命令的结构化响应，供你手动运行。

对于包管理器安装，`openclaw update` 会在调用包管理器之前解析目标包版本。npm 全局安装使用分阶段安装：OpenClaw 将新包安装到临时 npm 前缀，在那里验证打包的 `dist` 清单，然后将该干净包树交换到真实的全局前缀。如果验证失败，更新后 Doctor、插件同步和重启工作不会从可疑树运行。即使已安装版本已经匹配目标，命令也会刷新全局包安装，然后运行插件同步、核心命令补全刷新和重启工作。这会让打包的 sidecar 和渠道拥有的插件记录与已安装的 OpenClaw 构建保持一致，同时将完整插件命令补全重建留给显式的 `openclaw completion --write-state` 运行。

当本地托管 Gateway 网关服务已安装且启用重启时，包管理器和 git-checkout 更新会在替换包树或变更 checkout/构建输出之前停止正在运行的服务。随后更新器会从更新后的安装刷新服务元数据，重启服务，并在报告 `Gateway: restarted and verified.` 之前验证重启后的 Gateway 网关。包管理器更新还会验证重启后的 Gateway 网关报告预期的包版本；git-checkout 更新会在重建后验证 Gateway 网关健康和服务就绪状态。在 macOS 上，更新后检查还会验证 LaunchAgent 已为活动配置文件加载/运行，并且配置的 loopback 端口健康。如果 plist 已安装但 launchd 未监管它，OpenClaw 会自动重新引导 LaunchAgent，然后重新运行健康/版本/渠道就绪检查。全新引导会直接加载 RunAtLoad 作业，因此更新恢复不会立即对新启动的 Gateway 网关执行 `kickstart -k`。如果 Gateway 网关仍无法变为健康，命令会以非零状态退出，并打印重启日志路径，以及明确的重启、重新安装和包回滚说明。如果无法运行重启，命令会打印 `Gateway: restart skipped (...)` 或 `Gateway: restart failed: ...`，并附带手动 `openclaw gateway restart` 提示。使用 `--no-restart` 时，仍会执行包替换或 git 重建，但托管服务不会停止或重启，因此正在运行的 Gateway 网关可能会继续使用旧代码，直到你手动重启它。

### 控制平面响应结构

当通过 Gateway 网关控制平面在包管理器安装或受监管的 git checkout 上调用 `update.run` 时，处理器会将交接启动与 Gateway 网关退出后继续运行的 CLI 更新分开报告：

- `ok: true`、`result.status: "skipped"`、
  `result.reason: "managed-service-handoff-started"` 和
  `handoff.status: "started"` 表示 Gateway 网关已创建托管服务交接，并安排自身重启，以便分离的 helper 可以在实时服务进程之外运行
  `openclaw update --yes --json`。
- `ok: false`、`result.reason: "managed-service-handoff-unavailable"` 和
  `handoff.status: "unavailable"` 表示 OpenClaw 找不到用于安全交接的监管服务边界和持久服务身份。例如，systemd 交接需要 OpenClaw 单元身份（`OPENCLAW_SYSTEMD_UNIT`），而不仅是环境中的 systemd 进程标记。响应包含 `handoff.command`，即需要在 Gateway 网关之外运行的 shell 命令。
- `ok: false`、`result.reason: "managed-service-handoff-failed"` 表示 Gateway 网关尝试创建交接，但无法启动分离的 helper。

`sentinel` 载荷仍会在 Gateway 网关退出前写入，CLI 交接会在托管服务重启健康检查完成后更新同一个重启 sentinel。在交接期间，sentinel 可以携带 `stats.reason: "restart-health-pending"`，且没有成功 continuation；重启后的 Gateway 网关会继续轮询它，并且只在 CLI 已验证服务健康并用最终 `ok` 结果重写 sentinel 后触发 continuation。`openclaw status` 和 `openclaw status --all` 会在该 sentinel 待处理或失败时显示 `Update restart` 行，而 `update.status` 会刷新并返回最新 sentinel。

## Git checkout 流程

### 渠道选择

- `stable`：checkout 最新的非 beta 标签，然后构建并运行 Doctor。
- `beta`：优先使用最新的 `-beta` 标签，但当 beta 缺失或更旧时回退到最新 stable 标签。
- `dev`：checkout `main`，然后 fetch 并 rebase。

### 更新步骤

<Steps>
  <Step title="验证干净的工作树">
    要求没有未提交的更改。
  </Step>
  <Step title="切换渠道">
    切换到所选渠道（标签或分支）。
  </Step>
  <Step title="拉取上游">
    仅 dev。
  </Step>
  <Step title="预检构建（仅 dev）">
    在临时工作树中运行 TypeScript 构建。如果 tip 失败，会向前回溯最多 10 个提交，以找到最新的可构建提交。设置 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` 也会在此预检期间运行 lint；lint 会以受限的串行模式运行，因为用户更新主机通常比 CI 运行器更小。
  </Step>
  <Step title="变基">
    变基到所选提交（仅 dev）。
  </Step>
  <Step title="安装依赖">
    使用仓库的包管理器。对于 pnpm 检出，更新器会按需引导 `pnpm`（先通过 `corepack`，然后临时回退到 `npm install pnpm@11`），而不是在 pnpm 工作区内运行 `npm run build`。
  </Step>
  <Step title="构建 Control UI">
    构建 Gateway 网关和 Control UI。
  </Step>
  <Step title="运行 Doctor">
    `openclaw doctor` 作为最终的安全更新检查运行。
  </Step>
  <Step title="同步插件">
    将插件同步到活动渠道。dev 使用内置插件；stable 和 beta 使用 npm。更新已跟踪的插件安装。
  </Step>
</Steps>

在 beta 更新渠道上，跟随默认/latest 线路的已跟踪 npm 和 ClawHub 插件安装会先尝试插件的 `@beta` 版本。如果插件没有 beta 版本，OpenClaw 会回退到已记录的默认/latest 规格，并将其报告为警告。对于 npm 插件，当 beta 包存在但安装验证失败时，OpenClaw 也会回退。这些插件回退警告不会导致核心更新失败。精确版本和显式标签不会被重写。

<Warning>
如果精确固定的 npm 插件更新解析到的构件完整性与已存储的安装记录不同，`openclaw update` 会中止该插件构件更新，而不是安装它。仅在验证你信任新构件后，才显式重新安装或更新该插件。
</Warning>

<Note>
如果更新后插件同步失败仅限于某个托管插件，并且同步路径可以绕过它（例如非必要插件的 npm registry 无法访问），则会在核心更新成功后作为警告报告。JSON 结果会保留顶层更新 `status: "ok"`，并报告 `postUpdate.plugins.status: "warning"`，同时给出 `openclaw update repair` 和 `openclaw plugins inspect <id> --runtime --json` 指引。意外的更新器或同步异常仍会导致更新结果失败。修复插件安装或更新错误，然后重新运行 `openclaw update repair`。

在逐插件同步步骤之后，`openclaw update` 会在 Gateway 网关重启前运行强制的**核心后收敛**流程：它会修复缺失的已配置插件载荷，验证磁盘上每条_活动_跟踪安装记录，并静态验证其 `package.json` 可解析（以及任何显式声明的 `main` 存在）。此流程的失败，以及无效的 OpenClaw 配置快照，会返回 `postUpdate.plugins.status: "error"` 并将顶层更新 `status` 翻转为 `"error"`，因此 `openclaw update` 会以非零状态退出，并且 Gateway 网关_不会_在插件集未经验证的情况下重启。错误包含结构化的 `postUpdate.plugins.warnings[].guidance` 行，指向 `openclaw update repair` 和 `openclaw plugins inspect <id> --runtime --json` 以便后续处理。已禁用的插件条目，以及未链接可信来源的官方同步目标记录，会在这里跳过，这与缺失载荷检查使用的 `skipDisabledPlugins` 策略一致，因此陈旧的已禁用插件记录不会阻止其他有效更新。

更新后的 Gateway 网关启动时，插件加载仅用于验证：启动不会运行包管理器，也不会修改依赖树。包管理器的 `update.run` 重启会交给 CLI 托管服务路径，因此包替换发生在旧 Gateway 网关进程之外，并由服务健康检查决定是否可以将更新报告为完成。

如果 pnpm 引导仍然失败，更新器会提前停止并返回包管理器特定错误，而不是在检出中尝试 `npm run build`。
</Note>

## `--update` 简写

`openclaw --update` 会重写为 `openclaw update`（对 shell 和启动器脚本很有用）。

## 相关

- `openclaw doctor`（在 git 检出上会提议先运行更新）
- [开发渠道](/zh-CN/install/development-channels)
- [更新](/zh-CN/install/updating)
- [CLI 参考](/zh-CN/cli)
