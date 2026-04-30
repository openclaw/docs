---
read_when:
    - 在 DigitalOcean 上設定 OpenClaw
    - 尋找適合 OpenClaw 的平價 VPS 託管服务
summary: 在 DigitalOcean 上使用 OpenClaw（簡單的付費 VPS 選項）
title: DigitalOcean（平台）
x-i18n:
    generated_at: "2026-04-30T03:19:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13df486b81590d6350f4b33f5460069fee21881631970d5f4ae34f6ce956407e
    source_path: platforms/digitalocean.md
    workflow: 16
---

# DigitalOcean 上的 OpenClaw

## 目標

在 DigitalOcean 上執行持久化的 OpenClaw Gateway，每月 **$6**（或使用預留價格每月 $4）。

如果你想要每月 $0 的選項，且不介意 ARM + 供應商專屬設定，請參閱 [Oracle Cloud 指南](/zh-TW/install/oracle)。

## 成本比較（2026）

| 供應商       | 方案            | 規格                   | 每月價格    | 備註                         |
| ------------ | --------------- | ---------------------- | ----------- | ---------------------------- |
| Oracle Cloud | Always Free ARM | 最高 4 OCPU，24GB RAM  | $0          | ARM，容量有限 / 註冊較麻煩  |
| Hetzner      | CX22            | 2 vCPU，4GB RAM        | €3.79 (~$4) | 最便宜的付費選項             |
| DigitalOcean | Basic           | 1 vCPU，1GB RAM        | $6          | UI 簡單，文件完善            |
| Vultr        | Cloud Compute   | 1 vCPU，1GB RAM        | $6          | 地點選擇多                   |
| Linode       | Nanode          | 1 vCPU，1GB RAM        | $5          | 現為 Akamai 的一部分         |

**選擇供應商：**

- DigitalOcean：最簡單的 UX + 可預期的設定（本指南）
- Hetzner：價格/效能良好（請參閱 [Hetzner 指南](/zh-TW/install/hetzner)）
- Oracle Cloud：可以每月 $0，但較為挑剔且僅支援 ARM（請參閱 [Oracle 指南](/zh-TW/install/oracle)）

---

## 先決條件

- DigitalOcean 帳號（[註冊可獲得 $200 免費額度](https://m.do.co/c/signup)）
- SSH 金鑰組（或願意使用密碼驗證）
- 約 20 分鐘

## 1) 建立 Droplet

<Warning>
使用乾淨的基礎映像（Ubuntu 24.04 LTS）。避免使用第三方 Marketplace 一鍵映像，除非你已檢視其啟動腳本和防火牆預設值。
</Warning>

1. 登入 [DigitalOcean](https://cloud.digitalocean.com/)
2. 按一下 **Create → Droplets**
3. 選擇：
   - **區域：** 最接近你（或你的使用者）的位置
   - **映像：** Ubuntu 24.04 LTS
   - **大小：** Basic → Regular → **$6/mo**（1 vCPU，1GB RAM，25GB SSD）
   - **驗證：** SSH 金鑰（建議）或密碼
4. 按一下 **Create Droplet**
5. 記下 IP 位址

## 2) 透過 SSH 連線

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) 安裝 OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) 執行 Onboarding

```bash
openclaw onboard --install-daemon
```

精靈會引導你完成：

- 模型驗證（API 金鑰或 OAuth）
- 頻道設定（Telegram、WhatsApp、Discord 等）
- Gateway 權杖（自動產生）
- Daemon 安裝（systemd）

## 5) 驗證 Gateway

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) 存取 Dashboard

Gateway 預設繫結到 loopback。若要存取 Control UI：

**選項 A：SSH Tunnel（建議）**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**選項 B：Tailscale Serve（HTTPS，僅限 loopback）**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

開啟：`https://<magicdns>/`

備註：

- Serve 會讓 Gateway 維持僅限 loopback，並透過 Tailscale 身分標頭驗證 Control UI/WebSocket 流量（無權杖驗證假設受信任的 Gateway 主機；HTTP API 不使用這些 Tailscale 標頭，而是遵循 Gateway 一般的 HTTP 驗證模式）。
- 若要改為要求明確的共享密鑰憑證，請設定 `gateway.auth.allowTailscale: false` 並使用 `gateway.auth.mode: "token"` 或 `"password"`。

**選項 C：Tailnet bind（不使用 Serve）**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

開啟：`http://<tailscale-ip>:18789`（需要權杖）。

## 7) 連接你的頻道

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

請參閱 [頻道](/zh-TW/channels) 以了解其他供應商。

---

## 1GB RAM 的最佳化

$6 的 droplet 只有 1GB RAM。若要保持順暢執行：

### 新增 swap（建議）

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 使用較輕量的模型

如果你遇到 OOM，可以考慮：

- 使用 API 型模型（Claude、GPT）而非本機模型
- 將 `agents.defaults.model.primary` 設定為較小的模型

### 監控記憶體

```bash
free -h
htop
```

---

## 持久化

所有狀態都位於：

- `~/.openclaw/` — `openclaw.json`、每個 agent 的 `auth-profiles.json`、頻道/供應商狀態，以及工作階段資料
- `~/.openclaw/workspace/` — 工作區（SOUL.md、記憶體等）

這些資料會在重新開機後保留。請定期備份：

```bash
openclaw backup create
```

---

## Oracle Cloud 免費替代方案

Oracle Cloud 提供 **Always Free** ARM 執行個體，效能明顯高於此處任何付費選項，且每月 $0。

| 你會獲得        | 規格              |
| --------------- | ----------------- |
| **4 OCPU**      | ARM Ampere A1     |
| **24GB RAM**    | 綽綽有餘          |
| **200GB 儲存空間** | 區塊磁碟區     |
| **永久免費**    | 不會產生信用卡費用 |

**注意事項：**

- 註冊可能較挑剔（失敗時請重試）
- ARM 架構 — 大多數東西都能運作，但某些二進位檔需要 ARM 建置

完整設定指南請參閱 [Oracle Cloud](/zh-TW/install/oracle)。註冊提示與註冊流程疑難排解，請參閱這份[社群指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)。

---

## 疑難排解

### Gateway 無法啟動

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### 連接埠已被使用

```bash
lsof -i :18789
kill <PID>
```

### 記憶體不足

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## 相關內容

- [Hetzner 指南](/zh-TW/install/hetzner) — 更便宜、更強大
- [Docker 安裝](/zh-TW/install/docker) — 容器化設定
- [Tailscale](/zh-TW/gateway/tailscale) — 安全遠端存取
- [設定](/zh-TW/gateway/configuration) — 完整設定參考
