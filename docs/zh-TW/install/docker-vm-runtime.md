---
read_when:
    - 您正在使用 Docker 將 OpenClaw 部署到雲端虛擬機器上
    - 你需要共用的二進位檔建置、持久化與更新流程
summary: 長期執行 OpenClaw 閘道主機的共用 Docker 虛擬機器執行階段步驟
title: Docker 虛擬機器執行階段
x-i18n:
    generated_at: "2026-07-11T21:25:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

適用於以虛擬機器為基礎之 Docker 安裝（例如 GCP、Hetzner 與類似 VPS 供應商）的共用執行階段步驟。

## 將必要的二進位檔預先建置至映像檔中

在執行中的容器內安裝二進位檔是個陷阱：任何在執行階段安裝的項目都會在重新啟動時遺失。請在建置階段，將每個 Skills 所需的所有外部二進位檔預先建置至映像檔中。

以下範例僅涵蓋三個二進位檔，依字母順序排列：

- `gog`（來自 `gogcli`），用於存取 Gmail
- `goplaces`，用於 Google Places
- `wacli`，用於 WhatsApp

這些只是範例，並非完整清單。請使用相同模式，安裝 Skills 所需的所有二進位檔。日後新增需要新二進位檔的 Skills 時：

1. 更新 Dockerfile。
2. 重新建置映像檔。
3. 重新啟動容器。

**Dockerfile 範例**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# 二進位檔範例 1：Gmail 命令列介面（gogcli — 安裝為 `gog`）
# 從 https://github.com/steipete/gogcli/releases 複製目前的 Linux 資產 URL
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# 二進位檔範例 2：Google Places 命令列介面
# 從 https://github.com/steipete/goplaces/releases 複製目前的 Linux 資產 URL
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# 二進位檔範例 3：WhatsApp 命令列介面
# 從 https://github.com/steipete/wacli/releases 複製目前的 Linux 資產 URL
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# 使用相同模式在下方新增更多二進位檔

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
以上 URL 僅為範例。對於採用 ARM 架構的虛擬機器，請選擇 `arm64` 資產。若要確保建置結果可重現，請固定使用含版本號的發行版本 URL。
</Note>

## 建置並啟動

```bash
docker compose build
docker compose up -d openclaw-gateway
```

若在執行 `pnpm install --frozen-lockfile` 期間，建置因 `Killed` 或結束代碼 137 而失敗，表示虛擬機器記憶體不足。請改用更大的機器規格後再重試。

驗證二進位檔：

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

預期輸出：

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

驗證閘道是否已啟動：

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

`/healthz` 傳回 200 回應，表示閘道程序正在監聽且運作正常；映像檔內建的 `HEALTHCHECK` 會輪詢相同端點。

## 各項資料的持久化位置

OpenClaw 在 Docker 中執行，但 Docker 並非資料的權威來源。所有長期保存的狀態都必須能在重新啟動、重新建置及重新開機後持續存在。

| 元件                   | 位置                                                   | 持久化機制               | 備註                                                                                                                  |
| ---------------------- | ------------------------------------------------------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 閘道設定               | `/home/node/.openclaw/`                                | 主機磁碟區掛載           | 包含 `openclaw.json`                                                                                                  |
| 頻道／供應商認證資料   | `/home/node/.openclaw/credentials/`                    | 主機磁碟區掛載           | 頻道與供應商的認證資料                                                                                                |
| 模型驗證設定檔         | `/home/node/.openclaw/agents/`                         | 主機磁碟區掛載           | `agents/<agentId>/agent/auth-profiles.json`（OAuth、API 金鑰）                                                        |
| 舊版 OAuth 金鑰檔案    | `/home/node/.config/openclaw/`                         | 主機磁碟區掛載           | 為移轉前的 OAuth 附屬檔案提供唯讀相容性；`openclaw doctor --fix` 會將其移轉至 `auth-profiles.json`                     |
| Skills 設定            | `/home/node/.openclaw/skills/`                         | 主機磁碟區掛載           | Skills 層級的狀態                                                                                                     |
| 代理程式工作區         | `/home/node/.openclaw/workspace/`                      | 主機磁碟區掛載           | 程式碼與代理程式產出項目                                                                                              |
| WhatsApp 工作階段      | `/home/node/.openclaw/`                                | 主機磁碟區掛載           | 保留 QR 登入狀態                                                                                                      |
| Gmail 金鑰圈           | `/home/node/.openclaw/`                                | 主機磁碟區＋密碼         | 需要 `GOG_KEYRING_PASSWORD`                                                                                           |
| 外掛套件               | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | 主機磁碟區掛載           | 可下載之外掛套件根目錄                                                                                                |
| 外部二進位檔           | `/usr/local/bin/`                                      | Docker 映像檔            | 必須在建置階段預先建置                                                                                                |
| 節點執行階段           | 容器檔案系統                                           | Docker 映像檔            | 每次建置映像檔時都會重新建置                                                                                          |
| 作業系統套件           | 容器檔案系統                                           | Docker 映像檔            | 請勿在執行階段安裝                                                                                                    |
| Docker 容器            | 暫時性                                                 | 可重新啟動               | 可安全銷毀                                                                                                            |

## 更新

若要更新虛擬機器上的 OpenClaw：

```bash
git pull
docker compose build
docker compose up -d
```

## 相關內容

- [Docker](/zh-TW/install/docker)
- [Podman](/zh-TW/install/podman)
- [ClawDock](/zh-TW/install/clawdock)
