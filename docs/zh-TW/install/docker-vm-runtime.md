---
read_when:
    - 你正在使用 Docker 將 OpenClaw 部署到雲端 VM 上
    - 你需要共用的二進位檔烘焙、持久化與更新流程
summary: 長期執行的 OpenClaw 閘道主機共用 Docker VM 執行階段步驟
title: Docker 虛擬機執行階段
x-i18n:
    generated_at: "2026-07-05T11:22:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

VM 架構 Docker 安裝（例如 GCP、Hetzner 及類似 VPS 提供者）的共用執行階段步驟。

## 將必要二進位檔烘焙進映像檔

在執行中的容器內安裝二進位檔是一個陷阱：任何在執行階段安裝的內容都會在重新啟動時遺失。將 Skills 需要的每個外部二進位檔都在建置時烘焙進映像檔。

以下範例僅涵蓋三個二進位檔，依字母順序排列：

- 用於 Gmail 存取的 `gog`（來自 `gogcli`）
- 用於 Google Places 的 `goplaces`
- 用於 WhatsApp 的 `wacli`

這些是範例，不是完整清單。使用相同模式安裝你的 Skills 所需的所有二進位檔。日後新增需要新二進位檔的 Skills 時：

1. 更新 Dockerfile。
2. 重新建置映像檔。
3. 重新啟動容器。

**Dockerfile 範例**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI (gogcli — installs as `gog`)
# Copy the current Linux asset URL from https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
# Copy the current Linux asset URL from https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
# Copy the current Linux asset URL from https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

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
上述 URL 是範例。對於 ARM 架構 VM，請選擇 `arm64` 資產。若要可重現建置，請釘選含版本號的發行 URL。
</Note>

## 建置與啟動

```bash
docker compose build
docker compose up -d openclaw-gateway
```

如果建置在 `pnpm install --frozen-lockfile` 期間以 `Killed` 或結束碼 137 失敗，表示 VM 記憶體不足。重試前請使用更大的機器類型。

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

驗證閘道已啟動：

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

`/healthz` 回傳 200 回應即確認閘道程序正在監聽且健康；內建映像檔的 `HEALTHCHECK` 會輪詢相同端點。

## 什麼會持久保存在哪裡

OpenClaw 在 Docker 中執行，但 Docker 不是事實來源。所有長期狀態都必須能在重新啟動、重新建置與重新開機後保留下來。

| 元件                   | 位置                                                   | 持久化機制             | 備註                                                                                                                |
| ---------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 閘道設定               | `/home/node/.openclaw/`                                | 主機磁碟區掛載         | 包含 `openclaw.json`                                                                                                |
| 頻道/提供者憑證        | `/home/node/.openclaw/credentials/`                    | 主機磁碟區掛載         | 頻道與提供者憑證材料                                                                                                |
| 模型驗證設定檔         | `/home/node/.openclaw/agents/`                         | 主機磁碟區掛載         | `agents/<agentId>/agent/auth-profiles.json`（OAuth、API 金鑰）                                                       |
| 舊版 OAuth 金鑰檔案    | `/home/node/.config/openclaw/`                         | 主機磁碟區掛載         | 遷移前 OAuth sidecar 的唯讀相容；`openclaw doctor --fix` 會將這些遷移到 `auth-profiles.json`                         |
| Skill 設定             | `/home/node/.openclaw/skills/`                         | 主機磁碟區掛載         | Skill 層級狀態                                                                                                      |
| 代理工作區             | `/home/node/.openclaw/workspace/`                      | 主機磁碟區掛載         | 程式碼與代理產物                                                                                                    |
| WhatsApp 工作階段      | `/home/node/.openclaw/`                                | 主機磁碟區掛載         | 保留 QR 登入                                                                                                        |
| Gmail keyring          | `/home/node/.openclaw/`                                | 主機磁碟區 + 密碼      | 需要 `GOG_KEYRING_PASSWORD`                                                                                         |
| 外掛套件               | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | 主機磁碟區掛載         | 可下載外掛套件根目錄                                                                                                |
| 外部二進位檔           | `/usr/local/bin/`                                      | Docker 映像檔          | 必須在建置時烘焙                                                                                                    |
| 節點執行階段           | 容器檔案系統                                           | Docker 映像檔          | 每次映像檔建置都會重新建置                                                                                          |
| 作業系統套件           | 容器檔案系統                                           | Docker 映像檔          | 不要在執行階段安裝                                                                                                  |
| Docker 容器            | 暫時性                                                 | 可重新啟動             | 可安全刪除                                                                                                          |

## 更新

若要更新 VM 上的 OpenClaw：

```bash
git pull
docker compose build
docker compose up -d
```

## 相關

- [Docker](/zh-TW/install/docker)
- [Podman](/zh-TW/install/podman)
- [ClawDock](/zh-TW/install/clawdock)
