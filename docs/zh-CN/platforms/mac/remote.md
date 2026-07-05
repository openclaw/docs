---
read_when:
    - 设置或调试远程 Mac 控制
summary: 用于控制远程 OpenClaw Gateway 网关的 macOS 应用流程
title: 远程控制
x-i18n:
    generated_at: "2026-07-05T11:30:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

此流程让 macOS 应用能够作为在另一台主机（台式机/服务器）上运行的 OpenClaw Gateway 网关的完整遥控器。应用会直接连接到受信任的 LAN/Tailnet Gateway 网关 URL，或者在远程 Gateway 网关仅绑定到环回地址时管理 SSH 隧道。健康检查、语音唤醒转发和 Web 聊天会复用 _Settings -> General_ 中的同一套远程配置。

## 模式

- **本地（这台 Mac）**：所有内容都在笔记本电脑上运行；不涉及 SSH。
- **通过 SSH 远程（默认）**：OpenClaw 命令在远程主机上运行。应用会使用 `-o BatchMode`、你选择的身份/密钥以及本地端口转发来打开 SSH 连接。
- **直接远程（ws/wss）**：不使用 SSH 隧道；应用会直接连接到 Gateway 网关 URL（LAN、Tailscale、Tailscale Serve 或公共 HTTPS 反向代理）。

## 远程传输协议

- **SSH 隧道**（默认）：使用 `ssh -N -L ...` 将 Gateway 网关端口转发到 localhost。由于隧道是环回连接，Gateway 网关看到的节点 IP 是 `127.0.0.1`。
- **直接（ws/wss）**：直接连接到 Gateway 网关 URL。Gateway 网关会看到真实的客户端 IP。

应用会为自身的 SSH 进程禁用 SSH 连接复用和认证后后台化，这样即使所选别名启用了 `ControlMaster` 或 `ForkAfterAuthentication`，应用也能监控并重启确切的进程。

默认情况下 SSH 主机密钥验证是严格的，因为 Gateway 网关凭证会通过此隧道传输。若要改用托管 SSH 别名自身的信任行为，请通过 `openclaw-mac configure-remote` 设置 `--ssh-host-key-policy openssh`，或直接将 `gateway.remote.sshHostKeyPolicy` 设置为 `"openssh"`。选择前请检查该别名以及任何匹配的 `Host *` 或系统配置。更改 SSH 目标（在应用中或通过 `configure-remote`）会将策略重置回 `strict`，除非你为新目标再次显式选择使用该策略。

在 SSH 隧道模式下，发现到的 LAN/tailnet 主机会保存为 `gateway.remote.sshTarget`。应用会将 `gateway.remote.url` 保持在本地隧道端点（例如 `ws://127.0.0.1:18789`），这样 CLI、Web 聊天和本地节点主机服务都会使用同一个环回传输协议。当设备发现同时返回原始 Tailnet IP 和稳定主机名时，应用会优先使用 Tailscale MagicDNS 或 LAN 名称，以便连接更好地经受地址变化。如果本地隧道端口与远程 Gateway 网关端口不同，请将 `gateway.remote.remotePort` 设置为远程主机上的端口。

远程模式下的浏览器自动化由 CLI 节点主机负责，而不是原生 macOS 应用节点。应用会在可能时启动已安装的节点主机服务；若要从这台 Mac 启用浏览器控制，请使用 `openclaw node install ...` 和 `openclaw node start` 安装/启动它（或在前台运行 `openclaw node run ...`），然后指向该具备浏览器能力的节点。

## 远程主机上的前提条件

1. 安装 Node + pnpm，并构建/安装 OpenClaw CLI（`pnpm install && pnpm build && pnpm link --global`）。
2. 确保 `openclaw` 位于非交互式 shell 的 PATH 上（如有需要，可符号链接到 `/usr/local/bin` 或 `/opt/homebrew/bin`）。
3. 对于 SSH 传输协议：设置基于密钥的 SSH 认证。建议使用 Tailscale IP，以便在离开 LAN 后仍保持稳定可达。

## macOS 应用设置

若要不经过欢迎流程而预配置应用，请通过 SSH：

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

或者，对于已经可通过受信任 LAN 或 Tailnet 访问的 Gateway 网关，可以完全跳过 SSH：

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

两种形式都会写入 `~/.openclaw/openclaw.json`，标记新手引导已完成，并让应用在下次启动时接管所选传输协议。`--local-port`/`--remote-port` 默认值为 `18789`。其他标志：`--password`、`--identity <path>`、`--ssh-host-key-policy <strict|openssh>`、`--project-root <path>`、`--cli-path <path>`、`--json`。运行 `openclaw-mac configure-remote --help` 查看完整参考。

若要改从 UI 配置：

1. 打开 _Settings -> General_。
2. 在 **OpenClaw 运行位置** 下，选择 **远程** 并设置：
   - **传输协议**：**SSH 隧道** 或 **直接（ws/wss）**。
   - **SSH 目标**：`user@host`（可选 `:port`）。如果 Gateway 网关位于同一 LAN，并通过 Bonjour 广播，请从发现列表中选择它以自动填充此字段。
   - **Gateway 网关 URL**（仅直接模式）：`wss://gateway.example.ts.net`（或用于本地/LAN 的 `ws://...`）。
   - **身份文件**（高级）：你的密钥路径。
   - **项目根目录**（高级）：用于命令的远程检出路径。
   - **CLI 路径**（高级）：可选的可运行 `openclaw` 入口点/二进制文件路径（在广播时会自动填充）。
3. 点击 **测试远程**。成功表示远程 `openclaw status --json` 已正确运行。失败通常意味着 PATH/CLI 问题；退出码 127 表示在远程未找到 CLI。
4. 健康检查和 Web 聊天现在会自动通过所选传输协议运行。

## Web 聊天

- **SSH 隧道**：通过转发后的 WebSocket 控制端口（默认 18789）连接到 Gateway 网关。
- **直接（ws/wss）**：直接连接到已配置的 Gateway 网关 URL。
- 没有单独的 Web 聊天 HTTP 服务器。

## 权限

- 远程主机需要与本地相同的 TCC 批准（自动化、辅助功能、屏幕录制、麦克风、语音识别、通知）。在那台机器上运行一次新手引导以授予这些权限。
- 节点会通过 `node.list` / `node.describe` 广播自己的权限状态，以便智能体知道哪些能力可用。

## 安全说明

- 建议在远程主机上使用环回绑定，并通过 SSH、Tailscale Serve 或受信任的 Tailnet/LAN 直接 URL 连接。
- SSH 隧道默认要求主机密钥已经受信任。请先信任主机密钥（将其添加到已配置的 known-hosts 文件），或者为你接受其 OpenSSH 信任策略的托管别名显式设置 `gateway.remote.sshHostKeyPolicy: "openssh"`。
- 如果你将 Gateway 网关绑定到非环回接口，请要求有效的 Gateway 网关认证：令牌、密码，或带有 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。
- 参阅 [安全](/zh-CN/gateway/security) 和 [Tailscale](/zh-CN/gateway/tailscale)。

## WhatsApp 登录流程（远程）

- **在远程主机上**运行 `openclaw channels login --channel whatsapp --verbose`。用手机上的 WhatsApp 扫描二维码。
- 如果认证过期，请在该主机上重新运行登录。健康检查会显示链接问题。

## 故障排查

| 症状                                          | 原因 / 修复                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / 未找到                           | `openclaw` 不在非登录 shell 的 PATH 中。将它添加到 `/etc/paths`、你的 shell rc，或符号链接到 `/usr/local/bin`/`/opt/homebrew/bin`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 健康探测失败                              | 检查 SSH 可达性、PATH，以及 Baileys (WhatsApp) 是否已登录（`openclaw status --json`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Web Chat 卡住                                   | 确认 Gateway 网关正在远程主机上运行，并且转发端口与 Gateway 网关 WS 端口匹配；UI 需要健康的 WS 连接。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 节点 IP 显示 `127.0.0.1`                        | 使用 SSH 隧道时符合预期。如果你希望 Gateway 网关看到真实客户端 IP，请将 **传输协议** 切换为 **直接 (ws/wss)**。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Dashboard 可用但 Mac 能力离线 | 操作员/控制连接健康，但配套节点连接未连接，或缺少其命令表面。打开菜单栏设备部分，检查 Mac 是否为 `paired · disconnected`。对于 `wss://*.ts.net` Tailscale Serve 端点，应用会在证书轮换后检测到过期的旧版 TLS 叶证书固定，在 macOS 信任新证书后清除过期固定，并自动重试。如果证书未被系统信任，或主机不是 Tailscale Serve 名称，请将 `gateway.remote.tlsFingerprint` 设置为预期的证书指纹，检查证书，或切换到 **通过 SSH 远程连接**。 |
| Voice Wake                                       | 在远程模式下，触发短语会自动转发；不需要单独的转发器。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## 通知声音

使用 `openclaw nodes notify` 从脚本为每条通知选择声音，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

应用中没有全局默认声音开关；调用方按每个请求选择声音（或不选择）。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [远程访问](/zh-CN/gateway/remote)
