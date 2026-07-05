---
read_when:
    - 实现或更改 Bonjour 设备发现/广播
    - 调整远程连接模式（直连与 SSH）
    - 为远程节点设计节点发现 + 配对
summary: 用于查找 Gateway 网关的节点设备发现和传输协议（Bonjour、Tailscale、SSH）
title: 设备发现和传输协议
x-i18n:
    generated_at: "2026-07-05T11:17:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw 有两个相关但不同的设备发现问题：

1. **操作员远程控制**：macOS 菜单栏应用控制在其他位置运行的 Gateway 网关。
2. **节点配对**：iOS/Android（以及未来的节点）查找 Gateway 网关并安全配对。

所有网络设备发现/通告都位于 **Node Gateway**
（`openclaw gateway`）；客户端（mac 应用、iOS）只是消费者。

## 术语

- **Gateway 网关**：一个长期运行的进程，负责拥有状态（会话、
  配对、节点注册表）并运行渠道。大多数设置每台主机使用一个；
  也可以使用隔离的多 Gateway 网关设置。
- **Gateway 网关 WS（控制平面）**：默认位于 `127.0.0.1:18789`
  的 WebSocket 端点；通过 `gateway.bind` 将其绑定到 LAN/tailnet。
- **直连 WS 传输**：面向 LAN/tailnet 的 Gateway 网关 WS 端点（无 SSH）。
- **SSH 传输（备用）**：通过 SSH 转发
  `127.0.0.1:18789` 进行远程控制。
- **旧版 TCP 桥接（已移除）**：较旧的节点传输（参见
  [桥接协议](/zh-CN/gateway/bridge-protocol)）；不再为
  设备发现进行通告，也不再属于当前构建的一部分。

协议详情：[Gateway 网关协议](/zh-CN/gateway/protocol)，
[桥接协议（旧版）](/zh-CN/gateway/bridge-protocol)。

## 为什么直连和 SSH 同时存在

- **直连 WS** 是同一网络和 tailnet 内的最佳用户体验：通过 Bonjour 进行 LAN
  自动发现，由 Gateway 网关拥有配对令牌和 ACL，
  且无需 shell 访问权限。
- **SSH** 是通用备用方案：只要有 SSH 访问权限就能在任何地方工作，即使
  跨越无关网络，也能避开组播/mDNS 问题，并且除了 SSH 外不需要新的
  入站端口。

## 发现输入

### 1) Bonjour / DNS-SD

组播 Bonjour 是尽力而为的，并且不会跨网络。OpenClaw 还支持通过已配置的广域 DNS-SD
域浏览同一个 Gateway 网关信标，因此设备发现既可以覆盖同一 LAN 上的 `local.`，
也可以覆盖用于跨网络发现的已配置单播 DNS-SD 域。

启用内置 `bonjour` 插件后，**Gateway 网关**会通过 Bonjour 通告其 WS 端点；客户端浏览并显示“选择一个 Gateway 网关”列表，
然后存储所选端点。

故障排查和信标详情：[Bonjour](/zh-CN/gateway/bonjour)。

#### 服务信标详情

- 服务类型：`_openclaw-gw._tcp`（Gateway 网关传输信标）。
- TXT 键（非机密）：

  | 键                          | 说明                                                                                                                                                             |
  | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | 始终存在。                                                                                                                                                       |
  | `transport=gateway`         | 始终存在。                                                                                                                                                       |
  | `displayName=<name>`        | 操作员配置的显示名称。                                                                                                                                           |
  | `lanHost=<hostname>.local`  | 仅限 LAN mDNS 通告器；不会由广域 DNS-SD 写入。                                                                                                                   |
  | `gatewayPort=18789`         | Gateway 网关 WS + HTTP 端口。                                                                                                                                    |
  | `gatewayTls=1`              | 仅在启用 TLS 时存在。                                                                                                                                            |
  | `gatewayTlsSha256=<sha256>` | 仅在启用 TLS 且有可用指纹时存在。                                                                                                                                |
  | `tailnetDns=<magicdns>`     | 可选提示；Tailscale 可用时会自动检测。                                                                                                                          |
  | `sshPort=<port>`            | 仅当 `discovery.mdns.mode="full"` 时存在；默认 `"minimal"` 模式下省略（SSH 默认为 `22`），LAN 通告器和广域 DNS-SD 均如此。 |
  | `cliPath=<path>`            | 与 `sshPort` 相同，受 `discovery.mdns.mode="full"` 门控；这是 CLI 路径的远程安装提示。                                                                           |

  插件设备发现契约中定义了 `canvasPort` TXT 键，用于未来的 canvas 主机端口，
  但当前没有任何代码路径设置该值，所以今天从不会发出。

安全说明：

- Bonjour/mDNS TXT 记录**未经身份验证**。客户端必须只将 TXT
  值视为用户体验提示。
- 路由（主机/端口）应优先使用**已解析的服务端点**
  （SRV + A/AAAA），而不是 TXT 提供的 `lanHost`、`tailnetDns` 或 `gatewayPort`。
- TLS 固定绝不能让通告的 `gatewayTlsSha256` 覆盖
  先前存储的固定值。
- iOS/Android 节点应要求显式确认“信任此指纹”，
  然后才存储首次固定值（带外验证），
  只要所选路由基于安全/TLS。

启用、禁用和覆盖：

- `openclaw plugins enable bonjour` 启用 LAN 组播通告。
- `openclaw.json` 中的 `discovery.mdns.mode` 控制 mDNS 广播：
  `"minimal"`（默认）、`"full"`（向 LAN
  信标和任何广域 DNS-SD 区域添加 `cliPath`/`sshPort`），或 `"off"`（禁用 mDNS）。
- `OPENCLAW_DISABLE_BONJOUR=1` 强制禁用通告；`discovery.mdns.mode="off"`
  会独立禁用它。`OPENCLAW_DISABLE_BONJOUR=0` 是显式
  选择加入，会覆盖插件在检测到容器
  （Docker、containerd、Kubernetes、LXC）内时的自动禁用；它不会覆盖
  `discovery.mdns.mode="off"`。内置 `bonjour` 插件会在
  macOS 主机上自动启动（`enabledByDefaultOnPlatforms: ["darwin"]`），并在检测到容器内时自动禁用；
  Linux、Windows 和其他容器化
  部署需要显式执行 `plugins enable bonjour`。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制 Gateway 网关绑定模式。
- `OPENCLAW_SSH_PORT` 覆盖通告的 SSH 端口（仅在
  `discovery.mdns.mode="full"` 时生效）。
- `OPENCLAW_TAILNET_DNS` 发布 `tailnetDns` 提示（MagicDNS）。
- `OPENCLAW_CLI_PATH` 覆盖通告的 CLI 路径。

### 2) Tailnet（跨网络）

对于位于不同物理网络上的 Gateway 网关，Bonjour 没有帮助。
推荐的直连目标是 Tailscale MagicDNS 名称（首选）或
稳定的 tailnet IP。

如果 Gateway 网关检测到自己在 Tailscale 下运行，它会将
`tailnetDns` 作为可选提示发布给客户端（包括广域信标）。
macOS 应用在 Gateway 网关发现中优先使用 MagicDNS 名称，而不是原始 Tailscale IP，
这在 tailnet IP 变化（节点重启、
CGNAT 重新分配）时仍然可靠，因为 MagicDNS 会自动解析到当前 IP。

对于移动节点配对，设备发现提示绝不会放宽 tailnet/公共路由上的传输安全：

- iOS/Android 仍然需要安全的首次 tailnet/公共连接路径
  （`wss://` 或 Tailscale Serve/Funnel）。
- 发现的原始 tailnet IP 是路由提示，而不是允许使用
  明文远程 `ws://` 的许可。
- 仍然支持私有 LAN 直连 `ws://`。
- 对于移动节点上最简单的 Tailscale 路径，请使用 Tailscale Serve，
  这样设备发现和设置都会解析到同一个安全的 MagicDNS 端点。

### 3) 手动 / SSH 目标

没有直连路由（或直连已禁用）时，客户端始终可以
通过转发 loopback Gateway 网关端口经 SSH 连接。参见
[远程访问](/zh-CN/gateway/remote)。

## 传输选择（客户端策略）

1. 如果已配置并可访问已配对的直连端点，则使用它。
2. 否则，如果设备发现能在 `local.` 或已配置的广域
   域中找到 Gateway 网关，则提供一键“使用此 Gateway 网关”选项，并将其保存为
   直连端点。
3. 否则，如果已配置 tailnet DNS/IP，则尝试直连。对于
   tailnet/公共路由上的移动节点，直连意味着安全端点，而不是明文
   远程 `ws://`。
4. 否则，回退到 SSH。

## 配对和身份验证（直连传输）

Gateway 网关是节点/客户端准入的事实来源：

- 配对请求在 Gateway 网关中创建/批准/拒绝（参见
  [Gateway 网关配对](/zh-CN/gateway/pairing)）。
- Gateway 网关强制执行身份验证（令牌/密钥对）、权限范围/ACL（它不是所有方法的原始
  代理）和速率限制。

## 按组件划分的职责

- **Gateway 网关**：通告设备发现信标，拥有配对决策，托管
  WS 端点。
- **macOS 应用**：帮助你选择 Gateway 网关，显示配对提示，仅将 SSH
  用作备用。
- **iOS/Android 节点**：为方便起见浏览 Bonjour，并连接到
  已配对的 Gateway 网关 WS。

## 相关

- [远程访问](/zh-CN/gateway/remote)
- [Tailscale](/zh-CN/gateway/tailscale)
- [Bonjour 设备发现](/zh-CN/gateway/bonjour)
