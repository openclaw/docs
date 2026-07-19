---
read_when:
    - 你需要知道會載入哪些環境變數，以及載入順序。
    - 你正在偵錯閘道中缺少 API 金鑰的問題
    - 你正在記錄供應商驗證或部署環境的相關資訊
summary: OpenClaw 載入環境變數的位置與優先順序
title: 環境變數
x-i18n:
    generated_at: "2026-07-19T13:48:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9f9fdd67ee148931af2e15a12917871a0b85f80f763f0df3a978b7fd39b93eff
    source_path: help/environment.md
    workflow: 16
---

OpenClaw 會從多個來源取得環境變數。規則是**絕不覆寫現有值**。
工作區 `.env` 檔案是信任層級較低的來源：套用優先順序前，OpenClaw 會忽略工作區 `.env` 中的供應商認證資訊與受保護的執行階段控制項。

## 優先順序（由高至低）

1. **程序環境**（閘道程序已從父 Shell／常駐程式取得的環境）。
2. **目前工作目錄中的 `.env`**（dotenv 預設值；不會覆寫；會忽略供應商認證資訊與受保護的執行階段控制項）。
3. 位於 `~/.openclaw/.env` 的**全域 `.env`**（亦稱 `$OPENCLAW_STATE_DIR/.env`；建議用於供應商 API 金鑰；不會覆寫）。
4. `~/.openclaw/openclaw.json` 中的**設定 `env` 區塊**（僅在缺少值時套用）。
5. **選用的登入 Shell 匯入**（`env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1`），僅針對缺少的預期金鑰套用。

在使用預設狀態目錄的全新 Ubuntu 安裝中，OpenClaw 也會在全域 `.env` 之後，將 `~/.config/openclaw/gateway.env` 視為相容性備援。如果兩個檔案都存在且內容不一致，OpenClaw 會保留 `~/.openclaw/.env` 並顯示警告。

如果設定檔完全不存在，將略過步驟 4；若已啟用 Shell 匯入，仍會執行。

## 供應商認證資訊與工作區 `.env`

不要只將供應商 API 金鑰保存在工作區 `.env` 中。OpenClaw 會封鎖工作區 `.env` 檔案中的大量供應商認證資訊與端點重新導向金鑰，包括所有已知的供應商驗證環境變數（例如 `GEMINI_API_KEY`、`GOOGLE_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`GROQ_API_KEY`、`DEEPSEEK_API_KEY`、`PERPLEXITY_API_KEY`、`BRAVE_API_KEY`、`TAVILY_API_KEY`、`EXA_API_KEY`、`FIRECRAWL_API_KEY`），以及任何以 `_API_HOST`、`_BASE_URL`、`_ENDPOINT` 或 `_HOMESERVER` 結尾的金鑰，和整個 `OPENCLAW_*`、`CLAWHUB_*`、`ANTHROPIC_API_KEY_*` 與 `OPENAI_API_KEY_*` 命名空間。

請改用下列任一受信任來源儲存供應商認證資訊：

- 閘道程序環境，例如 Shell、launchd／systemd 單元、容器密鑰或 CI 密鑰。
- 位於 `~/.openclaw/.env` 或 `$OPENCLAW_STATE_DIR/.env` 的全域執行階段 dotenv 檔案。
- `~/.openclaw/openclaw.json` 中的設定 `env` 區塊。
- 啟用 `env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1` 時的選用登入 Shell 匯入。

如果先前只將供應商金鑰或端點路由值儲存在工作區 `.env` 中，請將其移至上述其中一個受信任來源。工作區 `.env` 仍可提供非認證資訊、端點重新導向、主機覆寫或 `OPENCLAW_*` 執行階段控制項的一般專案變數。

安全性原理請參閱[工作區 `.env` 檔案](/zh-TW/gateway/security#workspace-env-files)。

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

設定 `env` 區塊只接受常值字串。它不會展開
`file:...` 值；例如，`XAI_API_KEY: "file:secrets/xai-api-key.txt"`
會以完全相同的字串傳遞給供應商。

對於以檔案為基礎的供應商金鑰，請在支援 SecretRef 的認證資訊欄位中使用 SecretRef：

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

支援的欄位請參閱[密鑰管理](/zh-TW/gateway/secrets)與
[SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface)。

## Shell 環境匯入

`env.shellEnv` 會執行你的登入 Shell，且只匯入**缺少的**預期金鑰：

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
在閘道程序環境中設定 `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` 可停用此路徑。
值 `false`、`no` 和 `off` 也會將其停用。每次呼叫的 `exec.env` 值無法切換
快照或重新導向快照快取。

## 執行階段注入的環境變數

OpenClaw 也會將情境標記注入衍生的子程序：

- `OPENCLAW_SHELL=exec`：針對透過 `exec` 工具執行的命令設定。
- `OPENCLAW_SHELL=acp-client`：當 `openclaw acp client` 衍生 ACP 橋接程序時設定。
- `OPENCLAW_SHELL=tui-local`：針對本機終端介面 `!` Shell 命令設定。
- `OPENCLAW_CLI=1`：針對由命令列介面進入點衍生的子程序設定。

這些是執行階段標記（不是必要的使用者設定）。可在 Shell／設定檔邏輯中使用它們，
以套用情境特定規則。

## UI 環境變數

- `OPENCLAW_THEME=light`：當終端機使用淺色背景時，強制使用終端介面的淺色調色盤。
- `OPENCLAW_THEME=dark`：強制使用終端介面的深色調色盤。
- `COLORFGBG`：如果終端機匯出此變數，OpenClaw 會使用背景色彩提示自動選擇終端介面調色盤。

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

## SecretRef 與 `${ENV}` 字串

OpenClaw 支援兩種由環境變數驅動的模式：

- 設定值中的 `${VAR}` 字串替換。
- 支援密鑰參照欄位的 SecretRef 物件（`{ source: "env", provider: "default", id: "VAR" }`）。

兩者都會在啟用時從程序環境解析。SecretRef 詳細資訊記載於[密鑰管理](/zh-TW/gateway/secrets)。
設定 `env` 區塊本身不會解析 SecretRef 或 `file:...`
簡寫值。

## 路徑相關環境變數

| 變數                 | 用途                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | 覆寫 OpenClaw 內部路徑預設值所使用的主目錄（`~/.openclaw/`、代理程式目錄、工作階段、認證資訊、安裝程式初始設定，以及預設開發簽出）。以專用服務使用者身分執行 OpenClaw 時相當實用。 |
| `OPENCLAW_STATE_DIR`     | 覆寫狀態目錄（預設為 `~/.openclaw`）。                                                                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH`   | 覆寫設定檔路徑（預設為 `~/.openclaw/openclaw.json`）。                                                                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | `$include` 指令可從中解析設定目錄外部檔案的目錄路徑清單（預設：無 — `$include` 僅限於設定目錄）。會展開波浪號。                                                         |

## 代理程式輔助工具下載

設定 `OPENCLAW_OFFLINE=1` 可防止 OpenClaw 下載其固定版本的 `fd`
與 `ripgrep` 輔助二進位檔。OpenClaw 工具目錄下的現有輔助工具
及可運作的系統二進位檔仍可使用；缺少的輔助工具會維持
不可用，而不會觸發網路要求。

## 記錄

| 變數                         | 用途                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | 同時覆寫檔案與主控台的記錄層級（例如 `debug`、`trace`）。優先於設定中的 `logging.level` 與 `logging.consoleLevel`。無效值會被忽略並顯示警告。 |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | 在 `info` 層級輸出特定模型要求／回應計時診斷，而不啟用全域偵錯記錄。                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | 模型承載資料診斷：`summary`、`tools` 或 `full-redacted`。`full-redacted` 有大小上限且會遮蔽敏感資訊，但可能包含提示／訊息文字。                                               |
| `OPENCLAW_DEBUG_SSE`             | 串流診斷：`events` 用於首次／完成計時，`peek` 可包含前五個已遮蔽敏感資訊的 SSE 事件。                                                                                 |
| `OPENCLAW_DEBUG_CODE_MODE`       | 程式碼模式的模型介面診斷，包括隱藏供應商工具，以及精簡控制／直接強制執行。                                                                                  |

### `OPENCLAW_HOME`

設定後，`OPENCLAW_HOME` 會取代 OpenClaw 內部路徑預設值所使用的系統主目錄（`$HOME`／`os.homedir()`）。這包括預設狀態目錄、設定路徑、代理程式目錄、認證資訊、安裝程式初始設定工作區，以及 `openclaw update --channel dev` 使用的預設開發簽出。

**優先順序：**`OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > Android 上的 Termux `PREFIX` 主目錄備援 > `os.homedir()`

**範例**（macOS LaunchDaemon）：

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` 也可設為波浪號路徑（例如 `~/svc`），使用前會透過相同的作業系統主目錄備援鏈展開。

`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH` 和 `OPENCLAW_GIT_DIR` 等明確路徑變數仍具有較高優先順序。Shell 啟動檔案偵測、套件管理器設定及主機 `~` 展開等作業系統帳號工作，仍可能使用實際系統主目錄。

## nvm 使用者：web_fetch TLS 失敗

如果 Node.js 是透過 **nvm**（而非系統套件管理器）安裝，內建的 `fetch()` 會使用
nvm 隨附的 CA 存放區，其中可能缺少現代根 CA（Let's Encrypt 的 ISRG Root X1/X2、
DigiCert Global Root G2 等）。這會導致 `web_fetch` 在大多數 HTTPS 網站上發生 `"fetch failed"` 錯誤。

在 Linux 上，OpenClaw 會自動偵測 nvm，並在實際啟動環境中套用修正：

- `openclaw gateway install` 會將 `NODE_EXTRA_CA_CERTS` 寫入 systemd 服務環境
- `openclaw` 命令列介面進入點會在 Node 啟動前設定 `NODE_EXTRA_CA_CERTS`，然後重新執行自身

**手動修正（適用於較舊版本或直接啟動 `node ...`）：**

啟動 OpenClaw 前先匯出此變數：

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

請勿依賴僅將此變數寫入 `~/.openclaw/.env`；Node 會在處理程序啟動時讀取
`NODE_EXTRA_CA_CERTS`。

## 舊版環境變數

OpenClaw 僅讀取 `OPENCLAW_*` 環境變數。舊版發行版本所使用的
`CLAWDBOT_*` 和 `MOLTBOT_*` 前綴會被直接忽略。

如果閘道處理程序啟動時仍設有任何這類變數，OpenClaw 會發出一則
Node 淘汰警告（`OPENCLAW_LEGACY_ENV_VARS`），列出偵測到的前綴和總數。
請將舊版前綴替換為 `OPENCLAW_`，以重新命名每個值（例如將
`CLAWDBOT_GATEWAY_TOKEN` 改為 `OPENCLAW_GATEWAY_TOKEN`）；舊名稱不會生效。

## 相關內容

- [閘道設定](/zh-TW/gateway/configuration)
- [常見問題：環境變數與 .env 載入](/zh-TW/help/faq#env-vars-and-env-loading)
- [模型概覽](/zh-TW/concepts/models)
