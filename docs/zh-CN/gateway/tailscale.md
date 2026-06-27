---
read_when:
    - 在 localhost 外暴露 Gateway 网关 Control UI
    - 自动化 tailnet 或公共仪表板访问
summary: 集成用于 Gateway 网关仪表板的 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-06-27T02:09:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35944eba19cd82d373b25c602b66d1b76f35ad63aa90767bb1c7ef75549fe905
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw 可以为 Gateway 网关仪表板和 WebSocket 端口自动配置 Tailscale **Serve**（tailnet）或 **Funnel**（公开）。这样可以让 Gateway 网关绑定到 local loopback，同时由 Tailscale 提供 HTTPS、路由，以及（对于 Serve）身份标头。

## 模式

- `serve`：通过 `tailscale serve` 使用仅限 tailnet 的 Serve。Gateway 网关保持在 `127.0.0.1`。
- `funnel`：通过 `tailscale funnel` 使用公开 HTTPS。OpenClaw 要求使用共享密码。
- `off`：默认值（不进行 Tailscale 自动化）。

状态和审计输出对此 OpenClaw Serve/Funnel 模式使用 **Tailscale 暴露**。`off` 表示 OpenClaw 未管理 Serve 或 Funnel；这并不表示本地 Tailscale 守护进程已停止或已登出。

## 认证

设置 `gateway.auth.mode` 以控制握手：

- `none`（仅私有入口）
- `token`（设置 `OPENCLAW_GATEWAY_TOKEN` 时的默认值）
- `password`（通过 `OPENCLAW_GATEWAY_PASSWORD` 或配置提供共享密钥）
- `trusted-proxy`（具备身份感知能力的反向代理；参见 [可信代理认证](/zh-CN/gateway/trusted-proxy-auth)）

当 `tailscale.mode = "serve"` 且 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket 认证可以使用 Tailscale 身份标头（`tailscale-user-login`），无需提供令牌/密码。OpenClaw 会通过本地 Tailscale 守护进程（`tailscale whois`）解析 `x-forwarded-for` 地址，并在接受前将其与标头匹配，以验证身份。OpenClaw 只有在请求来自 loopback，并带有 Tailscale 的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host` 标头时，才会将请求视为 Serve 请求。
对于包含浏览器设备身份的 Control UI 操作者会话，这条已验证的 Serve 路径也会跳过设备配对往返。它不会绕过浏览器设备身份：无设备的客户端仍会被拒绝，节点角色或非 Control UI 的 WebSocket 连接仍会遵循正常的配对和认证检查。
HTTP API 端点（例如 `/v1/*`、`/tools/invoke` 和 `/api/channels/*`）**不会**使用 Tailscale 身份标头认证。它们仍遵循 Gateway 网关的正常 HTTP 认证模式：默认使用共享密钥认证，或使用有意配置的 trusted-proxy / 私有入口 `none` 设置。
这个无令牌流程假设 Gateway 网关主机可信。如果不受信任的本地代码可能在同一主机上运行，请禁用 `gateway.auth.allowTailscale`，改为要求令牌/密码认证。
要要求显式共享密钥凭证，请设置 `gateway.auth.allowTailscale: false`，并使用 `gateway.auth.mode: "token"` 或 `"password"`。

## 配置示例

### 仅 Tailnet（Serve）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

打开：`https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

要通过具名 Tailscale Service 而不是设备主机名暴露 Control UI，请将 `gateway.tailscale.serviceName` 设置为 Service 名称：

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

使用上面的示例时，启动报告会将 Service URL 显示为 `https://openclaw.<tailnet-name>.ts.net/`，而不是设备主机名。Tailscale Services 要求主机是你的 tailnet 中已批准的带标签节点。启用此选项前，请先在 Tailscale 中配置标签并批准 Service，否则 `tailscale serve --service=...` 会在 Gateway 网关启动期间失败。

### 仅 Tailnet（绑定到 Tailnet IP）

当你希望 Gateway 网关直接监听 Tailnet IP（不使用 Serve/Funnel）时使用此配置。

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
Loopback（`http://127.0.0.1:18789`）在此模式下**不会**工作。
</Note>

### 公共互联网（Funnel + 共享密码）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

优先使用 `OPENCLAW_GATEWAY_PASSWORD`，而不是将密码提交到磁盘。

## CLI 示例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 说明

- Tailscale Serve/Funnel 要求已安装并登录 `tailscale` CLI。
- `tailscale.mode: "funnel"` 会拒绝启动，除非认证模式为 `password`，以避免公开暴露。
- `gateway.tailscale.serviceName` 仅适用于 Serve 模式，并会传递给 `tailscale serve --service=<name>`。该值必须使用 Tailscale 的 `svc:<dns-label>` Service 名称格式，例如 `svc:openclaw`。Tailscale 要求 Service 主机是带标签节点，并且 Service 可能需要先在管理控制台中批准，Serve 才能发布它。
- 如果你希望 OpenClaw 在关闭时撤销 `tailscale serve` 或 `tailscale funnel` 配置，请设置 `gateway.tailscale.resetOnExit`。
- 设置 `gateway.tailscale.preserveFunnel: true` 可让外部配置的 `tailscale funnel` 路由在 Gateway 网关重启期间保持活动。启用后，当 Gateway 网关以 `mode: "serve"` 运行时，OpenClaw 会在重新应用 Serve 前检查 `tailscale funnel status`，并在已有 Funnel 路由覆盖 Gateway 网关端口时跳过。OpenClaw 管理的 Funnel 仅密码策略保持不变。
- `gateway.bind: "tailnet"` 是直接 Tailnet 绑定（无 HTTPS、无 Serve/Funnel）。
- `gateway.bind: "auto"` 优先使用 loopback；如果你想要仅限 Tailnet，请使用 `tailnet`。
- Serve/Funnel 只暴露 **Gateway 网关控制 UI + WS**。节点通过同一个 Gateway 网关 WS 端点连接，因此 Serve 可用于节点访问。

## 浏览器控制（远程 Gateway 网关 + 本地浏览器）

如果你在一台机器上运行 Gateway 网关，但想驱动另一台机器上的浏览器，请在浏览器机器上运行一个**节点主机**，并让两者保持在同一个 tailnet 中。Gateway 网关会将浏览器操作代理到该节点；不需要单独的控制服务器或 Serve URL。

避免将 Funnel 用于浏览器控制；将节点配对视同操作者访问。

## Tailscale 前提条件 + 限制

- Serve 要求为你的 tailnet 启用 HTTPS；如果缺失，CLI 会提示。
- Serve 会注入 Tailscale 身份标头；Funnel 不会。
- Funnel 要求 Tailscale v1.38.3+、MagicDNS、已启用 HTTPS，以及 funnel 节点属性。
- Funnel 仅支持通过 TLS 使用端口 `443`、`8443` 和 `10000`。
- macOS 上的 Funnel 要求使用开源 Tailscale 应用变体。

## 了解更多

- Tailscale Serve 概览：[https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 命令：[https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概览：[https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 命令：[https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 相关

- [远程访问](/zh-CN/gateway/remote)
- [设备发现](/zh-CN/gateway/discovery)
- [认证](/zh-CN/gateway/authentication)
