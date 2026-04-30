---
read_when:
    - 在 DigitalOcean 上設定 OpenClaw
    - 尋找適合 OpenClaw 的簡單付費 VPS
summary: 在 DigitalOcean Droplet 上託管 OpenClaw
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-30T03:13:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b3d06a38e257f4a8ab88d1f228c659a6cf1a276fe91c8ba7b89a0084658a314
    source_path: install/digitalocean.md
    workflow: 16
---

在 DigitalOcean Droplet 上執行持久運行的 OpenClaw Gateway。

## 先決條件

- DigitalOcean 帳戶（[註冊](https://cloud.digitalocean.com/registrations/new)）
- SSH 金鑰組（或願意使用密碼驗證）
- 約 20 分鐘

## 設定

<Steps>
  <Step title="建立 Droplet">
    <Warning>
    使用乾淨的基礎映像（Ubuntu 24.04 LTS）。除非你已檢閱第三方 Marketplace 一鍵式映像的啟動指令碼與防火牆預設值，否則請避免使用。
    </Warning>

    1. 登入 [DigitalOcean](https://cloud.digitalocean.com/)。
    2. 按一下 **Create > Droplets**。
    3. 選擇：
       - **區域：** 最接近你的區域
       - **映像：** Ubuntu 24.04 LTS
       - **大小：** Basic、Regular、1 vCPU / 1 GB RAM / 25 GB SSD
       - **驗證：** SSH 金鑰（建議）或密碼
    4. 按一下 **Create Droplet** 並記下 IP 位址。

  </Step>

  <Step title="連線並安裝">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="執行入門設定">
    ```bash
    openclaw onboard --install-daemon
    ```

    精靈會引導你完成模型驗證、通道設定、Gateway 權杖產生，以及 daemon 安裝（systemd）。

  </Step>

  <Step title="新增 swap（建議 1 GB Droplet 使用）">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="驗證 Gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="存取 Control UI">
    Gateway 預設會繫結到 loopback。選擇下列其中一個選項。

    **選項 A：SSH tunnel（最簡單）**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    然後開啟 `http://localhost:18789`。

    **選項 B：Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    然後從 tailnet 上的任何裝置開啟 `https://<magicdns>/`。

    **選項 C：Tailnet 繫結（不使用 Serve）**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    然後開啟 `http://<tailscale-ip>:18789`（需要權杖）。

  </Step>
</Steps>

## 疑難排解

**Gateway 無法啟動** -- 執行 `openclaw doctor --non-interactive`，並使用 `journalctl --user -u openclaw-gateway.service -n 50` 檢查記錄。

**連接埠已被使用** -- 執行 `lsof -i :18789` 找出程序，然後停止它。

**記憶體不足** -- 使用 `free -h` 驗證 swap 是否已啟用。如果仍然遇到 OOM，請使用 API 型模型（Claude、GPT）而不是本機模型，或升級到 2 GB Droplet。

## 後續步驟

- [通道](/zh-TW/channels) -- 連接 Telegram、WhatsApp、Discord 等
- [Gateway 設定](/zh-TW/gateway/configuration) -- 所有設定選項
- [更新](/zh-TW/install/updating) -- 讓 OpenClaw 保持最新狀態

## 相關

- [安裝概覽](/zh-TW/install)
- [Fly.io](/zh-TW/install/fly)
- [Hetzner](/zh-TW/install/hetzner)
- [VPS 託管](/zh-TW/vps)
