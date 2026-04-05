---
read_when:
    - 设置或调试远程 mac 控制
summary: 通过 SSH 控制远程 OpenClaw Gateway 网关的 macOS 应用流程
title: 远程控制
x-i18n:
    generated_at: "2026-04-05T08:37:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96e46e603c2275d04596b5d1ae0fb6858bd1a102a727dc13924ffcd9808fdf7e
    source_path: platforms/mac/remote.md
    workflow: 15
---

# 远程 OpenClaw（macOS ⇄ 远程主机）

此流程让 macOS 应用充当运行在另一台主机（桌面机/服务器）上的 OpenClaw Gateway 网关的完整远程控制器。它是应用的 **Remote over SSH**（远程运行）功能。所有功能——健康检查、Voice Wake 转发和 Web Chat——都会复用 _Settings → General_ 中相同的远程 SSH 配置。

## 模式

- **Local（这台 Mac）**：所有内容都在这台笔记本上运行。不涉及 SSH。
- **Remote over SSH（默认）**：OpenClaw 命令在远程主机上执行。mac 应用会使用 `-o BatchMode`、你选择的身份/密钥以及本地端口转发来建立 SSH 连接。
- **Remote direct（ws/wss）**：没有 SSH 隧道。mac 应用直接连接到 Gateway 网关 URL（例如，通过 Tailscale Serve 或公共 HTTPS 反向代理）。

## 远程传输方式

远程模式支持两种传输方式：

- **SSH tunnel**（默认）：使用 `ssh -N -L ...` 将 Gateway 网关端口转发到 localhost。由于该隧道是 loopback，Gateway 网关会将节点的 IP 视为 `127.0.0.1`。
- **Direct（ws/wss）**：直接连接到 Gateway 网关 URL。Gateway 网关会看到真实客户端 IP。

## 远程主机上的前提条件

1. 安装 Node 和 pnpm，并构建/安装 OpenClaw CLI（`pnpm install && pnpm build && pnpm link --global`）。
2. 确保 `openclaw` 在非交互式 shell 的 PATH 中（如有需要，可创建到 `/usr/local/bin` 或 `/opt/homebrew/bin` 的符号链接）。
3. 启用基于密钥认证的 SSH。我们建议使用 **Tailscale** IP，以便在非局域网环境下获得稳定可达性。

## macOS 应用设置

1. 打开 _Settings → General_。
2. 在 **OpenClaw runs** 下，选择 **Remote over SSH** 并设置：
   - **Transport**：**SSH tunnel** 或 **Direct（ws/wss）**。
   - **SSH target**：`user@host`（可选 `:port`）。
     - 如果 Gateway 网关位于同一局域网并广播了 Bonjour，可从发现列表中选择它以自动填充该字段。
   - **Gateway URL**（仅 Direct）：`wss://gateway.example.ts.net`（本地/局域网可使用 `ws://...`）。
   - **Identity file**（高级）：你的密钥路径。
   - **Project root**（高级）：用于执行命令的远程检出路径。
   - **CLI path**（高级）：可选，指向可运行的 `openclaw` 入口点/二进制文件路径（若已广播会自动填充）。
3. 点击 **Test remote**。成功表示远程 `openclaw status --json` 运行正常。失败通常表示 PATH/CLI 问题；退出码 127 表示远程找不到 CLI。
4. 健康检查和 Web Chat 现在都会自动通过此 SSH 隧道运行。

## Web Chat

- **SSH tunnel**：Web Chat 通过转发后的 WebSocket 控制端口（默认 18789）连接到 Gateway 网关。
- **Direct（ws/wss）**：Web Chat 直接连接到已配置的 Gateway 网关 URL。
- 现在不再有单独的 WebChat HTTP 服务器。

## 权限

- 远程主机需要与本地相同的 TCC 批准（自动化、辅助功能、屏幕录制、麦克风、语音识别、通知）。在那台机器上运行新手引导，一次性授予这些权限。
- 节点会通过 `node.list` / `node.describe` 广播其权限状态，以便智能体知道有哪些能力可用。

## 安全说明

- 优先在远程主机上绑定到 loopback，并通过 SSH 或 Tailscale 连接。
- SSH 隧道使用严格的主机密钥检查；请先信任主机密钥，使其存在于 `~/.ssh/known_hosts` 中。
- 如果你将 Gateway 网关绑定到非 loopback 接口，则必须要求有效的 Gateway 网关认证：token、密码，或使用设置了 `gateway.auth.mode: "trusted-proxy"` 的身份感知型反向代理。
- 参见 [Security](/gateway/security) 和 [Tailscale](/gateway/tailscale)。

## WhatsApp 登录流程（远程）

- 在**远程主机**上运行 `openclaw channels login --verbose`。使用你手机上的 WhatsApp 扫描二维码。
- 如果认证过期，请在该主机上重新运行登录。健康检查会显示链接问题。

## 故障排除

- **exit 127 / not found**：非登录 shell 的 PATH 中没有 `openclaw`。请将其添加到 `/etc/paths`、你的 shell rc，或创建到 `/usr/local/bin`/`/opt/homebrew/bin` 的符号链接。
- **Health probe failed**：检查 SSH 连通性、PATH，以及 Baileys 是否已登录（`openclaw status --json`）。
- **Web Chat stuck**：确认 Gateway 网关正在远程主机上运行，且转发端口与 Gateway 网关 WS 端口一致；UI 需要健康的 WS 连接。
- **Node IP shows 127.0.0.1**：这是 SSH 隧道下的预期行为。如果你希望 Gateway 网关看到真实客户端 IP，请将 **Transport** 切换为 **Direct（ws/wss）**。
- **Voice Wake**：在远程模式下，触发短语会自动转发；不需要单独的转发器。

## 通知声音

你可以通过带有 `openclaw` 和 `node.invoke` 的脚本为每个通知选择声音，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

应用中已不再提供全局“默认声音”开关；调用方需为每个请求选择声音（或不选择）。
