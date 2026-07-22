---
read_when:
    - 你需要確切的欄位層級設定語意或預設值
    - 你正在驗證頻道、模型、閘道或工具設定區塊
summary: 核心 OpenClaw 設定鍵、預設值及專屬子系統參考連結的閘道設定參考指南
title: 設定參考資料
x-i18n:
    generated_at: "2026-07-22T13:19:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 399836d1064ddddaef828d2e1a702ec7f303e05b0f0721f9080daf93ba8a1395
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` 的欄位層級參考：鍵、預設值，以及深入子系統頁面的連結。如需以任務為導向的設定指南，請參閱[設定](/zh-TW/gateway/configuration)。由頻道和外掛擁有的命令目錄及深層記憶體／QMD 調整項目位於各自的頁面，而非此處。

設定格式為 **JSON5**（允許註解和尾隨逗號）。所有欄位皆為選填；省略時，OpenClaw 會使用安全的預設值。

程式碼事實優先於本頁：

- `openclaw config schema` 會列印用於驗證和控制介面的即時 JSON Schema，其中已合併隨附／外掛／頻道中繼資料。
- 代理程式在編輯設定前，應針對一個確切且限定於路徑的結構描述節點，呼叫 `gateway` 工具動作 `config.schema.lookup`。
- `pnpm config:docs:check` / `pnpm config:docs:gen` 會依據目前的結構描述介面，驗證本文件的基準雜湊。

結構描述 `uiHints` 也會為每個路徑提供已解析的 `advanced` 布林值。
控制介面使用此值，優先顯示常用欄位，並依各
區段收合進階欄位；搜尋仍涵蓋兩個層級。層級中繼資料僅用於呈現。
新增鍵時，請在葉節點宣告其層級，或讓它繼承最近
祖先的宣告。沒有任何祖先宣告的路徑預設為進階層級。

專屬深入參考：

- [記憶體設定參考](/zh-TW/reference/memory-config)，涵蓋 `memory.search.*`、`memory.qmd.*`、`memory.citations`，以及 `plugins.entries.memory-core.config.dreaming` 下的夢境整理設定。
- [斜線命令](/zh-TW/tools/slash-commands)，提供目前的內建與隨附命令目錄。
- 由所屬頻道／外掛頁面記錄頻道特定的命令介面。

---

## 頻道

各頻道的設定鍵位於[設定－頻道](/zh-TW/gateway/config-channels)：Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 和其他隨附頻道的 `channels.*`（驗證、存取控制、多帳號、提及閘控）。

## 代理程式預設值、多代理程式、工作階段和訊息

請參閱[設定－代理程式](/zh-TW/gateway/config-agents)，以了解：

- `agents.defaults.*`（工作區、模型、思考、心跳偵測、記憶體、媒體、Skills、沙箱）
- `multiAgent.*`（多代理程式路由與繫結）
- `session.*`（工作階段生命週期、壓縮、修剪）
- `messages.*`（訊息傳遞、TTS、Markdown 轉譯）
- `talk.*`（對話模式）
  - `talk.consultThinkingLevel`：覆寫控制介面對話即時諮詢背後完整 OpenClaw 代理程式執行的思考層級
  - `talk.consultFastMode`：控制介面對話即時諮詢的一次性快速模式覆寫
  - `talk.speechLocale`：Android、iOS 和 macOS 上對話語音辨識的選填 BCP 47 語言環境識別碼
  - `talk.silenceTimeoutMs`：未設定時，對話會保留平台在傳送逐字稿前的預設暫停時段（`700 ms on macOS and Android, 900 ms on iOS`）
  - `talk.realtime.consultRouting`：最終即時對話逐字稿略過 `openclaw_agent_consult` 時的閘道轉送備援

## 工具和自訂供應商

工具政策、實驗性開關、供應商支援的工具設定，以及自訂
供應商／基礎 URL 設定位於
[設定－工具和自訂供應商](/zh-TW/gateway/config-tools)。

## 模型

供應商定義、模型允許清單和自訂供應商設定位於
[設定－工具和自訂供應商](/zh-TW/gateway/config-tools#custom-providers-and-base-urls)。
`models` 根節點也負責全域模型目錄行為。

```json5
{
  models: {
    // 選填。預設值：true。變更後需要重新啟動閘道。
    pricing: { enabled: false },
  },
}
```

- `models.mode`：供應商目錄行為（`merge` 或 `replace`）。
- `models.providers`：以供應商識別碼為鍵的自訂供應商對應表。
- `models.providers.*.localService`：用於本機模型伺服器的選填隨選程序管理器。OpenClaw 會探測已設定的健康情況端點、在需要時啟動絕對路徑 `command`、等待服務就緒，然後傳送模型
  請求。請參閱[本機模型服務](/zh-TW/gateway/local-model-services)。
- `models.pricing.enabled`：控制在側車程序和頻道進入閘道就緒路徑後
  啟動的背景定價啟動程序。當 `false` 時，
  閘道會略過 OpenRouter 和 LiteLLM 定價目錄擷取；已設定的
  `models.providers.*.models[].cost` 值仍可用於本機成本估算。

## MCP

由 OpenClaw 管理的 MCP 伺服器定義位於 `mcp.servers` 下，並由
內嵌 OpenClaw 和其他執行階段轉接器使用。`openclaw mcp list`、
`show`、`set` 和 `unset` 命令可管理此區塊，而不會在編輯設定時連線至
目標伺服器。

```json5
{
  mcp: {
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        requestTimeoutMs: 20000,
        connectionTimeoutMs: 5000,
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
        // 選填的 Codex app-server 投影控制項。
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`：供公開已設定 MCP 工具的執行階段使用之具名 stdio 或遠端 MCP 伺服器定義。
  遠端項目使用 `transport: "streamable-http"` 或 `transport: "sse"`；
  `type: "http"` 是命令列介面原生別名，`openclaw mcp set` 和
  `openclaw doctor --fix` 會將其正規化為標準 `transport` 欄位。
- `mcp.servers.<name>.enabled`：設定 `false` 可保留已儲存的伺服器定義，
  同時將其排除於內嵌 OpenClaw MCP 探索與工具投影之外。
- `mcp.servers.<name>.requestTimeoutMs`：每個伺服器的 MCP 請求逾時，單位為毫秒。
- `mcp.servers.<name>.connectionTimeoutMs`：每個伺服器的連線逾時，單位為毫秒。
- `mcp.servers.<name>.supportsParallelToolCalls`：供可選擇是否發出並行 MCP 工具呼叫的
  轉接器使用之選填並行提示。
- `mcp.servers.<name>.auth`：對需要 OAuth 的 HTTP MCP 伺服器設定
  `"oauth"`。執行 `openclaw mcp login <name>`，將權杖儲存在 OpenClaw 狀態中。
- `mcp.servers.<name>.oauth`：選填的 OAuth 範圍、重新導向 URL 和用戶端
  中繼資料 URL 覆寫。
- `mcp.servers.<name>.sslVerify`、`clientCert`、`clientKey`：供私人端點和雙向 TLS 使用的 HTTP TLS 控制項。
- `mcp.servers.<name>.toolFilter`：選填的各伺服器工具選取設定。`include`
  會將已探索的 MCP 工具限制為名稱相符者；`exclude` 會隱藏名稱相符者。項目可以是確切的 MCP 工具名稱或簡單的 `*` glob。具有
  資源或提示的伺服器也會產生公用工具名稱（`resources_list`、
  `resources_read`、`prompts_list`、`prompts_get`），而這些名稱使用相同的
  篩選器。
- `mcp.servers.<name>.codex`：選填的 Codex app-server 投影控制項。
  此區塊僅為 Codex app-server 執行緒的 OpenClaw 中繼資料；不會
  影響 ACP 工作階段、通用 Codex 控制框架設定或其他執行階段轉接器。
  非空的 `codex.agents` 會將伺服器限制於列出的 OpenClaw 代理程式識別碼。
  空白、僅含空白字元或無效的限定範圍代理程式清單會被設定驗證拒絕，
  並由執行階段投影路徑略過，而非變成全域設定。
  `codex.defaultToolsApprovalMode` 會為該伺服器發出 Codex 原生的
  `default_tools_approval_mode`。OpenClaw 會先移除 `codex`
  區塊，再將原生 `mcp_servers` 設定傳遞給 Codex。省略此區塊，可讓
  伺服器投影至每個 Codex app-server 代理程式，並採用 Codex
  預設的 MCP 核准行為。
- 工作階段限定的隨附 MCP 執行階段使用內建的 10 分鐘閒置 TTL。
  一次性內嵌執行會要求在執行結束時清理；TTL 是長期工作階段和未來呼叫端的最後保障。
- `mcp.*` 下的變更會透過處置快取的工作階段 MCP 執行階段進行熱套用。
  下次探索／使用工具時，會依新設定重新建立它們，因此移除的
  `mcp.servers` 項目會立即清除，而不必等待閒置 TTL。
- 執行階段探索也會遵循 MCP 工具清單變更通知，捨棄
  該工作階段的快取目錄。宣告資源或
  提示的伺服器會取得用於列出／讀取資源及列出／擷取
  提示的公用工具。工具呼叫重複失敗時，會短暫暫停受影響的伺服器，
  再嘗試其他呼叫。

如需了解執行階段行為，請參閱 [MCP](/zh-TW/cli/mcp#openclaw-as-an-mcp-client-registry) 和
[命令列介面後端](/zh-TW/gateway/cli-backends#bundle-mcp-overlays)。

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

- `allowBundled`：僅供隨附 Skills 使用的選填允許清單（不影響受管理／工作區 Skills）。
- `load.extraDirs`：額外的共用 Skill 根目錄（最低優先順序）。
- `load.allowSymlinkTargets`：當 Skill 符號連結位於其已設定來源根目錄之外時，允許其解析至的受信任實際目標根目錄。
- `workshop.allowSymlinkTargetWrites`：允許 Skill Workshop 套用操作透過已受信任的符號連結目標進行寫入（預設值：false）。
- `install.preferBrew`：若為 true，當 `brew` 可用時，會先偏好 Homebrew 安裝程式，再退回其他安裝程式類型。
- `install.nodeManager`：`metadata.openclaw.install`
  規格的 Node 安裝程式偏好設定（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`：允許受信任的 `operator.admin` 閘道
  用戶端安裝透過 `skills.upload.*` 暫存的私人 zip 封存檔
  （預設值：false）。這只會啟用上傳封存檔路徑；一般的 ClawHub
  安裝不需要此設定。
- `entries.<skillKey>.enabled: false` 會停用 Skill，即使它已隨附／安裝亦然。
- `entries.<skillKey>.apiKey`：供宣告主要環境變數的 Skills 使用的便利設定（純文字字串或 SecretRef 物件）。
- `limits.maxCandidatesPerRoot`、`limits.maxSkillsLoadedPerSource`、`limits.maxSkillsInPrompt`、`limits.maxSkillsPromptChars`、`limits.maxSkillFileBytes`：限制 Skill 探索和面向模型的 Skills 提示。
- Skill Workshop 的自主性／核准設定（`workshop.autonomous.enabled`、`workshop.approvalPolicy`、`workshop.maxPending`、`workshop.maxSkillBytes`）記錄於 [Skills 設定](/zh-TW/tools/skills-config)。

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

- 從 `~/.openclaw/extensions` 和 `<workspace>/.openclaw/extensions` 下的套件或套裝目錄，以及 `plugins.load.paths` 中列出的檔案或目錄載入。
- 請將獨立外掛檔案放在 `plugins.load.paths` 中；自動探索的擴充功能根目錄會忽略頂層 `.js`、`.mjs` 和 `.ts` 檔案，因此這些根目錄中的輔助指令碼不會阻止啟動。
- 探索功能接受原生 OpenClaw 外掛，以及相容的 Codex 套裝和 Claude 套裝，包括沒有資訊清單且採用 Claude 預設配置的套裝。
- **設定變更需要重新啟動閘道。**
- `allow`：選用的允許清單（僅載入列出的外掛）。`deny` 優先。
- `plugins.entries.<id>.apiKey`：外掛層級的 API 金鑰便利欄位（外掛支援時）。
- `plugins.entries.<id>.env`：外掛範圍的環境變數對應表。
- `plugins.entries.<id>.hooks.allowPromptInjection`：當 `false` 時，核心會封鎖修改提示詞的鉤子，例如 `before_prompt_build`。適用於原生外掛鉤子和支援的套裝所提供的鉤子目錄。
- `plugins.entries.<id>.hooks.allowConversationAccess`：當 `true` 時，受信任的非隨附外掛可以從型別化鉤子讀取原始對話內容，例如 `llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize` 和 `agent_end`。
- `plugins.entries.<id>.subagent.allowModelOverride`：明確信任此外掛，允許它為背景子代理執行要求個別執行的 `provider` 和 `model` 覆寫。
- `plugins.entries.<id>.subagent.allowedModels`：受信任子代理覆寫可使用的標準 `provider/model` 目標選用允許清單。只有在你刻意要允許任何模型時，才使用 `"*"`。
- `plugins.entries.<id>.llm.allowModelOverride`：明確信任此外掛，允許它為 `api.runtime.llm.complete` 要求模型覆寫。
- `plugins.entries.<id>.llm.allowedModels`：受信任外掛 LLM 補全覆寫可使用的標準 `provider/model` 目標選用允許清單。只有在你刻意要允許任何模型時，才使用 `"*"`。
- `plugins.entries.<id>.llm.allowAgentIdOverride`：明確信任此外掛，允許它針對非預設代理 ID 執行 `api.runtime.llm.complete`。
- `plugins.entries.<id>.config`：外掛定義的設定物件（可用時，由原生 OpenClaw 外掛結構描述驗證）。
- 頻道外掛的帳號／執行階段設定位於 `channels.<id>` 下，且應由所屬外掛資訊清單的 `channelConfigs` 中繼資料描述，而不是由中央 OpenClaw 選項登錄描述。

### Codex 控制框架外掛設定

隨附的 `codex` 外掛擁有
`plugins.entries.codex.config` 下的原生 Codex 應用程式伺服器控制框架設定。完整設定介面請參閱
[Codex 控制框架參考](/zh-TW/plugins/codex-harness-reference)，執行階段模型請參閱
[Codex 控制框架](/zh-TW/plugins/codex-harness)。

`codexPlugins` 僅適用於選用原生 Codex 控制框架的工作階段。
它不會為 OpenClaw 提供者執行、ACP
對話繫結或任何非 Codex 控制框架啟用 Codex 外掛。

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

- `plugins.entries.codex.config.codexPlugins.enabled`：為 Codex 控制框架啟用原生 Codex
  外掛／應用程式支援。預設值：`false`。
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`：在
  每個新的原生 Codex 討論串中，公開目前已驗證 Codex 帳號所連線且可存取的所有應用程式。
  預設值：`false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`：
  已設定外掛應用程式之互動請求的預設破壞性動作原則。
  使用 `true` 可在不提示的情況下接受安全的 Codex 核准結構描述；使用 `false`
  可拒絕；使用 `"auto"` 可透過 OpenClaw
  外掛核准轉送 Codex 所需的核准；或使用 `"ask"`，在沒有持久核准的情況下對每個外掛寫入／破壞性
  動作提示。`"ask"` 模式會清除受影響應用程式的持久 Codex
  個別工具核准覆寫，並在 Codex 討論串開始前，為該應用程式選取人工
  核准審查者。
  預設值：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`：當全域 `codexPlugins.enabled` 也為 true 時，
  啟用已設定的外掛項目。
  明確項目的預設值：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`：
  穩定的市集識別資訊，每個已解析項目都必須與 `pluginName` 搭配提供。
  支援 `"openai-curated"` 和 `"workspace-directory"`。缺少任一識別欄位的項目
  將被忽略。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`：穩定的
  Codex 外掛識別資訊，必須與 `marketplaceName` 搭配提供。
  `workspace-directory` 項目必須使用 `plugin/list` 傳回且包含完整市集限定名稱的
  `summary.id`，例如
  `"example-plugin@workspace-directory"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`：
  個別外掛的破壞性動作覆寫。省略時，使用全域
  `allow_destructive_actions` 值。個別外掛值接受相同的
  `true`、`false`、`"auto"` 或 `"ask"` 原則。

每個獲准且使用 `"ask"` 的外掛應用程式，都會將該應用程式的核准要求
轉送給人工審查者。其他應用程式和非應用程式討論串核准會保留其
已設定的審查者，因此混合外掛原則不會繼承 `"ask"` 行為。

`codexPlugins.enabled` 是全域啟用指令。由移轉寫入的明確外掛
項目，是持久的精選安裝與修復資格集合。手動設定的 `workspace-directory`
項目必須已經安裝並啟用，且其所屬應用程式必須可存取；OpenClaw
不會安裝它們或為其進行驗證。若 Codex 拒絕明確的工作區
目錄要求，已啟用的工作區項目會以
`marketplace_missing` 關閉並報錯，而預設目錄中的精選項目仍然
可用。不支援 `plugins["*"]`，不存在 `install` 開關，而且
本機 `marketplacePath` 值刻意不設為設定欄位，因為它們
專屬於主機。應用程式伺服器版本和就緒要求請參閱
[原生 Codex 外掛](/zh-TW/plugins/codex-native-plugins)。

`app/list` 就緒檢查會快取一小時，並在過期時
非同步重新整理。Codex 討論串應用程式設定是在建立 Codex 控制框架
工作階段時計算，而不是每一輪都計算；變更原生外掛設定後，請使用 `/new`、`/reset` 或重新啟動閘道。

`codexPlugins.allow_all_plugins` 會將目前可存取的每個帳號
應用程式快照納入每個新的原生 Codex 討論串。它不會安裝外掛或應用程式，
且無法存取的應用程式仍會排除。帳號應用程式使用全域
`codexPlugins.allow_destructive_actions` 原則。當相同應用程式同時存在於兩條路徑時，
明確外掛項目優先。若無法讀取 `app/list`，
帳號範圍的公開會關閉並報錯。

- `plugins.entries.firecrawl.config.webFetch`：Firecrawl 網頁擷取提供者設定。
  - `apiKey`：選用的 Firecrawl API 金鑰，可取得較高限制（接受 SecretRef）。若未設定，會改用 `plugins.entries.firecrawl.config.webSearch.apiKey` 或 `FIRECRAWL_API_KEY` 環境變數。
  - `baseUrl`：Firecrawl API 基底 URL（預設值：`https://api.firecrawl.dev`；自架覆寫必須指向私人／內部端點）。
  - `onlyMainContent`：僅擷取頁面的主要內容（預設值：`true`）。
  - `maxAgeMs`：快取期限上限，單位為毫秒（預設值：`172800000`／2 天）。
  - `timeoutSeconds`：抓取要求逾時秒數（預設值：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok 網頁搜尋）設定。
  - `enabled`：啟用 X Search 提供者。
  - `model`：搜尋所使用的 Grok 模型（例如 `"grok-4.3"`）。
- `plugins.entries.memory-core.config.dreaming`：記憶夢境整理設定。階段與閾值請參閱[夢境整理](/zh-TW/concepts/dreaming)。
  - `enabled`：夢境整理主開關（預設值為 `false`）。
  - `frequency`：每次完整夢境整理掃描的排程頻率（預設為 `"0 3 * * *"`）。
  - `model`：選用的夢境日誌子代理模型覆寫。需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`；請搭配 `allowedModels` 限制目標。模型無法使用的錯誤會以工作階段預設模型重試一次；信任或允許清單失敗不會靜默改用其他模型。
  - 階段原則與閾值是實作細節（不是面向使用者的設定鍵）。
- 完整記憶設定位於[記憶設定參考](/zh-TW/reference/memory-config)：
  - `memory.search.*`
  - `agents.entries.*.memory.search.*`，用於個別代理覆寫
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已啟用的 Claude 套裝外掛也可以從 `settings.json` 提供內嵌的 OpenClaw 預設值；OpenClaw 會將其套用為經過清理的代理設定，而不是原始 OpenClaw 設定修補。
- `plugins.slots.memory`：選取作用中的記憶外掛 ID，或選取 `"none"` 停用記憶外掛。
- `plugins.slots.contextEngine`：選取作用中的上下文引擎外掛 ID；除非你安裝並選取其他引擎，否則預設為 `"legacy"`。

請參閱[外掛](/zh-TW/tools/plugin)。

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
- `tabCleanup` 控制針對追蹤中的主要代理程式分頁，在閒置一段時間後或工作階段超過其上限時，盡力執行的定期清理。追蹤僅適用於由瀏覽器工具 `action: "open"` 建立的分頁；使用者開啟或擁有權不明的分頁絕不會被接管。停用 `tabCleanup` 不會停用明確的工作階段生命週期清理。
- 使用穩定原生 CDP 目標和瀏覽器身分在主機本機開啟的項目，會儲存在共用 SQLite 狀態中，並在閘道重新啟動後，仍可供 `/new` 和工作階段生命週期清理使用。面向原生工具的 CDP 目標在重新啟動後，也仍可進行閒置和上限清理。Chrome MCP 使用行程本機的目標控制代碼，因此冷啟動的既有工作階段記錄會等待生命週期清理，而不會冒險對無法歸屬的重新啟動後活動執行閒置清除。OpenClaw 會先驗證設定檔和瀏覽器執行個體，再將其關閉。Chrome MCP 自動連線、缺少 `/json/version` 瀏覽器身分，以及未解析的原生目標，都會完全保留在行程本機，因此重新啟動後不會自動關閉。較舊且未追蹤的分頁需要手動關閉。暫時性失敗會保持待處理狀態，以供稍後重試。請參閱[分頁清理擁有權](/zh-TW/tools/browser#tab-cleanup-ownership)。
- 未設定 `ssrfPolicy.dangerouslyAllowPrivateNetwork` 時會停用，因此瀏覽器導覽預設維持嚴格模式。
- 僅在你有意信任私有網路瀏覽器導覽時，才設定 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在嚴格模式下，遠端 CDP 設定檔端點（`profiles.*.cdpUrl`）於可連線性／探索檢查期間，會受到相同的私有網路封鎖。
- `ssrfPolicy.allowPrivateNetwork` 仍支援作為舊版別名。
- 在嚴格模式下，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 設定明確的例外。
- 遠端設定檔僅能附加（啟動／停止／重設均停用）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。若要讓 OpenClaw 探索 `/json/version`，請使用 HTTP(S)；若供應商提供直接的 DevTools WebSocket URL，請使用 WS(S)。
- 如果可透過回送位址連線至外部管理的 CDP 服務，請設定該設定檔的 `attachOnly: true`；否則 OpenClaw 會將回送連接埠視為本機受管理的瀏覽器設定檔，並可能回報本機連接埠擁有權錯誤。
- `existing-session` 設定檔使用 Chrome MCP 而非 CDP，並可在所選主機上或透過已連線的瀏覽器節點附加。
- `existing-session` 設定檔可設定 `userDataDir`，以指定特定的 Chromium 架構瀏覽器設定檔，例如 Brave 或 Edge。
- 當 Chrome 已在 DevTools HTTP(S) 探索端點或直接 WS(S) 端點後方執行時，`existing-session` 設定檔可設定 `cdpUrl`。在該模式下，OpenClaw 會將端點傳給 Chrome MCP，而不是使用自動連線；Chrome MCP 的啟動引數會忽略 `userDataDir`。
- `existing-session` 設定檔會維持目前的 Chrome MCP 路由限制：使用快照／參照驅動的動作，而非 CSS 選擇器目標定位；單一檔案上傳掛鉤；不支援對話方塊逾時覆寫；不支援 `wait --load networkidle`；也不支援 `responsebody`、PDF 匯出、下載攔截或批次動作。
- 本機受管理的 `openclaw` 設定檔會自動指派 `cdpPort` 和 `cdpUrl`；只有遠端 CDP 設定檔或附加既有工作階段端點時，才應明確設定 `cdpUrl`。
- 本機受管理的設定檔可設定 `executablePath`，以覆寫該設定檔的全域 `browser.executablePath`。可藉此讓一個設定檔在 Chrome 中執行，另一個則在 Brave 中執行。
- 自動偵測順序：若預設瀏覽器採用 Chromium 架構，則優先使用預設瀏覽器 → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 都接受 `~` 和 `~/...`，並在啟動 Chromium 前將其展開為作業系統的家目錄。`existing-session` 設定檔中每個設定檔的 `userDataDir` 也會展開波浪號。
- 控制服務：僅限回送位址（連接埠衍生自 `gateway.port`，預設為 `18791`）。
- `extraArgs` 會將額外的啟動旗標附加至本機 Chromium 啟動流程（例如 `--disable-gpu`、視窗大小或偵錯旗標）。

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
    prefs: {
      theme: "claw", // claw | knot | dash | custom
      themeMode: "system", // light | dark | system
      textScale: 100, // 90 | 100 | 110 | 125 | 140
      locale: "en",
      chatShowThinking: true,
      chatShowToolCalls: true,
      chatPersistCommentary: true, // 在控制介面中保留執行後的評註；不會將其傳送至頻道
      chatSendShortcut: "enter", // enter | modifier-enter
      chatFollowUpMode: "steer", // steer | queue；省略以使用伺服器佇列模式
      showAdvancedSettings: false, // 展開「設定」中的每個「進階」群組
    },
  },
}
```

- `seamColor`：原生應用程式介面框架的強調色（對話模式氣泡色調等）。
- `assistant`：控制介面的身分覆寫。未設定時會使用作用中代理程式的身分。
- `prefs`：操作員顯示偏好設定。這是正式的集中位置，讓代理程式可透過核准閘門變更這些設定，並讓每個控制介面用戶端保持同步；瀏覽器會將值鏡像至本機儲存空間，以便立即啟動，且在無法寫入設定時（檢視者範圍、離線）保留裝置本機副本。`chatPersistCommentary` 預設為 `true`。將其設為 `false`，可在執行期間持續顯示即時評註，但會在完成時移除，並阻止新的 Codex 評註進入持久化逐字記錄鏡像。訊息頻道傳送則維持獨立且不變。`showAdvancedSettings` 預設為 `false`；「設定」搜尋可能會暫時開啟一個相符的進階群組，而不變更此偏好設定。已連線的用戶端會即時套用伺服器端變更：每次持久化設定寫入後，閘道會廣播僅含雜湊的 `config.changed` 事件，而用戶端會重新整理其快照（本機設定草稿有未儲存的編輯時會略過）。重新連線的用戶端會在連線時進行調和。

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
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // toolTitles: false, // 選擇啟用工具呼叫的 AI 用途標題（會耗用公用模型權杖）
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // 危險：允許絕對外部 http(s) 內嵌 URL
      // chatMessageMaxWidth: "min(1280px, 82%)", // 選用的置中聊天逐字記錄最大寬度
      // allowedOrigins: ["https://control.example.com"], // 非回送位址控制介面所必需
      // dangerouslyAllowHostHeaderOriginFallback: false, // 危險的 Host 標頭來源後援模式
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
    // 選用。預設為 false。
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // 選用。預設為未設定／停用。
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
        // 經 SSH 驗證的自動核准。預設：啟用（true）。
        // 設為 false 只會停用 SSH 驗證；不影響
        // 上方的 autoApproveCidrs。若要僅允許手動配對節點，請設為 false 並
        // 取消設定 autoApproveCidrs。傳入物件可進行調整：{ user, identity,
        // timeoutMs, cidrs }。
        sshVerify: true,
      },
      commands: {
        allow: ["canvas.navigate"],
        deny: ["system.run"],
      },
    },
    tools: {
      // 額外的 /tools/invoke HTTP 拒絕項目
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

<Accordion title="閘道欄位詳細資料">

- `mode`：`local`（執行閘道）或 `remote`（連線至遠端閘道）。除非 `local`，否則閘道會拒絕啟動。
- `port`：供 WS + HTTP 使用的單一多工連接埠。優先順序：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（預設）、`lan`（`0.0.0.0`）、`tailnet`（可用時使用 Tailscale IPv4，否則使用回送介面），或 `custom`（一個 IPv4 位址）。對同一主機上的用戶端而言，解析出的 `tailnet` 位址，以及 `127.0.0.1` 或 `0.0.0.0` 以外的任何 `custom` 位址，都需要在相同連接埠上使用 `127.0.0.1`；任一接聽器無法繫結時，啟動都會失敗。非回送介面的公開範圍仍限於所選介面。
- **舊版繫結別名**：請在 `gateway.bind` 中使用繫結模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），而非主機別名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事項**：預設的 `loopback` 繫結會在容器內接聽 `127.0.0.1`。使用 Docker 橋接網路（`-p 18789:18789`）時，流量會抵達 `eth0`，因此無法存取閘道。請使用 `--network host`，或設定 `bind: "lan"`（或搭配 `customBindHost: "0.0.0.0"` 使用 `bind: "custom"`），以接聽所有介面。
- **驗證**：預設為必要。非回送介面的繫結需要閘道驗證。實際上，這表示需要共用權杖／密碼，或搭配 `gateway.auth.mode: "trusted-proxy"` 的身分感知反向代理。新手設定精靈預設會產生權杖。
- 若同時設定 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef），請將 `gateway.auth.mode` 明確設為 `token` 或 `password`。若兩者皆已設定但未設定模式，啟動及服務安裝／修復流程都會失敗。
- `gateway.auth.mode: "none"`：明確的無驗證模式。僅限受信任的本機回送介面設定使用；新手設定提示刻意不提供此選項。
- `gateway.auth.mode: "trusted-proxy"`：將瀏覽器／使用者驗證委派給身分感知反向代理，並信任來自 `gateway.trustedProxies` 的身分標頭（請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)）。此模式預設要求代理來源為**非回送介面**；同一主機上的回送介面反向代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。同一主機上的內部呼叫端可使用 `gateway.auth.password` 作為本機直接備援；`gateway.auth.token` 仍與受信任代理模式互斥。
- `gateway.auth.allowTailscale`：當 `true` 時，Tailscale Serve 身分標頭可滿足控制介面／WebSocket 驗證（透過 `tailscale whois` 驗證）。HTTP API 端點**不會**使用該 Tailscale 標頭驗證；它們會改用閘道的一般 HTTP 驗證模式。此無權杖流程假設閘道主機可信任。當 `tailscale.mode = "serve"` 時，預設為 `true`。
- `gateway.auth.rateLimit`：選用的驗證失敗限制器。依用戶端 IP 和驗證範圍套用（共用密鑰與裝置權杖會分別追蹤）。遭封鎖的嘗試會傳回 `429` + `Retry-After`。
  - 在非同步 Tailscale Serve 控制介面路徑上，相同 `{scope, clientIp}` 的失敗嘗試會在寫入失敗記錄前依序處理。因此，來自相同用戶端的並行錯誤嘗試，可能會在第二個請求時觸發限制器，而不是兩者競速通過並僅被視為一般不相符。
  - `gateway.auth.rateLimit.exemptLoopback` 預設為 `true`；若你刻意也要限制 localhost 流量的速率（用於測試設定或嚴格的代理部署），請設定 `false`。
- 來自瀏覽器來源的 WS 驗證嘗試一律會受到節流，且不套用回送介面豁免（縱深防禦瀏覽器型 localhost 暴力破解）。
- 在回送介面上，這些來自瀏覽器來源的鎖定會依正規化後的 `Origin`
  值分別隔離，因此來自某個 localhost 來源的重複失敗，不會自動
  鎖定其他來源。
- `tailscale.mode`：`serve`（僅限 tailnet，使用回送介面繫結）或 `funnel`（公開，需要驗證）。
- `tailscale.serviceName`：Serve 模式選用的 Tailscale 服務名稱，例如
  `svc:openclaw`。設定後，OpenClaw 會將其傳遞給 `tailscale serve
--service`，讓控制介面可透過具名服務公開，而不是
  使用裝置主機名稱。該值必須使用 Tailscale 的 `svc:<dns-label>`
  服務名稱格式；啟動時會回報衍生出的服務 URL。
- `tailscale.preserveFunnel`：當 `true` 且 `tailscale.mode = "serve"` 時，OpenClaw
  會在啟動時重新套用 Serve 前檢查 `tailscale funnel status`；如果外部設定的 Funnel 路由已涵蓋閘道連接埠，
  則會略過重新套用。
  預設為 `false`。
- `controlUi.allowedOrigins`：供閘道 WebSocket 連線使用的明確瀏覽器來源允許清單。公開的非回送介面瀏覽器來源必須設定此項。從回送介面、RFC1918／連結本機、`.local`、`.ts.net` 或 Tailscale CGNAT 主機載入的私有同源 LAN／Tailnet 介面，無須啟用 Host 標頭備援即可接受。
- `controlUi.toolTitles`：選擇啟用由 AI 產生的用途標題，用於控制介面聊天中的工具呼叫。預設：`false`（工具呈現維持完全確定性，不會在背景呼叫模型）。啟用後，`chat.toolTitles` 方法會透過標準公用模型路由為複雜呼叫加上標籤——使用代理程式的 `utilityModel`（這是操作員決策，可能像其他所有公用工作一樣，將有限的工具引數傳送給所選供應商），或工作階段供應商宣告的小型模型預設值（OpenAI → `gpt-5.6-luna`、Anthropic → `claude-haiku-4-5`）——並將結果快取於每個代理程式的狀態資料庫中，因此重複檢視絕不會再次計費。`utilityModel: \"\"` 會像其他所有公用工作一樣停用標題；標題絕不會回退至主要模型。
- `controlUi.chatMessageMaxWidth`：置中控制介面聊天逐字記錄的選用最大寬度。接受受限的 CSS 寬度值，例如 `960px`、`82%`、`min(1280px, 82%)` 和 `calc(100% - 2rem)`。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危險模式，會為刻意依賴 Host 標頭來源原則的部署啟用 Host 標頭來源備援。
- `terminal.enabled`：選擇啟用管理員範圍的操作員終端。預設：`false`。終端會在所選代理程式工作區中啟動主機 PTY、繼承閘道處理程序環境，並拒絕供設有 `sandbox.mode: "all"` 的代理程式使用。僅限受信任的操作員部署啟用此功能；變更此設定會重新啟動閘道，並更新控制介面的內容安全政策。
- `terminal.shell`：選用的 Shell 執行檔。未設定時，OpenClaw 在 Unix 上使用 `$SHELL`，在 Windows 上使用 `%ComSpec%`。
- `terminal.detachedSessionTimeoutSeconds`：終端工作階段在連線中斷（頁面重新載入、筆電休眠）後可存續多久，期間仍可透過 `terminal.attach` 重新連接，並重播其近期輸出。預設：`300`。設為 `0` 可在連線中斷時立即終止工作階段。已分離的工作階段會繼續執行其命令，因此在共用或公開的主機上應縮短此時間。
- `remote.transport`：`ssh`（預設）或 `direct`（ws/wss）。對於 `direct`，公開主機的 `remote.url` 必須為 `wss://`；明文 `ws://` 僅接受用於回送介面、LAN、連結本機、`.local`、`.ts.net` 和 Tailscale CGNAT 主機。
- `remote.remotePort`：遠端 SSH 主機上的閘道連接埠。預設為 `18789`；當本機通道連接埠與遠端閘道連接埠不同時使用此項。
- `remote.tlsFingerprint`：遠端 `wss://` 閘道預期的 SHA-256 憑證指紋。macOS 應用程式會將其套用至操作員／控制連線和隨附節點連線。若未明確設定值，macOS 只會在一般系統信任驗證成功後，記錄首次使用的固定指紋。
- `remote.sshHostKeyPolicy`：macOS SSH 通道主機金鑰政策。`strict` 是預設值，且要求金鑰已受信任。`openssh` 是明確選擇採用受管理別名的有效 OpenSSH 設定；使用前請檢查相符的使用者與系統 SSH 設定。變更目標時，macOS 應用程式和 `configure-remote` 會將此政策重設為 `strict`，除非再次明確選擇採用。
- `gateway.remote.token` / `.password` 是遠端用戶端認證資訊欄位。它們本身不會設定閘道驗證。
- `gateway.push.apns.relay.baseUrl`：由中繼支援的 iOS 組建將註冊發布至閘道後，所使用之外部 APNs 中繼的基礎 HTTPS URL。公開的 App Store 組建使用 OpenClaw 託管的中繼。自訂中繼 URL 必須配合刻意分離的 iOS 組建／部署路徑，且該路徑的中繼 URL 指向該中繼。
- `gateway.push.apns.relay.timeoutMs`：閘道傳送至中繼的逾時時間，以毫秒為單位。預設為 `10000`。
- 由中繼支援的註冊會委派給特定閘道身分。已配對的 iOS 應用程式會擷取 `gateway.identity.get`、在中繼註冊中包含該身分，並將限於該註冊範圍的傳送授權轉送給閘道。其他閘道無法重複使用該已儲存註冊。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：上述中繼設定的暫時環境覆寫。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：僅供開發使用的逃生機制，允許回送介面的 HTTP 中繼 URL。正式環境的中繼 URL 應維持使用 HTTPS。
- `OPENCLAW_HANDSHAKE_TIMEOUT_MS`：內建的驗證前閘道 WebSocket 交握逾時之選用環境覆寫。
- `channels.<provider>.healthMonitor.enabled`：在維持全域監控器啟用的同時，針對各頻道選擇停用健康狀態監控器重新啟動。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多帳號頻道的各帳號覆寫。設定後，其優先順序高於頻道層級覆寫。
- 只有在未設定 `gateway.auth.*` 時，本機閘道呼叫路徑才能使用 `gateway.remote.*` 作為備援。
- 若透過 SecretRef 明確設定 `gateway.auth.token` / `gateway.auth.password` 但無法解析，解析會以關閉方式失敗（不會使用遠端備援掩蓋問題）。
- `trustedProxies`：終止 TLS 或注入轉送用戶端標頭的反向代理 IP。僅列出你控制的代理。回送介面項目對同一主機代理／本機偵測設定仍然有效（例如 Tailscale Serve 或本機反向代理），但它們**不會**使回送介面請求符合 `gateway.auth.mode: "trusted-proxy"` 的使用資格。
- `allowRealIpFallback`：當 `true` 時，若缺少 `X-Forwarded-For`，閘道會接受 `X-Real-IP`。預設為 `false`，以採用失敗時關閉的行為。
- `gateway.nodes.pairing.autoApproveCidrs`：選用的 CIDR／IP 允許清單，用於自動核准未要求任何範圍的首次節點裝置配對。未設定時停用。這不會自動核准操作員／瀏覽器／控制介面／WebChat 配對，也不會自動核准角色、範圍、中繼資料或公開金鑰升級。
- `gateway.nodes.pairing.sshVerify`：首次節點裝置配對的 SSH 驗證自動核准（預設：啟用）。閘道會透過 SSH 連回配對主機（BatchMode、嚴格主機金鑰），且僅在 `openclaw node identity` 裝置金鑰完全相符時核准。適用資格下限與 `autoApproveCidrs` 相同；除非 `cidrs` 覆寫，否則探測僅限於私人／CGNAT 來源位址。設定 `false` 可停用，或設定 `{ user, identity, timeoutMs, cidrs }` 進行調整。請參閱[節點配對](/zh-TW/gateway/pairing#ssh-verified-device-auto-approval-default)。
- `gateway.nodes.commands.allow` / `gateway.nodes.commands.deny`：在配對及平台允許清單評估後，對已宣告的節點命令套用全域允許／拒絕規則。使用 `commands.allow` 選擇啟用危險的節點命令，例如 `camera.snap`、`camera.clip`、`screen.record`、`health.summary`、`sms.search` 和 `sms.send`；即使平台預設值或明確允許原本會包含某個命令，`commands.deny` 仍會將其移除。iOS 健康權限、Android SMS 權限及閘道命令授權彼此獨立。節點變更其宣告的命令清單後，請拒絕該裝置配對並重新核准，讓閘道儲存更新後的命令快照。
- `gateway.tools.deny`：針對 HTTP `POST /tools/invoke` 額外封鎖的工具名稱（擴充預設拒絕清單）。
- `gateway.tools.allow`：針對擁有者／管理員呼叫端，從預設 HTTP 拒絕清單中移除工具名稱。這不會將帶有身分資訊的 `operator.write` 呼叫端提升為擁有者／管理員存取權；即使已加入允許清單，非擁有者呼叫端仍無法使用 `cron`、`gateway` 和 `nodes`。

</Accordion>

### OpenAI 相容端點

- 管理員 HTTP RPC：預設關閉，與 `admin-http-rpc` 外掛相同。啟用此外掛以註冊 `POST /api/v1/admin/rpc`。請參閱[管理員 HTTP RPC](/zh-TW/plugins/admin-http-rpc)。
- Chat Completions：預設停用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 啟用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 輸入強化：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空白允許清單會視為未設定；使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和／或 `gateway.http.endpoints.responses.images.allowUrl=false` 來停用 URL 擷取。
- 選用的回應強化標頭：
  - `gateway.http.securityHeaders.strictTransportSecurity`（僅針對你控制的 HTTPS 來源設定；請參閱[受信任的 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多執行個體隔離

使用不同的連接埠和狀態目錄，在一部主機上執行多個閘道：

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

- `enabled`：在閘道接聽器啟用 TLS 終止（HTTPS/WSS）（預設值：`false`）。
- `autoGenerate`：未設定明確檔案時，自動產生本機自我簽署的憑證／金鑰組；僅限本機／開發用途。
- `certPath`：TLS 憑證檔案的檔案系統路徑。
- `keyPath`：TLS 私密金鑰檔案的檔案系統路徑；請限制其存取權限。
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

- `mode`：控制如何在執行階段套用組態編輯。
  - `"off"`：忽略即時編輯；變更需要明確重新啟動。
  - `"restart"`：組態變更時，一律重新啟動閘道程序。
  - `"hot"`：不重新啟動，直接在程序內套用變更。
  - `"hybrid"`（預設值）：先嘗試熱重新載入；必要時改為重新啟動。
- `debounceMs`：套用組態變更前的防彈跳時間範圍，以毫秒為單位（非負整數；預設值：`300`）。
- `deferralTimeoutMs`：在強制重新啟動或頻道熱重新載入之前，等待進行中作業的選用最長時間，以毫秒為單位。省略此項以使用預設的有限等待時間（`300000`）；設為 `0` 則無限期等待，並定期記錄仍在等待中的警告。

---

## 雲端工作節點環境

雲端工作節點採選擇加入。如果 `cloudWorkers` 不存在，或 `profiles` 為空，OpenClaw 不接受建立任何新的工作節點。先前建立的持久記錄仍會進行調和並保持可見；現有的閘道／節點投影不會變更。

每個工作節點供應者都必須從受信任的佈建輸出傳回 SSH `hostKey`，其格式必須恰為 `algorithm base64`，不得包含主機名稱或註解。啟動程序會將該金鑰寫入隔離的 `known_hosts` 檔案、使用 `StrictHostKeyChecking=yes`，並在供應者省略金鑰時，於開啟連線前失敗。不提供首次使用時信任的備援機制。

通道設定會依需要執行，而不是佈建的一部分。啟動後，閘道會將工作節點本機的 Unix 通訊端反向轉送至其回送 WebSocket 端點。該通訊端位於隨機配置、僅限擁有者存取的遠端目錄；與回送 TCP 連接埠不同，多使用者工作節點上的其他帳戶無法存取，而且不會與其他環境的連接埠衝突。只有在通道擁有者仍為目前擁有者時，SSH 保持連線與有上限的重新連線退避才會執行。停止通道會先阻止重新連線，再關閉 SSH 程序。

控制流量與工作區傳輸使用不同的 SSH 連線。兩者會重複使用相同的已解析身分與隔離且固定的 `known_hosts` 檔案，但工作區傳輸不會與長期運作的通道共用 SSH 連線多工，因此 rsync 無法阻塞控制流量。

### Crabbox 設定檔

隨附的 `crabbox` 供應者會透過本機 Crabbox 命令列介面佈建支援 SSH 的租用執行個體。內層的 `settings.provider` 用於選取 Crabbox 後端；它與外層的 OpenClaw 供應者 ID 不同。

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

- `settings.provider`（必填）：透過 `--provider` 傳遞的 Crabbox 後端。請使用其檢查輸出包含 SSH 端點的後端；`aws` 會選取直接 AWS 後端。
- `settings.class`（必填）：傳遞至 `--class` 的 Crabbox 機器類別。
- `settings.ttl` 和 `settings.idleTimeout`（必填）：傳遞至 `--ttl` 和 `--idle-timeout` 的正值 Go 持續時間字串。這些供應者端的故障安全機制，與下方 OpenClaw 儲存的 `lifetime` 原則不同。
- `settings.binary`：選用的 Crabbox 可執行檔絕對路徑。若未設定，OpenClaw 會依序檢查同層的 Crabbox 簽出內容、`PATH` 上的可執行項目，最後叫用 `crabbox`，使缺少命令列介面的情況仍呈現為可見的供應者錯誤。

未知設定會遭拒絕。Crabbox 認證資訊與後端特定帳戶組態仍由 Crabbox 擁有；請勿將它們放入 `settings`。OpenClaw 僅叫用本機命令列介面，此外掛不會發出供應者網路呼叫。佈建一律傳遞 `--keep=true`；OpenClaw 擁有外部生命週期，並使用 `crabbox stop` 銷毀租用執行個體。

<Note>
  OpenClaw 會透過供應者擁有的祕密解析器解析 Crabbox 租用執行個體本機的 `sshKey` 路徑，並固定使用 `crabbox inspect --json` 傳回的權威 `sshHostKey`。AWS 准入也要求 `providerMetadata.instanceProfileAttached`。請安裝 Crabbox 0.38.1 或更新版本，以使用此封閉式檢查合約。
</Note>

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

- `profiles`：具有非空白、已去除前後空白字元 ID 的具名工作節點設定檔。每個設定檔會選取由外掛註冊的供應者。
- `provider`：非空白的工作節點供應者 ID。範例使用隨附的 `crabbox` 供應者和 QA Lab `static-ssh` 供應者。
- `install`：工作節點安裝方法。`"bundle"`（預設值）會傳輸閘道已安裝組建的內容雜湊套件，並支援已發布、開發中及未發布的版本。`"npm"` 是未修改之封裝發布版可選用的最佳化方法；它會從公開 npm 登錄檔安裝 `openclaw@<exact gateway version>`，且絕不安裝 `latest`。
- 設定後會自動選取隨附的供應者外掛，但明確停用和 `plugins.allow` 仍然適用。設定允許清單時，請包含供應者 ID（例如 `crabbox`）。外部供應者外掛還必須完成安裝並明確啟用。
- `settings`：由供應者擁有且有大小限制的 JSON。所選外掛會定義並驗證其鍵；含有祕密的值請使用[SecretRef 物件](/zh-TW/gateway/secrets)。靜態 SSH 供應者要求 `host`、`user`、`hostKey` 和 `keyRef`；`port` 預設為 `22`。`hostKey` 必須是從已知主機或其他受信任管道取得的一行 OpenSSH 公開主機金鑰（`algorithm base64`），且不得包含選項前置字串。
- `lifetime.idleTimeoutMinutes`：儲存供後續閒置回收原則使用的正整數分鐘數。
- `lifetime.maxLifetimeMinutes`：儲存供後續生命週期原則使用的正整數分鐘數。

工作節點上必須已安裝支援的 Node 執行階段（22.22.3+、24.15+ 或 25.9+）以及可安全重設 WAL 的 SQLite。可選用的 `"npm"` 方法也要求 `npm`，以及存取公開 npm 登錄檔的對外 HTTPS 連線。具網路連線的工具鏈設定是供應者原則；啟動程序不會自行安裝工具鏈，而是回報可採取行動的錯誤。

此基礎功能會安裝並驗證閘道組建，並提供通道啟動／停止生命週期，但不會啟動一般 OpenClaw 命令列介面。獨立完整的工作節點進入點與迴圈將在下一個雲端工作節點里程碑實作。

每筆持久環境記錄都會在建立時的設定檔快照中保留已驗證的供應者設定、已解析的安裝方法與生命週期原則。變更或移除具名設定檔會影響新建立的項目；只要擁有該記錄的外掛仍可使用，現有記錄便會繼續使用該快照進行生命週期調和。

在第一個雲端工作節點版本中，生命週期值僅作為資料使用；自動強制執行將隨後續生命週期工作實作。設定檔變更需要重新啟動閘道。

<Warning>
  `static-ssh` 供應者是來源樹狀結構中的 QA Lab 開發測試工具，不會包含在封裝發行版中。在其共用主機上執行的工作節點可以讀取不相關的主機資料，因此請勿將此供應者用作正式環境的隔離邊界。
  其操作員必須提供預期的 `hostKey`；OpenClaw 不會從第一次連線得知或接受金鑰。
  銷毀其租用執行個體只會釋放 OpenClaw 的邏輯記錄；不會停止或清理主機。
</Warning>

---

## 網路鉤子

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
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
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

驗證：`Authorization: Bearer <token>` 或 `x-openclaw-token: <token>`。
查詢字串網路鉤子權杖會遭拒絕。

驗證與安全注意事項：

- `hooks.enabled=true` 必須有非空白的 `hooks.token`。
- `hooks.token` 應與作用中的閘道共用密鑰驗證（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）不同；啟動時若偵測到重複使用，會記錄非致命的安全性警告。
- `openclaw security audit` 會將鉤子／閘道驗證重複使用標示為重大發現，包括僅在稽核時提供的閘道密碼驗證（`--auth password --password <password>`）。執行 `openclaw doctor --fix` 以輪替已持久保存且重複使用的 `hooks.token`，然後更新外部鉤子傳送端以使用新的鉤子權杖。
- `hooks.path` 不得為 `/`；請使用專用子路徑，例如 `/hooks`。
- 若 `hooks.allowRequestSessionKey=true`，請限制 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 若對應或預設使用範本化的 `sessionKey`，請設定 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。靜態對應鍵不需要這項選擇加入設定。

**端點：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 僅當 `hooks.allowRequestSessionKey=true`（預設值：`false`）時，才接受要求承載資料中的 `sessionKey`。
- `POST /hooks/<name>` → 透過 `hooks.mappings` 解析
  - 由範本轉譯的對應 `sessionKey` 值會視為由外部提供，且同樣需要 `hooks.allowRequestSessionKey=true`。

<Accordion title="對應詳細資料">

- `match.path` 會比對 `/hooks` 之後的子路徑（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 會比對一般路徑的承載資料欄位。
- 如 `{{messages[0].subject}}` 的範本會從承載資料讀取。
- `transform` 可指向傳回鉤子動作的 JS/TS 模組。
  - `transform.module` 必須是相對路徑，且須保持在 `hooks.transformsDir` 內（絕對路徑和路徑周遊會遭拒絕）。
  - 請將 `hooks.transformsDir` 保留在 `~/.openclaw/hooks/transforms` 下；工作區 Skills 目錄會遭拒絕。若 `openclaw doctor` 回報此路徑無效，請將轉換模組移至鉤子轉換目錄，或移除 `hooks.transformsDir`。
- `agentId` 會路由至特定代理程式；未知 ID 會回復至預設代理程式。
- `allowedAgentIds`：限制有效的代理程式路由，包括省略 `agentId` 時的預設代理程式路徑（`*` 或省略 = 全部允許，`[]` = 全部拒絕）。
- `defaultSessionKey`：鉤子代理程式執行未明確指定 `sessionKey` 時，可使用的固定工作階段鍵。
- `allowRequestSessionKey`：允許 `/hooks/agent` 呼叫端和範本驅動的對應工作階段鍵設定 `sessionKey`（預設值：`false`）。
- `allowedSessionKeyPrefixes`：明確 `sessionKey` 值（要求 + 對應）的選用前綴允許清單，例如 `["hook:"]`。任何對應或預設使用範本化的 `sessionKey` 時，此項即為必要。
- `deliver: true` 會將最終回覆傳送至頻道；`channel` 預設為 `last`。
- `model` 會覆寫此鉤子執行使用的 LLM（若已設定模型目錄，則該模型必須獲允許）。

</Accordion>

### Gmail 整合

- 內建的 Gmail 預設使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 這個每封郵件鍵只會隔離對話內容，不會隔離工具或工作區存取權限。若沒有設定 `agentId` 的自訂對應，預設會使用預設代理程式。
- 對於不受信任的收件匣，請將 Gmail 路由至專用的讀取代理程式，並使用[每個代理程式的沙箱和工具政策](/zh-TW/tools/multi-agent-sandbox-tools)限制該代理程式。若讀取代理程式必須通知主要代理程式，請使用 [`tools.agentToAgent`](/zh-TW/gateway/config-tools#toolsagenttoagent) 限制交接。建議的威脅模型和模型層級請參閱[提示詞注入](/zh-TW/gateway/security#prompt-injection)。
- 若保留這種每封郵件路由，請設定 `hooks.allowRequestSessionKey: true`，並限制 `hooks.allowedSessionKeyPrefixes` 以符合 Gmail 命名空間，例如 `["hook:", "hook:gmail:"]`。
- 若需要 `hooks.allowRequestSessionKey: false`，請使用靜態 `sessionKey` 覆寫預設，而非使用範本化的預設值。

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
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

- 完成設定後，閘道會在啟動時自動啟動 `gog gmail watch serve`。設定 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可停用。
- 請勿在閘道之外另外執行 `gog gmail watch serve`。

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

- 透過閘道連接埠，以 HTTP 提供代理程式可編輯的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 僅限本機：保留 `gateway.bind: "loopback"`（預設值）。
- 非迴路位址繫結：與其他閘道 HTTP 介面相同，Canvas 路由需要閘道驗證（權杖／密碼／受信任的 Proxy）。
- 節點 WebView 通常不會傳送驗證標頭；節點配對並連線後，閘道會公告節點範圍的功能 URL，以供存取 Canvas/A2UI。
- 功能 URL 會繫結至作用中的節點 WS 工作階段，並且很快到期。不使用以 IP 為基礎的備援。
- 將即時重新載入用戶端注入所提供的 HTML。
- 空白時會自動建立入門 `index.html`。
- 也會在 `/__openclaw__/a2ui/` 提供 A2UI。
- 變更需要重新啟動閘道。
- 大型目錄或發生 `EMFILE` 錯誤時，請停用即時重新載入。

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

- `minimal`（預設值）：從 TXT 記錄省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`；區域網路多播公告仍需要啟用隨附的 `bonjour` 外掛。
- `off`：在不變更外掛啟用狀態的情況下，停用區域網路多播公告。
- 隨附的 `bonjour` 外掛會在 macOS 主機上自動啟動；在 Linux、Windows 和容器化閘道部署上則需選擇啟用。
- 若系統主機名稱是有效的 DNS 標籤，預設會使用該主機名稱，否則回復至 `openclaw`。使用 `OPENCLAW_MDNS_HOSTNAME` 覆寫。
- `OPENCLAW_DISABLE_BONJOUR=1` 會直接停用 mDNS 公告，並覆寫 `discovery.mdns.mode`。

### 廣域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

在 `~/.openclaw/dns/` 下寫入單點傳播 DNS-SD 區域。若要跨網路探索，請搭配 DNS 伺服器（建議使用 CoreDNS）和 Tailscale 分割 DNS。

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

- 只有在處理程序環境缺少該鍵時，才會套用行內環境變數。
- `.env` 檔案：目前工作目錄的 `.env` + `~/.openclaw/.env`（兩者都不會覆寫現有變數）。
- `shellEnv`：從你的登入 Shell 設定檔匯入缺少的預期鍵。
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
- 變數缺少或為空白時，會在載入設定時擲回錯誤。
- 使用 `$${VAR}` 跳脫，以表示字面值 `${VAR}`。
- 可搭配 `$include` 使用。

---

## 密鑰

密鑰參照是附加功能：純文字值仍可使用。

### `SecretRef`

使用下列其中一種物件形式：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

驗證：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` ID 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` ID：絕對 JSON 指標（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` ID 模式：`^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（支援 AWS 樣式的 `secret#json_key` 選取器）
- `source: "exec"` ID 不得包含 `.` 或 `..` 這些以斜線分隔的路徑區段（例如 `a/../b` 會遭拒絕）

### 支援的認證資訊介面

- 標準矩陣：[SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface)
- `secrets apply` 會以支援的 `openclaw.json` 認證資訊路徑為目標。
- `auth-profiles.json` 參照會納入執行階段解析和稽核涵蓋範圍。

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

注意事項：

- `file` 提供者支援 `mode: "json"` 和 `mode: "singleValue"`（在 singleValue 模式中，`id` 必須為 `"value"`）。
- 當 Windows ACL 驗證無法使用時，檔案和 exec 提供者路徑會採取失敗關閉。只有對於無法驗證的受信任路徑，才設定 `allowInsecurePath: true`。
- `exec` 提供者要求絕對的 `command` 路徑，並透過 stdin/stdout 使用通訊協定承載資料。
- 依預設，符號連結命令路徑會遭拒絕。設定 `allowSymlinkCommand: true` 可在驗證解析後目標路徑的同時，允許符號連結路徑。
- 若已設定 `trustedDirs`，受信任目錄檢查會套用至解析後的目標路徑。
- `exec` 子程序環境預設為最小化；請使用 `passEnv` 明確傳入必要的變數。
- 密鑰參照會在啟用時解析為記憶體內快照，之後要求路徑只會讀取該快照。
- 啟用期間會套用作用中介面篩選：已啟用介面上未解析的參照會導致啟動／重新載入失敗，而非作用中介面則會略過並提供診斷資訊。

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

- 每個代理程式的設定檔儲存於 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 支援靜態認證資訊模式的值層級參照（`keyRef` 用於 `api_key`，`tokenRef` 用於 `token`）。
- 舊版扁平 `auth-profiles.json` 對應表（例如 `{ "provider": { "apiKey": "..." } }`）不是執行階段格式；`openclaw doctor --fix` 會將其重寫為標準 `provider:default` API 金鑰設定檔，並建立 `.legacy-flat.*.bak` 備份。
- OAuth 模式設定檔（`auth.profiles.<id>.mode = "oauth"`）不支援以 SecretRef 為後端的驗證設定檔認證資訊。
- 靜態執行階段認證資訊來自記憶體中已解析的快照；發現舊版靜態 `auth.json` 項目時，會將其清除。
- 舊版 OAuth 從 `~/.openclaw/credentials/oauth.json` 匯入。
- 請參閱 [OAuth](/zh-TW/concepts/oauth)。
- 機密資料的執行階段行為與 `audit/configure/apply` 工具：[機密資料管理](/zh-TW/gateway/secrets)。

---

## 稽核

```json5
{
  audit: {
    enabled: true,
    messages: "off", // off | direct | all
  },
}
```

閘道會將代理程式執行和工具動作的**僅中繼資料**稽核事件記錄至共用狀態資料庫。訊息生命週期中繼資料需另外選擇啟用。此帳本會儲存身分、時間、工具名稱及正規化結果，但絕不儲存提示詞、訊息本文、工具引數、結果或原始錯誤文字。訊息資料列不會儲存原始平台帳號、交談、訊息及目標 ID。執行／工具工作階段金鑰仍可用於建立關聯，而這些金鑰本身可能包含平台帳號或對等端 ID。記錄會在 30 天後到期，且帳本上限為 100,000 列。請使用 [`openclaw audit`](/zh-TW/cli/audit) 或 [`audit.activity.list`](/zh-TW/gateway/protocol#audit-ledger-rpc) 閘道 RPC 查詢。完整資料模型、隱私語意及涵蓋範圍限制，請參閱[稽核記錄](/zh-TW/gateway/audit)。

- `enabled`：記錄新的稽核事件（預設：`true`）。帳本預設為啟用，因為只有在事件發生後才啟用的稽核軌跡，無法說明該事件。設定 `false` 後，閘道重新啟動時會停止插入新事件；現有記錄在到期前仍可讀取。重新啟用後，會從該時間點恢復記錄，不會回填中間的缺漏。
- `messages`：訊息中繼資料範圍（預設：`"off"`）。`"direct"` 僅記錄已知的直接交談。`"all"` 也會記錄群組、頻道及未知類型的交談。這兩種模式都不包含內容，且在可建立關聯時，會將原始識別碼替換為安裝環境本機的金鑰化假名。這些是假名化關聯輔助工具，而非匿名化；狀態資料庫會儲存衍生金鑰，但 RPC 與命令列介面匯出內容不會包含該金鑰。

執行中的閘道會在啟動時擷取 `audit.enabled` 和 `audit.messages`；變更任一設定後，請重新啟動閘道。目前訊息涵蓋範圍包括已接受、且抵達核心分派流程的傳入訊息，以及抵達共用持久傳遞流程之每個原始邏輯傳出回覆酬載的一筆終止資料列。繞過這些共用邊界的外掛本機路徑和直接傳送路徑目前尚未涵蓋。此有界背景寫入器採盡力而為方式運作，並非無遺漏的法規遵循封存機制。

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
- 設定 `logging.file` 以使用固定路徑。
- 當 `--verbose` 時，`consoleLevel` 會提升為 `debug`。
- `maxFileBytes`：輪替前使用中記錄檔的大小上限（位元組，正整數；預設：`104857600` = 100 MB）。OpenClaw 最多會在使用中檔案旁保留五個編號封存檔。
- `redactSensitive` / `redactPatterns`：對主控台輸出、檔案記錄、OTLP 記錄項目及持久保存的工作階段逐字稿文字進行盡力而為的遮罩處理。`redactSensitive: "off"` 只會停用這項一般記錄／逐字稿政策；UI／工具／診斷安全介面仍會在輸出前遮蔽機密資料。

---

## 診斷

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],

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

- `enabled`：檢測輸出的總開關（預設：`true`）。
- `flags`：用於啟用目標記錄輸出的旗標字串陣列（支援 `"telegram.*"` 或 `"*"` 等萬用字元）。
- `otel.enabled`：啟用 OpenTelemetry 匯出流水線（預設：`false`）。完整設定、訊號目錄及隱私模型，請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。
- `otel.endpoint`：用於 OTel 匯出的收集器 URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`：選用的訊號專用 OTLP 端點。設定後，只會覆寫該訊號的 `otel.endpoint`。
- `otel.protocol`：`"http/protobuf"`（預設）或 `"grpc"`。
- `otel.headers`：隨 OTel 匯出要求傳送的額外 HTTP/gRPC 中繼資料標頭。
- `otel.serviceName`：資源屬性使用的服務名稱。
- `otel.traces` / `otel.metrics` / `otel.logs`：啟用追蹤、指標或記錄匯出。
- `otel.logsExporter`：記錄匯出接收端：`"otlp"`（預設）、每行標準輸出一個 JSON 物件的 `"stdout"`，或 `"both"`。
- `otel.sampleRate`：追蹤取樣率 `0`-`1`。
- `otel.flushIntervalMs`：定期遙測排清間隔，單位為毫秒。
- `otel.captureContent`：選擇啟用 OTEL span 屬性的原始內容擷取。預設為關閉。布林值 `true` 會擷取非系統訊息／工具內容；物件形式可讓你明確啟用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt` 和 `toolDefinitions`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`：用於最新實驗性 GenAI 推論 span 形態的環境開關，包括 `{gen_ai.operation.name} {gen_ai.request.model}` span 名稱、`CLIENT` span 種類，以及以 `gen_ai.provider.name` 取代舊版 `gen_ai.system`。為了相容性，span 預設會保留 `openclaw.model.call` 和 `gen_ai.system`；GenAI 指標則使用有界語意屬性。
- `OPENCLAW_OTEL_PRELOADED=1`：用於已註冊全域 OpenTelemetry SDK 之主機的環境開關。OpenClaw 隨後會略過外掛擁有的 SDK 啟動／關閉流程，同時維持診斷監聽器作用中。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 和 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`：當對應設定鍵未設定時使用的訊號專用端點環境變數。
- `cacheTrace.enabled`：記錄嵌入式執行的快取追蹤快照（預設：`false`）。
- `cacheTrace.filePath`：快取追蹤 JSONL 的輸出路徑（預設：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制快取追蹤輸出包含的內容（預設皆為：`true`）。

---

## 更新

```json5
{
  update: {
    channel: "stable", // stable | extended-stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
    },
  },
}
```

- `channel`：發行頻道 — `"stable"`、`"extended-stable"`、`"beta"` 或 `"dev"`。延伸穩定版僅適用於套件：前景命令負責安裝，而閘道可能會發出唯讀更新提示。
- `checkOnStart`：閘道啟動時檢查 npm 更新（預設：`true`）。已儲存的延伸穩定版選擇使用相同的唯讀提示及 24 小時提示排程。
- `auto.enabled`：為穩定版與 beta 套件安裝啟用背景自動更新（預設：`false`）。延伸穩定版絕不會自動套用。

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
    stream: {
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
    },
  },
}
```

- `enabled`：全域 ACP 功能閘門（預設：`true`；設定 `false` 以隱藏 ACP 分派及衍生功能）。
- `dispatch.enabled`：ACP 工作階段輪次分派的獨立閘門（預設：`true`）。設定 `false` 可保留 ACP 命令，同時封鎖執行。
- `backend`：預設 ACP 執行階段後端 ID（必須符合已註冊的 ACP 執行階段外掛）。
  請先安裝後端外掛；如果已設定 `plugins.allow`，請加入後端外掛 ID（例如 `acpx`），否則 ACP 後端不會載入。
- `fallbacks`：當主要後端在產生任何輸出之前，因看似暫時性的錯誤（無法使用、受到速率限制、配額耗盡或過載）而提早失敗時，要依序嘗試的備援 ACP 後端 ID 清單。每個項目都必須符合已註冊的 ACP 執行階段外掛後端。
- `defaultAgent`：衍生作業未指定明確目標時使用的備援 ACP 目標代理程式 ID。
- `allowedAgents`：允許用於 ACP 執行階段工作階段的代理程式 ID 白名單；空白表示沒有額外限制。
- `stream.repeatSuppression`：抑制每輪重複的狀態／工具行（預設：`true`）。
- `stream.deliveryMode`：`"live"` 會逐步串流；`"final_only"` 會緩衝至輪次終止事件。
- `stream.tagVisibility`：標籤名稱至串流事件布林可見性覆寫值的記錄。
- `runtime.installCommand`：啟動 ACP 執行階段環境時要執行的選用安裝命令。

---

## 精靈

命令列介面引導式設定流程（`onboard`、`configure`、`doctor`）的行為與中繼資料：

```json5
{
  wizard: {
    accessMode: "full",
    appRecommendations: true,
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

- `wizard.accessMode`：在引導式初始設定開始時選擇的探索同意選項。`"full"`（建議）讓設定程序自動尋找 AI 應用程式、金鑰和本機執行環境；`"guarded"` 會讓設定程序在探索前詢問一次，並改為提供手動設定選項。

- `wizard.appRecommendations` 預設為 `true`。將其設為 `false`，即可在引導式或傳統初始設定期間停用已安裝應用程式建議，並封鎖閘道的 `device.apps` 存取權。節點主機仍須另行啟用其預設關閉的已安裝應用程式共享旗標，才會公布此命令。

---

## 身分

請參閱[代理程式預設值](/zh-TW/gateway/config-agents#agent-defaults)下的 `agents.entries` 身分欄位。

---

## 橋接器（舊版，已移除）

目前的組建已不再包含 TCP 橋接器。節點會透過閘道 WebSocket 連線。`bridge.*` 金鑰已不再屬於設定結構描述（移除前驗證會失敗；`openclaw doctor --fix` 可移除未知金鑰）。

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
    webhook: "https://example.invalid/legacy", // 已儲存 notify:true 工作的已淘汰備援
    webhookToken: "replace-with-dedicated-token", // 用於對外網路鉤子驗證的選用持有人權杖
    sessionRetention: "24h", // 持續時間字串或 false
  },
}
```

- `sessionRetention`：在刪除 SQLite 工作階段資料列前，保留已完成之隔離排程執行工作階段的時間長度。也控制已封存之刪除排程文字記錄的清理。預設值：`24h`；設為 `false` 可停用。
- 執行歷程會自動為每個工作保留最新的 2000 筆終端資料列。遺失的資料列仍保有其 24 小時清理期限。
- `webhookToken`：用於排程網路鉤子 POST 傳遞的持有人權杖（`delivery.mode = "webhook"`）；若省略，則不會傳送驗證標頭。
- `webhook`：已淘汰的舊版備援網路鉤子 URL（http/https），供 `openclaw doctor --fix` 用來遷移仍具有 `notify: true` 的已儲存工作；執行階段傳遞使用每個工作的 `delivery.mode="webhook"` 加上 `delivery.to`，或在保留公告傳遞時使用 `delivery.completionDestination`。

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
- `cooldownMs`：同一工作重複警示之間的最短毫秒數（非負整數）。
- `includeSkipped`：將連續略過的執行計入警示門檻（預設值：`false`）。略過的執行會分開追蹤，且不影響執行錯誤的退避機制。
- `mode`：傳遞模式——`"announce"` 透過頻道訊息傳送；`"webhook"` 發布至已設定的網路鉤子。
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
- `channel`：公告傳遞的頻道覆寫。`"last"` 會重複使用最後已知的傳遞頻道。
- `to`：明確的公告目標或網路鉤子 URL。網路鉤子模式下為必填。
- `accountId`：選用的傳遞帳號覆寫。
- 每個工作的 `delivery.failureDestination` 會覆寫此全域預設值。
- 若全域與每個工作的失敗目的地皆未設定，已透過 `announce` 傳遞的工作會在失敗時退回使用該主要公告目標。
- `delivery.failureDestination` 僅支援 `sessionTarget="isolated"` 工作，除非工作的主要 `delivery.mode` 為 `"webhook"`。

請參閱[排程工作](/zh-TW/automation/cron-jobs)。隔離的排程執行會以[背景工作](/zh-TW/automation/tasks)形式追蹤。

## 媒體模型範本變數

在 `tools.media.models[].args` 中展開的範本預留位置：

| 變數               | 說明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完整的傳入訊息本文                                |
| `{{RawBody}}`      | 原始本文（無歷程／傳送者包裝）                    |
| `{{BodyStripped}}` | 已移除群組提及的本文                              |
| `{{From}}`         | 傳送者識別碼                                      |
| `{{To}}`           | 目的地識別碼                                      |
| `{{MessageSid}}`   | 頻道訊息 ID                                       |
| `{{SessionId}}`    | 目前的工作階段 UUID                               |
| `{{IsNewSession}}` | 建立新工作階段時為 `"true"`             |
| `{{MediaUrl}}`     | 傳入媒體的虛擬 URL                                |
| `{{MediaPath}}`    | 本機媒體路徑                                      |
| `{{MediaType}}`    | 媒體類型（圖片／音訊／文件／…）                   |
| `{{Transcript}}`   | 音訊逐字稿                                        |
| `{{Prompt}}`       | 命令列介面項目解析後的媒體提示                    |
| `{{MaxChars}}`     | 命令列介面項目解析後的最大輸出字元數              |
| `{{ChatType}}`     | `"direct"` 或 `"group"`          |
| `{{GroupSubject}}` | 群組主旨（盡力取得）                              |
| `{{GroupMembers}}` | 群組成員預覽（盡力取得）                          |
| `{{SenderName}}`   | 傳送者顯示名稱（盡力取得）                        |
| `{{SenderE164}}`   | 傳送者電話號碼（盡力取得）                        |
| `{{Provider}}`     | 提供者提示（whatsapp、telegram、discord 等）       |

---

## 設定引入（`$include`）

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
- 同層金鑰：在引入後合併（覆寫引入的值）。
- 巢狀引入：最多可達 10 層深。
- 路徑：相對於執行引入的檔案解析，但必須位於頂層設定目錄（`openclaw.json` 的 `dirname`）內。僅當絕對／`../` 形式解析後仍位於該邊界內時才允許使用。設定 `OPENCLAW_INCLUDE_ROOTS`（絕對路徑）可允許設定目錄外的其他根目錄。
- 限制：路徑不得包含空位元組，且解析前後都必須嚴格短於 4096 個字元；每個引入檔案的上限為 2 MB。
- 若 OpenClaw 擁有的寫入只變更由單一檔案引入所支援的一個頂層區段，則會直接寫入該引入檔案。例如，`plugins install` 會更新 `plugins.json5` 中的 `plugins: { $include: "./plugins.json5" }`，並保持 `openclaw.json` 不變。
- 對於 OpenClaw 擁有的寫入，根層級引入、引入陣列，以及具有同層覆寫的引入皆為唯讀；這些寫入會採取封閉式失敗，而不會攤平設定。
- 錯誤：針對檔案遺失、剖析錯誤、循環引入、無效路徑格式和長度過長提供清楚的訊息。

---

## 相關內容

- [設定](/zh-TW/gateway/configuration)
- [設定範例](/zh-TW/gateway/configuration-examples)
- [Doctor](/zh-TW/gateway/doctor)
