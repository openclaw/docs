---
read_when:
    - 你希望针对 SSRF 和 DNS 重绑定攻击提供纵深防御
    - 为 OpenClaw 运行时流量配置外部正向代理
summary: 如何将 OpenClaw 运行时的 HTTP 和 WebSocket 流量经由操作方管理的过滤代理进行路由
title: 网络代理
x-i18n:
    generated_at: "2026-05-04T11:08:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedbf3bac14800c34c7ca2e3b6879dac360a88d51b5b7449ddf41a4dd471648b
    source_path: security/network-proxy.md
    workflow: 16
---

# 网络代理

OpenClaw 可以通过运维方管理的正向代理路由运行时 HTTP 和 WebSocket 流量。对于希望集中控制出口流量、加强 SSRF 防护并提升网络审计能力的部署来说，这是一种可选的纵深防御措施。

OpenClaw 不会附带、下载、启动、配置或认证代理。你运行适合自己环境的代理技术，OpenClaw 会通过它路由普通的进程本地 HTTP 和 WebSocket 客户端。

## 为什么使用代理？

代理为运维方提供一个用于出站 HTTP 和 WebSocket 流量的网络控制点。即使不考虑 SSRF 加固，这也很有用：

- 集中策略：维护一套出口策略，而不是依赖每个应用 HTTP 调用点都正确处理网络规则。
- 连接时检查：在 DNS 解析之后、代理打开上游连接之前立即评估目标地址。
- DNS 重新绑定防御：缩小应用级 DNS 检查与实际出站连接之间的空隙。
- 更广泛的 JavaScript 覆盖：将普通的 `fetch`、`node:http`、`node:https`、WebSocket、axios、got、node-fetch 以及类似客户端路由到同一路径。
- 可审计性：在出口边界记录允许和拒绝的目标。
- 运维控制：无需重新构建 OpenClaw，就能强制执行目标规则、网络分段、速率限制或出站允许列表。

代理路由是普通 HTTP 和 WebSocket 出口的进程级护栏。它为运维方提供了一条故障关闭路径，用于将受支持的 JavaScript HTTP 客户端路由到他们自己的过滤代理，但它不是操作系统级网络沙箱，也不会让 OpenClaw 认证代理的目标策略。

## OpenClaw 如何路由流量

当 `proxy.enabled=true` 且配置了代理 URL 时，受保护的运行时进程（例如 `openclaw gateway run`、`openclaw node run` 和 `openclaw agent --local`）会通过配置的代理路由普通 HTTP 和 WebSocket 出口：

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

公开契约是路由行为，而不是用于实现它的内部 Node 钩子。当 Gateway 网关 URL 使用 `localhost` 或字面量环回 IP（例如 `127.0.0.1` 或 `[::1]`）时，OpenClaw Gateway 网关控制平面 WebSocket 客户端会为 local loopback Gateway 网关 RPC 流量使用一条狭窄的直连路径。即使运维方代理阻止环回目标，该控制平面路径也必须能够访问环回 Gateway 网关。普通运行时 HTTP 和 WebSocket 请求仍会使用配置的代理。

在内部，OpenClaw 为此功能使用两个进程级路由钩子：

- Undici dispatcher 路由覆盖 `fetch`、基于 undici 的客户端，以及提供自身 undici dispatcher 的传输协议。
- `global-agent` 路由覆盖 Node 核心 `node:http` 和 `node:https` 调用方，包括许多构建在 `http.request`、`https.request`、`http.get` 和 `https.get` 之上的库。托管代理模式会强制使用该全局 agent，这样显式 Node HTTP agent 不会意外绕过运维方代理。

一些插件拥有自定义传输协议，即使存在进程级路由，也需要显式代理接线。例如，Telegram 的 Bot API 传输协议使用自己的 HTTP/1 undici dispatcher，因此会在该 owner 专用传输路径中遵循进程代理环境以及托管的 `OPENCLAW_PROXY_URL` 回退。

代理 URL 本身必须使用 `http://`。HTTPS 目标仍支持通过代理使用 HTTP `CONNECT`；这只表示 OpenClaw 期望一个普通 HTTP 正向代理监听器，例如 `http://127.0.0.1:3128`。

代理处于活动状态时，OpenClaw 会清除 `no_proxy`、`NO_PROXY` 和 `GLOBAL_AGENT_NO_PROXY`。这些绕过列表基于目标地址，因此如果将 `localhost` 或 `127.0.0.1` 留在那里，高风险 SSRF 目标就能跳过过滤代理。

关闭时，OpenClaw 会恢复之前的代理环境，并重置缓存的进程路由状态。

## 相关代理术语

- `proxy.enabled` / `proxy.proxyUrl`：OpenClaw 运行时出口的出站正向代理路由。本页介绍此功能。
- `gateway.auth.mode: "trusted-proxy"`：用于 Gateway 网关访问的入站身份感知反向代理认证。参见[可信代理认证](/zh-CN/gateway/trusted-proxy-auth)。
- `openclaw proxy`：用于开发和支持的本地调试代理和捕获检查器。参见 [openclaw proxy](/zh-CN/cli/proxy)。
- 渠道或提供商专用代理设置：特定传输协议的 owner 专用覆盖。当目标是在整个运行时集中控制出口流量时，优先使用托管网络代理。

## 配置

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

你也可以通过环境提供 URL，同时在配置中保持 `proxy.enabled=true`：

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` 优先于 `OPENCLAW_PROXY_URL`。

如果 `enabled=true` 但未配置有效的代理 URL，受保护命令会启动失败，而不是回退到直接网络访问。

对于使用 `openclaw gateway start` 启动的托管 Gateway 网关服务，建议将 URL 存储在配置中：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

环境回退最适合前台运行。如果你将它用于已安装的服务，请将 `OPENCLAW_PROXY_URL` 放入服务的持久环境中，例如 `$OPENCLAW_STATE_DIR/.env` 或 `~/.openclaw/.env`，然后重新安装服务，让 launchd、systemd 或 Scheduled Tasks 使用该值启动 Gateway 网关。

对于 `openclaw --container ...` 命令，当设置了 `OPENCLAW_PROXY_URL` 时，OpenClaw 会将它转发到面向容器的子 CLI。该 URL 必须能从容器内部访问；`127.0.0.1` 指的是容器自身，而不是主机。除非你显式覆盖该安全检查，否则 OpenClaw 会拒绝面向容器命令的环回代理 URL。

## 代理要求

代理策略是安全边界。OpenClaw 无法验证代理是否阻止了正确的目标。

请将代理配置为：

- 仅绑定到环回或可信的私有接口。
- 限制访问，使只有 OpenClaw 进程、主机、容器或服务账号可以使用它。
- 自行解析目标，并在 DNS 解析后阻止目标 IP。
- 对普通 HTTP 请求和 HTTPS `CONNECT` 隧道都在连接时应用策略。
- 拒绝针对环回、私有、链路本地、元数据、多播、保留或文档范围的基于目标的绕过。
- 除非你完全信任 DNS 解析路径，否则避免使用主机名允许列表。
- 记录目标、决策、状态和原因，但不要记录请求正文、授权标头、Cookie 或其他机密。
- 将代理策略置于版本控制之下，并像审查安全敏感配置一样审查更改。

## 建议阻止的目标

将此拒绝列表作为任何正向代理、防火墙或出口策略的起点。

OpenClaw 应用级分类器逻辑位于 `src/infra/net/ssrf.ts` 和 `src/shared/net/ip.ts`。相关的对等钩子包括 `BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、`RFC2544_BENCHMARK_PREFIX`，以及用于 NAT64、6to4、Teredo、ISATAP 和 IPv4 映射形式的嵌入式 IPv4 哨兵处理。这些文件在维护外部代理策略时是有用的参考，但 OpenClaw 不会自动导出这些规则或在你的代理中强制执行它们。

| 范围或主机                                                                        | 阻止原因                                             |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 环回                                        |
| `::1/128`                                                                            | IPv6 环回                                        |
| `0.0.0.0/8`, `::/128`                                                                | 未指定地址和本网络地址               |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 私有网络                             |
| `169.254.0.0/16`, `fe80::/10`                                                        | 链路本地地址和常见云元数据路径 |
| `169.254.169.254`, `metadata.google.internal`                                        | 云元数据服务                              |
| `100.64.0.0/10`                                                                      | 运营商级 NAT 共享地址空间               |
| `198.18.0.0/15`, `2001:2::/48`                                                       | 基准测试范围                                  |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | 特殊用途和文档范围                 |
| `224.0.0.0/4`, `ff00::/8`                                                            | 多播                                            |
| `240.0.0.0/4`                                                                        | 保留 IPv4                                        |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 本地/私有范围                            |
| `100::/64`, `2001:20::/28`                                                           | IPv6 丢弃和 ORCHIDv2 范围                     |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | 带嵌入式 IPv4 的 NAT64 前缀                    |
| `2002::/16`, `2001::/32`                                                             | 带嵌入式 IPv4 的 6to4 和 Teredo                   |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4 兼容和 IPv4 映射的 IPv6                 |

如果你的云提供商或网络平台记录了额外的元数据主机或保留范围，也请将它们加入。

## 验证

从运行 OpenClaw 的同一主机、容器或服务账号验证代理：

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

默认情况下，如果没有提供自定义目标，该命令会检查 `https://example.com/` 是否成功，并启动一个临时环回 canary，代理不得访问该 canary。当代理返回非 2xx 拒绝响应，或以传输失败阻止 canary 时，默认拒绝检查通过；如果成功响应到达 canary，则检查失败。如果未启用并配置代理，验证会报告配置问题；在更改配置前，可使用 `--proxy-url` 进行一次性预检。使用 `--allowed-url` 和 `--denied-url` 测试部署特定预期。添加 `--apns-reachable` 还可验证直接 APNs HTTP/2 递送是否能够通过代理打开 CONNECT 隧道并收到沙箱 APNs 响应；该探测使用故意无效的提供商令牌，因此预期结果为 `403 InvalidProviderToken`，并会计为可达。自定义拒绝目标采用故障关闭：任何 HTTP 响应都表示目标可通过代理访问，而任何传输错误都会报告为无法判定，因为 OpenClaw 无法证明代理阻止了一个可达来源。验证失败时，该命令以代码 1 退出。

使用 `--json` 进行自动化。JSON 输出包含总体结果、有效代理配置来源、任何配置错误，以及每个目标检查。代理 URL 凭据会在文本和 JSON 输出中被遮盖：

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

你也可以使用 `curl` 手动验证：

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

公共请求应成功。回环和元数据请求应被代理阻止。对于 `openclaw proxy validate`，内置回环探针可以区分代理拒绝和可达源站。自定义 `--denied-url` 检查没有该探针，因此除非你的代理公开了可单独验证的部署特定拒绝信号，否则应将 HTTP 响应和含糊的传输失败都视为验证失败。

然后启用 OpenClaw 代理路由：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

或设置：

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## 限制

- 该代理改善了进程本地 JavaScript HTTP 和 WebSocket 客户端的覆盖范围，但它不是 OS 级网络沙箱。
- 原始 `net`、`tls` 和 `http2` 套接字、原生插件以及子进程可能绕过 Node 级代理路由，除非它们继承并遵守代理环境变量。
- IRC 是一个原始 TCP/TLS 渠道，位于操作员管理的正向代理路由之外。在要求所有出站流量都经过该正向代理的部署中，除非已明确批准直接 IRC 出站流量，否则请设置 `channels.irc.enabled=false`。
- 本地调试代理是诊断工具；在托管代理模式处于活动状态时，默认禁用其对代理请求和 CONNECT 隧道的直接上游转发；仅为已批准的本地诊断启用直接转发。
- 需要时，应在操作员代理策略中允许用户本地 WebUI 和本地模型服务器；OpenClaw 不会为它们公开通用的本地网络绕过机制。
- Gateway 网关控制平面的代理绕过有意限制为 `localhost` 和字面量回环 IP URL。请使用 `ws://127.0.0.1:18789`、`ws://[::1]:18789` 或 `ws://localhost:18789` 进行本地直连 Gateway 网关控制平面连接；其他主机名会像普通基于主机名的流量一样路由。
- OpenClaw 不会检查、测试或认证你的代理策略。
- 将代理策略更改视为安全敏感的运维更改。
