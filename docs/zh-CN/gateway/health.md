---
read_when:
    - 诊断渠道连接性或 Gateway 健康
    - 理解健康检查 CLI 命令和选项
summary: 健康检查命令和 Gateway 健康监控
title: 健康检查
x-i18n:
    generated_at: "2026-07-05T11:18:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930bd0f5b91bd4e7abb79a3e0f13eb59317023b796106cf0f0fdc0af51d657fe
    source_path: gateway/health.md
    workflow: 16
---

用于验证渠道连通性的简短指南，避免猜测。

## 快速检查

- `openclaw status` - 本地摘要：Gateway 网关可达性/模式、更新提示、已关联渠道凭证年龄、会话 + 最近活动。
- `openclaw status --all` - 完整本地诊断（只读、彩色输出、可安全粘贴用于调试）。
- `openclaw status --deep` - 请求正在运行的 Gateway 网关执行实时探测（带 `probe:true` 的 `health`），在支持时包括按账号的渠道探测。
- `openclaw status --usage` - 显示模型提供商用量/配额快照。
- `openclaw health` - 请求正在运行的 Gateway 网关返回其健康快照（仅 WS；CLI 不直接连接渠道套接字）。
- `openclaw health --verbose`（别名 `--debug`）- 强制执行实时健康探测并打印 Gateway 网关连接详情。
- `openclaw health --json` - 机器可读的健康快照输出。
- 在任意渠道中将 `/status` 作为独立聊天命令发送，即可获得状态回复，而不会调用智能体。
- 日志：tail `/tmp/openclaw/openclaw-*.log` 并按 `web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound` 过滤。

对于 Discord 和其他聊天提供商，会话行并不代表套接字存活状态。
`openclaw sessions`、Gateway 网关 `sessions.list` 和智能体 `sessions_list` 工具
读取的是已存储的对话状态。提供商可以重新连接并显示健康的渠道
状态，而任何新的会话行尚未物化。请使用上面的渠道状态和
健康命令进行实时连通性检查。

## 深度诊断

- 磁盘上的凭证：`ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（mtime 应该较新）。
- 会话存储：`ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`（路径可在配置中覆盖）。数量和最近收件人会通过 `status` 显示。
- 重新关联流程：当日志中出现状态码 409-515 或 `loggedOut` 时，运行 `openclaw channels logout && openclaw channels login --verbose`。配对后，二维码登录流程会针对状态 515 自动重启一次。
- 诊断默认启用（`diagnostics.enabled: false` 会禁用）。内存事件会记录 RSS/heap 字节数以及阈值/增长压力；严重内存压力会通过 Gateway 网关日志器记录，并且当设置了 `diagnostics.memoryPressureSnapshot: true` 时，还会写入一个 OOM 前稳定性包（V8 堆统计、可用时的 Linux cgroup 计数器、活动资源数量、按已脱敏相对路径列出的最大会话/转录文件）。存活性警告会在进程仍在运行但已饱和时记录事件循环延迟/利用率、CPU 核心比率以及活动/等待中/排队的会话数量。超大负载事件会记录被拒绝/截断/分块的内容以及大小和限制，但绝不会记录消息文本、附件内容、webhook 正文、原始请求/响应正文、token、cookie 或密钥值。
- 同一个心跳也驱动有界稳定性记录器：`openclaw gateway stability`（或 `diagnostics.stability` Gateway 网关 RPC）。致命 Gateway 网关退出、关闭超时、重启启动失败，以及（当 `diagnostics.memoryPressureSnapshot: true` 时）严重内存压力，都会将最新快照持久化到 `~/.openclaw/logs/stability/` 下。使用 `openclaw gateway stability --bundle latest` 检查最新包。
- 对于 bug 报告，请运行 `openclaw gateway diagnostics export` 并附上生成的 zip：Markdown 摘要、最新稳定性包、已脱敏日志元数据、已脱敏 Gateway 网关状态/健康快照，以及配置形状。聊天文本、webhook 正文、工具输出、凭证、cookie、账号/消息标识符和密钥值都会被省略或脱敏。参见 [诊断导出](/zh-CN/gateway/diagnostics)。

## 健康监控配置

- `gateway.channelHealthCheckMinutes`：Gateway 网关检查渠道健康的频率。默认值：`5`。设为 `0` 可全局禁用健康监控重启。
- `gateway.channelStaleEventThresholdMinutes`：已连接渠道可保持空闲多长时间，之后健康监控会将其视为过期并重启。默认值：`30`。保持该值大于或等于 `gateway.channelHealthCheckMinutes`。
- `gateway.channelMaxRestartsPerHour`：每个渠道/账号由健康监控触发的重启在滚动一小时窗口内的上限。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：为特定渠道禁用健康监控重启，同时保留全局监控启用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账号覆盖设置，优先于渠道级设置。
- 这些按渠道覆盖适用于当前暴露它们的内置渠道：Discord、Google Chat、iMessage、IRC、Microsoft Teams、Signal、Slack、Telegram 和 WhatsApp。

## 正常运行时间监控

外部正常运行时间监控服务应使用专用的 `/health` 端点，而不是 `/v1/chat/completions`。

- **应该使用：** `GET /health` - 即时响应，不创建会话，不调用 LLM，返回 `{"ok":true,"status":"live"}`
- **不要使用：** `/v1/chat/completions` 进行健康检查 - 每个请求都会创建一个完整的智能体会话，包括技能快照、上下文组装和 LLM 调用

当未提供 `x-openclaw-session-key` 请求头或 `user` 字段时，`/v1/chat/completions` 会为每个请求生成一个新的随机会话。每 15 分钟 ping 一次的监控服务会创建约 96 个会话/天，每个会话消耗 4-22KB。随着时间推移，这会导致会话存储膨胀，并可能引发上下文窗口溢出。

### 监控服务设置示例

- **BetterStack：** 将健康检查 URL 设置为 `https://<your-gateway-host>:<port>/health`
- **UptimeRobot：** 添加一个新的 HTTP 监控，URL 为 `https://<your-gateway-host>:<port>/health`
- **通用：** 当 Gateway 网关健康时，任何发往 `/health` 的 HTTP GET 都会返回 200 和 `{"ok":true}`

## 当某些内容失败时

- `logged out` 或状态 409-515 -> 先用 `openclaw channels logout`，再用 `openclaw channels login` 重新关联。
- Gateway 网关不可达 -> 启动它：`openclaw gateway --port 18789`（如果端口被占用，使用 `--force`）。
- 没有入站消息 -> 确认已关联手机在线，并且发送者被允许（`channels.whatsapp.allowFrom`）；对于群聊，确保允许列表 + 提及规则匹配（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 专用 “health” 命令

`openclaw health` 会请求正在运行的 Gateway 网关返回其健康快照（CLI 不直接连接渠道
套接字）。默认情况下，它返回一个新的缓存 Gateway 网关快照，并且
Gateway 网关会在后台刷新该缓存；`--verbose` 则会强制执行实时探测。
该命令会在可用时报告已关联凭证/凭证年龄、按渠道探测摘要、
会话存储摘要和探测持续时间。如果 Gateway 网关
不可达，或探测失败/超时，它会以非零状态退出。

选项：

- `--json`：机器可读的 JSON 输出
- `--timeout <ms>`：覆盖默认 10s 探测超时
- `--verbose`：强制执行实时探测并打印 Gateway 网关连接详情
- `--debug`：`--verbose` 的别名

健康快照包括：`ok`（布尔值）、`ts`（时间戳）、`durationMs`（探测时间）、按渠道状态、智能体可用性，以及会话存储摘要。

## 相关

- [Gateway 网关运行手册](/zh-CN/gateway)
- [诊断导出](/zh-CN/gateway/diagnostics)
- [Gateway 网关故障排查](/zh-CN/gateway/troubleshooting)
