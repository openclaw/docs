---
read_when:
    - 你想安全地更新源代码检出版本
    - 你正在调试 `openclaw update` 输出或选项
    - 你需要理解 `--update` 简写行为
summary: '`openclaw update` 的 CLI 参考（相对安全的源更新 + Gateway 网关自动重启）'
title: 更新
x-i18n:
    generated_at: "2026-07-05T11:10:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c26f41b6931681dce351b82640535855e919888dc2cf6dea4bdb9937dcf139f8
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

更新 OpenClaw，并在 stable/extended-stable/beta/dev 频道之间切换。

如果你通过 **npm/pnpm/bun** 安装（全局安装，无 git 元数据），
更新会走 [更新](/zh-CN/install/updating) 中描述的包管理器流程。

## 使用方法

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

`openclaw --update` 会重写为 `openclaw update`（对 shell 和启动器脚本有用）。

## 选项

| 标志                                             | 描述                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | 成功更新后跳过重启 Gateway 网关服务。会重启的包管理器更新会先验证已重启的服务报告了预期版本，然后命令才会成功。                                                                                                                                                |
| `--channel <stable\|extended-stable\|beta\|dev>` | 设置更新频道，并在核心更新成功后持久保存。extended-stable 仅适用于包安装。                                                                                                                                                                                                                                            |
| `--tag <dist-tag\|version\|spec>`                | 仅为本次更新覆盖包目标。它不能与有效的 `extended-stable` 频道组合使用，因为该频道必须使用经过验证的精确目标。对于其他包安装，`main` 会映射到 `github:openclaw/openclaw#main`；GitHub/git 源规范会先打包成临时 tarball，再进行暂存的全局 npm 安装。 |
| `--dry-run`                                      | 预览计划操作（频道/标签/目标/重启流程），但不写入配置、不安装、不同步插件，也不重启。                                                                                                                                                                                                                |
| `--json`                                         | 打印机器可读的 `UpdateRunResult` JSON。当托管插件需要修复时包含 `postUpdate.plugins.warnings`，包含 beta 频道插件回退详情，并在更新后同步期间检测到 npm 插件制品漂移时包含 `postUpdate.plugins.integrityDrifts`。                                                                 |
| `--timeout <seconds>`                            | 每个步骤的超时。默认值为 `1800`。                                                                                                                                                                                                                                                                                                            |
| `--yes`                                          | 跳过确认提示（例如降级确认）。                                                                                                                                                                                                                                                                              |
| `--acknowledge-clawhub-risk`                     | 允许更新后插件同步在出现社区 ClawHub 信任警告时继续，而无需交互式提示。不使用该选项时，如果 OpenClaw 无法提示，存在风险的社区发布会被跳过并保持不变。官方 ClawHub 包和内置插件源会绕过此提示。                                                     |

没有 `--verbose` 标志。使用 `--dry-run` 预览计划操作，
使用 `--json` 获取机器可读结果，使用 `openclaw update status --json`
仅查看频道/可用性。Gateway 网关控制台详细程度（`--verbose`）和
文件日志级别（`logging.level: "debug"`/`"trace"`）是独立开关；请参阅
[Gateway 网关日志](/zh-CN/gateway/logging)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，会修改状态的 `openclaw update` 运行会被禁用。请改为更新此安装的 Nix 源或 flake 输入；对于 nix-openclaw，请使用 Agent 优先的[快速开始](https://github.com/openclaw/nix-openclaw#quick-start)。`openclaw update status` 和 `openclaw update --dry-run` 仍保持只读。
</Note>

<Warning>
降级需要确认，因为旧版本可能破坏配置。
</Warning>

## `update status`

显示活动更新频道、git 标签/分支/SHA（仅源代码检出），
以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| 标志                  | 默认值 | 描述                         |
| --------------------- | ------- | ----------------------------------- |
| `--json`              | `false` | 打印机器可读的状态 JSON。 |
| `--timeout <seconds>` | `3`     | 检查超时。                 |

对于 extended-stable 包安装，status 会执行与前台更新相同的公共选择器
和精确包验证。当已安装版本更新时，它可以报告
`ahead of extended-stable`。JSON 失败包含 `registry.reason`（`selector_missing`、`selector_query_failed`、
`exact_package_mismatch` 或 `unsupported_git_channel`）。

## `update repair`

在核心包已经变更但后续修复工作未干净完成后，重新运行更新收尾流程。
当 `openclaw update` 已安装新的核心包，但核心后的插件同步、
托管 npm 插件元数据、注册表刷新或 Doctor 修复未收敛时，
这是受支持的恢复路径。

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| 标志                                             | 描述                                                                                                                                                                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | 在修复前持久保存核心更新频道。对于 extended-stable，插件收敛会临时目标到 stable/latest 插件线。在 Git 检出上，extended-stable 修复会被拒绝且不会更改配置。 |
| `--json`                                         | 打印机器可读的收尾 JSON。                                                                                                                                                                              |
| `--timeout <seconds>`                            | 修复步骤的超时。默认值为 `1800`。                                                                                                                                                                              |
| `--yes`                                          | 跳过确认提示。                                                                                                                                                                                             |
| `--acknowledge-clawhub-risk`                     | 行为与 `openclaw update` 相同。                                                                                                                                                                                 |
| `--no-restart`                                   | 为保持一致而接受；repair 从不重启 Gateway 网关。                                                                                                                                                                |

`update repair` 会运行 `openclaw doctor --fix`，重新加载已修复的配置和
安装记录，为活动更新频道同步已跟踪插件，更新
托管 npm 插件安装，修复缺失的已配置插件载荷，
刷新插件注册表，并写入已收敛的安装记录元数据。
它不会安装新的核心包，也不会重启 Gateway 网关。

## `update wizard`

用于选择更新频道并确认随后是否重启
Gateway 网关的交互式流程（默认重启）。在没有 git
检出的情况下选择 `dev` 时，会提示创建一个检出。

| 标志                  | 默认值 | 描述                   |
| --------------------- | ------- | ----------------------------- |
| `--timeout <seconds>` | `1800`  | 每个更新步骤的超时。 |

## 它会做什么

显式切换频道（`--channel ...`）也会保持安装方式一致：

- `dev` -> 确保存在 git 检出（默认 `~/openclaw`，或在设置了
  `OPENCLAW_HOME` 时使用 `$OPENCLAW_HOME/openclaw`；可用
  `OPENCLAW_GIT_DIR` 覆盖），更新它，并从该检出安装全局 CLI。
- `stable` -> 使用 `latest` 从 npm 安装。
- `extended-stable` -> 解析公共 npm `extended-stable` 选择器，
  验证精确选中的包，并安装该精确版本。它
  不会回退到其他选择器，并且会拒绝 Git 检出。
- `beta` -> 优先使用 npm dist-tag `beta`，当 beta
  缺失或早于当前 stable 发布时回退到 `latest`。

### 重启交接

Gateway 网关核心自动更新器（通过配置启用时）会在实时 Gateway 网关请求处理器之外
启动 CLI 更新路径。控制平面
`update.run` 包管理器更新和受监督的 git 检出更新会使用
相同的托管服务交接，而不是在实时 Gateway 网关进程内替换包树或
重建 `dist/`：Gateway 网关会启动一个分离的 helper 并退出，
然后该 helper 从 Gateway 网关进程树之外运行 `openclaw update --yes --json`。
如果交接不可用，`update.run` 会返回结构化响应，
其中包含可手动运行的安全 shell 命令。

extended-stable 会被刻意排除在启动检查和后台
自动更新调度之外。显式前台更新、使用已存储
`update.channel: "extended-stable"` 的裸前台更新、按需 status，以及托管
Gateway 网关交接仍受支持。

当已安装本地托管 Gateway 网关服务且启用重启时，
包管理器和 git 检出更新会先停止正在运行的服务，
然后再替换包树或修改检出/构建输出。更新器随后
刷新服务元数据、重启服务，并在报告 `Gateway: restarted and verified.`
之前验证已重启的 Gateway 网关。包管理器更新还会验证已重启的 Gateway 网关
报告预期的包版本；git 检出更新会在重建后验证 Gateway 网关健康和
服务就绪状态。

在 macOS 上，更新后检查还会验证 LaunchAgent 是否已为活动配置文件加载/运行，以及配置的 loopback 端口是否健康。如果 plist 已安装但 launchd 没有监管它，OpenClaw 会自动重新引导 LaunchAgent，并重新运行健康/版本/渠道就绪检查（新的引导会直接加载 `RunAtLoad` 作业，因此恢复不会立即对新生成的 Gateway 网关执行 `kickstart -k`）。如果 Gateway 网关仍未变为健康状态，该命令会以非零状态退出，并打印重启日志路径以及重启、重新安装和包回滚说明。

如果重启无法运行，该命令会打印 `Gateway: restart skipped (...)` 或
`Gateway: restart failed: ...`，并给出手动 `openclaw gateway restart` 提示。使用 `--no-restart` 时，包替换或 git 重建仍会运行，但托管服务不会被停止或重启，因此正在运行的 Gateway 网关会继续使用旧代码，直到你手动重启它。

### 控制平面响应形状

当 `update.run` 通过 Gateway 网关控制平面在包管理器安装或受监管的 git checkout 上运行时，处理程序会将移交启动与 Gateway 网关退出后继续运行的 CLI 更新分开报告：

- `ok: true`、`result.status: "skipped"`、
  `result.reason: "managed-service-handoff-started"` 和
  `handoff.status: "started"`：Gateway 网关已创建托管服务移交，并安排自身重启，以便分离的辅助进程可以在实时服务进程之外运行
  `openclaw update --yes --json`。
- `ok: false`、`result.reason: "managed-service-handoff-unavailable"` 和
  `handoff.status: "unavailable"`：OpenClaw 无法找到可安全移交的监管服务边界和持久服务标识（例如，systemd 移交需要 `OPENCLAW_SYSTEMD_UNIT` 单元标识，而不仅是环境中的 systemd 进程标记）。响应包含
  `handoff.command`，也就是要从 Gateway 网关外部运行的 shell 命令。
- `ok: false`、`result.reason: "managed-service-handoff-failed"`：Gateway 网关尝试创建移交，但无法生成分离的辅助进程。

`sentinel` 载荷会在 Gateway 网关退出前写入，CLI 移交会在托管服务重启健康检查完成后更新同一个重启 sentinel。移交期间，sentinel 可以携带
`stats.reason: "restart-health-pending"`，且没有成功延续；重启后的 Gateway 网关会轮询它，并且只有在 CLI 已验证服务健康状态并用最终 `ok` 结果重写 sentinel 后，才会触发延续。
`openclaw status` 和 `openclaw status --all` 会在该 sentinel 处于待处理或失败状态时显示 `Update restart` 行，而 `update.status` 会刷新并返回最新 sentinel。

## Git checkout 流程

### 渠道选择

- `stable`：checkout 最新的非 beta 标签，然后构建并运行 Doctor。
- `beta`：优先使用最新的 `-beta` 标签；当 beta 缺失或更旧时，回退到最新 stable 标签。
- `dev`：checkout `main`，然后 fetch 并 rebase。
- `extended-stable`：Git checkout 不支持；不会发生 checkout 变更。

### 更新步骤

<Steps>
  <Step title="Verify clean worktree">
    要求没有未提交的更改。
  </Step>
  <Step title="Switch channel">
    切换到所选渠道（标签或分支）。
  </Step>
  <Step title="Fetch upstream">
    仅 dev。
  </Step>
  <Step title="Preflight build (dev only)">
    在临时 worktree 中运行 TypeScript 构建。如果 tip 失败，会向回最多检查 10 个提交，以找到最新可构建提交。设置 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` 也会在此预检期间运行 lint；lint 会以受限串行模式运行，因为用户更新主机通常比 CI runner 更小。
  </Step>
  <Step title="Rebase">
    rebase 到所选提交（仅 dev）。
  </Step>
  <Step title="Install dependencies">
    使用仓库包管理器。对于 pnpm checkout，更新器会按需引导 `pnpm`（先通过 `corepack`，再回退到临时 `npm install pnpm@11`），而不是在 pnpm workspace 内运行 `npm run build`。如果 pnpm 引导仍然失败，更新器会提前停止并给出包管理器特定错误，而不是尝试在 checkout 中运行 `npm run build`。
  </Step>
  <Step title="Build Control UI">
    构建 Gateway 网关和 Control UI。
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` 会作为最终安全更新检查运行。
  </Step>
  <Step title="Sync plugins">
    将插件同步到活动渠道。Dev 使用内置插件；stable 和 beta 使用 npm。更新已跟踪的插件安装。
  </Step>
</Steps>

### 插件同步详情

在 beta 渠道上，遵循默认/latest 线的已跟踪 npm 和 ClawHub 插件安装会先尝试插件 `@beta` 版本。如果插件没有 beta 版本，OpenClaw 会回退到记录的默认/latest spec 并报告警告。对于 npm 插件，如果 beta 包存在但安装验证失败，OpenClaw 也会回退。这些回退警告不会使核心更新失败。精确版本和显式标签永远不会被重写。

<Warning>
如果精确固定的 npm 插件更新解析到的 artifact 完整性与存储的安装记录不同，`openclaw update` 会中止该插件 artifact 更新，而不是安装它。只有在验证你信任新的 artifact 后，才显式重新安装或更新该插件。
</Warning>

<Note>
更新后插件同步失败如果限定于托管插件，且同步路径可以绕过（例如非必要插件的 npm registry 不可达），会在核心更新成功后作为警告报告。JSON 结果会保留顶层更新 `status: "ok"`，并报告 `postUpdate.plugins.status: "warning"`，附带 `openclaw update repair` 和 `openclaw plugins inspect <id> --runtime --json` 指引。意外的更新器或同步异常仍会使更新结果失败。修复插件安装或更新错误后，重新运行 `openclaw update repair`。

在逐插件同步步骤之后，`openclaw update` 会在 Gateway 网关重启前运行强制的**核心后收敛**流程：它会修复缺失的已配置插件载荷，验证磁盘上每个_活动_的已跟踪安装记录，并静态验证其 `package.json` 可解析（以及任何显式声明的 `main` 存在）。此流程的失败以及无效的配置快照会返回 `postUpdate.plugins.status: "error"`，并将顶层更新 `status` 翻转为 `"error"`，因此 `openclaw update` 会以非零状态退出，且 Gateway 网关_不会_带着未验证的插件集重启。错误包含结构化的 `postUpdate.plugins.warnings[].guidance` 行，指向 `openclaw update repair` 和 `openclaw plugins inspect <id> --runtime --json`。已禁用的插件条目以及不是可信来源关联的官方同步目标的记录会在此处跳过（与缺失载荷检查使用的 `skipDisabledPlugins` 策略一致），因此过时的已禁用插件记录无法阻止原本有效的更新。

更新后的 Gateway 网关启动时，插件加载仅做验证：启动不会运行包管理器或变更依赖树。包管理器 `update.run` 重启会交给 CLI 托管服务路径，因此包交换发生在旧 Gateway 网关进程之外，而服务健康检查会决定该更新是否可以报告为完成。
</Note>

extended-stable 核心更新成功后，核心后插件完整性和收敛仍会运行，但官方插件会暂时目标到 stable/latest 线。OpenClaw 在此版本中不会查询插件 `@extended-stable` 选择器。

对于包管理器安装，`openclaw update` 会在调用包管理器前解析目标包版本。npm 全局安装使用分阶段安装：OpenClaw 会将新包安装到临时 npm prefix 中，在那里验证打包的 `dist` 清单，然后将该干净的包树交换到真实全局 prefix 中。如果验证失败，更新后 Doctor、插件同步和重启工作不会从可疑树运行。即使已安装版本已与目标匹配，该命令也会刷新全局包安装，然后运行插件同步、核心命令补全刷新和重启工作。这会让打包的 sidecar 和渠道拥有的插件记录与已安装的 OpenClaw 构建保持一致，同时将完整插件命令补全重建留给显式的
`openclaw completion --write-state` 运行。

## 相关

- `openclaw doctor`（在 git checkout 上会提议先运行更新）
- [开发渠道](/zh-CN/install/development-channels)
- [更新](/zh-CN/install/updating)
- [CLI 参考](/zh-CN/cli)
