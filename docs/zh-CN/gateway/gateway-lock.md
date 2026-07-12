---
read_when:
    - 运行或调试 Gateway 网关进程
    - 调查单实例强制执行机制
summary: Gateway 网关单例保护：文件锁与 WebSocket/HTTP 端口绑定
title: Gateway 网关锁定
x-i18n:
    generated_at: "2026-07-11T20:32:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c3ba4e8c12d6aadd089cb05722444eaa99d4b573553ac52a21c5c91e5ce1c09
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## 原因

- 一台主机上的同一组配置和端口只能由一个 Gateway 网关进程占用；如需运行其他 Gateway 网关，请使用相互隔离的配置文件和不同的端口。
- 即使发生崩溃或收到 `SIGKILL`，也不会留下过期的锁文件。
- 当端口已被另一个 Gateway 网关占用时，立即失败并给出明确错误。

## 两层机制

启动过程按顺序通过两个相互独立的步骤强制实施单实例所有权：

1. **文件锁**会在状态锁目录下获取针对每份配置的锁文件。获取锁时，启动过程会探测配置的端口上是否存在活动的监听程序，以检测锁所有者是否已过期（因崩溃退出）。
2. **套接字绑定**会将 HTTP/WebSocket 监听程序（默认为 `ws://127.0.0.1:18789`）绑定为独占 TCP 监听程序。

每一层都可能独立失败，并抛出各自的 `GatewayLockError`。

### 文件锁

- 如果锁文件不存在、记录的所有者进程已退出，或对所有者端口的探测表明没有活动的监听程序，启动过程会回收锁并继续。
- 如果锁正被占用且上述情况均不适用，启动过程会重试最多 5 秒（默认值），然后放弃：

  ```text
  GatewayLockError("gateway already running (pid <pid>); lock timeout after <ms>ms")
  ```

### 套接字绑定

- 遇到 `EADDRINUSE` 时，启动过程会以 500 毫秒的间隔重试绑定最多 20 次（总计约 10 秒），以等待最近退出的进程结束 `TIME_WAIT` 阶段。
- 如果重试后端口仍被占用：

  ```text
  GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")
  ```

- 其他绑定失败：

  ```text
  GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: <cause>")
  ```

关闭时，Gateway 网关会关闭 HTTP/WebSocket 服务器并删除锁文件。

## 运维说明

- 如果端口被其他非 Gateway 网关进程占用，也会出现相同的错误；请释放该端口，或使用 `openclaw gateway --port <port>` 选择其他端口。
- 在服务监督程序下，如果新的 Gateway 网关进程遇到上述任一错误，它会先探测现有进程的 `/healthz`。如果该进程运行正常，新进程会让它继续保持控制权，而不是失败。在 systemd 上，新进程会以代码 `78` 退出；单元中的 `RestartPreventExitStatus=78` 可防止 `Restart=always` 因锁或 `EADDRINUSE` 冲突而循环重启。如果现有进程始终无法达到健康状态，健康探测重试会在限定时间后停止，随后启动过程会以上述锁错误失败，而不会无限循环。
- macOS 应用在生成 Gateway 网关进程前会执行自身的轻量级 PID 防护；上述文件锁和套接字绑定才是实际的运行时强制机制。

## 相关内容

- [多个 Gateway 网关](/zh-CN/gateway/multiple-gateways) - 使用不同端口运行多个实例
- [故障排查](/zh-CN/gateway/troubleshooting) - 诊断 `EADDRINUSE` 和端口冲突
