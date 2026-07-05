---
read_when:
    - 在 Windows 上安装 OpenClaw
    - 在 Windows Hub、原生 Windows 和 WSL2 之间选择
    - 设置 Windows 配套应用或 Windows 节点模式
summary: Windows 支持：Windows Hub、原生 CLI 和 Gateway 网关、WSL2 Gateway 网关设置、节点模式和故障排查
title: Windows
x-i18n:
    generated_at: "2026-07-05T11:27:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1823abb4964082d1048cb80861fe1b6672e6709f29c875f98e503265b261e740
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw 附带原生 **Windows Hub** 配套应用，并支持 Windows CLI。
如果需要带有设置、托盘状态、聊天、Command Center 诊断和 Windows 节点能力的桌面应用，请使用 Windows Hub。若要直接使用 CLI/Gateway 网关，请使用 PowerShell 安装器。若要获得最兼容 Linux 的 Gateway 网关运行时，请使用 WSL2。

## 推荐：Windows Hub

Windows Hub 是适用于 Windows 10 20H2+ 和 Windows 11 的原生 WinUI 配套应用。它无需管理员权限即可安装，并在 OpenClaw 版本中以签名的 x64 和 ARM64 安装器形式发布。

从
[OpenClaw 发布页面](https://github.com/openclaw/openclaw/releases)下载最新稳定版安装器，或直接通过 `releases/latest/download` 下载：

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)
- [校验和](https://github.com/openclaw/openclaw/releases/latest/download/OpenClawCompanion-SHA256SUMS.txt)

如果上面的链接返回 404，请访问 [发布页面](https://github.com/openclaw/openclaw/releases)，并在最新版本中查找 `OpenClawCompanion-Setup-*` 资源。

安装后，从开始菜单或系统托盘启动 **OpenClaw Companion**。安装器还会添加 Gateway 网关设置、聊天、设置、检查更新和卸载的快捷方式。

### Windows Hub 包含的内容

- 系统托盘状态和登录时启动。
- 为本地应用拥有的 WSL Gateway 网关提供首次运行设置。
- 本地、远程和 SSH 隧道 Gateway 网关的连接设置。
- 原生聊天窗口，并可访问浏览器 Control UI。
- 用于会话、用量、渠道、节点、配对和修复命令的 Command Center 诊断。
- Windows 节点模式，支持智能体控制的画布、屏幕、摄像头、通知、设备状态、语音和受控的 `system.run`。
- 面向 Claude Desktop、Claude Code 和 Cursor 等 MCP 客户端的本地 MCP 服务器模式。

### 首次启动

首次启动时，如果没有可用的已保存 Gateway 网关，Windows Hub 会打开设置。最快路径是 **本地设置**，它会预配一个由应用拥有的 `OpenClawGateway` WSL 发行版，在其中安装 Gateway 网关，并配对应用。这不会导出或修改你现有的 Ubuntu 发行版。

如果你已经有 Gateway 网关，请选择 **高级设置**，或打开“连接”标签页。你可以连接到：

- 此电脑上的本地 Gateway 网关
- 此电脑上的 WSL Gateway 网关
- 通过 URL 和令牌或设置代码访问的远程 Gateway 网关
- 通过 SSH 隧道访问的 Gateway 网关

设置完成后，托盘图标会变为绿色。从托盘打开 **Command Center**，确认连接、配对、节点状态和渠道健康。

## Windows 节点模式

Windows Hub 可以注册为 OpenClaw 节点，使智能体能够通过 Gateway 网关使用已声明的 Windows 原生能力。节点命令必须先由节点声明，并被 Gateway 网关策略允许后才能运行；完整的允许/拒绝模型请参阅 [节点](/zh-CN/nodes#command-policy)。

常用命令：

| 系列 | 命令                                                                                 |
| ------ | ------------------------------------------------------------------------------------ |
| 画布 | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| 屏幕 | `screen.snapshot`; `screen.record` 需要显式选择启用                                  |
| 摄像头 | `camera.list`; `camera.snap`, `camera.clip` 需要显式选择启用                        |
| 系统 | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| 设备 | `location.get`, `device.info`, `device.status`                                       |
| 语音 | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

节点模式需要 Gateway 网关配对。如果应用显示配对请求，请从 Gateway 网关主机批准：

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Gateway 网关只会转发节点声明且服务器策略允许的命令。`screen.record`、`camera.snap` 和 `camera.clip` 等隐私敏感命令需要显式选择启用 `gateway.nodes.allowCommands`。

## 本地 MCP 模式

Windows Hub 可以将同一个 Windows 原生能力注册表作为本地 MCP 服务器暴露在回环地址上，因此本地 MCP 客户端无需运行 OpenClaw Gateway 网关也能驱动 Windows 能力。

在 Windows Hub 设置的开发者/高级部分启用它。服务器启用后，应用会显示回环端点和 bearer 令牌。

模式矩阵：

| 节点模式 | MCP 服务器 | 行为                               |
| --------- | ---------- | ---------------------------------- |
| 关闭       | 关闭        | 仅操作员使用的桌面应用             |
| 开启        | 关闭        | 连接 Gateway 网关的 Windows 节点   |
| 关闭       | 开启         | 仅本地 MCP 服务器                  |
| 开启        | 开启         | Gateway 网关节点加本地 MCP 服务器 |

## 原生 Windows CLI 和 Gateway 网关

如果你以终端为主，请从 PowerShell 安装 OpenClaw：

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

验证：

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

托管启动会在可用时使用 Windows 计划任务。该任务会把可读的 `gateway.cmd` 脚本保留在 OpenClaw 状态目录中，但通过生成的 `gateway.vbs` WScript 包装器启动它，因此后台 Gateway 网关不会打开可见的控制台窗口。如果任务创建被拒绝，OpenClaw 会回退到每用户启动文件夹中的登录项。

安装 Gateway 网关服务：

```powershell
openclaw gateway install
openclaw gateway status --json
```

如果只使用 CLI 且不需要托管的 Gateway 网关服务：

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 Gateway 网关

WSL2 仍然是 Windows 上最兼容 Linux 的 Gateway 网关运行时。Windows Hub 可以为你设置由应用拥有的 WSL Gateway 网关，也可以在你自己的发行版中手动安装。

手动设置：

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

在 WSL 中启用 systemd：

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

对于无头 WSL 设置，请确保即使没有人登录 Windows，完整启动链也会运行。

在 WSL 内：

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

在以管理员身份运行的 PowerShell 中：

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

将 `Ubuntu` 替换为以下命令显示的发行版名称：

```powershell
wsl --list --verbose
```

<Note>
与旧配方相比有两处变化：

- **使用 `dbus-launch true` 而不是 `/bin/true`**：在 WSL >= 2.6.1.0 上，一个回归问题（[microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)）会在最后一个客户端退出后 15-20 秒使发行版空闲终止，即使已启用 linger。`dbus-launch true` 会让一个 init 子进程保持存活，作为一种解决办法（社区讨论见 [microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)）。
- **使用 `/ru "$env:USERNAME"` 而不是 `/ru SYSTEM`**：每用户 WSL 发行版（默认设置）对 SYSTEM 账户不可见，因此任务看起来会运行，但发行版从未启动。用你自己的账户运行可避免此问题；创建任务时 Windows 会提示输入你的密码。

</Note>

重启后，从 WSL 验证：

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## 通过 LAN 暴露 WSL 服务

WSL 有自己的虚拟网络。如果另一台机器必须访问 WSL 内的服务，请将 Windows 端口转发到当前 WSL IP。WSL IP 在重启后可能变化，因此请在需要时刷新转发规则。

以管理员身份在 PowerShell 中执行示例：

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

- 从另一台机器 SSH 时，目标是 Windows 主机 IP，例如 `ssh user@windows-host -p 2222`。
- 远程节点必须指向可访问的 Gateway 网关 URL，而不是 `127.0.0.1`。
- LAN 访问使用 `listenaddress=0.0.0.0`，仅本地访问使用 `127.0.0.1`。

## 故障排查

### 托盘图标未出现

在任务管理器中检查 `OpenClaw.Tray.WinUI.exe`。如果它正在运行，请打开隐藏托盘图标区域并将其固定。如果没有运行，请从开始菜单启动 **OpenClaw Companion**。

### 本地设置失败

从 Windows Hub 打开设置日志，或检查：

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

常见原因：WSL 已禁用、虚拟化被阻止、应用拥有的 WSL 状态过期，或安装 Gateway 网关包时发生网络故障。

### 应用提示需要配对

从 Gateway 网关批准操作员或节点请求：

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

如果设备已有令牌，请在批准后从“连接”标签页重新连接。

### Web 聊天无法访问远程 Gateway 网关

远程 Web 聊天需要 HTTPS 或 localhost。对于自签名证书，请在 Windows 中信任该证书，或使用 SSH 隧道连接到 localhost URL。

### `screen.snapshot`、摄像头或音频命令失败

确认 Windows 已授予摄像头、麦克风、屏幕捕获和通知权限。打包安装会声明受保护能力，但 Windows 仍可能在命令首次使用它们时提示。

### Git 或 GitHub 连接失败

某些网络会阻止或限速到 GitHub 的 HTTPS。如果 `git clone` 或 `gh auth login` 失败，请尝试其他网络、VPN 或 HTTP/HTTPS 代理。

当前会话中基于令牌的 `gh` 凭证：

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

绝不要提交令牌，也不要将其粘贴到 issue 或 pull request 中。

## 相关

- [安装概览](/zh-CN/install)
- [Node.js 设置](/zh-CN/install/node)
- [节点](/zh-CN/nodes)
- [Control UI](/zh-CN/web/control-ui)
- [Gateway 配置](/zh-CN/gateway/configuration)
