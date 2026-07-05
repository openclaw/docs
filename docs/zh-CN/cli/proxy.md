---
read_when:
    - 部署前，你需要验证由操作员管理的代理路由
    - 你需要在本地捕获 OpenClaw 传输流量以便调试
    - 你想检查调试代理会话、blob 或内置查询预设
summary: '`openclaw proxy` 的 CLI 参考，包括操作员管理的代理验证和本地调试代理捕获检查器'
title: 代理
x-i18n:
    generated_at: "2026-07-05T11:09:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

验证操作员托管的代理路由，或运行本地显式调试代理并检查捕获的流量。

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

`validate` 会预检操作员托管的转发代理。其余命令是用于传输层调查的调试工具：启动本地捕获代理、通过它运行子命令、列出捕获会话、查询流量模式、读取捕获的 Blob，并清除本地捕获数据。

## 验证

按优先级顺序从 `--proxy-url`、配置（`proxy.proxyUrl`）或 `OPENCLAW_PROXY_URL` 检查有效的操作员托管代理 URL。如果未启用且未配置代理，则报告配置问题；传入 `--proxy-url` 可执行一次性预检，而不修改配置。

托管代理 URL 使用 `http://` 表示普通转发代理监听器，或在 OpenClaw 必须先向代理端点本身打开 TLS、再发送代理请求时使用 `https://`。使用 `--proxy-ca-file` 信任该 TLS 连接的私有 CA。

默认会运行：

- 一个针对 `https://example.com/` 的**允许**检查（可用 `--allowed-url` 覆盖/添加，可重复）
- 一个针对临时环回探针的**拒绝**检查（可用 `--denied-url` 覆盖，可重复）

自定义 `--denied-url` 目标采用失败关闭策略：HTTP 响应和含糊的传输失败都会计为失败，除非你能独立验证某个部署特定的拒绝信号。内置环回探针是唯一会将传输错误视为阻断证明的目标。

添加 `--apns-reachable` 还会通过代理打开 APNs HTTP/2 CONNECT 隧道，并确认沙箱 APNs 有响应。该探测会发送一个故意无效的提供商令牌，因此 APNs `403 InvalidProviderToken` 响应会计为成功的可达性信号（不是失败）。

### 选项

| 标志                     | 作用                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `--json`                 | 打印机器可读的 JSON                                                                                        |
| `--proxy-url <url>`      | 验证这个 `http://`/`https://` 代理 URL，而不是配置或环境变量                                              |
| `--proxy-ca-file <path>` | 信任这个 PEM CA 文件，用于 HTTPS 代理端点的 TLS 验证                                             |
| `--allowed-url <url>`    | 预期可通过代理成功访问的目标（可重复）                                                     |
| `--denied-url <url>`     | 预期会被代理阻断的目标（可重复）                                                       |
| `--apns-reachable`       | 同时验证沙箱 APNs HTTP/2 可通过代理访问                                                     |
| `--apns-authority <url>` | 要探测的 APNs authority（默认 `https://api.sandbox.push.apple.com`；生产环境为 `https://api.push.apple.com`） |
| `--timeout-ms <ms>`      | 每个请求的超时时间                                                                                                |

当代理配置或目标检查失败时，以代码 1 退出。

请参阅[网络代理](/zh-CN/security/network-proxy)，了解部署指导和拒绝语义。

## 调试代理

`start` 会启动本地捕获代理，并打印其 URL、CA 证书路径和捕获 DB 路径；用 Ctrl+C 停止。默认绑定到 `127.0.0.1`，除非设置了 `--host`。

`run` 会启动本地调试代理，然后在应用代理环境变量的情况下，通过其自己的捕获会话运行 `<cmd...>`（位于 `--` 之后）。

调试代理的直接上游转发会为诊断打开上游套接字。当 OpenClaw 托管代理模式处于活动状态时，默认会禁用代理请求和 CONNECT 隧道的直接转发；仅在批准的本地诊断中设置 `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1`。

`coverage` 会打印一个 JSON 报告（`summary` + 每种传输的 `entries`），说明哪些传输已被捕获、仅代理，或未覆盖。

`sessions` 会列出最近的捕获会话（`--limit`，默认 20）。

`query --preset <name>` 会对捕获的流量运行内置查询，可选地限定到 `--session <id>`。预设：

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>` 会打印捕获的载荷 Blob 的原始内容。

`purge` 会删除所有捕获的流量元数据和 Blob。捕获内容是本地调试数据；完成后请清除。

## 相关

- [CLI 参考](/zh-CN/cli)
- [网络代理](/zh-CN/security/network-proxy)
- [受信任代理认证](/zh-CN/gateway/trusted-proxy-auth)
