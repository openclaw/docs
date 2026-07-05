---
read_when:
    - 你需要知道載入了哪些環境變數，以及載入順序。
    - 你正在偵錯閘道中遺失的 API 金鑰
    - 你正在記錄供應商驗證或部署環境
summary: OpenClaw 載入環境變數的位置與優先順序
title: 環境變數
x-i18n:
    generated_at: "2026-07-05T11:25:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5b5b3b94d314018fe31c21b5de4e9c1e09df3787287a0609afb1ae32ae3f010
    source_path: help/environment.md
    workflow: 16
---

OpenClaw 會從多個來源載入環境變數。規則是**絕不覆寫既有值**。
工作區 `.env` 檔案是信任度較低的來源：OpenClaw 會先忽略工作區 `.env` 中的提供者憑證與受保護的執行階段控制項，再套用優先順序。

## 優先順序（由高到低）

1. **程序環境**（閘道程序已從父 shell/daemon 取得的內容）。
2. **目前工作目錄中的 `.env`**（dotenv 預設；不會覆寫；提供者憑證與受保護的執行階段控制項會被忽略）。
3. **全域 `.env`**，位於 `~/.openclaw/.env`（也就是 `$OPENCLAW_STATE_DIR/.env`；建議用於提供者 API 金鑰；不會覆寫）。
4. **設定 `env` 區塊**，位於 `~/.openclaw/openclaw.json`（僅在缺少時套用）。
5. **選用的登入 shell 匯入**（`env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1`），僅套用於缺少的預期金鑰。

在使用預設狀態目錄的全新 Ubuntu 安裝中，OpenClaw 也會在全域 `.env` 之後，將 `~/.config/openclaw/gateway.env` 視為相容性備援。如果兩個檔案都存在且內容不一致，OpenClaw 會保留 `~/.openclaw/.env` 並列印警告。

如果設定檔完全不存在，會略過步驟 4；shell 匯入若已啟用仍會執行。

## 提供者憑證與工作區 `.env`

不要只把提供者 API 金鑰保存在工作區 `.env`。OpenClaw 會從工作區 `.env` 檔案封鎖大量提供者憑證與端點重新導向金鑰，包括每個已知的提供者驗證環境變數（例如 `GEMINI_API_KEY`、`GOOGLE_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`GROQ_API_KEY`、`DEEPSEEK_API_KEY`、`PERPLEXITY_API_KEY`、`BRAVE_API_KEY`、`TAVILY_API_KEY`、`EXA_API_KEY`、`FIRECRAWL_API_KEY`），以及任何以 `_API_HOST`、`_BASE_URL` 或 `_HOMESERVER` 結尾的金鑰，還有整個 `OPENCLAW_*`、`CLAWHUB_*`、`ANTHROPIC_API_KEY_*` 與 `OPENAI_API_KEY_*` 命名空間。

請改用下列其中一個受信任來源來保存提供者憑證：

- 閘道程序環境，例如 shell、launchd/systemd 單元、容器 secret 或 CI secret。
- 位於 `~/.openclaw/.env` 或 `$OPENCLAW_STATE_DIR/.env` 的全域執行階段 dotenv 檔案。
- `~/.openclaw/openclaw.json` 中的設定 `env` 區塊。
- 啟用 `env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1` 時的選用登入 shell 匯入。

如果你先前只把提供者金鑰保存在工作區 `.env`，請將它們移到上述其中一個受信任來源。工作區 `.env` 仍可提供一般專案變數，只要它們不是憑證、端點重新導向、主機覆寫或 `OPENCLAW_*` 執行階段控制項。

請參閱[工作區 `.env` 檔案](/zh-TW/gateway/security#workspace-env-files)以了解安全性理由。

## 設定 `env` 區塊

設定內嵌環境變數有兩種等效方式（兩者都不會覆寫）：

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

設定 `env` 區塊只接受字面字串值。它不會展開
`file:...` 值；例如，`XAI_API_KEY: "file:secrets/xai-api-key.txt"`
會以該確切字串傳給提供者。

若要使用以檔案支援的提供者金鑰，請在支援的憑證欄位上使用 SecretRef：

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

請參閱 [Secrets Management](/zh-TW/gateway/secrets) 與
[SecretRef 憑證表面](/zh-TW/reference/secretref-credential-surface)以了解
支援的欄位。

## Shell 環境匯入

`env.shellEnv` 會執行你的登入 shell，且只匯入**缺少的**預期金鑰：

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

環境變數等效項：

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`（預設 `15000`）

## Exec shell 快照

在非 Windows 閘道主機上，bash 與 zsh `exec` 命令預設使用啟動快照。
在閘道程序環境中設定 `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` 可停用此路徑。
值 `false`、`no` 與 `off` 也會停用它。每次呼叫的 `exec.env` 值無法切換
快照或重新導向快照快取。

## 執行階段注入的環境變數

OpenClaw 也會將內容標記注入衍生的子程序：

- `OPENCLAW_SHELL=exec`：為透過 `exec` 工具執行的命令設定。
- `OPENCLAW_SHELL=acp-client`：為 `openclaw acp client` 衍生 ACP 橋接程序時設定。
- `OPENCLAW_SHELL=tui-local`：為本機終端介面 `!` shell 命令設定。
- `OPENCLAW_CLI=1`：為命令列介面進入點衍生的子程序設定。

這些是執行階段標記（不是必要的使用者設定）。它們可用於 shell/profile 邏輯
以套用特定內容的規則。

## UI 環境變數

- `OPENCLAW_THEME=light`：當你的終端機使用淺色背景時，強制使用淺色終端介面調色盤。
- `OPENCLAW_THEME=dark`：強制使用深色終端介面調色盤。
- `COLORFGBG`：如果你的終端機匯出此變數，OpenClaw 會使用背景色提示自動選擇終端介面調色盤。

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

完整細節請參閱[設定：環境變數替換](/zh-TW/gateway/configuration-reference#env-var-substitution)。

## Secret refs 與 `${ENV}` 字串

OpenClaw 支援兩種由環境驅動的模式：

- 設定值中的 `${VAR}` 字串替換。
- 適用於支援 secrets 參照之欄位的 SecretRef 物件（`{ source: "env", provider: "default", id: "VAR" }`）。

兩者都會在啟用時從程序環境解析。SecretRef 詳細資訊記錄於 [Secrets Management](/zh-TW/gateway/secrets)。
設定 `env` 區塊本身不會解析 SecretRefs 或 `file:...`
簡寫值。

## 路徑相關環境變數

| 變數                     | 用途                                                                                                                                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | 覆寫用於 OpenClaw 內部路徑預設值的家目錄（`~/.openclaw/`、代理程式目錄、工作階段、憑證、安裝程式入門設定，以及預設開發 checkout）。以專用服務使用者執行 OpenClaw 時很有用。 |
| `OPENCLAW_STATE_DIR`     | 覆寫狀態目錄（預設 `~/.openclaw`）。                                                                                                                                                                                                    |
| `OPENCLAW_CONFIG_PATH`   | 覆寫設定檔路徑（預設 `~/.openclaw/openclaw.json`）。                                                                                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | 目錄路徑清單，`$include` 指令可在其中解析設定目錄之外的檔案（預設：無 - `$include` 會限制在設定目錄內）。會展開波浪號。                                                   |

## 記錄

| 變數                             | 用途                                                                                                                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | 覆寫檔案與主控台的記錄層級（例如 `debug`、`trace`）。優先於設定中的 `logging.level` 與 `logging.consoleLevel`。無效值會被忽略並顯示警告。 |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | 在 `info` 層級發出目標明確的模型請求/回應計時診斷，而不啟用全域 debug 記錄。                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | 模型 payload 診斷：`summary`、`tools` 或 `full-redacted`。`full-redacted` 會受限並經過修訂，但可能包含提示/訊息文字。                                               |
| `OPENCLAW_DEBUG_SSE`             | 串流診斷：`events` 用於 first/done 計時，`peek` 用於包含前五個經修訂的 SSE 事件。                                                                                 |
| `OPENCLAW_DEBUG_CODE_MODE`       | code-mode 模型表面診斷，包括隱藏提供者工具與強制只允許 exec/wait。                                                                                          |

### `OPENCLAW_HOME`

設定後，`OPENCLAW_HOME` 會取代系統家目錄（`$HOME` / `os.homedir()`），用於 OpenClaw 內部路徑預設值。這包括預設狀態目錄、設定路徑、代理程式目錄、憑證、安裝程式入門工作區，以及 `openclaw update --channel dev` 使用的預設開發 checkout。

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

明確的路徑變數，例如 `OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH` 與 `OPENCLAW_GIT_DIR` 仍會優先。作業系統帳號工作，例如 shell 啟動檔偵測、套件管理器設定與主機 `~` 展開，仍可能使用真正的系統家目錄。

## nvm 使用者：web_fetch TLS 失敗

如果 Node.js 是透過 **nvm** 安裝（而不是系統套件管理器），內建的 `fetch()` 會使用
nvm 捆綁的 CA 存放區，而其中可能缺少現代根 CA（Let's Encrypt 的 ISRG Root X1/X2、
DigiCert Global Root G2 等）。這會導致 `web_fetch` 在多數 HTTPS 網站上因 `"fetch failed"` 失敗。

在 Linux 上，OpenClaw 會自動偵測 nvm，並在實際啟動環境中套用修正：

- `openclaw gateway install` 會將 `NODE_EXTRA_CA_CERTS` 寫入 systemd 服務環境
- `openclaw` 命令列介面進入點會在 Node.js 啟動前，以已設定 `NODE_EXTRA_CA_CERTS` 的狀態重新 exec 自身

**手動修正（適用於舊版本或直接 `node ...` 啟動）：**

在啟動 OpenClaw 前匯出該變數：

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

不要仰賴只把此變數寫入 `~/.openclaw/.env`；Node.js 會在程序啟動時讀取
`NODE_EXTRA_CA_CERTS`。

## 舊版環境變數

OpenClaw 只讀取 `OPENCLAW_*` 環境變數。早期版本的舊版
`CLAWDBOT_*` 與 `MOLTBOT_*` 前綴會被靜默
忽略。

如果閘道程序啟動時仍設定了任何這類變數，OpenClaw 會發出
單一 Node.js 棄用警告（`OPENCLAW_LEGACY_ENV_VARS`），列出
偵測到的前綴與總數。請將每個值的舊版前綴替換為
`OPENCLAW_` 來重新命名（例如將 `CLAWDBOT_GATEWAY_TOKEN` 改為
`OPENCLAW_GATEWAY_TOKEN`）；舊名稱不會生效。

## 相關

- [閘道設定](/zh-TW/gateway/configuration)
- [常見問題：環境變數與 .env 載入](/zh-TW/help/faq#env-vars-and-env-loading)
- [模型概觀](/zh-TW/concepts/models)
