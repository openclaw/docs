---
read_when:
    - 在 Raspberry Pi 上设置 OpenClaw
    - 在 ARM 设备上运行 OpenClaw
    - 构建低成本、始终在线的个人 AI
summary: 在 Raspberry Pi 上托管 OpenClaw，实现始终在线的自托管
title: Raspberry Pi
x-i18n:
    generated_at: "2026-06-27T02:19:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9cd90b4cc70c8fe7eab2a0abadc0e2969c7dc1c09657a0819bc004280ec32ba3
    source_path: install/raspberry-pi.md
    workflow: 16
---

运行一个持久、常开的 OpenClaw Gateway 网关在 Raspberry Pi 上。由于 Pi 只是 Gateway 网关（模型通过 API 在云端运行），即使是配置普通的 Pi 也能很好地处理工作负载——典型硬件成本是**一次性 $35–80**，没有月费。

## 硬件兼容性

| Pi 型号     | RAM    | 可用？ | 说明                         |
| ----------- | ------ | ------ | ---------------------------- |
| Pi 5        | 4/8 GB | 最佳   | 最快，推荐。                 |
| Pi 4        | 4 GB   | 良好   | 适合大多数用户的平衡点。     |
| Pi 4        | 2 GB   | 可以   | 添加 swap。                  |
| Pi 4        | 1 GB   | 紧张   | 配合 swap 和最小配置可用。   |
| Pi 3B+      | 1 GB   | 慢     | 可用但迟缓。                 |
| Pi Zero 2 W | 512 MB | 不推荐 | 不建议使用。                 |

**最低要求：** 1 GB RAM、1 个核心、500 MB 可用磁盘空间、64 位 OS。
**推荐：** 2 GB+ RAM、16 GB+ SD 卡（或 USB SSD）、以太网。

## 前提条件

- 配备 2 GB+ RAM 的 Raspberry Pi 4 或 5（推荐 4 GB）
- MicroSD 卡（16 GB+）或 USB SSD（性能更好）
- 官方 Pi 电源
- 网络连接（以太网或 WiFi）
- 64 位 Raspberry Pi OS（必需 -- 不要使用 32 位）
- 约 30 分钟

## 设置

<Steps>
  <Step title="Flash the OS">
    使用 **Raspberry Pi OS Lite (64-bit)** -- 无头服务器不需要桌面环境。

    1. 下载 [Raspberry Pi Imager](https://www.raspberrypi.com/software/)。
    2. 选择 OS：**Raspberry Pi OS Lite (64-bit)**。
    3. 在设置对话框中预先配置：
       - 主机名：`gateway-host`
       - 启用 SSH
       - 设置用户名和密码
       - 配置 WiFi（如果不使用以太网）
    4. 写入到你的 SD 卡或 USB 驱动器，插入并启动 Pi。

  </Step>

  <Step title="Connect via SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Update the system">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Install Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Add swap (important for 2 GB or less)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Reduce swappiness for low-RAM devices
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Install OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Run onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    按照向导操作。对于无头设备，推荐使用 API keys 而不是 OAuth。Telegram 是最容易开始使用的渠道。

  </Step>

  <Step title="Verify">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    在你的电脑上，从 Pi 获取 dashboard URL：

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    然后在另一个终端中创建 SSH 隧道：

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    在本地浏览器中打开打印出的 URL。关于常开远程访问，请参阅 [Tailscale 集成](/zh-CN/gateway/tailscale)。

  </Step>
</Steps>

## 性能提示

**使用 USB SSD** -- SD 卡速度慢且会磨损。USB SSD 可以显著提升性能。请参阅 [Pi USB 启动指南](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)。

**启用模块编译缓存** -- 加快低功耗 Pi 主机上的重复 CLI 调用：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`OPENCLAW_NO_RESPAWN=1` 会让常规 Gateway 网关重启保持在进程内执行，从而避免额外的进程交接，并让小型主机上的 PID 跟踪保持简单。

**减少内存使用** -- 对于无头设置，释放 GPU 内存并禁用未使用的服务：

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**用于稳定重启的 systemd drop-in** -- 如果这个 Pi 主要用于运行 OpenClaw，请添加一个 service drop-in：

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

然后运行 `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`。在无头 Pi 上，还要启用一次 lingering，让用户服务在登出后继续存活：`sudo loginctl enable-linger "$(whoami)"`。

## 推荐模型设置

由于 Pi 只运行 Gateway 网关，请使用云托管的 API 模型：

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

不要在 Pi 上运行本地 LLM——即使是小模型也太慢，实用性不足。让 Claude 或 GPT 处理模型工作。

## ARM 二进制说明

大多数 OpenClaw 功能在 ARM64 上无需更改即可工作（Node.js、Telegram、WhatsApp/Baileys、Chromium）。偶尔缺少 ARM 构建的二进制文件通常是 Skills 附带的可选 Go/Rust CLI 工具。在回退到从源码构建之前，先检查缺失二进制文件的发布页面是否有 `linux-arm64` / `aarch64` 构件。

## 持久化和备份

OpenClaw 状态位于：

- `~/.openclaw/` — `openclaw.json`、每个 agent 的 `auth-profiles.json`、渠道/提供商状态、会话。
- `~/.openclaw/workspace/` — Agent 工作区（SOUL.md、记忆、构件）。

这些内容会在重启后保留。使用以下命令创建可移植快照：

```bash
openclaw backup create
```

如果你把这些内容放在 SSD 上，相比 SD 卡，性能和寿命都会提升。

## 故障排除

**内存不足** -- 使用 `free -h` 确认 swap 已启用。禁用未使用的服务（`sudo systemctl disable cups bluetooth avahi-daemon`）。只使用基于 API 的模型。

**性能慢** -- 使用 USB SSD 替代 SD 卡。用 `vcgencmd get_throttled` 检查 CPU 是否降频（应返回 `0x0`）。

**服务无法启动** -- 使用 `journalctl --user -u openclaw-gateway.service --no-pager -n 100` 检查日志，并运行 `openclaw doctor --non-interactive`。如果这是无头 Pi，还要确认已启用 lingering：`sudo loginctl enable-linger "$(whoami)"`。

**ARM 二进制问题** -- 如果某个 skill 因 “exec format error” 失败，请检查该二进制文件是否有 ARM64 构建。用 `uname -m` 确认架构（应显示 `aarch64`）。

**WiFi 掉线** -- 禁用 WiFi 电源管理：`sudo iwconfig wlan0 power off`。

## 后续步骤

- [渠道](/zh-CN/channels) -- 连接 Telegram、WhatsApp、Discord 等
- [Gateway 网关配置](/zh-CN/gateway/configuration) -- 所有配置选项
- [更新](/zh-CN/install/updating) -- 让 OpenClaw 保持最新

## 相关内容

- [安装概览](/zh-CN/install)
- [Linux 服务器](/zh-CN/vps)
- [平台](/zh-CN/platforms)
