---
read_when:
    - 实现或更改 Bonjour 设备发现/通告
    - 调整远程连接模式（直连与 SSH）
    - 为远程节点设计设备发现 + 配对机制
summary: 用于查找 Gateway 网关的节点发现和传输协议（Bonjour、Tailscale、SSH）
title: 设备发现 + 传输协议
x-i18n:
    generated_at: "2026-04-26T04:54:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 615be0f501470772c257beb8e798c522c108b09081a603f44218404277fdf269
    source_path: gateway/discovery.md
    workflow: 15
---

# 设备发现 + 传输协议

OpenClaw 有两个表面看起来相似、但本质上不同的问题：

1. **操作端远程控制**：macOS 菜单栏应用控制运行在其他地方的 Gateway 网关。
2. **节点配对**：iOS/Android（以及未来的节点）查找 Gateway 网关并进行安全配对。

设计目标是将所有网络设备发现/通告都保留在 **Node Gateway**（`openclaw gateway`）中，并让客户端（mac 应用、iOS）作为使用方。

## 术语

- **Gateway 网关**：单个长期运行的 Gateway 网关进程，负责状态（会话、配对、节点注册表）并运行渠道。大多数部署在每台主机上使用一个；也支持隔离的多 Gateway 网关部署。
- **Gateway WS（控制平面）**：默认位于 `127.0.0.1:18789` 的 WebSocket 端点；可通过 `gateway.bind` 绑定到局域网 / tailnet。
- **直连 WS 传输**：面向局域网 / tailnet 的 Gateway WS 端点（不使用 SSH）。
- **SSH 传输（回退方案）**：通过 SSH 转发 `127.0.0.1:18789` 来实现远程控制。
- **旧版 TCP 桥接（已移除）**：较早的节点传输方式（参见
  [Bridge protocol](/zh-CN/gateway/bridge-protocol)）；不再用于设备发现通告，也不再属于当前构建的一部分。

协议详情：

- [Gateway protocol](/zh-CN/gateway/protocol)
- [Bridge protocol（旧版）](/zh-CN/gateway/bridge-protocol)

## 为什么我们同时保留“直连”和 SSH

- **直连 WS** 在同一网络以及 tailnet 内提供最佳体验：
  - 通过 Bonjour 在局域网内自动发现
  - 配对令牌和 ACL 由 Gateway 网关管理
  - 无需 shell 访问；协议暴露面可以保持精简且可审计
- **SSH** 仍然是通用的回退方案：
  - 只要你有 SSH 访问权限，就几乎可以在任何地方使用（即使跨越互不相关的网络）
  - 能避开多播 / mDNS 问题
  - 除 SSH 外无需开放新的入站端口

## 设备发现输入（客户端如何获知 Gateway 网关位置）

### 1) Bonjour / DNS-SD 设备发现

多播 Bonjour 是尽力而为的，并且不会跨网络。OpenClaw 也可以通过已配置的广域 DNS-SD 域浏览同一个 Gateway 网关信标，因此设备发现范围可以覆盖：

- 同一局域网中的 `local.`
- 用于跨网络设备发现的已配置单播 DNS-SD 域

目标方向：

- **Gateway 网关** 通过 Bonjour 通告它的 WS 端点。
- 客户端负责浏览并显示“选择一个 Gateway 网关”的列表，然后保存所选端点。

故障排除和信标详情： [Bonjour](/zh-CN/gateway/bonjour)。

#### 服务信标详情

- 服务类型：
  - `_openclaw-gw._tcp`（Gateway 网关传输信标）
- TXT 键名（非机密）：
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>`（操作端配置的显示名称）
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789`（Gateway WS + HTTP）
  - `gatewayTls=1`（仅在启用 TLS 时）
  - `gatewayTlsSha256=<sha256>`（仅在启用 TLS 且指纹可用时）
  - `canvasPort=<port>`（canvas host 端口；当前在启用 canvas host 时与 `gatewayPort` 相同）
  - `tailnetDns=<magicdns>`（可选提示；当 Tailscale 可用时自动检测）
  - `sshPort=<port>`（仅 mDNS 完整模式；广域 DNS-SD 可能省略该项，此时 SSH 默认端口保持为 `22`）
  - `cliPath=<path>`（仅 mDNS 完整模式；广域 DNS-SD 仍会将其写入，作为远程安装提示）

安全说明：

- Bonjour/mDNS TXT 记录是**未经认证的**。客户端必须仅将 TXT 值视为用户体验提示。
- 路由（主机 / 端口）应优先使用**已解析的服务端点**（SRV + A/AAAA），而不是 TXT 中提供的 `lanHost`、`tailnetDns` 或 `gatewayPort`。
- TLS 固定必须绝不允许通告的 `gatewayTlsSha256` 覆盖先前存储的 pin。
- iOS/Android 节点在所选路由为安全 / 基于 TLS 的情况下，在存储首次 pin 之前，应要求显式确认“信任此指纹”（带外验证）。

禁用 / 覆盖：

- `OPENCLAW_DISABLE_BONJOUR=1` 禁用通告。
- Docker Compose 默认使用 `OPENCLAW_DISABLE_BONJOUR=1`，因为 bridge 网络通常无法可靠承载 mDNS 多播；仅在 host、macvlan 或其他支持 mDNS 的网络上使用 `0`。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制 Gateway 网关绑定模式。
- `OPENCLAW_SSH_PORT` 会在发出 `sshPort` 时覆盖所通告的 SSH 端口。
- `OPENCLAW_TAILNET_DNS` 发布 `tailnetDns` 提示（MagicDNS）。
- `OPENCLAW_CLI_PATH` 覆盖所通告的 CLI 路径。

### 2) Tailnet（跨网络）

对于 London/Vienna 这类部署，Bonjour 不会有帮助。推荐的“直连”目标是：

- Tailscale MagicDNS 名称（优先），或稳定的 tailnet IP。

如果 Gateway 网关能够检测到自己运行在 Tailscale 环境下，它会将 `tailnetDns` 作为客户端的可选提示发布（包括广域信标）。

macOS 应用现在在 Gateway 网关设备发现中优先使用 MagicDNS 名称，而不是原始 Tailscale IP。这样在 tailnet IP 发生变化时（例如节点重启后或 CGNAT 重新分配后）可靠性更高，因为 MagicDNS 名称会自动解析到当前 IP。

对于移动节点配对，设备发现提示不会放宽 tailnet / 公网路由上的传输安全要求：

- iOS/Android 仍然要求首次通过安全的 tailnet / 公网连接路径进行连接（`wss://` 或 Tailscale Serve/Funnel）。
- 发现到的原始 tailnet IP 只是路由提示，并不意味着允许使用明文远程 `ws://`。
- 私有局域网直连 `ws://` 仍然受支持。
- 如果你希望为移动节点提供最简单的 Tailscale 路径，请使用 Tailscale Serve，这样设备发现和设置代码都会解析到同一个安全的 MagicDNS 端点。

### 3) 手动 / SSH 目标

当没有直连路径（或直连被禁用）时，客户端始终可以通过转发 loopback Gateway 网关端口来使用 SSH 连接。

参见 [Remote access](/zh-CN/gateway/remote)。

## 传输选择（客户端策略）

推荐的客户端行为：

1. 如果已配置并且可达的已配对直连端点存在，则使用它。
2. 否则，如果设备发现在 `local.` 或已配置的广域域名中找到 Gateway 网关，则提供一键“使用此 Gateway 网关”的选项，并将其保存为直连端点。
3. 否则，如果已配置 tailnet DNS / IP，则尝试直连。
   对于位于 tailnet / 公网路由上的移动节点，直连意味着安全端点，而不是明文远程 `ws://`。
4. 否则，回退到 SSH。

## 配对 + 认证（直连传输）

Gateway 网关是节点 / 客户端接入的唯一真实来源。

- 配对请求由 Gateway 网关创建 / 批准 / 拒绝（参见 [Gateway pairing](/zh-CN/gateway/pairing)）。
- Gateway 网关负责执行：
  - 认证（令牌 / 密钥对）
  - 作用域 / ACL（Gateway 网关不是通往所有方法的原始代理）
  - 速率限制

## 各组件职责

- **Gateway 网关**：通告设备发现信标，负责配对决策，并托管 WS 端点。
- **macOS 应用**：帮助你选择 Gateway 网关，显示配对提示，并仅将 SSH 作为回退方案使用。
- **iOS/Android 节点**：将 Bonjour 浏览作为便利功能，并连接到已配对的 Gateway WS。

## 相关内容

- [Remote access](/zh-CN/gateway/remote)
- [Tailscale](/zh-CN/gateway/tailscale)
- [Bonjour discovery](/zh-CN/gateway/bonjour)
