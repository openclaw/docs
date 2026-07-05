---
read_when:
    - 你遇到连接或凭证问题，并希望获得引导式修复
    - 你已更新并想做一次完整性检查
summary: '`openclaw doctor` 的 CLI 参考（健康检查 + 引导式修复）'
title: Doctor
x-i18n:
    generated_at: "2026-07-05T11:09:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f79924f095b94ed839fa1088908c89603396fe06ea28becb989069f6b5d113bf
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

用于 Gateway 网关、渠道、插件、技能、模型路由、本地状态和配置迁移的健康检查与快速修复。每当某些行为不符合预期，并且你想用一条命令说明问题所在时，都可以使用它。

相关：

- 故障排查：[故障排查](/zh-CN/gateway/troubleshooting)
- 安全审计：[安全](/zh-CN/gateway/security)

## 运行姿态

| 运行姿态 | 命令                     | 行为                                                            |
| -------- | ------------------------ | --------------------------------------------------------------- |
| 检查     | `openclaw doctor`        | 面向人的检查和引导式提示。                                      |
| 修复     | `openclaw doctor --fix`  | 应用受支持的修复；除非非交互式修复是安全的，否则会提示确认。    |
| Lint     | `openclaw doctor --lint` | 为 CI、预检和审查门禁提供只读的结构化发现。                     |

当自动化需要稳定结果时，优先使用 `--lint`。当人工操作员希望 Doctor 编辑配置或状态时，优先使用 `--fix`。

## 示例

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
```

对于特定渠道的权限，请使用渠道探测，而不是 `doctor`：

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` 会报告机器人针对特定渠道目标的有效权限。`channels status --probe` 会审计所有已配置渠道和语音自动加入目标。

## 选项

| 选项                         | 效果                                                                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--no-workspace-suggestions` | 禁用工作区记忆/搜索建议。                                                                                                                                                     |
| `--yes`                      | 不提示并接受默认值。                                                                                                                                                         |
| `--repair` / `--fix`         | 不提示并应用推荐的非服务修复（`--fix` 是别名）。Gateway 网关服务安装/重写仍需要交互式确认或显式的 `gateway` 命令。                                                            |
| `--force`                    | 应用激进修复，包括覆盖自定义服务配置。                                                                                                                                       |
| `--non-interactive`          | 无提示运行；仅执行安全迁移和非服务修复。                                                                                                                                     |
| `--generate-gateway-token`   | 生成并配置 Gateway 网关令牌。                                                                                                                                                |
| `--allow-exec`               | 允许 Doctor 在验证密钥时执行已配置的 `exec` SecretRefs。                                                                                                                     |
| `--deep`                     | 扫描系统服务以查找额外的 Gateway 网关安装；报告最近的 Gateway 网关 supervisor 重启交接。                                                                                     |
| `--lint`                     | 以只读模式运行现代化健康检查并输出诊断发现。                                                                                                                                 |
| `--post-upgrade`             | 运行升级后插件兼容性探测；发现会输出到 stdout；如果存在任何 error 级别发现，则退出代码为 1。                                                                                 |
| `--json`                     | 与 `--lint` 一起使用：JSON 发现。与 `--post-upgrade` 一起使用：机器可读信封 `{ probesRun, findings }`。                                                                       |
| `--severity-min <level>`     | 与 `--lint` 一起使用：丢弃低于 `info`、`warning` 或 `error` 的发现。                                                                                                          |
| `--all`                      | 与 `--lint` 一起使用：运行所有已注册检查，包括默认集合中排除的选择加入检查。                                                                                                 |
| `--skip <id>`                | 与 `--lint` 一起使用：跳过某个检查 ID。可重复。                                                                                                                              |
| `--only <id>`                | 与 `--lint` 一起使用：仅运行给定检查 ID。可重复。                                                                                                                            |

`--json`、`--severity-min`、`--all`、`--only` 和 `--skip` 只能与 `--lint` 一起使用。

## Lint 模式

`openclaw doctor --lint` 是只读的：无提示、不修复、不重写配置/状态。

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

面向人的输出很紧凑：

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

JSON 输出是脚本接口：

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

退出代码：

| 代码 | 含义                                                   |
| ---- | ------------------------------------------------------ |
| `0`  | 在所选严重性阈值或以上没有发现。                       |
| `1`  | 至少一个发现达到所选阈值。                             |
| `2`  | 在生成 lint 发现之前发生命令/运行时失败。              |

`--severity-min` 同时控制打印哪些发现以及退出阈值：即使存在较低严重性的 `info`/`warning` 发现，`openclaw doctor --lint --severity-min error` 也可能不打印任何内容并以 `0` 退出。

`--all` 控制在严重性过滤之前选择哪些检查。默认 lint 运行会排除深度检查、历史检查，或更可能暴露可修复旧残留的检查；使用 `--all` 可获取完整清单。`--only <id>` 是最精确的选择器，可以按 ID 运行任何已注册检查。

## 结构化健康检查

现代 Doctor 检查使用一个小型拆分契约：

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` 为 `doctor --lint` 提供能力。`repair()` 是可选的，并且只会在 `doctor --fix` / `doctor --repair` 下运行。尚未迁移到此形态的检查仍使用旧版 Doctor 贡献流程。

修复上下文可以携带 `dryRun`/`diff` 请求；修复结果可以返回结构化 `diffs`（配置/文件编辑）和 `effects`（服务、进程、包、状态或其他副作用），这样已转换的检查可以向 `doctor --fix --dry-run` 演进，而不需要把变更规划移动到 `detect()` 中。

`repair()` 会报告 `status: "repaired" | "skipped" | "failed"`（省略状态表示 `repaired`）。当修复返回 `skipped` 或 `failed` 时，Doctor 会报告原因，并跳过该检查的验证。成功修复后，Doctor 会针对已修复的发现重新运行限定范围的 `detect()`；如果发现仍然存在，Doctor 会报告修复警告，而不是将更改视为已完成。

一个发现包含：

| 字段              | 用途                                                   |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | 用于 skip/only 过滤器和 CI allowlist 的稳定 ID。        |
| `severity`        | `info`、`warning` 或 `error`。                         |
| `message`         | 人类可读的问题说明。                                   |
| `path`            | 可用时的配置、文件或逻辑路径。                         |
| `line` / `column` | 可用时的源位置。                                       |
| `ocPath`          | 当检查可以指向某处时，精确的 `oc://` 地址。            |
| `fixHint`         | 建议的操作员动作或修复摘要。                           |

现代化核心 Doctor 检查仍附着在拥有其面向人类的 `doctor` / `doctor --fix` 行为的有序 Doctor 贡献上。共享的结构化健康注册表是扩展点：内置检查和插件支持的检查会在核心 Doctor 检查之后运行，前提是其所属包已在活动命令路径中注册它们。`openclaw/plugin-sdk/health` 为插件作者暴露相同契约。

## 检查选择

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` 和 `--skip` 接受完整检查 ID，并且可以重复。如果某个 `--only` ID 未注册，则不会为该 ID 运行任何检查；使用输出中的 `checksRun`/`checksSkipped` 来确认聚焦门禁选择了你预期的检查。

## 升级后模式

`openclaw doctor --post-upgrade` 会运行插件兼容性探测，用于在构建或升级后串联执行。发现会输出到 stdout；如果任何发现包含 `level: "error"`，退出代码为 1。添加 `--json` 可获得机器可读信封（`{ probesRun, findings }`），适用于 CI、社区 `fork-upgrade` skill 以及其他升级后冒烟工具。如果已安装的插件索引缺失或格式错误，JSON 模式仍会输出该信封，并包含一个 `plugin.index_unavailable` 错误发现。

## 说明

- 在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，只读 Doctor 检查仍然可用，但 `doctor --fix`、`doctor --repair`、`doctor --yes` 和 `doctor --generate-gateway-token` 会被禁用，因为 `openclaw.json` 是不可变的。请改为编辑此安装的 Nix 源；对于 nix-openclaw，请使用智能体优先的[快速开始](https://github.com/openclaw/nix-openclaw#quick-start)。
- 交互式提示（钥匙串/OAuth 修复等）仅在 stdin 是 TTY 且**未**设置 `--non-interactive` 时运行。无头运行（cron、Telegram、无终端）会跳过提示。
- 非交互式 `doctor` 运行会跳过主动插件加载，因此无头健康检查能保持快速。交互式会话仍会加载旧版健康/修复流程所需的插件表面。
- `--lint` 比 `--non-interactive` 更严格：始终只读，从不提示，从不应用安全迁移。当你希望 Doctor 进行更改时，请使用 `doctor --fix` 或 `doctor --repair`。
- 默认情况下，Doctor 在检查密钥时不会执行 `exec` SecretRefs。仅当你有意希望 Doctor 运行这些已配置的密钥解析器时，才使用 `--allow-exec`（可搭配或不搭配 `--lint`）。
- 任何配置写入（包括 `--fix` 修复）都会将备份轮转到 `~/.openclaw/openclaw.json.bak`（带有编号的 `.bak.1`..`.bak.4` 环）。`--fix` 还会删除架构验证报告的未知配置键，并列出每一项删除；当更新正在进行时会跳过此操作，避免部分写入的升级状态在迁移完成前被剥离。
- 当另一个监督程序拥有 Gateway 网关生命周期时，设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍会报告 Gateway 网关/服务健康并应用非服务修复，但会跳过服务安装/启动/重启/bootstrap 和旧版服务清理。
- 在 Linux 上，Doctor 会忽略未激活的额外类 Gateway 网关 systemd 单元，并且在修复期间不会重写正在运行的 systemd Gateway 网关服务的命令/入口点元数据。请先停止服务，或使用 `openclaw gateway install --force` 替换活动启动器。
- `doctor --fix --non-interactive` 会报告缺失或过期的 Gateway 网关服务定义，但在更新修复模式之外不会安装或重写它们。对于缺失的服务，请运行 `openclaw gateway install`；要替换启动器，请运行 `openclaw gateway install --force`。
- 状态完整性检查会检测会话目录中的孤立 transcript 文件。将它们归档为 `.deleted.<timestamp>` 需要交互式确认；`--fix`、`--yes` 和无头运行会保留它们原位。
- Doctor 会扫描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的旧版 cron 作业形状，并在将规范行导入 SQLite 前重写它们。
- Doctor 会报告带有显式 `payload.model` 覆盖的 cron 作业，包括提供商命名空间计数以及与 `agents.defaults.model` 的不匹配项，因此在凭证或账单调查期间，可以看到不继承默认模型的定时作业。
- 在 Linux 上，当用户的 crontab 仍运行未维护的旧版 `~/.openclaw/bin/ensure-whatsapp.sh` 时，Doctor 会警告；当 cron 缺少 systemd 用户总线环境时，该脚本可能误报 `Gateway inactive`。
- 启用 WhatsApp 时，Doctor 会检查已降级的 Gateway 网关事件循环，以及仍在运行的本地 `openclaw-tui` 客户端。`doctor --fix` 只会停止已验证的本地 TUI 客户端，因此 WhatsApp 回复不会排在过期 TUI 刷新循环之后。
- Doctor 会将旧版 `openai-codex/*` 模型引用重写为规范的 `openai/*` 引用，覆盖主模型、fallback、图像/视频生成模型、heartbeat/subagent/compaction 覆盖、hooks、渠道模型覆盖以及过期会话路由 pin。`--fix` 还会将旧版 `openai-codex:*` 凭证配置和 `auth.order.openai-codex` 条目迁移到 `openai:*`，把 Codex 意图移动到按提供商/模型作用域的 `agentRuntime.id: "codex"` 条目上，移除过期的整智能体/会话运行时 pin，并将修复后的 OpenAI 智能体引用保持在 Codex 凭证路由上，而不是直接使用 OpenAI API key 凭证。
- Doctor 会清理旧 OpenClaw 版本遗留的插件依赖暂存状态，并为声明 `openclaw` 为 peer dependency 的托管 npm 插件重新链接宿主 `openclaw` 包。它还会修复配置引用的缺失可下载插件（`plugins.entries`、已配置渠道、已配置提供商/搜索设置、已配置 Agent Runtimes）。在包更新期间，Doctor 会跳过包管理器插件修复，直到包替换完成；如果某个已配置插件仍需要恢复，请随后重新运行 `openclaw doctor --fix`。如果下载失败，Doctor 会报告安装错误，并保留已配置的插件条目以便下次修复尝试。
- 当插件发现健康时，Doctor 会通过从 `plugins.allow`/`plugins.deny`/`plugins.entries` 中移除缺失插件 id，以及匹配的悬空渠道配置、Heartbeat 目标和渠道模型覆盖，来修复过期插件配置。
- Doctor 会通过禁用受影响的 `plugins.entries.<id>` 条目并移除其无效 `config` payload，来隔离无效插件配置。Gateway 网关启动本来就只会跳过这个坏插件，因此其他插件和渠道会继续运行。
- Doctor 会移除已退役的 `plugins.entries.codex.config.codexDynamicToolsProfile`；Codex app-server 始终保持 Codex 原生工作区工具为原生。
- Doctor 会将旧版扁平 Talk 配置（`talk.voiceId`、`talk.modelId` 及相关项）自动迁移到 `talk.provider` + `talk.providers.<provider>`。当唯一差异是对象键顺序时，重复运行 `doctor --fix` 不再报告/应用 Talk 规范化。
- Doctor 包含记忆搜索就绪检查，并可在缺少 embedding 凭证时建议运行 `openclaw configure --section model`。
- 当没有配置命令所有者时，Doctor 会警告。命令所有者是被允许运行仅所有者命令并批准危险操作的人类操作员账号。私信配对只允许某人与 bot 对话；如果你在首个所有者 bootstrap 存在之前批准过某个发送者，请显式设置 `commands.ownerAllowFrom`。
- 当配置了 Codex 模式智能体，并且操作员的 Codex home 中存在个人 Codex CLI 资产时，Doctor 会报告一条信息说明。本地 Codex app-server 启动会使用隔离的按智能体 home；如有需要，请先安装 Codex 插件，然后使用 `openclaw migrate plan codex` 清点应有意提升的资产。
- 当默认智能体允许的 Skills 在当前运行时环境中不可用（缺少二进制、环境变量、配置或 OS 要求）时，Doctor 会警告。`doctor --fix` 可以通过 `skills.entries.<skill>.enabled=false` 禁用这些不可用 Skills；如果你想保持该 skill 活跃，请改为安装/配置缺失要求。
- 如果启用了沙箱模式但 Docker 不可用，Doctor 会报告高信号警告并附带修复建议（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果存在旧版沙箱注册表文件或分片目录（`~/.openclaw/sandbox/containers.json`、`~/.openclaw/sandbox/browsers.json`、`~/.openclaw/sandbox/containers/` 或 `~/.openclaw/sandbox/browsers/`），Doctor 会报告它们；`--fix` 会将有效条目迁移到 SQLite，并隔离无效的旧版文件。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理，并且在当前命令路径中不可用，Doctor 会报告只读警告，且不会写入明文 fallback 凭证。对于 exec-backed SecretRefs，除非存在 `--allow-exec`，否则 Doctor 会跳过执行。
- 如果在修复路径中检查渠道 SecretRef 失败，Doctor 会继续并报告警告，而不是提前退出。
- 状态目录迁移后，当已启用的默认 Telegram 或 Discord 账号依赖 env fallback，而 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 对 Doctor 进程不可用时，Doctor 会警告。
- Telegram `allowFrom` 用户名自动解析（`doctor --fix`）要求当前命令路径中有可解析的 Telegram token。如果 token 检查不可用，Doctor 会报告警告并跳过该轮自动解析。

## macOS：`launchctl` 环境变量覆盖

如果你之前运行过 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），该值会覆盖你的配置文件，并可能导致持续的“unauthorized”错误。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相关

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关 Doctor](/zh-CN/gateway/doctor)
