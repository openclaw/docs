---
read_when:
    - 您正在使用 Docker 在雲端 VM 上部署 OpenClaw
    - 你需要共用的二進位檔建置、持久化與更新流程
summary: 長期執行的 OpenClaw Gateway 主機共用 Docker VM 執行階段步驟
title: Docker VM 執行階段
x-i18n:
    generated_at: "2026-05-02T02:53:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7489d42e01199a7b5e6f3b98dcfe624d1b3133ef1682dda764b2c8ddd1324e78
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

供 GCP、Hetzner 與類似 VPS 供應商等基於 VM 的 Docker 安裝使用的共用執行階段步驟。

## 將必要的二進位檔內建到映像檔

在執行中的容器內安裝二進位檔是個陷阱。
任何在執行階段安裝的內容，都會在重新啟動時遺失。

Skills 所需的所有外部二進位檔，都必須在映像檔建置期間安裝。

以下範例只示範三個常見的二進位檔：

- 用於 Gmail 存取的 `gog`（來自 `gogcli`）
- 用於 Google Places 的 `goplaces`
- 用於 WhatsApp 的 `wacli`

這些只是範例，不是完整清單。
你可以使用相同模式安裝所需的任意數量二進位檔。

如果你之後新增依賴其他二進位檔的 Skills，則必須：

1. 更新 Dockerfile
2. 重新建置映像檔
3. 重新啟動容器

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
上述 URL 是範例。對於基於 ARM 的 VM，請選擇 `arm64` 資產。若要可重現的建置，請固定使用帶版本的發布 URL。
</Note>

## 建置並啟動

```bash
docker compose build
docker compose up -d openclaw-gateway
```

如果建置在 `pnpm install --frozen-lockfile` 期間以 `Killed` 或 `exit code 137` 失敗，表示 VM 記憶體不足。
請改用更大的機器等級後再重試。

驗證二進位檔：

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

預期輸出：

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

驗證 Gateway：

```bash
docker compose logs -f openclaw-gateway
```

預期輸出：

```
[gateway] listening on ws://0.0.0.0:18789
```

## 什麼會持久化到哪裡

OpenClaw 在 Docker 中執行，但 Docker 不是真實來源。
所有長期狀態都必須能在重新啟動、重新建置與重開機後保留下來。

| 元件                | 位置                                                   | 持久化機制             | 備註                                                          |
| ------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------- |
| Gateway 設定        | `/home/node/.openclaw/`                                | 主機磁碟區掛載         | 包含 `openclaw.json`、`.env`                                  |
| 模型驗證設定檔      | `/home/node/.openclaw/agents/`                         | 主機磁碟區掛載         | `agents/<agentId>/agent/auth-profiles.json`（OAuth、API keys） |
| Skill 設定          | `/home/node/.openclaw/skills/`                         | 主機磁碟區掛載         | Skill 層級狀態                                                |
| Agent 工作區        | `/home/node/.openclaw/workspace/`                      | 主機磁碟區掛載         | 程式碼與 agent 成品                                           |
| WhatsApp 工作階段   | `/home/node/.openclaw/`                                | 主機磁碟區掛載         | 保留 QR 登入                                                  |
| Gmail keyring       | `/home/node/.openclaw/`                                | 主機磁碟區 + 密碼      | 需要 `GOG_KEYRING_PASSWORD`                                   |
| Plugin 套件         | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | 主機磁碟區掛載         | 可下載的 Plugin 套件根目錄                                    |
| 外部二進位檔        | `/usr/local/bin/`                                      | Docker 映像檔          | 必須在建置期間內建                                            |
| Node 執行階段       | 容器檔案系統                                           | Docker 映像檔          | 每次映像檔建置都會重新建置                                    |
| OS 套件             | 容器檔案系統                                           | Docker 映像檔          | 不要在執行階段安裝                                            |
| Docker 容器         | 暫時性                                                 | 可重新啟動             | 可安全銷毀                                                    |

## 更新

若要在 VM 上更新 OpenClaw：

```bash
git pull
docker compose build
docker compose up -d
```

## 相關

- [Docker](/zh-TW/install/docker)
- [Podman](/zh-TW/install/podman)
- [ClawDock](/zh-TW/install/clawdock)
