---
read_when:
    - 设置或调试远程 mac 控制
summary: 通过 SSH 控制远程 OpenClaw Gateway 网关的 macOS 应用流程
title: 远程控制
x-i18n:
    generated_at: "2026-04-24T03:41:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17992eeb20fc6a463e12222547a8c90a34e6bbd94907e02d5033c18a31f776d8
    source_path: platforms/mac/remote.md
    workflow: 15
---

# 远程 OpenClaw（macOS ⇄ 远程主机）

此流程允许 macOS 应用充当运行在另一台主机（桌面机 / 服务器）上的 OpenClaw Gateway 网关的完整远程控制端。这是应用的**通过 SSH 远程控制**（remote run）功能。所有功能——健康检查、Voice Wake 转发和 Web Chat——都会复用 _Settings → General_ 中相同的远程 SSH 配置。

## 模式

- **本地（此 Mac）**：所有内容都在这台笔记本上运行。不涉及 SSH。
- **通过 SSH 远程控制（默认）**：OpenClaw 命令在远程主机上执行。mac 应用会使用 `-o BatchMode`、你选择的 identity / key，以及本地端口转发来建立 SSH 连接。
- **远程直连（ws/wss）**：不使用 SSH 隧道。mac 应用会直接连接到 Gateway 网关 URL（例如，通过 Tailscale Serve 或公共 HTTPS 反向代理）。

## 远程传输方式

远程模式支持两种传输方式：

- **SSH 隧道**（默认）：使用 `ssh -N -L ...` 将 Gateway 网关端口转发到 localhost。由于该隧道是 loopback，Gateway 网关会将节点的 IP 视为 `127.0.0.1`。
- **直连（ws/wss）**：直接连接到 Gateway 网关 URL。Gateway 网关会看到真实客户端 IP。

## 远程主机上的前提条件

1. 安装 Node + pnpm，并构建 / 安装 OpenClaw CLI（`pnpm install && pnpm build && pnpm link --global`）。
2. 确保 `openclaw` 在非交互 shell 的 PATH 中可用（如有需要，可符号链接到 `/usr/local/bin` 或 `/opt/homebrew/bin`）。
3. 使用密钥认证开启 SSH。我们推荐使用 **Tailscale** IP，以便在非局域网环境下保持稳定可达。

## macOS 应用设置

1. 打开 _Settings → General_。
2. 在 **OpenClaw runs** 下，选择 **Remote over SSH**，并设置：
   - **Transport**：**SSH tunnel** 或 **Direct (ws/wss)**。
   - **SSH target**：`user@host`（可选 `:port`）。
     - 如果 Gateway 网关位于同一局域网并广播了 Bonjour，可从发现列表中选择它，以自动填写此字段。
   - **Gateway URL**（仅限直连）：`wss://gateway.example.ts.net`（本地 / 局域网可用 `ws://...`）。
   - **Identity file**（高级）：你的密钥路径。
   - **Project root**（高级）：用于执行命令的远程 checkout 路径。
   - **CLI path**（高级）：可运行的 `openclaw` 入口点 / 二进制文件的可选路径（在广播时会自动填充）。
3. 点击 **Test remote**。成功表示远程 `openclaw status --json` 能正常运行。失败通常意味着 PATH / CLI 问题；退出码 127 表示远程找不到 CLI。
4. 健康检查和 Web Chat 现在都会自动通过此 SSH 隧道运行。

## Web Chat

- **SSH 隧道**：Web Chat 通过转发后的 WebSocket 控制端口（默认 18789）连接到 Gateway 网关。
- **直连（ws/wss）**：Web Chat 直接连接到已配置的 Gateway 网关 URL。
- 现在已不再有独立的 WebChat HTTP 服务器。

## 权限

- 远程主机需要与本地主机相同的 TCC 批准（Automation、Accessibility、Screen Recording、Microphone、Speech Recognition、Notifications）。请在那台机器上运行新手引导，以一次性授予这些权限。
- 节点会通过 `node.list` / `node.describe` 广播其权限状态，以便智能体了解有哪些能力可用。

## 安全说明

- 推荐在远程主机上使用 loopback 绑定，并通过 SSH 或 Tailscale 连接。
- SSH 隧道使用严格的 host-key 检查；请先信任主机密钥，以确保其存在于 `~/.ssh/known_hosts` 中。
- 如果你将 Gateway 网关绑定到非 loopback 接口，请要求有效的 Gateway 网关认证：token、password，或配置了 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。
- 参见 [Security](/zh-CN/gateway/security) 和 [Tailscale](/zh-CN/gateway/tailscale)。

## WhatsApp 登录流程（远程）

- **在远程主机上**运行 `openclaw channels login --verbose`。使用手机上的 WhatsApp 扫描二维码。
- 如果认证过期，请在该主机上重新运行登录。健康检查会显示连接问题。

## 故障排除

- **退出码 127 / not found**：在非登录 shell 中，`openclaw` 不在 PATH 中。请将其添加到 `/etc/paths`、你的 shell rc，或符号链接到 `/usr/local/bin` / `/opt/homebrew/bin`。
- **Health probe failed**：检查 SSH 可达性、PATH，以及 Baileys 是否已登录（`openclaw status --json`）。
- **Web Chat 卡住**：确认 Gateway 网关正在远程主机上运行，且转发端口与 Gateway 网关 WS 端口匹配；UI 需要健康的 WS 连接。
- **节点 IP 显示为 127.0.0.1**：这是 SSH 隧道下的预期行为。如果你希望 Gateway 网关看到真实客户端 IP，请将 **Transport** 切换为 **Direct (ws/wss)**。
- **Voice Wake**：在远程模式下，触发短语会自动转发；不需要单独的转发器。

## 通知声音

你可以从脚本中通过 `openclaw` 和 `node.invoke` 为每条通知选择声音，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

应用中已不再有全局“默认声音”开关；调用方会为每次请求单独选择声音（或不选择）。
