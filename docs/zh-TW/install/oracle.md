---
read_when:
    - 在 Oracle Cloud 上設定 OpenClaw
    - 正在尋找可供 OpenClaw 使用的免費 VPS 託管服務
    - 想在小型伺服器上全天候執行 OpenClaw
summary: 在 Oracle Cloud 的 Always Free ARM 方案上託管 OpenClaw
title: Oracle Cloud
x-i18n:
    generated_at: "2026-07-11T21:28:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

在 Oracle Cloud 的 **Always Free** ARM 方案（最多 4 個 OCPU、24 GB RAM、200 GB 儲存空間）上免費執行持續運作的 OpenClaw 閘道。

## 先決條件

- Oracle Cloud 帳戶（[註冊](https://www.oracle.com/cloud/free/)）——如果遇到問題，請參閱[社群註冊指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Tailscale 帳戶（可在 [tailscale.com](https://tailscale.com) 免費註冊）
- 一組 SSH 金鑰對
- 約 30 分鐘

## 設定

<Steps>
  <Step title="建立 OCI 執行個體">
    1. 登入 [Oracle Cloud Console](https://cloud.oracle.com/)。
    2. 前往 **Compute > Instances > Create Instance**。
    3. 設定：
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2（最多可設為 4）
       - **Memory:** 12 GB（最多可設為 24 GB）
       - **Boot volume:** 50 GB（免費額度最多 200 GB）
       - **SSH key:** 新增您的公開金鑰
    4. 按一下 **Create**，並記下公用 IP 位址。

    <Tip>
    如果建立執行個體時出現「Out of capacity」而失敗，請嘗試其他可用性網域，或稍後再試。免費方案的容量有限。
    </Tip>

  </Step>

  <Step title="連線並更新系統">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    某些相依套件需要使用 `build-essential` 才能在 ARM 上編譯。

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

    從現在起，請透過 Tailscale 連線：`ssh ubuntu@openclaw`。

  </Step>

  <Step title="安裝 OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    出現「How do you want to hatch your bot?」提示時，選取 **Do this later**。

  </Step>

  <Step title="設定閘道">
    搭配 Tailscale Serve 使用權杖驗證，以提供安全的遠端存取。

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    此處的 `gateway.trustedProxies=["127.0.0.1"]` 僅用於本機 Tailscale Serve Proxy 的轉送 IP／本機用戶端處理。它**不是** `gateway.auth.mode: "trusted-proxy"`。在此設定中，差異檢視器路由會維持失敗時關閉的行為：若原始 `127.0.0.1` 檢視器請求未包含轉送 Proxy 標頭，將傳回 `Diff not found`。附件請使用 `mode=file`／`mode=both`；若需要可分享的檢視器連結，請明確啟用遠端檢視器並設定 `plugins.entries.diffs.config.viewerBaseUrl`（或傳入 Proxy `baseUrl`）。

  </Step>

  <Step title="鎖定 VCN 安全性">
    在網路邊界封鎖除 Tailscale 以外的所有流量：

    1. 在 OCI Console 中前往 **Networking > Virtual Cloud Networks**。
    2. 按一下您的 VCN，然後前往 **Security Lists > Default Security List**。
    3. **移除**除 `0.0.0.0/0 UDP 41641`（Tailscale）以外的所有輸入規則。
    4. 保留預設輸出規則（允許所有輸出流量）。

    這會在網路邊界封鎖連接埠 22 上的 SSH、HTTP、HTTPS，以及其他所有流量。從此時起，您只能透過 Tailscale 連線。

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

    將 `<tailnet-name>` 替換為您的 tailnet 名稱（可在 `tailscale status` 中查看）。

  </Step>
</Steps>

## 驗證安全態勢

鎖定 VCN（僅開放 UDP 41641）並將閘道繫結至回送介面後，公用流量會在網路邊界遭到封鎖，而管理存取僅限 tailnet。這使您不必執行多項傳統 VPS 強化步驟：

| 傳統步驟           | 是否需要？ | 原因                                                              |
| ------------------ | ---------- | ----------------------------------------------------------------- |
| UFW 防火牆         | 否         | VCN 會在流量抵達執行個體之前將其封鎖。                            |
| fail2ban           | 否         | VCN 已封鎖連接埠 22，因此沒有暴力破解的攻擊面。                   |
| sshd 強化          | 否         | Tailscale SSH 不使用 sshd。                                       |
| 停用 root 登入     | 否         | Tailscale 依據 tailnet 身分進行驗證，而非系統使用者。             |
| 僅限 SSH 金鑰驗證  | 否         | 同上——tailnet 身分會取代系統 SSH 金鑰。                           |
| IPv6 強化          | 通常不需要 | 視 VCN／子網路設定而定；請確認實際指派及公開的項目。              |

仍建議執行：

- 使用 `chmod 700 ~/.openclaw` 限制憑證檔案權限。
- 執行 `openclaw security audit`，進行 OpenClaw 專用的安全態勢檢查。
- 定期執行 `sudo apt update && sudo apt upgrade`，套用作業系統修補程式。
- 定期在 [Tailscale 管理主控台](https://login.tailscale.com/admin)中檢查裝置。

快速驗證命令：

```bash
# 確認沒有監聽中的公用連接埠
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# 驗證 Tailscale SSH 已啟用
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# 選用：確認 Tailscale SSH 正常運作後，完全停用 sshd
sudo systemctl disable --now ssh
```

## ARM 注意事項

Always Free 方案採用 ARM（`aarch64`）。大多數 OpenClaw 功能都能正常運作；少數原生二進位檔需要 ARM 組建版本：

- Node.js、Telegram、WhatsApp（Baileys）：純 JavaScript，沒有問題。
- 大多數包含原生程式碼的 npm 套件：有預先建置的 `linux-arm64` 成品可用。
- 選用的命令列介面輔助工具（例如 Skills 所提供的 Go／Rust 二進位檔）：安裝前請確認是否有 `aarch64`／`linux-arm64` 發行版本。

使用 `uname -m` 驗證架構（應輸出 `aarch64`）。若二進位檔沒有 ARM 組建版本，請從原始碼安裝或略過。

## 持久性與備份

OpenClaw 狀態儲存在以下位置：

- `~/.openclaw/`——`openclaw.json`、每個代理程式的 `auth-profiles.json`、頻道／供應商狀態，以及工作階段資料。
- `~/.openclaw/workspace/`——代理程式工作區（SOUL.md、記憶、成品）。

這些資料在重新啟動後仍會保留。若要建立可攜式快照：

```bash
openclaw backup create
```

## 備用方案：SSH 通道

如果 Tailscale Serve 無法運作，請從本機電腦使用 SSH 通道：

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

然後開啟 `http://localhost:18789`。

## 疑難排解

**建立執行個體失敗（「Out of capacity」）**——免費方案的 ARM 執行個體很熱門。請嘗試其他可用性網域，或在離峰時段重試。

**Tailscale 無法連線**——執行 `sudo tailscale up --ssh --hostname=openclaw --reset` 以重新驗證。

**閘道無法啟動**——執行 `openclaw doctor --non-interactive`，並使用 `journalctl --user -u openclaw-gateway.service -n 50` 檢查記錄。

**ARM 二進位檔問題**——大多數 npm 套件可在 ARM64 上運作。對於原生二進位檔，請尋找 `linux-arm64` 或 `aarch64` 發行版本。使用 `uname -m` 驗證架構。

## 後續步驟

- [頻道](/zh-TW/channels)——連接 Telegram、WhatsApp、Discord 等服務
- [閘道設定](/zh-TW/gateway/configuration)——所有設定選項
- [更新](/zh-TW/install/updating)——讓 OpenClaw 保持最新狀態

## 相關內容

- [安裝概觀](/zh-TW/install)
- [GCP](/zh-TW/install/gcp)
- [VPS 託管](/zh-TW/vps)
