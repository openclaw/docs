---
read_when:
    - 你需要精確的欄位層級設定語意或預設值
    - 您正在驗證頻道、模型、Gateway 或工具組態區塊
summary: Gateway 設定參考，涵蓋 OpenClaw 核心鍵、預設值，以及專用子系統參考文件的連結
title: 設定參考
x-i18n:
    generated_at: "2026-05-10T19:33:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71a9b9ba64b334086a3e32fd9255eb45f9089818a1798a4d542d39d586d53fd9
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Core 設定參考，適用於 `~/.openclaw/openclaw.json`。若要查看以任務為導向的概覽，請參閱[設定](/zh-TW/gateway/configuration)。

涵蓋主要的 OpenClaw 設定介面，並在子系統有自己的深入參考時連結到對應頁面。Channel 和 plugin 擁有的命令目錄，以及深層 memory/QMD 調整項，位於各自的頁面，而不是此頁。

程式碼事實來源：

- `openclaw config schema` 會列印用於驗證與 Control UI 的即時 JSON Schema，並在可用時合併 bundled/plugin/channel 中繼資料
- `config.schema.lookup` 會回傳一個依路徑範圍限定的 schema 節點，供深入檢視工具使用
- `pnpm config:docs:check` / `pnpm config:docs:gen` 會根據目前的 schema 介面驗證 config-doc 基準雜湊

Agent 查找路徑：編輯前，請使用 `gateway` tool action `config.schema.lookup` 取得精確欄位層級文件與限制。使用[設定](/zh-TW/gateway/configuration)取得以任務為導向的指引，並使用本頁取得更廣泛的欄位對照、預設值與子系統參考連結。

專用深入參考：

- [Memory 設定參考](/zh-TW/reference/memory-config)，適用於 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及 `plugins.entries.memory-core.config.dreaming` 下的 dreaming 設定
- [斜線命令](/zh-TW/tools/slash-commands)，適用於目前內建 + bundled 命令目錄
- 擁有 channel-specific 命令介面的 channel/plugin 頁面

設定格式為 **JSON5**（允許註解 + 尾隨逗號）。所有欄位都是選用的 - 省略時 OpenClaw 會使用安全預設值。

---

## Channels

每個 channel 的設定鍵已移至專用頁面 - 請參閱
[設定 - channels](/zh-TW/gateway/config-channels) 查看 `channels.*`，
包括 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage，以及其他
bundled channels（驗證、存取控制、多帳戶、提及閘控）。

## Agent 預設值、多 agent、sessions 與 messages

已移至專用頁面 - 請參閱
[設定 - agents](/zh-TW/gateway/config-agents) 查看：

- `agents.defaults.*`（workspace、model、thinking、heartbeat、memory、media、skills、sandbox）
- `multiAgent.*`（多 agent 路由與綁定）
- `session.*`（session 生命週期、compaction、修剪）
- `messages.*`（message 傳遞、TTS、markdown 算繪）
- `talk.*`（Talk 模式）
  - `talk.consultThinkingLevel`：Control UI Talk 即時諮詢背後完整 OpenClaw agent 執行的思考等級覆寫
  - `talk.consultFastMode`：Control UI Talk 即時諮詢的一次性快速模式覆寫
  - `talk.speechLocale`：iOS/macOS 上 Talk 語音辨識的選用 BCP 47 locale id
  - `talk.silenceTimeoutMs`：未設定時，Talk 會在送出逐字稿前保留平台預設暫停視窗（`macOS 和 Android 為 700 ms，iOS 為 900 ms`）

## Tools 與自訂 providers

Tool policy、實驗性切換、provider-backed tool 設定，以及自訂
provider / base-URL 設定已移至專用頁面 - 請參閱
[設定 - tools 與自訂 providers](/zh-TW/gateway/config-tools)。

## Models

Provider 定義、model allowlists 與自訂 provider 設定位於
[設定 - tools 與自訂 providers](/zh-TW/gateway/config-tools#custom-providers-and-base-urls)。
`models` 根也擁有全域 model-catalog 行為。

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`：provider catalog 行為（`merge` 或 `replace`）。
- `models.providers`：以 provider id 為鍵的自訂 provider 對照表。
- `models.providers.*.localService`：本機 model servers 的選用隨需 process manager。OpenClaw 會探測已設定的 health endpoint，必要時啟動絕對路徑 `command`，等待就緒，然後傳送 model request。請參閱[本機 model services](/zh-TW/gateway/local-model-services)。
- `models.pricing.enabled`：控制在 sidecars 與 channels 抵達 Gateway ready path 後啟動的背景 pricing bootstrap。當為 `false` 時，Gateway 會略過 OpenRouter 與 LiteLLM pricing-catalog 擷取；已設定的 `models.providers.*.models[].cost` 值仍可用於本機成本估算。

## MCP

OpenClaw 管理的 MCP server 定義位於 `mcp.servers` 下，並由 embedded Pi 和其他 runtime adapters 使用。`openclaw mcp list`、`show`、`set` 與 `unset` 命令會管理此區塊，且在設定編輯期間不連線到目標 server。

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`：命名的 stdio 或 remote MCP server 定義，供公開已設定 MCP tools 的 runtimes 使用。
  Remote entries 使用 `transport: "streamable-http"` 或 `transport: "sse"`；
  `type: "http"` 是 CLI-native alias，`openclaw mcp set` 與
  `openclaw doctor --fix` 會將其正規化為標準 `transport` 欄位。
- `mcp.sessionIdleTtlMs`：session-scoped bundled MCP runtimes 的 idle TTL。
  一次性 embedded runs 會要求 run-end cleanup；此 TTL 是長時間存活 sessions 與未來 callers 的後備機制。
- `mcp.*` 下的變更會透過處置 cached session MCP runtimes 熱套用。
  下一次 tool discovery/use 會根據新設定重新建立它們，因此移除的
  `mcp.servers` entries 會立即被回收，而不是等待 idle TTL。

請參閱 [MCP](/zh-TW/cli/mcp#openclaw-as-an-mcp-client-registry) 與
[CLI backends](/zh-TW/gateway/cli-backends#bundle-mcp-overlays) 了解 runtime 行為。

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`：僅適用於 bundled skills 的選用 allowlist（不影響 managed/workspace skills）。
- `load.extraDirs`：額外 shared skill roots（最低優先順序）。
- `load.allowSymlinkTargets`：受信任的實際 target roots，當 skill symlinks 位於其設定 source root 外部時，可解析至這些位置。
- `install.preferBrew`：為 true 時，若 `brew` 可用，會先偏好 Homebrew installers，之後才 fallback 至其他 installer kinds。
- `install.nodeManager`：`metadata.openclaw.install` specs 的 node installer 偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`：允許受信任的 `operator.admin` Gateway clients 安裝透過 `skills.upload.*` 暫存的私有 zip archives（預設：false）。這只會啟用 uploaded-archive path；一般 ClawHub 安裝不需要它。
- `entries.<skillKey>.enabled: false`：即使 skill 為 bundled/installed，也會停用該 skill。
- `entries.<skillKey>.apiKey`：供宣告主要 env var 的 skills 使用的便利設定（plaintext string 或 SecretRef object）。

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- 從 `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`，以及 `plugins.load.paths` 載入。
- Discovery 接受 native OpenClaw plugins，以及相容的 Codex bundles 和 Claude bundles，包括 manifestless Claude default-layout bundles。
- **設定變更需要重新啟動 gateway。**
- `allow`：選用 allowlist（只載入列出的 plugins）。`deny` 優先。
- `bundledDiscovery`：新設定預設為 `"allowlist"`，因此非空的 `plugins.allow` 也會對 bundled provider plugins 進行閘控，包括 web-search runtime providers。Doctor 會為 migrated legacy allowlist configs 寫入 `"compat"`，以保留既有 bundled provider 行為，直到你選擇加入。
- `plugins.entries.<id>.apiKey`：plugin-level API key 便利欄位（當 plugin 支援時）。
- `plugins.entries.<id>.env`：plugin-scoped env var 對照表。
- `plugins.entries.<id>.hooks.allowPromptInjection`：當為 `false` 時，core 會封鎖 `before_prompt_build`，並忽略 legacy `before_agent_start` 中會變更 prompt 的欄位，同時保留 legacy `modelOverride` 與 `providerOverride`。適用於 native plugin hooks 與支援的 bundle-provided hook directories。
- `plugins.entries.<id>.hooks.allowConversationAccess`：當為 `true` 時，受信任的 non-bundled plugins 可從 typed hooks 讀取原始 conversation content，例如 `llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize` 與 `agent_end`。
- `plugins.entries.<id>.subagent.allowModelOverride`：明確信任此 plugin 可為背景 subagent runs 要求 per-run `provider` 與 `model` 覆寫。
- `plugins.entries.<id>.subagent.allowedModels`：受信任 subagent 覆寫可用的 canonical `provider/model` targets 選用 allowlist。只有在你有意允許任何 model 時才使用 `"*"`。
- `plugins.entries.<id>.llm.allowModelOverride`：明確信任此 plugin 可為 `api.runtime.llm.complete` 要求 model 覆寫。
- `plugins.entries.<id>.llm.allowedModels`：受信任 plugin LLM completion 覆寫可用的 canonical `provider/model` targets 選用 allowlist。只有在你有意允許任何 model 時才使用 `"*"`。
- `plugins.entries.<id>.llm.allowAgentIdOverride`：明確信任此 plugin 可對非預設 agent id 執行 `api.runtime.llm.complete`。
- `plugins.entries.<id>.config`：plugin-defined config object（可用時由 native OpenClaw plugin schema 驗證）。
- Channel plugin account/runtime settings 位於 `channels.<id>` 下，且應由擁有該 plugin 的 manifest `channelConfigs` metadata 描述，而不是由中央 OpenClaw option registry 描述。

### Codex harness plugin config

Bundled `codex` plugin 在 `plugins.entries.codex.config` 下擁有 native Codex app-server harness settings。完整 config surface 請參閱
[Codex harness 參考](/zh-TW/plugins/codex-harness-reference)，runtime model 請參閱 [Codex harness](/zh-TW/plugins/codex-harness)。

`codexPlugins` 僅適用於選擇 native Codex harness 的 sessions。
它不會為 Pi、一般 OpenAI provider runs、ACP conversation bindings，或任何 non-Codex harness 啟用 Codex plugins。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`：啟用 Codex 執行框架的原生 Codex
  Plugin/應用程式支援。預設值：`false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`：
  已遷移 Plugin 應用程式徵詢的預設破壞性動作政策。
  預設值：`false`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`：在全域 `codexPlugins.enabled` 也為 true 時，啟用
  已遷移的 Plugin 項目。
  預設值：明確項目為 `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`：
  穩定的市集身分。V1 僅支援 `"openai-curated"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`：來自遷移的穩定
  Codex Plugin 身分，例如 `"google-calendar"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`：
  每個 Plugin 的破壞性動作覆寫。省略時，會使用全域
  `allow_destructive_actions` 值。

`codexPlugins.enabled` 是全域啟用指令。由遷移寫入的明確 Plugin
項目是持久的安裝與修復資格集合。
不支援 `plugins["*"]`，沒有 `install` 開關，而且本機
`marketplacePath` 值刻意不作為設定欄位，因為它們是主機特定的。

`app/list` 就緒檢查會快取一小時，並在過期時非同步重新整理。Codex 執行緒應用程式設定是在 Codex 執行框架
工作階段建立時運算，而不是每一輪都運算；變更原生 Plugin 設定後，請使用 `/new`、`/reset` 或重新啟動 gateway。

- `plugins.entries.firecrawl.config.webFetch`：Firecrawl 網頁擷取提供者設定。
  - `apiKey`：Firecrawl API 金鑰（接受 SecretRef）。會退回使用 `plugins.entries.firecrawl.config.webSearch.apiKey`、舊版 `tools.web.fetch.firecrawl.apiKey`，或 `FIRECRAWL_API_KEY` 環境變數。
  - `baseUrl`：Firecrawl API 基底 URL（預設值：`https://api.firecrawl.dev`；自架覆寫必須指向私有/內部端點）。
  - `onlyMainContent`：僅從頁面擷取主要內容（預設值：`true`）。
  - `maxAgeMs`：最大快取存留時間，以毫秒為單位（預設值：`172800000` / 2 天）。
  - `timeoutSeconds`：擷取請求逾時，以秒為單位（預設值：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok 網頁搜尋）設定。
  - `enabled`：啟用 X Search 提供者。
  - `model`：用於搜尋的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：記憶 Dreaming 設定。階段與閾值請參閱 [Dreaming](/zh-TW/concepts/dreaming)。
  - `enabled`：主要 Dreaming 開關（預設值 `false`）。
  - `frequency`：每次完整 Dreaming 掃描的 cron 節奏（預設為 `"0 3 * * *"`）。
  - `model`：選用的 Dream Diary 子代理模型覆寫。需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`；搭配 `allowedModels` 以限制目標。模型無法使用的錯誤會使用工作階段預設模型重試一次；信任或允許清單失敗不會靜默退回。
  - 階段政策與閾值是實作細節（不是面向使用者的設定鍵）。
- 完整記憶設定位於[記憶設定參考](/zh-TW/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已啟用的 Claude 組合 Plugin 也可以從 `settings.json` 貢獻內嵌 Pi 預設值；OpenClaw 會將這些套用為已清理的代理設定，而不是原始 OpenClaw 設定修補。
- `plugins.slots.memory`：選擇作用中的記憶 Plugin ID，或使用 `"none"` 停用記憶 Plugin。
- `plugins.slots.contextEngine`：選擇作用中的情境引擎 Plugin ID；除非你安裝並選擇其他引擎，否則預設為 `"legacy"`。

請參閱 [Plugins](/zh-TW/tools/plugin)。

---

## 承諾

`commitments` 控制推斷的後續追蹤記憶：OpenClaw 可以從對話回合偵測簽到，並透過 Heartbeat 執行交付。

- `commitments.enabled`：啟用隱藏 LLM 擷取、儲存，以及透過 Heartbeat 交付推斷的後續追蹤承諾。預設值：`false`。
- `commitments.maxPerDay`：每個代理工作階段在滾動一天內交付的推斷後續追蹤承諾上限。預設值：`3`。

請參閱[推斷承諾](/zh-TW/concepts/commitments)。

---

## 瀏覽器

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` 會停用 `act:evaluate` 和 `wait --fn`。
- `tabCleanup` 會在閒置時間後，或當
  工作階段超過其上限時，回收受追蹤的主要代理分頁。設定 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 可
  停用個別清理模式。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` 在未設定時會停用，因此瀏覽器導覽預設保持嚴格。
- 只有在你有意信任私有網路瀏覽器導覽時，才設定 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在嚴格模式中，遠端 CDP 設定檔端點（`profiles.*.cdpUrl`）在可達性/探索檢查期間會受相同的私有網路封鎖限制。
- `ssrfPolicy.allowPrivateNetwork` 仍作為舊版別名支援。
- 在嚴格模式中，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 來設定明確例外。
- 遠端設定檔僅能附加（停用啟動/停止/重設）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  當你希望 OpenClaw 探索 `/json/version` 時，使用 HTTP(S)；當提供者給你直接的 DevTools WebSocket URL 時，使用 WS(S)。
- `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 會套用於遠端和
  `attachOnly` CDP 可達性以及分頁開啟請求。受管理的 loopback
  設定檔會保留本機 CDP 預設值。
- 如果外部管理的 CDP 服務可透過 loopback 存取，請將該
  設定檔的 `attachOnly: true`；否則 OpenClaw 會將 loopback 連接埠視為
  本機受管理瀏覽器設定檔，並可能回報本機連接埠擁有權錯誤。
- `existing-session` 設定檔使用 Chrome MCP 而非 CDP，並且可在
  所選主機上或透過已連線的瀏覽器節點附加。
- `existing-session` 設定檔可設定 `userDataDir`，以指定特定
  以 Chromium 為基礎的瀏覽器設定檔，例如 Brave 或 Edge。
- `existing-session` 設定檔保留目前 Chrome MCP 路由限制：
  使用快照/參照驅動動作，而不是 CSS 選擇器定位；單檔上傳
  hook；沒有對話方塊逾時覆寫；沒有 `wait --load networkidle`；也沒有
  `responsebody`、PDF 匯出、下載攔截或批次動作。
- 本機受管理的 `openclaw` 設定檔會自動指派 `cdpPort` 和 `cdpUrl`；只有
  對遠端 CDP 才明確設定 `cdpUrl`。
- 本機受管理設定檔可設定 `executablePath`，以覆寫該設定檔的全域
  `browser.executablePath`。使用此功能可讓一個設定檔在
  Chrome 中執行，另一個在 Brave 中執行。
- 本機受管理設定檔在程序啟動後，會使用 `browser.localLaunchTimeoutMs` 進行 Chrome CDP HTTP
  探索，並使用 `browser.localCdpReadyTimeoutMs` 進行
  啟動後 CDP websocket 就緒檢查。在 Chrome
  成功啟動但就緒檢查與啟動競速的較慢主機上，請提高這些值。兩個值都必須是
  最大 `120000` 毫秒的正整數；無效設定值會被拒絕。
- 自動偵測順序：預設瀏覽器（如果以 Chromium 為基礎）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 都
  接受 `~` 和 `~/...`，代表在啟動 Chromium 前使用你的作業系統家目錄。
  `existing-session` 設定檔上的每個設定檔 `userDataDir` 也會展開波浪號。
- 控制服務：僅 loopback（連接埠衍生自 `gateway.port`，預設值 `18791`）。
- `extraArgs` 會將額外啟動旗標附加到本機 Chromium 啟動（例如
  `--disable-gpu`、視窗大小設定或除錯旗標）。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`：原生應用程式 UI chrome 的強調色（Talk Mode 氣泡色調等）。
- `assistant`：控制 UI 身分覆寫。會退回使用作用中的代理身分。

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway 欄位詳細資料">

- `mode`：`local`（執行 Gateway）或 `remote`（連線到遠端 Gateway）。除非為 `local`，否則 Gateway 會拒絕啟動。
- `port`：WS + HTTP 的單一多工通訊埠。優先順序：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（預設）、`lan`（`0.0.0.0`）、`tailnet`（僅 Tailscale IP），或 `custom`。
- **舊版繫結別名**：在 `gateway.bind` 中使用 bind 模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），不要使用主機別名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事項**：預設的 `loopback` bind 會在容器內監聽 `127.0.0.1`。使用 Docker 橋接網路（`-p 18789:18789`）時，流量會從 `eth0` 抵達，因此無法連上 Gateway。請使用 `--network host`，或設定 `bind: "lan"`（或使用 `bind: "custom"` 並搭配 `customBindHost: "0.0.0.0"`）以監聽所有介面。
- **驗證**：預設為必要。非 loopback bind 需要 Gateway 驗證。實務上，這代表需要共用 token/密碼，或搭配 `gateway.auth.mode: "trusted-proxy"` 的具身分感知反向 Proxy。入門精靈預設會產生 token。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`（包含 SecretRefs），請明確將 `gateway.auth.mode` 設為 `token` 或 `password`。當兩者都已設定且未設定 mode 時，啟動與服務安裝/修復流程會失敗。
- `gateway.auth.mode: "none"`：明確的無驗證模式。僅用於受信任的 local loopback 設定；這是刻意不在入門提示中提供的模式。
- `gateway.auth.mode: "trusted-proxy"`：將瀏覽器/使用者驗證委派給具身分感知的反向 Proxy，並信任來自 `gateway.trustedProxies` 的身分標頭（請參閱 [受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)）。此模式預設預期 **非 loopback** Proxy 來源；同主機 loopback 反向 Proxy 需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。內部同主機呼叫端可使用 `gateway.auth.password` 作為本機直接備援；`gateway.auth.token` 仍與 trusted-proxy 模式互斥。
- `gateway.auth.allowTailscale`：為 `true` 時，Tailscale Serve 身分標頭可滿足 Control UI/WebSocket 驗證（透過 `tailscale whois` 驗證）。HTTP API 端點**不會**使用該 Tailscale 標頭驗證；它們會改為遵循 Gateway 的一般 HTTP 驗證模式。這個無 token 流程假設 Gateway 主機受信任。當 `tailscale.mode = "serve"` 時預設為 `true`。
- `gateway.auth.rateLimit`：選用的驗證失敗限制器。依用戶端 IP 和驗證範圍套用（shared-secret 和 device-token 會分開追蹤）。被封鎖的嘗試會回傳 `429` + `Retry-After`。
  - 在非同步 Tailscale Serve Control UI 路徑上，來自相同 `{scope, clientIp}` 的失敗嘗試會在寫入失敗前序列化。因此，來自相同用戶端的並行錯誤嘗試，可能會在第二個請求觸發限制器，而不是兩者都以單純不相符的方式競速通過。
  - `gateway.auth.rateLimit.exemptLoopback` 預設為 `true`；當你刻意也想限制 localhost 流量時（用於測試設定或嚴格 Proxy 部署），請設為 `false`。
- 瀏覽器來源的 WS 驗證嘗試一律會停用 loopback 豁免並套用節流（深度防禦瀏覽器型 localhost 暴力破解）。
- 在 loopback 上，這些瀏覽器來源的鎖定會依正規化後的 `Origin`
  值隔離，因此來自某個 localhost origin 的重複失敗不會自動
  鎖定另一個 origin。
- `tailscale.mode`：`serve`（僅 tailnet，loopback bind）或 `funnel`（公開，需要驗證）。
- `tailscale.preserveFunnel`：當為 `true` 且 `tailscale.mode = "serve"` 時，OpenClaw
  會在啟動時重新套用 Serve 前檢查 `tailscale funnel status`，如果外部設定的 Funnel 路由已涵蓋 Gateway 通訊埠，則略過
  套用。預設為 `false`。
- `controlUi.allowedOrigins`：Gateway WebSocket 連線的明確瀏覽器來源允許清單。當預期瀏覽器用戶端來自非 loopback origin 時為必要。
- `controlUi.chatMessageMaxWidth`：分組 Control UI 聊天訊息的選用最大寬度。接受受限的 CSS 寬度值，例如 `960px`、`82%`、`min(1280px, 82%)` 和 `calc(100% - 2rem)`。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危險模式，會為刻意依賴 Host 標頭 origin 政策的部署啟用 Host 標頭 origin 備援。
- `remote.transport`：`ssh`（預設）或 `direct`（ws/wss）。若為 `direct`，`remote.url` 必須是 `ws://` 或 `wss://`。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`：用戶端行程環境的
  break-glass 覆寫，允許對受信任私有網路
  IP 使用明文 `ws://`；明文預設仍僅限 loopback。沒有對應的 `openclaw.json`
  設定，且瀏覽器私有網路設定，例如
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`，不會影響 Gateway
  WebSocket 用戶端。
- `gateway.remote.token` / `.password` 是遠端用戶端憑證欄位。它們本身不會設定 Gateway 驗證。
- `gateway.push.apns.relay.baseUrl`：官方/TestFlight iOS 建置在將 relay-backed 註冊發布到 Gateway 後，所使用外部 APNs relay 的基礎 HTTPS URL。此 URL 必須與編譯進 iOS 建置的 relay URL 相符。
- `gateway.push.apns.relay.timeoutMs`：Gateway 到 relay 的傳送逾時，以毫秒為單位。預設為 `10000`。
- relay-backed 註冊會委派給特定 Gateway 身分。配對的 iOS app 會擷取 `gateway.identity.get`，在 relay 註冊中包含該身分，並將註冊範圍的傳送授權轉送給 Gateway。另一個 Gateway 無法重用該已儲存的註冊。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：上述 relay 設定的暫時 env 覆寫。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：僅供開發使用的逃生口，用於 loopback HTTP relay URL。正式環境 relay URL 應保持使用 HTTPS。
- `gateway.handshakeTimeoutMs`：預先驗證 Gateway WebSocket 握手逾時，以毫秒為單位。預設：`15000`。設定 `OPENCLAW_HANDSHAKE_TIMEOUT_MS` 時會優先使用。若主機負載較高或效能較低，且本機用戶端可在啟動暖機仍在穩定時連線，請增加此值。
- `gateway.channelHealthCheckMinutes`：頻道健康監控間隔，以分鐘為單位。設為 `0` 可全域停用健康監控重啟。預設：`5`。
- `gateway.channelStaleEventThresholdMinutes`：過期 socket 閾值，以分鐘為單位。請保持此值大於或等於 `gateway.channelHealthCheckMinutes`。預設：`30`。
- `gateway.channelMaxRestartsPerHour`：每個頻道/帳號在滾動一小時內的健康監控重啟上限。預設：`10`。
- `channels.<provider>.healthMonitor.enabled`：每個頻道可選擇退出健康監控重啟，同時保留全域監控啟用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多帳號頻道的每帳號覆寫。設定後會優先於頻道層級覆寫。
- 本機 Gateway 呼叫路徑僅在未設定 `gateway.auth.*` 時，才可使用 `gateway.remote.*` 作為備援。
- 如果透過 SecretRef 明確設定了 `gateway.auth.token` / `gateway.auth.password` 且無法解析，解析會以封閉失敗處理（不會以遠端備援遮蔽）。
- `trustedProxies`：終止 TLS 或注入轉送用戶端標頭的反向 Proxy IP。只列出你控制的 Proxy。loopback 項目對同主機 Proxy/local-detection 設定仍然有效（例如 Tailscale Serve 或本機反向 Proxy），但它們**不會**讓 loopback 請求符合 `gateway.auth.mode: "trusted-proxy"` 的資格。
- `allowRealIpFallback`：為 `true` 時，若缺少 `X-Forwarded-For`，Gateway 會接受 `X-Real-IP`。預設為 `false`，以採用封閉失敗行為。
- `gateway.nodes.pairing.autoApproveCidrs`：選用 CIDR/IP 允許清單，可自動核准未要求範圍的首次節點裝置配對。未設定時會停用。這不會自動核准操作者/瀏覽器/Control UI/WebChat 配對，也不會自動核准角色、範圍、中繼資料或公開金鑰升級。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`：配對與平台允許清單評估後，對宣告節點命令進行全域允許/拒絕塑形。使用 `allowCommands` 來選擇啟用危險節點命令，例如 `camera.snap`、`camera.clip` 和 `screen.record`；即使平台預設或明確允許原本會包含某命令，`denyCommands` 也會移除該命令。節點變更其宣告命令清單後，請拒絕並重新核准該裝置配對，讓 Gateway 儲存更新後的命令快照。
- `gateway.tools.deny`：為 HTTP `POST /tools/invoke` 封鎖的額外工具名稱（延伸預設拒絕清單）。
- `gateway.tools.allow`：從預設 HTTP 拒絕清單移除工具名稱。

</Accordion>

### OpenAI 相容端點

- Chat Completions：預設停用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 啟用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 輸入強化：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空的允許清單會視為未設定；使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和/或 `gateway.http.endpoints.responses.images.allowUrl=false` 來停用 URL 擷取。
- 選用回應強化標頭：
  - `gateway.http.securityHeaders.strictTransportSecurity`（僅為你控制的 HTTPS origin 設定；請參閱 [受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多實例隔離

在一台主機上使用唯一通訊埠和狀態目錄執行多個 Gateway：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利旗標：`--dev`（使用 `~/.openclaw-dev` + 通訊埠 `19001`）、`--profile <name>`（使用 `~/.openclaw-<name>`）。

請參閱 [多個 Gateway](/zh-TW/gateway/multiple-gateways)。

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`：在 Gateway listener 啟用 TLS 終止（HTTPS/WSS）（預設：`false`）。
- `autoGenerate`：未設定明確檔案時，自動產生本機自簽憑證/金鑰組；僅供本機/開發使用。
- `certPath`：TLS 憑證檔案的檔案系統路徑。
- `keyPath`：TLS 私密金鑰檔案的檔案系統路徑；請限制權限。
- `caPath`：用於用戶端驗證或自訂信任鏈的選用 CA bundle 路徑。

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`：控制設定編輯在執行階段如何套用。
  - `"off"`：忽略即時編輯；變更需要明確重啟。
  - `"restart"`：設定變更時一律重啟 Gateway 行程。
  - `"hot"`：在行程內套用變更而不重啟。
  - `"hybrid"`（預設）：先嘗試熱重載；必要時退回重啟。
- `debounceMs`：套用設定變更前的 debounce 視窗，以 ms 為單位（非負整數）。
- `deferralTimeoutMs`：在強制重啟或頻道熱重載前，等待進行中作業的選用最長時間，以 ms 為單位。省略時會使用預設有界等待（`300000`）；設為 `0` 則無限期等待，並定期記錄仍待處理警告。

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

驗證：`Authorization: Bearer <token>` 或 `x-openclaw-token: <token>`。
查詢字串掛鉤權杖會被拒絕。

驗證與安全注意事項：

- `hooks.enabled=true` 需要非空的 `hooks.token`。
- `hooks.token` 必須與 `gateway.auth.token` **不同**；重複使用 Gateway 權杖會被拒絕。
- `hooks.path` 不能是 `/`；請使用專用子路徑，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，請限制 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果對應或預設集使用樣板化的 `sessionKey`，請設定 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。靜態對應金鑰不需要該選擇加入。

**端點：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 只有在 `hooks.allowRequestSessionKey=true`（預設：`false`）時，才會接受請求酬載中的 `sessionKey`。
- `POST /hooks/<name>` → 透過 `hooks.mappings` 解析
  - 樣板轉譯的對應 `sessionKey` 值會被視為外部提供，也需要 `hooks.allowRequestSessionKey=true`。

<Accordion title="對應詳細資料">

- `match.path` 會比對 `/hooks` 之後的子路徑（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 會比對通用路徑的酬載欄位。
- 像 `{{messages[0].subject}}` 這樣的樣板會從酬載讀取。
- `transform` 可以指向會傳回掛鉤動作的 JS/TS 模組。
  - `transform.module` 必須是相對路徑，且保留在 `hooks.transformsDir` 內（絕對路徑與路徑穿越會被拒絕）。
  - 將 `hooks.transformsDir` 保持在 `~/.openclaw/hooks/transforms` 下；工作區 Skills 目錄會被拒絕。如果 `openclaw doctor` 回報此路徑無效，請將轉換模組移入掛鉤轉換目錄，或移除 `hooks.transformsDir`。
- `agentId` 會路由到特定代理；未知 ID 會回退到預設值。
- `allowedAgentIds`：限制明確路由（`*` 或省略 = 允許全部，`[]` = 全部拒絕）。
- `defaultSessionKey`：沒有明確 `sessionKey` 的掛鉤代理執行可使用的選用固定工作階段金鑰。
- `allowRequestSessionKey`：允許 `/hooks/agent` 呼叫者與樣板驅動的對應工作階段金鑰設定 `sessionKey`（預設：`false`）。
- `allowedSessionKeyPrefixes`：明確 `sessionKey` 值（請求 + 對應）的選用前綴允許清單，例如 `["hook:"]`。當任何對應或預設集使用樣板化的 `sessionKey` 時，它就會變成必填。
- `deliver: true` 會將最終回覆傳送到頻道；`channel` 預設為 `last`。
- `model` 會覆寫這次掛鉤執行的 LLM（如果設定了模型目錄，必須允許該模型）。

</Accordion>

### Gmail 整合

- 內建 Gmail 預設集使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果你保留該逐訊息路由，請設定 `hooks.allowRequestSessionKey: true`，並限制 `hooks.allowedSessionKeyPrefixes` 以符合 Gmail 命名空間，例如 `["hook:", "hook:gmail:"]`。
- 如果你需要 `hooks.allowRequestSessionKey: false`，請使用靜態 `sessionKey` 覆寫預設集，而不是使用樣板化預設值。

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway 會在設定後於啟動時自動啟動 `gog gmail watch serve`。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可停用。
- 不要在 Gateway 旁邊另行執行 `gog gmail watch serve`。

---

## Canvas Plugin 主機

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- 透過 HTTP 在 Gateway 連接埠下提供代理可編輯的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 僅限本機：保持 `gateway.bind: "loopback"`（預設）。
- 非迴路繫結：canvas 路由需要 Gateway 驗證（權杖/密碼/受信任代理），與其他 Gateway HTTP 表面相同。
- Node WebViews 通常不會傳送驗證標頭；節點配對並連線後，Gateway 會公告節點範圍的能力 URL，以便存取 canvas/A2UI。
- 能力 URL 會繫結到作用中的節點 WS 工作階段，並很快過期。不使用基於 IP 的回退。
- 將即時重新載入用戶端注入提供的 HTML。
- 空白時自動建立入門 `index.html`。
- 也會在 `/__openclaw__/a2ui/` 提供 A2UI。
- 變更需要重新啟動 Gateway。
- 對大型目錄或 `EMFILE` 錯誤停用即時重新載入。

---

## 探索

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal`（啟用內建 `bonjour` Plugin 時的預設）：從 TXT 記錄省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`；LAN 多播公告仍需要啟用內建 `bonjour` Plugin。
- `off`：在不變更 Plugin 啟用狀態的情況下抑制 LAN 多播公告。
- 內建 `bonjour` Plugin 會在 macOS 主機上自動啟動；在 Linux、Windows 與容器化 Gateway 部署上則為選擇加入。
- 主機名稱在系統主機名稱是有效 DNS 標籤時，預設使用系統主機名稱，否則回退到 `openclaw`。可用 `OPENCLAW_MDNS_HOSTNAME` 覆寫。

### 廣域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

在 `~/.openclaw/dns/` 下寫入單播 DNS-SD 區域。若要跨網路探索，請搭配 DNS 伺服器（建議使用 CoreDNS）+ Tailscale split DNS。

設定：`openclaw dns setup --apply`。

---

## 環境

### `env`（內嵌環境變數）

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- 只有在程序環境缺少該鍵時，才會套用內嵌環境變數。
- `.env` 檔案：CWD `.env` + `~/.openclaw/.env`（兩者都不會覆寫現有變數）。
- `shellEnv`：從你的登入 shell 設定檔匯入缺少的預期鍵。
- 請參閱[環境](/zh-TW/help/environment)了解完整優先順序。

### 環境變數替換

使用 `${VAR_NAME}` 在任何設定字串中參照環境變數：

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 只會比對大寫名稱：`[A-Z_][A-Z0-9_]*`。
- 缺少或空的變數會在設定載入時擲出錯誤。
- 使用 `$${VAR}` 跳脫為字面值 `${VAR}`。
- 可搭配 `$include` 使用。

---

## 機密

機密參照是加成式的：純文字值仍可使用。

### `SecretRef`

使用一種物件形狀：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

驗證：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` ID 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` ID：絕對 JSON 指標（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` ID 模式：`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` ID 不得包含 `.` 或 `..` 以斜線分隔的路徑片段（例如 `a/../b` 會被拒絕）

### 支援的憑證介面

- 標準矩陣：[SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)
- `secrets apply` 以支援的 `openclaw.json` 憑證路徑為目標。
- `auth-profiles.json` 參照包含在執行階段解析與稽核涵蓋範圍內。

### 機密提供者設定

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

注意事項：

- `file` 提供者支援 `mode: "json"` 和 `mode: "singleValue"`（在 singleValue 模式中，`id` 必須是 `"value"`）。
- 當 Windows ACL 驗證無法使用時，檔案和 exec 提供者路徑會以失敗關閉方式處理。只有對於受信任但無法驗證的路徑，才設定 `allowInsecurePath: true`。
- `exec` 提供者需要絕對 `command` 路徑，並在 stdin/stdout 上使用協定酬載。
- 預設會拒絕符號連結命令路徑。設定 `allowSymlinkCommand: true` 可允許符號連結路徑，同時驗證解析後的目標路徑。
- 如果已設定 `trustedDirs`，受信任目錄檢查會套用至解析後的目標路徑。
- `exec` 子程序環境預設為最小化；請使用 `passEnv` 明確傳遞必要變數。
- 機密參照會在啟用時解析成記憶體中的快照，接著請求路徑只會讀取該快照。
- 啟用期間會套用作用中介面篩選：已啟用介面上未解析的參照會使啟動/重新載入失敗，而非作用中介面則會略過並附帶診斷資訊。

---

## 驗證儲存

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- 每個代理的設定檔會儲存在 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 支援值層級參照（靜態憑證模式中，`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- 舊版扁平 `auth-profiles.json` 對應，例如 `{ "provider": { "apiKey": "..." } }`，不是執行階段格式；`openclaw doctor --fix` 會將它們重寫為標準 `provider:default` API 金鑰設定檔，並建立 `.legacy-flat.*.bak` 備份。
- OAuth 模式設定檔（`auth.profiles.<id>.mode = "oauth"`）不支援由 SecretRef 支援的驗證設定檔憑證。
- 靜態執行階段憑證來自記憶體中已解析的快照；發現舊版靜態 `auth.json` 項目時會清除它們。
- 舊版 OAuth 會從 `~/.openclaw/credentials/oauth.json` 匯入。
- 請參閱 [OAuth](/zh-TW/concepts/oauth)。
- 機密執行階段行為與 `audit/configure/apply` 工具：[機密管理](/zh-TW/gateway/secrets)。

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: 當設定檔因真正的帳單/點數不足錯誤而失敗時，以小時為單位的基礎退避（預設：`5`）。即使在 `401`/`403` 回應中，明確的帳單文字仍可能歸入這裡，但提供者專屬文字比對器仍限定在擁有它們的提供者範圍內（例如 OpenRouter `Key limit exceeded`）。可重試的 HTTP `402` 用量時段或組織/工作區支出限制訊息則維持在 `rate_limit` 路徑中。
- `billingBackoffHoursByProvider`: 選用的個別提供者帳單退避小時覆寫。
- `billingMaxHours`: 帳單退避指數成長的小時上限（預設：`24`）。
- `authPermanentBackoffMinutes`: 高信心 `auth_permanent` 失敗的基礎退避分鐘數（預設：`10`）。
- `authPermanentMaxMinutes`: `auth_permanent` 退避成長的分鐘上限（預設：`60`）。
- `failureWindowHours`: 用於退避計數器的滾動視窗小時數（預設：`24`）。
- `overloadedProfileRotations`: 在切換到模型備援之前，過載錯誤允許的同一提供者驗證設定檔輪替次數上限（預設：`1`）。`ModelNotReadyException` 等提供者忙碌型態會歸入這裡。
- `overloadedBackoffMs`: 重試過載提供者/設定檔輪替前的固定延遲（預設：`0`）。
- `rateLimitedProfileRotations`: 在切換到模型備援之前，速率限制錯誤允許的同一提供者驗證設定檔輪替次數上限（預設：`1`）。該速率限制儲存桶包含提供者型態文字，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 和 `resource exhausted`。

---

## 記錄

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- 預設記錄檔：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 設定 `logging.file` 可使用穩定路徑。
- 使用 `--verbose` 時，`consoleLevel` 會提升為 `debug`。
- `maxFileBytes`: 輪替前作用中記錄檔大小上限（位元組）（正整數；預設：`104857600` = 100 MB）。OpenClaw 會在作用中文件旁保留最多五個編號封存檔。
- `redactSensitive` / `redactPatterns`: 對主控台輸出、檔案記錄、OTLP 記錄紀錄，以及持久化工作階段逐字稿文字進行盡力遮蔽。`redactSensitive: "off"` 只會停用這項一般記錄/逐字稿政策；UI/工具/診斷安全介面仍會在發出前遮蔽秘密。

---

## 診斷

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 600000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: 儀表化輸出的主要切換（預設：`true`）。
- `flags`: 啟用目標記錄輸出的旗標字串陣列（支援 `"telegram.*"` 或 `"*"` 等萬用字元）。
- `stuckSessionWarnMs`: 以毫秒為單位的無進度時間門檻，用於將長時間執行中的處理工作階段分類為 `session.long_running`、`session.stalled` 或 `session.stuck`。回覆、工具、狀態、區塊和 ACP 進度會重設計時器；重複的 `session.stuck` 診斷在未變更時會退避。
- `stuckSessionAbortMs`: 在符合條件的停滯中作用中工作可為復原而中止並清空前，以毫秒為單位的無進度時間門檻。未設定時，OpenClaw 會使用較安全的延伸內嵌執行視窗，至少為 10 分鐘且為 `stuckSessionWarnMs` 的 5 倍。
- `otel.enabled`: 啟用 OpenTelemetry 匯出管線（預設：`false`）。完整設定、訊號目錄和隱私模型請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。
- `otel.endpoint`: OTel 匯出的收集器 URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: 選用的訊號專屬 OTLP 端點。設定時，它們只會針對該訊號覆寫 `otel.endpoint`。
- `otel.protocol`: `"http/protobuf"`（預設）或 `"grpc"`。
- `otel.headers`: 隨 OTel 匯出要求傳送的額外 HTTP/gRPC 中繼資料標頭。
- `otel.serviceName`: 資源屬性的服務名稱。
- `otel.traces` / `otel.metrics` / `otel.logs`: 啟用追蹤、指標或記錄匯出。
- `otel.sampleRate`: 追蹤取樣率 `0`-`1`。
- `otel.flushIntervalMs`: 週期性遙測清空間隔，單位為毫秒。
- `otel.captureContent`: 選擇加入的 OTEL span 屬性原始內容擷取。預設為關閉。布林值 `true` 會擷取非系統訊息/工具內容；物件形式可讓你明確啟用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs` 和 `systemPrompt`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: 最新實驗性 GenAI span 提供者屬性的環境切換。預設情況下，span 會保留舊版 `gen_ai.system` 屬性以維持相容性；GenAI 指標使用有界語意屬性。
- `OPENCLAW_OTEL_PRELOADED=1`: 針對已註冊全域 OpenTelemetry SDK 的主機使用的環境切換。OpenClaw 接著會略過 Plugin 擁有的 SDK 啟動/關閉，同時保持診斷監聽器作用中。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 和 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: 當相符設定鍵未設定時使用的訊號專屬端點環境變數。
- `cacheTrace.enabled`: 記錄內嵌執行的快取追蹤快照（預設：`false`）。
- `cacheTrace.filePath`: 快取追蹤 JSONL 的輸出路徑（預設：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: 控制快取追蹤輸出中包含的內容（全部預設：`true`）。

---

## 更新

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: npm/git 安裝的發布通道 - `"stable"`、`"beta"` 或 `"dev"`。
- `checkOnStart`: Gateway 啟動時檢查 npm 更新（預設：`true`）。
- `auto.enabled`: 啟用套件安裝的背景自動更新（預設：`false`）。
- `auto.stableDelayHours`: 穩定通道自動套用前的最小延遲小時數（預設：`6`；上限：`168`）。
- `auto.stableJitterHours`: 額外的穩定通道推出分散視窗小時數（預設：`12`；上限：`168`）。
- `auto.betaCheckIntervalHours`: beta 通道檢查執行頻率，單位為小時（預設：`1`；上限：`24`）。

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: 全域 ACP 功能閘門（預設：`true`；設為 `false` 以隱藏 ACP 分派與產生 affordance）。
- `dispatch.enabled`: ACP 工作階段回合分派的獨立閘門（預設：`true`）。設為 `false` 可保留 ACP 命令可用，但阻擋執行。
- `backend`: 預設 ACP 執行階段後端 id（必須符合已註冊的 ACP 執行階段 Plugin）。
  請先安裝後端 Plugin；如果已設定 `plugins.allow`，請包含後端 Plugin id（例如 `acpx`），否則 ACP 後端將不會載入。
- `defaultAgent`: 當產生項目未指定明確目標時的備援 ACP 目標代理 id。
- `allowedAgents`: 允許 ACP 執行階段工作階段使用的代理 id 允許清單；空白表示沒有額外限制。
- `maxConcurrentSessions`: 同時作用中的 ACP 工作階段上限。
- `stream.coalesceIdleMs`: 串流文字的閒置清空視窗，單位為毫秒。
- `stream.maxChunkChars`: 分割串流區塊投影前的最大區塊大小。
- `stream.repeatSuppression`: 每回合抑制重複的狀態/工具行（預設：`true`）。
- `stream.deliveryMode`: `"live"` 會逐步串流；`"final_only"` 會緩衝到回合終端事件。
- `stream.hiddenBoundarySeparator`: 隱藏工具事件後、可見文字前的分隔符（預設：`"paragraph"`）。
- `stream.maxOutputChars`: 每個 ACP 回合投影的助理輸出字元上限。
- `stream.maxSessionUpdateChars`: 投影 ACP 狀態/更新行的字元上限。
- `stream.tagVisibility`: 標籤名稱到布林可見性覆寫的紀錄，用於串流事件。
- `runtime.ttlMinutes`: ACP 工作階段 worker 符合清理條件前的閒置 TTL，單位為分鐘。
- `runtime.installCommand`: 啟動 ACP 執行階段環境時要執行的選用安裝命令。

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` 控制橫幅標語樣式：
  - `"random"`（預設）：輪替有趣/季節性標語。
  - `"default"`：固定中性標語（`All your chats, one OpenClaw.`）。
  - `"off"`：不顯示標語文字（仍會顯示橫幅標題/版本）。
- 若要隱藏整個橫幅（不只是標語），請設定環境變數 `OPENCLAW_HIDE_BANNER=1`。

---

## 精靈

由 CLI 引導式設定流程（`onboard`、`configure`、`doctor`）寫入的中繼資料：

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## 身分

請參閱 [代理預設值](/zh-TW/gateway/config-agents#agent-defaults) 下的 `agents.list` 身分欄位。

---

## 橋接（舊版，已移除）

目前建置版本不再包含 TCP 橋接。節點會透過 Gateway WebSocket 連線。`bridge.*` 鍵不再屬於設定結構描述的一部分（驗證會失敗，直到移除為止；`openclaw doctor --fix` 可去除未知鍵）。

<Accordion title="舊版橋接設定（歷史參考）">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`：在從 `sessions.json` 清除前，保留已完成隔離式 cron 執行工作階段的時間長度。也控制已封存且刪除的 cron transcript 清理。預設值：`24h`；設定為 `false` 可停用。
- `runLog.maxBytes`：清除前每個執行記錄檔（`cron/runs/<jobId>.jsonl`）的最大大小。預設值：`2_000_000` 位元組。
- `runLog.keepLines`：觸發執行記錄清除時保留的最新行數。預設值：`2000`。
- `webhookToken`：用於 cron Webhook POST 傳遞（`delivery.mode = "webhook"`）的 bearer token；若省略，則不會傳送 auth header。
- `webhook`：已棄用的舊版備援 Webhook URL（http/https），僅用於仍有 `notify: true` 的已儲存作業。

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`：一次性作業在暫時性錯誤時的最大重試次數（預設值：`3`；範圍：`0`-`10`）。
- `backoffMs`：每次重試嘗試的退避延遲陣列，單位為毫秒（預設值：`[30000, 60000, 300000]`；1-10 個項目）。
- `retryOn`：會觸發重試的錯誤類型 - `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略時會重試所有暫時性類型。

僅套用於一次性 cron 作業。週期性作業使用獨立的失敗處理。

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`：啟用 cron 作業的失敗警示（預設值：`false`）。
- `after`：發出警示前的連續失敗次數（正整數，最小值：`1`）。
- `cooldownMs`：同一作業重複警示之間的最短毫秒數（非負整數）。
- `includeSkipped`：將連續略過的執行計入警示閾值（預設值：`false`）。略過的執行會分開追蹤，且不會影響執行錯誤退避。
- `mode`：傳遞模式 - `"announce"` 透過頻道訊息傳送；`"webhook"` 發佈到已設定的 Webhook。
- `accountId`：選用的帳戶或頻道 id，用於限定警示傳遞範圍。

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- 所有作業的 cron 失敗通知預設目的地。
- `mode`：`"announce"` 或 `"webhook"`；當有足夠目標資料時，預設為 `"announce"`。
- `channel`：announce 傳遞的頻道覆寫。`"last"` 會重用最後已知的傳遞頻道。
- `to`：明確的 announce 目標或 Webhook URL。Webhook 模式必填。
- `accountId`：傳遞的選用帳戶覆寫。
- 每個作業的 `delivery.failureDestination` 會覆寫這個全域預設值。
- 當未設定全域或每個作業的失敗目的地時，已透過 `announce` 傳遞的作業會在失敗時退回使用該主要 announce 目標。
- `delivery.failureDestination` 僅支援 `sessionTarget="isolated"` 作業，除非該作業的主要 `delivery.mode` 是 `"webhook"`。

請參閱 [Cron 作業](/zh-TW/automation/cron-jobs)。隔離式 cron 執行會以[背景任務](/zh-TW/automation/tasks)追蹤。

---

## 媒體模型範本變數

在 `tools.media.models[].args` 中展開的範本 placeholder：

| 變數               | 說明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完整的傳入訊息內文                              |
| `{{RawBody}}`      | 原始內文（沒有歷史/傳送者包裝）                 |
| `{{BodyStripped}}` | 已移除群組提及的內文                            |
| `{{From}}`         | 傳送者識別碼                                    |
| `{{To}}`           | 目的地識別碼                                    |
| `{{MessageSid}}`   | 頻道訊息 id                                     |
| `{{SessionId}}`    | 目前的工作階段 UUID                             |
| `{{IsNewSession}}` | 建立新工作階段時為 `"true"`                     |
| `{{MediaUrl}}`     | 傳入媒體 pseudo-URL                             |
| `{{MediaPath}}`    | 本機媒體路徑                                    |
| `{{MediaType}}`    | 媒體類型（image/audio/document/…）               |
| `{{Transcript}}`   | 音訊 transcript                                  |
| `{{Prompt}}`       | CLI 項目的已解析媒體 prompt                     |
| `{{MaxChars}}`     | CLI 項目的已解析最大輸出字元數                  |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                          |
| `{{GroupSubject}}` | 群組主旨（盡力提供）                            |
| `{{GroupMembers}}` | 群組成員預覽（盡力提供）                        |
| `{{SenderName}}`   | 傳送者顯示名稱（盡力提供）                      |
| `{{SenderE164}}`   | 傳送者電話號碼（盡力提供）                      |
| `{{Provider}}`     | provider 提示（whatsapp、telegram、discord 等）  |

---

## 設定 include（`$include`）

將設定拆分為多個檔案：

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**合併行為：**

- 單一檔案：取代包含它的物件。
- 檔案陣列：依序深度合併（後者覆寫前者）。
- 同層鍵：在 include 之後合併（覆寫 included values）。
- 巢狀 include：最多深入 10 層。
- 路徑：相對於包含它的檔案解析，但必須留在最上層設定目錄（`openclaw.json` 的 `dirname`）內。絕對路徑/`../` 形式只有在仍解析到該邊界內時才允許。
- 由 OpenClaw 擁有、且只變更由單一檔案 include 支援的一個最上層區段的寫入，會寫入該 included file。例如，`plugins install` 會更新 `plugins.json5` 中的 `plugins: { $include: "./plugins.json5" }`，並讓 `openclaw.json` 保持不變。
- Root includes、include arrays，以及帶有 sibling overrides 的 includes，對 OpenClaw 擁有的寫入而言是唯讀；這些寫入會失敗關閉，而不是攤平設定。
- 錯誤：對遺失檔案、剖析錯誤和循環 include 提供清楚訊息。

---

_相關：[設定](/zh-TW/gateway/configuration) · [設定範例](/zh-TW/gateway/configuration-examples) · [Doctor](/zh-TW/gateway/doctor)_

## 相關

- [設定](/zh-TW/gateway/configuration)
- [設定範例](/zh-TW/gateway/configuration-examples)
