---
read_when:
    - 故障排除中心已将你引导到此处，以进行更深入的诊断
    - 你需要按症状分类且稳定的运行手册章节，并提供精确命令
summary: Gateway 网关、渠道、自动化、节点和浏览器的深度故障排除运行手册
title: 故障排除
x-i18n:
    generated_at: "2026-04-10T20:41:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ef2faccba26ede307861504043a6415bc1f12dc64407771106f63ddc5b107f5
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway 网关故障排除

此页面是深度运行手册。
如果你想先使用快速分诊流程，请从 [/help/troubleshooting](/zh-CN/help/troubleshooting) 开始。

## 命令阶梯

先运行以下命令，按此顺序执行：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

预期的健康信号：

- `openclaw gateway status` 显示 `Runtime: running` 和 `RPC probe: ok`。
- `openclaw doctor` 报告没有阻塞性的配置或服务问题。
- `openclaw channels status --probe` 显示每个账号的实时传输状态，并在支持的情况下显示探测/审计结果，例如 `works` 或 `audit ok`。

## Anthropic 429：长上下文需要额外用量权限

当日志或错误中包含以下内容时使用本节：
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

请检查：

- 所选的 Anthropic Opus/Sonnet 模型设置了 `params.context1m: true`。
- 当前的 Anthropic 凭证不具备长上下文使用资格。
- 请求只会在需要走 1M beta 路径的长会话或模型运行中失败。

修复选项：

1. 为该模型禁用 `context1m`，回退到普通上下文窗口。
2. 使用具备长上下文请求资格的 Anthropic 凭证，或切换到 Anthropic API key。
3. 配置回退模型，以便在 Anthropic 长上下文请求被拒绝时运行仍可继续。

相关内容：

- [/providers/anthropic](/zh-CN/providers/anthropic)
- [/reference/token-use](/zh-CN/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/zh-CN/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 本地 OpenAI 兼容后端可通过直接探测，但智能体运行失败

在以下情况使用本节：

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

请检查：

- 直接的小请求成功，但 OpenClaw 运行只在较大提示词时失败
- 后端报错指出 `messages[].content` 期望的是字符串
- 后端崩溃只出现在较大的提示词 token 数或完整智能体运行时提示词下

常见特征：

- `messages[...].content: invalid type: sequence, expected a string` → 后端拒绝结构化的 Chat Completions 内容片段。修复方法：设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 直接的小请求成功，但 OpenClaw 智能体运行因后端/模型崩溃而失败（例如某些 `inferrs` 版本上的 Gemma）→ OpenClaw 传输层很可能已经正确；失败的是后端无法处理更大的智能体运行时提示词形态。
- 禁用工具后失败有所减少但未消失 → 工具 schema 是压力来源之一，但剩余问题仍然是上游模型/服务端容量限制或后端 bug。

修复选项：

1. 为仅支持字符串 Chat Completions 的后端设置 `compat.requiresStringContent: true`。
2. 对无法可靠处理 OpenClaw 工具 schema 表面的模型/后端设置 `compat.supportsTools: false`。
3. 尽可能降低提示词压力：更小的工作区启动内容、更短的会话历史、更轻量的本地模型，或选择对长上下文支持更强的后端。
4. 如果直接的小请求持续成功，而 OpenClaw 智能体轮次仍在后端内部崩溃，请将其视为上游服务端/模型限制，并向上游提交一个基于已接受载荷形态的复现问题。

相关内容：

- [/gateway/local-models](/zh-CN/gateway/local-models)
- [/gateway/configuration](/zh-CN/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/zh-CN/gateway/configuration-reference#openai-compatible-endpoints)

## 无回复

如果渠道已上线但没有任何回复，请先检查路由和策略，不要急着重连任何东西。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

请检查：

- 私信发送者的配对是否处于待处理状态。
- 群组提及限制（`requireMention`、`mentionPatterns`）。
- 渠道/群组 allowlist 是否不匹配。

常见特征：

- `drop guild message (mention required` → 群消息在被提及之前会被忽略。
- `pairing request` → 发送者需要获批。
- `blocked` / `allowlist` → 发送者或渠道被策略过滤。

相关内容：

- [/channels/troubleshooting](/zh-CN/channels/troubleshooting)
- [/channels/pairing](/zh-CN/channels/pairing)
- [/channels/groups](/zh-CN/channels/groups)

## Dashboard 控制 UI 连接问题

当 dashboard/控制 UI 无法连接时，请验证 URL、认证模式和安全上下文假设。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

请检查：

- 探测 URL 和 dashboard URL 是否正确。
- 客户端与 Gateway 网关之间的认证模式或令牌是否不匹配。
- 是否在需要设备身份的场景下使用了 HTTP。

常见特征：

- `device identity required` → 非安全上下文，或缺少设备认证。
- `origin not allowed` → 浏览器 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中（或者你正从非 loopback 的浏览器源连接，但没有显式 allowlist）。
- `device nonce required` / `device nonce mismatch` → 客户端没有完成基于挑战的设备认证流程（`connect.challenge` + `device.nonce`）。
- `device signature invalid` / `device signature expired` → 客户端为当前握手签署了错误的载荷，或使用了过期时间戳。
- `AUTH_TOKEN_MISMATCH` 且带有 `canRetryWithDeviceToken=true` → 客户端可以使用缓存的设备令牌执行一次可信重试。
- 该缓存令牌重试会复用与已配对设备令牌一同存储的缓存作用域集合。显式 `deviceToken` / 显式 `scopes` 调用方则保持其请求的作用域集合不变。
- 在该重试路径之外，连接认证优先级依次为：显式共享令牌/密码优先，然后是显式 `deviceToken`，再然后是已存储设备令牌，最后是 bootstrap 令牌。
- 在异步 Tailscale Serve Control UI 路径上，同一 `{scope, ip}` 的失败尝试会在限流器记录失败之前被串行化。因此，同一客户端的两个错误并发重试，第二次可能显示 `retry later`，而不是出现两个普通的不匹配错误。
- 浏览器源 loopback 客户端出现 `too many failed authentication attempts (retry later)` → 来自同一规范化 `Origin` 的重复失败会被临时锁定；另一个 localhost 源会使用单独的桶。
- 在该重试之后仍反复出现 `unauthorized` → 共享令牌或设备令牌已漂移；如果需要，请刷新令牌配置，并重新批准/轮换设备令牌。
- `gateway connect failed:` → 主机、端口或 URL 目标错误。

### 认证详情代码速查表

使用失败的 `connect` 响应中的 `error.details.code` 来决定下一步操作：

| 详情代码                     | 含义                              | 建议操作                                                                                                                                                                                                                                                                                 |
| ---------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 客户端未发送必需的共享令牌。      | 在客户端中粘贴/设置令牌后重试。对于 dashboard 路径：`openclaw config get gateway.auth.token`，然后将其粘贴到 Control UI 设置中。                                                                                                                                                         |
| `AUTH_TOKEN_MISMATCH`        | 共享令牌与 Gateway 网关认证令牌不匹配。 | 如果 `canRetryWithDeviceToken=true`，允许一次可信重试。缓存令牌重试会复用已存储的已批准作用域；显式 `deviceToken` / `scopes` 调用方则保持请求的作用域不变。如果仍失败，请运行 [token drift recovery checklist](/cli/devices#token-drift-recovery-checklist)。                              |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 每设备缓存令牌已过期或被撤销。    | 使用 [devices CLI](/cli/devices) 轮换或重新批准设备令牌，然后重新连接。                                                                                                                                                                                                                 |
| `PAIRING_REQUIRED`           | 设备身份已知，但未获批用于此角色。 | 批准待处理请求：`openclaw devices list`，然后 `openclaw devices approve <requestId>`。                                                                                                                                                                                                  |

设备认证 v2 迁移检查：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果日志显示 nonce/签名错误，请更新正在连接的客户端，并验证它是否：

1. 等待 `connect.challenge`
2. 对绑定该 challenge 的载荷进行签名
3. 在 `connect.params.device.nonce` 中发送相同的 challenge nonce

如果 `openclaw devices rotate` / `revoke` / `remove` 意外被拒绝：

- 已配对设备令牌会话只能管理**它们自己的**设备，除非调用方同时具有 `operator.admin`
- `openclaw devices rotate --scope ...` 只能请求调用方会话已经持有的 operator 作用域

相关内容：

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/zh-CN/gateway/configuration)（Gateway 网关认证模式）
- [/gateway/trusted-proxy-auth](/zh-CN/gateway/trusted-proxy-auth)
- [/gateway/remote](/zh-CN/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway 网关服务未运行

当服务已安装但进程无法持续运行时使用本节。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # 也会扫描系统级服务
```

请检查：

- `Runtime: stopped` 以及退出提示。
- 服务配置不匹配（`Config (cli)` 对比 `Config (service)`）。
- 端口或监听器冲突。
- 使用 `--deep` 时是否存在额外的 launchd/systemd/schtasks 安装。
- `Other gateway-like services detected (best effort)` 清理提示。

常见特征：

- `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 未启用本地 Gateway 网关模式，或者配置文件被覆盖导致丢失了 `gateway.mode`。修复方法：在你的配置中设置 `gateway.mode="local"`，或重新运行 `openclaw onboard --mode local` / `openclaw setup` 以重新写入预期的本地模式配置。如果你通过 Podman 运行 OpenClaw，默认配置路径为 `~/.openclaw/openclaw.json`。
- `refusing to bind gateway ... without auth` → 非 loopback 绑定且没有有效的 Gateway 网关认证路径（令牌/密码，或在已配置时使用 trusted-proxy）。
- `another gateway instance is already listening` / `EADDRINUSE` → 端口冲突。
- `Other gateway-like services detected (best effort)` → 存在陈旧或并行的 launchd/systemd/schtasks 单元。大多数部署应在每台机器上只保留一个 Gateway 网关；如果你确实需要多个，请隔离端口、配置、状态和工作区。参见 [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)。

相关内容：

- [/gateway/background-process](/zh-CN/gateway/background-process)
- [/gateway/configuration](/zh-CN/gateway/configuration)
- [/gateway/doctor](/zh-CN/gateway/doctor)

## Gateway 网关探测警告

当 `openclaw gateway probe` 能探测到目标，但仍打印警告块时使用本节。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

请检查：

- JSON 输出中的 `warnings[].code` 和 `primaryTargetId`。
- 警告是否与 SSH 回退、多个 Gateway 网关、缺少作用域或未解析的认证引用有关。

常见特征：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 设置失败，但命令仍尝试了已配置的目标或 loopback 目标的直接探测。
- `multiple reachable gateways detected` → 有多个目标作出响应。通常这表示有意的多 Gateway 网关部署，或存在陈旧/重复的监听器。
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → 连接已成功，但详细 RPC 受作用域限制；请配对设备身份，或使用带有 `operator.read` 的凭证。
- 未解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文本 → 在该命令路径中，失败目标所需的认证材料不可用。

相关内容：

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)
- [/gateway/remote](/zh-CN/gateway/remote)

## 渠道已连接但消息不流转

如果渠道状态显示已连接，但消息流转已中断，请重点检查策略、权限以及渠道特定的投递规则。

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
- 缺失的渠道 API 权限或 scopes。

常见特征：

- `mention required` → 消息因群组提及策略而被忽略。
- `pairing` / 待批准痕迹 → 发送者尚未获批。
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → 渠道认证或权限问题。

相关内容：

- [/channels/troubleshooting](/zh-CN/channels/troubleshooting)
- [/channels/whatsapp](/zh-CN/channels/whatsapp)
- [/channels/telegram](/zh-CN/channels/telegram)
- [/channels/discord](/zh-CN/channels/discord)

## Cron 和 heartbeat 投递

如果 cron 或 heartbeat 没有运行，或者运行了但未投递，请先验证调度器状态，再检查投递目标。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

请检查：

- Cron 已启用，并存在下一次唤醒时间。
- 作业运行历史状态（`ok`、`skipped`、`error`）。
- Heartbeat 跳过原因（`quiet-hours`、`requests-in-flight`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

常见特征：

- `cron: scheduler disabled; jobs will not run automatically` → cron 已禁用。
- `cron: timer tick failed` → 调度器 tick 失败；请检查文件、日志或运行时错误。
- `heartbeat skipped` 且 `reason=quiet-hours` → 当前处于活跃时间窗口之外。
- `heartbeat skipped` 且 `reason=empty-heartbeat-file` → `HEARTBEAT.md` 存在，但只包含空行或 Markdown 标题，因此 OpenClaw 会跳过模型调用。
- `heartbeat skipped` 且 `reason=no-tasks-due` → `HEARTBEAT.md` 包含 `tasks:` 块，但本次 tick 没有任何任务到期。
- `heartbeat: unknown accountId` → heartbeat 投递目标使用了无效账号 id。
- `heartbeat skipped` 且 `reason=dm-blocked` → heartbeat 目标被解析为私信类目的地，而 `agents.defaults.heartbeat.directPolicy`（或每个智能体的覆盖设置）被设为 `block`。

相关内容：

- [/automation/cron-jobs#troubleshooting](/zh-CN/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/zh-CN/automation/cron-jobs)
- [/gateway/heartbeat](/zh-CN/gateway/heartbeat)

## 已配对节点的工具失败

如果某个节点已完成配对，但工具调用失败，请分别隔离前台状态、权限状态和批准状态。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

请检查：

- 节点在线，并具有预期能力。
- 相机、麦克风、位置、屏幕等操作系统权限是否已授予。
- Exec 批准和 allowlist 状态。

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

当浏览器工具操作失败，但 Gateway 网关本身健康时使用本节。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

请检查：

- 是否设置了 `plugins.allow`，并且其中包含 `browser`。
- 浏览器可执行文件路径是否有效。
- CDP 配置文件是否可达。
- `existing-session` / `user` 配置文件所需的本地 Chrome 是否可用。

常见特征：

- `unknown command "browser"` 或 `unknown command 'browser'` → 内置的 browser 插件被 `plugins.allow` 排除了。
- 浏览器工具缺失或不可用，而 `browser.enabled=true` → `plugins.allow` 排除了 `browser`，因此插件根本没有加载。
- `Failed to start Chrome CDP on port` → 浏览器进程启动失败。
- `browser.executablePath not found` → 配置的路径无效。
- `browser.cdpUrl must be http(s) or ws(s)` → 配置的 CDP URL 使用了不受支持的协议，例如 `file:` 或 `ftp:`。
- `browser.cdpUrl has invalid port` → 配置的 CDP URL 使用了错误或超出范围的端口。
- `No Chrome tabs found for profile="user"` → Chrome MCP 附加配置文件没有任何已打开的本地 Chrome 标签页。
- `Remote CDP for profile "<name>" is not reachable` → 从 Gateway 网关主机无法访问所配置的远程 CDP 端点。
- `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only 配置文件没有可达目标，或者 HTTP 端点有响应但 CDP WebSocket 仍无法打开。
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 当前 Gateway 网关安装不包含完整的 Playwright 包；ARIA 快照和基础页面截图仍可使用，但导航、AI 快照、基于 CSS 选择器的元素截图和 PDF 导出仍不可用。
- `fullPage is not supported for element screenshots` → 截图请求将 `--full-page` 与 `--ref` 或 `--element` 混用。
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 截图调用必须使用整页捕获或快照 `--ref`，不能使用 CSS `--element`。
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上传钩子需要使用快照引用，不能使用 CSS 选择器。
- `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP 配置文件中，每次调用只能上传一个文件。
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 配置文件中的对话框钩子不支持超时覆盖。
- `response body is not supported for existing-session profiles yet.` → `responsebody` 目前仍要求使用托管浏览器或原始 CDP 配置文件。
- attach-only 或远程 CDP 配置文件中存在陈旧的视口 / 深色模式 / 语言区域 / 离线覆盖状态 → 运行 `openclaw browser stop --browser-profile <name>` 关闭当前控制会话，释放 Playwright/CDP 模拟状态，而无需重启整个 Gateway 网关。

相关内容：

- [/tools/browser-linux-troubleshooting](/zh-CN/tools/browser-linux-troubleshooting)
- [/tools/browser](/zh-CN/tools/browser)

## 如果你升级后某些功能突然损坏

大多数升级后的故障都源于配置漂移，或者当前开始强制执行了更严格的默认值。

### 1）认证和 URL 覆盖行为已更改

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

检查内容：

- 如果 `gateway.mode=remote`，CLI 调用可能正在访问远程目标，而你的本地服务其实是正常的。
- 显式 `--url` 调用不会回退到已存储的凭证。

常见特征：

- `gateway connect failed:` → URL 目标错误。
- `unauthorized` → 端点可达，但认证错误。

### 2）绑定和认证护栏更严格了

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

检查内容：

- 非 loopback 绑定（`lan`、`tailnet`、`custom`）需要有效的 Gateway 网关认证路径：共享令牌/密码认证，或已正确配置的非 loopback `trusted-proxy` 部署。
- 旧键如 `gateway.token` 不能替代 `gateway.auth.token`。

常见特征：

- `refusing to bind gateway ... without auth` → 非 loopback 绑定但没有有效的 Gateway 网关认证路径。
- `RPC probe: failed` 而运行时仍在运行 → Gateway 网关存活，但当前认证或 URL 无法访问。

### 3）配对和设备身份状态已更改

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

检查内容：

- dashboard/节点是否存在待批准的设备请求。
- 在策略或身份变化后，私信是否存在待批准配对。

常见特征：

- `device identity required` → 未满足设备认证要求。
- `pairing required` → 发送者或设备必须先获批。

如果在这些检查之后，服务配置和运行时仍然不一致，请使用相同的 profile/状态目录重新安装服务元数据：

```bash
openclaw gateway install --force
openclaw gateway restart
```

相关内容：

- [/gateway/pairing](/zh-CN/gateway/pairing)
- [/gateway/authentication](/zh-CN/gateway/authentication)
- [/gateway/background-process](/zh-CN/gateway/background-process)
