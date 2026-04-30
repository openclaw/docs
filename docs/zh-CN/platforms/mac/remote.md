---
read_when:
    - 设置或调试远程 Mac 控制
summary: 通过 SSH 控制远程 OpenClaw Gateway 网关的 macOS 应用流程
title: 远程控制
x-i18n:
    generated_at: "2026-04-30T11:18:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c63f752c3636a253220310c7c8e57a28549704b74b2f0370bac432bae28a7d3
    source_path: platforms/mac/remote.md
    workflow: 16
---

# 远程 OpenClaw（macOS ⇄ 远程主机）

此流程让 macOS 应用可以充当运行在另一台主机（桌面设备/服务器）上的 OpenClaw Gateway 网关的完整遥控器。这是应用的 **通过 SSH 远程**（远程运行）功能。所有功能（健康检查、语音唤醒转发和网页聊天）都会复用来自 _设置 → 通用_ 的同一套远程 SSH 配置。

## 模式

- **本地（这台 Mac）**：所有内容都在笔记本电脑上运行。不涉及 SSH。
- **通过 SSH 远程（默认）**：OpenClaw 命令会在远程主机上执行。Mac 应用会使用 `-o BatchMode`、你选择的身份/密钥以及本地端口转发来打开 SSH 连接。
- **远程直连（ws/wss）**：没有 SSH 隧道。Mac 应用会直接连接到 Gateway 网关 URL（例如通过 Tailscale Serve 或公开 HTTPS 反向代理）。

## 远程传输方式

远程模式支持两种传输方式：

- **SSH 隧道**（默认）：使用 `ssh -N -L ...` 将 Gateway 网关端口转发到 localhost。由于隧道是 loopback，Gateway 网关会看到节点 IP 为 `127.0.0.1`。
- **直连（ws/wss）**：直接连接到 Gateway 网关 URL。Gateway 网关会看到真实客户端 IP。

在 SSH 隧道模式下，发现的 LAN/tailnet 主机名会保存为
`gateway.remote.sshTarget`。应用会将 `gateway.remote.url` 保持在本地
隧道端点上，例如 `ws://127.0.0.1:18789`，因此 CLI、网页聊天和
本地节点主机服务都会使用相同的安全 loopback 传输方式。

远程模式下的浏览器自动化由 CLI 节点主机负责，而不是由
原生 macOS 应用节点负责。应用会在可能时启动已安装的节点主机服务；
如果你需要从那台 Mac 控制浏览器，请用
`openclaw node install ...` 和 `openclaw node start` 安装/启动它（或在前台运行
`openclaw node run ...`），然后以那个具备浏览器能力的
节点为目标。

## 远程主机上的前置条件

1. 安装 Node + pnpm，并构建/安装 OpenClaw CLI（`pnpm install && pnpm build && pnpm link --global`）。
2. 确保非交互式 shell 的 PATH 中有 `openclaw`（如有需要，符号链接到 `/usr/local/bin` 或 `/opt/homebrew/bin`）。
3. 使用密钥认证打开 SSH。我们建议使用 **Tailscale** IP，以便在离开 LAN 后保持稳定可达。

## macOS 应用设置

1. 打开 _设置 → 通用_。
2. 在 **OpenClaw 运行位置** 下，选择 **通过 SSH 远程** 并设置：
   - **传输方式**：**SSH 隧道** 或 **直连（ws/wss）**。
   - **SSH 目标**：`user@host`（可选 `:port`）。
     - 如果 Gateway 网关在同一 LAN 上并通过 Bonjour 广播，请从发现列表中选择它以自动填充此字段。
   - **Gateway 网关 URL**（仅直连）：`wss://gateway.example.ts.net`（或用于本地/LAN 的 `ws://...`）。
   - **身份文件**（高级）：你的密钥路径。
   - **项目根目录**（高级）：用于执行命令的远程 checkout 路径。
   - **CLI 路径**（高级）：可选的可运行 `openclaw` 入口点/二进制文件路径（广播时会自动填充）。
3. 点击 **测试远程**。成功表示远程 `openclaw status --json` 能正确运行。失败通常意味着 PATH/CLI 问题；退出码 127 表示在远程找不到 CLI。
4. 健康检查和网页聊天现在会自动通过此 SSH 隧道运行。

## 网页聊天

- **SSH 隧道**：网页聊天通过转发的 WebSocket 控制端口（默认 18789）连接到 Gateway 网关。
- **直连（ws/wss）**：网页聊天直接连接到配置的 Gateway 网关 URL。
- 不再有单独的 WebChat HTTP 服务器。

## 权限

- 远程主机需要与本地相同的 TCC 批准（自动化、辅助功能、屏幕录制、麦克风、语音识别、通知）。在那台机器上运行新手引导以一次性授予这些权限。
- 节点通过 `node.list` / `node.describe` 广播其权限状态，因此智能体知道哪些能力可用。

## 安全说明

- 优先在远程主机上绑定 loopback，并通过 SSH 或 Tailscale 连接。
- SSH 隧道使用严格的主机密钥检查；请先信任主机密钥，使其存在于 `~/.ssh/known_hosts` 中。
- 如果你将 Gateway 网关绑定到非 loopback 接口，请要求有效的 Gateway 网关认证：令牌、密码，或带有 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。
- 请参阅 [安全](/zh-CN/gateway/security) 和 [Tailscale](/zh-CN/gateway/tailscale)。

## WhatsApp 登录流程（远程）

- **在远程主机上**运行 `openclaw channels login --verbose`。用手机上的 WhatsApp 扫描二维码。
- 如果认证过期，请在该主机上重新运行登录。健康检查会暴露连接问题。

## 故障排除

- **退出码 127 / 未找到**：非登录 shell 的 PATH 中没有 `openclaw`。将它添加到 `/etc/paths`、你的 shell rc，或符号链接到 `/usr/local/bin`/`/opt/homebrew/bin`。
- **健康探测失败**：检查 SSH 可达性、PATH，以及 Baileys 是否已登录（`openclaw status --json`）。
- **网页聊天卡住**：确认 Gateway 网关正在远程主机上运行，且转发端口与 Gateway 网关 WS 端口匹配；UI 需要健康的 WS 连接。
- **节点 IP 显示 127.0.0.1**：使用 SSH 隧道时这是预期结果。如果你希望 Gateway 网关看到真实客户端 IP，请将 **传输方式** 切换为 **直连（ws/wss）**。
- **Dashboard 可用但 Mac 功能离线**：这表示应用的操作员/控制连接是健康的，但配套节点连接未连接，或缺少其命令能力面。打开菜单栏设备部分，检查 Mac 是否为 `paired · disconnected`。对于 `wss://*.ts.net` Tailscale Serve 端点，应用会在证书轮换后检测陈旧的旧版 TLS 叶证书固定，当 macOS 信任新证书时清除陈旧固定，并自动重试。如果证书不受系统信任，或主机不是 Tailscale Serve 名称，请检查证书或切换到 **通过 SSH 远程**。
- **语音唤醒**：远程模式下会自动转发触发短语；不需要单独的转发器。

## 通知声音

从脚本中使用 `openclaw` 和 `node.invoke` 为每个通知选择声音，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

应用中不再有全局“默认声音”开关；调用方会为每个请求选择声音（或不选择）。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [远程访问](/zh-CN/gateway/remote)
