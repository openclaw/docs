---
read_when:
    - 在身份感知代理后运行 OpenClaw
    - 在 OpenClaw 前面设置带有 OAuth 的 Pomerium、Caddy 或 nginx
    - 修复反向代理设置中的 WebSocket 1008 未授权错误
    - 决定在哪里设置 HSTS 和其他 HTTP 加固标头
sidebarTitle: Trusted proxy auth
summary: 将 Gateway 网关身份验证委托给受信任的反向代理（Pomerium、Caddy、nginx + OAuth）
title: 受信任的代理身份验证
x-i18n:
    generated_at: "2026-04-27T22:22:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 863a448f84d1bc5bf2a5a07a894bcc1bb7e724826ba9cec3fa135338af8dd3eb
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

<Warning>
**安全敏感功能。** 此模式会将身份验证完全委托给你的反向代理。配置错误可能会让你的 Gateway 网关暴露给未授权访问。在启用前请仔细阅读本页。
</Warning>

## 何时使用

在以下情况下使用 `trusted-proxy` 身份验证模式：

- 你在**身份感知代理**（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）后运行 OpenClaw。
- 你的代理处理所有身份验证，并通过标头传递用户身份。
- 你处于 Kubernetes 或容器环境中，并且该代理是访问 Gateway 网关的唯一路径。
- 你遇到了 WebSocket `1008 unauthorized` 错误，因为浏览器无法在 WS 负载中传递令牌。

## 何时不要使用

- 如果你的代理不验证用户身份（只是 TLS 终止器或负载均衡器）。
- 如果存在任何绕过代理直接访问 Gateway 网关的路径（防火墙漏洞、内部网络访问）。
- 如果你不确定你的代理是否正确剥离/覆盖转发标头。
- 如果你只需要个人单用户访问（可考虑使用 Tailscale Serve + loopback 以获得更简单的设置）。

## 工作原理

<Steps>
  <Step title="代理验证用户身份">
    你的反向代理验证用户身份（OAuth、OIDC、SAML 等）。
  </Step>
  <Step title="代理添加身份标头">
    代理添加一个包含已验证用户身份的标头（例如 `x-forwarded-user: nick@example.com`）。
  </Step>
  <Step title="Gateway 网关验证受信任来源">
    OpenClaw 检查请求是否来自**受信任的代理 IP**（在 `gateway.trustedProxies` 中配置）。
  </Step>
  <Step title="Gateway 网关提取身份">
    OpenClaw 从已配置的标头中提取用户身份。
  </Step>
  <Step title="授权">
    如果所有检查都通过，则请求会被授权。
  </Step>
</Steps>

## Control UI 配对行为

当 `gateway.auth.mode = "trusted-proxy"` 处于活动状态，且请求通过了 trusted-proxy 检查时，Control UI WebSocket 会话可以在没有设备配对身份的情况下连接。

影响：

- 在此模式下，配对不再是 Control UI 访问的主要门槛。
- 你的反向代理身份验证策略和 `allowUsers` 会成为实际的访问控制。
- 仅允许来自受信任代理 IP 的 Gateway 网关入口访问（`gateway.trustedProxies` + 防火墙）。

## 配置

```json5
{
  gateway: {
    // trusted-proxy 身份验证要求请求来自非 loopback 的受信任代理来源
    bind: "lan",

    // 关键：这里只添加你的代理 IP
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // 包含已验证用户身份的标头（必填）
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

- Trusted-proxy 身份验证会拒绝来自 loopback 源的请求（`127.0.0.1`、`::1`、loopback CIDR）。
- 同主机 loopback 反向代理**不满足** trusted-proxy 身份验证要求。
- 对于同主机 loopback 代理设置，请改用 token/password 身份验证，或通过 OpenClaw 可验证的非 loopback 受信任代理地址进行路由。
- 非 loopback 的 Control UI 部署仍然需要显式设置 `gateway.controlUi.allowedOrigins`。
- **转发标头证据会覆盖 loopback 本地性。** 如果请求到达于 loopback，但携带了指向非本地来源的 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 标头，则这些证据会使 loopback 本地性声明失效。该请求会被视为远程请求，用于配对、trusted-proxy 身份验证和 Control UI 设备身份门禁。这可防止同主机 loopback 代理将转发标头身份“洗白”后注入 trusted-proxy 身份验证。
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

## TLS 终止和 HSTS

使用单一 TLS 终止点，并在那里应用 HSTS。

<Tabs>
  <Tab title="代理 TLS 终止（推荐）">
    当你的反向代理为 `https://control.example.com` 处理 HTTPS 时，在该域名的代理上设置 `Strict-Transport-Security`。

    - 非常适合面向互联网的部署。
    - 将证书和 HTTP 加固策略集中在一个地方。
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

    `strictTransportSecurity` 接受一个字符串标头值，或用 `false` 显式禁用。

  </Tab>
</Tabs>

### 发布指导

- 开始时先使用较短的最大存活时间（例如 `max-age=300`）来验证流量。
- 仅在你有足够把握后，再增加到长期值（例如 `max-age=31536000`）。
- 只有在每个子域都已支持 HTTPS 时，才添加 `includeSubDomains`。
- 仅当你有意满足整个域名集合的 preload 要求时，才使用 preload。
- 仅限 loopback 的本地开发无法从 HSTS 中受益。

## 代理设置示例

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium 在 `x-pomerium-claim-email`（或其他 claim 标头）中传递身份，并在 `x-pomerium-jwt-assertion` 中传递 JWT。

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
    oauth2-proxy 验证用户身份，并在 `x-auth-request-email` 中传递身份。

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

## 混合 token 配置

当 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）与 `trusted-proxy` 模式同时启用时，OpenClaw 会拒绝这种存在歧义的配置。混合 token 配置可能会导致 loopback 请求在错误的身份验证路径上被静默验证。

如果你在启动时看到 `mixed_trusted_proxy_token` 错误：

- 在使用 trusted-proxy 模式时移除共享 token，或
- 如果你打算使用基于 token 的身份验证，则将 `gateway.auth.mode` 切换为 `"token"`。

Loopback trusted-proxy 身份标头仍会以失败关闭的方式处理：同主机调用方不会被静默认证为代理用户。绕过代理的 OpenClaw 内部调用方可以改用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 进行身份验证。在 trusted-proxy 模式中，仍然有意不支持 token 回退。

## Operator scopes 标头

Trusted-proxy 身份验证是一种**携带身份信息的** HTTP 模式，因此调用方可以选择使用 `x-openclaw-scopes` 声明 operator scopes。

示例：

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

行为：

- 当该标头存在时，OpenClaw 会采用声明的作用域集合。
- 当该标头存在但为空时，请求声明**没有** operator scopes。
- 当该标头不存在时，普通的身份承载型 HTTP API 会回退到标准的 operator 默认作用域集合。
- Gateway-auth **插件 HTTP 路由**默认更加收敛：当 `x-openclaw-scopes` 缺失时，其运行时作用域会回退到 `operator.write`。
- 来自浏览器源的 HTTP 请求即使已通过 trusted-proxy 身份验证，仍必须通过 `gateway.controlUi.allowedOrigins`（或刻意启用的 Host 标头回退模式）检查。

实践规则：当你希望 trusted-proxy 请求比默认值更收敛，或者 gateway-auth 插件路由需要比写作用域更强的权限时，请显式发送 `x-openclaw-scopes`。

## 安全检查清单

在启用 trusted-proxy 身份验证之前，请确认：

- [ ] **代理是唯一访问路径**：Gateway 网关端口已通过防火墙限制，只允许你的代理访问。
- [ ] **trustedProxies 保持最小化**：只填入你的实际代理 IP，而不是整个子网。
- [ ] **没有 loopback 代理来源**：trusted-proxy 身份验证会对来自 loopback 源的请求以失败关闭方式处理。
- [ ] **代理会剥离标头**：你的代理会覆盖（而不是附加）来自客户端的 `x-forwarded-*` 标头。
- [ ] **TLS 终止**：你的代理处理 TLS；用户通过 HTTPS 连接。
- [ ] **allowedOrigins 是显式的**：非 loopback 的 Control UI 使用显式的 `gateway.controlUi.allowedOrigins`。
- [ ] **已设置 allowUsers**（推荐）：限制为已知用户，而不是允许任何已验证用户。
- [ ] **没有混合 token 配置**：不要同时设置 `gateway.auth.token` 和 `gateway.auth.mode: "trusted-proxy"`。
- [ ] **本地密码回退保持私有**：如果你为内部直接调用方配置了 `gateway.auth.password`，请保持 Gateway 网关端口处于防火墙保护之下，这样非代理的远程客户端就无法直接访问它。

## 安全审计

`openclaw security audit` 会将 trusted-proxy 身份验证标记为**严重**级别的问题。这是有意设计的——它是在提醒你：你正在将安全性委托给你的代理设置。

审计会检查以下内容：

- 基础的 `gateway.trusted_proxy_auth` 警告/严重提醒
- 缺少 `trustedProxies` 配置
- 缺少 `userHeader` 配置
- 空的 `allowUsers`（允许任何已验证用户）
- 在暴露的 Control UI 表面上使用通配符或缺失的浏览器来源策略

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
    - 你是否正在尝试将 trusted-proxy 身份验证与同主机 loopback 反向代理一起使用？

    修复方法：

    - 对于同主机 loopback 代理设置，使用 token/password 身份验证，或
    - 通过非 loopback 的受信任代理地址进行路由，并将该 IP 保留在 `gateway.trustedProxies` 中。

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    用户标头为空或缺失。请检查：

    - 你的代理是否已配置为传递身份标头？
    - 标头名称是否正确？（不区分大小写，但拼写必须正确）
    - 用户是否确实已在代理处完成身份验证？

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    某个必需标头不存在。请检查：

    - 你的代理中针对这些特定标头的配置。
    - 标头是否在链路中的某个位置被剥离了。

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    用户已通过身份验证，但不在 `allowUsers` 中。请将其添加进去，或移除允许列表。
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    trusted-proxy 身份验证已成功，但浏览器的 `Origin` 标头未通过 Control UI 来源检查。

    请检查：

    - `gateway.controlUi.allowedOrigins` 是否包含精确的浏览器来源。
    - 除非你确实想允许所有来源，否则不要依赖通配符来源。
    - 如果你有意使用 Host 标头回退模式，请确认已明确设置 `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`。

  </Accordion>
  <Accordion title="WebSocket 仍然失败">
    确保你的代理：

    - 支持 WebSocket 升级（`Upgrade: websocket`、`Connection: upgrade`）。
    - 在 WebSocket 升级请求中也会传递身份标头（而不仅仅是 HTTP）。
    - 没有为 WebSocket 连接设置单独的身份验证路径。

  </Accordion>
</AccordionGroup>

## 从 token 身份验证迁移

如果你正从 token 身份验证迁移到 trusted-proxy：

<Steps>
  <Step title="配置代理">
    配置你的代理，使其验证用户身份并传递标头。
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
    测试来自 Control UI 的 WebSocket 连接。
  </Step>
  <Step title="审计">
    运行 `openclaw security audit` 并查看结果。
  </Step>
</Steps>

## 相关内容

- [配置](/zh-CN/gateway/configuration) — 配置参考
- [远程访问](/zh-CN/gateway/remote) — 其他远程访问模式
- [安全](/zh-CN/gateway/security) — 完整安全指南
- [Tailscale](/zh-CN/gateway/tailscale) — 仅 tailnet 访问的更简单替代方案
