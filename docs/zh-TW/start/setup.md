---
read_when:
    - 設定新機器
    - 你想要「最新、最強」的功能，又不想破壞個人設定
summary: OpenClaw 的進階設定與開發工作流程
title: 設定
x-i18n:
    generated_at: "2026-07-14T14:02:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: c40d6d2bf2814465f3cc49c65d4c1498671420af728ce8012d13af3fba67025a
    source_path: start/setup.md
    workflow: 16
---

<Note>
如果你是第一次設定，請從[開始使用](/zh-TW/start/getting-started)著手。
如需新手設定流程的詳細資訊，請參閱[新手設定流程（命令列介面）](/zh-TW/start/wizard)。
</Note>

## 重點摘要

請根據你想要更新的頻率，以及是否要自行執行閘道，選擇設定工作流程：

- **自訂內容存放在儲存庫之外：**將設定與工作區保存在 `~/.openclaw/openclaw.json` 和 `~/.openclaw/workspace/`，如此儲存庫更新就不會影響它們。
- **穩定版工作流程（建議大多數人使用）：**安裝 macOS App，並讓它執行隨附的閘道。
- **前沿版本工作流程（開發用）：**透過 `pnpm gateway:watch` 自行執行閘道，再讓 macOS App 以本機模式連線。

## 先決條件（從原始碼執行）

- 建議使用 Node 24.15+（仍支援 Node 22 LTS，目前為 `22.22.3+`）
- 從原始碼簽出版本執行時需要 `pnpm`。在開發模式下，OpenClaw 會從
  `extensions/*` pnpm 工作區套件載入隨附的外掛，因此根目錄的 `npm install`
  不會準備完整的原始碼樹。
- Docker（選用；僅用於容器化設定／端對端測試——請參閱 [Docker](/zh-TW/install/docker)）

## 自訂策略（避免更新造成破壞）

如果你想要「100% 為我量身打造」_同時_又能輕鬆更新，請將自訂內容保存在：

- **設定：**`~/.openclaw/openclaw.json`（類似 JSON/JSON5）
- **工作區：**`~/.openclaw/workspace`（Skills、提示詞、記憶；請將其設為私有 git 儲存庫）

只需初始化設定／工作區資料夾一次，不必執行完整的新手設定精靈：

```bash
openclaw setup --baseline
```

尚未進行全域安裝？請改從此儲存庫執行：

```bash
pnpm openclaw setup --baseline
```

（不含 `--baseline` 的純 `openclaw setup` 是 `openclaw onboard` 的別名，會執行完整的互動式精靈。）

## 從此儲存庫執行閘道

完成 `pnpm build` 後，你可以直接執行封裝好的命令列介面：

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 穩定版工作流程（先使用 macOS App）

1. 安裝並啟動 **OpenClaw.app**（選單列）。
2. 完成新手設定／權限檢查清單（TCC 提示）。
3. 確認閘道設為**本機**且正在執行（由 App 管理）。
4. 連結通訊介面（例如 WhatsApp）：

```bash
openclaw channels login
```

5. 基本檢查：

```bash
openclaw health
```

如果你的建置版本未提供新手設定流程：

- 依序執行 `openclaw setup`、`openclaw channels login`，再手動啟動閘道（`openclaw gateway`）。

## 前沿版本工作流程（在終端機中執行閘道）

目標：開發 TypeScript 閘道、使用熱重載，並讓 macOS App 使用者介面保持連線。

### 0)（選用）同時從原始碼執行 macOS App

如果你也想使用前沿版本的 macOS App：

```bash
./scripts/restart-mac.sh
```

### 1) 啟動開發用閘道

```bash
pnpm install
# 僅限第一次執行（或重設本機 OpenClaw 設定／工作區後）
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` 會在具名 tmux 工作階段
（`openclaw-gateway-watch-main`）中啟動或重新啟動閘道監看程序，並從互動式
終端機自動附加。非互動式 shell 會保持分離並輸出
`tmux attach -t openclaw-gateway-watch-main`；使用
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` 可讓互動式執行保持
分離，或使用 `pnpm gateway:watch:raw` 以前景監看模式執行。監看器會先
停止作用中設定檔已安裝的閘道服務，再接管其
已設定／預設連接埠，避免服務監督程式取代
原始碼程序。服務仍會保持安裝；監看結束後請執行 `pnpm openclaw gateway start`。
啟動失敗後，tmux 窗格仍會保留，
讓其他終端機或代理程式可以附加或擷取記錄。監看器會在相關原始碼、
設定及隨附外掛的中繼資料變更時重新載入。如果受監看的
閘道在啟動期間結束，`gateway:watch` 會執行一次
`openclaw doctor --fix --non-interactive` 並重試；設定
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` 可停用這個僅供開發使用的修復流程。
`pnpm gateway:watch` 不會重新建置 `dist/control-ui`，因此請在 `ui/` 變更後重新執行 `pnpm ui:build`，或在開發控制介面時使用 `pnpm ui:dev`。

### 2) 將 macOS App 指向正在執行的閘道

在 **OpenClaw.app** 中：

- 連線模式：**本機**
  App 會透過已設定的連接埠連線至正在執行的閘道。

### 3) 驗證

- App 內的閘道狀態應顯示**「正在使用現有的閘道……」**
- 或透過命令列介面：

```bash
openclaw health
```

### 常見陷阱

- **連接埠錯誤：**閘道 WebSocket 預設為 `ws://127.0.0.1:18789`；請讓 App 與命令列介面使用相同連接埠。
- **狀態的儲存位置：**
  - 頻道／供應商狀態：`~/.openclaw/credentials/`
  - 模型驗證設定檔：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 工作階段與逐字稿：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - 舊版／封存的工作階段成品：`~/.openclaw/agents/<agentId>/sessions/`
  - 記錄：`/tmp/openclaw/`

## 認證資訊儲存位置對照表

除錯驗證問題或決定要備份哪些內容時，請使用此對照表：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram Bot 權杖**：設定／環境變數或 `channels.telegram.tokenFile`（僅限一般檔案；不接受符號連結）
- **Discord Bot 權杖**：設定／環境變數或 SecretRef（env/file/exec 供應者）
- **Slack 權杖**：設定／環境變數（`channels.slack.*`）
- **配對允許清單**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（預設帳號）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非預設帳號）
- **模型驗證設定檔**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **檔案型密鑰承載資料（選用）**：`~/.openclaw/secrets.json`
- **舊版 OAuth 匯入**：`~/.openclaw/credentials/oauth.json`
  更多詳細資訊：[安全性](/zh-TW/gateway/security#credential-storage-map)。

## 更新（不破壞你的設定）

- 將 `~/.openclaw/workspace` 和 `~/.openclaw/` 保留為「你的內容」；不要將個人提示詞／設定放入 `openclaw` 儲存庫。
- 更新原始碼：`git pull` + `pnpm install` + 繼續使用 `pnpm gateway:watch`。

## Linux（systemd 使用者服務）

Linux 安裝會使用 systemd **使用者**服務。systemd 預設會在登出／閒置時停止使用者
服務，導致閘道終止。新手設定流程會嘗試為你啟用
使用者持續執行（可能會提示輸入 sudo）。如果仍未啟用，請執行：

```bash
sudo loginctl enable-linger $USER
```

對於需要持續運作或多使用者的伺服器，請考慮使用**系統**服務，而不是
使用者服務（不需要啟用持續執行）。如需 systemd 注意事項，請參閱[閘道操作手冊](/zh-TW/gateway)。

## 相關文件

- [閘道操作手冊](/zh-TW/gateway)（旗標、監督、連接埠）
- [閘道設定](/zh-TW/gateway/configuration)（設定結構描述與範例）
- [Discord](/zh-TW/channels/discord) 和 [Telegram](/zh-TW/channels/telegram)（回覆標記與 replyToMode 設定）
- [OpenClaw 助理設定](/zh-TW/start/openclaw)
- [macOS App](/zh-TW/platforms/macos)（閘道生命週期）
