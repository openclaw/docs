---
read_when:
    - 你希望安全地更新源代码检出目录
    - 你正在调试 `openclaw update` 输出或选项
    - 你需要了解 `--update` 的简写行为
summary: '`openclaw update` 的 CLI 参考（较安全的源代码更新 + Gateway 网关自动重启）'
title: 更新
x-i18n:
    generated_at: "2026-07-16T11:28:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b46696f6b9cba5c318f870bcb6c5ea8e0652940968da2ad85e86709fe4c11146
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

更新 OpenClaw，并在 stable/extended-stable/beta/dev 渠道之间切换。

如果通过 **npm/pnpm/bun** 安装（全局安装，无 git 元数据），
更新将通过[更新](/zh-CN/install/updating)中所述的包管理器流程进行。

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

`openclaw --update` 会重写为 `openclaw update`（适用于 shell 和
启动器脚本）。

## 选项

| 标志                                             | 说明                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | 成功更新后跳过重启 Gateway 网关服务。对于会执行重启的包管理器更新，命令仅在确认重启后的服务报告预期版本后才会成功。                                                                                                                                                |
| `--channel <stable\|extended-stable\|beta\|dev>` | 设置更新渠道，并在核心更新成功后持久保存。Extended-stable 仅适用于包安装。                                                                                                                                                                                                                                            |
| `--tag <dist-tag\|version\|spec>`                | 仅覆盖本次更新的包目标。它不能与有效的 `extended-stable` 渠道组合使用，因为该渠道必须使用经过验证的精确目标。对于其他包安装，`main` 映射到 `github:openclaw/openclaw#main`；GitHub/git 源规范会先打包成临时 tarball，再执行分阶段的全局 npm 安装。 |
| `--dry-run`                                      | 预览计划执行的操作（渠道/标签/目标/重启流程），但不写入配置、不安装、不同步插件，也不重启。                                                                                                                                                                                                                |
| `--json`                                         | 输出机器可读的 `UpdateRunResult` JSON。当托管插件需要修复时包含 `postUpdate.plugins.warnings`，同时包含 beta 渠道插件回退详情；在更新后同步期间检测到 npm 插件工件漂移时，还会包含 `postUpdate.plugins.integrityDrifts`。                                                                 |
| `--timeout <seconds>`                            | 每个步骤的超时时间。默认为 `1800`。                                                                                                                                                                                                                                                                                                            |
| `--yes`                                          | 跳过确认提示（例如降级确认）。                                                                                                                                                                                                                                                                              |
| `--acknowledge-clawhub-risk`                     | 允许更新后插件同步在出现社区 ClawHub 信任警告时继续进行，而无需交互式提示。如果未指定此项，当 OpenClaw 无法提示时，将跳过有风险的社区版本并保持其不变。官方 ClawHub 包和内置插件源不受此提示限制。                                                     |

没有 `--verbose` 标志。使用 `--dry-run` 预览计划执行的操作，
使用 `--json` 获取机器可读结果，并使用 `openclaw update status --json`
仅查看渠道/可用性。Gateway 网关控制台详细程度（`--verbose`）和
文件日志级别（`logging.level: "debug"`/`"trace"`）是彼此独立的设置；请参阅
[Gateway 日志](/zh-CN/gateway/logging)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，会禁用会产生修改的 `openclaw update` 运行。请改为更新此安装的 Nix 源或 flake 输入；对于 nix-openclaw，请使用智能体优先的[快速开始](https://github.com/openclaw/nix-openclaw#quick-start)。`openclaw update status` 和 `openclaw update --dry-run` 仍为只读。
</Note>

<Warning>
降级需要确认，因为旧版本可能破坏配置。
如果该安装已将会话迁移到 SQLite，请先恢复已归档的旧版
对话记录工件，再启动较旧的文件存储版本。请参阅
[Doctor：会话迁移至 SQLite 后进行降级](/zh-CN/cli/doctor#downgrading-after-session-sqlite-migration)。
</Warning>

## `update status`

显示当前更新渠道、git 标签/分支/SHA（仅限源代码检出）
以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| 标志                  | 默认值 | 说明                         |
| --------------------- | ------- | ----------------------------------- |
| `--json`              | `false` | 输出机器可读的状态 JSON。 |
| `--timeout <seconds>` | `3`     | 检查的超时时间。                 |

对于 extended-stable 包安装，状态检查会执行与前台更新相同的公共选择器
和精确包验证。如果已安装的版本较新，它可能会报告
`ahead of extended-stable`。JSON 失败结果包含
`registry.reason`（`selector_missing`、`selector_query_failed`、
`exact_package_mismatch` 或 `unsupported_git_channel`）。

## `update repair`

当核心包已更改、但后续修复工作未能顺利完成时，
重新运行更新收尾流程。如果 `openclaw update` 已安装新的核心包，但核心更新后的插件同步、
托管 npm 插件元数据、注册表刷新或 Doctor 修复
未能收敛，这是受支持的恢复路径。

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| 标志                                             | 说明                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | 在修复前持久保存核心更新渠道。对于 extended-stable，遵循裸/default 或 `latest` 意图的符合条件的官方 npm 插件会以已安装核心的精确版本为目标。在 Git 检出中，extended-stable 修复会被拒绝，且不会更改配置。 |
| `--json`                                         | 输出机器可读的收尾 JSON。                                                                                                                                                                                                                           |
| `--timeout <seconds>`                            | 修复步骤的超时时间。默认为 `1800`。                                                                                                                                                                                                                           |
| `--yes`                                          | 跳过确认提示。                                                                                                                                                                                                                                          |
| `--acknowledge-clawhub-risk`                     | 行为与 `openclaw update` 上的行为相同。                                                                                                                                                                                                                              |
| `--no-restart`                                   | 为保持一致性而接受；修复绝不会重启 Gateway 网关。                                                                                                                                                                                                             |

`update repair` 会运行 `openclaw doctor --fix`，重新加载修复后的配置和
安装记录，针对当前更新渠道同步已跟踪的插件，更新
托管的 npm 插件安装，修复缺失的已配置插件载荷，
刷新插件注册表，并写入已收敛的安装记录元数据。
它不会安装新的核心包，也不会重启 Gateway 网关。

## `update wizard`

通过交互式流程选择更新渠道，并确认之后是否重启
Gateway 网关（默认为重启）。在没有 git
检出的情况下选择 `dev`，系统会询问是否创建检出。

| 标志                  | 默认值 | 说明                   |
| --------------------- | ------- | ----------------------------- |
| `--timeout <seconds>` | `1800`  | 每个更新步骤的超时时间。 |

## 工作原理

显式切换渠道（`--channel ...`）也会使安装方式
保持一致：

- `dev` -> 确保存在 git 检出（默认为 `~/openclaw`，设置
  `OPENCLAW_HOME` 时为 `$OPENCLAW_HOME/openclaw`；可通过
  `OPENCLAW_GIT_DIR` 覆盖），更新该检出，并从此
  检出安装全局 CLI。
- `stable` -> 使用 `latest` 从 npm 安装。
- `extended-stable` -> 解析公共 npm `extended-stable` 选择器，
  验证精确选定的包，并安装该精确版本。它
  不会回退到其他选择器，且不适用于 Git 检出。
- `beta` -> 优先使用 npm dist-tag `beta`；当 beta
  缺失或早于当前 stable 版本时，回退到 `latest`。

### 重启交接

Gateway 网关核心自动更新器（通过配置启用时）会在运行中的 Gateway 网关请求处理程序之外
启动 CLI 更新路径。控制平面的
`update.run` 包管理器更新和受监管的 git 检出更新使用
相同的托管服务交接，而不是在运行中的 Gateway 网关进程内替换包目录树或
重新构建 `dist/`：Gateway 网关会启动一个
分离的辅助进程并退出，该辅助进程随后从 Gateway 网关进程树之外运行 `openclaw update --yes --json`。
如果交接不可用，
`update.run` 会返回结构化响应，其中包含可手动运行的安全 shell 命令。

已存储的扩展稳定版选择在启用 `update.checkOnStart` 时，会在启动时和每 24 小时接收一次只读更新
提示。这些检查绝不会应用更新、
启动交接、重启 Gateway 网关、使用稳定版延迟/抖动，也不会使用 Beta 版
轮询频率。仍支持显式前台更新、使用已存储
`update.channel: "extended-stable"` 的无参数前台更新、按需状态查询及其托管式
Gateway 网关交接。

当已安装本地托管式 Gateway 网关服务且启用了重启时，
包管理器和 Git 检出更新会先停止正在运行的服务，再
替换包目录树或修改检出内容/构建输出。随后，更新程序
刷新服务元数据、重启服务，并在报告 `Gateway: restarted and verified.` 前验证
重启后的 Gateway 网关。
包管理器更新还会验证重启后的 Gateway 网关报告了
预期的包版本；Git 检出更新则会在重新构建后验证 Gateway 健康和
服务就绪状态。

包管理器更新通常会继续使用托管式服务中记录的 Node
二进制文件。如果该 Node 无法运行目标版本，但当前
CLI 所用的 Node 可以运行，并且已确认该服务属于正在更新的包，
则启用重启的更新会使用当前 Node 完成最终处理，并将
服务元数据改写为使用该运行时。`--no-restart` 无法修复服务
元数据，因此遇到相同的运行时不匹配时，会在修改包之前停止。

在 macOS 上，更新后检查还会验证 LaunchAgent 是否已针对
当前配置文件加载并运行，以及配置的回环端口是否
健康。如果已安装 plist，但 launchd 并未对其进行监管，OpenClaw
会自动重新引导 LaunchAgent，并重新执行健康状态/版本/
渠道就绪检查（全新引导会直接加载 `RunAtLoad` 作业，
因此恢复过程不会立即对新启动的 Gateway 网关执行 `kickstart -k`）。如果
Gateway 网关仍未恢复健康，命令将以非零状态退出，并
输出重启日志路径以及重启、重新安装和包回滚
说明。

如果无法执行重启，命令会输出 `Gateway: restart skipped (...)` 或
`Gateway: restart failed: ...`，并附带手动执行 `openclaw gateway restart` 的提示。
使用 `--no-restart` 时，仍会执行包替换或 Git 重新构建，但
不会停止或重启托管式服务，因此正在运行的 Gateway 网关会继续使用旧
代码，直到你手动重启它。

### 控制平面响应结构

当 `update.run` 通过 Gateway 网关控制平面在包管理器
安装或受监管的 Git 检出中运行时，处理程序会将交接启动
与 Gateway 网关退出后继续执行的 CLI 更新分别报告：

- `ok: true`、`result.status: "skipped"`、
  `result.reason: "managed-service-handoff-started"` 和
  `handoff.status: "started"`：Gateway 网关已创建托管式服务交接，
  并安排了自身重启，使分离式辅助程序可以在
  实时服务进程之外运行 `openclaw update --yes --json`。
- `ok: false`、`result.reason: "managed-service-handoff-unavailable"` 和
  `handoff.status: "unavailable"`：OpenClaw 无法找到可用于安全交接的监管
  服务边界和持久服务身份（例如，
  systemd 交接需要 `OPENCLAW_SYSTEMD_UNIT` 单元身份，
  仅有环境中的 systemd 进程标记并不足够）。响应中包含
  `handoff.command`，即需要从 Gateway 网关外部运行的 shell 命令。
- `ok: false`、`result.reason: "managed-service-handoff-failed"`：Gateway 网关
  尝试创建交接，但无法启动分离式辅助程序。

`sentinel` 载荷会在 Gateway 网关退出前写入，而 CLI
交接会在托管式服务重启健康检查完成后更新同一个重启哨兵。
在交接过程中，该哨兵可能包含
`stats.reason: "restart-health-pending"`，但没有成功续接信息；
重启后的 Gateway 网关会轮询该哨兵，并且仅在 CLI
验证服务健康并用最终 `ok` 结果重写哨兵后
才触发续接。
当该哨兵处于待处理或失败状态时，`openclaw status` 和 `openclaw status --all` 会显示一行 `Update restart`，
而 `update.status` 会刷新并
返回最新的哨兵状态。

## Git 检出流程

### 渠道选择

- `stable`：检出最新的非 Beta 标签，然后构建并运行 Doctor。
- `beta`：优先选择最新的 `-beta` 标签；当 Beta 版不存在或更旧时，
  回退到最新的稳定版标签。
- `dev`：检出 `main`，然后获取并变基。
- `extended-stable`：Git 检出不支持此选项；不会修改检出内容。

### 更新步骤

<Steps>
  <Step title="验证工作树干净">
    要求不存在未提交的更改。
  </Step>
  <Step title="切换渠道">
    切换到所选渠道（标签或分支）。
  </Step>
  <Step title="获取上游">
    仅限开发版。
  </Step>
  <Step title="预检构建（仅限开发版）">
    在临时工作树中运行 TypeScript 构建。如果最新提交构建失败，则最多回溯 10 个提交，以查找最新的可构建提交。设置 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` 还可在此预检期间运行 lint；lint 以受限串行模式运行，因为用户的更新主机通常比 CI 运行器资源更少。
  </Step>
  <Step title="变基">
    变基到所选提交（仅限开发版）。
  </Step>
  <Step title="安装依赖项">
    使用仓库的包管理器。对于 pnpm 检出，更新程序会按需引导 `pnpm`（先通过 `corepack`，然后临时回退到 `npm install pnpm@11`），而不是在 pnpm 工作区内运行 `npm run build`。如果 pnpm 引导仍失败，更新程序会提前停止并报告包管理器专属错误，而不会尝试在检出中运行 `npm run build`。
  </Step>
  <Step title="构建 Control UI">
    构建 Gateway 网关和 Control UI。
  </Step>
  <Step title="运行 Doctor">
    `openclaw doctor` 作为最后的安全更新检查运行。
  </Step>
  <Step title="同步插件">
    将插件同步到当前渠道。开发版使用内置插件；稳定版和 Beta 版使用 npm。更新受跟踪的插件安装。
  </Step>
</Steps>

### 插件同步详情

在 Beta 渠道中，跟随默认/最新版本线的受跟踪 npm 和 ClawHub 插件安装会先尝试插件
`@beta` 版本。如果插件没有
Beta 版本，OpenClaw 会回退到记录的默认/最新规范，并
报告警告。对于 npm 插件，如果 Beta
包存在但未通过安装验证，OpenClaw 也会回退。这些回退警告不会
导致核心更新失败。精确版本和显式标签绝不会被改写。

<Warning>
如果固定到精确版本的 npm 插件更新解析到的工件完整性与存储的安装记录不同，`openclaw update` 会中止该插件工件更新，而不会安装它。只有在确认信任新工件后，才能显式重新安装或更新该插件。
</Warning>

<Note>
如果更新后插件同步失败仅限于某个托管插件，并且同步路径可以绕过该失败（例如非必要插件的 npm 注册表无法访问），则会在核心更新成功后将其报告为警告。JSON 结果会保留顶层更新 `status: "ok"`，并报告 `postUpdate.plugins.status: "warning"`，其中包含 `openclaw update repair` 和 `openclaw plugins inspect <id> --runtime --json` 指引。意外的更新程序或同步异常仍会使更新结果失败。修复插件安装或更新错误，然后重新运行 `openclaw update repair`。当更新失败导致托管插件不可用时，OpenClaw 会禁用其运行时条目并重置活动槽位，但不会更改操作员编写的 `plugins.allow` 或 `plugins.deny` 策略。

每个插件的同步步骤完成后，`openclaw update` 会在 Gateway 网关重启前执行强制性的**核心更新后收敛**流程：修复缺失的已配置插件载荷、验证磁盘上每条_活动_受跟踪安装记录，并静态验证其 `package.json` 可解析（以及任何显式声明的 `main` 均存在）。此流程中的失败以及无效的配置快照会返回 `postUpdate.plugins.status: "error"`，并将顶层更新 `status` 改为 `"error"`，因此 `openclaw update` 会以非零状态退出，并且不会使用未经验证的插件集重启 Gateway 网关。错误中包含结构化的 `postUpdate.plugins.warnings[].guidance` 行，指向 `openclaw update repair` 和 `openclaw plugins inspect <id> --runtime --json`。此处会跳过已禁用的插件条目，以及未与可信来源的官方同步目标关联的记录（与缺失载荷检查使用的 `skipDisabledPlugins` 策略一致），因此过期的已禁用插件记录不会阻止本来有效的更新。

更新后的 Gateway 网关启动时，插件加载仅执行验证：启动过程不会运行包管理器，也不会修改依赖项树。包管理器 `update.run` 重启会交给 CLI 托管式服务路径处理，因此包交换会在旧 Gateway 网关进程之外进行，并由服务健康检查决定是否可以将更新报告为完成。
</Note>

扩展稳定版核心更新成功后，核心更新后的插件完整性和
收敛流程会以符合条件的官方 npm 插件为目标，并使用与已安装核心
完全相同的版本。对于默认/`latest` 意图，OpenClaw 不会查询插件
`@extended-stable`，也不会回退到 npm `latest`；而是根据已安装的核心推导包版本。
显式版本固定、显式非 `latest` 标签、
第三方包和非 npm 来源会保留其现有意图。

对于包管理器安装，`openclaw update` 会在调用包管理器前解析目标包
版本。npm 全局安装使用暂存式
安装：OpenClaw 将新包安装到临时 npm 前缀中，
让候选包在 `preinstall` 期间验证主机 Node 版本，
并在该位置验证打包的 `dist` 清单。在 `preinstall` 成功前，
已打包完成守卫会留在该清单之外，因此
跳过生命周期脚本的包管理器也会在激活前停止。在 npm 12 及更高版本中，
更新程序只批准候选 OpenClaw 的生命周期脚本；传递依赖项的
脚本仍会被阻止。然后，OpenClaw 会将干净的包目录树
交换到实际的全局前缀中。如果验证失败，则不会从可疑目录树运行更新后 Doctor、插件
同步和重启工作。即使
已安装版本与目标版本相同，该命令仍会刷新
全局包安装，然后运行插件同步、核心命令补全
刷新和重启工作。这样可使打包的附属组件和渠道所有的
插件记录与已安装的 OpenClaw 构建保持一致，同时将完整的
插件命令补全重新构建留给显式
`openclaw completion --write-state` 运行。

## 相关内容

- `openclaw doctor`（在 Git 检出中会先建议运行更新）
- [开发渠道](/zh-CN/install/development-channels)
- [更新](/zh-CN/install/updating)
- [CLI 参考](/zh-CN/cli)
