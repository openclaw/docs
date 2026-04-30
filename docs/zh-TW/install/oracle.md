---
read_when:
    - 在 Oracle Cloud 上設定 OpenClaw
    - 尋找適合 OpenClaw 的免費 VPS 託管服務
    - 想在小型伺服器上全天候執行 OpenClaw
summary: 在 Oracle Cloud 的 Always Free ARM 層級上託管 OpenClaw
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-30T03:16:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: dce0d2a33556c8e48a48df744f8d1341fcfa78c93ff5a5e02a5013d207f3e6ed
    source_path: install/oracle.md
    workflow: 16
---

在 Oracle Cloud 的 **Always Free** ARM 層級（最多 4 個 OCPU、24 GB RAM、200 GB 儲存空間）上免費執行持續運作的 OpenClaw Gateway。

## 先決條件

- Oracle Cloud 帳號（[註冊](https://www.oracle.com/cloud/free/)）-- 如果遇到問題，請參閱[社群註冊指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Tailscale 帳號（可在 [tailscale.com](https://tailscale.com) 免費取得）
- 一組 SSH 金鑰
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
       - **OCPUs：** 2（或最多 4）
       - **記憶體：** 12 GB（或最多 24 GB）
       - **開機磁碟區：** 50 GB（免費最多 200 GB）
       - **SSH 金鑰：** 加入你的公開金鑰
    4. 按一下 **Create**，並記下公用 IP 位址。

    <Tip>
    如果建立執行個體失敗並顯示「Out of capacity」，請嘗試不同的可用性網域，或稍後再試。免費層級容量有限。
    </Tip>

  </Step>

  <Step title="連線並更新系統">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    某些依賴項需要 `build-essential` 才能在 ARM 上編譯。

  </Step>

  <Step title="設定使用者和主機名稱">
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

    當提示「How do you want to hatch your bot?」時，選擇 **Do this later**。

  </Step>

  <Step title="設定 Gateway">
    使用 token 驗證搭配 Tailscale Serve，以提供安全的遠端存取。

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    這裡的 `gateway.trustedProxies=["127.0.0.1"]` 只用於本機 Tailscale Serve 代理的轉送 IP／本機用戶端處理。它**不是** `gateway.auth.mode: "trusted-proxy"`。在此設定中，diff 檢視器路由會維持失敗關閉行為：沒有轉送代理標頭的原始 `127.0.0.1` 檢視器請求可能會傳回 `Diff not found`。針對附件使用 `mode=file` / `mode=both`，或如果需要可分享的檢視器連結，請有意啟用遠端檢視器並設定 `plugins.entries.diffs.config.viewerBaseUrl`（或傳入代理 `baseUrl`）。

  </Step>

  <Step title="鎖定 VCN 安全性">
    在網路邊界阻擋除 Tailscale 以外的所有流量：

    1. 在 OCI Console 中前往 **Networking > Virtual Cloud Networks**。
    2. 按一下你的 VCN，然後前往 **Security Lists > Default Security List**。
    3. **移除** 除 `0.0.0.0/0 UDP 41641`（Tailscale）以外的所有輸入規則。
    4. 保留預設輸出規則（允許所有外送流量）。

    這會在網路邊界阻擋連接埠 22 的 SSH、HTTP、HTTPS，以及其他所有流量。從此刻起，你只能透過 Tailscale 連線。

  </Step>

  <Step title="驗證">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    從 tailnet 上的任何裝置存取 Control UI：

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    將 `<tailnet-name>` 替換為你的 tailnet 名稱（可在 `tailscale status` 中看到）。

  </Step>
</Steps>

## 備用方案：SSH tunnel

如果 Tailscale Serve 無法運作，請從你的本機電腦使用 SSH tunnel：

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

然後開啟 `http://localhost:18789`。

## 疑難排解

**建立執行個體失敗（「Out of capacity」）** -- 免費層級 ARM 執行個體很熱門。請嘗試不同的可用性網域，或在離峰時段重試。

**Tailscale 無法連線** -- 執行 `sudo tailscale up --ssh --hostname=openclaw --reset` 以重新驗證。

**Gateway 無法啟動** -- 執行 `openclaw doctor --non-interactive`，並使用 `journalctl --user -u openclaw-gateway.service -n 50` 檢查記錄。

**ARM 二進位檔問題** -- 大多數 npm 套件可在 ARM64 上運作。若是原生二進位檔，請尋找 `linux-arm64` 或 `aarch64` 版本。使用 `uname -m` 驗證架構。

## 後續步驟

- [頻道](/zh-TW/channels) -- 連接 Telegram、WhatsApp、Discord 等服務
- [Gateway 設定](/zh-TW/gateway/configuration) -- 所有設定選項
- [更新](/zh-TW/install/updating) -- 讓 OpenClaw 保持最新狀態

## 相關內容

- [安裝概覽](/zh-TW/install)
- [GCP](/zh-TW/install/gcp)
- [VPS 主機代管](/zh-TW/vps)
