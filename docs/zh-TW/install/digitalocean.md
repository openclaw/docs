---
read_when:
    - 在 DigitalOcean 上設定 OpenClaw
    - 尋找適合 OpenClaw 的簡單付費 VPS
summary: 在 DigitalOcean Droplet 上託管 OpenClaw
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-05T11:26:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

執行持續運作的 OpenClaw 閘道，部署在 DigitalOcean Droplet 上（1 GB Basic 方案約 $6/月）。

DigitalOcean 是直覺的付費 VPS 路徑。若要更便宜或免費的選項：

- [Hetzner](/zh-TW/install/hetzner) -- 每美元可取得更多核心/RAM。
- [Oracle Cloud](/zh-TW/install/oracle) -- Always Free ARM 層級（最多 4 OCPU、24 GB RAM），但註冊可能不太穩定，而且僅限 ARM。

## 先決條件

- DigitalOcean 帳戶（[註冊](https://cloud.digitalocean.com/registrations/new)）
- SSH 金鑰組（或願意使用密碼驗證）
- 約 20 分鐘

## 設定

<Steps>
  <Step title="建立 Droplet">
    <Warning>
    使用乾淨的基礎映像檔（Ubuntu 24.04 LTS）。除非你已檢視其啟動指令碼與防火牆預設值，否則請避免使用第三方 Marketplace 一鍵式映像檔。
    </Warning>

    1. 登入 [DigitalOcean](https://cloud.digitalocean.com/)。
    2. 點擊 **Create > Droplets**。
    3. 選擇：
       - **區域：** 離你最近的位置
       - **映像檔：** Ubuntu 24.04 LTS
       - **大小：** Basic、Regular、1 vCPU / 1 GB RAM / 25 GB SSD
       - **驗證：** SSH 金鑰（建議）或密碼
    4. 點擊 **Create Droplet**，並記下 IP 位址。

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

    # Create the non-root user that will own OpenClaw state and services.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    只將 root shell 用於系統啟動安裝。以非 root 的 `openclaw` 使用者執行 OpenClaw 命令，讓狀態位於 `/home/openclaw/.openclaw/` 下，且閘道會安裝為該使用者的 systemd `--user` 服務。

  </Step>

  <Step title="執行入門設定">
    ```bash
    openclaw onboard --install-daemon
    ```

    精靈會引導你完成模型驗證、頻道設定、閘道權杖產生，以及常駐程式安裝（systemd 使用者服務）。

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

  <Step title="驗證閘道">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="存取控制介面">
    閘道預設會繫結到回環介面。請選擇下列其中一個選項。

    **選項 A：SSH 通道（最簡單）**

    ```bash
    # From your local machine
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

    Tailscale Serve 會透過 tailnet 身分標頭驗證控制介面與 WebSocket 流量，這假設閘道主機本身可信任。無論如何，HTTP API 端點仍會遵循閘道的一般驗證模式（權杖/密碼）。若要在 Serve 上要求明確的共享祕密憑證，請設定 `gateway.auth.allowTailscale: false`，並使用 `gateway.auth.mode: "token"` 或 `"password"`。

    **選項 C：Tailnet 繫結（不使用 Serve）**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    接著開啟 `http://<tailscale-ip>:18789`（需要權杖）。

  </Step>
</Steps>

## 持久性與備份

OpenClaw 狀態位於：

- `~/.openclaw/` -- `openclaw.json`、頻道/提供者憑證、每個代理的 `auth-profiles.json`，以及工作階段資料。
- `~/.openclaw/workspace/` -- 代理工作區（SOUL.md、記憶、成品）。

這些會在 Droplet 重新開機後保留。若要建立可攜式快照：

```bash
openclaw backup create
```

DigitalOcean 快照會備份整個 Droplet；`openclaw backup create` 可跨主機攜帶使用。

## 1 GB RAM 提示

$6 Droplet 只有 1 GB RAM。若要維持順暢：

- 確認上方的 swap 步驟已寫入 `/etc/fstab`，讓它在重新開機後仍會保留。
- 優先使用 API 型模型（Claude、GPT），而非本機模型 -- 本機 LLM 推論無法塞進 1 GB。
- 如果大型提示導致 OOM，請將 `agents.defaults.model.primary` 設為較小的模型。
- 使用 `free -h` 和 `htop` 監控。

## 疑難排解

**閘道無法啟動** -- 執行 `openclaw doctor --non-interactive`，並用 `journalctl --user -u openclaw-gateway.service -n 50` 檢查日誌。

**連接埠已被使用** -- 執行 `lsof -i :18789` 找出程序，然後停止它。

**記憶體不足** -- 使用 `free -h` 確認 swap 已啟用。如果仍然遇到 OOM，請改用 API 型模型（Claude、GPT）而非本機模型，或升級到 2 GB Droplet。

## 下一步

- [頻道](/zh-TW/channels) -- 連接 Telegram、WhatsApp、Discord 等更多頻道
- [閘道設定](/zh-TW/gateway/configuration) -- 所有設定選項
- [更新](/zh-TW/install/updating) -- 讓 OpenClaw 保持最新

## 相關

- [安裝總覽](/zh-TW/install)
- [Fly.io](/zh-TW/install/fly)
- [Hetzner](/zh-TW/install/hetzner)
- [VPS 託管](/zh-TW/vps)
