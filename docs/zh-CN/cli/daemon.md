---
read_when:
    - 你仍在 scripts 中使用 `openclaw daemon ...`
    - 你需要服务生命周期命令（install/start/stop/restart/status）
summary: '`openclaw daemon` 的 CLI 参考（Gateway 网关服务管理的旧版别名）'
title: 守护进程
x-i18n:
    generated_at: "2026-05-10T19:27:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1951ade64d538130e4f04954cc8dec136f54a78b1fdf94e6ce988ded8cab516
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway 网关服务管理命令的旧版别名。

`openclaw daemon ...` 映射到与 `openclaw gateway ...` 服务命令相同的服务控制界面。

## 用法

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## 子命令

- `status`：显示服务安装状态并探测 Gateway 网关健康状态
- `install`：安装服务（`launchd`/`systemd`/`schtasks`）
- `uninstall`：移除服务
- `start`：启动服务
- `stop`：停止服务
- `restart`：重启服务

## 常用选项

- `status`：`--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
- `install`：`--port`、`--runtime <node|bun>`、`--token`、`--force`、`--json`
- `restart`：`--safe`、`--skip-deferral`、`--force`、`--wait <duration>`、`--json`
- 生命周期（`uninstall|start|stop`）：`--json`

注意事项：

- `status` 会在可能时解析已配置的身份验证 SecretRefs，用于探测身份验证。
- 如果此命令路径中所需的身份验证 SecretRef 未解析，`daemon status --json` 会在探测连接性/身份验证失败时报告 `rpc.authWarning`；请显式传入 `--token`/`--password`，或先解析该密钥来源。
- 如果探测成功，会抑制未解析身份验证引用警告，以避免误报。
- `status --deep` 会添加尽力而为的系统级服务扫描。当它发现其他类似 Gateway 网关的服务时，人类可读输出会打印清理提示，并警告每台机器一个 Gateway 网关仍然是常规建议。
- 在 Linux systemd 安装中，`status` 令牌漂移检查同时包含 `Environment=` 和 `EnvironmentFile=` 单元来源。
- 漂移检查使用合并后的运行时环境解析 `gateway.auth.token` SecretRefs（先使用服务命令环境，然后回退到进程环境）。
- 如果令牌身份验证未实际启用（显式 `gateway.auth.mode` 为 `password`/`none`/`trusted-proxy`，或模式未设置且密码可能胜出并且没有令牌候选可以胜出），令牌漂移检查会跳过配置令牌解析。
- 当令牌身份验证需要令牌且 `gateway.auth.token` 由 SecretRef 管理时，`install` 会验证 SecretRef 是否可解析，但不会将解析后的令牌持久化到服务环境元数据中。
- 如果令牌身份验证需要令牌且已配置的令牌 SecretRef 未解析，安装会以关闭方式失败。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，安装会被阻止，直到显式设置模式。
- 在 macOS 上，`install` 会保持 LaunchAgent plists 仅所有者可访问，并通过仅所有者可访问的文件和包装器加载托管服务环境值，而不是将 API 密钥或身份验证配置文件环境引用序列化到 `EnvironmentVariables` 中。
- 如果你有意在一台主机上运行多个 Gateway 网关，请隔离端口、配置/状态和工作区；参见 [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)。
- `restart --safe` 会要求正在运行的 Gateway 网关预检活动工作，并在活动工作排空后调度一次合并后的重启。普通 `restart` 保持现有服务管理器行为；`--force` 仍是立即覆盖路径。
- `restart --safe --skip-deferral` 会运行 OpenClaw 感知的安全重启，但绕过活动工作延迟门禁，因此即使报告了阻塞项，Gateway 网关也会立即发出重启。当卡住的任务运行固定住安全重启时，这是操作员逃生口；需要 `--safe`。

## 推荐

当前文档和示例请使用 [`openclaw gateway`](/zh-CN/cli/gateway)。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关运行手册](/zh-CN/gateway)
