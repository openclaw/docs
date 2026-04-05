---
read_when:
    - 你仍在脚本中使用 `openclaw daemon ...`
    - 你需要服务生命周期命令（install/start/stop/restart/status）
summary: '`openclaw daemon` 的 CLI 参考（Gateway 网关服务管理的旧版别名）'
title: daemon
x-i18n:
    generated_at: "2026-04-05T08:19:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fdaf3c4f3e7dd4dff86f9b74a653dcba2674573698cf51efc4890077994169
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Gateway 网关服务管理命令的旧版别名。

`openclaw daemon ...` 映射到与 `openclaw gateway ...` 服务命令相同的服务控制接口。

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
- 生命周期命令（`uninstall|start|stop|restart`）：`--json`

说明：

- `status` 会在可能的情况下解析已配置的凭证 SecretRef，以用于探测认证。
- 如果此命令路径中无法解析必需的认证 SecretRef，且探测连接/认证失败，`daemon status --json` 会报告 `rpc.authWarning`；请显式传入 `--token`/`--password`，或先解析该密钥来源。
- 如果探测成功，则会抑制未解析认证引用的警告，以避免误报。
- `status --deep` 会添加尽力而为的系统级服务扫描。当它发现其他类似 gateway 的服务时，人类可读输出会打印清理提示，并警告每台机器通常仍建议只运行一个 gateway。
- 在 Linux `systemd` 安装中，`status` 的 token 漂移检查会同时包含 `Environment=` 和 `EnvironmentFile=` 单元来源。
- 漂移检查会使用合并后的运行时环境解析 `gateway.auth.token` SecretRef（优先使用服务命令环境，其次回退到进程环境）。
- 如果 token 认证实际上未启用（`gateway.auth.mode` 明确为 `password`/`none`/`trusted-proxy`，或 mode 未设置且 password 可能生效且没有任何 token 候选值可能生效），则 token 漂移检查会跳过配置 token 解析。
- 当 token 认证要求 token 且 `gateway.auth.token` 由 SecretRef 管理时，`install` 会验证该 SecretRef 可被解析，但不会将解析后的 token 持久化到服务环境元数据中。
- 如果 token 认证要求 token，而配置的 token SecretRef 无法解析，安装会以关闭方式失败。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，则在显式设置 mode 之前会阻止安装。
- 如果你有意在一台主机上运行多个 gateway，请隔离端口、配置/状态和工作区；参见 [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host)。

## 优先使用

请使用 [`openclaw gateway`](/cli/gateway) 查看当前文档和示例。
