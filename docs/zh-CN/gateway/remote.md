---
read_when:
    - 运行或排查远程 Gateway 网关设置问题
summary: 使用 SSH 隧道（Gateway 网关 WS）和 tailnet 进行远程访问
title: 远程访问
x-i18n:
    generated_at: "2026-04-24T06:43:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eebbe3762134f29f982201d7e79a789624b96042bd931e07d9855710d64bfe
    source_path: gateway/remote.md
    workflow: 15
---

# 远程访问（SSH、隧道和 tailnet）

此仓库通过在专用主机（桌面机/服务器）上保持一个正在运行的 Gateway 网关（主节点），并让客户端连接到它，从而支持“通过 SSH 进行远程访问”。

- 对于**操作端（你 / macOS 应用）**：SSH 隧道是通用的兜底方案。
- 对于**节点（iOS/Android 和未来的设备）**：连接到 Gateway 网关 **WebSocket**（根据需要使用局域网 / tailnet 或 SSH 隧道）。

## 核心思路

- Gateway 网关 WebSocket 绑定到你所配置端口的**loopback**（默认是 18789）。
- 在远程使用时，你可以通过 SSH 转发这个 loopback 端口（或者使用 tailnet / VPN，以减少对隧道的依赖）。

## 常见 VPN / tailnet 设置（智能体所在位置）

把 **Gateway 主机**看作“智能体所在的位置”。它持有会话、认证配置文件、渠道和状态。
你的笔记本 / 台式机（以及节点）会连接到这台主机。

### 1）tailnet 中始终在线的 Gateway 网关（VPS 或家用服务器）

在持久运行的主机上运行 Gateway 网关，并通过 **Tailscale** 或 SSH 访问它。

- **最佳体验：**保持 `gateway.bind: "loopback"`，并为控制 UI 使用 **Tailscale Serve**。
- **兜底方案：**保持 loopback，然后从任何需要访问的机器建立 SSH 隧道。
- **示例：**[exe.dev](/zh-CN/install/exe-dev)（简单虚拟机）或 [Hetzner](/zh-CN/install/hetzner)（生产环境 VPS）。

当你的笔记本经常休眠，但你希望智能体始终在线时，这种方式最理想。

### 2）家用台式机运行 Gateway 网关，笔记本作为远程控制端

笔记本**不**运行智能体。它通过远程方式连接：

- 使用 macOS 应用的**通过 SSH 远程连接**模式（设置 → 通用 → “OpenClaw 运行于”）。
- 应用会打开并管理隧道，因此 WebChat 和健康检查都能“正常工作”。

操作手册：[macOS 远程访问](/zh-CN/platforms/mac/remote)。

### 3）笔记本运行 Gateway 网关，从其他机器远程访问

让 Gateway 网关保持本地运行，但以安全方式暴露出来：

- 从其他机器通过 SSH 隧道连接到笔记本，或者
- 使用 Tailscale Serve 暴露控制 UI，同时让 Gateway 网关仅绑定 loopback。

指南：[Tailscale](/zh-CN/gateway/tailscale) 和 [Web 概览](/zh-CN/web)。

## 命令流（哪些组件运行在哪里）

一个 Gateway 网关服务持有状态 + 渠道。节点是外围设备。

流程示例（Telegram → 节点）：

- Telegram 消息到达 **Gateway 网关**。
- Gateway 网关运行**智能体**，并决定是否调用某个节点工具。
- Gateway 网关通过 Gateway 网关 WebSocket（`node.*` RPC）调用**节点**。
- 节点返回结果；Gateway 网关再将回复发回 Telegram。

说明：

- **节点不会运行 gateway 服务。**每台主机通常只应运行一个 gateway，除非你有意运行隔离的配置文件（参见 [多个 gateway](/zh-CN/gateway/multiple-gateways)）。
- macOS 应用的“节点模式”本质上只是通过 Gateway 网关 WebSocket 连接的节点客户端。

## SSH 隧道（CLI + 工具）

创建一个指向远程 Gateway 网关 WS 的本地隧道：

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

隧道建立后：

- `openclaw health` 和 `openclaw status --deep` 现在会通过 `ws://127.0.0.1:18789` 访问远程 gateway。
- `openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe` 和 `openclaw gateway call` 也可以在需要时通过 `--url` 指向转发后的 URL。

注意：请将 `18789` 替换为你配置的 `gateway.port`（或 `--port` / `OPENCLAW_GATEWAY_PORT`）。
注意：当你传入 `--url` 时，CLI 不会回退到配置或环境中的凭证。
请显式提供 `--token` 或 `--password`。如果未显式提供凭证，将报错。

## CLI 远程默认值

你可以持久化一个远程目标，让 CLI 命令默认使用它：

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

当 gateway 仅绑定 loopback 时，请将 URL 保持为 `ws://127.0.0.1:18789`，并先建立 SSH 隧道。

## 凭证优先级

Gateway 网关凭证解析在 call / probe / status 路径以及 Discord exec-approval 监控中遵循同一套共享约定。节点主机使用相同的基础约定，但有一个本地模式例外（它会有意忽略 `gateway.remote.*`）：

- 显式凭证（`--token`、`--password` 或工具的 `gatewayToken`）在支持显式认证的调用路径中始终优先。
- URL 覆盖安全规则：
  - CLI URL 覆盖（`--url`）绝不会复用隐式配置 / 环境凭证。
  - 环境 URL 覆盖（`OPENCLAW_GATEWAY_URL`）只能使用环境凭证（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）。
- 本地模式默认值：
  - token：`OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（仅当本地认证 token 输入未设置时，才应用远程回退）
  - password：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（仅当本地认证 password 输入未设置时，才应用远程回退）
- 远程模式默认值：
  - token：`gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- 节点主机本地模式例外：会忽略 `gateway.remote.token` / `gateway.remote.password`。
- 远程 probe / status token 检查默认是严格的：在目标为远程模式时，它们只使用 `gateway.remote.token`（不会回退到本地 token）。
- Gateway 网关环境覆盖仅使用 `OPENCLAW_GATEWAY_*`。

## 通过 SSH 使用聊天 UI

WebChat 不再使用单独的 HTTP 端口。SwiftUI 聊天 UI 直接连接到 Gateway 网关 WebSocket。

- 通过 SSH 转发 `18789`（见上文），然后让客户端连接到 `ws://127.0.0.1:18789`。
- 在 macOS 上，优先使用应用的“通过 SSH 远程连接”模式，它会自动管理隧道。

## macOS 应用“通过 SSH 远程连接”

macOS 菜单栏应用可以端到端驱动同一套设置（远程状态检查、WebChat 和 Voice Wake 转发）。

操作手册：[macOS 远程访问](/zh-CN/platforms/mac/remote)。

## 安全规则（远程 / VPN）

简短版本：**除非你确定需要 bind，否则请让 Gateway 网关仅绑定 loopback。**

- **loopback + SSH / Tailscale Serve** 是最安全的默认方案（不会公开暴露）。
- 默认情况下，明文 `ws://` 仅限 loopback。对于受信任的私有网络，
  在客户端进程上设置 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 作为紧急兜底。
  没有对应的 `openclaw.json` 配置项；这必须设置在建立 WebSocket 连接的客户端进程
  环境中。
- **非 loopback 绑定**（`lan` / `tailnet` / `custom`，或在 loopback 不可用时使用 `auto`）必须启用 gateway 认证：token、password，或使用带有 `gateway.auth.mode: "trusted-proxy"` 的身份感知型反向代理。
- `gateway.remote.token` / `.password` 是客户端凭证来源。它们**不会**自行配置服务器认证。
- 本地调用路径仅会在 `gateway.auth.*` 未设置时，将 `gateway.remote.*` 作为回退使用。
- 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 但未能解析，解析会以关闭方式失败（不会用远程回退来掩盖问题）。
- 使用 `wss://` 时，`gateway.remote.tlsFingerprint` 会固定远程 TLS 证书。
- 当 `gateway.auth.allowTailscale: true` 时，**Tailscale Serve** 可以通过身份
  标头为控制 UI / WebSocket 流量进行认证；HTTP API 端点不会使用这种 Tailscale 标头认证，
  而是遵循 gateway 的常规 HTTP 认证模式。这个无 token 流程假设 gateway 主机是受信任的。
  如果你希望所有位置都使用共享密钥认证，请将其设为 `false`。
- **trusted-proxy** 认证仅适用于非 loopback 的身份感知型代理设置。
  同主机的 loopback 反向代理不满足 `gateway.auth.mode: "trusted-proxy"` 的要求。
- 请将浏览器控制视为操作端访问：仅限 tailnet + 经过有意的节点配对。

深入说明：[安全性](/zh-CN/gateway/security)。

### macOS：通过 LaunchAgent 持久化 SSH 隧道

对于连接到远程 gateway 的 macOS 客户端，最简单的持久化方案是使用 SSH `LocalForward` 配置项，再配合 LaunchAgent 在重启和崩溃后保持隧道存活。

#### 第 1 步：添加 SSH 配置

编辑 `~/.ssh/config`：

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

请将 `<REMOTE_IP>` 和 `<REMOTE_USER>` 替换为你的实际值。

#### 第 2 步：复制 SSH 密钥（一次性）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 第 3 步：配置 gateway token

将 token 存储到配置中，以便它在重启后依然保留：

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### 第 4 步：创建 LaunchAgent

将以下内容保存为 `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### 第 5 步：加载 LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

隧道会在登录时自动启动，在崩溃后自动重启，并保持转发端口处于可用状态。

注意：如果你仍然保留旧设置遗留的 `com.openclaw.ssh-tunnel` LaunchAgent，请先卸载并删除它。

#### 故障排除

检查隧道是否正在运行：

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

重启隧道：

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

停止隧道：

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| 配置项 | 作用 |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | 将本地端口 18789 转发到远程端口 18789 |
| `ssh -N` | SSH 连接但不执行远程命令（仅用于端口转发） |
| `KeepAlive` | 如果隧道崩溃则自动重启 |
| `RunAtLoad` | 在登录时 LaunchAgent 加载后启动隧道 |

## 相关内容

- [Tailscale](/zh-CN/gateway/tailscale)
- [Authentication](/zh-CN/gateway/authentication)
- [Remote gateway setup](/zh-CN/gateway/remote-gateway-readme)
