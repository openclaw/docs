---
read_when:
    - 在 localhost 之外开放 Gateway 网关 Control UI
    - 自动化 tailnet 或公共仪表板访问
summary: 为 Gateway 网关仪表盘集成 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-07-11T20:34:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw 可以为 Gateway 网关仪表板和 WebSocket 端口自动配置 Tailscale **Serve**（tailnet）或 **Funnel**（公网）。这样可以让 Gateway 网关继续绑定到 local loopback，同时由 Tailscale 提供 HTTPS、路由，以及（对于 Serve）身份标头。

## 模式

`gateway.tailscale.mode`：

| 模式            | 行为                                                                    |
| --------------- | --------------------------------------------------------------------------- |
| `serve`         | 通过 `tailscale serve` 提供仅限 tailnet 的 Serve。Gateway 网关保持在 `127.0.0.1`。 |
| `funnel`        | 通过 `tailscale funnel` 提供公网 HTTPS。需要共享密码。            |
| `off`（默认） | 不启用 Tailscale 自动化。                                                    |

状态和审计输出使用 **Tailscale 暴露** 来指代这种 OpenClaw Serve/Funnel 模式。`off` 表示 OpenClaw 不管理 Serve 或 Funnel；并不表示本地 Tailscale 守护进程已停止或已退出登录。

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

要通过具名 Tailscale Service 而非设备主机名暴露 Control UI，请将 `gateway.tailscale.serviceName` 设置为 Service 名称：

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

启动时将报告 Service URL `https://openclaw.<tailnet-name>.ts.net/`，而不是设备主机名。Tailscale Services 要求主机是你的 tailnet 中已获批准且带标签的节点——启用此功能前，请在 Tailscale 中配置标签并批准该 Service，否则 `tailscale serve --service=...` 会在 Gateway 网关启动期间失败。

### 仅限 Tailnet（绑定到 Tailnet IP）

使用此配置可让 Gateway 网关直接监听 Tailnet IP，而不使用 Serve/Funnel：

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
存在可绑定的 Tailnet IPv4 时，Gateway 网关还会要求经过身份验证的同主机客户端使用 `http://127.0.0.1:18789`。如果启动时没有可用的 Tailnet 地址，则只回退到 local loopback；请在 Tailscale 可用后重新启动，以添加直接 Tailnet 访问。两种路径都不会增加局域网或公网暴露。
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

应优先使用 `OPENCLAW_GATEWAY_PASSWORD`，不要将密码提交到磁盘。

## CLI 示例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 身份验证

`gateway.auth.mode` 控制握手：

| 模式                                                   | 使用场景                                                                            |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `none`                                                 | 仅限私有入口                                                                |
| `token`（设置 `OPENCLAW_GATEWAY_TOKEN` 时的默认值） | 共享令牌                                                                        |
| `password`                                             | 通过 `OPENCLAW_GATEWAY_PASSWORD` 或配置提供共享密钥                             |
| `trusted-proxy`                                        | 感知身份的反向代理；请参阅[可信代理身份验证](/zh-CN/gateway/trusted-proxy-auth) |

### Tailscale 身份标头（仅限 Serve）

当 `tailscale.mode: "serve"` 且 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket 身份验证可以使用 Tailscale 身份标头（`tailscale-user-login`），而不使用令牌或密码。接受请求前，OpenClaw 会通过本地 Tailscale 守护进程（`tailscale whois`）解析请求的 `x-forwarded-for` 地址，并将其与标头中的登录名进行匹配，以验证该标头。只有当请求来自 local loopback，且携带 Tailscale 的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host` 标头时，才符合使用此路径的条件。

这种无令牌流程假定 Gateway 网关主机可信。如果不受信任的本地代码可能在同一主机上运行，请设置 `gateway.auth.allowTailscale: false`，并改为要求令牌或密码身份验证。

绕过范围：

- 仅适用于 Control UI 的 WebSocket 身份验证界面。HTTP API 端点（`/v1/*`、`/tools/invoke`、`/api/channels/*` 等）绝不会使用 Tailscale 身份标头身份验证；它们始终遵循 Gateway 网关的常规 HTTP 身份验证模式。
- 对于已携带浏览器设备身份的 Control UI 操作员会话，经过验证的 Tailscale 身份可以跳过引导令牌/二维码配对往返流程。
- 它不会绕过设备身份本身：没有设备身份的客户端仍会被拒绝，节点角色连接仍需经过正常的配对和身份验证检查。

## 注意事项

- Tailscale Serve/Funnel 要求已安装并登录 `tailscale` CLI。
- 除非身份验证模式为 `password`，否则 `tailscale.mode: "funnel"` 会拒绝启动，以避免公网暴露。
- `gateway.tailscale.serviceName` 仅适用于 Serve 模式，并会传递给 `tailscale serve --service=<name>`。该值必须使用 Tailscale 的 `svc:<dns-label>` 格式，例如 `svc:openclaw`。Tailscale 要求 Service 主机是带标签的节点，并且在 Serve 发布该 Service 前，可能需要在管理控制台中批准。
- `gateway.tailscale.resetOnExit` 会在关闭时撤销 `tailscale serve`/`tailscale funnel` 配置。
- `gateway.tailscale.preserveFunnel: true` 会让外部配置的 `tailscale funnel` 路由在 Gateway 网关重新启动后继续保持活动状态。当使用 `mode: "serve"` 时，OpenClaw 会在重新应用 Serve 前检查 `tailscale funnel status`；如果已有 Funnel 路由覆盖 Gateway 网关端口，则跳过应用。由 OpenClaw 管理的 Funnel 仅限密码策略保持不变。
- 当 Tailnet IPv4 可用时，`gateway.bind: "tailnet"` 会使用直接 Tailnet 绑定（无 HTTPS、无 Serve/Funnel），并同时要求本地 `127.0.0.1`；否则只回退到 local loopback。
- `gateway.bind: "auto"` 优先使用 local loopback；使用 `tailnet` 可将网络暴露限制在 Tailnet 内，同时保留同主机的 local loopback 访问。
- Serve/Funnel 仅暴露 **Gateway 网关 Control UI + WS**。节点通过同一个 Gateway 网关 WS 端点连接，因此 Serve 也可用于节点访问。

### Tailscale 前提条件和限制

- Serve 要求你的 tailnet 已启用 HTTPS；如果尚未启用，CLI 会提示你。
- Serve 会注入 Tailscale 身份标头；Funnel 不会。
- Funnel 要求 Tailscale v1.38.3+、MagicDNS、已启用 HTTPS，以及 Funnel 节点属性。
- Funnel 仅支持通过 TLS 使用端口 `443`、`8443` 和 `10000`。
- macOS 上的 Funnel 要求使用 Tailscale 应用的开源版本。

## 浏览器控制（远程 Gateway 网关 + 本地浏览器）

要在一台计算机上运行 Gateway 网关、但在另一台计算机上操控浏览器，请在浏览器所在的计算机上运行**节点主机**，并确保两者位于同一个 tailnet 中。Gateway 网关会将浏览器操作代理到该节点；无需单独的控制服务器或 Serve URL。

避免使用 Funnel 进行浏览器控制；应将节点配对视为操作员访问。

## 了解更多

- Tailscale Serve 概览：[https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 命令：[https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概览：[https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 命令：[https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 相关内容

- [远程访问](/zh-CN/gateway/remote)
- [设备发现](/zh-CN/gateway/discovery)
- [身份验证](/zh-CN/gateway/authentication)
