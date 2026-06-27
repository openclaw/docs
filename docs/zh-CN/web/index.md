---
read_when:
    - 你想通过 Tailscale 访问 Gateway 网关
    - 你想要浏览器 Control UI 和配置编辑
summary: Gateway 网关 Web 界面：Control UI、绑定模式和安全性
title: Web
x-i18n:
    generated_at: "2026-06-27T03:37:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

Gateway 网关会从与 Gateway 网关 WebSocket 相同的端口提供一个小型**浏览器 Control UI**（Vite + Lit）：

- 默认：`http://<host>:18789/`
- 使用 `gateway.tls.enabled: true`：`https://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

能力位于 [Control UI](/zh-CN/web/control-ui)。本页其余部分聚焦于绑定模式、安全性和面向 Web 的表面。

## Webhooks

当 `hooks.enabled=true` 时，Gateway 网关还会在同一 HTTP 服务器上公开一个小型 webhook 端点。
请参阅 [Gateway 配置](/zh-CN/gateway/configuration) → `hooks`，了解认证和载荷。

## Admin HTTP RPC

Admin HTTP RPC 在 `POST /api/v1/admin/rpc` 公开选定的 Gateway 网关控制平面方法。
它默认关闭，并且仅在启用 `admin-http-rpc` 插件时注册。
请参阅 [Admin HTTP RPC](/zh-CN/plugins/admin-http-rpc)，了解认证模型、允许的方法以及与 WebSocket 的比较。

## 配置（默认开启）

当资源存在（`dist/control-ui`）时，Control UI **默认启用**。
你可以通过配置控制它：

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Tailscale 访问

### 集成 Serve（推荐）

让 Gateway 网关保持在 loopback，并让 Tailscale Serve 代理它：

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

然后启动 Gateway 网关：

```bash
openclaw gateway
```

打开：

- `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

### Tailnet 绑定 + 令牌

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

然后启动 Gateway 网关（这个非 loopback 示例使用共享密钥令牌认证）：

```bash
openclaw gateway
```

打开：

- `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）

### 公共互联网（Funnel）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## 安全说明

- 默认要求 Gateway 网关认证（启用时使用令牌、密码、受信任代理或 Tailscale Serve 身份标头）。
- 非 loopback 绑定仍然**要求** Gateway 网关认证。实践中，这意味着令牌/密码认证，或使用带身份感知的反向代理并设置 `gateway.auth.mode: "trusted-proxy"`。
- 向导默认创建共享密钥认证，并且通常会生成一个 Gateway 网关令牌（即使在 loopback 上也是如此）。
- 在共享密钥模式下，UI 会发送 `connect.params.auth.token` 或 `connect.params.auth.password`。
- 当 `gateway.tls.enabled: true` 时，本地仪表板和状态辅助工具会渲染 `https://` 仪表板 URL 和 `wss://` WebSocket URL。
- 在 Tailscale Serve 或 `trusted-proxy` 等携带身份的模式下，WebSocket 认证检查改为通过请求标头满足。
- 对于公共非 loopback Control UI 部署，请显式设置 `gateway.controlUi.allowedOrigins`（完整来源）。私有同源 LAN/Tailnet 加载会接受 loopback、RFC1918/link-local、`.local`、`.ts.net` 和 Tailscale CGNAT 主机。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 会启用 Host 标头来源回退模式，但这是危险的安全降级。
- 使用 Serve 时，如果 `gateway.auth.allowTailscale` 为 `true`，Tailscale 身份标头可以满足 Control UI/WebSocket 认证（无需令牌/密码）。HTTP API 端点不使用这些 Tailscale 身份标头；它们改为遵循 Gateway 网关的常规 HTTP 认证模式。设置 `gateway.auth.allowTailscale: false` 可要求显式凭据。请参阅 [Tailscale](/zh-CN/gateway/tailscale) 和 [安全](/zh-CN/gateway/security)。此无令牌流程假定 Gateway 网关主机是受信任的。
- `gateway.tailscale.mode: "funnel"` 要求 `gateway.auth.mode: "password"`（共享密码）。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件。使用以下命令构建它们：

```bash
pnpm ui:build
```
