---
read_when:
    - 诊断渠道连接或 Gateway 健康状况
    - 了解健康检查 CLI 命令和选项
summary: 健康检查命令和 Gateway 网关健康监控
title: 健康检查
x-i18n:
    generated_at: "2026-07-12T14:27:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6cc015fcd8dc002eafac95fb3e7aa0b6f3be5b9995e94438e2fed539a561931d
    source_path: gateway/health.md
    workflow: 16
---

无需猜测即可验证渠道连接情况的简短指南。

## 快速检查

- `openclaw status` - 本地摘要：Gateway 网关可达性/模式、更新提示、已关联渠道的身份验证时长、会话和近期活动。
- `openclaw status --all` - 完整的本地诊断（只读、带颜色，可安全粘贴用于调试）。
- `openclaw status --deep` - 请求正在运行的 Gateway 网关执行实时探测（带有 `probe:true` 的 `health`），在支持时包括各账户的渠道探测。
- `openclaw status --usage` - 显示模型提供商的用量/配额快照。
- `openclaw health` - 请求正在运行的 Gateway 网关返回其健康快照（仅通过 WebSocket；CLI 不会直接建立渠道套接字）。
- `openclaw health --verbose`（别名 `--debug`）- 强制执行实时健康探测，并输出 Gateway 网关连接详情。
- `openclaw health --json` - 输出机器可读的健康快照。
- 在任意渠道中将 `/status` 作为独立聊天命令发送，无需调用智能体即可获得状态回复。
- 日志：跟踪 `/tmp/openclaw/openclaw-*.log`，并筛选 `web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound`。

对于 Discord 和其他聊天提供商，会话行并不代表套接字仍处于活动状态。
`openclaw sessions`、Gateway 网关的 `sessions.list` 以及智能体的 `sessions_list` 工具
读取的是已存储的对话状态。提供商可以重新连接并显示渠道状态健康，
而此时尚未生成任何新的会话行。请使用上述渠道状态和
健康命令检查实时连接情况。

## 深度诊断

- 磁盘上的凭据：`ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（mtime 应该是近期时间）。
- 会话存储：`ls -l ~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。`status` 会显示数量和近期收件人。
- 重新关联流程：当日志中出现状态码 409-515 或 `loggedOut` 时，运行 `openclaw channels logout && openclaw channels login --verbose`。配对后，如果状态码为 515，二维码登录流程会自动重启一次。
- 默认启用诊断（`diagnostics.enabled: false` 可将其禁用）。内存事件会记录 RSS/堆字节数，以及阈值/增长压力；严重内存压力会通过 Gateway 网关日志记录器写入日志，并且在设置 `diagnostics.memoryPressureSnapshot: true` 时，还会写入 OOM 前稳定性包（V8 堆统计信息、可用时的 Linux cgroup 计数器、活动资源数量，以及按脱敏相对路径列出的最大会话/转录文件）。当进程仍在运行但已饱和时，活性警告会记录事件循环延迟/利用率、CPU 核心比率，以及活动/等待中/已排队的会话数量。超大负载事件会记录哪些内容被拒绝/截断/分块，以及相应大小和限制，但绝不会记录消息文本、附件内容、webhook 正文、原始请求/响应正文、令牌、Cookie 或秘密值。
- 同一 Heartbeat 还会驱动有界稳定性记录器：`openclaw gateway stability`（或 `diagnostics.stability` Gateway RPC）。Gateway 网关致命退出、关闭超时、重启启动失败，以及（当 `diagnostics.memoryPressureSnapshot: true` 时）严重内存压力，都会将最新快照持久化到 `~/.openclaw/logs/stability/`。使用 `openclaw gateway stability --bundle latest` 检查最新的软件包。
- 对于错误报告，请运行 `openclaw gateway diagnostics export` 并附上生成的 zip 文件：其中包含 Markdown 摘要、最新的稳定性包、经过净化的日志元数据、经过净化的 Gateway 网关状态/健康快照，以及配置结构。聊天文本、webhook 正文、工具输出、凭据、Cookie、账户/消息标识符和秘密值会被省略或脱敏。请参阅[诊断导出](/zh-CN/gateway/diagnostics)。

## 健康监控配置

- `gateway.channelHealthCheckMinutes`：Gateway 网关检查渠道健康状况的频率。默认值：`5`。设置为 `0` 可在全局禁用健康监控重启。
- `gateway.channelStaleEventThresholdMinutes`：已连接渠道在健康监控将其视为过期并重启之前，可以保持空闲的时长。默认值：`30`。此值应大于或等于 `gateway.channelHealthCheckMinutes`。
- `gateway.channelMaxRestartsPerHour`：健康监控对每个渠道/账户执行重启的滚动一小时上限。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：在保持全局监控启用的同时，为特定渠道禁用健康监控重启。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账户覆盖设置，其优先级高于渠道级设置。
- 这些按渠道覆盖的设置适用于目前公开这些设置的内置渠道：Discord、Google Chat、iMessage、IRC、Microsoft Teams、Signal、Slack、Telegram 和 WhatsApp。

## 运行时间监控

外部运行时间监控服务应使用专用的 `/health` 端点，而不是 `/v1/chat/completions`。

- **应使用：** `GET /health` - 即时响应、不创建会话、不调用 LLM，并返回 `{"ok":true,"status":"live"}`
- **请勿使用：** `/v1/chat/completions` 执行健康检查 - 每个请求都会创建完整的智能体会话，包括 Skills 快照、上下文组装和 LLM 调用

如果未提供 `x-openclaw-session-key` 请求头或 `user` 字段，`/v1/chat/completions` 会为每个请求生成一个新的随机会话。每 15 分钟发出一次探测请求的监控服务每天会创建约 96 个会话，每个会话占用 4-22KB。长期如此会导致会话存储膨胀，并可能造成上下文窗口溢出。

### 监控服务设置示例

- **BetterStack：** 将健康检查 URL 设置为 `https://<your-gateway-host>:<port>/health`
- **UptimeRobot：** 添加一个新的 HTTP 监控，URL 为 `https://<your-gateway-host>:<port>/health`
- **通用方式：** 当 Gateway 网关健康时，任何发送到 `/health` 的 HTTP GET 请求都会返回 200 和 `{"ok":true}`

## 发生故障时

- 出现 `logged out` 或状态码 409-515 -> 先运行 `openclaw channels logout`，再运行 `openclaw channels login` 以重新关联。
- Gateway 网关不可达 -> 启动它：`openclaw gateway --port 18789`（如果端口被占用，请使用 `--force`）。
- 没有入站消息 -> 确认已关联的手机在线，且发送者在允许范围内（`channels.whatsapp.allowFrom`）；对于群聊，请确保允许列表和提及规则匹配（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 专用的 “health” 命令

`openclaw health` 请求正在运行的 Gateway 网关返回其健康快照（CLI 不会直接建立渠道
套接字）。默认情况下，它返回最新缓存的 Gateway 网关快照，而 Gateway 网关会在
后台刷新该缓存；`--verbose` 则会强制执行实时探测。
该命令会报告可用时的已关联凭据/身份验证时长、各渠道探测摘要、
会话存储摘要和探测持续时间。如果 Gateway 网关
不可达，或者探测失败/超时，它会以非零状态退出。

选项：

- `--json`：机器可读的 JSON 输出
- `--timeout <ms>`：覆盖默认的 10s 探测超时时间
- `--verbose`：强制执行实时探测，并输出 Gateway 网关连接详情
- `--debug`：`--verbose` 的别名

健康快照包括：`ok`（布尔值）、`ts`（时间戳）、`durationMs`（探测时间）、各渠道状态、智能体可用性和会话存储摘要。

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [诊断导出](/zh-CN/gateway/diagnostics)
- [Gateway 网关故障排查](/zh-CN/gateway/troubleshooting)
