---
read_when:
    - 需要精確的欄位層級設定語意或預設值
    - 你正在驗證通道、模型、Gateway 或工具設定區塊
summary: Gateway 設定參考，涵蓋核心 OpenClaw 鍵、預設值，以及專用子系統參考的連結
title: 設定參考
x-i18n:
    generated_at: "2026-05-07T13:17:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b279c3e74fd6f7de01d63b642ab17aaaac65c39b855efc745eadc121adbf1fb
    source_path: gateway/configuration-reference.md
    workflow: 16
---

核心設定參考，適用於 `~/.openclaw/openclaw.json`。如需以任務為導向的概覽，請參閱 [設定](/zh-TW/gateway/configuration)。

涵蓋主要的 OpenClaw 設定介面；當子系統有自己的更深入參考資料時，會連結至該頁。頻道與 plugin 擁有的命令目錄，以及深入的記憶體/QMD 調整項，位於各自頁面而非本頁。

程式碼真相：

- `openclaw config schema` 會列印用於驗證和 Control UI 的即時 JSON Schema；可用時會合併 bundled/plugin/channel metadata
- `config.schema.lookup` 會傳回一個依路徑範圍限定的 schema 節點，供深入查看工具使用
- `pnpm config:docs:check` / `pnpm config:docs:gen` 會根據目前 schema 介面驗證設定文件基準雜湊

Agent 查詢路徑：編輯前，請使用 `gateway` 工具動作 `config.schema.lookup` 取得精確的欄位層級文件與限制。使用 [設定](/zh-TW/gateway/configuration) 取得以任務為導向的指引，並使用本頁取得更廣泛的欄位地圖、預設值，以及子系統參考連結。

專用深入參考：

- [記憶體設定參考](/zh-TW/reference/memory-config)，適用於 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及 `plugins.entries.memory-core.config.dreaming` 底下的 Dreaming 設定
- [斜線命令](/zh-TW/tools/slash-commands)，適用於目前內建與 bundled 命令目錄
- 擁有頻道特定命令介面的頻道/plugin 頁面

設定格式為 **JSON5**（允許註解與尾隨逗號）。所有欄位都是選用；省略時 OpenClaw 會使用安全預設值。

---

## 頻道

各頻道設定鍵已移至專用頁面；請參閱
[設定 - 頻道](/zh-TW/gateway/config-channels)，了解 `channels.*`，
包括 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage，以及其他
bundled channels（驗證、存取控制、多帳號、提及閘控）。

## Agent 預設值、多 Agent、工作階段與訊息

已移至專用頁面；請參閱
[設定 - agents](/zh-TW/gateway/config-agents)，了解：

- `agents.defaults.*`（工作區、模型、思考、heartbeat、記憶體、媒體、Skills、sandbox）
- `multiAgent.*`（多 Agent 路由與繫結）
- `session.*`（工作階段生命週期、Compaction、修剪）
- `messages.*`（訊息傳遞、TTS、markdown 轉譯）
- `talk.*`（Talk 模式）
  - `talk.speechLocale`：Talk 在 iOS/macOS 上進行語音辨識時使用的選用 BCP 47 locale id
  - `talk.silenceTimeoutMs`：未設定時，Talk 會在傳送逐字稿前保留平台預設暫停時間窗（`macOS 和 Android 為 700 ms，iOS 為 900 ms`）

## 工具與自訂提供者

工具政策、實驗性切換、提供者支援的工具設定，以及自訂
provider / base-URL 設定已移至專用頁面；請參閱
[設定 - 工具與自訂提供者](/zh-TW/gateway/config-tools)。

## 模型

提供者定義、模型允許清單與自訂提供者設定位於
[設定 - 工具與自訂提供者](/zh-TW/gateway/config-tools#custom-providers-and-base-urls)。
`models` 根也負責全域模型目錄行為。

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`：提供者目錄行為（`merge` 或 `replace`）。
- `models.providers`：以提供者 id 為鍵的自訂提供者 map。
- `models.pricing.enabled`：控制背景定價 bootstrap；它會在 sidecars 與頻道到達 Gateway ready path 後啟動。當為 `false` 時，Gateway 會略過 OpenRouter 與 LiteLLM 定價目錄擷取；已設定的 `models.providers.*.models[].cost` 值仍可用於本機成本估算。

## MCP

OpenClaw 管理的 MCP 伺服器定義位於 `mcp.servers` 底下，並由嵌入式 Pi 和其他 runtime adapters 使用。`openclaw mcp list`、`show`、`set` 與 `unset` 命令會管理此區塊，且在設定編輯期間不會連線到目標伺服器。

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

- `mcp.servers`：具名 stdio 或遠端 MCP 伺服器定義，供公開已設定 MCP 工具的 runtimes 使用。
  遠端項目使用 `transport: "streamable-http"` 或 `transport: "sse"`；
  `type: "http"` 是 CLI 原生別名，`openclaw mcp set` 與
  `openclaw doctor --fix` 會將其標準化為 canonical `transport` 欄位。
- `mcp.sessionIdleTtlMs`：工作階段範圍 bundled MCP runtimes 的閒置 TTL。
  一次性嵌入式執行會要求 run-end cleanup；此 TTL 是長生命週期工作階段與未來呼叫者的後備機制。
- `mcp.*` 底下的變更會透過處置快取的工作階段 MCP runtimes 熱套用。
  下一次工具探索/使用會依新設定重新建立它們，因此移除的
  `mcp.servers` 項目會立即被清除，而不必等待閒置 TTL。

請參閱 [MCP](/zh-TW/cli/mcp#openclaw-as-an-mcp-client-registry) 與
[CLI 後端](/zh-TW/gateway/cli-backends#bundle-mcp-overlays) 了解 runtime 行為。

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
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

- `allowBundled`：僅適用於 bundled skills 的選用允許清單（managed/workspace skills 不受影響）。
- `load.extraDirs`：額外的共用 skill roots（最低優先順序）。
- `install.preferBrew`：為 true 時，若 `brew` 可用，會優先使用 Homebrew installers，再退回其他 installer kinds。
- `install.nodeManager`：`metadata.openclaw.install` specs 的 node installer 偏好設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false` 會停用某個 skill，即使它是 bundled/installed。
- `entries.<skillKey>.apiKey`：供宣告主要 env var 的 skills 使用的便利欄位（純文字字串或 SecretRef 物件）。

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
- 探索接受原生 OpenClaw plugins，以及相容的 Codex bundles 和 Claude bundles，包括沒有 manifest 的 Claude 預設版面 bundles。
- **設定變更需要重新啟動 gateway。**
- `allow`：選用允許清單（只載入列出的 plugins）。`deny` 優先。
- `bundledDiscovery`：新設定預設為 `"allowlist"`，因此非空的
  `plugins.allow` 也會閘控 bundled provider plugins，包括 web-search
  runtime providers。Doctor 會為已遷移的舊版允許清單設定寫入 `"compat"`，
  以保留現有 bundled provider 行為，直到你選擇加入。
- `plugins.entries.<id>.apiKey`：plugin 層級 API key 便利欄位（當 plugin 支援時）。
- `plugins.entries.<id>.env`：plugin 範圍 env var map。
- `plugins.entries.<id>.hooks.allowPromptInjection`：當為 `false` 時，core 會封鎖 `before_prompt_build`，並忽略舊版 `before_agent_start` 中會變更 prompt 的欄位，同時保留舊版 `modelOverride` 與 `providerOverride`。適用於原生 plugin hooks 與受支援 bundle 提供的 hook directories。
- `plugins.entries.<id>.hooks.allowConversationAccess`：當為 `true` 時，可信任的非 bundled plugins 可從 typed hooks 讀取原始對話內容，例如 `llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize` 與 `agent_end`。
- `plugins.entries.<id>.subagent.allowModelOverride`：明確信任此 plugin 可為背景 subagent runs 要求每次執行的 `provider` 與 `model` 覆寫。
- `plugins.entries.<id>.subagent.allowedModels`：可信任 subagent 覆寫的 canonical `provider/model` 目標選用允許清單。只有在你有意允許任何模型時，才使用 `"*"`。
- `plugins.entries.<id>.config`：plugin 定義的設定物件（可用時由原生 OpenClaw plugin schema 驗證）。
- Channel plugin account/runtime 設定位於 `channels.<id>` 底下，並應由擁有該項目的 plugin manifest `channelConfigs` metadata 描述，而不是由中央 OpenClaw option registry 描述。
- `plugins.entries.firecrawl.config.webFetch`：Firecrawl web-fetch provider 設定。
  - `apiKey`：Firecrawl API key（接受 SecretRef）。會退回至 `plugins.entries.firecrawl.config.webSearch.apiKey`、舊版 `tools.web.fetch.firecrawl.apiKey`，或 `FIRECRAWL_API_KEY` env var。
  - `baseUrl`：Firecrawl API base URL（預設：`https://api.firecrawl.dev`；self-hosted 覆寫必須指向 private/internal endpoints）。
  - `onlyMainContent`：只從頁面擷取主要內容（預設：`true`）。
  - `maxAgeMs`：最大快取存留時間，以毫秒為單位（預設：`172800000` / 2 天）。
  - `timeoutSeconds`：scrape request timeout，以秒為單位（預設：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok web search）設定。
  - `enabled`：啟用 X Search provider。
  - `model`：用於搜尋的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：記憶體 Dreaming 設定。請參閱 [Dreaming](/zh-TW/concepts/dreaming) 了解階段與閾值。
  - `enabled`：Dreaming 主開關（預設 `false`）。
  - `frequency`：每次完整 Dreaming sweep 的 Cron cadence（預設為 `"0 3 * * *"`）。
  - `model`：選用的 Dream Diary subagent 模型覆寫。需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`；請搭配 `allowedModels` 以限制目標。模型不可用錯誤會使用工作階段預設模型重試一次；信任或允許清單失敗不會靜默退回。
  - 階段政策與閾值是實作細節（不是面向使用者的設定鍵）。
- 完整記憶體設定位於 [記憶體設定參考](/zh-TW/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已啟用的 Claude bundle plugins 也可以從 `settings.json` 提供嵌入式 Pi 預設值；OpenClaw 會將這些套用為已清理的 agent settings，而不是原始 OpenClaw config patches。
- `plugins.slots.memory`：選擇作用中的 memory plugin id，或使用 `"none"` 停用 memory plugins。
- `plugins.slots.contextEngine`：選擇作用中的 context engine plugin id；除非你安裝並選擇其他 engine，否則預設為 `"legacy"`。

請參閱 [Plugins](/zh-TW/tools/plugin)。

---

## 承諾

`commitments` 控制推斷出的後續追蹤記憶體：OpenClaw 可以從對話回合偵測 check-ins，並透過 heartbeat runs 傳遞它們。

- `commitments.enabled`：啟用隱藏 LLM 擷取、儲存，以及針對推斷後續承諾的 heartbeat delivery。預設：`false`。
- `commitments.maxPerDay`：在滾動的一天內，每個 agent session 傳遞的推斷後續承諾最大數量。預設：`3`。

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
- `tabCleanup` 會在閒置一段時間後，或在工作階段超過上限時，回收已追蹤的主要代理分頁。設定 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 可停用個別清理模式。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` 未設定時會停用，因此瀏覽器導覽預設會維持嚴格。
- 只有在你刻意信任私有網路瀏覽器導覽時，才設定 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在嚴格模式中，遠端 CDP 設定檔端點（`profiles.*.cdpUrl`）在可連線性/探索檢查期間，也會受到相同的私有網路封鎖限制。
- `ssrfPolicy.allowPrivateNetwork` 仍支援作為舊版別名。
- 在嚴格模式中，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 設定明確例外。
- 遠端設定檔僅可附加（停用啟動/停止/重設）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。當你希望 OpenClaw 探索 `/json/version` 時使用 HTTP(S)；當你的提供者給你直接的 DevTools WebSocket URL 時使用 WS(S)。
- `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 適用於遠端與 `attachOnly` CDP 可連線性，以及開啟分頁請求。受管理的 loopback 設定檔會保留本機 CDP 預設值。
- 如果外部管理的 CDP 服務可透過 loopback 連線，請將該設定檔的 `attachOnly: true`；否則 OpenClaw 會將 loopback 連接埠視為本機受管理的瀏覽器設定檔，並可能回報本機連接埠所有權錯誤。
- `existing-session` 設定檔使用 Chrome MCP 而非 CDP，並可在所選主機上或透過已連線的瀏覽器節點附加。
- `existing-session` 設定檔可設定 `userDataDir`，以指定特定的 Chromium 系瀏覽器設定檔，例如 Brave 或 Edge。
- `existing-session` 設定檔保留目前的 Chrome MCP 路由限制：使用快照/ref 驅動的動作而非 CSS 選擇器目標指定、單檔上傳掛鉤、沒有對話框逾時覆寫、沒有 `wait --load networkidle`，也沒有 `responsebody`、PDF 匯出、下載攔截或批次動作。
- 本機受管理的 `openclaw` 設定檔會自動指派 `cdpPort` 和 `cdpUrl`；只有遠端 CDP 才需明確設定 `cdpUrl`。
- 本機受管理的設定檔可設定 `executablePath`，以覆寫該設定檔的全域 `browser.executablePath`。使用此設定可讓一個設定檔在 Chrome 中執行，另一個在 Brave 中執行。
- 本機受管理的設定檔會使用 `browser.localLaunchTimeoutMs`，在程序啟動後進行 Chrome CDP HTTP 探索，並使用 `browser.localCdpReadyTimeoutMs` 等待啟動後的 CDP websocket 就緒。在較慢的主機上，如果 Chrome 能成功啟動但就緒檢查與啟動流程產生競爭，可提高這些值。兩個值都必須是最高 `120000` ms 的正整數；無效的設定值會被拒絕。
- 自動偵測順序：預設瀏覽器（若為 Chromium 系）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 在 Chromium 啟動前，都接受 `~` 和 `~/...` 代表你的 OS 家目錄。`existing-session` 設定檔上的每設定檔 `userDataDir` 也會展開波浪號。
- 控制服務：僅限 loopback（連接埠衍生自 `gateway.port`，預設為 `18791`）。
- `extraArgs` 會將額外啟動旗標附加到本機 Chromium 啟動流程（例如 `--disable-gpu`、視窗大小，或除錯旗標）。

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
- `assistant`：Control UI 身分覆寫。會回退到作用中代理身分。

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

<Accordion title="Gateway 欄位詳細資訊">

- `mode`：`local`（執行 Gateway）或 `remote`（連線到遠端 Gateway）。除非為 `local`，否則 Gateway 會拒絕啟動。
- `port`：WS + HTTP 的單一多工連接埠。優先順序：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（預設）、`lan`（`0.0.0.0`）、`tailnet`（僅 Tailscale IP），或 `custom`。
- **舊版 bind 別名**：在 `gateway.bind` 中使用 bind 模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），而不是主機別名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事項**：預設的 `loopback` bind 會在容器內監聽 `127.0.0.1`。使用 Docker bridge networking（`-p 18789:18789`）時，流量會從 `eth0` 進入，因此 Gateway 無法連線。請使用 `--network host`，或設定 `bind: "lan"`（或使用 `bind: "custom"` 搭配 `customBindHost: "0.0.0.0"`）以監聽所有介面。
- **驗證**：預設為必要。非 loopback bind 需要 Gateway 驗證。實務上，這表示需要共用 token/password，或搭配 `gateway.auth.mode: "trusted-proxy"` 的具身分感知反向 Proxy。Onboarding 精靈預設會產生一個 token。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`（包含 SecretRefs），請明確將 `gateway.auth.mode` 設為 `token` 或 `password`。兩者都已設定但未設定模式時，啟動與服務安裝/修復流程會失敗。
- `gateway.auth.mode: "none"`：明確的無驗證模式。僅用於受信任的 local loopback 設定；這是刻意不由 onboarding 提示提供的選項。
- `gateway.auth.mode: "trusted-proxy"`：將瀏覽器/使用者驗證委派給具身分感知的反向 Proxy，並信任來自 `gateway.trustedProxies` 的身分標頭（請參閱 [受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)）。此模式預設期待 **非 loopback** 的 Proxy 來源；同主機 loopback 反向 Proxy 需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。內部同主機呼叫端可以使用 `gateway.auth.password` 作為本機直接備援；`gateway.auth.token` 仍然與 trusted-proxy 模式互斥。
- `gateway.auth.allowTailscale`：當為 `true` 時，Tailscale Serve 身分標頭可滿足控制 UI/WebSocket 驗證（透過 `tailscale whois` 驗證）。HTTP API 端點**不會**使用該 Tailscale 標頭驗證；它們會改用 Gateway 的一般 HTTP 驗證模式。此無 token 流程假設 Gateway 主機是受信任的。當 `tailscale.mode = "serve"` 時預設為 `true`。
- `gateway.auth.rateLimit`：選用的驗證失敗限制器。依用戶端 IP 與驗證範圍套用（shared-secret 與 device-token 會分開追蹤）。被封鎖的嘗試會傳回 `429` + `Retry-After`。
  - 在非同步 Tailscale Serve 控制 UI 路徑上，相同 `{scope, clientIp}` 的失敗嘗試會在寫入失敗前序列化。因此，同一用戶端的並行錯誤嘗試可能在第二個請求時觸發限制器，而不是兩者都以一般不匹配競速通過。
  - `gateway.auth.rateLimit.exemptLoopback` 預設為 `true`；當你刻意希望 localhost 流量也受到速率限制時（例如測試設定或嚴格 Proxy 部署），請設為 `false`。
- 瀏覽器來源的 WS 驗證嘗試一律會被節流，且停用 loopback 豁免（針對瀏覽器型 localhost 暴力破解的縱深防禦）。
- 在 loopback 上，這些瀏覽器來源鎖定會依正規化的 `Origin`
  值隔離，因此來自某個 localhost origin 的重複失敗不會自動
  鎖定不同的 origin。
- `tailscale.mode`：`serve`（僅 tailnet、loopback bind）或 `funnel`（公開，需要驗證）。
- `controlUi.allowedOrigins`：Gateway WebSocket 連線的明確瀏覽器來源允許清單。當預期瀏覽器用戶端來自非 loopback 來源時為必要。
- `controlUi.chatMessageMaxWidth`：分組控制 UI 聊天訊息的選用最大寬度。接受受限 CSS 寬度值，例如 `960px`、`82%`、`min(1280px, 82%)` 和 `calc(100% - 2rem)`。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危險模式，會為刻意依賴 Host-header origin policy 的部署啟用 Host-header origin 備援。
- `remote.transport`：`ssh`（預設）或 `direct`（ws/wss）。若為 `direct`，`remote.url` 必須是 `ws://` 或 `wss://`。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`：用戶端程序環境中的
  破窗覆寫，允許明文 `ws://` 連到受信任的私人網路
  IP；明文預設仍然僅限 loopback。沒有對應的 `openclaw.json`
  設定，而且像
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 這類瀏覽器私人網路設定不會影響 Gateway
  WebSocket 用戶端。
- `gateway.remote.token` / `.password` 是遠端用戶端憑證欄位。它們本身不會設定 Gateway 驗證。
- `gateway.push.apns.relay.baseUrl`：外部 APNs relay 的 HTTPS 基礎 URL，供官方/TestFlight iOS build 在將 relay 支援的註冊發布到 Gateway 後使用。此 URL 必須符合編譯進 iOS build 的 relay URL。
- `gateway.push.apns.relay.timeoutMs`：Gateway 到 relay 的傳送逾時，單位為毫秒。預設為 `10000`。
- relay 支援的註冊會委派給特定 Gateway 身分。配對的 iOS app 會取得 `gateway.identity.get`，在 relay 註冊中包含該身分，並將註冊範圍的傳送授權轉送給 Gateway。其他 Gateway 無法重複使用該已儲存註冊。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：上述 relay 設定的臨時 env 覆寫。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：僅限開發使用的逃生口，用於 loopback HTTP relay URL。正式環境 relay URL 應保持使用 HTTPS。
- `gateway.handshakeTimeoutMs`：驗證前 Gateway WebSocket handshake 逾時，單位為毫秒。預設：`15000`。設定 `OPENCLAW_HANDSHAKE_TIMEOUT_MS` 時會優先使用。對於負載較高或低功耗主機，如果本機用戶端可連線但啟動預熱仍在穩定中，請增加此值。
- `gateway.channelHealthCheckMinutes`：channel 健康監控間隔，單位為分鐘。設為 `0` 可全域停用健康監控重啟。預設：`5`。
- `gateway.channelStaleEventThresholdMinutes`：stale-socket 閾值，單位為分鐘。此值應大於或等於 `gateway.channelHealthCheckMinutes`。預設：`30`。
- `gateway.channelMaxRestartsPerHour`：每個 channel/account 在滾動一小時內的健康監控重啟上限。預設：`10`。
- `channels.<provider>.healthMonitor.enabled`：每個 channel 可選擇退出健康監控重啟，同時維持全域監控啟用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多帳號 channel 的每帳號覆寫。設定後會優先於 channel 層級覆寫。
- 只有在未設定 `gateway.auth.*` 時，本機 Gateway 呼叫路徑才可使用 `gateway.remote.*` 作為備援。
- 如果透過 SecretRef 明確設定 `gateway.auth.token` / `gateway.auth.password` 且無法解析，解析會失敗關閉（不會由遠端備援掩蓋）。
- `trustedProxies`：終止 TLS 或注入 forwarded-client 標頭的反向 Proxy IP。只列出你控制的 Proxy。Loopback 項目對同主機 Proxy/本機偵測設定仍然有效（例如 Tailscale Serve 或本機反向 Proxy），但它們**不會**讓 loopback 請求符合 `gateway.auth.mode: "trusted-proxy"` 的資格。
- `allowRealIpFallback`：當為 `true` 時，如果缺少 `X-Forwarded-For`，Gateway 會接受 `X-Real-IP`。預設為 `false`，採用失敗關閉行為。
- `gateway.nodes.pairing.autoApproveCidrs`：選用的 CIDR/IP 允許清單，用於自動核准首次 node device pairing，且不要求任何 scope。未設定時會停用。這不會自動核准 operator/browser/控制 UI/WebChat pairing，也不會自動核准 role、scope、metadata 或 public-key 升級。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`：在 pairing 與平台允許清單評估後，針對已宣告 node commands 的全域允許/拒絕塑形。使用 `allowCommands` 選擇啟用危險 node command，例如 `camera.snap`、`camera.clip` 和 `screen.record`；即使平台預設或明確允許原本會包含某個 command，`denyCommands` 也會將其移除。node 變更其已宣告 command 清單後，請拒絕並重新核准該 device pairing，讓 Gateway 儲存更新後的 command snapshot。
- `gateway.tools.deny`：針對 HTTP `POST /tools/invoke` 封鎖的額外工具名稱（延伸預設拒絕清單）。
- `gateway.tools.allow`：從預設 HTTP 拒絕清單中移除工具名稱。

</Accordion>

### OpenAI 相容端點

- Chat Completions：預設停用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 啟用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL-input 強化：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空的 allowlist 會被視為未設定；使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和/或 `gateway.http.endpoints.responses.images.allowUrl=false` 來停用 URL 擷取。
- 選用的 response 強化標頭：
  - `gateway.http.securityHeaders.strictTransportSecurity`（僅為你控制的 HTTPS origin 設定；請參閱 [受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多執行個體隔離

在同一主機上使用唯一的連接埠和狀態目錄執行多個 Gateway：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利旗標：`--dev`（使用 `~/.openclaw-dev` + 連接埠 `19001`）、`--profile <name>`（使用 `~/.openclaw-<name>`）。

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
- `autoGenerate`：未設定明確檔案時，自動產生本機自簽 cert/key pair；僅供本機/開發使用。
- `certPath`：TLS 憑證檔案的檔案系統路徑。
- `keyPath`：TLS 私密金鑰檔案的檔案系統路徑；請維持權限限制。
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
  - `"restart"`：設定變更時一律重啟 Gateway 程序。
  - `"hot"`：在程序內套用變更而不重啟。
  - `"hybrid"`（預設）：先嘗試 hot reload；需要時回退到重啟。
- `debounceMs`：套用設定變更前的 debounce 視窗，單位為 ms（非負整數）。
- `deferralTimeoutMs`：在強制重啟或 channel hot reload 前，等待進行中操作的選用最長時間，單位為 ms。省略時使用預設有界等待（`300000`）；設為 `0` 可無限等待並定期記錄仍在等待的警告。

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
查詢字串中的 hook 權杖會被拒絕。

驗證與安全注意事項：

- `hooks.enabled=true` 需要非空的 `hooks.token`。
- `hooks.token` 必須與 `gateway.auth.token` **不同**；重複使用 Gateway 權杖會被拒絕。
- `hooks.path` 不能是 `/`；請使用專用子路徑，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，請限制 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果某個對應或預設集使用範本化的 `sessionKey`，請設定 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。靜態對應鍵不需要這個選擇加入設定。

**端點：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 只有在 `hooks.allowRequestSessionKey=true`（預設：`false`）時，才接受請求承載中的 `sessionKey`。
- `POST /hooks/<name>` → 透過 `hooks.mappings` 解析
  - 由範本算繪出的對應 `sessionKey` 值會視為外部提供，因此也需要 `hooks.allowRequestSessionKey=true`。

<Accordion title="Mapping details">

- `match.path` 會比對 `/hooks` 之後的子路徑（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 會比對通用路徑的承載欄位。
- 像 `{{messages[0].subject}}` 這樣的範本會從承載讀取。
- `transform` 可以指向傳回 hook 動作的 JS/TS 模組。
  - `transform.module` 必須是相對路徑，且保留在 `hooks.transformsDir` 內（絕對路徑與路徑穿越會被拒絕）。
  - 請將 `hooks.transformsDir` 保持在 `~/.openclaw/hooks/transforms` 底下；工作區 Skills 目錄會被拒絕。如果 `openclaw doctor` 回報此路徑無效，請將轉換模組移到 hooks 轉換目錄中，或移除 `hooks.transformsDir`。
- `agentId` 會路由到特定代理；未知 ID 會退回預設值。
- `allowedAgentIds`：限制明確路由（`*` 或省略 = 允許全部，`[]` = 拒絕全部）。
- `defaultSessionKey`：hook 代理執行時若沒有明確的 `sessionKey`，可使用選用的固定工作階段鍵。
- `allowRequestSessionKey`：允許 `/hooks/agent` 呼叫者，以及由範本驅動的對應工作階段鍵設定 `sessionKey`（預設：`false`）。
- `allowedSessionKeyPrefixes`：明確 `sessionKey` 值（請求 + 對應）的選用前綴允許清單，例如 `["hook:"]`。任何對應或預設集使用範本化的 `sessionKey` 時，此項就會變成必要。
- `deliver: true` 會將最終回覆傳送到頻道；`channel` 預設為 `last`。
- `model` 會覆寫此 hook 執行使用的 LLM（如果已設定模型目錄，該模型必須被允許）。

</Accordion>

### Gmail 整合

- 內建 Gmail 預設集使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果你保留這種逐訊息路由，請設定 `hooks.allowRequestSessionKey: true`，並限制 `hooks.allowedSessionKeyPrefixes` 以符合 Gmail 命名空間，例如 `["hook:", "hook:gmail:"]`。
- 如果你需要 `hooks.allowRequestSessionKey: false`，請用靜態 `sessionKey` 覆寫預設集，而不是使用範本化預設值。

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

- Gateway 會在設定完成後於啟動時自動啟動 `gog gmail watch serve`。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可停用。
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

- 透過 Gateway 連接埠，在 HTTP 下提供代理可編輯的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 僅限本機：保留 `gateway.bind: "loopback"`（預設）。
- 非 loopback 繫結：canvas 路由需要 Gateway 驗證（權杖/密碼/受信任 Proxy），與其他 Gateway HTTP 介面相同。
- Node WebView 通常不會傳送驗證標頭；Node 配對並連線後，Gateway 會公布 Node 範圍的能力 URL，用於 canvas/A2UI 存取。
- 能力 URL 綁定到作用中的 Node WS 工作階段，且會很快到期。不使用基於 IP 的備援。
- 將即時重新載入用戶端注入所提供的 HTML。
- 空白時自動建立起始 `index.html`。
- 也會在 `/__openclaw__/a2ui/` 提供 A2UI。
- 變更需要重新啟動 Gateway。
- 針對大型目錄或 `EMFILE` 錯誤，請停用即時重新載入。

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

- `minimal`（啟用內建 `bonjour` Plugin 時的預設值）：從 TXT 記錄省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`；區域網路多播公告仍需要啟用內建 `bonjour` Plugin。
- `off`：在不變更 Plugin 啟用狀態的情況下，抑制區域網路多播公告。
- 內建 `bonjour` Plugin 會在 macOS 主機上自動啟動；在 Linux、Windows 和容器化 Gateway 部署上則需選擇加入。
- 主機名稱在是有效 DNS 標籤時預設為系統主機名稱，否則退回 `openclaw`。可使用 `OPENCLAW_MDNS_HOSTNAME` 覆寫。

### 廣域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

在 `~/.openclaw/dns/` 下寫入單播 DNS-SD 區域。若要跨網路探索，請搭配 DNS 伺服器（建議 CoreDNS）+ Tailscale 分割 DNS。

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

- 行內環境變數只會在處理程序環境缺少該鍵時套用。
- `.env` 檔案：CWD `.env` + `~/.openclaw/.env`（兩者都不會覆寫既有變數）。
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
- 缺少或空白的變數會在設定載入時擲出錯誤。
- 使用 `$${VAR}` 跳脫為字面值 `${VAR}`。
- 可與 `$include` 搭配使用。

---

## 機密

機密參照是附加性的：純文字值仍可使用。

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
- `source: "exec"` id 不得包含 `.` 或 `..` 這類以斜線分隔的路徑片段（例如 `a/../b` 會被拒絕）

### 支援的憑證介面

- 標準矩陣：[SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)
- `secrets apply` 以支援的 `openclaw.json` 憑證路徑為目標。
- `auth-profiles.json` 參照包含在執行階段解析與稽核涵蓋範圍中。

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

- `file` 提供者支援 `mode: "json"` 與 `mode: "singleValue"`（在 singleValue 模式中，`id` 必須是 `"value"`）。
- 當 Windows ACL 驗證無法使用時，檔案與 exec 提供者路徑會以關閉方式失敗。僅針對受信任且無法驗證的路徑設定 `allowInsecurePath: true`。
- `exec` 提供者需要絕對 `command` 路徑，並在 stdin/stdout 上使用協定承載資料。
- 預設會拒絕符號連結命令路徑。設定 `allowSymlinkCommand: true` 可允許符號連結路徑，同時驗證解析後的目標路徑。
- 如果已設定 `trustedDirs`，受信任目錄檢查會套用至解析後的目標路徑。
- `exec` 子程序環境預設為最小化；請使用 `passEnv` 明確傳遞必要變數。
- 機密參照會在啟用時解析成記憶體內快照，之後請求路徑只會讀取該快照。
- 啟用期間會套用作用中介面篩選：已啟用介面上的未解析參照會導致啟動/重新載入失敗，而非作用中介面會被略過並附帶診斷資訊。

---

## 驗證儲存空間

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

- 每個 agent 的設定檔儲存在 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 支援靜態憑證模式的值層級參照（`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- 舊版扁平 `auth-profiles.json` 對應（例如 `{ "provider": { "apiKey": "..." } }`）不是執行階段格式；`openclaw doctor --fix` 會將它們重寫為標準 `provider:default` API-key 設定檔，並建立 `.legacy-flat.*.bak` 備份。
- OAuth 模式設定檔（`auth.profiles.<id>.mode = "oauth"`）不支援由 SecretRef 支援的 auth-profile 憑證。
- 靜態執行階段憑證來自記憶體內已解析快照；發現舊版靜態 `auth.json` 項目時會將其清除。
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

- `billingBackoffHours`：當設定檔因真正的帳務/信用額度不足錯誤而失敗時，以小時為單位的基礎退避（預設值：`5`）。即使在 `401`/`403` 回應中，明確的帳務文字仍可能落在這裡，但提供者專屬的文字比對器會維持限縮在擁有它們的提供者範圍內（例如 OpenRouter 的 `Key limit exceeded`）。可重試的 HTTP `402` 用量時段或組織/工作區支出上限訊息則會留在 `rate_limit` 路徑。
- `billingBackoffHoursByProvider`：選用的每個提供者帳務退避小時數覆寫。
- `billingMaxHours`：帳務退避指數成長的小時數上限（預設值：`24`）。
- `authPermanentBackoffMinutes`：高信心 `auth_permanent` 失敗的基礎退避分鐘數（預設值：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避成長的分鐘數上限（預設值：`60`）。
- `failureWindowHours`：用於退避計數器的滾動視窗小時數（預設值：`24`）。
- `overloadedProfileRotations`：在切換到模型後援之前，過載錯誤可進行的同一提供者驗證設定檔輪替次數上限（預設值：`1`）。像 `ModelNotReadyException` 這類提供者繁忙形態會落在這裡。
- `overloadedBackoffMs`：重試過載的提供者/設定檔輪替前的固定延遲（預設值：`0`）。
- `rateLimitedProfileRotations`：在切換到模型後援之前，速率限制錯誤可進行的同一提供者驗證設定檔輪替次數上限（預設值：`1`）。該速率限制桶包含提供者形態文字，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 和 `resource exhausted`。

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
- 設定 `logging.file` 以使用穩定路徑。
- 使用 `--verbose` 時，`consoleLevel` 會提升為 `debug`。
- `maxFileBytes`：輪替前作用中記錄檔的大小上限，以位元組為單位（正整數；預設值：`104857600` = 100 MB）。OpenClaw 會在作用中文件旁保留最多五個編號封存檔。
- `redactSensitive` / `redactPatterns`：對主控台輸出、檔案記錄、OTLP 記錄紀錄，以及持久化工作階段逐字稿文字進行盡力遮罩。`redactSensitive: "off"` 只會停用這項一般記錄/逐字稿政策；UI/工具/診斷安全介面仍會在發出前遮蔽秘密。

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

- `enabled`：檢測輸出的主控開關（預設值：`true`）。
- `flags`：啟用目標記錄輸出的旗標字串陣列（支援像 `"telegram.*"` 或 `"*"` 這類萬用字元）。
- `stuckSessionWarnMs`：用於將長時間執行中的處理工作階段分類為 `session.long_running`、`session.stalled` 或 `session.stuck` 的無進度時間門檻，以毫秒為單位。回覆、工具、狀態、區塊和 ACP 進度會重設計時器；重複的 `session.stuck` 診斷會在未變更時退避。
- `stuckSessionAbortMs`：符合條件的停滯中作用中工作可被中止並排空以復原前的無進度時間門檻，以毫秒為單位。未設定時，OpenClaw 會使用較安全的延長嵌入式執行視窗，至少 10 分鐘且為 `stuckSessionWarnMs` 的 5 倍。
- `otel.enabled`：啟用 OpenTelemetry 匯出管線（預設值：`false`）。完整設定、訊號目錄和隱私模型請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。
- `otel.endpoint`：OTel 匯出的收集器 URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`：選用的訊號專屬 OTLP 端點。設定後，它們只會針對該訊號覆寫 `otel.endpoint`。
- `otel.protocol`：`"http/protobuf"`（預設）或 `"grpc"`。
- `otel.headers`：隨 OTel 匯出請求傳送的額外 HTTP/gRPC 中繼資料標頭。
- `otel.serviceName`：資源屬性的服務名稱。
- `otel.traces` / `otel.metrics` / `otel.logs`：啟用追蹤、指標或記錄匯出。
- `otel.sampleRate`：追蹤取樣率 `0`-`1`。
- `otel.flushIntervalMs`：定期遙測清除間隔，以毫秒為單位。
- `otel.captureContent`：選擇啟用的 OTEL span 屬性原始內容擷取。預設為關閉。布林值 `true` 會擷取非系統訊息/工具內容；物件形式可讓你明確啟用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs` 和 `systemPrompt`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`：用於最新實驗性 GenAI span 提供者屬性的環境開關。依預設，span 會保留舊版 `gen_ai.system` 屬性以維持相容性；GenAI 指標使用有界的語意屬性。
- `OPENCLAW_OTEL_PRELOADED=1`：用於已註冊全域 OpenTelemetry SDK 的主機環境開關。OpenClaw 接著會略過 Plugin 擁有的 SDK 啟動/關閉，同時保持診斷監聽器作用中。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 和 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`：當對應設定鍵未設定時使用的訊號專屬端點環境變數。
- `cacheTrace.enabled`：記錄嵌入式執行的快取追蹤快照（預設值：`false`）。
- `cacheTrace.filePath`：快取追蹤 JSONL 的輸出路徑（預設值：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制快取追蹤輸出中包含的內容（全部預設值：`true`）。

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

- `channel`：npm/git 安裝的發布通道 - `"stable"`、`"beta"` 或 `"dev"`。
- `checkOnStart`：Gateway 啟動時檢查 npm 更新（預設值：`true`）。
- `auto.enabled`：啟用套件安裝的背景自動更新（預設值：`false`）。
- `auto.stableDelayHours`：穩定通道自動套用前的最短延遲小時數（預設值：`6`；上限：`168`）。
- `auto.stableJitterHours`：額外的穩定通道推出分散視窗，以小時為單位（預設值：`12`；上限：`168`）。
- `auto.betaCheckIntervalHours`：Beta 通道檢查執行頻率，以小時為單位（預設值：`1`；上限：`24`）。

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

- `enabled`：全域 ACP 功能閘門（預設值：`true`；設為 `false` 可隱藏 ACP 派送與衍生功能）。
- `dispatch.enabled`：ACP 工作階段回合派送的獨立閘門（預設值：`true`）。設為 `false` 可保留 ACP 命令可用，同時阻擋執行。
- `backend`：預設 ACP 執行階段後端 id（必須符合已註冊的 ACP 執行階段 Plugin）。
  請先安裝後端 Plugin，而且如果已設定 `plugins.allow`，請包含後端 Plugin id（例如 `acpx`），否則 ACP 後端將不會載入。
- `defaultAgent`：當衍生未指定明確目標時使用的後援 ACP 目標代理 id。
- `allowedAgents`：允許用於 ACP 執行階段工作階段的代理 id 允許清單；空白表示沒有額外限制。
- `maxConcurrentSessions`：同時作用中的 ACP 工作階段上限。
- `stream.coalesceIdleMs`：串流文字的閒置清除視窗，以毫秒為單位。
- `stream.maxChunkChars`：分割串流區塊投影前的最大區塊大小。
- `stream.repeatSuppression`：抑制每個回合中重複的狀態/工具行（預設值：`true`）。
- `stream.deliveryMode`：`"live"` 會逐步串流；`"final_only"` 會緩衝到回合終端事件。
- `stream.hiddenBoundarySeparator`：隱藏工具事件後、可見文字前的分隔符號（預設值：`"paragraph"`）。
- `stream.maxOutputChars`：每個 ACP 回合投影的助理輸出字元上限。
- `stream.maxSessionUpdateChars`：投影 ACP 狀態/更新行的字元上限。
- `stream.tagVisibility`：標籤名稱到串流事件布林可見性覆寫的紀錄。
- `runtime.ttlMinutes`：ACP 工作階段工作器符合清理條件前的閒置 TTL，以分鐘為單位。
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
  - `"random"`（預設）：輪替的趣味/季節性標語。
  - `"default"`：固定的中性標語（`All your chats, one OpenClaw.`）。
  - `"off"`：沒有標語文字（仍會顯示橫幅標題/版本）。
- 若要隱藏整個橫幅（不只是標語），請設定環境變數 `OPENCLAW_HIDE_BANNER=1`。

---

## 精靈

CLI 引導式設定流程（`onboard`、`configure`、`doctor`）寫入的中繼資料：

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

## 身分識別

請參閱 [代理預設值](/zh-TW/gateway/config-agents#agent-defaults) 下的 `agents.list` 身分識別欄位。

---

## 橋接（舊版，已移除）

目前建置已不再包含 TCP 橋接。Node 會透過 Gateway WebSocket 連線。`bridge.*` 鍵已不再是設定結構描述的一部分（驗證會失敗，直到移除為止；`openclaw doctor --fix` 可以移除未知鍵）。

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

- `sessionRetention`：在從 `sessions.json` 修剪之前，保留已完成隔離 cron 執行工作階段的時間長度。也控制已封存刪除 cron 轉錄的清理。預設值：`24h`；設定為 `false` 可停用。
- `runLog.maxBytes`：修剪前每個執行日誌檔案（`cron/runs/<jobId>.jsonl`）的大小上限。預設值：`2_000_000` 位元組。
- `runLog.keepLines`：觸發執行日誌修剪時保留的最新行數。預設值：`2000`。
- `webhookToken`：用於 cron Webhook POST 傳遞（`delivery.mode = "webhook"`）的 bearer token；若省略，則不傳送驗證標頭。
- `webhook`：已棄用的舊版備援 Webhook URL（http/https），僅用於仍有 `notify: true` 的已儲存工作。

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

- `maxAttempts`：一次性工作在暫時性錯誤上的重試次數上限（預設值：`3`；範圍：`0`-`10`）。
- `backoffMs`：每次重試嘗試的退避延遲陣列，單位為 ms（預設值：`[30000, 60000, 300000]`；1-10 個項目）。
- `retryOn`：會觸發重試的錯誤類型 - `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略時會重試所有暫時性類型。

僅套用於一次性 cron 工作。週期性工作使用獨立的失敗處理。

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

- `enabled`：啟用 cron 工作的失敗警示（預設值：`false`）。
- `after`：警示觸發前的連續失敗次數（正整數，最小值：`1`）。
- `cooldownMs`：同一工作重複警示之間的最小毫秒數（非負整數）。
- `includeSkipped`：將連續略過的執行計入警示門檻（預設值：`false`）。略過的執行會分開追蹤，且不會影響執行錯誤退避。
- `mode`：傳遞模式 - `"announce"` 會透過頻道訊息傳送；`"webhook"` 會發布到已設定的 Webhook。
- `accountId`：用於限定警示傳遞範圍的選用帳號或頻道 ID。

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

- 所有工作的 cron 失敗通知預設目的地。
- `mode`：`"announce"` 或 `"webhook"`；當存在足夠的目標資料時，預設為 `"announce"`。
- `channel`：announce 傳遞的頻道覆寫。`"last"` 會重用最後已知的傳遞頻道。
- `to`：明確的 announce 目標或 Webhook URL。Webhook 模式必要。
- `accountId`：選用的傳遞帳號覆寫。
- 每個工作的 `delivery.failureDestination` 會覆寫此全域預設值。
- 當未設定全域或每工作失敗目的地時，已透過 `announce` 傳遞的工作會在失敗時回退到其主要 announce 目標。
- `delivery.failureDestination` 僅支援 `sessionTarget="isolated"` 工作，除非該工作的主要 `delivery.mode` 是 `"webhook"`。

請參閱 [Cron 工作](/zh-TW/automation/cron-jobs)。隔離 cron 執行會作為[背景任務](/zh-TW/automation/tasks)追蹤。

---

## 媒體模型範本變數

在 `tools.media.models[].args` 中展開的範本預留位置：

| 變數               | 說明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完整的傳入訊息本文                                |
| `{{RawBody}}`      | 原始本文（無歷史記錄/傳送者包裝）                 |
| `{{BodyStripped}}` | 移除群組提及的本文                                |
| `{{From}}`         | 傳送者識別碼                                      |
| `{{To}}`           | 目的地識別碼                                      |
| `{{MessageSid}}`   | 頻道訊息 ID                                       |
| `{{SessionId}}`    | 目前工作階段 UUID                                 |
| `{{IsNewSession}}` | 建立新工作階段時為 `"true"`                       |
| `{{MediaUrl}}`     | 傳入媒體虛擬 URL                                  |
| `{{MediaPath}}`    | 本機媒體路徑                                      |
| `{{MediaType}}`    | 媒體類型（image/audio/document/…）                |
| `{{Transcript}}`   | 音訊轉錄                                          |
| `{{Prompt}}`       | CLI 項目解析後的媒體提示                          |
| `{{MaxChars}}`     | CLI 項目解析後的最大輸出字元數                    |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                           |
| `{{GroupSubject}}` | 群組主旨（盡力提供）                              |
| `{{GroupMembers}}` | 群組成員預覽（盡力提供）                          |
| `{{SenderName}}`   | 傳送者顯示名稱（盡力提供）                        |
| `{{SenderE164}}`   | 傳送者電話號碼（盡力提供）                        |
| `{{Provider}}`     | Provider 提示（whatsapp、telegram、discord 等）   |

---

## 設定包含（`$include`）

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
- 同層鍵：在包含之後合併（覆寫已包含的值）。
- 巢狀包含：最多 10 層深。
- 路徑：相對於執行包含的檔案解析，但必須留在頂層設定目錄（`openclaw.json` 的 `dirname`）內。只有在解析後仍位於該邊界內時，才允許絕對/`../` 形式。
- OpenClaw 擁有的寫入若只變更由單一檔案包含支援的一個頂層區段，會寫入該包含檔案。例如，`plugins install` 會在 `plugins.json5` 中更新 `plugins: { $include: "./plugins.json5" }`，並保持 `openclaw.json` 不變。
- 根包含、包含陣列，以及具有同層覆寫的包含，對 OpenClaw 擁有的寫入而言是唯讀；這些寫入會封閉失敗，而不是攤平設定。
- 錯誤：針對缺少檔案、剖析錯誤和循環包含提供清楚訊息。

---

_相關：[設定](/zh-TW/gateway/configuration) · [設定範例](/zh-TW/gateway/configuration-examples) · [Doctor](/zh-TW/gateway/doctor)_

## 相關

- [設定](/zh-TW/gateway/configuration)
- [設定範例](/zh-TW/gateway/configuration-examples)
