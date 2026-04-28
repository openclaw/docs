---
read_when:
    - 运行远程 Gateway 网关设置或进行故障排除
summary: 使用 SSH 隧道（Gateway 网关 WS）和 tailnet 网络进行远程访问
title: 远程访问
x-i18n:
    generated_at: "2026-04-28T11:53:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 116ffba71801d3363eba293997ee4a5c8ad083a82298e57e68f678510263650a
    source_path: gateway/remote.md
    workflow: 16
---

此仓库通过在专用主机（桌面电脑/服务器）上运行单个 Gateway 网关（主网关），并让客户端连接到它，来支持“通过 SSH 远程”。

- 对于**操作员（你 / macOS 应用）**：SSH 隧道是通用兜底方案。
- 对于**节点（iOS/Android 和未来设备）**：连接到 Gateway 网关 **WebSocket**（根据需要使用 LAN/tailnet 或 SSH 隧道）。

## 核心思路

- Gateway 网关 WebSocket 会绑定到你配置端口上的 **loopback**（默认 18789）。
- 对于远程使用，你可以通过 SSH 转发该 loopback 端口（或使用 tailnet/VPN，减少隧道需求）。

## 常见 VPN 和 tailnet 设置

将 **Gateway 网关主机**理解为智能体所在的位置。它拥有会话、凭证配置、渠道和状态。你的笔记本电脑、桌面电脑和节点会连接到该主机。

### tailnet 中始终在线的 Gateway 网关

在一台持久运行的主机（VPS 或家用服务器）上运行 Gateway 网关，并通过 **Tailscale** 或 SSH 访问它。

- **最佳体验：**保留 `gateway.bind: "loopback"`，并使用 **Tailscale Serve** 提供 Control UI。
- **兜底方案：**保留 loopback，并从任何需要访问的机器建立 SSH 隧道。
- **示例：**[exe.dev](/zh-CN/install/exe-dev)（简单 VM）或 [Hetzner](/zh-CN/install/hetzner)（生产 VPS）。

适合笔记本电脑经常休眠，但你希望智能体始终在线的场景。

### 家用桌面电脑运行 Gateway 网关

笔记本电脑**不**运行智能体。它会远程连接：

- 使用 macOS 应用的**通过 SSH 远程**模式（设置 → 通用 → OpenClaw 运行方式）。
- 应用会打开并管理隧道，因此 WebChat 和健康检查可以直接工作。

运行手册：[macOS 远程访问](/zh-CN/platforms/mac/remote)。

### 笔记本电脑运行 Gateway 网关

保持 Gateway 网关本地运行，但安全地暴露它：

- 从其他机器到笔记本电脑建立 SSH 隧道，或
- 使用 Tailscale Serve 提供 Control UI，并让 Gateway 网关保持仅 loopback。

指南：[Tailscale](/zh-CN/gateway/tailscale) 和 [Web 概览](/zh-CN/web)。

## 命令流程（在哪里运行什么）

一个 gateway 服务拥有状态 + 渠道。节点是外围设备。

流程示例（Telegram → 节点）：

- Telegram 消息到达 **Gateway 网关**。
- Gateway 网关运行**智能体**，并决定是否调用节点工具。
- Gateway 网关通过 Gateway 网关 WebSocket 调用**节点**（`node.*` RPC）。
- 节点返回结果；Gateway 网关再回复到 Telegram。

注意：

- **节点不运行 gateway 服务。**除非你有意运行隔离配置，否则每台主机只应运行一个 gateway（参见[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)）。
- macOS 应用的“节点模式”只是通过 Gateway 网关 WebSocket 运行的节点客户端。

## SSH 隧道（CLI + 工具）

创建到远程 Gateway 网关 WS 的本地隧道：

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

隧道建立后：

- `openclaw health` 和 `openclaw status --deep` 现在会通过 `ws://127.0.0.1:18789` 访问远程 gateway。
- `openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe` 和 `openclaw gateway call` 也可以在需要时通过 `--url` 指向转发后的 URL。

<Note>
将 `18789` 替换为你配置的 `gateway.port`（或 `--port` 或 `OPENCLAW_GATEWAY_PORT`）。
</Note>

<Warning>
当你传入 `--url` 时，CLI 不会回退到配置或环境凭证。请显式包含 `--token` 或 `--password`。缺少显式凭证会报错。
</Warning>

## CLI 远程默认值

你可以持久化远程目标，让 CLI 命令默认使用它：

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

当 gateway 仅 loopback 时，将 URL 保持为 `ws://127.0.0.1:18789`，并先打开 SSH 隧道。
在 macOS 应用的 SSH 隧道传输中，发现到的 gateway 主机名应放在
`gateway.remote.sshTarget`；`gateway.remote.url` 仍然是本地隧道 URL。

## 凭证优先级

Gateway 网关凭证解析在 call/probe/status 路径和 Discord exec-approval 监控中遵循同一个共享契约。Node-host 使用相同的基础契约，但有一个本地模式例外（它会有意忽略 `gateway.remote.*`）：

- 显式凭证（`--token`、`--password` 或工具 `gatewayToken`）在接受显式认证的调用路径上总是优先。
- URL 覆盖安全规则：
  - CLI URL 覆盖（`--url`）绝不会复用隐式配置/环境凭证。
  - 环境 URL 覆盖（`OPENCLAW_GATEWAY_URL`）只能使用环境凭证（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）。
- 本地模式默认值：
  - token：`OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（仅当本地 auth token 输入未设置时，才应用远程兜底）
  - password：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（仅当本地 auth password 输入未设置时，才应用远程兜底）
- 远程模式默认值：
  - token：`gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host 本地模式例外：`gateway.remote.token` / `gateway.remote.password` 会被忽略。
- 远程 probe/status token 检查默认是严格的：在目标为远程模式时，它们只使用 `gateway.remote.token`（不回退到本地 token）。
- Gateway 网关环境覆盖只使用 `OPENCLAW_GATEWAY_*`。

## 通过 SSH 使用 Chat UI

WebChat 不再使用单独的 HTTP 端口。SwiftUI 聊天 UI 会直接连接到 Gateway 网关 WebSocket。

- 通过 SSH 转发 `18789`（见上文），然后将客户端连接到 `ws://127.0.0.1:18789`。
- 在 macOS 上，优先使用应用的“通过 SSH 远程”模式，它会自动管理隧道。

## macOS 应用通过 SSH 远程

macOS 菜单栏应用可以端到端驱动同一套设置（远程状态检查、WebChat 和 Voice Wake 转发）。

运行手册：[macOS 远程访问](/zh-CN/platforms/mac/remote)。

## 安全规则（远程/VPN）

简版：除非你确定需要绑定，否则**让 Gateway 网关保持仅 loopback**。

- **Loopback + SSH/Tailscale Serve** 是最安全的默认方案（不公开暴露）。
- 明文 `ws://` 默认仅限 loopback。对于可信私有网络，
  在客户端进程上设置 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`
  作为应急手段。没有等价的 `openclaw.json` 配置；这必须是发起
  WebSocket 连接的客户端进程环境。
- **非 loopback 绑定**（`lan`/`tailnet`/`custom`，或 loopback 不可用时的 `auto`）必须使用 gateway 认证：token、password，或带有 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。
- `gateway.remote.token` / `.password` 是客户端凭证来源。它们本身**不会**配置服务器认证。
- 本地调用路径只有在 `gateway.auth.*` 未设置时，才能使用 `gateway.remote.*` 作为兜底。
- 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 显式配置但未能解析，解析会失败关闭（不会用远程兜底掩盖）。
- 使用 `wss://` 时，`gateway.remote.tlsFingerprint` 会固定远程 TLS 证书。
- 当 `gateway.auth.allowTailscale: true` 时，**Tailscale Serve** 可以通过身份
  头对 Control UI/WebSocket 流量进行认证；HTTP API 端点不使用
  该 Tailscale 头认证，而是遵循 gateway 的常规 HTTP 认证模式。
  此无 token 流程假定 gateway 主机可信。如果你希望所有位置都使用共享密钥认证，请将其设置为
  `false`。
- **Trusted-proxy** 认证默认预期非 loopback 的身份感知代理设置。
  同主机 loopback 反向代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。
- 将浏览器控制视为操作员访问：仅限 tailnet + 有意的节点配对。

深入说明：[安全](/zh-CN/gateway/security)。

### macOS：通过 LaunchAgent 持久化 SSH 隧道

对于连接到远程 gateway 的 macOS 客户端，最简单的持久化设置是使用 SSH `LocalForward` 配置项，再配合 LaunchAgent，让隧道在重启和崩溃后保持存活。

#### 第 1 步：添加 SSH 配置

编辑 `~/.ssh/config`：

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

将 `<REMOTE_IP>` 和 `<REMOTE_USER>` 替换为你的值。

#### 第 2 步：复制 SSH 密钥（一次性）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 第 3 步：配置 gateway token

将 token 存储到配置中，使其在重启后仍然保留：

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### 第 4 步：创建 LaunchAgent

将其保存为 `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`：

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

隧道会在登录时自动启动，崩溃后重启，并保持转发端口可用。

<Note>
如果你有旧设置遗留的 `com.openclaw.ssh-tunnel` LaunchAgent，请卸载并删除它。
</Note>

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

| 配置项                               | 作用                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | 将本地端口 18789 转发到远程端口 18789                       |
| `ssh -N`                             | 不执行远程命令的 SSH（仅端口转发）                           |
| `KeepAlive`                          | 如果隧道崩溃，则自动重启隧道                                 |
| `RunAtLoad`                          | LaunchAgent 在登录时加载后启动隧道                           |

## 相关

- [Tailscale](/zh-CN/gateway/tailscale)
- [认证](/zh-CN/gateway/authentication)
- [远程 gateway 设置](/zh-CN/gateway/remote-gateway-readme)
