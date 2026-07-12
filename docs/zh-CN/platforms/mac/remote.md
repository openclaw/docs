---
read_when:
    - 设置或调试远程 Mac 控制
summary: 用于控制远程 OpenClaw Gateway 网关的 macOS 应用流程
title: 远程控制
x-i18n:
    generated_at: "2026-07-11T20:40:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

此流程可让 macOS 应用充当完整的远程控制器，用于控制在另一台主机（台式机/服务器）上运行的 OpenClaw Gateway 网关。应用可以直接连接到受信任的局域网/Tailnet Gateway 网关 URL；如果远程 Gateway 网关仅绑定到回环地址，则由应用管理 SSH 隧道。健康检查、语音唤醒转发和 Web Chat 都复用 _Settings -> General_ 中的同一套远程配置。

## 模式

- **本地（此 Mac）**：所有内容都在笔记本电脑上运行；不涉及 SSH。
- **通过 SSH 远程连接（默认）**：OpenClaw 命令在远程主机上运行。应用使用 `-o BatchMode`、你选择的身份/密钥和本地端口转发来建立 SSH 连接。
- **远程直连（ws/wss）**：不使用 SSH 隧道；应用直接连接到 Gateway 网关 URL（局域网、Tailscale、Tailscale Serve 或公共 HTTPS 反向代理）。

## 远程传输方式

- **SSH 隧道**（默认）：使用 `ssh -N -L ...` 将 Gateway 网关端口转发到 localhost。由于隧道使用回环地址，Gateway 网关看到的节点 IP 为 `127.0.0.1`。
- **直连（ws/wss）**：直接连接到 Gateway 网关 URL。Gateway 网关能看到真实的客户端 IP。

应用会为自身的 SSH 进程禁用 SSH 连接多路复用和身份验证后后台运行，以便监控并重启准确的进程，即使所选别名启用了 `ControlMaster` 或 `ForkAfterAuthentication`。

默认情况下会严格验证 SSH 主机密钥，因为 Gateway 网关凭据会通过此隧道传输。若要改为使用托管 SSH 别名自身的信任行为，请通过 `openclaw-mac configure-remote` 设置 `--ssh-host-key-policy openssh`，或直接将 `gateway.remote.sshHostKeyPolicy` 设置为 `"openssh"`。选择启用前，请检查该别名以及任何匹配的 `Host *` 或系统配置。更改 SSH 目标（在应用中或通过 `configure-remote`）会将策略重置为 `strict`，除非你再次为新目标明确选择启用。

在 SSH 隧道模式下，发现的局域网/Tailnet 主机名会保存为 `gateway.remote.sshTarget`。应用会让 `gateway.remote.url` 指向本地隧道端点（例如 `ws://127.0.0.1:18789`），以便 CLI、Web Chat 和本地节点主机服务都使用相同的回环传输方式。当设备发现同时返回原始 Tailnet IP 和稳定主机名时，应用会优先使用 Tailscale MagicDNS 或局域网名称，使连接更能适应地址变化。如果本地隧道端口与远程 Gateway 网关端口不同，请将 `gateway.remote.remotePort` 设置为远程主机上的端口。

远程模式下的浏览器自动化由 CLI 节点主机负责，而不是原生 macOS 应用节点。应用会尽可能启动已安装的节点主机服务；若要从该 Mac 启用浏览器控制，请使用 `openclaw node install ...` 和 `openclaw node start` 安装并启动该服务（或在前台运行 `openclaw node run ...`），然后将目标设为具有浏览器功能的节点。

## 远程主机上的前置要求

1. 安装 Node + pnpm，并构建/安装 OpenClaw CLI（`pnpm install && pnpm build && pnpm link --global`）。
2. 确保非交互式 shell 的 PATH 中包含 `openclaw`（如有需要，可将其符号链接到 `/usr/local/bin` 或 `/opt/homebrew/bin`）。
3. 对于 SSH 传输：设置基于密钥的 SSH 身份验证。建议使用 Tailscale IP，以便离开局域网后仍能稳定访问。

## macOS 应用设置

若要跳过欢迎流程并通过 SSH 预配置应用：

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

或者，如果 Gateway 网关已可通过受信任的局域网或 Tailnet 访问，则可以完全跳过 SSH：

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

这两种形式都会写入 `~/.openclaw/openclaw.json`、将新手引导标记为完成，并让应用在下次启动时管理所选的传输方式。`--local-port`/`--remote-port` 默认为 `18789`。其他标志包括：`--password`、`--identity <path>`、`--ssh-host-key-policy <strict|openssh>`、`--project-root <path>`、`--cli-path <path>`、`--json`。运行 `openclaw-mac configure-remote --help` 查看完整参考。

若要改为从 UI 配置：

1. 打开 _Settings -> General_。
2. 在 **OpenClaw runs** 下选择 **Remote**，然后设置：
   - **Transport**：**SSH tunnel** 或 **Direct (ws/wss)**。
   - **SSH target**：`user@host`（可选 `:port`）。如果 Gateway 网关位于同一局域网中并广播 Bonjour，请从发现列表中选择它，以自动填充此字段。
   - **Gateway URL**（仅限 Direct）：`wss://gateway.example.ts.net`（本地/局域网可使用 `ws://...`）。
   - **Identity file**（高级）：密钥的路径。
   - **Project root**（高级）：用于运行命令的远程检出路径。
   - **CLI path**（高级）：可选的可运行 `openclaw` 入口点/二进制文件路径（广播时会自动填充）。
3. 点击 **Test remote**。成功表示远程 `openclaw status --json` 已正确运行。失败通常表示 PATH/CLI 存在问题；退出码 127 表示在远程主机上找不到 CLI。
4. 健康检查和 Web Chat 现在会自动通过所选的传输方式运行。

## Web Chat

- **SSH 隧道**：通过转发后的 WebSocket 控制端口（默认 18789）连接到 Gateway 网关。
- **直连（ws/wss）**：直接连接到已配置的 Gateway 网关 URL。
- 不存在单独的 Web Chat HTTP 服务器。

## 权限

- 远程主机需要与本地相同的 TCC 批准（自动化、辅助功能、屏幕录制、麦克风、语音识别、通知）。在该计算机上运行一次新手引导以授予这些权限。
- 节点通过 `node.list` / `node.describe` 公告其权限状态，以便智能体了解可用功能。

## 安全说明

- 建议在远程主机上绑定回环地址，并通过 SSH、Tailscale Serve 或受信任的 Tailnet/局域网直连 URL 进行连接。
- 默认情况下，SSH 隧道要求主机密钥已受信任。请先信任该主机密钥（将其添加到已配置的 known-hosts 文件），或者为你接受其 OpenSSH 信任策略的托管别名明确设置 `gateway.remote.sshHostKeyPolicy: "openssh"`。
- 如果将 Gateway 网关绑定到非回环接口，则必须使用有效的 Gateway 网关身份验证：令牌、密码，或配置了 `gateway.auth.mode: "trusted-proxy"` 的身份感知型反向代理。
- 请参阅[安全性](/zh-CN/gateway/security)和 [Tailscale](/zh-CN/gateway/tailscale)。

## WhatsApp 登录流程（远程）

- **在远程主机上**运行 `openclaw channels login --channel whatsapp --verbose`。使用手机上的 WhatsApp 扫描二维码。
- 如果身份验证过期，请在该主机上重新运行登录。健康检查会显示关联问题。

## 故障排查

| 症状                                             | 原因 / 修复方法                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / 未找到                              | 对于非登录 shell，`openclaw` 不在 PATH 中。请将其添加到 `/etc/paths` 或你的 shell rc 文件，或者创建符号链接到 `/usr/local/bin`/`/opt/homebrew/bin`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 健康探测失败                                     | 检查 SSH 是否可达、PATH 是否正确，以及 Baileys (WhatsApp) 是否已登录（`openclaw status --json`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Web Chat 卡住                                    | 确认 Gateway 网关正在远程主机上运行，并且转发端口与 Gateway 网关的 WS 端口一致；该 UI 需要健康的 WS 连接。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 节点 IP 显示 `127.0.0.1`                         | 使用 SSH 隧道时属于预期情况。如果希望 Gateway 网关看到真实的客户端 IP，请将 **Transport** 切换为 **Direct (ws/wss)**。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 仪表板正常，但 Mac 功能离线                      | 操作员/控制连接正常，但配套节点连接未连接或缺少其命令接口。打开菜单栏中的设备部分，检查 Mac 是否显示为 `paired · disconnected`。对于 `wss://*.ts.net` Tailscale Serve 端点，应用会在证书轮换后检测过期的旧版 TLS 叶证书固定信息，在 macOS 信任新证书后清除过期的固定信息，并自动重试。如果证书未获得系统信任，或者主机并非 Tailscale Serve 名称，请将 `gateway.remote.tlsFingerprint` 设置为预期的证书指纹、检查证书，或切换到 **Remote over SSH**。 |
| 语音唤醒                                         | 在远程模式下，触发短语会自动转发；无需单独的转发器。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

## 通知声音

使用 `openclaw nodes notify` 从脚本中为每条通知选择声音，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

应用中没有全局默认声音开关；调用方为每个请求选择声音（或不使用声音）。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [远程访问](/zh-CN/gateway/remote)
