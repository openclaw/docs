---
read_when:
    - 設定新機器
    - 你想要「最新且最強」而不破壞你的個人設定
summary: OpenClaw 的進階設定與開發工作流程
title: 設定
x-i18n:
    generated_at: "2026-07-05T11:48:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae0dd0e8ea999367440898f54354a76405e310fee6e05846aab13cba14a65f37
    source_path: start/setup.md
    workflow: 16
---

<Note>
如果你是第一次設定，請從[入門](/zh-TW/start/getting-started)開始。
如需上手流程的詳細資訊，請參閱[上手流程（命令列介面）](/zh-TW/start/wizard)。
</Note>

## TL;DR

根據你想要更新的頻率，以及是否想自行執行閘道，選擇設定工作流程：

- **客製化內容放在 repo 外：**將你的設定與工作區保留在 `~/.openclaw/openclaw.json` 和 `~/.openclaw/workspace/`，這樣 repo 更新就不會動到它們。
- **穩定工作流程（建議多數人使用）：**安裝 macOS app，並讓它執行內建的閘道。
- **前沿開發工作流程（dev）：**透過 `pnpm gateway:watch` 自行執行閘道，然後讓 macOS app 以本機模式附加。

## 先決條件（從原始碼）

- 建議使用 節點 24（仍支援 節點 22 LTS，目前為 `22.19+`）
- 原始碼 checkout 需要 `pnpm`。OpenClaw 在 dev 模式會從
  `extensions/*` pnpm workspace packages 載入內建外掛，因此根目錄的 `npm install`
  不會準備完整的原始碼樹。
- Docker（選用；僅用於容器化設定/e2e - 請參閱 [Docker](/zh-TW/install/docker)）

## 客製化策略（讓更新不造成傷害）

如果你想要「100% 依照我的需求客製化」_同時_方便更新，請將你的自訂內容放在：

- **設定：**`~/.openclaw/openclaw.json`（JSON/類 JSON5）
- **工作區：**`~/.openclaw/workspace`（skills、prompts、memories；將它做成私有 git repo）

只需初始化設定/工作區資料夾一次，不必執行完整的上手精靈：

```bash
openclaw setup --baseline
```

還沒有全域安裝嗎？改從這個 repo 執行：

```bash
pnpm openclaw setup --baseline
```

（裸用 `openclaw setup`、不加 `--baseline`，是 `openclaw onboard` 的別名，會執行完整互動式精靈。）

## 從這個 repo 執行閘道

執行 `pnpm build` 後，你可以直接執行封裝好的命令列介面：

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 穩定工作流程（先使用 macOS app）

1. 安裝並啟動 **OpenClaw.app**（選單列）。
2. 完成上手/權限檢查清單（TCC prompts）。
3. 確認閘道為**本機**且正在執行（由 app 管理）。
4. 連結介面（範例：WhatsApp）：

```bash
openclaw channels login
```

5. 健全性檢查：

```bash
openclaw health
```

如果你的組建沒有上手流程：

- 執行 `openclaw setup`，接著執行 `openclaw channels login`，然後手動啟動閘道（`openclaw gateway`）。

## 前沿開發工作流程（在終端機中執行閘道）

目標：開發 TypeScript 閘道、取得熱重載，並讓 macOS app UI 保持附加。

### 0)（選用）也從原始碼執行 macOS app

如果你也想讓 macOS app 使用前沿開發版：

```bash
./scripts/restart-mac.sh
```

### 1) 啟動 dev 閘道

```bash
pnpm install
# 僅第一次執行（或重設本機 OpenClaw 設定/工作區後）
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` 會在具名 tmux
工作階段（`openclaw-gateway-watch-main`）中啟動或重新啟動閘道監看程序，並從互動式
終端機自動附加。非互動式 shell 會保持分離並列印
`tmux attach -t openclaw-gateway-watch-main`；使用
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` 可讓互動式執行
保持分離，或使用 `pnpm gateway:watch:raw` 以前景監看模式執行。監看器
會在相關原始碼、設定與內建外掛中繼資料變更時重新載入。如果被監看的
閘道在啟動期間結束，`gateway:watch` 會執行一次
`openclaw doctor --fix --non-interactive` 並重試；設定
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` 可停用該僅限 dev 的修復步驟。
`pnpm gateway:watch` 不會重新建置 `dist/control-ui`，因此在 `ui/` 變更後請重新執行 `pnpm ui:build`，或在開發 Control UI 時使用 `pnpm ui:dev`。

### 2) 將 macOS app 指向你正在執行的閘道

在 **OpenClaw.app** 中：

- 連線模式：**本機**
  app 會附加到設定連接埠上正在執行的閘道。

### 3) 驗證

- app 內的閘道狀態應顯示 **「正在使用現有閘道 …」**
- 或透過命令列介面：

```bash
openclaw health
```

### 常見陷阱

- **連接埠錯誤：**閘道 WS 預設為 `ws://127.0.0.1:18789`；請讓 app 與命令列介面使用相同連接埠。
- **狀態儲存位置：**
  - 頻道/供應商狀態：`~/.openclaw/credentials/`
  - 模型驗證設定檔：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 工作階段：`~/.openclaw/agents/<agentId>/sessions/`
  - 日誌：`/tmp/openclaw/`

## 認證儲存對照表

除錯驗證或決定要備份哪些內容時使用：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**：設定/env 或 `channels.telegram.tokenFile`（僅限一般檔案；拒絕 symlinks）
- **Discord bot token**：設定/env 或 SecretRef（env/file/exec providers）
- **Slack tokens**：設定/env（`channels.slack.*`）
- **配對允許清單**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（預設帳號）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非預設帳號）
- **模型驗證設定檔**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **檔案支援的密鑰 payload（選用）**：`~/.openclaw/secrets.json`
- **舊版 OAuth 匯入**：`~/.openclaw/credentials/oauth.json`
  更多詳細資訊：[安全性](/zh-TW/gateway/security#credential-storage-map)。

## 更新（不破壞你的設定）

- 將 `~/.openclaw/workspace` 和 `~/.openclaw/` 視為「你的東西」；不要把個人 prompts/設定放進 `openclaw` repo。
- 更新原始碼：`git pull` + `pnpm install` + 持續使用 `pnpm gateway:watch`。

## Linux（systemd 使用者服務）

Linux 安裝會使用 systemd **使用者**服務。預設情況下，systemd 會在登出/閒置時停止使用者
服務，這會終止閘道。上手流程會嘗試為你啟用
lingering（可能會提示 sudo）。如果它仍然關閉，請執行：

```bash
sudo loginctl enable-linger $USER
```

對於永遠在線或多使用者伺服器，請考慮使用**系統**服務，而不是
使用者服務（不需要 lingering）。systemd 注意事項請參閱[閘道 runbook](/zh-TW/gateway)。

## 相關文件

- [閘道 runbook](/zh-TW/gateway)（flags、監督、連接埠）
- [閘道設定](/zh-TW/gateway/configuration)（設定 schema + 範例）
- [Discord](/zh-TW/channels/discord) 和 [Telegram](/zh-TW/channels/telegram)（reply tags + replyToMode 設定）
- [OpenClaw assistant 設定](/zh-TW/start/openclaw)
- [macOS app](/zh-TW/platforms/macos)（閘道生命週期）
