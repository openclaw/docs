---
read_when:
    - 你需要精確的欄位層級設定語意或預設值
    - 你正在驗證頻道、模型、閘道或工具設定區塊
summary: 核心 OpenClaw 鍵、預設值，以及專用子系統參考連結的閘道設定參考
title: 設定參考
x-i18n:
    generated_at: "2026-07-05T11:18:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5b0b2024993778fdd1f390af8dc223b5aa1bc0fb42e8863f09280504f8697301
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` 的欄位層級參考：鍵、預設值，以及連到更深入子系統頁面的連結。如需以任務為導向的設定指引，請參閱[組態](/zh-TW/gateway/configuration)。通道與外掛擁有的命令目錄，以及深層記憶體/QMD 調整項目，位於各自頁面，不在此處。

組態格式為 **JSON5**（允許註解與尾隨逗號）。所有欄位都是選填；省略時，OpenClaw 會使用安全的預設值。

程式碼真相優先於本頁：

- `openclaw config schema` 會列印用於驗證與 Control UI 的即時 JSON Schema，並合併 bundled/外掛/通道中繼資料。
- 代理應在編輯組態前，針對一個精確的路徑範圍架構節點呼叫 `gateway` 工具動作 `config.schema.lookup`。
- `pnpm config:docs:check` / `pnpm config:docs:gen` 會根據目前架構表面驗證此文件的基準雜湊。

專用深入參考：

- [記憶體組態參考](/zh-TW/reference/memory-config)，涵蓋 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及 `plugins.entries.memory-core.config.dreaming` 底下的夢境整理組態。
- [斜線命令](/zh-TW/tools/slash-commands)，涵蓋目前的內建 + bundled 命令目錄。
- 通道特定命令表面請參閱擁有該表面的通道/外掛頁面。

---

## 通道

每個通道的組態鍵位於[組態 - 通道](/zh-TW/gateway/config-channels)：`channels.*` 適用於 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage，以及其他 bundled 通道（驗證、存取控制、多帳號、提及閘門）。

## 代理預設值、多代理、工作階段與訊息

請參閱[組態 - 代理](/zh-TW/gateway/config-agents)，內容涵蓋：

- `agents.defaults.*`（工作區、模型、思考、心跳偵測、記憶體、媒體、Skills、沙箱）
- `multiAgent.*`（多代理路由與繫結）
- `session.*`（工作階段生命週期、壓縮、修剪）
- `messages.*`（訊息傳遞、TTS、Markdown 算繪）
- `talk.*`（Talk 模式）
  - `talk.consultThinkingLevel`：Control UI Talk 即時諮詢背後完整 OpenClaw 代理執行的思考層級覆寫
  - `talk.consultFastMode`：Control UI Talk 即時諮詢的一次性快速模式覆寫
  - `talk.speechLocale`：Talk 在 iOS/macOS 上語音辨識的選填 BCP 47 地區設定 ID
  - `talk.silenceTimeoutMs`：未設定時，Talk 會在傳送逐字稿前保留平台預設暫停視窗（`macOS 和 Android 為 700 ms，iOS 為 900 ms`）
  - `talk.realtime.consultRouting`：已完成且略過 `openclaw_agent_consult` 的即時 Talk 逐字稿的閘道轉送後援

## 工具與自訂提供者

工具政策、實驗性切換、提供者支援的工具組態，以及自訂
提供者 / 基底 URL 設定位於
[組態 - 工具與自訂提供者](/zh-TW/gateway/config-tools)。

## 模型

提供者定義、模型允許清單，以及自訂提供者設定位於
[組態 - 工具與自訂提供者](/zh-TW/gateway/config-tools#custom-providers-and-base-urls)。
`models` 根也擁有全域模型目錄行為。

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`：提供者目錄行為（`merge` 或 `replace`）。
- `models.providers`：以提供者 ID 為鍵的自訂提供者對應表。
- `models.providers.*.localService`：本機模型伺服器的選填隨需程序管理器。OpenClaw 會探測已設定的健康狀態端點，在需要時啟動絕對路徑 `command`，等待就緒，然後傳送模型請求。請參閱[本機模型服務](/zh-TW/gateway/local-model-services)。
- `models.pricing.enabled`：控制在 sidecar 與通道到達閘道就緒路徑後啟動的背景定價啟動程序。為 `false` 時，閘道會略過 OpenRouter 與 LiteLLM 定價目錄擷取；已設定的 `models.providers.*.models[].cost` 值仍可用於本機成本估算。

## MCP

OpenClaw 管理的 MCP 伺服器定義位於 `mcp.servers` 底下，並由嵌入式 OpenClaw 與其他執行階段配接器使用。`openclaw mcp list`、`show`、`set` 與 `unset` 命令會管理此區塊，且在編輯組態時不會連線到目標伺服器。

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
  `type: "http"` 是命令列介面原生別名，`openclaw mcp set` 與
  `openclaw doctor --fix` 會將其正規化為標準 `transport` 欄位。
- `mcp.servers.<name>.enabled`：設為 `false` 可保留已儲存的伺服器定義，同時將其排除於嵌入式 OpenClaw MCP 探索與工具投射之外。
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`：每個伺服器的 MCP 請求逾時，以秒或毫秒為單位。
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`：每個伺服器的連線逾時，以秒或毫秒為單位。
- `mcp.servers.<name>.supportsParallelToolCalls`：選填並行提示，供可選擇是否發出並行 MCP 工具呼叫的配接器使用。
- `mcp.servers.<name>.auth`：對需要 OAuth 的 HTTP MCP 伺服器設為 `"oauth"`。執行 `openclaw mcp login <name>`，將權杖儲存在 OpenClaw 狀態底下。
- `mcp.servers.<name>.oauth`：選填 OAuth 範圍、重新導向 URL，以及用戶端中繼資料 URL 覆寫。
- `mcp.servers.<name>.sslVerify`、`clientCert`、`clientKey`：私人端點與雙向 TLS 的 HTTP TLS 控制項。
- `mcp.servers.<name>.toolFilter`：選填的每伺服器工具選取。`include`
  會將探索到的 MCP 工具限制為相符名稱；`exclude` 會隱藏相符名稱。項目是精確的 MCP 工具名稱或簡單的 `*` glob。具有資源或提示的伺服器也會產生公用工具名稱（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`），且這些名稱使用相同篩選器。
- `mcp.servers.<name>.codex`：選填 Codex app-server 投射控制項。
  此區塊僅是 Codex app-server 執行緒的 OpenClaw 中繼資料；不會影響 ACP 工作階段、一般 Codex harness 組態或其他執行階段配接器。
  非空的 `codex.agents` 會將伺服器限制於列出的 OpenClaw 代理 ID。
  空白、空值或無效的範圍代理清單會被組態驗證拒絕，並由執行階段投射路徑省略，而不會變成全域。
  `codex.defaultToolsApprovalMode` 會為該伺服器輸出 Codex 原生的
  `default_tools_approval_mode`。OpenClaw 會先移除 `codex`
  區塊，再將原生 `mcp_servers` 組態傳遞給 Codex。省略此區塊可讓伺服器以 Codex 預設 MCP 核准行為，投射給每個 Codex app-server 代理。
- `mcp.sessionIdleTtlMs`：工作階段範圍 bundled MCP 執行階段的閒置 TTL。
  一次性嵌入式執行會請求執行結束清理；此 TTL 是長時間工作階段與未來呼叫者的後備機制。
- `mcp.*` 底下的變更會透過釋放快取的工作階段 MCP 執行階段熱套用。
  下一次工具探索/使用會從新組態重新建立它們，因此已移除的
  `mcp.servers` 項目會立即被回收，而不是等待閒置 TTL。
- 執行階段探索也會透過丟棄該工作階段的快取目錄，遵循 MCP 工具清單變更通知。公告資源或提示的伺服器會取得用於列出/讀取資源，以及列出/擷取提示的公用工具。重複工具呼叫失敗會短暫暫停受影響的伺服器，之後才會再嘗試另一個呼叫。

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

- `allowBundled`：僅適用於 bundled Skills 的選填允許清單（不影響受管理/工作區 Skills）。
- `load.extraDirs`：額外的共享 Skills 根目錄（最低優先順序）。
- `load.allowSymlinkTargets`：受信任的實際目標根目錄，當 Skills 符號連結位於其已設定來源根目錄之外時，可解析到這些根目錄。
- `workshop.allowSymlinkTargetWrites`：允許 Skill Workshop apply 寫入已受信任的符號連結目標（預設值：false）。
- `install.preferBrew`：為 true 時，若 `brew` 可用，會先偏好 Homebrew 安裝器，再回退到其他安裝器種類。
- `install.nodeManager`：`metadata.openclaw.install` 規格的節點安裝器偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`：允許受信任的 `operator.admin` 閘道用戶端安裝透過 `skills.upload.*` 暫存的私人 zip 封存檔（預設值：false）。這只會啟用上傳封存檔路徑；一般 ClawHub 安裝不需要它。
- `entries.<skillKey>.enabled: false` 會停用 Skills，即使它是 bundled/已安裝也一樣。
- `entries.<skillKey>.apiKey`：為宣告主要 env var 的 Skills 提供便利設定（純文字字串或 SecretRef 物件）。
- `limits.maxCandidatesPerRoot`、`limits.maxSkillsLoadedPerSource`、`limits.maxSkillsInPrompt`、`limits.maxSkillsPromptChars`、`limits.maxSkillFileBytes`：限制 Skills 探索與面向模型的 Skills 提示。
- Skill Workshop 自主性/核准設定（`workshop.autonomous.enabled`、`workshop.approvalPolicy`、`workshop.maxPending`、`workshop.maxSkillBytes`）記載於 [Skills 組態](/zh-TW/tools/skills-config)。

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

- 從 `~/.openclaw/extensions` 和 `<workspace>/.openclaw/extensions` 下的套件或套組目錄載入，外加 `plugins.load.paths` 中列出的檔案或目錄。
- 將獨立外掛檔案放在 `plugins.load.paths`；自動探索的擴充功能根目錄會忽略頂層 `.js`、`.mjs` 和 `.ts` 檔案，因此這些根目錄中的輔助指令碼不會阻擋啟動。
- 探索接受原生 OpenClaw 外掛，以及相容的 Codex 套組和 Claude 套組，包括沒有 manifest 的 Claude 預設版面配置套組。
- **設定變更需要重新啟動閘道。**
- `allow`：選用允許清單（只載入列出的外掛）。`deny` 優先。
- `plugins.entries.<id>.apiKey`：外掛層級 API 金鑰便利欄位（外掛支援時）。
- `plugins.entries.<id>.env`：外掛範圍的環境變數對應。
- `plugins.entries.<id>.hooks.allowPromptInjection`：為 `false` 時，核心會封鎖 `before_prompt_build`，並忽略舊版 `before_agent_start` 中會改動提示的欄位，同時保留舊版 `modelOverride` 和 `providerOverride`。適用於原生外掛 hook 和受支援、由套組提供的 hook 目錄。
- `plugins.entries.<id>.hooks.allowConversationAccess`：為 `true` 時，受信任的非隨附外掛可以從型別化 hook 讀取原始對話內容，例如 `llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize` 和 `agent_end`。
- `plugins.entries.<id>.subagent.allowModelOverride`：明確信任此外掛可針對背景子代理執行請求每次執行的 `provider` 和 `model` 覆寫。
- `plugins.entries.<id>.subagent.allowedModels`：受信任子代理覆寫可用的標準 `provider/model` 目標選用允許清單。只有在你有意允許任何模型時，才使用 `"*"`。
- `plugins.entries.<id>.llm.allowModelOverride`：明確信任此外掛可為 `api.runtime.llm.complete` 請求模型覆寫。
- `plugins.entries.<id>.llm.allowedModels`：受信任外掛 LLM completion 覆寫可用的標準 `provider/model` 目標選用允許清單。只有在你有意允許任何模型時，才使用 `"*"`。
- `plugins.entries.<id>.llm.allowAgentIdOverride`：明確信任此外掛可對非預設代理 ID 執行 `api.runtime.llm.complete`。
- `plugins.entries.<id>.config`：外掛定義的設定物件（有可用的原生 OpenClaw 外掛 schema 時會進行驗證）。
- 頻道外掛帳號／執行階段設定位於 `channels.<id>` 下，且應由所屬外掛的 manifest `channelConfigs` 中繼資料描述，而不是由中央 OpenClaw 選項登錄描述。

### Codex harness 外掛設定

隨附的 `codex` 外掛擁有 `plugins.entries.codex.config` 下的原生 Codex app-server harness 設定。完整設定表面請參閱 [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)，執行階段模型請參閱 [Codex harness](/zh-TW/plugins/codex-harness)。

`codexPlugins` 只套用到選取原生 Codex harness 的工作階段。它不會為 OpenClaw provider 執行、ACP 對話繫結，或任何非 Codex harness 啟用 Codex 外掛。

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

- `plugins.entries.codex.config.codexPlugins.enabled`：為 Codex harness 啟用原生 Codex 外掛／app 支援。預設值：`false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`：已遷移外掛 app elicitations 的預設破壞性動作政策。使用 `true` 可在不提示的情況下接受安全的 Codex 核准 schema，使用 `false` 可拒絕它們，使用 `"auto"` 可透過 OpenClaw 外掛核准路由 Codex 要求的核准，或使用 `"ask"` 針對每個外掛寫入／破壞性動作提示，且不保留持久核准。`"ask"` 模式會清除受影響 app 的持久 Codex 每工具核准覆寫，並在 Codex thread 啟動前為該 app 選取人工核准 reviewer。預設值：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`：在全域 `codexPlugins.enabled` 也為 true 時，啟用已遷移的外掛項目。預設值：明確項目為 `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`：穩定的 marketplace 身分。V1 只支援 `"openai-curated"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`：來自遷移的穩定 Codex 外掛身分，例如 `"google-calendar"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`：每個外掛的破壞性動作覆寫。省略時會使用全域 `allow_destructive_actions` 值。每外掛值接受相同的 `true`、`false`、`"auto"` 或 `"ask"` 政策。

每個使用 `"ask"` 的已允許外掛 app，都會將該 app 的核准請求路由給人工 reviewer。其他 app 和非 app thread 核准會保留其已設定的 reviewer，因此混合外掛政策不會繼承 `"ask"` 行為。

`codexPlugins.enabled` 是全域啟用指令。由遷移寫入的明確外掛項目，是持久安裝和修復資格集合。不支援 `plugins["*"]`，沒有 `install` 開關，而 local `marketplacePath` 值刻意不是設定欄位，因為它們是 host 專屬的。

`app/list` 就緒檢查會快取一小時，並在過期時非同步重新整理。Codex thread app 設定是在 Codex harness 工作階段建立時運算，而不是每一輪都運算；變更原生外掛設定後，請使用 `/new`、`/reset` 或重新啟動閘道。

- `plugins.entries.firecrawl.config.webFetch`：Firecrawl web-fetch provider 設定。
  - `apiKey`：提高限制用的選用 Firecrawl API 金鑰（接受 SecretRef）。會退回使用 `plugins.entries.firecrawl.config.webSearch.apiKey`、舊版 `tools.web.fetch.firecrawl.apiKey`，或 `FIRECRAWL_API_KEY` 環境變數。
  - `baseUrl`：Firecrawl API 基礎 URL（預設值：`https://api.firecrawl.dev`；自架覆寫必須指向 private/internal endpoints）。
  - `onlyMainContent`：只從頁面擷取主要內容（預設值：`true`）。
  - `maxAgeMs`：快取最大存留時間，單位為毫秒（預設值：`172800000` / 2 天）。
  - `timeoutSeconds`：scrape 請求逾時秒數（預設值：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok web search）設定。
  - `enabled`：啟用 X Search provider。
  - `model`：搜尋使用的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：記憶夢境整理設定。階段與門檻請參閱 [夢境整理](/zh-TW/concepts/dreaming)。
  - `enabled`：主夢境整理開關（預設值 `false`）。
  - `frequency`：每次完整夢境整理掃描的排程節奏（預設為 `"0 3 * * *"`）。
  - `model`：選用 Dream Diary 子代理模型覆寫。需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`；搭配 `allowedModels` 以限制目標。模型不可用錯誤會使用工作階段預設模型重試一次；信任或允許清單失敗不會靜默退回。
  - 階段政策與門檻屬於實作細節（不是面向使用者的設定鍵）。
- 完整記憶設定位於 [記憶設定參考](/zh-TW/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已啟用的 Claude 套組外掛也可以從 `settings.json` 提供內嵌 OpenClaw 預設值；OpenClaw 會將其套用為已清理的代理設定，而不是原始 OpenClaw 設定 patch。
- `plugins.slots.memory`：選擇作用中的記憶外掛 ID，或選擇 `"none"` 以停用記憶外掛。
- `plugins.slots.contextEngine`：選擇作用中的 context engine 外掛 ID；預設為 `"legacy"`，除非你安裝並選取另一個 engine。

請參閱 [外掛](/zh-TW/tools/plugin)。

---

## 承諾

`commitments` 控制推論出的後續追蹤記憶：OpenClaw 可以從對話輪次偵測 check-in，並透過心跳偵測執行傳遞它們。

- `commitments.enabled`：為推論出的後續追蹤承諾啟用隱藏 LLM 擷取、儲存和心跳偵測傳遞。預設值：`false`。
- `commitments.maxPerDay`：每個代理工作階段在滾動一天內傳遞的推論後續追蹤承諾數量上限。預設值：`3`。

請參閱 [推論承諾](/zh-TW/concepts/commitments)。

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
- `tabCleanup` 會在閒置時間後，或工作階段超過上限時，回收已追蹤的主要代理分頁。將 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 設定為
  可停用這些個別清理模式。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` 未設定時會停用，因此瀏覽器導覽預設保持嚴格。
- 只有在你有意信任私有網路瀏覽器導覽時，才設定 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在嚴格模式中，遠端 CDP 設定檔端點（`profiles.*.cdpUrl`）在可達性/探索檢查期間也會受到相同的私有網路封鎖。
- `ssrfPolicy.allowPrivateNetwork` 仍作為舊版別名受到支援。
- 在嚴格模式中，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 來設定明確例外。
- 遠端設定檔僅能附加（已停用啟動/停止/重設）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  當你希望 OpenClaw 探索 `/json/version` 時使用 HTTP(S)；當你的供應商提供直接的 DevTools WebSocket URL 時使用 WS(S)。
- `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 會套用於遠端與
  `attachOnly` CDP 可達性，以及分頁開啟請求。受管理的 loopback
  設定檔會保留本機 CDP 預設值。
- 如果外部管理的 CDP 服務可透過 loopback 存取，請將該
  設定檔的 `attachOnly: true`；否則 OpenClaw 會將該 loopback 連接埠視為
  本機受管理的瀏覽器設定檔，並可能回報本機連接埠擁有權錯誤。
- `existing-session` 設定檔使用 Chrome MCP 而非 CDP，並可附加到
  選取的主機，或透過已連線的瀏覽器節點附加。
- `existing-session` 設定檔可設定 `userDataDir`，以鎖定特定的
  Chromium 系瀏覽器設定檔，例如 Brave 或 Edge。
- 當 Chrome 已在 DevTools HTTP(S) 探索端點或直接 WS(S) 端點後方執行時，`existing-session` 設定檔可設定 `cdpUrl`。在該
  模式中，OpenClaw 會將端點傳遞給 Chrome MCP，而不是使用自動連線；
  `userDataDir` 會被 Chrome MCP 啟動引數忽略。
- `existing-session` 設定檔保留目前的 Chrome MCP 路由限制：
  以快照/ref 驅動的動作，而非 CSS 選擇器鎖定、一檔案上傳
  hook、無對話方塊逾時覆寫、無 `wait --load networkidle`，且不支援
  `responsebody`、PDF 匯出、下載攔截或批次動作。
- 本機受管理的 `openclaw` 設定檔會自動指派 `cdpPort` 和 `cdpUrl`；只有針對遠端 CDP 設定檔或 existing-session 端點
  附加時，才明確設定 `cdpUrl`。
- 本機受管理的設定檔可設定 `executablePath`，以覆寫該設定檔的全域
  `browser.executablePath`。使用此設定可讓一個設定檔執行於
  Chrome，另一個執行於 Brave。
- 本機受管理的設定檔會在程序啟動後，使用 `browser.localLaunchTimeoutMs` 進行 Chrome CDP HTTP
  探索，並使用 `browser.localCdpReadyTimeoutMs` 進行
  啟動後 CDP websocket 就緒檢查。在 Chrome
  成功啟動但就緒檢查與啟動流程競速的較慢主機上，請提高這些值。兩個值都必須是
  最高 `120000` ms 的正整數；無效的設定值會被拒絕。
- 自動偵測順序：預設瀏覽器（若為 Chromium 系）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 都
  接受 `~` 和 `~/...`，在啟動 Chromium 前代表你的作業系統家目錄。
  `existing-session` 設定檔上的每設定檔 `userDataDir` 也會展開波浪號。
- 控制服務：僅 loopback（連接埠衍生自 `gateway.port`，預設 `18791`）。
- `extraArgs` 會將額外啟動旗標附加到本機 Chromium 啟動（例如
  `--disable-gpu`、視窗大小，或偵錯旗標）。

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
- `assistant`：Control UI 身分覆寫。退回至作用中代理身分。

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

<Accordion title="Gateway field details">

- `mode`: `local`（執行閘道）或 `remote`（連線到遠端閘道）。除非為 `local`，否則閘道會拒絕啟動。
- `port`: WS + HTTP 的單一多工連接埠。優先順序：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（預設）、`lan`（`0.0.0.0`）、`tailnet`（僅 Tailscale IP），或 `custom`。
- **舊版綁定位址別名**：請在 `gateway.bind` 使用綁定模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），而不是主機別名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事項**：預設的 `loopback` 綁定會在容器內監聽 `127.0.0.1`。使用 Docker bridge 網路（`-p 18789:18789`）時，流量會從 `eth0` 進入，因此無法連到閘道。請使用 `--network host`，或設定 `bind: "lan"`（或搭配 `customBindHost: "0.0.0.0"` 的 `bind: "custom"`）以監聽所有介面。
- **驗證**：預設為必要。非 loopback 綁定需要閘道驗證。實務上，這表示需要共用 token/密碼，或使用具身分感知能力的反向代理並設定 `gateway.auth.mode: "trusted-proxy"`。導覽精靈預設會產生 token。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`（包含 SecretRefs），請將 `gateway.auth.mode` 明確設為 `token` 或 `password`。兩者都已設定但未設定模式時，啟動與服務安裝/修復流程會失敗。
- `gateway.auth.mode: "none"`：明確的無驗證模式。僅用於受信任的 local loopback 設定；導覽提示刻意不提供此選項。
- `gateway.auth.mode: "trusted-proxy"`：將瀏覽器/使用者驗證委派給具身分感知能力的反向代理，並信任來自 `gateway.trustedProxies` 的身分標頭（請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)）。此模式預設預期代理來源為**非 loopback**；同主機 loopback 反向代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。內部同主機呼叫端可使用 `gateway.auth.password` 作為本機直接備援；`gateway.auth.token` 仍與 trusted-proxy 模式互斥。
- `gateway.auth.allowTailscale`: 當為 `true` 時，Tailscale Serve 身分標頭可滿足控制 UI/WebSocket 驗證（透過 `tailscale whois` 驗證）。HTTP API 端點**不會**使用該 Tailscale 標頭驗證；它們改為遵循閘道的一般 HTTP 驗證模式。此無 token 流程假設閘道主機是受信任的。當 `tailscale.mode = "serve"` 時預設為 `true`。
- `gateway.auth.rateLimit`: 選用的驗證失敗限制器。依用戶端 IP 與驗證範圍套用（shared-secret 與 device-token 會分開追蹤）。被封鎖的嘗試會回傳 `429` + `Retry-After`。
  - 在非同步 Tailscale Serve 控制 UI 路徑上，同一個 `{scope, clientIp}` 的失敗嘗試會在寫入失敗前序列化。因此，來自同一用戶端的並行錯誤嘗試可能會在第二個請求就觸發限制器，而不是兩者都以單純不相符的方式競速通過。
  - `gateway.auth.rateLimit.exemptLoopback` 預設為 `true`；當你刻意也要限制 localhost 流量速率時（例如測試設定或嚴格代理部署），請設為 `false`。
- 瀏覽器來源的 WS 驗證嘗試一律會被節流，並停用 loopback 豁免（作為防禦瀏覽器式 localhost 暴力破解的縱深防禦）。
- 在 loopback 上，這些瀏覽器來源鎖定會依正規化後的 `Origin`
  值隔離，因此來自某個 localhost origin 的重複失敗不會自動
  鎖定另一個 origin。
- `tailscale.mode`: `serve`（僅 tailnet、loopback 綁定）或 `funnel`（公開，需要驗證）。
- `tailscale.serviceName`: Serve 模式的選用 Tailscale 服務名稱，例如
  `svc:openclaw`。設定時，OpenClaw 會將其傳給 `tailscale serve
--service`，讓控制 UI 可透過具名服務公開，而不是透過裝置主機名稱。
  此值必須使用 Tailscale 的 `svc:<dns-label>` 服務名稱格式；啟動時會回報推導出的服務 URL。
- `tailscale.preserveFunnel`: 當為 `true` 且 `tailscale.mode = "serve"` 時，OpenClaw
  會在啟動時重新套用 Serve 前檢查 `tailscale funnel status`，若外部設定的 Funnel 路由已涵蓋閘道連接埠，則略過重新套用。
  預設為 `false`。
- `controlUi.allowedOrigins`: 閘道 WebSocket 連線的明確瀏覽器來源允許清單。公開非 loopback 瀏覽器來源需要此設定。從 loopback、RFC1918/link-local、`.local`、`.ts.net` 或 Tailscale CGNAT 主機載入的私有同源 LAN/Tailnet UI，不需啟用 Host 標頭備援即可接受。
- `controlUi.chatMessageMaxWidth`: 群組化控制 UI 聊天訊息的選用最大寬度。接受受限的 CSS 寬度值，例如 `960px`、`82%`、`min(1280px, 82%)` 與 `calc(100% - 2rem)`。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: 危險模式，會為刻意依賴 Host 標頭來源政策的部署啟用 Host 標頭來源備援。
- `terminal.enabled`: 選擇啟用管理員範圍的操作員終端機。預設：`false`。終端機會在所選 agent 工作區中啟動主機 PTY、繼承閘道程序環境，且會拒絕 `sandbox.mode: "all"` 的 agent。僅在受信任的操作員部署中啟用；變更此設定會重新啟動閘道並更新控制 UI 內容安全政策。
- `terminal.shell`: 選用的 shell 可執行檔。未設定時，OpenClaw 在 Unix 上使用 `$SHELL`，在 Windows 上使用 `%ComSpec%`。
- `terminal.detachedSessionTimeoutSeconds`: 終端機工作階段在連線中斷後（頁面重新載入、筆電睡眠）可存活多久，並可透過 `terminal.attach` 重新附加且重播近期輸出。預設：`300`。設為 `0` 可在連線中斷當下立即結束工作階段。分離工作階段會持續執行其命令，因此在共用或公開主機上請縮短此值。
- `remote.transport`: `ssh`（預設）或 `direct`（ws/wss）。對於 `direct`，公開主機的 `remote.url` 必須是 `wss://`；明文 `ws://` 僅接受 loopback、LAN、link-local、`.local`、`.ts.net` 與 Tailscale CGNAT 主機。
- `remote.remotePort`: 遠端 SSH 主機上的閘道連接埠。預設為 `18789`；當本機通道連接埠不同於遠端閘道連接埠時使用此設定。
- `remote.sshHostKeyPolicy`: macOS SSH 通道主機金鑰政策。`strict` 是預設值，並要求已有受信任金鑰。`openssh` 是明確選擇使用有效 OpenSSH 設定以支援受管理別名；使用前請檢閱相符的使用者與系統 SSH 設定。macOS app 與 `configure-remote` 在變更目標時會將此政策重設為 `strict`，除非再次明確選擇啟用。
- `gateway.remote.token` / `.password` 是遠端用戶端憑證欄位。它們本身不會設定閘道驗證。
- `gateway.push.apns.relay.baseUrl`: 外部 APNs relay 的基礎 HTTPS URL，用於 relay 支援的 iOS build 將註冊發布到閘道之後。公開 App Store build 使用託管的 OpenClaw relay。自訂 relay URL 必須對應到刻意分離的 iOS build/部署路徑，且其 relay URL 指向該 relay。
- `gateway.push.apns.relay.timeoutMs`: 閘道到 relay 的傳送逾時，單位為毫秒。預設為 `10000`。
- relay 支援的註冊會委派給特定閘道身分。配對的 iOS app 會擷取 `gateway.identity.get`，在 relay 註冊中包含該身分，並將註冊範圍的傳送授權轉交給閘道。另一個閘道無法重用該儲存註冊。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上述 relay 設定的暫時環境覆寫。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: 僅限開發使用的逃生口，用於 loopback HTTP relay URL。正式環境 relay URL 應維持使用 HTTPS。
- `gateway.handshakeTimeoutMs`: 驗證前閘道 WebSocket 握手逾時，單位為毫秒。預設：`15000`。設定時，`OPENCLAW_HANDSHAKE_TIMEOUT_MS` 具有優先權。在負載較高或低功耗主機上，若本機用戶端可連線但啟動暖機仍在穩定中，請增加此值。
- `gateway.channelHealthCheckMinutes`: channel 健康監控間隔，單位為分鐘。設為 `0` 可全域停用健康監控重啟。預設：`5`。
- `gateway.channelStaleEventThresholdMinutes`: stale-socket 閾值，單位為分鐘。請保持大於或等於 `gateway.channelHealthCheckMinutes`。預設：`30`。
- `gateway.channelMaxRestartsPerHour`: 滾動一小時內每個 channel/account 的健康監控重啟上限。預設：`10`。
- `channels.<provider>.healthMonitor.enabled`: 在保留全域監控啟用的同時，針對每個 channel 選擇退出健康監控重啟。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 多帳號 channel 的每帳號覆寫。設定時，它會優先於 channel 層級覆寫。
- 本機閘道呼叫路徑僅在 `gateway.auth.*` 未設定時，才能使用 `gateway.remote.*` 作為備援。
- 如果 `gateway.auth.token` / `gateway.auth.password` 透過 SecretRef 明確設定但無法解析，解析會 fail closed（沒有遠端備援遮蔽）。
- `trustedProxies`: 終止 TLS 或注入 forwarded-client 標頭的反向代理 IP。只列出你控制的代理。loopback 項目對同主機代理/本機偵測設定仍有效（例如 Tailscale Serve 或本機反向代理），但它們**不會**讓 loopback 請求符合 `gateway.auth.mode: "trusted-proxy"` 資格。
- `allowRealIpFallback`: 當為 `true` 時，如果缺少 `X-Forwarded-For`，閘道會接受 `X-Real-IP`。預設為 `false`，採用 fail-closed 行為。
- `gateway.nodes.pairing.autoApproveCidrs`: 選用的 CIDR/IP 允許清單，用於自動核准首次節點裝置配對，且沒有要求的範圍。未設定時停用。這不會自動核准操作員/瀏覽器/控制 UI/WebChat 配對，也不會自動核准角色、範圍、中繼資料或 public-key 升級。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: 在配對與平台允許清單評估後，對宣告的節點命令進行全域允許/拒絕塑形。使用 `allowCommands` 選擇啟用危險的節點命令，例如 `camera.snap`、`camera.clip` 與 `screen.record`；即使平台預設或明確允許原本會包含某命令，`denyCommands` 仍會移除該命令。節點變更其宣告命令清單後，請拒絕並重新核准該裝置配對，讓閘道儲存更新後的命令快照。
- `gateway.tools.deny`: 額外封鎖 HTTP `POST /tools/invoke` 的 tool 名稱（延伸預設拒絕清單）。
- `gateway.tools.allow`: 從預設 HTTP 拒絕清單中移除 tool 名稱，供
  owner/admin 呼叫端使用。這不會將帶身分的 `operator.write`
  呼叫端升級為 owner/admin 存取；即使列入允許清單，`cron`、`gateway` 與 `nodes` 仍然
  對非 owner 呼叫端不可用。

</Accordion>

### OpenAI 相容端點

- 管理員 HTTP RPC：預設以 `admin-http-rpc` 外掛形式關閉。啟用外掛以註冊 `POST /api/v1/admin/rpc`。請參閱[管理員 HTTP RPC](/zh-TW/plugins/admin-http-rpc)。
- Chat Completions：預設停用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 啟用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 輸入強化：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空的允許清單會視為未設定；使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和/或 `gateway.http.endpoints.responses.images.allowUrl=false` 以停用 URL 擷取。
- 選用的回應強化標頭：
  - `gateway.http.securityHeaders.strictTransportSecurity`（僅對你控制的 HTTPS origins 設定；請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多執行個體隔離

使用唯一的連接埠與 state dirs，在一台主機上執行多個閘道：

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

- `mode`：控制執行階段如何套用設定編輯。
  - `"off"`：忽略即時編輯；變更需要明確重新啟動。
  - `"restart"`：設定變更時一律重新啟動閘道程序。
  - `"hot"`：在程序內套用變更，不重新啟動。
  - `"hybrid"`（預設）：先嘗試熱重載；必要時退回重新啟動。
- `debounceMs`：套用設定變更前的 debounce 視窗，以毫秒為單位（非負整數；預設值：`300`）。
- `deferralTimeoutMs`：強制重新啟動或通道熱重載前，等待進行中作業的選用最長時間，以毫秒為單位。省略時使用預設有界等待（`300000`）；設為 `0` 會無限期等待，並定期記錄仍在等待的警告。

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
- `hooks.token` 應與有效的閘道 shared-secret 驗證（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）不同；啟動時若偵測到重複使用，會記錄非致命安全警告。
- `openclaw security audit` 會將鉤子/閘道驗證重複使用標示為嚴重發現，包括僅在稽核時提供的閘道密碼驗證（`--auth password --password <password>`）。執行 `openclaw doctor --fix` 以輪替持久化且重複使用的 `hooks.token`，然後更新外部鉤子傳送端以使用新的鉤子權杖。
- `hooks.path` 不能是 `/`；請使用專用子路徑，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，請限制 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果映射或預設集使用樣板化的 `sessionKey`，請設定 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。靜態映射金鑰不需要此選擇加入。

**端點：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 只有在 `hooks.allowRequestSessionKey=true` 時，才接受來自請求承載的 `sessionKey`（預設值：`false`）。
- `POST /hooks/<name>` → 透過 `hooks.mappings` 解析
  - 由樣板轉譯的映射 `sessionKey` 值會視為外部提供，也需要 `hooks.allowRequestSessionKey=true`。

<Accordion title="映射詳細資料">

- `match.path` 會比對 `/hooks` 後的子路徑（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 會比對一般路徑的承載欄位。
- 類似 `{{messages[0].subject}}` 的樣板會從承載讀取。
- `transform` 可以指向會傳回鉤子動作的 JS/TS 模組。
  - `transform.module` 必須是相對路徑，且維持在 `hooks.transformsDir` 內（絕對路徑與目錄穿越會被拒絕）。
  - 請將 `hooks.transformsDir` 保持在 `~/.openclaw/hooks/transforms` 之下；工作區 Skills 目錄會被拒絕。如果 `openclaw doctor` 回報此路徑無效，請將轉換模組移到鉤子轉換目錄，或移除 `hooks.transformsDir`。
- `agentId` 會路由到特定代理；未知 ID 會退回預設代理。
- `allowedAgentIds`：限制有效代理路由，包括省略 `agentId` 時的預設代理路徑（`*` 或省略 = 全部允許，`[]` = 全部拒絕）。
- `defaultSessionKey`：沒有明確 `sessionKey` 的鉤子代理執行所用的選用固定工作階段金鑰。
- `allowRequestSessionKey`：允許 `/hooks/agent` 呼叫端和樣板驅動的映射工作階段金鑰設定 `sessionKey`（預設值：`false`）。
- `allowedSessionKeyPrefixes`：明確 `sessionKey` 值（請求 + 映射）的選用前綴允許清單，例如 `["hook:"]`。當任何映射或預設集使用樣板化 `sessionKey` 時，這會成為必要項目。
- `deliver: true` 會將最終回覆傳送到通道；`channel` 預設為 `last`。
- `model` 會覆寫此鉤子執行使用的 LLM（如果已設定模型目錄，則必須被允許）。

</Accordion>

### Gmail 整合

- 內建 Gmail 預設集使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果保留該逐訊息路由，請設定 `hooks.allowRequestSessionKey: true`，並限制 `hooks.allowedSessionKeyPrefixes` 以符合 Gmail 命名空間，例如 `["hook:", "hook:gmail:"]`。
- 如果需要 `hooks.allowRequestSessionKey: false`，請用靜態 `sessionKey` 覆寫預設集，而不是使用樣板化預設值。

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

- 在閘道連接埠下，透過 HTTP 提供代理可編輯的 HTML/CSS/JS 與 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 僅限本機：保持 `gateway.bind: "loopback"`（預設）。
- 非 loopback 綁定：canvas 路由需要閘道驗證（權杖/密碼/trusted-proxy），與其他閘道 HTTP 介面相同。
- 節點 WebViews 通常不會傳送驗證標頭；節點配對並連線後，閘道會公告節點範圍的 capability URLs，以供 canvas/A2UI 存取。
- Capability URLs 會繫結至作用中的節點 WS 工作階段，並很快過期。不使用以 IP 為基礎的備援。
- 將 live-reload 用戶端注入提供的 HTML。
- 空白時自動建立入門 `index.html`。
- 也會在 `/__openclaw__/a2ui/` 提供 A2UI。
- 變更需要重新啟動閘道。
- 大型目錄或 `EMFILE` 錯誤時，請停用 live reload。

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

- `minimal`（預設）：從 TXT 記錄省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`；LAN 多播公告仍需要啟用內建的 `bonjour` 外掛。
- `off`：在不變更外掛啟用狀態的情況下，抑制 LAN 多播公告。
- 內建的 `bonjour` 外掛會在 macOS 主機上自動啟動，在 Linux、Windows 和容器化閘道部署上則需選擇加入。
- 當系統主機名稱是有效的 DNS 標籤時，主機名稱預設為系統主機名稱，否則退回為 `openclaw`。可用 `OPENCLAW_MDNS_HOSTNAME` 覆寫。
- `OPENCLAW_DISABLE_BONJOUR=1` 會直接停用 mDNS 公告，並覆寫 `discovery.mdns.mode`。

### 廣域（DNS-SD）

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

- 只比對大寫名稱：`[A-Z_][A-Z0-9_]*`。
- 缺少或空白變數會在載入設定時擲出錯誤。
- 使用 `$${VAR}` 跳脫為字面 `${VAR}`。
- 可搭配 `$include` 使用。

---

## 秘密

秘密參照是附加式的：純文字值仍可使用。

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
- `secrets apply` 以支援的 `openclaw.json` 憑證路徑為目標。
- `auth-profiles.json` 參照包含在執行階段解析和稽核涵蓋範圍內。

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

- `file` 提供者支援 `mode: "json"` 與 `mode: "singleValue"`（在 singleValue 模式中，`id` 必須是 `"value"`）。
- 當 Windows ACL 驗證無法使用時，檔案與 exec 提供者路徑會以失敗關閉。只有在無法驗證的受信任路徑上，才設定 `allowInsecurePath: true`。
- `exec` 提供者需要絕對 `command` 路徑，並在 stdin/stdout 上使用通訊協定酬載。
- 預設會拒絕符號連結命令路徑。設定 `allowSymlinkCommand: true` 可允許符號連結路徑，同時驗證解析後的目標路徑。
- 如果已設定 `trustedDirs`，受信任目錄檢查會套用到解析後的目標路徑。
- `exec` 子環境預設為最小環境；請使用 `passEnv` 明確傳入必要變數。
- Secret ref 會在啟用時解析成記憶體內快照，之後請求路徑只會讀取該快照。
- 啟用期間會套用作用中表面篩選：已啟用表面上的未解析 ref 會導致啟動/重新載入失敗，而非作用中表面會略過並產生診斷。

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
- `auth-profiles.json` 支援靜態認證模式的值層級 ref（`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- 舊版扁平 `auth-profiles.json` 對應（例如 `{ "provider": { "apiKey": "..." } }`）不是執行階段格式；`openclaw doctor --fix` 會將其重寫為標準 `provider:default` API 金鑰設定檔，並建立 `.legacy-flat.*.bak` 備份。
- OAuth 模式設定檔（`auth.profiles.<id>.mode = "oauth"`）不支援以 SecretRef 作為後端的驗證設定檔認證。
- 靜態執行階段認證來自記憶體內解析快照；發現舊版靜態 `auth.json` 項目時會將其清除。
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

- `billingBackoffHours`：當設定檔因真正的帳單/餘額不足錯誤而失敗時，以小時為單位的基礎退避（預設：`5`）。明確的帳單文字即使出現在 `401`/`403` 回應中，仍可能歸到這裡，但提供者特定的文字比對器會維持在其所屬提供者的範圍內（例如 OpenRouter `Key limit exceeded`）。可重試的 HTTP `402` 使用量視窗或組織/工作區支出限制訊息，則會留在 `rate_limit` 路徑中。
- `billingBackoffHoursByProvider`：選用的每提供者帳單退避小時覆寫。
- `billingMaxHours`：帳單退避指數成長的小時上限（預設：`24`）。
- `authPermanentBackoffMinutes`：高信心 `auth_permanent` 失敗的分鐘基礎退避（預設：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避成長的分鐘上限（預設：`60`）。
- `failureWindowHours`：退避計數器使用的滾動視窗小時數（預設：`24`）。
- `overloadedProfileRotations`：在切換到模型備援之前，過載錯誤可執行的同提供者驗證設定檔輪替上限（預設：`1`）。如 `ModelNotReadyException` 這類提供者忙碌形態會歸到這裡。
- `overloadedBackoffMs`：重試過載提供者/設定檔輪替之前的固定延遲（預設：`0`）。
- `rateLimitedProfileRotations`：在切換到模型備援之前，速率限制錯誤可執行的同提供者驗證設定檔輪替上限（預設：`1`）。該速率限制桶包含提供者形態的文字，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 與 `resource exhausted`。

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
- `maxFileBytes`：輪替前作用中記錄檔的最大位元組大小（正整數；預設：`104857600` = 100 MB）。OpenClaw 會在作用中檔案旁保留最多五個編號封存檔。
- `redactSensitive` / `redactPatterns`：對主控台輸出、檔案記錄、OTLP 記錄項目，以及持久化工作階段轉錄文字進行盡力遮蔽。`redactSensitive: "off"` 只會停用這個一般記錄/轉錄政策；UI/工具/診斷安全表面在送出前仍會遮蔽 Secrets。

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

- `enabled`：檢測輸出的主要切換（預設：`true`）。
- `flags`：啟用目標記錄輸出的旗標字串陣列（支援像 `"telegram.*"` 或 `"*"` 這樣的萬用字元）。
- `stuckSessionWarnMs`：用於將長時間執行中的處理工作階段分類為 `session.long_running`、`session.stalled` 或 `session.stuck` 的無進度時間門檻，單位為毫秒（預設：`120000`）。回覆、工具、狀態、區塊與 ACP 進度會重設計時器；重複的 `session.stuck` 診斷在未變更時會退避。
- `stuckSessionAbortMs`：符合資格的停滯中作用中工作可為了復原而中止排空前的無進度時間門檻，單位為毫秒。未設定時，OpenClaw 會使用較安全的延長內嵌執行視窗，至少為 5 分鐘且為 `stuckSessionWarnMs` 的 3 倍。
- `memoryPressureSnapshot`：當記憶體壓力達到 `critical` 時，擷取已遮蔽的 OOM 前穩定性快照（預設：`false`）。設為 `true` 可在保留一般記憶體壓力事件的同時，加入穩定性套件檔案掃描/寫入。
- `otel.enabled`：啟用 OpenTelemetry 匯出管線（預設：`false`）。完整設定、訊號目錄與隱私模型，請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)。
- `otel.endpoint`：OTel 匯出的收集器 URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`：選用的訊號特定 OTLP 端點。設定後，只會覆寫該訊號的 `otel.endpoint`。
- `otel.protocol`：`"http/protobuf"`（預設）或 `"grpc"`。
- `otel.headers`：隨 OTel 匯出請求送出的額外 HTTP/gRPC 中繼資料標頭。
- `otel.serviceName`：資源屬性的服務名稱。
- `otel.traces` / `otel.metrics` / `otel.logs`：啟用追蹤、指標或記錄匯出。
- `otel.logsExporter`：記錄匯出接收端：`"otlp"`（預設）、`"stdout"`（每個 stdout 行一個 JSON 物件）或 `"both"`。
- `otel.sampleRate`：追蹤取樣率 `0`-`1`。
- `otel.flushIntervalMs`：定期遙測排清間隔，單位為毫秒。
- `otel.captureContent`：選用的 OTEL span 屬性原始內容擷取。預設為關閉。布林值 `true` 會擷取非系統訊息/工具內容；物件形式可讓你明確啟用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt` 與 `toolDefinitions`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`：最新實驗性 GenAI 推論 span 形態的環境切換，包含 `{gen_ai.operation.name} {gen_ai.request.model}` span 名稱、`CLIENT` span 類型，以及使用 `gen_ai.provider.name` 取代舊版 `gen_ai.system`。預設 span 會保留 `openclaw.model.call` 與 `gen_ai.system` 以維持相容性；GenAI 指標使用有界語意屬性。
- `OPENCLAW_OTEL_PRELOADED=1`：已註冊全域 OpenTelemetry SDK 的主機所用的環境切換。OpenClaw 之後會略過外掛擁有的 SDK 啟動/關閉，同時保持診斷監聽器作用中。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 與 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`：當相符設定鍵未設定時使用的訊號特定端點環境變數。
- `cacheTrace.enabled`：記錄內嵌執行的快取追蹤快照（預設：`false`）。
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

- `channel`：發布通道 - `"stable"`、`"extended-stable"`、`"beta"` 或 `"dev"`。Extended-stable 是僅套件、前景/隨需通道；啟動檢查與背景自動更新會略過它。
- `checkOnStart`：閘道啟動時檢查 npm 更新（預設：`true`）。
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

- `enabled`：全域 ACP 功能閘門（預設：`true`；設為 `false` 可隱藏 ACP 分派與產生 affordance）。
- `dispatch.enabled`：ACP 工作階段回合分派的獨立閘門（預設：`true`）。設為 `false` 可在保留 ACP 命令可用的同時阻止執行。
- `backend`：預設 ACP 執行階段後端 ID（必須符合已註冊的 ACP 執行階段外掛）。
  請先安裝後端外掛；如果已設定 `plugins.allow`，請納入後端外掛 ID（例如 `acpx`），否則 ACP 後端不會載入。
- `fallbacks`：依序嘗試的備援 ACP 後端 ID 清單；當主要後端在產生任何輸出之前，提早因看似暫時性的錯誤（不可用、受到速率限制、配額用盡或過載）失敗時使用。每個項目都必須符合已註冊的 ACP 執行階段外掛後端。
- `defaultAgent`：當產生未指定明確目標時使用的備援 ACP 目標代理 ID。
- `allowedAgents`：允許用於 ACP 執行階段工作階段的代理 ID 允許清單；空白表示沒有額外限制。
- `maxConcurrentSessions`：同時作用中的 ACP 工作階段數上限。
- `stream.coalesceIdleMs`：串流文字的閒置清空視窗，單位為毫秒。
- `stream.maxChunkChars`：分割串流區塊投影前的最大區塊大小。
- `stream.repeatSuppression`：每回合抑制重複的狀態/工具行（預設：`true`）。
- `stream.deliveryMode`：`"live"` 會逐步串流；`"final_only"` 會緩衝到回合終止事件。
- `stream.hiddenBoundarySeparator`：隱藏工具事件後、可見文字前的分隔符（預設：`"paragraph"`）。
- `stream.maxOutputChars`：每個 ACP 回合投影的助理輸出字元上限。
- `stream.maxSessionUpdateChars`：投影 ACP 狀態/更新行的字元上限。
- `stream.tagVisibility`：標籤名稱到串流事件布林可見性覆寫的記錄。
- `runtime.ttlMinutes`：ACP 工作階段工作程序符合清理資格前的閒置 TTL，單位為分鐘。
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
  - `"random"`（預設）：輪換有趣/季節性標語。
  - `"default"`：固定的中性標語（`All your chats, one OpenClaw.`）。
  - `"off"`：沒有標語文字（仍會顯示橫幅標題/版本）。
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

## Bridge（舊版，已移除）

目前建置版本不再包含 TCP bridge。節點透過閘道 WebSocket 連線。`bridge.*` 鍵不再屬於設定結構描述（驗證會失敗，直到移除為止；`openclaw doctor --fix` 可移除未知鍵）。

<Accordion title="舊版 bridge 設定（歷史參考）">

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

- `sessionRetention`：從 `sessions.json` 修剪已完成的隔離排程執行工作階段前，要保留多久。也控制已封存、已刪除排程文字記錄的清理。預設：`24h`；設為 `false` 可停用。
- `runLog.maxBytes`：為了與較舊的檔案式排程執行日誌相容而接受。預設：`2_000_000` 位元組。
- `runLog.keepLines`：每個工作的最新 SQLite 執行歷史列保留數。預設：`2000`。
- `webhookToken`：排程網路鉤子 POST 傳遞（`delivery.mode = "webhook"`）使用的 bearer token；若省略，則不會傳送 auth 標頭。
- `webhook`：已棄用的舊版備援網路鉤子 URL（http/https），由 `openclaw doctor --fix` 用來遷移仍具有 `notify: true` 的已儲存工作；執行階段傳遞使用每個工作的 `delivery.mode="webhook"` 加上 `delivery.to`，或在保留 announce 傳遞時使用 `delivery.completionDestination`。

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
- `retryOn`：觸發重試的錯誤類型 - `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略時會重試所有暫時性類型。

一次性工作會保持啟用，直到重試嘗試耗盡，接著停用並保留最終錯誤狀態。週期性工作使用相同的暫時性重試政策，在下一個排程時段前，於退避後再次執行；永久錯誤或耗盡的暫時性重試會回退到一般週期性排程並套用錯誤退避。

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
- `includeSkipped`：將連續略過的執行計入警示門檻（預設：`false`）。略過的執行會分開追蹤，且不會影響執行錯誤退避。
- `mode`：傳遞模式 - `"announce"` 會透過頻道訊息傳送；`"webhook"` 會張貼到已設定的網路鉤子。
- `accountId`：用來限定警示傳遞範圍的選用帳戶或頻道 ID。

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
- `channel`：announce 傳遞的頻道覆寫。`"last"` 會重用最後已知的傳遞頻道。
- `to`：明確的 announce 目標或網路鉤子 URL。網路鉤子模式需要此項。
- `accountId`：傳遞的選用帳戶覆寫。
- 每個工作的 `delivery.failureDestination` 會覆寫這個全域預設。
- 當全域與每個工作的失敗目的地皆未設定時，已透過 `announce` 傳遞的工作會在失敗時回退到該主要 announce 目標。
- `delivery.failureDestination` 只支援 `sessionTarget="isolated"` 工作，除非該工作的主要 `delivery.mode` 為 `"webhook"`。

請參閱 [排程工作](/zh-TW/automation/cron-jobs)。隔離的排程執行會作為 [背景工作](/zh-TW/automation/tasks) 追蹤。

---

## 媒體模型範本變數

在 `tools.media.models[].args` 中展開的範本預留位置：

| 變數               | 說明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完整傳入訊息本文                                  |
| `{{RawBody}}`      | 原始本文（沒有歷史/寄件者包裝）                   |
| `{{BodyStripped}}` | 移除群組提及的本文                                |
| `{{From}}`         | 寄件者識別碼                                      |
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
| `{{GroupSubject}}` | 群組主旨（盡力而為）                              |
| `{{GroupMembers}}` | 群組成員預覽（盡力而為）                          |
| `{{SenderName}}`   | 寄件者顯示名稱（盡力而為）                        |
| `{{SenderE164}}`   | 寄件者電話號碼（盡力而為）                        |
| `{{Provider}}`     | Provider 提示（whatsapp、telegram、discord 等）   |

---

## 設定包含（`$include`）

將設定分割成多個檔案：

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
- 同層鍵：在 include 之後合併（覆寫已包含的值）。
- 巢狀 include：最多 10 層深。
- 路徑：相對於執行包含的檔案解析，但必須留在頂層設定目錄內（`openclaw.json` 的 `dirname`）。只有當絕對/`../` 形式仍解析在該邊界內時才允許。設定 `OPENCLAW_INCLUDE_ROOTS`（絕對路徑）可允許設定目錄外的其他根目錄。
- 限制：路徑不得包含 null 位元組，且在解析前後都必須嚴格短於 4096 個字元；每個被包含檔案上限為 2 MB。
- OpenClaw 擁有的寫入若只變更由單一檔案 include 支援的一個頂層區段，會透寫到該被包含檔案。例如，`plugins install` 會在 `plugins.json5` 中更新 `plugins: { $include: "./plugins.json5" }`，並保持 `openclaw.json` 不變。
- 根 include、include 陣列，以及具有同層覆寫的 include 對 OpenClaw 擁有的寫入為唯讀；這些寫入會失敗關閉，而不是將設定扁平化。
- 錯誤：針對遺失檔案、剖析錯誤、循環 include、無效路徑格式和過長長度提供清楚訊息。

---

## 相關

- [設定](/zh-TW/gateway/configuration)
- [設定範例](/zh-TW/gateway/configuration-examples)
- [Doctor](/zh-TW/gateway/doctor)
