---
read_when:
    - 在 Oracle Cloud 上設定 OpenClaw
    - 尋找適合 OpenClaw 的低成本 VPS 主機服務
    - 想在小型伺服器上全天候執行 OpenClaw
summary: Oracle Cloud 上的 OpenClaw（Always Free ARM）
title: Oracle Cloud (平台)
x-i18n:
    generated_at: "2026-04-30T03:22:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: d86af91bd924ad08535a21fa481ce551e8c19f1a6cd82b61c335da7a068a09f0
    source_path: platforms/oracle.md
    workflow: 16
---

# Oracle Cloud (OCI) 上的 OpenClaw

## 目標

在 Oracle Cloud 的 **Always Free** ARM 層級上執行持久性的 OpenClaw Gateway。

Oracle 的免費層級很適合 OpenClaw（尤其是你已經有 OCI 帳號時），但也有取捨：

- ARM 架構（大多數東西都能運作，但某些二進位檔可能只有 x86）
- 容量與註冊流程可能不太穩定

## 成本比較（2026）

| 供應商       | 方案            | 規格                   | 每月價格 | 備註                  |
| ------------ | --------------- | ---------------------- | -------- | --------------------- |
| Oracle Cloud | Always Free ARM | 最高 4 OCPU、24GB RAM  | $0       | ARM、容量有限         |
| Hetzner      | CX22            | 2 vCPU、4GB RAM        | 約 $4    | 最便宜的付費選項      |
| DigitalOcean | Basic           | 1 vCPU、1GB RAM        | $6       | UI 簡單、文件良好     |
| Vultr        | Cloud Compute   | 1 vCPU、1GB RAM        | $6       | 地點很多              |
| Linode       | Nanode          | 1 vCPU、1GB RAM        | $5       | 現為 Akamai 的一部分  |

---

## 先決條件

- Oracle Cloud 帳號（[註冊](https://www.oracle.com/cloud/free/)）— 如果遇到問題，請參閱[社群註冊指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Tailscale 帳號（[tailscale.com](https://tailscale.com) 提供免費方案）
- 約 30 分鐘

## 1) 建立 OCI 執行個體

1. 登入 [Oracle Cloud Console](https://cloud.oracle.com/)
2. 前往 **Compute → Instances → Create Instance**
3. 設定：
   - **名稱：** `openclaw`
   - **映像檔：** Ubuntu 24.04 (aarch64)
   - **Shape：** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPU：** 2（或最高 4）
   - **記憶體：** 12 GB（或最高 24 GB）
   - **開機磁碟區：** 50 GB（免費最高 200 GB）
   - **SSH 金鑰：** 新增你的公開金鑰
4. 按一下 **Create**
5. 記下公開 IP 位址

**提示：** 如果建立執行個體時出現「Out of capacity」，請嘗試不同的可用性網域，或稍後再試。免費層級容量有限。

## 2) 連線並更新

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**注意：** `build-essential` 是在 ARM 上編譯某些依賴項所必需的。

## 3) 設定使用者與主機名稱

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) 安裝 Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

這會啟用 Tailscale SSH，因此你可以從 tailnet 上任何裝置透過 `ssh openclaw` 連線，不需要公開 IP。

驗證：

```bash
tailscale status
```

**從現在開始，請透過 Tailscale 連線：** `ssh ubuntu@openclaw`（或使用 Tailscale IP）。

## 5) 安裝 OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

當系統提示「How do you want to hatch your bot?」時，選擇 **"Do this later"**。

> 注意：如果遇到 ARM 原生建置問題，先從系統套件開始（例如 `sudo apt install -y build-essential`），再考慮使用 Homebrew。

## 6) 設定 Gateway（loopback + token 驗證）並啟用 Tailscale Serve

預設使用 token 驗證。這樣較可預期，且不需要任何「不安全驗證」控制 UI 旗標。

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

這裡的 `gateway.trustedProxies=["127.0.0.1"]` 只用於本機 Tailscale Serve 代理的轉送 IP/本機用戶端處理。它**不是** `gateway.auth.mode: "trusted-proxy"`。在這種設定中，差異檢視器路由會維持失敗關閉行為：沒有轉送代理標頭的原始 `127.0.0.1` 檢視器請求可能會回傳 `Diff not found`。對附件使用 `mode=file` / `mode=both`，或如果你需要可分享的檢視器連結，請刻意啟用遠端檢視器並設定 `plugins.entries.diffs.config.viewerBaseUrl`（或傳入代理 `baseUrl`）。

## 7) 驗證

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway.service

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) 鎖定 VCN 安全性

現在一切都能運作後，鎖定 VCN 以封鎖除 Tailscale 以外的所有流量。OCI 的 Virtual Cloud Network 會在網路邊界作為防火牆，在流量到達執行個體前就將其封鎖。

1. 在 OCI Console 中前往 **Networking → Virtual Cloud Networks**
2. 按一下你的 VCN → **Security Lists** → Default Security List
3. **移除**所有輸入規則，只保留：
   - `0.0.0.0/0 UDP 41641`（Tailscale）
4. 保留預設輸出規則（允許所有對外連線）

這會在網路邊界封鎖連接埠 22 上的 SSH、HTTP、HTTPS，以及其他所有流量。從現在開始，你只能透過 Tailscale 連線。

---

## 存取控制 UI

從 Tailscale 網路上的任何裝置：

```
https://openclaw.<tailnet-name>.ts.net/
```

將 `<tailnet-name>` 替換為你的 tailnet 名稱（可在 `tailscale status` 中看到）。

不需要 SSH 通道。Tailscale 提供：

- HTTPS 加密（自動憑證）
- 透過 Tailscale 身分進行驗證
- 從 tailnet 上任何裝置存取（筆電、手機等）

---

## 安全性：VCN + Tailscale（建議基準）

在 VCN 已鎖定（只開放 UDP 41641）且 Gateway 綁定到 loopback 的情況下，你會獲得強大的縱深防禦：公開流量會在網路邊界被封鎖，而管理存取會透過你的 tailnet 進行。

這種設定通常會移除額外主機型防火牆規則的_必要性_，純粹用來阻止網際網路範圍的 SSH 暴力破解，但你仍應保持作業系統更新、執行 `openclaw security audit`，並確認你沒有意外監聽公開介面。

### 已受保護

| 傳統步驟           | 需要嗎？   | 原因                                                                         |
| ------------------ | ----------- | ---------------------------------------------------------------------------- |
| UFW 防火牆         | 否          | VCN 會在流量到達執行個體前封鎖                                             |
| fail2ban           | 否          | 如果連接埠 22 在 VCN 被封鎖，就不會有暴力破解                               |
| sshd 強化          | 否          | Tailscale SSH 不使用 sshd                                                    |
| 停用 root 登入     | 否          | Tailscale 使用 Tailscale 身分，而不是系統使用者                              |
| 僅 SSH 金鑰驗證    | 否          | Tailscale 透過你的 tailnet 進行驗證                                          |
| IPv6 強化          | 通常不需要  | 取決於你的 VCN/子網路設定；請驗證實際指派/公開的內容                        |

### 仍建議

- **憑證權限：** `chmod 700 ~/.openclaw`
- **安全性稽核：** `openclaw security audit`
- **系統更新：** 定期執行 `sudo apt update && sudo apt upgrade`
- **監控 Tailscale：** 在 [Tailscale 管理主控台](https://login.tailscale.com/admin)檢閱裝置

### 驗證安全態勢

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## 備援：SSH 通道

如果 Tailscale Serve 無法運作，請使用 SSH 通道：

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

然後開啟 `http://localhost:18789`。

---

## 疑難排解

### 建立執行個體失敗（「Out of capacity」）

免費層級 ARM 執行個體很受歡迎。請嘗試：

- 不同的可用性網域
- 在離峰時段重試（清晨）
- 選取 shape 時使用「Always Free」篩選器

### Tailscale 無法連線

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway 無法啟動

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### 無法連到控制 UI

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway.service
```

### ARM 二進位檔問題

有些工具可能沒有 ARM 建置版本。檢查：

```bash
uname -m  # Should show aarch64
```

大多數 npm 套件都能正常運作。若是二進位檔，請尋找 `linux-arm64` 或 `aarch64` 發行版本。

---

## 持久化

所有狀態都位於：

- `~/.openclaw/` — `openclaw.json`、每個代理的 `auth-profiles.json`、頻道/供應商狀態，以及工作階段資料
- `~/.openclaw/workspace/` — 工作區（SOUL.md、記憶、成品）

定期備份：

```bash
openclaw backup create
```

---

## 相關

- [Gateway 遠端存取](/zh-TW/gateway/remote) — 其他遠端存取模式
- [Tailscale 整合](/zh-TW/gateway/tailscale) — 完整 Tailscale 文件
- [Gateway 設定](/zh-TW/gateway/configuration) — 所有設定選項
- [DigitalOcean 指南](/zh-TW/install/digitalocean) — 如果你想要付費且註冊更容易
- [Hetzner 指南](/zh-TW/install/hetzner) — Docker 型替代方案
