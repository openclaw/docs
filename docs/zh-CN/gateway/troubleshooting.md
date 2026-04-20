---
read_when:
    - 故障排除中心将你引导到这里，以进行更深入的诊断
    - 你需要按症状划分且稳定的手册章节，并提供精确的命令
summary: Gateway 网关、渠道、自动化、节点和浏览器的深度故障排除手册
title: 故障排除
x-i18n:
    generated_at: "2026-04-20T07:04:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: d93a82407dbb1314b91a809ff9433114e1e9a3b56d46547ef53a8196bac06260
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway 网关故障排除

本页是深度故障排除手册。
如果你想先走快速分诊流程，请从 [/help/troubleshooting](/zh-CN/help/troubleshooting) 开始。

## 命令阶梯

先运行这些命令，顺序如下：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

预期的健康信号：

- `openclaw gateway status` 显示 `Runtime: running`、`Connectivity probe: ok` 和一行 `Capability: ...`。
- `openclaw doctor` 报告没有会阻塞的配置或服务问题。
- `openclaw channels status --probe` 显示每个账户的实时传输状态，并且在支持的情况下显示探测 / 审计结果，例如 `works` 或 `audit ok`。

## Anthropic 429：长上下文需要额外使用额度

当日志 / 错误中包含以下内容时使用本节：
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

检查以下内容：

- 选定的 Anthropic Opus / Sonnet 模型启用了 `params.context1m: true`。
- 当前 Anthropic 凭证不具备长上下文使用资格。
- 请求只会在需要走 1M beta 路径的长会话 / 模型运行中失败。

修复选项：

1. 为该模型禁用 `context1m`，回退到普通上下文窗口。
2. 使用具备长上下文请求资格的 Anthropic 凭证，或切换到 Anthropic API 密钥。
3. 配置后备模型，这样当 Anthropic 长上下文请求被拒绝时，运行仍可继续。

相关内容：

- [/providers/anthropic](/zh-CN/providers/anthropic)
- [/reference/token-use](/zh-CN/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/zh-CN/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 本地 OpenAI 兼容后端直接探测通过，但智能体运行失败

当出现以下情况时使用本节：

- `curl ... /v1/models` 可用
- 很小的直接 `/v1/chat/completions` 调用可用
- OpenClaw 模型运行只在正常智能体轮次中失败

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

检查以下内容：

- 很小的直接调用成功，但 OpenClaw 运行只会在更大的提示词下失败
- 后端报错 `messages[].content` 期望是字符串
- 后端只会在更大的 prompt token 数量或完整智能体运行时提示词下崩溃

常见特征：

- `messages[...].content: invalid type: sequence, expected a string` → 后端拒绝结构化的 Chat Completions 内容片段。修复方法：设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 很小的直接请求成功，但 OpenClaw 智能体运行因后端 / 模型崩溃而失败（例如某些 `inferrs` 构建中的 Gemma）→ OpenClaw 传输层很可能已经正确；失败的是后端对更大智能体运行时提示词形态的处理。
- 禁用工具后失败有所减少但未消失 → 工具 schema 是压力来源之一，但剩余问题仍然是上游模型 / 服务器容量限制或后端 bug。

修复选项：

1. 对仅支持字符串型 Chat Completions 的后端设置 `compat.requiresStringContent: true`。
2. 对无法可靠处理 OpenClaw 工具 schema 表面的模型 / 后端设置 `compat.supportsTools: false`。
3. 在可能的情况下减轻提示词压力：更小的工作区引导、更短的会话历史、更轻量的本地模型，或使用更强长上下文支持的后端。
4. 如果很小的直接请求持续通过，但 OpenClaw 智能体轮次仍在后端内部崩溃，请将其视为上游服务器 / 模型限制，并向上游提交复现，附上其可接受的负载形态。

相关内容：

- [/gateway/local-models](/zh-CN/gateway/local-models)
- [/gateway/configuration](/zh-CN/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/zh-CN/gateway/configuration-reference#openai-compatible-endpoints)

## 没有回复

如果渠道已连通但没有任何回应，在重新连接任何东西之前，先检查路由和策略。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

检查以下内容：

- 私信发送者是否处于待配对状态。
- 群组提及门控（`requireMention`、`mentionPatterns`）。
- 渠道 / 群组 allowlist 不匹配。

常见特征：

- `drop guild message (mention required` → 群消息会被忽略，直到被提及。
- `pairing request` → 发送者需要获批。
- `blocked` / `allowlist` → 发送者 / 渠道被策略过滤。

相关内容：

- [/channels/troubleshooting](/zh-CN/channels/troubleshooting)
- [/channels/pairing](/zh-CN/channels/pairing)
- [/channels/groups](/zh-CN/channels/groups)

## 仪表板 control ui 连接问题

当仪表板 / control UI 无法连接时，请验证 URL、认证模式和安全上下文假设。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

检查以下内容：

- 正确的探测 URL 和仪表板 URL。
- 客户端与 Gateway 网关之间的认证模式 / 令牌是否匹配。
- 是否在需要设备身份时使用了 HTTP。

常见特征：

- `device identity required` → 非安全上下文，或缺少设备认证。
- `origin not allowed` → 浏览器 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中（或者你正从非 loopback 的浏览器 origin 连接，但没有显式 allowlist）。
- `device nonce required` / `device nonce mismatch` → 客户端未完成基于挑战的设备认证流程（`connect.challenge` + `device.nonce`）。
- `device signature invalid` / `device signature expired` → 客户端为当前握手签署了错误的负载（或使用了过期时间戳）。
- `AUTH_TOKEN_MISMATCH` 且 `canRetryWithDeviceToken=true` → 客户端可以使用缓存的设备令牌进行一次可信重试。
- 该缓存令牌重试会复用与已配对设备令牌一起存储的缓存作用域集合。显式 `deviceToken` / 显式 `scopes` 调用方则保持其请求的作用域集合不变。
- 在该重试路径之外，连接认证优先级依次为：显式共享令牌 / 密码、然后显式 `deviceToken`、然后存储的设备令牌、最后是引导令牌。
- 在异步 Tailscale Serve Control UI 路径中，同一个 `{scope, ip}` 的失败尝试会在限流器记录失败之前被串行化。因此，同一客户端两个错误的并发重试，第二次可能显示 `retry later`，而不是两个普通的不匹配。
- 浏览器 origin 的 loopback 客户端出现 `too many failed authentication attempts (retry later)` → 来自同一归一化 `Origin` 的重复失败会被临时锁定；另一个 localhost origin 使用单独的桶。
- 在该重试之后仍重复出现 `unauthorized` → 共享令牌 / 设备令牌发生漂移；如有需要，刷新令牌配置并重新批准 / 轮换设备令牌。
- `gateway connect failed:` → 主机 / 端口 / URL 目标错误。

### 认证详情代码速查表

使用失败 `connect` 响应中的 `error.details.code` 来选择下一步操作：

| 详情代码                     | 含义                                                                                                                                                                   | 建议操作                                                                                                                                                                                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 客户端未发送必需的共享令牌。                                                                                                                                           | 在客户端中粘贴 / 设置令牌后重试。对于仪表板路径：`openclaw config get gateway.auth.token`，然后将其粘贴到 Control UI 设置中。                                                                                                                                                          |
| `AUTH_TOKEN_MISMATCH`        | 共享令牌与 Gateway 网关认证令牌不匹配。                                                                                                                                | 如果 `canRetryWithDeviceToken=true`，允许进行一次可信重试。缓存令牌重试会复用已存储的已批准作用域；显式 `deviceToken` / `scopes` 调用方保持其请求的作用域。如果仍然失败，请运行[令牌漂移恢复清单](/cli/devices#token-drift-recovery-checklist)。                                     |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 缓存的每设备令牌已过期或被撤销。                                                                                                                                       | 使用 [devices CLI](/cli/devices) 轮换 / 重新批准设备令牌，然后重新连接。                                                                                                                                                                                                                |
| `PAIRING_REQUIRED`           | 设备身份需要批准。查看 `error.details.reason`，其值可能为 `not-paired`、`scope-upgrade`、`role-upgrade` 或 `metadata-upgrade`，并在存在时使用 `requestId` / `remediationHint`。 | 批准待处理请求：`openclaw devices list`，然后 `openclaw devices approve <requestId>`。作用域 / 角色升级在你审查所请求的访问权限后也使用相同流程。                                                                                                                                       |

设备认证 v2 迁移检查：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果日志显示 nonce / signature 错误，请更新连接客户端并验证它会：

1. 等待 `connect.challenge`
2. 对绑定该挑战的负载进行签名
3. 使用相同的挑战 nonce 发送 `connect.params.device.nonce`

如果 `openclaw devices rotate` / `revoke` / `remove` 意外被拒绝：

- 已配对设备令牌会话只能管理**它们自己的**设备，除非调用方还拥有 `operator.admin`
- `openclaw devices rotate --scope ...` 只能请求调用方当前会话已持有的 operator 作用域

相关内容：

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/zh-CN/gateway/configuration)（Gateway 网关认证模式）
- [/gateway/trusted-proxy-auth](/zh-CN/gateway/trusted-proxy-auth)
- [/gateway/remote](/zh-CN/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway 网关服务未运行

当服务已安装但进程无法持续运行时，使用本节。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

检查以下内容：

- `Runtime: stopped` 以及退出提示。
- 服务配置不匹配（`Config (cli)` 对比 `Config (service)`）。
- 端口 / 监听器冲突。
- 使用 `--deep` 时发现额外的 launchd / systemd / schtasks 安装。
- `Other gateway-like services detected (best effort)` 清理提示。

常见特征：

- `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 未启用本地 Gateway 网关模式，或者配置文件被覆盖并丢失了 `gateway.mode`。修复方法：在你的配置中设置 `gateway.mode="local"`，或者重新运行 `openclaw onboard --mode local` / `openclaw setup`，重新写入预期的本地模式配置。如果你通过 Podman 运行 OpenClaw，默认配置路径是 `~/.openclaw/openclaw.json`。
- `refusing to bind gateway ... without auth` → 非 loopback 绑定时，没有有效的 Gateway 网关认证路径（令牌 / 密码，或在已配置情况下使用 trusted-proxy）。
- `another gateway instance is already listening` / `EADDRINUSE` → 端口冲突。
- `Other gateway-like services detected (best effort)` → 存在陈旧或并行的 launchd / systemd / schtasks 单元。大多数环境每台机器应只保留一个 Gateway 网关；如果你确实需要多个，请隔离端口 + 配置 / 状态 / 工作区。参见 [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)。

相关内容：

- [/gateway/background-process](/zh-CN/gateway/background-process)
- [/gateway/configuration](/zh-CN/gateway/configuration)
- [/gateway/doctor](/zh-CN/gateway/doctor)

## Gateway 网关探测警告

当 `openclaw gateway probe` 探测到了目标，但仍然打印警告块时，使用本节。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

检查以下内容：

- JSON 输出中的 `warnings[].code` 和 `primaryTargetId`。
- 警告是否与 SSH 回退、多个 Gateway 网关、缺失作用域或未解析的认证引用有关。

常见特征：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 设置失败，但命令仍尝试了已配置的 / loopback 目标的直接探测。
- `multiple reachable gateways detected` → 有多个目标作出响应。通常这意味着有意的多 Gateway 网关设置，或存在陈旧 / 重复的监听器。
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 连接成功了，但详细 RPC 受作用域限制；请配对设备身份，或使用带有 `operator.read` 的凭证。
- `Capability: pairing-pending` 或 `gateway closed (1008): pairing required` → Gateway 网关已响应，但此客户端在获得正常 operator 访问前仍需要配对 / 批准。
- 未解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文本 → 在此命令路径中，失败目标所需的认证材料不可用。

相关内容：

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)
- [/gateway/remote](/zh-CN/gateway/remote)

## 渠道已连接但消息不流转

如果渠道状态显示已连接，但消息流转中断，请重点检查策略、权限和渠道特定的投递规则。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

检查以下内容：

- 私信策略（`pairing`、`allowlist`、`open`、`disabled`）。
- 群组 allowlist 和提及要求。
- 缺失的渠道 API 权限 / 作用域。

常见特征：

- `mention required` → 消息因群组提及策略而被忽略。
- `pairing` / 待批准痕迹 → 发送者尚未获批。
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → 渠道认证 / 权限问题。

相关内容：

- [/channels/troubleshooting](/zh-CN/channels/troubleshooting)
- [/channels/whatsapp](/zh-CN/channels/whatsapp)
- [/channels/telegram](/zh-CN/channels/telegram)
- [/channels/discord](/zh-CN/channels/discord)

## Cron 和心跳投递

如果 Cron 或心跳未运行，或运行了但未送达，请先验证调度器状态，再检查投递目标。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

检查以下内容：

- Cron 已启用，且存在下一次唤醒时间。
- 任务运行历史状态（`ok`、`skipped`、`error`）。
- 心跳跳过原因（`quiet-hours`、`requests-in-flight`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

常见特征：

- `cron: scheduler disabled; jobs will not run automatically` → Cron 已禁用。
- `cron: timer tick failed` → 调度器 tick 失败；检查文件 / 日志 / 运行时错误。
- `heartbeat skipped` 且 `reason=quiet-hours` → 当前处于活跃时间窗口之外。
- `heartbeat skipped` 且 `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在，但只包含空行 / Markdown 标题，因此 OpenClaw 会跳过模型调用。
- `heartbeat skipped` 且 `reason=no-tasks-due` → `HEARTBEAT.md` 包含 `tasks:` 块，但本次 tick 没有任何任务到期。
- `heartbeat: unknown accountId` → 心跳投递目标使用了无效的 account id。
- `heartbeat skipped` 且 `reason=dm-blocked` → 心跳目标被解析为私信式目标，而 `agents.defaults.heartbeat.directPolicy`（或每个智能体的覆盖项）设置为 `block`。

相关内容：

- [/automation/cron-jobs#troubleshooting](/zh-CN/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/zh-CN/automation/cron-jobs)
- [/gateway/heartbeat](/zh-CN/gateway/heartbeat)

## 已配对节点的工具失败

如果节点已配对但工具失败，请分别排查前台状态、权限和批准状态。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

检查以下内容：

- 节点在线，并具有预期能力。
- 摄像头 / 麦克风 / 位置 / 屏幕的操作系统权限授权。
- exec 批准和 allowlist 状态。

常见特征：

- `NODE_BACKGROUND_UNAVAILABLE` → 节点应用必须位于前台。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少操作系统权限。
- `SYSTEM_RUN_DENIED: approval required` → exec 批准待处理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被 allowlist 拦截。

相关内容：

- [/nodes/troubleshooting](/zh-CN/nodes/troubleshooting)
- [/nodes/index](/zh-CN/nodes/index)
- [/tools/exec-approvals](/zh-CN/tools/exec-approvals)

## 浏览器工具失败

当浏览器工具操作失败，但 Gateway 网关本身健康时，使用本节。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

检查以下内容：

- 是否设置了 `plugins.allow`，且其中包含 `browser`。
- 浏览器可执行文件路径是否有效。
- CDP profile 是否可达。
- 对于 `existing-session` / `user` profiles，本地 Chrome 是否可用。

常见特征：

- `unknown command "browser"` 或 `unknown command 'browser'` → 内置 browser 插件被 `plugins.allow` 排除了。
- 浏览器工具缺失 / 不可用，而 `browser.enabled=true` → `plugins.allow` 排除了 `browser`，因此插件从未加载。
- `Failed to start Chrome CDP on port` → 浏览器进程启动失败。
- `browser.executablePath not found` → 配置的路径无效。
- `browser.cdpUrl must be http(s) or ws(s)` → 配置的 CDP URL 使用了不受支持的 scheme，例如 `file:` 或 `ftp:`。
- `browser.cdpUrl has invalid port` → 配置的 CDP URL 端口无效或超出范围。
- `No Chrome tabs found for profile="user"` → Chrome MCP 附加 profile 没有打开的本地 Chrome 标签页。
- `Remote CDP for profile "<name>" is not reachable` → 配置的远程 CDP 端点从 Gateway 网关主机不可达。
- `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only profile 没有可达目标，或者 HTTP 端点虽然有响应，但 CDP WebSocket 仍无法打开。
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 当前 Gateway 网关安装不包含完整的 Playwright 包；ARIA 快照和基础页面截图仍然可用，但导航、AI 快照、基于 CSS 选择器的元素截图和 PDF 导出仍不可用。
- `fullPage is not supported for element screenshots` → 截图请求将 `--full-page` 与 `--ref` 或 `--element` 混用。
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 的截图调用必须使用页面捕获或快照 `--ref`，不能使用 CSS `--element`。
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上传钩子需要快照引用，不能使用 CSS 选择器。
- `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP profiles 中，每次调用只发送一个上传文件。
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profiles 中的对话框钩子不支持超时覆盖。
- `response body is not supported for existing-session profiles yet.` → `responsebody` 目前仍需要托管浏览器或原始 CDP profile。
- attach-only 或远程 CDP profiles 中存在陈旧的 viewport / dark-mode / locale / offline 覆盖状态 → 运行 `openclaw browser stop --browser-profile <name>` 关闭当前控制会话并释放 Playwright / CDP 模拟状态，而无需重启整个 Gateway 网关。

相关内容：

- [/tools/browser-linux-troubleshooting](/zh-CN/tools/browser-linux-troubleshooting)
- [/tools/browser](/zh-CN/tools/browser)

## 如果你升级后突然出问题

大多数升级后的故障都源于配置漂移，或现在开始强制执行更严格的默认值。

### 1) 认证和 URL 覆盖行为发生了变化

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

要检查的内容：

- 如果 `gateway.mode=remote`，CLI 调用可能会指向远程端，而你的本地服务其实是正常的。
- 显式 `--url` 调用不会回退到已存储凭证。

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

要检查的内容：

- 非 loopback 绑定（`lan`、`tailnet`、`custom`）需要有效的 Gateway 网关认证路径：共享令牌 / 密码认证，或正确配置的非 loopback `trusted-proxy` 部署。
- 像 `gateway.token` 这样的旧键不会替代 `gateway.auth.token`。

常见特征：

- `refusing to bind gateway ... without auth` → 非 loopback 绑定时没有有效的 Gateway 网关认证路径。
- 运行时已启动，但 `Connectivity probe: failed` → Gateway 网关存活，但用当前认证 / URL 无法访问。

### 3) 配对和设备身份状态发生了变化

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

要检查的内容：

- 仪表板 / 节点是否存在待批准的设备。
- 策略或身份变更后，私信配对是否存在待批准项。

常见特征：

- `device identity required` → 设备认证未满足。
- `pairing required` → 发送者 / 设备必须先获批。

如果检查后服务配置和运行时仍然不一致，请从相同的 profile / 状态目录重新安装服务元数据：

```bash
openclaw gateway install --force
openclaw gateway restart
```

相关内容：

- [/gateway/pairing](/zh-CN/gateway/pairing)
- [/gateway/authentication](/zh-CN/gateway/authentication)
- [/gateway/background-process](/zh-CN/gateway/background-process)
