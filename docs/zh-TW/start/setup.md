---
read_when:
    - 設定新機器
    - 你想要「最新 + 最佳」，又不破壞你的個人設定
summary: OpenClaw 的進階設定與開發工作流程
title: 設定
x-i18n:
    generated_at: "2026-05-07T13:25:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9325ebfc2c5868e44fba18b75ca27cd9333a8bc7072e933468e1608dde487a8e
    source_path: start/setup.md
    workflow: 16
---

<Note>
如果你是第一次設定，請從[入門指南](/zh-TW/start/getting-started)開始。
如需上手設定詳細資料，請參閱[上手設定（CLI）](/zh-TW/start/wizard)。
</Note>

## 重點摘要

根據你想要多常更新，以及是否想自己執行 Gateway，選擇設定工作流程：

- **客製化設定位於 repo 之外：**將你的設定與工作區保存在 `~/.openclaw/openclaw.json` 和 `~/.openclaw/workspace/`，這樣 repo 更新就不會影響它們。
- **穩定工作流程（多數情況建議）：**安裝 macOS app，並讓它執行內建的 Gateway。
- **前沿工作流程（開發）：**透過 `pnpm gateway:watch` 自行執行 Gateway，然後讓 macOS app 以本機模式連接。

## 先決條件（從原始碼）

- 建議使用 Node 24（Node 22 LTS，目前為 `22.16+`，仍受支援）
- 原始碼 checkout 需要 `pnpm`。OpenClaw 在開發模式中會從
  `extensions/*` pnpm workspace 套件載入內建 plugins，因此根目錄的 `npm install`
  不會準備完整的原始碼樹。
- Docker（選用；僅用於容器化設定/e2e - 請參閱 [Docker](/zh-TW/install/docker)）

## 客製化策略（讓更新不造成傷害）

如果你想要「100% 為我量身打造」_並且_ 容易更新，請將你的客製化內容保存在：

- **設定：**`~/.openclaw/openclaw.json`（JSON/類 JSON5）
- **工作區：**`~/.openclaw/workspace`（skills、prompts、memories；把它做成私人 git repo）

只需 bootstrap 一次：

```bash
openclaw setup
```

在這個 repo 內，請使用本機 CLI 入口：

```bash
openclaw setup
```

如果你還沒有全域安裝，請透過 `pnpm openclaw setup` 執行。

## 從這個 repo 執行 Gateway

在 `pnpm build` 之後，你可以直接執行打包後的 CLI：

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 穩定工作流程（先使用 macOS app）

1. 安裝並啟動 **OpenClaw.app**（選單列）。
2. 完成上手設定/權限檢查清單（TCC 提示）。
3. 確認 Gateway 為**本機**且正在執行（由 app 管理）。
4. 連結介面（範例：WhatsApp）：

```bash
openclaw channels login
```

5. 基本檢查：

```bash
openclaw health
```

如果你的建置中沒有上手設定：

- 執行 `openclaw setup`，接著執行 `openclaw channels login`，然後手動啟動 Gateway（`openclaw gateway`）。

## 前沿工作流程（在終端機中執行 Gateway）

目標：開發 TypeScript Gateway、取得熱重新載入，並保持 macOS app UI 已連接。

### 0)（選用）也從原始碼執行 macOS app

如果你也想使用前沿版 macOS app：

```bash
./scripts/restart-mac.sh
```

### 1) 啟動開發版 Gateway

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` 會在具名 tmux
工作階段中啟動或重新啟動 Gateway 監看程序，並從互動式終端機自動 attach。非互動式 shell 會維持
detached 並印出 `tmux attach -t openclaw-gateway-watch-main`；使用
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` 讓互動式執行維持
detached，或使用 `pnpm gateway:watch:raw` 進行前景監看模式。監看器會在相關原始碼、設定與內建 plugin 中繼資料變更時
重新載入。如果受監看的 Gateway 在啟動期間結束，`gateway:watch` 會執行一次
`openclaw doctor --fix --non-interactive` 並重試；設定
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` 可停用這個僅限開發的修復流程。
`pnpm openclaw setup` 是新 checkout 的一次性本機設定/工作區初始化步驟。
`pnpm gateway:watch` 不會重新建置 `dist/control-ui`，因此在 `ui/` 變更後請重新執行 `pnpm ui:build`，或在開發 Control UI 時使用 `pnpm ui:dev`。

### 2) 將 macOS app 指向正在執行的 Gateway

在 **OpenClaw.app** 中：

- 連線模式：**本機**
  app 會連接到設定連接埠上正在執行的 gateway。

### 3) 驗證

- app 內 Gateway 狀態應顯示 **「正在使用現有 gateway …」**
- 或透過 CLI：

```bash
openclaw health
```

### 常見誤區

- **連接埠錯誤：**Gateway WS 預設為 `ws://127.0.0.1:18789`；請讓 app 和 CLI 使用相同連接埠。
- **狀態存放位置：**
  - Channel/provider 狀態：`~/.openclaw/credentials/`
  - Model auth profiles：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessions：`~/.openclaw/agents/<agentId>/sessions/`
  - Logs：`/tmp/openclaw/`

## 認證儲存對照表

偵錯 auth 或決定要備份哪些內容時，請使用這份對照表：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**：設定/env 或 `channels.telegram.tokenFile`（僅限一般檔案；symlinks 會被拒絕）
- **Discord bot token**：設定/env 或 SecretRef（env/file/exec providers）
- **Slack tokens**：設定/env（`channels.slack.*`）
- **配對允許清單**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（預設帳號）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非預設帳號）
- **Model auth profiles**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **檔案支援的 secrets payload（選用）**：`~/.openclaw/secrets.json`
- **舊版 OAuth 匯入**：`~/.openclaw/credentials/oauth.json`
  更多詳細資料：[安全性](/zh-TW/gateway/security#credential-storage-map)。

## 更新（不破壞你的設定）

- 將 `~/.openclaw/workspace` 和 `~/.openclaw/` 視為「你的東西」；不要把個人 prompts/設定放進 `openclaw` repo。
- 更新原始碼：`git pull` + `pnpm install` + 繼續使用 `pnpm gateway:watch`。

## Linux（systemd user service）

Linux 安裝會使用 systemd **使用者**服務。預設情況下，systemd 會在登出/閒置時停止使用者
服務，這會終止 Gateway。上手設定會嘗試為你啟用
lingering（可能會提示 sudo）。如果它仍然關閉，請執行：

```bash
sudo loginctl enable-linger $USER
```

對於永遠在線或多使用者伺服器，請考慮使用**系統**服務，而不是
使用者服務（不需要 lingering）。systemd 注意事項請參閱 [Gateway runbook](/zh-TW/gateway)。

## 相關文件

- [Gateway runbook](/zh-TW/gateway)（flags、supervision、ports）
- [Gateway 設定](/zh-TW/gateway/configuration)（設定 schema + 範例）
- [Discord](/zh-TW/channels/discord) 和 [Telegram](/zh-TW/channels/telegram)（reply tags + replyToMode 設定）
- [OpenClaw assistant 設定](/zh-TW/start/openclaw)
- [macOS app](/zh-TW/platforms/macos)（gateway 生命週期）
