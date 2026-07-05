---
read_when:
    - 你想要 OpenClaw 在 GCP 上全天候 24/7 執行
    - 你想要在自己的 VM 上執行生產等級、永遠在線的閘道
    - 你想要完全掌控持久化、二進位檔與重新啟動行為
summary: 在 GCP Compute Engine VM（Docker）上全天候執行 OpenClaw 閘道，並使用持久狀態
title: GCP
x-i18n:
    generated_at: "2026-07-05T11:30:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

使用 Docker 在 GCP Compute Engine VM 上執行持久化的 OpenClaw 閘道，具備耐久狀態、預先內建的二進位檔，以及安全的重新啟動行為。

價格會因機器類型和區域而異；請選擇符合工作負載的最小 VM，如果遇到 OOM 再向上擴充。

可以透過筆記型電腦的 SSH 連接埠轉送存取閘道，或在你自行管理防火牆與權杖的情況下直接公開連接埠。

本指南在 GCP Compute Engine 上使用 Debian。Ubuntu 也可使用；請對應套件名稱。如需通用 Docker 流程，請參閱 [Docker](/zh-TW/install/docker)。

## 你需要準備

- GCP 帳號（`e2-micro` 符合免費方案資格）
- `gcloud` 命令列介面，或 [Cloud Console](https://console.cloud.google.com)
- 從筆記型電腦進行 SSH 存取
- Docker 與 Docker Compose
- 模型驗證憑證
- 選用的提供者憑證（WhatsApp QR、Telegram Bot 權杖、Gmail OAuth）
- 約 20-30 分鐘

## 快速路徑

1. 建立 GCP 專案，啟用帳單與 Compute Engine API
2. 建立 Compute Engine VM（`e2-small`、Debian 12、20GB）
3. SSH 進入 VM，安裝 Docker
4. 複製 OpenClaw 儲存庫
5. 建立持久化主機目錄
6. 設定 `.env` 與 `docker-compose.yml`
7. 內建必要二進位檔、建置並啟動

<Steps>
  <Step title="安裝 gcloud 命令列介面（或使用 Console）">
    從 [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) 安裝，然後：

    ```bash
    gcloud init
    gcloud auth login
    ```

    或改用 [Cloud Console](https://console.cloud.google.com) 網頁介面完成下方所有步驟。

  </Step>

  <Step title="建立 GCP 專案">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    在 [console.cloud.google.com/billing](https://console.cloud.google.com/billing) 啟用帳單（Compute Engine 必要條件）。

    Console 對應操作：IAM 與管理 > 建立專案，啟用帳單，然後 API 與服務 > 啟用 API >「Compute Engine API」> 啟用。

  </Step>

  <Step title="建立 VM">
    | 類型      | 規格                    | 成本               | 備註                                        |
    | --------- | ------------------------ | ------------------ | --------------------------------------------- |
    | e2-medium | 2 vCPU、4GB RAM          | 約 $25/月          | 最適合本機 Docker 建置的可靠選項              |
    | e2-small  | 2 vCPU、2GB RAM          | 約 $12/月          | Docker 建置的建議最低規格                     |
    | e2-micro  | 2 vCPU（共用）、1GB RAM  | 符合免費方案資格   | Docker 建置常因 OOM 失敗（結束碼 137）        |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="SSH 進入 VM">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Console：在 Compute Engine 儀表板中，點選 VM 旁的「SSH」。

    建立 VM 後，SSH 金鑰傳播可能需要 1-2 分鐘；如果連線遭拒，請等待後重試。

  </Step>

  <Step title="安裝 Docker（在 VM 上）">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    登出後重新登入，讓群組變更生效，然後再次 SSH 進入：

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

    本指南會建置自訂映像檔，讓你內建的任何二進位檔都能在重新啟動後保留。

  </Step>

  <Step title="建立持久化主機目錄">
    Docker 容器是暫時性的；所有長期狀態都必須位於主機上。

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

    設定 `OPENCLAW_GATEWAY_TOKEN`，透過 `.env` 管理穩定的閘道權杖；否則在依賴跨重新啟動的用戶端之前，請先設定 `gateway.auth.token`。如果兩者都未設定，OpenClaw 會在該次啟動使用僅限執行階段的權杖。為 `GOG_KEYRING_PASSWORD` 產生鑰匙圈密碼：

    ```bash
    openssl rand -hex 32
    ```

    **不要提交此檔案。** 它保存容器/執行階段環境，例如 `OPENCLAW_GATEWAY_TOKEN`。已儲存的提供者 OAuth/API 金鑰驗證位於掛載的 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`。

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

    `--allow-unconfigured` 只用於方便啟動設定，不能取代真正的閘道設定。仍請設定驗證（`gateway.auth.token` 或密碼），並為你的部署使用安全的繫結模式。

  </Step>

  <Step title="共用 Docker VM 執行階段步驟">
    依照共用執行階段指南完成通用 Docker 主機流程：

    - [將必要二進位檔內建到映像檔](/zh-TW/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [建置並啟動](/zh-TW/install/docker-vm-runtime#build-and-launch)
    - [哪些內容會持久保存在哪裡](/zh-TW/install/docker-vm-runtime#what-persists-where)
    - [更新](/zh-TW/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP 專屬啟動注意事項">
    如果在 `pnpm install --frozen-lockfile` 期間，建置因 `Killed` 或 `exit code 137` 失敗，代表 VM 記憶體不足。至少使用 `e2-small`，或使用 `e2-medium` 讓首次建置更可靠。

    繫結到 LAN（`OPENCLAW_GATEWAY_BIND=lan`）時，請先設定受信任的瀏覽器來源再繼續：

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    如果你已變更連接埠，請將 `18789` 換成設定的連接埠。

  </Step>

  <Step title="從筆記型電腦存取">
    建立 SSH 通道來轉送閘道連接埠：

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    在瀏覽器中開啟 `http://127.0.0.1:18789/`。

    重新列印乾淨的儀表板連結：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    如果 UI 要求 shared-secret 驗證，請將設定的權杖或密碼貼到 Control UI 設定中（此 Docker 流程預設會寫入權杖；如果你已切換為密碼驗證，請改用設定的密碼）。

    如果 Control UI 顯示 `unauthorized` 或 `disconnected (1008): pairing required`，請核准瀏覽器裝置：

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    如需共用持久化對應表，請參閱 [Docker VM 執行階段](/zh-TW/install/docker-vm-runtime#what-persists-where)，如需更新流程，請參閱[更新流程](/zh-TW/install/docker-vm-runtime#updates)。

  </Step>
</Steps>

## 疑難排解

**SSH 連線遭拒**

建立 VM 後，SSH 金鑰傳播可能需要 1-2 分鐘。請等待後重試。

**OS Login 問題**

檢查你的 OS Login 設定檔：

```bash
gcloud compute os-login describe-profile
```

確認你的帳號具有必要的 IAM 權限（Compute OS Login 或 Compute OS Admin Login）。

**記憶體不足 (OOM)**

如果 Docker 建置因 `Killed` 和 `exit code 137` 失敗，代表 VM 被 OOM 終止：

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

## 服務帳戶（安全性最佳實務）

個人使用時，預設使用者帳戶即可。若用於自動化或 CI/CD，請建立具備最小權限的專用服務帳戶：

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

避免在自動化中使用 Owner 角色；請使用可行的最窄角色。請參閱[瞭解角色](https://cloud.google.com/iam/docs/understanding-roles)。

## 下一步

- 設定訊息通道：[通道](/zh-TW/channels)
- 將本機裝置配對為節點：[節點](/zh-TW/nodes)
- 設定閘道：[閘道設定](/zh-TW/gateway/configuration)

## 相關

- [安裝概覽](/zh-TW/install)
- [Azure](/zh-TW/install/azure)
- [VPS 託管](/zh-TW/vps)
