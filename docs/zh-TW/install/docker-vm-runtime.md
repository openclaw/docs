---
read_when:
    - 您正在使用 Docker 在雲端 VM 上部署 OpenClaw
    - 你需要共用的二進位檔建置、持久化與更新流程
summary: 長期運作的 OpenClaw Gateway 主機共用 Docker VM 執行階段步驟
title: Docker VM 執行環境
x-i18n:
    generated_at: "2026-04-30T03:13:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01ce5a7e58619da9c9ec97eb1e4f88323ab26f42f40e0a3d655b18019de798dd
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

適用於基於 VM 的 Docker 安裝的共用執行階段步驟，例如 GCP、Hetzner 與類似的 VPS 供應商。

## 將必要的二進位檔內建到映像檔中

在執行中的容器內安裝二進位檔是一個陷阱。
任何在執行階段安裝的內容都會在重新啟動時遺失。

Skills 所需的所有外部二進位檔都必須在映像檔建置時安裝。

以下範例只示範三個常見的二進位檔：

- 用於 Gmail 存取的 `gog`（來自 `gogcli`）
- 用於 Google Places 的 `goplaces`
- 用於 WhatsApp 的 `wacli`

這些是範例，不是完整清單。
你可以使用相同模式安裝所需的任意數量二進位檔。

如果你稍後加入依賴其他二進位檔的新 Skills，必須：

1. 更新 Dockerfile
2. 重建映像檔
3. 重新啟動容器

**範例 Dockerfile**

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
上述 URL 是範例。對於基於 ARM 的 VM，請選擇 `arm64` 資產。若要可重現建置，請釘選版本化的發行 URL。
</Note>

## 建置與啟動

```bash
docker compose build
docker compose up -d openclaw-gateway
```

如果在 `pnpm install --frozen-lockfile` 期間建置失敗並顯示 `Killed` 或 `exit code 137`，表示 VM 記憶體不足。
請改用較大的機器類別後再重試。

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

## 哪些內容會持久保存在哪裡

OpenClaw 在 Docker 中執行，但 Docker 不是事實來源。
所有長期存在的狀態都必須能在重新啟動、重建與重新開機後保留下來。

| 元件                | 位置                                     | 持久化機制             | 備註                                                          |
| ------------------- | ---------------------------------------- | ---------------------- | ------------------------------------------------------------- |
| Gateway 設定        | `/home/node/.openclaw/`                  | 主機磁碟區掛載         | 包含 `openclaw.json`、`.env`                                  |
| 模型驗證設定檔      | `/home/node/.openclaw/agents/`           | 主機磁碟區掛載         | `agents/<agentId>/agent/auth-profiles.json`（OAuth、API 金鑰） |
| Skill 設定          | `/home/node/.openclaw/skills/`           | 主機磁碟區掛載         | Skill 層級狀態                                                |
| Agent 工作區        | `/home/node/.openclaw/workspace/`        | 主機磁碟區掛載         | 程式碼與 Agent 成品                                           |
| WhatsApp 工作階段   | `/home/node/.openclaw/`                  | 主機磁碟區掛載         | 保留 QR 登入                                                  |
| Gmail keyring       | `/home/node/.openclaw/`                  | 主機磁碟區 + 密碼      | 需要 `GOG_KEYRING_PASSWORD`                                   |
| Plugin 執行階段依賴 | `/var/lib/openclaw/plugin-runtime-deps/` | Docker 具名磁碟區      | 產生的內建 Plugin 依賴與執行階段鏡像                         |
| 外部二進位檔        | `/usr/local/bin/`                        | Docker 映像檔          | 必須在建置時內建                                              |
| Node 執行階段       | 容器檔案系統                             | Docker 映像檔          | 每次映像檔建置時重建                                          |
| OS 套件             | 容器檔案系統                             | Docker 映像檔          | 不要在執行階段安裝                                            |
| Docker 容器         | 暫時性                                   | 可重新啟動             | 可安全銷毀                                                    |

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
