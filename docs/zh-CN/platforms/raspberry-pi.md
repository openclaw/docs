---
read_when:
    - 在 Raspberry Pi 上设置 OpenClaw
    - 在 ARM 设备上运行 OpenClaw
    - 搭建一个低成本、始终在线的个人 AI
summary: 在 Raspberry Pi 上运行 OpenClaw（低预算自托管设置）
title: Raspberry Pi（平台）
x-i18n:
    generated_at: "2026-04-24T03:41:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79a2e8edf3c2853deddece8d52dc87b9a5800643b4d866acd80db3a83ca9b270
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# 在 Raspberry Pi 上运行 OpenClaw

## 目标

在 Raspberry Pi 上运行一个持久、始终在线的 OpenClaw Gateway 网关，一次性成本约为 **35–80 美元**（无月费）。

非常适合：

- 24/7 个人 AI 助手
- 家庭自动化中枢
- 低功耗、始终可用的 Telegram/WhatsApp 机器人

## 硬件要求

| Pi 型号 | RAM | 可用？ | 说明 |
| --------------- | ------- | -------- | ---------------------------------- |
| **Pi 5** | 4GB/8GB | ✅ 最佳 | 最快，推荐 |
| **Pi 4** | 4GB | ✅ 良好 | 大多数用户的最佳平衡点 |
| **Pi 4** | 2GB | ✅ 可用 | 可以运行，建议增加 swap |
| **Pi 4** | 1GB | ⚠️ 紧张 | 配合 swap 和最小配置可以运行 |
| **Pi 3B+** | 1GB | ⚠️ 较慢 | 可以运行，但会比较卡顿 |
| **Pi Zero 2 W** | 512MB | ❌ | 不推荐 |

**最低规格：** 1GB RAM、1 个核心、500MB 磁盘  
**推荐规格：** 2GB 以上 RAM、64 位操作系统、16GB 以上 SD 卡（或 USB SSD）

## 你需要准备

- Raspberry Pi 4 或 5（推荐 2GB 以上）
- MicroSD 卡（16GB 以上）或 USB SSD（性能更好）
- 电源适配器（推荐官方 Pi 电源）
- 网络连接（以太网或 WiFi）
- 约 30 分钟

## 1）刷写操作系统

使用 **Raspberry Pi OS Lite（64 位）** —— 对于无头服务器，不需要桌面环境。

1. 下载 [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. 选择操作系统：**Raspberry Pi OS Lite（64 位）**
3. 点击齿轮图标（⚙️）进行预配置：
   - 设置主机名：`gateway-host`
   - 启用 SSH
   - 设置用户名/密码
   - 配置 WiFi（如果不使用以太网）
4. 将镜像刷写到 SD 卡 / USB 驱动器
5. 插入并启动 Pi

## 2）通过 SSH 连接

```bash
ssh user@gateway-host
# 或使用 IP 地址
ssh user@192.168.x.x
```

## 3）系统设置

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件包
sudo apt install -y git curl build-essential

# 设置时区（对 cron/提醒很重要）
sudo timedatectl set-timezone America/Chicago  # 改成你的时区
```

## 4）安装 Node.js 24（ARM64）

```bash
# 通过 NodeSource 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# 验证
node --version  # 应显示 v24.x.x
npm --version
```

## 5）添加 Swap（对 2GB 或更低内存非常重要）

Swap 可防止因内存不足而崩溃：

```bash
# 创建 2GB swap 文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 设为永久生效
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 为低内存优化（降低 swappiness）
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6）安装 OpenClaw

### 选项 A：标准安装（推荐）

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### 选项 B：可修改安装（适合折腾）

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

可修改安装会让你直接访问日志和代码——这对调试 ARM 特定问题很有帮助。

## 7）运行新手引导

```bash
openclaw onboard --install-daemon
```

按照向导进行操作：

1. **Gateway 网关模式：** Local
2. **认证：** 推荐使用 API key（OAuth 在无头 Pi 上可能不太稳定）
3. **渠道：** 最容易开始的是 Telegram
4. **守护进程：** 是（systemd）

## 8）验证安装

```bash
# 检查状态
openclaw status

# 检查服务（标准安装 = systemd 用户单元）
systemctl --user status openclaw-gateway.service

# 查看日志
journalctl --user -u openclaw-gateway.service -f
```

## 9）访问 OpenClaw 仪表板

将 `user@gateway-host` 替换为你的 Pi 用户名，以及主机名或 IP 地址。

在你的电脑上，让 Pi 打印一个新的仪表板 URL：

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

该命令会输出 `Dashboard URL:`。根据 `gateway.auth.token`
的配置方式，URL 可能是普通的 `http://127.0.0.1:18789/` 链接，也可能
包含 `#token=...`。

在你电脑上的另一个终端中，创建 SSH 隧道：

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

然后在本地浏览器中打开刚刚输出的 Dashboard URL。

如果 UI 要求输入共享 secret 认证，请将已配置的 token 或密码
粘贴到 Control UI 设置中。对于 token 认证，请使用 `gateway.auth.token`（或
`OPENCLAW_GATEWAY_TOKEN`）。

如需始终在线的远程访问，请参阅 [Tailscale](/zh-CN/gateway/tailscale)。

---

## 性能优化

### 使用 USB SSD（提升巨大）

SD 卡较慢且容易磨损。USB SSD 可显著提升性能：

```bash
# 检查是否从 USB 启动
lsblk
```

设置方法请参阅 [Pi USB 启动指南](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)。

### 加快 CLI 启动（模块编译缓存）

在低功耗 Pi 主机上，启用 Node 的模块编译缓存可加快重复运行 CLI 的速度：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

说明：

- `NODE_COMPILE_CACHE` 可加快后续运行（`status`、`health`、`--help`）。
- `/var/tmp` 比 `/tmp` 更能在重启后保留内容。
- `OPENCLAW_NO_RESPAWN=1` 可避免 CLI 自我重启带来的额外启动开销。
- 第一次运行会预热缓存；后续运行收益最大。

### systemd 启动调优（可选）

如果这台 Pi 主要用于运行 OpenClaw，可添加一个服务 drop-in，以减少重启
抖动并保持启动环境稳定：

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

然后应用：

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

如果可能，请将 OpenClaw 状态/缓存保存在 SSD 支持的存储上，以避免冷启动期间
SD 卡随机 I/O 成为瓶颈。

如果这是一台无头 Pi，请启用 lingering 一次，以便用户服务在注销后仍然继续运行：

```bash
sudo loginctl enable-linger "$(whoami)"
```

有关 `Restart=` 策略如何帮助自动恢复：
[systemd 可以自动执行服务恢复](https://www.redhat.com/en/blog/systemd-automate-recovery)。

### 降低内存占用

```bash
# 禁用 GPU 内存分配（无头环境）
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# 如果不需要则禁用蓝牙
sudo systemctl disable bluetooth
```

### 监控资源

```bash
# 查看内存
free -h

# 查看 CPU 温度
vcgencmd measure_temp

# 实时监控
htop
```

---

## ARM 特定说明

### 二进制兼容性

大多数 OpenClaw 功能都能在 ARM64 上运行，但某些外部二进制可能需要 ARM 版本：

| 工具 | ARM64 状态 | 说明 |
| ------------------ | ------------ | ----------------------------------- |
| Node.js | ✅ | 运行良好 |
| WhatsApp（Baileys） | ✅ | 纯 JS，无问题 |
| Telegram | ✅ | 纯 JS，无问题 |
| gog（Gmail CLI） | ⚠️ | 需检查是否有 ARM 发行版 |
| Chromium（浏览器） | ✅ | `sudo apt install chromium-browser` |

如果某个 Skills 失败，请检查它的二进制是否有 ARM 构建。许多 Go/Rust 工具有；有些没有。

### 32 位与 64 位

**始终使用 64 位操作系统。** Node.js 和许多现代工具都需要它。可通过以下命令检查：

```bash
uname -m
# 应显示：aarch64（64 位），而不是 armv7l（32 位）
```

---

## 推荐模型设置

由于 Pi 仅作为 Gateway 网关使用（模型在云端运行），请使用基于 API 的模型：

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

**不要尝试在 Pi 上运行本地 LLM** —— 即使是小模型也太慢。让 Claude/GPT 来承担主要计算工作。

---

## 开机自启动

新手引导会自动设置这一点，但你也可以验证：

```bash
# 检查服务是否已启用
systemctl --user is-enabled openclaw-gateway.service

# 如果未启用则启用
systemctl --user enable openclaw-gateway.service

# 开机启动
systemctl --user start openclaw-gateway.service
```

---

## 故障排除

### 内存不足（OOM）

```bash
# 查看内存
free -h

# 增加更多 swap（见步骤 5）
# 或减少 Pi 上正在运行的服务
```

### 性能缓慢

- 使用 USB SSD 而不是 SD 卡
- 禁用未使用的服务：`sudo systemctl disable cups bluetooth avahi-daemon`
- 检查 CPU 是否降频：`vcgencmd get_throttled`（应返回 `0x0`）

### 服务无法启动

```bash
# 查看日志
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# 常见修复：重新构建
cd ~/openclaw  # 如果使用可修改安装
npm run build
systemctl --user restart openclaw-gateway.service
```

### ARM 二进制问题

如果某个 Skills 因 “exec format error” 失败：

1. 检查该二进制是否有 ARM64 构建
2. 尝试从源码构建
3. 或使用支持 ARM 的 Docker 容器

### WiFi 掉线

对于通过 WiFi 运行的无头 Pi：

```bash
# 禁用 WiFi 省电管理
sudo iwconfig wlan0 power off

# 设为永久生效
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## 成本对比

| 方案 | 一次性成本 | 月成本 | 说明 |
| -------------- | ------------- | ------------ | ------------------------- |
| **Pi 4（2GB）** | ~$45 | $0 | + 电费（约 $5/年） |
| **Pi 4（4GB）** | ~$55 | $0 | 推荐 |
| **Pi 5（4GB）** | ~$60 | $0 | 最佳性能 |
| **Pi 5（8GB）** | ~$80 | $0 | 有些超配，但更面向未来 |
| DigitalOcean | $0 | $6/月 | $72/年 |
| Hetzner | $0 | €3.79/月 | 约 $50/年 |

**回本周期：** 与云 VPS 相比，Pi 大约 6–12 个月即可回本。

---

## 相关内容

- [Linux 指南](/zh-CN/platforms/linux) —— 通用 Linux 设置
- [DigitalOcean 指南](/zh-CN/install/digitalocean) —— 云端替代方案
- [Hetzner 指南](/zh-CN/install/hetzner) —— Docker 设置
- [Tailscale](/zh-CN/gateway/tailscale) —— 远程访问
- [Nodes](/zh-CN/nodes) —— 将你的笔记本电脑/手机与 Pi Gateway 网关配对
