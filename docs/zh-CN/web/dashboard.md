---
read_when:
    - 更改仪表板身份验证或暴露模式
summary: Gateway 网关仪表板（Control UI）访问与身份验证
title: 仪表板
x-i18n:
    generated_at: "2026-07-12T14:49:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 34d7ab6c5f503f2dd3ab212a1fc6b47c84fcd47c5ad88aa9cdbbbbc73b7ef90e
    source_path: web/dashboard.md
    workflow: 16
---

Gateway 网关仪表板是默认由 `/` 提供的浏览器 Control UI（可通过 `gateway.controlUi.basePath` 覆盖）。

快速打开（本地 Gateway 网关）：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）
- 使用 `gateway.tls.enabled: true` 时，请使用 `https://127.0.0.1:18789/`，并将 `wss://127.0.0.1:18789` 用作 WebSocket 端点。

主要参考：

- [Control UI](/zh-CN/web/control-ui)：了解用法和 UI 功能。
- [Tailscale](/zh-CN/gateway/tailscale)：了解 Serve/Funnel 自动化。
- [Web 界面](/zh-CN/web)：了解绑定模式和安全说明。

在 WebSocket 握手期间，会通过配置的 Gateway 网关身份验证路径强制执行身份验证：

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` 时的 Tailscale Serve 身份标头
- `gateway.auth.mode: "trusted-proxy"` 时的受信任代理身份标头

请参阅 [Gateway 配置](/zh-CN/gateway/configuration)中的 `gateway.auth`。

<Warning>
Control UI 是一个**管理界面**（聊天、配置、Exec 审批）。请勿将其公开暴露。UI 会将仪表板 URL 令牌保存在当前浏览器标签页和所选 Gateway 网关 URL 的 sessionStorage 中，并在加载后将其从 URL 中移除。优先使用 localhost、Tailscale Serve 或 SSH 隧道。
</Warning>

## 快速路径（推荐）

- 完成新手引导后，CLI 会自动打开仪表板并输出一个干净的（不含令牌的）链接。
- 随时重新打开：`openclaw dashboard`（复制链接，条件允许时打开浏览器；如果是无头环境，则输出 SSH 提示）。
- 如果剪贴板和浏览器传递均失败，`openclaw dashboard` 仍会输出干净的 URL，并提示你将令牌（来自 `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.token`）作为 URL 片段键 `token` 追加；它绝不会在日志中输出令牌值。
- 如果 UI 提示输入共享密钥身份验证信息，请将配置的令牌或密码粘贴到 Control UI 设置中。

## 身份验证基础（本地与远程）

- **Localhost**：打开 `http://127.0.0.1:18789/`。
- **Gateway 网关 TLS**：当 `gateway.tls.enabled: true` 时，仪表板/状态链接使用 `https://`，Control UI WebSocket 链接使用 `wss://`。
- **共享密钥令牌来源**：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。`openclaw dashboard` 可以通过 URL 片段传递该令牌以进行一次性引导；Control UI 会将其保存在当前标签页和所选 Gateway 网关 URL 的 sessionStorage 中，而不是 localStorage 中。
- 如果 `gateway.auth.token` 由 SecretRef 管理，`openclaw dashboard` 会按设计输出、复制并打开不含令牌的 URL，以避免在 Shell 日志、剪贴板历史记录或浏览器启动参数中暴露由外部管理的令牌。如果当前 Shell 中无法解析该引用，它仍会输出不含令牌的 URL 以及可操作的身份验证设置指引。
- **共享密钥密码**：使用配置的 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。仪表板不会在重新加载后保留密码。
- **携带身份信息的模式**：当 `gateway.auth.allowTailscale: true` 时，Tailscale Serve 通过身份标头满足 Control UI/WebSocket 身份验证要求；支持身份感知的非 local loopback 反向代理通过 `gateway.auth.mode: "trusted-proxy"` 满足要求。二者都不需要为 WebSocket 粘贴共享密钥。
- **非 localhost**：使用 Tailscale Serve、绑定到非 local loopback 的共享密钥模式、搭配 `gateway.auth.mode: "trusted-proxy"` 且支持身份感知的非 local loopback 反向代理，或 SSH 隧道。除非你有意运行私有入口的 `gateway.auth.mode: "none"` 或受信任代理 HTTP 身份验证，否则 HTTP API 仍使用共享密钥身份验证。请参阅 [Web 界面](/zh-CN/web)。

## 在 Telegram 中打开

Telegram Bot 可以使用 `/dashboard` 将仪表板作为 Telegram Mini App 打开。

要求：

- `gateway.tailscale.mode: "serve"` 或 `"funnel"`，以便 Telegram 获取 HTTPS Mini App URL。
- Telegram 发送者必须是 Bot 所有者：即 `commands.ownerAllowFrom` 或所选账户的有效 `channels.telegram.allowFrom` 中的数字 Telegram 用户 ID。
- 在与 Bot 的私信中运行 `/dashboard`。在群组中调用只会提示你在私信中打开该命令，不会包含按钮。
- Docker 安装：Serve/Funnel 模式要求 Gateway 网关在 `tailscaled` 旁边绑定 local loopback，而发布端口的桥接网络无法满足此要求。请使用 `network_mode: host` 运行 Gateway 网关容器，并将主机的 `tailscaled` 套接字（`/var/run/tailscale`）以及 `tailscale` CLI 挂载到容器中。

Mini App 会执行一次性所有者交接，并使用短期引导令牌重定向到 Control UI。它不会在 URL 中暴露共享 Gateway 网关令牌。

v1 的非目标：

- 不支持 Telegram Web iframe。
- Tailscale Serve/Funnel 是唯一受支持的已发布 URL 路径。

<a id="if-you-see-unauthorized-1008"></a>

## 如果看到“unauthorized”/ 1008

- 确认 Gateway 网关可访问：本地运行 `openclaw status`；远程情况下，使用 SSH 隧道 `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`，然后打开 `http://127.0.0.1:18789/`。
- 对于 `AUTH_TOKEN_MISMATCH`，当 Gateway 网关返回重试提示时，客户端可以使用缓存的设备令牌进行一次受信任重试；该重试会复用令牌中缓存的已批准权限范围（显式设置 `deviceToken`/`scopes` 的调用方会保留其请求的权限范围集）。如果重试后身份验证仍然失败，请手动解决令牌漂移。
- 对于 `AUTH_SCOPE_MISMATCH`，设备令牌已被识别，但不具备所请求的权限范围；请重新配对或批准新的权限范围集，而不是轮换共享 Gateway 网关令牌。
- 在该重试路径之外，连接身份验证的优先级为：显式共享令牌/密码，然后是显式 `deviceToken`，然后是已存储的设备令牌，最后是引导令牌。
- 在异步 Tailscale Serve 路径中，在失败身份验证限流器记录尝试之前，相同 `{scope, ip}` 的失败尝试会串行执行，因此第二个并发的错误重试可能已经显示 `retry later`。
- 有关令牌漂移修复步骤，请参阅[令牌漂移恢复检查清单](/zh-CN/cli/devices#token-drift-recovery-checklist)。
- 从 Gateway 网关主机获取或提供共享密钥：
  - 令牌：`openclaw config get gateway.auth.token`
  - 密码：解析配置的 `gateway.auth.password` 或 `OPENCLAW_GATEWAY_PASSWORD`
  - 由 SecretRef 管理的令牌：解析外部 Secret 提供商，或在当前 Shell 中导出 `OPENCLAW_GATEWAY_TOKEN`，然后重新运行 `openclaw dashboard`
  - 未配置共享密钥：`openclaw doctor --generate-gateway-token`
- 在仪表板设置中，将令牌或密码粘贴到身份验证字段，然后连接。
- UI 语言选择器位于 **Settings -> General -> Language**，而不是 Appearance 下。

## 相关内容

- [Control UI](/zh-CN/web/control-ui)
- [WebChat](/zh-CN/web/webchat)
