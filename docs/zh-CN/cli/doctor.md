---
read_when:
    - 你遇到连接或凭证问题，并希望获得引导式修复
    - 你已更新并想做一次基本检查
summary: '`openclaw doctor` 的 CLI 参考（健康检查 + 引导式修复）'
title: Doctor
x-i18n:
    generated_at: "2026-06-27T01:37:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf7c07cd39053fce7efa81d968ef0f2666f6f5331581e72d2684843519c63b43
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

针对 Gateway 网关和渠道的健康检查 + 快速修复。

相关：

- 故障排除：[故障排除](/zh-CN/gateway/troubleshooting)
- 安全审计：[安全](/zh-CN/gateway/security)

## 为什么使用它

`openclaw doctor` 是 OpenClaw 的健康检查界面。当 Gateway 网关、渠道、插件、Skills、模型路由、本地状态或配置迁移没有按预期工作，并且你想用一个命令解释哪里出了问题时，可以使用它。

Doctor 有三种姿态：

| 姿态 | 命令                     | 行为                                                                            |
| ---- | ------------------------ | ------------------------------------------------------------------------------- |
| 检查 | `openclaw doctor`        | 面向人的检查和引导式提示。                                                      |
| 修复 | `openclaw doctor --fix`  | 应用受支持的修复；除非非交互式修复是安全的，否则会使用提示。                    |
| Lint | `openclaw doctor --lint` | 面向 CI、预检和评审门禁的只读结构化发现。                                       |

当自动化需要稳定结果时，优先使用 `--lint`。当人工操作员明确希望 Doctor 编辑配置或状态时，优先使用 `--fix`。

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

对于特定渠道的权限，请使用渠道探针，而不是 `doctor`：

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

定向的 Discord 能力探针会报告机器人的有效渠道权限；状态探针会审计已配置的 Discord 渠道和语音自动加入目标。

## 选项

- `--no-workspace-suggestions`：禁用工作区记忆/搜索建议
- `--yes`：不提示，接受默认值
- `--repair`：不提示，应用推荐的非服务修复；Gateway 网关服务安装和重写仍需要交互式确认或显式 Gateway 网关命令
- `--fix`：`--repair` 的别名
- `--force`：应用激进修复，包括在需要时覆盖自定义服务配置
- `--non-interactive`：无提示运行；仅执行安全迁移和非服务修复
- `--generate-gateway-token`：生成并配置 Gateway 网关令牌
- `--allow-exec`：允许 Doctor 在验证密钥时执行已配置的 exec SecretRefs
- `--deep`：扫描系统服务以查找额外的 Gateway 网关安装，并报告最近的 Gateway 网关 supervisor 重启交接
- `--lint`：以只读模式运行现代化健康检查并输出诊断发现
- `--post-upgrade`：运行升级后的插件兼容性探针；将发现输出到 stdout；如果存在任何错误级别的发现，则以代码 1 退出
- `--json`：与 `--lint` 一起使用时，输出 JSON 发现而不是人类可读输出；与 `--post-upgrade` 一起使用时，输出机器可读的 JSON 信封（`{ probesRun, findings }`）
- `--severity-min <level>`：与 `--lint` 一起使用时，丢弃低于 `info`、`warning` 或 `error` 的发现
- `--all`：与 `--lint` 一起使用时，运行所有已注册检查，包括默认自动化集合中排除的可选检查
- `--skip <id>`：与 `--lint` 一起使用时，跳过某个检查 id；可重复以跳过多个检查
- `--only <id>`：与 `--lint` 一起使用时，仅运行某个检查 id；可重复以运行一小组选定检查

## Lint 模式

`openclaw doctor --lint` 是 Doctor 检查的只读自动化姿态。它使用结构化健康检查路径，不会提示，也不会修复或重写配置/状态。当你希望获得机器可读的发现，而不是引导式修复提示时，可在 CI、预检脚本和评审工作流中使用它。`--json`、`--severity-min`、`--all`、`--only` 和 `--skip` 等 Lint 输出选项只能与 `--lint` 一起使用。

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

人类可读输出很紧凑：

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

JSON 输出是 Lint 运行的脚本接口：

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

退出行为：

- `0`：在所选严重性阈值或以上没有发现
- `1`：至少一个发现达到所选阈值
- `2`：在生成 Lint 发现之前发生命令/运行时失败

`--severity-min` 同时控制可见发现和退出阈值。例如，即使存在较低严重性的 `info` 或 `warning` 发现，`openclaw doctor --lint --severity-min error` 也可能不打印任何发现并以 `0` 退出。

`--all` 控制在严重性过滤之前选择哪些检查。默认 Lint 运行是稳定的自动化门禁，并排除那些有意设为可选的检查，因为它们较深、具有历史性，或更可能暴露可修复的旧残留。当你想获得完整的 Lint 清单而不逐一列出每个检查 id 时，请使用 `--all`。`--only <id>` 仍然是最精确的选择器，可以按 id 运行任何已注册检查。

## 结构化健康检查

现代 Doctor 检查使用一个小型结构化契约：

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` 驱动 `doctor --lint`。`repair()` 是可选的，并且只会被 `doctor --fix` / `doctor --repair` 考虑。尚未迁移到这种形态的检查会继续使用旧版 Doctor 贡献流程。

这种拆分是有意的：`detect()` 负责诊断，而 `repair()` 负责报告它已更改或会更改的内容。修复上下文可以携带 `dryRun`/`diff` 请求，修复结果可以为配置/文件编辑返回结构化 `diffs`，并为服务、进程、包、状态或其他副作用返回 `effects`。这样，已转换的检查可以逐步支持 `doctor --fix --dry-run` 和 diff 报告，而无需把变更规划移入 `detect()`。

`repair()` 会通过 `status: "repaired" | "skipped" | "failed"` 报告它是否尝试了请求的修复。省略状态表示 `repaired`，因此简单修复检查只需要返回变更。当修复返回 `skipped` 或 `failed` 时，Doctor 会报告原因，并且不会为该检查运行验证。

结构化修复成功后，Doctor 会使用已修复的发现作为范围重新运行 `detect()`。检查可以使用选定的发现、路径或 `ocPath` 值进行聚焦验证。如果发现仍然存在，Doctor 会报告修复警告，而不是把变更视为已静默完成。

一个发现包含：

| 字段              | 用途                                                   |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | 用于 skip/only 过滤器和 CI 允许列表的稳定 id。         |
| `severity`        | `info`、`warning` 或 `error`。                         |
| `message`         | 人类可读的问题陈述。                                   |
| `path`            | 可用时的配置、文件或逻辑路径。                         |
| `line` / `column` | 可用时的源位置。                                       |
| `ocPath`          | 当检查可以指向某处时的精确 `oc://` 地址。              |
| `fixHint`         | 建议的操作员动作或修复摘要。                           |

现代化核心 Doctor 检查仍附着在拥有其人类可读 `doctor` / `doctor --fix` 行为的有序 Doctor 贡献上。共享的结构化健康注册表是扩展点：内置和插件支持的检查会在核心 Doctor 检查之后运行，前提是其拥有包在活动命令路径中注册了它们。`openclaw/plugin-sdk/health` 子路径为这些扩展消费者暴露相同契约。

## 检查选择

当工作流需要聚焦门禁时，请使用 `--only` 和 `--skip`：

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` 和 `--skip` 接受完整检查 id，并且可以重复。如果某个 `--only` id 未注册，则不会为该 id 运行任何检查；使用命令的 `checksRun` 和 `checksSkipped` 字段来验证聚焦门禁是否选择了你预期的检查。

## 升级后模式

`openclaw doctor --post-upgrade` 会运行插件兼容性探针，适合在构建或升级后串联执行。发现会输出到 stdout；如果任何发现具有 `level: "error"`，命令会以代码 1 退出。添加 `--json` 可接收适用于 CI、社区 `fork-upgrade` skill 和其他升级后冒烟工具的机器可读信封（`{ probesRun, findings }`）。如果已安装的插件索引缺失或格式错误，JSON 模式仍会输出该信封，并带有一个 `plugin.index_unavailable` 错误发现。

备注：

- 在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，只读 Doctor 检查仍可工作，但 `doctor --fix`、`doctor --repair`、`doctor --yes` 和 `doctor --generate-gateway-token` 会被禁用，因为 `openclaw.json` 是不可变的。请改为编辑此安装的 Nix 源；对于 nix-openclaw，请使用以 Agent 优先的 [快速开始](https://github.com/openclaw/nix-openclaw#quick-start)。
- 交互式提示（例如 keychain/OAuth 修复）只会在 stdin 是 TTY 且**未**设置 `--non-interactive` 时运行。无头运行（cron、Telegram、无终端）会跳过提示。
- 性能：非交互式 `doctor` 运行会跳过急切插件加载，从而让无头健康检查保持快速。交互式 Doctor 会话仍会加载旧版健康与修复流程所需的插件表面。
- `--lint` 比 `--non-interactive` 更严格：它始终是只读的，永不提示，也永不应用安全迁移。当你希望 Doctor 进行更改时，请运行 `doctor --fix` 或 `doctor --repair`。
- 默认情况下，Doctor 在检查密钥时不会执行 `exec` SecretRefs。只有在你有意让 Doctor 运行这些已配置的密钥解析器时，才使用 `openclaw doctor --allow-exec` 或 `openclaw doctor --lint --allow-exec`。
- `--fix`（`--repair` 的别名）会将备份写入 `~/.openclaw/openclaw.json.bak`，并删除未知配置键，同时列出每项删除。
- 现代化的健康检查可以为 `doctor --fix` 暴露 `repair()` 路径；未暴露该路径的检查会继续走现有 Doctor 修复流程。
- `doctor --fix --non-interactive` 会报告缺失或过时的 Gateway 网关服务定义，但不会在更新修复模式之外安装或重写它们。缺失服务时运行 `openclaw gateway install`；当你有意替换启动器时，运行 `openclaw gateway install --force`。
- 状态完整性检查现在会检测会话目录中的孤立转录文件。将它们归档为 `.deleted.<timestamp>` 需要交互式确认；`--fix`、`--yes` 和无头运行会将它们留在原处。
- Doctor 还会扫描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的旧版 cron 任务形状，并在将规范行导入 SQLite 之前重写它们。
- Doctor 会报告带有显式 `payload.model` 覆盖的 cron 任务，包括提供商命名空间计数以及与 `agents.defaults.model` 的不匹配项，因此不继承默认模型的定时任务会在凭证或计费调查期间可见。
- 在 Linux 上，当用户的 crontab 仍运行旧版 `~/.openclaw/bin/ensure-whatsapp.sh` 时，Doctor 会发出警告；该脚本已不再维护，并且当 cron 缺少 systemd 用户总线环境时，可能会记录误报的 WhatsApp Gateway 网关故障。
- 启用 WhatsApp 时，Doctor 会检查是否存在已降级的 Gateway 网关事件循环，同时本地 `openclaw-tui` 客户端仍在运行。`doctor --fix` 只会停止已验证的本地 TUI 客户端，从而避免 WhatsApp 回复排在过时的 TUI 刷新循环之后。
- Doctor 会将旧版 `openai-codex/*` 模型引用重写为规范的 `openai/*` 引用，覆盖主模型、回退、图像/视频生成模型、Heartbeat/子智能体/压缩覆盖、钩子、渠道模型覆盖以及过时的会话路由固定。`--fix` 还会将旧版 `openai-codex:*` 凭证配置文件和 `auth.order.openai-codex` 条目迁移到 `openai:*`，将 Codex 意图移动到按提供商/模型作用域配置的 `agentRuntime.id: "codex"` 条目上，移除过时的整个智能体/会话运行时固定，并让修复后的 OpenAI 智能体引用继续使用 Codex 凭证路由，而不是直接使用 OpenAI API key 凭证。
- Doctor 会清理旧版 OpenClaw 创建的旧插件依赖暂存状态，并为声明 host `openclaw` 包作为 peer dependency 的受管 npm 插件重新链接该包。它还会修复配置中引用的缺失可下载插件，例如 `plugins.entries`、已配置渠道、已配置提供商/搜索设置或已配置 Agent Runtimes。在包更新期间，Doctor 会跳过包管理器插件修复，直到包替换完成；如果配置的插件仍需恢复，请之后重新运行 `openclaw doctor --fix`。如果下载失败，Doctor 会报告安装错误，并保留已配置的插件条目以供下一次修复尝试。
- 当插件发现正常时，Doctor 会通过从 `plugins.allow`/`plugins.deny`/`plugins.entries` 中移除缺失插件 ID，并移除匹配的悬空渠道配置、Heartbeat 目标和渠道模型覆盖，来修复过时的插件配置。
- Doctor 会通过禁用受影响的 `plugins.entries.<id>` 条目并移除其无效的 `config` 载荷，来隔离无效插件配置。Gateway 网关启动已经只会跳过该故障插件，因此其他插件和渠道可以继续运行。
- 当另一个 supervisor 拥有 Gateway 网关生命周期时，设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍会报告 Gateway 网关/服务健康并应用非服务修复，但会跳过服务安装/启动/重启/引导以及旧版服务清理。
- 在 Linux 上，Doctor 会忽略未激活的额外 Gateway 网关样式 systemd unit，并且在修复期间不会重写正在运行的 systemd Gateway 网关服务的命令/入口点元数据。当你有意替换活动启动器时，请先停止服务，或使用 `openclaw gateway install --force`。
- Doctor 会自动将旧版扁平 Talk 配置（`talk.voiceId`、`talk.modelId` 及相关项）迁移到 `talk.provider` + `talk.providers.<provider>`。
- 当唯一区别是对象键顺序时，重复运行 `doctor --fix` 不再报告/应用 Talk 规范化。
- Doctor 包含记忆搜索就绪检查，并可在缺少嵌入凭证时建议运行 `openclaw configure --section model`。
- 未配置命令 owner 时，Doctor 会发出警告。命令 owner 是允许运行仅 owner 命令并批准危险操作的人类操作员账户。私信配对只允许某人与机器人对话；如果你在第一 owner 引导存在之前批准过某个发送者，请显式设置 `commands.ownerAllowFrom`。
- 当配置了 Codex 模式智能体，且操作员的 Codex home 中存在个人 Codex CLI 资产时，Doctor 会报告一条信息说明。本地 Codex app-server 启动会使用隔离的每智能体 home，因此如有需要，请先安装 Codex 插件，然后使用 `openclaw migrate plan codex` 盘点应有意提升的资产。
- Doctor 会移除已退役的 `plugins.entries.codex.config.codexDynamicToolsProfile`；Codex app-server 始终让 Codex 原生工作区工具保持原生。
- 当默认智能体允许的 Skills 因缺少 bin、环境变量、配置或 OS 要求而在当前运行时环境中不可用时，Doctor 会发出警告。`doctor --fix` 可以通过 `skills.entries.<skill>.enabled=false` 禁用这些不可用 Skills；当你希望保持该 Skill 启用时，请改为安装/配置缺失要求。
- 如果启用了沙箱模式但 Docker 不可用，Doctor 会报告高信号警告并给出修复方式（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果存在旧版沙箱注册表文件或分片目录（`~/.openclaw/sandbox/containers.json`、`~/.openclaw/sandbox/browsers.json`、`~/.openclaw/sandbox/containers/` 或 `~/.openclaw/sandbox/browsers/`），Doctor 会报告它们；`openclaw doctor --fix` 会将有效条目迁移到 SQLite，并隔离无效旧版文件。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理且在当前命令路径中不可用，Doctor 会报告只读警告，并且不会写入明文回退凭证。对于 exec 支持的 SecretRefs，除非存在 `--allow-exec`，否则 Doctor 会跳过执行。
- 如果渠道 SecretRef 检查在修复路径中失败，Doctor 会继续运行并报告警告，而不是提前退出。
- 状态目录迁移后，当已启用的默认 Telegram 或 Discord 账户依赖环境变量回退，且 Doctor 进程无法使用 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 时，Doctor 会发出警告。
- Telegram `allowFrom` 用户名自动解析（`doctor --fix`）要求当前命令路径中有可解析的 Telegram token。如果 token 检查不可用，Doctor 会报告警告，并跳过该轮自动解析。

## macOS：`launchctl` 环境变量覆盖

如果你之前运行过 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），该值会覆盖你的配置文件，并可能导致持续的 “unauthorized” 错误。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相关

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关 Doctor](/zh-CN/gateway/doctor)
