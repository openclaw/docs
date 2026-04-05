---
read_when:
    - 在 Raspberry Pi 上设置 OpenClaw 时
    - 在 ARM 设备上运行 OpenClaw 时
    - 构建一个便宜、始终在线的个人 AI 时
summary: 在 Raspberry Pi 上运行 OpenClaw（低预算自托管方案）
title: Raspberry Pi（平台）
x-i18n:
    generated_at: "2026-04-05T08:38:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07f34e91899b7e0a31d9b944f3cb0cfdd4ecdeba58b619ae554379abdbf37eaf
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# 在 Raspberry Pi 上运行 OpenClaw

## 目标

在 Raspberry Pi 上运行一个持久、始终在线的 OpenClaw Gateway 网关，一次性成本约为 **35 到 80 美元**（无月费）。

非常适合用于：

- 24/7 个人 AI 助手
- 家庭自动化中枢
- 低功耗、始终可用的 Telegram/WhatsApp 机器人

## 硬件要求

| Pi 型号         | RAM     | 可用？    | 说明                         |
| --------------- | ------- | --------- | ---------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ 最佳   | 速度最快，推荐               |
| **Pi 4**        | 4GB     | ✅ 良好   | 适合大多数用户的甜点配置     |
| **Pi 4**        | 2GB     | ✅ 可以   | 可运行，建议增加 swap        |
| **Pi 4**        | 1GB     | ⚠️ 紧张   | 可行，但需配合 swap 和精简配置 |
| **Pi 3B+**      | 1GB     | ⚠️ 较慢   | 可以运行，但较卡顿           |
| **Pi Zero 2 W** | 512MB   | ❌        | 不推荐                       |

**最低规格：** 1GB RAM，1 个核心，500MB 磁盘  
**推荐配置：** 2GB 以上 RAM、64 位 OS、16GB 以上 SD 卡（或 USB SSD）

## 你需要准备

- Raspberry Pi 4 或 5（推荐 2GB 以上）
- MicroSD 卡（16GB 以上）或 USB SSD（性能更好）
- 电源适配器（推荐官方 Pi 电源）
- 网络连接（以太网或 WiFi）
- 约 30 分钟

## 1）刷入操作系统

使用 **Raspberry Pi OS Lite（64-bit）** —— 对于无头服务器不需要桌面环境。

1. 下载 [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. 选择 OS：**Raspberry Pi OS Lite（64-bit）**
3. 点击齿轮图标（⚙️）进行预配置：
   - 设置主机名：`gateway-host`
   - 启用 SSH
   - 设置用户名/密码
   - 配置 WiFi（如果不使用以太网）
4. 刷入到你的 SD 卡 / USB 驱动器
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

# 安装必需软件包
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

## 5）添加 Swap（对于 2GB 或更低内存很重要）

swap 可以防止因内存不足导致崩溃：

```bash
# 创建 2GB swap 文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 设置为永久生效
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 针对低内存优化（降低 swappiness）
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6）安装 OpenClaw

### 方案 A：标准安装（推荐）

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### 方案 B：可修改安装（适合折腾）

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

这种可修改安装让你可以直接访问日志和代码——对于调试 ARM 特定问题非常有用。

## 7）运行新手引导

```bash
openclaw onboard --install-daemon
```

按照向导进行：

1. **Gateway 模式：** 本地
2. **凭证：** 推荐使用 API 密钥（在无头 Pi 上，OAuth 可能不太稳定）
3. **渠道：** Telegram 最容易开始
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

## 9）访问 OpenClaw Dashboard

将 `user@gateway-host` 替换为你的 Pi 用户名和主机名或 IP 地址。

在你的电脑上，让 Pi 打印一个新的 dashboard URL：

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

然后在本地浏览器中打开刚才输出的 Dashboard URL。

如果 UI 要求共享密钥认证，请将已配置的 token 或密码
粘贴到 Control UI 设置中。对于 token 认证，请使用 `gateway.auth.token`（或
`OPENCLAW_GATEWAY_TOKEN`）。

如需始终在线的远程访问，请参见 [Tailscale](/gateway/tailscale)。

---

## 性能优化

### 使用 USB SSD（提升巨大）

SD 卡速度慢且容易磨损。USB SSD 可以显著提升性能：

```bash
# 检查是否从 USB 启动
lsblk
```

设置方法请参见 [Pi USB boot guide](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)。

### 加快 CLI 启动速度（模块编译缓存）

在低功耗 Pi 主机上，启用 Node 的模块编译缓存可以加快重复 CLI 运行速度：

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
- 首次运行会预热缓存；后续运行收益最大。

### systemd 启动调优（可选）

如果这台 Pi 主要用于运行 OpenClaw，可添加一个服务 drop-in 来减少重启抖动，并保持启动环境稳定：

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

然后应用更改：

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

如果可能，请将 OpenClaw 的状态/缓存放在 SSD 支持的存储上，以避免冷启动期间
SD 卡随机 I/O 瓶颈。

如果这是一台无头 Pi，请启用 lingering 一次，以便用户服务在注销后仍能存活：

```bash
sudo loginctl enable-linger "$(whoami)"
```

`Restart=` 策略如何帮助自动恢复：
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery)。

### 降低内存使用

```bash
# 禁用 GPU 内存分配（无头）
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# 如果不需要，禁用蓝牙
sudo systemctl disable bluetooth
```

### 监控资源

```bash
# 检查内存
free -h

# 检查 CPU 温度
vcgencmd measure_temp

# 实时监控
htop
```

---

## ARM 特定说明

### 二进制兼容性

大多数 OpenClaw 功能都可在 ARM64 上运行，但某些外部二进制工具可能需要 ARM 构建版本：

| 工具               | ARM64 状态 | 说明                             |
| ------------------ | ---------- | -------------------------------- |
| Node.js            | ✅         | 运行良好                         |
| WhatsApp (Baileys) | ✅         | 纯 JS，无问题                    |
| Telegram           | ✅         | 纯 JS，无问题                    |
| gog (Gmail CLI)    | ⚠️         | 请检查是否有 ARM 发布版本        |
| Chromium (browser) | ✅         | `sudo apt install chromium-browser` |

如果某个 skill 失败，请检查其二进制文件是否有 ARM 构建版本。许多 Go/Rust 工具都有，但有些没有。

### 32 位 vs 64 位

**始终使用 64 位 OS。** Node.js 和许多现代工具都需要它。可通过以下命令检查：

```bash
uname -m
# 应显示：aarch64（64 位），而不是 armv7l（32 位）
```

---

## 推荐模型设置

由于 Pi 只是 Gateway 网关（模型在云端运行），请使用基于 API 的模型：

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

**不要尝试在 Pi 上运行本地 LLM** —— 即使是小模型也太慢。让 Claude/GPT 处理重活。

---

## 开机自启动

新手引导会完成此设置，但你也可以这样验证：

```bash
# 检查服务已启用
systemctl --user is-enabled openclaw-gateway.service

# 如果未启用则启用
systemctl --user enable openclaw-gateway.service

# 设置为开机启动
systemctl --user start openclaw-gateway.service
```

---

## 故障排除

### 内存不足（OOM）

```bash
# 检查内存
free -h

# 增加更多 swap（见步骤 5）
# 或减少 Pi 上运行的服务
```

### 性能缓慢

- 使用 USB SSD 代替 SD 卡
- 禁用未使用的服务：`sudo systemctl disable cups bluetooth avahi-daemon`
- 检查 CPU 限频：`vcgencmd get_throttled`（应返回 `0x0`）

### 服务无法启动

```bash
# 检查日志
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# 常见修复：重新构建
cd ~/openclaw  # 如果使用的是可修改安装
npm run build
systemctl --user restart openclaw-gateway.service
```

### ARM 二进制问题

如果某个 skill 因 “exec format error” 失败：

1. 检查该二进制文件是否有 ARM64 构建版本
2. 尝试从源码构建
3. 或使用支持 ARM 的 Docker 容器

### WiFi 掉线

对于通过 WiFi 连接的无头 Pi：

```bash
# 禁用 WiFi 省电管理
sudo iwconfig wlan0 power off

# 设置为永久生效
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## 成本对比

| 配置             | 一次性成本 | 月成本    | 说明                      |
| ---------------- | ---------- | --------- | ------------------------- |
| **Pi 4（2GB）**  | ~$45       | $0        | + 电费（约 $5/年）        |
| **Pi 4（4GB）**  | ~$55       | $0        | 推荐                      |
| **Pi 5（4GB）**  | ~$60       | $0        | 最佳性能                  |
| **Pi 5（8GB）**  | ~$80       | $0        | 略显过度，但更面向未来    |
| DigitalOcean     | $0         | $6/月     | $72/年                    |
| Hetzner          | $0         | €3.79/月  | 约 $50/年                 |

**回本周期：** 与云 VPS 相比，Pi 大约 6 到 12 个月即可回本。

---

## 另请参阅

- [Linux 指南](/platforms/linux) —— 通用 Linux 设置
- [DigitalOcean 指南](/platforms/digitalocean) —— 云端替代方案
- [Hetzner 指南](/install/hetzner) —— Docker 设置
- [Tailscale](/gateway/tailscale) —— 远程访问
- [节点](/nodes) —— 将你的笔记本电脑/手机与 Pi Gateway 网关配对
