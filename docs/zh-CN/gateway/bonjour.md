---
read_when:
    - 在 macOS/iOS 上调试 Bonjour 发现问题
    - 更改 mDNS 服务类型、TXT 记录或发现 UX
summary: Bonjour/mDNS 发现 + 调试（Gateway 网关信标、客户端和常见故障模式）
title: Bonjour 发现
x-i18n:
    generated_at: "2026-04-27T10:58:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d00812e18ffa34cd829af88acf5c52966669cf42d4f01f7ad566587b8605ded
    source_path: gateway/bonjour.md
    workflow: 15
---

# Bonjour / mDNS 发现

OpenClaw 使用 Bonjour（mDNS / DNS‑SD）来发现活动中的 Gateway 网关（WebSocket 端点）。
多播 `local.` 浏览是一种**仅限局域网的便利功能**。内置的 `bonjour`
插件负责局域网广播，并且默认启用。对于跨网络发现，
同一信标也可以通过已配置的广域 DNS-SD 域发布。
发现机制仍然是尽力而为，并**不能**替代 SSH 或基于 Tailnet 的连接方式。

## 通过 Tailscale 使用广域 Bonjour（单播 DNS-SD）

如果节点与网关位于不同网络，多播 mDNS 将无法跨越该
边界。你仍然可以通过在 Tailscale 上切换到**单播 DNS‑SD**
（“广域 Bonjour”）来保留相同的发现 UX。

高级步骤如下：

1. 在网关主机上运行一个 DNS 服务器（可通过 Tailnet 访问）。
2. 在专用区域下为 `_openclaw-gw._tcp` 发布 DNS‑SD 记录
   （示例：`openclaw.internal.`）。
3. 配置 Tailscale **split DNS**，使客户端（包括 iOS）
   通过该 DNS 服务器解析你选择的域名。

OpenClaw 支持任意发现域；`openclaw.internal.` 只是一个示例。
iOS/Android 节点会同时浏览 `local.` 和你配置的广域域名。

### Gateway 网关配置（推荐）

```json5
{
  gateway: { bind: "tailnet" }, // 仅 tailnet（推荐）
  discovery: { wideArea: { enabled: true } }, // 启用广域 DNS-SD 发布
}
```

### 一次性 DNS 服务器设置（网关主机）

```bash
openclaw dns setup --apply
```

这会安装 CoreDNS，并将其配置为：

- 仅在网关的 Tailscale 接口上监听 53 端口
- 从 `~/.openclaw/dns/<domain>.db` 为你选择的域名（示例：`openclaw.internal.`）提供服务

在已连接 tailnet 的机器上验证：

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 设置

在 Tailscale 管理控制台中：

- 添加一个指向网关 tailnet IP 的名称服务器（UDP/TCP 53）。
- 添加 split DNS，使你的发现域使用该名称服务器。

一旦客户端接受 tailnet DNS，iOS 节点和 CLI 发现就可以在你的发现域中浏览
`_openclaw-gw._tcp`，而无需多播。

### Gateway 网关监听器安全性（推荐）

Gateway 网关的 WS 端口（默认 `18789`）默认绑定到 loopback。对于局域网/tailnet
访问，请显式绑定并保持身份验证开启。

对于仅 tailnet 的设置：

- 在 `~/.openclaw/openclaw.json` 中设置 `gateway.bind: "tailnet"`。
- 重启 Gateway 网关（或重启 macOS 菜单栏应用）。

## 广播内容

只有 Gateway 网关会广播 `_openclaw-gw._tcp`。局域网多播广播由
内置的 `bonjour` 插件提供；广域 DNS-SD 发布仍由
Gateway 网关负责。

## 服务类型

- `_openclaw-gw._tcp` — 网关传输信标（由 macOS/iOS/Android 节点使用）。

## TXT 键名（非机密提示）

Gateway 网关会广播一些小型的非机密提示，以便简化 UI 流程：

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>`（Gateway 网关 WS + HTTP）
- `gatewayTls=1`（仅当启用 TLS 时）
- `gatewayTlsSha256=<sha256>`（仅当启用 TLS 且指纹可用时）
- `canvasPort=<port>`（仅当启用 canvas host 时；当前与 `gatewayPort` 相同）
- `transport=gateway`
- `tailnetDns=<magicdns>`（仅 mDNS 完整模式；当 Tailnet 可用时的可选提示）
- `sshPort=<port>`（仅 mDNS 完整模式；广域 DNS-SD 可能省略该项）
- `cliPath=<path>`（仅 mDNS 完整模式；广域 DNS-SD 仍会将其写入为远程安装提示）

安全说明：

- Bonjour/mDNS TXT 记录**未经身份验证**。客户端不得将 TXT 视为权威路由信息。
- 客户端应使用已解析的服务端点（SRV + A/AAAA）进行路由。仅将 `lanHost`、`tailnetDns`、`gatewayPort` 和 `gatewayTlsSha256` 视为提示信息。
- SSH 自动目标选择同样应使用已解析的服务主机，而不是仅使用 TXT 提示。
- TLS pinning 绝不能允许广播的 `gatewayTlsSha256` 覆盖之前已存储的 pin。
- iOS/Android 节点应将基于发现的直接连接视为**仅限 TLS**，并在首次信任某个指纹之前要求用户明确确认。

## 在 macOS 上调试

有用的内置工具：

- 浏览实例：

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 解析单个实例（替换 `<instance>`）：

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

如果浏览可用但解析失败，通常说明你遇到了局域网策略或
mDNS 解析器问题。

## 在 Gateway 网关日志中调试

Gateway 网关会写入滚动日志文件（启动时会打印为
`gateway log file: ...`）。请查找 `bonjour:` 行，尤其是：

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

当系统主机名是有效的 DNS 标签时，Bonjour 会使用系统主机名作为广播的 `.local`
主机名。如果系统主机名包含空格、下划线或其他
无效 DNS 标签字符，OpenClaw 会回退到 `openclaw.local`。当你需要
显式主机标签时，请在启动 Gateway 网关前设置
`OPENCLAW_MDNS_HOSTNAME=<name>`。

## 在 iOS 节点上调试

iOS 节点使用 `NWBrowser` 发现 `_openclaw-gw._tcp`。

要捕获日志：

- 设置 → Gateway 网关 → 高级 → **Discovery Debug Logs**
- 设置 → Gateway 网关 → 高级 → **Discovery Logs** → 复现问题 → **Copy**

日志包含浏览器状态转换和结果集变化。

## 何时禁用 Bonjour

仅当局域网多播广播不可用或有害时才禁用 Bonjour。
常见情况包括 Gateway 网关运行在 Docker bridge networking、WSL 或会丢弃 mDNS 多播的
网络策略之后。在这些环境中，Gateway 网关仍然可以通过其发布的 URL、SSH、Tailnet 或广域 DNS-SD 访问，
但局域网自动发现并不可靠。

当问题仅限于部署范围时，优先使用现有的环境变量覆盖：

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

这会禁用局域网多播广播，而不会更改插件配置。
这对于 Docker 镜像、服务文件、启动脚本和一次性
调试都很安全，因为当环境变量消失时，该设置也会随之消失。

仅当你确实想为该 OpenClaw 配置关闭
内置局域网发现插件时，才使用插件配置：

```bash
openclaw plugins disable bonjour
```

## Docker 注意事项

内置 Bonjour 插件会在检测到的容器中、且未设置 `OPENCLAW_DISABLE_BONJOUR` 时自动禁用局域网多播广播。Docker bridge networks
通常不会在容器与局域网之间转发 mDNS 多播（`224.0.0.251:5353`），
因此从容器中广播通常无法真正实现发现。

重要注意事项：

- 禁用 Bonjour 不会停止 Gateway 网关。它只会停止局域网多播
  广播。
- 禁用 Bonjour 不会更改 `gateway.bind`；Docker 仍默认使用
  `OPENCLAW_GATEWAY_BIND=lan`，以便已发布的主机端口可以正常工作。
- 禁用 Bonjour 不会禁用广域 DNS-SD。当 Gateway 网关与节点不在同一局域网时，
  请使用广域发现或 Tailnet。
- 在 Docker 外复用相同的 `OPENCLAW_CONFIG_DIR` 不会保留
  容器自动禁用策略。
- 仅当已知 mDNS 多播可以通过 host networking、macvlan 或其他
  网络时，才设置 `OPENCLAW_DISABLE_BONJOUR=0`；设置为 `1` 可强制禁用。

## 已禁用 Bonjour 的故障排除

如果在 Docker 设置后，某个节点不再自动发现 Gateway 网关：

1. 确认 Gateway 网关当前处于自动、强制开启还是强制关闭模式：

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 确认 Gateway 网关本身可以通过已发布端口访问：

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. 当 Bonjour 被禁用时，使用直接目标：
   - Control UI 或本地工具：`http://127.0.0.1:18789`
   - 局域网客户端：`http://<gateway-host>:18789`
   - 跨网络客户端：Tailnet MagicDNS、Tailnet IP、SSH 隧道或
     广域 DNS-SD

4. 如果你故意在 Docker 中通过
   `OPENCLAW_DISABLE_BONJOUR=0` 启用了 Bonjour，请从主机测试多播：

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   如果浏览结果为空，或者 Gateway 网关日志显示反复出现 ciao watchdog
   cancellation，请恢复 `OPENCLAW_DISABLE_BONJOUR=1`，并使用直接路由或
   Tailnet 路由。

## 常见故障模式

- **Bonjour 不会跨网络工作**：请使用 Tailnet 或 SSH。
- **多播被阻止**：某些 Wi‑Fi 网络会禁用 mDNS。
- **广播器卡在 probing/announcing**：多播被阻止的主机、
  容器桥接、WSL 或接口抖动都可能导致 ciao 广播器停留在
  未广播状态。OpenClaw 会重试几次，然后为当前 Gateway 网关进程禁用 Bonjour，
  而不是无限重启广播器。
- **Docker bridge networking**：Bonjour 会在检测到的容器中自动禁用。
  仅当网络是 host、macvlan 或其他
  支持 mDNS 的网络时，才设置 `OPENCLAW_DISABLE_BONJOUR=0`。
- **休眠 / 接口抖动**：macOS 可能会暂时丢失 mDNS 结果；请重试。
- **浏览可用但解析失败**：请保持机器名称简洁（避免使用表情符号或
  标点符号），然后重启 Gateway 网关。服务实例名称派生自
  主机名，因此过于复杂的名称可能会让某些解析器出错。

## 转义的实例名称（`\032`）

Bonjour/DNS‑SD 通常会将服务实例名称中的字节转义为十进制 `\DDD`
序列（例如空格会变成 `\032`）。

- 这在协议层面是正常现象。
- UI 应在显示时进行解码（iOS 使用 `BonjourEscapes.decode`）。

## 禁用 / 配置

- `openclaw plugins disable bonjour` 通过禁用内置插件来禁用局域网多播广播。
- `openclaw plugins enable bonjour` 恢复默认的局域网发现插件。
- `OPENCLAW_DISABLE_BONJOUR=1` 在不更改插件配置的情况下禁用局域网多播广播；可接受的真值包括 `1`、`true`、`yes` 和 `on`（旧版：`OPENCLAW_DISABLE_BONJOUR`）。
- `OPENCLAW_DISABLE_BONJOUR=0` 强制开启局域网多播广播，包括在检测到的容器内部；可接受的假值包括 `0`、`false`、`no` 和 `off`。
- 当 `OPENCLAW_DISABLE_BONJOUR` 未设置时，Bonjour 会在正常主机上广播，并在检测到的容器内自动禁用。
- `gateway.bind` 在 `~/.openclaw/openclaw.json` 中控制 Gateway 网关绑定模式。
- `OPENCLAW_SSH_PORT` 会在广播 `sshPort` 时覆盖 SSH 端口（旧版：`OPENCLAW_SSH_PORT`）。
- `OPENCLAW_TAILNET_DNS` 会在启用 mDNS 完整模式时在 TXT 中发布 MagicDNS 提示（旧版：`OPENCLAW_TAILNET_DNS`）。
- `OPENCLAW_CLI_PATH` 会覆盖广播的 CLI 路径（旧版：`OPENCLAW_CLI_PATH`）。

## 相关文档

- 设备发现策略与传输选择：[设备发现](/zh-CN/gateway/discovery)
- 节点配对 + 审批：[Gateway 网关配对](/zh-CN/gateway/pairing)
