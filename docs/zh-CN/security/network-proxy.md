---
read_when:
    - 你希望通过纵深防御抵御 SSRF 和 DNS 重新绑定攻击
    - 为 OpenClaw 运行时流量配置外部正向代理
summary: 如何通过运维方管理的过滤代理路由 OpenClaw 运行时 HTTP 和 WebSocket 流量
title: 网络代理
x-i18n:
    generated_at: "2026-04-28T12:04:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 571e08a36c53dc7a6527d73860ecd885d0a43622aaac2de08cae30d6981563cc
    source_path: security/network-proxy.md
    workflow: 16
---

# 网络代理

OpenClaw 可以通过由运维方管理的正向代理路由运行时 HTTP 和 WebSocket 流量。对于希望集中控制出站流量、增强 SSRF 防护并提升网络审计能力的部署，这是一层可选的纵深防御。

OpenClaw 不会随附、下载、启动、配置或认证代理。你可以运行适合你的环境的代理技术，OpenClaw 会通过它路由常规的进程本地 HTTP 和 WebSocket 客户端。

## 为什么使用代理？

代理为运维方提供一个用于出站 HTTP 和 WebSocket 流量的网络控制点。即使不考虑 SSRF 加固，这也可能很有用：

- 集中策略：维护一套出站策略，而不是依赖每个应用 HTTP 调用点都正确处理网络规则。
- 连接时检查：在 DNS 解析之后、代理打开上游连接之前立即评估目标。
- DNS 重新绑定防御：缩小应用级 DNS 检查与实际出站连接之间的间隙。
- 更广泛的 JavaScript 覆盖范围：通过同一路径路由普通 `fetch`、`node:http`、`node:https`、WebSocket、axios、got、node-fetch 以及类似客户端。
- 可审计性：在出站边界记录被允许和被拒绝的目标。
- 运维控制：无需重新构建 OpenClaw，即可强制执行目标规则、网络分段、速率限制或出站允许列表。

OpenClaw 仍然保留应用级 SSRF 防护，例如 `fetchWithSsrFGuard`。代理路由是用于常规 HTTP 和 WebSocket 出站流量的附加进程级护栏，而不是受保护 fetch 或操作系统级网络沙箱的替代品。

## OpenClaw 如何路由流量

当 `proxy.enabled=true` 且配置了代理 URL 时，受保护的运行时进程（例如 `openclaw gateway run`、`openclaw node run` 和 `openclaw agent --local`）会通过配置的代理路由常规 HTTP 和 WebSocket 出站流量：

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

公开契约是路由行为，而不是用于实现它的内部 Node 钩子。OpenClaw Gateway 网关控制平面 WebSocket 客户端会在 Gateway 网关 URL 使用字面量 loopback IP（例如 `127.0.0.1` 或 `[::1]`）时，对 local loopback Gateway 网关 RPC 流量使用一条狭窄的直连路径。即使运维方代理阻止 loopback 目标，该控制平面路径也必须能够访问 loopback Gateway 网关。常规运行时 HTTP 和 WebSocket 请求仍会使用配置的代理。

代理 URL 本身必须使用 `http://`。HTTPS 目标仍可通过带 HTTP `CONNECT` 的代理来支持；这只表示 OpenClaw 期望一个普通 HTTP 正向代理监听器，例如 `http://127.0.0.1:3128`。

代理处于活动状态时，OpenClaw 会清除 `no_proxy`、`NO_PROXY` 和 `GLOBAL_AGENT_NO_PROXY`。这些绕过列表基于目标，因此如果其中保留 `localhost` 或 `127.0.0.1`，高风险 SSRF 目标就可能跳过过滤代理。

关闭时，OpenClaw 会恢复先前的代理环境，并重置缓存的进程路由状态。

## 配置

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

你也可以通过环境提供 URL，同时在配置中保留 `proxy.enabled=true`：

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` 优先于 `OPENCLAW_PROXY_URL`。

如果 `enabled=true` 但没有配置有效的代理 URL，受保护命令会启动失败，而不是回退到直接网络访问。

对于使用 `openclaw gateway start` 启动的托管 Gateway 网关服务，建议将 URL 存储在配置中：

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

环境回退最适合前台运行。如果你将它用于已安装服务，请将 `OPENCLAW_PROXY_URL` 放入服务的持久环境中，例如 `$OPENCLAW_STATE_DIR/.env` 或 `~/.openclaw/.env`，然后重新安装服务，使 launchd、systemd 或计划任务使用该值启动 Gateway 网关。

对于 `openclaw --container ...` 命令，当设置了 `OPENCLAW_PROXY_URL` 时，OpenClaw 会将其转发到面向容器的子 CLI。该 URL 必须能从容器内部访问；`127.0.0.1` 指的是容器本身，而不是主机。除非你显式覆盖这项安全检查，否则 OpenClaw 会拒绝面向容器命令中的 loopback 代理 URL。

## 代理要求

代理策略是安全边界。OpenClaw 无法验证代理是否阻止了正确的目标。

请将代理配置为：

- 仅绑定到 loopback 或受信任的私有接口。
- 限制访问，使只有 OpenClaw 进程、主机、容器或服务账号可以使用它。
- 自行解析目标，并在 DNS 解析后阻止目标 IP。
- 在连接时对普通 HTTP 请求和 HTTPS `CONNECT` 隧道都应用策略。
- 拒绝基于目标的绕过，覆盖 loopback、私有、链路本地、元数据、多播、保留或文档地址范围。
- 除非你完全信任 DNS 解析路径，否则避免使用主机名允许列表。
- 记录目标、决策、状态和原因，但不记录请求正文、授权标头、Cookie 或其他机密。
- 将代理策略纳入版本控制，并像审查安全敏感配置一样审查变更。

## 建议阻止的目标

将此拒绝列表作为任何正向代理、防火墙或出站策略的起点。

OpenClaw 应用级分类器逻辑位于 `src/infra/net/ssrf.ts` 和 `src/shared/net/ip.ts`。相关的对齐钩子包括 `BLOCKED_HOSTNAMES`、`BLOCKED_IPV4_SPECIAL_USE_RANGES`、`BLOCKED_IPV6_SPECIAL_USE_RANGES`、`RFC2544_BENCHMARK_PREFIX`，以及用于 NAT64、6to4、Teredo、ISATAP 和 IPv4 映射形式的嵌入式 IPv4 哨兵处理。维护外部代理策略时，这些文件是有用的参考，但 OpenClaw 不会自动导出这些规则，也不会在你的代理中强制执行这些规则。

| 范围或主机                                                                        | 阻止原因                                         |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                        |
| `::1/128`                                                                            | IPv6 loopback                                        |
| `0.0.0.0/8`, `::/128`                                                                | 未指定地址和本网地址               |
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

如果你的云提供商或网络平台记录了额外的元数据主机或保留范围，也请添加它们。

## 验证

从运行 OpenClaw 的同一主机、容器或服务账号验证代理：

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

公共请求应该成功。loopback 和元数据请求应该在代理处失败。

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

- 代理提升了进程本地 JavaScript HTTP 和 WebSocket 客户端的覆盖范围，但它不能替代应用级 `fetchWithSsrFGuard`。
- 原始 `net`、`tls` 和 `http2` 套接字、原生插件以及子进程可能绕过 Node 级代理路由，除非它们继承并遵守代理环境变量。
- 需要时，用户本地 WebUI 和本地模型服务器应加入运维方代理策略的允许列表；OpenClaw 不会为它们暴露通用的本地网络绕过能力。
- Gateway 网关控制平面代理绕过被有意限制为字面量 loopback IP URL。对于本地直连 Gateway 网关控制平面连接，请使用 `ws://127.0.0.1:18789` 或 `ws://[::1]:18789`；`localhost` 主机名会像普通的基于主机名的流量一样路由。
- OpenClaw 不会检查、测试或认证你的代理策略。
- 请将代理策略变更视为安全敏感的运维变更。
