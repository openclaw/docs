---
read_when:
    - 你想讓 OpenClaw 在雲端 VPS 上 24/7 執行（而不是在你的筆電上）
    - 你想在自己的 VPS 上使用生產級、永遠在線的閘道
    - 你想要完全控制持久化、二進位檔和重新啟動行為
    - 你正在 Hetzner 或類似供應商上的 Docker 中執行 OpenClaw
summary: 在便宜的 Hetzner VPS（Docker）上全天候執行 OpenClaw 閘道，具備持久狀態與內建二進位檔
title: Hetzner
x-i18n:
    generated_at: "2026-07-05T11:26:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

使用 Docker 在 Hetzner VPS 上執行持久性的 OpenClaw 閘道，具備耐久狀態、內建二進位檔，以及安全的重新啟動行為。

Hetzner 價格會變動；請選擇符合需求的最小 Debian/Ubuntu VPS，若遇到 OOM 再向上擴充。

可以從你的筆電透過 SSH 連接埠轉送存取閘道，或者在你自行管理防火牆與權杖時直接公開連接埠。

安全模型提醒：

- 公司共用代理在所有人都位於相同信任邊界且執行階段僅供業務使用時是可行的。
- 保持嚴格隔離：專用 VPS/執行階段 + 專用帳號；該主機上不要放個人的 Apple/Google/瀏覽器/密碼管理器設定檔。
- 如果使用者彼此之間可能互相對抗，請依閘道/主機/作業系統使用者分開。

請參閱[安全性](/zh-TW/gateway/security)和 [VPS 託管](/zh-TW/vps)。

本指南假設在 Hetzner 上使用 Ubuntu 或 Debian。在其他 Linux VPS 上，請對應調整套件。一般 Docker 流程請參閱 [Docker](/zh-TW/install/docker)。

## 你需要準備

- 具備 root 存取權的 Hetzner VPS
- 從筆電進行 SSH 存取
- Docker 和 Docker Compose
- 模型驗證憑證
- 選用的提供者憑證（WhatsApp QR、Telegram Bot 權杖、Gmail OAuth）
- 約 20 分鐘

## 快速路徑

1. 佈建 Hetzner VPS
2. 安裝 Docker
3. 複製 OpenClaw 儲存庫
4. 建立持久性主機目錄
5. 設定 `.env` 和 `docker-compose.yml`
6. 將必要二進位檔內建到映像檔
7. `docker compose up -d`
8. 驗證持久性和閘道存取

<Steps>
  <Step title="佈建 VPS">
    在 Hetzner 建立 Ubuntu 或 Debian VPS，然後以 root 連線：

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    請將 VPS 視為有狀態基礎設施，而非可拋棄式基礎設施。

  </Step>

  <Step title="安裝 Docker（在 VPS 上）">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
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

    本指南會建置自訂映像檔，讓你內建的任何二進位檔在重新啟動後仍會保留。

  </Step>

  <Step title="建立持久性主機目錄">
    Docker 容器是暫時性的；所有長期保存的狀態都必須位於主機上。

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="設定環境變數">
    在儲存庫根目錄建立 `.env`：

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    設定 `OPENCLAW_GATEWAY_TOKEN`，透過 `.env` 管理穩定的閘道權杖；否則在依賴跨重新啟動的用戶端之前，請先設定 `gateway.auth.token`。如果兩者都未設定，OpenClaw 會在該次啟動使用僅限執行階段的權杖。為 `GOG_KEYRING_PASSWORD` 產生鑰匙圈密碼：

    ```bash
    openssl rand -hex 32
    ```

    **不要提交此檔案。** 它包含容器/執行階段環境變數，例如 `OPENCLAW_GATEWAY_TOKEN`。已儲存的提供者 OAuth/API 金鑰驗證會位於掛載的 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`。

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
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
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

    `--allow-unconfigured` 只為了方便啟動設定，不能取代真正的閘道設定。仍請為你的部署設定驗證（`gateway.auth.token` 或密碼）和安全的繫結模式。

  </Step>

  <Step title="共用 Docker VM 執行階段步驟">
    依照共用執行階段指南完成常見的 Docker 主機流程：

    - [將必要二進位檔內建到映像檔](/zh-TW/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [建置並啟動](/zh-TW/install/docker-vm-runtime#build-and-launch)
    - [哪些內容會在哪裡持久保存](/zh-TW/install/docker-vm-runtime#what-persists-where)
    - [更新](/zh-TW/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner 專屬存取">
    完成共用建置與啟動步驟後，開啟通道。

    **必要條件：** 確認你的 VPS sshd 設定允許 TCP 轉送。如果你已強化 SSH 設定，請檢查 `/etc/ssh/sshd_config` 並設定：

    ```text
    AllowTcpForwarding local
    ```

    `local` 允許從你的筆電使用 `ssh -L` 本機轉送，同時封鎖來自伺服器的遠端轉送。將其設為 `no` 會使通道失敗並顯示：`channel 3: open failed: administratively prohibited: open failed`

    確認 TCP 轉送已啟用後，重新啟動 SSH 服務（`systemctl restart ssh`），並從你的筆電執行通道：

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    開啟 `http://127.0.0.1:18789/` 並貼上已設定的共用密鑰。本指南預設使用閘道權杖；如果你已改用密碼驗證，請改用你設定的密碼。

  </Step>
</Steps>

共用持久性對照表位於 [Docker VM 執行階段](/zh-TW/install/docker-vm-runtime#what-persists-where)。

## 基礎設施即程式碼（Terraform）

對於偏好基礎設施即程式碼工作流程的團隊，社群維護的 Terraform 設定提供：

- 具備遠端狀態管理的模組化 Terraform 設定
- 透過 cloud-init 自動佈建
- 部署指令碼（啟動設定、部署、備份/還原）
- 安全強化（防火牆、UFW、僅限 SSH 存取）
- 用於閘道存取的 SSH 通道設定

**儲存庫：**

- 基礎設施：[openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker 設定：[openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

此方法以可重現部署、版本控管基礎設施，以及自動災難復原補充上述 Docker 設定。

<Note>
由社群維護。若有問題或想貢獻，請參閱上方儲存庫連結。
</Note>

## 後續步驟

- 設定訊息頻道：[頻道](/zh-TW/channels)
- 設定閘道：[閘道設定](/zh-TW/gateway/configuration)
- 讓 OpenClaw 保持最新：[更新](/zh-TW/install/updating)

## 相關

- [安裝概覽](/zh-TW/install)
- [Fly.io](/zh-TW/install/fly)
- [Docker](/zh-TW/install/docker)
- [VPS 託管](/zh-TW/vps)
