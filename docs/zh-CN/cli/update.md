---
read_when:
    - 你想要安全地更新源代码检出
    - 你正在调试 `openclaw update` 输出或选项
    - 你需要了解 `--update` 简写行为
summary: CLI 参考：`openclaw update`（较安全的源更新 + Gateway 网关自动重启）
title: 更新
x-i18n:
    generated_at: "2026-07-05T01:55:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe972cf9effb9df8846ab9b3da662350dcc965ff2e58a8d5dabf1fd42be88b4
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

安全更新 OpenClaw，并在 stable/extended-stable/beta/dev 频道之间切换。

如果你通过 **npm/pnpm/bun** 安装（全局安装，无 git 元数据），
更新会通过 [更新](/zh-CN/install/updating) 中的软件包管理器流程进行。

## 用法

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel extended-stable
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

- `--no-restart`：成功更新后跳过重启 Gateway 网关服务。会重启 Gateway 网关的软件包管理器更新会在命令成功前验证重启后的服务报告了预期的更新版本。
- `--channel <stable|extended-stable|beta|dev>`：设置更新频道，并在核心更新成功后持久保存。Extended-stable 仅适用于软件包。
- `--tag <dist-tag|version|spec>`：仅为本次更新覆盖软件包目标。它不能与有效的 `extended-stable` 频道组合使用，因为该频道必须使用已验证的精确目标。对于其他软件包安装，`main` 会映射到 `github:openclaw/openclaw#main`；GitHub/git 源规范会先打包到临时 tarball，再执行分阶段的全局 npm 安装。
- `--dry-run`：预览计划的更新操作（频道/标签/目标/重启流程），不写入配置、不安装、不同步插件，也不重启。
- `--json`：打印机器可读的 `UpdateRunResult` JSON，包括核心更新成功后损坏或无法加载的托管插件需要修复时的 `postUpdate.plugins.warnings`、插件没有 beta 版本时的 beta 频道插件回退详情，以及更新后插件同步期间检测到 npm 插件工件漂移时的 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每步超时时间（默认 1800 秒）。
- `--yes`：跳过确认提示（例如降级确认）。
- `--acknowledge-clawhub-risk`：在查看社区 ClawHub 信任警告后，允许更新后插件同步在没有交互式提示的情况下继续。没有此选项时，如果 OpenClaw 无法提示，存在风险的社区 ClawHub 插件版本会被跳过并保持不变。官方 ClawHub 软件包和内置 OpenClaw 插件源会绕过此版本信任提示。

`openclaw update` 没有 `--verbose` 标志。使用 `--dry-run` 预览计划的频道/标签/安装/重启操作，使用 `--json` 获取机器可读结果；如果只需要频道和可用性详情，则使用 `openclaw update status --json`。如果你正在调试更新前后的 Gateway 网关日志，控制台详细程度和文件日志级别是分开的：Gateway 网关 `--verbose` 会影响终端/WebSocket 输出，而文件日志需要在配置中设置 `logging.level: "debug"` 或 `"trace"`。参见 [Gateway 网关日志](/zh-CN/gateway/logging)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，会修改状态的 `openclaw update` 运行会被禁用。请改为更新此安装的 Nix 源或 flake 输入；对于 nix-openclaw，请使用智能体优先的 [快速开始](https://github.com/openclaw/nix-openclaw#quick-start)。`openclaw update status` 和 `openclaw update --dry-run` 仍保持只读。
</Note>

<Warning>
降级需要确认，因为较旧版本可能会破坏配置。
</Warning>

## `update status`

显示当前更新频道 + git 标签/分支/SHA（适用于源码检出），以及更新可用性。

对于 extended-stable 软件包安装，status 会执行与前台更新相同的公共选择器和精确软件包验证。当已安装版本较新时，它可以报告 `ahead of extended-stable`。JSON 失败包含 `registry.reason`（`selector_missing`、`selector_query_failed`、`exact_package_mismatch` 或 `unsupported_git_channel`）。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项：

- `--json`：打印机器可读的状态 JSON。
- `--timeout <seconds>`：检查超时时间（默认 3 秒）。

## `update repair`

当核心软件包已经更改但后续修复工作未干净完成时，重新运行更新最终化。这是受支持的恢复路径，适用于 `openclaw update` 已安装新的核心软件包，但核心后的插件同步、托管 npm 插件元数据、注册表刷新或 Doctor 修复仍需要收敛的情况。

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

选项：

- `--channel <stable|extended-stable|beta|dev>`：在修复前持久保存核心更新频道。对于 extended-stable，插件收敛会临时以 stable/latest 插件线为目标。在 Git 检出中，extended-stable 修复会被拒绝，且不会更改配置。
- `--json`：打印机器可读的最终化 JSON。
- `--timeout <seconds>`：修复步骤超时时间（默认 `1800`）。
- `--yes`：跳过确认提示。
- `--acknowledge-clawhub-risk`：在查看社区 ClawHub 信任警告后，允许修复期间的插件收敛在没有交互式提示的情况下继续。官方 ClawHub 软件包和内置 OpenClaw 插件源会绕过此版本信任提示。
- `--no-restart`：为与 update 命令保持一致而接受；repair 从不重启 Gateway 网关。

`openclaw update repair` 会运行 `openclaw doctor --fix`，重新加载已修复的配置和安装记录，为当前更新频道同步跟踪的插件，更新托管 npm 插件安装，修复缺失的已配置插件载荷，刷新插件注册表，并写入已收敛的安装记录元数据。它不会安装新的核心软件包，也不会重启 Gateway 网关。

## `update wizard`

用于选择更新频道并确认更新后是否重启 Gateway 网关的交互式流程（默认会重启）。如果你在没有 git 检出的情况下选择 `dev`，它会提示创建一个检出。

选项：

- `--timeout <seconds>`：每个更新步骤的超时时间（默认 `1800`）

## 它会做什么

当你显式切换频道（`--channel ...`）时，OpenClaw 也会保持安装方式一致：

- `dev` → 确保存在 git 检出（默认：`~/openclaw`，或设置 `OPENCLAW_HOME` 时为 `$OPENCLAW_HOME/openclaw`；可用 `OPENCLAW_GIT_DIR` 覆盖），更新它，并从该检出安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `extended-stable` → 解析公共 npm `extended-stable` 选择器，验证精确选中的软件包，并安装该精确版本。它不会回退到其他选择器，并且 Git 检出会被拒绝。
- `beta` → 优先使用 npm dist-tag `beta`，但当 beta 缺失或早于当前稳定版本时回退到 `latest`。

Gateway 网关核心自动更新器（通过配置启用时）会在实时 Gateway 网关请求处理器之外启动 CLI 更新路径。控制平面 `update.run` 软件包管理器更新和受监督的 git 检出更新也会使用托管服务交接，而不是在实时 Gateway 网关进程内替换软件包树或重建 `dist/`。Gateway 网关会启动一个分离的辅助进程并退出，然后辅助进程从 Gateway 网关进程树外部运行常规的 `openclaw update --yes --json` CLI 路径。如果该交接不可用，`update.run` 会返回结构化响应，其中包含可手动运行的安全 shell 命令。

Extended-stable 会被有意排除在启动检查和后台自动更新调度之外。显式前台更新、带有已存储 `update.channel: "extended-stable"` 的裸前台更新、按需状态，以及托管 Gateway 网关交接仍受支持。

对于软件包管理器安装，`openclaw update` 会在调用软件包管理器前解析目标软件包版本。npm 全局安装使用分阶段安装：OpenClaw 会将新软件包安装到临时 npm 前缀，验证其中打包的 `dist` 清单，然后将该干净的软件包树交换到真实的全局前缀。如果验证失败，更新后 Doctor、插件同步和重启工作不会从可疑树运行。即使已安装版本已经匹配目标，命令也会刷新全局软件包安装，然后运行插件同步、核心命令补全刷新和重启工作。这会让打包的 sidecar 和频道拥有的插件记录与已安装的 OpenClaw 构建保持一致，同时将完整插件命令补全重建留给显式的 `openclaw completion --write-state` 运行。

extended-stable 核心更新成功后，核心后的插件完整性和收敛仍会运行，但官方插件会临时以 stable/latest 线为目标。OpenClaw 在此版本中不会查询插件 `@extended-stable` 选择器。

当安装了本地托管 Gateway 网关服务且已启用重启时，软件包管理器和 git 检出更新会在替换软件包树或修改检出/构建输出前停止正在运行的服务。随后更新器会从更新后的安装刷新服务元数据，重启服务，并在报告 `Gateway: restarted and verified.` 前验证已重启的 Gateway 网关。软件包管理器更新还会验证已重启的 Gateway 网关报告了预期的软件包版本；git 检出更新会在重建后验证 Gateway 网关健康和服务就绪状态。在 macOS 上，更新后检查还会验证 LaunchAgent 已为当前配置文件加载/运行，并且配置的 loopback 端口健康。如果 plist 已安装但 launchd 未监督它，OpenClaw 会自动重新引导 LaunchAgent，然后重新运行健康/版本/频道就绪检查。全新引导会直接加载 RunAtLoad 作业，因此更新恢复不会立即对新生成的 Gateway 网关执行 `kickstart -k`。如果 Gateway 网关仍未变得健康，命令会以非零状态退出，并打印重启日志路径以及明确的重启、重新安装和软件包回滚说明。如果无法执行重启，命令会打印 `Gateway: restart skipped (...)` 或 `Gateway: restart failed: ...`，并附带手动 `openclaw gateway restart` 提示。使用 `--no-restart` 时，仍会执行软件包替换或 git 重建，但托管服务不会被停止或重启，因此正在运行的 Gateway 网关可能会继续使用旧代码，直到你手动重启它。

### 控制平面响应形状

当通过 Gateway 网关控制平面对软件包管理器安装或受监督的 git 检出调用 `update.run` 时，处理器会将交接启动与 Gateway 网关退出后继续运行的 CLI 更新分开报告：

- `ok: true`、`result.status: "skipped"`、`result.reason: "managed-service-handoff-started"` 和 `handoff.status: "started"` 表示 Gateway 网关已创建托管服务交接，并调度自身重启，以便分离的辅助进程可以在实时服务进程之外运行 `openclaw update --yes --json`。
- `ok: false`、`result.reason: "managed-service-handoff-unavailable"` 和 `handoff.status: "unavailable"` 表示 OpenClaw 无法找到用于安全交接的监督服务边界和持久服务身份。例如，systemd 交接需要 OpenClaw 单元身份（`OPENCLAW_SYSTEMD_UNIT`），而不只是环境中的 systemd 进程标记。响应包含 `handoff.command`，即需要从 Gateway 网关外部运行的 shell 命令。
- `ok: false`、`result.reason: "managed-service-handoff-failed"` 表示 Gateway 网关尝试创建交接，但无法生成分离的辅助进程。

`sentinel` 载荷仍会在 Gateway 网关退出前写入，并且 CLI
交接会在托管服务重启健康检查完成后更新同一个重启哨兵。在交接期间，哨兵可以携带
`stats.reason: "restart-health-pending"`，且没有成功 continuation；重启后的 Gateway 网关会持续轮询它，并且只会在 CLI
验证服务健康并用最终 `ok` 结果重写哨兵后触发 continuation。`openclaw status` 和 `openclaw status --all` 会在该哨兵处于待处理或失败状态时显示一行 `Update restart`，并且 `update.status` 会刷新并返回最新哨兵。

## Git 检出流程

### 频道选择

- `stable`：检出最新的非 beta 标签，然后构建并运行 doctor。
- `beta`：优先使用最新的 `-beta` 标签，但当 beta 缺失或更旧时回退到最新 stable 标签。
- `dev`：检出 `main`，然后 fetch 并 rebase。
- `extended-stable`：Git 检出不支持；不会发生检出变更。

### 更新步骤

<Steps>
  <Step title="验证干净的工作树">
    要求没有未提交的更改。
  </Step>
  <Step title="切换频道">
    切换到所选频道（标签或分支）。
  </Step>
  <Step title="拉取上游">
    仅 dev。
  </Step>
  <Step title="预检构建（仅 dev）">
    在临时工作树中运行 TypeScript 构建。如果 tip 失败，会向前回退最多 10 个提交，以查找最新的可构建提交。设置 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` 可在此预检期间同时运行 lint；lint 会以受限的串行模式运行，因为用户更新主机通常比 CI runner 更小。
  </Step>
  <Step title="Rebase">
    Rebase 到所选提交（仅 dev）。
  </Step>
  <Step title="安装依赖">
    使用仓库包管理器。对于 pnpm 检出，更新器会按需引导 `pnpm`（先通过 `corepack`，然后回退到临时 `npm install pnpm@11`），而不是在 pnpm 工作区内运行 `npm run build`。
  </Step>
  <Step title="构建 Control UI">
    构建 Gateway 网关和 Control UI。
  </Step>
  <Step title="运行 doctor">
    `openclaw doctor` 作为最终安全更新检查运行。
  </Step>
  <Step title="同步插件">
    将插件同步到活动频道。Dev 使用内置插件；stable 和 beta 使用 npm。更新已跟踪的插件安装。
  </Step>
</Steps>

在 beta 更新频道上，遵循 default/latest 线的已跟踪 npm 和 ClawHub 插件安装会先尝试插件 `@beta` 版本。如果该插件没有 beta 版本，OpenClaw 会回退到记录的 default/latest 规格，并将其报告为警告。对于 npm 插件，当 beta 包存在但安装验证失败时，OpenClaw 也会回退。这些插件回退警告不会导致核心更新失败。精确版本和显式标签不会被重写。

<Warning>
如果精确固定的 npm 插件更新解析到的制品完整性与已存储的安装记录不同，`openclaw update` 会中止该插件制品更新，而不是安装它。只有在验证你信任新制品后，才应显式重新安装或更新该插件。
</Warning>

<Note>
更新后插件同步失败如果限定在托管插件范围内，且同步路径可以绕过（例如非必要插件的 npm registry 不可达），则会在核心更新成功后报告为警告。JSON 结果会保留顶层更新 `status: "ok"`，并报告 `postUpdate.plugins.status: "warning"`，同时给出 `openclaw update repair` 和 `openclaw plugins inspect <id> --runtime --json` 指引。意外的更新器或同步异常仍会使更新结果失败。修复插件安装或更新错误，然后重新运行 `openclaw update repair`。

在逐插件同步步骤之后，`openclaw update` 会在 Gateway 网关重启前运行强制性的**后核心收敛**流程：它会修复缺失的已配置插件载荷，验证磁盘上每条_活动_已跟踪安装记录，并静态验证其 `package.json` 可解析（以及任何显式声明的 `main` 存在）。此流程的失败以及无效的 OpenClaw 配置快照会返回 `postUpdate.plugins.status: "error"`，并将顶层更新 `status` 翻转为 `"error"`，因此 `openclaw update` 会以非零状态退出，且 Gateway 网关_不会_使用未经验证的插件集重启。该错误包含结构化的 `postUpdate.plugins.warnings[].guidance` 行，指向 `openclaw update repair` 和 `openclaw plugins inspect <id> --runtime --json` 以便后续处理。已禁用的插件条目，以及未关联到可信来源的官方同步目标记录会在此处跳过，这与缺失载荷检查所用的 `skipDisabledPlugins` 策略一致，因此过时的已禁用插件记录无法阻止原本有效的更新。

更新后的 Gateway 网关启动时，插件加载仅执行验证：启动不会运行包管理器，也不会变更依赖树。包管理器 `update.run`
重启会交给 CLI 托管服务路径，因此包替换发生在旧 Gateway 网关进程之外，并由服务健康检查决定是否可以将更新报告为完成。

如果 pnpm 引导仍然失败，更新器会提前停止并给出特定于包管理器的错误，而不是尝试在检出内运行 `npm run build`。
</Note>

## `--update` 简写

`openclaw --update` 会重写为 `openclaw update`（对 shell 和启动器脚本有用）。

## 相关

- `openclaw doctor`（在 git 检出上会提议先运行 update）
- [开发频道](/zh-CN/install/development-channels)
- [更新](/zh-CN/install/updating)
- [CLI 参考](/zh-CN/cli)
