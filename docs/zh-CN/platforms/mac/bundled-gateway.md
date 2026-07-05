---
read_when:
    - 打包 OpenClaw.app
    - 调试 macOS Gateway 网关 launchd 服务
    - 为 macOS 安装 Gateway 网关 CLI
summary: macOS 上的 Gateway 网关运行时（外部 launchd 服务）
title: macOS 上的 Gateway 网关
x-i18n:
    generated_at: "2026-07-05T11:26:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1637aaf009383045ce25c0c13d8b39223ea08d5d26b9fa376d2c97f0030c9eb
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app 不内置 Node/Bun 或 Gateway 网关运行时。macOS 应用
需要**外部** `openclaw` CLI 安装，不会将 Gateway 网关作为
子进程启动，并会管理一个每用户 launchd 服务来保持 Gateway 网关
运行（或附加到已经运行的本地 Gateway 网关）。

## 自动设置

在全新的 Mac 上，在新手引导期间选择 **这台 Mac**。应用会在
Gateway 网关向导之前运行其已签名的内置安装器脚本：它会在
`~/.openclaw` 下安装用户空间 Node 运行时和匹配的 `openclaw` CLI，
然后安装并启动每用户 launchd 服务。此路径不需要
终端、Homebrew 或管理员权限。

应用只内置安装器脚本，不内置 Node 或 Gateway 网关载荷；
设置需要互联网连接来下载运行时和匹配的 OpenClaw 包。

## 手动恢复

建议手动安装时使用 Node 24；Node 22.19+ 也可用。全局安装
`openclaw`：

```bash
npm install -g openclaw@<version>
```

自动设置失败后使用 **重试设置**。如果仍然失败，
请使用上面的命令手动安装 CLI，然后在新手引导中选择 **再次检查**。

## Launchd（Gateway 网关作为 LaunchAgent）

标签：`ai.openclaw.gateway`（默认 profile），或命名 profile 的
`ai.openclaw.<profile>`。

Plist 位置（每用户）：`~/Library/LaunchAgents/ai.openclaw.gateway.plist`
（或 `ai.openclaw.<profile>.plist`）。

macOS 应用在 Local 模式下负责默认 profile 的 LaunchAgent 安装/更新。
CLI 也可以直接安装它：`openclaw gateway install`
（命名 profile 通过 `OPENCLAW_PROFILE` 环境变量选择）。

行为：

- “OpenClaw 活跃”启用/禁用 LaunchAgent。
- 退出应用**不会**停止 Gateway 网关（launchd 会保持其存活）。
- 如果 Gateway 网关已在配置的端口上运行，应用会附加到它，
  而不是启动新的 Gateway 网关。

日志：

- launchd stdout：`~/Library/Logs/openclaw/gateway.log`（profile 使用
  `gateway-<profile>.log`）
- launchd stderr：已抑制

## 版本兼容性

macOS 应用会检查 Gateway 网关版本是否匹配自身版本。新手引导会在现有
CLI 缺失或不兼容时自动运行托管设置。使用 **重试设置** 来重复安装，
或在修复外部 CLI 后使用 **再次检查**。

## macOS 上的状态目录

请将 OpenClaw 状态保存在本地、非同步磁盘上。避免使用 iCloud Drive
和其他云同步文件夹；同步延迟和文件锁可能影响会话、
凭证和 Gateway 网关状态。

仅在需要覆盖时，将 `OPENCLAW_STATE_DIR` 设置为本地路径。
`openclaw doctor` 会对常见的云同步状态路径发出警告，并建议
迁回本地存储。请参阅
[环境变量](/zh-CN/help/environment#path-related-env-vars) 和
[Doctor](/zh-CN/gateway/doctor)。

## 调试应用连接

在源代码 checkout 中使用 macOS 调试 CLI，运行与应用相同的 Gateway 网关
WebSocket 握手和设备发现逻辑：

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` 接受 `--url`、`--token`、`--timeout`、`--probe` 和 `--json`
（以及客户端身份覆盖；使用 `--help` 运行以查看完整列表）。
`discover` 接受 `--timeout`、`--json` 和 `--include-local`。当你需要
区分 CLI 设备发现和应用侧连接问题时，将设备发现输出与
`openclaw gateway discover --json` 进行比较。

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
