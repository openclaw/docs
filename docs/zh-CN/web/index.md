---
read_when:
    - 你想通过 Tailscale 访问 Gateway 网关
    - 你想要浏览器 Control UI 和配置编辑功能
summary: Gateway 网关 Web 表面：Control UI、绑定模式和安全
title: 网页
x-i18n:
    generated_at: "2026-07-05T11:47:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

Gateway 网关会从与 Gateway 网关 WebSocket 相同的端口提供一个小型 **浏览器 Control UI**（Vite + Lit）：

- 默认：`http://<host>:18789/`
- 使用 `gateway.tls.enabled: true`：`https://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

能力位于 [Control UI](/zh-CN/web/control-ui)。本页介绍绑定模式、安全性和其他面向 Web 的表面。

## 配置（默认开启）

当资源存在（`dist/control-ui`）时，Control UI **默认启用**：

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Webhooks

当 `hooks.enabled=true` 时，Gateway 网关还会在同一个 HTTP 服务器上公开一个 webhook 端点。有关身份验证和载荷，请参见 [Gateway 配置参考](/zh-CN/gateway/configuration-reference#hooks) 中的 `hooks`。

## Admin HTTP RPC

`POST /api/v1/admin/rpc` 通过 HTTP 公开选定的 Gateway 网关控制平面方法。默认关闭；仅在启用 `admin-http-rpc` 插件时注册。有关身份验证模型、允许的方法以及与 WebSocket API 的对比，请参见 [Admin HTTP RPC](/zh-CN/plugins/admin-http-rpc)。

## Tailscale 访问

<Tabs>
  <Tab title="集成 Serve（推荐）">
    将 Gateway 网关保持在 loopback 上，并让 Tailscale Serve 代理它：

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    启动 Gateway 网关：

    ```bash
    openclaw gateway
    ```

    打开 `https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）。

  </Tab>
  <Tab title="Tailnet 绑定 + token">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    启动 Gateway 网关（这个非 loopback 示例使用共享密钥 token 身份验证）：

    ```bash
    openclaw gateway
    ```

    打开 `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）。

  </Tab>
  <Tab title="公网（Funnel）">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` 要求 `gateway.auth.mode: "password"`；Serve 和 Funnel 都要求 `gateway.bind: "loopback"`。

  </Tab>
</Tabs>

## 安全说明

- Gateway 网关身份验证默认必需：token、password、trusted-proxy，或启用时的 Tailscale Serve 身份标头。
- 非 loopback 绑定仍然**要求** Gateway 网关身份验证：token/password 身份验证，或使用 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。
- 新手引导向导默认创建共享密钥身份验证，并且通常会生成 Gateway 网关 token，即使在 loopback 上也是如此。
- 在共享密钥模式下，UI 会在 WebSocket 握手期间发送 `connect.params.auth.token` 或 `connect.params.auth.password`。
- 使用 `gateway.tls.enabled: true` 时，本地仪表盘/状态辅助工具会呈现 `https://` URL 和 `wss://` WebSocket URL。
- 在携带身份的模式（Tailscale Serve、`trusted-proxy`）下，WebSocket 身份验证检查由请求标头满足，而不是由共享密钥满足。
- 对于公开的非 loopback Control UI 部署，请显式设置 `gateway.controlUi.allowedOrigins`（完整来源）。对于 loopback、RFC1918/link-local、`.local`、`.ts.net` 和 Tailscale CGNAT 主机，私有同源加载无需此设置也会被接受。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` 启用 Host 标头来源回退；这是危险的安全降级。
- 使用 Serve 时，当 `gateway.auth.allowTailscale: true` 时，Tailscale 身份标头会满足 Control UI/WebSocket 身份验证（不需要 token/password）。HTTP API 端点不使用 Tailscale 身份标头；它们始终遵循 Gateway 网关的常规 HTTP 身份验证模式。设置 `gateway.auth.allowTailscale: false` 可要求即使通过 Serve 也必须提供显式凭据。这个无 token 流程假定 Gateway 网关主机本身是可信的。参见 [Tailscale](/zh-CN/gateway/tailscale) 和 [安全性](/zh-CN/gateway/security)。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件：

```bash
pnpm ui:build
```
