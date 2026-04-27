---
read_when:
    - 运行或调试 Gateway 网关进程
    - 调查单实例强制机制
summary: 使用 WebSocket 监听器绑定的 Gateway 网关单例保护
title: Gateway 网关锁
x-i18n:
    generated_at: "2026-04-27T21:49:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe61ff81106554e98de1ca04c213b76d230265cdf3e81b70897d2de00f6a0179
    source_path: gateway/gateway-lock.md
    workflow: 15
---

## 原因

- 确保同一主机上每个基础端口仅运行一个 Gateway 网关实例；额外的 Gateway 网关必须使用隔离的配置档案和唯一端口。
- 在崩溃或 `SIGKILL` 后仍能恢复，不留下陈旧的锁文件。
- 当控制端口已被占用时，快速失败并给出清晰的错误信息。

## 机制

- Gateway 网关首先在状态锁目录下获取一个按配置划分的锁文件，并探测已配置端口上是否已有监听器存在。
- 如果记录的锁持有者已不存在、端口空闲，或者锁已陈旧，启动过程会重新获取该锁并继续。
- 然后，Gateway 网关使用独占的 TCP 监听器绑定 HTTP/WebSocket 监听器（默认 `ws://127.0.0.1:18789`）。
- 如果绑定因 `EADDRINUSE` 失败，启动会抛出 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`。
- 在关闭时，Gateway 网关会关闭 HTTP/WebSocket 服务器并移除锁文件。

## 错误表现

- 如果另一个进程持有该端口，启动会抛出 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`。
- 其他绑定失败会表现为 `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`。

## 操作说明

- 如果该端口被_另一个_进程占用，错误信息也是相同的；请释放该端口，或使用 `openclaw gateway --port <port>` 选择其他端口。
- 在服务监管器下，新的 Gateway 网关进程如果发现现有的健康 `/healthz` 响应器，会成功退出并让该进程继续控制。如果现有进程始终未变为健康状态，重试次数会受到限制，并且启动会以清晰的锁错误失败，而不是无限循环。
- macOS 应用在启动 Gateway 网关前仍会维护其自身的轻量级 PID 保护；运行时锁由锁文件加上 HTTP/WebSocket 绑定共同强制执行。

## 相关内容

- [多个 Gateway 网关](/zh-CN/gateway/multiple-gateways) — 使用唯一端口运行多个实例
- [故障排除](/zh-CN/gateway/troubleshooting) — 诊断 `EADDRINUSE` 和端口冲突
