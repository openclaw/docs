---
read_when:
    - 调试 macOS/iOS 上的 Bonjour 设备发现问题
    - 更改 mDNS 服务类型、TXT 记录或设备发现 UX
summary: Bonjour/mDNS 设备发现 + 调试（Gateway 网关信标、客户端和常见故障模式）
title: Bonjour 设备发现
x-i18n:
    generated_at: "2026-04-28T23:55:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0720451843aae0509949324e51f3a23dc69e366e68de851c595ce76c8ab0eec9
    source_path: gateway/bonjour.md
    workflow: 16
---

# Bonjour / mDNS 设备发现

OpenClaw 使用 Bonjour（mDNS / DNS‑SD）来发现活动的 Gateway 网关（WebSocket 端点）。
组播 `local.` 浏览是一个**仅限 LAN 的便利功能**。内置的 `bonjour`
插件负责 LAN 广播，并默认启用。对于跨网络设备发现，同一个信标也可以通过配置的广域 DNS-SD 域发布。
设备发现仍然是尽力而为，并且**不会**替代基于 SSH 或 Tailnet 的连接。

## 通过 Tailscale 使用广域 Bonjour（单播 DNS-SD）

如果节点和 Gateway 网关位于不同网络，组播 mDNS 不会跨越边界。
你可以通过切换到 Tailscale 上的**单播 DNS‑SD**（“广域 Bonjour”）来保留相同的设备发现体验。

高层步骤：

1. 在 Gateway 网关主机上运行 DNS 服务器（可通过 Tailnet 访问）。
2. 在专用区域下发布 `_openclaw-gw._tcp` 的 DNS‑SD 记录
   （示例：`openclaw.internal.`）。
3. 配置 Tailscale **拆分 DNS**，让所选域名通过该 DNS 服务器为客户端（包括 iOS）解析。

OpenClaw 支持任意设备发现域名；`openclaw.internal.` 只是一个示例。
iOS/Android 节点会同时浏览 `local.` 和你配置的广域域名。

### Gateway 网关配置（推荐）

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### 一次性 DNS 服务器设置（Gateway 网关主机）

```bash
openclaw dns setup --apply
```

这会安装 CoreDNS，并将其配置为：

- 仅在 Gateway 网关的 Tailscale 接口上的 53 端口监听
- 从 `~/.openclaw/dns/<domain>.db` 提供你选择的域名（示例：`openclaw.internal.`）

从连接到 tailnet 的机器验证：

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 设置

在 Tailscale 管理控制台中：

- 添加一个指向 Gateway 网关 tailnet IP 的名称服务器（UDP/TCP 53）。
- 添加拆分 DNS，让你的设备发现域名使用该名称服务器。

客户端接受 tailnet DNS 后，iOS 节点和 CLI 设备发现就可以在你的设备发现域名中浏览
`_openclaw-gw._tcp`，无需组播。

### Gateway 网关监听器安全性（推荐）

Gateway 网关 WS 端口（默认 `18789`）默认绑定到环回地址。对于 LAN/tailnet
访问，请显式绑定并保持启用身份验证。

对于仅限 tailnet 的设置：

- 在 `~/.openclaw/openclaw.json` 中设置 `gateway.bind: "tailnet"`。
- 重启 Gateway 网关（或重启 macOS 菜单栏应用）。

## 广播内容

只有 Gateway 网关会广播 `_openclaw-gw._tcp`。LAN 组播广播由内置 `bonjour` 插件提供；广域 DNS-SD 发布仍由 Gateway 网关负责。

## 服务类型

- `_openclaw-gw._tcp` — Gateway 网关传输信标（供 macOS/iOS/Android 节点使用）。

## TXT 键（非秘密提示）

Gateway 网关会广播少量非秘密提示，让 UI 流程更方便：

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>`（Gateway 网关 WS + HTTP）
- `gatewayTls=1`（仅在启用 TLS 时）
- `gatewayTlsSha256=<sha256>`（仅在启用 TLS 且指纹可用时）
- `canvasPort=<port>`（仅在画布主机启用时；当前与 `gatewayPort` 相同）
- `transport=gateway`
- `tailnetDns=<magicdns>`（仅限 mDNS 完整模式，Tailnet 可用时的可选提示）
- `sshPort=<port>`（仅限 mDNS 完整模式；广域 DNS-SD 可能会省略）
- `cliPath=<path>`（仅限 mDNS 完整模式；广域 DNS-SD 仍会将其写入为远程安装提示）

安全注意事项：

- Bonjour/mDNS TXT 记录**未经身份验证**。客户端不得将 TXT 视为权威路由信息。
- 客户端应使用解析出的服务端点（SRV + A/AAAA）进行路由。仅将 `lanHost`、`tailnetDns`、`gatewayPort` 和 `gatewayTlsSha256` 视为提示。
- SSH 自动定位同样应使用解析出的服务主机，而不是仅来自 TXT 的提示。
- TLS 固定绝不能允许广播的 `gatewayTlsSha256` 覆盖先前存储的固定值。
- iOS/Android 节点应将基于设备发现的直接连接视为**仅 TLS**，并且在信任首次出现的指纹之前要求用户明确确认。

## 在 macOS 上调试

有用的内置工具：

- 浏览实例：

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 解析一个实例（替换 `<instance>`）：

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

如果浏览有效但解析失败，你通常遇到的是 LAN 策略或 mDNS 解析器问题。

## 在 Gateway 网关日志中调试

Gateway 网关会写入滚动日志文件（启动时会打印为
`gateway log file: ...`）。查找 `bonjour:` 行，尤其是：

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

当系统主机名是有效的 DNS 标签时，Bonjour 会使用系统主机名作为广播的 `.local` 主机。
如果系统主机名包含空格、下划线或其他无效 DNS 标签字符，OpenClaw 会回退到 `openclaw.local`。
当你需要显式主机标签时，请在启动 Gateway 网关前设置
`OPENCLAW_MDNS_HOSTNAME=<name>`。

## 在 iOS 节点上调试

iOS 节点使用 `NWBrowser` 来发现 `_openclaw-gw._tcp`。

要捕获日志：

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → reproduce → **Copy**

日志包含浏览器状态转换和结果集变化。

## 何时禁用 Bonjour

仅在 LAN 组播广播不可用或有害时禁用 Bonjour。
常见情况是 Gateway 网关运行在 Docker 桥接网络、WSL 或会丢弃 mDNS 组播的网络策略后面。
在这些环境中，Gateway 网关仍然可以通过其发布的 URL、SSH、Tailnet 或广域 DNS-SD 访问，
但 LAN 自动发现并不可靠。

当问题属于部署范围时，优先使用现有环境覆盖：

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

这会禁用 LAN 组播广播，而不更改插件配置。
它适用于 Docker 镜像、服务文件、启动脚本和一次性调试，因为环境消失时该设置也会消失。

只有当你有意为该 OpenClaw 配置关闭内置 LAN 设备发现插件时，才使用插件配置：

```bash
openclaw plugins disable bonjour
```

## Docker 注意事项

当未设置 `OPENCLAW_DISABLE_BONJOUR` 时，内置 Bonjour 插件会在检测到的容器中自动禁用 LAN 组播广播。
Docker 桥接网络通常不会在容器和 LAN 之间转发 mDNS 组播（`224.0.0.251:5353`），
因此从容器广播很少能让设备发现正常工作。

重要注意事项：

- 禁用 Bonjour 不会停止 Gateway 网关。它只会停止 LAN 组播广播。
- 禁用 Bonjour 不会更改 `gateway.bind`；Docker 仍默认使用
  `OPENCLAW_GATEWAY_BIND=lan`，以便发布的主机端口可以工作。
- 禁用 Bonjour 不会禁用广域 DNS-SD。当 Gateway 网关和节点不在同一个 LAN 上时，请使用广域设备发现或 Tailnet。
- 在 Docker 外部复用同一个 `OPENCLAW_CONFIG_DIR` 不会持久化容器自动禁用策略。
- 仅在主机网络、macvlan 或其他已知 mDNS 组播可通过的网络中设置 `OPENCLAW_DISABLE_BONJOUR=0`；设置为 `1` 可强制禁用。

## 排查被禁用的 Bonjour

如果 Docker 设置后节点不再自动发现 Gateway 网关：

1. 确认 Gateway 网关是运行在自动、强制开启还是强制关闭模式：

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 确认 Gateway 网关本身可通过发布端口访问：

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour 被禁用时使用直接目标：
   - 控制 UI 或本地工具：`http://127.0.0.1:18789`
   - LAN 客户端：`http://<gateway-host>:18789`
   - 跨网络客户端：Tailnet MagicDNS、Tailnet IP、SSH 隧道或
     广域 DNS-SD

4. 如果你在 Docker 中通过
   `OPENCLAW_DISABLE_BONJOUR=0` 有意启用了 Bonjour，请从主机测试组播：

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   如果浏览结果为空，或 Gateway 网关日志显示反复出现 ciao 看门狗取消，
   请恢复 `OPENCLAW_DISABLE_BONJOUR=1`，并使用直接路由或 Tailnet 路由。

## 常见故障模式

- **Bonjour 不会跨网络**：使用 Tailnet 或 SSH。
- **组播被阻止**：某些 Wi‑Fi 网络会禁用 mDNS。
- **广播器卡在探测/广播中**：组播被阻止的主机、容器桥接、WSL 或接口变动可能会让 ciao 广播器停留在未广播状态。OpenClaw 会重试几次，然后为当前 Gateway 网关进程禁用 Bonjour，而不是无限重启广播器。
- **Docker 桥接网络**：Bonjour 会在检测到的容器中自动禁用。仅对主机、macvlan 或其他支持 mDNS 的网络设置 `OPENCLAW_DISABLE_BONJOUR=0`。
- **睡眠/接口变动**：macOS 可能会临时丢失 mDNS 结果；请重试。
- **浏览有效但解析失败**：保持机器名称简单（避免表情符号或标点），然后重启 Gateway 网关。服务实例名称派生自主机名，因此过于复杂的名称可能会让某些解析器困惑。

## 转义的实例名称（`\032`）

Bonjour/DNS‑SD 通常会将服务实例名称中的字节转义为十进制 `\DDD`
序列（例如空格会变成 `\032`）。

- 这在协议层面是正常的。
- UI 应解码后显示（iOS 使用 `BonjourEscapes.decode`）。

## 禁用 / 配置

- `openclaw plugins disable bonjour` 通过禁用内置插件来禁用 LAN 组播广播。
- `openclaw plugins enable bonjour` 会恢复默认 LAN 设备发现插件。
- `OPENCLAW_DISABLE_BONJOUR=1` 会在不更改插件配置的情况下禁用 LAN 组播广播；接受的真值为 `1`、`true`、`yes` 和 `on`（旧版：`OPENCLAW_DISABLE_BONJOUR`）。
- `OPENCLAW_DISABLE_BONJOUR=0` 会强制开启 LAN 组播广播，包括在检测到的容器内部；接受的假值为 `0`、`false`、`no` 和 `off`。
- 当未设置 `OPENCLAW_DISABLE_BONJOUR` 时，Bonjour 会在普通主机上广播，并在检测到的容器内自动禁用。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制 Gateway 网关绑定模式。
- 当广播 `sshPort` 时，`OPENCLAW_SSH_PORT` 会覆盖 SSH 端口（旧版：`OPENCLAW_SSH_PORT`）。
- 当启用 mDNS 完整模式时，`OPENCLAW_TAILNET_DNS` 会在 TXT 中发布 MagicDNS 提示（旧版：`OPENCLAW_TAILNET_DNS`）。
- `OPENCLAW_CLI_PATH` 会覆盖广播的 CLI 路径（旧版：`OPENCLAW_CLI_PATH`）。

## 相关文档

- 设备发现策略和传输选择：[设备发现](/zh-CN/gateway/discovery)
- 节点配对 + 审批：[Gateway 网关配对](/zh-CN/gateway/pairing)
