---
read_when:
    - 你仍在脚本中使用 `openclaw daemon ...`
    - 你需要服务生命周期命令（install/start/stop/restart/status）
summary: '`openclaw daemon` 的 CLI 参考（Gateway 网关服务管理的旧版别名）'
title: 守护进程
x-i18n:
    generated_at: "2026-05-04T18:03:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84e11fc50bdf38da518a8fcf415ae461a2688c2299f996eee384357c0d04a05
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

- `status`: 显示服务安装状态并探测 Gateway 网关健康状况
- `install`: 安装服务（`launchd`/`systemd`/`schtasks`）
- `uninstall`: 移除服务
- `start`: 启动服务
- `stop`: 停止服务
- `restart`: 重启服务

## 常用选项

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
- 生命周期（`uninstall|start|stop`）：`--json`

备注：

- `status` 会在可能时解析已配置的身份验证 SecretRefs，用于探测身份验证。
- 如果此命令路径中必需的身份验证 SecretRef 未解析，`daemon status --json` 会在探测连接性/身份验证失败时报告 `rpc.authWarning`；请显式传入 `--token`/`--password`，或先解析密钥来源。
- 如果探测成功，则会抑制未解析的 auth-ref 警告，以避免误报。
- `status --deep` 会添加尽力而为的系统级服务扫描。当它发现其他类似 Gateway 网关的服务时，面向用户的输出会打印清理提示，并警告每台机器一个 Gateway 网关仍然是常规建议。
- 在 Linux systemd 安装中，`status` 令牌漂移检查会同时包含 `Environment=` 和 `EnvironmentFile=` 单元来源。
- 漂移检查会使用合并后的运行时环境解析 `gateway.auth.token` SecretRefs（先使用服务命令环境，然后回退到进程环境）。
- 如果令牌身份验证并未实际启用（显式 `gateway.auth.mode` 为 `password`/`none`/`trusted-proxy`，或模式未设置且密码可能优先、没有令牌候选可优先），令牌漂移检查会跳过配置令牌解析。
- 当令牌身份验证需要令牌且 `gateway.auth.token` 由 SecretRef 管理时，`install` 会验证 SecretRef 是否可解析，但不会将解析出的令牌持久化到服务环境元数据中。
- 如果令牌身份验证需要令牌且配置的令牌 SecretRef 未解析，安装会失败关闭。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，则安装会被阻止，直到显式设置模式。
- 在 macOS 上，`install` 会让 LaunchAgent plist 仅限所有者访问，并通过仅限所有者访问的文件和包装器加载托管服务环境值，而不是将 API 密钥或 auth-profile 环境引用序列化到 `EnvironmentVariables` 中。
- 如果你有意在一台主机上运行多个 Gateway 网关，请隔离端口、配置/状态和工作区；参见 [/gateway#multiple-gateways-same-host](/zh-CN/gateway#multiple-gateways-same-host)。
- `restart --safe` 会要求正在运行的 Gateway 网关预检活动工作，并在活动工作耗尽后安排一次合并重启。普通 `restart` 会保留现有服务管理器行为；`--force` 仍然是立即覆盖路径。

## 建议使用

使用 [`openclaw gateway`](/zh-CN/cli/gateway) 查看当前文档和示例。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关运行手册](/zh-CN/gateway)
