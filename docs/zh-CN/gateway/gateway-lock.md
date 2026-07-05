---
read_when:
    - 运行或调试 Gateway 网关进程
    - 调查单实例强制执行
summary: Gateway 网关单例保护：文件锁加 WebSocket/HTTP 绑定
title: Gateway 网关锁
x-i18n:
    generated_at: "2026-07-05T11:18:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c3ba4e8c12d6aadd089cb05722444eaa99d4b573553ac52a21c5c91e5ce1c09
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## 原因

- 在一台主机上，给定的配置 + 端口应只由一个 Gateway 网关进程拥有；要运行额外的 Gateway 网关，请使用隔离的配置文件和唯一端口。
- 在崩溃或 SIGKILL 后继续正常工作，不留下过期锁文件。
- 当另一个 Gateway 网关已经拥有该端口时，快速失败并给出清晰错误。

## 两层机制

启动会按顺序通过两个独立步骤强制执行单实例所有权：

1. **文件锁** 会在状态锁目录下获取按配置区分的锁文件。获取过程中，启动会探测已配置端口是否存在活动监听器，以检测过期的（已崩溃）锁拥有者。
2. **套接字绑定** 会将 HTTP/WebSocket 监听器（默认 `ws://127.0.0.1:18789`）绑定为独占 TCP 监听器。

每一层都可能独立失败，并抛出各自的 `GatewayLockError`。

### 文件锁

- 如果锁文件缺失、记录的拥有者进程已不存在，或拥有者的端口探测显示没有活动监听器，启动会回收该锁并继续。
- 如果锁正被活跃持有，且上述情况都不适用，启动会在放弃前最多重试 5 秒（默认）：

  ```text
  GatewayLockError("gateway already running (pid <pid>); lock timeout after <ms>ms")
  ```

### 套接字绑定

- 遇到 `EADDRINUSE` 时，启动会最多重试绑定 20 次，每次间隔 500ms（总计约 10 秒），以跨过最近退出进程留下的 `TIME_WAIT` 窗口。
- 如果重试后端口仍在使用中：

  ```text
  GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")
  ```

- 其他绑定失败：

  ```text
  GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: <cause>")
  ```

关闭时，Gateway 网关会关闭 HTTP/WebSocket 服务器并移除锁文件。

## 运维说明

- 如果端口被另一个非 Gateway 网关进程占用，错误相同；请释放该端口，或使用 `openclaw gateway --port <port>` 选择其他端口。
- 在服务监督器下，遇到上述任一错误的新 Gateway 网关进程会先探测现有进程的 `/healthz`。如果该进程健康，新进程会让它继续控制，而不是失败。在 systemd 上，它会以代码 `78` 退出；该单元的 `RestartPreventExitStatus=78` 会阻止 `Restart=always` 因锁或 `EADDRINUSE` 冲突而循环重启。如果现有进程始终无法变为健康状态，健康探测重试会有时间上限，随后启动会以上述锁错误失败，而不是无限循环。
- macOS 应用在生成 Gateway 网关前保留了自己的轻量级 PID 守卫；上面的文件锁和套接字绑定才是实际的运行时强制机制。

## 相关

- [多个 Gateway 网关](/zh-CN/gateway/multiple-gateways) - 使用唯一端口运行多个实例
- [故障排查](/zh-CN/gateway/troubleshooting) - 诊断 `EADDRINUSE` 和端口冲突
