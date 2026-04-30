---
read_when:
    - 在 Raspberry Pi 上設定 OpenClaw
    - 在 ARM 裝置上執行 OpenClaw
    - 打造低成本、常時運作的個人 AI
summary: 在 Raspberry Pi 上託管 OpenClaw，實現全天候自託管
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-30T03:17:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5fa11bf65f6db50b0864dabcf417f08c06e82a5ce067304f1cbfc189a4991a40
    source_path: install/raspberry-pi.md
    workflow: 16
---

在 Raspberry Pi 上執行持久、永遠在線的 OpenClaw Gateway。由於 Pi 只作為 Gateway（模型透過 API 在雲端執行），即使規格普通的 Pi 也能很好地處理工作負載。

## 先決條件

- Raspberry Pi 4 或 5，配備 2 GB 以上 RAM（建議 4 GB）
- MicroSD 卡（16 GB 以上）或 USB SSD（效能較佳）
- 官方 Pi 電源供應器
- 網路連線（Ethernet 或 WiFi）
- 64-bit Raspberry Pi OS（必要，請勿使用 32-bit）
- 約 30 分鐘

## 設定

<Steps>
  <Step title="燒錄作業系統">
    使用 **Raspberry Pi OS Lite (64-bit)** -- 無頭伺服器不需要桌面環境。

    1. 下載 [Raspberry Pi Imager](https://www.raspberrypi.com/software/)。
    2. 選擇 OS：**Raspberry Pi OS Lite (64-bit)**。
    3. 在設定對話框中預先設定：
       - 主機名稱：`gateway-host`
       - 啟用 SSH
       - 設定使用者名稱和密碼
       - 設定 WiFi（如果不使用 Ethernet）
    4. 燒錄到你的 SD 卡或 USB 磁碟，插入後啟動 Pi。

  </Step>

  <Step title="透過 SSH 連線">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="更新系統">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="安裝 Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="新增 swap（對 2 GB 或更低容量很重要）">
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

  <Step title="安裝 OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="執行入門設定">
    ```bash
    openclaw onboard --install-daemon
    ```

    依照精靈操作。對無頭裝置而言，建議使用 API 金鑰而非 OAuth。Telegram 是最容易開始使用的頻道。

  </Step>

  <Step title="驗證">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="存取 Control UI">
    在你的電腦上，從 Pi 取得儀表板 URL：

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    然後在另一個終端機建立 SSH 通道：

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    在本機瀏覽器開啟列印出的 URL。若要永遠在線的遠端存取，請參閱 [Tailscale 整合](/zh-TW/gateway/tailscale)。

  </Step>
</Steps>

## 效能提示

**使用 USB SSD** -- SD 卡速度慢且容易耗損。USB SSD 可大幅改善效能。請參閱 [Pi USB 開機指南](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)。

**啟用模組編譯快取** -- 可加速低功耗 Pi 主機上重複執行 CLI 的速度：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**降低記憶體使用量** -- 對於無頭設定，釋放 GPU 記憶體並停用未使用的服務：

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## 疑難排解

**記憶體不足** -- 使用 `free -h` 驗證 swap 是否啟用。停用未使用的服務（`sudo systemctl disable cups bluetooth avahi-daemon`）。只使用以 API 為基礎的模型。

**效能緩慢** -- 使用 USB SSD 取代 SD 卡。使用 `vcgencmd get_throttled` 檢查 CPU 是否降頻（應回傳 `0x0`）。

**服務無法啟動** -- 使用 `journalctl --user -u openclaw-gateway.service --no-pager -n 100` 檢查記錄，並執行 `openclaw doctor --non-interactive`。如果這是無頭 Pi，也請驗證是否已啟用 lingering：`sudo loginctl enable-linger "$(whoami)"`。

**ARM 二進位檔問題** -- 如果某個 skill 因「exec format error」而失敗，請檢查該二進位檔是否有 ARM64 建置。使用 `uname -m` 驗證架構（應顯示 `aarch64`）。

**WiFi 斷線** -- 停用 WiFi 電源管理：`sudo iwconfig wlan0 power off`。

## 後續步驟

- [頻道](/zh-TW/channels) -- 連接 Telegram、WhatsApp、Discord 等更多服務
- [Gateway 設定](/zh-TW/gateway/configuration) -- 所有設定選項
- [更新](/zh-TW/install/updating) -- 讓 OpenClaw 保持最新

## 相關

- [安裝概觀](/zh-TW/install)
- [Linux 伺服器](/zh-TW/vps)
- [平台](/zh-TW/platforms)
