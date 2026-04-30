---
read_when:
    - 你想要讓 OpenClaw 在 GCP 上 24/7 全天候執行
    - 你想要在自己的 VM 上使用生產級、持續運作的 Gateway
    - 你想要完全控制持久化、二進位檔案和重新啟動行為
summary: 在 GCP Compute Engine VM (Docker) 上全天候執行 OpenClaw Gateway，並使用持久化狀態
title: GCP
x-i18n:
    generated_at: "2026-04-30T03:14:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6c1416170484d4b9735dccf8297fd93bcf929b198ce4ead23ce8d0cea918c38c
    source_path: install/gcp.md
    workflow: 16
---

# GCP Compute Engine 上的 OpenClaw（Docker、生產環境 VPS 指南）

## 目標

使用 Docker 在 GCP Compute Engine VM 上執行持續運作的 OpenClaw Gateway，具備持久狀態、預先內建的二進位檔，以及安全的重新啟動行為。

如果你想要「每月約 $5-12 即可 24/7 執行 OpenClaw」，這是在 Google Cloud 上可靠的設定。
價格會因機器類型和區域而異；請選擇符合工作負載的最小 VM，如果遇到 OOM 再向上擴充。

## 我們要做什麼（簡單來說）？

- 建立 GCP 專案並啟用帳單
- 建立 Compute Engine VM
- 安裝 Docker（隔離的應用程式執行環境）
- 在 Docker 中啟動 OpenClaw Gateway
- 將 `~/.openclaw` + `~/.openclaw/workspace` 持久保存在主機上（重新啟動/重建後仍保留）
- 透過 SSH 通道從你的筆電存取控制 UI

掛載的 `~/.openclaw` 狀態包含 `openclaw.json`、每個 agent 的
`agents/<agentId>/agent/auth-profiles.json`，以及 `.env`。

Gateway 可透過以下方式存取：

- 從你的筆電使用 SSH 連接埠轉送
- 如果你自行管理防火牆和 token，可直接暴露連接埠

本指南使用 GCP Compute Engine 上的 Debian。
Ubuntu 也可使用；請相應對應套件。
如需一般 Docker 流程，請參閱 [Docker](/zh-TW/install/docker)。

---

## 快速路徑（有經驗的操作人員）

1. 建立 GCP 專案 + 啟用 Compute Engine API
2. 建立 Compute Engine VM（e2-small、Debian 12、20GB）
3. SSH 進入 VM
4. 安裝 Docker
5. Clone OpenClaw repository
6. 建立持久化主機目錄
7. 設定 `.env` 和 `docker-compose.yml`
8. 內建必要二進位檔、建置並啟動

---

## 你需要準備

- GCP 帳號（符合 e2-micro 免費級別資格）
- 已安裝 gcloud CLI（或使用 Cloud Console）
- 從你的筆電可用的 SSH 存取
- 基本熟悉 SSH + 複製/貼上
- 約 20-30 分鐘
- Docker 和 Docker Compose
- 模型驗證認證
- 選用的 provider 認證
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="安裝 gcloud CLI（或使用 Console）">
    **選項 A：gcloud CLI**（建議用於自動化）

    從 [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) 安裝

    初始化並驗證：

    ```bash
    gcloud init
    gcloud auth login
    ```

    **選項 B：Cloud Console**

    所有步驟都可透過 [https://console.cloud.google.com](https://console.cloud.google.com) 的 Web UI 完成

  </Step>

  <Step title="建立 GCP 專案">
    **CLI：**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    在 [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) 啟用帳單（Compute Engine 必須使用）。

    啟用 Compute Engine API：

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console：**

    1. 前往 IAM & Admin > Create Project
    2. 命名並建立
    3. 為專案啟用帳單
    4. 前往 APIs & Services > Enable APIs > 搜尋「Compute Engine API」> Enable

  </Step>

  <Step title="建立 VM">
    **機器類型：**

    | 類型      | 規格                    | 成本               | 備註                                        |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU，4GB RAM          | 約 $25/月          | 對本機 Docker 建置最可靠                    |
    | e2-small  | 2 vCPU，2GB RAM          | 約 $12/月          | Docker 建置的最低建議規格                   |
    | e2-micro  | 2 vCPU（共享），1GB RAM | 符合免費級別資格 | Docker 建置常因 OOM 失敗（exit 137） |

    **CLI：**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console：**

    1. 前往 Compute Engine > VM instances > Create instance
    2. 名稱：`openclaw-gateway`
    3. 區域：`us-central1`，可用區：`us-central1-a`
    4. 機器類型：`e2-small`
    5. 開機磁碟：Debian 12，20GB
    6. 建立

  </Step>

  <Step title="SSH 進入 VM">
    **CLI：**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console：**

    在 Compute Engine dashboard 中，點選你的 VM 旁邊的「SSH」按鈕。

    注意：VM 建立後，SSH 金鑰傳播可能需要 1-2 分鐘。如果連線遭拒，請等待後重試。

  </Step>

  <Step title="安裝 Docker（在 VM 上）">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    登出再登入，讓群組變更生效：

    ```bash
    exit
    ```

    接著重新 SSH 進入：

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    驗證：

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clone OpenClaw repository">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    本指南假設你將建置自訂映像，以確保二進位檔持久保留。

  </Step>

  <Step title="建立持久化主機目錄">
    Docker container 是暫時性的。
    所有長期狀態都必須位於主機上。

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="設定環境變數">
    在 repository 根目錄建立 `.env`。

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    除非你明確想透過 `.env` 管理，否則請將 `OPENCLAW_GATEWAY_TOKEN`
    留空；OpenClaw 會在第一次啟動時將隨機 gateway token 寫入設定。
    產生 keyring 密碼並貼到 `GOG_KEYRING_PASSWORD`：

    ```bash
    openssl rand -hex 32
    ```

    **不要 commit 這個檔案。**

    這個 `.env` 檔案用於 container/runtime env，例如 `OPENCLAW_GATEWAY_TOKEN`。
    已儲存的 provider OAuth/API-key auth 位於掛載的
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`。

  </Step>

  <Step title="Docker Compose 設定">
    建立或更新 `docker-compose.yml`。

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VM; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` 只用於方便 bootstrap，不能取代正確的 gateway 設定。仍請設定 auth（`gateway.auth.token` 或密碼），並為你的部署使用安全的 bind 設定。

  </Step>

  <Step title="共用 Docker VM runtime 步驟">
    請使用共用 runtime 指南完成常見 Docker 主機流程：

    - [將必要二進位檔內建到映像中](/zh-TW/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [建置並啟動](/zh-TW/install/docker-vm-runtime#build-and-launch)
    - [哪些內容會持久保存在哪裡](/zh-TW/install/docker-vm-runtime#what-persists-where)
    - [更新](/zh-TW/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP 專屬啟動注意事項">
    在 GCP 上，如果建置在 `pnpm install --frozen-lockfile` 期間因 `Killed` 或 `exit code 137` 失敗，表示 VM 記憶體不足。請至少使用 `e2-small`，或使用 `e2-medium` 以取得更可靠的首次建置。

    當 bind 到 LAN（`OPENCLAW_GATEWAY_BIND=lan`）時，繼續前請設定受信任的瀏覽器 origin：

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    如果你已變更 gateway 連接埠，請將 `18789` 替換為你設定的連接埠。

  </Step>

  <Step title="從你的筆電存取">
    建立 SSH 通道以轉送 Gateway 連接埠：

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    在瀏覽器中開啟：

    `http://127.0.0.1:18789/`

    重新列印乾淨的 dashboard 連結：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    如果 UI 提示 shared-secret auth，請將設定的 token 或密碼貼到控制 UI 設定中。
    這個 Docker 流程預設會寫入 token；如果你將 container 設定切換為密碼 auth，請改用該密碼。

    如果控制 UI 顯示 `unauthorized` 或 `disconnected (1008): pairing required`，請核准瀏覽器裝置：

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    需要再次參考共用持久化和更新資訊嗎？
    請參閱 [Docker VM Runtime](/zh-TW/install/docker-vm-runtime#what-persists-where) 和 [Docker VM Runtime 更新](/zh-TW/install/docker-vm-runtime#updates)。

  </Step>
</Steps>

---

## 疑難排解

**SSH 連線遭拒**

VM 建立後，SSH 金鑰傳播可能需要 1-2 分鐘。請等待後重試。

**OS Login 問題**

檢查你的 OS Login profile：

```bash
gcloud compute os-login describe-profile
```

確認你的帳號具備必要 IAM 權限（Compute OS Login 或 Compute OS Admin Login）。

**記憶體不足（OOM）**

如果 Docker 建置因 `Killed` 和 `exit code 137` 失敗，表示 VM 被 OOM-killed。升級到 e2-small（最低）或 e2-medium（建議用於可靠的本機建置）：

```bash
# Stop the VM first
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Start the VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Service account（安全最佳實務）

個人使用時，預設使用者帳號即可正常運作。

若用於自動化或 CI/CD pipeline，請建立具備最少權限的專用 service account：

1. 建立 service account：

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. 授予 Compute Instance Admin role（或更窄範圍的自訂 role）：

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

請避免將 Owner role 用於自動化。請採用最小權限原則。

如需 IAM role 詳細資訊，請參閱 [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles)。

---

## 後續步驟

- 設定訊息通道：[通道](/zh-TW/channels)
- 將本機裝置配對為 Node：[Node](/zh-TW/nodes)
- 設定 Gateway：[Gateway 設定](/zh-TW/gateway/configuration)

## 相關

- [安裝概覽](/zh-TW/install)
- [Azure](/zh-TW/install/azure)
- [VPS 託管](/zh-TW/vps)
