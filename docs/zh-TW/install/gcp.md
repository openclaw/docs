---
read_when:
    - 您想讓 OpenClaw 在 GCP 上全天候執行
    - 你想在自己的虛擬機器上建置可用於正式環境、持續運作的閘道
    - 你想要完全掌控持久化、二進位檔與重新啟動行為
summary: 在 GCP Compute Engine VM（Docker）上全天候執行 OpenClaw 閘道，並保留持久狀態
title: GCP
x-i18n:
    generated_at: "2026-07-11T21:28:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

使用 Docker 在 GCP Compute Engine 虛擬機上執行持久化的 OpenClaw 閘道，具備持久化狀態、預先內建的二進位檔，以及安全的重新啟動行為。

價格會因機器類型和區域而異；請選擇能滿足工作負載的最小型虛擬機，若遇到記憶體不足（OOM），再擴充規格。

您可以透過筆記型電腦的 SSH 連接埠轉送存取閘道；若自行管理防火牆和權杖，也可以直接公開連接埠。

本指南在 GCP Compute Engine 上使用 Debian。Ubuntu 也適用，但請相應調整套件。一般 Docker 流程請參閱 [Docker](/zh-TW/install/docker)。

## 所需項目

- GCP 帳戶（`e2-micro` 符合免費方案資格）
- `gcloud` 命令列介面，或 [Cloud Console](https://console.cloud.google.com)
- 從筆記型電腦進行 SSH 存取
- Docker 和 Docker Compose
- 模型驗證憑證
- 選用的供應商憑證（WhatsApp QR、Telegram 機器人權杖、Gmail OAuth）
- 約 20 至 30 分鐘

## 快速流程

1. 建立 GCP 專案，啟用帳單和 Compute Engine API
2. 建立 Compute Engine 虛擬機（`e2-small`、Debian 12、20GB）
3. 透過 SSH 連線至虛擬機並安裝 Docker
4. 複製 OpenClaw 儲存庫
5. 建立持久化主機目錄
6. 設定 `.env` 和 `docker-compose.yml`
7. 預先內建所需二進位檔、建置並啟動

<Steps>
  <Step title="安裝 gcloud 命令列介面（或使用 Console）">
    從 [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) 安裝，然後執行：

    ```bash
    gcloud init
    gcloud auth login
    ```

    或改用 [Cloud Console](https://console.cloud.google.com) 網頁介面完成下列所有步驟。

  </Step>

  <Step title="建立 GCP 專案">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    請在 [console.cloud.google.com/billing](https://console.cloud.google.com/billing) 啟用帳單（Compute Engine 必須啟用）。

    對應的 Console 操作：IAM & Admin > Create Project，啟用帳單，然後前往 APIs & Services > Enable APIs > "Compute Engine API" > Enable。

  </Step>

  <Step title="建立虛擬機">
    | 類型      | 規格                     | 費用               | 備註                                         |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 個 vCPU、4GB RAM       | 每月約 $25         | 最適合可靠地進行本機 Docker 建置             |
    | e2-small  | 2 個 vCPU、2GB RAM       | 每月約 $12         | Docker 建置的最低建議規格                    |
    | e2-micro  | 2 個 vCPU（共用）、1GB RAM | 符合免費方案資格 | Docker 建置常因記憶體不足而失敗（結束碼 137） |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="透過 SSH 連線至虛擬機">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Console：在 Compute Engine 資訊主頁中，按一下虛擬機旁的 "SSH"。

    建立虛擬機後，SSH 金鑰傳播可能需要 1 至 2 分鐘；如果連線遭拒，請稍候再重試。

  </Step>

  <Step title="安裝 Docker（在虛擬機上）">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    登出再登入，讓群組變更生效，然後重新透過 SSH 連線：

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    驗證：

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="複製 OpenClaw 儲存庫">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    本指南會建置自訂映像檔，讓預先內建的所有二進位檔在重新啟動後仍然保留。

  </Step>

  <Step title="建立持久化主機目錄">
    Docker 容器是暫時性的；所有長期狀態都必須存放在主機上。

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="設定環境變數">
    在儲存庫根目錄建立 `.env`：

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

    設定 `OPENCLAW_GATEWAY_TOKEN`，以便透過 `.env` 管理穩定的閘道權杖；否則，請先設定 `gateway.auth.token`，再讓用戶端依賴重新啟動後的連線。若兩者皆未設定，OpenClaw 會為該次啟動使用僅限執行階段的權杖。為 `GOG_KEYRING_PASSWORD` 產生金鑰環密碼：

    ```bash
    openssl rand -hex 32
    ```

    **請勿提交此檔案。** 其中包含容器／執行階段環境變數，例如 `OPENCLAW_GATEWAY_TOKEN`。已儲存的供應商 OAuth／API 金鑰驗證資訊位於掛載的 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`。

  </Step>

  <Step title="Docker Compose 設定">
    建立或更新 `docker-compose.yml`：

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
          # 建議：讓閘道在虛擬機上僅綁定迴路介面；透過 SSH 通道存取。
          # 若要公開，請移除 `127.0.0.1:` 前綴，並相應設定防火牆。
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

    `--allow-unconfigured` 僅用於方便初始設定，不能取代真正的閘道設定。部署時仍須設定驗證（`gateway.auth.token` 或密碼）及安全的綁定模式。

  </Step>

  <Step title="共用 Docker 虛擬機執行階段步驟">
    請依照共用執行階段指南完成一般 Docker 主機流程：

    - [將所需二進位檔預先內建至映像檔](/zh-TW/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [建置並啟動](/zh-TW/install/docker-vm-runtime#build-and-launch)
    - [各項資料的持久化位置](/zh-TW/install/docker-vm-runtime#what-persists-where)
    - [更新](/zh-TW/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP 特定的啟動注意事項">
    如果在執行 `pnpm install --frozen-lockfile` 期間，建置因 `Killed` 或 `exit code 137` 而失敗，表示虛擬機記憶體不足。至少使用 `e2-small`；若要讓首次建置更可靠，請使用 `e2-medium`。

    綁定至區域網路（`OPENCLAW_GATEWAY_BIND=lan`）時，請先設定受信任的瀏覽器來源，再繼續操作：

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    如果您已變更連接埠，請以設定的連接埠取代 `18789`。

  </Step>

  <Step title="從筆記型電腦存取">
    建立 SSH 通道以轉送閘道連接埠：

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    在瀏覽器中開啟 `http://127.0.0.1:18789/`。

    重新輸出簡潔的資訊主頁連結：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    如果使用者介面提示需要共用密鑰驗證，請將設定的權杖或密碼貼到控制介面設定中（此 Docker 流程預設會寫入權杖；如果已切換為密碼驗證，請改用設定的密碼）。

    如果控制介面顯示 `unauthorized` 或 `disconnected (1008): pairing required`，請核准瀏覽器裝置：

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    共用持久化位置對照表請參閱 [Docker 虛擬機執行階段](/zh-TW/install/docker-vm-runtime#what-persists-where)，並參閱[更新流程](/zh-TW/install/docker-vm-runtime#updates)。

  </Step>
</Steps>

## 疑難排解

**SSH 連線遭拒**

建立虛擬機後，SSH 金鑰傳播可能需要 1 至 2 分鐘。請稍候再重試。

**OS Login 問題**

檢查您的 OS Login 設定檔：

```bash
gcloud compute os-login describe-profile
```

確認您的帳戶具備必要的 IAM 權限（Compute OS Login 或 Compute OS Admin Login）。

**記憶體不足（OOM）**

如果 Docker 建置因 `Killed` 和 `exit code 137` 而失敗，表示虛擬機程序因記憶體不足而遭終止：

```bash
# 先停止虛擬機
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# 變更機器類型
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# 啟動虛擬機
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## 服務帳戶（安全性最佳實務）

若為個人使用，預設使用者帳戶即可。若用於自動化或 CI/CD，請建立權限最小化的專用服務帳戶：

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

避免為自動化使用 Owner 角色；請使用能夠運作的最小權限角色。請參閱[瞭解角色](https://cloud.google.com/iam/docs/understanding-roles)。

## 後續步驟

- 設定訊息頻道：[頻道](/zh-TW/channels)
- 將本機裝置配對為節點：[節點](/zh-TW/nodes)
- 設定閘道：[閘道設定](/zh-TW/gateway/configuration)

## 相關內容

- [安裝概覽](/zh-TW/install)
- [Azure](/zh-TW/install/azure)
- [VPS 託管](/zh-TW/vps)
