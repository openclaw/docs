---
read_when:
    - 你需要在部署前验证由运维人员管理的代理路由
    - 你需要在本地捕获 OpenClaw 传输流量以进行调试
    - 你想检查调试代理会话、二进制大对象或内置查询预设
summary: '`openclaw proxy` 的 CLI 参考，包括操作员管理的代理验证和本地调试代理捕获检查器'
title: 代理
x-i18n:
    generated_at: "2026-05-04T11:08:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 092c4e946dcab5e78e37d6fc77bb067b7a649368f8571fa127e462a85fa14ce5
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

验证由操作员管理的代理路由，或运行本地显式调试代理并检查捕获的流量。

使用 `validate` 在启用 OpenClaw 代理路由之前预检由操作员管理的转发代理。其他命令是用于传输层调查的调试工具：它们可以启动本地代理、在启用捕获的情况下运行子命令、列出捕获会话、查询常见流量模式、读取捕获的 Blob，以及清除本地捕获数据。

## 命令

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## 验证

`openclaw proxy validate` 会检查来自 `--proxy-url`、配置或 `OPENCLAW_PROXY_URL` 的有效由操作员管理的代理 URL。当未启用并配置代理时，它会报告配置问题；在更改配置之前，可使用 `--proxy-url` 进行一次性预检。默认情况下，它会验证公共目标可通过代理成功访问，并验证代理无法访问临时回环探针。自定义拒绝目标采用失败关闭策略：HTTP 响应和含糊的传输失败都会失败，除非你可以单独验证特定部署的拒绝信号。添加 `--apns-reachable` 还会通过代理打开 APNs HTTP/2 CONNECT 隧道，并确认沙箱 APNs 有响应；该探测会使用有意无效的提供商令牌，因此 APNs `403 InvalidProviderToken` 响应就是成功的可达性信号。

选项：

- `--json`：打印机器可读的 JSON。
- `--proxy-url <url>`：验证此代理 URL，而不是配置或环境变量。
- `--allowed-url <url>`：添加一个预期可通过代理成功访问的目标。可重复使用以检查多个目标。
- `--denied-url <url>`：添加一个预期会被代理阻止的目标。可重复使用以检查多个目标。
- `--apns-reachable`：同时验证沙箱 APNs HTTP/2 可通过代理访问。
- `--apns-authority <url>`：与 `--apns-reachable` 一起探测的 APNs authority（默认为 `https://api.sandbox.push.apple.com`；生产环境为 `https://api.push.apple.com`）。
- `--timeout-ms <ms>`：每个请求的超时时间，单位为毫秒。

有关部署指导和拒绝语义，请参阅 [网络代理](/zh-CN/security/network-proxy)。

## 查询预设

`openclaw proxy query --preset <name>` 接受：

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 备注

- `start` 默认使用 `127.0.0.1`，除非设置了 `--host`。
- `run` 会启动本地调试代理，然后运行 `--` 后面的命令。
- 调试代理的直接上游转发会打开上游套接字用于诊断。当 OpenClaw 托管代理模式处于活动状态时，默认禁用代理请求和 CONNECT 隧道的直接转发；仅在获批的本地诊断中设置 `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1`。
- 当代理配置或目标检查失败时，`validate` 会以代码 1 退出。
- 捕获内容是本地调试数据；完成后请使用 `openclaw proxy purge`。

## 相关

- [CLI 参考](/zh-CN/cli)
- [网络代理](/zh-CN/security/network-proxy)
- [受信代理身份验证](/zh-CN/gateway/trusted-proxy-auth)
