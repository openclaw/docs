---
read_when:
    - 在 Oracle Cloud 上設定 OpenClaw
    - 尋找適合 OpenClaw 的免費 VPS 託管
    - 想在小型伺服器上 24/7 執行 OpenClaw
summary: 在 Oracle Cloud 的 Always Free ARM 方案上託管 OpenClaw
title: Oracle Cloud
x-i18n:
    generated_at: "2026-07-05T11:27:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

在 Oracle Cloud 的 **Always Free** ARM 方案層級（最高 4 OCPU、24 GB RAM、200 GB 儲存空間）上免費執行持續運作的 OpenClaw 閘道。

## 先決條件

- Oracle Cloud 帳號（[註冊](https://www.oracle.com/cloud/free/)）-- 如果遇到問題，請參閱[社群註冊指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Tailscale 帳號（可在 [tailscale.com](https://tailscale.com) 免費註冊）
- 一組 SSH 金鑰對
- 約 30 分鐘

## 設定

<Steps>
  <Step title="建立 OCI 執行個體">
    1. 登入 [Oracle Cloud Console](https://cloud.oracle.com/)。
    2. 前往 **Compute > Instances > Create Instance**。
    3. 設定：
       - **名稱：** `openclaw`
       - **映像檔：** Ubuntu 24.04 (aarch64)
       - **Shape：** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPU：** 2（或最高 4）
       - **記憶體：** 12 GB（或最高 24 GB）
       - **開機磁碟區：** 50 GB（最高 200 GB 免費）
       - **SSH 金鑰：** 新增你的公開金鑰
    4. 按一下 **Create**，並記下公用 IP 位址。

    <Tip>
    如果建立執行個體失敗並顯示「Out of capacity」，請嘗試不同的可用性網域，或稍後再試。免費方案容量有限。
    </Tip>

  </Step>

  <Step title="連線並更新系統">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    某些相依套件在 ARM 上編譯時需要 `build-essential`。

  </Step>

  <Step title="設定使用者與主機名稱">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    啟用 linger 可讓使用者服務在登出後繼續執行。

  </Step>

  <Step title="安裝 Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    從現在開始，透過 Tailscale 連線：`ssh ubuntu@openclaw`。

  </Step>

  <Step title="安裝 OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    當系統提示「How do you want to hatch your bot?」時，選擇 **Do this later**。

  </Step>

  <Step title="設定閘道">
    搭配 Tailscale Serve 使用權杖驗證，以安全地遠端存取。

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    這裡的 `gateway.trustedProxies=["127.0.0.1"]` 只用於本機 Tailscale Serve 代理的轉送 IP/本機用戶端處理。它**不是** `gateway.auth.mode: "trusted-proxy"`。在此設定中，差異檢視器路由會維持失敗即關閉行為：沒有轉送代理標頭的原始 `127.0.0.1` 檢視器請求會回傳 `Diff not found`。針對附件使用 `mode=file` / `mode=both`，或者如果你需要可分享的檢視器連結，請刻意啟用遠端檢視器並設定 `plugins.entries.diffs.config.viewerBaseUrl`（或傳入代理 `baseUrl`）。

  </Step>

  <Step title="鎖定 VCN 安全性">
    在網路邊界封鎖除 Tailscale 以外的所有流量：

    1. 在 OCI Console 中前往 **Networking > Virtual Cloud Networks**。
    2. 按一下你的 VCN，然後按 **Security Lists > Default Security List**。
    3. **移除**除了 `0.0.0.0/0 UDP 41641`（Tailscale）以外的所有輸入規則。
    4. 保留預設輸出規則（允許所有對外連線）。

    這會在網路邊界封鎖連接埠 22 上的 SSH、HTTP、HTTPS 以及其他所有流量。從此之後，你只能透過 Tailscale 連線。

  </Step>

  <Step title="驗證">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    從 tailnet 上的任何裝置存取控制介面：

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    將 `<tailnet-name>` 替換為你的 tailnet 名稱（可在 `tailscale status` 中查看）。

  </Step>
</Steps>

## 驗證安全態勢

在 VCN 已鎖定（僅開放 UDP 41641）且閘道綁定至 local loopback 的情況下，公開流量會在網路邊界被封鎖，管理員存取也僅限 tailnet。這使得幾個傳統 VPS 強化步驟不再必要：

| 傳統步驟           | 是否需要？  | 原因                                                                      |
| ------------------ | ----------- | ------------------------------------------------------------------------- |
| UFW 防火牆         | 否          | VCN 會在流量到達執行個體之前封鎖。                                       |
| fail2ban           | 否          | 連接埠 22 已在 VCN 封鎖；沒有暴力破解攻擊面。                            |
| sshd 強化          | 否          | Tailscale SSH 不使用 sshd。                                               |
| 停用 root 登入     | 否          | Tailscale 依據 tailnet 身分驗證，而不是系統使用者。                      |
| 僅允許 SSH 金鑰驗證 | 否          | 同上 -- tailnet 身分取代系統 SSH 金鑰。                                  |
| IPv6 強化          | 通常不需要  | 取決於 VCN/子網路設定；請驗證實際指派/暴露的內容。                       |

仍建議：

- `chmod 700 ~/.openclaw` 以限制認證檔案權限。
- `openclaw security audit` 進行 OpenClaw 專屬的態勢檢查。
- 定期執行 `sudo apt update && sudo apt upgrade` 以套用作業系統修補程式。
- 定期在 [Tailscale admin console](https://login.tailscale.com/admin) 檢閱裝置。

快速驗證命令：

```bash
# 確認沒有公開連接埠正在監聽
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# 驗證 Tailscale SSH 已啟用
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# 選用：確認 Tailscale SSH 可正常運作後，完全停用 sshd
sudo systemctl disable --now ssh
```

## ARM 注意事項

Always Free 方案層級是 ARM（`aarch64`）。大多數 OpenClaw 功能都能正常運作；少數原生二進位檔需要 ARM 建置：

- Node.js、Telegram、WhatsApp（Baileys）：純 JavaScript，沒有問題。
- 大多數含原生程式碼的 npm 套件：有可用的預先建置 `linux-arm64` 成品。
- 選用命令列介面輔助工具（例如 Skills 隨附的 Go/Rust 二進位檔）：安裝前請檢查是否有 `aarch64` / `linux-arm64` 版本。

使用 `uname -m` 驗證架構（應輸出 `aarch64`）。對於沒有 ARM 建置的二進位檔，請從原始碼安裝或略過。

## 持久化與備份

OpenClaw 狀態位於：

- `~/.openclaw/` -- `openclaw.json`、各代理的 `auth-profiles.json`、頻道/供應商狀態，以及工作階段資料。
- `~/.openclaw/workspace/` -- 代理工作區（SOUL.md、記憶、成品）。

這些資料會在重新開機後保留。若要建立可攜式快照：

```bash
openclaw backup create
```

## 備援：SSH 通道

如果 Tailscale Serve 無法運作，請從本機使用 SSH 通道：

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

然後開啟 `http://localhost:18789`。

## 疑難排解

**建立執行個體失敗（「Out of capacity」）** -- 免費方案 ARM 執行個體很受歡迎。請嘗試不同的可用性網域，或在離峰時間重試。

**Tailscale 無法連線** -- 執行 `sudo tailscale up --ssh --hostname=openclaw --reset` 重新驗證。

**閘道無法啟動** -- 執行 `openclaw doctor --non-interactive`，並使用 `journalctl --user -u openclaw-gateway.service -n 50` 檢查記錄。

**ARM 二進位檔問題** -- 大多數 npm 套件都可在 ARM64 上運作。對於原生二進位檔，請尋找 `linux-arm64` 或 `aarch64` 版本。使用 `uname -m` 驗證架構。

## 後續步驟

- [頻道](/zh-TW/channels) -- 連接 Telegram、WhatsApp、Discord 等更多服務
- [閘道設定](/zh-TW/gateway/configuration) -- 所有設定選項
- [更新](/zh-TW/install/updating) -- 讓 OpenClaw 保持最新

## 相關

- [安裝概觀](/zh-TW/install)
- [GCP](/zh-TW/install/gcp)
- [VPS 託管](/zh-TW/vps)
