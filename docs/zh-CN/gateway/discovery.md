---
read_when:
    - 实现或更改 Bonjour 设备发现/广播
    - 调整远程连接模式（直连与 SSH）
    - 为远程节点设计设备发现 + 配对
summary: 用于查找 Gateway 网关的节点发现和传输协议（Bonjour、Tailscale、SSH）
title: 设备发现和传输协议
x-i18n:
    generated_at: "2026-04-26T23:09:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: c396e6e07808e2571c6d7f539922b94443adbf39339027e6e962596c6f13deaa
    source_path: gateway/discovery.md
    workflow: 15
---

# 设备发现和传输协议

OpenClaw 有两个彼此不同、但表面上看起来相似的问题：

1. **操作员远程控制**：macOS 菜单栏应用控制运行在其他位置的 Gateway 网关。
2. **节点配对**：iOS/Android（以及未来的节点）发现 Gateway 网关并进行安全配对。

设计目标是将所有网络发现/广播都保留在 **Node Gateway**（`openclaw gateway`）中，并让客户端（mac 应用、iOS）作为消费者。

## 术语

- **Gateway 网关**：单个长期运行的 Gateway 网关进程，负责管理状态（会话、配对、节点注册表）并运行渠道。大多数部署在每台主机上使用一个；也可以进行隔离的多 Gateway 网关部署。
- **Gateway WS（控制平面）**：默认位于 `127.0.0.1:18789` 的 WebSocket 端点；可通过 `gateway.bind` 绑定到 LAN/tailnet。
- **直连 WS 传输**：面向 LAN/tailnet 的 Gateway WS 端点（不使用 SSH）。
- **SSH 传输（回退方案）**：通过 SSH 转发 `127.0.0.1:18789` 实现远程控制。
- **旧版 TCP bridge（已移除）**：较早的节点传输方式（参见 [Bridge protocol（旧版节点，历史参考）](/zh-CN/gateway/bridge-protocol)）；不再用于设备发现广播，也不再包含在当前构建中。

协议详情：

- [Gateway protocol](/zh-CN/gateway/protocol)
- [Bridge protocol（旧版节点，历史参考）](/zh-CN/gateway/bridge-protocol)

## 为什么我们同时保留“直连”和 SSH

- **直连 WS** 在同一网络和 tailnet 内提供最佳体验：
  - 通过 Bonjour 在局域网中自动发现
  - 配对令牌和 ACL 由 Gateway 网关管理
  - 无需 shell 访问；协议暴露面可以保持紧凑且便于审计
- **SSH** 仍然是通用的回退方案：
  - 只要你有 SSH 访问权限，就可以在任何地方使用（即使跨越互不关联的网络）
  - 能够应对组播/mDNS 问题
  - 除 SSH 外无需新增入站端口

## 设备发现输入（客户端如何获知 Gateway 网关位置）

### 1) Bonjour / DNS-SD 发现

组播 Bonjour 是尽力而为的，并且不会跨网络。OpenClaw 也可以通过已配置的广域 DNS-SD 域浏览同一个 Gateway 网关信标，因此设备发现可以覆盖：

- 同一局域网中的 `local.`
- 用于跨网络发现的已配置单播 DNS-SD 域

目标方向：

- **Gateway 网关** 通过 Bonjour 广播其 WS 端点。
- 客户端进行浏览并显示“选择一个 Gateway 网关”列表，然后保存所选端点。

故障排除和信标详情： [Bonjour](/zh-CN/gateway/bonjour)。

#### 服务信标详情

- 服务类型：
  - `_openclaw-gw._tcp`（Gateway 网关传输信标）
- TXT 键（非机密）：
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>`（由操作员配置的显示名称）
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789`（Gateway WS + HTTP）
  - `gatewayTls=1`（仅在启用 TLS 时）
  - `gatewayTlsSha256=<sha256>`（仅在启用 TLS 且可获得指纹时）
  - `canvasPort=<port>`（canvas host 端口；当前在启用 canvas host 时与 `gatewayPort` 相同）
  - `tailnetDns=<magicdns>`（可选提示；当 Tailscale 可用时自动检测）
  - `sshPort=<port>`（仅限 mDNS 完整模式；广域 DNS-SD 可能省略它，此时 SSH 默认端口仍为 `22`）
  - `cliPath=<path>`（仅限 mDNS 完整模式；广域 DNS-SD 仍会将其写入为远程安装提示）

安全说明：

- Bonjour/mDNS TXT 记录**未经身份验证**。客户端必须仅将 TXT 值视为用户体验提示。
- 路由（主机/端口）应优先使用**已解析的服务端点**（SRV + A/AAAA），而不是 TXT 提供的 `lanHost`、`tailnetDns` 或 `gatewayPort`。
- TLS pinning 绝不能允许广播的 `gatewayTlsSha256` 覆盖先前已存储的 pin。
- iOS/Android 节点在所选路由为安全/TLS 路由时，应要求用户明确确认“信任此指纹”后，才存储首次 pin（带外验证）。

禁用/覆盖：

- `OPENCLAW_DISABLE_BONJOUR=1` 可禁用广播。
- 当未设置 `OPENCLAW_DISABLE_BONJOUR` 时，Bonjour 会在普通主机上广播，并在检测到的容器内自动禁用。仅在 host、macvlan 或其他支持 mDNS 的网络中使用 `0`；使用 `1` 可强制禁用。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制 Gateway 网关绑定模式。
- `OPENCLAW_SSH_PORT` 会覆盖在发出 `sshPort` 时广播的 SSH 端口。
- `OPENCLAW_TAILNET_DNS` 会发布 `tailnetDns` 提示（MagicDNS）。
- `OPENCLAW_CLI_PATH` 会覆盖广播的 CLI 路径。

### 2) tailnet（跨网络）

对于 London/Vienna 风格的部署，Bonjour 没有帮助。推荐的“直连”目标是：

- Tailscale MagicDNS 名称（优先）或稳定的 tailnet IP。

如果 Gateway 网关能够检测到自己运行在 Tailscale 下，它会发布 `tailnetDns` 作为给客户端的可选提示（包括广域信标）。

macOS 应用现在在 Gateway 网关发现中优先使用 MagicDNS 名称，而不是原始 Tailscale IP。这在 tailnet IP 发生变化时（例如节点重启后或 CGNAT 重新分配后）可以提高可靠性，因为 MagicDNS 名称会自动解析到当前 IP。

对于移动节点配对，发现提示不会放宽 tailnet/公网路由上的传输安全要求：

- iOS/Android 仍然要求首次通过 tailnet/公网连接时使用安全路径（`wss://` 或 Tailscale Serve/Funnel）。
- 发现到的原始 tailnet IP 只是路由提示，并不意味着可以使用明文远程 `ws://`。
- 私有局域网直连 `ws://` 仍然受支持。
- 如果你希望移动节点通过 Tailscale 使用最简单的路径，请使用 Tailscale Serve，这样设备发现和设置代码都会解析到同一个安全的 MagicDNS 端点。

### 3) 手动 / SSH 目标

当没有直连路由（或直连被禁用）时，客户端始终可以通过 SSH 转发 loopback Gateway 网关端口进行连接。

参见 [Remote access](/zh-CN/gateway/remote)。

## 传输选择（客户端策略）

推荐的客户端行为：

1. 如果已配置且可达的配对直连端点存在，则使用它。
2. 否则，如果设备发现找到了 `local.` 或已配置广域域中的 Gateway 网关，则提供“一键使用此 Gateway 网关”的选项，并将其保存为直连端点。
3. 否则，如果已配置 tailnet DNS/IP，则尝试直连。  
   对于位于 tailnet/公网路由上的移动节点，“直连”意味着安全端点，而不是明文远程 `ws://`。
4. 否则，回退到 SSH。

## 配对 + 认证（直连传输）

Gateway 网关是节点/客户端准入的事实来源。

- 配对请求在 Gateway 网关中创建/批准/拒绝（参见 [Gateway pairing](/zh-CN/gateway/pairing)）。
- Gateway 网关负责强制执行：
  - 认证（token / keypair）
  - 作用域/ACL（Gateway 网关并不是通往每个方法的原始代理）
  - 速率限制

## 各组件职责

- **Gateway 网关**：广播发现信标、负责配对决策并托管 WS 端点。
- **macOS 应用**：帮助你选择一个 Gateway 网关、显示配对提示，并且仅将 SSH 作为回退方案使用。
- **iOS/Android 节点**：将 Bonjour 浏览作为便利功能，并连接到已配对的 Gateway WS。

## 相关内容

- [Remote access](/zh-CN/gateway/remote)
- [Tailscale](/zh-CN/gateway/tailscale)
- [Bonjour discovery](/zh-CN/gateway/bonjour)
