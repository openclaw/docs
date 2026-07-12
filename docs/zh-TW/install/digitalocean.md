---
read_when:
    - 在 DigitalOcean 上設定 OpenClaw
    - 正在尋找適合 OpenClaw 的簡易付費 VPS
summary: 在 DigitalOcean Droplet 上託管 OpenClaw
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-11T21:27:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

在 DigitalOcean Droplet 上執行持續運作的 OpenClaw 閘道（1 GB Basic 方案約每月 6 美元）。

DigitalOcean 是簡單直接的付費 VPS 選擇。若要使用更便宜或免費的選項：

- [Hetzner](/zh-TW/install/hetzner) -- 每一美元可獲得更多 CPU 核心與 RAM。
- [Oracle Cloud](/zh-TW/install/oracle) -- Always Free ARM 方案（最高 4 OCPU、24 GB RAM），但註冊流程可能不太順利，而且僅支援 ARM。

## 先決條件

- DigitalOcean 帳號（[註冊](https://cloud.digitalocean.com/registrations/new)）
- SSH 金鑰對（或願意使用密碼驗證）
- 約 20 分鐘

## 設定

<Steps>
  <Step title="建立 Droplet">
    <Warning>
    使用乾淨的基礎映像檔（Ubuntu 24.04 LTS）。除非你已檢查第三方 Marketplace 一鍵映像檔的啟動指令碼和防火牆預設值，否則請避免使用。
    </Warning>

    1. 登入 [DigitalOcean](https://cloud.digitalocean.com/)。
    2. 按一下 **Create > Droplets**。
    3. 選擇：
       - **Region:** 離你最近的位置
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic、Regular、1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** SSH 金鑰（建議）或密碼
    4. 按一下 **Create Droplet**，並記下 IP 位址。

  </Step>

  <Step title="連線並安裝">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # 安裝 Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # 安裝 OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # 建立擁有 OpenClaw 狀態與服務的非 root 使用者。
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    僅使用 root shell 進行系統初始設定。請以非 root 的 `openclaw` 使用者執行 OpenClaw 命令，使狀態儲存在 `/home/openclaw/.openclaw/` 下，並將閘道安裝為該使用者的 systemd `--user` 服務。

  </Step>

  <Step title="執行初始設定">
    ```bash
    openclaw onboard --install-daemon
    ```

    精靈會引導你完成模型驗證、頻道設定、閘道權杖產生，以及常駐程式安裝（systemd 使用者服務）。

  </Step>

  <Step title="新增交換空間（建議用於 1 GB Droplet）">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="驗證閘道">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="存取控制介面">
    閘道預設繫結至 local loopback。請選擇下列其中一個選項。

    **選項 A：SSH 通道（最簡單）**

    ```bash
    # 從你的本機電腦執行
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    接著開啟 `http://localhost:18789`。

    **選項 B：Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    接著從 tailnet 上的任何裝置開啟 `https://<magicdns>/`。

    Tailscale Serve 會透過 tailnet 身分標頭驗證控制介面和 WebSocket 流量，這是假設閘道主機本身可信任。無論如何，HTTP API 端點仍會遵循閘道的一般驗證模式（權杖／密碼）。若要透過 Serve 明確要求共用密鑰憑證，請設定 `gateway.auth.allowTailscale: false`，並使用 `gateway.auth.mode: "token"` 或 `"password"`。

    **選項 C：繫結至 Tailnet（不使用 Serve）**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    接著開啟 `http://<tailscale-ip>:18789`（需要權杖）。

  </Step>
</Steps>

## 持久化與備份

OpenClaw 狀態儲存在：

- `~/.openclaw/` -- `openclaw.json`、頻道／供應商憑證、各代理程式的 `auth-profiles.json`，以及工作階段資料。
- `~/.openclaw/workspace/` -- 代理程式工作區（SOUL.md、記憶、成品）。

這些資料會在 Droplet 重新啟動後保留。若要建立可攜式快照：

```bash
openclaw backup create
```

DigitalOcean 快照會備份整個 Droplet；`openclaw backup create` 則可跨主機移轉。

## 1 GB RAM 使用提示

每月 6 美元的 Droplet 只有 1 GB RAM。為了保持順暢運作：

- 確認上述交換空間步驟已寫入 `/etc/fstab`，使其在重新啟動後仍可使用。
- 優先使用以 API 為基礎的模型（Claude、GPT），而非本機模型 -- 1 GB 無法容納本機 LLM 推論。
- 如果大型提示詞導致記憶體不足，請將 `agents.defaults.model.primary` 設為較小的模型。
- 使用 `free -h` 和 `htop` 進行監控。

## 疑難排解

**閘道無法啟動** -- 執行 `openclaw doctor --non-interactive`，並使用 `journalctl --user -u openclaw-gateway.service -n 50` 檢查日誌。

**連接埠已被使用** -- 執行 `lsof -i :18789` 找出該程序，然後將其停止。

**記憶體不足** -- 使用 `free -h` 確認交換空間已啟用。如果仍發生記憶體不足，請改用以 API 為基礎的模型（Claude、GPT），而非本機模型，或升級至 2 GB Droplet。

## 後續步驟

- [頻道](/zh-TW/channels) -- 連接 Telegram、WhatsApp、Discord 等服務
- [閘道設定](/zh-TW/gateway/configuration) -- 所有設定選項
- [更新](/zh-TW/install/updating) -- 讓 OpenClaw 保持最新版本

## 相關內容

- [安裝概覽](/zh-TW/install)
- [Fly.io](/zh-TW/install/fly)
- [Hetzner](/zh-TW/install/hetzner)
- [VPS 託管](/zh-TW/vps)
