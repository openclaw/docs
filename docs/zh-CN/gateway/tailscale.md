---
read_when:
    - 将 Gateway 网关控制 UI 暴露到 localhost 外部
    - 自动化 tailnet 或公共仪表板访问
summary: 为 Gateway 网关仪表板集成 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-05-06T15:54:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89a2094dc5d9250b3af2dcc991e83099bdf6fc4039c86358ca57f7e58899196d
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw 可以为 Gateway 网关仪表板和 WebSocket 端口自动配置 Tailscale **Serve**（tailnet）或 **Funnel**（公开）。这样会让 Gateway 网关绑定到 loopback，同时由 Tailscale 提供 HTTPS、路由，以及（对于 Serve）身份标头。

## 模式

- `serve`：通过 `tailscale serve` 使用仅限 Tailnet 的 Serve。Gateway 网关保持在 `127.0.0.1` 上。
- `funnel`：通过 `tailscale funnel` 使用公开 HTTPS。OpenClaw 要求使用共享密码。
- `off`：默认值（无 Tailscale 自动化）。

状态和审计输出会使用 **Tailscale 暴露** 来表示此 OpenClaw Serve/Funnel 模式。`off` 表示 OpenClaw 未管理 Serve 或 Funnel；它不表示本地 Tailscale 守护进程已停止或已登出。

## 凭证

设置 `gateway.auth.mode` 来控制握手：

- `none`（仅私有入口）
- `token`（设置 `OPENCLAW_GATEWAY_TOKEN` 时的默认值）
- `password`（通过 `OPENCLAW_GATEWAY_PASSWORD` 或配置提供共享密钥）
- `trusted-proxy`（感知身份的反向代理；参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）

当 `tailscale.mode = "serve"` 且 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket 凭证可以使用 Tailscale 身份标头（`tailscale-user-login`），而无需提供令牌/密码。OpenClaw 会通过本地 Tailscale 守护进程（`tailscale whois`）解析 `x-forwarded-for` 地址，并在接受前将其与该标头匹配，从而验证身份。OpenClaw 仅在请求来自 loopback，并带有 Tailscale 的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host` 标头时，才会将请求视为 Serve。
对于包含浏览器设备身份的 Control UI 操作员会话，此已验证的 Serve 路径也会跳过设备配对往返。它不会绕过浏览器设备身份：无设备客户端仍会被拒绝，节点角色或非 Control UI WebSocket 连接仍会遵循正常的配对和凭证检查。
HTTP API 端点（例如 `/v1/*`、`/tools/invoke` 和 `/api/channels/*`）**不**使用 Tailscale 身份标头凭证。它们仍会遵循 Gateway 网关的正常 HTTP 凭证模式：默认使用共享密钥凭证，或使用有意配置的 trusted-proxy / 私有入口 `none` 设置。
此无令牌流程假定 Gateway 网关主机可信。如果不受信任的本地代码可能在同一主机上运行，请禁用 `gateway.auth.allowTailscale`，并改为要求令牌/密码凭证。
要要求显式共享密钥凭据，请设置 `gateway.auth.allowTailscale: false`，并使用 `gateway.auth.mode: "token"` 或 `"password"`。

## 配置示例

### 仅限 Tailnet（Serve）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

打开：`https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

### 仅限 Tailnet（绑定到 Tailnet IP）

当你希望 Gateway 网关直接监听 Tailnet IP（无 Serve/Funnel）时使用此模式。

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

从另一台 Tailnet 设备连接：

- Control UI：`http://<tailscale-ip>:18789/`
- WebSocket：`ws://<tailscale-ip>:18789`

<Note>
Loopback（`http://127.0.0.1:18789`）在此模式下**无法**工作。
</Note>

### 公网（Funnel + 共享密码）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

优先使用 `OPENCLAW_GATEWAY_PASSWORD`，不要把密码提交到磁盘。

## CLI 示例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 注意事项

- Tailscale Serve/Funnel 要求已安装并登录 `tailscale` CLI。
- `tailscale.mode: "funnel"` 会拒绝启动，除非凭证模式为 `password`，以避免公开暴露。
- 如果你希望 OpenClaw 在关闭时撤销 `tailscale serve` 或 `tailscale funnel` 配置，请设置 `gateway.tailscale.resetOnExit`。
- `gateway.bind: "tailnet"` 是直接 Tailnet 绑定（无 HTTPS，无 Serve/Funnel）。
- `gateway.bind: "auto"` 优先使用 loopback；如果你希望仅限 Tailnet，请使用 `tailnet`。
- Serve/Funnel 仅暴露 **Gateway 网关控制 UI + WS**。节点通过同一个 Gateway 网关 WS 端点连接，因此 Serve 可用于节点访问。

## 浏览器控制（远程 Gateway 网关 + 本地浏览器）

如果你在一台机器上运行 Gateway 网关，但希望驱动另一台机器上的浏览器，请在浏览器机器上运行一个**节点主机**，并让两者保持在同一个 tailnet 中。Gateway 网关会将浏览器操作代理到该节点；不需要单独的控制服务器或 Serve URL。

避免将 Funnel 用于浏览器控制；像处理操作员访问一样处理节点配对。

## Tailscale 前提条件 + 限制

- Serve 要求你的 tailnet 启用 HTTPS；如果缺失，CLI 会提示。
- Serve 会注入 Tailscale 身份标头；Funnel 不会。
- Funnel 要求 Tailscale v1.38.3+、MagicDNS、启用 HTTPS，以及 funnel 节点属性。
- Funnel 仅支持通过 TLS 使用端口 `443`、`8443` 和 `10000`。
- macOS 上的 Funnel 要求使用开源 Tailscale 应用变体。

## 了解更多

- Tailscale Serve 概览：[https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 命令：[https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概览：[https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 命令：[https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 相关内容

- [远程访问](/zh-CN/gateway/remote)
- [设备发现](/zh-CN/gateway/discovery)
- [身份验证](/zh-CN/gateway/authentication)
