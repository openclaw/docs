---
read_when:
    - 在 Raspberry Pi 上设置 OpenClaw
    - 在 ARM 设备上运行 OpenClaw
    - 构建低成本、全天候运行的个人 AI
summary: 在 Raspberry Pi 上托管 OpenClaw，实现全天候自托管
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-11T20:38:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

在 Raspberry Pi 上运行一个持久、始终在线的 OpenClaw Gateway 网关。由于 Pi 仅用作 Gateway 网关（模型通过 API 在云端运行），即使配置一般的 Pi 也能很好地处理这项工作——典型硬件成本为**一次性 35–80 美元**，无需支付月费。

## 硬件兼容性

| Pi 型号     | 内存   | 是否可用？ | 说明                         |
| ----------- | ------ | ---------- | ---------------------------- |
| Pi 5        | 4/8 GB | 最佳       | 速度最快，推荐使用。         |
| Pi 4        | 4 GB   | 良好       | 最适合大多数用户。           |
| Pi 4        | 2 GB   | 可用       | 添加交换空间。               |
| Pi 4        | 1 GB   | 较吃紧     | 配合交换空间和最简配置可用。 |
| Pi 3B+      | 1 GB   | 较慢       | 可以运行，但较为迟缓。       |
| Pi Zero 2 W | 512 MB | 不可用     | 不推荐。                     |

**最低要求：**1 GB 内存、1 个核心、500 MB 可用磁盘空间、64 位操作系统。
**推荐配置：**2 GB 以上内存、16 GB 以上 SD 卡（或 USB SSD）、以太网连接。

## 前提条件

- 配备 2 GB 以上内存的 Raspberry Pi 4 或 5（推荐 4 GB）
- MicroSD 卡（16 GB 以上）或 USB SSD（性能更好）
- 官方 Pi 电源
- 网络连接（以太网或 WiFi）
- 64 位 Raspberry Pi OS（必需——不要使用 32 位版本）
- 大约 30 分钟

## 设置

<Steps>
  <Step title="烧录操作系统">
    使用 **Raspberry Pi OS Lite（64 位）**——无头服务器不需要桌面环境。

    1. 下载 [Raspberry Pi Imager](https://www.raspberrypi.com/software/)。
    2. 选择操作系统：**Raspberry Pi OS Lite (64-bit)**。
    3. 在设置对话框中预先配置：
       - 主机名：`gateway-host`
       - 启用 SSH
       - 设置用户名和密码
       - 配置 WiFi（如果不使用以太网）
    4. 将系统烧录到 SD 卡或 USB 驱动器，插入设备，然后启动 Pi。

  </Step>

  <Step title="通过 SSH 连接">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="更新系统">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # 设置时区（对 cron 和提醒功能很重要）
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="安装 Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="添加交换空间（对 2 GB 或更少内存很重要）">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # 为低内存设备降低交换倾向
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="安装 OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="运行新手引导">
    ```bash
    openclaw onboard --install-daemon
    ```

    按照向导操作。对于无头设备，推荐使用 API 密钥而非 OAuth。Telegram 是最容易上手的渠道。

  </Step>

  <Step title="验证">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="访问 Control UI">
    在你的计算机上，从 Pi 获取仪表板 URL：

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    然后在另一个终端中创建 SSH 隧道：

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    在本地浏览器中打开输出的 URL。有关始终在线的远程访问，请参阅 [Tailscale 集成](/zh-CN/gateway/tailscale)。

  </Step>
</Steps>

## 性能优化建议

**使用 USB SSD**——SD 卡速度较慢且会磨损。USB SSD 可显著提升性能，并能承受更多写入周期；如果操作系统仍保留在 SD 卡上，请将它用于 `OPENCLAW_STATE_DIR`。请参阅 [Pi USB 启动指南](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)。

**启用模块编译缓存**——加快低功耗 Pi 主机上重复调用 CLI 的速度。`OPENCLAW_NO_RESPAWN=1` 使常规 Gateway 网关重启在当前进程内完成，避免额外的进程交接，并简化小型主机上的 PID 跟踪：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

使用 `/var/tmp`，不要使用 `/tmp`——某些发行版会在启动时清空 `/tmp`，从而丢失已预热的缓存。

**降低内存用量**——对于无头设置，释放 GPU 内存并禁用未使用的服务：

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**使用 systemd 插入配置实现稳定重启**——如果这台 Pi 主要用于运行 OpenClaw，请添加服务插入配置：

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

然后运行 `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`。在无头 Pi 上，还需启用一次用户驻留，使用户服务在注销后继续运行：`sudo loginctl enable-linger "$(whoami)"`。

## 推荐的模型设置

由于 Pi 只运行 Gateway 网关，请使用云端托管的 API 模型——不要在 Pi 上运行本地 LLM，即使是小型模型也慢到无法实用：

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

## ARM 二进制文件说明

大多数 OpenClaw 功能无需修改即可在 ARM64 上运行（Node.js、Telegram、WhatsApp/Baileys、Chromium）。偶尔缺少 ARM 构建的二进制文件通常是 Skills 附带的可选 Go/Rust CLI 工具。使用 `uname -m` 验证架构（应显示 `aarch64`），然后在回退到从源代码构建之前，检查缺失二进制文件的发布页面是否提供 `linux-arm64` / `aarch64` 构件。

## 持久化和备份

OpenClaw 状态位于：

- `~/.openclaw/`——`openclaw.json`、每个智能体的 `auth-profiles.json`、渠道/提供商状态和会话。
- `~/.openclaw/workspace/`——Agent 工作区（SOUL.md、记忆、产物）。

这些内容会在重启后保留。无论是性能还是使用寿命，使用 SSD 都优于 SD 卡。使用以下命令创建可移植快照：

```bash
openclaw backup create
```

## 故障排查

**内存不足**——使用 `free -h` 验证交换空间是否已启用。禁用未使用的服务（`sudo systemctl disable cups bluetooth avahi-daemon`）。仅使用基于 API 的模型。

**性能缓慢**——使用 USB SSD 代替 SD 卡。使用 `vcgencmd get_throttled` 检查 CPU 是否降频（应返回 `0x0`）。

**服务无法启动**——使用 `journalctl --user -u openclaw-gateway.service --no-pager -n 100` 查看日志，并运行 `openclaw doctor --non-interactive`。如果这是无头 Pi，还需验证用户驻留是否已启用：`sudo loginctl enable-linger "$(whoami)"`。

**ARM 二进制文件问题**——如果某个 Skill 因“exec format error”而失败，请检查该二进制文件是否提供 ARM64 构建。使用 `uname -m` 验证架构（应显示 `aarch64`）。

**WiFi 断连**——禁用 WiFi 电源管理：`sudo iwconfig wlan0 power off`。

## 后续步骤

- [渠道](/zh-CN/channels)——连接 Telegram、WhatsApp、Discord 等
- [Gateway 配置](/zh-CN/gateway/configuration)——所有配置选项
- [更新](/zh-CN/install/updating)——让 OpenClaw 保持最新

## 相关内容

- [安装概览](/zh-CN/install)
- [Linux 服务器](/zh-CN/vps)
- [平台](/zh-CN/platforms)
