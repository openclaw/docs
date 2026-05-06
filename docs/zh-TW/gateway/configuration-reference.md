---
read_when:
    - 需要精確的欄位層級設定語意或預設值
    - 你正在驗證通道、模型、Gateway 或工具設定區塊
summary: Gateway 設定參考，涵蓋核心 OpenClaw 鍵、預設值，以及專用子系統參考文件的連結
title: 設定參考
x-i18n:
    generated_at: "2026-05-06T09:09:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 119194a7e041a7ca35b9dd1575c4f4c4d5c67f412cd3002e65bf5b706b210a90
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` 的核心設定參考。若要以任務為導向的概覽，請參閱 [設定](/zh-TW/gateway/configuration)。

涵蓋主要的 OpenClaw 設定介面；當子系統有自己的更深入參考時，會連結到對應頁面。Channel 與 Plugin 擁有的命令目錄，以及深層 memory/QMD 調整項，位於各自頁面，而不是本頁。

程式碼依據：

- `openclaw config schema` 會列印用於驗證和控制 UI 的即時 JSON Schema；可用時會合併內建/Plugin/Channel 中繼資料
- `config.schema.lookup` 會回傳一個以路徑為範圍的 schema 節點，供深入檢視工具使用
- `pnpm config:docs:check` / `pnpm config:docs:gen` 會依目前 schema 介面驗證設定文件基準雜湊

Agent 查找路徑：編輯前，請使用 `gateway` 工具動作 `config.schema.lookup` 取得精確的欄位層級文件與限制。以任務為導向的指引請使用
[設定](/zh-TW/gateway/configuration)，而本頁則用於較完整的欄位地圖、預設值，以及子系統參考連結。

專用深入參考：

- [記憶體設定參考](/zh-TW/reference/memory-config)：適用於 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及 `plugins.entries.memory-core.config.dreaming` 下的 dreaming 設定
- [斜線命令](/zh-TW/tools/slash-commands)：適用於目前內建 + 隨附的命令目錄
- 擁有該 Channel/Plugin 的頁面，適用於 Channel 專屬命令介面

設定格式是 **JSON5**（允許註解與尾隨逗號）。所有欄位都是選用的 - 省略時 OpenClaw 會使用安全預設值。

---

## Channels

每個 Channel 的設定鍵已移至專用頁面 - 請參閱
[設定 - channels](/zh-TW/gateway/config-channels) 了解 `channels.*`，
包含 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage，以及其他
隨附 Channel（驗證、存取控制、多帳戶、提及閘控）。

## Agent 預設值、多 Agent、session 與訊息

已移至專用頁面 - 請參閱
[設定 - agents](/zh-TW/gateway/config-agents) 了解：

- `agents.defaults.*`（workspace、model、thinking、Heartbeat、memory、media、Skills、sandbox）
- `multiAgent.*`（多 Agent 路由與繫結）
- `session.*`（session 生命週期、Compaction、修剪）
- `messages.*`（訊息傳遞、TTS、markdown 轉譯）
- `talk.*`（Talk 模式）
  - `talk.speechLocale`：iOS/macOS 上 Talk 語音辨識的選用 BCP 47 locale id
  - `talk.silenceTimeoutMs`：未設定時，Talk 會保留平台預設的暫停視窗，再傳送 transcript（`macOS 和 Android 為 700 ms，iOS 為 900 ms`）

## 工具與自訂 provider

工具政策、實驗性切換、由 provider 支援的工具設定，以及自訂
provider / base-URL 設定已移至專用頁面 - 請參閱
[設定 - 工具與自訂 provider](/zh-TW/gateway/config-tools)。

## Models

Provider 定義、model 允許清單，以及自訂 provider 設定位於
[設定 - 工具與自訂 provider](/zh-TW/gateway/config-tools#custom-providers-and-base-urls)。
`models` 根節點也擁有全域 model 目錄行為。

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`：provider 目錄行為（`merge` 或 `replace`）。
- `models.providers`：以 provider id 為鍵的自訂 provider 對應表。
- `models.pricing.enabled`：控制背景價格啟動程序；該程序會在 sidecar 與 Channel 抵達 Gateway ready 路徑後開始。為 `false` 時，Gateway 會略過 OpenRouter 與 LiteLLM 價格目錄擷取；已設定的
  `models.providers.*.models[].cost` 值仍可用於本機成本估算。

## MCP

OpenClaw 管理的 MCP server 定義位於 `mcp.servers` 下，並由嵌入式 Pi
與其他執行階段 adapter 使用。`openclaw mcp list`、`show`、`set` 和
`unset` 命令會管理此區塊，而不會在編輯設定時連線到目標 server。

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

- `mcp.servers`：具名 stdio 或遠端 MCP server 定義，供會暴露已設定 MCP 工具的執行階段使用。
  遠端項目使用 `transport: "streamable-http"` 或 `transport: "sse"`；
  `type: "http"` 是 CLI 原生別名，`openclaw mcp set` 與
  `openclaw doctor --fix` 會將其正規化為標準的 `transport` 欄位。
- `mcp.sessionIdleTtlMs`：session 範圍內隨附 MCP 執行階段的閒置 TTL。
  一次性嵌入式執行會要求執行結束清理；此 TTL 是長存 session 與未來呼叫者的後備機制。
- `mcp.*` 下的變更會透過處置快取的 session MCP 執行階段來熱套用。
  下一次工具探索/使用會依新設定重新建立它們，因此已移除的
  `mcp.servers` 項目會立即被清除，而不是等待閒置 TTL。

請參閱 [MCP](/zh-TW/cli/mcp#openclaw-as-an-mcp-client-registry) 與
[CLI 後端](/zh-TW/gateway/cli-backends#bundle-mcp-overlays) 了解執行階段行為。

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

- `allowBundled`：僅適用於隨附 Skills 的選用允許清單（不影響受管理/workspace Skills）。
- `load.extraDirs`：額外的共用 Skill 根目錄（最低優先順序）。
- `install.preferBrew`：為 true 時，如果 `brew` 可用，會優先使用 Homebrew 安裝器，再退回其他安裝器類型。
- `install.nodeManager`：`metadata.openclaw.install` 規格的 node 安裝器偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false`：即使 Skill 是隨附/已安裝，也會停用該 Skill。
- `entries.<skillKey>.apiKey`：供宣告主要環境變數的 Skills 使用的便利欄位（明文字串或 SecretRef 物件）。

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
- 探索接受原生 OpenClaw Plugins，以及相容的 Codex bundles 和 Claude bundles，包含沒有 manifest 的 Claude 預設版面 bundles。
- **設定變更需要重新啟動 gateway。**
- `allow`：選用允許清單（只載入列出的 Plugins）。`deny` 優先。
- `bundledDiscovery`：新設定預設為 `"allowlist"`，因此非空的
  `plugins.allow` 也會閘控隨附 provider Plugins，包含 web-search
  執行階段 provider。Doctor 會對遷移後的舊版允許清單設定寫入 `"compat"`，
  以保留現有隨附 provider 行為，直到你選擇採用新行為。
- `plugins.entries.<id>.apiKey`：Plugin 層級 API key 便利欄位（由該 Plugin 支援時）。
- `plugins.entries.<id>.env`：Plugin 範圍的環境變數對應表。
- `plugins.entries.<id>.hooks.allowPromptInjection`：為 `false` 時，核心會封鎖 `before_prompt_build`，並忽略舊版 `before_agent_start` 中會改變 prompt 的欄位，同時保留舊版 `modelOverride` 與 `providerOverride`。適用於原生 Plugin hooks，以及受支援 bundle 提供的 hook 目錄。
- `plugins.entries.<id>.hooks.allowConversationAccess`：為 `true` 時，受信任的非隨附 Plugins 可以從 typed hooks 讀取原始對話內容，例如 `llm_input`、`llm_output`、`before_agent_finalize` 和 `agent_end`。
- `plugins.entries.<id>.subagent.allowModelOverride`：明確信任此 Plugin，可為背景 subagent 執行要求每次執行的 `provider` 與 `model` 覆寫。
- `plugins.entries.<id>.subagent.allowedModels`：受信任 subagent 覆寫的標準 `provider/model` 目標選用允許清單。只有在你有意允許任何 model 時才使用 `"*"`。
- `plugins.entries.<id>.config`：Plugin 定義的設定物件（可用時由原生 OpenClaw Plugin schema 驗證）。
- Channel Plugin 帳戶/執行階段設定位於 `channels.<id>` 下，並應由擁有該 Plugin 的 manifest `channelConfigs` 中繼資料描述，而不是由中央 OpenClaw 選項登錄描述。
- `plugins.entries.firecrawl.config.webFetch`：Firecrawl web-fetch provider 設定。
  - `apiKey`：Firecrawl API key（接受 SecretRef）。會退回使用 `plugins.entries.firecrawl.config.webSearch.apiKey`、舊版 `tools.web.fetch.firecrawl.apiKey`，或 `FIRECRAWL_API_KEY` 環境變數。
  - `baseUrl`：Firecrawl API base URL（預設：`https://api.firecrawl.dev`；自架覆寫必須指向私有/內部端點）。
  - `onlyMainContent`：僅從頁面擷取主要內容（預設：`true`）。
  - `maxAgeMs`：最大快取時間，單位為毫秒（預設：`172800000` / 2 天）。
  - `timeoutSeconds`：scrape 要求逾時時間，單位為秒（預設：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok web search）設定。
  - `enabled`：啟用 X Search provider。
  - `model`：用於搜尋的 Grok model（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：memory dreaming 設定。請參閱 [Dreaming](/zh-TW/concepts/dreaming) 了解階段與閾值。
  - `enabled`：master dreaming 開關（預設 `false`）。
  - `frequency`：每次完整 dreaming sweep 的 cron 頻率（預設為 `"0 3 * * *"`）。
  - `model`：選用的 Dream Diary subagent model 覆寫。需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`；搭配 `allowedModels` 以限制目標。Model 不可用錯誤會使用 session 預設 model 重試一次；信任或允許清單失敗不會無聲退回。
  - phase 政策與閾值是實作細節（不是面向使用者的設定鍵）。
- 完整 memory 設定位於 [記憶體設定參考](/zh-TW/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已啟用的 Claude bundle Plugins 也可以從 `settings.json` 貢獻嵌入式 Pi 預設值；OpenClaw 會將這些套用為已清理的 agent 設定，而不是原始 OpenClaw 設定 patch。
- `plugins.slots.memory`：選擇作用中的 memory Plugin id，或使用 `"none"` 停用 memory Plugins。
- `plugins.slots.contextEngine`：選擇作用中的 context engine Plugin id；預設為 `"legacy"`，除非你安裝並選擇另一個 engine。

請參閱 [Plugins](/zh-TW/tools/plugin)。

---

## Commitments

`commitments` 控制推斷出的後續追蹤 memory：OpenClaw 可以從對話回合偵測 check-in，並透過 Heartbeat 執行傳遞它們。

- `commitments.enabled`：啟用隱藏 LLM 擷取、儲存，以及透過 Heartbeat 傳遞推斷出的後續承諾。預設值：`false`。
- `commitments.maxPerDay`：每個 agent session 在滾動的一天內，推斷出的後續承諾傳遞上限。預設值：`3`。

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
- `tabCleanup` 會在閒置時間後，或當工作階段超過其上限時，回收已追蹤的主要代理分頁。設定 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 可停用這些個別清理模式。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` 在未設定時會停用，因此瀏覽器導覽預設維持嚴格。
- 只有在你刻意信任私人網路瀏覽器導覽時，才設定 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在嚴格模式中，遠端 CDP 設定檔端點（`profiles.*.cdpUrl`）在可達性/探索檢查期間也會套用相同的私人網路封鎖。
- `ssrfPolicy.allowPrivateNetwork` 仍支援作為舊版別名。
- 在嚴格模式中，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 設定明確例外。
- 遠端設定檔僅能附加（已停用啟動/停止/重設）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  當你希望 OpenClaw 探索 `/json/version` 時使用 HTTP(S)；當你的供應者提供直接的 DevTools WebSocket URL 時使用 WS(S)。
- `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 會套用到遠端與
  `attachOnly` CDP 可達性，以及分頁開啟請求。受管理的 loopback
  設定檔會保留本機 CDP 預設值。
- 如果外部管理的 CDP 服務可透過 loopback 存取，請將該設定檔的
  `attachOnly: true`；否則 OpenClaw 會將 loopback 連接埠視為本機受管理的瀏覽器設定檔，且可能回報本機連接埠擁有權錯誤。
- `existing-session` 設定檔使用 Chrome MCP 而非 CDP，並可附加到所選主機或透過已連線的瀏覽器節點附加。
- `existing-session` 設定檔可設定 `userDataDir`，以鎖定特定 Chromium 架構瀏覽器設定檔，例如 Brave 或 Edge。
- `existing-session` 設定檔保留目前的 Chrome MCP 路由限制：
  使用快照/ref 驅動的動作，而非 CSS 選擇器定位；單檔上傳
  hooks；沒有對話框逾時覆寫；沒有 `wait --load networkidle`；也沒有
  `responsebody`、PDF 匯出、下載攔截或批次動作。
- 本機受管理的 `openclaw` 設定檔會自動指派 `cdpPort` 和 `cdpUrl`；只有遠端 CDP 才需明確設定 `cdpUrl`。
- 本機受管理設定檔可設定 `executablePath`，以覆寫該設定檔的全域
  `browser.executablePath`。可用來讓一個設定檔在 Chrome 中執行，另一個在 Brave 中執行。
- 本機受管理設定檔會使用 `browser.localLaunchTimeoutMs`，在程序啟動後進行 Chrome CDP HTTP
  探索，並使用 `browser.localCdpReadyTimeoutMs` 進行
  啟動後 CDP websocket 就緒檢查。在 Chrome 成功啟動但就緒檢查與啟動競速的較慢主機上，請提高這些值。兩個值都必須是
  最高 `120000` ms 的正整數；無效的設定值會被拒絕。
- 自動偵測順序：預設瀏覽器（若為 Chromium 架構）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 都接受
  `~` 和 `~/...`，會在 Chromium 啟動前展開為你作業系統的家目錄。
  `existing-session` 設定檔中的每設定檔 `userDataDir` 也會進行波浪號展開。
- 控制服務：僅限 loopback（連接埠衍生自 `gateway.port`，預設為 `18791`）。
- `extraArgs` 會將額外啟動旗標附加到本機 Chromium 啟動（例如
  `--disable-gpu`、視窗大小設定或除錯旗標）。

---

## 使用者介面

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

- `mode`: `local`（執行 Gateway）或 `remote`（連線到遠端 Gateway）。Gateway 除非為 `local`，否則會拒絕啟動。
- `port`: WS + HTTP 的單一多工連接埠。優先順序：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（預設）、`lan`（`0.0.0.0`）、`tailnet`（僅 Tailscale IP）或 `custom`。
- **舊版 bind 別名**：在 `gateway.bind` 中使用 bind 模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），不要使用主機別名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事項**：預設的 `loopback` bind 會在容器內監聽 `127.0.0.1`。使用 Docker bridge 網路（`-p 18789:18789`）時，流量會從 `eth0` 進入，因此無法連到 Gateway。請使用 `--network host`，或設定 `bind: "lan"`（或 `bind: "custom"` 搭配 `customBindHost: "0.0.0.0"`）以監聽所有介面。
- **驗證**：預設為必填。非 loopback bind 需要 Gateway 驗證。實務上，這表示需要共用 token/password，或搭配 `gateway.auth.mode: "trusted-proxy"` 的識別感知反向代理。Onboarding 精靈預設會產生一個 token。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`（包含 SecretRefs），請明確將 `gateway.auth.mode` 設為 `token` 或 `password`。同時設定兩者且未設定 mode 時，啟動與服務安裝/修復流程會失敗。
- `gateway.auth.mode: "none"`：明確的無驗證模式。僅用於受信任的 local loopback 設定；onboarding 提示刻意不提供此選項。
- `gateway.auth.mode: "trusted-proxy"`：將瀏覽器/使用者驗證委派給識別感知反向代理，並信任來自 `gateway.trustedProxies` 的身分標頭（請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)）。此模式預設預期代理來源為**非 loopback**；同主機 loopback 反向代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。內部同主機呼叫端可以使用 `gateway.auth.password` 作為本機直接後備；`gateway.auth.token` 仍與 trusted-proxy 模式互斥。
- `gateway.auth.allowTailscale`: 當為 `true` 時，Tailscale Serve 身分標頭可滿足 Control UI/WebSocket 驗證（透過 `tailscale whois` 驗證）。HTTP API 端點**不會**使用該 Tailscale 標頭驗證；它們會改用 Gateway 的一般 HTTP 驗證模式。此無 token 流程假設 Gateway 主機是受信任的。當 `tailscale.mode = "serve"` 時預設為 `true`。
- `gateway.auth.rateLimit`: 可選的驗證失敗限制器。依用戶端 IP 與驗證範圍套用（shared-secret 與 device-token 會分開追蹤）。遭封鎖的嘗試會回傳 `429` + `Retry-After`。
  - 在非同步 Tailscale Serve Control UI 路徑上，同一個 `{scope, clientIp}` 的失敗嘗試會在寫入失敗前序列化。因此，來自同一用戶端的並行錯誤嘗試可能在第二個請求就觸發限制器，而不是兩者都以一般不相符的形式競速通過。
  - `gateway.auth.rateLimit.exemptLoopback` 預設為 `true`；當你刻意也想限制 localhost 流量時（例如測試設定或嚴格代理部署），請設為 `false`。
- 來自瀏覽器來源的 WS 驗證嘗試一律會受節流，且停用 loopback 豁免（作為針對瀏覽器型 localhost 暴力破解的縱深防禦）。
- 在 loopback 上，這些瀏覽器來源鎖定會依正規化後的 `Origin`
  值隔離，因此來自某個 localhost origin 的重複失敗不會自動
  鎖定另一個 origin。
- `tailscale.mode`: `serve`（僅 tailnet、loopback bind）或 `funnel`（公開，需要驗證）。
- `controlUi.allowedOrigins`: Gateway WebSocket 連線的明確瀏覽器來源允許清單。當預期瀏覽器用戶端來自非 loopback 來源時為必填。
- `controlUi.chatMessageMaxWidth`: 群組化 Control UI 聊天訊息的可選最大寬度。接受受限的 CSS 寬度值，例如 `960px`、`82%`、`min(1280px, 82%)` 與 `calc(100% - 2rem)`。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: 危險模式，會為刻意依賴 Host 標頭來源政策的部署啟用 Host-header origin fallback。
- `remote.transport`: `ssh`（預設）或 `direct`（ws/wss）。對於 `direct`，`remote.url` 必須是 `ws://` 或 `wss://`。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 用戶端處理程序環境中的
  break-glass 覆寫，允許明文 `ws://` 連到受信任的私人網路
  IP；明文的預設仍僅限 loopback。沒有對應的 `openclaw.json`
  設定，且瀏覽器私人網路設定（例如
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`）不會影響 Gateway
  WebSocket 用戶端。
- `gateway.remote.token` / `.password` 是遠端用戶端認證欄位。它們本身不會設定 Gateway 驗證。
- `gateway.push.apns.relay.baseUrl`: 官方/TestFlight iOS 建置在向 Gateway 發布由 relay 支援的註冊後，所使用外部 APNs relay 的 HTTPS 基礎 URL。此 URL 必須符合編譯進 iOS 建置中的 relay URL。
- `gateway.push.apns.relay.timeoutMs`: Gateway 到 relay 的傳送逾時，單位為毫秒。預設為 `10000`。
- 由 relay 支援的註冊會委派給特定 Gateway 身分。已配對的 iOS App 會擷取 `gateway.identity.get`，在 relay 註冊中包含該身分，並將註冊範圍的傳送授權轉送給 Gateway。另一個 Gateway 無法重複使用該已儲存的註冊。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上述 relay 設定的暫時 env 覆寫。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: 僅限開發使用的逃生口，用於 loopback HTTP relay URL。正式環境 relay URL 應維持使用 HTTPS。
- `gateway.handshakeTimeoutMs`: 驗證前 Gateway WebSocket 握手逾時，單位為毫秒。預設值：`15000`。設定 `OPENCLAW_HANDSHAKE_TIMEOUT_MS` 時會優先使用。在負載較高或低效能主機上，當本機用戶端可連線但啟動暖機仍在穩定時，請增加此值。
- `gateway.channelHealthCheckMinutes`: channel health-monitor 間隔，單位為分鐘。設為 `0` 可全域停用 health-monitor 重新啟動。預設值：`5`。
- `gateway.channelStaleEventThresholdMinutes`: stale-socket 閾值，單位為分鐘。請保持此值大於或等於 `gateway.channelHealthCheckMinutes`。預設值：`30`。
- `gateway.channelMaxRestartsPerHour`: 每個 channel/account 在滾動一小時內的 health-monitor 重新啟動上限。預設值：`10`。
- `channels.<provider>.healthMonitor.enabled`: 在保留全域監控啟用的同時，針對各 channel 停用 health-monitor 重新啟動。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 多帳號 channel 的各帳號覆寫。設定後，其優先順序高於 channel 層級覆寫。
- 本機 Gateway 呼叫路徑只有在未設定 `gateway.auth.*` 時，才能使用 `gateway.remote.*` 作為後備。
- 如果透過 SecretRef 明確設定 `gateway.auth.token` / `gateway.auth.password` 且未解析，解析會以 fail closed 方式失敗（不會用遠端後備遮蔽）。
- `trustedProxies`: 終止 TLS 或注入 forwarded-client 標頭的反向代理 IP。只列出你控制的代理。Loopback 項目對同主機代理/本機偵測設定仍然有效（例如 Tailscale Serve 或本機反向代理），但它們**不會**讓 loopback 請求符合 `gateway.auth.mode: "trusted-proxy"` 的資格。
- `allowRealIpFallback`: 當為 `true` 時，若缺少 `X-Forwarded-For`，Gateway 會接受 `X-Real-IP`。預設為 `false`，以維持 fail-closed 行為。
- `gateway.nodes.pairing.autoApproveCidrs`: 可選的 CIDR/IP 允許清單，用於在沒有請求 scopes 時自動核准首次 node device pairing。未設定時停用。這不會自動核准 operator/browser/Control UI/WebChat 配對，也不會自動核准 role、scope、metadata 或 public-key 升級。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: 在配對與平台允許清單評估後，對宣告的 node commands 進行全域 allow/deny shaping。使用 `allowCommands` 可選擇啟用危險的 node commands，例如 `camera.snap`、`camera.clip` 與 `screen.record`；即使平台預設或明確允許原本會包含某個 command，`denyCommands` 也會移除它。當 node 變更其宣告的 command list 後，請拒絕並重新核准該 device pairing，讓 Gateway 儲存更新後的 command snapshot。
- `gateway.tools.deny`: 封鎖 HTTP `POST /tools/invoke` 的額外 tool 名稱（延伸預設 deny list）。
- `gateway.tools.allow`: 從預設 HTTP deny list 移除 tool 名稱。

</Accordion>

### OpenAI 相容端點

- Chat Completions：預設停用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 啟用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 輸入強化：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空的允許清單會視為未設定；使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和/或 `gateway.http.endpoints.responses.images.allowUrl=false` 以停用 URL 擷取。
- 可選的 response 強化標頭：
  - `gateway.http.securityHeaders.strictTransportSecurity`（僅為你控制的 HTTPS origins 設定；請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多執行個體隔離

在一台主機上以唯一連接埠與狀態目錄執行多個 Gateways：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利旗標：`--dev`（使用 `~/.openclaw-dev` + 連接埠 `19001`）、`--profile <name>`（使用 `~/.openclaw-<name>`）。

請參閱[多個 Gateways](/zh-TW/gateway/multiple-gateways)。

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

- `enabled`: 在 Gateway listener 啟用 TLS 終止（HTTPS/WSS）（預設值：`false`）。
- `autoGenerate`: 未設定明確檔案時，自動產生本機自簽憑證/金鑰組；僅供本機/開發使用。
- `certPath`: TLS 憑證檔案的檔案系統路徑。
- `keyPath`: TLS 私密金鑰檔案的檔案系統路徑；請限制權限。
- `caPath`: 用於用戶端驗證或自訂信任鏈的可選 CA bundle 路徑。

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

- `mode`: 控制如何在執行階段套用設定編輯。
  - `"off"`: 忽略即時編輯；變更需要明確重新啟動。
  - `"restart"`: 設定變更時一律重新啟動 Gateway 處理程序。
  - `"hot"`: 不重新啟動，直接在處理程序內套用變更。
  - `"hybrid"`（預設）：先嘗試 hot reload；必要時退回重新啟動。
- `debounceMs`: 套用設定變更前的 debounce 視窗，單位為 ms（非負整數）。
- `deferralTimeoutMs`: 在強制重新啟動前，等待進行中操作的可選最長時間，單位為 ms。省略時使用預設的有界等待（`300000`）；設為 `0` 表示無限期等待，並定期記錄仍在等待的警告。

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
查詢字串 hook 權杖會被拒絕。

驗證與安全注意事項：

- `hooks.enabled=true` 需要非空的 `hooks.token`。
- `hooks.token` 必須與 `gateway.auth.token` **不同**；重複使用 Gateway 權杖會被拒絕。
- `hooks.path` 不能是 `/`；請使用專用子路徑，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，請限制 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果對應或預設集使用範本化的 `sessionKey`，請設定 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。靜態對應鍵不需要這項選擇加入。

**端點：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 只有在 `hooks.allowRequestSessionKey=true`（預設：`false`）時，才接受來自請求酬載的 `sessionKey`。
- `POST /hooks/<name>` → 透過 `hooks.mappings` 解析
  - 由範本算繪的對應 `sessionKey` 值會被視為外部提供，也需要 `hooks.allowRequestSessionKey=true`。

<Accordion title="Mapping details">

- `match.path` 會比對 `/hooks` 之後的子路徑（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 會比對一般路徑的酬載欄位。
- `{{messages[0].subject}}` 這類範本會從酬載讀取資料。
- `transform` 可以指向會回傳 hook 動作的 JS/TS 模組。
  - `transform.module` 必須是相對路徑，且必須留在 `hooks.transformsDir` 內（絕對路徑和路徑穿越會被拒絕）。
  - 請將 `hooks.transformsDir` 保持在 `~/.openclaw/hooks/transforms` 下；工作區 Skills 目錄會被拒絕。如果 `openclaw doctor` 回報此路徑無效，請將轉換模組移至 hooks 轉換目錄，或移除 `hooks.transformsDir`。
- `agentId` 會路由到特定 agent；未知 ID 會退回預設值。
- `allowedAgentIds`：限制明確路由（`*` 或省略 = 全部允許，`[]` = 全部拒絕）。
- `defaultSessionKey`：hook agent 執行時若沒有明確 `sessionKey`，可使用的選用固定工作階段鍵。
- `allowRequestSessionKey`：允許 `/hooks/agent` 呼叫者和範本驅動的對應工作階段鍵設定 `sessionKey`（預設：`false`）。
- `allowedSessionKeyPrefixes`：明確 `sessionKey` 值（請求 + 對應）的選用前綴允許清單，例如 `["hook:"]`。當任何對應或預設集使用範本化 `sessionKey` 時，這會成為必要項。
- `deliver: true` 會將最終回覆傳送到頻道；`channel` 預設為 `last`。
- `model` 會覆寫這次 hook 執行使用的 LLM（如果已設定模型目錄，該模型必須被允許）。

</Accordion>

### Gmail 整合

- 內建 Gmail 預設集使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果你保留該逐訊息路由，請設定 `hooks.allowRequestSessionKey: true`，並限制 `hooks.allowedSessionKeyPrefixes` 以符合 Gmail 命名空間，例如 `["hook:", "hook:gmail:"]`。
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

- Gateway 會在設定後於啟動時自動啟動 `gog gmail watch serve`。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可停用。
- 不要在 Gateway 旁另外執行 `gog gmail watch serve`。

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

- 透過 HTTP 在 Gateway 連接埠下提供 agent 可編輯的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 僅限本機：保持 `gateway.bind: "loopback"`（預設）。
- 非 loopback 繫結：canvas 路由需要 Gateway 驗證（權杖/密碼/受信任代理），與其他 Gateway HTTP 介面相同。
- Node WebViews 通常不會傳送驗證標頭；Node 配對並連線後，Gateway 會公告 Node 範圍的 capability URL，供 canvas/A2UI 存取。
- Capability URL 會繫結到作用中的 Node WS 工作階段，並很快過期。不使用以 IP 為基礎的備援。
- 將即時重新載入用戶端注入已提供的 HTML。
- 空白時會自動建立起始 `index.html`。
- 也會在 `/__openclaw__/a2ui/` 提供 A2UI。
- 變更需要重新啟動 Gateway。
- 大型目錄或 `EMFILE` 錯誤時，請停用即時重新載入。

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
- `full`：包含 `cliPath` + `sshPort`；LAN 多播公告仍需要啟用內建 `bonjour` Plugin。
- `off`：抑制 LAN 多播公告，而不變更 Plugin 啟用狀態。
- 內建 `bonjour` Plugin 會在 macOS 主機上自動啟動，並在 Linux、Windows 和容器化 Gateway 部署中採選擇加入。
- 主機名稱預設為系統主機名稱（當其為有效 DNS 標籤時），否則退回 `openclaw`。使用 `OPENCLAW_MDNS_HOSTNAME` 覆寫。

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
- 完整優先順序請參閱[環境](/zh-TW/help/environment)。

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
- 可與 `$include` 搭配使用。

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
- `source: "exec"` id 不得包含 `.` 或 `..` 這類以斜線分隔的路徑區段（例如 `a/../b` 會被拒絕）

### 支援的憑證介面

- 標準矩陣：[SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)
- `secrets apply` 會以支援的 `openclaw.json` 憑證路徑為目標。
- `auth-profiles.json` 參照會納入執行階段解析與稽核涵蓋範圍。

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

備註：

- `file` 提供者支援 `mode: "json"` 和 `mode: "singleValue"`（在 singleValue 模式中，`id` 必須是 `"value"`）。
- 當 Windows ACL 驗證無法使用時，檔案與 exec 提供者路徑會以關閉狀態失敗。只有在無法驗證的受信任路徑上，才設定 `allowInsecurePath: true`。
- `exec` 提供者需要絕對 `command` 路徑，並在 stdin/stdout 上使用協定酬載。
- 預設會拒絕符號連結命令路徑。設定 `allowSymlinkCommand: true` 可允許符號連結路徑，同時驗證解析後的目標路徑。
- 如果已設定 `trustedDirs`，受信任目錄檢查會套用到解析後的目標路徑。
- `exec` 子環境預設為最小環境；請使用 `passEnv` 明確傳遞必要變數。
- 密鑰參照會在啟用時解析成記憶體內快照，之後請求路徑只會讀取該快照。
- 啟用期間會套用作用中介面篩選：已啟用介面上未解析的參照會導致啟動/重新載入失敗，而非作用中介面會略過並提供診斷。

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

- 每個 agent 的設定檔會儲存在 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 支援值層級參照（靜態憑證模式中，`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- 舊版扁平 `auth-profiles.json` 對應，例如 `{ "provider": { "apiKey": "..." } }`，不是執行階段格式；`openclaw doctor --fix` 會將它們重寫為標準 `provider:default` API 金鑰設定檔，並建立 `.legacy-flat.*.bak` 備份。
- OAuth 模式設定檔（`auth.profiles.<id>.mode = "oauth"`）不支援由 SecretRef 支援的 auth-profile 憑證。
- 靜態執行階段憑證來自記憶體內已解析快照；發現舊版靜態 `auth.json` 項目時會將其清除。
- 舊版 OAuth 會從 `~/.openclaw/credentials/oauth.json` 匯入。
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

- `billingBackoffHours`: 當 profile 因真正的
  帳務/額度不足錯誤而失敗時，以小時為單位的基礎 backoff（預設：`5`）。明確的帳務文字即使在 `401`/`403` 回應中仍可能
  落在這裡，但 provider 專屬的文字
  matcher 會維持限定在擁有它們的 provider 範圍內（例如 OpenRouter
  `Key limit exceeded`）。可重試的 HTTP `402` usage-window 或
  organization/workspace spend-limit 訊息則維持走 `rate_limit` 路徑。
- `billingBackoffHoursByProvider`: 選用的每 provider 帳務 backoff 小時數覆寫。
- `billingMaxHours`: 帳務 backoff 指數成長的小時上限（預設：`24`）。
- `authPermanentBackoffMinutes`: 高信心 `auth_permanent` 失敗的基礎 backoff 分鐘數（預設：`10`）。
- `authPermanentMaxMinutes`: `auth_permanent` backoff 成長的分鐘上限（預設：`60`）。
- `failureWindowHours`: 用於 backoff 計數器的滾動視窗小時數（預設：`24`）。
- `overloadedProfileRotations`: overloaded 錯誤在切換到模型備援前，同一 provider auth-profile 輪替的最大次數（預設：`1`）。`ModelNotReadyException` 這類 provider 忙碌形態會落在這裡。
- `overloadedBackoffMs`: 重試 overloaded provider/profile 輪替前的固定延遲（預設：`0`）。
- `rateLimitedProfileRotations`: rate-limit 錯誤在切換到模型備援前，同一 provider auth-profile 輪替的最大次數（預設：`1`）。該 rate-limit bucket 包含 provider 形態的文字，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 與 `resource exhausted`。

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
- `maxFileBytes`: 輪替前作用中記錄檔的最大大小（位元組）（正整數；預設：`104857600` = 100 MB）。OpenClaw 會在作用中文件旁保留最多五個編號封存檔。
- `redactSensitive` / `redactPatterns`: 對主控台輸出、檔案記錄、OTLP 記錄資料，以及已保存的工作階段 transcript 文字進行盡力遮蔽。`redactSensitive: "off"` 只會停用這個一般記錄/transcript 政策；UI/tool/diagnostic 安全介面仍會在發出前遮蔽密鑰。

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

- `enabled`: instrumentation 輸出的主要開關（預設：`true`）。
- `flags`: 啟用目標記錄輸出的旗標字串陣列（支援 `"telegram.*"` 或 `"*"` 這類萬用字元）。
- `stuckSessionWarnMs`: 無進度時間門檻（毫秒），用於將長時間執行的處理工作階段分類為 `session.long_running`、`session.stalled` 或 `session.stuck`。回覆、工具、狀態、區塊與 ACP 進度會重設計時器；重複的 `session.stuck` 診斷會在未變更時 back off。
- `stuckSessionAbortMs`: 無進度時間門檻（毫秒），超過後符合條件的停滯中作用中工作可被 abort-drained 以進行復原。未設定時，OpenClaw 會使用較安全的延長嵌入式執行視窗，至少為 10 分鐘且為 `stuckSessionWarnMs` 的 5 倍。
- `otel.enabled`: 啟用 OpenTelemetry 匯出管線（預設：`false`）。完整設定、訊號目錄與隱私模型請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。
- `otel.endpoint`: OTel 匯出的 collector URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: 選用的訊號專屬 OTLP endpoint。設定後只會針對該訊號覆寫 `otel.endpoint`。
- `otel.protocol`: `"http/protobuf"`（預設）或 `"grpc"`。
- `otel.headers`: 隨 OTel 匯出請求送出的額外 HTTP/gRPC metadata headers。
- `otel.serviceName`: resource attributes 的服務名稱。
- `otel.traces` / `otel.metrics` / `otel.logs`: 啟用 trace、metrics 或 log 匯出。
- `otel.sampleRate`: trace 取樣率 `0`-`1`。
- `otel.flushIntervalMs`: 週期性 telemetry flush 間隔（毫秒）。
- `otel.captureContent`: 選擇啟用 OTEL span attributes 的原始內容擷取。預設關閉。Boolean `true` 會擷取非系統 message/tool 內容；物件形式可讓你明確啟用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs` 與 `systemPrompt`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: 最新實驗性 GenAI span provider attributes 的環境開關。預設情況下，span 會保留舊版 `gen_ai.system` attribute 以維持相容性；GenAI metrics 使用有界 semantic attributes。
- `OPENCLAW_OTEL_PRELOADED=1`: 已註冊全域 OpenTelemetry SDK 的 host 所用環境開關。OpenClaw 接著會略過 Plugin 擁有的 SDK 啟動/關閉，同時保持 diagnostic listeners 作用中。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 與 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: matching config key 未設定時使用的訊號專屬 endpoint env vars。
- `cacheTrace.enabled`: 為嵌入式執行記錄 cache trace 快照（預設：`false`）。
- `cacheTrace.filePath`: cache trace JSONL 的輸出路徑（預設：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: 控制 cache trace 輸出中包含的內容（全部預設：`true`）。

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

- `channel`: npm/git 安裝的 release channel - `"stable"`、`"beta"` 或 `"dev"`。
- `checkOnStart`: gateway 啟動時檢查 npm 更新（預設：`true`）。
- `auto.enabled`: 啟用套件安裝的背景自動更新（預設：`false`）。
- `auto.stableDelayHours`: stable-channel 自動套用前的最短延遲小時數（預設：`6`；最大值：`168`）。
- `auto.stableJitterHours`: 額外的 stable-channel rollout 分散視窗小時數（預設：`12`；最大值：`168`）。
- `auto.betaCheckIntervalHours`: beta-channel 檢查執行頻率的小時數（預設：`1`；最大值：`24`）。

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

- `enabled`: 全域 ACP 功能 gate（預設：`true`；設為 `false` 可隱藏 ACP dispatch 與 spawn affordances）。
- `dispatch.enabled`: ACP 工作階段 turn dispatch 的獨立 gate（預設：`true`）。設為 `false` 可保留 ACP 指令可用，同時阻止執行。
- `backend`: 預設 ACP runtime backend id（必須符合已註冊的 ACP runtime Plugin）。
  請先安裝 backend Plugin，若已設定 `plugins.allow`，請包含 backend Plugin id（例如 `acpx`），否則 ACP backend 不會載入。
- `defaultAgent`: spawn 未指定明確 target 時的 ACP target agent id 備援。
- `allowedAgents`: 允許用於 ACP runtime sessions 的 agent id allowlist；空值表示沒有額外限制。
- `maxConcurrentSessions`: 同時作用中的 ACP sessions 最大數量。
- `stream.coalesceIdleMs`: streamed text 的閒置 flush 視窗（毫秒）。
- `stream.maxChunkChars`: 分割 streamed block projection 前的最大 chunk 大小。
- `stream.repeatSuppression`: 每個 turn 抑制重複的 status/tool lines（預設：`true`）。
- `stream.deliveryMode`: `"live"` 會增量 stream；`"final_only"` 會緩衝到 turn terminal events。
- `stream.hiddenBoundarySeparator`: hidden tool events 之後、visible text 之前的 separator（預設：`"paragraph"`）。
- `stream.maxOutputChars`: 每個 ACP turn projected 的 assistant output 字元數上限。
- `stream.maxSessionUpdateChars`: projected ACP status/update lines 的最大字元數。
- `stream.tagVisibility`: tag names 到 boolean visibility overrides 的 record，用於 streamed events。
- `runtime.ttlMinutes`: ACP session workers 符合 cleanup 條件前的 idle TTL 分鐘數。
- `runtime.installCommand`: bootstrapping ACP runtime environment 時要執行的選用 install command。

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

- `cli.banner.taglineMode` 控制 banner tagline 樣式：
  - `"random"`（預設）：輪替的有趣/季節性 taglines。
  - `"default"`：固定的中性 tagline（`All your chats, one OpenClaw.`）。
  - `"off"`：不顯示 tagline 文字（仍顯示 banner 標題/版本）。
- 若要隱藏整個 banner（不只是 taglines），請設定 env `OPENCLAW_HIDE_BANNER=1`。

---

## 精靈

CLI 引導式設定流程（`onboard`、`configure`、`doctor`）寫入的 metadata：

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

請參閱 [Agent 預設值](/zh-TW/gateway/config-agents#agent-defaults) 下的 `agents.list` 身分欄位。

---

## 橋接（舊版，已移除）

目前的建置不再包含 TCP 橋接。Nodes 會透過 Gateway WebSocket 連線。`bridge.*` keys 不再是 config schema 的一部分（validation 會失敗直到移除；`openclaw doctor --fix` 可以移除 unknown keys）。

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

- `sessionRetention`：從 `sessions.json` 修剪已完成的隔離 Cron 執行工作階段前，要保留多久。也會控制已封存刪除 Cron 轉錄稿的清理。預設值：`24h`；設為 `false` 可停用。
- `runLog.maxBytes`：修剪前每個執行記錄檔案 (`cron/runs/<jobId>.jsonl`) 的大小上限。預設值：`2_000_000` 位元組。
- `runLog.keepLines`：觸發執行記錄修剪時保留的最新行數。預設值：`2000`。
- `webhookToken`：用於 Cron Webhook POST 傳遞 (`delivery.mode = "webhook"`) 的 bearer token；若省略，則不會傳送驗證標頭。
- `webhook`：已棄用的舊版備援 Webhook URL (http/https)，僅用於仍設有 `notify: true` 的已儲存工作。

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

- `maxAttempts`：一次性工作的暫時性錯誤重試次數上限（預設值：`3`；範圍：`0`-`10`）。
- `backoffMs`：每次重試嘗試的退避延遲陣列，單位為毫秒（預設值：`[30000, 60000, 300000]`；1-10 個項目）。
- `retryOn`：會觸發重試的錯誤類型 - `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略時會重試所有暫時性類型。

僅適用於一次性 Cron 工作。週期性工作使用獨立的失敗處理。

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
- `includeSkipped`：將連續略過的執行計入警示閾值（預設值：`false`）。略過的執行會分開追蹤，且不會影響執行錯誤退避。
- `mode`：傳遞模式 - `"announce"` 透過頻道訊息傳送；`"webhook"` 發佈到已設定的 Webhook。
- `accountId`：可選的帳號或頻道 ID，用於限定警示傳遞範圍。

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
- `mode`：`"announce"` 或 `"webhook"`；當存在足夠目標資料時，預設為 `"announce"`。
- `channel`：announce 傳遞的頻道覆寫。`"last"` 會重用最後已知的傳遞頻道。
- `to`：明確的 announce 目標或 Webhook URL。Webhook 模式需要此項。
- `accountId`：傳遞的可選帳號覆寫。
- 每個工作的 `delivery.failureDestination` 會覆寫此全域預設值。
- 當未設定全域或每個工作的失敗目的地時，已透過 `announce` 傳遞的工作會在失敗時退回到該主要 announce 目標。
- `delivery.failureDestination` 僅支援 `sessionTarget="isolated"` 工作，除非該工作的主要 `delivery.mode` 是 `"webhook"`。

請參閱 [Cron 工作](/zh-TW/automation/cron-jobs)。隔離的 Cron 執行會作為[背景任務](/zh-TW/automation/tasks)追蹤。

---

## 媒體模型範本變數

在 `tools.media.models[].args` 中展開的範本預留位置：

| 變數               | 說明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完整傳入訊息本文                                  |
| `{{RawBody}}`      | 原始本文（無歷史/寄件者包裝）                     |
| `{{BodyStripped}}` | 已移除群組提及的本文                              |
| `{{From}}`         | 寄件者識別碼                                      |
| `{{To}}`           | 目的地識別碼                                      |
| `{{MessageSid}}`   | 頻道訊息 ID                                       |
| `{{SessionId}}`    | 目前工作階段 UUID                                 |
| `{{IsNewSession}}` | 建立新工作階段時為 `"true"`                       |
| `{{MediaUrl}}`     | 傳入媒體 pseudo-URL                               |
| `{{MediaPath}}`    | 本機媒體路徑                                      |
| `{{MediaType}}`    | 媒體類型（image/audio/document/…）                |
| `{{Transcript}}`   | 音訊轉錄稿                                        |
| `{{Prompt}}`       | CLI 項目解析後的媒體提示                          |
| `{{MaxChars}}`     | CLI 項目解析後的最大輸出字元數                    |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                           |
| `{{GroupSubject}}` | 群組主旨（盡力而為）                              |
| `{{GroupMembers}}` | 群組成員預覽（盡力而為）                          |
| `{{SenderName}}`   | 寄件者顯示名稱（盡力而為）                        |
| `{{SenderE164}}`   | 寄件者電話號碼（盡力而為）                        |
| `{{Provider}}`     | 提供者提示（whatsapp、telegram、discord 等）       |

---

## 設定 include (`$include`)

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
- 同層鍵：在 include 後合併（覆寫已 include 的值）。
- 巢狀 include：最多 10 層深。
- 路徑：相對於進行 include 的檔案解析，但必須留在頂層設定目錄內（`openclaw.json` 的 `dirname`）。絕對路徑/`../` 形式只有在解析後仍位於該邊界內時才允許。
- OpenClaw 擁有的寫入若只變更由單一檔案 include 支援的單一頂層區段，會直寫到該 include 的檔案。例如，`plugins install` 會在 `plugins.json5` 中更新 `plugins: { $include: "./plugins.json5" }`，並讓 `openclaw.json` 保持不變。
- 根 include、include 陣列，以及帶有同層覆寫的 include，對 OpenClaw 擁有的寫入是唯讀的；這些寫入會封閉失敗，而不是攤平設定。
- 錯誤：針對遺失檔案、剖析錯誤與循環 include 提供清楚訊息。

---

_相關：[設定](/zh-TW/gateway/configuration) · [設定範例](/zh-TW/gateway/configuration-examples) · [Doctor](/zh-TW/gateway/doctor)_

## 相關

- [設定](/zh-TW/gateway/configuration)
- [設定範例](/zh-TW/gateway/configuration-examples)
