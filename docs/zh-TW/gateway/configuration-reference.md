---
read_when:
    - 你需要精確的欄位層級設定語義或預設值
    - 你正在驗證 channel、model、gateway 或 tool 設定區塊
summary: 核心 OpenClaw 鍵、預設值，以及專用子系統參考連結的 Gateway 設定參考
title: 設定參考
x-i18n:
    generated_at: "2026-05-12T00:58:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b8e31f7a6ed82faf3b5a50daa286bb6fce0c2e4452ae81a8e792a437004ad54
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Core 設定參考，適用於 `~/.openclaw/openclaw.json`。如需以任務為導向的概覽，請參閱[設定](/zh-TW/gateway/configuration)。

涵蓋主要的 OpenClaw 設定介面，並在子系統有自己的更深入參考時連結出去。channel 與 plugin 擁有的指令目錄，以及深入的記憶體/QMD 調整選項，會放在各自頁面，而不是本頁。

程式碼真實來源：

- `openclaw config schema` 會列印用於驗證與 Control UI 的即時 JSON Schema；可用時會合併 bundled/plugin/channel 中繼資料
- `config.schema.lookup` 會回傳一個以路徑為範圍的 schema 節點，供深入檢視工具使用
- `pnpm config:docs:check` / `pnpm config:docs:gen` 會根據目前的 schema 介面驗證設定文件基準雜湊

Agent 查找路徑：在編輯前，請使用 `gateway` 工具動作 `config.schema.lookup` 取得精確的欄位層級文件與限制。使用[設定](/zh-TW/gateway/configuration)取得以任務為導向的指引，並使用本頁取得更廣泛的欄位地圖、預設值，以及子系統參考連結。

專用深入參考：

- [記憶體設定參考](/zh-TW/reference/memory-config)，適用於 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及 `plugins.entries.memory-core.config.dreaming` 下的 dreaming 設定
- [斜線指令](/zh-TW/tools/slash-commands)，適用於目前內建 + bundled 指令目錄
- 擁有 channel 特定指令介面的 channel/plugin 頁面

設定格式為 **JSON5**（允許註解與尾隨逗號）。所有欄位都是選用的 - 省略時 OpenClaw 會使用安全預設值。

---

## Channels

每個 channel 的設定鍵已移至專用頁面 - 請參閱[設定 - channels](/zh-TW/gateway/config-channels)，了解 `channels.*`，包括 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage，以及其他 bundled channels（驗證、存取控制、多帳號、提及閘控）。

## Agent 預設值、多 Agent、sessions 與 messages

已移至專用頁面 - 請參閱[設定 - agents](/zh-TW/gateway/config-agents)，了解：

- `agents.defaults.*`（workspace、model、thinking、heartbeat、memory、media、skills、sandbox）
- `multiAgent.*`（multi-agent 路由與繫結）
- `session.*`（session 生命週期、Compaction、剪除）
- `messages.*`（message 傳遞、TTS、markdown 轉譯）
- `talk.*`（Talk 模式）
  - `talk.consultThinkingLevel`：Control UI Talk 即時諮詢背後完整 OpenClaw agent 執行的 thinking level 覆寫
  - `talk.consultFastMode`：Control UI Talk 即時諮詢的一次性 fast-mode 覆寫
  - `talk.speechLocale`：iOS/macOS 上 Talk 語音辨識的選用 BCP 47 locale id
  - `talk.silenceTimeoutMs`：未設定時，Talk 會在傳送逐字稿前保留平台預設暫停視窗（`macOS 和 Android 為 700 ms，iOS 為 900 ms`）

## Tools 與自訂 providers

工具政策、實驗性切換、provider 支援的工具設定，以及自訂 provider / base-URL 設定已移至專用頁面 - 請參閱[設定 - tools 與自訂 providers](/zh-TW/gateway/config-tools)。

## Models

Provider 定義、model allowlist 與自訂 provider 設定位於[設定 - tools 與自訂 providers](/zh-TW/gateway/config-tools#custom-providers-and-base-urls)。
`models` 根層級也負責全域 model-catalog 行為。

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`：provider catalog 行為（`merge` 或 `replace`）。
- `models.providers`：以 provider id 為鍵的自訂 provider 對應。
- `models.providers.*.localService`：local model servers 的選用隨需程序管理器。OpenClaw 會探測設定的 health endpoint，必要時啟動絕對路徑 `command`，等待就緒，然後傳送 model request。請參閱[Local model services](/zh-TW/gateway/local-model-services)。
- `models.pricing.enabled`：控制背景 pricing bootstrap，會在 sidecars 與 channels 抵達 Gateway ready path 後啟動。為 `false` 時，Gateway 會略過 OpenRouter 與 LiteLLM pricing-catalog 擷取；已設定的 `models.providers.*.models[].cost` 值仍可用於本機成本估算。

## MCP

OpenClaw 管理的 MCP server 定義位於 `mcp.servers` 下，並由嵌入式 Pi 與其他 runtime adapters 使用。`openclaw mcp list`、`show`、`set` 與 `unset` 指令會管理這個區塊，而且在設定編輯期間不會連線到目標 server。

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

- `mcp.servers`：具名 stdio 或 remote MCP server 定義，供公開已設定 MCP tools 的 runtimes 使用。
  Remote entries 使用 `transport: "streamable-http"` 或 `transport: "sse"`；
  `type: "http"` 是 CLI-native alias，`openclaw mcp set` 與
  `openclaw doctor --fix` 會將其正規化為標準 `transport` 欄位。
- `mcp.sessionIdleTtlMs`：session-scoped bundled MCP runtimes 的 idle TTL。
  一次性嵌入式執行會要求 run-end cleanup；此 TTL 是長時間 session 與未來呼叫者的後備機制。
- `mcp.*` 下的變更會透過釋放快取的 session MCP runtimes 來熱套用。
  下一次工具探索/使用會從新設定重新建立它們，因此移除的
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

- `allowBundled`：bundled skills 的選用 allowlist（不影響 managed/workspace skills）。
- `load.extraDirs`：額外的共用 skill roots（最低優先順序）。
- `load.allowSymlinkTargets`：受信任的真實目標 roots；當 skill symlinks 位於其設定來源 root 之外時，可解析至這些目標。
- `install.preferBrew`：為 true 時，若 `brew` 可用，會在退回其他 installer kinds 前優先使用 Homebrew installers。
- `install.nodeManager`：`metadata.openclaw.install` specs 的 node installer 偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`：允許受信任的 `operator.admin` Gateway clients 安裝透過 `skills.upload.*` 暫存的私有 zip archives（預設：false）。這只會啟用 uploaded-archive path；一般 ClawHub 安裝不需要它。
- `entries.<skillKey>.enabled: false` 會停用某個 skill，即使它是 bundled/installed。
- `entries.<skillKey>.apiKey`：宣告 primary env var 的 skills 可用的便利設定（plaintext string 或 SecretRef object）。

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
- Discovery 接受原生 OpenClaw plugins，以及相容的 Codex bundles 與 Claude bundles，包括沒有 manifest 的 Claude default-layout bundles。
- **設定變更需要重新啟動 Gateway。**
- `allow`：選用 allowlist（只載入列出的 plugins）。`deny` 優先。
- `bundledDiscovery`：新設定預設為 `"allowlist"`，因此非空的
  `plugins.allow` 也會限制 bundled provider plugins，包括 web-search
  runtime providers。Doctor 會為遷移的舊版 allowlist
  設定寫入 `"compat"`，以保留既有的 bundled provider 行為，直到你選擇加入。
- `plugins.entries.<id>.apiKey`：plugin-level API key 便利欄位（在 plugin 支援時）。
- `plugins.entries.<id>.env`：plugin-scoped env var map。
- `plugins.entries.<id>.hooks.allowPromptInjection`：為 `false` 時，core 會阻擋 `before_prompt_build`，並忽略 legacy `before_agent_start` 中會修改 prompt 的欄位，同時保留 legacy `modelOverride` 與 `providerOverride`。適用於原生 plugin hooks 與受支援的 bundle-provided hook directories。
- `plugins.entries.<id>.hooks.allowConversationAccess`：為 `true` 時，受信任的非 bundled plugins 可以從 typed hooks 讀取 raw conversation content，例如 `llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize` 與 `agent_end`。
- `plugins.entries.<id>.subagent.allowModelOverride`：明確信任此 plugin 可為背景 subagent 執行要求 per-run `provider` 與 `model` 覆寫。
- `plugins.entries.<id>.subagent.allowedModels`：受信任 subagent 覆寫的 canonical `provider/model` targets 選用 allowlist。只有在你刻意想允許任何 model 時才使用 `"*"`。
- `plugins.entries.<id>.llm.allowModelOverride`：明確信任此 plugin 可為 `api.runtime.llm.complete` 要求 model 覆寫。
- `plugins.entries.<id>.llm.allowedModels`：受信任 plugin LLM completion 覆寫的 canonical `provider/model` targets 選用 allowlist。只有在你刻意想允許任何 model 時才使用 `"*"`。
- `plugins.entries.<id>.llm.allowAgentIdOverride`：明確信任此 plugin 可針對非預設 agent id 執行 `api.runtime.llm.complete`。
- `plugins.entries.<id>.config`：plugin-defined config object（可用時由原生 OpenClaw plugin schema 驗證）。
- Channel plugin account/runtime settings 位於 `channels.<id>` 下，並應由擁有該 channel 的 plugin manifest `channelConfigs` 中繼資料描述，而不是由中央 OpenClaw option registry 描述。

### Codex harness plugin 設定

Bundled `codex` plugin 在
`plugins.entries.codex.config` 下擁有原生 Codex app-server harness 設定。請參閱
[Codex harness 參考](/zh-TW/plugins/codex-harness-reference)了解完整設定介面，並參閱 [Codex harness](/zh-TW/plugins/codex-harness)了解 runtime model。

`codexPlugins` 只適用於選取原生 Codex harness 的 sessions。
它不會為 Pi、一般 OpenAI provider runs、ACP
conversation bindings，或任何非 Codex harness 啟用 Codex plugins。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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

- `plugins.entries.codex.config.codexPlugins.enabled`：啟用 Codex harness 的原生 Codex
  Plugin/應用程式支援。預設：`false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`：
  遷移後 Plugin 應用程式 elicitations 的預設破壞性動作政策。
  預設：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`：當全域
  `codexPlugins.enabled` 也為 true 時，啟用遷移後的 Plugin 項目。
  明確項目的預設：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`：
  穩定的 marketplace 身分。V1 僅支援 `"openai-curated"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`：遷移所得的穩定
  Codex Plugin 身分，例如 `"google-calendar"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`：
  每個 Plugin 的破壞性動作覆寫。省略時，會使用全域
  `allow_destructive_actions` 值。

`codexPlugins.enabled` 是全域啟用指令。遷移寫入的明確 Plugin
項目，是持久的安裝與修復資格集合。
不支援 `plugins["*"]`，沒有 `install` 開關，而且本機
`marketplacePath` 值刻意不作為設定欄位，因為它們是主機專屬的。

`app/list` 就緒檢查會快取一小時，過期時以非同步方式重新整理。
Codex 執行緒應用程式設定會在 Codex harness
工作階段建立時運算，而不是每一輪都運算；變更原生 Plugin 設定後，請使用
`/new`、`/reset` 或重新啟動 Gateway。

- `plugins.entries.firecrawl.config.webFetch`：Firecrawl 網頁擷取提供者設定。
  - `apiKey`：Firecrawl API 金鑰（接受 SecretRef）。會退回使用 `plugins.entries.firecrawl.config.webSearch.apiKey`、舊版 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY` 環境變數。
  - `baseUrl`：Firecrawl API 基底 URL（預設：`https://api.firecrawl.dev`；自行託管的覆寫必須指向私有/內部端點）。
  - `onlyMainContent`：僅從頁面擷取主要內容（預設：`true`）。
  - `maxAgeMs`：快取最長存留時間，以毫秒為單位（預設：`172800000` / 2 天）。
  - `timeoutSeconds`：爬取要求逾時秒數（預設：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok 網頁搜尋）設定。
  - `enabled`：啟用 X Search 提供者。
  - `model`：用於搜尋的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：記憶 Dreaming 設定。請參閱 [Dreaming](/zh-TW/concepts/dreaming) 了解階段與閾值。
  - `enabled`：Dreaming 主開關（預設 `false`）。
  - `frequency`：每次完整 Dreaming 掃描的 cron 週期（預設為 `"0 3 * * *"`）。
  - `model`：選用的 Dream Diary 子代理模型覆寫。需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`；搭配 `allowedModels` 使用以限制目標。模型不可用錯誤會使用工作階段預設模型重試一次；信任或允許清單失敗不會靜默退回。
  - 階段政策與閾值是實作細節（不是面向使用者的設定鍵）。
- 完整記憶設定位於 [記憶設定參考](/zh-TW/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已啟用的 Claude bundle plugins 也可以從 `settings.json` 提供嵌入式 Pi 預設值；OpenClaw 會將其套用為經過清理的代理設定，而不是原始 OpenClaw 設定修補。
- `plugins.slots.memory`：選擇作用中的記憶 Plugin id，或使用 `"none"` 停用記憶 Plugins。
- `plugins.slots.contextEngine`：選擇作用中的內容引擎 Plugin id；除非安裝並選取其他引擎，否則預設為 `"legacy"`。

請參閱 [Plugins](/zh-TW/tools/plugin)。

---

## 承諾

`commitments` 控制推斷的後續記憶：OpenClaw 可以從對話輪次偵測簽到，並透過 Heartbeat 執行傳遞。

- `commitments.enabled`：啟用隱藏式 LLM 擷取、儲存，以及對推斷後續承諾的 Heartbeat 傳遞。預設：`false`。
- `commitments.maxPerDay`：在滾動的一天內，每個代理工作階段最多傳遞的推斷後續承諾數量。預設：`3`。

請參閱 [推斷承諾](/zh-TW/concepts/commitments)。

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
- `tabCleanup` 會在閒置時間後，或工作階段超過上限時，回收受追蹤的主要代理分頁。設定 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 可停用個別清理模式。
- 未設定時會停用 `ssrfPolicy.dangerouslyAllowPrivateNetwork`，因此瀏覽器導覽預設保持嚴格。
- 只有在你刻意信任私有網路瀏覽器導覽時，才設定 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在嚴格模式下，遠端 CDP profile 端點（`profiles.*.cdpUrl`）在可達性/探索檢查期間，也會受到相同的私有網路封鎖。
- `ssrfPolicy.allowPrivateNetwork` 仍支援作為舊版別名。
- 在嚴格模式下，請使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 作為明確例外。
- 遠端 profiles 僅能附加（停用啟動/停止/重設）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  若要讓 OpenClaw 探索 `/json/version`，請使用 HTTP(S)；若提供者給你直接的 DevTools WebSocket URL，請使用 WS(S)。
- `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 適用於遠端與
  `attachOnly` CDP 可達性，以及分頁開啟要求。受管理的 local loopback
  profiles 會保留本機 CDP 預設值。
- 如果外部管理的 CDP 服務可透過 loopback 存取，請將該
  profile 的 `attachOnly: true`；否則 OpenClaw 會將該 loopback 埠視為本機受管理瀏覽器 profile，並可能回報本機埠所有權錯誤。
- `existing-session` profiles 使用 Chrome MCP 而不是 CDP，並且可以附加至所選主機，或透過已連線的瀏覽器節點附加。
- `existing-session` profiles 可以設定 `userDataDir` 以指定特定
  Chromium-based 瀏覽器 profile，例如 Brave 或 Edge。
- `existing-session` profiles 保留目前 Chrome MCP 路由限制：
  以 snapshot/ref 驅動的動作，而非 CSS-selector 目標定位、單一檔案上傳
  hooks、沒有對話方塊逾時覆寫、沒有 `wait --load networkidle`，也沒有
  `responsebody`、PDF 匯出、下載攔截或批次動作。
- 本機受管理的 `openclaw` profiles 會自動指派 `cdpPort` 和 `cdpUrl`；只有
  遠端 CDP 才明確設定 `cdpUrl`。
- 本機受管理 profiles 可以設定 `executablePath`，以覆寫該 profile 的全域
  `browser.executablePath`。使用此設定可讓一個 profile 在 Chrome 中執行，另一個在 Brave 中執行。
- 本機受管理 profiles 會在 Chrome CDP HTTP
  探索時於程序啟動後使用 `browser.localLaunchTimeoutMs`，並在啟動後 CDP websocket 就緒時使用
  `browser.localCdpReadyTimeoutMs`。若在較慢主機上 Chrome
  成功啟動但就緒檢查與啟動競態，請提高這些值。兩個值都必須是最高 `120000` 毫秒的正整數；無效設定值會被拒絕。
- 自動偵測順序：預設瀏覽器（若為 Chromium-based）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 都接受
  `~` 和 `~/...`，會在 Chromium 啟動前展開為你的作業系統家目錄。
  `existing-session` profiles 上的個別 profile `userDataDir` 也會展開波浪號。
- 控制服務：僅限 loopback（埠衍生自 `gateway.port`，預設 `18791`）。
- `extraArgs` 會將額外啟動旗標附加到本機 Chromium 啟動（例如
  `--disable-gpu`、視窗大小或偵錯旗標）。

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
- `assistant`：控制 UI 身分覆寫。退回使用作用中的代理身分。

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

<Accordion title="Gateway field details">

- `mode`：`local`（執行 gateway）或 `remote`（連線到遠端 gateway）。除非為 `local`，否則 Gateway 會拒絕啟動。
- `port`：WS + HTTP 的單一多工連接埠。優先順序：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（預設）、`lan`（`0.0.0.0`）、`tailnet`（僅 Tailscale IP），或 `custom`。
- **舊版 bind 別名**：在 `gateway.bind` 中使用 bind 模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），不要使用主機別名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事項**：預設的 `loopback` bind 會在容器內監聽 `127.0.0.1`。使用 Docker bridge 網路（`-p 18789:18789`）時，流量會抵達 `eth0`，因此 gateway 無法連線。請使用 `--network host`，或設定 `bind: "lan"`（或使用 `bind: "custom"` 搭配 `customBindHost: "0.0.0.0"`）以監聽所有介面。
- **驗證**：預設為必要。非 loopback bind 需要 gateway 驗證。實務上，這表示需要共用 token/password，或搭配 `gateway.auth.mode: "trusted-proxy"` 的身分感知反向代理。Onboarding wizard 預設會產生 token。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRefs），請將 `gateway.auth.mode` 明確設定為 `token` 或 `password`。兩者皆已設定但未設定 mode 時，啟動與服務安裝/修復流程會失敗。
- `gateway.auth.mode: "none"`：明確的無驗證模式。僅用於受信任的 local loopback 設定；這是刻意不在 onboarding 提示中提供的選項。
- `gateway.auth.mode: "trusted-proxy"`：將瀏覽器/使用者驗證委派給身分感知反向代理，並信任來自 `gateway.trustedProxies` 的身分標頭（請參閱 [Trusted Proxy Auth](/zh-TW/gateway/trusted-proxy-auth)）。此模式預設預期代理來源為**非 loopback**；同主機 loopback 反向代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。內部同主機呼叫者可以使用 `gateway.auth.password` 作為本機直接 fallback；`gateway.auth.token` 仍與 trusted-proxy 模式互斥。
- `gateway.auth.allowTailscale`：當為 `true` 時，Tailscale Serve 身分標頭可滿足 Control UI/WebSocket 驗證（透過 `tailscale whois` 驗證）。HTTP API 端點**不會**使用該 Tailscale 標頭驗證；它們會改為遵循 gateway 的一般 HTTP 驗證模式。此無 token 流程假設 gateway 主機是受信任的。當 `tailscale.mode = "serve"` 時預設為 `true`。
- `gateway.auth.rateLimit`：選用的驗證失敗限制器。依每個用戶端 IP 與每個驗證範圍套用（shared-secret 與 device-token 會分開追蹤）。遭封鎖的嘗試會回傳 `429` + `Retry-After`。
  - 在非同步 Tailscale Serve Control UI 路徑上，相同 `{scope, clientIp}` 的失敗嘗試會在寫入失敗之前序列化。因此，來自同一用戶端的並行錯誤嘗試可能會在第二個請求觸發限制器，而不是兩者都以普通不相符的方式競速通過。
  - `gateway.auth.rateLimit.exemptLoopback` 預設為 `true`；當你刻意希望 localhost 流量也受速率限制時（例如測試設定或嚴格代理部署），請設定為 `false`。
- 瀏覽器來源的 WS 驗證嘗試一律會節流，且停用 loopback 豁免（深度防禦瀏覽器型 localhost 暴力嘗試）。
- 在 loopback 上，這些瀏覽器來源鎖定會依正規化的 `Origin`
  值隔離，因此來自某個 localhost origin 的重複失敗不會自動
  鎖定不同的 origin。
- `tailscale.mode`：`serve`（僅 tailnet，loopback bind）或 `funnel`（公開，需要驗證）。
- `tailscale.preserveFunnel`：當為 `true` 且 `tailscale.mode = "serve"` 時，OpenClaw
  會在啟動時重新套用 Serve 之前檢查 `tailscale funnel status`，若外部設定的 Funnel 路由已涵蓋 gateway 連接埠，則會略過
  它。預設為 `false`。
- `controlUi.allowedOrigins`：Gateway WebSocket 連線的明確瀏覽器來源允許清單。當預期瀏覽器用戶端來自非 loopback 來源時為必要。
- `controlUi.chatMessageMaxWidth`：群組化 Control UI 聊天訊息的選用最大寬度。接受受限的 CSS 寬度值，例如 `960px`、`82%`、`min(1280px, 82%)` 和 `calc(100% - 2rem)`。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危險模式，為刻意依賴 Host-header origin policy 的部署啟用 Host 標頭 origin fallback。
- `remote.transport`：`ssh`（預設）或 `direct`（ws/wss）。對於 `direct`，`remote.url` 必須是 `ws://` 或 `wss://`。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`：用戶端處理程序環境的
  break-glass 覆寫，允許對受信任私人網路
  IP 使用明文 `ws://`；明文預設仍僅限 loopback。沒有等效的 `openclaw.json`
  設定，且瀏覽器私人網路設定（例如
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`）不會影響 Gateway
  WebSocket 用戶端。
- `gateway.remote.token` / `.password` 是遠端用戶端認證欄位。它們本身不會設定 gateway 驗證。
- `gateway.push.apns.relay.baseUrl`：官方/TestFlight iOS 組建在向 gateway 發布 relay-backed registrations 後使用之外部 APNs relay 的基礎 HTTPS URL。此 URL 必須符合編譯進 iOS 組建中的 relay URL。
- `gateway.push.apns.relay.timeoutMs`：gateway 到 relay 傳送逾時，單位為毫秒。預設為 `10000`。
- relay-backed registrations 會委派給特定 gateway identity。配對的 iOS app 會擷取 `gateway.identity.get`，在 relay registration 中包含該身分，並將 registration-scoped send grant 轉送給 gateway。另一個 gateway 無法重用該儲存的 registration。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：上述 relay 設定的暫時環境覆寫。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：僅供開發使用的逃生口，用於 loopback HTTP relay URL。正式環境 relay URL 應維持使用 HTTPS。
- `gateway.handshakeTimeoutMs`：驗證前 Gateway WebSocket 交握逾時，單位為毫秒。預設：`15000`。設定 `OPENCLAW_HANDSHAKE_TIMEOUT_MS` 時會優先使用。若主機負載較高或效能較低，且本機用戶端可在啟動暖機仍在穩定時連線，請提高此值。
- `gateway.channelHealthCheckMinutes`：channel health-monitor 間隔，單位為分鐘。設定為 `0` 可全域停用 health-monitor 重啟。預設：`5`。
- `gateway.channelStaleEventThresholdMinutes`：stale-socket 閾值，單位為分鐘。請保持此值大於或等於 `gateway.channelHealthCheckMinutes`。預設：`30`。
- `gateway.channelMaxRestartsPerHour`：每個 channel/account 在滾動一小時內的 health-monitor 最大重啟次數。預設：`10`。
- `channels.<provider>.healthMonitor.enabled`：每個 channel 的選擇性退出設定，可在保留全域監視器啟用的同時停用 health-monitor 重啟。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多帳號 channel 的每帳號覆寫。設定後會優先於 channel 層級覆寫。
- 本機 gateway 呼叫路徑只有在未設定 `gateway.auth.*` 時，才能使用 `gateway.remote.*` 作為 fallback。
- 如果 `gateway.auth.token` / `gateway.auth.password` 透過 SecretRef 明確設定但無法解析，解析會 fail closed（不會以遠端 fallback 掩蓋）。
- `trustedProxies`：終止 TLS 或注入 forwarded-client 標頭的反向代理 IP。僅列出你控制的代理。loopback 項目對同主機代理/本機偵測設定仍有效（例如 Tailscale Serve 或本機反向代理），但它們**不會**讓 loopback 請求符合 `gateway.auth.mode: "trusted-proxy"` 的資格。
- `allowRealIpFallback`：當為 `true` 時，若缺少 `X-Forwarded-For`，gateway 會接受 `X-Real-IP`。預設為 `false`，以採用 fail-closed 行為。
- `gateway.nodes.pairing.autoApproveCidrs`：選用 CIDR/IP 允許清單，用於自動核准首次 node device pairing，且不含要求的 scopes。未設定時停用。這不會自動核准 operator/browser/Control UI/WebChat pairing，也不會自動核准 role、scope、metadata 或 public-key 升級。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`：在配對與平台允許清單評估後，針對宣告的 node commands 進行全域 allow/deny shaping。使用 `allowCommands` 選擇加入危險 node commands，例如 `camera.snap`、`camera.clip` 和 `screen.record`；即使平台預設或明確允許原本會包含某命令，`denyCommands` 也會移除該命令。node 變更其宣告的 command list 後，請拒絕並重新核准該 device pairing，讓 gateway 儲存更新後的 command snapshot。
- `gateway.tools.deny`：針對 HTTP `POST /tools/invoke` 封鎖的額外 tool 名稱（擴充預設 deny list）。
- `gateway.tools.allow`：從預設 HTTP deny list 移除 tool 名稱。

</Accordion>

### OpenAI 相容端點

- Chat Completions：預設停用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 啟用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 輸入強化：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空的允許清單會被視為未設定；使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和/或 `gateway.http.endpoints.responses.images.allowUrl=false` 以停用 URL 擷取。
- 選用的回應強化標頭：
  - `gateway.http.securityHeaders.strictTransportSecurity`（僅對你控制的 HTTPS origins 設定；請參閱 [Trusted Proxy Auth](/zh-TW/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多執行個體隔離

在一台主機上使用唯一的連接埠和狀態目錄執行多個 gateways：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利旗標：`--dev`（使用 `~/.openclaw-dev` + 連接埠 `19001`）、`--profile <name>`（使用 `~/.openclaw-<name>`）。

請參閱 [Multiple Gateways](/zh-TW/gateway/multiple-gateways)。

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

- `enabled`：在 gateway listener 啟用 TLS termination（HTTPS/WSS）（預設：`false`）。
- `autoGenerate`：未設定明確檔案時，自動產生本機自簽 cert/key pair；僅供本機/開發使用。
- `certPath`：TLS certificate file 的檔案系統路徑。
- `keyPath`：TLS private key file 的檔案系統路徑；請限制權限。
- `caPath`：用於 client verification 或自訂 trust chains 的選用 CA bundle 路徑。

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
  - `"restart"`：設定變更時一律重啟 gateway 程序。
  - `"hot"`：不重啟，直接在處理程序內套用變更。
  - `"hybrid"`（預設）：先嘗試 hot reload；若必要則 fallback 到重啟。
- `debounceMs`：套用設定變更前的 debounce 視窗，單位為 ms（非負整數）。
- `deferralTimeoutMs`：在強制重啟或 channel hot reload 之前，等待進行中作業的選用最長時間，單位為 ms。省略時使用預設有界等待（`300000`）；設定為 `0` 則無限期等待，並定期記錄 still-pending 警告。

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
查詢字串 hook token 會被拒絕。

驗證與安全注意事項：

- `hooks.enabled=true` 需要非空的 `hooks.token`。
- `hooks.token` 必須與 `gateway.auth.token` **不同**；重複使用 Gateway token 會被拒絕。
- `hooks.path` 不能是 `/`；請使用專用子路徑，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，請限制 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果對應或預設使用樣板化的 `sessionKey`，請設定 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。靜態對應鍵不需要選擇加入。

**端點：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 只有在 `hooks.allowRequestSessionKey=true`（預設值：`false`）時，才會接受要求酬載中的 `sessionKey`。
- `POST /hooks/<name>` → 透過 `hooks.mappings` 解析
  - 以樣板算繪的對應 `sessionKey` 值會視為外部提供，因此也需要 `hooks.allowRequestSessionKey=true`。

<Accordion title="Mapping details">

- `match.path` 會比對 `/hooks` 後方的子路徑（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 會比對一般路徑的酬載欄位。
- 像 `{{messages[0].subject}}` 這樣的樣板會從酬載讀取。
- `transform` 可指向回傳 hook 動作的 JS/TS 模組。
  - `transform.module` 必須是相對路徑，且保留在 `hooks.transformsDir` 內（絕對路徑與路徑穿越會被拒絕）。
  - 請將 `hooks.transformsDir` 保持在 `~/.openclaw/hooks/transforms` 底下；工作區 Skills 目錄會被拒絕。如果 `openclaw doctor` 回報此路徑無效，請將 transform 模組移至 hooks transforms 目錄，或移除 `hooks.transformsDir`。
- `agentId` 會路由至特定 agent；未知 ID 會退回預設值。
- `allowedAgentIds`：限制明確路由（`*` 或省略 = 允許全部，`[]` = 全部拒絕）。
- `defaultSessionKey`：可選的固定 session key，用於沒有明確 `sessionKey` 的 hook agent 執行。
- `allowRequestSessionKey`：允許 `/hooks/agent` 呼叫端與樣板驅動的對應 session key 設定 `sessionKey`（預設值：`false`）。
- `allowedSessionKeyPrefixes`：明確 `sessionKey` 值（要求 + 對應）的可選前綴允許清單，例如 `["hook:"]`。當任何對應或預設使用樣板化的 `sessionKey` 時，它會變成必填。
- `deliver: true` 會將最終回覆傳送到頻道；`channel` 預設為 `last`。
- `model` 會覆寫此 hook 執行的 LLM（如果已設定模型型錄，必須允許該模型）。

</Accordion>

### Gmail 整合

- 內建的 Gmail 預設使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果保留該逐訊息路由，請設定 `hooks.allowRequestSessionKey: true`，並限制 `hooks.allowedSessionKeyPrefixes` 以符合 Gmail 命名空間，例如 `["hook:", "hook:gmail:"]`。
- 如果需要 `hooks.allowRequestSessionKey: false`，請以靜態 `sessionKey` 覆寫該預設，而不是使用樣板化預設值。

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

- Gateway 會在開機時依設定自動啟動 `gog gmail watch serve`。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可停用。
- 不要在 Gateway 旁邊另外執行 `gog gmail watch serve`。

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

- 在 Gateway 連接埠下透過 HTTP 提供 agent 可編輯的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 僅限本機：保持 `gateway.bind: "loopback"`（預設值）。
- 非 loopback 繫結：canvas 路由需要 Gateway 驗證（token/password/trusted-proxy），與其他 Gateway HTTP 表面相同。
- Node WebView 通常不會傳送驗證標頭；node 配對並連線後，Gateway 會公告 node 範圍的能力 URL，用於存取 canvas/A2UI。
- 能力 URL 會繫結至作用中的 node WS session，並且會快速過期。不會使用以 IP 為基礎的後援。
- 將即時重新載入用戶端注入提供的 HTML。
- 空白時會自動建立入門 `index.html`。
- 也會在 `/__openclaw__/a2ui/` 提供 A2UI。
- 變更需要重新啟動 gateway。
- 對於大型目錄或 `EMFILE` 錯誤，請停用即時重新載入。

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

- `minimal`（內建的 `bonjour` Plugin 啟用時的預設值）：從 TXT 記錄省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`；LAN 多播公告仍需啟用內建的 `bonjour` Plugin。
- `off`：抑制 LAN 多播公告，而不變更 Plugin 啟用狀態。
- 內建的 `bonjour` Plugin 會在 macOS 主機上自動啟動，而在 Linux、Windows 與容器化 Gateway 部署上需選擇加入。
- 主機名稱在是有效 DNS 標籤時，預設為系統主機名稱，否則退回 `openclaw`。可使用 `OPENCLAW_MDNS_HOSTNAME` 覆寫。

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

### `env`（行內環境變數）

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

- 只有在程序環境缺少該鍵時，才會套用行內環境變數。
- `.env` 檔案：CWD `.env` + `~/.openclaw/.env`（兩者都不會覆寫現有變數）。
- `shellEnv`：從你的登入 shell 設定檔匯入缺少的預期鍵。
- 如需完整優先順序，請參閱[環境](/zh-TW/help/environment)。

### 環境變數替換

在任何設定字串中使用 `${VAR_NAME}` 參照環境變數：

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 只會比對大寫名稱：`[A-Z_][A-Z0-9_]*`。
- 缺少或空白的變數會在載入設定時擲出錯誤。
- 使用 `$${VAR}` 跳脫為字面值 `${VAR}`。
- 可搭配 `$include` 使用。

---

## 密鑰

密鑰參照是加成式的：純文字值仍然可用。

### `SecretRef`

使用一種物件形狀：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

驗證：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id：絕對 JSON 指標（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` id 模式：`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` ids 不得包含 `.` 或 `..` 這類以斜線分隔的路徑區段（例如 `a/../b` 會被拒絕）

### 支援的憑證介面

- 標準矩陣：[SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)
- `secrets apply` 會以支援的 `openclaw.json` 憑證路徑為目標。
- `auth-profiles.json` 參照包含在執行階段解析與稽核涵蓋範圍內。

### 密鑰提供者設定

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

- `file` 提供者支援 `mode: "json"` 與 `mode: "singleValue"`（在 singleValue 模式中，`id` 必須是 `"value"`）。
- 當 Windows ACL 驗證無法使用時，檔案與 exec 提供者路徑會封閉失敗。只有對於受信任但無法驗證的路徑，才設定 `allowInsecurePath: true`。
- `exec` 提供者需要絕對 `command` 路徑，並在 stdin/stdout 使用通訊協定承載資料。
- 預設會拒絕符號連結命令路徑。設定 `allowSymlinkCommand: true` 可允許符號連結路徑，同時驗證解析後的目標路徑。
- 如果已設定 `trustedDirs`，受信任目錄檢查會套用至解析後的目標路徑。
- `exec` 子環境預設為最小化；請使用 `passEnv` 明確傳遞必要變數。
- 密鑰參照會在啟用時解析成記憶體內快照，之後請求路徑只會讀取該快照。
- 啟用期間會套用作用中介面篩選：已啟用介面上未解析的參照會讓啟動/重新載入失敗，而非作用中介面會以診斷方式略過。

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

- 個別代理的設定檔儲存在 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 針對靜態憑證模式支援值層級參照（`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- 傳統扁平 `auth-profiles.json` 對應（例如 `{ "provider": { "apiKey": "..." } }`）不是執行階段格式；`openclaw doctor --fix` 會將它們重寫為標準 `provider:default` API 金鑰設定檔，並建立 `.legacy-flat.*.bak` 備份。
- OAuth 模式設定檔（`auth.profiles.<id>.mode = "oauth"`）不支援以 SecretRef 作為後端的 auth-profile 憑證。
- 靜態執行階段憑證來自記憶體內已解析快照；發現傳統靜態 `auth.json` 項目時會清除。
- 傳統 OAuth 會從 `~/.openclaw/credentials/oauth.json` 匯入。
- 請參閱 [OAuth](/zh-TW/concepts/oauth)。
- 密鑰執行階段行為與 `audit/configure/apply` 工具：[密鑰管理](/zh-TW/gateway/secrets)。

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

- `billingBackoffHours`：當設定檔因真正的計費/信用不足錯誤而失敗時，以小時為單位的基礎退避時間（預設值：`5`）。明確的計費文字即使在 `401`/`403` 回應中仍可能歸入這裡，但供應商特定文字比對器仍限定於擁有它們的供應商範圍內（例如 OpenRouter `Key limit exceeded`）。可重試的 HTTP `402` 使用時段或組織/工作區支出限制訊息，則會留在 `rate_limit` 路徑中。
- `billingBackoffHoursByProvider`：選用的每供應商計費退避小時數覆寫。
- `billingMaxHours`：計費退避指數成長的小時數上限（預設值：`24`）。
- `authPermanentBackoffMinutes`：高信心 `auth_permanent` 失敗的基礎退避分鐘數（預設值：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避成長的分鐘數上限（預設值：`60`）。
- `failureWindowHours`：用於退避計數器的滾動視窗小時數（預設值：`24`）。
- `overloadedProfileRotations`：在切換至模型後援之前，針對過載錯誤的同一供應商驗證設定檔輪替次數上限（預設值：`1`）。像 `ModelNotReadyException` 這類供應商忙碌形態會歸入這裡。
- `overloadedBackoffMs`：重試過載供應商/設定檔輪替前的固定延遲（預設值：`0`）。
- `rateLimitedProfileRotations`：在切換至模型後援之前，針對速率限制錯誤的同一供應商驗證設定檔輪替次數上限（預設值：`1`）。該速率限制分類包含供應商形態文字，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 與 `resource exhausted`。

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
- `maxFileBytes`：輪替前作用中記錄檔的最大位元組大小（正整數；預設值：`104857600` = 100 MB）。OpenClaw 會在作用中檔案旁保留最多五個編號封存檔。
- `redactSensitive` / `redactPatterns`：對主控台輸出、檔案記錄、OTLP 記錄紀錄與持久化工作階段逐字稿文字進行盡力遮罩。`redactSensitive: "off"` 只會停用這個一般記錄/逐字稿政策；UI/工具/診斷安全介面在發出前仍會遮蔽秘密。

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

- `enabled`：檢測輸出的主開關（預設值：`true`）。
- `flags`：啟用目標記錄輸出的旗標字串陣列（支援像 `"telegram.*"` 或 `"*"` 的萬用字元）。
- `stuckSessionWarnMs`：以毫秒為單位的無進展時間門檻，用於將長時間執行的處理工作階段分類為 `session.long_running`、`session.stalled` 或 `session.stuck`。回覆、工具、狀態、區塊與 ACP 進度會重設計時器；重複的 `session.stuck` 診斷會在未變更時退避。
- `stuckSessionAbortMs`：符合條件的停滯作用中工作在可透過中止清空來復原之前，以毫秒為單位的無進展時間門檻。未設定時，OpenClaw 會使用較安全的延長嵌入式執行視窗，至少 10 分鐘且為 5 倍 `stuckSessionWarnMs`。
- `otel.enabled`：啟用 OpenTelemetry 匯出管線（預設值：`false`）。完整設定、訊號目錄與隱私模型，請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。
- `otel.endpoint`：OTel 匯出的收集器 URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`：選用的訊號特定 OTLP 端點。設定後，它們只會針對該訊號覆寫 `otel.endpoint`。
- `otel.protocol`：`"http/protobuf"`（預設值）或 `"grpc"`。
- `otel.headers`：隨 OTel 匯出請求傳送的額外 HTTP/gRPC 中繼資料標頭。
- `otel.serviceName`：資源屬性的服務名稱。
- `otel.traces` / `otel.metrics` / `otel.logs`：啟用追蹤、指標或記錄匯出。
- `otel.sampleRate`：追蹤取樣率 `0`-`1`。
- `otel.flushIntervalMs`：以毫秒為單位的週期性遙測清空間隔。
- `otel.captureContent`：選擇加入，擷取 OTEL span 屬性的原始內容。預設關閉。布林值 `true` 會擷取非系統訊息/工具內容；物件形式可讓你明確啟用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs` 與 `systemPrompt`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`：最新實驗性 GenAI span 供應商屬性的環境開關。預設情況下，span 會保留舊版 `gen_ai.system` 屬性以維持相容性；GenAI 指標會使用有界語意屬性。
- `OPENCLAW_OTEL_PRELOADED=1`：供已註冊全域 OpenTelemetry SDK 的主機使用的環境開關。OpenClaw 接著會略過 Plugin 擁有的 SDK 啟動/關閉，同時保持診斷監聽器作用中。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 與 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`：當相符設定鍵未設定時使用的訊號特定端點環境變數。
- `cacheTrace.enabled`：記錄嵌入式執行的快取追蹤快照（預設值：`false`）。
- `cacheTrace.filePath`：快取追蹤 JSONL 的輸出路徑（預設值：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制快取追蹤輸出中包含的內容（全部預設為：`true`）。

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

- `channel`：npm/git 安裝的發行通道 - `"stable"`、`"beta"` 或 `"dev"`。
- `checkOnStart`：Gateway 啟動時檢查 npm 更新（預設值：`true`）。
- `auto.enabled`：為套件安裝啟用背景自動更新（預設值：`false`）。
- `auto.stableDelayHours`：穩定通道自動套用前的最短延遲小時數（預設值：`6`；最大值：`168`）。
- `auto.stableJitterHours`：額外的穩定通道推出分散視窗小時數（預設值：`12`；最大值：`168`）。
- `auto.betaCheckIntervalHours`：Beta 通道檢查執行頻率的小時數（預設值：`1`；最大值：`24`）。

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

- `enabled`：全域 ACP 功能閘門（預設值：`true`；設為 `false` 可隱藏 ACP 派送與產生 affordance）。
- `dispatch.enabled`：ACP 工作階段回合派送的獨立閘門（預設值：`true`）。設為 `false` 可在保留 ACP 命令可用的同時封鎖執行。
- `backend`：預設 ACP 執行階段後端 ID（必須符合已註冊的 ACP 執行階段 Plugin）。
  請先安裝後端 Plugin，而且若已設定 `plugins.allow`，請包含後端 Plugin ID（例如 `acpx`），否則 ACP 後端不會載入。
- `defaultAgent`：當產生未指定明確目標時的後援 ACP 目標代理 ID。
- `allowedAgents`：允許用於 ACP 執行階段工作階段的代理 ID 允許清單；空白表示沒有額外限制。
- `maxConcurrentSessions`：同時作用中的 ACP 工作階段數量上限。
- `stream.coalesceIdleMs`：串流文字的閒置清空視窗，單位為毫秒。
- `stream.maxChunkChars`：分割串流區塊投影前的最大區塊大小。
- `stream.repeatSuppression`：每個回合抑制重複的狀態/工具行（預設值：`true`）。
- `stream.deliveryMode`：`"live"` 逐步串流；`"final_only"` 會緩衝直到回合終端事件。
- `stream.hiddenBoundarySeparator`：隱藏工具事件之後、可見文字之前的分隔符（預設值：`"paragraph"`）。
- `stream.maxOutputChars`：每個 ACP 回合投影的助理輸出字元上限。
- `stream.maxSessionUpdateChars`：投影 ACP 狀態/更新行的最大字元數。
- `stream.tagVisibility`：標籤名稱到串流事件布林可見性覆寫的紀錄。
- `runtime.ttlMinutes`：ACP 工作階段工作者在符合清理條件前的閒置 TTL，單位為分鐘。
- `runtime.installCommand`：啟動 ACP 執行階段環境時要執行的選用安裝命令。

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
  - `"random"`（預設值）：輪替的有趣/季節性標語。
  - `"default"`：固定的中性標語（`All your chats, one OpenClaw.`）。
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

目前建置不再包含 TCP 橋接器。Node 會透過 Gateway WebSocket 連線。`bridge.*` 鍵不再屬於設定結構描述的一部分（驗證會失敗，直到移除為止；`openclaw doctor --fix` 可移除未知鍵）。

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

- `sessionRetention`：已完成的隔離 Cron 執行工作階段在從 `sessions.json` 修剪前要保留多久。也控制已封存且已刪除的 Cron transcript 清理。預設值：`24h`；設為 `false` 可停用。
- `runLog.maxBytes`：修剪前每個執行記錄檔案（`cron/runs/<jobId>.jsonl`）的最大大小。預設值：`2_000_000` 位元組。
- `runLog.keepLines`：觸發執行記錄修剪時保留的最新行數。預設值：`2000`。
- `webhookToken`：用於 Cron Webhook POST 傳遞（`delivery.mode = "webhook"`）的 bearer token；若省略，則不傳送 auth header。
- `webhook`：已棄用的舊版 fallback Webhook URL（http/https），僅用於仍有 `notify: true` 的已儲存工作。

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

- `maxAttempts`：一次性工作在暫時性錯誤上的最大重試次數（預設值：`3`；範圍：`0`-`10`）。
- `backoffMs`：每次重試嘗試的 backoff 延遲陣列，單位為 ms（預設值：`[30000, 60000, 300000]`；1-10 個項目）。
- `retryOn`：會觸發重試的錯誤類型 - `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略時會重試所有暫時性類型。

僅適用於一次性 Cron 工作。週期性工作會使用獨立的失敗處理。

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

- `enabled`：啟用 Cron 工作的失敗警示（預設值：`false`）。
- `after`：觸發警示前的連續失敗次數（正整數，最小值：`1`）。
- `cooldownMs`：同一工作重複警示之間的最小毫秒數（非負整數）。
- `includeSkipped`：將連續略過的執行計入警示門檻（預設值：`false`）。略過的執行會分開追蹤，且不影響執行錯誤 backoff。
- `mode`：傳遞模式 - `"announce"` 透過 channel message 傳送；`"webhook"` 會 POST 到已設定的 Webhook。
- `accountId`：用於限定警示傳遞範圍的選用帳戶或 channel id。

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

- 所有工作的 Cron 失敗通知預設目的地。
- `mode`：`"announce"` 或 `"webhook"`；當目標資料足夠時，預設為 `"announce"`。
- `channel`：announce 傳遞的 channel override。`"last"` 會重用最後已知的傳遞 channel。
- `to`：明確的 announce 目標或 Webhook URL。Webhook 模式需要此項。
- `accountId`：用於傳遞的選用帳戶 override。
- 每個工作的 `delivery.failureDestination` 會覆寫此全域預設值。
- 當未設定全域或每工作失敗目的地時，已透過 `announce` 傳遞的工作會在失敗時 fallback 到該主要 announce 目標。
- `delivery.failureDestination` 只支援 `sessionTarget="isolated"` 工作，除非工作的主要 `delivery.mode` 是 `"webhook"`。

請參閱 [Cron 工作](/zh-TW/automation/cron-jobs)。隔離的 Cron 執行會作為[背景工作](/zh-TW/automation/tasks)追蹤。

---

## 媒體模型範本變數

在 `tools.media.models[].args` 中展開的範本 placeholder：

| 變數               | 說明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完整的傳入訊息 body                              |
| `{{RawBody}}`      | 原始 body（不含歷史記錄/寄件者 wrapper）         |
| `{{BodyStripped}}` | 已移除群組 mentions 的 body                      |
| `{{From}}`         | 寄件者識別碼                                      |
| `{{To}}`           | 目的地識別碼                                      |
| `{{MessageSid}}`   | Channel message id                                |
| `{{SessionId}}`    | 目前的 session UUID                               |
| `{{IsNewSession}}` | 建立新 session 時為 `"true"`                      |
| `{{MediaUrl}}`     | 傳入媒體 pseudo-URL                               |
| `{{MediaPath}}`    | 本機媒體路徑                                      |
| `{{MediaType}}`    | 媒體類型（image/audio/document/…）                |
| `{{Transcript}}`   | 音訊 transcript                                   |
| `{{Prompt}}`       | CLI 項目的已解析媒體 prompt                       |
| `{{MaxChars}}`     | CLI 項目的已解析最大輸出字元數                   |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                           |
| `{{GroupSubject}}` | 群組主旨（盡力提供）                              |
| `{{GroupMembers}}` | 群組成員預覽（盡力提供）                          |
| `{{SenderName}}`   | 寄件者顯示名稱（盡力提供）                        |
| `{{SenderE164}}`   | 寄件者電話號碼（盡力提供）                        |
| `{{Provider}}`     | Provider 提示（whatsapp、telegram、discord 等）   |

---

## Config includes（`$include`）

將 config 拆分為多個檔案：

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
- 檔案陣列：依序深度合併（較後者覆寫較前者）。
- 同層 keys：在 includes 之後合併（覆寫已 include 的值）。
- 巢狀 includes：最多 10 層。
- 路徑：相對於包含它的檔案解析，但必須保持在最上層 config 目錄內（`openclaw.json` 的 `dirname`）。Absolute/`../` 形式只有在仍解析到該邊界內時才允許。
- 由 OpenClaw 擁有的寫入若只變更由單一檔案 include 支援的一個最上層 section，會寫入該被 include 的檔案。例如，`plugins install` 會在 `plugins.json5` 中更新 `plugins: { $include: "./plugins.json5" }`，並讓 `openclaw.json` 保持不變。
- Root includes、include 陣列，以及含有同層 override 的 includes，對 OpenClaw 擁有的寫入是唯讀；這些寫入會 fail closed，而不是 flatten config。
- 錯誤：對於遺失檔案、解析錯誤與循環 includes 會提供清楚訊息。

---

_相關：[Configuration](/zh-TW/gateway/configuration) · [Configuration Examples](/zh-TW/gateway/configuration-examples) · [Doctor](/zh-TW/gateway/doctor)_

## 相關

- [Configuration](/zh-TW/gateway/configuration)
- [Configuration examples](/zh-TW/gateway/configuration-examples)
