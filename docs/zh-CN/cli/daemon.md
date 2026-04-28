---
read_when:
    - 你仍在 scripts 中使用 `openclaw daemon ...`
    - 你需要服务生命周期命令（install/start/stop/restart/status）
summary: CLI 参考：`openclaw daemon`（Gateway 网关服务管理的旧版别名）
title: 守护进程
x-i18n:
    generated_at: "2026-04-28T11:47:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51839f7cbc180cc0c43caa2d7e83cc2add7cbca40665f83f64e6ce9dde8574dd
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

- `status`：显示服务安装状态并探测 Gateway 网关健康状况
- `install`：安装服务（`launchd`/`systemd`/`schtasks`）
- `uninstall`：移除服务
- `start`：启动服务
- `stop`：停止服务
- `restart`：重启服务

## 常用选项

- `status`：`--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
- `install`：`--port`、`--runtime <node|bun>`、`--token`、`--force`、`--json`
- 生命周期（`uninstall|start|stop|restart`）：`--json`

说明：

- `status` 会在可行时解析已配置的认证 SecretRefs，用于探测认证。
- 如果在此命令路径中所需的认证 SecretRef 未解析，当探测连接性或认证失败时，`daemon status --json` 会报告 `rpc.authWarning`；请显式传入 `--token`/`--password`，或先解析密钥来源。
- 如果探测成功，未解析的 auth-ref 警告会被抑制，以避免误报。
- `status --deep` 会添加尽力而为的系统级服务扫描。当它发现其他类似 Gateway 网关的服务时，面向人类的输出会打印清理提示，并警告每台机器一个 Gateway 网关仍是常规建议。
- 在 Linux systemd 安装中，`status` 的 token 漂移检查会同时包含 `Environment=` 和 `EnvironmentFile=` 单元来源。
- 漂移检查会使用合并后的运行时环境解析 `gateway.auth.token` SecretRefs（先使用服务命令环境，然后回退到进程环境）。
- 如果 token 认证实际上未启用（显式 `gateway.auth.mode` 为 `password`/`none`/`trusted-proxy`，或模式未设置且 password 可以胜出、没有 token 候选可以胜出），token 漂移检查会跳过配置 token 解析。
- 当 token 认证需要 token 且 `gateway.auth.token` 由 SecretRef 管理时，`install` 会验证 SecretRef 可解析，但不会把解析出的 token 持久化到服务环境元数据中。
- 如果 token 认证需要 token 且已配置的 token SecretRef 未解析，安装会失败并关闭。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，则会阻止安装，直到显式设置模式。
- 在 macOS 上，`install` 会保持 LaunchAgent plist 仅所有者可访问，并通过仅所有者可访问的文件和包装器加载托管服务环境值，而不是把 API key 或 auth-profile env 引用序列化到 `EnvironmentVariables` 中。
- 如果你有意在一台主机上运行多个 Gateway 网关，请隔离端口、配置/状态和工作区；参见 [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)。

## 推荐

请使用 [`openclaw gateway`](/zh-CN/cli/gateway) 查看当前文档和示例。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关运行手册](/zh-CN/gateway)
