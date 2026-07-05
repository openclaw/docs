---
read_when:
    - 运行或排查远程 Gateway 网关设置
summary: 使用 Gateway 网关 WS、SSH 隧道和尾网进行远程访问
title: 远程访问
x-i18n:
    generated_at: "2026-07-05T11:21:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw 在一台主机上运行一个 Gateway 网关（主节点），并将每个客户端连接到它。Gateway 网关拥有会话、凭证配置、渠道和状态；其他所有内容都是客户端。

- **操作员**（你，或 macOS 应用）：当 Gateway 网关可访问时，直接 LAN/Tailnet WebSocket 最简单；SSH 隧道是通用回退方案。
- **节点**（iOS/Android 和其他设备）：连接到 Gateway 网关 **WebSocket**（LAN/tailnet 或 SSH 隧道）。

## 核心思路

Gateway 网关 WebSocket 默认绑定到 **loopback**，端口为 `18789`（`gateway.port`）。对于远程使用，可以通过 Tailscale Serve / 受信任的 LAN-Tailnet 绑定公开它，或通过 SSH 转发 loopback 端口。

## 拓扑选项

| 设置                              | Gateway 网关运行位置                                                                                      | 最适合                                                                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| tailnet 中始终在线的 Gateway 网关 | 持久主机（VPS 或家用服务器），通过 Tailscale 或 SSH 访问                                                  | 经常休眠但需要智能体始终在线的笔记本电脑。参见 [exe.dev](/zh-CN/install/exe-dev)（易用 VM）或 [Hetzner](/zh-CN/install/hetzner)（生产 VPS）。                 |
| 家用台式机                        | 台式机；笔记本电脑通过 macOS 应用的远程模式连接（设置 → 连接 → OpenClaw 运行位置）                       | 将智能体保留在持续供电的硬件上。运行手册：[macOS 远程访问](/zh-CN/platforms/mac/remote)。                                                               |
| 笔记本电脑                        | 笔记本电脑，通过 SSH 隧道或 Tailscale Serve 安全公开（保留 `gateway.bind: "loopback"`）                   | 单机设置。参见 [Tailscale](/zh-CN/gateway/tailscale) 和 [Web](/zh-CN/web)。                                                                                   |

对于始终在线和笔记本电脑设置，优先保留 `gateway.bind: "loopback"`，并为 Control UI 使用 **Tailscale Serve**，或使用受信任的 LAN/Tailnet 绑定并设置 `gateway.remote.transport: "direct"`。SSH 隧道是可从任何机器使用的回退方案。

## 命令流（哪里运行什么）

一个 Gateway 网关拥有状态和渠道；节点是外设。示例（Telegram 消息路由到节点工具）：

1. Telegram 消息到达 **Gateway 网关**。
2. Gateway 网关运行**智能体**，由它决定是否调用节点工具。
3. Gateway 网关通过 Gateway 网关 WebSocket（`node.invoke` RPC）调用**节点**。
4. 节点返回结果；Gateway 网关回复 Telegram。

节点不会运行 Gateway 网关服务。除非你有意运行隔离配置文件（参见 [多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)），否则每台主机只应运行一个 Gateway 网关。macOS 应用的“节点模式”只是通过 Gateway 网关 WebSocket 连接的节点客户端。

## SSH 隧道（CLI + 工具）

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

隧道建立后，`openclaw health` 和 `openclaw status --deep` 会通过 `ws://127.0.0.1:18789` 访问远程 Gateway 网关。`openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe` 和 `openclaw gateway call` 也可以通过 `--url` 指向转发后的 URL。

<Note>
将 `18789` 替换为你配置的 `gateway.port`（或 `--port` / `OPENCLAW_GATEWAY_PORT`）。
</Note>

<Warning>
`--url` 绝不会回退到配置或环境凭据。请显式传入 `--token` 或 `--password`；如果没有它们，客户端不会发送凭据，并且当目标 Gateway 网关要求认证时连接会失败。
</Warning>

## CLI 远程默认值

持久保存一个远程目标，让 CLI 命令默认使用它：

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

当 Gateway 网关仅限 loopback 时，将 URL 保持为 `ws://127.0.0.1:18789`，并先打开 SSH 隧道。在 macOS 应用的 SSH 隧道传输中，发现到的 Gateway 网关主机名放在 `gateway.remote.sshTarget`（`user@host` 或 `user@host:port`）；`gateway.remote.url` 保持为本地隧道 URL。如果远程端口与本地端口不同，请设置 `gateway.remote.remotePort`。

主机密钥验证默认是严格的（`gateway.remote.sshHostKeyPolicy: "strict"`）。将其设置为 `"openssh"` 可改为委托给你的有效 OpenSSH 配置；启用前请检查你的用户和系统 SSH 设置。

对于已经可在受信任 LAN 或 Tailnet 上访问的 Gateway 网关，请使用直连模式：

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

Gateway 网关凭据解析在 call/probe/status 路径和 Discord exec-approval 监控中遵循同一个共享契约。Node-host 使用同一个契约，但有一个本地模式例外（它会忽略 `gateway.remote.*`）。

- 显式凭据（`--token`、`--password`，或工具的 `gatewayToken`）在接受显式认证的调用路径中始终优先。
- URL 覆盖安全规则：
  - CLI `--url` 绝不会复用隐式配置/环境凭据。
  - 环境变量 `OPENCLAW_GATEWAY_URL` 只能使用环境凭据（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）。
- 本地模式默认值：
  - token：`OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（仅当本地 token 未设置时才使用远程回退）
  - password：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（仅当本地 password 未设置时才使用远程回退）
- 远程模式默认值：
  - token：`gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host 本地模式例外：`gateway.remote.token` / `gateway.remote.password` 会被忽略。
- 远程 probe/status token 检查默认是严格的：当目标为远程模式时，它们只使用 `gateway.remote.token`（没有本地 token 回退）。
- Gateway 网关环境覆盖只使用 `OPENCLAW_GATEWAY_*`。

## Chat UI 远程访问

WebChat 没有单独的 HTTP 端口；SwiftUI 聊天 UI 会直接连接到 Gateway 网关 WebSocket。

- 通过 SSH 转发 `18789`（见上文），然后将客户端连接到 `ws://127.0.0.1:18789`。
- 对于 LAN/Tailnet 直连模式，将客户端连接到已配置的私有 `ws://` 或安全 `wss://` URL。
- 在 macOS 上，应用的远程模式会自动管理所选传输方式。

## macOS 应用远程模式

macOS 菜单栏应用驱动同一套端到端设置：远程状态检查、WebChat 和 Voice Wake 转发。运行手册：[macOS 远程访问](/zh-CN/platforms/mac/remote)。

## 安全规则（远程/VPN）

除非你确定需要绑定，否则保持 Gateway 网关**仅限 loopback**。

- **Loopback + SSH/Tailscale Serve** 是最安全的默认值（无公开暴露）。
- 明文 `ws://` 可用于 loopback、私有/LAN（RFC 1918）、link-local、CGNAT、`.local` 和 `.ts.net` 主机。公共远程主机必须使用 `wss://`。
- **非 loopback 绑定**（`lan`/`tailnet`/`custom`，或 loopback 不可用时的 `auto`）必须使用 Gateway 网关认证：token、password，或带有 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。
- `gateway.remote.token` / `.password` 是客户端凭据来源；它们本身不会配置服务器认证。
- 只有当 `gateway.auth.*` 未设置时，本地调用路径才可以将 `gateway.remote.*` 作为回退。
- 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 显式配置但无法解析，解析会失败关闭（不会用远程回退来掩盖）。
- `gateway.remote.tlsFingerprint` 会为 `wss://` 固定远程 TLS 证书，包括 macOS 直连模式。没有存储 pin 时，macOS 只会在正常系统信任通过后的首次使用时固定；自签名或私有 CA Gateway 网关需要显式指纹，或使用 Remote over SSH。
- **Tailscale Serve** 可在 `gateway.auth.allowTailscale: true` 时通过身份标头认证 Control UI/WebSocket 流量。HTTP API 端点不会使用该标头认证，而是遵循 Gateway 网关的常规 HTTP 认证模式。这个无 token 流程假设 Gateway 网关主机受信任；如需在所有位置使用共享密钥认证，请将其设置为 `false`。
- **Trusted-proxy** 认证默认要求非 loopback 的身份感知代理。同主机 loopback 反向代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。
- 像对待操作员访问一样对待浏览器控制：仅限 tailnet，并进行有意的节点配对。

深入了解：[安全](/zh-CN/gateway/security)。

### macOS：通过 LaunchAgent 持久化 SSH 隧道

对于 macOS 客户端，最简单的持久设置使用一个 SSH `LocalForward` 配置项，再加上一个 LaunchAgent，让隧道在重启和崩溃后保持存活。

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

```bash
openclaw config set gateway.remote.token "<your-token>"
```

如果远程 Gateway 网关使用 password 认证，请改用 `gateway.remote.password`。`OPENCLAW_GATEWAY_TOKEN` 仍可作为 shell 级覆盖使用，但持久的远程客户端设置是 `gateway.remote.token` / `gateway.remote.password`。

#### 步骤 4：创建 LaunchAgent

保存为 `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`：

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

隧道会在登录时自动启动，在崩溃后重启，并保持转发端口可用。

<Note>
如果你有旧设置遗留的 `com.openclaw.ssh-tunnel` LaunchAgent，请卸载并删除它。
</Note>

#### 故障排查

```bash
# Check if the tunnel is running
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# Restart the tunnel
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# Stop the tunnel
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| 配置项                               | 作用                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | 将本地端口 18789 转发到远程端口 18789                       |
| `ssh -N`                             | 不执行远程命令的 SSH（仅端口转发）                          |
| `KeepAlive`                          | 如果隧道崩溃，自动重启隧道                                  |
| `RunAtLoad`                          | LaunchAgent 在登录时加载后启动隧道                          |

## 相关

- [Tailscale](/zh-CN/gateway/tailscale)
- [Authentication](/zh-CN/gateway/authentication)
- [Remote gateway setup](/zh-CN/gateway/remote-gateway-readme)
