---
read_when:
    - 部署前，你需要验证由操作员管理的代理路由
    - 你需要在本地捕获 OpenClaw 传输流量以进行调试
    - 你想检查调试代理会话、二进制大对象或内置查询预设
summary: '`openclaw proxy` 的 CLI 参考，包括操作员管理的代理验证和本地调试代理捕获检查器'
title: 代理
x-i18n:
    generated_at: "2026-07-11T20:25:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

验证由操作员管理的代理路由，或运行本地显式调试代理并检查捕获的流量。

```bash
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

`validate` 对由操作员管理的正向代理执行预检。其余命令是用于传输层调查的调试工具：启动本地流量捕获代理、通过它运行子命令、列出捕获会话、查询流量模式、读取捕获的数据块，以及清除本地捕获数据。

## 验证

按照以下优先级检查有效的操作员管理代理 URL：`--proxy-url`、配置（`proxy.proxyUrl`）和 `OPENCLAW_PROXY_URL`。如果未启用并配置代理，则报告配置问题；若要执行一次性预检而不修改配置，请传入 `--proxy-url`。

托管代理 URL 使用 `http://` 表示普通正向代理监听器；当 OpenClaw 必须先与代理端点本身建立 TLS 连接，再发送代理请求时，则使用 `https://`。使用 `--proxy-ca-file` 信任该 TLS 连接所用的私有 CA。

默认情况下，它会运行：

- 一项针对 `https://example.com/` 的**允许**检查（可使用可重复指定的 `--allowed-url` 覆盖或添加）
- 一项针对临时回环金丝雀目标的**拒绝**检查（可使用可重复指定的 `--denied-url` 覆盖）

自定义 `--denied-url` 目标采用失败即关闭策略：HTTP 响应和含义不明确的传输故障都会计为失败，除非你能独立验证特定部署的拒绝信号。内置回环金丝雀目标是唯一将传输错误视为阻止证据的目标。

添加 `--apns-reachable` 还可通过代理建立 APNs HTTP/2 CONNECT 隧道，并确认沙箱 APNs 有响应。该探测会发送一个有意设置为无效的提供商令牌，因此 APNs 的 `403 InvalidProviderToken` 响应会被视为可达性验证成功的信号，而不是失败。

### 选项

| 标志                     | 作用                                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `--json`                 | 输出机器可读的 JSON                                                                                                    |
| `--proxy-url <url>`      | 验证此 `http://`/`https://` 代理 URL，而不是配置或环境变量中的 URL                                                      |
| `--proxy-ca-file <path>` | 信任此 PEM CA 文件，以验证 HTTPS 代理端点的 TLS                                                                         |
| `--allowed-url <url>`    | 预期可通过代理成功访问的目标（可重复指定）                                                                               |
| `--denied-url <url>`     | 预期被代理阻止的目标（可重复指定）                                                                                       |
| `--apns-reachable`       | 同时验证是否可通过代理访问沙箱 APNs HTTP/2                                                                               |
| `--apns-authority <url>` | 要探测的 APNs 权威端点（默认为 `https://api.sandbox.push.apple.com`；生产环境为 `https://api.push.apple.com`）          |
| `--timeout-ms <ms>`      | 每个请求的超时时间                                                                                                      |

代理配置或目标检查失败时，以代码 1 退出。

有关部署指导和拒绝语义，请参阅[网络代理](/zh-CN/security/network-proxy)。

## 调试代理

`start` 启动本地流量捕获代理，并输出其 URL、CA 证书路径和捕获数据库路径；按 Ctrl+C 停止。除非设置了 `--host`，否则默认绑定到 `127.0.0.1`。

`run` 启动本地调试代理，然后在应用代理环境变量的情况下，在其自己的捕获会话中运行 `<cmd...>`（位于 `--` 之后）。

调试代理的直接上游转发会为诊断打开上游套接字。当 OpenClaw 托管代理模式处于活动状态时，默认禁用代理请求和 CONNECT 隧道的直接转发；仅在获批的本地诊断中设置 `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1`。

`coverage` 输出一份 JSON 报告（`summary` 和每种传输协议对应的 `entries`），说明哪些传输协议已被捕获、仅通过代理或尚未覆盖。

`sessions` 列出最近的捕获会话（`--limit`，默认为 20）。

`query --preset <name>` 对捕获的流量运行内置查询，并可选择使用 `--session <id>` 限定会话范围。预设包括：

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>` 输出已捕获载荷数据块的原始内容。

`purge` 删除所有已捕获的流量元数据和数据块。捕获内容属于本地调试数据；完成后请将其清除。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [网络代理](/zh-CN/security/network-proxy)
- [可信代理身份验证](/zh-CN/gateway/trusted-proxy-auth)
