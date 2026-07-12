---
read_when:
    - 实现或更改 Bonjour 设备发现/广播功能
    - 调整远程连接模式（直接连接与 SSH）
    - 远程节点的设备发现与配对设计
summary: 用于查找 Gateway 网关的节点发现与传输方式（Bonjour、Tailscale、SSH）
title: 设备发现和传输协议
x-i18n:
    generated_at: "2026-07-11T20:32:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw 有两个相互关联但彼此不同的设备发现问题：

1. **操作员远程控制**：macOS 菜单栏应用控制运行在其他位置的 Gateway 网关。
2. **节点配对**：iOS/Android（以及未来的节点）查找 Gateway 网关并进行安全配对。

所有网络设备发现/广播都由 **Node Gateway 网关**
（`openclaw gateway`）负责；客户端（Mac 应用、iOS）仅作为使用方。

## 术语

- **Gateway 网关**：一个长期运行的进程，负责管理状态（会话、
  配对、节点注册表）并运行渠道。大多数设置中每台主机运行一个；
  也可以设置相互隔离的多个 Gateway 网关。
- **Gateway 网关 WS（控制平面）**：默认位于 `127.0.0.1:18789`
  的 WebSocket 端点；可通过 `gateway.bind` 将其绑定到局域网/尾网。
- **直连 WS 传输**：面向局域网/尾网的 Gateway 网关 WS 端点（不使用 SSH）。
- **SSH 传输（回退方案）**：通过 SSH 转发
  `127.0.0.1:18789` 来实现远程控制。
- **旧版 TCP 桥接（已移除）**：旧版节点传输方式（参见
  [Bridge protocol](/zh-CN/gateway/bridge-protocol)）；不再通过设备发现进行广播，
  也不再包含于当前构建中。

协议详情：[Gateway 网关协议](/zh-CN/gateway/protocol)、
[Bridge protocol（旧版）](/zh-CN/gateway/bridge-protocol)。

## 为什么直连和 SSH 并存

- **直连 WS** 在同一网络和尾网内提供最佳用户体验：通过 Bonjour
  自动发现局域网设备，由 Gateway 网关管理配对令牌和 ACL，
  且无需 Shell 访问权限。
- **SSH** 是通用的回退方案：只要具备 SSH 访问权限，就能在任何位置使用，
  即使网络互不关联也可以；它不受多播/mDNS 问题影响，
  并且除 SSH 外无需开放新的入站端口。

## 设备发现输入

### 1）Bonjour / DNS-SD

多播 Bonjour 采用尽力而为机制，无法跨越网络。OpenClaw 还支持通过已配置的广域 DNS-SD
域浏览同一个 Gateway 网关信标，因此设备发现既可以覆盖同一局域网内的 `local.`，
也可以通过已配置的单播 DNS-SD 域实现跨网络发现。

启用内置 `bonjour` 插件后，**Gateway 网关**会通过 Bonjour 广播其 WS 端点；
客户端浏览并显示“pick a gateway”列表，然后存储所选端点。

故障排查和信标详情：[Bonjour](/zh-CN/gateway/bonjour)。

#### 服务信标详情

- 服务类型：`_openclaw-gw._tcp`（Gateway 网关传输信标）。
- TXT 键（非机密）：

  | 键                          | 说明                                                                                                                                                             |
  | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | 始终存在。                                                                                                                                                       |
  | `transport=gateway`         | 始终存在。                                                                                                                                                       |
  | `displayName=<name>`        | 由操作员配置的显示名称。                                                                                                                                         |
  | `lanHost=<hostname>.local`  | 仅由局域网 mDNS 广播器写入；广域 DNS-SD 不会写入。                                                                                                               |
  | `gatewayPort=18789`         | Gateway 网关 WS + HTTP 端口。                                                                                                                                    |
  | `gatewayTls=1`              | 仅在启用 TLS 时存在。                                                                                                                                            |
  | `gatewayTlsSha256=<sha256>` | 仅在启用 TLS 且指纹可用时存在。                                                                                                                                  |
  | `tailnetDns=<magicdns>`     | 可选提示；Tailscale 可用时自动检测。                                                                                                                             |
  | `sshPort=<port>`            | 仅当 `discovery.mdns.mode="full"` 时存在；在默认的 `"minimal"` 模式下省略（SSH 默认为 `22`），局域网广播器和广域 DNS-SD 均是如此。                                 |
  | `cliPath=<path>`            | 与 `sshPort` 使用相同的 `discovery.mdns.mode="full"` 条件；用于提示远程安装中的 CLI 路径。                                                                        |

  插件设备发现契约定义了一个 `canvasPort` TXT 键，用于未来的画布主机端口，
  但当前没有任何代码路径为其设置值，因此目前永远不会发出该键。

安全注意事项：

- Bonjour/mDNS TXT 记录**未经身份验证**。客户端必须仅将 TXT
  值视为用户体验提示。
- 路由（主机/端口）应优先使用**解析后的服务端点**
  （SRV + A/AAAA），而不是 TXT 提供的 `lanHost`、`tailnetDns` 或 `gatewayPort`。
- TLS 固定绝不能允许广播的 `gatewayTlsSha256` 覆盖之前存储的固定值。
- 每当所选路由基于安全连接/TLS 时，iOS/Android 节点在存储首次使用的固定值之前，
  应要求用户明确确认“trust this fingerprint”（通过带外方式验证）。

启用、禁用和覆盖：

- `openclaw plugins enable bonjour` 启用局域网多播广播。
- `openclaw.json` 中的 `discovery.mdns.mode` 控制 mDNS 广播：
  `"minimal"`（默认）、`"full"`（在局域网信标和任何广域 DNS-SD
  区域中添加 `cliPath`/`sshPort`），或 `"off"`（禁用 mDNS）。
- `OPENCLAW_DISABLE_BONJOUR=1` 强制禁用广播；`discovery.mdns.mode="off"`
  会独立禁用广播。`OPENCLAW_DISABLE_BONJOUR=0` 表示明确选择启用，
  它会覆盖插件在检测到容器（Docker、containerd、Kubernetes、LXC）时的自动禁用行为；
  但不会覆盖 `discovery.mdns.mode="off"`。内置 `bonjour` 插件会在
  macOS 主机上自动启动（`enabledByDefaultOnPlatforms: ["darwin"]`），
  并在检测到容器时自动禁用；Linux、Windows 和其他容器化部署需要显式执行
  `plugins enable bonjour`。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制 Gateway 网关绑定模式。
- `OPENCLAW_SSH_PORT` 覆盖广播的 SSH 端口（仅当
  `discovery.mdns.mode="full"` 时生效）。
- `OPENCLAW_TAILNET_DNS` 发布 `tailnetDns` 提示（MagicDNS）。
- `OPENCLAW_CLI_PATH` 覆盖广播的 CLI 路径。

### 2）尾网（跨网络）

对于位于不同物理网络上的 Gateway 网关，Bonjour 无法提供帮助。
建议使用 Tailscale MagicDNS 名称（首选）或稳定的尾网 IP 作为直连目标。

如果 Gateway 网关检测到自身运行于 Tailscale 下，它会发布
`tailnetDns` 作为客户端的可选提示（包括广域信标）。
macOS 应用在发现 Gateway 网关时优先使用 MagicDNS 名称，而不是原始 Tailscale IP；
这样即使尾网 IP 发生变化（节点重启、CGNAT 重新分配），仍能保持可靠连接，
因为 MagicDNS 会自动解析到当前 IP。

对于移动节点配对，设备发现提示绝不会放宽尾网/公网路由上的传输安全要求：

- iOS/Android 仍要求使用安全的首次尾网/公网连接路径
  （`wss://` 或 Tailscale Serve/Funnel）。
- 发现的原始尾网 IP 只是路由提示，并不表示允许使用明文远程 `ws://`。
- 仍支持在私有局域网内通过 `ws://` 直连。
- 对于移动节点上最简单的 Tailscale 路径，请使用 Tailscale Serve，
  使设备发现和设置都解析到同一个安全的 MagicDNS 端点。

### 3）手动 / SSH 目标

当没有直连路由（或直连已禁用）时，客户端始终可以通过 SSH 转发回环
Gateway 网关端口进行连接。参见[远程访问](/zh-CN/gateway/remote)。

## 传输选择（客户端策略）

1. 如果已配置且可访问已配对的直连端点，则使用该端点。
2. 否则，如果设备发现在 `local.` 或已配置的广域域中找到 Gateway 网关，
   则提供一键式“Use this gateway”选项，并将其保存为直连端点。
3. 否则，如果已配置尾网 DNS/IP，则尝试直连。对于尾网/公网路由上的移动节点，
   直连意味着使用安全端点，而不是明文远程 `ws://`。
4. 否则，回退到 SSH。

## 配对和身份验证（直连传输）

Gateway 网关是节点/客户端准入信息的权威来源：

- 配对请求在 Gateway 网关中创建/批准/拒绝（参见
  [Gateway 网关配对](/zh-CN/gateway/pairing)）。
- Gateway 网关会强制执行身份验证（令牌/密钥对）、权限范围/ACL
  （它并非针对所有方法的原始代理）以及速率限制。

## 各组件的职责

- **Gateway 网关**：广播设备发现信标、管理配对决策并托管 WS 端点。
- **macOS 应用**：帮助你选择 Gateway 网关、显示配对提示，并且仅将 SSH
  用作回退方案。
- **iOS/Android 节点**：将 Bonjour 浏览作为便利功能，连接到已配对的
  Gateway 网关 WS。

## 相关内容

- [远程访问](/zh-CN/gateway/remote)
- [Tailscale](/zh-CN/gateway/tailscale)
- [Bonjour 设备发现](/zh-CN/gateway/bonjour)
