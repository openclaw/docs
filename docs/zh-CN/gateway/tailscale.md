---
read_when:
    - 在 localhost 外部公开 Gateway 网关控制 UI
    - 自动化 tailnet 或公共仪表板访问
summary: 为 Gateway 网关仪表板集成了 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-04-26T00:52:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: a02a2bfc18c8b9f373257c236b86c250e0b4a1b67f200c62f04c42fed2a4b119
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw 可以为 Gateway 网关仪表板和 WebSocket 端口自动配置 Tailscale **Serve**（tailnet）或 **Funnel**（公开）。
这样可以让 Gateway 网关保持绑定在 loopback，同时由 Tailscale 提供 HTTPS、路由，以及（对于 Serve）身份标头。

## 模式

- `serve`：通过 `tailscale serve` 提供仅 tailnet 可访问的 Serve。Gateway 网关保持在 `127.0.0.1` 上。
- `funnel`：通过 `tailscale funnel` 提供公开 HTTPS。OpenClaw 要求使用共享密码。
- `off`：默认值（不启用 Tailscale 自动化）。

Status 和审计输出对这种 OpenClaw Serve/Funnel 模式使用 **Tailscale 暴露** 一词。
`off` 表示 OpenClaw 不管理 Serve 或 Funnel；并不意味着本地 Tailscale 守护进程已停止或已注销。

## 认证

设置 `gateway.auth.mode` 来控制握手方式：

- `none`（仅限私有入口）
- `token`（设置了 `OPENCLAW_GATEWAY_TOKEN` 时的默认值）
- `password`（通过 `OPENCLAW_GATEWAY_PASSWORD` 或配置提供共享密钥）
- `trusted-proxy`（支持身份感知的反向代理；参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）

当 `tailscale.mode = "serve"` 且 `gateway.auth.allowTailscale` 为 `true` 时，
Control UI/WebSocket 认证可以使用 Tailscale 身份标头
（`tailscale-user-login`），而无需提供 token/password。OpenClaw 会通过本地 Tailscale
守护进程解析 `x-forwarded-for` 地址（`tailscale whois`），并在接受该标头前将其与标头内容进行匹配以验证身份。
OpenClaw 仅在请求来自 loopback，且带有 Tailscale 的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host`
标头时，才会将该请求视为 Serve 请求。
HTTP API 端点（例如 `/v1/*`、`/tools/invoke` 和 `/api/channels/*`）
**不会**使用 Tailscale 身份标头认证。它们仍然遵循 Gateway 网关的
常规 HTTP 认证模式：默认使用共享密钥认证，或者使用有意配置的
trusted-proxy / 私有入口 `none` 设置。
这种无 token 流程假设 Gateway 网关主机是可信的。如果不受信任的本地代码
可能会在同一主机上运行，请禁用 `gateway.auth.allowTailscale`，并改为要求
token/password 认证。
若要强制要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`
并使用 `gateway.auth.mode: "token"` 或 `"password"`。

## 配置示例

### 仅 tailnet（Serve）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

打开：`https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

### 仅 tailnet（绑定到 Tailnet IP）

当你希望 Gateway 网关直接监听 Tailnet IP 时使用此模式（不使用 Serve/Funnel）。

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

注意：在此模式下，loopback（`http://127.0.0.1:18789`）**无法**工作。

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

优先使用 `OPENCLAW_GATEWAY_PASSWORD`，不要将密码提交到磁盘。

## CLI 示例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 说明

- Tailscale Serve/Funnel 要求已安装 `tailscale` CLI 并且已登录。
- `tailscale.mode: "funnel"` 会在认证模式不是 `password` 时拒绝启动，以避免公开暴露。
- 如果你希望 OpenClaw 在关闭时撤销 `tailscale serve`
  或 `tailscale funnel` 配置，请设置 `gateway.tailscale.resetOnExit`。
- `gateway.bind: "tailnet"` 是直接绑定 Tailnet（无 HTTPS、无 Serve/Funnel）。
- `gateway.bind: "auto"` 会优先使用 loopback；如果你只想使用 Tailnet，请使用 `tailnet`。
- Serve/Funnel 仅暴露 **Gateway 网关控制 UI + WS**。节点通过
  同一个 Gateway 网关 WS 端点连接，因此 Serve 也可用于节点访问。

## 浏览器控制（远程 Gateway 网关 + 本地浏览器）

如果你在一台机器上运行 Gateway 网关，但希望在另一台机器上驱动浏览器，
请在浏览器所在机器上运行一个 **节点主机**，并让两台机器保持在同一个 tailnet 中。
Gateway 网关会将浏览器操作代理到该节点；无需单独的控制服务器或 Serve URL。

避免将 Funnel 用于浏览器控制；应将节点配对视为运维人员访问。

## Tailscale 前置要求 + 限制

- Serve 要求你的 tailnet 已启用 HTTPS；如果缺失，CLI 会提示。
- Serve 会注入 Tailscale 身份标头；Funnel 不会。
- Funnel 要求 Tailscale v1.38.3+、MagicDNS、已启用 HTTPS，以及 funnel 节点属性。
- Funnel 仅支持通过 TLS 使用端口 `443`、`8443` 和 `10000`。
- 在 macOS 上使用 Funnel 需要开源版 Tailscale 应用变体。

## 了解更多

- Tailscale Serve 概览：[https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 命令：[https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概览：[https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 命令：[https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 相关内容

- [远程访问](/zh-CN/gateway/remote)
- [设备发现](/zh-CN/gateway/discovery)
- [认证](/zh-CN/gateway/authentication)
