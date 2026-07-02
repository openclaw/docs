---
read_when:
    - 你需要精確的欄位層級設定語意或預設值
    - 您正在驗證頻道、模型、閘道或工具設定區塊
summary: OpenClaw 核心鍵、預設值，以及專用子系統參考連結的閘道設定參考
title: 設定參考
x-i18n:
    generated_at: "2026-07-02T00:43:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d15cc968bc89a7a490a5eaf571d5f38d052ad8783fcc7de5ca17d08ac04bfcc7
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Core config reference for `~/.openclaw/openclaw.json`. For a task-oriented overview, see [Configuration](/zh-TW/gateway/configuration).

Covers the main OpenClaw config surfaces and links out when a subsystem has its own deeper reference. Channel- and plugin-owned command catalogs and deep memory/QMD knobs live on their own pages rather than on this one.

Code truth:

- `openclaw config schema` prints the live JSON Schema used for validation and Control UI, with bundled/plugin/channel metadata merged in when available
- `config.schema.lookup` returns one path-scoped schema node for drill-down tooling
- `pnpm config:docs:check` / `pnpm config:docs:gen` validate the config-doc baseline hash against the current schema surface

Agent lookup path: use the `gateway` tool action `config.schema.lookup` for
exact field-level docs and constraints before edits. Use
[Configuration](/zh-TW/gateway/configuration) for task-oriented guidance and this page
for the broader field map, defaults, and links to subsystem references.

Dedicated deep references:

- [Memory configuration reference](/zh-TW/reference/memory-config) for `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations`, and dreaming config under `plugins.entries.memory-core.config.dreaming`
- [Slash commands](/zh-TW/tools/slash-commands) for the current built-in + bundled command catalog
- owning channel/plugin pages for channel-specific command surfaces

Config format is **JSON5** (comments + trailing commas allowed). All fields are optional - OpenClaw uses safe defaults when omitted.

---

## Channels

Per-channel config keys moved to a dedicated page - see
[Configuration - channels](/zh-TW/gateway/config-channels) for `channels.*`,
including Slack, Discord, Telegram, WhatsApp, Matrix, iMessage, and other
bundled channels (auth, access control, multi-account, mention gating).

## Agent defaults, multi-agent, sessions, and messages

Moved to a dedicated page - see
[Configuration - agents](/zh-TW/gateway/config-agents) for:

- `agents.defaults.*` (workspace, model, thinking, heartbeat, memory, media, skills, sandbox)
- `multiAgent.*` (multi-agent routing and bindings)
- `session.*` (session lifecycle, compaction, pruning)
- `messages.*` (message delivery, TTS, markdown rendering)
- `talk.*` (Talk mode)
  - `talk.consultThinkingLevel`: thinking level override for the full OpenClaw agent run behind Control UI Talk realtime consults
  - `talk.consultFastMode`: one-shot fast-mode override for Control UI Talk realtime consults
  - `talk.speechLocale`: optional BCP 47 locale id for Talk speech recognition on iOS/macOS
  - `talk.silenceTimeoutMs`: when unset, Talk keeps the platform default pause window before sending the transcript (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: Gateway relay fallback for finalized realtime Talk transcripts that skip `openclaw_agent_consult`

## Tools and custom providers

Tool policy, experimental toggles, provider-backed tool config, and custom
provider / base-URL setup moved to a dedicated page - see
[Configuration - tools and custom providers](/zh-TW/gateway/config-tools).

## Models

Provider definitions, model allowlists, and custom provider setup live in
[Configuration - tools and custom providers](/zh-TW/gateway/config-tools#custom-providers-and-base-urls).
The `models` root also owns global model-catalog behavior.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: provider catalog behavior (`merge` or `replace`).
- `models.providers`: custom provider map keyed by provider id.
- `models.providers.*.localService`: optional on-demand process manager for
  local model servers. OpenClaw probes the configured health endpoint, starts
  the absolute `command` when needed, waits for readiness, then sends the model
  request. See [Local model services](/zh-TW/gateway/local-model-services).
- `models.pricing.enabled`: controls the background pricing bootstrap that
  starts after sidecars and channels reach the Gateway ready path. When `false`,
  the Gateway skips OpenRouter and LiteLLM pricing-catalog fetches; configured
  `models.providers.*.models[].cost` values still work for local cost estimates.

## MCP

OpenClaw-managed MCP server definitions live under `mcp.servers` and are
consumed by embedded OpenClaw and other runtime adapters. The `openclaw mcp list`,
`show`, `set`, and `unset` commands manage this block without connecting to the
target server during config edits.

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
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: named stdio or remote MCP server definitions for runtimes that
  expose configured MCP tools.
  Remote entries use `transport: "streamable-http"` or `transport: "sse"`;
  `type: "http"` is a CLI-native alias that `openclaw mcp set` and
  `openclaw doctor --fix` normalize into the canonical `transport` field.
- `mcp.servers.<name>.enabled`: set `false` to keep a saved server definition
  while excluding it from embedded OpenClaw MCP discovery and tool projection.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: per-server MCP request
  timeout in seconds or milliseconds.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: per-server
  connection timeout in seconds or milliseconds.
- `mcp.servers.<name>.supportsParallelToolCalls`: optional concurrency hint for
  adapters that can choose whether to issue parallel MCP tool calls.
- `mcp.servers.<name>.auth`: set `"oauth"` for HTTP MCP servers that require
  OAuth. Run `openclaw mcp login <name>` to store tokens under OpenClaw state.
- `mcp.servers.<name>.oauth`: optional OAuth scope, redirect URL, and client
  metadata URL overrides.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: HTTP TLS controls
  for private endpoints and mutual TLS.
- `mcp.servers.<name>.toolFilter`: optional per-server tool selection. `include`
  limits the discovered MCP tools to matching names; `exclude` hides matching
  names. Entries are exact MCP tool names or simple `*` globs. Servers with
  resources or prompts also generate utility tool names (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), and those names use the
  same filter.
- `mcp.servers.<name>.codex`: optional Codex app-server projection controls.
  This block is OpenClaw metadata for Codex app-server threads only; it does not
  affect ACP sessions, generic Codex harness config, or other runtime adapters.
  Non-empty `codex.agents` limits the server to the listed OpenClaw agent ids.
  Empty, blank, or invalid scoped agent lists are rejected by config validation
  and omitted by the runtime projection path instead of becoming global.
  `codex.defaultToolsApprovalMode` emits Codex's native
  `default_tools_approval_mode` for that server. OpenClaw strips the `codex`
  block before passing native `mcp_servers` config to Codex. Omit the block to
  keep the server projected for every Codex app-server agent with Codex's
  default MCP approval behavior.
- `mcp.sessionIdleTtlMs`: idle TTL for session-scoped bundled MCP runtimes.
  One-shot embedded runs request run-end cleanup; this TTL is the backstop for
  long-lived sessions and future callers.
- Changes under `mcp.*` hot-apply by disposing cached session MCP runtimes.
  The next tool discovery/use recreates them from the new config, so removed
  `mcp.servers` entries are reaped immediately instead of waiting for idle TTL.
- Runtime discovery also honors MCP tool-list change notifications by dropping
  the cached catalog for that session. Servers that advertise resources or
  prompts get utility tools for listing/reading resources and listing/fetching
  prompts. Repeated tool-call failures pause the affected server briefly before
  another call is attempted.

See [MCP](/zh-TW/cli/mcp#openclaw-as-an-mcp-client-registry) and
[CLI backends](/zh-TW/gateway/cli-backends#bundle-mcp-overlays) for runtime behavior.

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
    workshop: {
      allowSymlinkTargetWrites: false,
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

- `allowBundled`: optional allowlist for bundled skills only (managed/workspace skills unaffected).
- `load.extraDirs`: extra shared skill roots (lowest precedence).
- `load.allowSymlinkTargets`: trusted real target roots that skill symlinks may
  resolve into when the link lives outside its configured source root.
- `workshop.allowSymlinkTargetWrites`: allows Skill Workshop apply to write
  through already-trusted symlink targets (default: false).
- `install.preferBrew`: when true, prefer Homebrew installers when `brew` is
  available before falling back to other installer kinds.
- `install.nodeManager`: node installer preference for `metadata.openclaw.install`
  specs (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: allow trusted `operator.admin` Gateway
  clients to install private zip archives staged through `skills.upload.*`
  (default: false). This only enables the uploaded-archive path; normal ClawHub
  installs do not require it.
- `entries.<skillKey>.enabled: false` disables a skill even if bundled/installed.
- `entries.<skillKey>.apiKey`: convenience for skills declaring a primary env var (plaintext string or SecretRef object).

---

## Plugins

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

- 從 `~/.openclaw/extensions` 和 `<workspace>/.openclaw/extensions` 下的套件或 bundle 目錄載入，另外也會載入 `plugins.load.paths` 中列出的檔案或目錄。
- 將獨立外掛檔案放在 `plugins.load.paths`；自動探索的擴充根目錄會忽略頂層 `.js`、`.mjs` 和 `.ts` 檔案，因此這些根目錄中的輔助指令碼不會阻擋啟動。
- 探索接受原生 OpenClaw 外掛，以及相容的 Codex bundle 和 Claude bundle，包括沒有 manifest 的 Claude 預設版面配置 bundle。
- **設定變更需要重新啟動閘道。**
- `allow`：選用允許清單（只載入列出的外掛）。`deny` 優先。
- `plugins.entries.<id>.apiKey`：外掛層級的 API 金鑰便利欄位（外掛支援時）。
- `plugins.entries.<id>.env`：外掛作用域的環境變數對應表。
- `plugins.entries.<id>.hooks.allowPromptInjection`：當為 `false` 時，核心會封鎖 `before_prompt_build`，並忽略舊版 `before_agent_start` 中會變更提示詞的欄位，同時保留舊版 `modelOverride` 和 `providerOverride`。適用於原生外掛 hooks 和受支援的 bundle 提供 hook 目錄。
- `plugins.entries.<id>.hooks.allowConversationAccess`：當為 `true` 時，受信任的非 bundled 外掛可從型別化 hooks 讀取原始對話內容，例如 `llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize` 和 `agent_end`。
- `plugins.entries.<id>.subagent.allowModelOverride`：明確信任此外掛可為背景子代理執行要求每次執行的 `provider` 和 `model` 覆寫。
- `plugins.entries.<id>.subagent.allowedModels`：受信任子代理覆寫可用的標準 `provider/model` 目標選用允許清單。只有在你有意允許任何模型時才使用 `"*"`。
- `plugins.entries.<id>.llm.allowModelOverride`：明確信任此外掛可為 `api.runtime.llm.complete` 要求模型覆寫。
- `plugins.entries.<id>.llm.allowedModels`：受信任外掛 LLM completion 覆寫可用的標準 `provider/model` 目標選用允許清單。只有在你有意允許任何模型時才使用 `"*"`。
- `plugins.entries.<id>.llm.allowAgentIdOverride`：明確信任此外掛可針對非預設代理 id 執行 `api.runtime.llm.complete`。
- `plugins.entries.<id>.config`：外掛定義的設定物件（可用時由原生 OpenClaw 外掛 schema 驗證）。
- 頻道外掛帳號／執行階段設定位於 `channels.<id>` 下，並應由所屬外掛 manifest 的 `channelConfigs` metadata 描述，而不是由中央 OpenClaw 選項登錄表描述。

### Codex 執行框架外掛設定

Bundled `codex` 外掛在 `plugins.entries.codex.config` 下擁有原生 Codex app-server 執行框架設定。完整設定表面請參閱 [Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference)，執行階段模型請參閱 [Codex 執行框架](/zh-TW/plugins/codex-harness)。

`codexPlugins` 只適用於選取原生 Codex 執行框架的工作階段。它不會為 OpenClaw provider 執行、ACP 對話繫結，或任何非 Codex 執行框架啟用 Codex 外掛。

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

- `plugins.entries.codex.config.codexPlugins.enabled`：為 Codex 執行框架啟用原生 Codex 外掛／app 支援。預設值：`false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`：遷移後外掛 app elicitation 的預設破壞性動作政策。使用 `true` 可接受安全的 Codex 核准 schema 而不提示，`false` 可拒絕它們，`"auto"` 可將 Codex 要求的核准透過 OpenClaw 外掛核准路由，或使用 `"ask"` 對每個外掛寫入／破壞性動作提示，且不保留持久核准。`"ask"` 模式會清除受影響 app 的持久 Codex per-tool 核准覆寫，並在 Codex thread 啟動前為該 app 選取人工核准審閱者。預設值：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`：當全域 `codexPlugins.enabled` 也為 true 時，啟用遷移後的外掛項目。明確項目的預設值：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`：穩定的 marketplace 身分。V1 只支援 `"openai-curated"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`：來自遷移的穩定 Codex 外掛身分，例如 `"google-calendar"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`：每個外掛的破壞性動作覆寫。省略時會使用全域 `allow_destructive_actions` 值。每個外掛的值接受相同的 `true`、`false`、`"auto"` 或 `"ask"` 政策。

每個使用 `"ask"` 的准入外掛 app 會將該 app 的核准要求路由給人工審閱者。其他 app 和非 app thread 核准會保留其設定的審閱者，因此混合外掛政策不會繼承 `"ask"` 行為。

`codexPlugins.enabled` 是全域啟用指令。遷移寫入的明確外掛項目是持久安裝與修復資格集合。不支援 `plugins["*"]`，沒有 `install` 開關，而本機 `marketplacePath` 值刻意不作為設定欄位，因為它們是主機特定的。

`app/list` 就緒檢查會快取一小時，並在過期時非同步重新整理。Codex thread app 設定會在 Codex 執行框架工作階段建立時計算，而不是每一輪都計算；變更原生外掛設定後，請使用 `/new`、`/reset` 或重新啟動閘道。

- `plugins.entries.firecrawl.config.webFetch`：Firecrawl web-fetch provider 設定。
  - `apiKey`：用於較高限制的選用 Firecrawl API 金鑰（接受 SecretRef）。會退回使用 `plugins.entries.firecrawl.config.webSearch.apiKey`、舊版 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY` 環境變數。
  - `baseUrl`：Firecrawl API 基底 URL（預設值：`https://api.firecrawl.dev`；自架覆寫必須指向私人／內部端點）。
  - `onlyMainContent`：只擷取頁面的主要內容（預設值：`true`）。
  - `maxAgeMs`：最大快取年齡，以毫秒為單位（預設值：`172800000` / 2 天）。
  - `timeoutSeconds`：擷取要求逾時，以秒為單位（預設值：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok 網頁搜尋）設定。
  - `enabled`：啟用 X Search provider。
  - `model`：用於搜尋的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：記憶夢境整理設定。階段與閾值請參閱 [夢境整理](/zh-TW/concepts/dreaming)。
  - `enabled`：主夢境整理開關（預設值 `false`）。
  - `frequency`：每次完整夢境整理掃描的 cron 節奏（預設為 `"0 3 * * *"`）。
  - `model`：選用的 Dream Diary 子代理模型覆寫。需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`；搭配 `allowedModels` 使用以限制目標。模型不可用錯誤會使用工作階段預設模型重試一次；信任或允許清單失敗不會無聲退回。
  - 階段政策與閾值屬於實作細節（不是使用者可見的設定鍵）。
- 完整記憶設定位於 [記憶設定參考](/zh-TW/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已啟用的 Claude bundle 外掛也可以從 `settings.json` 提供嵌入式 OpenClaw 預設值；OpenClaw 會將其套用為經過清理的代理設定，而不是原始 OpenClaw 設定修補。
- `plugins.slots.memory`：選取作用中的記憶外掛 id，或使用 `"none"` 停用記憶外掛。
- `plugins.slots.contextEngine`：選取作用中的 context engine 外掛 id；除非你安裝並選取其他 engine，否則預設為 `"legacy"`。

請參閱 [外掛](/zh-TW/tools/plugin)。

---

## 承諾事項

`commitments` 控制推斷出的後續記憶：OpenClaw 可以從對話回合偵測 check-in，並透過心跳偵測執行傳遞。

- `commitments.enabled`：為推斷出的後續承諾事項啟用隱藏 LLM 擷取、儲存與心跳偵測傳遞。預設值：`false`。
- `commitments.maxPerDay`：在滾動日內，每個代理工作階段傳遞的推斷後續承諾事項上限。預設值：`3`。

請參閱 [推斷承諾事項](/zh-TW/concepts/commitments)。

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
- `tabCleanup` 會在閒置一段時間後，或當工作階段超過其上限時，回收已追蹤的主要代理分頁。設定 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 可停用這些個別清理模式。
- 未設定時會停用 `ssrfPolicy.dangerouslyAllowPrivateNetwork`，因此瀏覽器導覽預設會保持嚴格。
- 只有在你有意信任私有網路瀏覽器導覽時，才設定 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在嚴格模式中，遠端 CDP 設定檔端點 (`profiles.*.cdpUrl`) 在可達性/探索檢查期間，也會受到相同的私有網路封鎖限制。
- `ssrfPolicy.allowPrivateNetwork` 仍作為舊版別名受到支援。
- 在嚴格模式中，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 來設定明確例外。
- 遠端設定檔僅可附加（停用啟動/停止/重設）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。當你希望 OpenClaw 探索 `/json/version` 時，請使用 HTTP(S)；當你的提供者提供直接的 DevTools WebSocket URL 時，請使用 WS(S)。
- `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 適用於遠端與 `attachOnly` CDP 可達性，以及開啟分頁請求。受管理的 loopback 設定檔會保留本機 CDP 預設值。
- 如果外部管理的 CDP 服務可透過 loopback 存取，請將該設定檔的 `attachOnly: true`；否則 OpenClaw 會將 loopback 連接埠視為本機受管理的瀏覽器設定檔，並可能回報本機連接埠擁有權錯誤。
- `existing-session` 設定檔使用 Chrome MCP 而非 CDP，並且可以在選定主機上或透過已連線的瀏覽器節點附加。
- `existing-session` 設定檔可以設定 `userDataDir`，以指定特定的 Chromium 系瀏覽器設定檔，例如 Brave 或 Edge。
- 當 Chrome 已在 DevTools HTTP(S) 探索端點或直接 WS(S) 端點後方執行時，`existing-session` 設定檔可以設定 `cdpUrl`。在該模式中，OpenClaw 會將端點傳遞給 Chrome MCP，而不是使用自動連線；Chrome MCP 啟動引數會忽略 `userDataDir`。
- `existing-session` 設定檔保留目前的 Chrome MCP 路由限制：使用快照/ref 驅動的動作，而不是 CSS 選擇器目標定位；單檔上傳鉤子；無對話框逾時覆寫；無 `wait --load networkidle`；也沒有 `responsebody`、PDF 匯出、下載攔截或批次動作。
- 本機受管理的 `openclaw` 設定檔會自動指派 `cdpPort` 和 `cdpUrl`；只有遠端 CDP 設定檔或 existing-session 端點附加時，才明確設定 `cdpUrl`。
- 本機受管理的設定檔可以設定 `executablePath`，以覆寫該設定檔的全域 `browser.executablePath`。使用此設定可讓一個設定檔在 Chrome 中執行，另一個在 Brave 中執行。
- 本機受管理的設定檔在程序啟動後，會將 `browser.localLaunchTimeoutMs` 用於 Chrome CDP HTTP 探索，並將 `browser.localCdpReadyTimeoutMs` 用於啟動後 CDP websocket 就緒狀態。在較慢主機上，如果 Chrome 成功啟動但就緒檢查與啟動競爭，請提高這些值。兩個值都必須是最高 `120000` 毫秒的正整數；無效設定值會被拒絕。
- 自動偵測順序：預設瀏覽器（若為 Chromium 系）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 都接受 `~` 和 `~/...`，會在 Chromium 啟動前展開為你的作業系統家目錄。`existing-session` 設定檔上的各設定檔 `userDataDir` 也會展開波浪號。
- 控制服務：僅 loopback（連接埠衍生自 `gateway.port`，預設為 `18791`）。
- `extraArgs` 會將額外啟動旗標附加到本機 Chromium 啟動（例如 `--disable-gpu`、視窗大小調整或除錯旗標）。

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
- `assistant`：Control UI 身分覆寫。會退回使用中的代理身分。

---

## 閘道

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
      url: "ws://127.0.0.1:18789",
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
      // Remove tools from the default HTTP deny list for owner/admin callers
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

<Accordion title="閘道欄位詳細資料">

- `mode`: `local`（執行閘道）或 `remote`（連線到遠端閘道）。除非為 `local`，否則閘道會拒絕啟動。
- `port`: WS + HTTP 的單一多工連接埠。優先順序：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（預設）、`lan`（`0.0.0.0`）、`tailnet`（僅 Tailscale IP），或 `custom`。
- **舊版繫結別名**：請在 `gateway.bind` 使用繫結模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），不要使用主機別名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事項**：預設的 `loopback` 繫結會在容器內的 `127.0.0.1` 監聽。使用 Docker 橋接網路（`-p 18789:18789`）時，流量會抵達 `eth0`，因此閘道無法連上。請使用 `--network host`，或設定 `bind: "lan"`（或使用 `bind: "custom"` 並設定 `customBindHost: "0.0.0.0"`）以在所有介面上監聽。
- **驗證**：預設為必要。非 loopback 繫結需要閘道驗證。實務上，這表示需要共用權杖/密碼，或使用具身分感知能力的反向代理並設定 `gateway.auth.mode: "trusted-proxy"`。入門精靈預設會產生權杖。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRefs），請將 `gateway.auth.mode` 明確設定為 `token` 或 `password`。兩者都設定但未設定模式時，啟動與服務安裝/修復流程會失敗。
- `gateway.auth.mode: "none"`：明確的無驗證模式。僅用於可信任的 local loopback 設定；入門提示刻意不提供此選項。
- `gateway.auth.mode: "trusted-proxy"`：將瀏覽器/使用者驗證委派給具身分感知能力的反向代理，並信任來自 `gateway.trustedProxies` 的身分標頭（請參閱[可信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)）。此模式預設預期使用**非 loopback** 的代理來源；同主機 loopback 反向代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。內部同主機呼叫端可使用 `gateway.auth.password` 作為本機直接備援；`gateway.auth.token` 仍與 trusted-proxy 模式互斥。
- `gateway.auth.allowTailscale`: 當為 `true` 時，Tailscale Serve 身分標頭可滿足控制介面/WebSocket 驗證（透過 `tailscale whois` 驗證）。HTTP API 端點**不會**使用該 Tailscale 標頭驗證；它們會改為遵循閘道的一般 HTTP 驗證模式。此無權杖流程假設閘道主機可信任。當 `tailscale.mode = "serve"` 時預設為 `true`。
- `gateway.auth.rateLimit`: 選用的驗證失敗限制器。依用戶端 IP 與驗證範圍套用（shared-secret 與 device-token 會分開追蹤）。被封鎖的嘗試會回傳 `429` + `Retry-After`。
  - 在非同步 Tailscale Serve 控制介面路徑上，相同 `{scope, clientIp}` 的失敗嘗試會在寫入失敗紀錄前序列化。因此來自同一用戶端的並行錯誤嘗試，可能會在第二個請求就觸發限制器，而不是兩者都以一般不相符狀態競速通過。
  - `gateway.auth.rateLimit.exemptLoopback` 預設為 `true`；當你也刻意想對 localhost 流量限速時（例如測試設定或嚴格代理部署），請設定為 `false`。
- 來自瀏覽器來源的 WS 驗證嘗試一律會被節流，且停用 loopback 豁免（作為防禦瀏覽器型 localhost 暴力破解的縱深防護）。
- 在 loopback 上，這些來自瀏覽器來源的鎖定會依正規化後的 `Origin`
  值隔離，因此某個 localhost 來源的重複失敗不會自動
  鎖定不同來源。
- `tailscale.mode`: `serve`（僅 tailnet、loopback 繫結）或 `funnel`（公開，需要驗證）。
- `tailscale.serviceName`: Serve 模式的選用 Tailscale Service 名稱，例如
  `svc:openclaw`。設定後，OpenClaw 會將它傳給 `tailscale serve
--service`，讓控制介面可透過具名服務公開，而不是透過
  裝置主機名稱公開。該值必須使用 Tailscale 的 `svc:<dns-label>`
  Service 名稱格式；啟動時會回報衍生出的服務 URL。
- `tailscale.preserveFunnel`: 當為 `true` 且 `tailscale.mode = "serve"` 時，OpenClaw
  會在啟動時重新套用 Serve 前檢查 `tailscale funnel status`，若外部設定的 Funnel 路由
  已涵蓋閘道連接埠，則略過套用。
  預設為 `false`。
- `controlUi.allowedOrigins`: 閘道 WebSocket 連線的明確瀏覽器來源允許清單。公開的非 loopback 瀏覽器來源必須設定。從 loopback、RFC1918/link-local、`.local`、`.ts.net` 或 Tailscale CGNAT 主機載入的私有同源 LAN/Tailnet UI 可直接接受，不需要啟用 Host 標頭備援。
- `controlUi.chatMessageMaxWidth`: 群組化控制介面聊天訊息的選用最大寬度。接受受限 CSS 寬度值，例如 `960px`、`82%`、`min(1280px, 82%)` 與 `calc(100% - 2rem)`。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: 危險模式，會為刻意依賴 Host 標頭來源政策的部署啟用 Host 標頭來源備援。
- `remote.transport`: `ssh`（預設）或 `direct`（ws/wss）。對於 `direct`，公開主機的 `remote.url` 必須是 `wss://`；明文 `ws://` 僅接受 loopback、LAN、link-local、`.local`、`.ts.net` 與 Tailscale CGNAT 主機。
- `remote.remotePort`: 遠端 SSH 主機上的閘道連接埠。預設為 `18789`；當本機通道連接埠不同於遠端閘道連接埠時使用此設定。
- `gateway.remote.token` / `.password` 是遠端用戶端憑證欄位。它們本身不會設定閘道驗證。
- `gateway.push.apns.relay.baseUrl`: 外部 APNs 中繼的基底 HTTPS URL，用於中繼支援的 iOS 建置將註冊發佈到閘道之後。公開 App Store/TestFlight 建置會使用代管的 OpenClaw 中繼。自訂中繼 URL 必須對應到刻意分離的 iOS 建置/部署路徑，且該路徑的中繼 URL 指向該中繼。
- `gateway.push.apns.relay.timeoutMs`: 閘道到中繼的傳送逾時，單位為毫秒。預設為 `10000`。
- 中繼支援的註冊會委派給特定閘道身分。配對的 iOS 應用程式會擷取 `gateway.identity.get`，在中繼註冊中包含該身分，並將註冊範圍的傳送授權轉送給閘道。其他閘道無法重複使用該已儲存的註冊。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上述中繼設定的暫時環境覆寫。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: 僅供開發使用的逃生口，用於 loopback HTTP 中繼 URL。正式環境中繼 URL 應維持使用 HTTPS。
- `gateway.handshakeTimeoutMs`: 驗證前閘道 WebSocket 握手逾時，單位為毫秒。預設：`15000`。設定 `OPENCLAW_HANDSHAKE_TIMEOUT_MS` 時會優先採用。若主機負載較高或效能較低，且本機用戶端可能在啟動暖機仍在收斂時連線，請增加此值。
- `gateway.channelHealthCheckMinutes`: 通道健康監控間隔，單位為分鐘。設定 `0` 可全域停用健康監控重新啟動。預設：`5`。
- `gateway.channelStaleEventThresholdMinutes`: 過時 socket 閾值，單位為分鐘。請讓此值大於或等於 `gateway.channelHealthCheckMinutes`。預設：`30`。
- `gateway.channelMaxRestartsPerHour`: 滾動一小時內每個通道/帳號的健康監控重新啟動上限。預設：`10`。
- `channels.<provider>.healthMonitor.enabled`: 每個通道的健康監控重新啟動退出選項，同時保留全域監控啟用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 多帳號通道的每帳號覆寫。設定後會優先於通道層級覆寫。
- 本機閘道呼叫路徑僅在未設定 `gateway.auth.*` 時，才可使用 `gateway.remote.*` 作為備援。
- 如果 `gateway.auth.token` / `gateway.auth.password` 透過 SecretRef 明確設定但無法解析，解析會以關閉方式失敗（不會由遠端備援遮蔽）。
- `trustedProxies`: 終止 TLS 或注入轉送用戶端標頭的反向代理 IP。只列出你控制的代理。loopback 項目對同主機代理/本機偵測設定仍然有效（例如 Tailscale Serve 或本機反向代理），但它們**不會**讓 loopback 請求符合 `gateway.auth.mode: "trusted-proxy"` 的資格。
- `allowRealIpFallback`: 當為 `true` 時，若缺少 `X-Forwarded-For`，閘道會接受 `X-Real-IP`。預設為 `false`，以採用失敗即關閉行為。
- `gateway.nodes.pairing.autoApproveCidrs`: 選用的 CIDR/IP 允許清單，用於自動核准第一次且未要求範圍的節點裝置配對。未設定時會停用。這不會自動核准操作員/瀏覽器/控制介面/WebChat 配對，也不會自動核准角色、範圍、中繼資料或公開金鑰升級。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: 在配對與平台允許清單評估之後，對宣告的節點命令進行全域允許/拒絕塑形。使用 `allowCommands` 選擇加入危險節點命令，例如 `camera.snap`、`camera.clip` 與 `screen.record`；即使平台預設或明確允許本來會包含某個命令，`denyCommands` 也會移除它。節點變更其宣告的命令清單後，請拒絕並重新核准該裝置配對，讓閘道儲存更新後的命令快照。
- `gateway.tools.deny`: 對 HTTP `POST /tools/invoke` 封鎖的額外工具名稱（擴充預設拒絕清單）。
- `gateway.tools.allow`: 從預設 HTTP 拒絕清單中移除工具名稱，供
  擁有者/管理員呼叫端使用。這不會將帶有身分的 `operator.write`
  呼叫端升級為擁有者/管理員存取；即使列入允許清單，`cron`、`gateway` 與 `nodes` 仍
  不提供給非擁有者呼叫端。

</Accordion>

### OpenAI 相容端點

- 管理員 HTTP RPC：預設關閉，作為 `admin-http-rpc` 外掛。啟用此外掛即可註冊 `POST /api/v1/admin/rpc`。請參閱[管理員 HTTP RPC](/zh-TW/plugins/admin-http-rpc)。
- Chat Completions：預設停用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 啟用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 輸入強化：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空的允許清單會視為未設定；使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和/或 `gateway.http.endpoints.responses.images.allowUrl=false` 停用 URL 擷取。
- 選用的回應強化標頭：
  - `gateway.http.securityHeaders.strictTransportSecurity`（僅為你控制的 HTTPS 來源設定；請參閱[可信任代理驗證](/zh-TW/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多執行個體隔離

使用唯一連接埠與狀態目錄，在一台主機上執行多個閘道：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利旗標：`--dev`（使用 `~/.openclaw-dev` + 連接埠 `19001`）、`--profile <name>`（使用 `~/.openclaw-<name>`）。

請參閱[多個閘道](/zh-TW/gateway/multiple-gateways)。

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

- `enabled`: 在閘道監聽器啟用 TLS 終止（HTTPS/WSS）（預設：`false`）。
- `autoGenerate`: 未設定明確檔案時，自動產生本機自簽憑證/金鑰組；僅供本機/開發使用。
- `certPath`: TLS 憑證檔案的檔案系統路徑。
- `keyPath`: TLS 私密金鑰檔案的檔案系統路徑；請限制權限。
- `caPath`: 用於用戶端驗證或自訂信任鏈的選用 CA bundle 路徑。

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

- `mode`：控制執行階段如何套用設定編輯。
  - `"off"`：忽略即時編輯；變更需要明確重新啟動。
  - `"restart"`：設定變更時一律重新啟動閘道程序。
  - `"hot"`：不重新啟動，直接在程序內套用變更。
  - `"hybrid"`（預設）：先嘗試熱重新載入；必要時退回重新啟動。
- `debounceMs`：套用設定變更前的防彈跳視窗，以毫秒為單位（非負整數）。
- `deferralTimeoutMs`：選用的最長等待時間，以毫秒為單位；在強制重新啟動或頻道熱重新載入前，等待進行中的操作完成。省略時使用預設的有界等待（`300000`）；設為 `0` 則無限期等待，並定期記錄仍在等待中的警告。

---

## 鉤子

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
查詢字串鉤子權杖會被拒絕。

驗證與安全注意事項：

- `hooks.enabled=true` 需要非空的 `hooks.token`。
- `hooks.token` 應與作用中的閘道 shared-secret 驗證（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）不同；啟動時若偵測到重複使用，會記錄非致命的安全警告。
- `openclaw security audit` 會將鉤子/閘道驗證重複使用標示為重大發現，包括只在稽核時提供的閘道密碼驗證（`--auth password --password <password>`）。執行 `openclaw doctor --fix` 以輪替已持久化且重複使用的 `hooks.token`，然後更新外部鉤子傳送端以使用新的鉤子權杖。
- `hooks.path` 不能是 `/`；請使用專用子路徑，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，請限制 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果對應或預設使用樣板化的 `sessionKey`，請設定 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。靜態對應鍵不需要這項選擇加入。

**端點：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 只有在 `hooks.allowRequestSessionKey=true` 時，才會接受請求承載中的 `sessionKey`（預設：`false`）。
- `POST /hooks/<name>` → 透過 `hooks.mappings` 解析
  - 由樣板轉譯產生的對應 `sessionKey` 值會被視為外部提供，也需要 `hooks.allowRequestSessionKey=true`。

<Accordion title="對應詳細資料">

- `match.path` 會比對 `/hooks` 之後的子路徑（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 會比對一般路徑的承載欄位。
- 像 `{{messages[0].subject}}` 這樣的樣板會從承載讀取。
- `transform` 可以指向傳回鉤子動作的 JS/TS 模組。
  - `transform.module` 必須是相對路徑，並留在 `hooks.transformsDir` 內（絕對路徑與目錄穿越會被拒絕）。
  - 請將 `hooks.transformsDir` 保持在 `~/.openclaw/hooks/transforms` 下；工作區 Skills 目錄會被拒絕。如果 `openclaw doctor` 回報此路徑無效，請將轉換模組移入鉤子轉換目錄，或移除 `hooks.transformsDir`。
- `agentId` 會路由到特定代理；未知 ID 會退回預設代理。
- `allowedAgentIds`：限制有效的代理路由，包括省略 `agentId` 時的預設代理路徑（`*` 或省略 = 允許全部，`[]` = 全部拒絕）。
- `defaultSessionKey`：沒有明確 `sessionKey` 的鉤子代理執行，可使用選用的固定工作階段鍵。
- `allowRequestSessionKey`：允許 `/hooks/agent` 呼叫端和樣板驅動的對應工作階段鍵設定 `sessionKey`（預設：`false`）。
- `allowedSessionKeyPrefixes`：明確 `sessionKey` 值的選用前綴允許清單（請求 + 對應），例如 `["hook:"]`。當任何對應或預設使用樣板化 `sessionKey` 時，這會成為必要項目。
- `deliver: true` 會將最終回覆傳送到頻道；`channel` 預設為 `last`。
- `model` 會覆寫此鉤子執行的 LLM（如果設定了模型目錄，必須被允許）。

</Accordion>

### Gmail 整合

- 內建 Gmail 預設使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果保留該逐訊息路由，請設定 `hooks.allowRequestSessionKey: true`，並限制 `hooks.allowedSessionKeyPrefixes` 以符合 Gmail 命名空間，例如 `["hook:", "hook:gmail:"]`。
- 如果需要 `hooks.allowRequestSessionKey: false`，請使用靜態 `sessionKey` 覆寫該預設，而不是使用樣板化預設值。

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

- 設定後，閘道會在啟動時自動啟動 `gog gmail watch serve`。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可停用。
- 不要在閘道旁同時執行另一個 `gog gmail watch serve`。

---

## Canvas 外掛主機

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

- 在閘道連接埠下透過 HTTP 提供代理可編輯的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 僅限本機：保留 `gateway.bind: "loopback"`（預設）。
- 非 loopback 繫結：canvas 路由需要閘道驗證（權杖/密碼/受信任代理），與其他閘道 HTTP 表面相同。
- 節點 WebView 通常不會傳送驗證標頭；節點配對並連線後，閘道會公告節點範圍的能力 URL，用於 canvas/A2UI 存取。
- 能力 URL 會綁定到作用中的節點 WS 工作階段，並且很快過期。不使用以 IP 為基礎的備援。
- 將即時重新載入用戶端注入提供的 HTML。
- 空白時自動建立起始 `index.html`。
- 也在 `/__openclaw__/a2ui/` 提供 A2UI。
- 變更需要重新啟動閘道。
- 對大型目錄或 `EMFILE` 錯誤，請停用即時重新載入。

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

- `minimal`（啟用內建 `bonjour` 外掛時的預設）：從 TXT 記錄省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`；LAN 多播廣告仍需要啟用內建 `bonjour` 外掛。
- `off`：不變更外掛啟用狀態的情況下，抑制 LAN 多播廣告。
- 內建 `bonjour` 外掛會在 macOS 主機上自動啟動，在 Linux、Windows 和容器化閘道部署上則為選擇加入。
- 主機名稱預設為系統主機名稱（當它是有效 DNS 標籤時），否則退回 `openclaw`。可使用 `OPENCLAW_MDNS_HOSTNAME` 覆寫。

### 廣域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

在 `~/.openclaw/dns/` 下寫入單點傳播 DNS-SD 區域。若要進行跨網路探索，請搭配 DNS 伺服器（建議使用 CoreDNS）+ Tailscale split DNS。

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
- `.env` 檔案：CWD `.env` + `~/.openclaw/.env`（兩者都不會覆寫既有變數）。
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
- 缺少或空白變數會在設定載入時擲出錯誤。
- 使用 `$${VAR}` 逸出為字面值 `${VAR}`。
- 可與 `$include` 搭配使用。

---

## 機密

機密參照是附加式的：純文字值仍可使用。

### `SecretRef`

使用一種物件形狀：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

驗證：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id：絕對 JSON 指標（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` id 模式：`^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（支援 AWS 風格的 `secret#json_key` 選取器）
- `source: "exec"` ids 不得包含 `.` 或 `..` 斜線分隔路徑區段（例如 `a/../b` 會被拒絕）

### 支援的憑證介面

- 標準矩陣：[SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)
- `secrets apply` 會以支援的 `openclaw.json` 憑證路徑為目標。
- `auth-profiles.json` 參照會包含在執行階段解析與稽核涵蓋範圍中。

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

備註：

- `file` 提供者支援 `mode: "json"` 和 `mode: "singleValue"`（在 singleValue 模式中，`id` 必須是 `"value"`）。
- 當 Windows ACL 驗證不可用時，檔案和 exec 提供者路徑會封閉失敗。僅對無法驗證的受信任路徑設定 `allowInsecurePath: true`。
- `exec` 提供者需要絕對 `command` 路徑，並在 stdin/stdout 上使用協定承載。
- 預設會拒絕符號連結命令路徑。設定 `allowSymlinkCommand: true` 可在驗證解析後的目標路徑時允許符號連結路徑。
- 如果設定了 `trustedDirs`，受信任目錄檢查會套用到解析後的目標路徑。
- `exec` 子環境預設為最小化；請使用 `passEnv` 明確傳遞必要變數。
- 機密參照會在啟用時解析為記憶體內快照，之後請求路徑只會讀取該快照。
- 啟用期間會套用作用中介面篩選：已啟用介面上未解析的參照會導致啟動/重新載入失敗，而非作用中介面會略過並提供診斷資訊。

---

## 驗證儲存

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- 每個代理的設定檔會儲存在 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 支援靜態憑證模式的值層級參照（`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- 舊版扁平 `auth-profiles.json` 對應，例如 `{ "provider": { "apiKey": "..." } }`，不是執行階段格式；`openclaw doctor --fix` 會將它們重寫為標準的 `provider:default` API 金鑰設定檔，並建立 `.legacy-flat.*.bak` 備份。
- OAuth 模式設定檔（`auth.profiles.<id>.mode = "oauth"`）不支援由 SecretRef 支援的驗證設定檔憑證。
- 靜態執行階段憑證來自記憶體中已解析的快照；探索到舊版靜態 `auth.json` 項目時會將其清除。
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

- `billingBackoffHours`：當設定檔因真正的帳單/餘額不足錯誤而失敗時，以小時計算的基礎退避時間（預設：`5`）。明確的帳單文字即使出現在 `401`/`403` 回應中，仍可能落到這裡，但提供者專屬的文字比對器仍限定於擁有它們的提供者範圍內（例如 OpenRouter `Key limit exceeded`）。可重試的 HTTP `402` 用量視窗或組織/工作區支出限制訊息則會留在 `rate_limit` 路徑中。
- `billingBackoffHoursByProvider`：選用的逐提供者帳單退避小時數覆寫。
- `billingMaxHours`：帳單退避指數成長的小時上限（預設：`24`）。
- `authPermanentBackoffMinutes`：高信心 `auth_permanent` 失敗的基礎退避分鐘數（預設：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避成長的分鐘上限（預設：`60`）。
- `failureWindowHours`：退避計數器使用的滾動視窗小時數（預設：`24`）。
- `overloadedProfileRotations`：在切換到模型備援前，針對過載錯誤允許的最大同提供者驗證設定檔輪替次數（預設：`1`）。像 `ModelNotReadyException` 這類提供者忙碌形態會落到這裡。
- `overloadedBackoffMs`：重試過載提供者/設定檔輪替前的固定延遲（預設：`0`）。
- `rateLimitedProfileRotations`：在切換到模型備援前，針對速率限制錯誤允許的最大同提供者驗證設定檔輪替次數（預設：`1`）。該速率限制分類包含提供者形態文字，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`，以及 `resource exhausted`。

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
- `maxFileBytes`：輪替前使用中記錄檔的最大大小，以位元組為單位（正整數；預設：`104857600` = 100 MB）。OpenClaw 會在使用中文件旁保留最多五個編號封存檔。
- `redactSensitive` / `redactPatterns`：對主控台輸出、檔案記錄、OTLP 記錄紀錄，以及持久化工作階段逐字稿文字進行盡力遮蔽。`redactSensitive: "off"` 只會停用這項一般記錄/逐字稿政策；UI/工具/診斷安全介面在發出前仍會遮蔽密鑰。

---

## 診斷

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

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
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
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

- `enabled`：檢測輸出的主開關（預設：`true`）。
- `flags`：啟用目標記錄輸出的旗標字串陣列（支援 `"telegram.*"` 或 `"*"` 等萬用字元）。
- `stuckSessionWarnMs`：用於將長時間執行的處理工作階段分類為 `session.long_running`、`session.stalled` 或 `session.stuck` 的無進度時間門檻，以毫秒為單位。回覆、工具、狀態、區塊與 ACP 進度會重設計時器；重複的 `session.stuck` 診斷在未變更時會退避。
- `stuckSessionAbortMs`：符合資格的停滯中使用中工作在可被中止排空以復原前的無進度時間門檻，以毫秒為單位。未設定時，OpenClaw 會使用較安全的延長嵌入式執行視窗，至少為 5 分鐘且為 `stuckSessionWarnMs` 的 3 倍。
- `memoryPressureSnapshot`：當記憶體壓力達到 `critical` 時，擷取已遮蔽的 OOM 前穩定性快照（預設：`false`）。設為 `true` 可加入穩定性套件檔案掃描/寫入，同時保留一般記憶體壓力事件。
- `otel.enabled`：啟用 OpenTelemetry 匯出管線（預設：`false`）。完整組態、訊號目錄與隱私模型請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。
- `otel.endpoint`：OTel 匯出的收集器 URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`：選用的訊號專屬 OTLP 端點。設定後，它們只會針對該訊號覆寫 `otel.endpoint`。
- `otel.protocol`：`"http/protobuf"`（預設）或 `"grpc"`。
- `otel.headers`：隨 OTel 匯出請求傳送的額外 HTTP/gRPC 中繼資料標頭。
- `otel.serviceName`：資源屬性的服務名稱。
- `otel.traces` / `otel.metrics` / `otel.logs`：啟用追蹤、指標或記錄匯出。
- `otel.logsExporter`：記錄匯出接收端：`"otlp"`（預設）、`"stdout"`（每個 stdout 行一個 JSON 物件），或 `"both"`。
- `otel.sampleRate`：追蹤取樣率 `0`-`1`。
- `otel.flushIntervalMs`：定期遙測清空間隔，以毫秒為單位。
- `otel.captureContent`：選擇加入 OTEL span 屬性的原始內容擷取。預設為關閉。布林值 `true` 會擷取非系統訊息/工具內容；物件形式可讓你明確啟用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt` 和 `toolDefinitions`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`：最新實驗性 GenAI 推論 span 形態的環境開關，包括 `{gen_ai.operation.name} {gen_ai.request.model}` span 名稱、`CLIENT` span 種類，以及以 `gen_ai.provider.name` 取代舊版 `gen_ai.system`。為了相容性，span 預設會保留 `openclaw.model.call` 和 `gen_ai.system`；GenAI 指標會使用有界語意屬性。
- `OPENCLAW_OTEL_PRELOADED=1`：適用於已註冊全域 OpenTelemetry SDK 的主機之環境開關。OpenClaw 接著會略過外掛擁有的 SDK 啟動/關閉，同時保持診斷監聽器作用中。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 和 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`：在相符組態鍵未設定時使用的訊號專屬端點環境變數。
- `cacheTrace.enabled`：記錄嵌入式執行的快取追蹤快照（預設：`false`）。
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

- `channel`：npm/git 安裝的發行通道 - `"stable"`、`"beta"` 或 `"dev"`。
- `checkOnStart`：閘道啟動時檢查 npm 更新（預設：`true`）。
- `auto.enabled`：為套件安裝啟用背景自動更新（預設：`false`）。
- `auto.stableDelayHours`：stable 通道自動套用前的最短延遲，以小時計算（預設：`6`；最大：`168`）。
- `auto.stableJitterHours`：額外的 stable 通道發布分散視窗，以小時計算（預設：`12`；最大：`168`）。
- `auto.betaCheckIntervalHours`：beta 通道檢查執行頻率，以小時計算（預設：`1`；最大：`24`）。

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

- `enabled`：全域 ACP 功能閘門（預設：`true`；設為 `false` 可隱藏 ACP 派發與產生功能入口）。
- `dispatch.enabled`：ACP 工作階段回合派發的獨立閘門（預設：`true`）。設為 `false` 可保留 ACP 命令可用，同時阻止執行。
- `backend`：預設 ACP 執行階段後端 ID（必須符合已註冊的 ACP 執行階段外掛）。
  請先安裝後端外掛；若已設定 `plugins.allow`，請包含後端外掛 ID（例如 `acpx`），否則 ACP 後端不會載入。
- `defaultAgent`：當產生未指定明確目標時使用的備援 ACP 目標代理 ID。
- `allowedAgents`：允許用於 ACP 執行階段工作階段的代理 ID 允許清單；空值表示沒有額外限制。
- `maxConcurrentSessions`：同時作用中 ACP 工作階段的最大數量。
- `stream.coalesceIdleMs`：串流文字的閒置清空視窗，以毫秒為單位。
- `stream.maxChunkChars`：分割串流區塊投影前的最大區塊大小。
- `stream.repeatSuppression`：抑制每個回合中重複的狀態/工具行（預設：`true`）。
- `stream.deliveryMode`：`"live"` 會增量串流；`"final_only"` 會緩衝直到回合終止事件。
- `stream.hiddenBoundarySeparator`：隱藏工具事件後、可見文字前的分隔符（預設：`"paragraph"`）。
- `stream.maxOutputChars`：每個 ACP 回合投影的助理輸出字元上限。
- `stream.maxSessionUpdateChars`：投影 ACP 狀態/更新行的字元上限。
- `stream.tagVisibility`：標籤名稱到串流事件布林可見性覆寫的紀錄。
- `runtime.ttlMinutes`：ACP 工作階段工作程式在符合清理資格前的閒置 TTL，以分鐘為單位。
- `runtime.installCommand`：啟動 ACP 執行階段環境時可執行的選用安裝命令。

---

## 命令列介面

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
  - `"random"`（預設）：輪替的趣味／季節性標語。
  - `"default"`：固定的中性標語（`All your chats, one OpenClaw.`）。
  - `"off"`：沒有標語文字（仍會顯示橫幅標題／版本）。
- 若要隱藏整個橫幅（不只是標語），請設定環境變數 `OPENCLAW_HIDE_BANNER=1`。

---

## 精靈

由命令列介面引導式設定流程（`onboard`、`configure`、`doctor`）寫入的中繼資料：

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## 身分

請參閱 [代理預設值](/zh-TW/gateway/config-agents#agent-defaults) 下的 `agents.list` 身分欄位。

---

## 橋接器（舊版，已移除）

目前建置不再包含 TCP 橋接器。節點會透過閘道 WebSocket 連線。`bridge.*` 鍵不再屬於設定架構的一部分（驗證會失敗，直到移除為止；`openclaw doctor --fix` 可以移除未知鍵）。

<Accordion title="舊版橋接器設定（歷史參考）">

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

## 排程

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 8, // 預設；排程分派 + 隔離式排程代理回合執行
    webhook: "https://example.invalid/legacy", // 已棄用的後備，用於已儲存的 notify:true 工作
    webhookToken: "replace-with-dedicated-token", // 選用的 bearer token，用於外送網路鉤子驗證
    sessionRetention: "24h", // 持續時間字串或 false
    runLog: {
      maxBytes: "2mb", // 預設 2_000_000 位元組
      keepLines: 2000, // 預設 2000
    },
  },
}
```

- `sessionRetention`：在從 `sessions.json` 修剪前，已完成的隔離式排程執行工作階段要保留多久。也會控制已封存刪除排程轉錄的清理。預設：`24h`；設定為 `false` 可停用。
- `runLog.maxBytes`：為了與較舊的檔案後端排程執行記錄相容而接受。預設：`2_000_000` 位元組。
- `runLog.keepLines`：每個工作保留的最新 SQLite 執行歷史列數。預設：`2000`。
- `webhookToken`：用於排程網路鉤子 POST 傳遞（`delivery.mode = "webhook"`）的 bearer token；若省略，則不會傳送驗證標頭。
- `webhook`：已棄用的舊版後備網路鉤子 URL（http/https），由 `openclaw doctor --fix` 用來遷移仍有 `notify: true` 的已儲存工作；執行階段傳遞會使用每個工作的 `delivery.mode="webhook"` 加上 `delivery.to`，或在保留公告傳遞時使用 `delivery.completionDestination`。

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

- `maxAttempts`：排程工作遇到暫時性錯誤時的最大重試次數（預設：`3`；範圍：`0`-`10`）。
- `backoffMs`：每次重試嘗試的退避延遲陣列，單位為毫秒（預設：`[30000, 60000, 300000]`；1-10 個項目）。
- `retryOn`：會觸發重試的錯誤類型 - `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略時會重試所有暫時性類型。

一次性工作會保持啟用，直到重試嘗試耗盡，然後停用並保留最終錯誤狀態。週期性工作使用相同的暫時性重試政策，在下一個排程時段前經過退避後再次執行；永久性錯誤或暫時性重試耗盡時，會回到一般週期性排程並套用錯誤退避。

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

- `enabled`：啟用排程工作的失敗警示（預設：`false`）。
- `after`：警示觸發前的連續失敗次數（正整數，最小值：`1`）。
- `cooldownMs`：同一工作重複警示之間的最小毫秒數（非負整數）。
- `includeSkipped`：將連續略過的執行計入警示閾值（預設：`false`）。略過的執行會分開追蹤，且不會影響執行錯誤退避。
- `mode`：傳遞模式 - `"announce"` 透過頻道訊息傳送；`"webhook"` 發布到已設定的網路鉤子。
- `accountId`：用來限定警示傳遞範圍的選用帳號或頻道 ID。

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

- 所有工作排程失敗通知的預設目的地。
- `mode`：`"announce"` 或 `"webhook"`；當有足夠目標資料時，預設為 `"announce"`。
- `channel`：公告傳遞的頻道覆寫。`"last"` 會重用最後已知的傳遞頻道。
- `to`：明確的公告目標或網路鉤子 URL。網路鉤子模式必填。
- `accountId`：傳遞的選用帳號覆寫。
- 每個工作的 `delivery.failureDestination` 會覆寫此全域預設值。
- 當未設定全域或每工作失敗目的地時，已透過 `announce` 傳遞的工作會在失敗時退回到其主要公告目標。
- `delivery.failureDestination` 僅支援 `sessionTarget="isolated"` 工作，除非該工作的主要 `delivery.mode` 是 `"webhook"`。

請參閱 [排程工作](/zh-TW/automation/cron-jobs)。隔離式排程執行會作為[背景工作](/zh-TW/automation/tasks)追蹤。

---

## 媒體模型範本變數

在 `tools.media.models[].args` 中展開的範本預留位置：

| 變數               | 說明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完整的傳入訊息本文                                |
| `{{RawBody}}`      | 原始本文（沒有歷史／傳送者包裝）                  |
| `{{BodyStripped}}` | 已移除群組提及的本文                              |
| `{{From}}`         | 傳送者識別碼                                      |
| `{{To}}`           | 目的地識別碼                                      |
| `{{MessageSid}}`   | 頻道訊息 ID                                       |
| `{{SessionId}}`    | 目前的工作階段 UUID                               |
| `{{IsNewSession}}` | 建立新工作階段時為 `"true"`                       |
| `{{MediaUrl}}`     | 傳入媒體偽 URL                                    |
| `{{MediaPath}}`    | 本機媒體路徑                                      |
| `{{MediaType}}`    | 媒體類型（影像／音訊／文件／...）                 |
| `{{Transcript}}`   | 音訊轉錄                                          |
| `{{Prompt}}`       | 命令列介面項目的已解析媒體提示                    |
| `{{MaxChars}}`     | 命令列介面項目的已解析最大輸出字元數              |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                           |
| `{{GroupSubject}}` | 群組主題（盡力而為）                              |
| `{{GroupMembers}}` | 群組成員預覽（盡力而為）                          |
| `{{SenderName}}`   | 傳送者顯示名稱（盡力而為）                        |
| `{{SenderE164}}`   | 傳送者電話號碼（盡力而為）                        |
| `{{Provider}}`     | 供應商提示（whatsapp、telegram、discord 等）      |

---

## 設定包含項（`$include`）

將設定拆分成多個檔案：

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
- 檔案陣列：依序深度合併（後者會覆寫前者）。
- 同層鍵：在包含項之後合併（覆寫已包含的值）。
- 巢狀包含項：最多 10 層深。
- 路徑：相對於包含它的檔案解析，但必須留在最上層設定目錄（`openclaw.json` 的 `dirname`）內。絕對／`../` 形式僅在仍解析到該邊界內時允許。路徑不得包含 null 位元組，且在解析前後都必須嚴格短於 4096 個字元。
- OpenClaw 擁有的寫入若只變更由單檔包含項支援的一個最上層區段，會寫入該包含檔案。例如，`plugins install` 會在 `plugins.json5` 中更新 `plugins: { $include: "./plugins.json5" }`，並保持 `openclaw.json` 不變。
- 根包含項、包含項陣列，以及帶有同層覆寫的包含項，對 OpenClaw 擁有的寫入是唯讀；這些寫入會失敗關閉，而不是扁平化設定。
- 錯誤：針對缺少檔案、剖析錯誤、循環包含項、無效路徑格式和過長長度提供清楚訊息。

---

_相關：[設定](/zh-TW/gateway/configuration) · [設定範例](/zh-TW/gateway/configuration-examples) · [Doctor](/zh-TW/gateway/doctor)_

## 相關

- [設定](/zh-TW/gateway/configuration)
- [設定範例](/zh-TW/gateway/configuration-examples)
