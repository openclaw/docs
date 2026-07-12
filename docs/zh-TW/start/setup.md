---
read_when:
    - 設定新機器
    - 你想要「最新、最完善的版本」，又不想破壞個人設定
summary: OpenClaw 的進階設定與開發工作流程
title: 設定
x-i18n:
    generated_at: "2026-07-12T14:50:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cd35e9ab99de49a14f3d8673b2d11abe46aace18cc7edac43987826bbd1fd857
    source_path: start/setup.md
    workflow: 16
---

<Note>
如果你是第一次設定，請先閱讀[開始使用](/zh-TW/start/getting-started)。
如需了解初始設定的詳細資訊，請參閱[初始設定（命令列介面）](/zh-TW/start/wizard)。
</Note>

## 摘要

請依據你想要更新的頻率，以及是否要自行執行閘道，選擇設定工作流程：

- **客製化內容位於儲存庫之外：** 將設定和工作區保存在 `~/.openclaw/openclaw.json` 與 `~/.openclaw/workspace/`，如此更新儲存庫時就不會變動它們。
- **穩定工作流程（建議大多數使用者採用）：** 安裝 macOS App，並讓它執行隨附的閘道。
- **最前沿工作流程（開發）：** 透過 `pnpm gateway:watch` 自行執行閘道，再讓 macOS App 以本機模式連線。

## 先決條件（從原始碼執行）

- 建議使用 Node 24（仍支援 Node 22 LTS，目前為 `22.19+`）
- 從原始碼簽出版本執行時必須使用 `pnpm`。在開發模式中，OpenClaw 會從
  `extensions/*` 的 pnpm 工作區套件載入隨附外掛，因此在根目錄執行 `npm install`
  不會準備完整的原始碼樹狀結構。
- Docker（選用；僅供容器化設定／端對端測試使用，請參閱 [Docker](/zh-TW/install/docker)）

## 客製化策略（避免更新造成影響）

如果你希望「完全依照我的需求客製化」_同時_又能輕鬆更新，請將自訂內容保存在：

- **設定：** `~/.openclaw/openclaw.json`（類似 JSON/JSON5）
- **工作區：** `~/.openclaw/workspace`（Skills、提示詞、記憶；請將其設為私有 Git 儲存庫）

只需初始化設定／工作區資料夾一次，不必執行完整的初始設定精靈：

```bash
openclaw setup --baseline
```

尚未進行全域安裝？請改為從此儲存庫執行：

```bash
pnpm openclaw setup --baseline
```

（不含 `--baseline` 的單獨 `openclaw setup` 是 `openclaw onboard` 的別名，會執行完整的互動式精靈。）

## 從此儲存庫執行閘道

執行 `pnpm build` 後，你可以直接執行已封裝的命令列介面：

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 穩定工作流程（以 macOS App 為優先）

1. 安裝並啟動 **OpenClaw.app**（選單列）。
2. 完成初始設定／權限檢查清單（TCC 提示）。
3. 確認閘道設為 **Local** 且正在執行（由 App 管理）。
4. 連結服務介面（例如 WhatsApp）：

```bash
openclaw channels login
```

5. 執行基本檢查：

```bash
openclaw health
```

如果你的組建版本不提供初始設定功能：

- 執行 `openclaw setup`，接著執行 `openclaw channels login`，然後手動啟動閘道（`openclaw gateway`）。

## 最前沿工作流程（在終端機中執行閘道）

目標：開發 TypeScript 閘道、取得熱重新載入功能，並讓 macOS App 使用者介面保持連線。

### 0)（選用）也從原始碼執行 macOS App

如果你也希望使用最前沿版本的 macOS App：

```bash
./scripts/restart-mac.sh
```

### 1) 啟動開發版閘道

```bash
pnpm install
# 僅限第一次執行（或重設本機 OpenClaw 設定／工作區後）
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` 會在具名 tmux 工作階段
（`openclaw-gateway-watch-main`）中啟動或重新啟動閘道監看程序，並從互動式
終端機自動連線。非互動式殼層會維持分離狀態並顯示
`tmux attach -t openclaw-gateway-watch-main`；若要讓互動式執行維持
分離狀態，請使用 `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`；
若要使用前景監看模式，請使用 `pnpm gateway:watch:raw`。監看程式會在相關原始碼、
設定及隨附外掛中繼資料變更時重新載入。如果受監看的閘道在啟動期間結束，
`gateway:watch` 會執行一次 `openclaw doctor --fix --non-interactive`
後重試；設定 `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` 可停用這個僅供開發使用的修復程序。
`pnpm gateway:watch` 不會重新建置 `dist/control-ui`，因此變更 `ui/` 後請再次執行 `pnpm ui:build`，或在開發控制使用者介面時使用 `pnpm ui:dev`。

### 2) 讓 macOS App 指向你正在執行的閘道

在 **OpenClaw.app** 中：

- Connection Mode: **Local**
  App 會連線至已設定連接埠上正在執行的閘道。

### 3) 驗證

- App 內的閘道狀態應顯示 **"Using existing gateway …"**
- 或透過命令列介面：

```bash
openclaw health
```

### 常見陷阱

- **連接埠錯誤：** 閘道 WebSocket 預設為 `ws://127.0.0.1:18789`；請讓 App 與命令列介面使用相同的連接埠。
- **狀態儲存位置：**
  - 頻道／供應商狀態：`~/.openclaw/credentials/`
  - 模型驗證設定檔：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 工作階段與逐字稿：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - 舊版／封存的工作階段成品：`~/.openclaw/agents/<agentId>/sessions/`
  - 記錄：`/tmp/openclaw/`

## 認證資訊儲存位置對照

偵錯驗證問題或決定要備份哪些內容時，請參考此對照：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram Bot 權杖**：設定／環境變數或 `channels.telegram.tokenFile`（僅限一般檔案；拒絕符號連結）
- **Discord Bot 權杖**：設定／環境變數或 SecretRef（環境變數／檔案／執行供應商）
- **Slack 權杖**：設定／環境變數（`channels.slack.*`）
- **配對允許清單**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（預設帳號）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非預設帳號）
- **模型驗證設定檔**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **以檔案為基礎的密鑰承載內容（選用）**：`~/.openclaw/secrets.json`
- **舊版 OAuth 匯入**：`~/.openclaw/credentials/oauth.json`
  詳細資訊：[安全性](/zh-TW/gateway/security#credential-storage-map)。

## 更新（不破壞你的設定）

- 將 `~/.openclaw/workspace` 和 `~/.openclaw/` 視為「你的內容」；不要將個人提示詞／設定放入 `openclaw` 儲存庫。
- 更新原始碼：執行 `git pull` + `pnpm install`，並繼續使用 `pnpm gateway:watch`。

## Linux（systemd 使用者服務）

Linux 安裝會使用 systemd **使用者**服務。systemd 預設會在登出／閒置時停止使用者
服務，因而終止閘道。初始設定程序會嘗試為你啟用 lingering（可能會提示輸入 sudo）。
如果仍未啟用，請執行：

```bash
sudo loginctl enable-linger $USER
```

對於需要持續運作或供多位使用者使用的伺服器，請考慮採用 **系統**服務，而非
使用者服務（不需要 lingering）。systemd 相關注意事項請參閱[閘道操作手冊](/zh-TW/gateway)。

## 相關文件

- [閘道操作手冊](/zh-TW/gateway)（旗標、程序監督、連接埠）
- [閘道設定](/zh-TW/gateway/configuration)（設定結構描述與範例）
- [Discord](/zh-TW/channels/discord) 與 [Telegram](/zh-TW/channels/telegram)（回覆標籤與 replyToMode 設定）
- [OpenClaw 助理設定](/zh-TW/start/openclaw)
- [macOS App](/zh-TW/platforms/macos)（閘道生命週期）
