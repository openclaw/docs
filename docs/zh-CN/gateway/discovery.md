---
read_when:
    - 实现或更改 Bonjour 设备发现/通告
    - 调整远程连接模式（直接连接与 SSH）
    - 为远程节点设计设备发现 + 配对
summary: 用于查找 Gateway 网关的节点设备发现和传输协议（Bonjour、Tailscale、SSH）
title: 设备发现和传输协议
x-i18n:
    generated_at: "2026-05-03T18:19:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41a5ed7a910ae4bbdfa21a81882c3b1af0c16622fa20a5e616b666390dccdc9c
    source_path: gateway/discovery.md
    workflow: 16
---

# 设备发现与传输协议

OpenClaw 有两个表面上相似但实际不同的问题：

1. **操作员远程控制**：macOS 菜单栏应用控制运行在其他位置的 Gateway 网关。
2. **节点配对**：iOS/Android（以及未来节点）查找 Gateway 网关并安全配对。

设计目标是将所有网络发现/广播保留在 **节点 Gateway 网关**（`openclaw gateway`）中，并让客户端（Mac 应用、iOS）作为消费者。

## 术语

- **Gateway 网关**：单个长期运行的 Gateway 网关进程，拥有状态（会话、配对、节点注册表）并运行渠道。大多数设置每台主机使用一个；也可以使用隔离的多 Gateway 网关设置。
- **Gateway 网关 WS（控制平面）**：默认位于 `127.0.0.1:18789` 的 WebSocket 端点；可以通过 `gateway.bind` 绑定到 LAN/tailnet。
- **Direct WS 传输协议**：面向 LAN/tailnet 的 Gateway 网关 WS 端点（无 SSH）。
- **SSH 传输协议（回退）**：通过 SSH 转发 `127.0.0.1:18789` 进行远程控制。
- **旧版 TCP 桥接（已移除）**：较旧的节点传输协议（参见
  [Bridge protocol](/zh-CN/gateway/bridge-protocol)）；不再为
  设备发现做广播，也不再是当前构建的一部分。

协议详情：

- [Gateway 网关协议](/zh-CN/gateway/protocol)
- [Bridge protocol（旧版）](/zh-CN/gateway/bridge-protocol)

## 为什么同时保留“direct”和 SSH

- **Direct WS** 在同一网络和 tailnet 内提供最佳用户体验：
  - 通过 Bonjour 在 LAN 上自动设备发现
  - 配对令牌 + ACL 由 Gateway 网关拥有
  - 不需要 shell 访问；协议表面可以保持紧凑且易于审计
- **SSH** 仍然是通用回退：
  - 只要你有 SSH 访问权限即可使用（即使跨不相关网络）
  - 可避开 multicast/mDNS 问题
  - 除 SSH 外不需要新的入站端口

## 设备发现输入（客户端如何获知 Gateway 网关位置）

### 1) Bonjour / DNS-SD 设备发现

多播 Bonjour 是尽力而为的，并且不会跨网络。OpenClaw 也可以通过配置的广域 DNS-SD 域浏览
同一个 Gateway 网关信标，因此设备发现可以覆盖：

- 同一 LAN 上的 `local.`
- 用于跨网络设备发现的已配置单播 DNS-SD 域

目标方向：

- 启用内置
  `bonjour` 插件时，**Gateway 网关** 会通过 Bonjour 广播其 WS 端点。该插件会在 macOS 主机上自动启动，在其他位置需要
  选择启用。
- 客户端浏览并显示“选择一个 Gateway 网关”列表，然后存储所选端点。

故障排除和信标详情：[Bonjour](/zh-CN/gateway/bonjour)。

#### 服务信标详情

- 服务类型：
  - `_openclaw-gw._tcp`（Gateway 网关传输协议信标）
- TXT 键名（非密钥）：
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>`（操作员配置的显示名称）
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789`（Gateway 网关 WS + HTTP）
  - `gatewayTls=1`（仅在启用 TLS 时）
  - `gatewayTlsSha256=<sha256>`（仅在启用 TLS 且指纹可用时）
  - `canvasPort=<port>`（canvas 主机端口；当前在启用 canvas 主机时与 `gatewayPort` 相同）
  - `tailnetDns=<magicdns>`（可选提示；当 Tailscale 可用时自动检测）
  - `sshPort=<port>`（仅 mDNS 完整模式；广域 DNS-SD 可以省略它，在这种情况下 SSH 默认值保持为 `22`）
  - `cliPath=<path>`（仅 mDNS 完整模式；广域 DNS-SD 仍会将其写入为远程安装提示）

安全说明：

- Bonjour/mDNS TXT 记录是**未经身份验证的**。客户端必须仅将 TXT 值视为用户体验提示。
- 路由（主机/端口）应优先使用**已解析的服务端点**（SRV + A/AAAA），而不是 TXT 提供的 `lanHost`、`tailnetDns` 或 `gatewayPort`。
- TLS 固定绝不能允许广播的 `gatewayTlsSha256` 覆盖以前存储的固定值。
- 每当所选路由基于安全/TLS 时，iOS/Android 节点应在存储首次固定值之前要求明确确认“信任此指纹”（带外验证）。

启用/禁用/覆盖：

- `openclaw plugins enable bonjour` 启用 LAN 多播广播。
- `OPENCLAW_DISABLE_BONJOUR=1` 禁用广播。
- 当启用 Bonjour 插件且未设置 `OPENCLAW_DISABLE_BONJOUR` 时，
  Bonjour 会在普通主机上广播，并在检测到的容器内自动禁用。
  空配置 macOS Gateway 网关启动会自动启用该插件；Linux、
  Windows 和容器化部署需要显式启用。
  仅在主机、macvlan 或其他支持 mDNS 的网络上使用 `0`；使用 `1`
  强制禁用。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制 Gateway 网关绑定模式。
- `OPENCLAW_SSH_PORT` 会覆盖发出 `sshPort` 时广播的 SSH 端口。
- `OPENCLAW_TAILNET_DNS` 发布 `tailnetDns` 提示（MagicDNS）。
- `OPENCLAW_CLI_PATH` 覆盖广播的 CLI 路径。

### 2) Tailnet（跨网络）

对于伦敦/维也纳式设置，Bonjour 无法提供帮助。推荐的“direct”目标是：

- Tailscale MagicDNS 名称（首选）或稳定的 tailnet IP。

如果 Gateway 网关能检测到自身在 Tailscale 下运行，它会发布 `tailnetDns` 作为客户端的可选提示（包括广域信标）。

macOS 应用现在会优先使用 MagicDNS 名称而不是原始 Tailscale IP 来进行 Gateway 网关设备发现。这会在 tailnet IP 变化时提高可靠性（例如节点重启或 CGNAT 重新分配后），因为 MagicDNS 名称会自动解析到当前 IP。

对于移动节点配对，设备发现提示不会放宽 tailnet/公共路由上的传输安全：

- iOS/Android 仍需要安全的首次 tailnet/公共连接路径（`wss://` 或 Tailscale Serve/Funnel）。
- 发现的原始 tailnet IP 是路由提示，而不是使用明文远程 `ws://` 的权限。
- 私有 LAN 直连 `ws://` 仍受支持。
- 如果你想为移动节点使用最简单的 Tailscale 路径，请使用 Tailscale Serve，这样设备发现和设置代码都会解析到相同的安全 MagicDNS 端点。

### 3) 手动 / SSH 目标

当没有 direct 路由（或 direct 已禁用）时，客户端始终可以通过转发 loopback Gateway 网关端口来经 SSH 连接。

参见[远程访问](/zh-CN/gateway/remote)。

## 传输协议选择（客户端策略）

推荐的客户端行为：

1. 如果已配置且可达的已配对 direct 端点存在，则使用它。
2. 否则，如果设备发现找到 `local.` 或已配置广域域上的 Gateway 网关，则提供一键“使用此 Gateway 网关”选择，并将其保存为 direct 端点。
3. 否则，如果配置了 tailnet DNS/IP，则尝试 direct。
   对于 tailnet/公共路由上的移动节点，direct 指安全端点，而不是明文远程 `ws://`。
4. 否则，回退到 SSH。

## 配对 + 身份验证（direct 传输协议）

Gateway 网关是节点/客户端准入的事实来源。

- 配对请求在 Gateway 网关中创建/批准/拒绝（参见 [Gateway 网关配对](/zh-CN/gateway/pairing)）。
- Gateway 网关会强制执行：
  - 身份验证（令牌 / 密钥对）
  - 范围/ACL（Gateway 网关不是每个方法的原始代理）
  - 速率限制

## 按组件划分的职责

- **Gateway 网关**：广播设备发现信标，拥有配对决策，并托管 WS 端点。
- **macOS 应用**：帮助你选择 Gateway 网关，显示配对提示，并仅将 SSH 用作回退。
- **iOS/Android 节点**：为方便而浏览 Bonjour，并连接到已配对的 Gateway 网关 WS。

## 相关

- [远程访问](/zh-CN/gateway/remote)
- [Tailscale](/zh-CN/gateway/tailscale)
- [Bonjour 设备发现](/zh-CN/gateway/bonjour)
