---
read_when:
    - 你經常使用 Docker 執行 OpenClaw，並想要更簡短的日常命令
    - 你需要一個用於儀表板、記錄、權杖設定和配對流程的輔助層
summary: 適用於基於 Docker 的 OpenClaw 安裝的 ClawDock 殼層輔助工具
title: ClawDock
x-i18n:
    generated_at: "2026-05-06T02:50:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82d31ba74694cda9e195534ce33f7b61343546f174ceacd2607aeb1d5487229e
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock 是用於基於 Docker 的 OpenClaw 安裝的小型 shell 輔助層。

它提供像 `clawdock-start`、`clawdock-dashboard` 和 `clawdock-fix-token` 這樣的簡短命令，取代較長的 `docker compose ...` 呼叫。

如果你尚未設定 Docker，請從 [Docker](/zh-TW/install/docker) 開始。

## 安裝

使用標準輔助程式路徑：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你之前是從 `scripts/shell-helpers/clawdock-helpers.sh` 安裝 ClawDock，請改從新的 `scripts/clawdock/clawdock-helpers.sh` 路徑重新安裝。舊的原始 GitHub 路徑已移除。

## 你會取得的功能

### 基本操作

| Command            | 說明                   |
| ------------------ | ---------------------- |
| `clawdock-start`   | 啟動 Gateway           |
| `clawdock-stop`    | 停止 Gateway           |
| `clawdock-restart` | 重新啟動 Gateway       |
| `clawdock-status`  | 檢查容器狀態           |
| `clawdock-logs`    | 跟隨 Gateway 日誌      |

### 容器存取

| Command                   | 說明                                |
| ------------------------- | ----------------------------------- |
| `clawdock-shell`          | 在 Gateway 容器內開啟 shell         |
| `clawdock-cli <command>`  | 在 Docker 中執行 OpenClaw CLI 命令  |
| `clawdock-exec <command>` | 在容器中執行任意命令                |

### Web UI 和配對

| Command                 | 說明                       |
| ----------------------- | -------------------------- |
| `clawdock-dashboard`    | 開啟 Control UI URL        |
| `clawdock-devices`      | 列出待處理的裝置配對       |
| `clawdock-approve <id>` | 核准配對請求               |

### 設定與維護

| Command              | 說明                                   |
| -------------------- | -------------------------------------- |
| `clawdock-fix-token` | 在容器內設定 Gateway token             |
| `clawdock-update`    | 拉取、重新建置並重新啟動               |
| `clawdock-rebuild`   | 僅重新建置 Docker 映像                 |
| `clawdock-clean`     | 移除容器和 volume                      |

### 公用工具

| Command                | 說明                                   |
| ---------------------- | -------------------------------------- |
| `clawdock-health`      | 執行 Gateway 健康檢查                  |
| `clawdock-token`       | 列印 Gateway token                     |
| `clawdock-cd`          | 跳至 OpenClaw 專案目錄                 |
| `clawdock-config`      | 開啟 `~/.openclaw`                     |
| `clawdock-show-config` | 列印已遮蔽值的設定檔                   |
| `clawdock-workspace`   | 開啟工作區目錄                         |

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

## 設定與 secrets

ClawDock 使用與 [Docker](/zh-TW/install/docker) 中描述的相同 Docker 設定分離方式：

- `<project>/.env` 用於 Docker 專用值，例如映像名稱、連接埠和 Gateway token
- `~/.openclaw/.env` 用於以環境變數支援的供應商金鑰和 bot token
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 用於儲存的供應商 OAuth/API-key 驗證
- `~/.openclaw/openclaw.json` 用於行為設定

當你想快速檢查 `.env` 檔案和 `openclaw.json` 時，請使用 `clawdock-show-config`。它會在列印輸出中遮蔽 `.env` 值。

## 相關

<CardGroup cols={2}>
  <Card title="Docker" href="/zh-TW/install/docker" icon="docker">
    OpenClaw 的標準 Docker 安裝。
  </Card>
  <Card title="Docker VM runtime" href="/zh-TW/install/docker-vm-runtime" icon="cube">
    用於強化隔離的 Docker 管理 VM 執行階段。
  </Card>
  <Card title="Updating" href="/zh-TW/install/updating" icon="arrow-up-right-from-square">
    更新 OpenClaw 套件和受管理服務。
  </Card>
</CardGroup>
