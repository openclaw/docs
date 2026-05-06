---
read_when:
    - 設定新機器
    - 你想要「最新且最強」而不破壞你的個人設定
summary: OpenClaw 的進階設定與開發工作流程
title: 設定
x-i18n:
    generated_at: "2026-05-06T09:20:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99b65443deac92ed74d2fb0d8db9a00bf81b37d60ce25c0c38c1f8d9a7c0cfd3
    source_path: start/setup.md
    workflow: 16
---

<Note>
如果你是第一次設定，請從[快速入門](/zh-TW/start/getting-started)開始。
如需上手流程的詳細資訊，請參閱[上手流程 (CLI)](/zh-TW/start/wizard)。
</Note>

## TL;DR

請根據你想要更新的頻率，以及是否想自行執行 Gateway，選擇設定工作流程：

- **客製化內容位於 repo 外部：** 將你的設定和工作區保存在 `~/.openclaw/openclaw.json` 和 `~/.openclaw/workspace/`，這樣 repo 更新就不會影響它們。
- **穩定工作流程（建議多數使用者採用）：** 安裝 macOS 應用程式，並讓它執行內建的 Gateway。
- **前沿工作流程（開發）：** 透過 `pnpm gateway:watch` 自行執行 Gateway，然後讓 macOS 應用程式以本機模式連接。

## 前置需求（從原始碼）

- 建議使用 Node 24（仍支援 Node 22 LTS，目前為 `22.14+`）
- 原始碼 checkout 需要 `pnpm`。在開發模式中，OpenClaw 會從
  `extensions/*` pnpm 工作區套件載入內建 plugins，因此在根目錄執行 `npm install`
  不會準備完整的原始碼樹。
- Docker（選用；僅用於容器化設定/e2e - 請參閱 [Docker](/zh-TW/install/docker)）

## 客製化策略（避免更新造成問題）

如果你想要「100% 依自己需求客製化」_同時_ 輕鬆更新，請將自訂內容保存在：

- **設定：** `~/.openclaw/openclaw.json`（JSON/近似 JSON5）
- **工作區：** `~/.openclaw/workspace`（skills、prompts、memories；可將其設為私有 git repo）

先啟動一次：

```bash
openclaw setup
```

在此 repo 內，請使用本機 CLI 入口：

```bash
openclaw setup
```

如果你還沒有全域安裝，請透過 `pnpm openclaw setup` 執行。

## 從此 repo 執行 Gateway

在 `pnpm build` 之後，你可以直接執行封裝好的 CLI：

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 穩定工作流程（先使用 macOS 應用程式）

1. 安裝並啟動 **OpenClaw.app**（選單列）。
2. 完成上手流程/權限檢查清單（TCC 提示）。
3. 確認 Gateway 為 **Local** 且正在執行（由應用程式管理）。
4. 連結介面（範例：WhatsApp）：

```bash
openclaw channels login
```

5. 健全性檢查：

```bash
openclaw health
```

如果你的建置中無法使用上手流程：

- 執行 `openclaw setup`，接著執行 `openclaw channels login`，然後手動啟動 Gateway（`openclaw gateway`）。

## 前沿工作流程（在終端機中執行 Gateway）

目標：開發 TypeScript Gateway、取得熱重載，並讓 macOS 應用程式 UI 保持連接。

### 0)（選用）也從原始碼執行 macOS 應用程式

如果你也想讓 macOS 應用程式使用前沿版本：

```bash
./scripts/restart-mac.sh
```

### 1) 啟動開發版 Gateway

```bash
pnpm install
# 僅第一次執行（或重設本機 OpenClaw 設定/工作區後）
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` 會在具名 tmux
session 中啟動或重新啟動 Gateway 監看程序，並在互動式終端機中自動附加。非互動式 shell 會保持
分離狀態，並印出 `tmux attach -t openclaw-gateway-watch-main`；使用
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` 可讓互動式執行
保持分離，或使用 `pnpm gateway:watch:raw` 以前景監看模式執行。監看器
會在相關原始碼、設定與內建 Plugin 中繼資料變更時重新載入。如果被
監看的 Gateway 在啟動期間結束，`gateway:watch` 會執行一次
`openclaw doctor --fix --non-interactive` 並重試；設定
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` 可停用這個僅供開發使用的修復流程。
`pnpm openclaw setup` 是新 checkout 的一次性本機設定/工作區初始化步驟。
`pnpm gateway:watch` 不會重新建置 `dist/control-ui`，因此在 `ui/` 變更後請重新執行 `pnpm ui:build`，或在開發 Control UI 時使用 `pnpm ui:dev`。

### 2) 將 macOS 應用程式指向正在執行的 Gateway

在 **OpenClaw.app** 中：

- 連線模式：**Local**
  應用程式會連接到設定連接埠上正在執行的 Gateway。

### 3) 驗證

- 應用程式內的 Gateway 狀態應顯示 **「Using existing gateway …」**
- 或透過 CLI：

```bash
openclaw health
```

### 常見陷阱

- **連接埠錯誤：** Gateway WS 預設為 `ws://127.0.0.1:18789`；請讓應用程式與 CLI 使用相同連接埠。
- **狀態儲存位置：**
  - Channel/provider 狀態：`~/.openclaw/credentials/`
  - 模型驗證設定檔：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessions：`~/.openclaw/agents/<agentId>/sessions/`
  - Logs：`/tmp/openclaw/`

## 認證儲存對照表

在偵錯驗證或決定要備份哪些內容時使用：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**：config/env 或 `channels.telegram.tokenFile`（僅一般檔案；拒絕 symlinks）
- **Discord bot token**：config/env 或 SecretRef（env/file/exec providers）
- **Slack tokens**：config/env（`channels.slack.*`）
- **配對允許清單**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（預設帳號）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非預設帳號）
- **模型驗證設定檔**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **檔案支援的 secrets payload（選用）**：`~/.openclaw/secrets.json`
- **舊版 OAuth 匯入**：`~/.openclaw/credentials/oauth.json`
  更多詳細資訊：[安全性](/zh-TW/gateway/security#credential-storage-map)。

## 更新（不破壞你的設定）

- 將 `~/.openclaw/workspace` 和 `~/.openclaw/` 視為「你的內容」；不要將個人 prompts/config 放進 `openclaw` repo。
- 更新原始碼：`git pull` + `pnpm install` + 繼續使用 `pnpm gateway:watch`。

## Linux（systemd 使用者服務）

Linux 安裝會使用 systemd **使用者**服務。預設情況下，systemd 會在登出/閒置時停止使用者
服務，這會終止 Gateway。上手流程會嘗試為你啟用
lingering（可能會提示輸入 sudo）。如果仍未啟用，請執行：

```bash
sudo loginctl enable-linger $USER
```

對於永遠開啟或多使用者伺服器，請考慮使用 **系統**服務，而不是
使用者服務（不需要 lingering）。請參閱 [Gateway runbook](/zh-TW/gateway) 了解 systemd 說明。

## 相關文件

- [Gateway runbook](/zh-TW/gateway)（flags、監督、ports）
- [Gateway configuration](/zh-TW/gateway/configuration)（config schema + 範例）
- [Discord](/zh-TW/channels/discord) 和 [Telegram](/zh-TW/channels/telegram)（reply tags + replyToMode settings）
- [OpenClaw assistant setup](/zh-TW/start/openclaw)
- [macOS app](/zh-TW/platforms/macos)（Gateway 生命週期）
