---
read_when:
    - 設定新機器
    - 你想要「最新 + 最強」，又不破壞你的個人設定
summary: OpenClaw 的進階設定與開發工作流程
title: 設定
x-i18n:
    generated_at: "2026-06-27T20:03:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81cad59d4eab731ba548452211bfc578d6f79e38431057c52cc3580d3b9d9944
    source_path: start/setup.md
    workflow: 16
---

<Note>
如果你是第一次設定，請從[快速入門](/zh-TW/start/getting-started)開始。
如需上線引導詳細資訊，請參閱[上線引導（命令列介面）](/zh-TW/start/wizard)。
</Note>

## TL;DR

請根據你希望更新的頻率，以及是否想自行執行閘道，選擇設定工作流程：

- **個人化設定存放在 repo 外：** 將你的設定與工作區保留在 `~/.openclaw/openclaw.json` 和 `~/.openclaw/workspace/`，這樣 repo 更新就不會影響它們。
- **穩定工作流程（建議大多數人使用）：** 安裝 macOS app，並讓它執行內建的閘道。
- **前沿工作流程（開發）：** 透過 `pnpm gateway:watch` 自行執行閘道，然後讓 macOS app 以本機模式連接。

## 前置需求（從原始碼）

- 建議使用節點 24（仍支援節點 22 LTS，目前為 `22.19+`）
- 原始碼 checkout 需要 `pnpm`。OpenClaw 在開發模式下會從
  `extensions/*` pnpm 工作區套件載入內建外掛，因此根目錄的 `npm install`
  不會準備完整的原始碼樹。
- Docker（選用；僅用於容器化設定/e2e - 請參閱 [Docker](/zh-TW/install/docker)）

## 個人化策略（讓更新不造成傷害）

如果你想要「100% 為我量身打造」_且_ 更新容易，請將自訂內容保留在：

- **設定：** `~/.openclaw/openclaw.json`（JSON/類 JSON5）
- **工作區：** `~/.openclaw/workspace`（skills、提示詞、記憶；將其設為私有 git repo）

初始化一次：

```bash
openclaw setup
```

在此 repo 內，請使用本機命令列介面進入點：

```bash
openclaw setup
```

如果你尚未安裝全域版本，請透過 `pnpm openclaw setup` 執行。

## 從此 repo 執行閘道

執行 `pnpm build` 後，你可以直接執行已封裝的命令列介面：

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 穩定工作流程（先使用 macOS app）

1. 安裝並啟動 **OpenClaw.app**（選單列）。
2. 完成上線引導/權限檢查清單（TCC 提示）。
3. 確認閘道為 **Local** 且正在執行（由 app 管理）。
4. 連結介面（例如：WhatsApp）：

```bash
openclaw channels login
```

5. 健全性檢查：

```bash
openclaw health
```

如果你的建置版本無法使用上線引導：

- 執行 `openclaw setup`，接著執行 `openclaw channels login`，再手動啟動閘道（`openclaw gateway`）。

## 前沿工作流程（在終端機中執行閘道）

目標：開發 TypeScript 閘道、取得熱重載，並保持 macOS app UI 連接。

### 0)（選用）也從原始碼執行 macOS app

如果你也想使用前沿版本的 macOS app：

```bash
./scripts/restart-mac.sh
```

### 1) 啟動開發閘道

```bash
pnpm install
# 僅第一次執行（或重設本機 OpenClaw 設定/工作區後）
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` 會在具名 tmux
工作階段中啟動或重新啟動閘道監看程序，並從互動式終端機自動附加。非互動式 shell 會保持
分離並印出 `tmux attach -t openclaw-gateway-watch-main`；使用
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` 可讓互動式執行保持
分離，或使用 `pnpm gateway:watch:raw` 進入前景監看模式。監看器會在相關原始碼、設定和內建外掛中繼資料變更時
重新載入。如果受監看的閘道在啟動期間結束，`gateway:watch` 會執行一次
`openclaw doctor --fix --non-interactive` 並重試；設定
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` 可停用這個僅限開發的修復流程。
`pnpm openclaw setup` 是全新 checkout 的一次性本機設定/工作區初始化步驟。
`pnpm gateway:watch` 不會重新建置 `dist/control-ui`，因此在 `ui/` 變更後請重新執行 `pnpm ui:build`，或在開發 Control UI 時使用 `pnpm ui:dev`。

### 2) 將 macOS app 指向你正在執行的閘道

在 **OpenClaw.app** 中：

- 連線模式：**Local**
  app 會連接到設定連接埠上正在執行的 gateway。

### 3) 驗證

- app 內的閘道狀態應顯示 **"Using existing gateway …"**
- 或透過命令列介面：

```bash
openclaw health
```

### 常見陷阱

- **連接埠錯誤：** 閘道 WS 預設為 `ws://127.0.0.1:18789`；請讓 app 與命令列介面使用相同連接埠。
- **狀態存放位置：**
  - 頻道/供應商狀態：`~/.openclaw/credentials/`
  - 模型驗證設定檔：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 工作階段：`~/.openclaw/agents/<agentId>/sessions/`
  - 日誌：`/tmp/openclaw/`

## 憑證儲存對照表

在除錯驗證或決定要備份哪些內容時使用：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**：設定/env 或 `channels.telegram.tokenFile`（僅限一般檔案；拒絕符號連結）
- **Discord bot token**：設定/env 或 SecretRef（env/file/exec 供應商）
- **Slack tokens**：設定/env（`channels.slack.*`）
- **配對允許清單**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（預設帳戶）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非預設帳戶）
- **模型驗證設定檔**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **檔案支援的祕密承載資料（選用）**：`~/.openclaw/secrets.json`
- **舊版 OAuth 匯入**：`~/.openclaw/credentials/oauth.json`
  更多詳細資訊：[安全性](/zh-TW/gateway/security#credential-storage-map)。

## 更新（不破壞你的設定）

- 將 `~/.openclaw/workspace` 和 `~/.openclaw/` 視為「你的東西」；不要把個人提示詞/設定放進 `openclaw` repo。
- 更新原始碼：`git pull` + `pnpm install` + 繼續使用 `pnpm gateway:watch`。

## Linux（systemd 使用者服務）

Linux 安裝會使用 systemd **使用者**服務。預設情況下，systemd 會在登出/閒置時停止使用者
服務，這會終止閘道。上線引導會嘗試為你啟用
lingering（可能會提示 sudo）。如果仍未啟用，請執行：

```bash
sudo loginctl enable-linger $USER
```

對於永遠開啟或多使用者伺服器，請考慮使用 **系統**服務，而不是
使用者服務（不需要 lingering）。systemd 注意事項請參閱[閘道執行手冊](/zh-TW/gateway)。

## 相關文件

- [閘道執行手冊](/zh-TW/gateway)（旗標、監督、連接埠）
- [閘道設定](/zh-TW/gateway/configuration)（設定 schema + 範例）
- [Discord](/zh-TW/channels/discord) 和 [Telegram](/zh-TW/channels/telegram)（回覆標籤 + replyToMode 設定）
- [OpenClaw 助理設定](/zh-TW/start/openclaw)
- [macOS app](/zh-TW/platforms/macos)（gateway 生命週期）
