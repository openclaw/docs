---
read_when:
    - 您需要知道會載入哪些環境變數，以及載入順序。
    - 你正在偵錯閘道中缺少的 API 金鑰
    - 你正在記錄提供者驗證或部署環境
summary: OpenClaw 載入環境變數的位置與優先順序
title: 環境變數
x-i18n:
    generated_at: "2026-06-27T19:24:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e36f93efe29f9cc0e9942659c323a635d21fcaa436427dcb21f5694e5d0458b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw 會從多個來源提取環境變數。規則是**絕不覆寫既有值**。
工作區 `.env` 檔案是較低信任的來源：OpenClaw 會先忽略工作區 `.env` 中的提供者憑證與受保護的執行階段控制，再套用優先順序。

## 優先順序（最高 → 最低）

1. **程序環境**（閘道程序已從父 shell/daemon 取得的內容）。
2. **目前工作目錄中的 `.env`**（dotenv 預設；不會覆寫；提供者憑證與受保護的執行階段控制會被忽略）。
3. **全域 `.env`**，位於 `~/.openclaw/.env`（也就是 `$OPENCLAW_STATE_DIR/.env`；建議用於提供者 API 金鑰；不會覆寫）。
4. **設定檔 `env` 區塊**，位於 `~/.openclaw/openclaw.json`（僅在缺少時套用）。
5. **選用的登入 shell 匯入**（`env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1`），僅套用缺少的預期鍵。

在使用預設狀態目錄的 Ubuntu 全新安裝中，OpenClaw 也會在全域 `.env` 之後，將 `~/.config/openclaw/gateway.env` 視為相容性備援。如果兩個檔案都存在且內容不一致，OpenClaw 會保留 `~/.openclaw/.env` 並列印警告。

如果設定檔完全不存在，步驟 4 會略過；若已啟用 shell 匯入，仍會執行。

## 提供者憑證與工作區 `.env`

不要只把提供者 API 金鑰保存在工作區 `.env`。OpenClaw 會忽略工作區 `.env` 檔案中的提供者憑證環境變數，包括常見鍵，例如 `GEMINI_API_KEY`、`GOOGLE_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`GROQ_API_KEY`、`DEEPSEEK_API_KEY`、`PERPLEXITY_API_KEY`、`BRAVE_API_KEY`、`TAVILY_API_KEY`、`EXA_API_KEY` 與 `FIRECRAWL_API_KEY`。

請使用以下其中一個可信來源存放提供者憑證：

- 閘道程序環境，例如 shell、launchd/systemd 單元、容器密鑰或 CI 密鑰。
- 位於 `~/.openclaw/.env` 或 `$OPENCLAW_STATE_DIR/.env` 的全域執行階段 dotenv 檔案。
- `~/.openclaw/openclaw.json` 中的設定檔 `env` 區塊。
- 已啟用 `env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1` 時的選用登入 shell 匯入。

如果你先前只將提供者金鑰儲存在工作區 `.env`，請將它們移到上述其中一個可信來源。工作區 `.env` 仍可提供一般專案變數，只要它們不是憑證、端點重新導向、主機覆寫或 `OPENCLAW_*` 執行階段控制。

安全性理由請參閱[工作區 `.env` 檔案](/zh-TW/gateway/security#workspace-env-files)。

## 設定檔 `env` 區塊

設定行內環境變數的兩種等效方式（兩者都不會覆寫）：

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

設定檔 `env` 區塊只接受字面字串值。它不會展開
`file:...` 值；例如，`XAI_API_KEY: "file:secrets/xai-api-key.txt"`
會作為該精確字串傳遞給提供者。

若要使用檔案支援的提供者金鑰，請在支援該功能的憑證欄位上使用 SecretRef：

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
[SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)。

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

等效的環境變數：

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Exec shell 快照

在非 Windows 閘道主機上，bash 與 zsh `exec` 命令預設使用啟動快照。
請在閘道程序環境中設定 `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` 以停用此路徑。
值 `false`、`no` 與 `off` 也會停用它。每次呼叫的 `exec.env` 值無法切換
快照或重新導向快照快取。

## 執行階段注入的環境變數

OpenClaw 也會將內容標記注入衍生的子程序：

- `OPENCLAW_SHELL=exec`：為透過 `exec` 工具執行的命令設定。
- `OPENCLAW_SHELL=acp`：為 ACP 執行階段後端程序衍生設定（例如 `acpx`）。
- `OPENCLAW_SHELL=acp-client`：為 `openclaw acp client` 衍生 ACP 橋接程序時設定。
- `OPENCLAW_SHELL=tui-local`：為本機終端介面 `!` shell 命令設定。
- `OPENCLAW_CLI=1`：為命令列介面進入點衍生的子程序設定。

這些是執行階段標記（不是必要的使用者設定）。它們可用於 shell/profile 邏輯，以套用特定內容的規則。

## UI 環境變數

- `OPENCLAW_THEME=light`：當你的終端機有淺色背景時，強制使用淺色終端介面調色盤。
- `OPENCLAW_THEME=dark`：強制使用深色終端介面調色盤。
- `COLORFGBG`：如果你的終端機匯出它，OpenClaw 會使用背景顏色提示自動選擇終端介面調色盤。

## 設定檔中的環境變數替換

你可以使用 `${VAR_NAME}` 語法，在設定檔字串值中直接參照環境變數：

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

## Secret refs 與 `${ENV}` 字串

OpenClaw 支援兩種由環境驅動的模式：

- 設定值中的 `${VAR}` 字串替換。
- 對於支援密鑰參照的欄位，使用 SecretRef 物件（`{ source: "env", provider: "default", id: "VAR" }`）。

兩者都會在啟用時從程序環境解析。SecretRef 詳細資訊記錄於[密鑰管理](/zh-TW/gateway/secrets)。
設定檔 `env` 區塊本身不會解析 SecretRefs 或 `file:...`
簡寫值。

## 路徑相關環境變數

| 變數                     | 用途                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | 覆寫用於內部 OpenClaw 路徑預設值的家目錄（`~/.openclaw/`、代理目錄、工作階段、憑證、安裝程式初始設定，以及預設開發 checkout）。當以專用服務使用者執行 OpenClaw 時很有用。 |
| `OPENCLAW_STATE_DIR`     | 覆寫狀態目錄（預設 `~/.openclaw`）。                                                                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH`   | 覆寫設定檔路徑（預設 `~/.openclaw/openclaw.json`）。                                                                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | 目錄路徑清單，`$include` 指令可在這些目錄中解析設定目錄以外的檔案（預設：無 — `$include` 受限於設定目錄）。會展開波浪號。                                                         |

## 記錄

| 變數                             | 用途                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | 覆寫檔案與主控台的記錄層級（例如 `debug`、`trace`）。優先於設定檔中的 `logging.level` 與 `logging.consoleLevel`。無效值會被忽略並顯示警告。 |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | 在 `info` 層級發出目標式模型請求/回應計時診斷，而不啟用全域 debug 記錄。                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | 模型承載診斷：`summary`、`tools` 或 `full-redacted`。`full-redacted` 會受限並遮蔽，但可能包含提示/訊息文字。                                               |
| `OPENCLAW_DEBUG_SSE`             | 串流診斷：`events` 用於開始/完成計時，`peek` 會包含前五個已遮蔽的 SSE 事件。                                                                                 |
| `OPENCLAW_DEBUG_CODE_MODE`       | 程式碼模式模型介面診斷，包括提供者工具隱藏與僅 exec/wait 強制執行。                                                                                          |

### `OPENCLAW_HOME`

設定後，`OPENCLAW_HOME` 會取代系統家目錄（`$HOME` / `os.homedir()`），用於內部 OpenClaw 路徑預設值。這包括預設狀態目錄、設定檔路徑、代理目錄、憑證、安裝程式初始設定工作區，以及 `openclaw update --channel dev` 使用的預設開發 checkout。

**優先順序：** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > Android 上的 Termux `PREFIX` 家目錄備援 > `os.homedir()`

**範例**（macOS LaunchDaemon）：

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` 也可以設定為波浪號路徑（例如 `~/svc`），使用前會透過相同的作業系統家目錄備援鏈展開。

明確路徑變數，例如 `OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH` 與 `OPENCLAW_GIT_DIR` 仍具有優先權。作業系統帳號工作，例如 shell 啟動檔偵測、套件管理器設定，以及主機 `~` 展開，仍可能使用真正的系統家目錄。

## nvm 使用者：web_fetch TLS 失敗

如果 Node.js 是透過 **nvm** 安裝（而不是系統套件管理器），內建 `fetch()` 會使用
nvm 隨附的 CA 儲存區，該儲存區可能缺少現代根 CA（Let's Encrypt 的 ISRG Root X1/X2、
DigiCert Global Root G2 等）。這會導致 `web_fetch` 在大多數 HTTPS 網站上以 `"fetch failed"` 失敗。

在 Linux 上，OpenClaw 會自動偵測 nvm，並在實際啟動環境中套用修正：

- `openclaw gateway install` 會將 `NODE_EXTRA_CA_CERTS` 寫入 systemd 服務環境
- `openclaw` 命令列介面進入點會在節點啟動前，以已設定 `NODE_EXTRA_CA_CERTS` 的狀態重新 exec 自身

**手動修正（用於較舊版本或直接 `node ...` 啟動）：**

在啟動 OpenClaw 前匯出此變數：

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

不要只依賴將此變數寫入 `~/.openclaw/.env`；節點會在程序啟動時讀取
`NODE_EXTRA_CA_CERTS`。

## 舊版環境變數

OpenClaw 只讀取 `OPENCLAW_*` 環境變數。早期版本中的舊版
`CLAWDBOT_*` 與 `MOLTBOT_*` 前綴會被靜默
忽略。

如果閘道程序啟動時仍設定了任何這類變數，OpenClaw 會發出
單一節點棄用警告（`OPENCLAW_LEGACY_ENV_VARS`），列出
偵測到的前綴與總數。請將每個值的舊版前綴替換為
`OPENCLAW_` 來重新命名（例如 `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`）；舊名稱不會生效。

## 相關

- [閘道設定](/zh-TW/gateway/configuration)
- [常見問題：環境變數與 .env 載入](/zh-TW/help/faq#env-vars-and-env-loading)
- [模型概覽](/zh-TW/concepts/models)
