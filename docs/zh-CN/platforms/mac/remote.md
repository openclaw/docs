---
read_when:
    - 设置或调试远程 mac 控制
summary: 通过 SSH 控制远程 OpenClaw gateway 的 macOS 应用流程
title: 远程控制
x-i18n:
    generated_at: "2026-04-24T04:05:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1b436fe35db300f719cf3e72530e74914df6023509907d485670746c29656d8
    source_path: platforms/mac/remote.md
    workflow: 15
---

# 远程 OpenClaw（macOS ⇄ 远程主机）

此流程允许 macOS 应用作为运行在另一台主机（桌面机/服务器）上的 OpenClaw gateway 的完整远程控制端。这是应用的**通过 SSH 远程连接**（remote run）功能。所有功能——健康检查、Voice Wake 转发和 Web Chat——都复用 _Settings → General_ 中相同的远程 SSH 配置。

## 模式

- **Local（此 Mac）**：所有内容都运行在笔记本上。不涉及 SSH。
- **Remote over SSH（默认）**：OpenClaw 命令在远程主机上执行。mac 应用会使用 `-o BatchMode` 加上你选择的 identity/key 和本地端口转发来建立 SSH 连接。
- **Remote direct（ws/wss）**：不使用 SSH 隧道。mac 应用直接连接到 gateway URL（例如通过 Tailscale Serve 或公共 HTTPS 反向代理）。

## 远程传输方式

远程模式支持两种传输方式：

- **SSH 隧道**（默认）：使用 `ssh -N -L ...` 将 gateway 端口转发到 localhost。由于该隧道是 loopback，gateway 会将节点的 IP 视为 `127.0.0.1`。
- **Direct（ws/wss）**：直接连接到 gateway URL。gateway 会看到真实客户端 IP。

## 远程主机上的前置条件

1. 安装 Node + pnpm，并构建/安装 OpenClaw CLI（`pnpm install && pnpm build && pnpm link --global`）。
2. 确保 `openclaw` 对非交互式 shell 也在 PATH 中（如有需要，可将其符号链接到 `/usr/local/bin` 或 `/opt/homebrew/bin`）。
3. 开启使用密钥身份验证的 SSH。我们推荐使用 **Tailscale** IP，以便在非局域网环境下也能稳定访问。

## macOS 应用设置

1. 打开 _Settings → General_。
2. 在 **OpenClaw runs** 下，选择 **Remote over SSH**，并设置：
   - **Transport**：**SSH tunnel** 或 **Direct（ws/wss）**。
   - **SSH target**：`user@host`（可选 `:port`）。
     - 如果 gateway 位于同一局域网并通告了 Bonjour，可从发现列表中选择它以自动填充此字段。
   - **Gateway URL**（仅 Direct）：`wss://gateway.example.ts.net`（或本地/局域网环境中的 `ws://...`）。
   - **Identity file**（高级）：你的密钥路径。
   - **Project root**（高级）：用于命令的远程检出路径。
   - **CLI path**（高级）：可选，指向可运行的 `openclaw` 入口点/二进制文件的路径（通告时会自动填充）。
3. 点击 **Test remote**。成功表示远程 `openclaw status --json` 运行正常。失败通常意味着 PATH/CLI 问题；退出码 127 表示远程找不到 CLI。
4. 健康检查和 Web Chat 现在都会自动通过这个 SSH 隧道运行。

## Web Chat

- **SSH 隧道**：Web Chat 通过转发后的 WebSocket 控制端口（默认 18789）连接到 gateway。
- **Direct（ws/wss）**：Web Chat 直接连接到已配置的 gateway URL。
- 现在已经不再有单独的 WebChat HTTP 服务器。

## 权限

- 远程主机需要与本地相同的 TCC 批准（Automation、Accessibility、Screen Recording、Microphone、Speech Recognition、Notifications）。请在那台机器上运行新手引导，一次性授予它们。
- 节点通过 `node.list` / `node.describe` 通告其权限状态，以便智能体了解哪些能力可用。

## 安全说明

- 优先在远程主机上使用 loopback 绑定，并通过 SSH 或 Tailscale 连接。
- SSH 隧道使用严格的主机密钥检查；请先信任主机密钥，使其存在于 `~/.ssh/known_hosts` 中。
- 如果你将 Gateway 网关绑定到非 loopback 接口，请要求有效的 Gateway 网关身份验证：token、password，或配置了 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。
- 请参阅 [Security](/zh-CN/gateway/security) 和 [Tailscale](/zh-CN/gateway/tailscale)。

## WhatsApp 登录流程（远程）

- 在**远程主机上**运行 `openclaw channels login --verbose`。使用手机上的 WhatsApp 扫描二维码。
- 如果身份验证过期，请在该主机上重新运行登录。健康检查会显示链接问题。

## 故障排除

- **退出码 127 / not found**：非登录 shell 的 PATH 中没有 `openclaw`。请将其添加到 `/etc/paths`、你的 shell rc，或将其符号链接到 `/usr/local/bin`/`/opt/homebrew/bin`。
- **Health probe failed**：检查 SSH 可达性、PATH，以及 Baileys 是否已登录（`openclaw status --json`）。
- **Web Chat 卡住**：确认远程主机上的 gateway 正在运行，且转发端口与 gateway WS 端口一致；UI 需要健康的 WS 连接。
- **节点 IP 显示为 127.0.0.1**：这在 SSH 隧道下属于预期行为。如果你希望 gateway 看到真实客户端 IP，请将 **Transport** 切换为 **Direct（ws/wss）**。
- **Voice Wake**：在远程模式下，触发短语会自动转发；不需要单独的转发器。

## 通知声音

可在脚本中通过 `openclaw` 和 `node.invoke` 为每条通知选择声音，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

应用中已不再提供全局“默认声音”开关；调用方可按请求选择声音（或不选择）。

## 相关内容

- [macOS app](/zh-CN/platforms/macos)
- [Remote access](/zh-CN/gateway/remote)
