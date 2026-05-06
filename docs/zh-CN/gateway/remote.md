---
read_when:
    - 运行远程 Gateway 网关设置或对其进行故障排除
summary: 使用 SSH 隧道（Gateway 网关 WS）和尾网进行远程访问
title: 远程访问
x-i18n:
    generated_at: "2026-05-06T04:10:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6272f4ee9fa52091d461cd70be05ccf01c209c3b26fe98a71752f6ea86ea448
    source_path: gateway/remote.md
    workflow: 16
---

此仓库通过在专用主机（桌面电脑/服务器）上运行单个 Gateway 网关（主节点），并让客户端连接到它，支持“通过 SSH 远程访问”。

- 对于**操作端（你 / macOS 应用）**：SSH 隧道是通用回退方案。
- 对于**节点（iOS/Android 和未来设备）**：按需连接到 Gateway 网关 **WebSocket**（LAN/tailnet 或 SSH 隧道）。

## 核心思路

- Gateway 网关 WebSocket 会绑定到你配置端口上的 **loopback**（默认为 18789）。
- 远程使用时，你通过 SSH 转发该 loopback 端口（或使用 tailnet/VPN 并减少隧道使用）。

## 常见 VPN 和 tailnet 设置

将 **Gateway 网关主机**视为 agent 所在的位置。它拥有会话、认证配置、渠道和状态。你的笔记本电脑、桌面电脑和节点会连接到这台主机。

### 在你的 tailnet 中始终运行的 Gateway 网关

在持久主机（VPS 或家庭服务器）上运行 Gateway 网关，并通过 **Tailscale** 或 SSH 访问它。

- **最佳体验：** 保持 `gateway.bind: "loopback"`，并为控制 UI 使用 **Tailscale Serve**。
- **回退方案：** 保持 loopback，并从任何需要访问的机器建立 SSH 隧道。
- **示例：** [exe.dev](/zh-CN/install/exe-dev)（易用 VM）或 [Hetzner](/zh-CN/install/hetzner)（生产 VPS）。

当你的笔记本电脑经常休眠，但你希望 agent 始终在线时，这是理想选择。

### 家庭桌面电脑运行 Gateway 网关

笔记本电脑**不**运行 agent。它远程连接：

- 使用 macOS 应用的**通过 SSH 远程访问**模式（Settings → General → OpenClaw runs）。
- 应用会打开并管理隧道，因此 WebChat 和健康检查可以直接工作。

运行手册：[macOS 远程访问](/zh-CN/platforms/mac/remote)。

### 笔记本电脑运行 Gateway 网关

保持 Gateway 网关在本地运行，但安全地暴露它：

- 从其他机器通过 SSH 隧道连接到笔记本电脑，或
- 使用 Tailscale Serve 暴露控制 UI，并让 Gateway 网关仅绑定 loopback。

指南：[Tailscale](/zh-CN/gateway/tailscale) 和 [Web 概览](/zh-CN/web)。

## 命令流（在哪里运行什么）

一个 gateway 服务拥有状态 + 渠道。节点是外围设备。

流程示例（Telegram → 节点）：

- Telegram 消息到达 **Gateway 网关**。
- Gateway 网关运行 **agent**，并决定是否调用节点工具。
- Gateway 网关通过 Gateway 网关 WebSocket 调用**节点**（`node.*` RPC）。
- 节点返回结果；Gateway 网关再回复到 Telegram。

注意：

- **节点不运行 gateway 服务。** 除非你有意运行隔离配置，否则每台主机只应运行一个 gateway（见[多个 gateway](/zh-CN/gateway/multiple-gateways)）。
- macOS 应用的“节点模式”只是通过 Gateway 网关 WebSocket 连接的节点客户端。

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

当 gateway 仅限 loopback 时，将 URL 保持为 `ws://127.0.0.1:18789`，并先打开 SSH 隧道。
在 macOS 应用的 SSH 隧道传输中，发现的 gateway 主机名属于
`gateway.remote.sshTarget`；`gateway.remote.url` 仍然是本地隧道 URL。

## 凭证优先级

Gateway 网关凭证解析在 call/probe/status 路径和 Discord 执行审批监控中遵循一套共享契约。Node-host 使用相同的基础契约，但有一个本地模式例外（它会有意忽略 `gateway.remote.*`）：

- 显式凭证（`--token`、`--password` 或工具 `gatewayToken`）在接受显式认证的调用路径上始终优先。
- URL 覆盖安全性：
  - CLI URL 覆盖（`--url`）永远不会复用隐式 config/env 凭证。
  - Env URL 覆盖（`OPENCLAW_GATEWAY_URL`）只能使用 env 凭证（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）。
- 本地模式默认值：
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（仅当本地 auth token 输入未设置时才应用远程回退）
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（仅当本地 auth password 输入未设置时才应用远程回退）
- 远程模式默认值：
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host 本地模式例外：`gateway.remote.token` / `gateway.remote.password` 会被忽略。
- 远程 probe/status token 检查默认严格：在指向远程模式时，它们只使用 `gateway.remote.token`（没有本地 token 回退）。
- Gateway 网关 env 覆盖只使用 `OPENCLAW_GATEWAY_*`。

## 通过 SSH 使用聊天 UI

WebChat 不再使用单独的 HTTP 端口。SwiftUI 聊天 UI 会直接连接到 Gateway 网关 WebSocket。

- 通过 SSH 转发 `18789`（见上文），然后将客户端连接到 `ws://127.0.0.1:18789`。
- 在 macOS 上，优先使用应用的“通过 SSH 远程访问”模式，它会自动管理隧道。

## macOS 应用通过 SSH 远程访问

macOS 菜单栏应用可以端到端驱动同一套设置（远程状态检查、WebChat 和 Voice Wake 转发）。

运行手册：[macOS 远程访问](/zh-CN/platforms/mac/remote)。

## 安全规则（远程/VPN）

简短版本：除非你确定需要绑定，否则**保持 Gateway 网关仅限 loopback**。

- **Loopback + SSH/Tailscale Serve** 是最安全的默认方式（不公开暴露）。
- 明文 `ws://` 默认仅限 loopback。对于受信任的专用网络，
  在客户端进程上设置 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 作为
  break-glass。没有对应的 `openclaw.json` 设置；这必须是建立 WebSocket 连接的客户端进程
  环境。
- **非 loopback 绑定**（`lan`/`tailnet`/`custom`，或 loopback 不可用时的 `auto`）必须使用 gateway auth：token、password，或带有 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。
- `gateway.remote.token` / `.password` 是客户端凭证来源。它们本身**不会**配置服务器认证。
- 仅当 `gateway.auth.*` 未设置时，本地调用路径才可以使用 `gateway.remote.*` 作为回退。
- 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 但无法解析，解析会关闭失败（不会用远程回退掩盖）。
- 使用 `wss://` 时，`gateway.remote.tlsFingerprint` 会固定远程 TLS 证书。
- **Tailscale Serve** 可以在 `gateway.auth.allowTailscale: true` 时通过身份
  标头认证控制 UI/WebSocket 流量；HTTP API 端点不使用
  该 Tailscale 标头认证，而是遵循 gateway 的常规 HTTP
  auth 模式。这个无 token 流程假定 gateway 主机可信。如果你希望所有地方都使用共享密钥认证，请将其设为
  `false`。
- **Trusted-proxy** auth 默认预期非 loopback 的身份感知代理设置。
  同主机 loopback 反向代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。
- 将浏览器控制视为操作端访问：仅限 tailnet + 有意的节点配对。

深入说明：[安全](/zh-CN/gateway/security)。

### macOS：通过 LaunchAgent 持久化 SSH 隧道

对于连接到远程 gateway 的 macOS 客户端，最简单的持久化设置是使用 SSH `LocalForward` 配置项，再加上一个 LaunchAgent，以便在重启和崩溃后保持隧道存活。

#### 步骤 1：添加 SSH 配置

编辑 `~/.ssh/config`：

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

将 `<REMOTE_IP>` 和 `<REMOTE_USER>` 替换为你的值。

#### 步骤 2：复制 SSH 密钥（一次性）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 步骤 3：配置 gateway token

将 token 存储到配置中，使其在重启后仍然保留：

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
| `KeepAlive`                          | 如果隧道崩溃，会自动重启隧道                                 |
| `RunAtLoad`                          | LaunchAgent 在登录时加载后启动隧道                           |

## 相关

- [Tailscale](/zh-CN/gateway/tailscale)
- [认证](/zh-CN/gateway/authentication)
- [远程 gateway 设置](/zh-CN/gateway/remote-gateway-readme)
