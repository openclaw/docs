---
read_when:
    - 在身份感知代理后运行 OpenClaw
    - 在 OpenClaw 前端设置带 OAuth 的 Pomerium、Caddy 或 nginx
    - 修复反向代理设置中的 WebSocket 1008 未授权错误
    - 确定在何处设置 HSTS 和其他 HTTP 安全加固标头
sidebarTitle: Trusted proxy auth
summary: 将 Gateway 网关身份验证委托给受信任的反向代理（Pomerium、Caddy、nginx + OAuth）
title: 受信任代理身份验证
x-i18n:
    generated_at: "2026-07-11T20:35:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**安全敏感功能。** 此模式将身份验证完全委托给你的反向代理。配置错误可能会使你的 Gateway 网关遭到未经授权的访问。启用前请仔细阅读本页。
</Warning>

## 适用场景

- 你在**身份感知代理**（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）后运行 OpenClaw。
- 你的代理处理所有身份验证，并通过请求头传递用户身份。
- 你处于 Kubernetes 或容器环境中，代理是访问 Gateway 网关的唯一路径。
- 由于浏览器无法在 WS 载荷中传递令牌，你遇到了 WebSocket `1008 unauthorized` 错误。

## 不适用场景

- 你的代理不对用户进行身份验证（仅作为 TLS 终止器或负载均衡器）。
- 存在任何绕过代理访问 Gateway 网关的路径（防火墙漏洞、内部网络访问）。
- 你不确定代理是否会正确移除或覆盖转发请求头。
- 你只需要个人单用户访问（可考虑改用 Tailscale Serve + 回环地址）。

## 工作原理

<Steps>
  <Step title="代理验证用户身份">
    你的反向代理对用户进行身份验证（OAuth、OIDC、SAML 等）。
  </Step>
  <Step title="代理添加身份请求头">
    代理添加包含已验证用户身份的请求头（例如 `x-forwarded-user: nick@example.com`）。
  </Step>
  <Step title="Gateway 网关验证可信来源">
    OpenClaw 检查请求是否来自**可信代理 IP**（`gateway.trustedProxies`），并确认它不是 Gateway 网关自身的回环地址或本地接口地址。
  </Step>
  <Step title="Gateway 网关提取身份">
    OpenClaw 先读取必需的请求头，再从配置的请求头中读取用户身份。
  </Step>
  <Step title="授权">
    如果所有检查均通过，并且用户通过了 `allowUsers` 检查（设置该项时），则授权该请求。
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
**运行时规则，按求值顺序排列**

1. 请求的源 IP 必须与 `gateway.trustedProxies` 匹配（支持 CIDR），否则会被拒绝（`trusted_proxy_untrusted_source`）。
2. 除非同时满足 `gateway.auth.trustedProxy.allowLoopback = true` 且该回环地址也位于 `trustedProxies` 中，否则将拒绝源自回环地址（`127.0.0.1`、`::1`）的请求（`trusted_proxy_loopback_source`）。此检查先于请求头检查执行，因此即使必需的请求头也缺失，回环来源仍会以此原因失败。
3. 如果非回环来源与 Gateway 网关主机自身的某个本地网络接口地址匹配，则会将其作为防欺骗保护措施拒绝（`trusted_proxy_local_interface_source`）。如果接口发现过程本身失败，也会拒绝该请求（`trusted_proxy_local_interface_check_failed`）。
4. `requiredHeaders` 和 `userHeader` 必须存在且不能是空白值。
5. 如果 `allowUsers` 非空，则其中必须包含提取出的用户。

**对于本地直接回退，转发请求头证据优先于回环地址的本地性。** 如果请求从回环地址到达，但携带 `Forwarded`、任意 `X-Forwarded-*` 或 `X-Real-IP` 请求头，这些证据会使其失去使用本地直接密码回退和设备身份门控的资格，即使该请求仍会因来自回环地址而无法通过可信代理身份验证。

`allowLoopback` 对 Gateway 网关主机上的本地进程给予与反向代理同等程度的信任。只有当 Gateway 网关仍通过防火墙阻止直接远程访问，并且本地代理会移除或覆盖客户端提供的身份请求头时，才应启用它。

不经过反向代理的 Gateway 网关内部客户端应使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，而不是可信代理身份请求头。非回环地址上的 Control UI 部署仍需显式配置 `gateway.controlUi.allowedOrigins`。
</Warning>

### 配置参考

<ParamField path="gateway.trustedProxies" type="string[]" required>
  要信任的代理 IP 地址（或 CIDR）数组。来自其他 IP 的请求将被拒绝。
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  必须为 `"trusted-proxy"`。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  包含已验证用户身份的请求头名称。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  要使请求被信任而必须存在的其他请求头。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  用户身份允许列表。留空表示允许所有已通过身份验证的用户。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  选择性启用对同一主机上回环反向代理的支持。
</ParamField>

<Warning>
仅当本地反向代理是预期的信任边界时，才启用 `allowLoopback`。任何能够连接 Gateway 网关的本地进程都可以尝试发送代理身份请求头，因此请将对 Gateway 网关的直接访问限制在主机内部，并要求提供由代理控制的请求头（如 `x-forwarded-proto`），或者在代理支持时要求提供签名断言请求头。
</Warning>

## Control UI 配对行为

当 `gateway.auth.mode = "trusted-proxy"` 处于启用状态且请求通过可信代理检查时，Control UI WebSocket 会话无需设备配对身份即可连接。

权限范围影响：

- 默认情况下，无设备的 Control UI WebSocket 会话可以连接，但不会获得任何操作员权限范围。OpenClaw 会将请求的权限范围列表清除为 `[]`，以防未绑定到已批准配对设备/令牌的会话自行声明权限。
- 如果 WebSocket 成功连接后，方法因 `missing scope` 而失败，请使用 HTTPS，以便浏览器生成设备身份并完成配对。请参阅 [Control UI 不安全 HTTP](/zh-CN/web/control-ui#insecure-http)。
- 仅限紧急情况下使用：即使没有设备身份，`gateway.controlUi.dangerouslyDisableDeviceAuth=true` 也会保留请求的权限范围。这会严重降低安全性；请尽快恢复原配置。请参阅 [Control UI 不安全 HTTP](/zh-CN/web/control-ui#insecure-http)。

反向代理权限范围上限：如果代理在 Control UI WebSocket 升级请求中发送 `x-openclaw-scopes`，OpenClaw 会将会话权限范围限制为请求权限范围与声明权限范围的交集。此请求头不会授予权限范围；它只会缩小会话可以持有的权限范围。

影响：

- 在此模式下，配对不再是访问 Control UI 的主要门控。
- 你的反向代理身份验证策略和 `allowUsers` 将成为实际的访问控制机制。
- 仅允许可信代理 IP 进入 Gateway 网关（`gateway.trustedProxies` + 防火墙）。

自定义 WebSocket 客户端不属于 Control UI 会话。`gateway.controlUi.dangerouslyDisableDeviceAuth` 不会向任意 `client.mode: "backend"` 客户端或采用 CLI 形式的客户端授予权限范围。自定义自动化应使用设备身份/配对、保留的本地直接 `client.id: "gateway-client"` 后端辅助路径；如果 HTTP 请求/响应接口更合适，也可以使用[管理 HTTP RPC 插件](/zh-CN/plugins/admin-http-rpc)。

## 操作员权限范围请求头

可信代理身份验证是一种**携带身份**的 HTTP 模式，因此调用方可以选择在 HTTP API 请求中通过 `x-openclaw-scopes` 声明操作员权限范围。

注意：WebSocket 权限范围由 Gateway 网关协议握手和设备身份绑定决定。在 Control UI WebSocket 升级请求中，`x-openclaw-scopes` 仅用于限制协商出的会话权限范围，而不会授予权限范围。请参阅 [Control UI 配对行为](#control-ui-pairing-behavior)。

示例：

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

行为：

- 如果存在此请求头，OpenClaw 会采用其中声明的权限范围集合。
- 如果存在此请求头但其值为空，则请求声明**不具有任何**操作员权限范围。
- 如果不存在此请求头，常规携带身份的 HTTP API 会回退到标准操作员默认权限范围集合（`operator.admin`、`operator.read`、`operator.write`、`operator.approvals`、`operator.pairing`、`operator.talk.secrets`）。
- 默认情况下，采用 Gateway 网关身份验证的**插件 HTTP 路由**权限范围更窄：如果不存在 `x-openclaw-scopes`，其运行时权限范围仅回退到 `operator.write`。
- 即使可信代理身份验证成功，来自浏览器源的 HTTP 请求仍必须通过 `gateway.controlUi.allowedOrigins` 检查（或有意启用的 Host 请求头回退模式）。

实用规则：如果你希望可信代理请求的权限范围小于默认值，或者采用 Gateway 网关身份验证的插件路由需要比写入权限范围更强的权限，请显式发送 `x-openclaw-scopes`。

## TLS 终止和 HSTS

使用单一 TLS 终止点，并在该处应用 HSTS。

<Tabs>
  <Tab title="代理 TLS 终止（推荐）">
    当反向代理为 `https://control.example.com` 处理 HTTPS 时，请在代理上为该域名设置 `Strict-Transport-Security`。

    - 适合面向互联网的部署。
    - 将证书和 HTTP 安全强化策略集中在一处。
    - OpenClaw 可以在代理后继续使用回环 HTTP。

    请求头值示例：

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway 网关 TLS 终止">
    如果 OpenClaw 自身直接提供 HTTPS（没有负责 TLS 终止的代理），请设置：

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

    `strictTransportSecurity` 接受字符串形式的请求头值，也可以设置为 `false` 以显式禁用。

  </Tab>
</Tabs>

### 上线指导

- 验证流量期间，请先从较短的最长有效期开始（例如 `max-age=300`）。
- 仅在充分确认无误后，才增加为长期值（例如 `max-age=31536000`）。
- 仅当每个子域名均已支持 HTTPS 时，才添加 `includeSubDomains`。
- 仅当你有意满足完整域名集合的预加载要求时，才使用预加载。
- 仅限回环地址的本地开发无法从 HSTS 中受益。

## 代理设置示例

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium 通过 `x-pomerium-claim-email`（或其他声明请求头）传递身份，并通过 `x-pomerium-jwt-assertion` 传递 JWT。

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
  <Accordion title="带 OAuth 的 Caddy">
    安装了 `caddy-security` 插件的 Caddy 可以验证用户身份并传递身份请求头。

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
    oauth2-proxy 对用户进行身份验证，并通过 `x-auth-request-email` 传递身份信息。

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

如果同时配置了共享令牌（`gateway.auth.token` 或 `OPENCLAW_GATEWAY_TOKEN`），Gateway 网关启动时会拒绝受信任代理身份验证。二者互斥，因为共享令牌会让同一主机上的调用方通过一条与此模式旨在强制执行的代理验证身份完全不同的路径进行身份验证。

如果启动失败，并显示类似 `gateway auth mode is trusted-proxy, but a shared token is also configured` 的错误：

- 使用受信任代理模式时移除共享令牌，或者
- 如果你打算使用基于令牌的身份验证，请将 `gateway.auth.mode` 切换为 `"token"`。

local loopback 的受信任代理身份标头仍会以关闭方式失败：同一主机上的调用方不会被静默认证为代理用户。绕过代理的 OpenClaw 内部调用方可以改用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 进行身份验证。在受信任代理模式下，令牌回退仍然有意不受支持。

## 安全检查清单

启用受信任代理身份验证前，请验证：

- [ ] **代理是唯一访问路径**：Gateway 网关端口通过防火墙阻止除代理之外的所有访问。
- [ ] **`trustedProxies` 保持最小范围**：只包含实际代理 IP，而不是整个子网。
- [ ] **local loopback 代理来源是有意配置的**：除非为同一主机上的代理显式启用 `gateway.auth.trustedProxy.allowLoopback`，否则受信任代理身份验证会拒绝来自 local loopback 来源的请求。
- [ ] **代理会清除标头**：代理会覆盖（而非追加）客户端提供的 `x-forwarded-*` 标头。
- [ ] **TLS 终止**：代理负责处理 TLS；用户通过 HTTPS 连接。
- [ ] **显式配置 `allowedOrigins`**：非 local loopback 的 Control UI 使用显式的 `gateway.controlUi.allowedOrigins`。
- [ ] **已设置 `allowUsers`**（推荐）：仅允许已知用户，而不是允许任何已通过身份验证的用户。
- [ ] **没有混合令牌配置**：不要同时设置 `gateway.auth.token` 和 `gateway.auth.mode: "trusted-proxy"`。
- [ ] **本地密码回退保持私密**：如果为内部直接调用方配置 `gateway.auth.password`，请通过防火墙保护 Gateway 网关端口，确保不经过代理的远程客户端无法直接访问它。

## 安全审计

`openclaw security audit` 会以**严重**级别标记受信任代理身份验证。这是有意设计的；它用于提醒你已将安全责任委托给代理配置。

审计会检查：

- 基础的 `gateway.trusted_proxy_auth` 警告/严重提醒。
- 缺少 `trustedProxies` 配置。
- 缺少 `userHeader` 配置。
- `allowUsers` 为空（允许任何已通过身份验证的用户）。
- 为同一主机上的代理来源启用了 `allowLoopback`。

只要公开了 Control UI，其他与受信任代理无关的检查项也同样适用：`gateway.controlUi.allowedOrigins` 使用通配符或未配置，以及基于 Host 标头的来源回退。

## 故障排查

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    请求并非来自 `gateway.trustedProxies` 中的 IP。请检查：

    - 代理 IP 是否正确？（Docker 容器 IP 可能发生变化。）
    - 代理前面是否还有负载均衡器？
    - 使用 `docker inspect` 或 `kubectl get pods -o wide` 查找实际 IP。

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw 拒绝了来自 local loopback 来源的受信任代理请求。

    请检查：

    - 代理是否通过 `127.0.0.1` / `::1` 连接？
    - 你是否尝试将受信任代理身份验证与同一主机上的 local loopback 反向代理结合使用？

    修复方法：

    - 对于不经过代理的同一主机内部客户端，优先使用令牌/密码身份验证，或者
    - 通过非 local loopback 的受信任代理地址进行路由，并将该 IP 保留在 `gateway.trustedProxies` 中，或者
    - 对于有意配置的同一主机反向代理，请设置 `gateway.auth.trustedProxy.allowLoopback = true`，将 local loopback 地址保留在 `gateway.trustedProxies` 中，并确保代理会清除或覆盖身份标头。

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    请求的来源 IP 与 Gateway 网关主机自身的某个非 local loopback 网络接口地址（而非代理）匹配。这是一项防护措施，用于防止尾网或 Docker 桥接网络中来自同一主机的流量伪造身份。`..._check_failed` 表示接口发现本身出错，因此 OpenClaw 会以关闭方式失败。

    请检查：

    - Gateway 网关主机本身是否有进程绕过代理，直接发送身份标头？
    - 代理是否与 Gateway 网关运行在同一网络命名空间中，并且其 IP 也显示为本地接口？

    修复方法：通过一个未同时绑定到 Gateway 网关主机本地的地址路由代理流量，或者仅在真正的同一主机代理配置中使用 `allowLoopback`。

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    用户标头为空或缺失。请检查：

    - 代理是否已配置为传递身份标头？
    - 标头名称是否正确？（不区分大小写，但拼写必须正确）
    - 用户是否确实已在代理处通过身份验证？

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    缺少必需的标头。请检查：

    - 代理中针对这些特定标头的配置。
    - 标头是否在链路中的某处被清除。

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    用户已通过身份验证，但不在 `allowUsers` 中。请将其添加到允许列表，或移除允许列表。
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` 为 `"trusted-proxy"`，但 `gateway.trustedProxies` 为空，或者缺少 `gateway.auth.trustedProxy` 本身。在二者均设置之前，所有请求都会被拒绝。
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    受信任代理身份验证已成功，但浏览器的 `Origin` 标头未通过 Control UI 来源检查。

    请检查：

    - `gateway.controlUi.allowedOrigins` 是否包含浏览器的确切来源。
    - 除非你有意允许所有来源，否则不要依赖通配符来源。
    - 如果你有意使用 Host 标头回退模式，请确保已明确设置 `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`。

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    WebSocket 连接成功，但 `chat.history`、`sessions.list` 或
    `models.list` 失败，并显示 `missing scope: operator.read`。

    常见原因：

    - 无设备身份的 Control UI 会话：受信任代理身份验证可以允许没有设备身份的 WebSocket 连接，但 OpenClaw 按设计会清除无设备身份会话的权限范围。
    - 自定义后端客户端：`gateway.controlUi.dangerouslyDisableDeviceAuth` 仅适用于 Control UI，不会向任意后端客户端或采用 CLI 形式的 WebSocket 客户端授予权限范围。
    - `x-openclaw-scopes` 范围过窄：如果代理在 Control UI 的 WebSocket 升级请求中注入此标头，会话权限范围将被限制为该集合。标头值为空时不会授予任何权限范围。

    修复方法：

    - 对于 Control UI，请使用 HTTPS，以便浏览器生成设备身份并完成配对。
    - 对于自定义自动化，请使用设备身份/配对、为直接本地连接保留的 `gateway-client` 后端辅助路径，或使用[管理员 HTTP RPC](/zh-CN/plugins/admin-http-rpc)。
    - 仅将 `gateway.controlUi.dangerouslyDisableDeviceAuth: true` 用作临时的 Control UI 紧急访问路径。

  </Accordion>
  <Accordion title="WebSocket still failing">
    确保代理：

    - 支持 WebSocket 升级（`Upgrade: websocket`、`Connection: upgrade`）。
    - 在 WebSocket 升级请求中传递身份标头（而不只是 HTTP 请求）。
    - 没有为 WebSocket 连接使用单独的身份验证路径。

  </Accordion>
</AccordionGroup>

## 从令牌身份验证迁移

<Steps>
  <Step title="Configure the proxy">
    配置代理以对用户进行身份验证并传递标头。
  </Step>
  <Step title="Test the proxy independently">
    独立测试代理配置（使用带标头的 curl）。
  </Step>
  <Step title="Update OpenClaw config">
    更新 OpenClaw 配置以使用受信任代理身份验证。
  </Step>
  <Step title="Restart the Gateway">
    重启 Gateway 网关。
  </Step>
  <Step title="Test WebSocket">
    从 Control UI 测试 WebSocket 连接。
  </Step>
  <Step title="Audit">
    运行 `openclaw security audit` 并审查检查结果。
  </Step>
</Steps>

## 相关内容

- [配置](/zh-CN/gateway/configuration) — 配置参考
- [操作员权限范围](/zh-CN/gateway/operator-scopes) — 角色、权限范围和审批检查
- [远程访问](/zh-CN/gateway/remote) — 其他远程访问模式
- [安全性](/zh-CN/gateway/security) — 完整的安全指南
- [Tailscale](/zh-CN/gateway/tailscale) — 仅限尾网访问时更简单的替代方案
