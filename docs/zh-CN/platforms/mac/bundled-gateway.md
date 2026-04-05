---
read_when:
    - 打包 OpenClaw.app 时
    - 调试 macOS Gateway 网关 launchd 服务时
    - 为 macOS 安装 Gateway 网关 CLI 时
summary: macOS 上的 Gateway 网关运行时（外部 launchd 服务）
title: macOS 上的 Gateway 网关
x-i18n:
    generated_at: "2026-04-05T08:37:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e41528b35d69c13608cb9a34b39a7f02e1134204d1b496cbdd191798f39607
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

# macOS 上的 Gateway 网关（外部 launchd）

OpenClaw.app 不再内置 Node/Bun 或 Gateway 网关运行时。macOS 应用
需要安装**外部** `openclaw` CLI，不会将 Gateway 网关作为子进程启动，
而是通过每用户的 launchd 服务来管理 Gateway 网关的持续运行
（或者如果本地已有正在运行的 Gateway 网关，则附加到该实例）。

## 安装 CLI（本地模式必需）

Node 24 是 Mac 上的默认运行时。Node 22 LTS（当前为 `22.14+`）出于兼容性考虑仍然可用。然后全局安装 `openclaw`：

```bash
npm install -g openclaw@<version>
```

macOS 应用中的 **Install CLI** 按钮运行的就是应用
内部使用的同一套全局安装流程：优先使用 npm，其次是 pnpm，最后在
bun 是唯一检测到的包管理器时才使用 bun。Node 仍然是推荐的 Gateway 网关运行时。

## Launchd（作为 LaunchAgent 运行的 Gateway 网关）

标签：

- `ai.openclaw.gateway`（或 `ai.openclaw.<profile>`；旧版 `com.openclaw.*` 可能仍然存在）

Plist 位置（每用户）：

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （或 `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

管理者：

- 在本地模式下，macOS 应用负责 LaunchAgent 的安装/更新。
- CLI 也可以安装它：`openclaw gateway install`。

行为：

- “OpenClaw Active” 会启用/禁用 LaunchAgent。
- 退出应用**不会**停止 gateway（launchd 会让它持续运行）。
- 如果配置的端口上已经有 Gateway 网关在运行，应用会附加到
  该实例，而不是启动新的实例。

日志：

- launchd stdout/err：`/tmp/openclaw/openclaw-gateway.log`

## 版本兼容性

macOS 应用会检查 gateway 版本是否与自身版本匹配。如果
不兼容，请更新全局 CLI 以与应用版本一致。

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
