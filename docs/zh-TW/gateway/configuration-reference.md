---
read_when:
    - 你需要精確的欄位層級設定語意或預設值
    - 你正在驗證通道、模型、閘道或工具設定區塊
summary: 閘道設定參考，涵蓋核心 OpenClaw 鍵、預設值，以及專用子系統參考連結
title: 設定參考
x-i18n:
    generated_at: "2026-07-03T23:26:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1365e40b17122e9a029e294baf12db2dd974b3c2686ed1f2e9cf2a46757fa356
    source_path: gateway/configuration-reference.md
    workflow: 16
---

核心設定參考，適用於 `~/.openclaw/openclaw.json`。如需以任務為導向的概覽，請參閱[設定](/zh-TW/gateway/configuration)。

涵蓋主要 OpenClaw 設定介面；若子系統有更深入的專屬參考，則連結至對應頁面。頻道與外掛擁有的命令目錄，以及深層記憶體/QMD 調整項，位於各自頁面，而不是本頁。

程式碼真相：

- `openclaw config schema` 會印出用於驗證與 Control UI 的即時 JSON Schema；若可用，會合併內建/外掛/頻道中繼資料
- `config.schema.lookup` 會傳回一個限定路徑範圍的結構描述節點，供深入檢視工具使用
- `pnpm config:docs:check` / `pnpm config:docs:gen` 會依照目前的結構描述介面驗證設定文件基準雜湊

Agent 查找路徑：編輯前，請使用 `gateway` 工具動作 `config.schema.lookup` 取得
精確的欄位層級文件與限制。使用
[設定](/zh-TW/gateway/configuration) 取得以任務為導向的指引，並使用本頁
取得更廣泛的欄位地圖、預設值，以及子系統參考連結。

專屬深入參考：

- [記憶體設定參考](/zh-TW/reference/memory-config)，適用於 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及 `plugins.entries.memory-core.config.dreaming` 底下的夢境整理設定
- [斜線命令](/zh-TW/tools/slash-commands)，適用於目前的內建 + 內建隨附命令目錄
- 擁有者頻道/外掛頁面，適用於頻道特定命令介面

設定格式為 **JSON5**（允許註解與尾隨逗號）。所有欄位皆為選填 - 省略時 OpenClaw 會使用安全預設值。

---

## 頻道

各頻道設定鍵已移至專屬頁面 - 請參閱
[設定 - 頻道](/zh-TW/gateway/config-channels) 了解 `channels.*`，
包括 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage，以及其他
內建隨附頻道（驗證、存取控制、多帳號、提及閘控）。

## Agent 預設值、多 Agent、工作階段與訊息

已移至專屬頁面 - 請參閱
[設定 - Agent](/zh-TW/gateway/config-agents) 了解：

- `agents.defaults.*`（工作區、模型、思考、心跳偵測、記憶體、媒體、Skills、沙盒）
- `multiAgent.*`（多 Agent 路由與繫結）
- `session.*`（工作階段生命週期、壓縮、修剪）
- `messages.*`（訊息傳遞、TTS、Markdown 算繪）
- `talk.*`（Talk 模式）
  - `talk.consultThinkingLevel`：Control UI Talk 即時諮詢背後完整 OpenClaw Agent 執行的思考層級覆寫
  - `talk.consultFastMode`：Control UI Talk 即時諮詢的一次性快速模式覆寫
  - `talk.speechLocale`：Talk 在 iOS/macOS 上語音辨識的選用 BCP 47 語言環境 ID
  - `talk.silenceTimeoutMs`：未設定時，Talk 會在傳送轉錄稿前保留平台預設暫停視窗（`macOS 和 Android 為 700 ms，iOS 為 900 ms`）
  - `talk.realtime.consultRouting`：針對跳過 `openclaw_agent_consult` 的已完成即時 Talk 轉錄稿的閘道中繼後援

## 工具與自訂提供者

工具政策、實驗性切換、提供者支援的工具設定，以及自訂
提供者 / base-URL 設定已移至專屬頁面 - 請參閱
[設定 - 工具與自訂提供者](/zh-TW/gateway/config-tools)。

## 模型

提供者定義、模型允許清單，以及自訂提供者設定位於
[設定 - 工具與自訂提供者](/zh-TW/gateway/config-tools#custom-providers-and-base-urls)。
`models` 根目錄也擁有全域模型目錄行為。

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`：提供者目錄行為（`merge` 或 `replace`）。
- `models.providers`：以提供者 ID 為鍵的自訂提供者對應。
- `models.providers.*.localService`：本機模型伺服器的選用隨需程序管理器。OpenClaw 會探測已設定的健康狀態端點，在需要時啟動絕對路徑 `command`，等待就緒，然後送出模型請求。請參閱[本機模型服務](/zh-TW/gateway/local-model-services)。
- `models.pricing.enabled`：控制在 sidecar 與頻道到達閘道就緒路徑後啟動的背景定價啟動流程。設為 `false` 時，閘道會略過 OpenRouter 與 LiteLLM 定價目錄擷取；已設定的 `models.providers.*.models[].cost` 值仍可用於本機成本估算。

## MCP

OpenClaw 管理的 MCP 伺服器定義位於 `mcp.servers` 底下，並由內嵌 OpenClaw 與其他執行階段配接器使用。`openclaw mcp list`、`show`、`set` 和 `unset` 命令會管理此區塊，而不會在設定編輯期間連線至目標伺服器。

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

- `mcp.servers`：具名 stdio 或遠端 MCP 伺服器定義，供公開已設定 MCP 工具的執行階段使用。
  遠端項目使用 `transport: "streamable-http"` 或 `transport: "sse"`；
  `type: "http"` 是命令列介面原生別名，`openclaw mcp set` 和
  `openclaw doctor --fix` 會將其正規化為標準 `transport` 欄位。
- `mcp.servers.<name>.enabled`：設為 `false` 可保留已儲存的伺服器定義，
  同時將它排除於內嵌 OpenClaw MCP 探索與工具投射之外。
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`：各伺服器 MCP 請求
  逾時，以秒或毫秒為單位。
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`：各伺服器
  連線逾時，以秒或毫秒為單位。
- `mcp.servers.<name>.supportsParallelToolCalls`：供配接器使用的選用並行提示，
  讓配接器可選擇是否發出並行 MCP 工具呼叫。
- `mcp.servers.<name>.auth`：對需要 OAuth 的 HTTP MCP 伺服器設為 `"oauth"`。執行 `openclaw mcp login <name>`，將權杖儲存在 OpenClaw 狀態下。
- `mcp.servers.<name>.oauth`：選用 OAuth 範圍、重新導向 URL，以及用戶端中繼資料 URL 覆寫。
- `mcp.servers.<name>.sslVerify`、`clientCert`、`clientKey`：私有端點與雙向 TLS 的 HTTP TLS 控制。
- `mcp.servers.<name>.toolFilter`：選用的各伺服器工具選擇。`include`
  會將已探索的 MCP 工具限制為相符名稱；`exclude` 會隱藏相符
  名稱。項目是精確 MCP 工具名稱或簡單 `*` glob。有
  資源或提示的伺服器也會產生公用工具名稱（`resources_list`、
  `resources_read`、`prompts_list`、`prompts_get`），且這些名稱使用
  相同篩選器。
- `mcp.servers.<name>.codex`：選用 Codex app-server 投射控制。
  此區塊僅為 Codex app-server 執行緒的 OpenClaw 中繼資料；不會
  影響 ACP 工作階段、通用 Codex harness 設定，或其他執行階段配接器。
  非空的 `codex.agents` 會將伺服器限制為列出的 OpenClaw Agent ID。
  空白、空字串或無效的限定範圍 Agent 清單會被設定驗證拒絕，
  且執行階段投射路徑會省略它們，而不是使其成為全域。
  `codex.defaultToolsApprovalMode` 會為該伺服器發出 Codex 原生的
  `default_tools_approval_mode`。OpenClaw 會在將原生 `mcp_servers`
  設定傳給 Codex 前移除 `codex` 區塊。省略此區塊可讓伺服器
  以 Codex 預設 MCP 核准行為投射到每個 Codex app-server Agent。
- `mcp.sessionIdleTtlMs`：工作階段範圍內建 MCP 執行階段的閒置 TTL。
  一次性內嵌執行會要求執行結束清理；此 TTL 是長生命週期工作階段
  與未來呼叫者的後備機制。
- `mcp.*` 底下的變更會透過處置快取的工作階段 MCP 執行階段熱套用。
  下一次工具探索/使用會從新設定重新建立它們，因此移除的
  `mcp.servers` 項目會立即收割，而不是等待閒置 TTL。
- 執行階段探索也會透過捨棄該工作階段的快取目錄，遵循 MCP 工具清單變更通知。
  宣告資源或提示的伺服器會取得用於列出/讀取資源，以及列出/擷取
  提示的公用工具。重複的工具呼叫失敗會讓受影響的伺服器短暫暫停，
  然後才嘗試另一個呼叫。

請參閱 [MCP](/zh-TW/cli/mcp#openclaw-as-an-mcp-client-registry) 和
[命令列介面後端](/zh-TW/gateway/cli-backends#bundle-mcp-overlays) 了解執行階段行為。

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

- `allowBundled`：僅適用於內建 Skills 的選用允許清單（受管理/工作區 Skills 不受影響）。
- `load.extraDirs`：額外共享 Skill 根目錄（最低優先順序）。
- `load.allowSymlinkTargets`：受信任的真實目標根目錄，當 Skill 符號連結位於其設定來源根目錄之外時，可解析至這些目錄。
- `workshop.allowSymlinkTargetWrites`：允許 Skill Workshop apply 透過已受信任的符號連結目標寫入（預設：false）。
- `install.preferBrew`：為 true 時，若 `brew` 可用，會優先使用 Homebrew 安裝器，再後援至其他安裝器類型。
- `install.nodeManager`：`metadata.openclaw.install` 規格的節點安裝器偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`：允許受信任的 `operator.admin` 閘道用戶端安裝透過 `skills.upload.*` 暫存的私有 zip 封存（預設：false）。這只會啟用上傳封存路徑；一般 ClawHub 安裝不需要它。
- `entries.<skillKey>.enabled: false` 會停用某項 Skill，即使它是內建或已安裝。
- `entries.<skillKey>.apiKey`：供宣告主要環境變數的 Skills 使用的便利設定（明文字串或 SecretRef 物件）。

---

## 外掛

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

- 從 `~/.openclaw/extensions` 和 `<workspace>/.openclaw/extensions` 下的套件或 bundle 目錄載入，也會載入 `plugins.load.paths` 中列出的檔案或目錄。
- 將獨立外掛檔案放在 `plugins.load.paths`；自動探索的擴充根目錄會忽略頂層 `.js`、`.mjs` 和 `.ts` 檔案，因此這些根目錄中的輔助腳本不會阻擋啟動。
- 探索會接受原生 OpenClaw 外掛，以及相容的 Codex bundles 和 Claude bundles，包括沒有 manifest 的 Claude 預設版面配置 bundles。
- **設定變更需要重新啟動閘道。**
- `allow`：選用允許清單（只載入列出的外掛）。`deny` 優先。
- `plugins.entries.<id>.apiKey`：外掛層級 API key 便利欄位（外掛支援時）。
- `plugins.entries.<id>.env`：外掛範圍的環境變數對應表。
- `plugins.entries.<id>.hooks.allowPromptInjection`：為 `false` 時，核心會封鎖 `before_prompt_build`，並忽略舊版 `before_agent_start` 中會改動 prompt 的欄位，同時保留舊版 `modelOverride` 和 `providerOverride`。套用於原生外掛 hooks，以及支援的 bundle 提供 hook 目錄。
- `plugins.entries.<id>.hooks.allowConversationAccess`：為 `true` 時，受信任的非 bundled 外掛可以從型別化 hooks 讀取原始對話內容，例如 `llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize` 和 `agent_end`。
- `plugins.entries.<id>.subagent.allowModelOverride`：明確信任此外掛可為背景子代理執行要求每次執行的 `provider` 和 `model` 覆寫。
- `plugins.entries.<id>.subagent.allowedModels`：受信任子代理覆寫可用的 canonical `provider/model` 目標選用允許清單。只有在你有意允許任何模型時才使用 `"*"`。
- `plugins.entries.<id>.llm.allowModelOverride`：明確信任此外掛可為 `api.runtime.llm.complete` 要求模型覆寫。
- `plugins.entries.<id>.llm.allowedModels`：受信任外掛 LLM completion 覆寫可用的 canonical `provider/model` 目標選用允許清單。只有在你有意允許任何模型時才使用 `"*"`。
- `plugins.entries.<id>.llm.allowAgentIdOverride`：明確信任此外掛可針對非預設代理 ID 執行 `api.runtime.llm.complete`。
- `plugins.entries.<id>.config`：外掛定義的設定物件（可用時由原生 OpenClaw 外掛 schema 驗證）。
- 頻道外掛帳號／執行階段設定位於 `channels.<id>` 下，並應由擁有此外掛的 manifest `channelConfigs` metadata 描述，而不是由中央 OpenClaw 選項登錄描述。

### Codex harness 外掛設定

Bundled `codex` 外掛在
`plugins.entries.codex.config` 下擁有原生 Codex app-server harness 設定。完整設定
介面請參閱
[Codex harness 參考](/zh-TW/plugins/codex-harness-reference)，執行階段模型請參閱 [Codex harness](/zh-TW/plugins/codex-harness)。

`codexPlugins` 只套用於選取原生 Codex harness 的工作階段。
它不會為 OpenClaw provider 執行、ACP
對話綁定，或任何非 Codex harness 啟用 Codex 外掛。

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

- `plugins.entries.codex.config.codexPlugins.enabled`：為 Codex harness 啟用原生 Codex
  外掛／app 支援。預設值：`false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`：
  遷移後外掛 app elicitations 的預設破壞性動作政策。
  使用 `true` 可在不提示的情況下接受安全的 Codex approval schemas，`false`
  可拒絕它們，`"auto"` 可透過 OpenClaw
  外掛 approvals 路由 Codex 必要 approvals，或使用 `"ask"` 對每個外掛寫入／破壞性
  動作進行提示，且不保留 durable approval。`"ask"` 模式會清除受影響 app 的 durable Codex
  per-tool approval overrides，並在 Codex thread 啟動前為該 app 選取人工
  approvals reviewer。
  預設值：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`：當全域 `codexPlugins.enabled` 也為 true 時，啟用
  遷移後的外掛項目。
  預設值：明確項目為 `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`：
  穩定的 marketplace identity。V1 只支援 `"openai-curated"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`：來自遷移的穩定
  Codex 外掛 identity，例如 `"google-calendar"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`：
  每個外掛的破壞性動作覆寫。省略時會使用全域
  `allow_destructive_actions` 值。每個外掛的值接受相同的
  `true`、`false`、`"auto"` 或 `"ask"` 政策。

每個使用 `"ask"` 的已准入外掛 app 會將該 app 的 approval requests
路由給人工 reviewer。其他 apps 與非 app thread approvals 會保留其
已設定的 reviewer，因此混合外掛政策不會繼承 `"ask"` 行為。

`codexPlugins.enabled` 是全域啟用指令。由遷移寫入的明確外掛
項目，是 durable install 與 repair eligibility set。
不支援 `plugins["*"]`，沒有 `install` 開關，且 local
`marketplacePath` 值有意不作為設定欄位，因為它們是
host-specific。

`app/list` readiness checks 會快取一小時，並在過期時
非同步重新整理。Codex thread app config 會在 Codex harness
工作階段建立時運算，而不是每一輪都運算；變更原生外掛設定後，請使用 `/new`、`/reset` 或重新啟動閘道。

- `plugins.entries.firecrawl.config.webFetch`：Firecrawl web-fetch provider 設定。
  - `apiKey`：提高限制用的選用 Firecrawl API key（接受 SecretRef）。會 fallback 至 `plugins.entries.firecrawl.config.webSearch.apiKey`、舊版 `tools.web.fetch.firecrawl.apiKey`，或 `FIRECRAWL_API_KEY` 環境變數。
  - `baseUrl`：Firecrawl API base URL（預設值：`https://api.firecrawl.dev`；self-hosted 覆寫必須指向 private/internal endpoints）。
  - `onlyMainContent`：只從頁面擷取主要內容（預設值：`true`）。
  - `maxAgeMs`：最大快取時間，以毫秒為單位（預設值：`172800000` / 2 天）。
  - `timeoutSeconds`：scrape request timeout，以秒為單位（預設值：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok web search）設定。
  - `enabled`：啟用 X Search provider。
  - `model`：搜尋要使用的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：記憶夢境整理設定。階段與 thresholds 請參閱 [夢境整理](/zh-TW/concepts/dreaming)。
  - `enabled`：主要夢境整理開關（預設值 `false`）。
  - `frequency`：每次完整夢境整理 sweep 的 cron 節奏（預設為 `"0 3 * * *"`）。
  - `model`：選用的 Dream Diary 子代理模型覆寫。需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`；搭配 `allowedModels` 可限制目標。模型不可用錯誤會使用工作階段預設模型重試一次；信任或允許清單失敗不會靜默 fallback。
  - 階段政策與 thresholds 是實作細節（不是面向使用者的設定鍵）。
- 完整記憶設定位於 [記憶設定參考](/zh-TW/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已啟用的 Claude bundle 外掛也可以從 `settings.json` 貢獻嵌入式 OpenClaw 預設值；OpenClaw 會將其套用為 sanitized agent settings，而不是原始 OpenClaw 設定 patches。
- `plugins.slots.memory`：選擇作用中的記憶外掛 ID，或使用 `"none"` 停用記憶外掛。
- `plugins.slots.contextEngine`：選擇作用中的 context engine 外掛 ID；除非你安裝並選取其他 engine，否則預設為 `"legacy"`。

請參閱 [外掛](/zh-TW/tools/plugin)。

---

## Commitments

`commitments` 控制推斷出的 follow-up 記憶：OpenClaw 可以從對話輪次偵測 check-ins，並透過心跳偵測執行傳遞。

- `commitments.enabled`：為推斷出的 follow-up commitments 啟用隱藏 LLM extraction、storage 和心跳偵測 delivery。預設值：`false`。
- `commitments.maxPerDay`：在 rolling day 中，每個代理工作階段可傳遞的推斷 follow-up commitments 上限。預設值：`3`。

請參閱 [推斷 commitments](/zh-TW/concepts/commitments)。

---

## Browser

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
- `tabCleanup` 會在閒置時間後或工作階段超過上限時，回收已追蹤的主要代理分頁。設定 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 可停用這些個別清理模式。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` 未設定時會停用，因此瀏覽器導覽預設保持嚴格。
- 只有在你有意信任私有網路瀏覽器導覽時，才設定 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在嚴格模式下，遠端 CDP 設定檔端點（`profiles.*.cdpUrl`）在可達性/探索檢查期間，也會受到相同的私有網路封鎖。
- `ssrfPolicy.allowPrivateNetwork` 仍支援作為舊版別名。
- 在嚴格模式下，請使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 來設定明確例外。
- 遠端設定檔僅能附加（已停用啟動/停止/重設）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  當你希望 OpenClaw 探索 `/json/version` 時使用 HTTP(S)；當你的提供者給你直接的 DevTools WebSocket URL 時使用 WS(S)。
- `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 適用於遠端與
  `attachOnly` CDP 可達性以及開啟分頁請求。受管理的 loopback
  設定檔會保留本機 CDP 預設值。
- 如果可透過 loopback 存取外部管理的 CDP 服務，請將該設定檔的
  `attachOnly: true`；否則 OpenClaw 會將 loopback 連接埠視為本機受管理的瀏覽器設定檔，並可能回報本機連接埠擁有權錯誤。
- `existing-session` 設定檔使用 Chrome MCP 而非 CDP，並可附加到所選主機或透過已連線的瀏覽器節點附加。
- `existing-session` 設定檔可以設定 `userDataDir`，以指定特定的
  Chromium 系瀏覽器設定檔，例如 Brave 或 Edge。
- `existing-session` 設定檔可以在 Chrome 已於 DevTools HTTP(S) 探索端點或直接 WS(S) 端點後方執行時設定 `cdpUrl`。在該模式下，OpenClaw 會將端點傳遞給 Chrome MCP，而不是使用自動連線；`userDataDir` 會在 Chrome MCP 啟動引數中被忽略。
- `existing-session` 設定檔會保留目前 Chrome MCP 路由限制：
  使用快照/ref 驅動的動作而非 CSS 選擇器目標、單檔上傳
  hook、沒有對話方塊逾時覆寫、沒有 `wait --load networkidle`，也沒有
  `responsebody`、PDF 匯出、下載攔截或批次動作。
- 本機受管理的 `openclaw` 設定檔會自動指派 `cdpPort` 和 `cdpUrl`；只有遠端 CDP 設定檔或 existing-session 端點附加時，才明確設定
  `cdpUrl`。
- 本機受管理的設定檔可以設定 `executablePath`，以覆寫該設定檔的全域
  `browser.executablePath`。可用此方式讓一個設定檔使用 Chrome，另一個使用 Brave。
- 本機受管理的設定檔會在程序啟動後，使用 `browser.localLaunchTimeoutMs` 進行 Chrome CDP HTTP
  探索，並使用 `browser.localCdpReadyTimeoutMs` 進行啟動後 CDP websocket 就緒檢查。在 Chrome 可成功啟動但就緒檢查與啟動競速的較慢主機上，請提高這些值。兩個值都必須是最高 `120000` ms 的正整數；無效的設定值會被拒絕。
- 自動偵測順序：預設瀏覽器（若為 Chromium 系）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 在 Chromium 啟動前，都接受 `~` 和 `~/...` 作為你的 OS 家目錄。
  `existing-session` 設定檔上的個別設定檔 `userDataDir` 也會展開波浪號。
- 控制服務：僅 loopback（連接埠衍生自 `gateway.port`，預設 `18791`）。
- `extraArgs` 會將額外啟動旗標附加到本機 Chromium 啟動（例如
  `--disable-gpu`、視窗大小或除錯旗標）。

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
- `assistant`：Control UI 身分覆寫。會退回使用作用中代理身分。

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

<Accordion title="閘道欄位詳細資訊">

- `mode`: `local`（執行閘道）或 `remote`（連線到遠端閘道）。除非設為 `local`，否則閘道會拒絕啟動。
- `port`: WS + HTTP 的單一多工連接埠。優先順序：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（預設）、`lan`（`0.0.0.0`）、`tailnet`（僅 Tailscale IP），或 `custom`。
- **舊版 bind 別名**：請在 `gateway.bind` 使用 bind 模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），而不是主機別名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事項**：預設的 `loopback` bind 會在容器內監聽 `127.0.0.1`。使用 Docker bridge 網路（`-p 18789:18789`）時，流量會抵達 `eth0`，因此閘道無法連線。請使用 `--network host`，或設定 `bind: "lan"`（或使用 `bind: "custom"` 搭配 `customBindHost: "0.0.0.0"`）以監聽所有介面。
- **驗證**：預設為必要。非 loopback bind 需要閘道驗證。實務上，這表示需要共用權杖/密碼，或搭配 `gateway.auth.mode: "trusted-proxy"` 的身分感知反向代理。入門精靈預設會產生權杖。
- 如果同時設定 `gateway.auth.token` 和 `gateway.auth.password`（包含 SecretRefs），請明確將 `gateway.auth.mode` 設為 `token` 或 `password`。兩者皆已設定但未設定模式時，啟動與服務安裝/修復流程會失敗。
- `gateway.auth.mode: "none"`：明確的無驗證模式。僅用於受信任的 local loopback 設定；入門提示刻意不提供此選項。
- `gateway.auth.mode: "trusted-proxy"`：將瀏覽器/使用者驗證委派給身分感知反向代理，並信任來自 `gateway.trustedProxies` 的身分標頭（請參閱 [受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)）。此模式預設預期代理來源為**非 loopback**；同主機 loopback 反向代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。內部同主機呼叫端可使用 `gateway.auth.password` 作為本機直接備援；`gateway.auth.token` 仍與 trusted-proxy 模式互斥。
- `gateway.auth.allowTailscale`: 設為 `true` 時，Tailscale Serve 身分標頭可滿足控制介面/WebSocket 驗證（透過 `tailscale whois` 驗證）。HTTP API 端點**不會**使用該 Tailscale 標頭驗證；它們會改依閘道的一般 HTTP 驗證模式。此無權杖流程假設閘道主機受信任。當 `tailscale.mode = "serve"` 時預設為 `true`。
- `gateway.auth.rateLimit`: 選用的驗證失敗限制器。依用戶端 IP 與驗證範圍套用（shared-secret 與 device-token 會獨立追蹤）。遭封鎖的嘗試會回傳 `429` + `Retry-After`。
  - 在非同步 Tailscale Serve 控制介面路徑上，相同 `{scope, clientIp}` 的失敗嘗試會在寫入失敗前序列化。因此，同一用戶端的並行錯誤嘗試可能會在第二個請求觸發限制器，而不是兩者都只作為一般不相符競速通過。
  - `gateway.auth.rateLimit.exemptLoopback` 預設為 `true`；當你刻意也要對 localhost 流量限速時（例如測試設定或嚴格代理部署），請設為 `false`。
- 瀏覽器來源的 WS 驗證嘗試一律會被節流，且停用 loopback 豁免（針對瀏覽器型 localhost 暴力嘗試的縱深防禦）。
- 在 loopback 上，這些瀏覽器來源鎖定會依正規化後的 `Origin`
  值隔離，因此來自某個 localhost origin 的重複失敗不會自動
  鎖定不同 origin。
- `tailscale.mode`: `serve`（僅 tailnet，loopback bind）或 `funnel`（公開，需要驗證）。
- `tailscale.serviceName`: Serve 模式的選用 Tailscale Service 名稱，例如
  `svc:openclaw`。設定後，OpenClaw 會將其傳給 `tailscale serve
--service`，讓控制介面可透過具名 Service 公開，而不是透過
  裝置主機名稱。此值必須使用 Tailscale 的 `svc:<dns-label>`
  Service 名稱格式；啟動時會回報衍生的 Service URL。
- `tailscale.preserveFunnel`: 當設為 `true` 且 `tailscale.mode = "serve"` 時，OpenClaw
  會在啟動時重新套用 Serve 前檢查 `tailscale funnel status`，如果外部設定的 Funnel 路由已涵蓋閘道連接埠，則略過套用。
  預設為 `false`。
- `controlUi.allowedOrigins`: 閘道 WebSocket 連線的明確瀏覽器來源允許清單。公開非 loopback 瀏覽器來源需要設定此項。來自 loopback、RFC1918/link-local、`.local`、`.ts.net` 或 Tailscale CGNAT 主機的私有 same-origin LAN/Tailnet 介面載入，不需要啟用 Host-header 備援即可接受。
- `controlUi.chatMessageMaxWidth`: 分組控制介面聊天訊息的選用最大寬度。接受受限的 CSS 寬度值，例如 `960px`、`82%`、`min(1280px, 82%)` 和 `calc(100% - 2rem)`。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: 危險模式，會為刻意依賴 Host-header origin 原則的部署啟用 Host-header origin 備援。
- `remote.transport`: `ssh`（預設）或 `direct`（ws/wss）。對於 `direct`，公開主機的 `remote.url` 必須是 `wss://`；明文 `ws://` 僅接受 loopback、LAN、link-local、`.local`、`.ts.net` 與 Tailscale CGNAT 主機。
- `remote.remotePort`: 遠端 SSH 主機上的閘道連接埠。預設為 `18789`；當本機通道連接埠不同於遠端閘道連接埠時使用此項。
- `remote.sshHostKeyPolicy`: macOS SSH 通道主機金鑰原則。`strict` 為預設，且需要已受信任的金鑰。`openssh` 是明確選擇使用受管理別名的有效 OpenSSH 設定；使用前請檢視相符的使用者與系統 SSH 設定。macOS 應用程式與 `configure-remote` 在變更目標時會將此原則重設為 `strict`，除非再次明確選擇。
- `gateway.remote.token` / `.password` 是遠端用戶端認證欄位。它們本身不會設定閘道驗證。
- `gateway.push.apns.relay.baseUrl`: 外部 APNs relay 的 HTTPS 基底 URL，用於 relay 支援的 iOS 建置將註冊發布到閘道之後。公開 App Store 建置使用託管的 OpenClaw relay。自訂 relay URL 必須符合刻意分離的 iOS 建置/部署路徑，且該路徑的 relay URL 指向該 relay。
- `gateway.push.apns.relay.timeoutMs`: 閘道到 relay 的傳送逾時，單位為毫秒。預設為 `10000`。
- relay 支援的註冊會委派給特定閘道身分。配對的 iOS 應用程式會擷取 `gateway.identity.get`，在 relay 註冊中包含該身分，並將註冊範圍的傳送授權轉送給閘道。另一個閘道無法重用該已儲存註冊。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上述 relay 設定的暫時環境覆寫。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: 僅供開發使用的逃生開關，用於 loopback HTTP relay URL。正式環境 relay URL 應維持使用 HTTPS。
- `gateway.handshakeTimeoutMs`: 驗證前閘道 WebSocket 握手逾時，單位為毫秒。預設：`15000`。設定 `OPENCLAW_HANDSHAKE_TIMEOUT_MS` 時會優先採用。在負載較高或低功耗主機上，若本機用戶端可連線但啟動暖機仍在穩定中，請增加此值。
- `gateway.channelHealthCheckMinutes`: 頻道健康監控間隔，單位為分鐘。設為 `0` 可全域停用健康監控重啟。預設：`5`。
- `gateway.channelStaleEventThresholdMinutes`: stale-socket 閾值，單位為分鐘。請保持大於或等於 `gateway.channelHealthCheckMinutes`。預設：`30`。
- `gateway.channelMaxRestartsPerHour`: 每個頻道/帳號在滾動一小時內的健康監控重啟上限。預設：`10`。
- `channels.<provider>.healthMonitor.enabled`: 每個頻道的選擇退出，可在保留全域監控啟用的同時停用健康監控重啟。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 多帳號頻道的每帳號覆寫。設定後會優先於頻道層級覆寫。
- 本機閘道呼叫路徑只有在未設定 `gateway.auth.*` 時，才能使用 `gateway.remote.*` 作為備援。
- 如果 `gateway.auth.token` / `gateway.auth.password` 明確透過 SecretRef 設定且未解析，解析會以關閉方式失敗（不會被遠端備援遮蔽）。
- `trustedProxies`: 終止 TLS 或注入轉送用戶端標頭的反向代理 IP。僅列出你控制的代理。loopback 項目對同主機代理/本機偵測設定仍然有效（例如 Tailscale Serve 或本機反向代理），但它們**不會**讓 loopback 請求符合 `gateway.auth.mode: "trusted-proxy"` 資格。
- `allowRealIpFallback`: 設為 `true` 時，如果缺少 `X-Forwarded-For`，閘道會接受 `X-Real-IP`。預設為 `false`，採用失敗關閉行為。
- `gateway.nodes.pairing.autoApproveCidrs`: 選用的 CIDR/IP 允許清單，可在沒有要求範圍時自動核准首次節點裝置配對。未設定時停用。這不會自動核准操作者/瀏覽器/控制介面/網頁聊天配對，也不會自動核准角色、範圍、中繼資料或公開金鑰升級。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: 在配對與平台允許清單評估後，對已宣告節點命令進行全域允許/拒絕塑形。使用 `allowCommands` 可選擇啟用危險節點命令，例如 `camera.snap`、`camera.clip` 和 `screen.record`；即使平台預設或明確允許原本會包含某個命令，`denyCommands` 也會移除該命令。節點變更其宣告命令清單後，請拒絕並重新核准該裝置配對，讓閘道儲存更新後的命令快照。
- `gateway.tools.deny`: 針對 HTTP `POST /tools/invoke` 封鎖的額外工具名稱（延伸預設拒絕清單）。
- `gateway.tools.allow`: 從擁有者/管理員呼叫端的預設 HTTP 拒絕清單移除工具名稱。
  這不會將帶有身分的 `operator.write` 呼叫端升級為擁有者/管理員存取；即使列入允許清單，`cron`、`gateway` 與 `nodes` 仍然
  不可供非擁有者呼叫端使用。

</Accordion>

### OpenAI 相容端點

- 管理員 HTTP RPC：預設關閉，作為 `admin-http-rpc` 外掛。啟用此外掛以註冊 `POST /api/v1/admin/rpc`。請參閱 [管理員 HTTP RPC](/zh-TW/plugins/admin-http-rpc)。
- Chat Completions：預設停用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 啟用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 輸入強化：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空的允許清單會視為未設定；請使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和/或 `gateway.http.endpoints.responses.images.allowUrl=false` 停用 URL 擷取。
- 選用回應強化標頭：
  - `gateway.http.securityHeaders.strictTransportSecurity`（僅為你控制的 HTTPS origin 設定；請參閱 [受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多執行個體隔離

使用唯一的連接埠與狀態目錄，在同一台主機上執行多個閘道：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利旗標：`--dev`（使用 `~/.openclaw-dev` + 連接埠 `19001`）、`--profile <name>`（使用 `~/.openclaw-<name>`）。

請參閱 [多重閘道](/zh-TW/gateway/multiple-gateways)。

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

- `mode`：控制設定編輯在執行階段如何套用。
  - `"off"`：忽略即時編輯；變更需要明確重新啟動。
  - `"restart"`：設定變更時一律重新啟動閘道程序。
  - `"hot"`：不重新啟動，在程序內套用變更。
  - `"hybrid"`（預設）：先嘗試熱重新載入；必要時退回重新啟動。
- `debounceMs`：套用設定變更前的防抖視窗，單位為 ms（非負整數）。
- `deferralTimeoutMs`：選用的最長等待時間，單位為 ms，用於在強制重新啟動或通道熱重新載入前等待進行中的操作。省略可使用預設的有界等待（`300000`）；設為 `0` 則無限期等待，並定期記錄仍在等待的警告。

---

## 掛鉤

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
- `hooks.token` 應與有效的閘道 shared-secret 驗證（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）不同；啟動時若偵測到重複使用，會記錄非致命的安全警告。
- `openclaw security audit` 會將掛鉤/閘道驗證重複使用標記為嚴重發現項目，包括僅在稽核時提供的閘道密碼驗證（`--auth password --password <password>`）。執行 `openclaw doctor --fix` 以輪替已持久化且重複使用的 `hooks.token`，然後更新外部掛鉤傳送端以使用新的掛鉤權杖。
- `hooks.path` 不能是 `/`；請使用專用子路徑，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，請限制 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果對應或預設使用樣板化的 `sessionKey`，請設定 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。靜態對應鍵不需要此選擇加入。

**端點：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 只有在 `hooks.allowRequestSessionKey=true`（預設：`false`）時，才接受來自請求酬載的 `sessionKey`。
- `POST /hooks/<name>` → 透過 `hooks.mappings` 解析
  - 樣板轉譯的對應 `sessionKey` 值會被視為外部提供，也需要 `hooks.allowRequestSessionKey=true`。

<Accordion title="對應詳細資訊">

- `match.path` 會比對 `/hooks` 之後的子路徑（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 會比對一般路徑的酬載欄位。
- 像 `{{messages[0].subject}}` 這樣的樣板會從酬載讀取。
- `transform` 可指向回傳掛鉤動作的 JS/TS 模組。
  - `transform.module` 必須是相對路徑，且保留在 `hooks.transformsDir` 內（絕對路徑和路徑穿越會被拒絕）。
  - 將 `hooks.transformsDir` 保持在 `~/.openclaw/hooks/transforms` 之下；工作區 Skills 目錄會被拒絕。如果 `openclaw doctor` 回報此路徑無效，請將轉換模組移入掛鉤轉換目錄，或移除 `hooks.transformsDir`。
- `agentId` 會路由至特定代理；未知 ID 會退回預設代理。
- `allowedAgentIds`：限制有效的代理路由，包括省略 `agentId` 時的預設代理路徑（`*` 或省略 = 全部允許，`[]` = 全部拒絕）。
- `defaultSessionKey`：選用的固定工作階段鍵，用於沒有明確 `sessionKey` 的掛鉤代理執行。
- `allowRequestSessionKey`：允許 `/hooks/agent` 呼叫端和樣板驅動的對應工作階段鍵設定 `sessionKey`（預設：`false`）。
- `allowedSessionKeyPrefixes`：明確 `sessionKey` 值（請求 + 對應）的選用前綴允許清單，例如 `["hook:"]`。當任何對應或預設使用樣板化的 `sessionKey` 時，這會成為必要設定。
- `deliver: true` 會將最終回覆傳送至通道；`channel` 預設為 `last`。
- `model` 會覆寫此掛鉤執行的 LLM（如果已設定模型目錄，則必須允許）。

</Accordion>

### Gmail 整合

- 內建 Gmail 預設使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果保留該逐訊息路由，請設定 `hooks.allowRequestSessionKey: true`，並限制 `hooks.allowedSessionKeyPrefixes` 以符合 Gmail 命名空間，例如 `["hook:", "hook:gmail:"]`。
- 如果需要 `hooks.allowRequestSessionKey: false`，請使用靜態 `sessionKey` 覆寫預設，而不是使用樣板化預設。

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

- 設定後，閘道會在開機時自動啟動 `gog gmail watch serve`。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可停用。
- 不要在閘道旁另外執行 `gog gmail watch serve`。

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
- 僅限本機：保持 `gateway.bind: "loopback"`（預設）。
- 非 local loopback 繫結：canvas 路由需要閘道驗證（權杖/密碼/受信任代理），與其他閘道 HTTP 介面相同。
- 節點 WebView 通常不會傳送驗證標頭；節點配對並連線後，閘道會公布節點範圍的能力 URL，用於 canvas/A2UI 存取。
- 能力 URL 綁定至有效的節點 WS 工作階段，且很快到期。不使用基於 IP 的退回機制。
- 將即時重新載入用戶端注入提供的 HTML。
- 空白時自動建立入門 `index.html`。
- 也在 `/__openclaw__/a2ui/` 提供 A2UI。
- 變更需要重新啟動閘道。
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

- `minimal`（啟用內建 `bonjour` 外掛時的預設）：從 TXT 記錄省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`；LAN 多播廣告仍需啟用內建 `bonjour` 外掛。
- `off`：在不變更外掛啟用狀態的情況下抑制 LAN 多播廣告。
- 內建 `bonjour` 外掛會在 macOS 主機上自動啟動，在 Linux、Windows 和容器化閘道部署上需選擇加入。
- 主機名稱預設為系統主機名稱（當它是有效 DNS 標籤時），否則退回 `openclaw`。使用 `OPENCLAW_MDNS_HOSTNAME` 覆寫。

### 廣域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

在 `~/.openclaw/dns/` 下寫入單播 DNS-SD 區域。若要跨網路探索，請搭配 DNS 伺服器（建議 CoreDNS）+ Tailscale split DNS。

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
- `.env` 檔案：CWD `.env` + `~/.openclaw/.env`（兩者都不會覆寫既有變數）。
- `shellEnv`：從登入 shell 設定檔匯入缺少的預期鍵。
- 完整優先順序請參閱[環境](/zh-TW/help/environment)。

### 環境變數替換

在任何設定字串中以 `${VAR_NAME}` 參照環境變數：

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 只會比對大寫名稱：`[A-Z_][A-Z0-9_]*`。
- 缺少/空白變數會在設定載入時拋出錯誤。
- 使用 `$${VAR}` 逸出，以表示字面 `${VAR}`。
- 可與 `$include` 搭配使用。

---

## 密鑰

密鑰參照是加成式的：純文字值仍可使用。

### `SecretRef`

使用一種物件形狀：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

驗證：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id：絕對 JSON 指標（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` id 模式：`^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（支援 AWS 風格的 `secret#json_key` 選擇器）
- `source: "exec"` id 不得包含 `.` 或 `..` 斜線分隔路徑片段（例如 `a/../b` 會被拒絕）

### 支援的憑證介面

- 標準矩陣：[SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)
- `secrets apply` 目標為支援的 `openclaw.json` 憑證路徑。
- `auth-profiles.json` 參照會包含在執行階段解析和稽核涵蓋範圍中。

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

- `file` 提供者支援 `mode: "json"` 和 `mode: "singleValue"`（在 singleValue 模式中，`id` 必須是 `"value"`）。
- 當 Windows ACL 驗證不可用時，檔案和 exec 提供者路徑會以關閉失敗方式處理。僅對無法驗證的受信任路徑設定 `allowInsecurePath: true`。
- `exec` 提供者需要絕對 `command` 路徑，並在 stdin/stdout 上使用協定酬載。
- 預設會拒絕 symlink 命令路徑。設定 `allowSymlinkCommand: true` 可允許 symlink 路徑，同時驗證解析後的目標路徑。
- 如果已設定 `trustedDirs`，受信任目錄檢查會套用於解析後的目標路徑。
- `exec` 子環境預設為最小化；請使用 `passEnv` 明確傳遞必要變數。
- 密鑰參照會在啟用時解析至記憶體內快照，之後請求路徑只讀取該快照。
- 啟用期間會套用有效介面篩選：已啟用介面上未解析的參照會導致啟動/重新載入失敗，而非有效介面會略過並附診斷資訊。

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

- 每個代理程式的設定檔會儲存在 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 支援靜態憑證模式的值層級參照（`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- 舊版扁平 `auth-profiles.json` 對應（例如 `{ "provider": { "apiKey": "..." } }`）不是執行階段格式；`openclaw doctor --fix` 會將它們改寫為標準的 `provider:default` API 金鑰設定檔，並建立 `.legacy-flat.*.bak` 備份。
- OAuth 模式設定檔（`auth.profiles.<id>.mode = "oauth"`）不支援以 SecretRef 為後端的 auth-profile 憑證。
- 靜態執行階段憑證來自記憶體中已解析的快照；發現舊版靜態 `auth.json` 項目時會將其清除。
- 舊版 OAuth 會從 `~/.openclaw/credentials/oauth.json` 匯入。
- 請參閱 [OAuth](/zh-TW/concepts/oauth)。
- Secrets 執行階段行為與 `audit/configure/apply` 工具：[Secrets Management](/zh-TW/gateway/secrets)。

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

- `billingBackoffHours`：當設定檔因真正的帳務/點數不足錯誤而失敗時的基礎退避時間（小時，預設值：`5`）。明確的帳務文字即使出現在 `401`/`403` 回應中，仍可能歸到這裡，但提供者專屬的文字比對器會限定在擁有它們的提供者範圍內（例如 OpenRouter `Key limit exceeded`）。可重試的 HTTP `402` 使用量時窗或組織/工作區支出上限訊息則會留在 `rate_limit` 路徑中。
- `billingBackoffHoursByProvider`：選用的每提供者帳務退避小時數覆寫。
- `billingMaxHours`：帳務退避指數成長的小時上限（預設值：`24`）。
- `authPermanentBackoffMinutes`：高可信度 `auth_permanent` 失敗的基礎退避時間（分鐘，預設值：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避成長的分鐘上限（預設值：`60`）。
- `failureWindowHours`：退避計數器使用的滾動時窗（小時，預設值：`24`）。
- `overloadedProfileRotations`：在切換到模型備援前，因過載錯誤可進行的同提供者 auth-profile 輪替次數上限（預設值：`1`）。像 `ModelNotReadyException` 這類提供者忙碌形態會歸到這裡。
- `overloadedBackoffMs`：重試過載提供者/設定檔輪替前的固定延遲（預設值：`0`）。
- `rateLimitedProfileRotations`：在切換到模型備援前，因速率限制錯誤可進行的同提供者 auth-profile 輪替次數上限（預設值：`1`）。該速率限制分類包含提供者形態的文字，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 和 `resource exhausted`。

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
- `maxFileBytes`：輪替前作用中記錄檔的最大大小（位元組，正整數；預設值：`104857600` = 100 MB）。OpenClaw 會在作用中文件旁保留最多五個編號封存檔。
- `redactSensitive` / `redactPatterns`：對主控台輸出、檔案記錄、OTLP 記錄紀錄和持久化的工作階段轉錄文字進行盡力而為的遮罩。`redactSensitive: "off"` 只會停用這項一般記錄/轉錄政策；UI/工具/診斷安全介面仍會在發出前遮蔽祕密。

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

- `enabled`：檢測輸出的主開關（預設值：`true`）。
- `flags`：啟用目標記錄輸出的旗標字串陣列（支援像 `"telegram.*"` 或 `"*"` 這樣的萬用字元）。
- `stuckSessionWarnMs`：用於將長時間執行的處理工作階段分類為 `session.long_running`、`session.stalled` 或 `session.stuck` 的無進度時間門檻（毫秒）。回覆、工具、狀態、區塊和 ACP 進度會重設計時器；重複的 `session.stuck` 診斷在未變更時會退避。
- `stuckSessionAbortMs`：符合條件的停滯中作用中工作可為復原而中止並排空前的無進度時間門檻（毫秒）。未設定時，OpenClaw 會使用較安全的延長嵌入式執行時窗，至少為 5 分鐘且為 `stuckSessionWarnMs` 的 3 倍。
- `memoryPressureSnapshot`：當記憶體壓力達到 `critical` 時擷取已遮蔽的 OOM 前穩定性快照（預設值：`false`）。設為 `true` 可在保留一般記憶體壓力事件的同時，加入穩定性套件檔案掃描/寫入。
- `otel.enabled`：啟用 OpenTelemetry 匯出管線（預設值：`false`）。完整設定、訊號目錄和隱私模型請參閱 [OpenTelemetry export](/zh-TW/gateway/opentelemetry)。
- `otel.endpoint`：OTel 匯出的收集器 URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`：選用的訊號專屬 OTLP 端點。設定後，只會覆寫該訊號的 `otel.endpoint`。
- `otel.protocol`：`"http/protobuf"`（預設）或 `"grpc"`。
- `otel.headers`：隨 OTel 匯出請求傳送的額外 HTTP/gRPC 中繼資料標頭。
- `otel.serviceName`：資源屬性的服務名稱。
- `otel.traces` / `otel.metrics` / `otel.logs`：啟用追蹤、指標或記錄匯出。
- `otel.logsExporter`：記錄匯出接收端：`"otlp"`（預設）、`"stdout"`（每行 stdout 一個 JSON 物件）或 `"both"`。
- `otel.sampleRate`：追蹤取樣率 `0`-`1`。
- `otel.flushIntervalMs`：定期遙測清除間隔（毫秒）。
- `otel.captureContent`：選擇性擷取 OTEL span 屬性的原始內容。預設關閉。布林值 `true` 會擷取非系統訊息/工具內容；物件形式可讓你明確啟用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt` 和 `toolDefinitions`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`：最新版實驗性 GenAI 推論 span 形態的環境開關，包括 `{gen_ai.operation.name} {gen_ai.request.model}` span 名稱、`CLIENT` span kind，以及使用 `gen_ai.provider.name` 取代舊版 `gen_ai.system`。預設情況下，span 會保留 `openclaw.model.call` 和 `gen_ai.system` 以維持相容性；GenAI 指標使用有界語意屬性。
- `OPENCLAW_OTEL_PRELOADED=1`：用於已註冊全域 OpenTelemetry SDK 的主機的環境開關。OpenClaw 接著會略過外掛擁有的 SDK 啟動/關閉，同時保持診斷監聽器作用中。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 和 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`：在相符設定鍵未設定時使用的訊號專屬端點環境變數。
- `cacheTrace.enabled`：記錄嵌入式執行的快取追蹤快照（預設值：`false`）。
- `cacheTrace.filePath`：快取追蹤 JSONL 的輸出路徑（預設值：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制快取追蹤輸出包含的內容（全部預設為：`true`）。

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
- `checkOnStart`：閘道啟動時檢查 npm 更新（預設值：`true`）。
- `auto.enabled`：為套件安裝啟用背景自動更新（預設值：`false`）。
- `auto.stableDelayHours`：穩定通道自動套用前的最短延遲（小時，預設值：`6`；最大值：`168`）。
- `auto.stableJitterHours`：穩定通道額外的推出分散時窗（小時，預設值：`12`；最大值：`168`）。
- `auto.betaCheckIntervalHours`：beta 通道檢查執行頻率（小時，預設值：`1`；最大值：`24`）。

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

- `enabled`：全域 ACP 功能閘門（預設值：`true`；設為 `false` 可隱藏 ACP 分派與產生操作入口）。
- `dispatch.enabled`：ACP 工作階段回合分派的獨立閘門（預設值：`true`）。設為 `false` 可在保留 ACP 命令可用的同時封鎖執行。
- `backend`：預設 ACP 執行階段後端 ID（必須符合已註冊的 ACP 執行階段外掛）。
  請先安裝後端外掛；如果設定了 `plugins.allow`，請包含後端外掛 ID（例如 `acpx`），否則 ACP 後端將不會載入。
- `defaultAgent`：當產生項目未指定明確目標時的備援 ACP 目標代理程式 ID。
- `allowedAgents`：允許用於 ACP 執行階段工作階段的代理程式 ID 允許清單；空白表示沒有額外限制。
- `maxConcurrentSessions`：同時作用中的 ACP 工作階段上限。
- `stream.coalesceIdleMs`：串流文字的閒置清除時窗（毫秒）。
- `stream.maxChunkChars`：分割串流區塊投影前的最大區塊大小。
- `stream.repeatSuppression`：每回合抑制重複狀態/工具行（預設值：`true`）。
- `stream.deliveryMode`：`"live"` 會增量串流；`"final_only"` 會緩衝到回合終端事件。
- `stream.hiddenBoundarySeparator`：隱藏工具事件後、可見文字前的分隔符（預設值：`"paragraph"`）。
- `stream.maxOutputChars`：每個 ACP 回合投影的助理輸出字元上限。
- `stream.maxSessionUpdateChars`：投影 ACP 狀態/更新行的字元上限。
- `stream.tagVisibility`：標籤名稱到串流事件布林可見性覆寫的記錄。
- `runtime.ttlMinutes`：ACP 工作階段 worker 符合清理條件前的閒置 TTL（分鐘）。
- `runtime.installCommand`：啟動 ACP 執行階段環境時要執行的選用安裝命令。

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
  - `"random"`（預設）：輪播有趣／季節性標語。
  - `"default"`：固定的中性標語（`All your chats, one OpenClaw.`）。
  - `"off"`：不顯示標語文字（仍會顯示橫幅標題／版本）。
- 若要隱藏整個橫幅（不只是標語），請設定環境變數 `OPENCLAW_HIDE_BANNER=1`。

---

## 精靈

命令列介面引導式設定流程（`onboard`、`configure`、`doctor`）寫入的中繼資料：

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

## 橋接（舊版，已移除）

目前建置已不再包含 TCP 橋接。節點會透過閘道 WebSocket 連線。`bridge.*` 鍵已不再是設定結構描述的一部分（驗證會失敗，直到移除為止；`openclaw doctor --fix` 可以移除未知鍵）。

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

## 排程

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention`：在從 `sessions.json` 清除前，保留已完成隔離排程執行工作階段的時間長度。也會控制已封存且已刪除的排程逐字稿清理。預設：`24h`；設定為 `false` 可停用。
- `runLog.maxBytes`：為相容較舊的檔案型排程執行記錄而接受。預設：`2_000_000` 位元組。
- `runLog.keepLines`：每個工作保留的最新 SQLite 執行歷史列數。預設：`2000`。
- `webhookToken`：用於排程網路鉤子 POST 傳遞（`delivery.mode = "webhook"`）的 bearer token；若省略，則不傳送驗證標頭。
- `webhook`：已棄用的舊版備援網路鉤子 URL（http/https），由 `openclaw doctor --fix` 用來遷移仍有 `notify: true` 的已儲存工作；執行階段傳遞會使用各工作自己的 `delivery.mode="webhook"` 加上 `delivery.to`，或在保留公告傳遞時使用 `delivery.completionDestination`。

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

- `maxAttempts`：排程工作在暫時性錯誤時的最大重試次數（預設：`3`；範圍：`0`-`10`）。
- `backoffMs`：每次重試嘗試的退避延遲陣列，單位為毫秒（預設：`[30000, 60000, 300000]`；1 到 10 個項目）。
- `retryOn`：會觸發重試的錯誤類型 - `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略時會重試所有暫時性類型。

一次性工作會保持啟用直到重試嘗試耗盡，接著停用並保留最終錯誤狀態。週期性工作會使用相同的暫時性重試政策，在下一個排程時段前於退避後再次執行；永久錯誤或暫時性重試耗盡時，會以錯誤退避回到正常週期排程。

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
- `after`：觸發警示前的連續失敗次數（正整數，最小值：`1`）。
- `cooldownMs`：同一工作重複警示之間的最小毫秒數（非負整數）。
- `includeSkipped`：將連續略過的執行計入警示門檻（預設：`false`）。略過的執行會另行追蹤，且不影響執行錯誤退避。
- `mode`：傳遞模式 - `"announce"` 透過頻道訊息傳送；`"webhook"` 發送到已設定的網路鉤子。
- `accountId`：選用的帳號或頻道 ID，用於限定警示傳遞範圍。

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

- 所有工作的排程失敗通知預設目的地。
- `mode`：`"announce"` 或 `"webhook"`；當有足夠目標資料時，預設為 `"announce"`。
- `channel`：公告傳遞的頻道覆寫。`"last"` 會重用最後已知的傳遞頻道。
- `to`：明確的公告目標或網路鉤子 URL。網路鉤子模式必填。
- `accountId`：選用的傳遞帳號覆寫。
- 各工作的 `delivery.failureDestination` 會覆寫這個全域預設值。
- 若未設定全域或各工作的失敗目的地，已透過 `announce` 傳遞的工作會在失敗時回退到該主要公告目標。
- `delivery.failureDestination` 僅支援 `sessionTarget="isolated"` 工作，除非該工作的主要 `delivery.mode` 是 `"webhook"`。

請參閱 [排程工作](/zh-TW/automation/cron-jobs)。隔離排程執行會作為[背景任務](/zh-TW/automation/tasks)追蹤。

---

## 媒體模型範本變數

在 `tools.media.models[].args` 中展開的範本預留位置：

| 變數               | 說明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完整傳入訊息本文                                  |
| `{{RawBody}}`      | 原始本文（無歷史／傳送者包裝）                    |
| `{{BodyStripped}}` | 已移除群組提及的本文                              |
| `{{From}}`         | 傳送者識別碼                                      |
| `{{To}}`           | 目的地識別碼                                      |
| `{{MessageSid}}`   | 頻道訊息 ID                                       |
| `{{SessionId}}`    | 目前工作階段 UUID                                 |
| `{{IsNewSession}}` | 建立新工作階段時為 `"true"`                       |
| `{{MediaUrl}}`     | 傳入媒體偽 URL                                    |
| `{{MediaPath}}`    | 本機媒體路徑                                      |
| `{{MediaType}}`    | 媒體類型（image/audio/document/…）                |
| `{{Transcript}}`   | 音訊逐字稿                                        |
| `{{Prompt}}`       | 命令列介面項目的已解析媒體提示                    |
| `{{MaxChars}}`     | 命令列介面項目的已解析最大輸出字元數              |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                           |
| `{{GroupSubject}}` | 群組主題（盡力而為）                              |
| `{{GroupMembers}}` | 群組成員預覽（盡力而為）                          |
| `{{SenderName}}`   | 傳送者顯示名稱（盡力而為）                        |
| `{{SenderE164}}`   | 傳送者電話號碼（盡力而為）                        |
| `{{Provider}}`     | 供應商提示（whatsapp、telegram、discord 等）      |

---

## 設定包含項目（`$include`）

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
- 檔案陣列：依序深度合併（後者覆寫前者）。
- 同層鍵：在包含項目之後合併（覆寫已包含的值）。
- 巢狀包含：最多深入 10 層。
- 路徑：相對於包含它的檔案解析，但必須留在最上層設定目錄（`openclaw.json` 的 `dirname`）內。絕對／`../` 形式只有在解析後仍位於該邊界內時才允許。路徑不得包含 null 位元組，且解析前後都必須嚴格短於 4096 個字元。
- OpenClaw 擁有的寫入若只變更由單檔包含支援的一個最上層區段，會寫入該被包含檔案。例如，`plugins install` 會在 `plugins.json5` 中更新 `plugins: { $include: "./plugins.json5" }`，並保持 `openclaw.json` 不變。
- 根包含、包含陣列，以及有同層覆寫的包含，對 OpenClaw 擁有的寫入是唯讀的；這些寫入會失敗關閉，而不是攤平設定。
- 錯誤：針對遺失檔案、解析錯誤、循環包含、無效路徑格式，以及長度過長提供清楚訊息。

---

_相關：[設定](/zh-TW/gateway/configuration) · [設定範例](/zh-TW/gateway/configuration-examples) · [Doctor](/zh-TW/gateway/doctor)_

## 相關

- [設定](/zh-TW/gateway/configuration)
- [設定範例](/zh-TW/gateway/configuration-examples)
