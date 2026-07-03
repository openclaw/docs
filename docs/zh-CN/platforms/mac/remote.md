---
read_when:
    - 设置或调试远程 mac 控制
summary: macOS 应用流程，用于控制远程 OpenClaw Gateway 网关
title: 远程控制
x-i18n:
    generated_at: "2026-07-03T23:26:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d1ac5065011ef16085b3349ee7224fe3e806a6de61feaac2dcd5c9ed264227e
    source_path: platforms/mac/remote.md
    workflow: 16
---

此流程让 macOS 应用可以充当运行在另一台主机（桌面/服务器）上的 OpenClaw Gateway 网关的完整远程控制器。该应用可以直接连接到受信任的 LAN/Tailnet Gateway 网关 URL，或者在远程 Gateway 网关仅限 local loopback 时管理 SSH 隧道。健康检查、语音唤醒转发和 Web 聊天会复用 _设置 → 通用_ 中的同一套远程配置。

## 模式

- **本地（此 Mac）**：所有内容都在笔记本电脑上运行。不涉及 SSH。
- **通过 SSH 远程（默认）**：OpenClaw 命令在远程主机上执行。Mac 应用会使用 `-o BatchMode` 加上你选择的身份/密钥以及本地端口转发来打开 SSH 连接。
- **远程直连（ws/wss）**：不使用 SSH 隧道。Mac 应用会直接连接到 Gateway 网关 URL（例如通过 LAN、Tailscale、Tailscale Serve 或公开 HTTPS 反向代理）。

## 远程传输

远程模式支持两种传输方式：

- **SSH 隧道**（默认）：使用 `ssh -N -L ...` 将 Gateway 网关端口转发到 localhost。因为隧道是 local loopback，Gateway 网关会看到节点 IP 为 `127.0.0.1`。
- **直连（ws/wss）**：直接连接到 Gateway 网关 URL。Gateway 网关会看到真实客户端 IP。

应用会为应用自有的 SSH 进程禁用 SSH 连接复用和认证后后台化，这样即使所选别名启用了 `ControlMaster` 或 `ForkAfterAuthentication`，应用也能监控并重启确切的进程。

SSH 主机密钥验证默认是严格的，因为 Gateway 网关凭据会通过此隧道传输。对于你明确打算使用其信任行为的托管 SSH 别名，可使用 `openclaw-mac configure-remote --ssh-target <alias> --ssh-host-key-policy openssh` 选择加入，或将 `gateway.remote.sshHostKeyPolicy` 设为 `"openssh"`。此选择加入会使用有效的 OpenSSH 主机密钥策略；请先审查该别名以及任何匹配的 `Host *` 或系统配置。在应用中或通过 `configure-remote` 更改 SSH 目标会将策略重置为 `strict`，除非你再次明确选择加入。

在 SSH 隧道模式下，发现的 LAN/Tailnet 主机会保存为
`gateway.remote.sshTarget`。应用会将 `gateway.remote.url` 保持在本地
隧道端点上，例如 `ws://127.0.0.1:18789`，这样 CLI、Web 聊天和
本地节点主机服务都会使用同一个安全的 local loopback 传输。
当发现结果同时返回原始 Tailnet IP 和稳定主机名时，应用会优先选择
Tailscale MagicDNS 或 LAN 名称，让远程连接在地址变化后更容易保持可用。
如果本地隧道端口不同于远程 Gateway 网关端口，请将
`gateway.remote.remotePort` 设为远程主机上的端口。

远程模式中的浏览器自动化由 CLI 节点主机拥有，而不是由原生 macOS
应用节点拥有。应用会在可能时启动已安装的节点主机服务；如果你需要从该
Mac 控制浏览器，请使用 `openclaw node install ...` 和 `openclaw node start`
安装/启动它（或在前台运行 `openclaw node run ...`），然后以该具备浏览器能力的
节点为目标。

## 远程主机上的前置条件

1. 安装 Node + pnpm，并构建/安装 OpenClaw CLI（`pnpm install && pnpm build && pnpm link --global`）。
2. 确保 `openclaw` 位于非交互式 shell 的 PATH 中（如有需要，可符号链接到 `/usr/local/bin` 或 `/opt/homebrew/bin`）。
3. 仅适用于 SSH 传输：启用基于密钥认证的 SSH。我们建议使用 **Tailscale** IP，以便在离开 LAN 后仍能稳定访问。

## macOS 应用设置

如需在不经过欢迎流程的情况下预配置应用：

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

对于已经能通过受信任 LAN 或 Tailnet 访问的 Gateway 网关，可以完全跳过 SSH：

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

这会写入远程配置，标记新手引导完成，并让应用在启动时拥有
所选传输方式。

1. 打开 _设置 → 通用_。
2. 在 **OpenClaw 运行位置** 下，选择 **远程** 并设置：
   - **传输**：**SSH 隧道** 或 **直连（ws/wss）**。
   - **SSH 目标**：`user@host`（可选 `:port`）。
     - 如果 Gateway 网关位于同一 LAN 并通过 Bonjour 广播，请从发现列表中选择它以自动填充此字段。
   - **Gateway 网关 URL**（仅直连）：`wss://gateway.example.ts.net`（本地/LAN 可用 `ws://...`）。
   - **身份文件**（高级）：你的密钥路径。
   - **项目根目录**（高级）：用于命令的远程检出路径。
   - **CLI 路径**（高级）：可选的可运行 `openclaw` 入口点/二进制文件路径（广播时会自动填充）。
3. 点击 **测试远程**。成功表示远程 `openclaw status --json` 运行正确。失败通常意味着 PATH/CLI 问题；退出码 127 表示远程找不到 CLI。
4. 健康检查和 Web 聊天现在会自动通过所选传输方式运行。

## Web 聊天

- **SSH 隧道**：Web 聊天通过转发的 WebSocket 控制端口（默认 18789）连接到 Gateway 网关。
- **直连（ws/wss）**：Web 聊天直接连接到配置的 Gateway 网关 URL。
- 不再有单独的 WebChat HTTP 服务器。

## 权限

- 远程主机需要与本地相同的 TCC 批准（自动化、辅助功能、屏幕录制、麦克风、语音识别、通知）。在该机器上运行新手引导以一次性授予这些权限。
- 节点会通过 `node.list` / `node.describe` 广播其权限状态，以便智能体知道哪些能力可用。

## 安全说明

- 优先在远程主机上使用 local loopback 绑定，并通过 SSH、Tailscale Serve 或受信任的 Tailnet/LAN 直连 URL 连接。
- SSH 隧道默认要求主机密钥已受信任。请先信任主机密钥，使其存在于配置的 known-hosts 文件中；或者对于你接受其 OpenSSH 信任策略的托管别名，明确选择 `gateway.remote.sshHostKeyPolicy: "openssh"`。
- 如果你将 Gateway 网关绑定到非 local loopback 接口，请要求有效的 Gateway 网关认证：令牌、密码，或带有 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。
- 请参阅 [安全](/zh-CN/gateway/security) 和 [Tailscale](/zh-CN/gateway/tailscale)。

## WhatsApp 登录流程（远程）

- **在远程主机上**运行 `openclaw channels login --verbose`。用手机上的 WhatsApp 扫描二维码。
- 如果认证过期，请在该主机上重新运行登录。健康检查会显示链接问题。

## 故障排除

- **退出码 127 / 未找到**：`openclaw` 不在非登录 shell 的 PATH 中。将其添加到 `/etc/paths`、你的 shell rc，或符号链接到 `/usr/local/bin`/`/opt/homebrew/bin`。
- **健康探测失败**：检查 SSH 可达性、PATH，以及 Baileys 是否已登录（`openclaw status --json`）。
- **Web 聊天卡住**：确认 Gateway 网关正在远程主机上运行，并且转发端口与 Gateway 网关 WS 端口匹配；UI 需要健康的 WS 连接。
- **节点 IP 显示 127.0.0.1**：使用 SSH 隧道时这是预期行为。如果你希望 Gateway 网关看到真实客户端 IP，请将 **传输** 切换为 **直连（ws/wss）**。
- **仪表板可用但 Mac 能力离线**：这表示应用的操作员/控制连接健康，但配套节点连接未连接，或缺少其命令表面。打开菜单栏设备部分，检查 Mac 是否为 `paired · disconnected`。对于 `wss://*.ts.net` Tailscale Serve 端点，应用会在证书轮换后检测过期的旧版 TLS 叶证书固定；当 macOS 信任新证书时，会清除过期固定并自动重试。如果证书未被系统信任，或主机不是 Tailscale Serve 名称，请将 `gateway.remote.tlsFingerprint` 设为预期证书指纹，审查证书，或切换到 **通过 SSH 远程**。
- **语音唤醒**：在远程模式下，触发短语会自动转发；不需要单独的转发器。

## 通知声音

使用 `openclaw` 和 `node.invoke` 从脚本为每条通知选择声音，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

应用中不再有全局“默认声音”开关；调用方会按请求选择声音（或不选择）。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [远程访问](/zh-CN/gateway/remote)
