---
read_when:
    - 将 Gateway 网关控制界面暴露到 localhost 之外
    - 自动化 tailnet 或公共仪表板访问
summary: 为 Gateway 网关仪表板集成了 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-05-10T19:35:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3a90145b9884f31d43fabaddabe17e6ba017dabaec6e6e7d263dacefb33f1b6
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw 可以为 Gateway 网关仪表盘和 WebSocket 端口自动配置 Tailscale **Serve**（tailnet）或 **Funnel**（公网）。这会让 Gateway 网关继续绑定到环回地址，同时由 Tailscale 提供 HTTPS、路由，以及（对 Serve 而言）身份标头。

## 模式

- `serve`：通过 `tailscale serve` 使用仅 tailnet 的 Serve。Gateway 网关保持在 `127.0.0.1`。
- `funnel`：通过 `tailscale funnel` 使用公网 HTTPS。OpenClaw 需要一个共享密码。
- `off`：默认值（不自动化 Tailscale）。

Status 和审计输出会使用 **Tailscale 暴露** 来表示这个 OpenClaw Serve/Funnel 模式。`off` 表示 OpenClaw 未管理 Serve 或 Funnel；它并不表示本地 Tailscale 守护进程已停止或已登出。

## 凭证

设置 `gateway.auth.mode` 来控制握手：

- `none`（仅私有入口）
- `token`（设置 `OPENCLAW_GATEWAY_TOKEN` 时的默认值）
- `password`（通过 `OPENCLAW_GATEWAY_PASSWORD` 或配置提供共享密钥）
- `trusted-proxy`（具备身份感知能力的反向代理；见 [可信代理凭证](/zh-CN/gateway/trusted-proxy-auth)）

当 `tailscale.mode = "serve"` 且 `gateway.auth.allowTailscale` 为 `true` 时，控制 UI/WebSocket 凭证可以使用 Tailscale 身份标头（`tailscale-user-login`），无需提供令牌/密码。OpenClaw 会通过本地 Tailscale 守护进程（`tailscale whois`）解析 `x-forwarded-for` 地址，并在接受请求前确认它与标头匹配，从而验证该身份。只有当请求来自环回地址，并带有 Tailscale 的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host` 标头时，OpenClaw 才会将其视为 Serve 请求。
对于包含浏览器设备身份的控制 UI 操作员会话，这条经过验证的 Serve 路径还会跳过设备配对往返。它不会绕过浏览器设备身份：无设备客户端仍会被拒绝，节点角色或非控制 UI WebSocket 连接仍会遵循正常的配对和凭证检查。
HTTP API 端点（例如 `/v1/*`、`/tools/invoke` 和 `/api/channels/*`）**不会**使用 Tailscale 身份标头凭证。它们仍会遵循 Gateway 网关的正常 HTTP 凭证模式：默认使用共享密钥凭证，或使用有意配置的可信代理 / 私有入口 `none` 设置。
这个无令牌流程假定 Gateway 网关主机是可信的。如果不受信任的本地代码可能在同一主机上运行，请禁用 `gateway.auth.allowTailscale`，并改为要求令牌/密码凭证。
要要求显式共享密钥凭据，请设置 `gateway.auth.allowTailscale: false`，并使用 `gateway.auth.mode: "token"` 或 `"password"`。

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

### 仅 tailnet（绑定到 tailnet IP）

当你希望 Gateway 网关直接监听 tailnet IP（不使用 Serve/Funnel）时使用此配置。

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

从另一台 tailnet 设备连接：

- 控制 UI：`http://<tailscale-ip>:18789/`
- WebSocket：`ws://<tailscale-ip>:18789`

<Note>
环回地址（`http://127.0.0.1:18789`）在此模式下**无法**使用。
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

## 说明

- Tailscale Serve/Funnel 要求已安装并登录 `tailscale` CLI。
- `tailscale.mode: "funnel"` 会拒绝启动，除非凭证模式为 `password`，以避免公网暴露。
- 如果希望 OpenClaw 在关闭时撤销 `tailscale serve` 或 `tailscale funnel` 配置，请设置 `gateway.tailscale.resetOnExit`。
- 设置 `gateway.tailscale.preserveFunnel: true` 可在 Gateway 网关重启期间保留外部配置的 `tailscale funnel` 路由。启用后，当 Gateway 网关以 `mode: "serve"` 运行时，OpenClaw 会在重新应用 Serve 前检查 `tailscale funnel status`，并在已有 Funnel 路由覆盖 Gateway 网关端口时跳过应用。OpenClaw 管理的 Funnel 仅密码策略保持不变。
- `gateway.bind: "tailnet"` 是直接 tailnet 绑定（无 HTTPS，无 Serve/Funnel）。
- `gateway.bind: "auto"` 优先使用环回地址；如果你想要仅 tailnet，请使用 `tailnet`。
- Serve/Funnel 只暴露 **Gateway 网关控制 UI + WS**。节点通过同一个 Gateway 网关 WS 端点连接，因此 Serve 可用于节点访问。

## 浏览器控制（远程 Gateway 网关 + 本地浏览器）

如果你在一台机器上运行 Gateway 网关，但想驱动另一台机器上的浏览器，请在浏览器机器上运行一个**节点主机**，并让两者保持在同一个 tailnet 中。Gateway 网关会把浏览器操作代理到节点；不需要单独的控制服务器或 Serve URL。

浏览器控制应避免使用 Funnel；将节点配对视作操作员访问来处理。

## Tailscale 前提条件 + 限制

- Serve 要求你的 tailnet 已启用 HTTPS；如果缺失，CLI 会提示。
- Serve 会注入 Tailscale 身份标头；Funnel 不会。
- Funnel 要求 Tailscale v1.38.3+、MagicDNS、已启用 HTTPS，以及 Funnel 节点属性。
- Funnel 只支持通过 TLS 使用端口 `443`、`8443` 和 `10000`。
- macOS 上的 Funnel 需要开源 Tailscale 应用变体。

## 了解更多

- Tailscale Serve 概览：[https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 命令：[https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概览：[https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 命令：[https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 相关

- [远程访问](/zh-CN/gateway/remote)
- [设备发现](/zh-CN/gateway/discovery)
- [身份验证](/zh-CN/gateway/authentication)
