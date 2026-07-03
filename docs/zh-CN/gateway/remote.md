---
read_when:
    - 运行或排查远程 Gateway 网关设置
summary: 使用 Gateway 网关 WS、SSH 隧道和尾网进行远程访问
title: 远程访问
x-i18n:
    generated_at: "2026-07-03T23:26:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb6fd38698480f1dff93a6e4819082711e8e4395556a2fd85a8eb772ef6fbe31
    source_path: gateway/remote.md
    workflow: 16
---

此仓库支持远程 Gateway 网关访问，方式是在专用主机（桌面电脑/服务器）上保持单个 Gateway 网关（主网关）运行，并让客户端连接到它。

- 对于 **操作者（你 / macOS 应用）**：当 Gateway 网关可访问时，直接使用 LAN/Tailnet WebSocket 最简单；SSH 隧道是通用备用方案。
- 对于 **节点（iOS/Android 和未来设备）**：连接到 Gateway 网关 **WebSocket**（按需使用 LAN/tailnet 或 SSH 隧道）。

## 核心思路

- Gateway 网关 WebSocket 通常绑定到你配置端口上的 **回环地址**（默认 18789）。
- 对于远程使用，通过 Tailscale Serve、受信任的 LAN/Tailnet 绑定公开它，或通过 SSH 转发回环端口。

## 常见 VPN 和 tailnet 设置

把 **Gateway 网关主机** 理解为智能体所在的位置。它拥有会话、身份验证配置文件、渠道和状态。你的笔记本电脑、台式机和节点都连接到这台主机。

### tailnet 中的常驻 Gateway 网关

在持久主机（VPS 或家庭服务器）上运行 Gateway 网关，并通过 **Tailscale** 或 SSH 访问它。

- **最佳用户体验：** 保持 `gateway.bind: "loopback"`，并对 Control UI 使用 **Tailscale Serve**。
- **受信任的 LAN/Tailnet：** 将 Gateway 网关绑定到私有接口，并使用 `gateway.remote.transport: "direct"` 直接连接。
- **备用方案：** 保持回环绑定，并从任何需要访问的机器建立 SSH 隧道。
- **示例：** [exe.dev](/zh-CN/install/exe-dev)（简单 VM）或 [Hetzner](/zh-CN/install/hetzner)（生产 VPS）。

适用于你的笔记本电脑经常休眠，但你希望智能体始终在线的情况。

### 家庭台式机运行 Gateway 网关

笔记本电脑**不**运行智能体。它远程连接：

- 使用 macOS 应用的远程模式（Settings → General → OpenClaw runs）。
- 当 Gateway 网关可在 LAN/Tailnet 上访问时，应用会直接连接；当你选择 SSH 时，应用会打开并管理 SSH 隧道。

运行手册：[macOS 远程访问](/zh-CN/platforms/mac/remote)。

### 笔记本电脑运行 Gateway 网关

保持 Gateway 网关在本地运行，但安全地公开它：

- 从其他机器到笔记本电脑建立 SSH 隧道，或
- 用 Tailscale Serve 公开 Control UI，并保持 Gateway 网关仅绑定回环地址。

指南：[Tailscale](/zh-CN/gateway/tailscale) 和 [Web 概览](/zh-CN/web)。

## 命令流（什么在哪里运行）

一个 Gateway 网关服务拥有状态 + 渠道。节点是外围设备。

流程示例（Telegram → 节点）：

- Telegram 消息到达 **Gateway 网关**。
- Gateway 网关运行 **智能体**，并决定是否调用节点工具。
- Gateway 网关通过 Gateway 网关 WebSocket（`node.*` RPC）调用 **节点**。
- 节点返回结果；Gateway 网关再回复到 Telegram。

说明：

- **节点不运行 Gateway 网关服务。** 除非你有意运行隔离配置文件，否则每台主机只应运行一个 Gateway 网关（参见 [多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)）。
- macOS 应用的“节点模式”只是一个通过 Gateway 网关 WebSocket 连接的节点客户端。

## SSH 隧道（CLI + 工具）

创建到远程 Gateway 网关 WS 的本地隧道：

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

隧道建立后：

- `openclaw health` 和 `openclaw status --deep` 现在会通过 `ws://127.0.0.1:18789` 访问远程 Gateway 网关。
- `openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe` 和 `openclaw gateway call` 也可以在需要时通过 `--url` 指向已转发的 URL。

<Note>
将 `18789` 替换为你配置的 `gateway.port`（或 `--port` 或 `OPENCLAW_GATEWAY_PORT`）。
</Note>

<Warning>
传入 `--url` 时，CLI 不会回退到配置或环境凭据。请显式包含 `--token` 或 `--password`。缺少显式凭据会报错。
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

当 Gateway 网关仅绑定回环地址时，将 URL 保持为 `ws://127.0.0.1:18789`，并先打开 SSH 隧道。
在 macOS 应用的 SSH 隧道传输中，发现的 Gateway 网关主机名属于
`gateway.remote.sshTarget`；`gateway.remote.url` 保持为本地隧道 URL。
如果这些端口不同，请将 `gateway.remote.remotePort` 设置为 SSH 主机上的
Gateway 网关端口。
主机密钥验证默认是严格的。托管别名可以通过
`gateway.remote.sshHostKeyPolicy: "openssh"` 显式使用其有效的 OpenSSH 信任策略；启用前请检查匹配的用户和系统
SSH 设置。

对于已可在受信任 LAN 或 Tailnet 上访问的 Gateway 网关，使用直接模式：

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

## 凭据优先级

Gateway 网关凭据解析在 call/probe/status 路径和 Discord exec-approval 监控中遵循同一共享契约。Node-host 使用相同的基础契约，但有一个本地模式例外（它会有意忽略 `gateway.remote.*`）：

- 显式凭据（`--token`、`--password` 或工具 `gatewayToken`）在接受显式身份验证的调用路径上始终优先。
- URL 覆盖安全性：
  - CLI URL 覆盖（`--url`）绝不会复用隐式配置/环境凭据。
  - 环境 URL 覆盖（`OPENCLAW_GATEWAY_URL`）只能使用环境凭据（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）。
- 本地模式默认值：
  - token：`OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（仅当本地身份验证 token 输入未设置时才应用远程备用）
  - password：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（仅当本地身份验证 password 输入未设置时才应用远程备用）
- 远程模式默认值：
  - token：`gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host 本地模式例外：`gateway.remote.token` / `gateway.remote.password` 会被忽略。
- 远程 probe/status token 检查默认是严格的：在指向远程模式时，它们仅使用 `gateway.remote.token`（没有本地 token 备用）。
- Gateway 网关环境覆盖只使用 `OPENCLAW_GATEWAY_*`。

## Chat UI 远程访问

WebChat 不再使用单独的 HTTP 端口。SwiftUI 聊天 UI 会直接连接到 Gateway 网关 WebSocket。

- 通过 SSH 转发 `18789`（见上文），然后将客户端连接到 `ws://127.0.0.1:18789`。
- 对于 LAN/Tailnet 直接模式，将客户端连接到配置的私有 `ws://` 或安全 `wss://` URL。
- 在 macOS 上，优先使用应用的远程模式，它会自动管理所选传输。

## macOS 应用远程模式

macOS 菜单栏应用可以端到端驱动同一套设置（远程状态检查、WebChat 和 Voice Wake 转发）。

运行手册：[macOS 远程访问](/zh-CN/platforms/mac/remote)。

## 安全规则（远程/VPN）

简短版本：除非你确定需要绑定，否则**保持 Gateway 网关仅绑定回环地址**。

- **回环地址 + SSH/Tailscale Serve** 是最安全的默认值（不公开暴露）。
- 明文 `ws://` 可用于回环地址、LAN、链路本地、`.local`、`.ts.net` 和 Tailscale CGNAT 主机。公共远程主机必须使用 `wss://`。
- **非回环绑定**（`lan`/`tailnet`/`custom`，或回环不可用时的 `auto`）必须使用 Gateway 网关身份验证：token、password，或带有 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。
- `gateway.remote.token` / `.password` 是客户端凭据来源。它们本身**不会**配置服务器身份验证。
- 只有当 `gateway.auth.*` 未设置时，本地调用路径才可以使用 `gateway.remote.*` 作为备用。
- 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 显式配置但未解析，解析会失败关闭（不会用远程备用来掩盖）。
- 使用 `wss://` 时，`gateway.remote.tlsFingerprint` 会固定远程 TLS 证书，包括 macOS 直接模式。没有配置或先前存储的固定值时，macOS 只会在普通系统信任通过后固定首次使用的证书；macOS 尚不信任的自签名或私有 CA Gateway 网关需要显式指纹或通过 SSH 远程连接。
- 当 `gateway.auth.allowTailscale: true` 时，**Tailscale Serve** 可以通过身份
  标头对 Control UI/WebSocket 流量进行身份验证；HTTP API 端点不使用
  该 Tailscale 标头身份验证，而是遵循 Gateway 网关的普通 HTTP
  身份验证模式。此无 token 流程假设 Gateway 网关主机可信。如果你希望所有位置都使用共享密钥身份验证，请将其设置为
  `false`。
- **Trusted-proxy** 身份验证默认期望非回环的身份感知代理设置。
  同主机回环反向代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。
- 将浏览器控制视为操作者访问：仅 tailnet + 有意的节点配对。

深入了解：[安全](/zh-CN/gateway/security)。

### macOS：通过 LaunchAgent 持久化 SSH 隧道

对于连接到远程 Gateway 网关的 macOS 客户端，最简单的持久化设置是使用 SSH `LocalForward` 配置条目，再加上 LaunchAgent，以便在重启和崩溃后保持隧道存活。

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

#### 第 3 步：配置 Gateway 网关 token

将 token 存储在配置中，使其在重启后仍保留：

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### 第 4 步：创建 LaunchAgent

将此内容保存为 `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`：

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

隧道会在登录时自动启动，在崩溃后重启，并保持转发端口可用。

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

| 配置条目                             | 作用                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | 将本地端口 18789 转发到远程端口 18789                       |
| `ssh -N`                             | 不执行远程命令的 SSH（仅端口转发）                           |
| `KeepAlive`                          | 如果隧道崩溃，自动重启隧道                                  |
| `RunAtLoad`                          | 在登录时 LaunchAgent 加载后启动隧道                         |

## 相关

- [Tailscale](/zh-CN/gateway/tailscale)
- [身份验证](/zh-CN/gateway/authentication)
- [远程 Gateway 网关设置](/zh-CN/gateway/remote-gateway-readme)
