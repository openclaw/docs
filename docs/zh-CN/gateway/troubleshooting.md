---
read_when:
    - 故障排除中心将你引导到这里进行更深入的诊断
    - 你需要带有精确命令的稳定、按症状分类的操作手册章节
summary: 针对 Gateway 网关、渠道、自动化、节点和浏览器的深入故障排除操作手册
title: 故障排除
x-i18n:
    generated_at: "2026-04-05T08:25:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 028226726e6adc45ca61d41510a953c4e21a3e85f3082af9e8085745c6ac3ec1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway 网关故障排除

本页面是深入操作手册。
如果你想先走快速分诊流程，请从 [/help/troubleshooting](/help/troubleshooting) 开始。

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

- `openclaw gateway status` 显示 `Runtime: running` 和 `RPC probe: ok`。
- `openclaw doctor` 报告没有阻塞性的配置/服务问题。
- `openclaw channels status --probe` 显示实时的逐账号传输状态，并且在支持的情况下显示探测/审计结果，例如 `works` 或 `audit ok`。

## Anthropic 429 需要额外用量以支持长上下文

当日志/错误中包含以下内容时使用本节：
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

检查：

- 选中的 Anthropic Opus/Sonnet 模型启用了 `params.context1m: true`。
- 当前的 Anthropic 凭证不具备长上下文用量资格。
- 请求仅在需要 1M beta 路径的长会话/模型运行中失败。

修复选项：

1. 为该模型禁用 `context1m`，回退到普通上下文窗口。
2. 使用带计费的 Anthropic API key，或在 Anthropic OAuth/订阅账号上启用 Anthropic Extra Usage。
3. 配置回退模型，以便在 Anthropic 长上下文请求被拒绝时，运行仍可继续。

相关内容：

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 没有回复

如果渠道已连接但没有任何响应，请在重新连接任何内容之前先检查路由和策略。

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

检查：

- 私信发送者是否仍在等待配对批准。
- 群组提及门控（`requireMention`、`mentionPatterns`）。
- 渠道/群组允许列表是否不匹配。

常见特征：

- `drop guild message (mention required` → 群组消息被忽略，直到出现提及。
- `pairing request` → 发送者需要批准。
- `blocked` / `allowlist` → 发送者/渠道被策略过滤。

相关内容：

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/pairing](/channels/pairing)
- [/channels/groups](/channels/groups)

## Dashboard Control UI 连接问题

当 dashboard/Control UI 无法连接时，请验证 URL、认证模式和安全上下文假设。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

检查：

- 正确的探测 URL 和 dashboard URL。
- 客户端与 Gateway 网关之间的认证模式/token 是否不匹配。
- 是否在需要设备身份的场景下使用了 HTTP。

常见特征：

- `device identity required` → 非安全上下文或缺少设备认证。
- `origin not allowed` → 浏览器 `Origin` 不在 `gateway.controlUi.allowedOrigins` 中
  （或者你正从非 loopback 浏览器 origin 连接，但未显式
  添加允许列表）。
- `device nonce required` / `device nonce mismatch` → 客户端未完成
  基于 challenge 的设备认证流程（`connect.challenge` + `device.nonce`）。
- `device signature invalid` / `device signature expired` → 客户端为当前握手签署了错误的
  负载（或使用了过期时间戳）。
- 带有 `canRetryWithDeviceToken=true` 的 `AUTH_TOKEN_MISMATCH` → 客户端可以使用缓存设备 token 进行一次可信重试。
- 该缓存 token 重试会复用与已配对
  设备 token 一起存储的缓存作用域集合。显式 `deviceToken` / 显式 `scopes` 调用方则保留其
  请求的作用域集合。
- 除该重试路径外，连接认证优先级依次为：显式共享
  token/password、显式 `deviceToken`、存储的设备 token、
  引导 token。
- 在异步 Tailscale Serve Control UI 路径上，同一
  `{scope, ip}` 的失败尝试会在限流器记录失败之前串行化。因此，同一客户端的两个错误并发重试，第二次尝试可能显示 `retry later`，而不是两个普通的不匹配错误。
- 来自浏览器 origin loopback 客户端的 `too many failed authentication attempts (retry later)` → 来自同一规范化 `Origin` 的重复失败会被暂时锁定；另一个 localhost origin 会使用单独的桶。
- 在该重试之后重复出现 `unauthorized` → 共享 token/设备 token 漂移；请刷新 token 配置，并在需要时重新批准/轮换设备 token。
- `gateway connect failed:` → host/port/url 目标错误。

### 认证详情代码速查表

使用失败 `connect` 响应中的 `error.details.code` 来选择下一步操作：

| Detail code                  | 含义 | 建议操作 |
| ---------------------------- | ---- | -------- |
| `AUTH_TOKEN_MISSING`         | 客户端未发送所需的共享 token。 | 在客户端中粘贴/设置 token 后重试。对于 dashboard 路径：运行 `openclaw config get gateway.auth.token`，然后粘贴到 Control UI 设置中。 |
| `AUTH_TOKEN_MISMATCH`        | 共享 token 与 Gateway 网关认证 token 不匹配。 | 如果 `canRetryWithDeviceToken=true`，允许一次可信重试。缓存 token 重试会复用已存储的批准作用域；显式 `deviceToken` / `scopes` 调用方保留所请求的作用域。如果仍失败，请运行 [令牌漂移恢复清单](/cli/devices#token-drift-recovery-checklist)。 |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 缓存的每设备 token 已过期或被撤销。 | 使用 [devices CLI](/cli/devices) 轮换/重新批准设备 token，然后重新连接。 |
| `PAIRING_REQUIRED`           | 设备身份已知，但尚未针对该角色获得批准。 | 批准待处理请求：`openclaw devices list` 然后执行 `openclaw devices approve <requestId>`。 |

设备认证 v2 迁移检查：

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

如果日志显示 nonce/signature 错误，请更新正在连接的客户端并验证它：

1. 等待 `connect.challenge`
2. 对绑定 challenge 的负载进行签名
3. 使用相同的 challenge nonce 发送 `connect.params.device.nonce`

如果 `openclaw devices rotate` / `revoke` / `remove` 被意外拒绝：

- 已配对设备 token 会话只能管理**自己的**设备，除非
  调用方还具有 `operator.admin`
- `openclaw devices rotate --scope ...` 只能请求
  调用方当前会话已拥有的 operator 作用域

相关内容：

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/gateway/configuration)（gateway 认证模式）
- [/gateway/trusted-proxy-auth](/gateway/trusted-proxy-auth)
- [/gateway/remote](/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway 网关服务未运行

当服务已安装但进程无法持续运行时，请使用本节。

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

检查：

- 带退出提示的 `Runtime: stopped`。
- 服务配置不匹配（`Config (cli)` 与 `Config (service)`）。
- 端口/监听器冲突。
- 使用 `--deep` 时，是否存在额外的 launchd/systemd/schtasks 安装。
- `Other gateway-like services detected (best effort)` 清理提示。

常见特征：

- `Gateway start blocked: set gateway.mode=local` 或 `existing config is missing gateway.mode` → 未启用本地 gateway 模式，或配置文件被覆盖导致丢失了 `gateway.mode`。修复方法：在你的配置中设置 `gateway.mode="local"`，或重新运行 `openclaw onboard --mode local` / `openclaw setup` 以重新写入预期的本地模式配置。如果你通过 Podman 运行 OpenClaw，默认配置路径是 `~/.openclaw/openclaw.json`。
- `refusing to bind gateway ... without auth` → 非 loopback 绑定，且没有有效的 gateway 认证路径（token/password，或在配置正确时使用 trusted-proxy）。
- `another gateway instance is already listening` / `EADDRINUSE` → 端口冲突。
- `Other gateway-like services detected (best effort)` → 存在过期或并行的 launchd/systemd/schtasks 单元。大多数部署应保持每台机器一个 gateway；如果你确实需要多个，请隔离端口 + 配置/状态/工作区。参见 [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host)。

相关内容：

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

## Gateway 网关探测警告

当 `openclaw gateway probe` 能连接到某个目标，但仍打印警告块时，请使用本节。

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

检查：

- JSON 输出中的 `warnings[].code` 和 `primaryTargetId`。
- 该警告是否与 SSH 回退、多个 Gateway 网关、缺失作用域或未解析认证引用有关。

常见特征：

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 设置失败，但命令仍尝试了直接的已配置/loopback 目标。
- `multiple reachable gateways detected` → 有多个目标响应。通常意味着有意的多 Gateway 网关部署，或存在过期/重复监听器。
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → 连接成功，但详细 RPC 受作用域限制；请配对设备身份或使用带有 `operator.read` 的凭证。
- 未解析的 `gateway.auth.*` / `gateway.remote.*` SecretRef 警告文本 → 在当前命令路径中，该目标失败时认证材料不可用。

相关内容：

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host)
- [/gateway/remote](/gateway/remote)

## 渠道已连接但消息不流动

如果渠道状态显示已连接，但消息流已停止，请重点检查策略、权限和渠道特定投递规则。

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

检查：

- 私信策略（`pairing`、`allowlist`、`open`、`disabled`）。
- 群组允许列表和提及要求。
- 缺失的渠道 API 权限/作用域。

常见特征：

- `mention required` → 消息因群组提及策略而被忽略。
- `pairing` / 待批准痕迹 → 发送者尚未获批。
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → 渠道认证/权限问题。

相关内容：

- [/channels/troubleshooting](/channels/troubleshooting)
- [/channels/whatsapp](/channels/whatsapp)
- [/channels/telegram](/channels/telegram)
- [/channels/discord](/channels/discord)

## Cron 和 heartbeat 投递

如果 cron 或 heartbeat 未运行或未投递，请先验证调度器状态，然后检查投递目标。

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

检查：

- 是否启用了 cron，且存在下次唤醒时间。
- 作业运行历史状态（`ok`、`skipped`、`error`）。
- heartbeat 跳过原因（`quiet-hours`、`requests-in-flight`、`alerts-disabled`、`empty-heartbeat-file`、`no-tasks-due`）。

常见特征：

- `cron: scheduler disabled; jobs will not run automatically` → cron 已禁用。
- `cron: timer tick failed` → 调度器 tick 失败；请检查文件/日志/运行时错误。
- 带有 `reason=quiet-hours` 的 `heartbeat skipped` → 当前不在活跃时间窗口内。
- 带有 `reason=empty-heartbeat-file` 的 `heartbeat skipped` → `HEARTBEAT.md` 存在，但仅包含空行 / Markdown 标题，因此 OpenClaw 会跳过模型调用。
- 带有 `reason=no-tasks-due` 的 `heartbeat skipped` → `HEARTBEAT.md` 包含 `tasks:` 块，但在本次 tick 中没有任何任务到期。
- `heartbeat: unknown accountId` → heartbeat 投递目标使用了无效的账号 id。
- 带有 `reason=dm-blocked` 的 `heartbeat skipped` → heartbeat 目标被解析为私信式目标，而 `agents.defaults.heartbeat.directPolicy`（或每智能体覆盖）设置为 `block`。

相关内容：

- [/automation/cron-jobs#troubleshooting](/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

## 节点已配对但工具失败

如果节点已配对但工具调用失败，请分别排查前台状态、权限和审批状态。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

检查：

- 节点是否在线并具有预期能力。
- 相机/麦克风/定位/屏幕的操作系统权限是否已授予。
- Exec 审批和允许列表状态。

常见特征：

- `NODE_BACKGROUND_UNAVAILABLE` → 节点应用必须处于前台。
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → 缺少操作系统权限。
- `SYSTEM_RUN_DENIED: approval required` → exec 审批待处理。
- `SYSTEM_RUN_DENIED: allowlist miss` → 命令被允许列表阻止。

相关内容：

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

## 浏览器工具失败

当浏览器工具操作失败，但 gateway 本身是健康的时，请使用本节。

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

检查：

- 是否设置了 `plugins.allow` 且其中包含 `browser`。
- 浏览器可执行文件路径是否有效。
- CDP 配置档案是否可达。
- 对于 `existing-session` / `user` 配置档案，本地 Chrome 是否可用。

常见特征：

- `unknown command "browser"` 或 `unknown command 'browser'` → 内置 browser 插件被 `plugins.allow` 排除了。
- 在 `browser.enabled=true` 的情况下 browser 工具缺失 / 不可用 → `plugins.allow` 排除了 `browser`，因此插件从未加载。
- `Failed to start Chrome CDP on port` → 浏览器进程启动失败。
- `browser.executablePath not found` → 配置的路径无效。
- `browser.cdpUrl must be http(s) or ws(s)` → 配置的 CDP URL 使用了不受支持的协议，例如 `file:` 或 `ftp:`。
- `browser.cdpUrl has invalid port` → 配置的 CDP URL 具有错误或超出范围的端口。
- `No Chrome tabs found for profile="user"` → Chrome MCP 附加配置档案没有打开的本地 Chrome 标签页。
- `Remote CDP for profile "<name>" is not reachable` → 从 gateway 主机无法访问配置的远程 CDP 端点。
- `Browser attachOnly is enabled ... not reachable` 或 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only 配置档案没有可达目标，或者 HTTP 端点虽有响应，但 CDP WebSocket 仍无法打开。
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 当前 gateway 安装缺少完整的 Playwright 包；ARIA 快照和基础页面截图仍可工作，但导航、AI 快照、基于 CSS 选择器的元素截图和 PDF 导出仍不可用。
- `fullPage is not supported for element screenshots` → 截图请求同时混用了 `--full-page` 与 `--ref` 或 `--element`。
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 截图调用必须使用页面捕获或快照 `--ref`，不能使用 CSS `--element`。
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 上传 hook 需要使用快照引用，而不是 CSS 选择器。
- `existing-session file uploads currently support one file at a time.` → 在 Chrome MCP 配置档案上每次调用只发送一个上传文件。
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 配置档案上的对话框 hook 不支持超时覆盖。
- `response body is not supported for existing-session profiles yet.` → `responsebody` 仍需要托管浏览器或原始 CDP 配置档案。
- attach-only 或远程 CDP 配置档案上的过期 viewport / dark-mode / locale / offline 覆盖 → 运行 `openclaw browser stop --browser-profile <name>` 以关闭当前活动控制会话，并释放 Playwright/CDP 仿真状态，而无需重启整个 gateway。

相关内容：

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/browser](/tools/browser)

## 如果你升级后突然出现故障

大多数升级后的故障都是配置漂移，或之前宽松、现在开始强制执行的默认值所致。

### 1) 认证和 URL 覆盖行为已改变

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

检查要点：

- 如果 `gateway.mode=remote`，CLI 调用可能指向远程目标，而你的本地服务其实是正常的。
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

检查要点：

- 非 loopback 绑定（`lan`、`tailnet`、`custom`）需要有效的 gateway 认证路径：共享 token/password 认证，或正确配置的非 loopback `trusted-proxy` 部署。
- `gateway.token` 之类的旧键不能替代 `gateway.auth.token`。

常见特征：

- `refusing to bind gateway ... without auth` → 非 loopback 绑定，但没有有效的 gateway 认证路径。
- `RPC probe: failed` 且运行时显示为 running → gateway 存活，但使用当前 auth/url 无法访问。

### 3) 配对和设备身份状态已改变

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

检查要点：

- dashboard/节点是否存在待批准设备。
- 在策略或身份变更后，私信配对批准是否待处理。

常见特征：

- `device identity required` → 设备认证未满足。
- `pairing required` → 发送者/设备必须获得批准。

如果检查之后服务配置与运行时仍不一致，请从同一个配置档案/状态目录重新安装服务元数据：

```bash
openclaw gateway install --force
openclaw gateway restart
```

相关内容：

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)
