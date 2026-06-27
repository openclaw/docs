---
read_when:
    - 在 Raspberry Pi 上設定 OpenClaw
    - 在 ARM 裝置上執行 OpenClaw
    - 打造低成本、永遠在線的個人 AI
summary: 在 Raspberry Pi 上託管 OpenClaw，以實現全天候自託管
title: Raspberry Pi
x-i18n:
    generated_at: "2026-06-27T19:28:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9cd90b4cc70c8fe7eab2a0abadc0e2969c7dc1c09657a0819bc004280ec32ba3
    source_path: install/raspberry-pi.md
    workflow: 16
---

在 Raspberry Pi 上執行持久、常駐的 OpenClaw 閘道。由於 Pi 只是閘道（模型透過 API 在雲端執行），即使是規格普通的 Pi 也能很好地處理工作負載，典型硬體成本為**一次性 35–80 美元**，沒有月費。

## 硬體相容性

| Pi 型號     | RAM    | 可用嗎？ | 備註                                   |
| ----------- | ------ | -------- | -------------------------------------- |
| Pi 5        | 4/8 GB | 最佳     | 速度最快，建議使用。                   |
| Pi 4        | 4 GB   | 良好     | 適合大多數使用者的理想選擇。           |
| Pi 4        | 2 GB   | 可以     | 加入 swap。                            |
| Pi 4        | 1 GB   | 吃緊     | 搭配 swap 和最小設定可行。             |
| Pi 3B+      | 1 GB   | 緩慢     | 可用但反應遲緩。                       |
| Pi Zero 2 W | 512 MB | 不可     | 不建議使用。                           |

**最低需求：** 1 GB RAM、1 核心、500 MB 可用磁碟空間、64 位元作業系統。
**建議配置：** 2 GB+ RAM、16 GB+ SD 卡（或 USB SSD）、乙太網路。

## 先決條件

- 配備 2 GB+ RAM 的 Raspberry Pi 4 或 5（建議 4 GB）
- MicroSD 卡（16 GB+）或 USB SSD（效能較佳）
- 官方 Pi 電源供應器
- 網路連線（乙太網路或 WiFi）
- 64 位元 Raspberry Pi OS（必要，請勿使用 32 位元）
- 約 30 分鐘

## 設定

<Steps>
  <Step title="Flash the OS">
    使用 **Raspberry Pi OS Lite (64-bit)**，無頭伺服器不需要桌面環境。

    1. 下載 [Raspberry Pi Imager](https://www.raspberrypi.com/software/)。
    2. 選擇作業系統：**Raspberry Pi OS Lite (64-bit)**。
    3. 在設定對話框中預先設定：
       - 主機名稱：`gateway-host`
       - 啟用 SSH
       - 設定使用者名稱和密碼
       - 設定 WiFi（如果不使用乙太網路）
    4. 寫入到 SD 卡或 USB 磁碟，插入後啟動 Pi。

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

    依照精靈操作。對於無頭裝置，建議使用 API 金鑰而非 OAuth。Telegram 是最容易開始使用的頻道。

  </Step>

  <Step title="Verify">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    在你的電腦上，從 Pi 取得儀表板 URL：

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    接著在另一個終端機中建立 SSH 通道：

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    在本機瀏覽器中開啟列印出的 URL。如需常駐遠端存取，請參閱 [Tailscale 整合](/zh-TW/gateway/tailscale)。

  </Step>
</Steps>

## 效能提示

**使用 USB SSD** -- SD 卡速度慢且容易耗損。USB SSD 能大幅改善效能。請參閱 [Pi USB 開機指南](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)。

**啟用模組編譯快取** -- 加速低功耗 Pi 主機上的重複命令列介面呼叫：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`OPENCLAW_NO_RESPAWN=1` 會讓例行閘道重新啟動保留在同一程序內，避免額外的程序交接，並讓小型主機上的 PID 追蹤保持簡單。

**降低記憶體用量** -- 對於無頭設定，釋放 GPU 記憶體並停用未使用的服務：

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**用於穩定重新啟動的 systemd drop-in** -- 如果這台 Pi 主要用於執行 OpenClaw，請加入服務 drop-in：

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

然後執行 `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`。在無頭 Pi 上，也要啟用一次 lingering，讓使用者服務在登出後仍能存活：`sudo loginctl enable-linger "$(whoami)"`。

## 建議的模型設定

由於 Pi 只執行閘道，請使用雲端託管的 API 模型：

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

不要在 Pi 上執行本機 LLM，即使小型模型也慢到不實用。讓 Claude 或 GPT 處理模型工作。

## ARM 二進位檔注意事項

大多數 OpenClaw 功能可在 ARM64 上無需變更地運作（Node.js、Telegram、WhatsApp/Baileys、Chromium）。偶爾缺少 ARM 建置的二進位檔，通常是 Skills 隨附的選用 Go/Rust 命令列介面工具。在退回從原始碼建置之前，請確認缺少的二進位檔發布頁面是否提供 `linux-arm64` / `aarch64` artifacts。

## 持久性與備份

OpenClaw 狀態位於：

- `~/.openclaw/` — `openclaw.json`、每個 agent 的 `auth-profiles.json`、頻道/供應商狀態、工作階段。
- `~/.openclaw/workspace/` — agent 工作區（SOUL.md、記憶、artifacts）。

這些會在重新啟動後保留。使用以下命令建立可攜式快照：

```bash
openclaw backup create
```

如果將這些保存在 SSD 上，效能和壽命都會比 SD 卡更好。

## 疑難排解

**記憶體不足** -- 使用 `free -h` 確認 swap 已啟用。停用未使用的服務（`sudo systemctl disable cups bluetooth avahi-daemon`）。僅使用 API 型模型。

**效能緩慢** -- 使用 USB SSD 取代 SD 卡。使用 `vcgencmd get_throttled` 檢查 CPU 是否降頻（應回傳 `0x0`）。

**服務無法啟動** -- 使用 `journalctl --user -u openclaw-gateway.service --no-pager -n 100` 檢查日誌，並執行 `openclaw doctor --non-interactive`。如果這是無頭 Pi，也請確認已啟用 lingering：`sudo loginctl enable-linger "$(whoami)"`。

**ARM 二進位檔問題** -- 如果某個 skill 因 "exec format error" 失敗，請檢查該二進位檔是否有 ARM64 建置。使用 `uname -m` 確認架構（應顯示 `aarch64`）。

**WiFi 中斷** -- 停用 WiFi 電源管理：`sudo iwconfig wlan0 power off`。

## 後續步驟

- [頻道](/zh-TW/channels) -- 連接 Telegram、WhatsApp、Discord 等
- [閘道設定](/zh-TW/gateway/configuration) -- 所有設定選項
- [更新](/zh-TW/install/updating) -- 讓 OpenClaw 保持最新

## 相關

- [安裝概覽](/zh-TW/install)
- [Linux 伺服器](/zh-TW/vps)
- [平台](/zh-TW/platforms)
