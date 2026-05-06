---
read_when:
    - 打包 OpenClaw.app
    - 调试 macOS Gateway 网关 launchd 服务
    - 安装适用于 macOS 的 Gateway 网关 CLI
summary: macOS 上的 Gateway 网关运行时（外部 launchd 服务）
title: macOS 上的 Gateway 网关
x-i18n:
    generated_at: "2026-05-06T05:21:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f5dcc73671140d7599ffefceeb98ac7ce34da1f944c1e7c70bc9e5810e6ca66
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app 不再内置 Node/Bun 或 Gateway 网关运行时。macOS 应用需要一个**外部** `openclaw` CLI 安装，不会将 Gateway 网关作为子进程启动，并会管理按用户配置的 launchd 服务，让 Gateway 网关保持运行（如果已有一个本地 Gateway 网关在运行，则会附加到现有 Gateway 网关）。

## 安装 CLI（本地模式必需）

Node 24 是 Mac 上的默认运行时。Node 22 LTS（当前为 `22.14+`）仍可用于兼容。然后全局安装 `openclaw`：

```bash
npm install -g openclaw@<version>
```

macOS 应用的**安装 CLI**按钮会运行应用内部使用的同一个全局安装流程：它优先使用 npm，其次是 pnpm，再其次是在 bun 是唯一检测到的包管理器时使用 bun。Node 仍是推荐的 Gateway 网关运行时。

## Launchd（将 Gateway 网关作为 LaunchAgent）

标签：

- `ai.openclaw.gateway`（或 `ai.openclaw.<profile>`；旧版 `com.openclaw.*` 可能仍然存在）

Plist 位置（按用户）：

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （或 `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

管理器：

- macOS 应用在本地模式下负责 LaunchAgent 的安装/更新。
- CLI 也可以安装它：`openclaw gateway install`。

行为：

- “OpenClaw 活跃”会启用/禁用 LaunchAgent。
- 退出应用**不会**停止 Gateway 网关（launchd 会让它保持运行）。
- 如果已有 Gateway 网关在配置的端口上运行，应用会附加到它，而不是启动新的 Gateway 网关。

日志：

- launchd stdout/err：`/tmp/openclaw/openclaw-gateway.log`

## 版本兼容性

macOS 应用会将 Gateway 网关版本与自身版本进行检查。如果它们不兼容，请更新全局 CLI，使其匹配应用版本。

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
