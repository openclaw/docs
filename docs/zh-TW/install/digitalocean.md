---
read_when:
    - 在 DigitalOcean 上設定 OpenClaw
    - 尋找適合 OpenClaw 的簡易付費 VPS
summary: 在 DigitalOcean Droplet 上託管 OpenClaw
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-06T02:50:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa09915d845c9ede27db794cac464490ba038e8e5e0a2ef0f5bfc62ef7e59ff
    source_path: install/digitalocean.md
    workflow: 16
---

在 DigitalOcean Droplet 上執行持久性的 OpenClaw Gateway（1 GB Basic 方案約 $6/月）。

DigitalOcean 是最簡單的付費 VPS 路徑。如果你偏好更便宜或免費的選項：

- [Hetzner](/zh-TW/install/hetzner) — €3.79/月，每美元可取得更多核心/RAM。
- [Oracle Cloud](/zh-TW/install/oracle) — 永久免費 ARM（最高 4 OCPU、24 GB RAM），但註冊可能不太穩定，且僅支援 ARM。

## 先決條件

- DigitalOcean 帳號（[註冊](https://cloud.digitalocean.com/registrations/new)）
- SSH 金鑰組（或願意使用密碼驗證）
- 約 20 分鐘

## 設定

<Steps>
  <Step title="建立 Droplet">
    <Warning>
    使用乾淨的基礎映像檔（Ubuntu 24.04 LTS）。除非你已檢閱其啟動指令碼與防火牆預設值，否則請避免使用第三方 Marketplace 一鍵映像檔。
    </Warning>

    1. 登入 [DigitalOcean](https://cloud.digitalocean.com/)。
    2. 按一下 **Create > Droplets**。
    3. 選擇：
       - **區域：** 離你最近的位置
       - **映像檔：** Ubuntu 24.04 LTS
       - **大小：** Basic、Regular、1 vCPU / 1 GB RAM / 25 GB SSD
       - **驗證：** SSH 金鑰（建議）或密碼
    4. 按一下 **Create Droplet**，並記下 IP 位址。

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

    精靈會引導你完成模型驗證、通道設定、Gateway token 產生，以及 daemon 安裝（systemd）。

  </Step>

  <Step title="新增 swap（建議用於 1 GB Droplet）">
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

  <Step title="存取控制介面">
    Gateway 預設會綁定到 loopback。請選擇下列其中一個選項。

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

    然後從你 tailnet 上的任何裝置開啟 `https://<magicdns>/`。

    Tailscale Serve 會透過 tailnet 身分標頭驗證控制介面與 WebSocket 流量，這假設 Gateway 主機本身是受信任的。無論如何，HTTP API 端點都會遵循 Gateway 的一般驗證模式（token/密碼）。若要透過 Serve 要求明確的共享密鑰憑證，請設定 `gateway.auth.allowTailscale: false`，並使用 `gateway.auth.mode: "token"` 或 `"password"`。

    **選項 C：Tailnet bind（不使用 Serve）**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    然後開啟 `http://<tailscale-ip>:18789`（需要 token）。

  </Step>
</Steps>

## 持久性與備份

OpenClaw 狀態位於：

- `~/.openclaw/` — `openclaw.json`、每個 agent 的 `auth-profiles.json`、通道/provider 狀態，以及工作階段資料。
- `~/.openclaw/workspace/` — agent 工作區（SOUL.md、記憶體、成品）。

這些會在 Droplet 重新開機後保留。若要建立可攜式快照：

```bash
openclaw backup create
```

DigitalOcean 快照會備份整個 Droplet；`openclaw backup create` 則可跨主機攜帶。

## 1 GB RAM 提示

$6 的 Droplet 只有 1 GB RAM。若要保持順暢：

- 確認上方的 swap 步驟已寫入 `/etc/fstab`，讓它能在重新開機後保留。
- 偏好使用以 API 為基礎的模型（Claude、GPT），而非本機模型 — 本機 LLM 推論無法容納在 1 GB 中。
- 如果大型提示導致 OOM，請將 `agents.defaults.model.primary` 設定為較小的模型。
- 使用 `free -h` 和 `htop` 監控。

## 疑難排解

**Gateway 無法啟動** -- 執行 `openclaw doctor --non-interactive`，並使用 `journalctl --user -u openclaw-gateway.service -n 50` 檢查日誌。

**連接埠已被使用** -- 執行 `lsof -i :18789` 找出程序，然後停止它。

**記憶體不足** -- 使用 `free -h` 確認 swap 已啟用。如果仍然遇到 OOM，請使用以 API 為基礎的模型（Claude、GPT），而非本機模型，或升級到 2 GB Droplet。

## 後續步驟

- [通道](/zh-TW/channels) -- 連接 Telegram、WhatsApp、Discord 等
- [Gateway 設定](/zh-TW/gateway/configuration) -- 所有設定選項
- [更新](/zh-TW/install/updating) -- 讓 OpenClaw 保持最新

## 相關內容

- [安裝概覽](/zh-TW/install)
- [Fly.io](/zh-TW/install/fly)
- [Hetzner](/zh-TW/install/hetzner)
- [VPS 託管](/zh-TW/vps)
