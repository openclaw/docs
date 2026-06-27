---
read_when:
    - 在 Windows 上安装 OpenClaw
    - 在 Windows Hub、原生 Windows 和 WSL2 之间选择
    - 设置 Windows 配套应用或 Windows 节点模式
summary: Windows 支持：Windows Hub、原生 CLI 和 Gateway 网关、WSL2 Gateway 网关设置、节点模式和故障排除
title: Windows
x-i18n:
    generated_at: "2026-06-27T02:33:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw 随附原生 **Windows Hub** 配套应用以及 Windows CLI 支持。
当你需要带有设置、托盘状态、聊天、
Command Center 诊断和 Windows 节点能力的桌面应用时，请使用 Windows Hub。需要直接使用 CLI/Gateway 网关时，请使用 PowerShell
安装器。需要
最兼容 Linux 的 Gateway 网关运行时时，请使用 WSL2。

## 推荐：Windows Hub

Windows Hub 是适用于 Windows 10 20H2+ 和 Windows 11 的原生 WinUI 配套应用。它无需管理员权限即可安装，并在 OpenClaw 发布版中提供已签名的
x64 和 ARM64 安装器。

从 [OpenClaw 发布页面](https://github.com/openclaw/openclaw/releases)下载最新稳定版安装器：

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [校验和](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

如果上面的下载链接返回 404，请访问[发布页面](https://github.com/openclaw/openclaw/releases)，并在最新发布版中查找 `OpenClawCompanion-Setup-*` 资源。

安装后，从开始菜单或系统
托盘启动 **OpenClaw Companion**。安装器还会添加 Gateway 网关设置、聊天、设置、
检查更新和卸载的快捷方式。

### Windows Hub 包含的内容

- 系统托盘状态和登录时启动
- 针对本地应用自有 WSL Gateway 网关的首次运行设置
- 本地、远程和 SSH 隧道 Gateway 网关的连接设置
- 原生聊天窗口，以及访问浏览器 Control UI
- 用于会话、用量、渠道、节点、配对和
  修复命令的 Command Center 诊断
- Windows 节点模式，用于由智能体控制的画布、屏幕、摄像头、通知、
  设备状态、文本转语音、语音转文本和受控 `system.run`
- 面向 Claude Desktop、Claude Code 和
  Cursor 等 MCP 客户端的本地 MCP 服务器模式

### 首次启动

首次启动时，如果没有可用的已保存 Gateway 网关，Windows Hub 会打开设置。
最快路径是**本地设置**，它会预配应用自有的
`OpenClawGateway` WSL 发行版，在其中安装 Gateway 网关，并配对应用。
这不会导出或修改你现有的 Ubuntu 发行版。

如果你已有
Gateway 网关，请选择**高级设置**或打开“连接”标签页。你可以连接到：

- 此 PC 上的本地 Gateway 网关
- 此 PC 上的 WSL Gateway 网关
- 通过 URL 和令牌或设置码访问的远程 Gateway 网关
- 通过 SSH 隧道访问的 Gateway 网关

设置完成后，托盘图标会变为绿色。从
托盘打开 **Command Center**，确认连接、配对、节点状态和渠道健康。

## Windows 节点模式

Windows Hub 可以注册为一等 OpenClaw 节点。随后智能体可以通过 Gateway 网关使用
声明的 Windows 原生能力。

常见命令包括：

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot`，以及在明确选择启用时的 `screen.record`
- `camera.list`，以及在明确选择启用时的 `camera.snap`, `camera.clip`
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

节点模式需要 Gateway 网关配对。如果应用显示配对请求，请从 Gateway 网关主机批准
它：

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

Gateway 网关只会转发节点声明且服务器策略
允许的命令。`screen.record`、`camera.snap` 和
`camera.clip` 等隐私敏感命令需要明确选择启用 `gateway.nodes.allowCommands`。

## 本地 MCP 模式

Windows Hub 可以将同一套 Windows 原生能力注册表作为 loopback 上的本地
MCP 服务器公开。当你希望本地 MCP 客户端在没有运行 OpenClaw Gateway 网关的情况下驱动
Windows 能力时，这很有用。

在 Windows Hub 设置中的开发者/高级部分启用它。启用服务器后，应用
会显示 loopback 端点和 bearer 令牌。

模式矩阵：

| 节点模式 | MCP 服务器 | 行为                           |
| --------- | ---------- | ---------------------------------- |
| 关闭       | 关闭        | 仅供操作者使用的桌面应用          |
| 开启        | 关闭        | 已连接 Gateway 网关的 Windows 节点     |
| 关闭       | 开启         | 仅本地 MCP 服务器              |
| 开启        | 开启         | Gateway 网关节点加本地 MCP 服务器 |

## 原生 Windows CLI 和 Gateway 网关

对于以终端为主的使用方式，请从 PowerShell 安装 OpenClaw：

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

验证：

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

原生 Windows CLI 和 Gateway 网关流程受支持，并会持续改进。
托管启动会在可用时使用 Windows 计划任务。该任务会将
可读的 `gateway.cmd` 脚本保留在 OpenClaw 状态目录中，但会通过
生成的 `gateway.vbs` WScript 包装器启动它，因此后台 Gateway 网关不会打开
可见的控制台窗口。如果任务创建被拒绝，OpenClaw 会回退到
每用户 Startup 文件夹登录项。

安装 Gateway 网关服务：

```powershell
openclaw gateway install
openclaw gateway status --json
```

如果你只想使用 CLI，而不需要托管 Gateway 网关服务：

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 Gateway 网关

WSL2 仍然是 Windows 上最兼容 Linux 的 Gateway 网关运行时。Windows Hub
可以为你设置应用自有的 WSL Gateway 网关，也可以在
你自己的发行版内手动安装。

手动设置：

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

在 WSL 内启用 systemd：

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

从 PowerShell 重启 WSL：

```powershell
wsl --shutdown
```

然后使用 Linux 快速开始在 WSL 内安装 OpenClaw：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Windows 登录前自动启动 Gateway 网关

对于无头 WSL 设置，请确保完整启动链运行，即使没有人登录
Windows。

在 WSL 内：

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

在 PowerShell 中以管理员身份运行：

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

将 `Ubuntu` 替换为以下命令显示的发行版名称：

```powershell
wsl --list --verbose
```

> **注意：** 与旧版配方相比有两处变化：
>
> - **使用 `dbus-launch true` 而不是 `/bin/true`** — 在 WSL ≥ 2.6.1.0 上，一个回归问题（[microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)）会导致发行版在最后一个客户端退出后 15–20 秒空闲终止，即使已启用 linger。`dbus-launch true` 会保持一个 init 子进程存活，作为变通方案（[社区讨论，microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)）。
> - **使用 `/ru "$env:USERNAME"` 而不是 `/ru SYSTEM`** — 每用户 WSL 发行版（默认设置）对 SYSTEM 账户不可见；任务看似运行，但发行版从未启动。以你自己的账户运行可以避免这种情况。创建任务时，Windows 会提示输入你的密码。

重启后，从 WSL 验证：

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## 通过局域网公开 WSL 服务

WSL 有自己的虚拟网络。如果另一台机器必须访问
WSL 内的服务，请将 Windows 端口转发到当前 WSL IP。WSL IP 可能会在
重启后变化，因此需要时请刷新转发规则。

PowerShell 中以管理员身份运行的示例：

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

说明：

- 从另一台机器发起 SSH 时，目标是 Windows 主机 IP，例如
  `ssh user@windows-host -p 2222`。
- 远程节点必须指向可访问的 Gateway 网关 URL，而不是 `127.0.0.1`。
- 对于局域网访问，请使用 `listenaddress=0.0.0.0`。对于仅本地
  访问，请使用 `127.0.0.1`。

## 故障排除

### 托盘图标未显示

在任务管理器中检查 `OpenClaw.Tray.WinUI.exe`。如果它正在运行，请打开
隐藏的托盘图标区域并将其固定。如果它未运行，请从开始菜单启动 **OpenClaw
Companion**。

### 本地设置失败

从 Windows Hub 打开设置日志，或检查：

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

常见原因包括 WSL 被禁用、虚拟化被阻止、应用自有 WSL
状态过旧，或安装 Gateway 网关包时发生网络故障。

### 应用提示需要配对

从 Gateway 网关批准操作者或节点请求：

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

如果设备已有令牌，请在
批准后从“连接”标签页重新连接。

### Web 聊天无法访问远程 Gateway 网关

远程 Web 聊天需要 HTTPS 或 localhost。对于自签名证书，请在 Windows 中信任
该证书，或使用 SSH 隧道连接到 localhost URL。

### `screen.snapshot`、摄像头或音频命令失败

确认 Windows 对摄像头、麦克风、屏幕捕获和
通知的权限。打包安装会声明受保护能力，但 Windows
在命令首次使用这些能力时仍可能提示。

### Git 或 GitHub 连接失败

某些网络会阻止或限速到 GitHub 的 HTTPS 连接。如果 `git clone` 或 `gh auth
login` 失败，请尝试其他网络、VPN 或 HTTP/HTTPS 代理。

在当前会话中使用基于令牌的 `gh` 凭证：

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

切勿提交令牌，或将其粘贴到 issue 或 pull request 中。

## 相关

- [安装概览](/zh-CN/install)
- [Node.js 设置](/zh-CN/install/node)
- [节点](/zh-CN/nodes)
- [Control UI](/zh-CN/web/control-ui)
- [Gateway 网关配置](/zh-CN/gateway/configuration)
