---
read_when:
    - 在 Raspberry Pi 上設定 OpenClaw
    - 在 ARM 裝置上執行 OpenClaw
    - 建置低成本、全天候運作的個人 AI
summary: 在 Raspberry Pi 上執行 OpenClaw（低預算自行託管設定）
title: Raspberry Pi（平台）
x-i18n:
    generated_at: "2026-04-30T03:22:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5a277499ee8759f766984b3fd2097dbd55f2f34ba6169fdfc2eb9dd53d6bb7c
    source_path: platforms/raspberry-pi.md
    workflow: 16
---

# Raspberry Pi 上的 OpenClaw

## 目標

以 **約 $35-80** 的一次性成本（無月費），在 Raspberry Pi 上執行持久、永遠在線的 OpenClaw Gateway。

非常適合：

- 24/7 個人 AI 助理
- 家庭自動化中樞
- 低功耗、隨時可用的 Telegram/WhatsApp bot

## 硬體需求

| Pi 型號        | RAM     | 可用？   | 備註                               |
| --------------- | ------- | -------- | ---------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ 最佳  | 最快，建議使用                     |
| **Pi 4**        | 4GB     | ✅ 良好  | 最適合大多數使用者                 |
| **Pi 4**        | 2GB     | ✅ 可以  | 可運作，建議加入 swap              |
| **Pi 4**        | 1GB     | ⚠️ 吃緊 | 搭配 swap 可行，需最小設定         |
| **Pi 3B+**      | 1GB     | ⚠️ 緩慢  | 可運作但反應遲緩                   |
| **Pi Zero 2 W** | 512MB   | ❌       | 不建議                             |

**最低規格：** 1GB RAM、1 核心、500MB 磁碟  
**建議規格：** 2GB+ RAM、64-bit OS、16GB+ SD 卡（或 USB SSD）

## 你需要準備

- Raspberry Pi 4 或 5（建議 2GB+）
- MicroSD 卡（16GB+）或 USB SSD（效能更好）
- 電源供應器（建議使用官方 Pi PSU）
- 網路連線（Ethernet 或 WiFi）
- 約 30 分鐘

## 1) 燒錄 OS

使用 **Raspberry Pi OS Lite (64-bit)** — 無頭伺服器不需要桌面環境。

1. 下載 [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. 選擇 OS：**Raspberry Pi OS Lite (64-bit)**
3. 按一下齒輪圖示（⚙️）進行預先設定：
   - 設定 hostname：`gateway-host`
   - 啟用 SSH
   - 設定使用者名稱/密碼
   - 設定 WiFi（如果不使用 Ethernet）
4. 燒錄到你的 SD 卡 / USB 磁碟
5. 插入並啟動 Pi

## 2) 透過 SSH 連線

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## 3) 系統設定

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## 4) 安裝 Node.js 24 (ARM64)

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v24.x.x
npm --version
```

## 5) 加入 Swap（對 2GB 或更低記憶體很重要）

Swap 可避免記憶體不足導致當機：

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for low RAM (reduce swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) 安裝 OpenClaw

### 選項 A：標準安裝（建議）

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### 選項 B：可修改安裝（適合 tinkering）

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

可修改安裝可讓你直接存取日誌與程式碼 — 對偵錯 ARM 特定問題很有用。

## 7) 執行初始設定

```bash
openclaw onboard --install-daemon
```

依照精靈操作：

1. **Gateway 模式：** 本機
2. **驗證：** 建議使用 API keys（OAuth 在無頭 Pi 上可能較不穩定）
3. **頻道：** Telegram 最容易開始
4. **Daemon：** 是（systemd）

## 8) 驗證安裝

```bash
# Check status
openclaw status

# Check service (standard install = systemd user unit)
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 9) 存取 OpenClaw Dashboard

將 `user@gateway-host` 替換為你的 Pi 使用者名稱與 hostname 或 IP 位址。

在你的電腦上，要求 Pi 印出新的 dashboard URL：

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

此指令會印出 `Dashboard URL:`。依據 `gateway.auth.token`
的設定方式，該 URL 可能是單純的 `http://127.0.0.1:18789/` 連結，或是
包含 `#token=...` 的連結。

在你電腦上的另一個終端機中，建立 SSH tunnel：

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

接著在本機瀏覽器中開啟印出的 Dashboard URL。

如果 UI 要求 shared-secret auth，請將設定的 token 或 password
貼到 Control UI settings 中。若使用 token auth，請使用 `gateway.auth.token`（或
`OPENCLAW_GATEWAY_TOKEN`）。

若需要永遠在線的遠端存取，請參閱 [Tailscale](/zh-TW/gateway/tailscale)。

---

## 效能最佳化

### 使用 USB SSD（大幅改善）

SD 卡速度慢且容易耗損。USB SSD 能大幅提升效能：

```bash
# Check if booting from USB
lsblk
```

設定方式請參閱 [Pi USB 開機指南](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)。

### 加快 CLI 啟動速度（module compile cache）

在較低功耗的 Pi 主機上，啟用 Node 的 module compile cache，讓重複執行 CLI 更快：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

備註：

- `NODE_COMPILE_CACHE` 會加快後續執行（`status`、`health`、`--help`）。
- `/var/tmp` 比 `/tmp` 更能在重新開機後保留。
- `OPENCLAW_NO_RESPAWN=1` 可避免 CLI 自我重新啟動造成額外啟動成本。
- 第一次執行會暖機快取；後續執行受益最大。

### systemd 啟動調校（選用）

如果這台 Pi 主要用來執行 OpenClaw，請加入 service drop-in，以減少重新啟動
抖動並保持啟動環境穩定：

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

然後套用：

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

若可行，請將 OpenClaw state/cache 放在 SSD backed storage 上，以避免 SD 卡
在 cold starts 時造成 random-I/O 瓶頸。

如果這是無頭 Pi，請啟用一次 lingering，讓使用者 service 在登出後仍可存活：

```bash
sudo loginctl enable-linger "$(whoami)"
```

`Restart=` 政策如何協助自動復原：
[systemd 可自動化 service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery)。

### 降低記憶體使用量

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### 監控資源

```bash
# Check memory
free -h

# Check CPU temperature
vcgencmd measure_temp

# Live monitoring
htop
```

---

## ARM 特定備註

### 二進位相容性

大多數 OpenClaw 功能可在 ARM64 上運作，但某些外部二進位檔可能需要 ARM builds：

| 工具               | ARM64 狀態 | 備註                                |
| ------------------ | ---------- | ----------------------------------- |
| Node.js            | ✅         | 運作良好                            |
| WhatsApp (Baileys) | ✅         | Pure JS，無問題                     |
| Telegram           | ✅         | Pure JS，無問題                     |
| gog (Gmail CLI)    | ⚠️         | 檢查是否有 ARM release              |
| Chromium (browser) | ✅         | `sudo apt install chromium-browser` |

如果某個 skill 失敗，請檢查其二進位檔是否有 ARM build。許多 Go/Rust 工具都有；有些沒有。

### 32-bit 與 64-bit

**一律使用 64-bit OS。** Node.js 與許多現代工具都需要它。使用以下指令檢查：

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## 建議模型設定

由於 Pi 只作為 Gateway（模型在雲端執行），請使用 API-based 模型：

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

**不要嘗試在 Pi 上執行本機 LLMs** — 即使是小型模型也太慢。讓 Claude/GPT 負責繁重工作。

---

## 開機自動啟動

初始設定會完成這項配置，但可以這樣驗證：

```bash
# Check service is enabled
systemctl --user is-enabled openclaw-gateway.service

# Enable if not
systemctl --user enable openclaw-gateway.service

# Start on boot
systemctl --user start openclaw-gateway.service
```

---

## 疑難排解

### 記憶體不足（OOM）

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### 效能緩慢

- 使用 USB SSD 取代 SD 卡
- 停用未使用的服務：`sudo systemctl disable cups bluetooth avahi-daemon`
- 檢查 CPU throttling：`vcgencmd get_throttled`（應回傳 `0x0`）

### 服務無法啟動

```bash
# Check logs
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
systemctl --user restart openclaw-gateway.service
```

### ARM 二進位檔問題

如果某個 skill 失敗並顯示 "exec format error"：

1. 檢查該二進位檔是否有 ARM64 build
2. 嘗試從原始碼建置
3. 或使用支援 ARM 的 Docker container

### WiFi 中斷

對於使用 WiFi 的無頭 Pi：

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## 成本比較

| 設定           | 一次性成本 | 月費      | 備註                      |
| -------------- | ---------- | --------- | ------------------------- |
| **Pi 4 (2GB)** | ~$45       | $0        | + 電力（約 ~$5/年）       |
| **Pi 4 (4GB)** | ~$55       | $0        | 建議                      |
| **Pi 5 (4GB)** | ~$60       | $0        | 最佳效能                  |
| **Pi 5 (8GB)** | ~$80       | $0        | 效能過剩但具未來擴充性    |
| DigitalOcean   | $0         | $6/mo     | $72/年                    |
| Hetzner        | $0         | €3.79/mo  | 約 ~$50/年                |

**損益平衡：** 與雲端 VPS 相比，Pi 約 6-12 個月即可回本。

---

## 相關

- [Linux 指南](/zh-TW/platforms/linux) — 一般 Linux 設定
- [DigitalOcean 指南](/zh-TW/install/digitalocean) — 雲端替代方案
- [Hetzner 指南](/zh-TW/install/hetzner) — Docker 設定
- [Tailscale](/zh-TW/gateway/tailscale) — 遠端存取
- [Node](/zh-TW/nodes) — 將你的筆電/手機與 Pi gateway 配對
