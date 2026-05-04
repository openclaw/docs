---
read_when:
    - 更改仪表板身份验证或暴露模式
summary: Gateway 网关仪表板（Control UI）访问和认证
title: 仪表盘
x-i18n:
    generated_at: "2026-05-04T23:43:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e2086587fee6303221663748c3047886a5beae29862d66e2edf78e02bfe3da1
    source_path: web/dashboard.md
    workflow: 16
---

Gateway 网关仪表板是默认由 `/` 提供的浏览器控制 UI
（可用 `gateway.controlUi.basePath` 覆盖）。

快速打开（本地 Gateway 网关）：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）
- 使用 `gateway.tls.enabled: true` 时，对 WebSocket 端点使用 `https://127.0.0.1:18789/` 和
  `wss://127.0.0.1:18789`。

关键参考：

- [控制 UI](/zh-CN/web/control-ui)，了解用法和 UI 能力。
- [Tailscale](/zh-CN/gateway/tailscale)，了解 Serve/Funnel 自动化。
- [Web 界面](/zh-CN/web)，了解绑定模式和安全注意事项。

认证会通过已配置的 gateway 认证路径在 WebSocket 握手时强制执行：

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` 时的 Tailscale Serve 身份标头
- `gateway.auth.mode: "trusted-proxy"` 时的可信代理身份标头

参见 [Gateway 网关配置](/zh-CN/gateway/configuration)中的 `gateway.auth`。

安全注意事项：控制 UI 是**管理界面**（聊天、配置、exec 批准）。
不要公开暴露它。UI 会把仪表板 URL 令牌保存在当前浏览器标签页会话和所选 gateway URL 的 sessionStorage 中，并在加载后从 URL 中移除它们。
优先使用 localhost、Tailscale Serve 或 SSH 隧道。

## 快速路径（推荐）

- 新手引导完成后，CLI 会自动打开仪表板并打印一个干净的（不含令牌的）链接。
- 随时重新打开：`openclaw dashboard`（复制链接，尽可能打开浏览器，无头环境下显示 SSH 提示）。
- 如果剪贴板和浏览器投递失败，`openclaw dashboard` 仍会打印干净的
  URL，并告诉你使用 `OPENCLAW_GATEWAY_TOKEN` 或
  `gateway.auth.token` 中的令牌作为 URL 片段键 `token`；它不会在日志中打印令牌值。
- 如果 UI 提示共享密钥认证，请将已配置的令牌或
  密码粘贴到控制 UI 设置中。

## 认证基础（本地与远程）

- **Localhost**：打开 `http://127.0.0.1:18789/`。
- **Gateway 网关 TLS**：当 `gateway.tls.enabled: true` 时，仪表板/Status 链接使用
  `https://`，控制 UI WebSocket 链接使用 `wss://`。
- **共享密钥令牌来源**：`gateway.auth.token`（或
  `OPENCLAW_GATEWAY_TOKEN`）；`openclaw dashboard` 可以通过 URL 片段传递它，
  用于一次性引导，控制 UI 会将它保存在当前浏览器标签页会话和所选 gateway URL 的 sessionStorage 中，而不是 localStorage。
- 如果 `gateway.auth.token` 由 SecretRef 管理，`openclaw dashboard`
  会按设计打印/复制/打开不含令牌的 URL。这可避免在 shell 日志、剪贴板历史记录或浏览器启动参数中暴露
  外部管理的令牌。
- 如果 `gateway.auth.token` 配置为 SecretRef，且在你当前
  shell 中未解析，`openclaw dashboard` 仍会打印不含令牌的 URL，并提供
  可操作的认证设置指引。
- **共享密钥密码**：使用已配置的 `gateway.auth.password`（或
  `OPENCLAW_GATEWAY_PASSWORD`）。仪表板不会在重新加载之间持久保存密码。
- **携带身份的模式**：当 `gateway.auth.allowTailscale: true` 时，Tailscale Serve 可以通过身份标头满足控制 UI/WebSocket
  认证；非 local loopback 且具备身份感知能力的反向代理可以满足
  `gateway.auth.mode: "trusted-proxy"`。在这些模式下，仪表板不需要
  为 WebSocket 粘贴共享密钥。
- **非 localhost**：使用 Tailscale Serve、非 local loopback 共享密钥绑定、
  非 local loopback 且具备身份感知能力并设置
  `gateway.auth.mode: "trusted-proxy"` 的反向代理，或 SSH 隧道。HTTP API 仍使用
  共享密钥认证，除非你有意运行私有入口
  `gateway.auth.mode: "none"` 或可信代理 HTTP 认证。参见
  [Web 界面](/zh-CN/web)。

<a id="if-you-see-unauthorized-1008"></a>

## 如果你看到 “unauthorized” / 1008

- 确保 gateway 可访问（本地：`openclaw status`；远程：SSH 隧道 `ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`）。
- 对于 `AUTH_TOKEN_MISMATCH`，当 gateway 返回重试提示时，客户端可以使用缓存的设备令牌进行一次可信重试。该缓存令牌重试会复用该令牌缓存的已批准 scope；显式 `deviceToken` / 显式 `scopes` 调用方会保留其请求的 scope 集合。如果该重试后认证仍失败，请手动解决令牌漂移。
- 在该重试路径之外，连接认证优先级是显式共享令牌/密码优先，然后是显式 `deviceToken`，再然后是已存储的设备令牌，最后是引导令牌。
- 在异步 Tailscale Serve 控制 UI 路径上，同一
  `{scope, ip}` 的失败尝试会在失败认证限流器记录之前被串行化，因此
  第二个并发的错误重试可能已经显示 `retry later`。
- 对于令牌漂移修复步骤，请遵循[令牌漂移恢复清单](/zh-CN/cli/devices#token-drift-recovery-checklist)。
- 从 gateway 主机检索或提供共享密钥：
  - 令牌：`openclaw config get gateway.auth.token`
  - 密码：解析已配置的 `gateway.auth.password` 或
    `OPENCLAW_GATEWAY_PASSWORD`
  - SecretRef 管理的令牌：解析外部 secret 提供商，或在此 shell 中导出
    `OPENCLAW_GATEWAY_TOKEN`，然后重新运行 `openclaw dashboard`
  - 未配置共享密钥：`openclaw doctor --generate-gateway-token`
- 在仪表板设置中，将令牌或密码粘贴到认证字段，
  然后连接。
- UI 语言选择器位于 **概览 -> Gateway 网关访问 -> 语言**。
  它是访问卡片的一部分，不在外观部分中。

## 相关

- [控制 UI](/zh-CN/web/control-ui)
- [WebChat](/zh-CN/web/webchat)
