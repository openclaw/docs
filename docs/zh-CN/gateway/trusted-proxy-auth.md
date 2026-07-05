---
read_when:
    - 在身份感知代理后运行 OpenClaw
    - 在 OpenClaw 前设置带 OAuth 的 Pomerium、Caddy 或 nginx
    - 修复反向代理设置中的 WebSocket 1008 未授权错误
    - 决定在哪里设置 HSTS 和其他 HTTP 加固标头
sidebarTitle: Trusted proxy auth
summary: 将 Gateway 网关认证委托给受信任的反向代理（Pomerium、Caddy、nginx + OAuth）
title: 受信任代理身份验证
x-i18n:
    generated_at: "2026-07-05T11:22:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**安全敏感功能。** 此模式将身份验证完全委托给你的反向代理。配置错误可能会让你的 Gateway 网关暴露给未经授权的访问。启用前请仔细阅读本页。
</Warning>

## 何时使用

- 你在 **身份感知代理**（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）后运行 OpenClaw。
- 你的代理处理所有身份验证，并通过标头传递用户身份。
- 你处于 Kubernetes 或容器环境中，代理是通往 Gateway 网关的唯一路径。
- 你遇到 WebSocket `1008 unauthorized` 错误，因为浏览器无法在 WS 载荷中传递令牌。

## 何时不要使用

- 你的代理不验证用户身份（只是 TLS 终止器或负载均衡器）。
- 存在任何绕过代理通往 Gateway 网关的路径（防火墙漏洞、内部网络访问）。
- 你不确定代理是否正确剥离/覆盖转发标头。
- 你只需要个人单用户访问（请改为考虑 Tailscale Serve + loopback）。

## 工作原理

<Steps>
  <Step title="Proxy authenticates the user">
    你的反向代理对用户进行身份验证（OAuth、OIDC、SAML 等）。
  </Step>
  <Step title="Proxy adds an identity header">
    代理添加包含已验证用户身份的标头（例如 `x-forwarded-user: nick@example.com`）。
  </Step>
  <Step title="Gateway verifies trusted source">
    OpenClaw 检查请求是否来自 **受信任代理 IP**（`gateway.trustedProxies`），且不是 Gateway 网关自身的回环或本地接口地址。
  </Step>
  <Step title="Gateway extracts identity">
    OpenClaw 读取必需标头，然后从配置的标头中读取用户身份。
  </Step>
  <Step title="Authorize">
    如果所有检查都通过，并且用户通过 `allowUsers`（设置时），则请求获得授权。
  </Step>
</Steps>

## 配置

```json5
{
  gateway: {
    // Trusted-proxy auth expects the proxy's source IP to be non-loopback by default
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
**运行时规则，按评估顺序排列**

1. 请求的源 IP 必须匹配 `gateway.trustedProxies`（支持 CIDR），否则会被拒绝（`trusted_proxy_untrusted_source`）。
2. 除非 `gateway.auth.trustedProxy.allowLoopback = true` 且该回环地址也在 `trustedProxies` 中，否则会拒绝回环源请求（`127.0.0.1`、`::1`）（`trusted_proxy_loopback_source`）。此检查在标头检查之前运行，因此即使必需标头也缺失，回环源也会以这种方式失败。
3. 如果非回环源匹配 Gateway 网关主机自身的某个本地网络接口地址，则会作为防伪保护被拒绝（`trusted_proxy_local_interface_source`）。如果接口发现本身失败，请求也会被拒绝（`trusted_proxy_local_interface_check_failed`）。
4. `requiredHeaders` 和 `userHeader` 必须存在且非空白。
5. 如果 `allowUsers` 非空，则必须包含提取出的用户。

**转发标头证据会覆盖本地直连回退中的回环本地性。** 如果请求到达回环地址，但携带 `Forwarded`、任何 `X-Forwarded-*` 或 `X-Real-IP` 标头，该证据会使其不符合本地直连密码回退和设备身份门控条件，即使它仍会因回环而无法通过受信任代理身份验证。

`allowLoopback` 会以与反向代理相同的信任级别信任 Gateway 网关主机上的本地进程。仅当 Gateway 网关仍被防火墙隔离，无法直接远程访问，并且本地代理会剥离或覆盖客户端提供的身份标头时，才启用它。

不经过反向代理的内部 Gateway 网关客户端应使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，而不是受信任代理身份标头。非回环 Control UI 部署仍需要显式的 `gateway.controlUi.allowedOrigins`。
</Warning>

### 配置参考

<ParamField path="gateway.trustedProxies" type="string[]" required>
  要信任的代理 IP 地址（或 CIDR）数组。来自其他 IP 的请求会被拒绝。
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  必须是 `"trusted-proxy"`。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  包含已验证用户身份的标头名称。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  请求受信任时必须存在的额外标头。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  用户身份允许列表。为空表示允许所有已验证用户。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  对同主机回环反向代理的选择性启用支持。
</ParamField>

<Warning>
仅当本地反向代理是预期信任边界时，才启用 `allowLoopback`。任何能够连接到 Gateway 网关的本地进程都可以尝试发送代理身份标头，因此请将直接 Gateway 网关访问限制为主机私有，并要求代理拥有的标头，例如 `x-forwarded-proto`，或在你的代理支持时使用签名断言标头。
</Warning>

## Control UI 配对行为

当 `gateway.auth.mode = "trusted-proxy"` 处于活动状态且请求通过受信任代理检查时，Control UI WebSocket 会话可以在没有设备配对身份的情况下连接。

范围影响：

- 无设备的 Control UI WebSocket 会话可以连接，但默认不接收任何操作员权限范围。OpenClaw 会将请求的权限范围列表清空为 `[]`，因此未绑定到已批准配对设备/令牌的会话无法自行声明权限。
- 如果 WebSocket 连接成功后方法因 `missing scope` 失败，请使用 HTTPS，以便浏览器可以生成设备身份并完成配对。参见 [Control UI 非安全 HTTP](/zh-CN/web/control-ui#insecure-http)。
- 仅限紧急破窗场景：`gateway.controlUi.dangerouslyDisableDeviceAuth=true` 即使没有设备身份也会保留请求的权限范围。这是严重的安全降级；请尽快恢复。参见 [Control UI 非安全 HTTP](/zh-CN/web/control-ui#insecure-http)。

反向代理权限范围上限：如果你的代理在 Control UI WebSocket 升级请求上发送 `x-openclaw-scopes`，OpenClaw 会将会话权限范围限制为请求权限范围与声明权限范围的交集。此标头不会授予权限范围；它只会缩小会话可持有的范围。

影响：

- 在此模式下，配对不再是 Control UI 访问的主要关口。
- 你的反向代理身份验证策略和 `allowUsers` 会成为实际访问控制。
- 仅将 Gateway 网关入口锁定到受信任代理 IP（`gateway.trustedProxies` + 防火墙）。

自定义 WebSocket 客户端不是 Control UI 会话。`gateway.controlUi.dangerouslyDisableDeviceAuth` 不会向任意 `client.mode: "backend"` 或 CLI 形态的客户端授予权限范围。自定义自动化应使用设备身份/配对、保留的直接本地 `client.id: "gateway-client"` 后端辅助路径，或在 HTTP 请求/响应表面更适合时使用 [admin HTTP RPC 插件](/zh-CN/plugins/admin-http-rpc)。

## 操作员权限范围标头

受信任代理身份验证是一种 **携带身份** 的 HTTP 模式，因此调用方可以选择在 HTTP API 请求上用 `x-openclaw-scopes` 声明操作员权限范围。

注意：WebSocket 权限范围由 Gateway 网关协议握手和设备身份绑定决定。在 Control UI WebSocket 升级请求上，`x-openclaw-scopes` 只是协商会话权限范围的上限，而不是授予。参见 [Control UI 配对行为](#control-ui-pairing-behavior)。

示例：

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

行为：

- 当该标头存在时，OpenClaw 会遵循声明的权限范围集合。
- 当该标头存在但为空时，请求声明 **没有** 操作员权限范围。
- 当该标头不存在时，普通的携带身份 HTTP API 会回退到标准操作员默认权限范围集合（`operator.admin`、`operator.read`、`operator.write`、`operator.approvals`、`operator.pairing`、`operator.talk.secrets`）。
- Gateway 网关身份验证 **插件 HTTP 路由** 默认更窄：当 `x-openclaw-scopes` 不存在时，其运行时权限范围仅回退到 `operator.write`。
- 浏览器来源的 HTTP 请求即使在受信任代理身份验证成功后，仍必须通过 `gateway.controlUi.allowedOrigins`（或有意启用的 Host 标头回退模式）。

实用规则：当你希望受信任代理请求比默认值更窄，或当 Gateway 网关身份验证插件路由需要强于写入权限范围的权限时，请显式发送 `x-openclaw-scopes`。

## TLS 终止和 HSTS

使用一个 TLS 终止点，并在那里应用 HSTS。

<Tabs>
  <Tab title="Proxy TLS termination (recommended)">
    当你的反向代理为 `https://control.example.com` 处理 HTTPS 时，请在该域名的代理上设置 `Strict-Transport-Security`。

    - 适合面向互联网的部署。
    - 将证书和 HTTP 加固策略保持在一个位置。
    - OpenClaw 可以在代理后继续使用回环 HTTP。

    示例标头值：

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS termination">
    如果 OpenClaw 本身直接提供 HTTPS（没有 TLS 终止代理），请设置：

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

- 验证流量时，先从较短的最大有效期开始（例如 `max-age=300`）。
- 只有在信心很高后，才增加到长期值（例如 `max-age=31536000`）。
- 仅当每个子域都已准备好使用 HTTPS 时，才添加 `includeSubDomains`。
- 仅当你有意满足完整域名集合的 preload 要求时，才使用 preload。
- 仅回环的本地开发无法从 HSTS 获益。

## 代理设置示例

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium 在 `x-pomerium-claim-email`（或其他声明标头）中传递身份，并在 `x-pomerium-jwt-assertion` 中传递 JWT。

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
    带有 `caddy-security` 插件的 Caddy 可以验证用户身份并传递身份标头。

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

    ```caddy
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
    oauth2-proxy 会对用户进行身份验证，并在 `x-auth-request-email` 中传递身份信息。

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
  <Accordion title="Traefik 与转发认证">
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

如果同时配置了共享令牌（`gateway.auth.token` 或 `OPENCLAW_GATEWAY_TOKEN`），Gateway 网关启动会拒绝 trusted-proxy 认证。这两者互斥，因为共享令牌会让同一主机调用方通过一条完全不同于代理已验证身份的路径完成认证，而该模式本来就是为了强制使用代理验证的身份。

如果启动失败并出现类似 `gateway auth mode is trusted-proxy, but a shared token is also configured` 的错误：

- 使用 trusted-proxy 模式时移除共享令牌，或
- 如果你想使用基于令牌的认证，请将 `gateway.auth.mode` 切换为 `"token"`。

local loopback trusted-proxy 身份标头仍会失败关闭：同一主机调用方不会被静默认证为代理用户。绕过代理的内部 OpenClaw 调用方可以改用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 进行认证。在 trusted-proxy 模式下，令牌回退仍然有意不受支持。

## 安全检查清单

启用 trusted-proxy 认证之前，请确认：

- [ ] **代理是唯一路径**：Gateway 网关端口已通过防火墙限制为仅你的代理可访问。
- [ ] **trustedProxies 最小化**：只包含你的实际代理 IP，而不是整个子网。
- [ ] **local loopback 代理来源是有意配置的**：除非为同一主机代理显式启用 `gateway.auth.trustedProxy.allowLoopback`，否则 trusted-proxy 认证会对 local loopback 来源请求失败关闭。
- [ ] **代理会剥离标头**：你的代理会覆盖（而不是追加）来自客户端的 `x-forwarded-*` 标头。
- [ ] **TLS 终止**：你的代理处理 TLS；用户通过 HTTPS 连接。
- [ ] **allowedOrigins 显式配置**：非 local loopback 的 Control UI 使用显式的 `gateway.controlUi.allowedOrigins`。
- [ ] **allowUsers 已设置**（推荐）：限制为已知用户，而不是允许任何已认证用户。
- [ ] **没有混合令牌配置**：不要同时设置 `gateway.auth.token` 和 `gateway.auth.mode: "trusted-proxy"`。
- [ ] **本地密码回退是私有的**：如果你为内部直接调用方配置 `gateway.auth.password`，请保持 Gateway 网关端口受防火墙保护，避免非代理远程客户端直接访问它。

## 安全审计

`openclaw security audit` 会以 **critical** 严重级别标记 trusted-proxy 认证。这是有意设计的；它是在提醒你已将安全性委托给代理设置。

审计会检查：

- 基础 `gateway.trusted_proxy_auth` 警告/critical 提醒。
- 缺少 `trustedProxies` 配置。
- 缺少 `userHeader` 配置。
- 空的 `allowUsers`（允许任何已认证用户）。
- 为同一主机代理来源启用了 `allowLoopback`。

每当 Control UI 暴露时，还会应用单独的、非 trusted-proxy 专属的发现项：通配符或缺失的 `gateway.controlUi.allowedOrigins`，以及 Host 标头来源回退。

## 故障排查

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    请求不是来自 `gateway.trustedProxies` 中的 IP。请检查：

    - 代理 IP 是否正确？（Docker 容器 IP 可能会变化。）
    - 你的代理前面是否有负载均衡器？
    - 使用 `docker inspect` 或 `kubectl get pods -o wide` 查找实际 IP。

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw 拒绝了一个 local loopback 来源的 trusted-proxy 请求。

    检查：

    - 代理是否从 `127.0.0.1` / `::1` 连接？
    - 你是否正在尝试通过同一主机 local loopback 反向代理使用 trusted-proxy 认证？

    修复：

    - 对于不经过代理的内部同一主机客户端，优先使用令牌/密码认证，或
    - 通过非 local loopback 的可信代理地址路由，并将该 IP 保留在 `gateway.trustedProxies` 中，或
    - 对于有意配置的同一主机反向代理，设置 `gateway.auth.trustedProxy.allowLoopback = true`，将 local loopback 地址保留在 `gateway.trustedProxies` 中，并确保代理会剥离或覆盖身份标头。

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    请求的源 IP 匹配了 Gateway 网关主机自身的某个非 local loopback 网络接口地址（而不是代理），这是为了防止在 tailnet 或 Docker 桥接网络中伪造同一主机流量。`..._check_failed` 表示接口发现本身出错，因此 OpenClaw 会失败关闭。

    检查：

    - Gateway 网关主机本身是否有进程绕过代理直接发送身份标头？
    - 代理是否与 Gateway 网关运行在同一网络命名空间中，并且其 IP 也显示为本地接口？

    修复：通过一个未同时绑定到 Gateway 网关主机本地的地址路由代理流量，或仅对真正的同一主机代理设置使用 `allowLoopback`。

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    用户标头为空或缺失。请检查：

    - 你的代理是否已配置为传递身份标头？
    - 标头名称是否正确？（不区分大小写，但拼写很重要）
    - 用户是否已在代理处实际完成身份验证？

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    缺少必需标头。请检查：

    - 针对这些特定标头的代理配置。
    - 标头是否在链路中的某处被剥离。

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    用户已通过身份验证，但不在 `allowUsers` 中。请添加该用户，或移除允许列表。
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` 是 `"trusted-proxy"`，但 `gateway.trustedProxies` 为空，或 `gateway.auth.trustedProxy` 本身缺失。在两者都设置之前，所有请求都会被拒绝。
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Trusted-proxy 认证成功，但浏览器 `Origin` 标头未通过 Control UI 来源检查。

    检查：

    - `gateway.controlUi.allowedOrigins` 包含精确的浏览器来源。
    - 除非你有意允许全部来源，否则不要依赖通配符来源。
    - 如果你有意使用 Host 标头回退模式，请确认已刻意设置 `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`。

  </Accordion>
  <Accordion title="连接成功，但方法报告缺少权限范围">
    WebSocket 已连接，但 `chat.history`、`sessions.list` 或
    `models.list` 失败，并显示 `missing scope: operator.read`。

    常见原因：

    - 无设备的 Control UI 会话：trusted-proxy 认证可以在没有设备身份的情况下允许 WebSocket 连接，但 OpenClaw 会按设计清除无设备会话上的权限范围。
    - 自定义后端客户端：`gateway.controlUi.dangerouslyDisableDeviceAuth` 仅作用于 Control UI 范围，不会向任意后端或 CLI 形态的 WebSocket 客户端授予权限范围。
    - 过窄的 `x-openclaw-scopes`：如果你的代理在 Control UI WebSocket 升级请求中注入此标头，会话权限范围会被限制为该集合。空标头值会导致没有任何权限范围。

    修复：

    - 对于 Control UI，使用 HTTPS，以便浏览器可以生成设备身份并完成配对。
    - 对于自定义自动化，使用设备身份/配对、保留的直接本地 `gateway-client` 后端辅助路径，或 [admin HTTP RPC](/zh-CN/plugins/admin-http-rpc)。
    - 仅将 `gateway.controlUi.dangerouslyDisableDeviceAuth: true` 用作临时的 Control UI 应急通道。

  </Accordion>
  <Accordion title="WebSocket 仍然失败">
    确保你的代理：

    - 支持 WebSocket 升级（`Upgrade: websocket`、`Connection: upgrade`）。
    - 在 WebSocket 升级请求中传递身份标头（而不仅是 HTTP）。
    - 没有为 WebSocket 连接设置单独的认证路径。

  </Accordion>
</AccordionGroup>

## 从令牌认证迁移

<Steps>
  <Step title="配置代理">
    配置你的代理来验证用户并传递标头。
  </Step>
  <Step title="独立测试代理">
    独立测试代理设置（使用带标头的 curl）。
  </Step>
  <Step title="更新 OpenClaw 配置">
    使用 trusted-proxy 认证更新 OpenClaw 配置。
  </Step>
  <Step title="重启 Gateway 网关">
    重启 Gateway 网关。
  </Step>
  <Step title="测试 WebSocket">
    从 Control UI 测试 WebSocket 连接。
  </Step>
  <Step title="审计">
    运行 `openclaw security audit` 并检查发现项。
  </Step>
</Steps>

## 相关内容

- [配置](/zh-CN/gateway/configuration) — 配置参考
- [操作员权限范围](/zh-CN/gateway/operator-scopes) — 角色、权限范围和审批检查
- [远程访问](/zh-CN/gateway/remote) — 其他远程访问模式
- [安全](/zh-CN/gateway/security) — 完整安全指南
- [Tailscale](/zh-CN/gateway/tailscale) — 更简单的仅 tailnet 访问替代方案
