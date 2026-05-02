---
read_when:
    - 你仍在 scripts 中使用 `openclaw daemon ...`
    - 你需要服务生命周期命令（install/start/stop/restart/status）
summary: '`openclaw daemon` 的 CLI 参考（Gateway 网关服务管理的旧版别名）'
title: 守护进程
x-i18n:
    generated_at: "2026-05-02T21:57:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f11b75bf2781e69f6f59b23364f06cf359f9f24407f25f19b9d2186f7158512
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Gateway 网关服务管理命令的旧版别名。

`openclaw daemon ...` 映射到与 `openclaw gateway ...` 服务命令相同的服务控制面。

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
- `restart`：`--force`、`--wait <duration>`、`--json`
- 生命周期（`uninstall|start|stop`）：`--json`

注意事项：

- `status` 会在可能时解析已配置的 auth SecretRefs，用于探测鉴权。
- 如果此命令路径中所需的 auth SecretRef 未解析，当探测连接/鉴权失败时，`daemon status --json` 会报告 `rpc.authWarning`；请显式传入 `--token`/`--password`，或先解析密钥来源。
- 如果探测成功，未解析的 auth-ref 警告会被抑制，以避免误报。
- `status --deep` 会添加尽力而为的系统级服务扫描。当它发现其他类似 gateway 的服务时，面向人的输出会打印清理提示，并警告每台机器一个 gateway 仍是常规建议。
- 在 Linux systemd 安装中，`status` token-drift 检查同时包含 `Environment=` 和 `EnvironmentFile=` 单元来源。
- Drift 检查使用合并后的运行时 env（先使用服务命令 env，然后回退到进程 env）解析 `gateway.auth.token` SecretRefs。
- 如果 token 鉴权并未实际启用（显式 `gateway.auth.mode` 为 `password`/`none`/`trusted-proxy`，或 mode 未设置且 password 可以胜出，并且没有 token 候选可以胜出），token-drift 检查会跳过配置 token 解析。
- 当 token 鉴权需要 token 且 `gateway.auth.token` 由 SecretRef 管理时，`install` 会验证该 SecretRef 是否可解析，但不会将解析出的 token 持久化到服务环境元数据中。
- 如果 token 鉴权需要 token 且已配置的 token SecretRef 未解析，安装会失败并关闭。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，安装会被阻止，直到显式设置 mode。
- 在 macOS 上，`install` 会保持 LaunchAgent plists 仅限所有者访问，并通过仅限所有者访问的文件和包装器加载托管服务环境值，而不是将 API keys 或 auth-profile env refs 序列化到 `EnvironmentVariables` 中。
- 如果你有意在一台主机上运行多个 gateway，请隔离端口、配置/状态和工作区；参见 [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)。

## 推荐

使用 [`openclaw gateway`](/zh-CN/cli/gateway) 查看当前文档和示例。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关运行手册](/zh-CN/gateway)
