---
read_when:
    - 在身份感知代理后运行 OpenClaw
    - 在 OpenClaw 前面使用 OAuth 设置 Pomerium、Caddy 或 nginx
    - 修复反向代理设置中的 WebSocket 1008 未授权错误
    - 决定在哪里设置 HSTS 和其他 HTTP 强化标头
sidebarTitle: Trusted proxy auth
summary: 将 Gateway 网关身份验证委托给受信任的反向代理（Pomerium、Caddy、nginx + OAuth）
title: 受信任代理身份验证
x-i18n:
    generated_at: "2026-04-26T08:13:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64e0f4dee942aedec548135f0408e7773e7b498f8262af13a4d0eff262cae646
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

<Warning>
**安全敏感功能。** 此模式会将身份验证完全委托给你的反向代理。配置错误可能会让未经授权的访问暴露你的 Gateway 网关。启用前请仔细阅读本页。
</Warning>

## 何时使用

在以下情况下使用 `trusted-proxy` 身份验证模式：

- 你在**身份感知代理**后运行 OpenClaw（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）。
- 你的代理处理所有身份验证，并通过标头传递用户身份。
- 你处于 Kubernetes 或容器环境中，并且代理是访问 Gateway 网关的唯一入口。
- 你遇到了 WebSocket `1008 unauthorized` 错误，因为浏览器无法在 WS 负载中传递令牌。

## 何时**不要**使用

- 如果你的代理不验证用户身份（只是 TLS 终止器或负载均衡器）。
- 如果存在任何绕过代理直接访问 Gateway 网关的路径（防火墙漏洞、内部网络访问）。
- 如果你不确定你的代理是否会正确剥离/覆盖转发标头。
- 如果你只需要个人单用户访问（可考虑使用 Tailscale Serve + loopback，以获得更简单的设置）。

## 工作原理

<Steps>
  <Step title="代理验证用户身份">
    你的反向代理会验证用户身份（OAuth、OIDC、SAML 等）。
  </Step>
  <Step title="代理添加身份标头">
    代理会添加一个包含已验证用户身份的标头（例如 `x-forwarded-user: nick@example.com`）。
  </Step>
  <Step title="Gateway 网关验证受信任来源">
    OpenClaw 会检查请求是否来自**受信任的代理 IP**（在 `gateway.trustedProxies` 中配置）。
  </Step>
  <Step title="Gateway 网关提取身份">
    OpenClaw 会从已配置的标头中提取用户身份。
  </Step>
  <Step title="授权">
    如果一切检查通过，则请求会被授权。
  </Step>
</Steps>

## Control UI 配对行为

当 `gateway.auth.mode = "trusted-proxy"` 处于启用状态，且请求通过了受信任代理检查时，Control UI WebSocket 会话可以在没有设备配对身份的情况下连接。

影响：

- 在此模式下，配对不再是 Control UI 访问的主要门槛。
- 你的反向代理身份验证策略和 `allowUsers` 将成为实际的访问控制。
- 让 Gateway 网关入口仅对受信任代理 IP 开放（`gateway.trustedProxies` + 防火墙）。

## 配置

```json5
{
  gateway: {
    // 受信任代理身份验证要求请求来自非 loopback 的受信任代理来源
    bind: "lan",

    // 关键：这里只添加你的代理 IP
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // 包含已验证用户身份的标头（必需）
        userHeader: "x-forwarded-user",

        // 可选：必须存在的标头（代理验证）
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // 可选：限制为特定用户（空 = 允许所有用户）
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

<Warning>
**重要运行时规则**

- 受信任代理身份验证会拒绝来自 loopback 源的请求（`127.0.0.1`、`::1`、loopback CIDR）。
- 同主机 loopback 反向代理**不**满足受信任代理身份验证要求。
- 对于同主机 loopback 代理设置，请改用令牌/密码身份验证，或通过 OpenClaw 可以验证的非 loopback 受信任代理地址进行路由。
- 非 loopback 的 Control UI 部署仍需要显式设置 `gateway.controlUi.allowedOrigins`。
- **转发标头证据会覆盖 loopback 本地性。** 如果请求到达于 loopback，但携带的 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 标头指向非本地来源，那么这些证据会使 loopback 本地性声明失效。该请求会被视为远程请求，用于配对、受信任代理身份验证以及 Control UI 设备身份门控。这可防止同主机 loopback 代理将转发标头身份“洗白”进受信任代理身份验证。
  </Warning>

### 配置参考

<ParamField path="gateway.trustedProxies" type="string[]" required>
  要信任的代理 IP 地址数组。来自其他 IP 的请求会被拒绝。
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  必须为 `"trusted-proxy"`。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  包含已验证用户身份的标头名称。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  请求要被信任时必须存在的附加标头。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  用户身份允许列表。为空表示允许所有已验证用户。
</ParamField>

## TLS 终止与 HSTS

使用一个 TLS 终止点，并在那里应用 HSTS。

<Tabs>
  <Tab title="代理 TLS 终止（推荐）">
    当你的反向代理为 `https://control.example.com` 处理 HTTPS 时，请在该域名的代理处设置 `Strict-Transport-Security`。

    - 非常适合面向互联网的部署。
    - 将证书和 HTTP 强化策略集中在同一处。
    - OpenClaw 可以在代理后继续使用 loopback HTTP。

    标头值示例：

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway 网关 TLS 终止">
    如果 OpenClaw 本身直接提供 HTTPS 服务（没有执行 TLS 终止的代理），请设置：

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

    `strictTransportSecurity` 接受字符串类型的标头值，或使用 `false` 来显式禁用。

  </Tab>
</Tabs>

### 发布指导

- 开始时先使用较短的 max age（例如 `max-age=300`）来验证流量。
- 只有在确信无误后，再增加到长期值（例如 `max-age=31536000`）。
- 仅当每个子域都已准备好支持 HTTPS 时，才添加 `includeSubDomains`。
- 仅当你有意满足整个域名集合的 preload 要求时，才使用 preload。
- 仅限 loopback 的本地开发不会从 HSTS 中获益。

## 代理设置示例

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium 通过 `x-pomerium-claim-email`（或其他声明标头）传递身份，并通过 `x-pomerium-jwt-assertion` 传递 JWT。

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium 的 IP
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
  <Accordion title="带 OAuth 的 Caddy">
    带有 `caddy-security` 插件的 Caddy 可以验证用户身份并传递身份标头。

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar 代理 IP
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
    oauth2-proxy 会验证用户身份，并通过 `x-auth-request-email` 传递身份。

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
  <Accordion title="带 forward auth 的 Traefik">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik 容器 IP
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

当 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）与 `trusted-proxy` 模式同时启用时，OpenClaw 会拒绝这种有歧义的配置。混合令牌配置可能导致 loopback 请求在错误的身份验证路径上被静默验证通过。

如果你在启动时看到 `mixed_trusted_proxy_token` 错误：

- 在使用 trusted-proxy 模式时移除共享令牌，或者
- 如果你打算使用基于令牌的身份验证，请将 `gateway.auth.mode` 切换为 `"token"`。

loopback 的受信任代理身份验证也会以失败关闭方式处理：同主机调用方必须通过受信任代理提供已配置的身份标头，而不是被静默验证通过。

## Operator scopes 标头

受信任代理身份验证是一种**携带身份信息的** HTTP 模式，因此调用方可以选择通过 `x-openclaw-scopes` 声明 operator scope。

示例：

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

行为：

- 当该标头存在时，OpenClaw 会采用所声明的 scope 集合。
- 当该标头存在但为空时，请求声明的是**无** operator scope。
- 当该标头缺失时，普通的携带身份信息 HTTP API 会回退到标准的 operator 默认 scope 集合。
- Gateway 网关身份验证的**插件 HTTP 路由**默认更窄：当 `x-openclaw-scopes` 缺失时，其运行时 scope 会回退到 `operator.write`。
- 来自浏览器源的 HTTP 请求即使在受信任代理身份验证成功后，仍然必须通过 `gateway.controlUi.allowedOrigins`（或有意启用的 Host 标头回退模式）。

实用规则：当你希望某个受信任代理请求比默认值更窄，或者某个 Gateway 网关身份验证插件路由需要比写入 scope 更强的权限时，请显式发送 `x-openclaw-scopes`。

## 安全检查清单

启用受信任代理身份验证前，请确认：

- [ ] **代理是唯一入口**：Gateway 网关端口已通过防火墙限制，除你的代理外其他来源均无法访问。
- [ ] **trustedProxies 最小化**：只包含你实际使用的代理 IP，而不是整个子网。
- [ ] **没有 loopback 代理来源**：对于来自 loopback 源的请求，受信任代理身份验证会以失败关闭方式处理。
- [ ] **代理会剥离标头**：你的代理会覆盖（而不是追加）来自客户端的 `x-forwarded-*` 标头。
- [ ] **TLS 终止**：你的代理处理 TLS；用户通过 HTTPS 连接。
- [ ] **allowedOrigins 已显式设置**：非 loopback 的 Control UI 使用显式的 `gateway.controlUi.allowedOrigins`。
- [ ] **已设置 allowUsers**（推荐）：限制为已知用户，而不是允许任何已验证用户。
- [ ] **没有混合令牌配置**：不要同时设置 `gateway.auth.token` 和 `gateway.auth.mode: "trusted-proxy"`。

## 安全审计

`openclaw security audit` 会将受信任代理身份验证标记为**严重**级别发现。这是有意为之——它是在提醒你：你正在将安全性委托给你的代理配置。

审计会检查：

- 基础 `gateway.trusted_proxy_auth` 警告/严重提醒
- 缺少 `trustedProxies` 配置
- 缺少 `userHeader` 配置
- `allowUsers` 为空（允许任何已验证用户）
- 在暴露的 Control UI 表面上，浏览器来源策略为通配符或缺失

## 故障排除

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    请求并非来自 `gateway.trustedProxies` 中的 IP。请检查：

    - 代理 IP 是否正确？（Docker 容器 IP 可能会变化。）
    - 你的代理前面是否还有负载均衡器？
    - 使用 `docker inspect` 或 `kubectl get pods -o wide` 查找实际 IP。

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw 拒绝了来自 loopback 源的 trusted-proxy 请求。

    请检查：

    - 代理是否从 `127.0.0.1` / `::1` 发起连接？
    - 你是否正在尝试将 trusted-proxy 身份验证用于同主机 loopback 反向代理？

    修复方法：

    - 对同主机 loopback 代理设置使用令牌/密码身份验证，或者
    - 通过非 loopback 的受信任代理地址进行路由，并将该 IP 保留在 `gateway.trustedProxies` 中。

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    用户标头为空或缺失。请检查：

    - 你的代理是否已配置为传递身份标头？
    - 标头名称是否正确？（大小写不敏感，但拼写很重要）
    - 用户是否确实已在代理处完成身份验证？

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    某个必需标头不存在。请检查：

    - 你的代理中针对这些特定标头的配置。
    - 标头是否在链路中的某处被剥离。

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    用户已通过身份验证，但不在 `allowUsers` 中。请将其加入，或移除允许列表。
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    trusted-proxy 身份验证已成功，但浏览器的 `Origin` 标头未通过 Control UI 来源检查。

    请检查：

    - `gateway.controlUi.allowedOrigins` 是否包含精确的浏览器来源。
    - 你是否没有依赖通配符来源，除非你确实想要允许所有来源的行为。
    - 如果你有意使用 Host 标头回退模式，是否已明确设置 `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`。

  </Accordion>
  <Accordion title="WebSocket 仍然失败">
    请确保你的代理：

    - 支持 WebSocket 升级（`Upgrade: websocket`、`Connection: upgrade`）。
    - 在 WebSocket 升级请求中传递身份标头（而不只是 HTTP）。
    - 没有为 WebSocket 连接设置单独的身份验证路径。

  </Accordion>
</AccordionGroup>

## 从令牌身份验证迁移

如果你正在从令牌身份验证迁移到 trusted-proxy：

<Steps>
  <Step title="配置代理">
    配置你的代理来验证用户身份并传递标头。
  </Step>
  <Step title="独立测试代理">
    独立测试代理设置（使用带标头的 curl）。
  </Step>
  <Step title="更新 OpenClaw 配置">
    使用 trusted-proxy 身份验证更新 OpenClaw 配置。
  </Step>
  <Step title="重启 Gateway 网关">
    重启 Gateway 网关。
  </Step>
  <Step title="测试 WebSocket">
    从 Control UI 测试 WebSocket 连接。
  </Step>
  <Step title="审计">
    运行 `openclaw security audit` 并查看发现项。
  </Step>
</Steps>

## 相关内容

- [配置](/zh-CN/gateway/configuration) — 配置参考
- [远程访问](/zh-CN/gateway/remote) — 其他远程访问模式
- [安全](/zh-CN/gateway/security) — 完整安全指南
- [Tailscale](/zh-CN/gateway/tailscale) — 仅限 tailnet 访问的更简单替代方案
