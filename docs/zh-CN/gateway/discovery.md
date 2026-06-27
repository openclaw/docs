---
read_when:
    - 实现或更改 Bonjour 设备发现/通告
    - 调整远程连接模式（直连与 SSH）
    - 为远程节点设计设备发现 + 配对
summary: 用于查找 Gateway 网关的节点发现和传输协议（Bonjour、Tailscale、SSH）
title: 设备发现和传输协议
x-i18n:
    generated_at: "2026-05-06T04:09:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f53e1292d9e5b402186c48c777e7e665c790981a64679c783ae8d8a1f170ee1
    source_path: gateway/discovery.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw 有两个表面上看起来相似、但实际不同的问题：

1. **操作员远程控制**：macOS 菜单栏应用控制运行在其他位置的 Gateway 网关。
2. **节点配对**：iOS/Android（以及未来的节点）发现 Gateway 网关并安全配对。

设计目标是把所有网络发现/广播都放在 **Node Gateway 网关**（`openclaw gateway`）中，并让客户端（Mac 应用、iOS）作为消费者。

## 术语

- **Gateway 网关**：一个长期运行的 Gateway 网关进程，拥有状态（会话、配对、节点注册表）并运行渠道。大多数设置中每台主机使用一个；也可以使用隔离的多 Gateway 网关设置。
- **Gateway 网关 WS（控制平面）**：默认位于 `127.0.0.1:18789` 的 WebSocket 端点；可以通过 `gateway.bind` 绑定到 LAN/tailnet。
- **直接 WS 传输**：面向 LAN/tailnet 的 Gateway 网关 WS 端点（不使用 SSH）。
- **SSH 传输（回退）**：通过 SSH 转发 `127.0.0.1:18789` 实现远程控制。
- **旧版 TCP bridge（已移除）**：较早的节点传输（参见
  [Bridge protocol](/zh-CN/gateway/bridge-protocol)）；不再为
  设备发现而广播，也不再属于当前构建的一部分。

协议详情：

- [Gateway 网关协议](/zh-CN/gateway/protocol)
- [Bridge protocol（旧版）](/zh-CN/gateway/bridge-protocol)

## 为什么同时保留直接连接和 SSH

- **直接 WS** 是同一网络和 tailnet 内的最佳用户体验：
  - 通过 Bonjour 在 LAN 上自动发现
  - 配对令牌 + ACL 由 Gateway 网关拥有
  - 不需要 shell 访问；协议表面可以保持紧凑且可审计
- **SSH** 仍然是通用回退：
  - 只要你有 SSH 访问权限，就可以在任何地方工作（即使跨越不相关的网络）
  - 能够避开 multicast/mDNS 问题
  - 除 SSH 外不需要新的入站端口

## 设备发现输入（客户端如何知道 Gateway 网关在哪里）

### 1) Bonjour / DNS-SD 设备发现

Multicast Bonjour 是尽力而为的，且不会跨网络。OpenClaw 也可以通过配置的广域 DNS-SD 域浏览同一个 Gateway 网关信标，因此设备发现可以覆盖：

- 同一 LAN 上的 `local.`
- 用于跨网络设备发现的已配置 unicast DNS-SD 域

目标方向：

- 启用内置 `bonjour` 插件时，**Gateway 网关** 会通过 Bonjour 广播其 WS 端点。该插件会在 macOS 主机上自动启动，在其他位置则需要选择启用。
- 客户端浏览并显示“选择一个 Gateway 网关”列表，然后存储所选端点。

故障排除和信标详情：[Bonjour](/zh-CN/gateway/bonjour)。

#### 服务信标详情

- 服务类型：
  - `_openclaw-gw._tcp`（Gateway 网关传输信标）
- TXT 键（非机密）：
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>`（操作员配置的显示名称）
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789`（Gateway 网关 WS + HTTP）
  - `gatewayTls=1`（仅在启用 TLS 时）
  - `gatewayTlsSha256=<sha256>`（仅在启用 TLS 且指纹可用时）
  - `canvasPort=<port>`（canvas 主机端口；当前在启用 canvas 主机时与 `gatewayPort` 相同）
  - `tailnetDns=<magicdns>`（可选提示；Tailscale 可用时自动检测）
  - `sshPort=<port>`（仅 mDNS 完整模式；广域 DNS-SD 可能省略它，此时 SSH 默认值保持为 `22`）
  - `cliPath=<path>`（仅 mDNS 完整模式；广域 DNS-SD 仍会将其写作远程安装提示）

安全说明：

- Bonjour/mDNS TXT 记录**未经身份验证**。客户端必须仅将 TXT 值视为用户体验提示。
- 路由（主机/端口）应优先使用**已解析的服务端点**（SRV + A/AAAA），而不是 TXT 提供的 `lanHost`、`tailnetDns` 或 `gatewayPort`。
- TLS 固定绝不能允许广播的 `gatewayTlsSha256` 覆盖之前存储的固定值。
- 每当所选路由基于安全/TLS 时，iOS/Android 节点在存储首次固定值之前，都应要求明确确认“信任此指纹”（带外验证）。

启用/禁用/覆盖：

- `openclaw plugins enable bonjour` 启用 LAN multicast 广播。
- `OPENCLAW_DISABLE_BONJOUR=1` 禁用广播。
- 启用 Bonjour 插件且未设置 `OPENCLAW_DISABLE_BONJOUR` 时，
  Bonjour 会在普通主机上广播，并在检测到容器内运行时自动禁用。
  空配置 macOS Gateway 网关启动会自动启用该插件；Linux、
  Windows 和容器化部署需要显式启用。
  仅在主机、macvlan 或其他支持 mDNS 的网络上使用 `0`；使用 `1`
  强制禁用。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制 Gateway 网关绑定模式。
- `OPENCLAW_SSH_PORT` 会在发出 `sshPort` 时覆盖广播的 SSH 端口。
- `OPENCLAW_TAILNET_DNS` 发布 `tailnetDns` 提示（MagicDNS）。
- `OPENCLAW_CLI_PATH` 覆盖广播的 CLI 路径。

### 2) Tailnet（跨网络）

对于 London/Vienna 这类设置，Bonjour 不会有帮助。推荐的“直接”目标是：

- Tailscale MagicDNS 名称（首选）或稳定的 tailnet IP。

如果 Gateway 网关能够检测到自己运行在 Tailscale 下，它会将 `tailnetDns` 发布为客户端的可选提示（包括广域信标）。

macOS 应用现在会在 Gateway 网关设备发现中优先使用 MagicDNS 名称，而不是原始 Tailscale IP。这样可以在 tailnet IP 变化时提升可靠性（例如节点重启或 CGNAT 重新分配后），因为 MagicDNS 名称会自动解析到当前 IP。

对于移动节点配对，设备发现提示不会放宽 tailnet/公网路由上的传输安全：

- iOS/Android 仍然要求安全的首次 tailnet/公网连接路径（`wss://` 或 Tailscale Serve/Funnel）。
- 发现的原始 tailnet IP 是路由提示，而不是使用明文远程 `ws://` 的许可。
- 仍然支持私有 LAN 直接连接 `ws://`。
- 如果你想要最简单的移动节点 Tailscale 路径，请使用 Tailscale Serve，让设备发现和设置代码都解析到同一个安全的 MagicDNS 端点。

### 3) 手动 / SSH 目标

没有直接路由（或禁用了直接路由）时，客户端始终可以通过 SSH 转发 loopback Gateway 网关端口来连接。

参见[远程访问](/zh-CN/gateway/remote)。

## 传输选择（客户端策略）

推荐的客户端行为：

1. 如果已配置配对的直接端点且可达，则使用它。
2. 否则，如果设备发现 在 `local.` 或配置的广域域中找到 Gateway 网关，则提供一个一键“使用此 Gateway 网关”的选择，并将其保存为直接端点。
3. 否则，如果配置了 tailnet DNS/IP，则尝试直接连接。
   对于 tailnet/公网路由上的移动节点，直接连接意味着安全端点，而不是明文远程 `ws://`。
4. 否则，回退到 SSH。

## 配对 + 身份验证（直接传输）

Gateway 网关是节点/客户端准入的事实来源。

- 配对请求在 Gateway 网关中创建/批准/拒绝（参见 [Gateway 网关配对](/zh-CN/gateway/pairing)）。
- Gateway 网关强制执行：
  - 身份验证（令牌 / 密钥对）
  - 作用域/ACL（Gateway 网关不是每个方法的原始代理）
  - 速率限制

## 按组件划分的职责

- **Gateway 网关**：广播设备发现信标，拥有配对决策，并托管 WS 端点。
- **macOS 应用**：帮助你选择 Gateway 网关，显示配对提示，并仅将 SSH 用作回退。
- **iOS/Android 节点**：浏览 Bonjour 作为便利方式，并连接到已配对的 Gateway 网关 WS。

## 相关

- [远程访问](/zh-CN/gateway/remote)
- [Tailscale](/zh-CN/gateway/tailscale)
- [Bonjour 设备发现](/zh-CN/gateway/bonjour)
