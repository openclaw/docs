---
read_when:
    - 設定新機器
    - 你想要「最新 + 最佳」，同時不破壞你的個人設定
summary: OpenClaw 的進階設定與開發工作流程
title: 設定
x-i18n:
    generated_at: "2026-04-30T03:41:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: f96e5e8d46e694f0dfc67eeeb34f4c49498a56e384c3a2a6266c2214afdc0870
    source_path: start/setup.md
    workflow: 16
---

<Note>
如果你是第一次設定，請從[快速開始](/zh-TW/start/getting-started)開始。
如需 onboarding 詳細資訊，請參閱 [Onboarding (CLI)](/zh-TW/start/wizard)。
</Note>

## TL;DR

請根據你想要更新的頻率，以及是否想自行執行 Gateway，選擇設定工作流程：

- **客製化內容放在儲存庫之外：** 將你的設定與工作區保留在 `~/.openclaw/openclaw.json` 和 `~/.openclaw/workspace/`，如此儲存庫更新就不會碰到它們。
- **穩定工作流程（建議大多數人使用）：** 安裝 macOS 應用程式，並讓它執行隨附的 Gateway。
- **前沿工作流程（開發）：** 透過 `pnpm gateway:watch` 自行執行 Gateway，然後讓 macOS 應用程式以 Local 模式連接。

## 先決條件（從原始碼）

- 建議使用 Node 24（Node 22 LTS，目前為 `22.14+`，仍受支援）
- 偏好使用 `pnpm`（或在你刻意使用 [Bun 工作流程](/zh-TW/install/bun)時使用 Bun）
- Docker（選用；僅用於容器化設定/e2e — 請參閱 [Docker](/zh-TW/install/docker)）

## 客製化策略（讓更新不造成傷害）

如果你想要「100% 為我量身打造」_並且_輕鬆更新，請將自訂內容保留在：

- **設定：** `~/.openclaw/openclaw.json`（JSON/類 JSON5）
- **工作區：** `~/.openclaw/workspace`（Skills、提示、記憶；把它做成私有 git 儲存庫）

先啟動設定一次：

```bash
openclaw setup
```

在此儲存庫內，使用本機 CLI 入口：

```bash
openclaw setup
```

如果你尚未全域安裝，請透過 `pnpm openclaw setup` 執行（如果你使用 Bun 工作流程，則使用 `bun run openclaw setup`）。

## 從此儲存庫執行 Gateway

完成 `pnpm build` 後，你可以直接執行打包好的 CLI：

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 穩定工作流程（先用 macOS 應用程式）

1. 安裝並啟動 **OpenClaw.app**（選單列）。
2. 完成 onboarding/權限檢查清單（TCC 提示）。
3. 確認 Gateway 為 **Local** 且正在執行（由應用程式管理）。
4. 連結介面（例如：WhatsApp）：

```bash
openclaw channels login
```

5. 健全性檢查：

```bash
openclaw health
```

如果你的建置版本中沒有 onboarding：

- 執行 `openclaw setup`，接著執行 `openclaw channels login`，然後手動啟動 Gateway（`openclaw gateway`）。

## 前沿工作流程（在終端機中執行 Gateway）

目標：開發 TypeScript Gateway、取得熱重新載入，並保持 macOS 應用程式 UI 已連接。

### 0) （選用）也從原始碼執行 macOS 應用程式

如果你也想使用前沿版本的 macOS 應用程式：

```bash
./scripts/restart-mac.sh
```

### 1) 啟動開發用 Gateway

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` 會在具名 tmux 工作階段中啟動或重新啟動 Gateway 監看程序，並從互動式終端機自動附加。非互動式 shell 會保持分離並印出 `tmux attach -t openclaw-gateway-watch-main`；使用 `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` 可讓互動式執行保持分離，或使用 `pnpm gateway:watch:raw` 進入前景監看模式。監看器會在相關原始碼、設定與隨附 Plugin 中繼資料變更時重新載入。
`pnpm openclaw setup` 是全新 checkout 的一次性本機設定/工作區初始化步驟。
`pnpm gateway:watch` 不會重建 `dist/control-ui`，因此在 `ui/` 變更後請重新執行 `pnpm ui:build`，或在開發 Control UI 時使用 `pnpm ui:dev`。

如果你刻意使用 Bun 工作流程，對應指令為：

```bash
bun install
# First run only (or after resetting local OpenClaw config/workspace)
bun run openclaw setup
bun run gateway:watch
```

### 2) 將 macOS 應用程式指向你正在執行的 Gateway

在 **OpenClaw.app** 中：

- Connection Mode：**Local**
  應用程式會連接到設定連接埠上正在執行的 gateway。

### 3) 驗證

- 應用程式內的 Gateway 狀態應顯示 **「Using existing gateway …」**
- 或透過 CLI：

```bash
openclaw health
```

### 常見陷阱

- **連接埠錯誤：** Gateway WS 預設為 `ws://127.0.0.1:18789`；讓應用程式與 CLI 使用相同連接埠。
- **狀態存放位置：**
  - 頻道/提供者狀態：`~/.openclaw/credentials/`
  - 模型驗證設定檔：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 工作階段：`~/.openclaw/agents/<agentId>/sessions/`
  - 日誌：`/tmp/openclaw/`

## 憑證儲存對照表

在除錯驗證或決定要備份哪些內容時使用：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**：設定/env 或 `channels.telegram.tokenFile`（僅限一般檔案；會拒絕符號連結）
- **Discord bot token**：設定/env 或 SecretRef（env/file/exec 提供者）
- **Slack token**：設定/env（`channels.slack.*`）
- **配對允許清單**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（預設帳號）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非預設帳號）
- **模型驗證設定檔**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **檔案支援的秘密酬載（選用）**：`~/.openclaw/secrets.json`
- **舊版 OAuth 匯入**：`~/.openclaw/credentials/oauth.json`
  更多細節：[安全性](/zh-TW/gateway/security#credential-storage-map)。

## 更新（不破壞你的設定）

- 將 `~/.openclaw/workspace` 和 `~/.openclaw/` 視為「你的東西」；不要把個人提示/設定放進 `openclaw` 儲存庫。
- 更新原始碼：`git pull` + 你選擇的套件管理器安裝步驟（預設為 `pnpm install`；Bun 工作流程使用 `bun install`）+ 繼續使用對應的 `gateway:watch` 指令。

## Linux（systemd 使用者服務）

Linux 安裝使用 systemd **使用者**服務。預設情況下，systemd 會在登出/閒置時停止使用者服務，這會終止 Gateway。Onboarding 會嘗試為你啟用 lingering（可能會提示 sudo）。如果仍未啟用，請執行：

```bash
sudo loginctl enable-linger $USER
```

對於永遠在線或多使用者伺服器，請考慮使用**系統**服務，而不是使用者服務（不需要 lingering）。請參閱 [Gateway runbook](/zh-TW/gateway) 了解 systemd 備註。

## 相關文件

- [Gateway runbook](/zh-TW/gateway)（旗標、監督、連接埠）
- [Gateway 設定](/zh-TW/gateway/configuration)（設定 schema + 範例）
- [Discord](/zh-TW/channels/discord) 和 [Telegram](/zh-TW/channels/telegram)（回覆標籤 + replyToMode 設定）
- [OpenClaw 助理設定](/zh-TW/start/openclaw)
- [macOS 應用程式](/zh-TW/platforms/macos)（gateway 生命週期）
