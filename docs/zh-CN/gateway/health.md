---
read_when:
    - 诊断渠道连接或 Gateway 网关健康状况
    - 了解健康检查 CLI 命令和选项
summary: 健康检查命令和 Gateway 网关健康监控
title: 健康检查
x-i18n:
    generated_at: "2026-04-23T00:48:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5ddcbe6fa913c5ba889f78cb417124c96b562cf8939410b1d6f66042dfb51a9f
    source_path: gateway/health.md
    workflow: 15
---

# 健康检查（CLI）

用于验证渠道连接性的简明指南，无需靠猜测。

## 快速检查

- `openclaw status` — 本地摘要：Gateway 网关可达性/模式、更新提示、已关联渠道的凭证有效期、会话 + 最近活动。
- `openclaw status --all` — 完整本地诊断（只读、带颜色、可安全粘贴用于调试）。
- `openclaw status --deep` — 向正在运行的 Gateway 网关请求实时健康探测（`health` 且 `probe:true`），包括支持时按账号划分的渠道探测。
- `openclaw health` — 向正在运行的 Gateway 网关请求其健康快照（仅 `WS`；CLI 不会直接连接渠道套接字）。
- `openclaw health --verbose` — 强制执行实时健康探测，并打印 Gateway 网关连接详情。
- `openclaw health --json` — 机器可读的健康快照输出。
- 在 WhatsApp/WebChat 中单独发送 `/status` 消息，可在不调用智能体的情况下获取状态回复。
- 日志：跟踪 `/tmp/openclaw/openclaw-*.log`，并筛选 `web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound`。

## 深度诊断

- 磁盘上的凭证：`ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（`mtime` 应该是最近的）。
- 会话存储：`ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`（路径可在配置中覆盖）。`status` 会显示数量和最近的接收方。
- 重新关联流程：当日志中出现状态码 `409–515` 或 `loggedOut` 时，运行 `openclaw channels logout && openclaw channels login --verbose`。（注意：配对后，二维码登录流程会在状态 `515` 时自动重启一次。）
- 默认启用诊断。除非设置了 `diagnostics.enabled: false`，否则 Gateway 网关会记录运行事实。内存事件会记录 RSS/堆字节数、阈值压力和增长压力。超大负载事件会记录哪些内容被拒绝、截断或分块，以及可用时的大小和限制。它们不会记录消息文本、附件内容、webhook 正文、原始请求或响应正文、令牌、Cookie 或机密值。同一个心跳还会启动有界稳定性记录器，可通过 `openclaw gateway stability` 或 `diagnostics.stability` Gateway 网关 RPC 访问。当存在事件时，致命的 Gateway 网关退出、关闭超时和重启启动失败会将最新的记录器快照持久化到 `~/.openclaw/logs/stability/`；可使用 `openclaw gateway stability --bundle latest` 检查最新保存的 bundle。
- 对于 bug 报告，运行 `openclaw gateway diagnostics export` 并附上生成的 zip。该导出会合并 Markdown 摘要、最新稳定性 bundle、已净化的日志元数据、已净化的 Gateway 网关状态/健康快照以及配置结构。它设计为可共享：聊天文本、webhook 正文、工具输出、凭证、Cookie、账号/消息标识符和机密值会被省略或脱敏。

## 健康监控配置

- `gateway.channelHealthCheckMinutes`：Gateway 网关检查渠道健康状态的频率。默认值：`5`。设为 `0` 可全局禁用健康监控重启。
- `gateway.channelStaleEventThresholdMinutes`：已连接渠道在被健康监控视为陈旧并重启之前，可以保持空闲多长时间。默认值：`30`。请保持该值大于或等于 `gateway.channelHealthCheckMinutes`。
- `gateway.channelMaxRestartsPerHour`：每个渠道/账号在滚动一小时内由健康监控触发重启的上限。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：在保持全局监控启用的同时，禁用特定渠道的健康监控重启。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账号覆盖项，优先于渠道级设置。
- 这些按渠道划分的覆盖项适用于当前公开这些功能的内置渠道监控器：Discord、Google Chat、iMessage、Microsoft Teams、Signal、Slack、Telegram 和 WhatsApp。

## 失败时的处理

- `logged out` 或状态码 `409–515` → 使用 `openclaw channels logout`，然后运行 `openclaw channels login` 重新关联。
- Gateway 网关不可达 → 启动它：`openclaw gateway --port 18789`（如果端口被占用，使用 `--force`）。
- 没有入站消息 → 确认已关联的手机处于在线状态，并且发送方被允许（`channels.whatsapp.allowFrom`）；对于群聊，确保允许列表和提及规则匹配（`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`）。

## 专用 “health” 命令

`openclaw health` 会向正在运行的 Gateway 网关请求其健康快照（CLI 不会直接连接渠道
套接字）。默认情况下，它可以返回一个较新的缓存 Gateway 网关快照；随后
Gateway 网关会在后台刷新该缓存。`openclaw health --verbose` 则会强制
执行实时探测。该命令会在可用时报告已关联凭证/凭证有效期、
按渠道划分的探测摘要、会话存储摘要以及探测耗时。如果 Gateway 网关不可达，或者探测失败/超时，
它会以非零状态退出。

选项：

- `--json`：机器可读的 JSON 输出
- `--timeout <ms>`：覆盖默认的 `10s` 探测超时
- `--verbose`：强制执行实时探测，并打印 Gateway 网关连接详情
- `--debug`：`--verbose` 的别名

健康快照包括：`ok`（布尔值）、`ts`（时间戳）、`durationMs`（探测耗时）、按渠道划分的状态、智能体可用性以及会话存储摘要。
