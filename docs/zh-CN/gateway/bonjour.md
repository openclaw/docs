---
read_when:
    - 调试 macOS/iOS 上的 Bonjour 设备发现问题
    - 更改 mDNS 服务类型、TXT 记录或设备发现用户体验
summary: Bonjour/mDNS 设备发现与调试（Gateway 网关信标、客户端及常见故障模式）
title: Bonjour 设备发现
x-i18n:
    generated_at: "2026-07-11T20:30:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw 可以使用 Bonjour（mDNS/DNS-SD）发现活动的 Gateway 网关（WebSocket 端点）。组播 `local.` 浏览是一项**仅限局域网的便利功能**：内置的 `bonjour` 插件负责局域网广播，在 macOS 主机上自动启动，而在 Linux、Windows 和容器化 Gateway 网关部署中需选择启用。同一个信标还可以通过已配置的广域 DNS-SD 域发布，以支持跨网络发现。设备发现采用尽力而为的方式，**不能**替代基于 SSH 或 Tailnet 的连接。

## 通过 Tailscale 使用广域 Bonjour（单播 DNS-SD）

如果节点和 Gateway 网关位于不同网络中，组播 mDNS 无法跨越网络边界。可以改用通过 Tailscale 传输的**单播 DNS-SD**（“广域 Bonjour”），同时保持相同的设备发现体验：

1. 在 Gateway 网关主机上运行一个可通过 Tailnet 访问的 DNS 服务器。
2. 在专用区域下发布 `_openclaw-gw._tcp` 的 DNS-SD 记录（例如：`openclaw.internal.`）。
3. 配置 Tailscale **分流 DNS**，使客户端（包括 iOS）通过该 DNS 服务器解析你选择的域。

上面的 `openclaw.internal.` 只是示例——OpenClaw 支持任何设备发现域。iOS/Android 节点会同时浏览 `local.` 和你配置的广域域。

### Gateway 配置

```json5
{
  gateway: { bind: "tailnet" }, // 仅限 tailnet（推荐）
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

未设置 `discovery.wideArea.domain` 时，也可以使用 `OPENCLAW_WIDE_AREA_DOMAIN` 环境变量作为后备值。

### 一次性 DNS 服务器设置（Gateway 网关主机，仅限 macOS）

```bash
openclaw dns setup --apply
```

此命令仅适用于 macOS，并且要求安装 Homebrew 且 Tailscale 连接正在运行。它会安装 CoreDNS（`brew install coredns`）并将其配置为：

- 仅在 Gateway 网关的 Tailscale 接口上监听端口 53
- 从 `~/.openclaw/dns/<domain>.db` 提供你选择的域（例如：`openclaw.internal.`）

首次运行时不要添加 `--apply`，以便在不安装任何内容的情况下预览计划（域、区域文件路径、检测到的 Tailnet IP、推荐配置）。

从已连接 Tailnet 的计算机进行验证：

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 设置

在 Tailscale 管理控制台中：

- 添加一个指向 Gateway 网关 Tailnet IP 的名称服务器（UDP/TCP 53）。
- 添加分流 DNS，使你的设备发现域使用该名称服务器。

客户端接受 Tailnet DNS 后，iOS 节点和 CLI 设备发现便可在你的设备发现域中浏览 `_openclaw-gw._tcp`，无需使用组播。

### Gateway 网关监听器安全性

Gateway 网关 WS 端口（默认 `18789`）默认绑定到环回接口。若要通过局域网/Tailnet 访问，请显式绑定并保持身份验证启用。对于仅限 Tailnet 的设置，请在 `~/.openclaw/openclaw.json` 中设置 `gateway.bind: "tailnet"`，然后重启 Gateway 网关（或 macOS 菜单栏应用）。

## 广播内容

只有 Gateway 网关会广播 `_openclaw-gw._tcp`。启用内置 `bonjour` 插件后，局域网组播广播由该插件提供；广域 DNS-SD 发布仍由 Gateway 网关负责。

## 服务类型

- `_openclaw-gw._tcp` - Gateway 网关传输信标，由 macOS/iOS/Android 节点使用。

## TXT 键（非机密提示）

| 键                            | 存在条件                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | 始终存在。                                                                     |
| `displayName=<friendly name>` | 始终存在。                                                                     |
| `lanHost=<hostname>.local`    | 始终存在。                                                                     |
| `gatewayPort=<port>`          | 始终存在（Gateway 网关 WS + HTTP）。                                           |
| `transport=gateway`           | 始终存在。                                                                     |
| `gatewayTls=1`                | 仅在启用 TLS 时存在。                                                          |
| `gatewayTlsSha256=<sha256>`   | 仅在启用 TLS 且指纹可用时存在。                                                |
| `gatewayDirectReachable=1`    | 仅在 Gateway 网关可直接访问时存在（而非只能通过中继/代理路径访问）。           |
| `canvasPort=<port>`           | 仅在启用画布主机时存在；目前与 `gatewayPort` 相同。                            |
| `tailnetDns=<magicdns>`       | 仅限 mDNS 完整模式；Tailnet 可用时提供的可选提示。                             |
| `sshPort=<port>`              | 仅限完整模式；在最小模式和关闭模式中省略。                                    |
| `cliPath=<path>`              | 仅限完整模式；在最小模式和关闭模式中省略。                                    |

安全说明：

- Bonjour/mDNS TXT 记录**未经身份验证**。客户端不得将 TXT 视为权威路由信息。
- 客户端应使用解析出的服务端点（SRV + A/AAAA）进行路由。仅将 `lanHost`、`tailnetDns`、`gatewayPort` 和 `gatewayTlsSha256` 视为提示。
- SSH 自动目标选择同样应使用解析出的服务主机，而不是仅使用 TXT 提示。
- TLS 固定绝不能允许广播的 `gatewayTlsSha256` 覆盖之前存储的固定值。
- iOS/Android 节点应将基于设备发现的直接连接视为**仅限 TLS**，并且在信任首次出现的指纹之前要求用户明确确认。

## 在 macOS 上调试

内置工具：

```bash
# 浏览实例
dns-sd -B _openclaw-gw._tcp local.

# 解析一个实例（替换 <instance>）
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

如果浏览正常但解析失败，通常是局域网策略或 mDNS 解析器存在问题。

## 在 Gateway 网关日志中调试

Gateway 网关会写入滚动日志文件（启动时显示为 `gateway log file: ...`）。查找以 `bonjour:` 开头的行，尤其是：

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

看门狗会将活动的 `probing`、`announcing` 和最近因冲突而进行的重命名视为正在进行的状态。如果服务始终无法达到 `announced` 状态，OpenClaw 会重新创建广播器；在反复失败后，它会为该 Gateway 网关进程禁用 Bonjour，而不是无限期地重新广播。

当系统主机名是有效的 DNS 标签时，Bonjour 会将其用作广播的 `.local` 主机名。如果系统主机名包含空格、下划线或其他无效的 DNS 标签字符，OpenClaw 会回退到 `openclaw.local`。如果需要显式指定主机标签，请在启动 Gateway 网关前设置 `OPENCLAW_MDNS_HOSTNAME=<name>`。

## 在 iOS 节点上调试

iOS 节点使用 `NWBrowser` 发现 `_openclaw-gw._tcp`。

若要捕获日志：设置 -> Gateway 网关 -> 高级 -> **设备发现调试日志**，然后设置 -> Gateway 网关 -> 高级 -> **设备发现日志** -> 复现问题 -> **复制**。日志包含浏览器状态转换和结果集变化。

## 何时启用 Bonjour

在 macOS 主机上以空配置启动 Gateway 网关时，Bonjour 会自动启动，因为本地应用和附近的 iOS/Android 节点通常依赖同一局域网内的设备发现。

当 Linux、Windows 或其他非 macOS 主机需要同一局域网内的自动发现时，请显式启用：

```bash
openclaw plugins enable bonjour
```

启用后，Bonjour 使用 `discovery.mdns.mode` 决定发布多少 TXT 元数据；同一模式也控制广域 DNS-SD 记录中的可选 TXT 提示。模式如下：

| 模式                | 行为                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`（默认）   | 仅包含核心 TXT 键；省略 `sshPort`、`cliPath`、`tailnetDns`。                                                                                                  |
| `full`              | 添加 `sshPort`、`cliPath`、`tailnetDns`——当客户端需要这些提示时使用。                                                                                          |
| `off`               | 在不更改插件启用状态的情况下抑制局域网组播；当 `discovery.wideArea.enabled` 为 true 时，广域 DNS-SD 仍可发布最小信标。                                          |

## 何时禁用 Bonjour

如果局域网组播广播不必要、不可用或有害，请保持 Bonjour 禁用——常见情况包括非 macOS 服务器、Docker 桥接网络、WSL，或者会丢弃 mDNS 组播的网络策略。Gateway 网关仍可通过其发布的 URL、SSH、Tailnet 或广域 DNS-SD 访问；只有局域网自动发现不可靠。

对于部署范围的问题，请使用环境变量覆盖（适用于 Docker 镜像、服务文件、启动脚本和一次性调试——环境消失时，该设置也会消失）：

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

如果你明确希望为该 OpenClaw 配置关闭内置的局域网设备发现插件，请使用插件配置：

```bash
openclaw plugins disable bonjour
```

## Docker 注意事项

在检测到容器且未设置 `OPENCLAW_DISABLE_BONJOUR` 时，内置 Bonjour 插件会自动禁用局域网组播广播。Docker 桥接网络通常不会在容器与局域网之间转发 mDNS 组播（`224.0.0.251:5353`），因此从容器进行广播通常无法实现设备发现。

注意事项：

- Bonjour 在 macOS 主机上自动启动，在其他平台上则需选择启用。保持禁用不会阻止 Gateway 网关运行——只会跳过局域网组播广播。
- 禁用 Bonjour 不会更改 `gateway.bind`；Docker 仍默认使用 `OPENCLAW_GATEWAY_BIND=lan`，以确保发布的主机端口可用。
- 禁用 Bonjour 不会禁用广域 DNS-SD。当 Gateway 网关和节点不在同一局域网中时，请使用广域设备发现或 Tailnet。
- 在 Docker 外部复用相同的 `OPENCLAW_CONFIG_DIR` 不会保留容器的自动禁用策略。
- 仅在主机网络、macvlan 或其他已知可传递 mDNS 组播的网络中设置 `OPENCLAW_DISABLE_BONJOUR=0`；设置为 `1` 可强制禁用。

## 排查 Bonjour 被禁用的问题

如果完成 Docker 设置后，节点不再自动发现 Gateway 网关：

1. 确认 Gateway 网关当前运行于自动、强制启用还是强制禁用模式：

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 确认 Gateway 网关本身可通过发布的端口访问：

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour 被禁用时使用直接目标：
   - Control UI 或本地工具：`http://127.0.0.1:18789`
   - 局域网客户端：`http://<gateway-host>:18789`
   - 跨网络客户端：Tailnet MagicDNS、Tailnet IP、SSH 隧道或广域 DNS-SD

4. 如果你在 Docker 中有意启用了 Bonjour 插件，并通过 `OPENCLAW_DISABLE_BONJOUR=0` 强制广播，请从主机测试组播：

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   如果浏览结果为空，或者 Gateway 网关日志显示 ciao 看门狗反复取消，请恢复 `OPENCLAW_DISABLE_BONJOUR=1`，并使用直接路由或 Tailnet 路由。

## 常见故障模式

- **Bonjour 无法跨网络工作**：请使用 Tailnet 或 SSH。
- **组播被阻止**：部分 Wi-Fi 网络会禁用 mDNS。
- **广播程序停滞在探测/宣告阶段**：组播被阻止的主机、容器网桥、WSL 或网络接口频繁变动，可能会使 ciao 广播程序停留在未宣告状态。OpenClaw 会重试几次，然后为当前 Gateway 网关进程禁用 Bonjour，而不是无限重启广播程序。
- **Docker 网桥网络**：在检测到的容器中，Bonjour 会自动禁用。仅当使用主机网络、macvlan 或其他支持 mDNS 的网络时，才设置 `OPENCLAW_DISABLE_BONJOUR=0`。
- **睡眠/网络接口变动**：macOS 可能暂时无法获取 mDNS 结果；请重试。
- **浏览有效但解析失败**：请保持计算机名称简单（避免使用表情符号或标点符号），然后重启 Gateway 网关。服务实例名称派生自主机名，因此过于复杂的名称可能会使某些解析器无法正确处理。

## 转义的实例名称（`\032`）

Bonjour/DNS-SD 通常会将服务实例名称中的字节转义为十进制 `\DDD` 序列（空格会变为 `\032`）。这在协议层面属于正常现象；UI 应解码后再显示（iOS 使用 `BonjourEscapes.decode`）。

## 启用、禁用与配置

| 设置                                                 | 效果                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | 在默认未启用该插件的主机上，启用内置的 LAN 设备发现插件。                             |
| `openclaw plugins disable bonjour`                   | 通过禁用内置插件来禁用 LAN 组播广播。                                                  |
| `OPENCLAW_DISABLE_BONJOUR=1`（或 `true`/`yes`/`on`） | 在不更改插件配置的情况下禁用 LAN 组播广播。                                            |
| `OPENCLAW_DISABLE_BONJOUR=0`（或 `false`/`no`/`off`）| 强制启用 LAN 组播广播，包括在检测到的容器内。                                          |
| `discovery.mdns.mode`                                | `off` \| `minimal`（默认）\| `full` — 请参阅上文的模式说明。                           |
| `gateway.bind`                                       | 控制 `~/.openclaw/openclaw.json` 中的 Gateway 网关绑定模式。                           |
| `OPENCLAW_SSH_PORT`                                  | 广播 `sshPort` 时覆盖 SSH 端口（完整模式）。                                           |
| `OPENCLAW_TAILNET_DNS`                               | 启用 mDNS 完整模式时，在 TXT 中发布 MagicDNS 提示。                                    |
| `OPENCLAW_CLI_PATH`                                  | 覆盖广播的 CLI 路径（完整模式）。                                                       |

默认情况下，macOS 主机会自动启动内置的 LAN 设备发现插件。启用 Bonjour 插件且未设置 `OPENCLAW_DISABLE_BONJOUR` 时，Bonjour 会在普通主机上进行广播，并在检测到的容器（Docker、Fly.io 机器和常见容器运行时）内自动禁用。

## 相关文档

- 设备发现策略和传输协议选择：[设备发现](/zh-CN/gateway/discovery)
- 节点配对与审批：[Gateway 网关配对](/zh-CN/gateway/pairing)
