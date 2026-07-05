---
read_when:
    - 更改仪表盘身份验证或暴露模式
summary: Gateway 网关仪表板（Control UI）访问和身份验证
title: 仪表板
x-i18n:
    generated_at: "2026-07-05T11:48:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e60ae8273560295fa2670af8ba3a26eea5b07fe2f8b07813460850785305f0b
    source_path: web/dashboard.md
    workflow: 16
---

Gateway 网关仪表板是默认由 `/` 提供的浏览器 Control UI（可用 `gateway.controlUi.basePath` 覆盖）。

快速打开（本地 Gateway 网关）：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）
- 使用 `gateway.tls.enabled: true` 时，WebSocket 端点使用 `https://127.0.0.1:18789/` 和 `wss://127.0.0.1:18789`。

关键参考：

- [Control UI](/zh-CN/web/control-ui)：用法和 UI 能力。
- [Tailscale](/zh-CN/gateway/tailscale)：Serve/Funnel 自动化。
- [Web 界面](/zh-CN/web)：绑定模式和安全说明。

身份验证在 WebSocket 握手阶段通过配置的 Gateway 网关身份验证路径强制执行：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时使用 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时使用受信任代理身份标头

参见 [Gateway 配置](/zh-CN/gateway/configuration) 中的 `gateway.auth`。

<Warning>
Control UI 是一个**管理界面**（聊天、配置、exec 审批）。不要将其公开暴露。UI 会将仪表板 URL token 保存在当前浏览器标签页和所选 Gateway 网关 URL 的 sessionStorage 中，并在加载后从 URL 中移除它们。优先使用 localhost、Tailscale Serve 或 SSH 隧道。
</Warning>

## 快速路径（推荐）

- 新手引导后，CLI 会自动打开仪表板并打印一个干净的（无 token）链接。
- 随时重新打开：`openclaw dashboard`（复制链接，尽可能打开浏览器；如果是无头环境，则打印 SSH 提示）。
- 如果剪贴板和浏览器传递都失败，`openclaw dashboard` 仍会打印干净的 URL，并告诉你将你的 token（来自 `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.token`）作为 URL 片段键 `token` 追加；它绝不会在日志中打印 token 值。
- 如果 UI 提示进行共享密钥身份验证，请将配置的 token 或密码粘贴到 Control UI 设置中。

## 身份验证基础（本地与远程）

- **Localhost**：打开 `http://127.0.0.1:18789/`。
- **Gateway 网关 TLS**：当 `gateway.tls.enabled: true` 时，仪表板/状态链接使用 `https://`，Control UI WebSocket 链接使用 `wss://`。
- **共享密钥 token 来源**：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。`openclaw dashboard` 可通过 URL 片段传递它用于一次性引导；Control UI 会将其保存在当前标签页和所选 Gateway 网关 URL 的 sessionStorage 中，而不是 localStorage。
- 如果 `gateway.auth.token` 由 SecretRef 管理，`openclaw dashboard` 会按设计打印/复制/打开无 token 的 URL，以避免在 shell 日志、剪贴板历史或浏览器启动参数中暴露外部管理的 token。如果该引用在你当前 shell 中未解析，它仍会打印无 token 的 URL，并附带可执行的身份验证设置指导。
- **共享密钥密码**：使用配置的 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。仪表板不会在重新加载之间持久保存密码。
- **带身份的模式**：当 `gateway.auth.allowTailscale: true` 时，Tailscale Serve 通过身份标头满足 Control UI/WebSocket 身份验证；非 local loopback、具备身份感知能力的反向代理满足 `gateway.auth.mode: "trusted-proxy"`。两者都不需要为 WebSocket 粘贴共享密钥。
- **非 localhost**：使用 Tailscale Serve、非 local loopback 共享密钥绑定、带有 `gateway.auth.mode: "trusted-proxy"` 的非 local loopback 身份感知反向代理，或 SSH 隧道。HTTP API 仍使用共享密钥身份验证，除非你有意运行私有入口 `gateway.auth.mode: "none"` 或受信任代理 HTTP 身份验证。参见 [Web 界面](/zh-CN/web)。

<a id="if-you-see-unauthorized-1008"></a>

## 如果你看到 “unauthorized” / 1008

- 确认 Gateway 网关可访问：本地运行 `openclaw status`；远程时，使用 SSH 隧道 `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`，然后打开 `http://127.0.0.1:18789/`。
- 对于 `AUTH_TOKEN_MISMATCH`，当 Gateway 网关返回重试提示时，客户端可以使用缓存的设备 token 执行一次受信任重试；该重试会复用 token 缓存的已批准权限范围（显式 `deviceToken`/`scopes` 调用方会保留其请求的权限范围集合）。如果该重试后身份验证仍失败，请手动解决 token 漂移。
- 对于 `AUTH_SCOPE_MISMATCH`，设备 token 已被识别，但不包含所请求的权限范围；请重新配对或批准新的权限范围集合，而不是轮换共享 Gateway 网关 token。
- 在该重试路径之外，连接身份验证优先级为：显式共享 token/密码，然后是显式 `deviceToken`，然后是已存储的设备 token，最后是引导 token。
- 在异步 Tailscale Serve 路径上，相同 `{scope, ip}` 的失败尝试会在失败身份验证限制器记录它们之前串行化，因此第二个并发的错误重试可能已经显示 `retry later`。
- 关于 token 漂移修复步骤，请参见 [Token 漂移恢复检查清单](/zh-CN/cli/devices#token-drift-recovery-checklist)。
- 从 Gateway 网关主机检索或提供共享密钥：
  - Token：`openclaw config get gateway.auth.token`
  - 密码：解析配置的 `gateway.auth.password` 或 `OPENCLAW_GATEWAY_PASSWORD`
  - SecretRef 管理的 token：解析外部 secret 提供商，或在此 shell 中导出 `OPENCLAW_GATEWAY_TOKEN` 并重新运行 `openclaw dashboard`
  - 未配置共享密钥：`openclaw doctor --generate-gateway-token`
- 在仪表板设置中，将 token 或密码粘贴到身份验证字段，然后连接。
- UI 语言选择器位于 **概览 -> Gateway 网关访问 -> 语言**，不在 Appearance 下。

## 相关

- [Control UI](/zh-CN/web/control-ui)
- [WebChat](/zh-CN/web/webchat)
