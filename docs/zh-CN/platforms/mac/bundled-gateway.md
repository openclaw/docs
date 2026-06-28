---
read_when:
    - 打包 OpenClaw.app
    - 调试 macOS Gateway 网关 launchd 服务
    - 安装用于 macOS 的 Gateway 网关 CLI
summary: macOS 上的 Gateway 网关运行时（外部 launchd 服务）
title: macOS 上的 Gateway 网关
x-i18n:
    generated_at: "2026-06-28T00:12:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app 不再内置 Node/Bun 或 Gateway 网关运行时。macOS 应用
需要**外部**安装的 `openclaw` CLI，不会将 Gateway 网关作为
子进程启动，并会管理按用户配置的 launchd 服务，以保持 Gateway 网关
运行（或者如果已有本地 Gateway 网关在运行，则附加到它）。

## 安装 CLI（本地模式必需）

Node 24 是 Mac 上的默认运行时。Node 22 LTS（目前为 `22.19+`）仍可用于兼容性。然后全局安装 `openclaw`：

```bash
npm install -g openclaw@<version>
```

macOS 应用的**安装 CLI**按钮会运行应用内部使用的同一全局安装流程：
它会优先使用 npm，然后是 pnpm，如果检测到的唯一包管理器是 bun，则使用 bun。
Node 仍是推荐的 Gateway 网关运行时。

## Launchd（作为 LaunchAgent 的 Gateway 网关）

标签：

- `ai.openclaw.gateway`（或 `ai.openclaw.<profile>`；旧版 `com.openclaw.*` 可能仍会保留）

Plist 位置（按用户）：

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （或 `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

管理方：

- macOS 应用在本地模式下负责安装/更新 LaunchAgent。
- CLI 也可以安装它：`openclaw gateway install`。

行为：

- “OpenClaw 活跃”会启用/禁用 LaunchAgent。
- 退出应用**不会**停止 Gateway 网关（launchd 会让它保持运行）。
- 如果 Gateway 网关已在配置的端口上运行，应用会附加到
  它，而不是启动新的实例。

日志：

- launchd stdout：`~/Library/Logs/openclaw/gateway.log`（配置文件使用 `gateway-<profile>.log`）
- launchd stderr：已抑制

## 版本兼容性

macOS 应用会检查 Gateway 网关版本是否与自身版本匹配。如果它们
不兼容，请更新全局 CLI，使其与应用版本一致。

## macOS 上的状态目录

将 OpenClaw 状态保存在本地、非同步磁盘上。避免使用 iCloud Drive 和其他
云同步文件夹，因为同步延迟和文件锁可能会影响会话、
凭据和 Gateway 网关状态。

只有在需要覆盖时，才将 `OPENCLAW_STATE_DIR` 设置为本地路径。
`openclaw doctor` 会对常见的云同步状态路径发出警告，并建议
移回本地存储。参见
[环境变量](/zh-CN/help/environment#path-related-env-vars) 和
[Doctor](/zh-CN/gateway/doctor)。

## 调试应用连接

从源码检出中使用 macOS 调试 CLI，执行应用使用的同一 Gateway 网关
WebSocket 握手和设备发现逻辑：

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` 接受 `--url`、`--token`、`--timeout` 和 `--json`。`discover`
接受 `--timeout`、`--json` 和 `--include-local`。当你需要区分 CLI 设备发现
和应用侧连接问题时，请将设备发现输出与 `openclaw gateway discover --json` 比较。

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
