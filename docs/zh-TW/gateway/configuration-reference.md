---
read_when:
    - 你需要確切的欄位層級設定語意或預設值
    - 你正在驗證頻道、模型、閘道或工具的設定區塊
summary: 核心 OpenClaw 設定鍵、預設值及專屬子系統參考連結的閘道設定參考文件
title: 設定參考資料
x-i18n:
    generated_at: "2026-07-12T14:30:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c8a9141db733a6513778a7218933ee5989c62db11472ec6e1e70bd8bf3fcbac8
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` 的欄位層級參考：包含鍵、預設值，以及深入子系統頁面的連結。如需以任務為導向的設定指引，請參閱[設定](/zh-TW/gateway/configuration)。由頻道與外掛擁有的命令目錄，以及記憶體／QMD 的進階調整選項，位於各自的頁面，而非此處。

設定格式為 **JSON5**（允許註解與尾隨逗號）。所有欄位皆為選填；省略時，OpenClaw 會使用安全的預設值。

程式碼實際內容優先於此頁面：

- `openclaw config schema` 會輸出用於驗證與控制介面的即時 JSON Schema，並合併隨附元件、外掛與頻道的中繼資料。
- 代理程式在編輯設定前，應呼叫 `gateway` 工具動作 `config.schema.lookup`，以取得一個依確切路徑限定的結構描述節點。
- `pnpm config:docs:check` / `pnpm config:docs:gen` 會依據目前的結構描述介面，驗證此文件的基準雜湊。

專門的深入參考：

- [記憶體設定參考](/zh-TW/reference/memory-config)：涵蓋 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及 `plugins.entries.memory-core.config.dreaming` 下的夢境整理設定。
- [斜線命令](/zh-TW/tools/slash-commands)：目前內建與隨附的命令目錄。
- 各擁有頻道／外掛的頁面：涵蓋頻道專屬的命令介面。

---

## 頻道

各頻道的設定鍵位於[設定 - 頻道](/zh-TW/gateway/config-channels)：Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 與其他內建頻道使用 `channels.*`（驗證、存取控制、多帳號、提及閘門控管）。

## 代理程式預設值、多代理程式、工作階段與訊息

請參閱[設定 - 代理程式](/zh-TW/gateway/config-agents)，以瞭解：

- `agents.defaults.*`（工作區、模型、思考、心跳偵測、記憶、媒體、Skills、沙箱）
- `multiAgent.*`（多代理程式路由與繫結）
- `session.*`（工作階段生命週期、壓縮、修剪）
- `messages.*`（訊息傳遞、TTS、Markdown 轉譯）
- `talk.*`（對話模式）
  - `talk.consultThinkingLevel`：覆寫 Control UI Talk 即時諮詢背後完整 OpenClaw 代理程式執行的思考層級
  - `talk.consultFastMode`：Control UI Talk 即時諮詢的一次性快速模式覆寫
  - `talk.speechLocale`：供 iOS/macOS 上的 Talk 語音辨識使用的選用 BCP 47 語言環境識別碼
  - `talk.silenceTimeoutMs`：未設定時，Talk 會在傳送逐字稿前保留平台預設的暫停時間範圍（`700 ms on macOS and Android, 900 ms on iOS`）
  - `talk.realtime.consultRouting`：供略過 `openclaw_agent_consult` 的已定稿即時 Talk 逐字稿使用的閘道轉送備援機制

## 工具與自訂供應商

工具政策、實驗性開關、供應商支援的工具設定，以及自訂供應商／基礎 URL 設定，請參閱
[設定 - 工具與自訂供應商](/zh-TW/gateway/config-tools)。

## 模型

供應商定義、模型允許清單及自訂供應商設定位於
[設定－工具與自訂供應商](/zh-TW/gateway/config-tools#custom-providers-and-base-urls)。
`models` 根層級也負責全域模型目錄行為。

```json5
{
  models: {
    // 選用。預設值：true。變更後需要重新啟動閘道。
    pricing: { enabled: false },
  },
}
```

- `models.mode`：供應商目錄行為（`merge` 或 `replace`）。
- `models.providers`：以供應商 ID 為鍵的自訂供應商對應表。
- `models.providers.*.localService`：用於本機模型伺服器的選用隨選程序管理器。OpenClaw 會探測已設定的健康狀態端點、在需要時啟動絕對路徑的 `command`、等待服務就緒，然後傳送模型要求。請參閱[本機模型服務](/zh-TW/gateway/local-model-services)。
- `models.pricing.enabled`：控制背景定價啟動程序；該程序會在輔助程序與頻道進入閘道就緒路徑後開始。設為 `false` 時，閘道會略過擷取 OpenRouter 與 LiteLLM 的定價目錄；已設定的 `models.providers.*.models[].cost` 值仍可用於本機成本估算。

## MCP

由 OpenClaw 管理的 MCP 伺服器定義位於 `mcp.servers` 下，並由內嵌 OpenClaw 與其他執行階段介接器使用。`openclaw mcp list`、`show`、`set` 和 `unset` 命令可管理此區塊，且在編輯設定期間不會連線至目標伺服器。

```json5
{
  mcp: {
    // 選用。預設值：600000 ms（10 分鐘）。設為 0 可停用閒置清除。
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
        // 選用的 Codex app-server 投影控制項。
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`：具名的 stdio 或遠端 MCP 伺服器定義，供公開已設定 MCP 工具的執行階段使用。遠端項目使用 `transport: "streamable-http"` 或 `transport: "sse"`；`type: "http"` 是命令列介面原生別名，`openclaw mcp set` 與 `openclaw doctor --fix` 會將其正規化至標準 `transport` 欄位。
- `mcp.servers.<name>.enabled`：設為 `false` 可保留已儲存的伺服器定義，同時將其排除於內嵌 OpenClaw MCP 探索與工具投影之外。
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`：各伺服器的 MCP 要求逾時，以秒或毫秒為單位。
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`：各伺服器的連線逾時，以秒或毫秒為單位。
- `mcp.servers.<name>.supportsParallelToolCalls`：選用的並行提示，供可選擇是否發出平行 MCP 工具呼叫的介接器使用。
- `mcp.servers.<name>.auth`：對需要 OAuth 的 HTTP MCP 伺服器設為 `"oauth"`。執行 `openclaw mcp login <name>`，將權杖儲存於 OpenClaw 狀態中。
- `mcp.servers.<name>.oauth`：選用的 OAuth 範圍、重新導向 URL 及用戶端中繼資料 URL 覆寫。
- `mcp.servers.<name>.sslVerify`、`clientCert`、`clientKey`：用於私人端點與雙向 TLS 的 HTTP TLS 控制項。
- `mcp.servers.<name>.toolFilter`：選用的各伺服器工具選擇設定。`include` 將探索到的 MCP 工具限制為名稱相符者；`exclude` 則隱藏名稱相符者。項目可為完整 MCP 工具名稱或簡單的 `*` glob。具有資源或提示詞的伺服器也會產生公用工具名稱（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`），這些名稱使用相同的篩選器。
- `mcp.servers.<name>.codex`：選用的 Codex app-server 投影控制項。此區塊是僅供 Codex app-server 執行緒使用的 OpenClaw 中繼資料；不會影響 ACP 工作階段、一般 Codex 控制框架設定或其他執行階段介接器。非空白的 `codex.agents` 會將伺服器限制於列出的 OpenClaw 代理程式 ID。空白、僅含空白字元或無效的範圍代理程式清單會遭設定驗證拒絕，且執行階段投影路徑會略過這些清單，而不會使其成為全域設定。`codex.defaultToolsApprovalMode` 會為該伺服器產生 Codex 原生的 `default_tools_approval_mode`。OpenClaw 將原生 `mcp_servers` 設定傳遞給 Codex 前，會移除 `codex` 區塊。省略此區塊即可讓伺服器以 Codex 的預設 MCP 核准行為，投影至每個 Codex app-server 代理程式。
- `mcp.sessionIdleTtlMs`：工作階段範圍內隨附 MCP 執行階段的閒置 TTL。單次內嵌執行會要求在執行結束時清理；此 TTL 則作為長期工作階段與未來呼叫端的後備機制。
- `mcp.*` 下的變更會透過處置快取的工作階段 MCP 執行階段即時套用。下一次工具探索或使用時，會依新設定重新建立執行階段，因此已移除的 `mcp.servers` 項目會立即清除，而不會等待閒置 TTL。
- 執行階段探索也會處理 MCP 工具清單變更通知，方法是捨棄該工作階段的快取目錄。宣告資源或提示詞的伺服器會取得公用工具，以列出／讀取資源，以及列出／擷取提示詞。工具呼叫重複失敗時，受影響的伺服器會短暫暫停，之後才會再次嘗試呼叫。

請參閱 [MCP](/zh-TW/cli/mcp#openclaw-as-an-mcp-client-registry) 與[命令列介面後端](/zh-TW/gateway/cli-backends#bundle-mcp-overlays)，以瞭解執行階段行為。

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 或純文字字串
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`：僅適用於隨附 Skills 的選用允許清單（不影響受管理／工作區 Skills）。
- `load.extraDirs`：額外的共用 Skill 根目錄（優先順序最低）。
- `load.allowSymlinkTargets`：受信任的實際目標根目錄；當 Skill 符號連結位於其已設定的來源根目錄之外時，可解析至這些根目錄。
- `workshop.allowSymlinkTargetWrites`：允許 Skill Workshop 套用操作透過已受信任的符號連結目標寫入（預設值：false）。
- `install.preferBrew`：設為 true 時，若 `brew` 可用，會優先使用 Homebrew 安裝程式，再退回其他安裝程式類型。
- `install.nodeManager`：`metadata.openclaw.install` 規格的節點安裝程式偏好設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`：允許受信任的 `operator.admin` 閘道用戶端安裝透過 `skills.upload.*` 暫存的私人 zip 封存檔（預設值：false）。這只會啟用上傳封存檔路徑；一般 ClawHub 安裝不需要此設定。
- `entries.<skillKey>.enabled: false` 會停用 Skill，即使該 Skill 已隨附／安裝。
- `entries.<skillKey>.apiKey`：為宣告主要環境變數的 Skills 提供的便利設定（純文字字串或 SecretRef 物件）。
- `limits.maxCandidatesPerRoot`、`limits.maxSkillsLoadedPerSource`、`limits.maxSkillsInPrompt`、`limits.maxSkillsPromptChars`、`limits.maxSkillFileBytes`：限制 Skill 探索及面向模型的 Skills 提示詞。
- Skill Workshop 自主性／核准設定（`workshop.autonomous.enabled`、`workshop.approvalPolicy`、`workshop.maxPending`、`workshop.maxSkillBytes`）記載於 [Skills 設定](/zh-TW/tools/skills-config)。

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

- 從 `~/.openclaw/extensions` 和 `<workspace>/.openclaw/extensions` 下的套件或套件組合目錄載入，並載入 `plugins.load.paths` 中列出的檔案或目錄。
- 將獨立外掛檔案放入 `plugins.load.paths`；自動探索的擴充功能根目錄會忽略頂層 `.js`、`.mjs` 和 `.ts` 檔案，因此這些根目錄中的輔助指令碼不會阻止啟動。
- 探索機制接受原生 OpenClaw 外掛，以及相容的 Codex 套件組合和 Claude 套件組合，包括沒有資訊清單且採用 Claude 預設版面配置的套件組合。
- **設定變更需要重新啟動閘道。**
- `allow`：選用的允許清單（只載入列出的外掛）。`deny` 優先。
- `plugins.entries.<id>.apiKey`：外掛層級的 API 金鑰便利欄位（外掛支援時）。
- `plugins.entries.<id>.env`：外掛範圍的環境變數對應表。
- `plugins.entries.<id>.hooks.allowPromptInjection`：設為 `false` 時，核心會封鎖 `before_prompt_build`，並忽略舊版 `before_agent_start` 中會修改提示詞的欄位，同時保留舊版 `modelOverride` 和 `providerOverride`。適用於原生外掛鉤子以及受支援的套件組合所提供的鉤子目錄。
- `plugins.entries.<id>.hooks.allowConversationAccess`：設為 `true` 時，受信任且非內建的外掛可以透過 `llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize` 和 `agent_end` 等具型別鉤子讀取原始對話內容。
- `plugins.entries.<id>.subagent.allowModelOverride`：明確信任此外掛可為背景子代理程式執行要求每次執行的 `provider` 和 `model` 覆寫。
- `plugins.entries.<id>.subagent.allowedModels`：受信任子代理程式覆寫可使用之標準 `provider/model` 目標的選用允許清單。只有在你確實想允許任何模型時才使用 `"*"`。
- `plugins.entries.<id>.llm.allowModelOverride`：明確信任此外掛可為 `api.runtime.llm.complete` 要求模型覆寫。
- `plugins.entries.<id>.llm.allowedModels`：受信任外掛之 LLM 補全覆寫可使用的標準 `provider/model` 目標選用允許清單。只有在你確實想允許任何模型時才使用 `"*"`。
- `plugins.entries.<id>.llm.allowAgentIdOverride`：明確信任此外掛可針對非預設代理程式 ID 執行 `api.runtime.llm.complete`。
- `plugins.entries.<id>.config`：由外掛定義的設定物件（可用時，由原生 OpenClaw 外掛結構描述驗證）。
- 頻道外掛帳號／執行階段設定位於 `channels.<id>` 下，且應由所屬外掛資訊清單的 `channelConfigs` 中繼資料描述，而不是由中央 OpenClaw 選項登錄檔描述。

### Codex 工具框架外掛設定

內建的 `codex` 外掛在 `plugins.entries.codex.config` 下擁有原生 Codex app-server 工具框架設定。完整設定介面請參閱
[Codex 工具框架參考](/zh-TW/plugins/codex-harness-reference)，執行階段模型請參閱
[Codex 工具框架](/zh-TW/plugins/codex-harness)。

`codexPlugins` 僅適用於選取原生 Codex 工具框架的工作階段。
它不會為 OpenClaw 提供者執行、ACP
對話繫結或任何非 Codex 工具框架啟用 Codex 外掛。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
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

- `plugins.entries.codex.config.codexPlugins.enabled`：為 Codex 工具框架啟用原生 Codex
  外掛／應用程式支援。預設值：`false`。
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`：在每個新的原生 Codex
  執行緒中，公開目前已連線至已驗證 Codex 帳號且可存取的所有應用程式。預設值：`false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`：
  已設定之外掛應用程式引導要求的預設破壞性動作政策。
  使用 `true` 可在不提示的情況下接受安全的 Codex 核准結構描述，使用 `false`
  可拒絕它們，使用 `"auto"` 可透過 OpenClaw
  外掛核准轉送 Codex 要求的核准，或使用 `"ask"` 在每次外掛寫入／破壞性
  動作時提示，且不建立持久核准。`"ask"` 模式會清除受影響應用程式的持久 Codex
  個別工具核准覆寫，並在 Codex 執行緒啟動前為該應用程式選取人工
  核准審核者。
  預設值：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`：當全域 `codexPlugins.enabled`
  也為 true 時，啟用已設定的外掛項目。
  明確項目的預設值：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`：
  穩定的市集識別資訊，每個已解析項目都必須與 `pluginName` 搭配使用。
  支援 `"openai-curated"` 和 `"workspace-directory"`。缺少任一識別欄位的
  項目都會被忽略。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`：穩定的
  Codex 外掛識別資訊，必須與 `marketplaceName` 搭配使用。
  `workspace-directory` 項目必須使用 `plugin/list` 傳回且包含完整市集限定名稱的
  確切 `summary.id`，例如
  `"example-plugin@workspace-directory"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`：
  個別外掛的破壞性動作覆寫。省略時會使用全域
  `allow_destructive_actions` 值。個別外掛值接受相同的
  `true`、`false`、`"auto"` 或 `"ask"` 政策。

每個使用 `"ask"` 且獲准的外掛應用程式，都會將該應用程式的核准要求
轉送給人工審核者。其他應用程式和非應用程式執行緒核准會保留其
已設定的審核者，因此混合的外掛政策不會繼承 `"ask"` 行為。

`codexPlugins.enabled` 是全域啟用指令。由遷移寫入的明確外掛
項目，是持久的精選安裝與修復
適用集合。手動設定的 `workspace-directory` 項目必須已經
安裝並啟用，且其所屬應用程式必須可供存取；OpenClaw
不會安裝它們或為它們進行驗證。如果 Codex 拒絕明確的工作區
目錄要求，已啟用的工作區項目會以
`marketplace_missing` 採取封閉式失敗，而預設目錄中的精選項目仍然
可用。不支援 `plugins["*"]`，沒有 `install` 開關，而且
本機 `marketplacePath` 值刻意不設為設定欄位，因為它們
取決於主機。應用程式伺服器版本與
就緒要求請參閱[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。

`app/list` 就緒檢查會快取一小時，並在過期時
非同步重新整理。Codex 執行緒應用程式設定會在建立 Codex 工具框架
工作階段時計算，而不是在每一輪都計算；變更原生外掛設定後，請使用 `/new`、`/reset` 或重新啟動閘道。

`codexPlugins.allow_all_plugins` 會將每個目前可存取的帳號
應用程式快照至每個新的原生 Codex 執行緒。它不會安裝外掛或應用程式，而且
無法存取的應用程式仍會被排除。帳號應用程式使用全域
`codexPlugins.allow_destructive_actions` 政策。同一應用程式同時存在於兩種路徑時，
明確外掛項目優先。如果無法讀取 `app/list`，
帳號範圍的公開會採取封閉式失敗。

- `plugins.entries.firecrawl.config.webFetch`：Firecrawl 網頁擷取提供者設定。
  - `apiKey`：用於提高限制的選用 Firecrawl API 金鑰（接受 SecretRef）。若未設定，會依序退回使用 `plugins.entries.firecrawl.config.webSearch.apiKey`、舊版 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY` 環境變數。
  - `baseUrl`：Firecrawl API 基底 URL（預設值：`https://api.firecrawl.dev`；自架覆寫必須指向私人／內部端點）。
  - `onlyMainContent`：僅擷取頁面的主要內容（預設值：`true`）。
  - `maxAgeMs`：快取期限上限，以毫秒為單位（預設值：`172800000`／2 天）。
  - `timeoutSeconds`：擷取要求逾時秒數（預設值：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok 網頁搜尋）設定。
  - `enabled`：啟用 X Search 提供者。
  - `model`：搜尋使用的 Grok 模型（例如 `"grok-4.3"`）。
- `plugins.entries.memory-core.config.dreaming`：記憶夢境整理設定。階段與閾值請參閱[夢境整理](/zh-TW/concepts/dreaming)。
  - `enabled`：夢境整理總開關（預設值為 `false`）。
  - `frequency`：每次完整夢境整理掃描的排程頻率（預設為 `"0 3 * * *"`）。
  - `model`：選用的 Dream Diary 子代理程式模型覆寫。需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`；請與 `allowedModels` 搭配以限制目標。模型不可用錯誤會使用工作階段預設模型重試一次；信任或允許清單失敗不會靜默退回。
  - 階段政策和閾值是實作細節（不是面向使用者的設定鍵）。
- 完整記憶設定位於[記憶設定參考](/zh-TW/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已啟用的 Claude 套件組合外掛也可以從 `settings.json` 提供內嵌的 OpenClaw 預設值；OpenClaw 會將其套用為經清理的代理程式設定，而不是原始 OpenClaw 設定修補。
- `plugins.slots.memory`：選取使用中的記憶外掛 ID，或使用 `"none"` 停用記憶外掛。
- `plugins.slots.contextEngine`：選取使用中的情境引擎外掛 ID；除非你安裝並選取其他引擎，否則預設為 `"legacy"`。

請參閱[外掛](/zh-TW/tools/plugin)。

---

## 承諾事項

`commitments` 控制推斷出的後續追蹤記憶：OpenClaw 可以從對話輪次偵測後續確認事項，並透過心跳偵測執行傳遞。

- `commitments.enabled`：為推斷出的後續追蹤承諾事項啟用隱藏的 LLM 擷取、儲存和心跳偵測傳遞。預設值：`false`。
- `commitments.maxPerDay`：每個代理程式工作階段在滾動一天內傳遞之推斷後續追蹤承諾事項的上限。預設值：`3`。

請參閱[推斷出的承諾事項](/zh-TW/concepts/commitments)。

---

## 瀏覽器

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 僅針對受信任的私人網路存取選擇啟用
      // allowPrivateNetwork: true, // 舊版別名
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
- `tabCleanup` 會在閒置一段時間後，或工作階段超過其上限時，回收受追蹤的主要代理程式分頁。設定 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 可分別停用對應的清理模式。
- 未設定時，`ssrfPolicy.dangerouslyAllowPrivateNetwork` 會停用，因此瀏覽器導覽預設維持嚴格模式。
- 只有在你刻意信任私有網路瀏覽器導覽時，才設定 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在嚴格模式下，遠端 CDP 設定檔端點（`profiles.*.cdpUrl`）於連線能力／探索檢查期間，也會受到相同的私有網路封鎖限制。
- `ssrfPolicy.allowPrivateNetwork` 仍支援作為舊版別名。
- 在嚴格模式下，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 設定明確的例外。
- 遠端設定檔僅能附加（啟動／停止／重設功能已停用）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  若要讓 OpenClaw 探索 `/json/version`，請使用 HTTP(S)；若供應商提供直接的 DevTools WebSocket URL，請使用 WS(S)。
- `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 適用於遠端及
  `attachOnly` CDP 連線能力與分頁開啟要求。受管理的迴路位址設定檔
  會保留本機 CDP 預設值。持續性遠端 Playwright 分頁
  列舉會使用較大的值作為其作業期限。
- 如果可透過迴路位址連線至外部管理的 CDP 服務，請將該
  設定檔的 `attachOnly: true`；否則 OpenClaw 會將該迴路位址連接埠視為
  本機受管理的瀏覽器設定檔，並可能回報本機連接埠擁有權錯誤。
- `existing-session` 設定檔使用 Chrome MCP 而非 CDP，且可附加至
  所選主機或透過已連線的瀏覽器節點附加。
- `existing-session` 設定檔可設定 `userDataDir`，以指定特定的
  Chromium 系瀏覽器設定檔，例如 Brave 或 Edge。
- 當 Chrome 已在 DevTools HTTP(S) 探索端點或直接 WS(S) 端點後方執行時，
  `existing-session` 設定檔可設定 `cdpUrl`。在該
  模式下，OpenClaw 會將端點傳遞給 Chrome MCP，而不使用自動連線；
  Chrome MCP 啟動引數會忽略 `userDataDir`。
- `existing-session` 設定檔會保留目前的 Chrome MCP 路由限制：
  使用快照／參照驅動的動作，而非 CSS 選取器指定；單一檔案上傳
  掛鉤；無對話方塊逾時覆寫；不支援 `wait --load networkidle`；也不支援
  `responsebody`、PDF 匯出、下載攔截或批次動作。
- 本機受管理的 `openclaw` 設定檔會自動指派 `cdpPort` 和 `cdpUrl`；只有遠端 CDP 設定檔或 existing-session 端點附加時，才明確設定
  `cdpUrl`。
- 本機受管理的設定檔可設定 `executablePath`，以覆寫該設定檔的全域
  `browser.executablePath`。可藉此讓一個設定檔使用 Chrome，另一個使用 Brave。
- 本機受管理的設定檔會使用 `browser.localLaunchTimeoutMs`，在程序啟動後進行 Chrome CDP HTTP
  探索，並使用 `browser.localCdpReadyTimeoutMs` 等待
  啟動後的 CDP WebSocket 就緒。在較慢的主機上，如果 Chrome
  能成功啟動，但就緒檢查與啟動程序發生競速，請提高這些值。兩個值都必須是
  不超過 `120000` ms 的正整數；無效的設定值會遭到拒絕。
- 自動偵測順序：若預設瀏覽器以 Chromium 為基礎，則使用預設瀏覽器 → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 都
  接受 `~` 和 `~/...`，並會在啟動 Chromium 前將其展開為你作業系統的家目錄。
  `existing-session` 設定檔中的個別設定檔 `userDataDir` 也會展開波浪號。
- 控制服務：僅限迴路位址（連接埠衍生自 `gateway.port`，預設為 `18791`）。
- `extraArgs` 會將額外的啟動旗標附加至本機 Chromium 啟動程序（例如
  `--disable-gpu`、視窗大小或偵錯旗標）。

---

## 使用者介面

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // 表情符號、短文字、圖片 URL 或資料 URI
    },
  },
}
```

- `seamColor`：原生應用程式介面外框的強調色（Talk Mode 氣泡色調等）。
- `assistant`：Control UI 身分覆寫。若未設定，則使用目前使用中的代理程式身分。

---

## 閘道

```json5
{
  gateway: {
    mode: "local", // 本機 | 遠端
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // 無 | 權杖 | 密碼 | 受信任的 Proxy
      token: "your-token",
      // password: "your-password", // 或 OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // 用於 mode=trusted-proxy；請參閱 /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // 關閉 | 提供服務 | Funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // toolTitles: false, // 選擇啟用工具呼叫的 AI 用途標題（會消耗實用模型權杖）
      // embedSandbox: "scripts", // 嚴格 | 指令碼 | 受信任
      // allowExternalEmbedUrls: false, // 危險：允許絕對外部 http(s) 內嵌 URL
      // chatMessageMaxWidth: "min(1280px, 82%)", // 選用的置中聊天記錄最大寬度
      // allowedOrigins: ["https://control.example.com"], // 非迴路位址 Control UI 必須設定
      // dangerouslyAllowHostHeaderOriginFallback: false, // 危險的 Host 標頭來源後援模式
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    terminal: {
      enabled: false,
      // shell: "/bin/zsh",
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | 直接
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // 選用。預設為 false。
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // 選用。預設未設定／停用。
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
        // 經 SSH 驗證的自動核准。預設：啟用（true）。
        // 設為 false 僅會停用 SSH 驗證；這不會影響
        // 上方的 autoApproveCidrs。若要僅允許手動節點配對，請設為 false 並且
        // 不設定 autoApproveCidrs。傳入物件可進行調整：{ user, identity,
        // timeoutMs, cidrs }。
        sshVerify: true,
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // 額外拒絕的 /tools/invoke HTTP 項目
      deny: ["browser"],
      // 為擁有者／管理員呼叫者從預設 HTTP 拒絕清單移除工具
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

- `mode`：`local`（執行閘道）或 `remote`（連線至遠端閘道）。除非設為 `local`，否則閘道會拒絕啟動。
- `port`：WS + HTTP 共用的單一多工連接埠。優先順序：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（預設）、`lan`（`0.0.0.0`）、`tailnet`（可用時使用 Tailscale IPv4，否則使用回送位址），或 `custom`（一個 IPv4 位址）。解析出的 `tailnet` 位址以及任何不是 `127.0.0.1` 或 `0.0.0.0` 的 `custom` 位址，都需要在相同連接埠上使用 `127.0.0.1`，供同一主機的用戶端使用；若任一監聽器無法繫結，啟動便會失敗。非回送位址的公開範圍仍限於所選介面。
- **舊版繫結別名**：請在 `gateway.bind` 中使用繫結模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），而不是主機別名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事項**：預設的 `loopback` 繫結會在容器內監聽 `127.0.0.1`。使用 Docker 橋接網路（`-p 18789:18789`）時，流量會從 `eth0` 抵達，因此無法連上閘道。請使用 `--network host`，或設定 `bind: "lan"`（或使用 `bind: "custom"` 搭配 `customBindHost: "0.0.0.0"`）以監聽所有介面。
- **驗證**：預設為必要。非回送位址繫結需要閘道驗證。實際上，這表示需要共用權杖／密碼，或搭配 `gateway.auth.mode: "trusted-proxy"` 的身分感知反向 Proxy。新手設定精靈預設會產生權杖。
- 若同時設定 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRefs），請將 `gateway.auth.mode` 明確設為 `token` 或 `password`。同時設定兩者但未設定模式時，啟動以及服務安裝／修復流程都會失敗。
- `gateway.auth.mode: "none"`：明確的無驗證模式。僅用於受信任的本機回送位址設定；新手設定提示刻意不提供此選項。
- `gateway.auth.mode: "trusted-proxy"`：將瀏覽器／使用者驗證委派給身分感知反向 Proxy，並信任來自 `gateway.trustedProxies` 的身分標頭（請參閱[受信任的 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)）。此模式預設要求 Proxy 來源為**非回送位址**；同一主機上的回送位址反向 Proxy 需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。同一主機的內部呼叫端可以使用 `gateway.auth.password` 作為本機直接備援；`gateway.auth.token` 仍與受信任 Proxy 模式互斥。
- `gateway.auth.allowTailscale`：設為 `true` 時，Tailscale Serve 身分標頭可滿足 Control UI／WebSocket 驗證（透過 `tailscale whois` 驗證）。HTTP API 端點**不會**使用該 Tailscale 標頭驗證，而是遵循閘道的一般 HTTP 驗證模式。此無權杖流程假設閘道主機可信任。當 `tailscale.mode = "serve"` 時，預設為 `true`。
- `gateway.auth.rateLimit`：選用的驗證失敗速率限制器。依每個用戶端 IP 和每個驗證範圍套用（共用祕密與裝置權杖會分別追蹤）。遭封鎖的嘗試會傳回 `429` + `Retry-After`。
  - 在非同步 Tailscale Serve Control UI 路徑上，會先依相同的 `{scope, clientIp}` 將失敗嘗試序列化，再寫入失敗紀錄。因此，來自相同用戶端的並行錯誤嘗試，可能會在第二個要求時觸發限制器，而非兩者競速通過並僅被視為一般不相符。
  - `gateway.auth.rateLimit.exemptLoopback` 預設為 `true`；若你刻意也要限制 localhost 流量的速率（用於測試設定或嚴格的 Proxy 部署），請設為 `false`。
- 來自瀏覽器來源的 WS 驗證嘗試一律會受到節流，且不套用回送位址豁免（作為防範瀏覽器型 localhost 暴力破解的縱深防禦）。
- 在回送位址上，這些來自瀏覽器來源的鎖定會依正規化後的 `Origin`
  值分別隔離，因此某個 localhost 來源重複失敗時，不會自動
  鎖定其他來源。
- `tailscale.mode`：`serve`（僅限 tailnet，回送位址繫結）或 `funnel`（公開，需要驗證）。
- `tailscale.serviceName`：Serve 模式的選用 Tailscale Service 名稱，例如
  `svc:openclaw`。設定後，OpenClaw 會將其傳給 `tailscale serve
--service`，讓 Control UI 可透過具名 Service 公開，而非使用
  裝置主機名稱。此值必須採用 Tailscale 的 `svc:<dns-label>`
  Service 名稱格式；啟動時會報告衍生出的 Service URL。
- `tailscale.preserveFunnel`：設為 `true` 且 `tailscale.mode = "serve"` 時，OpenClaw
  會在啟動時重新套用 Serve 前檢查 `tailscale funnel status`，若外部設定的
  Funnel 路由已涵蓋閘道連接埠，便會略過套用。
  預設為 `false`。
- `controlUi.allowedOrigins`：閘道 WebSocket 連線所允許的明確瀏覽器來源清單。公開的非回送位址瀏覽器來源必須設定。從回送位址、RFC1918／連結本機位址、`.local`、`.ts.net` 或 Tailscale CGNAT 主機載入的私有同源 LAN／Tailnet UI，無須啟用 Host 標頭備援即可接受。
- `controlUi.toolTitles`：選擇啟用 Control UI 聊天中由 AI 產生的工具呼叫用途標題。預設：`false`（工具呈現維持完全確定性，不會在背景呼叫模型）。啟用時，`chat.toolTitles` 方法會透過標準公用模型路由為複雜呼叫加上標籤——代理程式的 `utilityModel`（這是操作員的決策，可能會如同每項公用工作一樣，將受限的工具引數傳送給所選提供者），或工作階段提供者宣告的預設小型模型（OpenAI → `gpt-5.6-luna`、Anthropic → `claude-haiku-4-5`）——並將結果快取於每個代理程式的狀態資料庫中，因此重複檢視絕不會再次計費。`utilityModel: \"\"` 如同所有其他公用工作一樣停用標題；標題絕不會退回使用主要模型。
- `controlUi.chatMessageMaxWidth`：置中的 Control UI 聊天記錄之選用最大寬度。接受受限的 CSS 寬度值，例如 `960px`、`82%`、`min(1280px, 82%)` 和 `calc(100% - 2rem)`。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：啟用 Host 標頭來源備援的危險模式，適用於刻意依賴 Host 標頭來源原則的部署。
- `terminal.enabled`：選擇啟用管理員範圍的操作員終端機。預設：`false`。終端機會在所選代理程式工作區中啟動主機 PTY、繼承閘道程序環境，且對設定 `sandbox.mode: "all"` 的代理程式會拒絕啟動。僅在受信任的操作員部署中啟用；變更此設定會重新啟動閘道，並更新 Control UI 內容安全性原則。
- `terminal.shell`：選用的 Shell 執行檔。未設定時，OpenClaw 在 Unix 上使用 `$SHELL`，在 Windows 上使用 `%ComSpec%`。
- `terminal.detachedSessionTimeoutSeconds`：終端機工作階段在連線中斷（頁面重新載入、筆記型電腦進入睡眠）後可存續多久，期間仍可透過 `terminal.attach` 重新連接，並重播其近期輸出。預設：`300`。設為 `0` 可在連線中斷時立即終止工作階段。已中斷連線的工作階段仍會繼續執行命令，因此在共用或公開的主機上請縮短此時間。
- `remote.transport`：`ssh`（預設）或 `direct`（ws/wss）。若使用 `direct`，公開主機的 `remote.url` 必須為 `wss://`；明文 `ws://` 僅接受回送位址、LAN、連結本機位址、`.local`、`.ts.net` 和 Tailscale CGNAT 主機。
- `remote.remotePort`：遠端 SSH 主機上的閘道連接埠。預設為 `18789`；當本機通道連接埠與遠端閘道連接埠不同時，請使用此設定。
- `remote.sshHostKeyPolicy`：macOS SSH 通道的主機金鑰原則。`strict` 為預設值，且需要已受信任的金鑰。`openssh` 是明確選擇採用受管理別名所適用之 OpenSSH 有效設定的選項；使用前請檢查相符的使用者與系統 SSH 設定。macOS App 和 `configure-remote` 在變更目標時，會將此原則重設為 `strict`，除非再次明確選擇其他設定。
- `gateway.remote.token`／`.password` 是遠端用戶端的認證資訊欄位。它們本身不會設定閘道驗證。
- `gateway.push.apns.relay.baseUrl`：外部 APNs Relay 的 HTTPS 基底 URL，用於採用 Relay 的 iOS 組建將註冊資訊發佈至閘道後。公開 App Store 組建使用 OpenClaw 託管的 Relay。自訂 Relay URL 必須搭配刻意分離的 iOS 組建／部署路徑，且該路徑的 Relay URL 必須指向該 Relay。
- `gateway.push.apns.relay.timeoutMs`：閘道傳送至 Relay 的逾時時間，以毫秒為單位。預設為 `10000`。
- 採用 Relay 的註冊會委派給特定閘道身分。已配對的 iOS App 會擷取 `gateway.identity.get`、在 Relay 註冊中包含該身分，並將限定於該註冊的傳送授權轉交給閘道。其他閘道無法重複使用該已儲存的註冊。
- `OPENCLAW_APNS_RELAY_BASE_URL`／`OPENCLAW_APNS_RELAY_TIMEOUT_MS`：上述 Relay 設定的暫時環境變數覆寫。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：僅供開發使用的例外通道，允許回送位址 HTTP Relay URL。正式環境的 Relay URL 應維持使用 HTTPS。
- `gateway.handshakeTimeoutMs`：驗證前的閘道 WebSocket 交握逾時時間，以毫秒為單位。預設：`15000`。設定 `OPENCLAW_HANDSHAKE_TIMEOUT_MS` 時，該值優先。在負載較高或效能較低的主機上，如果本機用戶端可在啟動暖機尚未穩定時開始連線，請增加此值。
- `gateway.channelHealthCheckMinutes`：頻道健康狀態監視器的間隔，以分鐘為單位。設為 `0` 可全域停用健康狀態監視器重新啟動。預設：`5`。
- `gateway.channelStaleEventThresholdMinutes`：過期 Socket 的門檻，以分鐘為單位。此值應大於或等於 `gateway.channelHealthCheckMinutes`。預設：`30`。
- `gateway.channelMaxRestartsPerHour`：每個頻道／帳號在滾動一小時內，健康狀態監視器可重新啟動的次數上限。預設：`10`。
- `channels.<provider>.healthMonitor.enabled`：在保持全域監視器啟用的情況下，讓個別頻道選擇停用健康狀態監視器重新啟動。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多帳號頻道的個別帳號覆寫。設定後，其優先順序高於頻道層級覆寫。
- 僅當未設定 `gateway.auth.*` 時，本機閘道呼叫路徑才能使用 `gateway.remote.*` 作為備援。
- 若透過 SecretRef 明確設定 `gateway.auth.token`／`gateway.auth.password` 但無法解析，解析會採取失敗即關閉原則（不會以遠端備援掩蓋問題）。
- `trustedProxies`：終止 TLS 或注入轉送用戶端標頭的反向 Proxy IP。僅列出你控制的 Proxy。回送位址項目對同一主機的 Proxy／本機偵測設定仍有效（例如 Tailscale Serve 或本機反向 Proxy），但它們**不會**使回送位址要求符合 `gateway.auth.mode: "trusted-proxy"` 的資格。
- `allowRealIpFallback`：設為 `true` 時，若缺少 `X-Forwarded-For`，閘道會接受 `X-Real-IP`。預設為 `false`，以採取失敗即關閉行為。
- `gateway.nodes.pairing.autoApproveCidrs`：選用的 CIDR／IP 允許清單，用於自動核准首次進行且未要求任何範圍的節點裝置配對。未設定時停用。此設定不會自動核准操作員／瀏覽器／Control UI／WebChat 配對，也不會自動核准角色、範圍、中繼資料或公開金鑰升級。
- `gateway.nodes.pairing.sshVerify`：透過 SSH 驗證自動核准首次節點裝置配對（預設：啟用）。閘道會透過 SSH 連回配對主機（BatchMode、嚴格主機金鑰），並且僅在 `openclaw node identity` 裝置金鑰完全相符時才核准。資格下限與 `autoApproveCidrs` 相同；除非 `cidrs` 覆寫，否則探查僅限私人／CGNAT 來源位址。設為 `false` 可停用，或使用 `{ user, identity, timeoutMs, cidrs }` 進行調整。請參閱[節點配對](/zh-TW/gateway/pairing#ssh-verified-device-auto-approval-default)。
  - `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`：在配對與平台允許清單評估後，針對已宣告的節點命令套用全域允許／拒絕規則。使用 `allowCommands` 選擇啟用危險的節點命令，例如 `camera.snap`、`camera.clip`、`screen.record`、`sms.search` 和 `sms.send`；即使平台預設值或明確允許原本會納入某個命令，`denyCommands` 仍會將其移除。Android SMS 權限與閘道命令授權彼此獨立。節點變更其宣告的命令清單後，請拒絕該裝置的配對並重新核准，讓閘道儲存更新後的命令快照。
  - `gateway.tools.deny`：針對 HTTP `POST /tools/invoke` 額外封鎖的工具名稱（擴充預設拒絕清單）。
  - `gateway.tools.allow`：從預設 HTTP 拒絕清單中移除工具名稱，供
  擁有者／管理員呼叫端使用。這不會將帶有身分資訊的 `operator.write`
  呼叫端提升為擁有者／管理員存取權；即使列入允許清單，非擁有者呼叫端仍
  無法使用 `cron`、`gateway` 和 `nodes`。

</Accordion>

### OpenAI 相容端點

- 管理 HTTP RPC：預設停用，並以 `admin-http-rpc` 外掛形式提供。啟用此外掛即可註冊 `POST /api/v1/admin/rpc`。請參閱[管理 HTTP RPC](/zh-TW/plugins/admin-http-rpc)。
- Chat Completions：預設停用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 啟用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 輸入強化：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空白允許清單會視為未設定；使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和／或 `gateway.http.endpoints.responses.images.allowUrl=false` 停用 URL 擷取。
- 選用的回應強化標頭：
  - `gateway.http.securityHeaders.strictTransportSecurity`（僅針對你控制的 HTTPS 來源設定；請參閱[受信任的 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多執行個體隔離

使用不重複的連接埠與狀態目錄，在單一主機上執行多個閘道：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利旗標：`--dev`（使用 `~/.openclaw-dev` 與連接埠 `19001`）、`--profile <name>`（使用 `~/.openclaw-<name>`）。

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

- `enabled`：在閘道接聽器上啟用 TLS 終止（HTTPS/WSS）（預設：`false`）。
- `autoGenerate`：未設定明確檔案時，自動產生本機自我簽署的憑證／金鑰組；僅供本機／開發用途。
- `certPath`：TLS 憑證檔案的檔案系統路徑。
- `keyPath`：TLS 私密金鑰檔案的檔案系統路徑；請限制其權限。
- `caPath`：用於用戶端驗證或自訂信任鏈的選用 CA 套件路徑。

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

- `mode`：控制如何在執行階段套用設定編輯。
  - `"off"`：忽略即時編輯；變更需要明確重新啟動。
  - `"restart"`：設定變更時一律重新啟動閘道程序。
  - `"hot"`：不重新啟動，直接在程序內套用變更。
  - `"hybrid"`（預設）：先嘗試熱重新載入；必要時退回重新啟動。
- `debounceMs`：套用設定變更前的防彈跳時段，以 ms 為單位（非負整數；預設：`300`）。
- `deferralTimeoutMs`：選用的最長等待時間，以 ms 為單位；等待進行中的作業完成後，再強制重新啟動或熱重新載入頻道。省略時使用預設的有限等待時間（`300000`）；設為 `0` 可無限期等待，並定期記錄仍在等待中的警告。

---

## 雲端工作節點環境

雲端工作節點為選擇性啟用。若缺少 `cloudWorkers`，或 `profiles` 為空，OpenClaw 不接受建立任何新的工作節點。先前建立的持久性記錄仍會進行協調並保持可見；現有的閘道／節點投影不變。

每個工作節點提供者都必須從受信任的佈建輸出中傳回 SSH `hostKey`，格式必須完全是 `algorithm base64`，不得包含主機名稱或註解。啟動程序會將該金鑰寫入隔離的 `known_hosts` 檔案、使用 `StrictHostKeyChecking=yes`，並在提供者未提供金鑰時，於開啟連線前失敗。不提供首次使用即信任的退回機制。

通道設定依需求啟動，而非佈建流程的一部分。啟動後，閘道會將工作節點本機的 Unix socket 反向轉送至其迴路 WebSocket 端點。該 socket 位於隨機配置且僅限擁有者存取的遠端目錄中；與迴路 TCP 連接埠不同，在多使用者工作節點上，其他帳號無法存取它，也不會與另一個環境的連接埠衝突。SSH 保持連線與有上限的重新連線退避，僅在通道擁有者仍為現任擁有者時執行。停止通道時，會先封鎖重新連線，再關閉 SSH 程序。

控制流量與工作區傳輸使用不同的 SSH 連線。兩者會重複使用相同的已解析身分識別與隔離且固定的 `known_hosts` 檔案，但工作區傳輸不會與長期運作的通道共用 SSH 連線多工，因此 rsync 無法阻塞控制流量。

### Crabbox 設定檔

內建的 `crabbox` 提供者會透過本機 Crabbox 命令列介面佈建具備 SSH 功能的租用環境。內層的 `settings.provider` 會選取 Crabbox 後端；它與外層的 OpenClaw 提供者 ID 不同。

```json5
{
  cloudWorkers: {
    profiles: {
      production: {
        provider: "crabbox",
        install: "bundle", // Default; use "npm" only for a released gateway version.
        settings: {
          provider: "aws",
          class: "standard",
          ttl: "24h",
          idleTimeout: "60m",
          // Optional absolute path. Default: sibling ../crabbox/bin/crabbox, then PATH.
          binary: "/usr/local/bin/crabbox",
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `settings.provider`（必要）：透過 `--provider` 傳遞的 Crabbox 後端。請使用其檢查輸出包含 SSH 端點的後端；`aws` 會選取直接 AWS 後端。
- `settings.class`（必要）：透過 `--class` 傳遞的 Crabbox 機器類別。
- `settings.ttl` 與 `settings.idleTimeout`（必要）：透過 `--ttl` 與 `--idle-timeout` 傳遞的正值 Go 持續時間字串。這些提供者端的故障保護機制與下方 OpenClaw 儲存的 `lifetime` 原則不同。
- `settings.binary`：選用的 Crabbox 執行檔絕對路徑。若未設定，OpenClaw 會先檢查同層的 Crabbox 原始碼簽出，接著檢查 `PATH` 中的可執行項目，最後叫用 `crabbox`，讓缺少命令列介面的情況仍顯示為可見的提供者錯誤。

未知設定會遭到拒絕。Crabbox 認證資訊與後端特定的帳號設定仍由 Crabbox 擁有；請勿將其放入 `settings`。OpenClaw 只會叫用本機命令列介面，此 外掛不會發出提供者網路呼叫。佈建一律傳遞 `--keep=true`；OpenClaw 擁有外部生命週期，並使用 `crabbox stop` 銷毀租用環境。

<Warning>
  OpenClaw 會透過提供者擁有的密鑰解析器，解析 Crabbox 租用環境本機的 `sshKey` 路徑。目前的 `crabbox inspect --json` 輸出不會公開已佈建的 `sshHostKey`，因此 Crabbox 支援的工作節點仍會在啟動程序或通道設定前以封閉方式失敗。Crabbox 必須佈建每個租用環境的權威主機金鑰，並以完全符合 `algorithm base64` 的格式傳回 `sshHostKey`，不得包含主機名稱或註解。其目前租用環境本機的 `known_hosts` 快取並非佈建信任材料。
</Warning>

### 靜態 SSH 開發設定檔

```json5
{
  cloudWorkers: {
    profiles: {
      development: {
        provider: "static-ssh",
        settings: {
          host: "worker.example.test",
          port: 22,
          user: "openclaw",
          hostKey: "ssh-ed25519 <base64-public-host-key>",
          keyRef: {
            source: "env",
            provider: "default",
            id: "OPENCLAW_WORKER_SSH_KEY",
          },
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `profiles`：具名稱的工作節點設定檔，其 ID 必須非空白，並會移除前後空白。每個設定檔都會選取由外掛註冊的提供者。
- `provider`：非空白的工作節點提供者 ID。範例使用內建的 `crabbox` 提供者與 QA Lab 的 `static-ssh` 提供者。
- `install`：工作節點安裝方式。`"bundle"`（預設）會傳輸閘道已安裝建置版本的內容雜湊套件，並支援已發布、開發中與未發布的版本。`"npm"` 是針對未修改之封裝發布版本的選擇性最佳化；它會從公開 npm 登錄安裝 `openclaw@<exact gateway version>`，且絕不安裝 `latest`。
- 設定後會自動選取內建的提供者外掛，但明確停用與 `plugins.allow` 仍會生效。設定允許清單時，請包含提供者 ID（例如 `crabbox`）。外部提供者外掛也必須完成安裝並明確啟用。
- `settings`：由提供者擁有且有界的 JSON。選取的外掛會定義並驗證其金鑰；含有密鑰的值請使用 [SecretRef 物件](/zh-TW/gateway/secrets)。靜態 SSH 提供者需要 `host`、`user`、`hostKey` 與 `keyRef`；`port` 預設為 `22`。`hostKey` 必須是從已知主機或其他受信任管道取得的一行 OpenSSH 公開主機金鑰（`algorithm base64`），且不得包含選項前綴。
- `lifetime.idleTimeoutMinutes`：儲存供後續閒置回收原則使用的正整數分鐘數。
- `lifetime.maxLifetimeMinutes`：儲存供後續生命週期原則使用的正整數分鐘數。

工作節點上必須已安裝支援的 Node 執行階段（22.19+、23.11+ 或 24+）。選擇性啟用的 `"npm"` 方式也需要 `npm`，以及對公開 npm 登錄的外連 HTTPS 存取權。網路工具鏈設定屬於提供者原則；啟動程序會回報可採取行動的錯誤，而不會自行安裝工具鏈。

此基礎會安裝並驗證閘道建置版本，並提供通道啟動／停止生命週期，但不會啟動一般 OpenClaw 命令列介面。自足式工作節點進入點與迴圈將於下一個雲端工作節點里程碑中完成。

每筆持久性環境記錄都會在建立時的設定檔快照中，保留已驗證的提供者設定、解析後的安裝方式與生命週期原則。變更或移除具名稱的設定檔會影響新建立項目；只要擁有此外掛仍可使用，現有記錄就會繼續使用該快照進行生命週期協調。

在首個雲端工作節點版本中，生命週期值僅為資料；自動強制執行會隨後續生命週期工作提供。設定檔變更需要重新啟動閘道。

<Warning>
  `static-ssh` 提供者是原始碼樹中的 QA Lab 開發測試工具，不包含在封裝發行版本中。在其共用主機上執行的工作節點可以讀取無關的主機資料，因此請勿將此提供者用作正式環境隔離邊界。
  其操作者必須提供預期的 `hostKey`；OpenClaw 不會從首次連線得知或接受金鑰。
  銷毀其租用環境只會釋放 OpenClaw 的邏輯記錄；不會停止或清理主機。
</Warning>

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
查詢字串中的鉤子權杖會遭到拒絕。

驗證與安全注意事項：

- `hooks.enabled=true` 需要非空的 `hooks.token`。
- `hooks.token` 應與使用中的閘道共享密鑰驗證（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）不同；啟動時若偵測到重複使用，會記錄非致命的安全性警告。
- `openclaw security audit` 會將鉤子／閘道驗證資訊重複使用標示為嚴重發現，包括僅在稽核時提供的閘道密碼驗證（`--auth password --password <password>`）。執行 `openclaw doctor --fix` 以輪替已持久儲存且重複使用的 `hooks.token`，然後更新外部鉤子傳送端以使用新的鉤子權杖。
- `hooks.path` 不可為 `/`；請使用專用子路徑，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，請限制 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果對應或預設集使用範本化的 `sessionKey`，請設定 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。靜態對應鍵不需要選擇啟用此設定。

**端點：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 只有在 `hooks.allowRequestSessionKey=true` 時，才接受要求酬載中的 `sessionKey`（預設值：`false`）。
- `POST /hooks/<name>` → 透過 `hooks.mappings` 解析
  - 由範本呈現的對應 `sessionKey` 值會視為由外部提供，也需要 `hooks.allowRequestSessionKey=true`。

<Accordion title="對應詳細資料">

- `match.path` 會比對 `/hooks` 之後的子路徑（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 會比對一般路徑的酬載欄位。
- `{{messages[0].subject}}` 之類的範本會從酬載讀取資料。
- `transform` 可指向傳回鉤子動作的 JS/TS 模組。
  - `transform.module` 必須是相對路徑，且需位於 `hooks.transformsDir` 內（絕對路徑和路徑周遊會遭拒絕）。
  - 請將 `hooks.transformsDir` 保持在 `~/.openclaw/hooks/transforms` 下；工作區 Skills 目錄會遭拒絕。如果 `openclaw doctor` 回報此路徑無效，請將轉換模組移至鉤子轉換目錄，或移除 `hooks.transformsDir`。
- `agentId` 會路由至特定代理程式；未知的 ID 會退回使用預設代理程式。
- `allowedAgentIds`：限制有效的代理程式路由，包括省略 `agentId` 時的預設代理程式路徑（`*` 或省略 = 全部允許，`[]` = 全部拒絕）。
- `defaultSessionKey`：未明確指定 `sessionKey` 的鉤子代理程式執行所使用的選用固定工作階段金鑰。
- `allowRequestSessionKey`：允許 `/hooks/agent` 呼叫端和範本驅動的對應工作階段金鑰設定 `sessionKey`（預設值：`false`）。
- `allowedSessionKeyPrefixes`：明確 `sessionKey` 值（要求 + 對應）的選用前綴允許清單，例如 `["hook:"]`。當任何對應或預設集使用範本化的 `sessionKey` 時，此設定為必填。
- `deliver: true` 會將最終回覆傳送至頻道；`channel` 預設為 `last`。
- `model` 會覆寫此鉤子執行使用的 LLM（如果已設定模型目錄，則必須允許該模型）。

</Accordion>

### Gmail 整合

- 內建 Gmail 預設集使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果保留此逐訊息路由，請設定 `hooks.allowRequestSessionKey: true`，並限制 `hooks.allowedSessionKeyPrefixes` 以符合 Gmail 命名空間，例如 `["hook:", "hook:gmail:"]`。
- 如果需要 `hooks.allowRequestSessionKey: false`，請使用靜態 `sessionKey` 覆寫預設集，而不是使用範本化的預設值。

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
- 請勿在閘道旁另行執行 `gog gmail watch serve`。

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
            // enabled: false, // 或 OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- 透過閘道連接埠下的 HTTP 提供代理程式可編輯的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 僅限本機：保持 `gateway.bind: "loopback"`（預設值）。
- 非回送繫結：Canvas 路由需要閘道驗證（權杖／密碼／受信任的 Proxy），與其他閘道 HTTP 介面相同。
- 節點 WebView 通常不會傳送驗證標頭；節點完成配對並連線後，閘道會公告節點範圍的能力 URL，以供存取 Canvas/A2UI。
- 能力 URL 會繫結至使用中的節點 WS 工作階段，並會迅速到期。不使用基於 IP 的備援。
- 將即時重新載入用戶端注入所提供的 HTML。
- 目錄為空時，自動建立入門用的 `index.html`。
- 也會在 `/__openclaw__/a2ui/` 提供 A2UI。
- 變更需要重新啟動閘道。
- 若目錄很大或發生 `EMFILE` 錯誤，請停用即時重新載入。

---

## 探索

### mDNS（Bonjour）

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal`（預設值）：從 TXT 記錄中省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`；LAN 多播公告仍需啟用隨附的 `bonjour` 外掛。
- `off`：在不變更外掛啟用狀態的情況下，停止 LAN 多播公告。
- 隨附的 `bonjour` 外掛會在 macOS 主機上自動啟動，而在 Linux、Windows 和容器化閘道部署上則需選擇啟用。
- 當系統主機名稱是有效的 DNS 標籤時，預設使用該主機名稱，否則退回使用 `openclaw`。可使用 `OPENCLAW_MDNS_HOSTNAME` 覆寫。
- `OPENCLAW_DISABLE_BONJOUR=1` 會完全停用 mDNS 公告，並覆寫 `discovery.mdns.mode`。

### 廣域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

在 `~/.openclaw/dns/` 下寫入單點傳播 DNS-SD 區域。若要進行跨網路探索，請搭配 DNS 伺服器（建議使用 CoreDNS）+ Tailscale 分割 DNS。

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

- 只有在處理程序環境中缺少該鍵時，才會套用行內環境變數。
- `.env` 檔案：目前工作目錄的 `.env` + `~/.openclaw/.env`（兩者都不會覆寫現有變數）。
- `shellEnv`：從你的登入 Shell 設定檔匯入缺少的預期鍵。
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

- 僅比對大寫名稱：`[A-Z_][A-Z0-9_]*`。
- 缺少或空白的變數會在載入設定時擲回錯誤。
- 若要使用字面值 `${VAR}`，請以 `$${VAR}` 跳脫。
- 可搭配 `$include` 使用。

---

## 密鑰

密鑰參照是附加功能：純文字值仍可使用。

### `SecretRef`

使用下列其中一種物件形狀：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

驗證：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` ID 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` ID：絕對 JSON 指標（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` ID 模式：`^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（支援 AWS 樣式的 `secret#json_key` 選取器）
- `source: "exec"` ID 不得包含以斜線分隔的 `.` 或 `..` 路徑區段（例如 `a/../b` 會遭拒絕）

### 支援的認證資訊介面

- 標準矩陣：[SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface)
- `secrets apply` 會以支援的 `openclaw.json` 認證資訊路徑為目標。
- `auth-profiles.json` 參照包含在執行階段解析和稽核涵蓋範圍內。

### 密鑰提供者設定

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // 選用的明確 env 提供者
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

注意：

- `file` 提供者支援 `mode: "json"` 和 `mode: "singleValue"`（在 singleValue 模式中，`id` 必須為 `"value"`）。
- 當 Windows ACL 驗證無法使用時，檔案和 exec 提供者路徑會採取失敗時關閉。僅針對無法驗證的受信任路徑設定 `allowInsecurePath: true`。
- `exec` 提供者需要絕對 `command` 路徑，並在 stdin/stdout 上使用通訊協定酬載。
- 預設會拒絕符號連結命令路徑。設定 `allowSymlinkCommand: true` 可允許符號連結路徑，同時驗證解析後的目標路徑。
- 如果已設定 `trustedDirs`，受信任目錄檢查會套用至解析後的目標路徑。
- `exec` 子處理程序環境預設為最小化；請使用 `passEnv` 明確傳遞必要變數。
- 密鑰參照會在啟用時解析為記憶體內快照，之後要求路徑只會讀取該快照。
- 啟用期間會套用有效介面篩選：已啟用介面上未解析的參照會導致啟動／重新載入失敗，而非使用中介面則會略過並提供診斷資訊。

---

## 驗證儲存空間

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

- 每個代理程式的設定檔儲存在 `<agentDir>/auth-profiles.json`。
- 對於靜態認證資訊模式，`auth-profiles.json` 支援值層級參照（`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- 舊版扁平 `auth-profiles.json` 對應（例如 `{ "provider": { "apiKey": "..." } }`）並非執行階段格式；`openclaw doctor --fix` 會將其重寫為標準的 `provider:default` API 金鑰設定檔，並建立 `.legacy-flat.*.bak` 備份。
- OAuth 模式設定檔（`auth.profiles.<id>.mode = "oauth"`）不支援由 SecretRef 支援的驗證設定檔認證資訊。
- 靜態執行階段認證資訊來自記憶體內已解析的快照；探索到舊版靜態 `auth.json` 項目時會將其清除。
- 從 `~/.openclaw/credentials/oauth.json` 匯入舊版 OAuth。
- 請參閱 [OAuth](/zh-TW/concepts/oauth)。
- 密鑰執行階段行為和 `audit/configure/apply` 工具：[密鑰管理](/zh-TW/gateway/secrets)。

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

- `billingBackoffHours`：設定檔因確實的帳務／餘額不足錯誤而失敗時，基礎退避時數（預設：`5`）。即使回應為 `401`／`403`，明確的帳務文字仍可能歸入此處，但供應商特定的文字比對器仍僅限於其所屬供應商（例如 OpenRouter 的 `Key limit exceeded`）。可重試的 HTTP `402` 使用量時段或組織／工作區支出上限訊息則仍歸入 `rate_limit` 路徑。
- `billingBackoffHoursByProvider`：選用的各供應商帳務退避時數覆寫值。
- `billingMaxHours`：帳務退避指數成長的時數上限（預設：`24`）。
- `authPermanentBackoffMinutes`：高可信度 `auth_permanent` 失敗的基礎退避分鐘數（預設：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避成長的分鐘數上限（預設：`60`）。
- `failureWindowHours`：用於退避計數器的滾動時數視窗（預設：`24`）。
- `overloadedProfileRotations`：發生過載錯誤時，在切換至模型備援之前，同一供應商可輪替認證設定檔的最大次數（預設：`1`）。`ModelNotReadyException` 等供應商忙碌型態會歸入此處。
- `overloadedBackoffMs`：重試過載的供應商／設定檔輪替前的固定延遲（預設：`0`）。
- `rateLimitedProfileRotations`：發生速率限制錯誤時，在切換至模型備援之前，同一供應商可輪替認證設定檔的最大次數（預設：`1`）。此速率限制類別包括供應商特定的文字，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 和 `resource exhausted`。

---

## 稽核

```json5
{
  audit: {
    enabled: true,
    messages: "off", // 關閉 | 私訊 | 全部
  },
}
```

閘道會將代理程式執行和工具動作的**僅中繼資料**稽核事件記錄至共用狀態資料庫。訊息生命週期中繼資料需另行選擇啟用。此帳本會儲存身分、時間資訊、工具名稱和正規化結果，但絕不儲存提示詞、訊息本文、工具引數、結果或原始錯誤文字。訊息資料列不會儲存原始平台帳號、對話、訊息和目標 ID。執行／工具工作階段金鑰仍可用於關聯，且其本身可能包含平台帳號或對等端 ID。記錄會在 30 天後到期，帳本上限為 100,000 筆資料列。可使用 [`openclaw audit`](/zh-TW/cli/audit) 或 [`audit.activity.list`](/zh-TW/gateway/protocol#audit-ledger-rpc) 閘道 RPC 查詢。完整資料模型、隱私語意和涵蓋範圍限制請參閱[稽核歷程](/zh-TW/gateway/audit)。

- `enabled`：記錄新的稽核事件（預設：`true`）。帳本預設為啟用，因為只有在事件發生後才啟用的稽核軌跡無法解釋該事件。設為 `false` 後，閘道重新啟動時會停止插入新事件；現有記錄在到期前仍可讀取。重新開啟後會從該時間點恢復記錄，不會回填中斷期間的資料。
- `messages`：訊息中繼資料範圍（預設：`"off"`）。`"direct"` 僅記錄已知的直接對話。`"all"` 也會記錄群組、頻道和未知的對話類型。兩種模式都不含內容，並在可進行關聯時，以安裝環境本機的加密金鑰假名取代原始識別碼。這些資訊僅用於協助關聯，而非匿名化；狀態資料庫會儲存衍生金鑰，但 RPC 和命令列介面匯出不會包含該金鑰。

執行中的閘道會在啟動時擷取 `audit.enabled` 和 `audit.messages`；變更任一設定後請重新啟動。訊息涵蓋範圍目前包括進入核心分派的已接受輸入訊息，以及每個進入共用持久傳遞之原始邏輯輸出回覆承載資料的一筆終止資料列。繞過這些共用邊界的外掛本機路徑和直接傳送路徑目前尚未涵蓋。受限的背景寫入器採盡力而為，不是無損的法規遵循封存。

---

## 記錄

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // 美化 | 精簡 | json
    redactSensitive: "tools", // 關閉 | 工具
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- 預設記錄檔：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 設定 `logging.file` 以使用固定路徑。
- 使用 `--verbose` 時，`consoleLevel` 會提升為 `debug`。
- `maxFileBytes`：輪替前使用中記錄檔的位元組大小上限（正整數；預設：`104857600` = 100 MB）。OpenClaw 會在使用中檔案旁保留最多五個編號封存檔。
- `redactSensitive`／`redactPatterns`：盡力遮蔽主控台輸出、檔案記錄、OTLP 記錄資料和持久化工作階段逐字稿文字。`redactSensitive: "off"` 只會停用此一般記錄／逐字稿政策；UI／工具／診斷安全介面在輸出前仍會遮蔽密鑰。

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

- `enabled`：儀器化輸出的主開關（預設：`true`）。
- `flags`：啟用特定記錄輸出的旗標字串陣列（支援 `"telegram.*"` 或 `"*"` 等萬用字元）。
- `stuckSessionWarnMs`：以毫秒為單位的無進度時間門檻，用於將長時間執行的處理工作階段分類為 `session.long_running`、`session.stalled` 或 `session.stuck`（預設：`120000`）。回覆、工具、狀態、區塊和 ACP 進度會重設計時器；狀態未變時，重複的 `session.stuck` 診斷會逐步退避。
- `stuckSessionAbortMs`：以毫秒為單位的無進度時間門檻，達到後，符合資格且停滯中的進行中工作可透過中止並排空來復原。未設定時，OpenClaw 會使用較安全的延長型嵌入執行視窗，至少為 5 分鐘且為 `stuckSessionWarnMs` 的 3 倍。
- `memoryPressureSnapshot`：當記憶體壓力達到 `critical` 時，擷取已遮蔽的 OOM 前穩定性快照（預設：`false`）。設為 `true` 可新增穩定性套件的檔案掃描／寫入，同時保留一般記憶體壓力事件。
- `otel.enabled`：啟用 OpenTelemetry 匯出管線（預設：`false`）。完整設定、訊號目錄和隱私模型請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。
- `otel.endpoint`：用於 OTel 匯出的收集器 URL。
- `otel.tracesEndpoint`／`otel.metricsEndpoint`／`otel.logsEndpoint`：選用的特定訊號 OTLP 端點。設定後，只會針對該訊號覆寫 `otel.endpoint`。
- `otel.protocol`：`"http/protobuf"`（預設）或 `"grpc"`。
- `otel.headers`：隨 OTel 匯出要求傳送的額外 HTTP/gRPC 中繼資料標頭。
- `otel.serviceName`：資源屬性的服務名稱。
- `otel.traces`／`otel.metrics`／`otel.logs`：啟用追蹤、指標或記錄匯出。
- `otel.logsExporter`：記錄匯出目的地：`"otlp"`（預設）、`"stdout"`（每個標準輸出行一個 JSON 物件）或 `"both"`。
- `otel.sampleRate`：追蹤取樣率 `0`-`1`。
- `otel.flushIntervalMs`：以毫秒為單位的定期遙測排清間隔。
- `otel.captureContent`：選擇啟用 OTEL 範圍屬性的原始內容擷取。預設為關閉。布林值 `true` 會擷取非系統訊息／工具內容；物件形式可讓你明確啟用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt` 和 `toolDefinitions`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`：用於最新實驗性 GenAI 推論範圍形態的環境切換開關，包括 `{gen_ai.operation.name} {gen_ai.request.model}` 範圍名稱、`CLIENT` 範圍種類，以及以 `gen_ai.provider.name` 取代舊版 `gen_ai.system`。為維持相容性，範圍預設保留 `openclaw.model.call` 和 `gen_ai.system`；GenAI 指標則使用有界的語意屬性。
- `OPENCLAW_OTEL_PRELOADED=1`：用於已註冊全域 OpenTelemetry SDK 之主機的環境切換開關。OpenClaw 隨後會略過外掛所擁有的 SDK 啟動／關閉程序，同時保持診斷接聽器運作。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 和 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`：當對應的設定鍵未設定時使用的特定訊號端點環境變數。
- `cacheTrace.enabled`：記錄嵌入式執行的快取追蹤快照（預設：`false`）。
- `cacheTrace.filePath`：快取追蹤 JSONL 的輸出路徑（預設：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages`／`includePrompt`／`includeSystem`：控制快取追蹤輸出包含哪些內容（全部預設為 `true`）。

---

## 更新

```json5
{
  update: {
    channel: "stable", // 穩定版 | 延伸穩定版 | 測試版 | 開發版
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

- `channel`：發行頻道：`"stable"`、`"extended-stable"`、`"beta"` 或 `"dev"`。延伸穩定版僅限套件：前景命令負責安裝，而閘道可能會發出唯讀更新提示。
- `checkOnStart`：閘道啟動時檢查 npm 更新（預設：`true`）。儲存的延伸穩定版選擇會使用相同的唯讀提示和 24 小時提示排程。
- `auto.enabled`：為穩定版和測試版套件安裝啟用背景自動更新（預設：`false`）。延伸穩定版絕不會自動套用。
- `auto.stableDelayHours`：自動套用穩定版頻道更新前的最短延遲時數（預設：`6`；最大值：`168`）。
- `auto.stableJitterHours`：穩定版頻道推出的額外分散時數視窗（預設：`12`；最大值：`168`）。
- `auto.betaCheckIntervalHours`：測試版頻道檢查的執行間隔時數（預設：`1`；最大值：`24`）。穩定版延遲／抖動和測試版輪詢設定不適用於延伸穩定版。

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
      deliveryMode: "live", // 即時 | 僅最終結果
      hiddenBoundarySeparator: "paragraph", // 無 | 空格 | 換行 | 段落
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`：全域 ACP 功能閘門（預設值：`true`；設為 `false` 可隱藏 ACP 分派與啟動功能）。
- `dispatch.enabled`：ACP 工作階段回合分派的獨立閘門（預設值：`true`）。設為 `false` 可保留 ACP 命令，同時封鎖執行。
- `backend`：預設的 ACP 執行階段後端 ID（必須符合已註冊的 ACP 執行階段外掛）。
  請先安裝後端外掛；若已設定 `plugins.allow`，請納入後端外掛 ID（例如 `acpx`），否則 ACP 後端將無法載入。
- `fallbacks`：備援 ACP 後端 ID 的有序清單；當主要後端在產生任何輸出前，因看似暫時性的錯誤（無法使用、受到速率限制、配額耗盡或過載）而提早失敗時，會依序嘗試這些後端。每個項目都必須符合已註冊的 ACP 執行階段外掛後端。
- `defaultAgent`：啟動時未指定明確目標所使用的備援 ACP 目標代理程式 ID。
- `allowedAgents`：允許用於 ACP 執行階段工作階段的代理程式 ID 允許清單；空值表示沒有額外限制。
- `maxConcurrentSessions`：可同時處於活動狀態的 ACP 工作階段數量上限。
- `stream.coalesceIdleMs`：串流文字的閒置清空時間窗，單位為毫秒。
- `stream.maxChunkChars`：分割串流區塊投影前的區塊大小上限。
- `stream.repeatSuppression`：抑制每回合重複的狀態／工具行（預設值：`true`）。
- `stream.deliveryMode`：`"live"` 會逐步串流；`"final_only"` 會緩衝至回合終止事件。
- `stream.hiddenBoundarySeparator`：隱藏工具事件後、可見文字前的分隔方式（預設值：`"paragraph"`）。
- `stream.maxOutputChars`：每個 ACP 回合所投影的助理輸出字元數上限。
- `stream.maxSessionUpdateChars`：所投影 ACP 狀態／更新行的字元數上限。
- `stream.tagVisibility`：標籤名稱至布林可見性覆寫值的記錄，用於串流事件。
- `runtime.ttlMinutes`：ACP 工作階段工作程序符合清理條件前的閒置存留時間，單位為分鐘。
- `runtime.installCommand`：啟動 ACP 執行階段環境時，可選擇執行的安裝命令。

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
  - `"random"`（預設）：輪替顯示幽默／季節性標語。
  - `"default"`：固定的中性標語（`All your chats, one OpenClaw.`）。
  - `"off"`：不顯示標語文字（仍會顯示橫幅標題／版本）。
- 若要隱藏整個橫幅（而不只是標語），請設定環境變數 `OPENCLAW_HIDE_BANNER=1`。

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

## 身分識別

請參閱[代理程式預設值](/zh-TW/gateway/config-agents#agent-defaults)下的 `agents.list` 身分識別欄位。

---

## 橋接器（舊版，已移除）

目前的版本已不再包含 TCP 橋接器。節點會透過閘道 WebSocket 連線。`bridge.*` 鍵已不再屬於設定結構描述的一部分（在移除之前，驗證會失敗；`openclaw doctor --fix` 可移除未知的鍵）。

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
    maxConcurrentRuns: 8, // 預設值；排程分派 + 隔離的排程代理程式輪次執行
    webhook: "https://example.invalid/legacy", // 已儲存 notify:true 工作的已棄用備援
    webhookToken: "replace-with-dedicated-token", // 用於外送網路鉤子驗證的選用承載權杖
    sessionRetention: "24h", // 持續時間字串或 false
    runLog: {
      maxBytes: "2mb", // 預設為 2_000_000 位元組
      keepLines: 2000, // 預設為 2000
    },
  },
}
```

- `sessionRetention`：在修剪 SQLite 工作階段資料列前，保留已完成且隔離的排程執行工作階段多久。也會控制已封存之已刪除排程逐字稿的清理。預設值：`24h`；設為 `false` 可停用。
- `runLog.maxBytes`：為了與舊版檔案式排程執行記錄相容而接受此設定。預設值：`2_000_000` 位元組。
- `runLog.keepLines`：每項工作保留的最新 SQLite 執行歷程資料列。預設值：`2000`。
- `webhookToken`：用於排程網路鉤子 POST 傳送（`delivery.mode = "webhook"`）的承載權杖；若省略，則不會傳送驗證標頭。
- `webhook`：已棄用的舊版備援網路鉤子 URL（http/https），供 `openclaw doctor --fix` 遷移仍具有 `notify: true` 的已儲存工作；執行階段傳送會使用各工作自己的 `delivery.mode="webhook"` 加上 `delivery.to`，或在保留公告傳送時使用 `delivery.completionDestination`。

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

- `maxAttempts`：排程工作發生暫時性錯誤時的最大重試次數（預設值：`3`；範圍：`0`-`10`）。
- `backoffMs`：每次重試的退避延遲毫秒數陣列（預設值：`[30000, 60000, 300000]`；1-10 個項目）。
- `retryOn`：觸發重試的錯誤類型——`"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略此項即可重試所有暫時性錯誤類型。

單次工作會維持啟用，直到重試次數用盡，之後才停用，同時保留最終錯誤狀態。週期性工作採用相同的暫時性錯誤重試原則，在下一個排程時段之前，經過退避延遲後再次執行；永久性錯誤或暫時性錯誤重試次數用盡時，則回復至具有錯誤退避機制的一般週期性排程。

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

- `enabled`：啟用排程工作的失敗警示（預設值：`false`）。
- `after`：觸發警示前的連續失敗次數（正整數，最小值：`1`）。
- `cooldownMs`：同一工作重複發出警示之間的最短毫秒數（非負整數）。
- `includeSkipped`：將連續略過的執行計入警示門檻（預設值：`false`）。略過的執行會分開追蹤，且不影響執行錯誤的退避機制。
- `mode`：傳遞模式——`"announce"` 會透過頻道訊息傳送；`"webhook"` 會發佈至已設定的網路鉤子。
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

- 所有工作的排程失敗通知預設目的地。
- `mode`：`"announce"` 或 `"webhook"`；若有足夠的目標資料，預設為 `"announce"`。
- `channel`：公告傳遞的頻道覆寫值。`"last"` 會重複使用最後已知的傳遞頻道。
- `to`：明確的公告目標或網路鉤子 URL。網路鉤子模式下為必填。
- `accountId`：傳遞時選用的帳號覆寫值。
- 各工作的 `delivery.failureDestination` 會覆寫此全域預設值。
- 若全域及各工作皆未設定失敗目的地，已透過 `announce` 傳遞的工作會在失敗時回復使用其主要公告目標。
- 除非工作的主要 `delivery.mode` 為 `"webhook"`，否則只有 `sessionTarget="isolated"` 的工作支援 `delivery.failureDestination`。

請參閱[排程工作](/zh-TW/automation/cron-jobs)。隔離的排程執行會以[背景工作](/zh-TW/automation/tasks)的形式追蹤。

---

## 媒體模型範本變數

在 `tools.media.models[].args` 中展開的範本預留位置：

| 變數               | 說明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完整的傳入訊息本文                                |
| `{{RawBody}}`      | 原始本文（不含歷史記錄／傳送者包裝）              |
| `{{BodyStripped}}` | 已移除群組提及的本文                              |
| `{{From}}`         | 傳送者識別碼                                      |
| `{{To}}`           | 目的地識別碼                                      |
| `{{MessageSid}}`   | 頻道訊息 ID                                       |
| `{{SessionId}}`    | 目前工作階段 UUID                                 |
| `{{IsNewSession}}` | 建立新工作階段時為 `"true"`                       |
| `{{MediaUrl}}`     | 傳入媒體的虛擬 URL                                |
| `{{MediaPath}}`    | 本機媒體路徑                                      |
| `{{MediaType}}`    | 媒體類型（圖片／音訊／文件／……）                  |
| `{{Transcript}}`   | 音訊逐字稿                                        |
| `{{Prompt}}`       | 為命令列介面項目解析後的媒體提示詞                |
| `{{MaxChars}}`     | 為命令列介面項目解析後的最大輸出字元數            |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                           |
| `{{GroupSubject}}` | 群組主旨（盡力提供）                              |
| `{{GroupMembers}}` | 群組成員預覽（盡力提供）                          |
| `{{SenderName}}`   | 傳送者顯示名稱（盡力提供）                        |
| `{{SenderE164}}`   | 傳送者電話號碼（盡力提供）                        |
| `{{Provider}}`     | 提供者提示（whatsapp、telegram、discord 等）       |

---

## 設定引入（`$include`）

將設定拆分到多個檔案中：

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
- 同層鍵：在引入後合併（覆寫引入的值）。
- 巢狀引入：深度上限為 10 層。
- 路徑：相對於執行引入的檔案解析，但必須保持在最上層設定目錄（`openclaw.json` 的 `dirname`）內。只有在解析結果仍位於該邊界內時，才允許絕對路徑／`../` 形式。設定 `OPENCLAW_INCLUDE_ROOTS`（絕對路徑）可允許設定目錄以外的其他根目錄。
- 限制：路徑不得包含 null 位元組，且在解析前後都必須嚴格少於 4096 個字元；每個引入的檔案上限為 2 MB。
- OpenClaw 管理的寫入若僅變更由單一檔案引入支援的某個最上層區段，會直接寫入該引入檔案。例如，`plugins install` 會在 `plugins.json5` 中更新 `plugins: { $include: "./plugins.json5" }`，並保持 `openclaw.json` 不變。
- 對於 OpenClaw 管理的寫入，根層級引入、引入陣列，以及具有同層覆寫的引入均為唯讀；這類寫入會以關閉方式失敗，而不會將設定攤平。
- 錯誤：針對檔案遺失、解析錯誤、循環引入、無效路徑格式及長度過長，提供清楚的訊息。

---

## 相關內容

- [設定](/zh-TW/gateway/configuration)
- [設定範例](/zh-TW/gateway/configuration-examples)
- [診斷工具](/zh-TW/gateway/doctor)
