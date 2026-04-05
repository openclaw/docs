---
read_when:
    - 在身份感知代理后运行 OpenClaw
    - 在 OpenClaw 前设置 Pomerium、Caddy 或 nginx + OAuth
    - 修复反向代理设置中的 WebSocket 1008 unauthorized 错误
    - 决定在哪里设置 HSTS 和其他 HTTP 加固头
summary: 将 gateway 认证委托给受信任的反向代理（Pomerium、Caddy、nginx + OAuth）
title: 受信任代理认证
x-i18n:
    generated_at: "2026-04-05T08:25:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccd39736b43e8744de31566d5597b3fbf40ecb6ba9c8ba9d2343e1ab9bb8cd45
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# 受信任代理认证

> ⚠️ **安全敏感功能。** 此模式会将认证完全委托给你的反向代理。错误配置可能会让你的 Gateway 网关暴露给未授权访问。在启用前请仔细阅读本页。

## 何时使用

在以下情况下使用 `trusted-proxy` 认证模式：

- 你在**身份感知代理**之后运行 OpenClaw（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）
- 你的代理负责全部认证，并通过头部传递用户身份
- 你处于 Kubernetes 或容器环境中，并且代理是访问 Gateway 网关的唯一入口
- 你遇到了 WebSocket `1008 unauthorized` 错误，因为浏览器无法在 WS 负载中传递 token

## 何时不要使用

- 如果你的代理不对用户进行认证（只是 TLS 终止器或负载均衡器）
- 如果存在任何绕过代理直接访问 Gateway 网关的路径（防火墙漏洞、内部网络访问）
- 如果你不确定你的代理是否会正确移除/覆盖转发头
- 如果你只需要个人单用户访问（更简单的设置可考虑 Tailscale Serve + loopback）

## 工作原理

1. 你的反向代理对用户进行认证（OAuth、OIDC、SAML 等）
2. 代理添加一个包含已认证用户身份的头部（例如 `x-forwarded-user: nick@example.com`）
3. OpenClaw 检查请求是否来自**受信任代理 IP**（在 `gateway.trustedProxies` 中配置）
4. OpenClaw 从已配置的头部中提取用户身份
5. 如果一切检查通过，则授权该请求

## 控制 UI 配对行为

当 `gateway.auth.mode = "trusted-proxy"` 处于激活状态，并且请求通过了
受信任代理检查时，控制 UI WebSocket 会话可以在没有设备
配对身份的情况下连接。

影响：

- 在这种模式下，配对不再是控制 UI 访问的主要门槛。
- 你的反向代理认证策略和 `allowUsers` 会成为实际的访问控制。
- 保持 gateway 入口仅对受信任代理 IP 开放（`gateway.trustedProxies` + 防火墙）。

## 配置

```json5
{
  gateway: {
    // trusted-proxy 认证要求请求来自非 loopback 的受信任代理源
    bind: "lan",

    // 关键：这里只添加你的代理 IP
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // 包含已认证用户身份的头部（必填）
        userHeader: "x-forwarded-user",

        // 可选：必须存在的头部（用于验证代理）
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // 可选：限制为特定用户（空 = 允许所有用户）
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

重要运行时规则：

- 受信任代理认证会拒绝来自 loopback 源的请求（`127.0.0.1`、`::1`、loopback CIDR）。
- 同主机 loopback 反向代理**不满足**受信任代理认证。
- 对于同主机 loopback 代理设置，请改用 token/password 认证，或者通过 OpenClaw 可验证的非 loopback 受信任代理地址进行路由。
- 非 loopback 的控制 UI 部署仍然需要显式设置 `gateway.controlUi.allowedOrigins`。

### 配置参考

| 字段                                       | 必填 | 说明                                                                 |
| ------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | 是      | 受信任的代理 IP 地址数组。来自其他 IP 的请求会被拒绝。 |
| `gateway.auth.mode`                         | 是      | 必须为 `"trusted-proxy"`                                                   |
| `gateway.auth.trustedProxy.userHeader`      | 是      | 包含已认证用户身份的头部名称                      |
| `gateway.auth.trustedProxy.requiredHeaders` | 否       | 请求要被信任时必须存在的附加头部       |
| `gateway.auth.trustedProxy.allowUsers`      | 否       | 用户身份 allowlist。空表示允许所有已认证用户。    |

## TLS 终止与 HSTS

使用一个 TLS 终止点，并在那里应用 HSTS。

### 推荐模式：代理 TLS 终止

当你的反向代理为 `https://control.example.com` 处理 HTTPS 时，
请在代理上为该域设置 `Strict-Transport-Security`。

- 非常适合面向互联网的部署。
- 能把证书和 HTTP 加固策略集中在一个位置。
- OpenClaw 可以在代理之后继续使用 loopback HTTP。

示例头部值：

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Gateway 网关 TLS 终止

如果 OpenClaw 本身直接提供 HTTPS（没有进行 TLS 终止的代理），请设置：

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

`strictTransportSecurity` 接受字符串类型的头部值，或显式设置为 `false` 以禁用。

### 发布指导

- 在验证流量时，先使用较短的 max age（例如 `max-age=300`）。
- 只有在确认无误后，再增加到长期值（例如 `max-age=31536000`）。
- 只有在每个子域都已准备好 HTTPS 时，才添加 `includeSubDomains`。
- 只有在你明确满足整个域名集合的 preload 要求时，才使用 preload。
- 仅限 loopback 的本地开发不会从 HSTS 中受益。

## 代理设置示例

### Pomerium

Pomerium 通过 `x-pomerium-claim-email`（或其他声明头）传递身份，并通过 `x-pomerium-jwt-assertion` 传递 JWT。

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

### 使用 OAuth 的 Caddy

带有 `caddy-security` 插件的 Caddy 可以对用户进行认证并传递身份头。

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

### nginx + oauth2-proxy

oauth2-proxy 对用户进行认证，并在 `x-auth-request-email` 中传递身份。

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

### 使用 Forward Auth 的 Traefik

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

## 混合 token 配置

当 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）与 `trusted-proxy` 模式同时启用时，OpenClaw 会拒绝这种有歧义的配置。混合 token 配置可能导致 loopback 请求在错误的认证路径上被静默认证。

如果你在启动时看到 `mixed_trusted_proxy_token` 错误：

- 在使用 trusted-proxy 模式时移除共享 token，或
- 如果你打算使用基于 token 的认证，则将 `gateway.auth.mode` 切换为 `"token"`。

Loopback trusted-proxy 认证也会以关闭方式失败：同主机调用方必须通过受信任代理提供已配置的身份头，而不是被静默认证。

## Operator scopes 头部

Trusted-proxy 认证是一种**携带身份**的 HTTP 模式，因此调用方可以
选择通过 `x-openclaw-scopes` 声明 operator scopes。

示例：

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

行为：

- 当该头部存在时，OpenClaw 会遵循所声明的 scope 集合。
- 当该头部存在但为空时，请求声明**不具有**任何 operator scope。
- 当该头部不存在时，普通的携带身份 HTTP API 会回退到标准 operator 默认 scope 集合。
- Gateway 认证的**插件 HTTP 路由**默认更窄：当 `x-openclaw-scopes` 缺失时，它们的运行时 scope 会回退到 `operator.write`。
- 即使 trusted-proxy 认证成功，来自浏览器的 HTTP 请求仍必须通过 `gateway.controlUi.allowedOrigins`（或刻意启用的 Host 头回退模式）检查。

实用规则：

- 当你希望 trusted-proxy 请求
  比默认值更窄，或当 gateway-auth 插件路由需要
  比 write scope 更强的权限时，请显式发送 `x-openclaw-scopes`。

## 安全检查清单

在启用 trusted-proxy 认证之前，请确认：

- [ ] **代理是唯一入口**：Gateway 网关端口已通过防火墙限制，除你的代理外其他来源都无法访问
- [ ] **trustedProxies 足够精简**：只包含你的真实代理 IP，而不是整个子网
- [ ] **没有 loopback 代理源**：trusted-proxy 认证对来自 loopback 源的请求会以关闭方式失败
- [ ] **代理会移除头部**：你的代理会覆盖（而不是追加）客户端传来的 `x-forwarded-*` 头
- [ ] **TLS 终止**：你的代理负责 TLS；用户通过 HTTPS 连接
- [ ] **allowedOrigins 是显式的**：非 loopback 控制 UI 使用显式 `gateway.controlUi.allowedOrigins`
- [ ] **已设置 allowUsers**（推荐）：限制为已知用户，而不是允许任意已认证用户
- [ ] **没有混合 token 配置**：不要同时设置 `gateway.auth.token` 和 `gateway.auth.mode: "trusted-proxy"`

## 安全审计

`openclaw security audit` 会将 trusted-proxy 认证标记为**严重**级别的问题。这是有意为之——它是在提醒你：你正在将安全性委托给代理设置。

审计会检查：

- 基础 `gateway.trusted_proxy_auth` 警告/严重提醒
- 缺少 `trustedProxies` 配置
- 缺少 `userHeader` 配置
- 空的 `allowUsers`（允许任何已认证用户）
- 在暴露的控制 UI 界面上使用通配符或缺失的浏览器来源策略

## 故障排除

### “trusted_proxy_untrusted_source”

请求并非来自 `gateway.trustedProxies` 中的 IP。请检查：

- 代理 IP 是否正确？（Docker 容器 IP 可能会变化）
- 你的代理前面是否还有负载均衡器？
- 使用 `docker inspect` 或 `kubectl get pods -o wide` 查找真实 IP

### “trusted_proxy_loopback_source”

OpenClaw 拒绝了来自 loopback 源的 trusted-proxy 请求。

请检查：

- 代理是否从 `127.0.0.1` / `::1` 发起连接？
- 你是否试图在同主机 loopback 反向代理中使用 trusted-proxy 认证？

修复方法：

- 对同主机 loopback 代理设置使用 token/password 认证，或
- 通过非 loopback 的受信任代理地址进行路由，并将该 IP 保持在 `gateway.trustedProxies` 中。

### “trusted_proxy_user_missing”

用户头部为空或缺失。请检查：

- 你的代理是否已配置为传递身份头？
- 头部名称是否正确？（大小写不敏感，但拼写必须正确）
- 用户是否确实已经在代理处完成认证？

### “trusted*proxy_missing_header*\*”

缺少某个必需头部。请检查：

- 你的代理对这些特定头部的配置
- 这些头部是否在链路中的某处被移除了

### “trusted_proxy_user_not_allowed”

用户已认证，但不在 `allowUsers` 中。请将其加入，或移除 allowlist。

### “trusted_proxy_origin_not_allowed”

trusted-proxy 认证已成功，但浏览器 `Origin` 头未通过控制 UI 来源检查。

请检查：

- `gateway.controlUi.allowedOrigins` 是否包含精确的浏览器来源
- 除非你明确需要允许所有来源，否则不要依赖通配符来源
- 如果你有意使用 Host 头回退模式，请确认已明确设置 `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`

### WebSocket 仍然失败

请确保你的代理：

- 支持 WebSocket 升级（`Upgrade: websocket`、`Connection: upgrade`）
- 会在 WebSocket 升级请求中传递身份头（而不仅仅是普通 HTTP）
- 不会为 WebSocket 连接使用单独的认证路径

## 从 token 认证迁移

如果你要从 token 认证迁移到 trusted-proxy：

1. 配置你的代理以认证用户并传递头部
2. 独立测试代理设置（带头部的 curl）
3. 更新 OpenClaw 配置以启用 trusted-proxy 认证
4. 重启 Gateway 网关
5. 从控制 UI 测试 WebSocket 连接
6. 运行 `openclaw security audit` 并检查结果

## 相关内容

- [Security](/gateway/security) — 完整安全指南
- [Configuration](/gateway/configuration) — 配置参考
- [Remote access](/gateway/remote) — 其他远程访问模式
- [Tailscale](/gateway/tailscale) — 仅限 tailnet 访问时更简单的替代方案
