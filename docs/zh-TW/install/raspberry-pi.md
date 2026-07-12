---
read_when:
    - 在 Raspberry Pi 上設定 OpenClaw
    - 在 ARM 裝置上執行 OpenClaw
    - 打造低成本、全天候運作的個人 AI
summary: 在 Raspberry Pi 上託管 OpenClaw，實現全天候自助託管
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-11T21:28:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

在 Raspberry Pi 上執行持續運作、永遠在線的 OpenClaw 閘道。由於 Pi 僅作為閘道使用（模型透過 API 在雲端執行），即使是規格普通的 Pi 也能妥善處理工作負載——一般硬體成本為**一次性 $35–80**，無須支付月費。

## 硬體相容性

| Pi 型號     | RAM    | 可用性 | 備註                         |
| ----------- | ------ | ------ | ---------------------------- |
| Pi 5        | 4/8 GB | 最佳   | 速度最快，建議使用。         |
| Pi 4        | 4 GB   | 良好   | 適合大多數使用者的理想選擇。 |
| Pi 4        | 2 GB   | 尚可   | 請新增交換空間。             |
| Pi 4        | 1 GB   | 吃緊   | 搭配交換空間與最小化設定仍可使用。 |
| Pi 3B+      | 1 GB   | 緩慢   | 可以運作，但反應較慢。       |
| Pi Zero 2 W | 512 MB | 不可   | 不建議使用。                 |

**最低需求：** 1 GB RAM、1 核心、500 MB 可用磁碟空間、64 位元作業系統。
**建議規格：** 2 GB 以上 RAM、16 GB 以上 SD 卡（或 USB SSD）、乙太網路。

## 事前準備

- 配備 2 GB 以上 RAM 的 Raspberry Pi 4 或 5（建議 4 GB）
- MicroSD 卡（16 GB 以上）或 USB SSD（效能較佳）
- 官方 Pi 電源供應器
- 網路連線（乙太網路或 WiFi）
- 64 位元 Raspberry Pi OS（必要——請勿使用 32 位元版本）
- 約 30 分鐘

## 設定

<Steps>
  <Step title="燒錄作業系統">
    使用 **Raspberry Pi OS Lite（64 位元）**——無頭伺服器不需要桌面環境。

    1. 下載 [Raspberry Pi Imager](https://www.raspberrypi.com/software/)。
    2. 選擇作業系統：**Raspberry Pi OS Lite (64-bit)**。
    3. 在設定對話方塊中預先設定：
       - Hostname: `gateway-host`
       - Enable SSH
       - Set username and password
       - Configure WiFi（若不使用乙太網路）
    4. 將映像檔燒錄至 SD 卡或 USB 磁碟機，插入裝置並啟動 Pi。

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

    # 設定時區（對排程和提醒很重要）
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

  <Step title="新增交換空間（對 2 GB 以下裝置很重要）">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # 降低低 RAM 裝置的交換傾向
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="安裝 OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="執行初始設定">
    ```bash
    openclaw onboard --install-daemon
    ```

    依照精靈指示操作。對無頭裝置而言，建議使用 API 金鑰而非 OAuth。Telegram 是最容易開始使用的頻道。

  </Step>

  <Step title="驗證">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="存取控制介面">
    在電腦上從 Pi 取得儀表板網址：

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    接著在另一個終端機中建立 SSH 通道：

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    在本機瀏覽器中開啟輸出的網址。如需持續開啟的遠端存取，請參閱 [Tailscale 整合](/zh-TW/gateway/tailscale)。

  </Step>
</Steps>

## 效能提示

**使用 USB SSD**——SD 卡速度較慢且容易耗損。USB SSD 能大幅提升效能並承受更多次寫入；若作業系統仍保留在 SD 卡上，請將其用於 `OPENCLAW_STATE_DIR`。請參閱 [Pi USB 開機指南](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)。

**啟用模組編譯快取**——可加快低效能 Pi 主機上重複執行命令列介面的速度。`OPENCLAW_NO_RESPAWN=1` 會讓例行的閘道重新啟動在同一處理程序內完成，避免額外的處理程序交接，並簡化小型主機上的 PID 追蹤：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

請使用 `/var/tmp`，不要使用 `/tmp`——某些發行版會在開機時清除 `/tmp`，導致已預熱的快取遭到移除。

**降低記憶體用量**——對無頭設定，可釋放 GPU 記憶體並停用未使用的服務：

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**用於穩定重新啟動的 systemd 覆寫設定**——如果這台 Pi 主要用於執行 OpenClaw，請新增服務覆寫設定：

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

接著執行 `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`。在無頭 Pi 上，還需啟用一次使用者延續功能，讓使用者服務在登出後仍持續運作：`sudo loginctl enable-linger "$(whoami)"`。

## 建議的模型設定

由於 Pi 僅執行閘道，請使用雲端託管的 API 模型——不要在 Pi 上執行本機大型語言模型，即使是小型模型也慢得難以實用：

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

## ARM 二進位檔注意事項

大多數 OpenClaw 功能無須修改即可在 ARM64 上運作（Node.js、Telegram、WhatsApp/Baileys、Chromium）。偶爾缺少 ARM 建置版本的二進位檔，通常是由 Skills 提供的選用 Go/Rust 命令列介面工具。請先使用 `uname -m` 驗證架構（應顯示 `aarch64`），若缺少二進位檔，請先在其發行頁面確認是否有 `linux-arm64`／`aarch64` 成品，再考慮改為從原始碼建置。

## 持久性與備份

OpenClaw 狀態儲存在：

- `~/.openclaw/`——`openclaw.json`、各代理程式的 `auth-profiles.json`、頻道／提供者狀態與工作階段。
- `~/.openclaw/workspace/`——代理程式工作區（SOUL.md、記憶、產出檔案）。

這些資料會在重新啟動後保留，而使用 SSD 取代 SD 卡可提升效能並延長使用壽命。可使用以下命令建立可攜式快照：

```bash
openclaw backup create
```

## 疑難排解

**記憶體不足**——使用 `free -h` 確認交換空間已啟用。停用未使用的服務（`sudo systemctl disable cups bluetooth avahi-daemon`）。僅使用以 API 為基礎的模型。

**效能緩慢**——請使用 USB SSD 取代 SD 卡。使用 `vcgencmd get_throttled` 檢查 CPU 是否降頻（應回傳 `0x0`）。

**服務無法啟動**——使用 `journalctl --user -u openclaw-gateway.service --no-pager -n 100` 檢查日誌，並執行 `openclaw doctor --non-interactive`。如果這是無頭 Pi，也請確認已啟用使用者延續功能：`sudo loginctl enable-linger "$(whoami)"`。

**ARM 二進位檔問題**——如果某項 Skill 因「exec format error」而失敗，請檢查該二進位檔是否有 ARM64 建置版本。使用 `uname -m` 驗證架構（應顯示 `aarch64`）。

**WiFi 連線中斷**——停用 WiFi 電源管理：`sudo iwconfig wlan0 power off`。

## 後續步驟

- [頻道](/zh-TW/channels)——連接 Telegram、WhatsApp、Discord 等服務
- [閘道設定](/zh-TW/gateway/configuration)——所有設定選項
- [更新](/zh-TW/install/updating)——讓 OpenClaw 保持最新版本

## 相關內容

- [安裝概覽](/zh-TW/install)
- [Linux 伺服器](/zh-TW/vps)
- [平台](/zh-TW/platforms)
