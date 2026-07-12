---
read_when:
    - 在 Windows 上安装 OpenClaw
    - 在 Windows Hub、原生 Windows 和 WSL2 之间进行选择
    - 设置 Windows 配套应用或 Windows 节点模式
summary: Windows 支持：Windows Hub、原生 CLI 和 Gateway 网关、WSL2 Gateway 网关设置、节点模式和故障排查
title: Windows
x-i18n:
    generated_at: "2026-07-12T14:34:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f1a756d3af3898f211c27c34e16bbcc08f71e214ca1e0d5680c15a091ae1c2ca
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw 提供原生 **Windows Hub** 配套应用以及 Windows CLI 支持。
如果你需要包含设置、托盘状态、聊天、Command Center 诊断和 Windows 节点能力的桌面应用，请使用 Windows Hub。如果要直接使用 CLI/Gateway 网关，请使用 PowerShell
安装程序。如果需要与 Linux 兼容性最高的 Gateway 网关运行时，请使用 WSL2。

## 推荐：Windows Hub

Windows Hub 是适用于 Windows 10 20H2+ 和 Windows 11 的原生 WinUI 配套应用。
它无需管理员权限即可安装，并通过自己的发布页面提供已签名的 x64
和 ARM64 安装程序。

Windows Hub 与 OpenClaw CLI 和 Gateway 网关独立发布。请从
[Windows Hub 发布页面](https://github.com/openclaw/openclaw-windows-node/releases/latest)
下载最新稳定版 Hub 安装程序，或通过 `releases/latest/download` 直接下载：

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)

如果上面的链接返回 404，请访问 [Windows Hub 发布页面](https://github.com/openclaw/openclaw-windows-node/releases)
并打开最新的 Windows Hub 稳定版本。OpenClaw 常规稳定版本
也会镜像一个固定且经过发布验证的 Windows Hub 构建；该镜像可能会落后于
较新的独立 Hub 版本。

安装后，从开始菜单或系统托盘启动 **OpenClaw Companion**。
安装程序还会添加 Gateway Setup、Chat、Settings、
Check for Updates 和卸载快捷方式。

### Windows Hub 包含的功能

- 系统托盘状态和登录时启动。
- 首次运行时设置由应用管理的本地 WSL Gateway 网关。
- 本地、远程和通过 SSH 隧道连接的 Gateway 网关连接设置。
- 原生聊天窗口以及对浏览器 Control UI 的访问。
- Command Center 诊断，涵盖会话、用量、渠道、节点、配对
  和修复命令。
- Windows 节点模式，支持智能体控制画布、屏幕、摄像头、
  通知、设备状态、Talk、以及受控的 `system.run`。
- 面向 Claude Desktop、Claude Code 和 Cursor 等 MCP 客户端的本地 MCP 服务器模式。

### 首次启动

首次启动时，如果没有可用的已保存 Gateway 网关，Windows Hub 会打开设置。
最快的方式是 **Set up locally**，它会预配一个
由应用管理的 `OpenClawGateway` WSL 发行版，在其中安装 Gateway 网关，并
配对该应用。这不会导出或修改你现有的 Ubuntu 发行版。

如果你已有 Gateway 网关，请选择 **Advanced setup** 或打开 Connections 选项卡。
你可以连接到：

- 此 PC 上的本地 Gateway 网关
- 此 PC 上的 WSL Gateway 网关
- 通过 URL 和令牌或设置代码连接的远程 Gateway 网关
- 通过 SSH 隧道访问的 Gateway 网关

设置完成后，托盘图标会变为绿色。从托盘打开 **Command Center**，
确认连接、配对、节点状态和渠道健康状况。

## Windows 节点模式

Windows Hub 可以注册为 OpenClaw 节点，让智能体通过 Gateway 网关使用已声明的
Windows 原生能力。节点命令必须由节点声明并获得 Gateway 网关策略允许后
才能运行；完整的允许/拒绝模型请参阅
[节点](/zh-CN/nodes#command-policy)。

常用命令：

| 系列 | 命令                                                                                 |
| ------ | ------------------------------------------------------------------------------------ |
| 画布 | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| 屏幕 | `screen.snapshot`；`screen.record` 需要明确选择启用                                  |
| 摄像头 | `camera.list`；`camera.snap`, `camera.clip` 需要明确选择启用                        |
| 系统 | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| 设备 | `location.get`, `device.info`, `device.status`                                       |
| Talk | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

节点模式需要与 Gateway 网关配对。如果应用显示配对请求，
请在 Gateway 网关主机上批准：

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Gateway 网关只会转发节点声明且服务器策略
允许的命令。`screen.record`、`camera.snap`
和 `camera.clip` 等隐私敏感命令需要通过 `gateway.nodes.allowCommands` 明确选择启用。

## 本地 MCP 模式

Windows Hub 可以将同一套 Windows 原生能力注册表作为 local loopback 上的本地
MCP 服务器公开，使本地 MCP 客户端无需运行 OpenClaw Gateway 网关
即可驱动 Windows 能力。

请在 Windows Hub Settings 的 developer/advanced 部分启用它。
服务器启用后，应用会显示 local loopback 端点和持有者令牌。

模式矩阵：

| 节点模式 | MCP 服务器 | 行为                                   |
| --------- | ---------- | ---------------------------------- |
| 关闭      | 关闭       | 仅供操作员使用的桌面应用             |
| 开启      | 关闭       | 已连接 Gateway 网关的 Windows 节点   |
| 关闭      | 开启       | 仅本地 MCP 服务器                    |
| 开启      | 开启       | Gateway 网关节点加本地 MCP 服务器    |

## 原生 Windows CLI 和 Gateway 网关

如果主要通过终端使用，请从 PowerShell 安装 OpenClaw：

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

验证：

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

在可用时，托管启动会使用 Windows Scheduled Tasks。任务会将
可读的 `gateway.cmd` 脚本保留在 OpenClaw 状态目录中，但通过生成的
`gateway.vbs` WScript 包装器启动它，因此后台 Gateway 网关
不会打开可见的控制台窗口。如果创建任务被拒绝，OpenClaw
会回退到每用户 Startup 文件夹中的登录启动项。

安装 Gateway 网关服务：

```powershell
openclaw gateway install
openclaw gateway status --json
```

如果仅使用 CLI，而不使用托管 Gateway 网关服务：

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 Gateway 网关

WSL2 仍然是 Windows 上与 Linux 兼容性最高的 Gateway 网关运行时。Windows
Hub 可以为你设置一个由应用管理的 WSL Gateway 网关，你也可以在
自己的发行版中手动安装。

手动设置：

```powershell
wsl --install
# 或明确选择一个发行版：
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

然后按照 Linux 快速开始在 WSL 中安装 OpenClaw：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## 在登录 Windows 前自动启动 Gateway 网关

对于无头 WSL 设置，请确保即使无人
登录 Windows，也会运行完整的启动链。

在 WSL 中：

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

在以管理员身份运行的 PowerShell 中：

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

将 `Ubuntu` 替换为以下命令所列出的发行版名称：

```powershell
wsl --list --verbose
```

<Note>
与旧版配置方法相比有两处变化：

- **使用 `dbus-launch true`，而不是 `/bin/true`**：在 WSL >= 2.6.1.0 中，
  一个回归问题（[microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)）
  会在最后一个客户端退出 15-20 秒后因空闲而终止发行版，即使
  已启用 linger 也是如此。作为临时解决方案，`dbus-launch true` 会保持一个 init 子进程存活
  （社区讨论：[microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)）。
- **使用 `/ru "$env:USERNAME"`，而不是 `/ru SYSTEM`**：每用户 WSL 发行版（
  默认设置）对 SYSTEM 账户不可见，因此任务看似
  在运行，但发行版始终不会启动。使用你自己的账户运行可以避免
  此问题；创建任务时 Windows 会提示输入你的密码。

</Note>

重启后，从 WSL 验证：

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## 通过局域网公开 WSL 服务

WSL 拥有自己的虚拟网络。如果另一台计算机需要访问
WSL 内的服务，请将 Windows 端口转发到当前 WSL IP。WSL IP 可能会在
重启后发生变化，因此请按需刷新转发规则。

在以管理员身份运行的 PowerShell 中执行以下示例：

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "未找到 WSL IP。" }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

注意：

- 从另一台计算机发起 SSH 连接时，应以 Windows 主机 IP 为目标，例如 `ssh user@windows-host -p 2222`。
- 远程节点必须指向可访问的 Gateway 网关 URL，而不是 `127.0.0.1`。
- 局域网访问使用 `listenaddress=0.0.0.0`，仅本地访问使用 `127.0.0.1`。

## 故障排查

### 托盘图标未显示

在任务管理器中检查 `OpenClaw.Tray.WinUI.exe`。如果它正在运行，请打开
隐藏的托盘图标区域并将其固定。如果未运行，请从
开始菜单启动 **OpenClaw Companion**。

### 本地设置失败

从 Windows Hub 打开设置日志，或检查：

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

常见原因：WSL 被禁用、虚拟化被阻止、由应用管理的 WSL
状态过期，或安装 Gateway 网关软件包时发生网络故障。

### 应用提示需要配对

从 Gateway 网关批准操作员或节点请求：

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

如果设备已有令牌，请在批准后从 Connections 选项卡
重新连接。

### Web 聊天无法访问远程 Gateway 网关

远程 Web 聊天需要 HTTPS 或 localhost。对于自签名证书，请在 Windows 中信任
该证书，或使用 SSH 隧道连接到 localhost URL。

### `screen.snapshot`、摄像头或音频命令失败

确认 Windows 已授予摄像头、麦克风、屏幕捕获和
通知权限。打包安装会声明受保护的能力，但
Windows 仍可能在命令首次使用这些能力时发出提示。

### Git 或 GitHub 连接失败

某些网络会阻止或限制到 GitHub 的 HTTPS 连接。如果 `git clone` 或
`gh auth login` 失败，请尝试其他网络、VPN 或 HTTP/HTTPS 代理。

在当前会话中使用基于令牌的 `gh` 身份验证：

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

切勿提交令牌，也不要将其粘贴到议题或拉取请求中。

## 相关内容

- [安装概览](/zh-CN/install)
- [Node.js 设置](/zh-CN/install/node)
- [节点](/zh-CN/nodes)
- [Control UI](/zh-CN/web/control-ui)
- [Gateway 配置](/zh-CN/gateway/configuration)
