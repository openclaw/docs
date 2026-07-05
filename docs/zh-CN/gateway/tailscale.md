---
read_when:
    - 将 Gateway 网关 Control UI 暴露到 localhost 之外
    - 自动化 tailnet 或公共仪表板访问
summary: 为 Gateway 网关仪表盘集成 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-07-05T11:21:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e9622024cd94f6fc45cf14a9ecc3e4bb2fc8c43b23d8c0210c3a512e0cdf6ef
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw 可以为 Gateway 网关仪表板和 WebSocket 端口自动配置 Tailscale **Serve**（tailnet）或 **Funnel**（公开）。这会让 Gateway 网关保持绑定到 local loopback，同时由 Tailscale 提供 HTTPS、路由，以及（对于 Serve）身份标头。

## 模式

`gateway.tailscale.mode`：

| 模式            | 行为                                                                    |
| --------------- | --------------------------------------------------------------------------- |
| `serve`         | 通过 `tailscale serve` 使用仅限 tailnet 的 Serve。Gateway 网关保持在 `127.0.0.1`。 |
| `funnel`        | 通过 `tailscale funnel` 使用公开 HTTPS。需要共享密码。            |
| `off`（默认） | 不启用 Tailscale 自动化。                                                    |

状态和审计输出会使用 **Tailscale 暴露** 来表示此 OpenClaw Serve/Funnel 模式。`off` 表示 OpenClaw 不管理 Serve 或 Funnel；它不表示本地 Tailscale 守护进程已停止或已退出登录。

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

若要通过命名 Tailscale Service 而不是设备主机名来暴露 Control UI，请将 `gateway.tailscale.serviceName` 设置为 Service 名称：

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

启动时随后会报告 Service URL 为 `https://openclaw.<tailnet-name>.ts.net/`，而不是设备主机名。Tailscale Services 要求该主机是你的 tailnet 中已批准的带标签节点——请先在 Tailscale 中配置标签并批准 Service，然后再启用此项；否则 `tailscale serve --service=...` 会在 Gateway 网关启动期间失败。

### 仅限 tailnet（绑定到 Tailnet IP）

使用此项可让 Gateway 网关直接监听 Tailnet IP，不使用 Serve/Funnel：

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
在此模式下，Loopback（`http://127.0.0.1:18789`）将**无法**工作。
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

优先使用 `OPENCLAW_GATEWAY_PASSWORD`，而不是将密码提交到磁盘。

## CLI 示例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 认证

`gateway.auth.mode` 控制握手：

| 模式                                                   | 使用场景                                                                            |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `none`                                                 | 仅私有入口                                                                |
| `token`（设置 `OPENCLAW_GATEWAY_TOKEN` 时的默认值） | 共享令牌                                                                        |
| `password`                                             | 通过 `OPENCLAW_GATEWAY_PASSWORD` 或配置提供的共享密钥                             |
| `trusted-proxy`                                        | 可感知身份的反向代理；请参阅[可信代理认证](/zh-CN/gateway/trusted-proxy-auth) |

### Tailscale 身份标头（仅 Serve）

当 `tailscale.mode: "serve"` 且 `gateway.auth.allowTailscale` 为 `true` 时，Control UI/WebSocket 认证可以使用 Tailscale 身份标头（`tailscale-user-login`）代替令牌/密码。OpenClaw 会通过本地 Tailscale 守护进程（`tailscale whois`）解析请求的 `x-forwarded-for` 地址，并在接受前将其与标头登录名匹配，以此验证该标头。只有当请求来自 loopback，并携带 Tailscale 的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host` 标头时，才符合此路径的条件。

此无令牌流程假定 Gateway 网关主机是可信的。如果不受信任的本地代码可能在同一主机上运行，请设置 `gateway.auth.allowTailscale: false`，并改为要求令牌/密码认证。

绕过范围：

- 仅适用于 Control UI WebSocket 认证表面。HTTP API 端点（`/v1/*`、`/tools/invoke`、`/api/channels/*` 等）从不使用 Tailscale 身份标头认证；它们始终遵循 Gateway 网关的常规 HTTP 认证模式。
- 对于已携带浏览器设备身份的 Control UI 操作员会话，已验证的 Tailscale 身份会跳过引导令牌/二维码配对往返。
- 它不会绕过设备身份本身：没有设备的客户端仍会被拒绝，节点角色连接仍会经过常规配对和认证检查。

## 说明

- Tailscale Serve/Funnel 要求已安装 `tailscale` CLI 并已登录。
- 除非认证模式为 `password`，否则 `tailscale.mode: "funnel"` 会拒绝启动，以避免公开暴露。
- `gateway.tailscale.serviceName` 仅适用于 Serve 模式，并会传递给 `tailscale serve --service=<name>`。该值必须使用 Tailscale 的 `svc:<dns-label>` 格式，例如 `svc:openclaw`。Tailscale 要求 Service 主机是带标签节点，并且 Service 可能需要在管理控制台批准后，Serve 才能发布它。
- `gateway.tailscale.resetOnExit` 会在关机时撤销 `tailscale serve`/`tailscale funnel` 配置。
- `gateway.tailscale.preserveFunnel: true` 会在 Gateway 网关重启期间保持外部配置的 `tailscale funnel` 路由存活。使用 `mode: "serve"` 时，OpenClaw 会在重新应用 Serve 前检查 `tailscale funnel status`，如果 Funnel 路由已覆盖 Gateway 网关端口，则跳过。OpenClaw 管理的 Funnel 仅密码策略保持不变。
- `gateway.bind: "tailnet"` 是直接 Tailnet 绑定（无 HTTPS、无 Serve/Funnel）。
- `gateway.bind: "auto"` 优先使用 loopback；若要仅限 Tailnet 绑定，请使用 `tailnet`。
- Serve/Funnel 只暴露 **Gateway 网关控制 UI + WS**。节点通过同一个 Gateway 网关 WS 端点连接，因此 Serve 也适用于节点访问。

### Tailscale 前置条件和限制

- Serve 要求你的 tailnet 已启用 HTTPS；如果缺失，CLI 会提示。
- Serve 会注入 Tailscale 身份标头；Funnel 不会。
- Funnel 要求 Tailscale v1.38.3+、MagicDNS、已启用 HTTPS，以及 funnel 节点属性。
- Funnel 仅支持通过 TLS 使用端口 `443`、`8443` 和 `10000`。
- macOS 上的 Funnel 要求使用开源 Tailscale app 变体。

## 浏览器控制（远程 Gateway 网关 + 本地浏览器）

若要在一台机器上运行 Gateway 网关，但驱动另一台机器上的浏览器，请在浏览器机器上运行**节点主机**，并让两者保持在同一个 tailnet 中。Gateway 网关会将浏览器操作代理到该节点；不需要单独的控制服务器或 Serve URL。

避免将 Funnel 用于浏览器控制；请像处理操作员访问一样处理节点配对。

## 了解更多

- Tailscale Serve 概览：[https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 命令：[https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概览：[https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 命令：[https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 相关

- [远程访问](/zh-CN/gateway/remote)
- [设备发现](/zh-CN/gateway/discovery)
- [身份验证](/zh-CN/gateway/authentication)
