---
read_when:
    - 打包 OpenClaw.app
    - 调试 macOS Gateway 网关 launchd 服务
    - 安装适用于 macOS 的 Gateway 网关 CLI
summary: macOS 上的 Gateway 网关运行时（外部 launchd 服务）
title: macOS 上的 Gateway 网关
x-i18n:
    generated_at: "2026-07-04T06:23:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app 不再内置 Node/Bun 或 Gateway 网关运行时。macOS 应用
需要一个**外部** `openclaw` CLI 安装，不会将 Gateway 网关作为子进程启动，
并会管理一个按用户配置的 launchd 服务来保持 Gateway 网关运行
（如果本地已有 Gateway 网关在运行，则连接到现有实例）。

## 自动设置

在一台全新的 Mac 上，在新手引导期间选择**这台 Mac**。应用会在 Gateway 网关向导之前运行其签名的内置安装器，
在 `~/.openclaw` 下安装用户空间 Node 运行时
以及匹配的 `openclaw` CLI，然后安装并启动按用户配置的 launchd 服务。
此路径不需要终端、Homebrew 或管理员访问权限。

应用内置的是安装器脚本，而不是 Node 或 Gateway 网关载荷。因此，设置
需要互联网连接来下载运行时和匹配的 OpenClaw 包。

## 手动恢复

手动安装推荐使用 Node 24。Node 22 LTS（当前为 `22.19+`）
也可正常工作。然后全局安装 `openclaw`：

```bash
npm install -g openclaw@<version>
```

自动设置失败后，使用**重试设置**。如果仍然失败，
请使用上面的命令手动安装 CLI，然后在新手引导中选择**再次检查**。
Node 仍然是推荐的 Gateway 网关运行时。

## Launchd（Gateway 网关作为 LaunchAgent）

标签：

- `ai.openclaw.gateway`（或 `ai.openclaw.<profile>`；旧版 `com.openclaw.*` 可能仍会保留）

Plist 位置（按用户）：

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （或 `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

管理器：

- macOS 应用在本地模式中负责 LaunchAgent 的安装/更新。
- CLI 也可以安装它：`openclaw gateway install`。

行为：

- “OpenClaw 已启用”会启用/禁用 LaunchAgent。
- 退出应用**不会**停止 Gateway 网关（launchd 会保持其存活）。
- 如果 Gateway 网关已在配置的端口上运行，应用会连接到它，
  而不是启动新的实例。

日志：

- launchd stdout：`~/Library/Logs/openclaw/gateway.log`（profile 使用 `gateway-<profile>.log`）
- launchd stderr：已抑制

## 版本兼容性

macOS 应用会根据自身版本检查 Gateway 网关版本。当现有 CLI 缺失或
不兼容时，新手引导会自动运行托管设置。使用**重试设置**来重复安装，
或在修复外部 CLI 后使用**再次检查**。

## macOS 上的状态目录

请将 OpenClaw 状态保存在本地、非同步磁盘上。避免使用 iCloud Drive 和其他
云同步文件夹，因为同步延迟和文件锁可能会影响会话、
凭据和 Gateway 网关状态。

仅在需要覆盖默认值时，将 `OPENCLAW_STATE_DIR` 设置为本地路径。
`openclaw doctor` 会对常见的云同步状态路径发出警告，并建议
迁回本地存储。请参阅
[环境变量](/zh-CN/help/environment#path-related-env-vars)和
[Doctor](/zh-CN/gateway/doctor)。

## 调试应用连接

从源代码检出中使用 macOS 调试 CLI，来执行与应用相同的 Gateway 网关
WebSocket 握手和设备发现逻辑：

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` 接受 `--url`、`--token`、`--timeout` 和 `--json`。`discover`
接受 `--timeout`、`--json` 和 `--include-local`。当你需要区分 CLI 设备发现
和应用端连接问题时，将设备发现输出与 `openclaw gateway discover --json` 进行比较。

## 冒烟检查

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

然后：

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [Gateway 网关运行手册](/zh-CN/gateway)
