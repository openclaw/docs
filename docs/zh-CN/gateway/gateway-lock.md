---
read_when:
    - 运行或调试 Gateway 网关进程
    - 排查单实例强制执行机制
summary: 使用 WebSocket 监听器绑定的 Gateway 网关单例保护
title: Gateway 网关锁
x-i18n:
    generated_at: "2026-04-30T15:34:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85a1cb55f08d47d36fde25900e4247ef01c9a6800bf017fbff44a337f299ce13
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## 为什么

- 确保同一主机上每个基础端口只运行一个 Gateway 网关实例；额外的 Gateway 网关必须使用隔离的配置文件和唯一端口。
- 在崩溃/SIGKILL 后也不会留下陈旧的锁文件。
- 当控制端口已被占用时，快速失败并给出清晰错误。

## 机制

- Gateway 网关首先在状态锁目录下获取每配置锁文件，并探测已配置端口是否已有监听器。
- 如果记录的锁拥有者已消失、端口空闲，或锁已陈旧，启动过程会回收锁并继续。
- 随后 Gateway 网关使用独占 TCP 监听器绑定 HTTP/WebSocket 监听器（默认 `ws://127.0.0.1:18789`）。
- 如果绑定失败并返回 `EADDRINUSE`，启动会抛出 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`。
- 关闭时，Gateway 网关会关闭 HTTP/WebSocket 服务器并移除锁文件。

## 错误表面

- 如果另一个进程占用了该端口，启动会抛出 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`。
- 其他绑定失败会以 `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")` 呈现。

## 运维说明

- 如果端口被_另一个_进程占用，错误相同；释放该端口，或使用 `openclaw gateway --port <port>` 选择另一个端口。
- 在服务监督器下，新的 Gateway 网关进程如果看到现有健康的 `/healthz` 响应方，会让该进程继续控制。在 systemd 上，重复启动器会以代码 78 退出，因此默认的 `RestartPreventExitStatus=78` 会阻止 `Restart=always` 因锁或 `EADDRINUSE` 冲突而循环。如果现有进程始终无法变为健康状态，重试会受限，启动会以清晰的锁错误失败，而不是无限循环。
- macOS 应用在生成 Gateway 网关前仍会维护自己的轻量级 PID 防护；运行时锁由锁文件加 HTTP/WebSocket 绑定强制执行。

## 相关

- [多个 Gateway 网关](/zh-CN/gateway/multiple-gateways) — 使用唯一端口运行多个实例
- [故障排除](/zh-CN/gateway/troubleshooting) — 诊断 `EADDRINUSE` 和端口冲突
