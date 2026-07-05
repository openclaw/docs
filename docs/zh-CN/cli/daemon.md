---
read_when:
    - 你仍在脚本中使用 `openclaw daemon ...`
    - 你需要服务生命周期命令（install/start/stop/restart/status）
summary: '`openclaw daemon` 的 CLI 参考（Gateway 网关服务管理的旧版别名）'
title: 守护进程
x-i18n:
    generated_at: "2026-07-05T11:08:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4933885078d067ff2e077f25f14483aa5a10e3cd36951d0dc25c625d8b4d78e6
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

用于 Gateway 网关服务管理的旧版别名。`openclaw daemon ...` 会映射到与 `openclaw gateway ...` 相同的服务控制命令。当前文档和示例请优先使用 [`openclaw gateway`](/zh-CN/cli/gateway)。

## 用法

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## 子命令和选项

| 子命令      | 选项                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node\|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`            |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable`（仅限 launchd：持续抑制 KeepAlive/RunAtLoad，直到下次启动）                |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`：显示服务安装状态（launchd/systemd/schtasks）并探测 Gateway 网关健康。
- `install`：安装服务；`--force` 会重新安装/覆盖已有安装。
- `restart --safe`：要求正在运行的 Gateway 网关预检活动工作，并在工作清空后调度一次合并重启，受 `gateway.reload.deferralTimeoutMs` 限制（默认 300000ms/5 分钟；设为 `0` 表示无限期等待）。该预算到期后，仍会强制重启。普通 `restart` 直接使用服务管理器；`--force` 是立即覆盖。
- `restart --safe --skip-deferral`：绕过活动工作延迟门禁，因此即使报告了阻塞项，Gateway 网关也会立即重启。需要 `--safe`。

## 说明

- `status` 会在可能时解析已配置的认证 SecretRefs，用于探测认证。如果所需的 SecretRef 未解析，`status --json` 会报告 `rpc.authWarning`；请显式传入 `--token`/`--password`，或先解析密钥来源。一旦探测在其他方面成功，未解析认证警告就会被抑制。
- `status --deep` 会额外执行一次尽力而为的系统级扫描，查找其他类似 Gateway 网关的服务（打印清理提示；仍然建议每台机器只运行一个 Gateway 网关），并以插件感知模式运行配置验证，暴露快速默认路径会跳过的插件清单警告。
- 在 Linux systemd 安装中，token 漂移检查会检查 `Environment=` 和 `EnvironmentFile=` 两种 unit 来源。
- token 漂移检查会使用合并后的运行时环境变量解析 `gateway.auth.token` SecretRefs（先使用服务命令环境变量，再使用进程环境变量）。如果 token 认证实际上未启用（`gateway.auth.mode` 为 `password`/`none`/`trusted-proxy`，或未设置且密码能够优先生效），则会跳过配置 token 解析。
- `install` 会验证由 SecretRef 管理的 `gateway.auth.token` 是否可解析，但绝不会把解析后的值持久化到服务环境元数据中；如果无法解析，安装会以关闭方式失败。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且未设置 `gateway.auth.mode`，`install` 会阻塞，直到你显式设置该模式。
- 在 macOS 上，`install` 会让 LaunchAgent plist 和生成的环境文件/包装器仅限所有者访问（模式 `0600`/`0700`），而不是把密钥嵌入 `EnvironmentVariables`。
- 在一台主机上运行多个 Gateway 网关：隔离端口、配置/状态和工作区。参见[多个 Gateway 网关](/zh-CN/gateway#multiple-gateways-same-host)。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关运行手册](/zh-CN/gateway)
