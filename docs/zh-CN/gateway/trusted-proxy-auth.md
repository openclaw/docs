---
read_when:
    - 在身份感知代理后运行 OpenClaw
    - 在 OpenClaw 前配置使用 OAuth 的 Pomerium、Caddy 或 nginx
    - 修复反向代理设置中的 WebSocket 1008 未授权错误
    - 决定在哪里设置 HSTS 和其他 HTTP 加固标头
sidebarTitle: Trusted proxy auth
summary: 将 Gateway 网关的身份验证委托给受信任的反向代理（Pomerium、Caddy、nginx + OAuth）
title: 受信任代理身份验证
x-i18n:
    generated_at: "2026-04-28T11:54:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311498b822d2dbf9833c71ec070ab5cee5b4dd2dfb0eeaad1d758eee367a2df3
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**安全敏感功能。** 此模式会将身份验证完全委托给你的反向代理。配置错误可能会让你的 Gateway 网关暴露给未授权访问。启用前请仔细阅读本页。
</Warning>

## 何时使用

在以下情况下使用 `trusted-proxy` 认证模式：

- 你在**可识别身份的代理**（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）后运行 OpenClaw。
- 你的代理处理所有身份验证，并通过标头传递用户身份。
- 你处于 Kubernetes 或容器环境中，代理是通向 Gateway 网关的唯一路径。
- 你遇到 WebSocket `1008 unauthorized` 错误，因为浏览器无法在 WS 载荷中传递令牌。

## 何时不要使用

- 如果你的代理不会对用户进行身份验证（只是 TLS 终结器或负载均衡器）。
- 如果存在任何绕过代理通向 Gateway 网关的路径（防火墙漏洞、内部网络访问）。
- 如果你不确定代理是否正确剥离/覆盖转发标头。
- 如果你只需要个人单用户访问（可考虑使用 Tailscale Serve + loopback 来简化设置）。

## 工作原理

<Steps>
  <Step title="Proxy authenticates the user">
    你的反向代理会对用户进行身份验证（OAuth、OIDC、SAML 等）。
  </Step>
  <Step title="Proxy adds an identity header">
    代理会添加一个包含已认证用户身份的标头（例如 `x-forwarded-user: nick@example.com`）。
  </Step>
  <Step title="Gateway verifies trusted source">
    OpenClaw 会检查请求是否来自**受信任的代理 IP**（在 `gateway.trustedProxies` 中配置）。
  </Step>
  <Step title="Gateway extracts identity">
    OpenClaw 会从配置的标头中提取用户身份。
  </Step>
  <Step title="Authorize">
    如果所有检查都通过，请求会被授权。
  </Step>
</Steps>

## Control UI 配对行为

当 `gateway.auth.mode = "trusted-proxy"` 处于启用状态且请求通过 trusted-proxy 检查时，Control UI WebSocket 会话无需设备配对身份即可连接。

影响：

- 在此模式下，配对不再是 Control UI 访问的主要关口。
- 你的反向代理认证策略和 `allowUsers` 会成为实际的访问控制。
- 仅允许受信任的代理 IP 进入 Gateway 网关入口（`gateway.trustedProxies` + 防火墙）。

## 配置

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source by default
    bind: "lan",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Optional: allow a same-host loopback proxy after explicit opt-in
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**重要运行时规则**

- 默认情况下，Trusted-proxy 认证会拒绝来自 loopback 源的请求（`127.0.0.1`、`::1`、loopback CIDR）。
- 同主机 loopback 反向代理不会满足 trusted-proxy 认证，除非你明确设置 `gateway.auth.trustedProxy.allowLoopback = true`，并在 `gateway.trustedProxies` 中包含 loopback 地址。
- `allowLoopback` 会以与反向代理相同的程度信任 Gateway 网关主机上的本地进程。仅当 Gateway 网关仍被防火墙阻止直接远程访问，并且本地代理会剥离或覆盖客户端提供的身份标头时，才启用它。
- 不经过反向代理的内部 Gateway 网关客户端应使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，而不是 trusted-proxy 身份标头。
- 非 loopback 的 Control UI 部署仍需要显式配置 `gateway.controlUi.allowedOrigins`。
- **转发标头证据会覆盖用于本地直接回退的 loopback 本地性。** 如果请求从 loopback 到达，但携带 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 标头并指向非本地来源，该证据会使本地直接密码回退和设备身份门控失效。在 `allowLoopback: true` 时，trusted-proxy 认证仍可将该请求作为同主机代理请求接受，同时 `requiredHeaders` 和 `allowUsers` 仍继续适用。

</Warning>

### 配置参考

<ParamField path="gateway.trustedProxies" type="string[]" required>
  要信任的代理 IP 地址数组。来自其他 IP 的请求会被拒绝。
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  必须为 `"trusted-proxy"`。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  包含已认证用户身份的标头名称。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  请求必须存在的额外标头，存在后请求才会被信任。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  用户身份允许列表。为空表示允许所有已认证用户。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  对同主机 loopback 反向代理的显式启用支持。默认为 `false`。
</ParamField>

<Warning>
只有当本地反向代理是预期的信任边界时，才启用 `allowLoopback`。任何可以连接到 Gateway 网关的本地进程都可以尝试发送代理身份标头，因此请将直接 Gateway 网关访问限制为主机私有，并要求使用代理拥有的标头，例如 `x-forwarded-proto`，或在你的代理支持时使用签名断言标头。
</Warning>

## TLS 终止与 HSTS

使用一个 TLS 终止点，并在那里应用 HSTS。

<Tabs>
  <Tab title="Proxy TLS termination (recommended)">
    当你的反向代理为 `https://control.example.com` 处理 HTTPS 时，请在代理上为该域设置 `Strict-Transport-Security`。

    - 适合面向互联网的部署。
    - 将证书和 HTTP 加固策略保留在一个位置。
    - OpenClaw 可以在代理后继续使用 loopback HTTP。

    示例标头值：

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS termination">
    如果 OpenClaw 本身直接提供 HTTPS（没有终止 TLS 的代理），请设置：

    ```json5
    {
      gateway: {
        tls: { enabled: true },
        http: {
          securityHeaders: {
            strictTransportSecurity: "max-age=31536000; includeSubDomains",
          },
        },
      },
    }
    ```

    `strictTransportSecurity` 接受字符串标头值，或使用 `false` 显式禁用。

  </Tab>
</Tabs>

### 推出指南

- 验证流量时，先从较短的最大期限开始（例如 `max-age=300`）。
- 只有在信心较高后，才增加到长期值（例如 `max-age=31536000`）。
- 只有当每个子域都已准备好使用 HTTPS 时，才添加 `includeSubDomains`。
- 只有当你有意为完整域集合满足 preload 要求时，才使用 preload。
- 仅限 loopback 的本地开发不会从 HSTS 中受益。

## 代理设置示例

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium 通过 `x-pomerium-claim-email`（或其他声明标头）传递身份，并通过 `x-pomerium-jwt-assertion` 传递 JWT。

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium's IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-pomerium-claim-email",
            requiredHeaders: ["x-pomerium-jwt-assertion"],
          },
        },
      },
    }
    ```

    Pomerium 配置片段：

    ```yaml
    routes:
      - from: https://openclaw.example.com
        to: http://openclaw-gateway:18789
        policy:
          - allow:
              or:
                - email:
                    is: nick@example.com
        pass_identity_headers: true
    ```

  </Accordion>
  <Accordion title="Caddy with OAuth">
    带有 `caddy-security` 插件的 Caddy 可以对用户进行身份验证并传递身份标头。

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    Caddyfile 片段：

    ```
    openclaw.example.com {
        authenticate with oauth2_provider
        authorize with policy1

        reverse_proxy openclaw:18789 {
            header_up X-Forwarded-User {http.auth.user.email}
        }
    }
    ```

  </Accordion>
  <Accordion title="nginx + oauth2-proxy">
    oauth2-proxy 会对用户进行身份验证，并通过 `x-auth-request-email` 传递身份。

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-auth-request-email",
          },
        },
      },
    }
    ```

    nginx 配置片段：

    ```nginx
    location / {
        auth_request /oauth2/auth;
        auth_request_set $user $upstream_http_x_auth_request_email;

        proxy_pass http://openclaw:18789;
        proxy_set_header X-Auth-Request-Email $user;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    ```

  </Accordion>
  <Accordion title="Traefik with forward auth">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik container IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## 混合令牌配置

OpenClaw 会拒绝同时启用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）和 `trusted-proxy` 模式的歧义配置。混合令牌配置可能导致 loopback 请求在错误的认证路径上被静默认证。

如果你在启动时看到 `mixed_trusted_proxy_token` 错误：

- 使用 trusted-proxy 模式时移除共享令牌，或
- 如果你打算使用基于令牌的认证，请将 `gateway.auth.mode` 切换为 `"token"`。

Loopback trusted-proxy 身份标头仍会失败关闭：同主机调用方不会被静默认证为代理用户。绕过代理的内部 OpenClaw 调用方可改用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 进行认证。在 trusted-proxy 模式下，令牌回退仍被有意不支持。

## 操作员作用域标头

Trusted-proxy 认证是一种**携带身份**的 HTTP 模式，因此调用方可以选择使用 `x-openclaw-scopes` 声明操作员作用域。

示例：

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

行为：

- 当标头存在时，OpenClaw 会遵循声明的作用域集合。
- 当标头存在但为空时，请求声明**没有**操作员作用域。
- 当标头不存在时，普通的携带身份 HTTP API 会回退到标准操作员默认作用域集合。
- Gateway 网关认证的**插件 HTTP 路由**默认范围更窄：当 `x-openclaw-scopes` 不存在时，其运行时作用域会回退到 `operator.write`。
- 即使 trusted-proxy 认证成功，来自浏览器来源的 HTTP 请求仍必须通过 `gateway.controlUi.allowedOrigins`（或有意启用的 Host 标头回退模式）。

实用规则：当你希望 trusted-proxy 请求比默认值更窄，或当 Gateway 网关认证的插件路由需要比写入作用域更强的权限时，请显式发送 `x-openclaw-scopes`。

## 安全检查清单

启用受信代理认证前，请确认：

- [ ] **代理是唯一访问路径**：除你的代理之外，Gateway 网关端口已对所有其他来源加防火墙。
- [ ] **trustedProxies 保持最小化**：只包含你的实际代理 IP，而不是整个子网。
- [ ] **回环代理来源是有意配置的**：除非为同主机代理显式启用 `gateway.auth.trustedProxy.allowLoopback`，否则受信代理认证会对回环来源请求默认拒绝。
- [ ] **代理会剥离标头**：你的代理会覆盖（而不是追加）来自客户端的 `x-forwarded-*` 标头。
- [ ] **TLS 终止**：你的代理处理 TLS；用户通过 HTTPS 连接。
- [ ] **allowedOrigins 已显式设置**：非回环 Control UI 使用显式的 `gateway.controlUi.allowedOrigins`。
- [ ] **allowUsers 已设置**（推荐）：限制为已知用户，而不是允许任何已认证用户。
- [ ] **没有混用令牌配置**：不要同时设置 `gateway.auth.token` 和 `gateway.auth.mode: "trusted-proxy"`。
- [ ] **本地密码回退保持私有**：如果你为内部直连调用方配置 `gateway.auth.password`，请保持 Gateway 网关端口受防火墙保护，使非代理远程客户端无法直接访问它。

## 安全审计

`openclaw security audit` 会将受信代理认证标记为**严重**级别发现。这是有意设计的，用于提醒你：你正在把安全性交给你的代理设置。

审计会检查：

- 基础 `gateway.trusted_proxy_auth` 警告/严重提醒
- 缺少 `trustedProxies` 配置
- 缺少 `userHeader` 配置
- `allowUsers` 为空（允许任何已认证用户）
- 为同主机代理来源启用了 `allowLoopback`
- 暴露的 Control UI 表面使用通配符或缺少浏览器来源策略

## 故障排除

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    请求并非来自 `gateway.trustedProxies` 中的 IP。请检查：

    - 代理 IP 是否正确？（Docker 容器 IP 可能会变化。）
    - 你的代理前面是否有负载均衡器？
    - 使用 `docker inspect` 或 `kubectl get pods -o wide` 查找实际 IP。

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw 拒绝了一个回环来源的受信代理请求。

    检查：

    - 代理是否从 `127.0.0.1` / `::1` 连接？
    - 你是否在尝试将受信代理认证与同主机回环反向代理一起使用？

    修复：

    - 对于不经过代理的内部同主机客户端，优先使用令牌/密码认证，或
    - 通过非回环的受信代理地址路由，并将该 IP 保持在 `gateway.trustedProxies` 中，或
    - 对于有意配置的同主机反向代理，设置 `gateway.auth.trustedProxy.allowLoopback = true`，将回环地址保留在 `gateway.trustedProxies` 中，并确保代理会剥离或覆盖身份标头。

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    用户标头为空或缺失。请检查：

    - 你的代理是否配置为传递身份标头？
    - 标头名称是否正确？（不区分大小写，但拼写很重要）
    - 用户是否确实已在代理处认证？

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    必需标头不存在。请检查：

    - 你的代理中这些特定标头的配置。
    - 标头是否在链路中的某处被剥离。

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    用户已认证，但不在 `allowUsers` 中。请添加该用户，或移除允许列表。
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    受信代理认证成功，但浏览器 `Origin` 标头未通过 Control UI 来源检查。

    检查：

    - `gateway.controlUi.allowedOrigins` 包含精确的浏览器来源。
    - 除非你有意需要允许所有行为，否则不要依赖通配符来源。
    - 如果你有意使用 Host 标头回退模式，已明确设置 `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`。

  </Accordion>
  <Accordion title="WebSocket 仍然失败">
    确保你的代理：

    - 支持 WebSocket 升级（`Upgrade: websocket`、`Connection: upgrade`）。
    - 在 WebSocket 升级请求中传递身份标头（不只是 HTTP）。
    - 没有为 WebSocket 连接使用单独的认证路径。

  </Accordion>
</AccordionGroup>

## 从令牌认证迁移

如果你正在从令牌认证迁移到受信代理：

<Steps>
  <Step title="配置代理">
    配置你的代理来认证用户并传递标头。
  </Step>
  <Step title="独立测试代理">
    独立测试代理设置（使用带标头的 curl）。
  </Step>
  <Step title="更新 OpenClaw 配置">
    使用受信代理认证更新 OpenClaw 配置。
  </Step>
  <Step title="重启 Gateway 网关">
    重启 Gateway 网关。
  </Step>
  <Step title="测试 WebSocket">
    从 Control UI 测试 WebSocket 连接。
  </Step>
  <Step title="审计">
    运行 `openclaw security audit` 并查看发现。
  </Step>
</Steps>

## 相关内容

- [配置](/zh-CN/gateway/configuration) — 配置参考
- [远程访问](/zh-CN/gateway/remote) — 其他远程访问模式
- [安全](/zh-CN/gateway/security) — 完整安全指南
- [Tailscale](/zh-CN/gateway/tailscale) — 仅 tailnet 访问的更简单替代方案
