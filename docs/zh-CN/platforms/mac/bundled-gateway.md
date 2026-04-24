---
read_when:
    - 打包 OpenClaw.app
    - 调试 macOS Gateway 网关 launchd 服务
    - 安装 macOS 的 gateway CLI
summary: macOS 上的 Gateway 网关运行时（外部 launchd 服务）
title: macOS 上的 Gateway 网关
x-i18n:
    generated_at: "2026-04-24T04:05:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb98905712504fdf5085ec1c00c9e3f911e4005cd14b1472efdb7a5ec7189b5c
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

OpenClaw.app 不再内置 Node/Bun 或 Gateway 网关运行时。macOS 应用
现在依赖**外部**安装的 `openclaw` CLI，不会将 Gateway 网关作为子进程启动，
而是通过每用户的 launchd 服务来保持 Gateway 网关持续运行（或者如果本地已存在正在运行的 Gateway 网关，则附加到该实例）。

## 安装 CLI（本地模式必需）

Mac 上的默认运行时是 Node 24。Node 22 LTS（当前为 `22.14+`）出于兼容性考虑仍然可用。然后全局安装 `openclaw`：

```bash
npm install -g openclaw@<version>
```

macOS 应用中的**安装 CLI**按钮会运行与应用内部相同的全局安装流程：优先使用 npm，其次是 pnpm，只有在检测到 bun 是唯一包管理器时才使用 bun。Node 仍然是推荐的 Gateway 网关运行时。

## launchd（作为 LaunchAgent 的 Gateway 网关）

标签：

- `ai.openclaw.gateway`（或 `ai.openclaw.<profile>`；旧版 `com.openclaw.*` 可能仍会保留）

plist 位置（每用户）：

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （或 `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

管理方：

- macOS 应用在本地模式下负责 LaunchAgent 的安装/更新。
- CLI 也可以安装它：`openclaw gateway install`。

行为：

- “OpenClaw Active” 会启用/禁用 LaunchAgent。
- 退出应用**不会**停止 gateway（launchd 会保持其存活）。
- 如果配置的端口上已经有一个 Gateway 网关在运行，应用会附加到
  该实例，而不是启动新的实例。

日志：

- launchd stdout/err：`/tmp/openclaw/openclaw-gateway.log`

## 版本兼容性

macOS 应用会检查 gateway 版本是否与自身版本兼容。如果
不兼容，请更新全局 CLI，使其与应用版本一致。

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

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [Gateway 网关运行手册](/zh-CN/gateway)
