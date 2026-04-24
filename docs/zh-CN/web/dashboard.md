---
read_when:
    - 更改仪表板认证或暴露模式
summary: Gateway 网关仪表板（Control UI）访问与认证
title: 仪表板
x-i18n:
    generated_at: "2026-04-24T04:08:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8753e0edf0a04e4c36b76aa6973dcd9d903a98c0b85e498bfcb05e728bb6272b
    source_path: web/dashboard.md
    workflow: 15
---

Gateway 网关仪表板是默认在 `/` 提供服务的浏览器 Control UI
（可通过 `gateway.controlUi.basePath` 覆盖）。

快速打开（本地 Gateway 网关）：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

关键参考：

- [Control UI](/zh-CN/web/control-ui) 用于了解用法和 UI 功能。
- [Tailscale](/zh-CN/gateway/tailscale) 用于 Serve/Funnel 自动化。
- [Web surfaces](/zh-CN/web) 用于了解绑定模式和安全说明。

认证会通过已配置的 Gateway 网关
auth 路径在 WebSocket 握手时强制执行：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用 trusted-proxy 身份标头

请参见 [Gateway 配置](/zh-CN/gateway/configuration) 中的 `gateway.auth`。

安全说明：Control UI 是一个**管理员表面**（聊天、配置、exec 审批）。
不要将其公开暴露。UI 会将仪表板 URL token 保存在当前浏览器标签页会话和所选 gateway URL 对应的 `sessionStorage` 中，并在加载后将其从 URL 中移除。
优先使用 localhost、Tailscale Serve 或 SSH 隧道。

## 快速路径（推荐）

- 新手引导完成后，CLI 会自动打开仪表板，并打印一个干净的（不带 token 的）链接。
- 可随时重新打开：`openclaw dashboard`（复制链接、尽可能打开浏览器，并在 headless 情况下显示 SSH 提示）。
- 如果 UI 提示需要共享密钥认证，请将已配置的 token 或
  password 粘贴到 Control UI 设置中。

## 认证基础（本地与远程）

- **Localhost**：打开 `http://127.0.0.1:18789/`。
- **共享密钥 token 来源**：`gateway.auth.token`（或
  `OPENCLAW_GATEWAY_TOKEN`）；`openclaw dashboard` 可以通过 URL fragment
  一次性传递它用于初始化，而 Control UI 会将其保存在当前浏览器标签页会话和所选 gateway URL 对应的 `sessionStorage` 中，而不是 `localStorage`。
- 如果 `gateway.auth.token` 由 SecretRef 管理，`openclaw dashboard`
  会按设计打印/复制/打开一个不带 token 的 URL。这样可以避免将
  外部管理的 token 暴露在 shell 日志、剪贴板历史或浏览器启动参数中。
- 如果 `gateway.auth.token` 被配置为 SecretRef，但在你当前 shell 中尚未解析，`openclaw dashboard` 仍会打印一个不带 token 的 URL，并提供可执行的认证设置指引。
- **共享密钥 password**：使用已配置的 `gateway.auth.password`（或
  `OPENCLAW_GATEWAY_PASSWORD`）。仪表板不会在刷新之间持久保存 password。
- **带身份的模式**：当 `gateway.auth.allowTailscale: true` 时，Tailscale Serve 可以通过身份标头满足 Control UI/WebSocket
  认证；而带有
  `gateway.auth.mode: "trusted-proxy"` 的非 loopback、具备身份感知能力的反向代理也可以满足该认证。在这些模式下，仪表板
  不需要为 WebSocket 粘贴共享密钥。
- **非 localhost**：请使用 Tailscale Serve、非 loopback 共享密钥绑定、带有
  `gateway.auth.mode: "trusted-proxy"` 的非 loopback 身份感知反向代理，或 SSH 隧道。HTTP API 仍然使用共享密钥认证，除非你明确运行私有入口的
  `gateway.auth.mode: "none"` 或 trusted-proxy HTTP 认证。请参见
  [Web surfaces](/zh-CN/web)。

<a id="if-you-see-unauthorized-1008"></a>

## 如果你看到 “unauthorized” / 1008

- 确保 Gateway 网关可达（本地：`openclaw status`；远程：使用 SSH 隧道 `ssh -N -L 18789:127.0.0.1:18789 user@host`，然后打开 `http://127.0.0.1:18789/`）。
- 对于 `AUTH_TOKEN_MISMATCH`，当 Gateway 网关返回重试提示时，客户端可使用缓存的设备 token 进行一次可信重试。该缓存 token 重试会复用该 token 已缓存批准的 scope；显式 `deviceToken` / 显式 `scopes` 调用者则保留自己请求的 scope 集。如果在该次重试后认证仍然失败，请手动解决 token 漂移。
- 在该重试路径之外，连接认证优先级是明确的：显式共享 token/password 优先，其次是显式 `deviceToken`，再其次是已存储的设备 token，最后是 bootstrap token。
- 在异步的 Tailscale Serve Control UI 路径上，同一
  `{scope, ip}` 的失败尝试会在失败认证限制器记录之前被串行化，因此第二个并发错误重试可能已经显示 `retry later`。
- 关于 token 漂移修复步骤，请遵循 [Token drift recovery checklist](/zh-CN/cli/devices#token-drift-recovery-checklist)。
- 从 Gateway 网关主机检索或提供共享密钥：
  - Token：`openclaw config get gateway.auth.token`
  - Password：解析已配置的 `gateway.auth.password` 或
    `OPENCLAW_GATEWAY_PASSWORD`
  - 由 SecretRef 管理的 token：解析外部密钥 provider，或在当前 shell 中导出
    `OPENCLAW_GATEWAY_TOKEN`，然后重新运行 `openclaw dashboard`
  - 未配置共享密钥：`openclaw doctor --generate-gateway-token`
- 在仪表板设置中，将 token 或 password 粘贴到认证字段中，
  然后连接。
- UI 语言选择器位于 **Overview -> Gateway Access -> Language**。
  它属于访问卡片，而不是外观部分。

## 相关内容

- [Control UI](/zh-CN/web/control-ui)
- [WebChat](/zh-CN/web/webchat)
