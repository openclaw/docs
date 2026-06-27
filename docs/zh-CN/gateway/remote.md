---
read_when:
    - 运行或排查远程 Gateway 网关设置
summary: 使用 Gateway 网关 WS、SSH 隧道和 tailnet 网络进行远程访问
title: 远程访问
x-i18n:
    generated_at: "2026-06-27T02:06:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5f885026fe76acb46f49955c6e485e08714a5cc5e90c165d20e25cea1acf864
    source_path: gateway/remote.md
    workflow: 16
---

此 repo 通过在专用主机（桌面/server）上保持单个 Gateway 网关（master）运行，并让客户端连接到它，来支持远程 Gateway 网关访问。

- 对于 **operators（你 / macOS app）**：当 Gateway 网关可访问时，直接 LAN/Tailnet WebSocket 最简单；SSH 隧道是通用回退方案。
- 对于 **nodes（iOS/Android 和未来设备）**：连接到 Gateway 网关 **WebSocket**（按需使用 LAN/tailnet 或 SSH 隧道）。

## 核心思路

- Gateway 网关 WebSocket 通常绑定到你配置端口上的 **loopback**（默认 18789）。
- 对于远程使用，可通过 Tailscale Serve 或受信任的 LAN/Tailnet 绑定暴露它，或通过 SSH 转发 loopback 端口。

## 常见 VPN 和 tailnet 设置

将 **Gateway 网关主机** 理解为 agent 所在的位置。它拥有会话、凭证配置、渠道和状态。你的 laptop、desktop 和 nodes 都连接到该主机。

### tailnet 中始终在线的 Gateway 网关

在持久主机（VPS 或家用服务器）上运行 Gateway 网关，并通过 **Tailscale** 或 SSH 访问它。

- **最佳 UX：** 保持 `gateway.bind: "loopback"`，并为 Control UI 使用 **Tailscale Serve**。
- **受信任的 LAN/Tailnet：** 将 Gateway 网关绑定到私有接口，并使用 `gateway.remote.transport: "direct"` 直接连接。
- **回退方案：** 保持 loopback，并从任何需要访问的机器建立 SSH 隧道。
- **示例：** [exe.dev](/zh-CN/install/exe-dev)（简单 VM）或 [Hetzner](/zh-CN/install/hetzner)（生产 VPS）。

适合你的 laptop 经常休眠，但你希望 agent 始终在线的场景。

### 家用 desktop 运行 Gateway 网关

laptop **不** 运行 agent。它远程连接：

- 使用 macOS app 的远程模式（设置 → 通用 → OpenClaw 运行位置）。
- 当 LAN/Tailnet 上可访问 Gateway 网关时，app 会直接连接；当你选择 SSH 时，它会打开并管理 SSH 隧道。

运行手册：[macOS 远程访问](/zh-CN/platforms/mac/remote)。

### laptop 运行 Gateway 网关

保持 Gateway 网关本地运行，但安全地暴露它：

- 从其他机器 SSH 隧道到 laptop，或
- 用 Tailscale Serve 暴露 Control UI，并让 Gateway 网关仅限 loopback。

指南：[Tailscale](/zh-CN/gateway/tailscale) 和 [Web 概览](/zh-CN/web)。

## 命令流（在哪里运行什么）

一个 Gateway 网关服务拥有状态 + 渠道。Nodes 是外围设备。

流程示例（Telegram → node）：

- Telegram 消息到达 **Gateway 网关**。
- Gateway 网关运行 **agent**，并决定是否调用 node 工具。
- Gateway 网关通过 Gateway 网关 WebSocket（`node.*` RPC）调用 **node**。
- Node 返回结果；Gateway 网关再回复到 Telegram。

说明：

- **Nodes 不运行 Gateway 网关服务。** 除非你有意运行隔离配置，否则每台主机只应运行一个 Gateway 网关（见 [Multiple gateways](/zh-CN/gateway/multiple-gateways)）。
- macOS app 的 “node mode” 只是通过 Gateway 网关 WebSocket 连接的 node 客户端。

## SSH 隧道（CLI + 工具）

创建到远程 Gateway 网关 WS 的本地隧道：

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

隧道建立后：

- `openclaw health` 和 `openclaw status --deep` 现在会通过 `ws://127.0.0.1:18789` 访问远程 Gateway 网关。
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

当 Gateway 网关仅限 loopback 时，将 URL 保持为 `ws://127.0.0.1:18789`，并先打开 SSH 隧道。
在 macOS app 的 SSH 隧道传输中，发现的 Gateway 网关主机名属于
`gateway.remote.sshTarget`；`gateway.remote.url` 仍然是本地隧道 URL。
如果这些端口不同，请将 `gateway.remote.remotePort` 设置为 SSH 主机上的 Gateway 网关端口。

对于已经可在受信任 LAN 或 Tailnet 上访问的 Gateway 网关，使用 direct 模式：

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## 凭证优先级

Gateway 网关凭证解析在 call/probe/status 路径和 Discord exec-approval 监控中遵循同一个共享契约。Node-host 使用相同的基础契约，但有一个 local-mode 例外（它会有意忽略 `gateway.remote.*`）：

- 显式凭证（`--token`、`--password` 或工具 `gatewayToken`）在接受显式 auth 的调用路径上始终优先。
- URL 覆盖安全规则：
  - CLI URL 覆盖（`--url`）绝不会复用隐式 config/env 凭证。
  - Env URL 覆盖（`OPENCLAW_GATEWAY_URL`）只能使用 env 凭证（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）。
- Local mode 默认值：
  - token：`OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（仅当 local auth token 输入未设置时才应用 remote 回退）
  - password：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（仅当 local auth password 输入未设置时才应用 remote 回退）
- Remote mode 默认值：
  - token：`gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host local-mode 例外：`gateway.remote.token` / `gateway.remote.password` 会被忽略。
- Remote probe/status token 检查默认是严格的：面向 remote mode 时，它们只使用 `gateway.remote.token`（不回退到 local token）。
- Gateway 网关 env 覆盖只使用 `OPENCLAW_GATEWAY_*`。

## Chat UI 远程访问

WebChat 不再使用单独的 HTTP 端口。SwiftUI chat UI 直接连接到 Gateway 网关 WebSocket。

- 通过 SSH 转发 `18789`（见上文），然后将客户端连接到 `ws://127.0.0.1:18789`。
- 对于 LAN/Tailnet direct 模式，将客户端连接到配置的私有 `ws://` 或安全 `wss://` URL。
- 在 macOS 上，优先使用 app 的远程模式，它会自动管理所选传输方式。

## macOS app 远程模式

macOS 菜单栏 app 可以端到端驱动同一套设置（远程状态检查、WebChat 和 Voice Wake 转发）。

运行手册：[macOS 远程访问](/zh-CN/platforms/mac/remote)。

## 安全规则（remote/VPN）

简短版本：**保持 Gateway 网关仅限 loopback**，除非你确定需要绑定。

- **Loopback + SSH/Tailscale Serve** 是最安全的默认方案（无公网暴露）。
- 明文 `ws://` 可用于 loopback、LAN、link-local、`.local`、`.ts.net` 和 Tailscale CGNAT 主机。公网远程主机必须使用 `wss://`。
- **非 loopback 绑定**（`lan`/`tailnet`/`custom`，或当 loopback 不可用时的 `auto`）必须使用 Gateway 网关 auth：token、password，或带有 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。
- `gateway.remote.token` / `.password` 是客户端凭证来源。它们本身**不会**配置服务器 auth。
- 只有在 `gateway.auth.*` 未设置时，本地调用路径才可以使用 `gateway.remote.*` 作为回退。
- 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 显式配置但未解析，解析会失败关闭（不会用 remote 回退掩盖）。
- 使用 `wss://` 时，`gateway.remote.tlsFingerprint` 会固定远程 TLS 证书，包括 macOS direct 模式。没有已配置或之前存储的 pin 时，macOS 只会在正常系统信任通过后固定首次使用的证书；macOS 尚未信任的自签名或私有 CA Gateway 网关需要显式 fingerprint 或 Remote over SSH。
- 当 `gateway.auth.allowTailscale: true` 时，**Tailscale Serve** 可以通过 identity
  headers 认证 Control UI/WebSocket 流量；HTTP API endpoints 不使用该
  Tailscale header auth，而是遵循 Gateway 网关的常规 HTTP
  auth mode。这种无 token 流程假定 Gateway 网关主机受信任。如果你希望所有地方都使用 shared-secret auth，请将其设置为
  `false`。
- **Trusted-proxy** auth 默认预期非 loopback 的身份感知 proxy 设置。
  同主机 loopback 反向代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。
- 将浏览器控制视为 operator access：仅限 tailnet + 有意进行 node 配对。

深入说明：[安全](/zh-CN/gateway/security)。

### macOS：通过 LaunchAgent 持久化 SSH 隧道

对于连接到远程 Gateway 网关的 macOS 客户端，最简单的持久化设置是使用 SSH `LocalForward` 配置项，再加一个 LaunchAgent，以便在重启和崩溃后保持隧道存活。

#### 步骤 1：添加 SSH config

编辑 `~/.ssh/config`：

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

将 `<REMOTE_IP>` 和 `<REMOTE_USER>` 替换为你的值。

#### 步骤 2：复制 SSH key（一次性）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 步骤 3：配置 Gateway 网关 token

将 token 存储在 config 中，使其在重启后仍然保留：

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### 步骤 4：创建 LaunchAgent

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

#### 步骤 5：加载 LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

隧道会在登录时自动启动，崩溃时重启，并保持转发端口可用。

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

| Config 条目                         | 作用                                                 |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | 将本地端口 18789 转发到远程端口 18789               |
| `ssh -N`                             | 不执行远程命令的 SSH（仅端口转发） |
| `KeepAlive`                          | 如果隧道崩溃，自动重启它              |
| `RunAtLoad`                          | 在登录时加载 LaunchAgent 时启动隧道        |

## 相关

- [Tailscale](/zh-CN/gateway/tailscale)
- [认证](/zh-CN/gateway/authentication)
- [远程 Gateway 网关设置](/zh-CN/gateway/remote-gateway-readme)
