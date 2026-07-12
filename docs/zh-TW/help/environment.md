---
read_when:
    - 你需要知道會載入哪些環境變數，以及載入順序。
    - 你正在偵錯閘道中缺少 API 金鑰的問題
    - 你正在記錄提供者驗證或部署環境
summary: OpenClaw 載入環境變數的位置與優先順序
title: 環境變數
x-i18n:
    generated_at: "2026-07-12T14:32:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e0010465008969ea1ebf7bb79d01ee86b7be20f7b6d0d90da72d8b0a3b1ed273
    source_path: help/environment.md
    workflow: 16
---

OpenClaw 會從多個來源載入環境變數。規則是**絕不覆寫現有值**。
工作區 `.env` 檔案是信任程度較低的來源：OpenClaw 會先忽略工作區 `.env` 中的供應商認證資訊與受保護的執行階段控制項，再套用優先順序。

## 優先順序（由高至低）

1. **程序環境**（閘道程序已從父 Shell／常駐程式取得的環境）。
2. **目前工作目錄中的 `.env`**（dotenv 預設值；不覆寫；忽略供應商認證資訊與受保護的執行階段控制項）。
3. **全域 `.env`**，位於 `~/.openclaw/.env`（亦即 `$OPENCLAW_STATE_DIR/.env`；建議用於供應商 API 金鑰；不覆寫）。
4. **設定中的 `env` 區塊**，位於 `~/.openclaw/openclaw.json`（僅在值缺少時套用）。
5. **選用的登入 Shell 匯入**（`env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1`），僅針對缺少的預期金鑰套用。

在使用預設狀態目錄的全新 Ubuntu 安裝中，OpenClaw 也會將 `~/.config/openclaw/gateway.env` 視為全域 `.env` 之後的相容性備援。若兩個檔案都存在且內容不一致，OpenClaw 會保留 `~/.openclaw/.env` 的值並顯示警告。

若設定檔完全不存在，會略過步驟 4；如果已啟用 Shell 匯入，仍會執行。

## 供應商認證資訊與工作區 `.env`

請勿只將供應商 API 金鑰存放在工作區 `.env` 中。OpenClaw 會封鎖工作區 `.env` 檔案中的大量供應商認證資訊與端點重新導向金鑰，包括所有已知的供應商驗證環境變數（例如 `GEMINI_API_KEY`、`GOOGLE_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`GROQ_API_KEY`、`DEEPSEEK_API_KEY`、`PERPLEXITY_API_KEY`、`BRAVE_API_KEY`、`TAVILY_API_KEY`、`EXA_API_KEY`、`FIRECRAWL_API_KEY`），以及任何以 `_API_HOST`、`_BASE_URL` 或 `_HOMESERVER` 結尾的金鑰，還有完整的 `OPENCLAW_*`、`CLAWHUB_*`、`ANTHROPIC_API_KEY_*` 與 `OPENAI_API_KEY_*` 命名空間。

請改用下列其中一個受信任來源來存放供應商認證資訊：

- 閘道程序環境，例如 Shell、launchd／systemd 單元、容器密鑰或 CI 密鑰。
- 位於 `~/.openclaw/.env` 或 `$OPENCLAW_STATE_DIR/.env` 的全域執行階段 dotenv 檔案。
- `~/.openclaw/openclaw.json` 設定中的 `env` 區塊。
- 啟用 `env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1` 時的選用登入 Shell 匯入。

若你先前只將供應商金鑰存放在工作區 `.env` 中，請將它們移至上述其中一個受信任來源。工作區 `.env` 仍可提供一般專案變數，但不得是認證資訊、端點重新導向、主機覆寫或 `OPENCLAW_*` 執行階段控制項。

如需瞭解安全性考量，請參閱[工作區 `.env` 檔案](/zh-TW/gateway/security#workspace-env-files)。

## 設定 `env` 區塊

有兩種等效方式可設定行內環境變數（兩者皆不會覆寫）：

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

設定中的 `env` 區塊僅接受常值字串。它不會展開
`file:...` 值；例如，`XAI_API_KEY: "file:secrets/xai-api-key.txt"`
會以完全相同的字串傳遞給供應商。

對於由檔案支援的供應商金鑰，請在支援 SecretRef 的認證資訊欄位中使用
SecretRef：

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

如需瞭解支援的欄位，請參閱[密鑰管理](/zh-TW/gateway/secrets)與
[SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface)。

## Shell 環境匯入

`env.shellEnv` 會執行你的登入 Shell，且僅匯入**缺少的**預期金鑰：

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

等效環境變數：

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`（預設為 `15000`）

## Exec Shell 快照

在非 Windows 的閘道主機上，bash 與 zsh 的 `exec` 命令預設會使用啟動快照。
在閘道程序環境中設定 `OPENCLAW_EXEC_SHELL_SNAPSHOT=0`，即可停用此路徑。
值 `false`、`no` 與 `off` 也會停用它。單次呼叫的 `exec.env` 值無法切換
快照或重新導向快照快取。

## 執行階段注入的環境變數

OpenClaw 也會將情境標記注入所產生的子程序：

- `OPENCLAW_SHELL=exec`：為透過 `exec` 工具執行的命令設定。
- `OPENCLAW_SHELL=acp-client`：當 `openclaw acp client` 產生 ACP 橋接程序時設定。
- `OPENCLAW_SHELL=tui-local`：為本機終端介面 `!` Shell 命令設定。
- `OPENCLAW_CLI=1`：為命令列介面進入點產生的子程序設定。

這些是執行階段標記（並非必要的使用者設定）。你可以在 Shell／設定檔邏輯中使用它們，
以套用特定情境的規則。

## UI 環境變數

- `OPENCLAW_THEME=light`：當終端機使用淺色背景時，強制使用淺色終端介面色盤。
- `OPENCLAW_THEME=dark`：強制使用深色終端介面色盤。
- `COLORFGBG`：若終端機有匯出此值，OpenClaw 會使用背景色提示自動選擇終端介面色盤。

## 設定中的環境變數替換

你可以使用 `${VAR_NAME}` 語法，直接在設定字串值中參照環境變數：

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
- 適用於支援密鑰參照欄位的 SecretRef 物件（`{ source: "env", provider: "default", id: "VAR" }`）。

兩者都會在啟用時從程序環境解析。SecretRef 的詳細資訊記載於[密鑰管理](/zh-TW/gateway/secrets)。
設定中的 `env` 區塊本身不會解析 SecretRef 或 `file:...`
簡寫值。

## 路徑相關環境變數

| 變數                     | 用途                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | 覆寫 OpenClaw 內部路徑預設值使用的家目錄（`~/.openclaw/`、代理程式目錄、工作階段、認證資訊、安裝程式初始設定，以及預設開發簽出）。以專用服務使用者身分執行 OpenClaw 時很有用。 |
| `OPENCLAW_STATE_DIR`     | 覆寫狀態目錄（預設為 `~/.openclaw`）。                                                                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH`   | 覆寫設定檔路徑（預設為 `~/.openclaw/openclaw.json`）。                                                                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | `$include` 指令可從中解析設定目錄以外檔案的目錄路徑清單（預設：無，`$include` 僅限於設定目錄）。會展開波浪號。                                                         |

## 記錄

| 變數                             | 用途                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | 覆寫檔案與主控台的記錄層級（例如 `debug`、`trace`）。優先於設定中的 `logging.level` 與 `logging.consoleLevel`。無效值會被忽略並顯示警告。 |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | 在不啟用全域偵錯記錄的情況下，以 `info` 層級輸出特定模型請求／回應計時診斷。                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | 模型承載資料診斷：`summary`、`tools` 或 `full-redacted`。`full-redacted` 會受到大小限制並經過遮蔽，但可能包含提示詞／訊息文字。                                               |
| `OPENCLAW_DEBUG_SSE`             | 串流診斷：使用 `events` 顯示首次／完成計時；使用 `peek` 納入前五個經遮蔽的 SSE 事件。                                                                                 |
| `OPENCLAW_DEBUG_CODE_MODE`       | 程式碼模式的模型介面診斷，包括隱藏供應商工具，以及精簡控制／直接強制執行。                                                                                  |

### `OPENCLAW_HOME`

設定後，`OPENCLAW_HOME` 會取代系統家目錄（`$HOME`／`os.homedir()`），供 OpenClaw 內部路徑預設值使用。這包括預設狀態目錄、設定路徑、代理程式目錄、認證資訊、安裝程式初始設定工作區，以及 `openclaw update --channel dev` 使用的預設開發簽出。

**優先順序：** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > Android 上的 Termux `PREFIX` 家目錄備援 > `os.homedir()`

**範例**（macOS LaunchDaemon）：

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` 也可設為波浪號路徑（例如 `~/svc`）；使用前會透過相同的作業系統家目錄備援鏈展開。

`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH` 與 `OPENCLAW_GIT_DIR` 等明確路徑變數仍具有較高優先順序。偵測 Shell 啟動檔、設定套件管理員，以及展開主機 `~` 等作業系統帳號工作，仍可能使用實際的系統家目錄。

## nvm 使用者：web_fetch TLS 失敗

若 Node.js 是透過 **nvm**（而非系統套件管理員）安裝，內建的 `fetch()` 會使用
nvm 隨附的 CA 存放區，其中可能缺少較新的根 CA（Let's Encrypt 的 ISRG Root X1/X2、
DigiCert Global Root G2 等）。這會導致大多數 HTTPS 網站上的 `web_fetch` 發生 `"fetch failed"`。

在 Linux 上，OpenClaw 會自動偵測 nvm，並在實際啟動環境中套用修正：

- `openclaw gateway install` 會將 `NODE_EXTRA_CA_CERTS` 寫入 systemd 服務環境
- `openclaw` 命令列介面進入點會在 Node 啟動前設定 `NODE_EXTRA_CA_CERTS`，然後重新執行自身

**手動修正（適用於較舊版本或直接執行 `node ...`）：**

啟動 OpenClaw 前先匯出此變數：

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

請勿只依賴將此變數寫入 `~/.openclaw/.env`；Node 會在程序啟動時讀取
`NODE_EXTRA_CA_CERTS`。

## 舊版環境變數

OpenClaw 僅讀取 `OPENCLAW_*` 環境變數。早期版本的舊版
`CLAWDBOT_*` 與 `MOLTBOT_*` 前綴會被無聲忽略。

若閘道程序啟動時仍設定了任何此類變數，OpenClaw 會輸出單一
Node 淘汰警告（`OPENCLAW_LEGACY_ENV_VARS`），列出偵測到的
前綴與總數。請將舊版前綴替換為 `OPENCLAW_` 來重新命名每個值（例如將 `CLAWDBOT_GATEWAY_TOKEN` 改為
`OPENCLAW_GATEWAY_TOKEN`）；舊名稱不會生效。

## 相關內容

- [閘道設定](/zh-TW/gateway/configuration)
- [常見問題：環境變數與 .env 載入](/zh-TW/help/faq#env-vars-and-env-loading)
- [模型概覽](/zh-TW/concepts/models)
