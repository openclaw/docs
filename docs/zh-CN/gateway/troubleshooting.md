---
read_when:
    - 故障排除中心将你引导到这里，以进行更深入的诊断。
    - 你需要按症状组织、结构稳定，并包含精确命令的运行手册章节。
summary: Gateway 网关、渠道、自动化、节点和浏览器的深度故障排除手册
title: 故障排除
x-i18n:
    generated_at: "2026-04-25T05:54:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2270f05cf34592269894278e1eb75b8d47c02a4ff1c74bf62afb3d8f4fc4640
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway 网关故障排除

本页是深度运行手册。
如果你想先走快速分诊流程，请从 [/help/troubleshooting](/zh-CN/help/troubleshooting) 开始。

## 命令阶梯

先按以下顺序运行这些命令：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

预期的健康信号：

- `openclaw gateway status` 显示 `Runtime: running`、`Connectivity probe: ok` 和一行 `Capability: ...`。
- `openclaw doctor` 报告没有阻塞性的配置/服务问题。
- `openclaw channels status --probe` 显示每个账号的实时传输状态，并在支持的情况下显示探测/审计结果，例如 `works` 或 `audit ok`。

## Anthropic 429：长上下文需要额外配额

当日志/错误中包含以下内容时，使用本节：
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

请检查：

- 所选的 Anthropic Opus/Sonnet 模型是否设置了 `params.context1m: true`。
- 当前的 Anthropic 凭证是否没有资格使用长上下文。
- 请求是否仅在需要走 1M beta 路径的长会话/模型运行中失败。

修复选项：

1. 为该模型禁用 `context1m`，回退到普通上下文窗口。
2. 使用有资格发起长上下文请求的 Anthropic 凭证，或切换到 Anthropic API key。
3. 配置回退模型，这样在 Anthropic 长上下文请求被拒绝时，运行仍可继续。

相关内容：

- [Anthropic](/zh-CN/providers/anthropic)
- [Token 使用和成本](/zh-CN/reference/token-use)
- [为什么我会看到来自 Anthropic 的 HTTP 429？](/zh-CN/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 本地 OpenAI-compatible 后端直接探测通过，但智能体运行失败

当出现以下情况时，使用本节：

- `curl ... /v1/models` 正常
- 很小的直接 `/v1/chat/completions` 调用正常
- OpenClaw 模型运行仅在正常智能体轮次中失败

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

请检查：

- 直接的小请求成功，但 OpenClaw 运行只在更大的提示词下失败
- 后端报错 `messages[].content` 期望是字符串
- 后端崩溃只出现在更大的提示 token 数或完整智能体运行时提示词下

常见特征：

- `messages[...].content: invalid type: sequence, expected a string` → 后端拒绝结构化的 Chat Completions 内容片段。修复方式：设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 很小的直接请求成功，但 OpenClaw 智能体运行因后端/模型崩溃而失败（例如某些 `inferrs` 构建上的 Gemma）→ OpenClaw 传输层很可能已经正确；失败的是后端在处理更大的智能体运行时提示词形态时崩溃。
- 禁用工具后失败减少但未消失 → 工具 schema 确实增加了压力，但剩余问题仍然是上游模型/服务器容量限制或后端 bug。

修复选项：

1. 为仅支持字符串的 Chat Completions 后端设置 `compat.requiresStringContent: true`。
2. 为无法可靠处理 OpenClaw 工具 schema 表面的模型/后端设置 `compat.supportsTools: false`。
3. 在可能的情况下减轻提示词压力：更小的工作区引导、更短的会话历史、更轻量的本地模型，或改用长上下文支持更强的后端。
4. 如果很小的直接请求持续通过，而 OpenClaw 智能体轮次仍在后端内部崩溃，请将其视为上游服务器/模型限制，并在上游提交一个包含已接受负载形态的复现。

相关内容：

- [本地模型](/zh-CN/gateway/local-models)
- [配置](/zh-CN/gateway/configuration)
- [OpenAI-compatible 端点](/zh-CN/gateway/configuration-reference#openai-compatible-endpoints)

## 没有回复

如果渠道在线但没有任何响应，在重新连接任何东西之前，先检查路由和策略。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

请检查：

- 私信发送者是否处于待配对状态。
- 群组提及门控（`requireMention`、`mentionPatterns`）。
- 渠道/群组 allowlist 是否不匹配。

常见特征：

- `drop guild message (mention required` → 群组消息在被提及之前会被忽略。
- `pairing request` → 发送者需要批准。
- `blocked` / `allowlist` → 发送者/渠道被策略过滤。

相关内容：

- [渠道故障排除](/zh-CN/channels/troubleshooting)
- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)

## Dashboard / Control UI 连接问题

当 dashboard/Control UI 无法连接时，检查 URL、认证模式和安全上下文假设。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

请检查：

- 探测 URL 和 dashboard URL 是否正确。
- 客户端与 Gateway 网关之间的认证模式/token 是否不匹配。
- 在需要设备身份的场景下是否使用了 HTTP。

常见特征：

- `device identity required` → 非安全上下文，或缺少设备认证。
- `origin not allowed` → 浏览器 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中（或者你正在从非 loopback 浏览器来源连接，但没有显式 allowlist）。
- `device nonce required` / `device nonce mismatch` → 客户端没有完成基于挑战的设备认证流程（`connect.challenge` + `device.nonce`）。
- `device signature invalid` / `device signature expired` → 客户端为当前握手签署了错误的负载（或使用了过期时间戳）。
- `AUTH_TOKEN_MISMATCH` 且 `canRetryWithDeviceToken=true` → 客户端可以使用缓存的设备 token 执行一次受信任的重试。
- 该缓存 token 重试会复用与配对设备 token 一起存储的缓存 scope 集合。显式 `deviceToken` / 显式 `scopes` 调用方则保留它们请求的 scope 集合。
- 在该重试路径之外，连接认证优先级依次为：显式共享 token/password、显式 `deviceToken`、已存储的设备 token、bootstrap token。
- 在异步 Tailscale Serve Control UI 路径上，相同 `{scope, ip}` 的失败尝试会在限流器记录失败之前串行化。因此，同一客户端两个错误的并发重试，第二次可能会显示 `retry later`，而不是两个普通的不匹配错误。
- 来自浏览器来源 loopback 客户端的 `too many failed authentication attempts (retry later)` → 来自同一标准化 `Origin` 的重复失败会被临时锁定；另一个 localhost 来源会使用单独的 bucket。
- 在该重试之后反复出现 `unauthorized` → 共享 token/设备 token 漂移；如有需要，请刷新 token 配置并重新批准/轮换设备 token。
- `gateway connect failed:` → host/port/url 目标错误。

### 认证详细代码速查表

使用失败的 `connect` 响应中的 `error.details.code` 来决定下一步操作：

| 详细代码 | 含义 | 建议操作 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING` | 客户端没有发送必需的共享 token。 | 在客户端中粘贴/设置 token，然后重试。对于 dashboard 路径：`openclaw config get gateway.auth.token`，然后将其粘贴到 Control UI 设置中。 |
| `AUTH_TOKEN_MISMATCH` | 共享 token 与 Gateway 网关认证 token 不匹配。 | 如果 `canRetryWithDeviceToken=true`，允许执行一次受信任的重试。缓存 token 重试会复用已存储且已批准的 scopes；显式 `deviceToken` / `scopes` 调用方保留请求的 scopes。如果仍然失败，请运行 [token 漂移恢复清单](/zh-CN/cli/devices#token-drift-recovery-checklist)。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 按设备缓存的 token 已过期或被撤销。 | 使用 [devices CLI](/zh-CN/cli/devices) 轮换/重新批准设备 token，然后重新连接。 |
| `PAIRING_REQUIRED` | 设备身份需要批准。检查 `error.details.reason` 是否为 `not-paired`、`scope-upgrade`、`role-upgrade` 或 `metadata-upgrade`，并在存在时使用 `requestId` / `remediationHint`。 | 批准待处理请求：`openclaw devices list`，然后 `openclaw devices approve <requestId>`。在你审核请求的访问权限后，scope/role 升级也使用相同流程。 |

设备认证 v2 迁移检查：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果日志显示 nonce/signature 错误，请更新正在连接的客户端，并验证它：

1. 等待 `connect.challenge`
2. 对绑定 challenge 的负载进行签名
3. 发送 `connect.params.device.nonce`，并使用相同的 challenge nonce

如果 `openclaw devices rotate` / `revoke` / `remove` 被意外拒绝：

- 配对设备 token 会话只能管理**它们自己的**设备，除非调用方还具有 `operator.admin`
- `openclaw devices rotate --scope ...` 只能请求调用方会话当前已经持有的 operator scopes

相关内容：

- [Control UI](/zh-CN/web/control-ui)
- [配置](/zh-CN/gateway/configuration)（Gateway 网关认证模式）
- [受信任代理认证](/zh-CN/gateway/trusted-proxy-auth)
- [远程访问](/zh-CN/gateway/remote)
- [设备](/zh-CN/cli/devices)

## Gateway 网关服务未运行

当服务已安装但进程无法持续运行时，使用本节。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # 也会扫描系统级服务
```

请检查：

- `Runtime: stopped` 以及退出提示。
- 服务配置不匹配（`Config (cli)` 与 `Config (service)`）。
- 端口/监听冲突。
- 使用 `--deep` 时是否存在额外的 launchd/systemd/schtasks 安装。
- `Other gateway-like services detected (best effort)` 清理提示。

常见特征：

- `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 未启用本地 Gateway 网关模式，或者配置文件被覆盖并丢失了 `gateway.mode`。修复：在你的配置中设置 `gateway.mode="local"`，或者重新运行 `openclaw onboard --mode local` / `openclaw setup`，重新写入预期的本地模式配置。如果你通过 Podman 运行 OpenClaw，默认配置路径是 `~/.openclaw/openclaw.json`。
- `refusing to bind gateway ... without auth` → 非 loopback 绑定时，没有有效的 gateway 认证路径（token/password，或在已配置情况下的 trusted-proxy）。
- `another gateway instance is already listening` / `EADDRINUSE` → 端口冲突。
- `Other gateway-like services detected (best effort)` → 存在陈旧或并行的 launchd/systemd/schtasks 单元。大多数部署应当每台机器只保留一个 Gateway 网关；如果你确实需要多个，请隔离端口 + 配置/状态/工作区。参见 [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)。

相关内容：

- [后台执行和进程工具](/zh-CN/gateway/background-process)
- [配置](/zh-CN/gateway/configuration)
- [Doctor](/zh-CN/gateway/doctor)

## Gateway 网关已恢复最后一次已知正确配置

当 Gateway 网关能够启动，但日志显示它恢复了 `openclaw.json` 时，使用本节。

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

请检查：

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- 活动配置旁边是否存在带时间戳的 `openclaw.json.clobbered.*` 文件
- 是否存在一条以 `Config recovery warning` 开头的主智能体系统事件

发生了什么：

- 被拒绝的配置在启动或热重载期间未通过验证。
- OpenClaw 将被拒绝的负载保留为 `.clobbered.*`。
- 活动配置已从最后一次验证通过的最后一次已知正确副本恢复。
- 下一次主智能体轮次会收到警告，不要盲目重写被拒绝的配置。
- 如果所有验证问题都位于 `plugins.entries.<id>...` 之下，OpenClaw 不会恢复整个文件。插件本地失败会继续显式暴露，而不相关的用户设置会保留在活动配置中。

检查并修复：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

常见特征：

- 存在 `.clobbered.*` → 外部直接编辑或启动时读取的内容已被恢复。
- 存在 `.rejected.*` → 一次由 OpenClaw 发起的配置写入在提交前未通过 schema 或 clobber 检查。
- `Config write rejected:` → 该写入尝试删除必需结构、大幅缩小文件，或持久化无效配置。
- `missing-meta-vs-last-good`、`gateway-mode-missing-vs-last-good` 或 `size-drop-vs-last-good:*` → 启动时将当前文件视为被覆盖，因为与最后一次已知正确备份相比，它丢失了字段或体积变小。
- `Config last-known-good promotion skipped` → 候选配置中包含已脱敏的密钥占位符，例如 `***`。

修复选项：

1. 如果恢复后的活动配置是正确的，就保留它。
2. 仅从 `.clobbered.*` 或 `.rejected.*` 中复制你真正想要的键，然后用 `openclaw config set` 或 `config.patch` 应用。
3. 重启前运行 `openclaw config validate`。
4. 如果你手动编辑，请保留完整的 JSON5 配置，而不是只保留你想修改的部分对象。

相关内容：

- [配置：严格验证](/zh-CN/gateway/configuration#strict-validation)
- [配置：热重载](/zh-CN/gateway/configuration#config-hot-reload)
- [配置](/zh-CN/cli/config)
- [Doctor](/zh-CN/gateway/doctor)

## Gateway 网关探测警告

当 `openclaw gateway probe` 确实探测到了某些内容，但仍然打印出一段警告时，使用本节。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

请检查：

- JSON 输出中的 `warnings[].code` 和 `primaryTargetId`。
- 警告是否与 SSH 回退、多个 Gateway 网关、缺失 scopes，或未解析的认证引用有关。

常见特征：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 设置失败，但命令仍然尝试了直接配置目标/loopback 目标。
- `multiple reachable gateways detected` → 有多个目标响应。通常这意味着有意的多 Gateway 网关部署，或存在陈旧/重复监听器。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 连接成功了，但详细 RPC 受 scope 限制；请配对设备身份，或使用带有 `operator.read` 的凭证。
- `Capability: pairing-pending` 或 `gateway closed (1008): pairing required` → Gateway 网关已响应，但该客户端在获得正常 operator 访问前仍需配对/批准。
- 无法解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文本 → 在该命令路径中，失败目标所需的认证材料不可用。

相关内容：

- [Gateway 网关](/zh-CN/cli/gateway)
- [同一主机上的多个 Gateway 网关](/zh-CN/gateway#multiple-gateways-same-host)
- [远程访问](/zh-CN/gateway/remote)

## 渠道已连接，但消息不流动

如果渠道状态显示已连接，但消息流是死的，请重点检查策略、权限和渠道特定的投递规则。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

请检查：

- 私信策略（`pairing`、`allowlist`、`open`、`disabled`）。
- 群组 allowlist 和提及要求。
- 是否缺少渠道 API 权限/scopes。

常见特征：

- `mention required` → 消息因群组提及策略而被忽略。
- `pairing` / 待批准相关痕迹 → 发送者尚未获批。
- `missing_scope`、`not_in_channel`、`Forbidden`、`401/403` → 渠道认证/权限问题。

相关内容：

- [渠道故障排除](/zh-CN/channels/troubleshooting)
- [WhatsApp](/zh-CN/channels/whatsapp)
- [Telegram](/zh-CN/channels/telegram)
- [Discord](/zh-CN/channels/discord)

## Cron 和 heartbeat 投递

如果 cron 或 heartbeat 没有运行，或没有成功投递，请先验证调度器状态，再检查投递目标。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

请检查：

- Cron 是否启用，以及是否存在下次唤醒时间。
- 作业运行历史状态（`ok`、`skipped`、`error`）。
- Heartbeat 跳过原因（`quiet-hours`、`requests-in-flight`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

常见特征：

- `cron: scheduler disabled; jobs will not run automatically` → cron 已禁用。
- `cron: timer tick failed` → 调度器 tick 失败；请检查文件/日志/运行时错误。
- `heartbeat skipped` 且 `reason=quiet-hours` → 当前在活跃时间窗口之外。
- `heartbeat skipped` 且 `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在，但只包含空行 / Markdown 标题，因此 OpenClaw 会跳过模型调用。
- `heartbeat skipped` 且 `reason=no-tasks-due` → `HEARTBEAT.md` 包含一个 `tasks:` 块，但本次 tick 没有任何任务到期。
- `heartbeat: unknown accountId` → heartbeat 投递目标的账号 id 无效。
- `heartbeat skipped` 且 `reason=dm-blocked` → heartbeat 目标被解析为私信式目的地，而 `agents.defaults.heartbeat.directPolicy`（或按智能体覆盖项）被设置为 `block`。

相关内容：

- [计划任务：故障排除](/zh-CN/automation/cron-jobs#troubleshooting)
- [计划任务](/zh-CN/automation/cron-jobs)
- [Heartbeat](/zh-CN/gateway/heartbeat)

## 已配对节点上的工具失败

如果某个节点已配对，但工具失败，请分别排查前台状态、权限状态和批准状态。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

请检查：

- 节点是否在线，并具备预期能力。
- 相机/麦克风/定位/屏幕的操作系统权限是否已授予。
- Exec 批准和 allowlist 状态。

常见特征：

- `NODE_BACKGROUND_UNAVAILABLE` → 节点应用必须位于前台。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少操作系统权限。
- `SYSTEM_RUN_DENIED: approval required` → exec 批准待处理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被 allowlist 阻止。

相关内容：

- [节点故障排除](/zh-CN/nodes/troubleshooting)
- [节点](/zh-CN/nodes/index)
- [Exec 批准](/zh-CN/tools/exec-approvals)

## 浏览器工具失败

当 Gateway 网关本身健康，但浏览器工具操作仍然失败时，使用本节。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

请检查：

- 是否已设置 `plugins.allow`，并且其中包含 `browser`。
- 浏览器可执行文件路径是否有效。
- CDP 配置文件是否可达。
- 对于 `existing-session` / `user` 配置文件，本地 Chrome 是否可用。

常见特征：

- `unknown command "browser"` 或 `unknown command 'browser'` → 内置 browser 插件被 `plugins.allow` 排除。
- 当 `browser.enabled=true` 时 browser 工具缺失 / 不可用 → `plugins.allow` 排除了 `browser`，因此插件根本没有加载。
- `Failed to start Chrome CDP on port` → 浏览器进程启动失败。
- `browser.executablePath not found` → 配置的路径无效。
- `browser.cdpUrl must be http(s) or ws(s)` → 配置的 CDP URL 使用了不受支持的协议，例如 `file:` 或 `ftp:`。
- `browser.cdpUrl has invalid port` → 配置的 CDP URL 端口无效或超出范围。
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session 还无法附加到所选的浏览器数据目录。请打开浏览器的 inspect 页面，启用远程调试，保持浏览器打开，批准首次附加提示，然后重试。如果不需要登录状态，优先使用受管的 `openclaw` profile。
- `No Chrome tabs found for profile="user"` → Chrome MCP 附加 profile 没有打开的本地 Chrome 标签页。
- `Remote CDP for profile "<name>" is not reachable` → 配置的远程 CDP 端点无法从 Gateway 网关主机访问。
- `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only profile 没有可访问的目标，或者 HTTP 端点虽然有响应，但 CDP WebSocket 仍然无法打开。
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 当前 Gateway 网关安装缺少内置 browser 插件的 `playwright-core` 运行时依赖；运行 `openclaw doctor --fix`，然后重启 Gateway 网关。ARIA 快照和基础页面截图仍然可以使用，但导航、AI 快照、基于 CSS 选择器的元素截图以及 PDF 导出仍不可用。
- `fullPage is not supported for element screenshots` → 截图请求同时使用了 `--full-page` 和 `--ref` 或 `--element`。
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 的截图调用必须使用页面捕获或快照 `--ref`，而不是 CSS `--element`。
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上传钩子需要使用快照引用，而不是 CSS 选择器。
- `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP profiles 上，每次调用只发送一个上传文件。
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profiles 上的对话框钩子不支持超时覆盖。
- `existing-session type does not support timeoutMs overrides.` → 对于 `profile="user"` / Chrome MCP existing-session profiles 上的 `act:type`，请省略 `timeoutMs`；如果需要自定义超时，请使用受管或 CDP 浏览器 profile。
- `existing-session evaluate does not support timeoutMs overrides.` → 对于 `profile="user"` / Chrome MCP existing-session profiles 上的 `act:evaluate`，请省略 `timeoutMs`；如果需要自定义超时，请使用受管或 CDP 浏览器 profile。
- `response body is not supported for existing-session profiles yet.` → `responsebody` 目前仍需要受管浏览器或原始 CDP profile。
- attach-only 或远程 CDP profiles 上出现陈旧的 viewport / dark-mode / locale / offline 覆盖状态 → 运行 `openclaw browser stop --browser-profile <name>`，关闭当前控制会话并释放 Playwright/CDP 模拟状态，而无需重启整个 Gateway 网关。

相关内容：

- [浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)
- [浏览器（OpenClaw 托管）](/zh-CN/tools/browser)

## 如果你升级后突然出现问题

大多数升级后的故障都与配置漂移或现在开始强制执行的更严格默认值有关。

### 1) 认证和 URL 覆盖行为已更改

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

检查项：

- 如果 `gateway.mode=remote`，CLI 调用可能会指向远程端，而你的本地服务其实是正常的。
- 显式 `--url` 调用不会回退到已存储的凭证。

常见特征：

- `gateway connect failed:` → URL 目标错误。
- `unauthorized` → 端点可达，但认证错误。

### 2) 绑定和认证护栏更严格了

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

检查项：

- 非 loopback 绑定（`lan`、`tailnet`、`custom`）需要有效的 gateway 认证路径：共享 token/password 认证，或正确配置的非 loopback `trusted-proxy` 部署。
- 像 `gateway.token` 这样的旧键不会替代 `gateway.auth.token`。

常见特征：

- `refusing to bind gateway ... without auth` → 非 loopback 绑定缺少有效的 gateway 认证路径。
- 运行时已启动，但 `Connectivity probe: failed` → Gateway 网关存活，但使用当前认证/url 无法访问。

### 3) 配对和设备身份状态已更改

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

检查项：

- dashboard/节点是否存在待批准的设备请求。
- 策略或身份变化后，私信配对是否有待批准项。

常见特征：

- `device identity required` → 设备认证未满足。
- `pairing required` → 发送者/设备必须先获批。

如果完成以上检查后，服务配置和运行时仍然不一致，请使用相同的 profile/状态目录重新安装服务元数据：

```bash
openclaw gateway install --force
openclaw gateway restart
```

相关内容：

- [Gateway 网关管理的配对](/zh-CN/gateway/pairing)
- [认证](/zh-CN/gateway/authentication)
- [后台执行和进程工具](/zh-CN/gateway/background-process)

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Doctor](/zh-CN/gateway/doctor)
- [常见问题](/zh-CN/help/faq)
