---
read_when:
    - 您希望 OpenClaw 在雲端 VPS 上 24/7 全天候執行（而不是在您的筆記型電腦上）
    - 你想在自己的 VPS 上部署生產級、全天候運作的 Gateway
    - 你想要完全控制持久化、二進位檔與重新啟動行為
    - 您正在 Hetzner 或類似供應商上以 Docker 執行 OpenClaw
summary: 在低成本 Hetzner VPS（Docker）上全天候執行 OpenClaw Gateway，搭配持久狀態與預先內建的二進位檔
title: Hetzner
x-i18n:
    generated_at: "2026-04-30T03:14:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96b5b54bfd8d976c575ecffcd229106fc322b9a53828a9d7358f583434b7bbc2
    source_path: install/hetzner.md
    workflow: 16
---

# 在 Hetzner 上執行 OpenClaw（Docker，正式環境 VPS 指南）

## 目標

使用 Docker 在 Hetzner VPS 上執行持續運作的 OpenClaw Gateway，具備持久狀態、內建二進位檔，以及安全的重新啟動行為。

如果你想要「每月約 $5 的 OpenClaw 24/7」，這是最簡單可靠的設定。
Hetzner 價格會變動；請選擇最小的 Debian/Ubuntu VPS，若遇到 OOM 再向上擴充。

安全模型提醒：

- 當所有人都在相同信任邊界內，且執行環境僅供業務使用時，公司共用代理是可以接受的。
- 保持嚴格隔離：專用 VPS/執行環境 + 專用帳號；不要在該主機上使用個人 Apple/Google/瀏覽器/密碼管理器設定檔。
- 如果使用者彼此之間存在對抗風險，請依 Gateway/主機/OS 使用者拆分。

請參閱 [安全性](/zh-TW/gateway/security) 和 [VPS 託管](/zh-TW/vps)。

## 我們要做什麼（簡單來說）？

- 租用一台小型 Linux 伺服器（Hetzner VPS）
- 安裝 Docker（隔離的應用程式執行環境）
- 在 Docker 中啟動 OpenClaw Gateway
- 將 `~/.openclaw` + `~/.openclaw/workspace` 持久化在主機上（重新啟動/重建後仍保留）
- 透過 SSH 通道從你的筆電存取控制 UI

掛載的 `~/.openclaw` 狀態包含 `openclaw.json`、每個代理的
`agents/<agentId>/agent/auth-profiles.json`，以及 `.env`。

Gateway 可透過以下方式存取：

- 從你的筆電使用 SSH 連接埠轉發
- 如果你自行管理防火牆和權杖，也可以直接公開連接埠

本指南假設你在 Hetzner 上使用 Ubuntu 或 Debian。  
如果你使用其他 Linux VPS，請對應調整套件。
通用 Docker 流程請參閱 [Docker](/zh-TW/install/docker)。

---

## 快速路徑（有經驗的操作者）

1. 佈建 Hetzner VPS
2. 安裝 Docker
3. 複製 OpenClaw 儲存庫
4. 建立持久化主機目錄
5. 設定 `.env` 和 `docker-compose.yml`
6. 將必要二進位檔烘焙進映像檔
7. `docker compose up -d`
8. 驗證持久化和 Gateway 存取

---

## 你需要準備

- 具 root 存取權的 Hetzner VPS
- 從你的筆電進行 SSH 存取
- 基本熟悉 SSH + 複製/貼上
- 約 20 分鐘
- Docker 和 Docker Compose
- 模型驗證憑證
- 選用的供應商憑證
  - WhatsApp QR
  - Telegram bot 權杖
  - Gmail OAuth

---

<Steps>
  <Step title="佈建 VPS">
    在 Hetzner 中建立 Ubuntu 或 Debian VPS。

    以 root 連線：

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    本指南假設 VPS 是有狀態的。
    不要把它當作可丟棄的基礎設施。

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

    本指南假設你會建置自訂映像檔，以保證二進位檔持久存在。

  </Step>

  <Step title="建立持久化主機目錄">
    Docker 容器是暫時性的。
    所有長期存在的狀態都必須存放在主機上。

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="設定環境變數">
    在儲存庫根目錄建立 `.env`。

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

    除非你明確想透過 `.env` 管理，否則請將 `OPENCLAW_GATEWAY_TOKEN` 留空；OpenClaw 會在首次啟動時將隨機 Gateway 權杖寫入設定。產生一組鑰匙圈密碼並貼入
    `GOG_KEYRING_PASSWORD`：

    ```bash
    openssl rand -hex 32
    ```

    **不要提交此檔案。**

    這個 `.env` 檔案用於容器/執行環境 env，例如 `OPENCLAW_GATEWAY_TOKEN`。
    已儲存的供應商 OAuth/API-key 驗證位於掛載的
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

    `--allow-unconfigured` 僅用於方便初始啟動，它不能取代正確的 Gateway 設定。仍請設定驗證（`gateway.auth.token` 或密碼），並為你的部署使用安全的綁定位址設定。

  </Step>

  <Step title="共用 Docker VM 執行環境步驟">
    使用共用執行環境指南完成常見的 Docker 主機流程：

    - [將必要二進位檔烘焙進映像檔](/zh-TW/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [建置並啟動](/zh-TW/install/docker-vm-runtime#build-and-launch)
    - [哪些內容會持久化在哪裡](/zh-TW/install/docker-vm-runtime#what-persists-where)
    - [更新](/zh-TW/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner 專屬存取">
    完成共用建置與啟動步驟後，請完成下列設定以開啟通道：

    **先決條件：**確認你的 VPS sshd 設定允許 TCP 轉發。如果你
    已強化 SSH 設定，請檢查 `/etc/ssh/sshd_config` 並設定：

    ```
    AllowTcpForwarding local
    ```

    `local` 允許從你的筆電使用 `ssh -L` 本機轉發，同時封鎖
    從伺服器發起的遠端轉發。設定為 `no` 會導致通道失敗，
    並顯示：
    `channel 3: open failed: administratively prohibited: open failed`

    確認 TCP 轉發已啟用後，重新啟動 SSH 服務
    (`systemctl restart ssh`)，並從你的筆電執行通道：

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    開啟：

    `http://127.0.0.1:18789/`

    貼上已設定的共用密鑰。本指南預設使用 Gateway 權杖；
    如果你改用密碼驗證，請改用該密碼。

  </Step>
</Steps>

共用持久化對照表位於 [Docker VM 執行環境](/zh-TW/install/docker-vm-runtime#what-persists-where)。

## 基礎設施即程式碼（Terraform）

對偏好基礎設施即程式碼工作流程的團隊，社群維護的 Terraform 設定提供：

- 具遠端狀態管理的模組化 Terraform 設定
- 透過 cloud-init 自動佈建
- 部署指令碼（bootstrap、deploy、backup/restore）
- 安全強化（防火牆、UFW、僅限 SSH 存取）
- 用於 Gateway 存取的 SSH 通道設定

**儲存庫：**

- 基礎設施：[openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker 設定：[openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

此方法以可重現部署、版本控制的基礎設施，以及自動化災難復原，補足上方的 Docker 設定。

<Note>
由社群維護。如有問題或想要貢獻，請參閱上方的儲存庫連結。
</Note>

## 後續步驟

- 設定訊息通道：[通道](/zh-TW/channels)
- 設定 Gateway：[Gateway 設定](/zh-TW/gateway/configuration)
- 讓 OpenClaw 保持最新：[更新](/zh-TW/install/updating)

## 相關

- [安裝概覽](/zh-TW/install)
- [Fly.io](/zh-TW/install/fly)
- [Docker](/zh-TW/install/docker)
- [VPS 託管](/zh-TW/vps)
