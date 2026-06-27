---
read_when:
    - 诊断渠道连接或 Gateway 健康
    - 理解健康检查 CLI 命令和选项
summary: 健康检查命令和 Gateway 健康监控
title: 健康检查
x-i18n:
    generated_at: "2026-06-27T02:02:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d6475bef9fead191c11a801151d4fab76c47034d3f30f90a18c15d6e32b5d26
    source_path: gateway/health.md
    workflow: 16
---

无需猜测即可验证频道连接性的简短指南。

## 快速检查

- `openclaw status` — 本地摘要：Gateway 网关可达性/模式、更新提示、已关联频道凭证时长、会话 + 最近活动。
- `openclaw status --all` — 完整本地诊断（只读、彩色、可安全粘贴用于调试）。
- `openclaw status --deep` — 请求正在运行的 Gateway 网关执行实时健康探测（带有 `probe:true` 的 `health`），在支持时包括按账号的频道探测。
- `openclaw health` — 请求正在运行的 Gateway 网关返回健康快照（仅 WS；CLI 不直接打开频道 socket）。
- `openclaw health --verbose` — 强制执行实时健康探测，并打印 Gateway 网关连接详情。
- `openclaw health --json` — 输出机器可读的健康快照。
- 在 WhatsApp/WebChat 中将 `/status` 作为独立消息发送，以获得状态回复，而不调用智能体。
- 日志：tail `/tmp/openclaw/openclaw-*.log` 并筛选 `web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound`。

对于 Discord 和其他聊天提供商，会话行并不代表 socket 存活状态。
`openclaw sessions`、Gateway 网关 `sessions.list` 和智能体 `sessions_list` 工具
读取的是已存储的对话状态。提供商可以重新连接并显示健康的频道
状态，而新的会话行尚未物化。请使用上面的频道状态和
健康命令来执行实时连接性检查。

## 深度诊断

- 磁盘上的凭证：`ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（mtime 应该较新）。
- 会话存储：`ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`（路径可在配置中覆盖）。`status` 会显示数量和最近收件人。
- 重新关联流程：当日志中出现状态码 409–515 或 `loggedOut` 时，运行 `openclaw channels logout && openclaw channels login --verbose`。（注意：配对后，二维码登录流程会在状态 515 时自动重启一次。）
- 诊断默认启用。除非设置了 `diagnostics.enabled: false`，否则 Gateway 网关会记录运行事实。内存事件会记录 RSS/heap 字节数、阈值压力和增长压力。关键内存压力会通过 Gateway 网关日志器记录。当设置 `diagnostics.memoryPressureSnapshot: true` 时，关键内存压力还会写入一个 OOM 前稳定性包，其中包含 V8 heap 统计、可用时的 Linux cgroup 计数器、活动资源计数，以及按已脱敏相对路径列出的最大会话/转录文件。存活性警告会在进程仍在运行但已饱和时记录事件循环延迟、事件循环利用率、CPU 核心比率，以及活动/等待中/排队的会话数量。超大载荷事件会记录被拒绝、截断或分块的内容，以及可用时的大小和限制。它们不会记录消息文本、附件内容、webhook 正文、原始请求或响应正文、令牌、cookie 或密钥值。同一个心跳会启动有界稳定性记录器，可通过 `openclaw gateway stability` 或 `diagnostics.stability` Gateway 网关 RPC 访问。致命 Gateway 网关退出、关闭超时和重启启动失败会在存在事件时将最新记录器快照持久化到 `~/.openclaw/logs/stability/` 下；关键内存压力仅在设置 `diagnostics.memoryPressureSnapshot: true` 时也会这样做。使用 `openclaw gateway stability --bundle latest` 检查最新保存的包。
- 对于错误报告，运行 `openclaw gateway diagnostics export` 并附上生成的 zip。该导出会组合 Markdown 摘要、最新稳定性包、已净化的日志元数据、已净化的 Gateway 网关状态/健康快照，以及配置形态。它适合共享：聊天文本、webhook 正文、工具输出、凭证、cookie、账号/消息标识符和密钥值都会被省略或脱敏。参见[诊断导出](/zh-CN/gateway/diagnostics)。

## 健康监控配置

- `gateway.channelHealthCheckMinutes`：Gateway 网关检查频道健康的频率。默认值：`5`。设置为 `0` 可全局禁用健康监控重启。
- `gateway.channelStaleEventThresholdMinutes`：已连接频道在被健康监控视为过期并重启前可以保持空闲的时长。默认值：`30`。保持它大于或等于 `gateway.channelHealthCheckMinutes`。
- `gateway.channelMaxRestartsPerHour`：每个频道/账号在滚动一小时内的健康监控重启上限。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：在保持全局监控启用的同时，禁用特定频道的健康监控重启。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账号覆盖项，优先于频道级设置。
- 这些按频道覆盖项适用于当前公开这些设置的内置频道监控：Discord、Google Chat、iMessage、Microsoft Teams、Signal、Slack、Telegram 和 WhatsApp。

## 正常运行时间监控

外部正常运行时间监控服务应使用专用的 `/health` 端点，而不是 `/v1/chat/completions`。

- **应使用：** `GET /health` — 即时响应，不创建会话，不调用 LLM，返回 `{"ok":true,"status":"live"}`
- **不要使用：** `/v1/chat/completions` 进行健康检查 — 每个请求都会创建一个完整智能体会话，包括 skill 快照、上下文组装和 LLM 调用

当未提供 `x-openclaw-session-key` 标头或 `user` 字段时，`/v1/chat/completions` 会为每个请求生成一个新的随机会话。每 15 分钟 ping 一次的监控服务每天会创建约 96 个会话，每个会话消耗 4–22KB。随着时间推移，这会导致会话存储膨胀，并可能引发上下文窗口溢出。

### 监控服务设置示例

- **BetterStack：** 将健康检查 URL 设置为 `https://<your-gateway-host>:<port>/health`
- **UptimeRobot：** 添加一个新的 HTTP 监控器，URL 为 `https://<your-gateway-host>:<port>/health`
- **通用：** 当 Gateway 网关健康时，对 `/health` 的任何 HTTP GET 都会返回 200 和 `{"ok":true}`

## 当某些内容失败时

- `logged out` 或状态 409–515 → 先使用 `openclaw channels logout`，再使用 `openclaw channels login` 重新关联。
- Gateway 网关不可达 → 启动它：`openclaw gateway --port 18789`（如果端口被占用，使用 `--force`）。
- 没有入站消息 → 确认已关联的手机在线，并且发送者被允许（`channels.whatsapp.allowFrom`）；对于群聊，确保 allowlist + 提及规则匹配（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 专用的 “health” 命令

`openclaw health` 请求正在运行的 Gateway 网关返回其健康快照（CLI 不直接打开频道
socket）。默认情况下，它可以返回一个新的缓存 Gateway 网关快照；
随后 Gateway 网关会在后台刷新该缓存。`openclaw health --verbose` 会强制
执行实时探测。该命令会在可用时报告已关联凭证/凭证时长、
按频道探测摘要、会话存储摘要和探测耗时。如果 Gateway 网关不可达或探测失败/超时，它会以
非零状态退出。

选项：

- `--json`：机器可读的 JSON 输出
- `--timeout <ms>`：覆盖默认 10 秒探测超时
- `--verbose`：强制执行实时探测，并打印 Gateway 网关连接详情
- `--debug`：`--verbose` 的别名

健康快照包括：`ok`（布尔值）、`ts`（时间戳）、`durationMs`（探测时间）、按频道状态、智能体可用性和会话存储摘要。

## 相关

- [Gateway 网关运行手册](/zh-CN/gateway)
- [诊断导出](/zh-CN/gateway/diagnostics)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
