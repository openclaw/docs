---
read_when:
    - 设置或调试远程 Mac 控制
summary: 用于通过 SSH 控制远程 OpenClaw Gateway 网关的 macOS 应用流程
title: 远程控制
x-i18n:
    generated_at: "2026-05-06T04:10:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd7eb110f4c3e6a52b4b9baeccce4ef9d02c01104c188940c28f245bc161894a
    source_path: platforms/mac/remote.md
    workflow: 16
---

此流程让 macOS 应用可以作为运行在另一台主机（台式机/服务器）上的 OpenClaw Gateway 网关的完整远程控制器。这是应用的 **Remote over SSH**（远程运行）功能。所有功能（健康检查、Voice Wake 转发和 Web Chat）都会复用 _Settings → General_ 中的同一套远程 SSH 配置。

## 模式

- **Local (this Mac)**：所有内容都在笔记本电脑上运行。不涉及 SSH。
- **Remote over SSH (default)**：OpenClaw 命令在远程主机上执行。Mac 应用会使用 `-o BatchMode`、你选择的身份/密钥以及本地端口转发打开 SSH 连接。
- **Remote direct (ws/wss)**：没有 SSH 隧道。Mac 应用会直接连接到 Gateway 网关 URL（例如通过 Tailscale Serve 或公共 HTTPS 反向代理）。

## 远程传输协议

远程模式支持两种传输协议：

- **SSH tunnel**（默认）：使用 `ssh -N -L ...` 将 Gateway 网关端口转发到 localhost。由于隧道是 loopback，Gateway 网关会看到节点 IP 为 `127.0.0.1`。
- **Direct (ws/wss)**：直接连接到 Gateway 网关 URL。Gateway 网关会看到真实客户端 IP。

在 SSH 隧道模式下，发现到的 LAN/tailnet 主机名会保存为
`gateway.remote.sshTarget`。应用会将 `gateway.remote.url` 保持在本地
隧道端点上，例如 `ws://127.0.0.1:18789`，因此 CLI、Web Chat 和
本地 node-host 服务都会使用同一个安全的 loopback 传输协议。

远程模式下的浏览器自动化由 CLI node host 负责，而不是由原生 macOS
应用节点负责。应用会在可能时启动已安装的 node host 服务；如果你需要从那台 Mac
进行浏览器控制，请使用 `openclaw node install ...` 和 `openclaw node start`
安装/启动它（或在前台运行 `openclaw node run ...`），然后将目标设为那个具备浏览器能力的
节点。

## 远程主机上的前提条件

1. 安装 Node + pnpm，并构建/安装 OpenClaw CLI（`pnpm install && pnpm build && pnpm link --global`）。
2. 确保非交互式 shell 的 PATH 中包含 `openclaw`（如有需要，可符号链接到 `/usr/local/bin` 或 `/opt/homebrew/bin`）。
3. 使用密钥认证打开 SSH。我们建议使用 **Tailscale** IP，以便在 LAN 外保持稳定可达。

## macOS 应用设置

1. 打开 _Settings → General_。
2. 在 **OpenClaw runs** 下，选择 **Remote over SSH** 并设置：
   - **Transport**：**SSH tunnel** 或 **Direct (ws/wss)**。
   - **SSH target**：`user@host`（可选 `:port`）。
     - 如果 Gateway 网关位于同一 LAN 并发布 Bonjour，可从发现列表中选择它以自动填充此字段。
   - **Gateway URL**（仅 Direct）：`wss://gateway.example.ts.net`（或本地/LAN 使用 `ws://...`）。
   - **Identity file**（高级）：你的密钥路径。
   - **Project root**（高级）：用于命令的远程检出路径。
   - **CLI path**（高级）：可运行的 `openclaw` 入口点/二进制文件的可选路径（发布时会自动填充）。
3. 点击 **Test remote**。成功表示远程 `openclaw status --json` 可以正确运行。失败通常意味着 PATH/CLI 问题；退出码 127 表示远程找不到 CLI。
4. 健康检查和 Web Chat 现在会自动通过此 SSH 隧道运行。

## Web Chat

- **SSH tunnel**：Web Chat 通过转发后的 WebSocket 控制端口（默认 18789）连接到 Gateway 网关。
- **Direct (ws/wss)**：Web Chat 直接连接到已配置的 Gateway 网关 URL。
- 不再有单独的 WebChat HTTP 服务器。

## 权限

- 远程主机需要与本地相同的 TCC 批准（Automation、Accessibility、Screen Recording、Microphone、Speech Recognition、Notifications）。在该机器上运行新手引导以一次性授予这些权限。
- 节点会通过 `node.list` / `node.describe` 发布它们的权限状态，以便智能体知道哪些能力可用。

## 安全注意事项

- 优先在远程主机上使用 loopback 绑定，并通过 SSH 或 Tailscale 连接。
- SSH 隧道使用严格的主机密钥检查；请先信任主机密钥，使其存在于 `~/.ssh/known_hosts` 中。
- 如果将 Gateway 网关绑定到非 loopback 接口，请要求有效的 Gateway 网关认证：令牌、密码，或带有 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。
- 请参阅 [安全](/zh-CN/gateway/security) 和 [Tailscale](/zh-CN/gateway/tailscale)。

## WhatsApp 登录流程（远程）

- **在远程主机上**运行 `openclaw channels login --verbose`。用手机上的 WhatsApp 扫描二维码。
- 如果认证过期，请在该主机上重新运行登录。健康检查会暴露链接问题。

## 故障排除

- **exit 127 / not found**：非登录 shell 的 PATH 中没有 `openclaw`。将它添加到 `/etc/paths`、你的 shell rc，或符号链接到 `/usr/local/bin`/`/opt/homebrew/bin`。
- **Health probe failed**：检查 SSH 可达性、PATH，以及 Baileys 是否已登录（`openclaw status --json`）。
- **Web Chat stuck**：确认 Gateway 网关正在远程主机上运行，并且转发端口与 Gateway 网关 WS 端口匹配；UI 需要健康的 WS 连接。
- **Node IP shows 127.0.0.1**：使用 SSH 隧道时这是预期行为。如果你希望 Gateway 网关看到真实客户端 IP，请将 **Transport** 切换为 **Direct (ws/wss)**。
- **Dashboard works but Mac capabilities are offline**：这意味着应用的操作员/控制连接是健康的，但配套节点连接未连接或缺少其命令表面。打开菜单栏设备部分，检查 Mac 是否为 `paired · disconnected`。对于 `wss://*.ts.net` Tailscale Serve 端点，应用会在证书轮换后检测陈旧的旧 TLS 叶证书 pin，当 macOS 信任新证书后清除此陈旧 pin，并自动重试。如果证书不被系统信任，或主机不是 Tailscale Serve 名称，请检查证书或切换到 **Remote over SSH**。
- **Voice Wake**：在远程模式下，触发短语会自动转发；不需要单独的转发器。

## 通知声音

使用 `openclaw` 和 `node.invoke` 从脚本中为每条通知选择声音，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

应用中不再有全局“默认声音”开关；调用方会按每个请求选择一个声音（或不选择）。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [远程访问](/zh-CN/gateway/remote)
