---
read_when:
    - 你需要在部署前验证由操作员管理的代理路由
    - 你需要在本地捕获 OpenClaw 传输流量以进行调试
    - 你想检查调试代理会话、二进制对象或内置查询预设
summary: '`openclaw proxy` 的 CLI 参考，包括操作员管理的代理验证和本地调试代理捕获检查器'
title: 代理
x-i18n:
    generated_at: "2026-05-01T05:24:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0820de861bfe1ec14e0c1624d636d6474b5fedd317e3ba1baaa61f6530e06e9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

验证操作员管理的代理路由，或运行本地显式调试代理并检查捕获的流量。

使用 `validate` 在启用 OpenClaw 代理路由之前，对操作员管理的转发代理进行预检。其他命令是用于传输层调查的调试工具：它们可以启动本地代理、在启用捕获的情况下运行子命令、列出捕获会话、查询常见流量模式、读取捕获的 blob，并清除本地捕获数据。

## 命令

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## 验证

`openclaw proxy validate` 会检查来自 `--proxy-url`、配置或 `OPENCLAW_PROXY_URL` 的实际操作员管理的代理 URL。当没有启用和配置代理时，它会报告配置问题；在更改配置前，可使用 `--proxy-url` 进行一次性预检。默认情况下，它会验证公共目标可通过代理成功访问，并且代理无法访问临时 loopback 金丝雀。自定义拒绝目标采用失败关闭策略：HTTP 响应和含糊的传输失败都会导致失败，除非你可以单独验证特定部署的拒绝信号。

选项：

- `--json`：打印机器可读的 JSON。
- `--proxy-url <url>`：验证此代理 URL，而不是配置或环境变量。
- `--allowed-url <url>`：添加一个预期可通过代理成功访问的目标。可重复使用以检查多个目标。
- `--denied-url <url>`：添加一个预期会被代理阻止的目标。可重复使用以检查多个目标。
- `--timeout-ms <ms>`：每个请求的超时时间，单位为毫秒。

请参阅[网络代理](/zh-CN/security/network-proxy)，了解部署指南和拒绝语义。

## 查询预设

`openclaw proxy query --preset <name>` 接受：

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 说明

- `start` 默认使用 `127.0.0.1`，除非设置了 `--host`。
- `run` 会启动本地调试代理，然后运行 `--` 之后的命令。
- 当代理配置或目标检查失败时，`validate` 会以代码 1 退出。
- 捕获内容是本地调试数据；完成后请使用 `openclaw proxy purge`。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [网络代理](/zh-CN/security/network-proxy)
- [可信代理认证](/zh-CN/gateway/trusted-proxy-auth)
