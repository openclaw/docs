---
read_when:
    - 打包 OpenClaw.app
    - 调试 macOS Gateway 网关 launchd 服务
    - 安装适用于 macOS 的 Gateway 网关 CLI
summary: macOS 上的 Gateway 网关运行时（外部 launchd 服务）
title: macOS 上的 Gateway 网关
x-i18n:
    generated_at: "2026-06-27T02:31:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c55e3d24e5bc743233e11be4897f4f2a865c97f2e0d795a472caeb6d097d34
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app 不再内置 Node/Bun 或 Gateway 网关运行时。macOS 应用
需要一个**外部**的 `openclaw` CLI 安装，不会将 Gateway 网关作为
子进程启动，并会管理按用户配置的 launchd 服务，以保持 Gateway 网关
运行（如果本地 Gateway 网关已在运行，则会附加到现有实例）。

## 安装 CLI（本地模式必需）

Node 24 是 Mac 上的默认运行时。Node 22 LTS（当前为 `22.19+`）仍可用于兼容性。然后全局安装 `openclaw`：

```bash
npm install -g openclaw@<version>
```

macOS 应用的**安装 CLI**按钮会运行应用内部使用的同一全局安装流程：
它会优先使用 npm，然后是 pnpm，如果 bun 是唯一检测到的包管理器，则使用 bun。
Node 仍是推荐的 Gateway 网关运行时。

## Launchd（Gateway 网关作为 LaunchAgent）

标签：

- `ai.openclaw.gateway`（或 `ai.openclaw.<profile>`；旧版 `com.openclaw.*` 可能仍会保留）

Plist 位置（按用户）：

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （或 `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

管理器：

- macOS 应用在本地模式下负责安装/更新 LaunchAgent。
- CLI 也可以安装它：`openclaw gateway install`。

行为：

- “OpenClaw Active” 会启用/禁用 LaunchAgent。
- 退出应用**不会**停止 Gateway 网关（launchd 会保持其运行）。
- 如果 Gateway 网关已在配置的端口上运行，应用会附加到
  该实例，而不是启动新的实例。

日志：

- launchd stdout：`~/Library/Logs/openclaw/gateway.log`（配置文件使用 `gateway-<profile>.log`）
- launchd stderr：已抑制

## 版本兼容性

macOS 应用会检查 Gateway 网关版本是否与自身版本匹配。如果二者
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
