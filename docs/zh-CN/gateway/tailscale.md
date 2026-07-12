---
read_when:
    - 在 localhost 之外暴露 Gateway 网关 Control UI
    - 自动化 tailnet 或公共仪表板访问
summary: 为 Gateway 网关仪表板集成 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T14:30:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw 可以为 Gateway 网关仪表板和 WebSocket 端口自动配置 Tailscale **Serve**（tailnet）或 **Funnel**（公共访问）。这样既能让 Gateway 网关保持绑定到环回地址，又能由 Tailscale 提供 HTTPS、路由以及（对于 Serve）身份标头。

## 模式

`gateway.tailscale.mode`：

| 模式            | 行为                                                                    |
| --------------- | --------------------------------------------------------------------------- |
| `serve`         | 通过 `tailscale serve` 提供仅限 tailnet 的 Serve。Gateway 网关保持在 `127.0.0.1`。 |
| `funnel`        | 通过 `tailscale funnel` 提供公共 HTTPS。需要共享密码。            |
| `off`（默认） | 不启用 Tailscale 自动化。                                                    |

状态和审计输出使用 **Tailscale 暴露** 来表示此 OpenClaw Serve/Funnel 模式。`off` 表示 OpenClaw 不管理 Serve 或 Funnel；并不表示本地 Tailscale 守护进程已停止或已退出登录。

## 配置示例

### 仅限 tailnet（Serve）

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

随后，启动时会将 Service URL 报告为 `https://openclaw.<tailnet-name>.ts.net/`，而不是设备主机名。Tailscale Services 要求主机是你的 tailnet 中已获批准的带标签节点——启用此配置前，请在 Tailscale 中配置标签并批准 Service，否则 `tailscale serve --service=...` 会在 Gateway 网关启动期间失败。

### 仅限 tailnet（绑定到 Tailnet IP）

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
存在可绑定的 Tailnet IPv4 时，Gateway 网关还要求经过身份验证的同主机客户端使用 `http://127.0.0.1:18789`。如果启动时没有可用的 Tailnet 地址，则会回退为仅使用环回地址；Tailscale 可用后重新启动，即可添加直接 Tailnet 访问。这两种路径都不会增加 LAN 或公共暴露。
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

优先使用 `OPENCLAW_GATEWAY_PASSWORD`，不要将密码提交到磁盘。

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
| `password`                                             | 通过 `OPENCLAW_GATEWAY_PASSWORD` 或配置提供的共享密钥                             |
| `trusted-proxy`                                        | 身份感知反向代理；请参阅[可信代理身份验证](/zh-CN/gateway/trusted-proxy-auth) |

### Tailscale 身份标头（仅限 Serve）

当 `tailscale.mode: "serve"` 且 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket 身份验证可以使用 Tailscale 身份标头（`tailscale-user-login`），而无需令牌/密码。OpenClaw 会通过本地 Tailscale 守护进程（`tailscale whois`）解析请求的 `x-forwarded-for` 地址，并在接受请求前将其与标头中的登录名进行匹配，从而验证该标头。只有当请求来自环回地址，并携带 Tailscale 的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host` 标头时，才符合使用此路径的条件。

这种无令牌流程假定 Gateway 网关主机可信。如果不受信任的本地代码可能在同一主机上运行，请设置 `gateway.auth.allowTailscale: false`，并改为要求令牌/密码身份验证。

绕过范围：

- 仅适用于 Control UI WebSocket 身份验证表面。HTTP API 端点（`/v1/*`、`/tools/invoke`、`/api/channels/*` 等）绝不使用 Tailscale 身份标头身份验证；它们始终遵循 Gateway 网关的常规 HTTP 身份验证模式。
- 对于已经携带浏览器设备身份的 Control UI 操作员会话，经过验证的 Tailscale 身份会跳过引导令牌/二维码配对往返流程。
- 它不会绕过设备身份本身：没有设备身份的客户端仍会被拒绝，节点角色连接仍会经过正常的配对和身份验证检查。

## 注意事项

- Tailscale Serve/Funnel 要求已安装并登录 `tailscale` CLI。
- 除非身份验证模式为 `password`，否则 `tailscale.mode: "funnel"` 会拒绝启动，以避免公共暴露。
- `gateway.tailscale.serviceName` 仅适用于 Serve 模式，并会传递给 `tailscale serve --service=<name>`。该值必须采用 Tailscale 的 `svc:<dns-label>` 格式，例如 `svc:openclaw`。Tailscale 要求 Service 主机是带标签节点，并且在 Serve 可以发布 Service 之前，可能需要在管理控制台中批准该 Service。
- `gateway.tailscale.resetOnExit` 会在关闭时撤销 `tailscale serve`/`tailscale funnel` 配置。
- `gateway.tailscale.preserveFunnel: true` 会让外部配置的 `tailscale funnel` 路由在 Gateway 网关重新启动后继续生效。使用 `mode: "serve"` 时，OpenClaw 会在重新应用 Serve 前检查 `tailscale funnel status`，如果已有 Funnel 路由覆盖 Gateway 网关端口，则跳过应用 Serve。OpenClaw 管理的 Funnel 仅限密码策略保持不变。
- 当 Tailnet IPv4 可用时，`gateway.bind: "tailnet"` 会使用直接 Tailnet 绑定（无 HTTPS、无 Serve/Funnel），并同时要求本地 `127.0.0.1`；否则会回退为仅使用环回地址。
- `gateway.bind: "auto"` 优先使用环回地址；使用 `tailnet` 可将网络暴露限制在 Tailnet 内，同时保留同主机环回访问。
- Serve/Funnel 仅暴露 **Gateway 网关 Control UI + WS**。节点通过同一个 Gateway 网关 WS 端点连接，因此 Serve 也适用于节点访问。

### Tailscale 前提条件和限制

- Serve 要求为你的 tailnet 启用 HTTPS；如果未启用，CLI 会提示。
- Serve 会注入 Tailscale 身份标头；Funnel 不会。
- Funnel 要求 Tailscale v1.38.3+、MagicDNS、已启用 HTTPS，以及 funnel 节点属性。
- Funnel 仅支持通过 TLS 使用端口 `443`、`8443` 和 `10000`。
- 在 macOS 上使用 Funnel 需要开源版 Tailscale 应用。

## 浏览器控制（远程 Gateway 网关 + 本地浏览器）

要在一台机器上运行 Gateway 网关、同时控制另一台机器上的浏览器，请在浏览器所在机器上运行一个**节点主机**，并让两台机器保持在同一个 tailnet 中。Gateway 网关会将浏览器操作代理到该节点；无需单独的控制服务器或 Serve URL。

避免使用 Funnel 进行浏览器控制；应将节点配对视同操作员访问。

## 了解更多

- Tailscale Serve 概览：[https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 命令：[https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概览：[https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 命令：[https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 相关内容

- [远程访问](/zh-CN/gateway/remote)
- [设备发现](/zh-CN/gateway/discovery)
- [身份验证](/zh-CN/gateway/authentication)
