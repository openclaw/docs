---
read_when:
    - 你經常使用 Docker 執行 OpenClaw，並希望日常命令更短
    - 你想要一個用於儀表板、日誌、權杖設定和配對流程的輔助層
summary: ClawDock shell 輔助工具，用於基於 Docker 的 OpenClaw 安裝
title: ClawDock
x-i18n:
    generated_at: "2026-07-05T11:22:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock 是用於 Docker 型 OpenClaw 安裝的小型 shell 輔助層。

它提供像 `clawdock-start`、`clawdock-dashboard` 和 `clawdock-fix-token` 這樣的短指令，取代較長的 `docker compose ...` 呼叫。

如果你尚未設定 Docker，請先從 [Docker](/zh-TW/install/docker) 開始。

## 安裝

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你先前是從 `scripts/shell-helpers/clawdock-helpers.sh` 安裝 ClawDock，請從目前的 `scripts/clawdock/clawdock-helpers.sh` 路徑重新安裝；舊的 GitHub raw 路徑已移除。

這些輔助工具會在首次使用時自動偵測你的 OpenClaw checkout（檢查常見路徑，例如 `~/openclaw`、`~/projects/openclaw`），並將結果快取在 `~/.clawdock/config`。如果你的 checkout 位於其他位置，請自行設定 `CLAWDOCK_DIR`。

## 你會得到什麼

### 基本操作

| 指令               | 說明             |
| ------------------ | ---------------- |
| `clawdock-start`   | 啟動閘道         |
| `clawdock-stop`    | 停止閘道         |
| `clawdock-restart` | 重新啟動閘道     |
| `clawdock-status`  | 檢查容器狀態     |
| `clawdock-logs`    | 追蹤閘道日誌     |

### 容器存取

| 指令                      | 說明                              |
| ------------------------- | --------------------------------- |
| `clawdock-shell`          | 在閘道容器內開啟 shell            |
| `clawdock-cli <command>`  | 在 Docker 中執行 OpenClaw 命令列介面指令 |
| `clawdock-exec <command>` | 在容器中執行任意指令              |

### Web 介面與配對

| 指令                    | 說明                   |
| ----------------------- | ---------------------- |
| `clawdock-dashboard`    | 開啟 Control UI URL    |
| `clawdock-devices`      | 列出待處理的裝置配對   |
| `clawdock-approve <id>` | 核准配對請求           |

### 設定與維護

| 指令                 | 說明                         |
| -------------------- | ---------------------------- |
| `clawdock-fix-token` | 將閘道 token 寫入容器設定    |
| `clawdock-update`    | 拉取、重新建置並重新啟動     |
| `clawdock-rebuild`   | 只重新建置 Docker 映像       |
| `clawdock-clean`     | 移除容器與 volume            |

### 工具

| 指令                   | 說明                         |
| ---------------------- | ---------------------------- |
| `clawdock-health`      | 執行閘道健康檢查             |
| `clawdock-token`       | 印出閘道 token               |
| `clawdock-cd`          | 跳至 OpenClaw 專案目錄       |
| `clawdock-config`      | 開啟 `~/.openclaw`           |
| `clawdock-show-config` | 印出已遮蔽值的設定檔         |
| `clawdock-workspace`   | 開啟工作區目錄               |
| `clawdock-help`        | 列出所有 ClawDock 指令       |

## 首次使用流程

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

如果瀏覽器顯示需要配對：

```bash
clawdock-devices
clawdock-approve <request-id>
```

## 設定與密鑰

ClawDock 會讀取兩個獨立的 `.env` 檔案，對應 [Docker](/zh-TW/install/docker) 中描述的分工：

- 專案中位於 `docker-compose.yml` 旁的 `.env`：Docker 專用值，例如映像名稱、連接埠和 `OPENCLAW_GATEWAY_TOKEN`。`clawdock-token` 會從這裡讀取 token。
- `~/.openclaw/.env`（掛載到容器中）：OpenClaw 自身管理、由環境變數支援的密鑰，與 `openclaw.json` 和 `agents/<agentId>/agent/auth-profiles.json` 並存。

`clawdock-fix-token` 會將 token 從專案 `.env` 複製到容器的 `gateway.remote.token` 和 `gateway.auth.token` 設定值，並重新啟動閘道。

使用 `clawdock-show-config` 可快速檢查 `openclaw.json` 和兩個 `.env` 檔案；它會在印出的輸出中遮蔽 `.env` 的值。

## 相關

<CardGroup cols={2}>
  <Card title="Docker" href="/zh-TW/install/docker" icon="docker">
    OpenClaw 的標準 Docker 安裝。
  </Card>
  <Card title="Docker VM runtime" href="/zh-TW/install/docker-vm-runtime" icon="cube">
    由 Docker 管理的 VM 執行階段，用於強化隔離。
  </Card>
  <Card title="Updating" href="/zh-TW/install/updating" icon="arrow-up-right-from-square">
    更新 OpenClaw 套件與受管理服務。
  </Card>
</CardGroup>
