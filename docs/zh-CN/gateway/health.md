---
read_when:
    - 诊断渠道连接性或 Gateway 网关健康状况
    - 了解健康检查 CLI 命令和选项
summary: 健康检查命令和 Gateway 网关健康监控
title: 健康检查
x-i18n:
    generated_at: "2026-04-28T11:52:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: f34b91ef5d54b0fac7c451e46e07d36520a7d08fb0dce0538c6158d0bc6982b8
    source_path: gateway/health.md
    workflow: 16
---

无需猜测即可验证渠道连接性的简短指南。

## 快速检查

- `openclaw status` — 本地摘要：Gateway 网关可达性/模式、更新提示、已关联渠道认证时长、会话 + 近期活动。
- `openclaw status --all` — 完整本地诊断（只读、彩色输出、可安全粘贴用于调试）。
- `openclaw status --deep` — 请求正在运行的 Gateway 网关执行实时健康探测（带有 `probe:true` 的 `health`），在支持时包括按账号划分的渠道探测。
- `openclaw health` — 请求正在运行的 Gateway 网关返回其健康快照（仅 WS；CLI 不直接打开渠道套接字）。
- `openclaw health --verbose` — 强制执行实时健康探测，并打印 Gateway 网关连接详情。
- `openclaw health --json` — 机器可读的健康快照输出。
- 在 WhatsApp/WebChat 中发送独立消息 `/status`，即可获取 Status 回复，而不会调用智能体。
- 日志：跟踪 `/tmp/openclaw/openclaw-*.log`，并筛选 `web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound`。

## 深度诊断

- 磁盘上的凭证：`ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（mtime 应该是近期时间）。
- 会话存储：`ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`（路径可在配置中覆盖）。数量和近期收件人会通过 `status` 展示。
- 重新关联流程：当日志中出现状态码 409–515 或 `loggedOut` 时，运行 `openclaw channels logout && openclaw channels login --verbose`。（注意：二维码登录流程在配对后遇到状态 515 会自动重启一次。）
- 诊断默认启用。除非设置了 `diagnostics.enabled: false`，否则 Gateway 网关会记录运行事实。内存事件会记录 RSS/堆字节数、阈值压力和增长压力。存活性警告会在进程仍在运行但已饱和时记录事件循环延迟、事件循环利用率、CPU 核心比率，以及活动/等待/排队会话数量。超大载荷事件会记录被拒绝、截断或分块的内容，以及可用时的大小和限制。它们不会记录消息文本、附件内容、webhook 正文、原始请求或响应正文、令牌、cookie 或密钥值。同一个心跳会启动有界稳定性记录器，可通过 `openclaw gateway stability` 或 `diagnostics.stability` Gateway 网关 RPC 访问。当存在事件时，致命 Gateway 网关退出、关闭超时和重启启动失败会将最新记录器快照持久化到 `~/.openclaw/logs/stability/`；使用 `openclaw gateway stability --bundle latest` 检查最新保存的包。
- 对于 bug 报告，请运行 `openclaw gateway diagnostics export` 并附上生成的 zip。该导出会组合 Markdown 摘要、最新稳定性包、已清理的日志元数据、已清理的 Gateway 网关 Status/健康快照，以及配置形态。它设计为可共享：聊天文本、webhook 正文、工具输出、凭证、cookie、账号/消息标识符和密钥值都会被省略或脱敏。参见[诊断导出](/zh-CN/gateway/diagnostics)。

## 健康监控配置

- `gateway.channelHealthCheckMinutes`：Gateway 网关检查渠道健康状态的频率。默认值：`5`。设置为 `0` 可全局禁用健康监控重启。
- `gateway.channelStaleEventThresholdMinutes`：已连接渠道在被健康监控视为过期并重启前可保持空闲的时长。默认值：`30`。保持此值大于或等于 `gateway.channelHealthCheckMinutes`。
- `gateway.channelMaxRestartsPerHour`：每个渠道/账号每小时滚动窗口内的健康监控重启上限。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：针对特定渠道禁用健康监控重启，同时保留全局监控启用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账号覆盖项，优先于渠道级设置。
- 这些按渠道覆盖项适用于目前公开该能力的内置渠道监控器：Discord、Google Chat、iMessage、Microsoft Teams、Signal、Slack、Telegram 和 WhatsApp。

## 出现故障时

- `logged out` 或状态 409–515 → 先用 `openclaw channels logout`，再用 `openclaw channels login` 重新关联。
- Gateway 网关不可达 → 启动它：`openclaw gateway --port 18789`（如果端口繁忙，请使用 `--force`）。
- 没有入站消息 → 确认已关联手机在线，并且发送者被允许（`channels.whatsapp.allowFrom`）；对于群聊，确保允许列表 + 提及规则匹配（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 专用的 “health” 命令

`openclaw health` 会请求正在运行的 Gateway 网关返回其健康快照（CLI 不直接打开渠道
套接字）。默认情况下，它可以返回最新缓存的 Gateway 网关快照；随后
Gateway 网关会在后台刷新该缓存。`openclaw health --verbose` 则会强制
实时探测。该命令会在可用时报告已关联凭证/认证时长、
按渠道划分的探测摘要、会话存储摘要和探测耗时。如果 Gateway 网关不可达，或探测失败/超时，它会以
非零状态退出。

选项：

- `--json`：机器可读的 JSON 输出
- `--timeout <ms>`：覆盖默认 10 秒探测超时
- `--verbose`：强制实时探测并打印 Gateway 网关连接详情
- `--debug`：`--verbose` 的别名

健康快照包括：`ok`（布尔值）、`ts`（时间戳）、`durationMs`（探测时间）、按渠道划分的状态、智能体可用性，以及会话存储摘要。

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [诊断导出](/zh-CN/gateway/diagnostics)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
