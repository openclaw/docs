---
read_when:
    - 你想通过 Tailscale 访问 Gateway 网关
    - 你需要浏览器 Control UI 和配置编辑功能
summary: Gateway 网关 Web 界面：Control UI、绑定模式和安全性
title: Web 网页版
x-i18n:
    generated_at: "2026-07-11T21:03:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

Gateway 网关通过与 Gateway WebSocket 相同的端口提供一个小型的**浏览器 Control UI**（Vite + Lit）：

- 默认：`http://<host>:18789/`
- 使用 `gateway.tls.enabled: true`：`https://<host>:18789/`
- 可选前缀：设置 `gateway.controlUi.basePath`（例如 `/openclaw`）

相关功能见 [Control UI](/zh-CN/web/control-ui)。本页介绍绑定模式、安全性及其他面向 Web 的功能界面。

## 配置（默认启用）

存在资源文件（`dist/control-ui`）时，Control UI **默认启用**：

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath 可选
  },
}
```

## Webhooks

当 `hooks.enabled=true` 时，Gateway 网关还会在同一 HTTP 服务器上公开一个 webhook 端点。有关身份验证和有效载荷，请参阅 [Gateway 配置参考](/zh-CN/gateway/configuration-reference#hooks)中的 `hooks`。

## 管理 HTTP RPC

`POST /api/v1/admin/rpc` 通过 HTTP 公开选定的 Gateway 网关控制平面方法。默认关闭；仅在启用 `admin-http-rpc` 插件时注册。有关身份验证模型、允许的方法以及与 WebSocket API 的比较，请参阅[管理 HTTP RPC](/zh-CN/plugins/admin-http-rpc)。

## Tailscale 访问

<Tabs>
  <Tab title="集成式 Serve（推荐）">
    让 Gateway 网关保持在环回地址上，并由 Tailscale Serve 代理：

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
  <Tab title="Tailnet 绑定 + 令牌">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    启动 Gateway 网关（此非环回示例使用共享密钥令牌身份验证）：

    ```bash
    openclaw gateway
    ```

    打开 `http://<tailscale-ip>:18789/`（或你配置的 `gateway.controlUi.basePath`）。

  </Tab>
  <Tab title="公共互联网（Funnel）">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // 或 OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` 要求使用 `gateway.auth.mode: "password"`；Serve 和 Funnel 都要求使用 `gateway.bind: "loopback"`。

  </Tab>
</Tabs>

## 安全说明

- 默认要求进行 Gateway 网关身份验证：启用后可使用令牌、密码、可信代理或 Tailscale Serve 身份标头。
- 非环回绑定仍然**要求**进行 Gateway 网关身份验证：使用令牌/密码身份验证，或使用 `gateway.auth.mode: "trusted-proxy"` 配置具备身份感知能力的反向代理。
- 新手引导向导默认创建共享密钥身份验证，并且通常会生成 Gateway 网关令牌，即使在环回地址上也是如此。
- 在共享密钥模式下，UI 会在 WebSocket 握手期间发送 `connect.params.auth.token` 或 `connect.params.auth.password`。
- 使用 `gateway.tls.enabled: true` 时，本地仪表板/状态辅助工具会呈现 `https://` URL 和 `wss://` WebSocket URL。
- 在携带身份信息的模式（Tailscale Serve、`trusted-proxy`）下，WebSocket 身份验证检查通过请求标头而非共享密钥完成。
- 对于公共非环回 Control UI 部署，请显式设置 `gateway.controlUi.allowedOrigins`（完整来源）。对于环回、RFC1918/链路本地、`.local`、`.ts.net` 和 Tailscale CGNAT 主机，无需设置即可接受私有同源加载。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` 会启用 Host 标头来源回退；这是一种危险的安全降级。
- 使用 Serve 时，如果 `gateway.auth.allowTailscale: true`，Tailscale 身份标头可满足 Control UI/WebSocket 身份验证要求（无需令牌/密码）。HTTP API 端点不使用 Tailscale 身份标头；它们始终遵循 Gateway 网关的常规 HTTP 身份验证模式。设置 `gateway.auth.allowTailscale: false` 可要求即使通过 Serve 访问也必须提供显式凭据。此无令牌流程假定 Gateway 网关主机本身可信。请参阅 [Tailscale](/zh-CN/gateway/tailscale)和[安全性](/zh-CN/gateway/security)。

## 构建 UI

Gateway 网关从 `dist/control-ui` 提供静态文件：

```bash
pnpm ui:build
```
