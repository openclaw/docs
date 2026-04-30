---
read_when:
    - 你需要知道哪些環境變數會被載入，以及載入順序。
    - 您正在偵錯 Gateway 中缺少的 API 金鑰
    - 你正在撰寫提供者身分驗證或部署環境的文件
summary: OpenClaw 載入環境變數的位置與優先順序
title: 環境變數
x-i18n:
    generated_at: "2026-04-30T03:10:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: d19b9053207a088b3eb39d03e36fc2d415295feb80da51bd71339884466b101b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw 會從多個來源擷取環境變數。規則是**絕不覆寫現有值**。

## 優先順序（最高 → 最低）

1. **程序環境**（Gateway 程序已從父層 shell/daemon 取得的內容）。
2. **目前工作目錄中的 `.env`**（dotenv 預設；不會覆寫）。
3. **全域 `.env`**，位於 `~/.openclaw/.env`（也就是 `$OPENCLAW_STATE_DIR/.env`；不會覆寫）。
4. **設定中的 `env` 區塊**，位於 `~/.openclaw/openclaw.json`（只在缺少時套用）。
5. **可選的登入 shell 匯入**（`env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1`），只針對缺少的預期鍵套用。

在使用預設狀態目錄的 Ubuntu 全新安裝中，OpenClaw 也會在全域 `.env` 之後，將 `~/.config/openclaw/gateway.env` 視為相容性後援。如果兩個檔案都存在且內容不一致，OpenClaw 會保留 `~/.openclaw/.env` 並列印警告。

如果設定檔完全不存在，步驟 4 會被略過；若已啟用 shell 匯入，仍會執行。

## 設定 `env` 區塊

設定行內環境變數有兩種等效方式（兩者都不會覆寫）：

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## Shell 環境匯入

`env.shellEnv` 會執行你的登入 shell，並只匯入**缺少的**預期鍵：

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

環境變數等效寫法：

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## 執行階段注入的環境變數

OpenClaw 也會將情境標記注入到產生的子程序中：

- `OPENCLAW_SHELL=exec`：針對透過 `exec` 工具執行的命令設定。
- `OPENCLAW_SHELL=acp`：針對 ACP 執行階段後端程序產生設定（例如 `acpx`）。
- `OPENCLAW_SHELL=acp-client`：針對 `openclaw acp client` 產生 ACP 橋接程序時設定。
- `OPENCLAW_SHELL=tui-local`：針對本機 TUI `!` shell 命令設定。

這些是執行階段標記（不是必要的使用者設定）。它們可用於 shell/profile 邏輯
以套用特定情境的規則。

## UI 環境變數

- `OPENCLAW_THEME=light`：當你的終端機使用淺色背景時，強制使用淺色 TUI 調色盤。
- `OPENCLAW_THEME=dark`：強制使用深色 TUI 調色盤。
- `COLORFGBG`：如果你的終端機匯出它，OpenClaw 會使用背景色提示來自動選擇 TUI 調色盤。

## 設定中的環境變數替換

你可以使用 `${VAR_NAME}` 語法，在設定字串值中直接參照環境變數：

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

完整詳細資訊請參閱[設定：環境變數替換](/zh-TW/gateway/configuration-reference#env-var-substitution)。

## 秘密參照與 `${ENV}` 字串

OpenClaw 支援兩種由環境驅動的模式：

- 在設定值中使用 `${VAR}` 字串替換。
- 對支援秘密參照的欄位使用 SecretRef 物件（`{ source: "env", provider: "default", id: "VAR" }`）。

兩者都會在啟用時從程序環境解析。SecretRef 詳細資訊記載於[秘密管理](/zh-TW/gateway/secrets)。

## 路徑相關環境變數

| 變數                   | 用途                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_HOME`        | 覆寫用於所有內部路徑解析的家目錄（`~/.openclaw/`、代理目錄、工作階段、憑證）。在以專用服務使用者執行 OpenClaw 時很有用。                                                       |
| `OPENCLAW_STATE_DIR`   | 覆寫狀態目錄（預設為 `~/.openclaw`）。                                                                                                                                         |
| `OPENCLAW_CONFIG_PATH` | 覆寫設定檔路徑（預設為 `~/.openclaw/openclaw.json`）。                                                                                                                         |

## 記錄

| 變數                 | 用途                                                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | 覆寫檔案與主控台的記錄層級（例如 `debug`、`trace`）。優先於設定中的 `logging.level` 和 `logging.consoleLevel`。無效值會被忽略並顯示警告。                                                |

### `OPENCLAW_HOME`

設定後，`OPENCLAW_HOME` 會取代系統家目錄（`$HOME` / `os.homedir()`），用於所有內部路徑解析。這能讓無頭服務帳號具備完整的檔案系統隔離。

**優先順序：** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**範例**（macOS LaunchDaemon）：

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` 也可以設定為波浪號路徑（例如 `~/svc`），使用前會透過 `$HOME` 展開。

## nvm 使用者：web_fetch TLS 失敗

如果 Node.js 是透過 **nvm** 安裝（而不是系統套件管理器），內建的 `fetch()` 會使用
nvm 綁定的 CA 儲存區，而該儲存區可能缺少現代根 CA（Let's Encrypt 的 ISRG Root X1/X2、
DigiCert Global Root G2 等）。這會導致 `web_fetch` 在多數 HTTPS 網站上以 `"fetch failed"` 失敗。

在 Linux 上，OpenClaw 會自動偵測 nvm，並在實際啟動環境中套用修正：

- `openclaw gateway install` 會將 `NODE_EXTRA_CA_CERTS` 寫入 systemd 服務環境
- `openclaw` CLI 進入點會在 Node 啟動前，先以已設定 `NODE_EXTRA_CA_CERTS` 的狀態重新執行自身

**手動修正（適用於較舊版本或直接 `node ...` 啟動）：**

在啟動 OpenClaw 前匯出變數：

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

不要只依賴將此變數寫入 `~/.openclaw/.env`；Node 會在程序啟動時讀取
`NODE_EXTRA_CA_CERTS`。

## 舊版環境變數

OpenClaw 只讀取 `OPENCLAW_*` 環境變數。早期版本的舊版
`CLAWDBOT_*` 和 `MOLTBOT_*` 前綴會被靜默
忽略。

如果 Gateway 程序啟動時仍設定了其中任何一個，OpenClaw 會發出單一
Node 棄用警告（`OPENCLAW_LEGACY_ENV_VARS`），列出偵測到的
前綴與總數。請將舊版前綴替換為 `OPENCLAW_` 來重新命名每個值（例如 `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`）；舊名稱不會產生任何作用。

## 相關

- [Gateway 設定](/zh-TW/gateway/configuration)
- [常見問題：環境變數與 .env 載入](/zh-TW/help/faq#env-vars-and-env-loading)
- [模型總覽](/zh-TW/concepts/models)
