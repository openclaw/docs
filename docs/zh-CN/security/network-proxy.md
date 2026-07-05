---
read_when:
    - 你需要针对 SSRF 和 DNS 重绑定攻击的纵深防御
    - 为 OpenClaw 运行时流量配置外部正向代理
summary: 如何通过操作员管理的过滤代理路由 OpenClaw 运行时 HTTP 和 WebSocket 流量
title: 网络代理
x-i18n:
    generated_at: "2026-07-05T11:41:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd82684a17a79242891eca69c549c0bfcdd5bde40fa4e791dda7f2b62c473c89
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw 可以通过操作员管理的正向代理路由运行时 HTTP 和 WebSocket 流量。这是可选的纵深防御：集中出站控制、更强的 SSRF 保护，以及在网络边界上的目标可审计性。由于代理会在连接时、DNS 解析之后且即将打开上游连接之前评估目标，它还能缩小 DNS 重绑定攻击所依赖的间隙，即早先应用层 DNS 检查与实际出站连接之间的间隙。单一代理策略也让操作员可以在一个位置强制执行目标规则、网络分段、速率限制或出站允许列表，而无需重新构建 OpenClaw。

OpenClaw 不会随附、下载、启动、配置或认证代理。你运行适合自己环境的代理技术；OpenClaw 会通过它路由自己的 HTTP 和 WebSocket 客户端。

## 配置

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

你也可以通过环境设置 URL，同时在配置中保留 `proxy.enabled: true`：

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` 的优先级高于 `OPENCLAW_PROXY_URL`。如果 `proxy.enabled` 为 `true` 但无法解析出有效 URL，受保护的命令会启动失败，而不是回退到直接网络访问。

| 键                   | 类型                                 | 默认值         | 说明                                                                                                                                  |
| -------------------- | ------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.enabled`      | 布尔值                               | 未设置         | 必须为 `true` 才会启用路由。                                                                                                          |
| `proxy.proxyUrl`     | 字符串                               | 未设置         | `http://` 或 `https://` 正向代理 URL。嵌入 URL 的凭证会被视为敏感信息，并从快照/日志中脱敏。                                         |
| `proxy.tls.caFile`   | 字符串                               | 未设置         | 用于验证由私有 CA 签名的 `https://` 代理端点的 CA 包。                                                                                |
| `proxy.loopbackMode` | `gateway-only` \| `proxy` \| `block` | `gateway-only` | 控制回环绕过行为；见下文。                                                                                                            |

对于托管式 Gateway 网关服务，请将 URL 存储在配置中，让它在重新安装后仍然保留，而不是依赖前台环境变量：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

`OPENCLAW_PROXY_URL` 环境回退最适合前台运行。若要将它用于已安装的服务，请把它放入服务的持久环境（`$OPENCLAW_STATE_DIR/.env`，默认 `~/.openclaw/.env`），然后重新安装，使 launchd/systemd/Scheduled Tasks 能够读取它。

### 使用私有 CA 的 HTTPS 代理端点

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile` 会验证代理端点自身的 TLS 证书。它不是目标 MITM 信任设置、客户端证书，也不能替代代理的目标策略。只有在整个 Node 进程必须从启动时就信任额外 CA 时，才改用 `NODE_EXTRA_CA_CERTS`（例如，企业 TLS 检查系统会为每个 HTTPS 目标证书重新签名）——该变量是进程全局的，且必须在 Node 启动前设置，因此 OpenClaw 无法像应用 `proxy.tls.caFile` 那样在运行中应用它。对于 HTTPS 代理端点信任，优先使用 `proxy.tls.caFile`：它的作用范围限定在托管代理路由，而不是整个进程。

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## 路由如何工作

当 `proxy.enabled: true` 且 URL 有效时，受保护的运行时进程（`openclaw gateway run`、`openclaw node run`、`openclaw agent --local`）会通过代理路由普通 HTTP 和 WebSocket 出站流量：

```text
OpenClaw process
  fetch, node:http, node:https, WebSocket clients  -> operator proxy -> destination
```

在内部，OpenClaw 会将 [Proxyline](https://github.com/openclaw/proxyline) 安装为进程级路由运行时。它覆盖 `fetch`、基于 undici 的客户端、`node:http`/`node:https`、常见 WebSocket 客户端，以及由辅助工具创建的 `CONNECT` 隧道，并会替换调用方提供的 Node HTTP 代理，因此显式代理（包括 `axios`、`got`、`node-fetch` 以及类似的基于 Node 代理的客户端）无法静默绕过该代理。

代理 URL 协议描述的是从 OpenClaw 到代理的这一跳，而不是到最终目标的这一跳：

- `http://proxy.example:3128` — 到代理的普通 TCP；OpenClaw 发送 HTTP 代理请求，包括面向 HTTPS 目标的 `CONNECT`。
- `https://proxy.example:8443` — OpenClaw 向代理自身打开 TLS（验证代理证书），然后在该会话内发送 HTTP 代理请求。

目标 TLS 独立于代理端点 TLS：对于 HTTPS 目标，OpenClaw 始终会请求代理建立 `CONNECT` 隧道，并通过该隧道启动目标 TLS。

代理处于活动状态时，OpenClaw 会清除 `no_proxy`/`NO_PROXY`。这些绕过列表基于目标；如果其中保留 `localhost` 或 `127.0.0.1`，SSRF 目标就能完全跳过代理。关闭时，OpenClaw 会恢复先前的代理环境并重置缓存的路由状态。

某些插件拥有自定义传输，即使进程级路由处于活动状态，也需要自己的代理接线。Telegram 的 Bot API 客户端使用自己的 HTTP/1 undici 调度器，并单独遵循进程代理环境以及 `OPENCLAW_PROXY_URL` 回退。

### Gateway 网关回环模式

本地 Gateway 网关控制平面客户端通常连接到回环 WebSocket，例如 `ws://127.0.0.1:18789`。`proxy.loopbackMode` 控制该流量是否绕过托管代理：

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

| 模式                     | 行为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway-only`（默认）   | OpenClaw 将活动 Gateway 网关回环 authority 注册为直连例外，因此本地 Gateway 网关 WebSocket 流量不经过代理即可连接。自定义回环端口也可工作，因为该例外会指向精确配置的主机/端口。内置浏览器插件会针对由 OpenClaw 启动的托管浏览器的精确本地 CDP 就绪 URL 和 DevTools WebSocket URL 注册同类例外；内置 Ollama 记忆嵌入提供商则为其精确配置的主机本地回环嵌入来源提供范围更窄的受保护直连路径。 |
| `proxy`                  | 不注册回环例外；Gateway 网关和 Ollama 回环流量会经过代理。远程代理必须能够路由回 OpenClaw 主机的回环服务（例如通过可访问的主机名、IP 或隧道）——标准远程代理会相对于自身解析 `127.0.0.1`/`localhost`，而不是相对于 OpenClaw 主机。                                                                                                                                                                                                                                                               |
| `block`                  | OpenClaw 会在打开套接字前拒绝 Gateway 网关回环控制平面连接以及受保护的 Ollama 回环嵌入连接。                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

Gateway 网关控制平面绕过仅限于 `localhost` 和字面量回环 IP URL——请使用 `ws://127.0.0.1:18789`、`ws://[::1]:18789` 或 `ws://localhost:18789`。其他主机名会像普通流量一样路由。

### 容器

对于 `openclaw --container ...` 命令，如果设置了 `OPENCLAW_PROXY_URL`，OpenClaw 会将它转发给面向容器的子 CLI。该 URL 必须能从容器内部访问——那里的 `127.0.0.1` 指的是容器自身，而不是主机。OpenClaw 会拒绝面向容器命令使用回环代理 URL，除非你设置 `OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1` 以显式覆盖该检查。

## 相关代理术语

- `proxy.enabled` / `proxy.proxyUrl` — 用于运行时出站流量的出站正向代理路由。本页内容。
- `gateway.auth.mode: "trusted-proxy"` — 用于 Gateway 网关访问的入站身份感知反向代理认证。请参阅[可信代理认证](/zh-CN/gateway/trusted-proxy-auth)。
- `openclaw proxy` — 用于开发和支持的本地调试代理与捕获检查器。请参阅 [openclaw proxy](/zh-CN/cli/proxy)。
- `tools.web.fetch.useTrustedEnvProxy` — `web_fetch` 的可选启用项，允许由操作员控制的 HTTP(S) 环境代理解析 DNS，同时默认保留严格 DNS 固定和主机名策略。请参阅 [Web fetch](/zh-CN/tools/web-fetch#trusted-env-proxy)。
- 渠道或提供商特定的代理设置 — 针对单个传输的所有者特定覆盖。优先使用托管网络代理，以便跨运行时集中控制出站流量。

## 验证代理

代理的目标策略才是真正的安全边界；OpenClaw 无法验证你的代理是否阻止了正确的目标。请将其配置为：

- 仅绑定到回环或私有可信接口，并且只能由 OpenClaw 进程/主机/容器/服务账号访问。
- 自行解析目标，并在 DNS 解析之后、连接时按 IP 阻止目标，适用于普通 HTTP 和 HTTPS `CONNECT` 隧道。
- 拒绝基于目标的绕过，覆盖回环、私有、链路本地、元数据、多播、保留和文档用途地址范围。
- 除非你完全信任 DNS 解析路径，否则避免使用主机名允许列表。
- 记录目标、决策、状态和原因——绝不记录请求正文、授权标头、Cookie 或其他密钥。
- 将策略置于版本控制之下，并按安全敏感变更审查。

请从运行 OpenClaw 的同一主机/容器/服务账号进行验证：

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

使用私有 CA HTTPS 代理端点时：

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| 标志                     | 用途                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| `--proxy-url <url>`      | 验证此 URL，而不是解析配置/环境变量。                   |
| `--proxy-ca-file <path>` | HTTPS 代理端点的 CA 包。                               |
| `--allowed-url <url>`    | 预期会成功的目标地址（可重复）。                        |
| `--denied-url <url>`     | 预期会被阻止的目标地址（可重复）。                     |
| `--apns-reachable`       | 同时验证代理能否通过隧道发送直接的沙箱 APNs HTTP/2 探测。 |
| `--apns-authority <url>` | 覆盖通过 `--apns-reachable` 探测的 APNs authority。          |
| `--timeout-ms <ms>`      | 每个请求的超时时间。                                                 |
| `--json`                 | 机器可读输出。                                             |

如果 `proxy.enabled` 不是 `true`，并且未提供 `--proxy-url`，该命令会报告配置问题而不是执行验证；在更改配置前进行一次性预检时，请传入 `--proxy-url`。

如果没有 `--allowed-url`/`--denied-url`，默认检查为：`https://example.com/` 必须成功，并且代理不得访问临时 loopback 探针服务器，必须被阻止。loopback 检查会在传输失败时通过，或在收到不包含该探针每次运行令牌的非 2xx 响应时通过；如果收到缺少令牌的 2xx 响应（来自探针以外内容的意外成功），则失败，尤其是任何携带匹配令牌的响应都会失败，因为这证明代理实际转发了本应拒绝的 loopback 目标。自定义 `--denied-url` 目标没有这样的探针令牌，因此采用 fail-closed：任何 HTTP 响应都算作可达（失败），传输错误会报告为不确定，而不是已证明被阻止，因为 OpenClaw 无法确认是你的代理拒绝了可达源站，还是其他地方出了问题。`--apns-reachable` 会发送有意无效的 provider 令牌，因此 `403 InvalidProviderToken` 响应可作为隧道已到达 Apple 的证明。任何验证失败都会使该命令以 `1` 退出；代理 URL 凭证会在文本和 JSON 输出中都被遮蔽。

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
    { "kind": "allowed", "url": "https://example.com/", "ok": true, "status": 200 },
    { "kind": "apns", "url": "https://api.sandbox.push.apple.com", "ok": true, "status": 403 }
  ]
}
```

手动 `curl` 检查（公共请求应成功；loopback 和元数据请求应由代理自身阻止 — 仅凭 `curl` 无法像 `openclaw proxy validate` 内置探针那样区分代理拒绝和源站不可达）：

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

## 建议阻止的目标地址

适用于任何正向代理、防火墙或出口策略的起始拒绝列表。OpenClaw 自身的 SSRF 分类器位于 `src/infra/net/ssrf.ts` 和 `packages/net-policy/src/ip.ts`（`BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、RFC 2544 基准测试前缀，以及 NAT64/6to4/Teredo/ISATAP/IPv4-mapped 形式的嵌入式 IPv4 处理）— 这些是有用参考，但 OpenClaw 不会在你的外部代理中导出或强制执行这些规则。

| 范围或主机                                                                        | 阻止原因                                      |
| ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                     |
| `::1/128`                                                                            | IPv6 loopback                                     |
| `0.0.0.0/8`, `::/128`                                                                | 未指定 / 本网络地址              |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC 1918 私有网络                         |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local，包括常见云元数据路径 |
| `169.254.169.254`, `metadata.google.internal`                                        | 云元数据服务                           |
| `100.64.0.0/10`                                                                      | 运营商级 NAT 共享地址空间            |
| `198.18.0.0/15`, `2001:2::/48`                                                       | 基准测试范围                               |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | 特殊用途和文档范围              |
| `224.0.0.0/4`, `ff00::/8`                                                            | 多播                                         |
| `240.0.0.0/4`                                                                        | 保留 IPv4                                     |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 本地/私有范围                         |
| `100::/64`, `2001:20::/28`                                                           | IPv6 discard 和 ORCHIDv2 范围                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | 带嵌入式 IPv4 的 NAT64 前缀                 |
| `2002::/16`, `2001::/32`                                                             | 带嵌入式 IPv4 的 6to4 和 Teredo                |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatible 和 IPv4-mapped IPv6              |

添加你的云提供商或网络平台文档中列出的任何其他元数据主机或保留范围。

## 限制

| 表面                                                      | 托管代理状态                                                                                                                                     |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, 常见 WebSocket 客户端 | 配置后通过托管代理钩子路由。                                                                                                      |
| APNs 直接 HTTP/2                                           | 通过 APNs 托管 `CONNECT` helper 路由。                                                                                                        |
| Gateway 网关控制平面 local loopback                               | 仅对精确配置的 local loopback Gateway 网关 URL 直连。                                                                                         |
| 调试代理上游转发                              | 托管代理模式处于活动状态时禁用，除非为本地诊断显式启用。                                                             |
| IRC                                                          | 原始 TCP/TLS；不会由托管 HTTP 代理模式代理。如果你的部署要求所有出口流量都通过正向代理，请设置 `channels.irc.enabled: false`。 |
| 其他原始 `net`、`tls` 或 `http2` 客户端调用              | 在落地前必须由原始 socket guard 分类。                                                                                               |

- 这是针对 JavaScript HTTP/WebSocket 客户端的进程级覆盖，不是操作系统级网络沙箱。
- 原始 `net`、`tls`、`http2` socket、原生插件和非 OpenClaw 子进程可能绕过 Node 级路由，除非它们继承并遵守代理环境变量。Fork 出的 OpenClaw 子 CLI 会继承托管代理 URL 和 `proxy.loopbackMode` 状态。
- 用户本地 WebUI 和本地模型服务器不会被通用本地网络旁路覆盖 — 如有需要，请在操作员代理策略中将它们加入允许列表。例外是内置 Ollama 记忆嵌入 provider 的受保护直连路径，该路径限定为其已配置 `baseUrl` 中精确的主机本地 loopback 源站；LAN、tailnet、私有网络和公共 Ollama 主机仍使用托管代理。
- 托管代理模式处于活动状态时，本地调试代理的直接上游转发（用于代理请求和 `CONNECT` 隧道）默认禁用；仅为已批准的本地诊断启用。
- OpenClaw 不会检查、测试或认证你的代理策略。请将代理策略更改视为安全敏感的运维更改。
