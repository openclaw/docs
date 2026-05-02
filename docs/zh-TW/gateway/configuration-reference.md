---
read_when:
    - 你需要精確的欄位層級設定語意或預設值
    - 你正在驗證頻道、模型、Gateway 或工具設定區塊
summary: Gateway 設定參考，涵蓋核心 OpenClaw 鍵、預設值，以及專屬子系統參考的連結
title: 設定參考
x-i18n:
    generated_at: "2026-05-02T20:47:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 559a52c9ea7428aa0a33b9699eaf144aa114638acf57f813217642319ce77987
    source_path: gateway/configuration-reference.md
    workflow: 16
---

核心設定參考，適用於 `~/.openclaw/openclaw.json`。如需以任務為導向的概覽，請參閱[設定](/zh-TW/gateway/configuration)。

涵蓋主要的 OpenClaw 設定介面；當子系統有自己的更深入參考時，會連結到對應頁面。通道和 Plugin 擁有的命令目錄，以及深入記憶體/QMD 調整選項，位於各自的頁面，而不是此頁。

程式碼真相：

- `openclaw config schema` 會列印用於驗證和 Control UI 的即時 JSON Schema，並在可用時合併隨附/Plugin/通道中繼資料
- `config.schema.lookup` 會回傳一個路徑範圍的 schema 節點，供深入檢視工具使用
- `pnpm config:docs:check` / `pnpm config:docs:gen` 會依照目前的 schema 介面驗證設定文件基準雜湊

Agent 查找路徑：編輯前，使用 `gateway` 工具動作 `config.schema.lookup` 取得精確的欄位層級文件和限制。使用[設定](/zh-TW/gateway/configuration)取得以任務為導向的指引，並使用此頁取得更廣泛的欄位地圖、預設值，以及子系統參考連結。

專用深入參考：

- [記憶體設定參考](/zh-TW/reference/memory-config)，涵蓋 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及 `plugins.entries.memory-core.config.dreaming` 底下的 dreaming 設定
- [斜線命令](/zh-TW/tools/slash-commands)，涵蓋目前內建 + 隨附的命令目錄
- 擁有通道專屬命令介面的對應通道/Plugin 頁面

設定格式是 **JSON5**（允許註解 + 尾端逗號）。所有欄位都是選用的 — 省略時 OpenClaw 會使用安全的預設值。

---

## 通道

各通道的設定鍵已移至專用頁面 — 請參閱[設定 — 通道](/zh-TW/gateway/config-channels)，了解 `channels.*`，包括 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage，以及其他隨附通道（驗證、存取控制、多帳號、提及閘控）。

## Agent 預設值、多 Agent、工作階段和訊息

已移至專用頁面 — 請參閱[設定 — Agent](/zh-TW/gateway/config-agents)，了解：

- `agents.defaults.*`（工作區、模型、思考、Heartbeat、記憶體、媒體、Skills、沙盒）
- `multiAgent.*`（多 Agent 路由和繫結）
- `session.*`（工作階段生命週期、Compaction、修剪）
- `messages.*`（訊息傳遞、TTS、markdown 算繪）
- `talk.*`（Talk 模式）
  - `talk.speechLocale`：iOS/macOS 上 Talk 語音辨識的選用 BCP 47 語系 ID
  - `talk.silenceTimeoutMs`：未設定時，Talk 會在傳送逐字稿前保留平台預設的暫停時間範圍（`macOS 和 Android 為 700 ms，iOS 為 900 ms`）

## 工具和自訂提供者

工具政策、實驗性切換、提供者支援的工具設定，以及自訂提供者 / 基礎 URL 設定已移至專用頁面 — 請參閱[設定 — 工具和自訂提供者](/zh-TW/gateway/config-tools)。

## 模型

提供者定義、模型允許清單，以及自訂提供者設定位於[設定 — 工具和自訂提供者](/zh-TW/gateway/config-tools#custom-providers-and-base-urls)。`models` 根層也負責全域模型目錄行為。

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`：提供者目錄行為（`merge` 或 `replace`）。
- `models.providers`：以提供者 ID 為鍵的自訂提供者映射。
- `models.pricing.enabled`：控制背景定價啟動流程，該流程會在 sidecar 和通道到達 Gateway 就緒路徑後開始。當為 `false` 時，Gateway 會略過 OpenRouter 和 LiteLLM 定價目錄擷取；已設定的 `models.providers.*.models[].cost` 值仍可用於本機成本估算。

## MCP

OpenClaw 管理的 MCP 伺服器定義位於 `mcp.servers` 底下，並由嵌入式 Pi 和其他執行階段配接器使用。`openclaw mcp list`、`show`、`set` 和 `unset` 命令會管理此區塊，而不會在設定編輯期間連線到目標伺服器。

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

- `mcp.servers`：具名 stdio 或遠端 MCP 伺服器定義，供公開已設定 MCP 工具的執行階段使用。遠端項目使用 `transport: "streamable-http"` 或 `transport: "sse"`；`type: "http"` 是 CLI 原生別名，`openclaw mcp set` 和 `openclaw doctor --fix` 會將其正規化為標準 `transport` 欄位。
- `mcp.sessionIdleTtlMs`：工作階段範圍隨附 MCP 執行階段的閒置 TTL。一次性嵌入式執行會要求在執行結束時清理；此 TTL 是長時間存活工作階段和未來呼叫者的備援機制。
- `mcp.*` 底下的變更會透過處置快取的工作階段 MCP 執行階段來熱套用。下一次工具探索/使用會依照新設定重新建立它們，因此已移除的 `mcp.servers` 項目會立即被收割，而不是等待閒置 TTL。

請參閱 [MCP](/zh-TW/cli/mcp#openclaw-as-an-mcp-client-registry) 和 [CLI 後端](/zh-TW/gateway/cli-backends#bundle-mcp-overlays)，了解執行階段行為。

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

- `allowBundled`：僅適用於隨附 Skills 的選用允許清單（不影響受管理/工作區 Skills）。
- `load.extraDirs`：額外的共用 Skill 根目錄（最低優先序）。
- `install.preferBrew`：為 true 時，若 `brew` 可用，會優先使用 Homebrew 安裝器，再回退至其他安裝器種類。
- `install.nodeManager`：`metadata.openclaw.install` 規格的 node 安裝器偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false` 會停用某個 Skill，即使它是隨附/已安裝的。
- `entries.<skillKey>.apiKey`：供宣告主要環境變數的 Skills 使用的便利設定（純文字字串或 SecretRef 物件）。

---

## Plugin

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
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
- 探索接受原生 OpenClaw Plugin，以及相容的 Codex 套件和 Claude 套件，包括沒有 manifest 的 Claude 預設配置套件。
- **設定變更需要重新啟動 gateway。**
- `allow`：選用允許清單（只載入列出的 Plugin）。`deny` 優先。
- `plugins.entries.<id>.apiKey`：Plugin 層級的 API 金鑰便利欄位（當 Plugin 支援時）。
- `plugins.entries.<id>.env`：Plugin 範圍的環境變數映射。
- `plugins.entries.<id>.hooks.allowPromptInjection`：當為 `false` 時，核心會封鎖 `before_prompt_build`，並忽略舊版 `before_agent_start` 中會改變提示的欄位，同時保留舊版 `modelOverride` 和 `providerOverride`。適用於原生 Plugin hooks 和受支援套件提供的 hook 目錄。
- `plugins.entries.<id>.hooks.allowConversationAccess`：當為 `true` 時，受信任的非隨附 Plugin 可從型別化 hook 讀取原始對話內容，例如 `llm_input`、`llm_output`、`before_agent_finalize` 和 `agent_end`。
- `plugins.entries.<id>.subagent.allowModelOverride`：明確信任此 Plugin 可為背景 subagent 執行要求每次執行的 `provider` 和 `model` 覆寫。
- `plugins.entries.<id>.subagent.allowedModels`：受信任 subagent 覆寫的標準 `provider/model` 目標選用允許清單。只有在你刻意想允許任何模型時才使用 `"*"`。
- `plugins.entries.<id>.config`：Plugin 定義的設定物件（可用時由原生 OpenClaw Plugin schema 驗證）。
- 通道 Plugin 帳號/執行階段設定位於 `channels.<id>` 底下，並應由擁有者 Plugin 的 manifest `channelConfigs` 中繼資料描述，而不是由中央 OpenClaw 選項登錄描述。
- `plugins.entries.firecrawl.config.webFetch`：Firecrawl 網頁擷取提供者設定。
  - `apiKey`：Firecrawl API 金鑰（接受 SecretRef）。會回退至 `plugins.entries.firecrawl.config.webSearch.apiKey`、舊版 `tools.web.fetch.firecrawl.apiKey`，或 `FIRECRAWL_API_KEY` 環境變數。
  - `baseUrl`：Firecrawl API 基礎 URL（預設：`https://api.firecrawl.dev`；自架覆寫必須指向私有/內部端點）。
  - `onlyMainContent`：只從頁面擷取主要內容（預設：`true`）。
  - `maxAgeMs`：最大快取時間，以毫秒為單位（預設：`172800000` / 2 天）。
  - `timeoutSeconds`：擷取請求逾時秒數（預設：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok 網頁搜尋）設定。
  - `enabled`：啟用 X Search 提供者。
  - `model`：用於搜尋的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：記憶體 dreaming 設定。請參閱 [Dreaming](/zh-TW/concepts/dreaming)，了解階段和閾值。
  - `enabled`：dreaming 主開關（預設 `false`）。
  - `frequency`：每次完整 dreaming 掃描的 cron 節奏（預設為 `"0 3 * * *"`）。
  - `model`：選用的 Dream Diary subagent 模型覆寫。需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`；搭配 `allowedModels` 使用以限制目標。模型不可用錯誤會使用工作階段預設模型重試一次；信任或允許清單失敗不會靜默回退。
  - 階段政策和閾值是實作細節（不是面向使用者的設定鍵）。
- 完整記憶體設定位於[記憶體設定參考](/zh-TW/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已啟用的 Claude 套件 Plugin 也可以從 `settings.json` 提供嵌入式 Pi 預設值；OpenClaw 會將其套用為經過清理的 Agent 設定，而不是原始 OpenClaw 設定修補。
- `plugins.slots.memory`：選擇作用中的記憶體 Plugin ID，或使用 `"none"` 停用記憶體 Plugin。
- `plugins.slots.contextEngine`：選擇作用中的 context engine Plugin ID；除非你安裝並選擇其他引擎，否則預設為 `"legacy"`。

請參閱 [Plugin](/zh-TW/tools/plugin)。

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
- `tabCleanup` 會在閒置時間後，或工作階段超過上限時，回收已追蹤的主要代理程式分頁。設定 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 可停用這些個別清理模式。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` 未設定時會停用，因此瀏覽器導覽預設會保持嚴格。
- 只有在你刻意信任私有網路瀏覽器導覽時，才設定 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在嚴格模式中，遠端 CDP 設定檔端點（`profiles.*.cdpUrl`）在可達性／探索檢查期間也會受到相同的私有網路封鎖限制。
- `ssrfPolicy.allowPrivateNetwork` 仍支援作為舊版別名。
- 在嚴格模式中，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 設定明確例外。
- 遠端設定檔僅能附加（停用啟動／停止／重設）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。當你想讓 OpenClaw 探索 `/json/version` 時使用 HTTP(S)；當你的提供者提供直接的 DevTools WebSocket URL 時使用 WS(S)。
- `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 會套用於遠端與 `attachOnly` CDP 可達性，以及開啟分頁的請求。受管理的 loopback 設定檔會保留本機 CDP 預設值。
- 如果外部管理的 CDP 服務可透過 loopback 存取，請為該設定檔設定 `attachOnly: true`；否則 OpenClaw 會將該 loopback 連接埠視為本機受管理的瀏覽器設定檔，並可能回報本機連接埠擁有權錯誤。
- `existing-session` 設定檔使用 Chrome MCP 而非 CDP，並可在選定主機或透過已連線的瀏覽器節點附加。
- `existing-session` 設定檔可設定 `userDataDir`，以指定特定 Chromium 系瀏覽器設定檔，例如 Brave 或 Edge。
- `existing-session` 設定檔保留目前的 Chrome MCP 路由限制：使用 snapshot/ref 驅動的動作而非 CSS-selector 目標定位、單一檔案上傳鉤子、沒有對話框逾時覆寫、沒有 `wait --load networkidle`，也沒有 `responsebody`、PDF 匯出、下載攔截或批次動作。
- 本機受管理的 `openclaw` 設定檔會自動指派 `cdpPort` 和 `cdpUrl`；只有遠端 CDP 才需要明確設定 `cdpUrl`。
- 本機受管理的設定檔可設定 `executablePath`，以覆寫該設定檔的全域 `browser.executablePath`。可用此方式讓一個設定檔在 Chrome 中執行，另一個在 Brave 中執行。
- 本機受管理的設定檔在程序啟動後會使用 `browser.localLaunchTimeoutMs` 進行 Chrome CDP HTTP 探索，並使用 `browser.localCdpReadyTimeoutMs` 等待啟動後的 CDP websocket 就緒。在 Chrome 能成功啟動但就緒檢查與啟動競速的較慢主機上，請提高這些值。兩個值都必須是最高 `120000` ms 的正整數；無效的設定值會被拒絕。
- 自動偵測順序：預設瀏覽器（若為 Chromium 系）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 都接受 `~` 和 `~/...`，會在 Chromium 啟動前展開為你的作業系統家目錄。`existing-session` 設定檔上的每設定檔 `userDataDir` 也會展開波浪號。
- 控制服務：僅限 loopback（連接埠衍生自 `gateway.port`，預設 `18791`）。
- `extraArgs` 會將額外啟動旗標附加到本機 Chromium 啟動（例如 `--disable-gpu`、視窗大小或除錯旗標）。

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

- `seamColor`：原生應用程式 UI chrome 的強調色（Talk Mode 泡泡色調等）。
- `assistant`：Control UI 身分覆寫。會退回使用目前作用中的代理程式身分。

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

- `mode`：`local`（執行 gateway）或 `remote`（連線到遠端 gateway）。Gateway 除非為 `local`，否則拒絕啟動。
- `port`：WS + HTTP 的單一多工連接埠。優先順序：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（預設）、`lan`（`0.0.0.0`）、`tailnet`（僅 Tailscale IP），或 `custom`。
- **舊版 bind 別名**：在 `gateway.bind` 中使用 bind 模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），不要使用主機別名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事項**：預設的 `loopback` bind 會在容器內監聽 `127.0.0.1`。使用 Docker bridge networking（`-p 18789:18789`）時，流量會從 `eth0` 進來，因此無法連到 gateway。使用 `--network host`，或設定 `bind: "lan"`（或使用 `bind: "custom"` 搭配 `customBindHost: "0.0.0.0"`）以監聽所有介面。
- **驗證**：預設為必填。非 loopback bind 需要 gateway 驗證。實務上，這表示需要共用 token/password，或搭配 `gateway.auth.mode: "trusted-proxy"` 的具身分感知反向代理。Onboarding 精靈預設會產生 token。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRefs），請明確將 `gateway.auth.mode` 設為 `token` 或 `password`。兩者皆已設定但未設定 mode 時，啟動與服務安裝/修復流程會失敗。
- `gateway.auth.mode: "none"`：明確的無驗證模式。僅用於受信任的 local loopback 設定；這是刻意不在 onboarding 提示中提供的模式。
- `gateway.auth.mode: "trusted-proxy"`：將瀏覽器/使用者驗證委派給具身分感知的反向代理，並信任來自 `gateway.trustedProxies` 的身分標頭（請參閱 [受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)）。此模式預設預期 **非 loopback** 的代理來源；同主機 loopback 反向代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。內部同主機呼叫者可以使用 `gateway.auth.password` 作為本機直接備援；`gateway.auth.token` 仍然與 trusted-proxy 模式互斥。
- `gateway.auth.allowTailscale`：當為 `true` 時，Tailscale Serve 身分標頭可滿足 Control UI/WebSocket 驗證（透過 `tailscale whois` 驗證）。HTTP API 端點**不會**使用該 Tailscale 標頭驗證；它們改為遵循 gateway 的一般 HTTP 驗證模式。此無 token 流程假設 gateway 主機受信任。當 `tailscale.mode = "serve"` 時，預設為 `true`。
- `gateway.auth.rateLimit`：可選的驗證失敗限制器。依用戶端 IP 與驗證範圍套用（shared-secret 與 device-token 會獨立追蹤）。被封鎖的嘗試會回傳 `429` + `Retry-After`。
  - 在非同步 Tailscale Serve Control UI 路徑上，對相同 `{scope, clientIp}` 的失敗嘗試會在寫入失敗前序列化。因此，來自同一用戶端的並行錯誤嘗試可能會在第二個請求就觸發限制器，而不是兩者都以單純不符的方式競速通過。
  - `gateway.auth.rateLimit.exemptLoopback` 預設為 `true`；當你刻意也要對 localhost 流量套用速率限制時（例如測試設定或嚴格代理部署），請設為 `false`。
- 來自瀏覽器來源的 WS 驗證嘗試一律會被節流，且停用 loopback 豁免（作為防範瀏覽器型 localhost 暴力破解的縱深防禦）。
- 在 loopback 上，這些來自瀏覽器來源的鎖定會依正規化後的 `Origin`
  值隔離，因此來自某個 localhost origin 的重複失敗不會自動
  鎖定另一個 origin。
- `tailscale.mode`：`serve`（僅 tailnet、loopback bind）或 `funnel`（公開，需要驗證）。
- `controlUi.allowedOrigins`：Gateway WebSocket 連線的明確瀏覽器來源允許清單。當預期瀏覽器用戶端來自非 loopback 來源時為必填。
- `controlUi.chatMessageMaxWidth`：群組化 Control UI 聊天訊息的可選最大寬度。接受受限的 CSS 寬度值，例如 `960px`、`82%`、`min(1280px, 82%)` 和 `calc(100% - 2rem)`。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危險模式，會為刻意依賴 Host-header origin policy 的部署啟用 Host-header origin fallback。
- `remote.transport`：`ssh`（預設）或 `direct`（ws/wss）。對於 `direct`，`remote.url` 必須是 `ws://` 或 `wss://`。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`：用戶端行程環境
  break-glass 覆寫，允許對受信任的私有網路
  IP 使用純文字 `ws://`；純文字的預設仍僅限 loopback。沒有對應的 `openclaw.json`
  設定，而且瀏覽器私有網路設定，例如
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`，不會影響 Gateway
  WebSocket 用戶端。
- `gateway.remote.token` / `.password` 是遠端用戶端憑證欄位。它們本身不會設定 gateway 驗證。
- `gateway.push.apns.relay.baseUrl`：外部 APNs relay 的基礎 HTTPS URL，供 official/TestFlight iOS 組建在將 relay-backed registrations 發布到 gateway 後使用。此 URL 必須符合編譯進 iOS 組建的 relay URL。
- `gateway.push.apns.relay.timeoutMs`：gateway 到 relay 傳送逾時，單位為毫秒。預設為 `10000`。
- relay-backed registrations 會委派給特定 gateway 身分。已配對的 iOS app 會擷取 `gateway.identity.get`，在 relay registration 中包含該身分，並將 registration-scoped send grant 轉送給 gateway。另一個 gateway 無法重複使用該已儲存的 registration。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：上述 relay 設定的暫時 env 覆寫。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：僅供開發使用的逃生口，允許 loopback HTTP relay URL。正式環境 relay URL 應維持使用 HTTPS。
- `gateway.handshakeTimeoutMs`：驗證前 Gateway WebSocket 握手逾時，單位為毫秒。預設：`15000`。設定時，`OPENCLAW_HANDSHAKE_TIMEOUT_MS` 會優先。若主機負載高或效能較低，且本機用戶端能連線但啟動暖機仍在穩定中，請增加此值。
- `gateway.channelHealthCheckMinutes`：channel 健康監控間隔，單位為分鐘。設為 `0` 可全域停用健康監控重新啟動。預設：`5`。
- `gateway.channelStaleEventThresholdMinutes`：stale-socket 閾值，單位為分鐘。保持此值大於或等於 `gateway.channelHealthCheckMinutes`。預設：`30`。
- `gateway.channelMaxRestartsPerHour`：每個 channel/account 在滾動一小時內的健康監控重新啟動上限。預設：`10`。
- `channels.<provider>.healthMonitor.enabled`：每個 channel 可選擇退出健康監控重新啟動，同時保留全域監控啟用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多帳號 channel 的每帳號覆寫。設定後，優先於 channel 層級覆寫。
- 本機 gateway 呼叫路徑只有在 `gateway.auth.*` 未設定時，才能使用 `gateway.remote.*` 作為備援。
- 如果透過 SecretRef 明確設定的 `gateway.auth.token` / `gateway.auth.password` 無法解析，解析會以關閉方式失敗（不會被遠端備援遮蔽）。
- `trustedProxies`：終止 TLS 或注入 forwarded-client 標頭的反向代理 IP。只列出你控制的代理。loopback 項目對同主機代理/本機偵測設定仍然有效（例如 Tailscale Serve 或本機反向代理），但它們**不會**讓 loopback 請求符合 `gateway.auth.mode: "trusted-proxy"` 的資格。
- `allowRealIpFallback`：當為 `true` 時，若缺少 `X-Forwarded-For`，gateway 會接受 `X-Real-IP`。預設為 `false`，以採用 fail-closed 行為。
- `gateway.nodes.pairing.autoApproveCidrs`：可選的 CIDR/IP 允許清單，用於自動核准首次 node device pairing，且沒有要求 scopes。未設定時停用。這不會自動核准 operator/browser/Control UI/WebChat pairing，也不會自動核准 role、scope、metadata 或 public-key 升級。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`：在 pairing 與平台允許清單評估後，針對已宣告 node commands 的全域允許/拒絕 shaping。使用 `allowCommands` 選擇啟用危險的 node commands，例如 `camera.snap`、`camera.clip` 和 `screen.record`；即使平台預設或明確允許本來會包含某個 command，`denyCommands` 也會將其移除。node 變更其已宣告 command 清單後，請拒絕並重新核准該 device pairing，讓 gateway 儲存更新後的 command snapshot。
- `gateway.tools.deny`：針對 HTTP `POST /tools/invoke` 封鎖的額外工具名稱（延伸預設拒絕清單）。
- `gateway.tools.allow`：從預設 HTTP 拒絕清單中移除工具名稱。

</Accordion>

### OpenAI-compatible 端點

- Chat Completions：預設停用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 啟用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL-input 強化：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空的允許清單會視為未設定；使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和/或 `gateway.http.endpoints.responses.images.allowUrl=false` 來停用 URL 擷取。
- 可選的 response 強化標頭：
  - `gateway.http.securityHeaders.strictTransportSecurity`（僅為你控制的 HTTPS origins 設定；請參閱 [受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多執行個體隔離

使用唯一的連接埠與狀態目錄，在同一台主機上執行多個 gateways：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利旗標：`--dev`（使用 `~/.openclaw-dev` + 連接埠 `19001`）、`--profile <name>`（使用 `~/.openclaw-<name>`）。

請參閱 [多個 Gateways](/zh-TW/gateway/multiple-gateways)。

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
- `caPath`：用於用戶端驗證或自訂 trust chains 的可選 CA bundle 路徑。

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
  - `"off"`：忽略即時編輯；變更需要明確重新啟動。
  - `"restart"`：設定變更時一律重新啟動 gateway 行程。
  - `"hot"`：不重新啟動，直接在行程內套用變更。
  - `"hybrid"`（預設）：先嘗試 hot reload；如有需要則回退到重新啟動。
- `debounceMs`：套用設定變更前的 debounce 視窗，單位為 ms（非負整數）。
- `deferralTimeoutMs`：強制重新啟動前，等待進行中操作的可選最長時間，單位為 ms。省略時使用預設有界等待（`300000`）；設為 `0` 代表無限期等待並定期記錄仍在等待的警告。

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
查詢字串中的 hook token 會被拒絕。

驗證與安全注意事項：

- `hooks.enabled=true` 需要非空的 `hooks.token`。
- `hooks.token` 必須與 `gateway.auth.token` **不同**；重用 Gateway token 會被拒絕。
- `hooks.path` 不能是 `/`；請使用專用子路徑，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，請限制 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果 mapping 或 preset 使用模板化的 `sessionKey`，請設定 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。靜態 mapping key 不需要該選擇加入。

**端點：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 只有在 `hooks.allowRequestSessionKey=true`（預設：`false`）時，才會接受請求 payload 中的 `sessionKey`。
- `POST /hooks/<name>` → 透過 `hooks.mappings` 解析
  - 由模板算出的 mapping `sessionKey` 值會被視為外部提供，也需要 `hooks.allowRequestSessionKey=true`。

<Accordion title="Mapping details">

- `match.path` 會比對 `/hooks` 之後的子路徑（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 會比對 generic 路徑的 payload 欄位。
- `{{messages[0].subject}}` 這類模板會從 payload 讀取。
- `transform` 可以指向會回傳 hook action 的 JS/TS 模組。
  - `transform.module` 必須是相對路徑，且會留在 `hooks.transformsDir` 內（絕對路徑與路徑穿越會被拒絕）。
  - 請將 `hooks.transformsDir` 保持在 `~/.openclaw/hooks/transforms` 之下；workspace skill 目錄會被拒絕。如果 `openclaw doctor` 回報此路徑無效，請將 transform 模組移到 hooks transforms 目錄中，或移除 `hooks.transformsDir`。
- `agentId` 會路由到特定 agent；未知 ID 會回退到預設值。
- `allowedAgentIds`：限制明確路由（`*` 或省略 = 全部允許，`[]` = 全部拒絕）。
- `defaultSessionKey`：沒有明確 `sessionKey` 的 hook agent 執行可使用的選用固定 session key。
- `allowRequestSessionKey`：允許 `/hooks/agent` 呼叫者和模板驅動的 mapping session key 設定 `sessionKey`（預設：`false`）。
- `allowedSessionKeyPrefixes`：明確 `sessionKey` 值（請求 + mapping）的選用前綴允許清單，例如 `["hook:"]`。當任何 mapping 或 preset 使用模板化的 `sessionKey` 時，它會變成必要項目。
- `deliver: true` 會將最終回覆傳送到 channel；`channel` 預設為 `last`。
- `model` 會覆寫此 hook 執行的 LLM（如果已設定模型目錄，則必須被允許）。

</Accordion>

### Gmail 整合

- 內建 Gmail preset 使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果保留該每封訊息路由，請設定 `hooks.allowRequestSessionKey: true`，並限制 `hooks.allowedSessionKeyPrefixes` 以符合 Gmail 命名空間，例如 `["hook:", "hook:gmail:"]`。
- 如果需要 `hooks.allowRequestSessionKey: false`，請以靜態 `sessionKey` 覆寫 preset，而不是使用模板化預設值。

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

- 設定後，Gateway 會在啟動時自動啟動 `gog gmail watch serve`。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可停用。
- 不要在 Gateway 旁邊另外執行一個 `gog gmail watch serve`。

---

## Canvas 主機

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- 在 Gateway 連接埠下透過 HTTP 提供 agent 可編輯的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 僅限本機：保持 `gateway.bind: "loopback"`（預設）。
- 非 loopback 綁定：canvas routes 需要 Gateway 驗證（token/password/trusted-proxy），與其他 Gateway HTTP 表面相同。
- Node WebViews 通常不會傳送驗證標頭；node 配對並連線後，Gateway 會公告 node 範圍的 capability URL，供 canvas/A2UI 存取。
- Capability URL 會綁定到作用中的 node WS session，並且很快過期。不使用基於 IP 的回退。
- 將 live-reload 用戶端注入提供的 HTML。
- 空白時自動建立入門 `index.html`。
- 也會在 `/__openclaw__/a2ui/` 提供 A2UI。
- 變更需要重新啟動 gateway。
- 對大型目錄或 `EMFILE` 錯誤停用 live reload。

---

## Discovery

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

- `minimal`（預設）：從 TXT records 省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`。
- 當系統 hostname 是有效的 DNS label 時，hostname 預設為系統 hostname，否則回退到 `openclaw`。使用 `OPENCLAW_MDNS_HOSTNAME` 覆寫。

### 廣域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

在 `~/.openclaw/dns/` 下寫入 unicast DNS-SD zone。若要跨網路探索，請搭配 DNS 伺服器（建議 CoreDNS）+ Tailscale split DNS。

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

- 只有在 process env 缺少該 key 時，才會套用內嵌環境變數。
- `.env` 檔案：CWD `.env` + `~/.openclaw/.env`（兩者都不會覆寫既有變數）。
- `shellEnv`：從你的 login shell profile 匯入缺少的預期 key。
- 完整優先順序請參閱[環境](/zh-TW/help/environment)。

### 環境變數替換

在任何 config 字串中用 `${VAR_NAME}` 參照環境變數：

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 只會匹配大寫名稱：`[A-Z_][A-Z0-9_]*`。
- 缺少或空白的變數會在 config 載入時丟出錯誤。
- 使用 `$${VAR}` 跳脫成字面 `${VAR}`。
- 可搭配 `$include` 使用。

---

## 秘密

Secret ref 是加成式的：純文字值仍可運作。

### `SecretRef`

使用一種物件形狀：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

驗證：

- `provider` pattern：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id pattern：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id：絕對 JSON pointer（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` id pattern：`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` id 不得包含 `.` 或 `..` slash 分隔的路徑段（例如 `a/../b` 會被拒絕）

### 支援的認證資訊表面

- 標準矩陣：[SecretRef 認證資訊表面](/zh-TW/reference/secretref-credential-surface)
- `secrets apply` 以支援的 `openclaw.json` 認證資訊路徑為目標。
- `auth-profiles.json` ref 會納入 runtime 解析與稽核覆蓋範圍。

### Secret provider config

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

- `file` provider 支援 `mode: "json"` 和 `mode: "singleValue"`（在 singleValue mode 中，`id` 必須是 `"value"`）。
- 當 Windows ACL 驗證不可用時，file 和 exec provider 路徑會失敗關閉。只有對無法驗證的受信任路徑才設定 `allowInsecurePath: true`。
- `exec` provider 需要絕對 `command` 路徑，並在 stdin/stdout 使用 protocol payload。
- 預設會拒絕 symlink command 路徑。設定 `allowSymlinkCommand: true` 可允許 symlink 路徑，同時驗證解析後的目標路徑。
- 如果已設定 `trustedDirs`，trusted-dir 檢查會套用到解析後的目標路徑。
- `exec` 子環境預設是最小化的；請用 `passEnv` 明確傳遞必要變數。
- Secret ref 會在啟用時解析為記憶體內 snapshot，接著請求路徑只會讀取該 snapshot。
- Active-surface filtering 會在啟用期間套用：啟用表面上的未解析 ref 會讓啟動/重新載入失敗，而非作用中表面會被略過並附帶診斷。

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

- 每個 agent 的 profile 儲存在 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 支援靜態認證資訊模式的 value-level ref（`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- 舊版扁平 `auth-profiles.json` map（例如 `{ "provider": { "apiKey": "..." } }`）不是 runtime format；`openclaw doctor --fix` 會將它們重寫為標準 `provider:default` API-key profile，並建立 `.legacy-flat.*.bak` 備份。
- OAuth-mode profile（`auth.profiles.<id>.mode = "oauth"`）不支援 SecretRef-backed auth-profile 認證資訊。
- 靜態 runtime 認證資訊來自記憶體內解析後的 snapshot；發現舊版靜態 `auth.json` entry 時會將其清除。
- 舊版 OAuth 會從 `~/.openclaw/credentials/oauth.json` 匯入。
- 請參閱 [OAuth](/zh-TW/concepts/oauth)。
- Secrets runtime 行為與 `audit/configure/apply` 工具：[Secrets 管理](/zh-TW/gateway/secrets)。

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

- `billingBackoffHours`：當設定檔因真實的帳單/額度不足錯誤而失敗時，以小時為單位的基礎退避時間（預設：`5`）。即使在 `401`/`403` 回應中，明確的帳單文字仍可能歸入此處，但供應商專屬的文字比對器仍限定在擁有它們的供應商範圍內（例如 OpenRouter `Key limit exceeded`）。可重試的 HTTP `402` 使用時段，或組織/工作區支出上限訊息，則會留在 `rate_limit` 路徑中。
- `billingBackoffHoursByProvider`：選用的各供應商帳單退避小時數覆寫。
- `billingMaxHours`：帳單退避指數增長的小時上限（預設：`24`）。
- `authPermanentBackoffMinutes`：高信心 `auth_permanent` 失敗的基礎退避分鐘數（預設：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避增長的分鐘上限（預設：`60`）。
- `failureWindowHours`：用於退避計數器的滾動時窗，以小時為單位（預設：`24`）。
- `overloadedProfileRotations`：在切換至模型備援前，針對過載錯誤允許的同供應商驗證設定檔輪換次數上限（預設：`1`）。`ModelNotReadyException` 等供應商忙碌型態會歸入此處。
- `overloadedBackoffMs`：重試過載供應商/設定檔輪換前的固定延遲（預設：`0`）。
- `rateLimitedProfileRotations`：在切換至模型備援前，針對速率限制錯誤允許的同供應商驗證設定檔輪換次數上限（預設：`1`）。該速率限制分類包含供應商型態文字，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 與 `resource exhausted`。

---

## 日誌

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

- 預設日誌檔：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 設定 `logging.file` 可使用穩定路徑。
- 使用 `--verbose` 時，`consoleLevel` 會提升為 `debug`。
- `maxFileBytes`：輪替前作用中日誌檔的大小上限，以位元組為單位（正整數；預設：`104857600` = 100 MB）。OpenClaw 會在作用中檔案旁保留最多五個編號封存檔。
- `redactSensitive` / `redactPatterns`：針對主控台輸出、檔案日誌、OTLP 日誌記錄，以及持久化的工作階段逐字稿文字，提供盡力而為的遮蔽。`redactSensitive: "off"` 只會停用這項一般日誌/逐字稿政策；UI/工具/診斷安全介面在發出前仍會遮蔽秘密。

---

## 診斷

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

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

- `enabled`：儀表化輸出的主開關（預設：`true`）。
- `flags`：啟用目標日誌輸出的旗標字串陣列（支援 `"telegram.*"` 或 `"*"` 等萬用字元）。
- `stuckSessionWarnMs`：用於將長時間執行中的處理工作階段分類為 `session.long_running`、`session.stalled` 或 `session.stuck` 的無進度年齡門檻，單位為 ms。回覆、工具、狀態、區塊與 ACP 進度會重設計時器；重複的 `session.stuck` 診斷會在未變更時退避。
- `otel.enabled`：啟用 OpenTelemetry 匯出管線（預設：`false`）。完整設定、訊號目錄與隱私模型請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。
- `otel.endpoint`：OTel 匯出的收集器 URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`：選用的訊號專屬 OTLP 端點。設定後，它們只會針對該訊號覆寫 `otel.endpoint`。
- `otel.protocol`：`"http/protobuf"`（預設）或 `"grpc"`。
- `otel.headers`：隨 OTel 匯出請求傳送的額外 HTTP/gRPC 中繼資料標頭。
- `otel.serviceName`：資源屬性的服務名稱。
- `otel.traces` / `otel.metrics` / `otel.logs`：啟用追蹤、指標或日誌匯出。
- `otel.sampleRate`：追蹤取樣率 `0`–`1`。
- `otel.flushIntervalMs`：週期性遙測排清間隔，單位為 ms。
- `otel.captureContent`：選擇加入 OTEL span 屬性的原始內容擷取。預設為關閉。布林值 `true` 會擷取非系統訊息/工具內容；物件形式可讓你明確啟用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs` 與 `systemPrompt`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`：最新版實驗性 GenAI span 供應商屬性的環境開關。預設情況下，為了相容性，span 會保留舊版 `gen_ai.system` 屬性；GenAI 指標使用有界語意屬性。
- `OPENCLAW_OTEL_PRELOADED=1`：適用於已註冊全域 OpenTelemetry SDK 主機的環境開關。OpenClaw 隨後會略過 Plugin 擁有的 SDK 啟動/關閉，同時保持診斷監聽器啟用。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 與 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`：當相符設定鍵未設定時使用的訊號專屬端點環境變數。
- `cacheTrace.enabled`：為嵌入式執行記錄快取追蹤快照（預設：`false`）。
- `cacheTrace.filePath`：快取追蹤 JSONL 的輸出路徑（預設：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制快取追蹤輸出包含哪些內容（全部預設：`true`）。

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

- `channel`：npm/git 安裝的發行通道 — `"stable"`、`"beta"` 或 `"dev"`。
- `checkOnStart`：Gateway 啟動時檢查 npm 更新（預設：`true`）。
- `auto.enabled`：為套件安裝啟用背景自動更新（預設：`false`）。
- `auto.stableDelayHours`：stable 通道自動套用前的最短延遲小時數（預設：`6`；最大：`168`）。
- `auto.stableJitterHours`：stable 通道推出分散視窗的額外小時數（預設：`12`；最大：`168`）。
- `auto.betaCheckIntervalHours`：beta 通道檢查執行頻率，以小時為單位（預設：`1`；最大：`24`）。

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

- `enabled`：全域 ACP 功能閘（預設：`true`；設為 `false` 可隱藏 ACP 分派與產生工作階段的操作入口）。
- `dispatch.enabled`：ACP 工作階段回合分派的獨立閘（預設：`true`）。設為 `false` 可保留 ACP 指令，同時阻止執行。
- `backend`：預設 ACP 執行階段後端 id（必須符合已註冊的 ACP 執行階段 Plugin）。
  請先安裝後端 Plugin；若設定了 `plugins.allow`，請包含後端 Plugin id（例如 `acpx`），否則 ACP 後端不會載入。
- `defaultAgent`：當產生工作階段未指定明確目標時，作為備援的 ACP 目標代理 id。
- `allowedAgents`：允許用於 ACP 執行階段工作階段的代理 id 允許清單；空白表示沒有額外限制。
- `maxConcurrentSessions`：同時作用中 ACP 工作階段的最大數量。
- `stream.coalesceIdleMs`：串流文字的閒置排清視窗，單位為 ms。
- `stream.maxChunkChars`：分割串流區塊投影前的最大區塊大小。
- `stream.repeatSuppression`：每個回合抑制重複的狀態/工具行（預設：`true`）。
- `stream.deliveryMode`：`"live"` 會增量串流；`"final_only"` 會緩衝到回合終止事件。
- `stream.hiddenBoundarySeparator`：隱藏工具事件後、可見文字前的分隔符（預設：`"paragraph"`）。
- `stream.maxOutputChars`：每個 ACP 回合投影的助理輸出字元上限。
- `stream.maxSessionUpdateChars`：投影 ACP 狀態/更新行的字元上限。
- `stream.tagVisibility`：標籤名稱到布林可見性覆寫的記錄，用於串流事件。
- `runtime.ttlMinutes`：ACP 工作階段 worker 符合清理資格前的閒置 TTL，單位為分鐘。
- `runtime.installCommand`：啟動 ACP 執行階段環境時要執行的選用安裝指令。

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
  - `"default"`：固定中性標語（`All your chats, one OpenClaw.`）。
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

## 身分

請參閱 [代理預設值](/zh-TW/gateway/config-agents#agent-defaults) 下的 `agents.list` 身分欄位。

---

## 橋接（舊版，已移除）

目前建置不再包含 TCP 橋接。Node 會透過 Gateway WebSocket 連線。`bridge.*` 鍵不再屬於設定結構描述的一部分（驗證會失敗，直到移除為止；`openclaw doctor --fix` 可移除未知鍵）。

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

- `sessionRetention`：從 `sessions.json` 清除前，完成的隔離 Cron 執行工作階段要保留多久。也會控制已封存刪除 Cron 逐字稿的清理。預設：`24h`；設為 `false` 可停用。
- `runLog.maxBytes`：修剪前每個執行日誌檔（`cron/runs/<jobId>.jsonl`）的大小上限。預設：`2_000_000` 位元組。
- `runLog.keepLines`：觸發執行日誌修剪時保留的最新行數。預設：`2000`。
- `webhookToken`：用於 Cron Webhook POST 傳遞（`delivery.mode = "webhook"`）的 bearer token；若省略，則不會傳送驗證標頭。
- `webhook`：已淘汰的舊版備援 Webhook URL（http/https），僅用於仍具有 `notify: true` 的已儲存工作。

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

- `maxAttempts`：單次工作在暫時性錯誤上的最大重試次數（預設值：`3`；範圍：`0`–`10`）。
- `backoffMs`：每次重試嘗試的退避延遲陣列，以 ms 為單位（預設值：`[30000, 60000, 300000]`；1–10 個項目）。
- `retryOn`：觸發重試的錯誤類型 — `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略時會重試所有暫時性類型。

僅適用於單次 Cron 工作。週期性工作使用獨立的失敗處理。

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
- `after`：發出警示前的連續失敗次數（正整數，最小值：`1`）。
- `cooldownMs`：同一工作重複警示之間的最小毫秒數（非負整數）。
- `includeSkipped`：將連續略過的執行計入警示閾值（預設值：`false`）。略過的執行會分開追蹤，且不會影響執行錯誤退避。
- `mode`：傳遞模式 — `"announce"` 透過頻道訊息傳送；`"webhook"` 發布到已設定的 Webhook。
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

- 所有工作的 Cron 失敗通知預設目的地。
- `mode`：`"announce"` 或 `"webhook"`；當存在足夠的目標資料時，預設為 `"announce"`。
- `channel`：announce 傳遞的頻道覆寫。`"last"` 會重用最後已知的傳遞頻道。
- `to`：明確的 announce 目標或 Webhook URL。Webhook 模式需要此欄位。
- `accountId`：選用的傳遞帳戶覆寫。
- 每項工作的 `delivery.failureDestination` 會覆寫此全域預設值。
- 當未設定全域或每項工作的失敗目的地時，已透過 `announce` 傳遞的工作會在失敗時回退到該主要 announce 目標。
- `delivery.failureDestination` 僅支援 `sessionTarget="isolated"` 工作，除非工作的主要 `delivery.mode` 是 `"webhook"`。

請參閱 [Cron 工作](/zh-TW/automation/cron-jobs)。隔離的 Cron 執行會作為[背景工作](/zh-TW/automation/tasks)追蹤。

---

## 媒體模型範本變數

在 `tools.media.models[].args` 中展開的範本預留位置：

| 變數               | 說明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完整的傳入訊息本文                                |
| `{{RawBody}}`      | 原始本文（不含歷史記錄/傳送者包裝）               |
| `{{BodyStripped}}` | 已移除群組提及的本文                              |
| `{{From}}`         | 傳送者識別碼                                      |
| `{{To}}`           | 目的地識別碼                                      |
| `{{MessageSid}}`   | 頻道訊息 id                                       |
| `{{SessionId}}`    | 目前工作階段 UUID                                 |
| `{{IsNewSession}}` | 建立新工作階段時為 `"true"`                       |
| `{{MediaUrl}}`     | 傳入媒體偽 URL                                    |
| `{{MediaPath}}`    | 本機媒體路徑                                      |
| `{{MediaType}}`    | 媒體類型（image/audio/document/…）                |
| `{{Transcript}}`   | 音訊轉錄                                          |
| `{{Prompt}}`       | CLI 項目的已解析媒體提示                          |
| `{{MaxChars}}`     | CLI 項目的已解析最大輸出字元數                    |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                           |
| `{{GroupSubject}}` | 群組主旨（盡力提供）                              |
| `{{GroupMembers}}` | 群組成員預覽（盡力提供）                          |
| `{{SenderName}}`   | 傳送者顯示名稱（盡力提供）                        |
| `{{SenderE164}}`   | 傳送者電話號碼（盡力提供）                        |
| `{{Provider}}`     | 提供者提示（whatsapp、telegram、discord 等）       |

---

## 設定包含項 (`$include`)

將設定拆分到多個檔案：

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
- 同層鍵：在包含項之後合併（覆寫已包含的值）。
- 巢狀包含項：最多深入 10 層。
- 路徑：相對於執行包含的檔案解析，但必須留在頂層設定目錄內（`openclaw.json` 的 `dirname`）。只有在仍解析到該邊界內時，才允許絕對路徑/`../` 形式。
- OpenClaw 擁有的寫入若只變更由單一檔案包含項支援的單一頂層區段，會直接寫入該包含的檔案。例如，`plugins install` 會在 `plugins.json5` 中更新 `plugins: { $include: "./plugins.json5" }`，並保持 `openclaw.json` 不變。
- 根層包含項、包含項陣列，以及含有同層覆寫的包含項，對 OpenClaw 擁有的寫入為唯讀；這些寫入會封閉式失敗，而不是將設定攤平。
- 錯誤：針對遺失檔案、解析錯誤與循環包含項提供清楚訊息。

---

_相關：[設定](/zh-TW/gateway/configuration) · [設定範例](/zh-TW/gateway/configuration-examples) · [Doctor](/zh-TW/gateway/doctor)_

## 相關

- [設定](/zh-TW/gateway/configuration)
- [設定範例](/zh-TW/gateway/configuration-examples)
