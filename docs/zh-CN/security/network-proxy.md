---
read_when:
    - 你希望针对 SSRF 和 DNS 重新绑定攻击实现深度防御
    - 为 OpenClaw 运行时流量配置外部正向代理
summary: 如何通过由操作员管理的过滤代理路由 OpenClaw 运行时 HTTP 和 WebSocket 流量
title: 网络代理
x-i18n:
    generated_at: "2026-06-27T03:21:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3fc68d950037922ba3dc983c94a71bac3374750a02ef25f2c046cf782410be68
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw 可以通过操作员管理的正向代理路由运行时 HTTP 和 WebSocket 流量。对于希望集中控制出口流量、增强 SSRF 防护并提升网络可审计性的部署，这是可选的纵深防御措施。

OpenClaw 不会随附、下载、启动、配置或认证代理。你运行适合自身环境的代理技术，OpenClaw 会通过它路由普通的进程本地 HTTP 和 WebSocket 客户端。

## 为什么使用代理

代理为操作员提供一个用于出站 HTTP 和 WebSocket 流量的网络控制点。即使不考虑 SSRF 加固，这也很有用：

- 集中策略：维护一套出口策略，而不是依赖每个应用 HTTP 调用点都正确实现网络规则。
- 连接时检查：在 DNS 解析之后、代理打开上游连接之前立即评估目标。
- DNS 重绑定防御：缩小应用级 DNS 检查与实际出站连接之间的间隙。
- 更广的 JavaScript 覆盖范围：通过同一路径路由普通的 `fetch`、`node:http`、`node:https`、WebSocket、axios、got、node-fetch 以及类似客户端。
- 可审计性：在出口边界记录允许和拒绝的目标。
- 运维控制：无需重新构建 OpenClaw，即可强制执行目标规则、网络分段、速率限制或出站允许列表。

代理路由是普通 HTTP 和 WebSocket 出口流量的进程级护栏。它为操作员提供一种失败关闭路径，用于将受支持的 JavaScript HTTP 客户端通过自己的过滤代理路由，但它不是操作系统级网络沙箱，也不会让 OpenClaw 认证代理的目标策略。

## OpenClaw 如何路由流量

当 `proxy.enabled=true` 且已配置代理 URL 时，受保护的运行时进程（例如 `openclaw gateway run`、`openclaw node run` 和 `openclaw agent --local`）会通过配置的代理路由普通 HTTP 和 WebSocket 出口流量：

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

公共契约是路由行为，而不是用于实现它的内部 Node 钩子。当 Gateway 网关 URL 使用 `localhost` 或字面量环回 IP（例如 `127.0.0.1` 或 `[::1]`）时，OpenClaw Gateway 网关控制平面 WebSocket 客户端会为 local loopback Gateway 网关 RPC 流量使用狭窄的直连路径。即使操作员代理阻止环回目标，该控制平面路径也必须能够到达环回 Gateway 网关。普通运行时 HTTP 和 WebSocket 请求仍然使用配置的代理。

在内部，OpenClaw 会安装 Proxyline 作为此功能的进程级路由运行时。Proxyline 覆盖 `fetch`、基于 undici 的客户端、Node 核心 `node:http` / `node:https` 调用方、常见 WebSocket 客户端以及由辅助程序创建的 CONNECT 隧道。托管代理模式会替换调用方提供的 Node HTTP agent，因此显式 agent 不会意外绕过操作员代理。

一些插件拥有自定义传输，即使存在进程级路由，也需要显式代理接线。例如，Telegram 的 Bot API 传输使用自己的 HTTP/1 undici dispatcher，因此会在该所有者特定的传输路径中遵循进程代理环境以及托管的 `OPENCLAW_PROXY_URL` 回退。

代理 URL 本身可以使用 `http://` 或 `https://`。这些 scheme 描述的是从 OpenClaw 到代理端点的连接：

- `http://proxy.example:3128`：OpenClaw 打开到正向代理的普通 TCP 连接，并发送 HTTP 代理请求，包括面向 HTTPS 目标的 `CONNECT`。
- `https://proxy.example:8443`：OpenClaw 向代理端点打开 TLS，验证代理证书，然后在该 TLS 会话内发送 HTTP 代理请求。

目标 HTTPS 与代理端点 TLS 是分开的。对于 HTTPS 目标，OpenClaw 仍会要求代理提供 HTTP `CONNECT` 隧道，然后通过该隧道启动目标 TLS。

代理处于活动状态时，OpenClaw 会清除 `no_proxy` 和 `NO_PROXY`。这些绕过列表基于目标，因此如果其中保留 `localhost` 或 `127.0.0.1`，高风险 SSRF 目标就会跳过过滤代理。

关闭时，OpenClaw 会恢复之前的代理环境，并重置缓存的进程路由状态。

## 相关代理术语

- `proxy.enabled` / `proxy.proxyUrl`：用于 OpenClaw 运行时出口流量的出站正向代理路由。本文档说明该功能。
- `gateway.auth.mode: "trusted-proxy"`：用于 Gateway 网关访问的入站身份感知反向代理身份验证。参见 [Trusted proxy auth](/zh-CN/gateway/trusted-proxy-auth)。
- `openclaw proxy`：用于开发和支持的本地调试代理和捕获检查器。参见 [openclaw proxy](/zh-CN/cli/proxy)。
- `tools.web.fetch.useTrustedEnvProxy`：为 `web_fetch` 选择加入，让操作员控制的 HTTP(S) 环境代理解析 DNS，同时保留默认的严格 DNS 固定和主机名策略。参见 [Web fetch](/zh-CN/tools/web-fetch#trusted-env-proxy)。
- 渠道或提供商特定的代理设置：面向特定传输的所有者特定覆盖项。当目标是在整个运行时集中控制出口流量时，优先使用托管网络代理。

## 配置

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

对于使用私有代理 CA 的 HTTPS 代理端点：

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

你也可以通过环境提供 URL，同时在配置中保留 `proxy.enabled=true`：

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` 优先于 `OPENCLAW_PROXY_URL`。

### Gateway 网关环回模式

本地 Gateway 网关控制平面客户端通常连接到类似 `ws://127.0.0.1:18789` 的环回 WebSocket。使用 `proxy.loopbackMode` 选择托管代理处于活动状态时，环回托管代理例外的行为：

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only`（默认）：OpenClaw 会在 Proxyline 的托管绕过策略中注册 Gateway 网关环回 authority，使本地 Gateway 网关 WebSocket 流量可以直接连接。自定义环回 Gateway 网关端口也可工作，因为活动 Gateway 网关 URL 的主机和端口会被注册。内置浏览器插件还可以为 OpenClaw 启动的托管浏览器注册精确的本地 CDP 就绪端点和 DevTools WebSocket 端点，并且内置 Ollama 记忆嵌入提供商可以为精确配置的主机本地环回嵌入源使用自己更窄的受保护直连路径。
- `proxy`：OpenClaw 不注册 Gateway 网关或 Ollama 环回绕过，因此该环回流量会发送到托管代理。如果代理是远程的，它必须为 OpenClaw 主机的环回服务提供特殊路由，例如将其映射到代理可达的主机名、IP 或隧道。标准远程代理会从代理主机解析 `127.0.0.1` 和 `localhost`，而不是从 OpenClaw 主机解析。
- `block`：OpenClaw 会在打开 socket 之前拒绝 Gateway 网关环回控制平面连接，以及受保护的 Ollama 主机本地嵌入环回连接。

如果 `enabled=true` 但未配置有效的代理 URL，受保护命令会启动失败，而不是回退到直接网络访问。

对于使用 `openclaw gateway start` 启动的托管 Gateway 网关服务，建议将 URL 存储在配置中：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

环境回退最适合前台运行。如果你将它用于已安装的服务，请将 `OPENCLAW_PROXY_URL` 放入服务的持久环境中，例如 `$OPENCLAW_STATE_DIR/.env` 或 `~/.openclaw/.env`，然后重新安装服务，使 launchd、systemd 或 Scheduled Tasks 使用该值启动 Gateway 网关。

对于 `openclaw --container ...` 命令，设置 `OPENCLAW_PROXY_URL` 时，OpenClaw 会将其转发到面向容器的子 CLI。该 URL 必须能从容器内部访问；`127.0.0.1` 指的是容器本身，而不是宿主机。除非你显式覆盖该安全检查，否则 OpenClaw 会拒绝面向容器的命令使用环回代理 URL。

## 代理要求

代理策略是安全边界。OpenClaw 无法验证代理是否阻止了正确的目标。

请配置代理以：

- 仅绑定到环回接口或私有可信接口。
- 限制访问，使只有 OpenClaw 进程、主机、容器或服务账号可以使用它。
- 自行解析目标，并在 DNS 解析后阻止目标 IP。
- 对普通 HTTP 请求和 HTTPS `CONNECT` 隧道都在连接时应用策略。
- 拒绝针对环回、私有、链路本地、元数据、多播、保留或文档范围的基于目标的绕过。
- 避免使用主机名允许列表，除非你完全信任 DNS 解析路径。
- 记录目标、决策、状态和原因，但不记录请求正文、授权标头、cookie 或其他密钥。
- 将代理策略纳入版本控制，并像审查安全敏感配置一样审查变更。

## 推荐阻止的目标

将此拒绝列表作为任何正向代理、防火墙或出口策略的起点。

OpenClaw 应用级分类器逻辑位于 `src/infra/net/ssrf.ts` 和 `packages/net-policy/src/ip.ts`。相关的对等钩子是 `BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、`RFC2544_BENCHMARK_PREFIX`，以及针对 NAT64、6to4、Teredo、ISATAP 和 IPv4 映射形式的嵌入式 IPv4 sentinel 处理。维护外部代理策略时，这些文件是有用的参考，但 OpenClaw 不会自动导出这些规则，也不会在你的代理中强制执行它们。

| 范围或主机                                                                         | 阻止原因                                             |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 环回                                            |
| `::1/128`                                                                            | IPv6 环回                                            |
| `0.0.0.0/8`, `::/128`                                                                | 未指定地址和本网络地址                               |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 私有网络                                     |
| `169.254.0.0/16`, `fe80::/10`                                                        | 链路本地地址和常见云元数据路径                       |
| `169.254.169.254`, `metadata.google.internal`                                        | 云元数据服务                                         |
| `100.64.0.0/10`                                                                      | 运营商级 NAT 共享地址空间                            |
| `198.18.0.0/15`, `2001:2::/48`                                                       | 基准测试范围                                         |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | 特殊用途和文档范围                                   |
| `224.0.0.0/4`, `ff00::/8`                                                            | 多播                                                 |
| `240.0.0.0/4`                                                                        | 保留的 IPv4                                          |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 本地/私有范围                                   |
| `100::/64`, `2001:20::/28`                                                           | IPv6 丢弃和 ORCHIDv2 范围                            |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | 嵌入 IPv4 的 NAT64 前缀                              |
| `2002::/16`, `2001::/32`                                                             | 嵌入 IPv4 的 6to4 和 Teredo                          |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4 兼容和 IPv4 映射的 IPv6                         |

如果你的云提供商或网络平台记录了其他元数据主机或保留范围，也一并添加。

## 验证

从运行 OpenClaw 的同一主机、容器或服务账号验证代理：

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

对于由私有 CA 签名的 HTTPS 代理端点：

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

默认情况下，如果未提供自定义目标，该命令会检查 `https://example.com/` 是否成功，并启动一个临时环回金丝雀，代理不得访问它。当代理返回非 2xx 拒绝响应，或因传输失败而阻止金丝雀时，默认拒绝检查通过；如果成功响应到达金丝雀，则检查失败。如果未启用并配置代理，验证会报告配置问题；在更改配置前，可使用 `--proxy-url` 做一次性预检。使用 `--allowed-url` 和 `--denied-url` 测试部署特定预期。添加 `--apns-reachable` 还会验证直接 APNs HTTP/2 投递是否能通过代理打开 CONNECT 隧道并收到沙箱 APNs 响应；该探针使用刻意无效的提供商令牌，因此预期会收到 `403 InvalidProviderToken`，并计为可达。自定义拒绝目标采用故障关闭策略：任何 HTTP 响应都表示该目标可通过代理访问，任何传输错误都会报告为结论不确定，因为 OpenClaw 无法证明代理阻止了一个可达源站。验证失败时，该命令以代码 1 退出。

使用 `--json` 进行自动化。JSON 输出包含总体结果、有效代理配置来源、任何配置错误以及每个目标检查。代理 URL 凭据会在文本和 JSON 输出中被脱敏：

```json
{
  "ok": true,
  "config": {
    "enabled": true,
    "proxyUrl": "http://127.0.0.1:3128/",
    "source": "override",
    "errors": []
  },
  "checks": [
    {
      "kind": "allowed",
      "url": "https://example.com/",
      "ok": true,
      "status": 200
    },
    {
      "kind": "apns",
      "url": "https://api.sandbox.push.apple.com",
      "ok": true,
      "status": 403
    }
  ]
}
```

你也可以用 `curl` 手动验证：

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

公共请求应成功。环回和元数据请求应被代理阻止。对于 `openclaw proxy validate`，内置环回金丝雀可以区分代理拒绝和可达源站。自定义 `--denied-url` 检查没有该金丝雀，因此除非你的代理暴露了可单独验证的部署特定拒绝信号，否则应将 HTTP 响应和含糊的传输失败都视为验证失败。

## 代理 CA 信任

当代理端点本身使用由私有 CA 签名的证书时，使用托管的 `proxy.tls.caFile`：

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

该 CA 用于代理端点的 TLS 验证。它不是目标 MITM 信任设置、客户端证书，也不能替代代理的目标策略。

仅当整个 Node 进程必须从进程启动时就信任额外 CA 时，才使用 `NODE_EXTRA_CA_CERTS`，例如企业 TLS 检查系统会为进程中的每个 HTTPS 客户端重新签名目标证书。`NODE_EXTRA_CA_CERTS` 是进程全局的，且必须在 Node 启动前存在。对于 HTTPS 代理端点信任，优先使用 `proxy.tls.caFile`，因为它的作用域限定在托管代理路由中。

然后启用 OpenClaw 代理路由：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

或设置：

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

## 限制

- 代理提升了对进程本地 JavaScript HTTP 和 WebSocket 客户端的覆盖范围，但它不是操作系统级网络沙箱。
- Gateway 网关环回控制面流量默认通过 `proxy.loopbackMode: "gateway-only"` 直接本地旁路。OpenClaw 通过在 Proxyline 的托管旁路策略中注册活动 Gateway 网关环回权威来实现该旁路。运维人员可以设置 `proxy.loopbackMode: "proxy"`，将 Gateway 网关环回流量发送到托管代理；也可以设置 `proxy.loopbackMode: "block"`，拒绝环回 Gateway 网关连接。关于远程代理的注意事项，请参阅 [Gateway 网关环回模式](#gateway-loopback-mode)。
- 原始 `net`、`tls` 和 `http2` 套接字、原生插件以及非 OpenClaw 子进程可能会绕过 Node 级代理路由，除非它们继承并遵守代理环境变量。派生的 OpenClaw 子 CLI 会继承托管代理 URL 和 `proxy.loopbackMode` 状态。
- IRC 是位于运维人员管理的正向代理路由之外的原始 TCP/TLS 渠道。在要求所有出站流量都通过该正向代理的部署中，除非明确批准直接 IRC 出站，否则设置 `channels.irc.enabled=false`。
- 本地调试代理是诊断工具；当托管代理模式处于活动状态时，默认禁用它对代理请求和 CONNECT 隧道的直接上游转发；仅为获批的本地诊断启用直接转发。
- 用户本地 WebUI 和本地模型服务器在需要时应加入运维人员代理策略的允许列表；OpenClaw 不会为它们暴露通用本地网络旁路。内置 Ollama 记忆嵌入提供商的范围更窄：仅对从已配置 `baseUrl` 派生出的精确主机本地环回嵌入源站，它可以使用受保护的直接路径，从而在托管代理无法访问主机环回时保持主机本地嵌入可用。LAN、tailnet、私有网络和公共 Ollama 嵌入主机仍使用托管代理路径。`proxy.loopbackMode: "proxy"` 会将此 Ollama 环回流量发送到托管代理，`proxy.loopbackMode: "block"` 会在打开连接前拒绝它。
- Gateway 网关控制面代理旁路有意限制为 `localhost` 和字面量环回 IP URL。对于本地直接 Gateway 网关控制面连接，请使用 `ws://127.0.0.1:18789`、`ws://[::1]:18789` 或 `ws://localhost:18789`；其他主机名会像普通基于主机名的流量一样路由。
- OpenClaw 不会检查、测试或认证你的代理策略。
- 将代理策略变更视为安全敏感的运维变更。

| 表面                                                         | 托管代理状态                                                                                       |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, common WebSocket clients | 配置后通过托管代理钩子路由。                                                                       |
| APNs direct HTTP/2                                           | 通过 APNs 托管 CONNECT 辅助程序路由。                                                              |
| Gateway control-plane loopback                               | 仅对已配置的本地环回 Gateway 网关 URL 直连。                                                       |
| Debug proxy upstream forwarding                              | 托管代理模式处于活动状态时禁用，除非为本地诊断显式启用。                                           |
| IRC                                                          | 原始 TCP/TLS；不由托管 HTTP 代理模式代理。除非直接 IRC 出站已获批准，否则禁用。                    |
| Other raw `net`, `tls`, or `http2` client calls              | 合入前必须由原始套接字保护机制分类。                                                               |
