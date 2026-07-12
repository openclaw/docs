---
read_when:
    - 你需要知道會載入哪些環境變數，以及其載入順序
    - 你正在偵錯閘道中缺少 API 金鑰的問題
    - 您正在記錄供應商驗證或部署環境
summary: OpenClaw 載入環境變數的位置與優先順序
title: 環境變數
x-i18n:
    generated_at: "2026-07-11T21:25:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0010465008969ea1ebf7bb79d01ee86b7be20f7b6d0d90da72d8b0a3b1ed273
    source_path: help/environment.md
    workflow: 16
---

OpenClaw 會從多個來源載入環境變數。規則是**絕不覆寫現有值**。
工作區 `.env` 檔案屬於信任度較低的來源：套用優先順序之前，OpenClaw 會忽略工作區 `.env` 中的供應商憑證與受保護的執行階段控制項。

## 優先順序（由高至低）

1. **程序環境**（閘道程序已從父層 shell／常駐程序取得的內容）。
2. **目前工作目錄中的 `.env`**（dotenv 預設值；不覆寫；忽略供應商憑證與受保護的執行階段控制項）。
3. **全域 `.env`**，位於 `~/.openclaw/.env`（亦即 `$OPENCLAW_STATE_DIR/.env`；建議用於供應商 API 金鑰；不覆寫）。
4. **設定中的 `env` 區塊**，位於 `~/.openclaw/openclaw.json`（僅在缺少值時套用）。
5. **選用的登入 shell 匯入**（`env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1`），僅套用至缺少的預期鍵。

在使用預設狀態目錄的全新 Ubuntu 安裝中，OpenClaw 也會在全域 `.env` 之後，將 `~/.config/openclaw/gateway.env` 視為相容性備援。如果兩個檔案都存在且內容不一致，OpenClaw 會保留 `~/.openclaw/.env` 的值並顯示警告。

如果設定檔完全不存在，便會跳過步驟 4；若已啟用 shell 匯入，仍會執行該匯入。

## 供應商憑證與工作區 `.env`

不要只將供應商 API 金鑰保存在工作區 `.env` 中。OpenClaw 會阻擋工作區 `.env` 檔案中的大量供應商憑證與端點重新導向鍵，包括所有已知的供應商驗證環境變數（例如 `GEMINI_API_KEY`、`GOOGLE_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`GROQ_API_KEY`、`DEEPSEEK_API_KEY`、`PERPLEXITY_API_KEY`、`BRAVE_API_KEY`、`TAVILY_API_KEY`、`EXA_API_KEY`、`FIRECRAWL_API_KEY`），以及任何以 `_API_HOST`、`_BASE_URL` 或 `_HOMESERVER` 結尾的鍵，還有完整的 `OPENCLAW_*`、`CLAWHUB_*`、`ANTHROPIC_API_KEY_*` 與 `OPENAI_API_KEY_*` 命名空間。

請改用下列其中一個受信任來源來保存供應商憑證：

- 閘道程序環境，例如 shell、launchd/systemd 單元、容器密鑰或 CI 密鑰。
- 位於 `~/.openclaw/.env` 或 `$OPENCLAW_STATE_DIR/.env` 的全域執行階段 dotenv 檔案。
- 位於 `~/.openclaw/openclaw.json` 的設定 `env` 區塊。
- 啟用 `env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1` 時，選用的登入 shell 匯入。

如果您先前只將供應商金鑰儲存在工作區 `.env` 中，請將它們移至上述其中一個受信任來源。工作區 `.env` 仍可提供非憑證、非端點重新導向、非主機覆寫，且不是 `OPENCLAW_*` 執行階段控制項的一般專案變數。

如需瞭解安全性設計理由，請參閱[工作區 `.env` 檔案](/zh-TW/gateway/security#workspace-env-files)。

## 設定 `env` 區塊

有兩種等效方式可設定行內環境變數（兩者都不會覆寫）：

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

設定 `env` 區塊只接受常值字串。它不會展開
`file:...` 值；例如，`XAI_API_KEY: "file:secrets/xai-api-key.txt"`
會以該確切字串傳遞給供應商。

對於以檔案為來源的供應商金鑰，請在支援該功能的憑證欄位上使用 SecretRef：

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

如需支援欄位的資訊，請參閱[密鑰管理](/zh-TW/gateway/secrets)與
[SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)。

## Shell 環境匯入

`env.shellEnv` 會執行您的登入 shell，且只匯入**缺少的**預期鍵：

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

對應的環境變數：

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`（預設為 `15000`）

## Exec shell 快照

在非 Windows 的閘道主機上，bash 與 zsh 的 `exec` 命令預設會使用啟動快照。
若要停用此路徑，請在閘道程序環境中設定 `OPENCLAW_EXEC_SHELL_SNAPSHOT=0`。
值 `false`、`no` 和 `off` 也會停用此功能。每次呼叫的 `exec.env` 值無法切換
快照或重新導向快照快取。

## 執行階段注入的環境變數

OpenClaw 也會將情境標記注入所產生的子程序：

- `OPENCLAW_SHELL=exec`：為透過 `exec` 工具執行的命令設定。
- `OPENCLAW_SHELL=acp-client`：當 `openclaw acp client` 產生 ACP 橋接程序時設定。
- `OPENCLAW_SHELL=tui-local`：為本機終端介面 `!` shell 命令設定。
- `OPENCLAW_CLI=1`：為命令列介面進入點產生的子程序設定。

這些是執行階段標記（不是必要的使用者設定）。它們可用於 shell／設定檔邏輯，
以套用特定情境的規則。

## 使用者介面環境變數

- `OPENCLAW_THEME=light`：當終端機使用淺色背景時，強制採用淺色終端介面調色盤。
- `OPENCLAW_THEME=dark`：強制採用深色終端介面調色盤。
- `COLORFGBG`：如果終端機會匯出此變數，OpenClaw 會使用背景色提示自動選擇終端介面調色盤。

## 設定中的環境變數替換

您可以使用 `${VAR_NAME}` 語法，直接在設定字串值中參照環境變數：

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

如需完整詳細資訊，請參閱[設定：環境變數替換](/zh-TW/gateway/configuration-reference#env-var-substitution)。

## 密鑰參照與 `${ENV}` 字串

OpenClaw 支援兩種由環境變數驅動的模式：

- 設定值中的 `${VAR}` 字串替換。
- 對支援密鑰參照的欄位使用 SecretRef 物件（`{ source: "env", provider: "default", id: "VAR" }`）。

兩者都會在啟用時從程序環境解析。SecretRef 的詳細資訊記錄於[密鑰管理](/zh-TW/gateway/secrets)。
設定 `env` 區塊本身不會解析 SecretRef 或 `file:...`
簡寫值。

## 路徑相關環境變數

| 變數                     | 用途                                                                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | 覆寫 OpenClaw 內部路徑預設值所使用的家目錄（`~/.openclaw/`、代理程式目錄、工作階段、憑證、安裝程式初始設定，以及預設開發簽出）。以專用服務使用者身分執行 OpenClaw 時相當實用。 |
| `OPENCLAW_STATE_DIR`     | 覆寫狀態目錄（預設為 `~/.openclaw`）。                                                                                                                                                                                                |
| `OPENCLAW_CONFIG_PATH`   | 覆寫設定檔路徑（預設為 `~/.openclaw/openclaw.json`）。                                                                                                                                                                                |
| `OPENCLAW_INCLUDE_ROOTS` | 目錄路徑清單，允許 `$include` 指令從設定目錄外解析檔案（預設：無，`$include` 僅限於設定目錄）。會展開波浪號。                                                                                                                           |

## 記錄

| 變數                             | 用途                                                                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | 覆寫檔案與主控台的記錄層級（例如 `debug`、`trace`）。優先於設定中的 `logging.level` 與 `logging.consoleLevel`。無效值會被忽略並顯示警告。 |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | 在不啟用全域偵錯記錄的情況下，以 `info` 層級輸出針對性的模型請求／回應計時診斷。                                                                                                                    |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | 模型承載資料診斷：`summary`、`tools` 或 `full-redacted`。`full-redacted` 會受到大小限制並經過遮蔽，但可能包含提示詞／訊息文字。                                                                       |
| `OPENCLAW_DEBUG_SSE`             | 串流診斷：使用 `events` 記錄首次／完成計時，使用 `peek` 納入前五個經遮蔽的 SSE 事件。                                                                                                                |
| `OPENCLAW_DEBUG_CODE_MODE`       | 程式碼模式的模型介面診斷，包括隱藏供應商工具，以及精簡控制／直接強制執行。                                                                                                                          |

### `OPENCLAW_HOME`

設定後，`OPENCLAW_HOME` 會取代 OpenClaw 內部路徑預設值所使用的系統家目錄（`$HOME`／`os.homedir()`）。這包括預設狀態目錄、設定路徑、代理程式目錄、憑證、安裝程式初始設定工作區，以及 `openclaw update --channel dev` 使用的預設開發簽出。

**優先順序：** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > Android 上的 Termux `PREFIX` 家目錄備援 > `os.homedir()`

**範例**（macOS LaunchDaemon）：

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` 也可設定為波浪號路徑（例如 `~/svc`）；使用前，會透過相同的作業系統家目錄備援鏈展開。

`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH` 和 `OPENCLAW_GIT_DIR` 等明確路徑變數仍具有較高優先順序。作業系統帳號相關工作，例如偵測 shell 啟動檔、設定套件管理器，以及展開主機上的 `~`，仍可能使用實際的系統家目錄。

## nvm 使用者：web_fetch TLS 失敗

如果 Node.js 是透過 **nvm**（而非系統套件管理器）安裝，內建的 `fetch()` 會使用
nvm 隨附的 CA 存放區，其中可能缺少現代根 CA（例如 Let's Encrypt 的 ISRG Root X1/X2、
DigiCert Global Root G2 等）。這會導致 `web_fetch` 在大多數 HTTPS 網站上發生 `"fetch failed"` 錯誤。

在 Linux 上，OpenClaw 會自動偵測 nvm，並在實際啟動環境中套用修正：

- `openclaw gateway install` 會將 `NODE_EXTRA_CA_CERTS` 寫入 systemd 服務環境
- `openclaw` 命令列介面進入點會在 Node 啟動前，設定 `NODE_EXTRA_CA_CERTS` 並重新執行自身

**手動修正（適用於舊版本或直接執行 `node ...`）：**

啟動 OpenClaw 前匯出此變數：

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

不要只將此變數寫入 `~/.openclaw/.env`；Node 會在程序啟動時讀取
`NODE_EXTRA_CA_CERTS`。

## 舊版環境變數

OpenClaw 只會讀取 `OPENCLAW_*` 環境變數。舊版發行中的
`CLAWDBOT_*` 與 `MOLTBOT_*` 前綴會被無聲忽略。

如果閘道程序啟動時仍設定了任何此類變數，OpenClaw 會輸出一則
Node 淘汰警告（`OPENCLAW_LEGACY_ENV_VARS`），列出偵測到的前綴與總數。
請將每個值的舊版前綴替換為 `OPENCLAW_` 以重新命名（例如將
`CLAWDBOT_GATEWAY_TOKEN` 改為 `OPENCLAW_GATEWAY_TOKEN`）；舊名稱不會產生任何作用。

## 相關內容

- [閘道設定](/zh-TW/gateway/configuration)
- [常見問題：環境變數與 .env 載入](/zh-TW/help/faq#env-vars-and-env-loading)
- [模型概覽](/zh-TW/concepts/models)
