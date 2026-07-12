---
read_when:
    - 运行或排查远程 Gateway 网关设置问题
summary: 通过 Gateway 网关 WebSocket、SSH 隧道和 tailnet 进行远程访问
title: 远程访问
x-i18n:
    generated_at: "2026-07-11T20:32:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw 在一台主机上运行一个 Gateway 网关（主节点），并将所有客户端连接到该网关。Gateway 网关负责管理会话、身份验证配置文件、渠道和状态；其他所有组件都是客户端。

- **操作员**（你或 macOS 应用）：当 Gateway 网关可访问时，直接使用局域网/Tailnet WebSocket 最简单；SSH 隧道则是通用的后备方案。
- **节点**（iOS/Android 和其他设备）：连接到 Gateway 网关的 **WebSocket**（通过局域网/Tailnet 或 SSH 隧道）。

## 核心思路

Gateway 网关的 WebSocket 默认绑定到 **回环地址**，端口为 `18789`（`gateway.port`）。如需远程使用，可以通过 Tailscale Serve / 受信任的局域网-Tailnet 绑定将其公开，或通过 SSH 转发回环端口。

## 拓扑选项

| 设置                                 | Gateway 网关的运行位置                                                                                       | 最适合                                                                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tailnet 中始终在线的 Gateway 网关    | 持久在线主机（VPS 或家庭服务器），通过 Tailscale 或 SSH 访问                                                  | 经常休眠但需要智能体始终在线的笔记本电脑。参阅 [exe.dev](/zh-CN/install/exe-dev)（简易虚拟机）或 [Hetzner](/zh-CN/install/hetzner)（生产环境 VPS）。                  |
| 家用台式机                           | 台式机；笔记本电脑通过 macOS 应用的远程模式连接（设置 → 连接 → OpenClaw 运行位置）                            | 将智能体运行在持续通电的硬件上。操作手册：[macOS 远程访问](/zh-CN/platforms/mac/remote)。                                                                    |
| 笔记本电脑                           | 笔记本电脑，通过 SSH 隧道或 Tailscale Serve 安全公开（保持 `gateway.bind: "loopback"`）                       | 单机设置。参阅 [Tailscale](/zh-CN/gateway/tailscale) 和 [Web](/zh-CN/web)。                                                                                        |

对于始终在线和笔记本电脑设置，建议保持 `gateway.bind: "loopback"`，并使用 **Tailscale Serve** 访问 Control UI，或使用受信任的局域网/Tailnet 绑定并配置 `gateway.remote.transport: "direct"`。SSH 隧道是适用于任何计算机的后备方案。

## 命令流（各部分在哪里运行）

一个 Gateway 网关负责管理状态和渠道；节点是外围设备。示例（将 Telegram 消息路由到节点工具）：

1. Telegram 消息到达 **Gateway 网关**。
2. Gateway 网关运行**智能体**，由智能体决定是否调用节点工具。
3. Gateway 网关通过 Gateway 网关 WebSocket（`node.invoke` RPC）调用**节点**。
4. 节点返回结果；Gateway 网关回复 Telegram。

节点不运行 Gateway 网关服务。除非你有意运行相互隔离的配置文件，否则每台主机只应运行一个 Gateway 网关（参阅[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)）。macOS 应用的“节点模式”只是通过 Gateway 网关 WebSocket 连接的节点客户端。

## SSH 隧道（CLI + 工具）

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

隧道建立后，`openclaw health` 和 `openclaw status --deep` 会通过 `ws://127.0.0.1:18789` 访问远程 Gateway 网关。`openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe` 和 `openclaw gateway call` 也可以通过 `--url` 指定转发后的 URL。

<Note>
请将 `18789` 替换为你配置的 `gateway.port`（或 `--port` / `OPENCLAW_GATEWAY_PORT`）。
</Note>

<Warning>
`--url` 绝不会回退使用配置或环境变量中的凭据。请显式传入 `--token` 或 `--password`；如果未传入，客户端不会发送任何凭据，而当目标 Gateway 网关要求身份验证时，连接将失败。
</Warning>

## CLI 远程默认值

持久保存远程目标，使 CLI 命令默认使用该目标：

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

当 Gateway 网关仅绑定到回环地址时，请将 URL 保持为 `ws://127.0.0.1:18789`，并先打开 SSH 隧道。在 macOS 应用的 SSH 隧道传输方式中，发现的 Gateway 网关主机名应填入 `gateway.remote.sshTarget`（`user@host` 或 `user@host:port`）；`gateway.remote.url` 仍应使用本地隧道 URL。如果远程端口与本地端口不同，请设置 `gateway.remote.remotePort`。

默认严格验证主机密钥（`gateway.remote.sshHostKeyPolicy: "strict"`）。将其设置为 `"openssh"` 可改为使用你实际生效的 OpenSSH 配置；启用前请检查你的用户级和系统级 SSH 设置。

对于已经可通过受信任局域网或 Tailnet 访问的 Gateway 网关，请使用直连模式：

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

在调用、探测和状态路径以及 Discord Exec 审批监控中，Gateway 网关凭据解析遵循统一约定。节点主机使用相同约定，但有一个本地模式例外（它会忽略 `gateway.remote.*`）。

- 在接受显式身份验证的调用路径上，显式凭据（`--token`、`--password` 或工具的 `gatewayToken`）始终优先。
- URL 覆盖安全规则：
  - CLI 的 `--url` 绝不会复用隐式的配置/环境变量凭据。
  - 环境变量 `OPENCLAW_GATEWAY_URL` 只能使用环境变量凭据（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）。
- 本地模式默认值：
  - 令牌：`OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（仅在未设置本地令牌时回退到远程令牌）
  - 密码：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（仅在未设置本地密码时回退到远程密码）
- 远程模式默认值：
  - 令牌：`gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - 密码：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- 节点主机的本地模式例外：忽略 `gateway.remote.token` / `gateway.remote.password`。
- 默认严格执行远程探测/状态令牌检查：以远程模式为目标时，只使用 `gateway.remote.token`（不回退到本地令牌）。
- Gateway 网关的环境变量覆盖仅使用 `OPENCLAW_GATEWAY_*`。

## 聊天界面的远程访问

WebChat 没有独立的 HTTP 端口；SwiftUI 聊天界面会直接连接到 Gateway 网关 WebSocket。

- 通过 SSH 转发 `18789`（见上文），然后将客户端连接到 `ws://127.0.0.1:18789`。
- 对于局域网/Tailnet 直连模式，将客户端连接到配置的私有 `ws://` 或安全 `wss://` URL。
- 在 macOS 上，应用的远程模式会自动管理所选传输方式。

## macOS 应用远程模式

macOS 菜单栏应用会端到端管理同一套设置：远程状态检查、WebChat 和语音唤醒转发。操作手册：[macOS 远程访问](/zh-CN/platforms/mac/remote)。

## 安全规则（远程/VPN）

除非你确定需要绑定到其他地址，否则请让 Gateway 网关**仅绑定到回环地址**。

- **回环地址 + SSH/Tailscale Serve** 是最安全的默认方案（不会公开暴露）。
- 对于回环地址、私有网络/局域网（RFC 1918）、链路本地地址、CGNAT、`.local` 和 `.ts.net` 主机，可以使用明文 `ws://`。公共远程主机必须使用 `wss://`。
- **非回环地址绑定**（`lan`/`tailnet`/`custom`，或在回环地址不可用时使用 `auto`）必须启用 Gateway 网关身份验证：令牌、密码，或设置了 `gateway.auth.mode: "trusted-proxy"` 的身份感知型反向代理。
- `gateway.remote.token` / `.password` 是客户端凭据来源；它们本身不会配置服务器身份验证。
- 仅当未设置 `gateway.auth.*` 时，本地调用路径才可回退使用 `gateway.remote.*`。
- 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password`，但无法解析，解析过程将以关闭方式失败（不会使用远程回退来掩盖问题）。
- `gateway.remote.tlsFingerprint` 会固定 `wss://` 远程 TLS 证书，包括 macOS 直连模式。如果没有已存储的指纹，macOS 只会在常规系统信任检查通过后首次使用时固定证书；使用自签名证书或私有 CA 的 Gateway 网关需要显式指纹，或使用基于 SSH 的远程连接。
- 当 `gateway.auth.allowTailscale: true` 时，**Tailscale Serve** 可以通过身份标头对 Control UI/WebSocket 流量进行身份验证。HTTP API 端点不使用这种标头身份验证，而是遵循 Gateway 网关的常规 HTTP 身份验证模式。此无令牌流程假设 Gateway 网关主机可信；如需在所有位置使用共享密钥身份验证，请将其设置为 `false`。
- 默认情况下，**受信任代理**身份验证要求使用非回环地址的身份感知型代理。同一主机上的回环地址反向代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。
- 请将浏览器控制视为操作员访问：仅限 Tailnet，并有意执行节点配对。

深入了解：[安全性](/zh-CN/gateway/security)。

### macOS：通过 LaunchAgent 建立持久 SSH 隧道

对于 macOS 客户端，最简单的持久设置方式是使用 SSH `LocalForward` 配置项，并配合一个 LaunchAgent，使隧道在重启或崩溃后保持运行。

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

#### 第 2 步：复制 SSH 密钥（仅需一次）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 第 3 步：配置 Gateway 网关令牌

```bash
openclaw config set gateway.remote.token "<your-token>"
```

如果远程 Gateway 网关使用密码身份验证，请改用 `gateway.remote.password`。`OPENCLAW_GATEWAY_TOKEN` 仍可用作 Shell 级覆盖，但持久的远程客户端设置应使用 `gateway.remote.token` / `gateway.remote.password`。

#### 第 4 步：创建 LaunchAgent

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

#### 第 5 步：加载 LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

隧道会在登录时自动启动，在崩溃后重新启动，并使转发端口保持可用。

<Note>
如果旧设置遗留了 `com.openclaw.ssh-tunnel` LaunchAgent，请将其卸载并删除。
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

| 配置项                               | 作用                                                   |
| ------------------------------------ | ------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | 将本地端口 18789 转发到远程端口 18789                  |
| `ssh -N`                             | 不执行远程命令的 SSH（仅进行端口转发）                 |
| `KeepAlive`                          | 隧道崩溃时自动重新启动                                 |
| `RunAtLoad`                          | 登录时加载 LaunchAgent 后启动隧道                     |

## 相关内容

- [Tailscale](/zh-CN/gateway/tailscale)
- [身份验证](/zh-CN/gateway/authentication)
- [远程 Gateway 网关设置](/zh-CN/gateway/remote-gateway-readme)
