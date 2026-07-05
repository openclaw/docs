---
read_when:
    - 在 macOS/iOS 上调试 Bonjour 设备发现问题
    - 更改 mDNS 服务类型、TXT 记录或设备发现用户体验
summary: Bonjour/mDNS 设备发现 + 调试（Gateway 网关信标、客户端和常见故障模式）
title: Bonjour 设备发现
x-i18n:
    generated_at: "2026-07-05T11:15:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw 可以使用 Bonjour（mDNS/DNS-SD）发现活动网关（WebSocket 端点）。多播 `local.` 浏览是一个**仅限 LAN 的便利功能**：内置 `bonjour` 插件负责 LAN 广播，在 macOS 主机上自动启动，在 Linux、Windows 和容器化网关部署中需要选择启用。同一个信标也可以通过配置的广域 DNS-SD 域发布，用于跨网络发现。设备发现是尽力而为的，并**不能**替代 SSH 或基于 Tailnet 的连接。

## 通过 Tailscale 使用广域 Bonjour（单播 DNS-SD）

如果节点和网关位于不同网络，多播 mDNS 无法跨越边界。可以通过切换到基于 Tailscale 的**单播 DNS-SD**（“广域 Bonjour”）来保留相同的设备发现体验：

1. 在网关主机上运行一个可通过 Tailnet 访问的 DNS 服务器。
2. 在专用区域（示例：`openclaw.internal.`）下发布 `_openclaw-gw._tcp` 的 DNS-SD 记录。
3. 配置 Tailscale **拆分 DNS**，让你选择的域通过该 DNS 服务器为客户端解析，包括 iOS。

上面的 `openclaw.internal.` 只是一个示例，OpenClaw 支持任何设备发现域。iOS/Android 节点会同时浏览 `local.` 和你配置的广域域。

### Gateway 网关配置

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

当未设置 `discovery.wideArea.domain` 时，它也接受 `OPENCLAW_WIDE_AREA_DOMAIN` 环境变量作为回退。

### 一次性 DNS 服务器设置（网关主机，仅限 macOS）

```bash
openclaw dns setup --apply
```

此命令仅限 macOS，需要 Homebrew 和正在运行的 Tailscale 连接。它会安装 CoreDNS（`brew install coredns`）并将其配置为：

- 仅在网关的 Tailscale 接口上监听 53 端口
- 从 `~/.openclaw/dns/<domain>.db` 提供你选择的域（示例：`openclaw.internal.`）

先不带 `--apply` 运行，以在不安装任何内容的情况下预览计划（域、区域文件路径、检测到的 Tailnet IP、推荐配置）。

从已连接 Tailnet 的机器验证：

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 设置

在 Tailscale 管理控制台中：

- 添加一个指向网关 Tailnet IP 的名称服务器（UDP/TCP 53）。
- 添加拆分 DNS，让你的设备发现域使用该名称服务器。

客户端接受 Tailnet DNS 后，iOS 节点和 CLI 设备发现就可以在你的设备发现域中浏览 `_openclaw-gw._tcp`，无需多播。

### Gateway 网关监听器安全

网关 WS 端口（默认 `18789`）默认绑定到 loopback。对于 LAN/Tailnet 访问，请显式绑定并保持启用认证。对于仅 Tailnet 的设置，在 `~/.openclaw/openclaw.json` 中设置 `gateway.bind: "tailnet"`，然后重启网关（或 macOS 菜单栏应用）。

## 广播内容

只有网关会广播 `_openclaw-gw._tcp`。启用时，LAN 多播广播由内置 `bonjour` 插件发出；广域 DNS-SD 发布仍由网关负责。

## 服务类型

- `_openclaw-gw._tcp` - 网关传输信标，供 macOS/iOS/Android 节点使用。

## TXT 键（非秘密提示）

| 键                            | 出现时机                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | 始终。                                                                         |
| `displayName=<friendly name>` | 始终。                                                                         |
| `lanHost=<hostname>.local`    | 始终。                                                                         |
| `gatewayPort=<port>`          | 始终（网关 WS + HTTP）。                                                       |
| `transport=gateway`           | 始终。                                                                         |
| `gatewayTls=1`                | 仅在启用 TLS 时。                                                              |
| `gatewayTlsSha256=<sha256>`   | 仅在启用 TLS 且指纹可用时。                                                    |
| `gatewayDirectReachable=1`    | 仅在网关可直接访问时（而不是只能通过中继/代理路径访问）。                     |
| `canvasPort=<port>`           | 仅在启用画布主机时；当前与 `gatewayPort` 相同。                                |
| `tailnetDns=<magicdns>`       | 仅 mDNS 完整模式；当 Tailnet 可用时的可选提示。                                |
| `sshPort=<port>`              | 仅完整模式；在最小和关闭模式中省略。                                           |
| `cliPath=<path>`              | 仅完整模式；在最小和关闭模式中省略。                                           |

安全说明：

- Bonjour/mDNS TXT 记录**未认证**。客户端不得将 TXT 视为权威路由信息。
- 客户端应使用解析出的服务端点（SRV + A/AAAA）进行路由。仅将 `lanHost`、`tailnetDns`、`gatewayPort` 和 `gatewayTlsSha256` 视为提示。
- SSH 自动目标选择也应使用解析出的服务主机，而不是仅使用 TXT 提示。
- TLS 固定绝不能允许广播的 `gatewayTlsSha256` 覆盖之前存储的固定指纹。
- iOS/Android 节点应将基于设备发现的直接连接视为**仅限 TLS**，并且在信任首次出现的指纹前要求用户明确确认。

## 在 macOS 上调试

内置工具：

```bash
# Browse instances
dns-sd -B _openclaw-gw._tcp local.

# Resolve one instance (replace <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

如果浏览有效但解析失败，通常是遇到了 LAN 策略或 mDNS 解析器问题。

## 在 Gateway 网关日志中调试

网关会写入滚动日志文件（启动时打印为 `gateway log file: ...`）。查找 `bonjour:` 行，尤其是：

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

看门狗会将活动的 `probing`、`announcing` 和新的冲突重命名视为进行中状态。如果服务始终没有达到 `announced`，OpenClaw 会重新创建广播器，并在重复失败后为该网关进程禁用 Bonjour，而不是永远重新广播。

当系统主机名是有效的 DNS 标签时，Bonjour 会使用系统主机名作为广播的 `.local` 主机。如果系统主机名包含空格、下划线或其他无效 DNS 标签字符，OpenClaw 会回退到 `openclaw.local`。当你需要显式主机标签时，请在启动网关前设置 `OPENCLAW_MDNS_HOSTNAME=<name>`。

## 在 iOS 节点上调试

iOS 节点使用 `NWBrowser` 发现 `_openclaw-gw._tcp`。

捕获日志：设置 -> Gateway 网关 -> 高级 -> **设备发现调试日志**，然后设置 -> Gateway 网关 -> 高级 -> **设备发现日志** -> 复现 -> **复制**。日志包含浏览器状态转换和结果集变更。

## 何时启用 Bonjour

在 macOS 主机上，Bonjour 会为无配置网关启动自动启动，因为本地应用和附近的 iOS/Android 节点通常依赖同一 LAN 设备发现。

当同一 LAN 自动发现对 Linux、Windows 或其他非 macOS 主机有用时，请显式启用它：

```bash
openclaw plugins enable bonjour
```

启用后，Bonjour 使用 `discovery.mdns.mode` 决定发布多少 TXT 元数据；同一模式也控制广域 DNS-SD 记录中的可选 TXT 提示。模式：

| 模式                | 行为                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`（默认）   | 仅核心 TXT 键；省略 `sshPort`、`cliPath`、`tailnetDns`。                                                                                                      |
| `full`              | 添加 `sshPort`、`cliPath`、`tailnetDns`，当客户端需要这些提示时使用。                                                                                         |
| `off`               | 抑制 LAN 多播，但不更改插件启用状态；当 `discovery.wideArea.enabled` 为 true 时，广域 DNS-SD 仍可发布最小信标。                                                |

## 何时禁用 Bonjour

当 LAN 多播广播不必要、不可用或有害时，保持 Bonjour 禁用，常见情况包括非 macOS 服务器、Docker 桥接网络、WSL，或丢弃 mDNS 多播的网络策略。网关仍可通过其发布的 URL、SSH、Tailnet 或广域 DNS-SD 访问；只有 LAN 自动发现不可靠。

对部署范围的问题使用环境变量覆盖（适合 Docker 镜像、服务文件、启动脚本、一次性调试；环境消失后它也会消失）：

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

当你有意为该 OpenClaw 配置关闭内置 LAN 设备发现插件时，使用插件配置：

```bash
openclaw plugins disable bonjour
```

## Docker 注意事项

当未设置 `OPENCLAW_DISABLE_BONJOUR` 时，内置 Bonjour 插件会在检测到容器时自动禁用 LAN 多播广播。Docker 桥接网络通常不会在容器和 LAN 之间转发 mDNS 多播（`224.0.0.251:5353`），因此从容器广播很少能让设备发现正常工作。

注意事项：

- Bonjour 在 macOS 主机上自动启动，在其他位置需要选择启用。保持禁用不会停止网关，只会跳过 LAN 多播广播。
- 禁用 Bonjour 不会更改 `gateway.bind`；Docker 仍默认使用 `OPENCLAW_GATEWAY_BIND=lan`，因此发布的主机端口可用。
- 禁用 Bonjour 不会禁用广域 DNS-SD。当网关和节点不在同一 LAN 上时，使用广域设备发现或 Tailnet。
- 在 Docker 外复用同一个 `OPENCLAW_CONFIG_DIR` 不会保留容器自动禁用策略。
- 仅在主机网络、macvlan 或其他已知 mDNS 多播可通过的网络中设置 `OPENCLAW_DISABLE_BONJOUR=0`；设置为 `1` 可强制禁用。

## 排查 Bonjour 已禁用的问题

如果 Docker 设置后节点不再自动发现网关：

1. 确认网关是在自动、强制开启还是强制关闭模式中运行：

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 确认网关本身可通过发布的端口访问：

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. 当 Bonjour 已禁用时使用直接目标：
   - Control UI 或本地工具：`http://127.0.0.1:18789`
   - LAN 客户端：`http://<gateway-host>:18789`
   - 跨网络客户端：Tailnet MagicDNS、Tailnet IP、SSH 隧道或广域 DNS-SD

4. 如果你在 Docker 中刻意启用了 Bonjour 插件，并使用 `OPENCLAW_DISABLE_BONJOUR=0` 强制广播，请从主机测试多播：

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   如果浏览结果为空，或 Gateway 网关日志显示重复的 ciao 看门狗取消，请恢复 `OPENCLAW_DISABLE_BONJOUR=1`，并使用直接路由或 Tailnet 路由。

## 常见失败模式

- **Bonjour 不跨网络**：使用 Tailnet 或 SSH。
- **多播被阻止**：某些 Wi-Fi 网络会禁用 mDNS。
- **广播器卡在 probing/announcing 状态**：多播被阻止的主机、容器桥接、WSL 或接口频繁变化，可能会让 ciao 广播器停留在未广播状态。OpenClaw 会重试几次，然后为当前 Gateway 网关进程禁用 Bonjour，而不是一直重启广播器。
- **Docker 桥接网络**：在检测到的容器中，Bonjour 会自动禁用。仅在主机、macvlan 或其他支持 mDNS 的网络中设置 `OPENCLAW_DISABLE_BONJOUR=0`。
- **睡眠/接口频繁变化**：macOS 可能会临时丢失 mDNS 结果；请重试。
- **浏览有效但解析失败**：保持机器名称简单（避免表情符号或标点），然后重启 Gateway 网关。服务实例名称派生自主机名，因此过于复杂的名称可能会让某些解析器混淆。

## 转义的实例名称（`\032`）

Bonjour/DNS-SD 经常会把服务实例名称中的字节转义为十进制 `\DDD` 序列（空格会变成 `\032`）。这在协议层面是正常的；界面应解码后再显示（iOS 使用 `BonjourEscapes.decode`）。

## 启用 / 禁用 / 配置

| 设置                                                 | 效果                                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | 在默认未启用的主机上启用内置 LAN 设备发现插件。                                  |
| `openclaw plugins disable bonjour`                   | 通过禁用内置插件来禁用 LAN 多播广播。                                             |
| `OPENCLAW_DISABLE_BONJOUR=1`（或 `true`/`yes`/`on`） | 在不更改插件配置的情况下禁用 LAN 多播广播。                                       |
| `OPENCLAW_DISABLE_BONJOUR=0`（或 `false`/`no`/`off`）| 强制启用 LAN 多播广播，包括在检测到的容器内。                                     |
| `discovery.mdns.mode`                                | `off` \| `minimal`（默认）\| `full` — 参见上面的模式。                            |
| `gateway.bind`                                      | 控制 `~/.openclaw/openclaw.json` 中的 Gateway 网关绑定模式。                      |
| `OPENCLAW_SSH_PORT`                                  | 在广播 `sshPort` 时覆盖 SSH 端口（full 模式）。                                   |
| `OPENCLAW_TAILNET_DNS`                               | 启用 mDNS full 模式时，在 TXT 中发布 MagicDNS 提示。                              |
| `OPENCLAW_CLI_PATH`                                  | 覆盖广播的 CLI 路径（full 模式）。                                                |

macOS 主机默认会自动启动内置 LAN 设备发现插件。当 Bonjour 插件已启用且未设置 `OPENCLAW_DISABLE_BONJOUR` 时，Bonjour 会在普通主机上广播，并在检测到的容器内自动禁用（Docker、Fly.io machines 和常见容器运行时）。

## 相关文档

- 设备发现策略和传输协议选择：[设备发现](/zh-CN/gateway/discovery)
- 节点配对 + 审批：[Gateway 网关配对](/zh-CN/gateway/pairing)
