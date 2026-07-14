---
read_when:
    - 运行或调试 Gateway 网关进程
    - 调查单实例强制执行机制
summary: Gateway 网关单例保护：文件锁与 WebSocket/HTTP 绑定
title: Gateway 网关锁定
x-i18n:
    generated_at: "2026-07-14T13:38:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: f5ac6d42c437b481c68a23a0aa4c00aeac9131acd76f3516ce3e949f325e265b
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## 原因

- 一个状态目录只能由一个 Gateway 网关进程占用；运行其他 Gateway 网关时，应使用相互隔离的配置文件、状态目录、配置和端口。
- 在崩溃或收到 SIGKILL 后仍能恢复，且不会遗留失效的锁文件。
- 当另一个 Gateway 网关已占用该端口时，立即失败并给出明确错误。

## 三层机制

启动过程按顺序分三步强制实施所有权：

1. **状态所有权锁**获取一个以规范状态目录为键的锁。每个 Gateway 网关都会参与，包括使用 `OPENCLAW_ALLOW_MULTI_GATEWAY=1` 启动的 Gateway 网关，因此破坏性的 SQLite 维护操作不会与正在运行的所有者发生竞争。
2. **配置锁**获取沿用的按配置划分的锁，并记录运行时端口。多 Gateway 网关模式会跳过此配置单例锁，但仍保留状态所有权锁。
3. **套接字绑定**将 HTTP/WebSocket 监听器（默认 `ws://127.0.0.1:18789`）绑定为独占 TCP 监听器。

每一层都可能独立失败，并抛出各自的 `GatewayLockError`。

### 状态锁和配置锁

- 锁的存活状态根据记录的 PID、可用时的平台进程启动标识以及 Gateway 网关进程标识判断。即使启动期间其端口尚未开始监听，经过验证的所有者仍具有权威性。
- 专用 SQLite 协调器会将元数据检查、失效所有者回收和锁替换串行化。如果所有者进程崩溃，其独占事务会自动释放。
- 如果锁文件缺失或记录的所有者进程已不存在，启动过程会回收该锁并继续。
- 如果任一锁正被占用，启动过程会重试最多 5 秒（默认值），然后放弃：

  ```text
  GatewayLockError("Gateway 网关已在运行（pid <pid>）；锁在 <ms>ms 后超时")
  ```

### 套接字绑定

- 遇到 `EADDRINUSE` 时，启动过程最多重试绑定 20 次，每次间隔 500ms（总计约 10 秒），以等待最近退出的进程所产生的 `TIME_WAIT` 窗口结束。
- 如果重试后端口仍在使用：

  ```text
  GatewayLockError("另一个 Gateway 网关实例已在 ws://127.0.0.1:<port> 上监听")
  ```

- 其他绑定失败：

  ```text
  GatewayLockError("无法在 ws://127.0.0.1:<port> 上绑定 Gateway 网关套接字：<cause>")
  ```

关闭时，Gateway 网关会关闭 HTTP/WebSocket 服务器，并删除其状态锁文件
和配置锁文件。

## 运维说明

- 如果端口被其他非 Gateway 网关进程占用，错误信息相同；请释放该端口，或使用 `openclaw gateway --port <port>` 选择其他端口。
- `OPENCLAW_ALLOW_MULTI_GATEWAY=1` 允许多个配置/运行时实例，但不允许共享可变状态。每个实例仍需使用唯一的 `OPENCLAW_STATE_DIR`。
- 在服务监控程序下，新 Gateway 网关进程遇到上述任一错误时，会先探测现有进程上的 `/healthz`。如果该进程健康，新进程会让其继续保持控制，而不是启动失败。在 systemd 上，新进程会以代码 `78` 退出；单元的 `RestartPreventExitStatus=78` 会阻止 `Restart=always` 因锁或 `EADDRINUSE` 冲突而循环重启。如果现有进程始终未恢复健康，健康探测重试会在限定时间后结束，随后启动过程会以上述锁错误失败，而不会无限循环。
- macOS 应用在生成 Gateway 网关进程之前会使用自己的轻量级 PID 防护机制；上述文件锁和套接字绑定才是实际的运行时强制机制。

## 相关内容

- [多个 Gateway 网关](/zh-CN/gateway/multiple-gateways) - 使用不同端口运行多个实例
- [故障排查](/zh-CN/gateway/troubleshooting) - 诊断 `EADDRINUSE` 和端口冲突
