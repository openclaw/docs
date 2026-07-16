---
read_when:
    - 调试 macOS/iOS 上的 Bonjour 设备发现问题
    - 更改 mDNS 服务类型、TXT 记录或设备发现用户体验
summary: Bonjour/mDNS 设备发现 + 调试（Gateway 网关信标、客户端和常见故障模式）
title: Bonjour 设备发现
x-i18n:
    generated_at: "2026-07-16T11:31:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 42a46dc34e94dc86ee0432b12fcb59b3855371c745d79825a00aa557e1369160
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw 可以使用 Bonjour (mDNS/DNS-SD) 发现活跃的 Gateway 网关（WebSocket 端点）。多播 `local.` 浏览是一项**仅限局域网的便利功能**：内置 `bonjour` 插件负责局域网广播，在 macOS 主机上自动启动，在 Linux、Windows 和容器化 Gateway 网关部署中则需选择启用。同一信标也可以通过已配置的广域 DNS-SD 域发布，以便进行跨网络设备发现。设备发现采用尽力而为的方式，**不能**取代基于 SSH 或 Tailnet 的连接。

## 通过 Tailscale 使用广域 Bonjour（单播 DNS-SD）

如果节点和 Gateway 网关位于不同网络，多播 mDNS 无法跨越网络边界。可以通过 Tailscale 切换到**单播 DNS-SD**（“广域 Bonjour”），以保持相同的设备发现体验：

1. 在 Gateway 网关主机上运行可通过 Tailnet 访问的 DNS 服务器。
2. 在专用区域（例如：`openclaw.internal.`）下发布 `_openclaw-gw._tcp` 的 DNS-SD 记录。
3. 配置 Tailscale **split DNS**，使客户端（包括 iOS）通过该 DNS 服务器解析所选域。

上面的 `openclaw.internal.` 只是一个示例——OpenClaw 支持任何设备发现域。iOS/Android 节点会同时浏览 `local.` 和你配置的广域域。

### Gateway 网关配置

```json5
{
  gateway: { bind: "tailnet" }, // 仅限 tailnet（推荐）
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

未设置时，`discovery.wideArea.domain` 也接受使用 `OPENCLAW_WIDE_AREA_DOMAIN` 环境变量作为后备选项。

### 一次性 DNS 服务器设置（Gateway 网关主机，仅限 macOS）

```bash
openclaw dns setup --apply
```

此命令仅适用于 macOS，并且需要 Homebrew 和正在运行的 Tailscale 连接。它会安装 CoreDNS（`brew install coredns`）并将其配置为：

- 仅在 Gateway 网关的 Tailscale 接口上侦听端口 53
- 从 `~/.openclaw/dns/<domain>.db` 提供所选域（例如：`openclaw.internal.`）

请先在不带 `--apply` 的情况下运行，以预览计划（域、区域文件路径、检测到的 Tailnet IP、推荐配置），而不安装任何内容。

从已连接 Tailnet 的计算机进行验证：

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 设置

在 Tailscale 管理控制台中：

- 添加一个指向 Gateway 网关 Tailnet IP 的名称服务器（UDP/TCP 53）。
- 添加 split DNS，使设备发现域使用该名称服务器。

客户端接受 Tailnet DNS 后，iOS 节点和 CLI 设备发现无需多播即可浏览设备发现域中的 `_openclaw-gw._tcp`。

### Gateway 网关侦听器安全

Gateway 网关 WS 端口（默认 `18789`）默认绑定到环回地址。要通过局域网/Tailnet 访问，请显式绑定并保持身份验证启用。对于仅限 Tailnet 的设置，请在 `~/.openclaw/openclaw.json` 中设置 `gateway.bind: "tailnet"`，然后重启 Gateway 网关（或 macOS 菜单栏应用）。

## 广播内容

只有 Gateway 网关会广播 `_openclaw-gw._tcp`。启用时，局域网多播广播由内置 `bonjour` 插件负责；广域 DNS-SD 发布仍由 Gateway 网关负责。

## 服务类型

- `_openclaw-gw._tcp` - Gateway 网关传输信标，供 macOS/iOS/Android 节点使用。

## TXT 键（非敏感提示）

| 键                            | 出现条件                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | 始终。                                                                         |
| `displayName=<friendly name>` | 始终。                                                                         |
| `lanHost=<hostname>.local`    | 始终。                                                                         |
| `gatewayPort=<port>`          | 始终（Gateway 网关 WS + HTTP）。                                               |
| `transport=gateway`           | 始终。                                                                         |
| `gatewayTls=1`                | 仅在启用 TLS 时。                                                              |
| `gatewayTlsSha256=<sha256>`   | 仅在启用 TLS 且有可用指纹时。                                                  |
| `gatewayDirectReachable=1`    | 仅在 Gateway 网关可直接访问时（而非只能通过中继/代理路径访问）。               |
| `canvasPort=<port>`           | 仅在启用画布主机时；当前与 `gatewayPort` 相同。                           |
| `tailnetDns=<magicdns>`       | 仅限 mDNS 完整模式；Tailnet 可用时的可选提示。                                 |
| `sshPort=<port>`              | 仅限完整模式；在最小模式和关闭模式下省略。                                     |
| `cliPath=<path>`              | 仅限完整模式；在最小模式和关闭模式下省略。                                     |

安全说明：

- Bonjour/mDNS TXT 记录**未经身份验证**。客户端不得将 TXT 视为权威路由信息。
- 客户端应使用解析出的服务端点（SRV + A/AAAA）进行路由。仅将 `lanHost`、`tailnetDns`、`gatewayPort` 和 `gatewayTlsSha256` 视为提示。
- SSH 自动目标选择同样应使用解析出的服务主机，而不是仅使用 TXT 提示。
- TLS 固定绝不能让广播的 `gatewayTlsSha256` 覆盖先前存储的固定值。
- iOS/Android 节点应将基于设备发现的直接连接视为**仅限 TLS**，并且必须在信任首次出现的指纹前要求用户明确确认。

## 在 macOS 上调试

内置工具：

```bash
# 浏览实例
dns-sd -B _openclaw-gw._tcp local.

# 解析一个实例（替换 <instance>）
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

如果浏览正常但解析失败，通常是遇到了局域网策略或 mDNS 解析器问题。

## 在 Gateway 网关日志中调试

Gateway 网关会写入滚动日志文件（启动时以 `gateway log file: ...` 打印）。查找 `bonjour:` 行，尤其是：

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao netmask assertion ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`

OpenClaw 只启动每项 Bonjour 服务一次，并将探测、重试、名称冲突解决以及接口变更后的重新发布交给 mDNS 响应器处理。这可避免正常网络变动期间出现重叠发布尝试。重复的内部自探测消息会被抑制，以免淹没 Gateway 网关日志。

当多个 OpenClaw Gateway 网关从同一主机广播时，Bonjour 可能会附加 `(2)` 或 `(3)` 等后缀，以确保服务实例名称唯一。这些后缀是正常的冲突解决结果，并不表示存在重复的 OCM 监管。

当系统主机名是有效的 DNS 标签时，Bonjour 会使用它作为广播的 `.local` 主机。如果系统主机名包含空格、下划线或其他无效的 DNS 标签字符，OpenClaw 会回退到 `openclaw.local`。需要显式指定主机标签时，请在启动 Gateway 网关前设置 `OPENCLAW_MDNS_HOSTNAME=<name>`。

## 在 iOS 节点上调试

iOS 节点使用 `NWBrowser` 发现 `_openclaw-gw._tcp`。

要捕获日志，请依次转到 Settings -> Gateway -> Advanced -> **Discovery Debug Logs**，然后转到 Settings -> Gateway -> Advanced -> **Discovery Logs** -> 重现问题 -> **Copy**。日志包含浏览器状态转换和结果集变更。

## 何时启用 Bonjour

在 macOS 主机上以空配置启动 Gateway 网关时，Bonjour 会自动启动，因为本地应用及附近的 iOS/Android 节点通常依赖同一局域网内的设备发现。

当 Linux、Windows 或其他非 macOS 主机需要同一局域网自动发现时，请显式启用：

```bash
openclaw plugins enable bonjour
```

启用后，Bonjour 使用 `discovery.mdns.mode` 决定发布多少 TXT 元数据；同一模式也控制广域 DNS-SD 记录中的可选 TXT 提示。模式：

| 模式                | 行为                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`（默认） | 仅包含核心 TXT 键；省略 `sshPort`、`cliPath`、`tailnetDns`。                                                                          |
| `full`              | 添加 `sshPort`、`cliPath`、`tailnetDns`——在客户端需要这些提示时使用。                                                                 |
| `off`               | 在不更改插件启用状态的情况下抑制局域网多播；当 `discovery.wideArea.enabled` 为 true 时，广域 DNS-SD 仍可发布最小信标。                                                   |

## 何时禁用 Bonjour

当局域网多播广播不必要、不可用或有害时，请保持 Bonjour 禁用——常见情况包括非 macOS 服务器、Docker 桥接网络、WSL，或会丢弃 mDNS 多播的网络策略。Gateway 网关仍可通过其发布的 URL、SSH、Tailnet 或广域 DNS-SD 访问；只有局域网自动发现不可靠。

对于部署范围的问题，请使用环境变量覆盖（适用于 Docker 镜像、服务文件、启动脚本和一次性调试——环境消失时它也会消失）：

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

如果你有意为该 OpenClaw 配置关闭内置局域网设备发现插件，请使用插件配置：

```bash
openclaw plugins disable bonjour
```

## Docker 注意事项

检测到容器且未设置 `OPENCLAW_DISABLE_BONJOUR` 时，内置 Bonjour 插件会自动禁用局域网多播广播。Docker 桥接网络通常不会在容器和局域网之间转发 mDNS 多播（`224.0.0.251:5353`），因此从容器广播很少能让设备发现正常工作。

注意事项：

- Bonjour 在 macOS 主机上自动启动，在其他环境中则需选择启用。保持禁用不会停止 Gateway 网关——只会跳过局域网多播广播。
- 禁用 Bonjour 不会更改 `gateway.bind`；Docker 仍默认为 `OPENCLAW_GATEWAY_BIND=lan`，因此发布的主机端口仍可使用。
- 禁用 Bonjour 不会禁用广域 DNS-SD。当 Gateway 网关和节点不在同一局域网时，请使用广域设备发现或 Tailnet。
- 在 Docker 外部重用相同的 `OPENCLAW_CONFIG_DIR` 不会保留容器自动禁用策略。
- 仅对主机网络、macvlan 或其他已知可传递 mDNS 多播的网络设置 `OPENCLAW_DISABLE_BONJOUR=0`；将其设为 `1` 可强制禁用。

## 排查已禁用的 Bonjour

如果设置 Docker 后节点不再自动发现 Gateway 网关：

1. 确认 Gateway 网关是在自动、强制开启还是强制关闭模式下运行：

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 确认 Gateway 网关本身可通过已发布的端口访问：

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. 禁用 Bonjour 时使用直接目标：
   - Control UI 或本地工具：`http://127.0.0.1:18789`
   - 局域网客户端：`http://<gateway-host>:18789`
   - 跨网络客户端：Tailnet MagicDNS、Tailnet IP、SSH 隧道或广域 DNS-SD

4. 如果你有意在 Docker 中启用了 Bonjour 插件，并使用 `OPENCLAW_DISABLE_BONJOUR=0` 强制广播，请从主机测试多播：

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   如果浏览结果为空，或 Gateway 网关日志显示重复的 ciao 探测失败，请恢复 `OPENCLAW_DISABLE_BONJOUR=1`，并使用直接路由或 Tailnet 路由。

## 常见故障模式

- **Bonjour 无法跨网络工作**：请使用 Tailnet 或 SSH。
- **组播被阻止**：某些 Wi-Fi 网络会禁用 mDNS。
- **广播器卡在探测/通告状态**：组播被阻止、容器网桥、WSL 或网络接口频繁变化，可能会使响应器处于未通告状态。Gateway 网关仍可通过直连、SSH、Tailnet 或广域 DNS-SD 路由访问；组播不可用时，请使用 `discovery.mdns.mode: "off"` 或 `OPENCLAW_DISABLE_BONJOUR=1` 禁用局域网 Bonjour。
- **Docker 网桥网络**：检测到容器时，Bonjour 会自动禁用。仅在主机网络、macvlan 或其他支持 mDNS 的网络中设置 `OPENCLAW_DISABLE_BONJOUR=0`。
- **休眠/网络接口频繁变化**：macOS 可能暂时无法返回 mDNS 结果；请重试。
- **浏览有效但解析失败**：请使用简单的机器名称（避免表情符号或标点符号），然后重启 Gateway 网关。服务实例名称源自主机名，因此过于复杂的名称可能会使某些解析器无法正确处理。

## 转义后的实例名称（`\032`）

Bonjour/DNS-SD 通常会将服务实例名称中的字节转义为十进制 `\DDD` 序列（空格会变为 `\032`）。这在协议层面是正常现象；UI 应对其解码后再显示（iOS 使用 `BonjourEscapes.decode`）。

## 启用、禁用和配置

| 设置                                              | 效果                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | 在默认未启用该插件的主机上启用内置的局域网设备发现插件。 |
| `openclaw plugins disable bonjour`                   | 通过禁用内置插件来禁用局域网组播通告。               |
| `OPENCLAW_DISABLE_BONJOUR=1`（或 `true`/`yes`/`on`）  | 在不更改插件配置的情况下禁用局域网组播通告。                |
| `OPENCLAW_DISABLE_BONJOUR=0`（或 `false`/`no`/`off`） | 强制启用局域网组播通告，包括在检测到的容器内。        |
| `discovery.mdns.mode`                                | `off` \| `minimal`（默认）\| `full` — 请参阅上述模式。                         |
| `gateway.bind`                                       | 控制 `~/.openclaw/openclaw.json` 中的 Gateway 网关绑定模式。                    |
| `OPENCLAW_SSH_PORT`                                  | 通告 `sshPort` 时覆盖 SSH 端口（完整模式）。                  |
| `OPENCLAW_TAILNET_DNS`                               | 启用 mDNS 完整模式时，在 TXT 中发布 MagicDNS 提示。                  |
| `OPENCLAW_CLI_PATH`                                  | 覆盖通告的 CLI 路径（完整模式）。                                    |

macOS 主机默认会自动启动内置的局域网设备发现插件。启用 Bonjour 插件且未设置 `OPENCLAW_DISABLE_BONJOUR` 时，Bonjour 会在普通主机上进行通告，并在检测到的容器（Docker、Fly.io 机器和常见容器运行时）内自动禁用。

## 相关文档

- 设备发现策略和传输协议选择：[设备发现](/zh-CN/gateway/discovery)
- 节点配对和审批：[Gateway 网关配对](/zh-CN/gateway/pairing)
