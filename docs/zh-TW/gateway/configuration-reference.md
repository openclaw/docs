---
read_when:
    - 你需要精確的欄位層級設定語意或預設值
    - 你正在驗證頻道、模型、閘道或工具設定區塊
summary: OpenClaw 核心鍵、預設值，以及專用子系統參考連結的閘道設定參考
title: 設定參考
x-i18n:
    generated_at: "2026-07-06T10:48:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e431290ad59b7b350150149ca603b014c5611751c62162913193a7c470ecd190
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` 的欄位層級參考：鍵、預設值，以及指向更深入子系統頁面的連結。如需任務導向的設定指引，請參閱[設定](/zh-TW/gateway/configuration)。頻道與外掛擁有的命令目錄，以及深度記憶/QMD 調整項目，位於各自的頁面，而不是這裡。

設定格式為 **JSON5**（允許註解與尾隨逗號）。所有欄位都是選用；省略時 OpenClaw 會使用安全的預設值。

程式碼真相優先於本頁：

- `openclaw config schema` 會列印用於驗證與 Control UI 的即時 JSON Schema，並已合併內建/外掛/頻道中繼資料。
- 代理程式在編輯設定前，應呼叫 `gateway` 工具動作 `config.schema.lookup`，取得一個精確路徑範圍的 schema 節點。
- `pnpm config:docs:check` / `pnpm config:docs:gen` 會依目前的 schema 表面驗證此文件的基準雜湊。

專用深度參考：

- [記憶體設定參考](/zh-TW/reference/memory-config)：適用於 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及 `plugins.entries.memory-core.config.dreaming` 下的夢境整理設定。
- [斜線命令](/zh-TW/tools/slash-commands)：適用於目前的內建 + 內建隨附命令目錄。
- 擁有頻道特定命令表面的頻道/外掛頁面。

---

## 頻道

各頻道設定鍵位於[設定 - 頻道](/zh-TW/gateway/config-channels)：`channels.*` 適用於 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage，以及其他內建隨附頻道（驗證、存取控制、多帳號、提及閘控）。

## 代理程式預設值、多代理程式、工作階段與訊息

請參閱[設定 - 代理程式](/zh-TW/gateway/config-agents)，了解：

- `agents.defaults.*`（工作區、模型、thinking、心跳偵測、記憶體、媒體、skills、sandbox）
- `multiAgent.*`（多代理程式路由與繫結）
- `session.*`（工作階段生命週期、壓縮、剪除）
- `messages.*`（訊息傳遞、TTS、markdown 轉譯）
- `talk.*`（Talk 模式）
  - `talk.consultThinkingLevel`：Control UI Talk 即時諮詢背後完整 OpenClaw 代理程式執行的 thinking level 覆寫
  - `talk.consultFastMode`：Control UI Talk 即時諮詢的一次性 fast-mode 覆寫
  - `talk.speechLocale`：Talk 在 iOS/macOS 上進行語音辨識時的選用 BCP 47 語系 id
  - `talk.silenceTimeoutMs`：未設定時，Talk 會保留平台預設的暫停視窗，之後才送出逐字稿（`macOS 和 Android 為 700 ms，iOS 為 900 ms`）
  - `talk.realtime.consultRouting`：針對略過 `openclaw_agent_consult` 的已完成即時 Talk 逐字稿所用的閘道轉送後援

## 工具與自訂提供者

工具政策、實驗性切換、提供者支援的工具設定，以及自訂提供者 / base-URL 設定，位於[設定 - 工具與自訂提供者](/zh-TW/gateway/config-tools)。

## 模型

提供者定義、模型允許清單，以及自訂提供者設定位於
[設定 - 工具與自訂提供者](/zh-TW/gateway/config-tools#custom-providers-and-base-urls)。
`models` 根層也負責全域模型目錄行為。

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
- `models.providers.*.localService`：本機模型伺服器的選用隨需處理程序管理器。OpenClaw 會探測已設定的健康狀態端點，在需要時啟動絕對路徑 `command`，等待就緒後再傳送模型請求。請參閱[本機模型服務](/zh-TW/gateway/local-model-services)。
- `models.pricing.enabled`：控制在 sidecar 與通道到達閘道就緒路徑後啟動的背景定價啟動程序。當為 `false` 時，閘道會略過 OpenRouter 與 LiteLLM 定價目錄擷取；已設定的 `models.providers.*.models[].cost` 值仍可用於本機成本估算。

## MCP

OpenClaw 管理的 MCP 伺服器定義位於 `mcp.servers` 下，並由嵌入式 OpenClaw 與其他執行階段配接器取用。`openclaw mcp list`、`show`、`set` 與 `unset` 命令會管理此區塊，而不會在編輯設定時連線到目標伺服器。

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
  遠端項目使用 `transport: "streamable-http"` 或 `transport: "sse"`；`type: "http"` 是命令列介面原生別名，`openclaw mcp set` 與 `openclaw doctor --fix` 會將其正規化為標準 `transport` 欄位。
- `mcp.servers.<name>.enabled`：設為 `false` 可保留已儲存的伺服器定義，同時將其排除於嵌入式 OpenClaw MCP 探索與工具投射之外。
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`：每部伺服器的 MCP 請求逾時，以秒或毫秒為單位。
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`：每部伺服器的連線逾時，以秒或毫秒為單位。
- `mcp.servers.<name>.supportsParallelToolCalls`：選用的並行提示，供可選擇是否發出並行 MCP 工具呼叫的配接器使用。
- `mcp.servers.<name>.auth`：對需要 OAuth 的 HTTP MCP 伺服器設為 `"oauth"`。執行 `openclaw mcp login <name>` 可將權杖儲存在 OpenClaw 狀態中。
- `mcp.servers.<name>.oauth`：選用的 OAuth 範圍、重新導向 URL，以及用戶端中繼資料 URL 覆寫。
- `mcp.servers.<name>.sslVerify`、`clientCert`、`clientKey`：用於私人端點與雙向 TLS 的 HTTP TLS 控制。
- `mcp.servers.<name>.toolFilter`：選用的每部伺服器工具選取設定。`include` 會將探索到的 MCP 工具限制為相符名稱；`exclude` 會隱藏相符名稱。項目可以是精確的 MCP 工具名稱或簡單的 `*` glob。具有資源或提示詞的伺服器也會產生工具程式名稱（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`），這些名稱使用相同篩選器。
- `mcp.servers.<name>.codex`：選用的 Codex app-server 投射控制。此區塊只是 OpenClaw 對 Codex app-server 執行緒的中繼資料；不會影響 ACP 工作階段、通用 Codex harness 設定或其他執行階段配接器。
  非空的 `codex.agents` 會將伺服器限制為列出的 OpenClaw 代理 ID。空白、空值或無效的範圍代理清單會被設定驗證拒絕，並由執行階段投射路徑省略，而不會變成全域設定。
  `codex.defaultToolsApprovalMode` 會為該伺服器發出 Codex 原生的 `default_tools_approval_mode`。OpenClaw 會在將原生 `mcp_servers` 設定傳遞給 Codex 之前移除 `codex` 區塊。省略此區塊可讓伺服器以 Codex 的預設 MCP 核准行為投射給每個 Codex app-server 代理。
- `mcp.sessionIdleTtlMs`：工作階段範圍 bundled MCP 執行階段的閒置 TTL。
  一次性嵌入式執行會請求執行結束清理；此 TTL 是長時間存活工作階段與未來呼叫者的後備機制。
- `mcp.*` 下的變更會透過釋放已快取的工作階段 MCP 執行階段來熱套用。
  下一次工具探索／使用會從新設定重新建立它們，因此移除的 `mcp.servers` 項目會立即被回收，而不是等待閒置 TTL。
- 執行階段探索也會透過丟棄該工作階段的快取目錄，遵循 MCP 工具清單變更通知。宣告資源或提示詞的伺服器會取得用於列出／讀取資源與列出／擷取提示詞的工具程式。重複工具呼叫失敗會短暫暫停受影響的伺服器，之後才會嘗試另一個呼叫。

請參閱 [MCP](/zh-TW/cli/mcp#openclaw-as-an-mcp-client-registry) 與
[命令列介面後端](/zh-TW/gateway/cli-backends#bundle-mcp-overlays)以了解執行階段行為。

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

- `allowBundled`：僅適用於 bundled skills 的選用允許清單（不影響受管理／工作區 skills）。
- `load.extraDirs`：額外的共用 skill 根目錄（最低優先順序）。
- `load.allowSymlinkTargets`：受信任的真實目標根目錄，當 skill 符號連結位於其已設定來源根目錄之外時，可解析至這些根目錄。
- `workshop.allowSymlinkTargetWrites`：允許 Skill Workshop apply 寫入已受信任的符號連結目標（預設：false）。
- `install.preferBrew`：為 true 時，若 `brew` 可用，會先偏好 Homebrew 安裝程式，再退回其他安裝程式類型。
- `install.nodeManager`：`metadata.openclaw.install` 規格的節點安裝程式偏好設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`：允許受信任的 `operator.admin` 閘道用戶端安裝透過 `skills.upload.*` 暫存的私人 zip 封存檔（預設：false）。這只會啟用上傳封存檔路徑；一般 ClawHub 安裝不需要它。
- `entries.<skillKey>.enabled: false` 會停用某個 skill，即使它是 bundled／已安裝也一樣。
- `entries.<skillKey>.apiKey`：供宣告主要環境變數的 skills 使用的便利設定（純文字字串或 SecretRef 物件）。
- `limits.maxCandidatesPerRoot`、`limits.maxSkillsLoadedPerSource`、`limits.maxSkillsInPrompt`、`limits.maxSkillsPromptChars`、`limits.maxSkillFileBytes`：限制 skill 探索與面向模型的 skills 提示詞。
- Skill Workshop 自主／核准設定（`workshop.autonomous.enabled`、`workshop.approvalPolicy`、`workshop.maxPending`、`workshop.maxSkillBytes`）記錄於 [Skills 設定](/zh-TW/tools/skills-config)。

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

- 從 `~/.openclaw/extensions` 與 `<workspace>/.openclaw/extensions` 下的套件或 bundle 目錄載入，另加上 `plugins.load.paths` 中列出的檔案或目錄。
- 將獨立外掛檔案放在 `plugins.load.paths`；自動探索到的 extension 根目錄會忽略頂層 `.js`、`.mjs` 與 `.ts` 檔案，因此這些根目錄中的輔助指令碼不會阻擋啟動。
- 探索接受原生 OpenClaw 外掛，以及相容的 Codex bundle 和 Claude bundle，包括沒有 manifest 的 Claude 預設版面配置 bundle。
- **設定變更需要重新啟動閘道。**
- `allow`：選用的允許清單（只載入列出的外掛）。`deny` 優先。
- `plugins.entries.<id>.apiKey`：外掛層級 API 金鑰便利欄位（由外掛支援時）。
- `plugins.entries.<id>.env`：外掛範圍的環境變數對應表。
- `plugins.entries.<id>.hooks.allowPromptInjection`：為 `false` 時，核心會封鎖 `before_prompt_build`，並忽略舊版 `before_agent_start` 中會修改 prompt 的欄位，同時保留舊版 `modelOverride` 與 `providerOverride`。適用於原生外掛 hook 和受支援的 bundle 提供 hook 目錄。
- `plugins.entries.<id>.hooks.allowConversationAccess`：為 `true` 時，受信任的非內建外掛可從型別化 hook 讀取原始對話內容，例如 `llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize` 與 `agent_end`。
- `plugins.entries.<id>.subagent.allowModelOverride`：明確信任此外掛可針對背景 subagent 執行要求每次執行的 `provider` 與 `model` 覆寫。
- `plugins.entries.<id>.subagent.allowedModels`：受信任 subagent 覆寫可用的標準 `provider/model` 目標選用允許清單。只有在你有意允許任何模型時才使用 `"*"`。
- `plugins.entries.<id>.llm.allowModelOverride`：明確信任此外掛可針對 `api.runtime.llm.complete` 要求模型覆寫。
- `plugins.entries.<id>.llm.allowedModels`：受信任外掛 LLM completion 覆寫可用的標準 `provider/model` 目標選用允許清單。只有在你有意允許任何模型時才使用 `"*"`。
- `plugins.entries.<id>.llm.allowAgentIdOverride`：明確信任此外掛可對非預設 agent id 執行 `api.runtime.llm.complete`。
- `plugins.entries.<id>.config`：外掛定義的設定物件（可用時由原生 OpenClaw 外掛 schema 驗證）。
- 頻道外掛帳號/執行階段設定位於 `channels.<id>` 下，並應由所屬外掛 manifest 的 `channelConfigs` metadata 描述，而不是由中央 OpenClaw 選項 registry 描述。

### Codex harness 外掛設定

內建的 `codex` 外掛擁有原生 Codex app-server harness 設定，位於
`plugins.entries.codex.config`。完整設定
表面請參閱
[Codex harness 參考](/zh-TW/plugins/codex-harness-reference)，執行階段模型請參閱 [Codex harness](/zh-TW/plugins/codex-harness)。

`codexPlugins` 只套用於選擇原生 Codex harness 的工作階段。
它不會為 OpenClaw provider 執行、ACP
對話繫結，或任何非 Codex harness 啟用 Codex 外掛。

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
  外掛/app 支援。預設值：`false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`：
  已遷移外掛 app elicitations 的預設破壞性動作政策。
  使用 `true` 接受安全的 Codex approval schema 且不提示，`false`
  拒絕它們，`"auto"` 透過 OpenClaw
  外掛 approval 路由 Codex 必要 approval，或 `"ask"` 對每個外掛寫入/破壞性
  動作提示，且不使用持久 approval。`"ask"` 模式會清除受影響 app 的持久 Codex
  每工具 approval 覆寫，並在 Codex thread 啟動前為該 app 選擇人工
  approvals 審查者。
  預設值：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`：當全域 `codexPlugins.enabled` 也為 true 時，啟用
  已遷移的外掛項目。
  預設值：明確項目為 `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`：
  穩定的 marketplace 身分。V1 只支援 `"openai-curated"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`：來自遷移的穩定
  Codex 外掛身分，例如 `"google-calendar"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`：
  每外掛的破壞性動作覆寫。省略時會使用全域
  `allow_destructive_actions` 值。每外掛值接受相同的
  `true`、`false`、`"auto"` 或 `"ask"` 政策。

每個使用 `"ask"` 的已允許外掛 app，都會將該 app 的 approval request
路由給人工審查者。其他 app 和非 app thread approval 會保留其
設定的審查者，因此混合外掛政策不會繼承 `"ask"` 行為。

`codexPlugins.enabled` 是全域啟用指令。遷移寫入的明確外掛
項目是持久安裝與修復資格集合。
不支援 `plugins["*"]`，沒有 `install` 開關，且本機
`marketplacePath` 值刻意不作為設定欄位，因為它們是
主機特定的。

`app/list` readiness 檢查會快取一小時，並在過期時
非同步重新整理。Codex thread app 設定是在 Codex harness
工作階段建立時運算，而不是每回合都運算；變更原生外掛設定後，請使用 `/new`、`/reset`，或重新啟動閘道。

- `plugins.entries.firecrawl.config.webFetch`：Firecrawl web-fetch provider 設定。
  - `apiKey`：更高限制用的選用 Firecrawl API 金鑰（接受 SecretRef）。退回使用 `plugins.entries.firecrawl.config.webSearch.apiKey`、舊版 `tools.web.fetch.firecrawl.apiKey`，或 `FIRECRAWL_API_KEY` 環境變數。
  - `baseUrl`：Firecrawl API 基底 URL（預設值：`https://api.firecrawl.dev`；自行託管覆寫必須指向私有/內部 endpoint）。
  - `onlyMainContent`：只從頁面擷取主要內容（預設值：`true`）。
  - `maxAgeMs`：最大快取存留時間，以毫秒為單位（預設值：`172800000` / 2 天）。
  - `timeoutSeconds`：scrape request timeout，以秒為單位（預設值：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok web search）設定。
  - `enabled`：啟用 X Search provider。
  - `model`：搜尋使用的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：記憶 夢境整理設定。階段和閾值請參閱 [夢境整理](/zh-TW/concepts/dreaming)。
  - `enabled`：主要夢境整理開關（預設值 `false`）。
  - `frequency`：每次完整夢境整理掃描的 cron 頻率（預設為 `"0 3 * * *"`）。
  - `model`：選用的 Dream Diary subagent 模型覆寫。需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`；搭配 `allowedModels` 以限制目標。模型不可用錯誤會使用工作階段預設模型重試一次；信任或允許清單失敗不會靜默退回。
  - 階段政策和閾值是實作細節（不是面向使用者的設定 key）。
- 完整記憶設定位於[記憶設定參考](/zh-TW/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已啟用的 Claude bundle 外掛也可以從 `settings.json` 提供嵌入式 OpenClaw 預設值；OpenClaw 會將其套用為經清理的 agent 設定，而不是原始 OpenClaw 設定 patch。
- `plugins.slots.memory`：選擇作用中的記憶外掛 id，或用 `"none"` 停用記憶外掛。
- `plugins.slots.contextEngine`：選擇作用中的 context engine 外掛 id；除非你安裝並選擇另一個 engine，否則預設為 `"legacy"`。

請參閱[外掛](/zh-TW/tools/plugin)。

---

## 承諾

`commitments` 控制推斷出的後續追蹤記憶：OpenClaw 可從對話回合偵測 check-in，並透過心跳偵測執行傳遞它們。

- `commitments.enabled`：為推斷出的後續追蹤承諾啟用隱藏 LLM 擷取、儲存與心跳偵測傳遞。預設值：`false`。
- `commitments.maxPerDay`：在滾動一天內，每個 agent 工作階段最多傳遞的推斷後續追蹤承諾數。預設值：`3`。

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
- `tabCleanup` 會在閒置一段時間後，或在工作階段超過其上限時，回收追蹤中的主要代理分頁。設定 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 可停用這些個別清理模式。
- 未設定時，`ssrfPolicy.dangerouslyAllowPrivateNetwork` 會停用，因此瀏覽器導覽預設保持嚴格。
- 只有在你有意信任私人網路瀏覽器導覽時，才設定 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在嚴格模式中，遠端 CDP 設定檔端點（`profiles.*.cdpUrl`）在可達性/探索檢查期間，會受到相同的私人網路封鎖限制。
- `ssrfPolicy.allowPrivateNetwork` 仍支援作為舊版別名。
- 在嚴格模式中，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 設定明確例外。
- 遠端設定檔僅可附加（停用啟動/停止/重設）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  當你希望 OpenClaw 探索 `/json/version` 時使用 HTTP(S)；當你的供應商提供直接的 DevTools WebSocket URL 時使用 WS(S)。
- `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 適用於遠端與
  `attachOnly` CDP 可達性，以及分頁開啟請求。受管理的 loopback
  設定檔會保留本機 CDP 預設值。持續性遠端 Playwright 分頁列舉會使用較大的值作為其操作期限。
- 如果外部管理的 CDP 服務可透過 loopback 連線，請將該設定檔的
  `attachOnly: true`；否則 OpenClaw 會將該 loopback 連接埠視為本機受管理的瀏覽器設定檔，並可能回報本機連接埠擁有權錯誤。
- `existing-session` 設定檔使用 Chrome MCP 而非 CDP，並可在選取的主機上或透過已連線的瀏覽器節點附加。
- `existing-session` 設定檔可設定 `userDataDir`，以指定特定的
  Chromium 架構瀏覽器設定檔，例如 Brave 或 Edge。
- 當 Chrome 已在 DevTools HTTP(S) 探索端點或直接 WS(S) 端點後方執行時，`existing-session` 設定檔可設定 `cdpUrl`。在該模式中，OpenClaw 會將端點傳給 Chrome MCP，而不是使用自動連線；Chrome MCP 啟動引數會忽略 `userDataDir`。
- `existing-session` 設定檔會保留目前的 Chrome MCP 路由限制：
  使用快照/ref 驅動的動作，而不是 CSS 選擇器定位、單一檔案上傳
  鉤子、無對話方塊逾時覆寫、無 `wait --load networkidle`，以及無
  `responsebody`、PDF 匯出、下載攔截或批次動作。
- 本機受管理的 `openclaw` 設定檔會自動指派 `cdpPort` 和 `cdpUrl`；只有遠端 CDP 設定檔或 existing-session 端點附加才需明確設定
  `cdpUrl`。
- 本機受管理的設定檔可設定 `executablePath`，以覆寫該設定檔的全域
  `browser.executablePath`。使用此功能可讓一個設定檔在 Chrome 中執行，另一個在 Brave 中執行。
- 本機受管理的設定檔會使用 `browser.localLaunchTimeoutMs` 進行程序啟動後的 Chrome CDP HTTP 探索，並使用 `browser.localCdpReadyTimeoutMs`
  進行啟動後的 CDP websocket 就緒檢查。在 Chrome 成功啟動但就緒檢查與啟動競速的較慢主機上，請提高這些值。兩個值都必須是最高 `120000` ms 的正整數；無效的設定值會被拒絕。
- 自動偵測順序：預設瀏覽器（若為 Chromium 架構）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 都接受 `~` 和 `~/...`，在 Chromium 啟動前代表你的作業系統家目錄。
  `existing-session` 設定檔上的個別設定檔 `userDataDir` 也會展開波浪號。
- 控制服務：僅限 loopback（連接埠由 `gateway.port` 推導，預設 `18791`）。
- `extraArgs` 會將額外啟動旗標附加到本機 Chromium 啟動（例如
  `--disable-gpu`、視窗尺寸或偵錯旗標）。

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
    terminal: {
      enabled: false,
      // shell: "/bin/zsh",
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

- `mode`: `local`（執行閘道）或 `remote`（連線到遠端閘道）。除非為 `local`，否則閘道會拒絕啟動。
- `port`: WS + HTTP 的單一多工連接埠。優先順序：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（預設）、`lan`（`0.0.0.0`）、`tailnet`（僅限 Tailscale IP），或 `custom`。
- **舊版繫結別名**：在 `gateway.bind` 中使用繫結模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），不要使用主機別名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事項**：預設的 `loopback` 繫結會在容器內監聽 `127.0.0.1`。使用 Docker 橋接網路（`-p 18789:18789`）時，流量會到達 `eth0`，因此無法連到閘道。請使用 `--network host`，或設定 `bind: "lan"`（或使用 `bind: "custom"` 搭配 `customBindHost: "0.0.0.0"`）來監聽所有介面。
- **驗證**：預設為必需。非 loopback 繫結需要閘道驗證。實務上這表示共用 token/password，或使用具身分感知能力的反向代理並設定 `gateway.auth.mode: "trusted-proxy"`。入門精靈預設會產生 token。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`（包含 SecretRefs），請明確將 `gateway.auth.mode` 設為 `token` 或 `password`。兩者皆已設定且未設定模式時，啟動與服務安裝/修復流程會失敗。
- `gateway.auth.mode: "none"`：明確的無驗證模式。僅用於受信任的 local loopback 設定；入門提示刻意不提供此選項。
- `gateway.auth.mode: "trusted-proxy"`：將瀏覽器/使用者驗證委派給具身分感知能力的反向代理，並信任來自 `gateway.trustedProxies` 的身分標頭（請參閱 [Trusted Proxy Auth](/zh-TW/gateway/trusted-proxy-auth)）。此模式預設預期代理來源為**非 loopback**；同一主機的 loopback 反向代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。內部同一主機呼叫者可使用 `gateway.auth.password` 作為本機直接備援；`gateway.auth.token` 仍與 trusted-proxy 模式互斥。
- `gateway.auth.allowTailscale`: 為 `true` 時，Tailscale Serve 身分標頭可滿足 Control UI/WebSocket 驗證（透過 `tailscale whois` 驗證）。HTTP API 端點**不會**使用該 Tailscale 標頭驗證；它們會改用閘道一般的 HTTP 驗證模式。此無 token 流程假設閘道主機受信任。當 `tailscale.mode = "serve"` 時預設為 `true`。
- `gateway.auth.rateLimit`: 選用的驗證失敗限制器。依用戶端 IP 與驗證範圍套用（shared-secret 與 device-token 會獨立追蹤）。遭封鎖的嘗試會回傳 `429` + `Retry-After`。
  - 在非同步 Tailscale Serve Control UI 路徑上，相同 `{scope, clientIp}` 的失敗嘗試會在寫入失敗前序列化。因此，來自同一用戶端的並行錯誤嘗試可能會在第二個請求觸發限制器，而不是兩者都以一般不相符競態通過。
  - `gateway.auth.rateLimit.exemptLoopback` 預設為 `true`；當你刻意希望 localhost 流量也受速率限制時，請設為 `false`（用於測試設定或嚴格代理部署）。
- 瀏覽器來源的 WS 驗證嘗試一律會受到節流，且停用 loopback 豁免（作為對瀏覽器型 localhost 暴力嘗試的縱深防禦）。
- 在 loopback 上，這些瀏覽器來源鎖定會依正規化後的 `Origin`
  值隔離，因此來自某個 localhost origin 的重複失敗不會自動
  鎖定另一個 origin。
- `tailscale.mode`: `serve`（僅 tailnet、loopback 繫結）或 `funnel`（公開，需要驗證）。
- `tailscale.serviceName`: Serve 模式的選用 Tailscale Service 名稱，例如
  `svc:openclaw`。設定後，OpenClaw 會將它傳給 `tailscale serve
--service`，讓 Control UI 可透過具名 Service 暴露，而不是透過裝置主機名稱。
  此值必須使用 Tailscale 的 `svc:<dns-label>`
  Service 名稱格式；啟動時會回報衍生出的 Service URL。
- `tailscale.preserveFunnel`: 當為 `true` 且 `tailscale.mode = "serve"` 時，OpenClaw
  會在啟動時重新套用 Serve 前檢查 `tailscale funnel status`，如果外部設定的 Funnel 路由已涵蓋閘道連接埠，則會略過。
  預設為 `false`。
- `controlUi.allowedOrigins`: Gateway WebSocket 連線的明確瀏覽器來源允許清單。公開的非 loopback 瀏覽器來源必須設定。從 loopback、RFC1918/link-local、`.local`、`.ts.net` 或 Tailscale CGNAT 主機載入的私有同源 LAN/Tailnet UI，可在未啟用 Host-header 備援的情況下接受。
- `controlUi.chatMessageMaxWidth`: 群組化 Control UI 聊天訊息的選用最大寬度。接受受限的 CSS 寬度值，例如 `960px`、`82%`、`min(1280px, 82%)` 和 `calc(100% - 2rem)`。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: 危險模式，會為刻意依賴 Host-header origin 政策的部署啟用 Host-header origin 備援。
- `terminal.enabled`: 選擇啟用管理員範圍的操作員終端。預設：`false`。終端會在選定的代理工作區中啟動主機 PTY，繼承 Gateway 程序環境，並拒絕 `sandbox.mode: "all"` 的代理使用。僅在受信任的操作員部署中啟用；變更此設定會重新啟動 Gateway 並更新 Control UI 內容安全政策。
- `terminal.shell`: 選用的 shell 可執行檔。未設定時，OpenClaw 會在 Unix 使用 `$SHELL`，在 Windows 使用 `%ComSpec%`。
- `terminal.detachedSessionTimeoutSeconds`: 終端工作階段在連線中斷（頁面重新載入、筆電睡眠）後保留多久，並可透過 `terminal.attach` 重新附加且重播近期輸出。預設：`300`。設為 `0` 會在連線中斷當下立即終止工作階段。已分離的工作階段會持續執行其命令，因此在共用或對外暴露的主機上請縮短此值。
- `remote.transport`: `ssh`（預設）或 `direct`（ws/wss）。對於 `direct`，公開主機的 `remote.url` 必須是 `wss://`；明文 `ws://` 僅接受 loopback、LAN、link-local、`.local`、`.ts.net` 和 Tailscale CGNAT 主機。
- `remote.remotePort`: 遠端 SSH 主機上的閘道連接埠。預設為 `18789`；當本機通道連接埠不同於遠端閘道連接埠時使用此設定。
- `remote.sshHostKeyPolicy`: macOS SSH 通道主機金鑰政策。`strict` 是預設值，且需要已有受信任的金鑰。`openssh` 是對受管理別名的有效 OpenSSH 設定的明確選擇加入；使用前請檢閱相符的使用者與系統 SSH 設定。macOS 應用程式與 `configure-remote` 在變更目標時會將此政策重設為 `strict`，除非再次明確選擇加入。
- `gateway.remote.token` / `.password` 是遠端用戶端憑證欄位。它們本身不會設定閘道驗證。
- `gateway.push.apns.relay.baseUrl`: 外部 APNs relay 的 HTTPS 基礎 URL，用於 relay 支援的 iOS 組建將註冊發布到閘道之後。公開 App Store 組建會使用託管的 OpenClaw relay。自訂 relay URL 必須對應刻意分離的 iOS 組建/部署路徑，且其 relay URL 指向該 relay。
- `gateway.push.apns.relay.timeoutMs`: 閘道到 relay 的傳送逾時，單位為毫秒。預設為 `10000`。
- relay 支援的註冊會委派給特定閘道身分。配對的 iOS 應用程式會擷取 `gateway.identity.get`，在 relay 註冊中包含該身分，並將註冊範圍的傳送授權轉發給閘道。另一個閘道無法重用該已儲存註冊。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上述 relay 設定的暫時環境覆寫。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: 僅供開發使用的逃生口，用於 loopback HTTP relay URL。生產 relay URL 應維持使用 HTTPS。
- `gateway.handshakeTimeoutMs`: 驗證前 Gateway WebSocket 握手逾時，單位為毫秒。預設：`15000`。設定時，`OPENCLAW_HANDSHAKE_TIMEOUT_MS` 優先。若在負載高或低功耗主機上，本機用戶端可在啟動暖機仍在穩定時連線，請增加此值。
- `gateway.channelHealthCheckMinutes`: 頻道健康監控間隔，單位為分鐘。設為 `0` 可全域停用健康監控重新啟動。預設：`5`。
- `gateway.channelStaleEventThresholdMinutes`: 過期 socket 閾值，單位為分鐘。請保持大於或等於 `gateway.channelHealthCheckMinutes`。預設：`30`。
- `gateway.channelMaxRestartsPerHour`: 每個頻道/帳號在滾動一小時內的健康監控重新啟動上限。預設：`10`。
- `channels.<provider>.healthMonitor.enabled`: 每個頻道的選擇退出設定，可在保留全域監控啟用的同時停用健康監控重新啟動。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 多帳號頻道的每帳號覆寫。設定後，會優先於頻道層級覆寫。
- 本機閘道呼叫路徑只有在未設定 `gateway.auth.*` 時，才可使用 `gateway.remote.*` 作為備援。
- 如果 `gateway.auth.token` / `gateway.auth.password` 透過 SecretRef 明確設定但未解析，解析會失敗關閉（不會以遠端備援遮蔽）。
- `trustedProxies`: 終止 TLS 或注入 forwarded-client 標頭的反向代理 IP。僅列出你控制的代理。Loopback 項目對同一主機代理/本機偵測設定（例如 Tailscale Serve 或本機反向代理）仍然有效，但它們**不會**讓 loopback 請求符合 `gateway.auth.mode: "trusted-proxy"` 的資格。
- `allowRealIpFallback`: 為 `true` 時，若缺少 `X-Forwarded-For`，閘道會接受 `X-Real-IP`。預設為 `false`，採失敗關閉行為。
- `gateway.nodes.pairing.autoApproveCidrs`: 選用的 CIDR/IP 允許清單，用於自動核准首次節點裝置配對且未要求範圍的情況。未設定時會停用。這不會自動核准操作員/瀏覽器/Control UI/WebChat 配對，也不會自動核准角色、範圍、中繼資料或公開金鑰升級。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: 在配對與平台允許清單評估後，針對已宣告節點命令的全域允許/拒絕塑形。使用 `allowCommands` 選擇加入危險的節點命令，例如 `camera.snap`、`camera.clip` 和 `screen.record`；`denyCommands` 會移除某個命令，即使平台預設或明確允許原本會包含它。節點變更其宣告命令清單後，請拒絕並重新核准該裝置配對，讓閘道儲存更新後的命令快照。
- `gateway.tools.deny`: 封鎖 HTTP `POST /tools/invoke` 的額外工具名稱（擴充預設拒絕清單）。
- `gateway.tools.allow`: 從預設 HTTP 拒絕清單中移除工具名稱，供
  owner/admin 呼叫者使用。這不會將帶有身分的 `operator.write`
  呼叫者升級為 owner/admin 存取；即使列入允許清單，`cron`、`gateway` 和 `nodes` 仍然
  不提供給非 owner 呼叫者。

</Accordion>

### OpenAI 相容端點

- Admin HTTP RPC：預設關閉，作為 `admin-http-rpc` 外掛。啟用此外掛以註冊 `POST /api/v1/admin/rpc`。請參閱 [Admin HTTP RPC](/zh-TW/plugins/admin-http-rpc)。
- Chat Completions：預設停用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 啟用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 輸入強化：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空的允許清單會視為未設定；使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和/或 `gateway.http.endpoints.responses.images.allowUrl=false` 停用 URL 擷取。
- 選用的回應強化標頭：
  - `gateway.http.securityHeaders.strictTransportSecurity`（僅針對你控制的 HTTPS origins 設定；請參閱 [Trusted Proxy Auth](/zh-TW/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多執行個體隔離

在一台主機上以唯一連接埠與狀態目錄執行多個閘道：

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

- `enabled`：在閘道監聽器啟用 TLS 終止（HTTPS/WSS）（預設值：`false`）。
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

- `mode`：控制設定編輯在執行階段的套用方式。
  - `"off"`：忽略即時編輯；變更需要明確重新啟動。
  - `"restart"`：設定變更時一律重新啟動閘道程序。
  - `"hot"`：不重新啟動，直接在程序內套用變更。
  - `"hybrid"`（預設）：先嘗試熱重新載入；必要時退回重新啟動。
- `debounceMs`：套用設定變更前的防抖視窗，單位為毫秒（非負整數；預設值：`300`）。
- `deferralTimeoutMs`：在強制重新啟動或通道熱重新載入前，等待執行中操作的選用最長時間，單位為毫秒。省略時使用預設的有界等待（`300000`）；設為 `0` 則無限期等待，並定期記錄仍在等待的警告。

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
- `openclaw security audit` 會將鉤子/閘道驗證重複使用標記為重大發現，包括僅在稽核時提供的閘道密碼驗證（`--auth password --password <password>`）。執行 `openclaw doctor --fix` 來輪替已持久保存且重複使用的 `hooks.token`，然後更新外部鉤子傳送者以使用新的鉤子權杖。
- `hooks.path` 不能是 `/`；請使用專用子路徑，例如 `/hooks`。
- 若 `hooks.allowRequestSessionKey=true`，請限制 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 若 mapping 或 preset 使用樣板化的 `sessionKey`，請設定 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。靜態 mapping 金鑰不需要該選擇加入。

**端點：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 只有在 `hooks.allowRequestSessionKey=true` 時，才接受來自請求 payload 的 `sessionKey`（預設值：`false`）。
- `POST /hooks/<name>` → 透過 `hooks.mappings` 解析
  - 樣板轉譯的 mapping `sessionKey` 值會被視為外部提供，也需要 `hooks.allowRequestSessionKey=true`。

<Accordion title="Mapping 詳細資料">

- `match.path` 會比對 `/hooks` 之後的子路徑（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 會比對泛用路徑的 payload 欄位。
- `{{messages[0].subject}}` 這類樣板會從 payload 讀取。
- `transform` 可以指向回傳鉤子動作的 JS/TS 模組。
  - `transform.module` 必須是相對路徑，且需保留在 `hooks.transformsDir` 內（絕對路徑與路徑穿越會被拒絕）。
  - 請將 `hooks.transformsDir` 保持在 `~/.openclaw/hooks/transforms` 之下；工作區 Skills 目錄會被拒絕。若 `openclaw doctor` 回報此路徑無效，請將 transform 模組移到鉤子 transforms 目錄，或移除 `hooks.transformsDir`。
- `agentId` 會路由到特定代理；未知 ID 會退回預設代理。
- `allowedAgentIds`：限制有效的代理路由，包括省略 `agentId` 時的預設代理路徑（`*` 或省略 = 全部允許，`[]` = 全部拒絕）。
- `defaultSessionKey`：沒有明確 `sessionKey` 的鉤子代理執行所用的選用固定工作階段金鑰。
- `allowRequestSessionKey`：允許 `/hooks/agent` 呼叫者與樣板驅動的 mapping 工作階段金鑰設定 `sessionKey`（預設值：`false`）。
- `allowedSessionKeyPrefixes`：明確 `sessionKey` 值（請求 + mapping）的選用前綴允許清單，例如 `["hook:"]`。當任何 mapping 或 preset 使用樣板化的 `sessionKey` 時，它會成為必填。
- `deliver: true` 會將最終回覆傳送到通道；`channel` 預設為 `last`。
- `model` 會覆寫此鉤子執行的 LLM（若設定模型目錄，必須允許該模型）。

</Accordion>

### Gmail 整合

- 內建 Gmail preset 使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 若保留該逐訊息路由，請設定 `hooks.allowRequestSessionKey: true`，並限制 `hooks.allowedSessionKeyPrefixes` 以符合 Gmail 命名空間，例如 `["hook:", "hook:gmail:"]`。
- 若需要 `hooks.allowRequestSessionKey: false`，請使用靜態 `sessionKey` 覆寫 preset，而不是使用樣板化預設值。

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
- 請勿在閘道旁另外執行 `gog gmail watch serve`。

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
- 非 loopback 繫結：canvas 路由需要閘道驗證（權杖/密碼/受信任代理），與其他閘道 HTTP 表面相同。
- 節點 WebViews 通常不會傳送驗證標頭；節點配對並連線後，閘道會公告節點範圍的能力 URL 以供 canvas/A2UI 存取。
- 能力 URL 綁定至作用中的節點 WS 工作階段，並會快速過期。不使用以 IP 為基礎的退回。
- 將即時重新載入用戶端注入到所提供的 HTML 中。
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

- `minimal`（預設）：從 TXT 記錄中省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`；LAN 多播廣告仍需要啟用隨附的 `bonjour` 外掛。
- `off`：在不變更外掛啟用狀態的情況下，抑制 LAN 多播廣告。
- 隨附的 `bonjour` 外掛會在 macOS 主機上自動啟動，並在 Linux、Windows 和容器化閘道部署中採用選擇啟用。
- 主機名稱預設為系統主機名稱（當它是有效的 DNS 標籤時），否則退回為 `openclaw`。可用 `OPENCLAW_MDNS_HOSTNAME` 覆寫。
- `OPENCLAW_DISABLE_BONJOUR=1` 會直接停用 mDNS 廣告，並覆寫 `discovery.mdns.mode`。

### 廣域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

在 `~/.openclaw/dns/` 下寫入單播 DNS-SD 區域。若要進行跨網路探索，請搭配 DNS 伺服器（建議使用 CoreDNS）+ Tailscale 分割 DNS。

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

- 內嵌環境變數只會在程序環境缺少該鍵時套用。
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

- 只匹配大寫名稱：`[A-Z_][A-Z0-9_]*`。
- 缺少或空的變數會在載入設定時拋出錯誤。
- 使用 `$${VAR}` 逸出為字面 `${VAR}`。
- 可與 `$include` 搭配使用。

---

## 秘密

秘密參照是附加式的：純文字值仍可運作。

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
- `source: "exec"` id 不得包含 `.` 或 `..` 的斜線分隔路徑片段（例如 `a/../b` 會被拒絕）

### 支援的憑證介面

- 標準矩陣：[SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)
- `secrets apply` 以支援的 `openclaw.json` 憑證路徑為目標。
- `auth-profiles.json` 參照包含在執行階段解析和稽核涵蓋範圍中。

### 秘密提供者設定

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
- 當 Windows ACL 驗證無法使用時，檔案與 exec 提供者路徑會採取失敗關閉。僅對無法驗證的受信任路徑設定 `allowInsecurePath: true`。
- `exec` 提供者需要絕對 `command` 路徑，並在 stdin/stdout 上使用協定承載資料。
- 預設會拒絕符號連結命令路徑。設定 `allowSymlinkCommand: true` 可允許符號連結路徑，同時驗證解析後的目標路徑。
- 如果已設定 `trustedDirs`，受信任目錄檢查會套用至解析後的目標路徑。
- `exec` 子程序環境預設為最小化；請使用 `passEnv` 明確傳入所需變數。
- Secret refs 會在啟用時解析為記憶體內快照，之後請求路徑只會讀取該快照。
- 作用中介面篩選會在啟用期間套用：已啟用介面上的未解析 refs 會導致啟動/重新載入失敗，而非作用中介面會略過並附上診斷資訊。

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
- `auth-profiles.json` 支援靜態憑證模式的值層級 refs（`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- 舊版扁平 `auth-profiles.json` 對應（例如 `{ "provider": { "apiKey": "..." } }`）不是執行階段格式；`openclaw doctor --fix` 會將其改寫為標準 `provider:default` API-key 設定檔，並建立 `.legacy-flat.*.bak` 備份。
- OAuth 模式設定檔（`auth.profiles.<id>.mode = "oauth"`）不支援以 SecretRef 作為後端的驗證設定檔憑證。
- 靜態執行階段憑證來自記憶體內已解析快照；發現舊版靜態 `auth.json` 項目時會將其清除。
- 舊版 OAuth 會從 `~/.openclaw/credentials/oauth.json` 匯入。
- 請參閱 [OAuth](/zh-TW/concepts/oauth)。
- Secrets 執行階段行為與 `audit/configure/apply` 工具：[Secrets 管理](/zh-TW/gateway/secrets)。

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

- `billingBackoffHours`：當設定檔因真正的帳單/額度不足錯誤而失敗時，以小時為單位的基礎退避（預設：`5`）。即使在 `401`/`403` 回應中，明確的帳單文字仍可能落在這裡，但提供者專用文字比對器仍限定在其所屬提供者範圍內（例如 OpenRouter 的 `Key limit exceeded`）。可重試的 HTTP `402` 使用時段或組織/工作區支出限制訊息則會留在 `rate_limit` 路徑中。
- `billingBackoffHoursByProvider`：選用的每提供者帳單退避小時覆寫值。
- `billingMaxHours`：帳單退避指數增長的小時上限（預設：`24`）。
- `authPermanentBackoffMinutes`：高信心 `auth_permanent` 失敗的基礎退避分鐘數（預設：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避增長的分鐘上限（預設：`60`）。
- `failureWindowHours`：用於退避計數器的滾動視窗小時數（預設：`24`）。
- `overloadedProfileRotations`：切換至模型備援前，針對過載錯誤允許的同提供者驗證設定檔輪換最大次數（預設：`1`）。像 `ModelNotReadyException` 這類提供者忙碌形態會落在這裡。
- `overloadedBackoffMs`：重試過載提供者/設定檔輪換前的固定延遲（預設：`0`）。
- `rateLimitedProfileRotations`：切換至模型備援前，針對速率限制錯誤允許的同提供者驗證設定檔輪換最大次數（預設：`1`）。該速率限制儲存桶包含提供者形態文字，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 和 `resource exhausted`。

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
- `maxFileBytes`：輪替前作用中記錄檔的最大位元組大小（正整數；預設：`104857600` = 100 MB）。OpenClaw 會在作用中文件旁保留最多五個編號封存檔。
- `redactSensitive` / `redactPatterns`：針對主控台輸出、檔案記錄、OTLP 記錄紀錄，以及持久化工作階段逐字稿文字的盡力遮罩。`redactSensitive: "off"` 只會停用這項一般記錄/逐字稿政策；UI/工具/診斷安全介面在發出前仍會遮蔽密鑰。

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
- `flags`：啟用目標記錄輸出的旗標字串陣列（支援像 `"telegram.*"` 或 `"*"` 這類萬用字元）。
- `stuckSessionWarnMs`：無進度年齡閾值（毫秒），用於將長時間執行的處理工作階段分類為 `session.long_running`、`session.stalled` 或 `session.stuck`（預設：`120000`）。回覆、工具、狀態、區塊和 ACP 進度會重設計時器；重複的 `session.stuck` 診斷會在未變更時退避。
- `stuckSessionAbortMs`：符合條件的停滯中作用中工作可為復原而中止清空前的無進度年齡閾值（毫秒）。未設定時，OpenClaw 會使用較安全的延長嵌入式執行視窗，至少 5 分鐘且為 3 倍 `stuckSessionWarnMs`。
- `memoryPressureSnapshot`：當記憶體壓力達到 `critical` 時，擷取已遮蔽的 OOM 前穩定性快照（預設：`false`）。設定為 `true` 可加入穩定性套件檔案掃描/寫入，同時保留正常記憶體壓力事件。
- `otel.enabled`：啟用 OpenTelemetry 匯出管線（預設：`false`）。完整設定、訊號目錄與隱私模型請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。
- `otel.endpoint`：OTel 匯出的收集器 URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`：選用的訊號專用 OTLP 端點。設定後，只會針對該訊號覆寫 `otel.endpoint`。
- `otel.protocol`：`"http/protobuf"`（預設）或 `"grpc"`。
- `otel.headers`：隨 OTel 匯出請求傳送的額外 HTTP/gRPC 中繼資料標頭。
- `otel.serviceName`：資源屬性的服務名稱。
- `otel.traces` / `otel.metrics` / `otel.logs`：啟用追蹤、指標或記錄匯出。
- `otel.logsExporter`：記錄匯出目的地：`"otlp"`（預設）、每個 stdout 行一個 JSON 物件的 `"stdout"`，或 `"both"`。
- `otel.sampleRate`：追蹤取樣率 `0`-`1`。
- `otel.flushIntervalMs`：週期性遙測資料清出間隔（毫秒）。
- `otel.captureContent`：選擇加入的 OTEL span 屬性原始內容擷取。預設關閉。布林值 `true` 會擷取非系統訊息/工具內容；物件形式可讓你明確啟用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt` 和 `toolDefinitions`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`：最新實驗性 GenAI 推論 span 形態的環境開關，包括 `{gen_ai.operation.name} {gen_ai.request.model}` span 名稱、`CLIENT` span kind，以及使用 `gen_ai.provider.name` 取代舊版 `gen_ai.system`。預設情況下，span 會保留 `openclaw.model.call` 和 `gen_ai.system` 以維持相容性；GenAI 指標使用有界語意屬性。
- `OPENCLAW_OTEL_PRELOADED=1`：適用於已註冊全域 OpenTelemetry SDK 的主機環境開關。OpenClaw 接著會略過外掛擁有的 SDK 啟動/關閉，同時保持診斷監聽器作用中。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 和 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`：在相符設定鍵未設定時使用的訊號專用端點環境變數。
- `cacheTrace.enabled`：針對嵌入式執行記錄快取追蹤快照（預設：`false`）。
- `cacheTrace.filePath`：快取追蹤 JSONL 的輸出路徑（預設：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制快取追蹤輸出中包含的內容（全部預設：`true`）。

---

## 更新

```json5
{
  update: {
    channel: "stable", // stable | extended-stable | beta | dev
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

- `channel`：發行通道 - `"stable"`、`"extended-stable"`、`"beta"` 或 `"dev"`。Extended-stable 是僅限套件、前景/隨需通道；啟動檢查與背景自動更新會略過它。
- `checkOnStart`：閘道啟動時檢查 npm 更新（預設：`true`）。
- `auto.enabled`：為套件安裝啟用背景自動更新（預設：`false`）。
- `auto.stableDelayHours`：stable 通道自動套用前的最小延遲小時數（預設：`6`；最大：`168`）。
- `auto.stableJitterHours`：額外 stable 通道推出分散視窗小時數（預設：`12`；最大：`168`）。
- `auto.betaCheckIntervalHours`：beta 通道檢查執行頻率（小時）（預設：`1`；最大：`24`）。

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    fallbacks: ["acpx-secondary"],
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

- `enabled`：全域 ACP 功能閘門（預設：`true`；設為 `false` 以隱藏 ACP 分派與產生操作入口）。
- `dispatch.enabled`：ACP 工作階段回合分派的獨立閘門（預設：`true`）。設為 `false` 可保留 ACP 命令可用，同時阻擋執行。
- `backend`：預設 ACP 執行階段後端 ID（必須符合已註冊的 ACP 執行階段外掛）。
  請先安裝後端外掛；如果已設定 `plugins.allow`，請包含該後端外掛 ID（例如 `acpx`），否則 ACP 後端將不會載入。
- `fallbacks`：ACP 後端 ID 的有序備援清單；當主要後端在產生任何輸出前，因看似暫時性的錯誤（不可用、速率受限、配額耗盡或過載）提早失敗時會依序嘗試。每個項目都必須符合已註冊的 ACP 執行階段外掛後端。
- `defaultAgent`：當產生作業未指定明確目標時使用的備援 ACP 目標 agent ID。
- `allowedAgents`：允許用於 ACP 執行階段工作階段的 agent ID allowlist；空值表示沒有額外限制。
- `maxConcurrentSessions`：同時啟用的 ACP 工作階段數上限。
- `stream.coalesceIdleMs`：串流文字的閒置 flush 視窗（毫秒）。
- `stream.maxChunkChars`：分割串流區塊投影前的最大區塊大小。
- `stream.repeatSuppression`：每回合抑制重複的狀態/工具行（預設：`true`）。
- `stream.deliveryMode`：`"live"` 會遞增串流；`"final_only"` 會緩衝到回合終止事件。
- `stream.hiddenBoundarySeparator`：隱藏工具事件後、可見文字前的分隔符（預設：`"paragraph"`）。
- `stream.maxOutputChars`：每個 ACP 回合投影的 assistant 輸出字元數上限。
- `stream.maxSessionUpdateChars`：投影 ACP 狀態/更新行的字元數上限。
- `stream.tagVisibility`：標籤名稱到布林可見性覆寫的記錄，用於串流事件。
- `runtime.ttlMinutes`：ACP 工作階段 worker 可清理前的閒置 TTL（分鐘）。
- `runtime.installCommand`：啟動 ACP 執行階段環境時可選執行的安裝命令。

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
  - `"random"`（預設）：輪替的趣味/季節性標語。
  - `"default"`：固定的中性標語（`All your chats, one OpenClaw.`）。
  - `"off"`：沒有標語文字（仍會顯示橫幅標題/版本）。
- 若要隱藏整個橫幅（不只是標語），請設定 env `OPENCLAW_HIDE_BANNER=1`。

---

## 精靈

命令列介面引導式設定流程（`onboard`、`configure`、`doctor`）寫入的 metadata：

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

請參閱 [Agent 預設值](/zh-TW/gateway/config-agents#agent-defaults) 下的 `agents.list` 身分欄位。

---

## 橋接（舊版，已移除）

目前建置版本不再包含 TCP 橋接。節點會透過閘道 WebSocket 連線。`bridge.*` 鍵已不再屬於設定 schema（驗證會失敗直到移除；`openclaw doctor --fix` 可以移除未知鍵）。

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

- `sessionRetention`：從 `sessions.json` 清除前，已完成的隔離 cron 執行工作階段保留多久。也會控制已封存刪除 cron 逐字稿的清理。預設：`24h`；設為 `false` 可停用。
- `runLog.maxBytes`：為了相容較舊的檔案式 cron 執行記錄而接受。預設：`2_000_000` 位元組。
- `runLog.keepLines`：每個工作保留的最新 SQLite 執行歷史列數。預設：`2000`。
- `webhookToken`：用於 cron 網路鉤子 POST 傳遞（`delivery.mode = "webhook"`）的 bearer token；若省略則不會送出 auth header。
- `webhook`：已棄用的舊版備援網路鉤子 URL（http/https），供 `openclaw doctor --fix` 用來遷移仍含有 `notify: true` 的已儲存工作；執行階段傳遞會使用每個工作的 `delivery.mode="webhook"` 加 `delivery.to`，或在保留 announce 傳遞時使用 `delivery.completionDestination`。

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

- `maxAttempts`：cron 工作在暫時性錯誤時的最大重試次數（預設：`3`；範圍：`0`-`10`）。
- `backoffMs`：每次重試嘗試的退避延遲陣列（毫秒）（預設：`[30000, 60000, 300000]`；1-10 個項目）。
- `retryOn`：會觸發重試的錯誤類型 - `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略時會重試所有暫時性類型。

一次性工作會維持啟用，直到重試嘗試耗盡，然後停用並保留最終錯誤狀態。週期性工作會使用相同的暫時性重試政策，在下一個排程時段前先經過退避後再次執行；永久錯誤或暫時性重試耗盡時，會回到一般週期性排程並套用錯誤退避。

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

- `enabled`：啟用 cron 工作失敗警示（預設：`false`）。
- `after`：觸發警示前的連續失敗次數（正整數，最小值：`1`）。
- `cooldownMs`：同一工作重複警示之間的最小毫秒數（非負整數）。
- `includeSkipped`：將連續略過的執行計入警示門檻（預設：`false`）。略過的執行會另外追蹤，且不影響執行錯誤退避。
- `mode`：傳遞模式 - `"announce"` 透過 channel 訊息傳送；`"webhook"` 發布到設定的網路鉤子。
- `accountId`：可選的 account 或 channel ID，用來限定警示傳遞範圍。

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

- 所有工作 cron 失敗通知的預設目的地。
- `mode`：`"announce"` 或 `"webhook"`；當有足夠目標資料時預設為 `"announce"`。
- `channel`：announce 傳遞的 channel 覆寫。`"last"` 會重用最後已知的傳遞 channel。
- `to`：明確的 announce 目標或網路鉤子 URL。webhook 模式必要。
- `accountId`：可選的傳遞 account 覆寫。
- 每個工作的 `delivery.failureDestination` 會覆寫此全域預設。
- 當未設定全域或每個工作的失敗目的地時，已透過 `announce` 傳遞的工作會在失敗時回退到該主要 announce 目標。
- `delivery.failureDestination` 僅支援 `sessionTarget="isolated"` 工作，除非該工作的主要 `delivery.mode` 是 `"webhook"`。

請參閱 [Cron 工作](/zh-TW/automation/cron-jobs)。隔離的 cron 執行會以[背景工作](/zh-TW/automation/tasks)追蹤。

---

## 媒體模型範本變數

在 `tools.media.models[].args` 中展開的範本 placeholder：

| 變數               | 說明                                             |
| ------------------ | ------------------------------------------------ |
| `{{Body}}`         | 完整傳入訊息本文                                 |
| `{{RawBody}}`      | 原始本文（不含歷史/sender wrapper）              |
| `{{BodyStripped}}` | 移除 group mentions 的本文                       |
| `{{From}}`         | Sender 識別碼                                    |
| `{{To}}`           | 目的地識別碼                                     |
| `{{MessageSid}}`   | Channel 訊息 ID                                  |
| `{{SessionId}}`    | 目前工作階段 UUID                                |
| `{{IsNewSession}}` | 建立新工作階段時為 `"true"`                      |
| `{{MediaUrl}}`     | 傳入媒體 pseudo-URL                              |
| `{{MediaPath}}`    | 本機媒體路徑                                     |
| `{{MediaType}}`    | 媒體類型（image/audio/document/…）               |
| `{{Transcript}}`   | 音訊逐字稿                                       |
| `{{Prompt}}`       | 命令列介面項目的已解析媒體 prompt                |
| `{{MaxChars}}`     | 命令列介面項目的已解析最大輸出字元數             |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                          |
| `{{GroupSubject}}` | Group subject（盡力提供）                        |
| `{{GroupMembers}}` | Group members 預覽（盡力提供）                   |
| `{{SenderName}}`   | Sender 顯示名稱（盡力提供）                      |
| `{{SenderE164}}`   | Sender 電話號碼（盡力提供）                      |
| `{{Provider}}`     | Provider 提示（whatsapp、telegram、discord 等）  |

---

## 設定 includes（`$include`）

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
- 檔案陣列：依序深層合併（後者覆寫前者）。
- Sibling 鍵：在 includes 之後合併（覆寫 included 值）。
- 巢狀 includes：最多 10 層深。
- 路徑：相對於 including 檔案解析，但必須留在最上層設定目錄（`openclaw.json` 的 `dirname`）內。Absolute/`../` 形式只有在解析後仍位於該邊界內時才允許。設定 `OPENCLAW_INCLUDE_ROOTS`（absolute paths）可允許設定目錄外的其他 roots。
- 限制：路徑不得包含 null bytes，且在解析前後都必須嚴格短於 4096 個字元；每個 included 檔案上限為 2 MB。
- OpenClaw 擁有的寫入若只變更一個由單檔 include 支援的最上層區段，會寫入該 included 檔案。例如，`plugins install` 會在 `plugins.json5` 中更新 `plugins: { $include: "./plugins.json5" }`，並保持 `openclaw.json` 完整不變。
- Root includes、include 陣列，以及帶有 sibling 覆寫的 includes 對 OpenClaw 擁有的寫入為唯讀；這些寫入會 fail closed，而不是 flattening 設定。
- 錯誤：針對遺失檔案、parse errors、循環 includes、無效路徑格式，以及過長長度提供清楚訊息。

---

## 相關

- [設定](/zh-TW/gateway/configuration)
- [設定範例](/zh-TW/gateway/configuration-examples)
- [Doctor](/zh-TW/gateway/doctor)
