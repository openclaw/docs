---
read_when:
    - 诊断渠道连通性或 Gateway 网关健康状况
    - 了解健康检查 CLI 命令和选项
summary: 健康检查命令和 Gateway 网关健康监控
title: 健康检查
x-i18n:
    generated_at: "2026-05-02T07:01:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf1e0073a09592c6502f697e615f44d0f1a960caf4599888a8b72f22098c1e91
    source_path: gateway/health.md
    workflow: 16
---

无需猜测即可验证渠道连接性的简短指南。

## 快速检查

- `openclaw status` — 本地摘要：Gateway 网关可达性/模式、更新提示、已关联渠道凭证年龄、会话 + 最近活动。
- `openclaw status --all` — 完整本地诊断（只读、彩色、可安全粘贴用于调试）。
- `openclaw status --deep` — 请求正在运行的 Gateway 网关执行实时健康探测（带 `probe:true` 的 `health`），在支持时包含按账号的渠道探测。
- `openclaw health` — 请求正在运行的 Gateway 网关提供其健康快照（仅 WS；CLI 不直接连接渠道套接字）。
- `openclaw health --verbose` — 强制执行实时健康探测并打印 Gateway 网关连接详情。
- `openclaw health --json` — 机器可读的健康快照输出。
- 在 WhatsApp/WebChat 中发送独立消息 `/status`，无需调用智能体即可获得 Status 回复。
- 日志：跟踪 `/tmp/openclaw/openclaw-*.log`，并筛选 `web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound`。

对于 Discord 和其他聊天提供商，会话行并不代表套接字存活状态。
`openclaw sessions`、Gateway 网关 `sessions.list` 和智能体 `sessions_list` 工具
读取的是已存储的对话状态。提供商可以重新连接并显示健康的渠道
Status，而此时可能尚未物化任何新的会话行。请使用上面的渠道 Status 和
健康命令进行实时连接性检查。

## 深度诊断

- 磁盘上的凭据：`ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（mtime 应该是近期时间）。
- 会话存储：`ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`（路径可在配置中覆盖）。计数和最近收件人会通过 `status` 展示。
- 重新关联流程：当日志中出现 Status 代码 409–515 或 `loggedOut` 时，运行 `openclaw channels logout && openclaw channels login --verbose`。（注意：二维码登录流程在配对后遇到 Status 515 时会自动重启一次。）
- 诊断默认启用。除非设置了 `diagnostics.enabled: false`，否则 Gateway 网关会记录运行事实。内存事件记录 RSS/堆字节数、阈值压力和增长压力。存活性警告会在进程正在运行但已饱和时记录事件循环延迟、事件循环利用率、CPU 核心比率，以及活动/等待/排队的会话计数。超大负载事件会记录被拒绝、截断或分块的内容，以及可用时的大小和限制。它们不会记录消息文本、附件内容、webhook 正文、原始请求或响应正文、token、cookie 或秘密值。同一个 Heartbeat 会启动有界稳定性记录器，可通过 `openclaw gateway stability` 或 `diagnostics.stability` Gateway 网关 RPC 访问。当存在事件时，致命 Gateway 网关退出、关机超时和重启启动失败会将最新的记录器快照持久化到 `~/.openclaw/logs/stability/` 下；使用 `openclaw gateway stability --bundle latest` 检查最新保存的包。
- 对于缺陷报告，运行 `openclaw gateway diagnostics export` 并附上生成的 zip。导出内容会组合 Markdown 摘要、最新稳定性包、已脱敏日志元数据、已脱敏 Gateway 网关 Status/健康快照和配置形状。它适合共享：聊天文本、webhook 正文、工具输出、凭据、cookie、账号/消息标识符和秘密值都会被省略或遮蔽。参见 [诊断导出](/zh-CN/gateway/diagnostics)。

## 健康监控配置

- `gateway.channelHealthCheckMinutes`：Gateway 网关检查渠道健康的频率。默认值：`5`。设置为 `0` 可全局禁用健康监控重启。
- `gateway.channelStaleEventThresholdMinutes`：已连接渠道在被健康监控视为陈旧并重启之前可以保持空闲的时长。默认值：`30`。保持该值大于或等于 `gateway.channelHealthCheckMinutes`。
- `gateway.channelMaxRestartsPerHour`：每个渠道/账号的健康监控重启滚动一小时上限。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：为特定渠道禁用健康监控重启，同时保留全局监控启用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账号覆盖项，优先级高于渠道级设置。
- 这些按渠道覆盖项适用于目前公开它们的内置渠道监控器：Discord、Google Chat、iMessage、Microsoft Teams、Signal、Slack、Telegram 和 WhatsApp。

## 当出现故障时

- `logged out` 或 Status 409–515 → 先用 `openclaw channels logout`，再用 `openclaw channels login` 重新关联。
- Gateway 网关不可达 → 启动它：`openclaw gateway --port 18789`（如果端口被占用，请使用 `--force`）。
- 没有入站消息 → 确认已关联手机在线且发送者被允许（`channels.whatsapp.allowFrom`）；对于群聊，确保允许列表 + 提及规则匹配（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 专用 “health” 命令

`openclaw health` 请求正在运行的 Gateway 网关提供其健康快照（CLI 不直接连接渠道
套接字）。默认情况下，它可以返回新的缓存 Gateway 网关快照；随后
Gateway 网关会在后台刷新该缓存。`openclaw health --verbose` 会改为强制执行
实时探测。该命令会在可用时报告已关联凭据/凭证年龄、
按渠道探测摘要、会话存储摘要和探测耗时。如果 Gateway 网关不可达，或探测失败/超时，它会以
非零状态退出。

选项：

- `--json`：机器可读的 JSON 输出
- `--timeout <ms>`：覆盖默认的 10 秒探测超时
- `--verbose`：强制执行实时探测并打印 Gateway 网关连接详情
- `--debug`：`--verbose` 的别名

健康快照包括：`ok`（布尔值）、`ts`（时间戳）、`durationMs`（探测时间）、按渠道 Status、智能体可用性和会话存储摘要。

## 相关

- [Gateway 网关运行手册](/zh-CN/gateway)
- [诊断导出](/zh-CN/gateway/diagnostics)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
