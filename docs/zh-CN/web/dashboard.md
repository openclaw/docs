---
read_when:
    - 更改仪表盘身份验证或暴露模式
summary: Gateway 网关仪表板（控制 UI）访问和身份验证
title: 仪表盘
x-i18n:
    generated_at: "2026-05-11T20:36:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07e11c1f71e6691ee053192e238a3b48568f81c3180e6b5f8e21b6874417e57e
    source_path: web/dashboard.md
    workflow: 16
---

Gateway 网关仪表盘是默认在 `/` 提供服务的浏览器控制 UI
（可用 `gateway.controlUi.basePath` 覆盖）。

快速打开（本地 Gateway 网关）：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）
- 使用 `gateway.tls.enabled: true` 时，对 WebSocket 端点使用 `https://127.0.0.1:18789/` 和
  `wss://127.0.0.1:18789`。

关键参考：

- [控制 UI](/zh-CN/web/control-ui)，了解用法和 UI 能力。
- [Tailscale](/zh-CN/gateway/tailscale)，了解 Serve/Funnel 自动化。
- [Web 界面](/zh-CN/web)，了解绑定模式和安全说明。

身份验证会在 WebSocket 握手期间通过配置的 Gateway 网关
auth 路径强制执行：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时，使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时，使用受信代理身份标头

请参阅 [Gateway 网关配置](/zh-CN/gateway/configuration)中的 `gateway.auth`。

安全注意事项：控制 UI 是一个**管理界面**（聊天、配置、exec 审批）。
不要将其公开暴露。UI 会把仪表盘 URL 令牌保存在当前浏览器标签页会话和所选 Gateway 网关 URL 的 sessionStorage 中，并在加载后从 URL 中移除它们。
优先使用 localhost、Tailscale Serve 或 SSH 隧道。

## 快速路径（推荐）

- 新手引导完成后，CLI 会自动打开仪表盘并打印一个干净的（不带令牌的）链接。
- 随时重新打开：`openclaw dashboard`（复制链接，尽可能打开浏览器，如果是无头环境则显示 SSH 提示）。
- 如果剪贴板和浏览器打开都失败，`openclaw dashboard` 仍会打印
  干净的 URL，并告诉你使用来自 `OPENCLAW_GATEWAY_TOKEN` 或
  `gateway.auth.token` 的令牌作为 URL 片段键 `token`；它不会在日志中打印令牌
  值。
- 如果 UI 提示进行共享密钥身份验证，请将配置的令牌或
  密码粘贴到控制 UI 设置中。

## 身份验证基础（本地与远程）

- **Localhost**：打开 `http://127.0.0.1:18789/`。
- **Gateway 网关 TLS**：当 `gateway.tls.enabled: true` 时，仪表盘/Status 链接使用
  `https://`，控制 UI WebSocket 链接使用 `wss://`。
- **共享密钥令牌来源**：`gateway.auth.token`（或
  `OPENCLAW_GATEWAY_TOKEN`）；`openclaw dashboard` 可以通过 URL 片段传递它
  以进行一次性引导，控制 UI 会将它保存在当前浏览器标签页会话和所选 Gateway 网关 URL 的 sessionStorage 中，而不是 localStorage。
- 如果 `gateway.auth.token` 由 SecretRef 管理，`openclaw dashboard`
  会按设计打印/复制/打开一个不带令牌的 URL。这样可以避免在 shell 日志、剪贴板历史记录或浏览器启动
  参数中暴露外部管理的令牌。
- 如果 `gateway.auth.token` 配置为 SecretRef，但在你的
  当前 shell 中未解析，`openclaw dashboard` 仍会打印一个不带令牌的 URL，并附带
  可操作的身份验证设置指引。
- **共享密钥密码**：使用配置的 `gateway.auth.password`（或
  `OPENCLAW_GATEWAY_PASSWORD`）。仪表盘不会在重新加载后持久保存密码。
- **携带身份的模式**：当 `gateway.auth.allowTailscale: true` 时，Tailscale Serve 可以通过身份标头满足控制 UI/WebSocket
  身份验证；具备身份感知能力的非 local loopback 反向代理可以满足
  `gateway.auth.mode: "trusted-proxy"`。在这些模式下，仪表盘不需要
  为 WebSocket 粘贴共享密钥。
- **非 localhost**：使用 Tailscale Serve、非 local loopback 共享密钥绑定、
  具备身份感知能力且使用 `gateway.auth.mode: "trusted-proxy"` 的非 local loopback 反向代理，或 SSH 隧道。HTTP API 仍使用
  共享密钥身份验证，除非你有意运行私有入口
  `gateway.auth.mode: "none"` 或受信代理 HTTP 身份验证。请参阅
  [Web 界面](/zh-CN/web)。

<a id="if-you-see-unauthorized-1008"></a>

## 如果你看到 “unauthorized” / 1008

- 确保 Gateway 网关可访问（本地：`openclaw status`；远程：SSH 隧道 `ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`）。
- 对于 `AUTH_TOKEN_MISMATCH`，当 Gateway 网关返回重试提示时，客户端可以使用缓存的设备令牌进行一次可信重试。该缓存令牌重试会复用该令牌缓存的已批准 scopes；显式 `deviceToken` / 显式 `scopes` 调用方会保留其请求的 scope 集。如果该重试后身份验证仍失败，请手动解决令牌漂移。
- 对于 `AUTH_SCOPE_MISMATCH`，设备令牌已被识别，但未携带仪表盘请求的 scopes；请重新配对或批准请求的 scope 合约，而不是轮换共享 Gateway 网关令牌。
- 在该重试路径之外，连接身份验证优先级为：先显式共享令牌/密码，然后显式 `deviceToken`，然后存储的设备令牌，最后引导令牌。
- 在异步 Tailscale Serve 控制 UI 路径上，同一
  `{scope, ip}` 的失败尝试会在失败身份验证限流器记录它们之前被串行化，因此
  第二个并发的错误重试可能已经显示 `retry later`。
- 有关令牌漂移修复步骤，请遵循[令牌漂移恢复检查清单](/zh-CN/cli/devices#token-drift-recovery-checklist)。
- 从 Gateway 网关主机检索或提供共享密钥：
  - 令牌：`openclaw config get gateway.auth.token`
  - 密码：解析配置的 `gateway.auth.password` 或
    `OPENCLAW_GATEWAY_PASSWORD`
  - SecretRef 管理的令牌：解析外部 secret 提供商，或在此 shell 中导出
    `OPENCLAW_GATEWAY_TOKEN`，然后重新运行 `openclaw dashboard`
  - 未配置共享密钥：`openclaw doctor --generate-gateway-token`
- 在仪表盘设置中，将令牌或密码粘贴到身份验证字段，
  然后连接。
- UI 语言选择器位于 **概览 -> Gateway 网关访问 -> 语言**。
  它属于访问卡片，而不是外观部分。

## 相关

- [控制 UI](/zh-CN/web/control-ui)
- [WebChat](/zh-CN/web/webchat)
