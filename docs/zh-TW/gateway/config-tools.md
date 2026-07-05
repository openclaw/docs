---
read_when:
    - 設定 `tools.*` 政策、允許清單或實驗性功能
    - 註冊自訂供應商或覆寫基礎 URL
    - 設定 OpenAI 相容的自架端點
sidebarTitle: Tools and custom providers
summary: 工具設定（政策、實驗性切換、由提供者支援的工具）與自訂提供者/base-URL 設定
title: 設定 — 工具與自訂提供者
x-i18n:
    generated_at: "2026-07-05T11:17:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5205ff85e78d2eaa8f4eeced902e86383b9f92d8d1762b64d54f1e10c9bc379b
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` 設定鍵與自訂供應商 / base-URL 設定。關於代理、頻道與其他頂層設定鍵，請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## 工具

### 工具設定檔

`tools.profile` 會先設定基礎允許清單，再套用 `tools.allow`/`tools.deny`：

<Note>
本機入門流程會在未設定時，將新的本機設定預設為 `tools.profile: "coding"`（既有的明確設定檔會保留）。
</Note>

| 設定檔 | 包含 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` | 僅 `session_status` |
| `coding` | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status` |
| `full` | 無限制（與未設定相同） |

`coding` 和 `messaging` 也會隱含允許 `bundle-mcp`（已設定的 MCP 伺服器）。

### 工具群組

| 群組 | 工具 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime` | `exec`, `process`, `code_execution`（`bash` 會被接受為 `exec` 的別名） |
| `group:fs` | `read`, `write`, `edit`, `apply_patch` |
| `group:sessions` | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory` | `memory_search`, `memory_get` |
| `group:web` | `web_search`, `x_search`, `web_fetch` |
| `group:ui` | `browser`, `canvas` |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway` |
| `group:messaging` | `message` |
| `group:nodes` | `nodes` |
| `group:agents` | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop` |
| `group:media` | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` |
| `group:openclaw` | 上方所有內建工具，但不含 `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas`（不包含外掛工具） |
| `group:plugins` | 已載入外掛擁有的工具，包括透過 `bundle-mcp` 暴露的已設定 MCP 伺服器 |

### 沙箱工具政策內的 MCP 與外掛工具

已設定的 MCP 伺服器會以 `bundle-mcp` 外掛 id 底下的外掛自有工具形式暴露。一般工具設定檔可以允許它們，但 `tools.sandbox.tools` 是沙箱工作階段的額外關卡。如果沙箱模式是 `"all"` 或 `"non-main"`，當 MCP/外掛工具應可見時，請在沙箱工具允許清單中包含以下其中一個項目：

- `bundle-mcp`，用於來自 `mcp.servers`、由 OpenClaw 管理的 MCP 伺服器
- 特定原生外掛的外掛 id
- `group:plugins`，用於所有已載入、外掛擁有的工具
- 精確的 MCP 伺服器工具名稱或伺服器 glob，例如 `outlook__send_mail` 或 `outlook__*`，當你只想要一個伺服器時

伺服器 glob 使用供應商安全的 MCP 伺服器前綴，不一定是原始 `mcp.servers` 鍵。非 `[A-Za-z0-9_-]` 字元會變成 `-`，不是以字母開頭的名稱會加上 `mcp-` 前綴，過長或重複的前綴可能會被截斷或加上後綴；例如，`mcp.servers["Outlook Graph"]` 會使用像 `outlook-graph__*` 這樣的 glob。

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

沒有該沙箱層級項目時，MCP 伺服器仍可成功載入，但其工具會在供應商請求前被篩除。使用 `openclaw doctor` 可抓出 `mcp.servers` 中由 OpenClaw 管理伺服器的這種形狀。從 bundled 外掛資訊清單或 Claude `.mcp.json` 載入的 MCP 伺服器也使用相同的沙箱關卡，但此診斷尚未列舉這些來源；如果它們的工具在沙箱回合中消失，請使用相同的允許清單項目。

### `tools.codeMode`

`tools.codeMode` 會啟用通用的 OpenClaw 程式碼模式介面。針對啟用工具的執行啟用時，模型只會看到 `exec` 和 `wait`；一般 OpenClaw 工具會移到沙箱內的 `tools.*` 目錄橋接後方，而 MCP 工具可透過產生的 `MCP` 命名空間使用。

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

也接受簡寫：

```json5
{
  tools: { codeMode: true },
}
```

在程式碼模式中，MCP 宣告會透過唯讀的虛擬 API 檔案介面暴露。Guest 程式碼可以呼叫 `API.list("mcp")` 和 `API.read("mcp/<server>.d.ts")`，以便在呼叫 `MCP.<server>.<tool>()` 前檢查 TypeScript 風格的簽名。請參閱[程式碼模式](/zh-TW/reference/code-mode)以了解執行階段合約、限制與偵錯步驟。

### `tools.allow` / `tools.deny`

全域工具允許/拒絕政策（拒絕優先）。不區分大小寫，支援 `*` 萬用字元。即使 Docker 沙箱關閉也會套用。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` 和 `apply_patch` 是不同的工具 ID。`allow: ["write"]` 也會為相容模型啟用 `apply_patch`，但 `deny: ["write"]` 不會停用 `apply_patch`。若要封鎖所有檔案變更，請停用 `group:fs`，或明確列出每個會變更檔案的工具：

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` 和 `alsoAllow` 不能在同一個範圍（`tools`、`tools.byProvider.<id>`、`agents.list[].tools`）同時設定 — 設定驗證會拒絕。請將 `alsoAllow` 項目合併到 `allow`，或移除 `allow` 並改用 `profile` + `alsoAllow`。
</Note>

### `tools.byProvider`

進一步限制特定提供者或模型的工具。順序：基礎設定檔 → 提供者設定檔 → 允許/拒絕。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

限制特定請求者身分可用的工具。這是在頻道存取控制之上的縱深防禦；傳送者值必須來自頻道配接器，而不是訊息文字。

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

鍵使用明確前綴：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`，或 `"*"`。頻道 ID 是 OpenClaw 的標準 ID；`teams` 等別名會正規化為 `msteams`。舊版無前綴鍵只會被接受為 `id:`。比對順序為 channel+id、id、e164、username、name，最後是萬用字元。

每代理的 `agents.list[].tools.toolsBySender` 在符合時會覆寫全域傳送者比對，即使政策是空的 `{}`。

### `tools.elevated`

控制沙箱外的提升權限 `exec` 存取：

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- 每代理覆寫（`agents.list[].tools.elevated`）只能進一步限制。
- `/elevated on|off|ask|full` 會按工作階段儲存狀態；行內指令只套用到單一訊息。
- 提升權限的 `exec` 會繞過沙箱，並使用設定的逃逸路徑（預設為 `gateway`，或在 exec 目標是 `node` 時使用 `node`）。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

顯示的值皆為預設值，除了 `applyPatch.allowModels`（預設為空/未設定，表示任何相容模型都可以使用 `apply_patch`）。`approvalRunningNoticeMs` 會在以核准支援的 exec 執行過久時發出執行中通知；`0` 會停用它。

### `tools.loopDetection`

工具迴圈安全檢查**預設停用**。設定 `enabled: true` 可啟用偵測。設定可在全域 `tools.loopDetection` 中定義，並可在每代理的 `agents.list[].tools.loopDetection` 覆寫。

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  保留用於迴圈分析的最大工具呼叫歷史記錄。
</ParamField>
<ParamField path="warningThreshold" type="number">
  重複無進展模式的警告門檻。
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  在這麼多次未命中後，封鎖對同一個不可用/未知工具名稱的重複呼叫。
</ParamField>
<ParamField path="criticalThreshold" type="number">
  用於封鎖嚴重迴圈的較高重複門檻。
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  任何無進展執行的硬停止門檻。
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  對重複的相同工具/相同引數呼叫發出警告。
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  對已知輪詢工具（`process.poll`、`command_status` 等）發出警告/封鎖。
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  對交替的無進展配對模式發出警告/封鎖。
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  自動壓縮後防護保持啟用的嘗試次數；如果代理在該視窗內重複相同的（工具、引數、結果），則中止。
</ParamField>

<Warning>
如果 `warningThreshold >= criticalThreshold` 或 `criticalThreshold >= globalCircuitBreakerThreshold`，驗證會失敗。
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env (Brave provider)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

除了 `provider` 和 `userAgent` 以外，顯示的值都是預設值。`maxResponseBytes` 會限制在 32000–10000000；`maxChars` 會限制為 `maxCharsCap`（提高 `maxCharsCap` 可允許更大的回應）。

### `tools.media`

設定傳入媒體理解（圖片/音訊/影片）：

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

`concurrency`（預設 `2`）、`audio.maxBytes`（預設 20 MB）和 `video.maxBytes`（預設 50 MB）顯示為其預設值；`image.maxBytes` 預設為 10 MB。各功能的請求逾時預設值：圖片/音訊為 `60` 秒，影片為 `120` 秒。

<AccordionGroup>
  <Accordion title="Media model entry fields">
    **供應商項目**（`type: "provider"` 或省略）：

    - `provider`：API 供應商 ID（`openai`、`anthropic`、`google`/`gemini`、`groq` 等）
    - `model`：模型 ID 覆寫
    - `profile` / `preferredProfile`：`auth-profiles.json` 設定檔選擇

    **命令列介面項目**（`type: "cli"`）：

    - `command`：要執行的可執行檔
    - `args`：樣板化引數（支援 `{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` 等；`openclaw doctor --fix` 會將已棄用的 `{input}` 預留位置遷移到 `{{MediaPath}}`）

    **通用欄位：**

    - `capabilities`：選用清單（`image`、`audio`、`video`）。每個供應商外掛會宣告自己的預設功能集；例如，內建的 `openai` 供應商預設為圖片+音訊，`anthropic`/`minimax` 為圖片，`google` 為圖片+音訊+影片，`groq` 為音訊。
    - `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：每個項目的覆寫。
    - 當 agent 呼叫明確的 `image` 工具時，`tools.media.image.timeoutSeconds` 以及相符圖片模型的 `timeoutSeconds` 項目也會套用。對於圖片理解，此逾時套用於請求本身，不會因較早的準備工作而縮短。
    - 失敗時會退回到下一個項目。

    供應商驗證遵循標準順序：`auth-profiles.json` → 環境變數 → `models.providers.*.apiKey`。

    **非同步完成欄位：**

    - `asyncCompletion.directSend`：已棄用的相容性旗標。已完成的非同步媒體工作仍由請求者工作階段中介，因此 agent 會收到結果、決定如何告知使用者，並在來源傳遞需要時使用訊息工具。

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

控制哪些工作階段可由工作階段工具（`sessions_list`、`sessions_history`、`sessions_send`）指定為目標。

預設：`tree`（目前工作階段 + 由其產生的工作階段，例如子 agent）。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Visibility scopes">
    - `self`：僅目前工作階段金鑰。
    - `tree`：目前工作階段 + 由目前工作階段產生的工作階段（子 agent）。
    - `agent`：屬於目前 agent ID 的任何工作階段（如果你在同一個 agent ID 下執行依寄件者區分的工作階段，可能包含其他使用者）。
    - `all`：任何工作階段。跨 agent 指定目標仍需要 `tools.agentToAgent`。
    - 沙盒限制：當目前工作階段已沙盒化，且 `agents.defaults.sandbox.sessionToolsVisibility="spawned"`（預設值）時，即使 `tools.sessions.visibility="all"`，可見性也會強制為 `tree`。
    - 當不是 `all` 時，`sessions_list` 會包含精簡的 `visibility` 欄位，
      描述有效模式，並警告部分工作階段可能會在目前範圍之外被
      省略。

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

控制 `sessions_spawn` 的內嵌附件支援。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Attachment notes">
    - 附件需要 `enabled: true`。
    - 子 agent 附件會具體化到子工作區的 `.openclaw/attachments/<uuid>/`，並包含 `.manifest.json`。
    - ACP 附件僅限圖片，並在通過相同的檔案數量、單檔位元組與總位元組限制後，內嵌轉送到 ACP 執行階段。
    - 附件內容會自動從轉錄持久化中修訂移除。
    - Base64 輸入會透過嚴格的字母表/填充檢查與解碼前大小防護進行驗證。
    - 子 agent 附件的檔案權限為目錄 `0700`、檔案 `0600`。
    - 子 agent 清理會遵循 `cleanup` 政策：`delete` 一律移除附件；`keep` 只會在 `retainOnSessionKeep: true` 時保留附件。

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

實驗性內建工具旗標。預設關閉，除非套用 strict-agentic GPT-5 自動啟用規則。

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`：為非瑣碎的多步驟工作追蹤啟用結構化 `update_plan` 工具。
- 預設：`false`，除非 `agents.defaults.embeddedAgent.executionContract`（或每個 agent 的覆寫）對使用 `openai` 供應商、針對 GPT-5 系列模型 ID 的執行設為 `"strict-agentic"`（這也涵蓋 OpenAI Codex 命令列介面執行，因為 Codex 驗證/模型路由位於 `openai` 供應商之下）。設為 `true` 可在該範圍外強制啟用工具，或設為 `false` 可即使對 strict-agentic GPT-5 執行也保持關閉。
- 啟用時，系統提示也會加入使用指引，讓模型只在實質工作中使用，且最多只保留一個步驟為 `in_progress`。

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`：產生的子 agent 的預設模型。如果省略，子 agent 會繼承呼叫者的模型。
- `allowAgents`：當請求者 agent 未設定自己的 `subagents.allowAgents` 時，`sessions_spawn` 可用之已設定目標 agent ID 的預設允許清單（`["*"]` = 任何已設定目標；預設：僅同一個 agent）。其 agent 設定已刪除的過期項目會被 `sessions_spawn` 拒絕，並從 `agents_list` 省略；執行 `openclaw doctor --fix` 可清理它們。
- `maxConcurrent`：最大並行子 agent 執行數。預設：`8`。
- `runTimeoutSeconds`：當呼叫者未傳入自己的覆寫時，`sessions_spawn` 的逾時（秒）。預設：`0`（無逾時）；上方顯示的 `900` 是常見的選用值，不是內建預設值。
- `announceTimeoutMs`：閘道 `agent` 宣告傳遞嘗試的每次呼叫逾時（毫秒）。預設：`120000`。暫時性重試可能讓總宣告等待時間長於一個已設定逾時。
- `archiveAfterMinutes`：子 agent 工作階段完成後到自動封存前的分鐘數。預設：`60`；`0` 會停用自動封存。
- 每個子 agent 工具政策：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## 自訂供應商和基底 URL

供應商外掛會發布自己的模型目錄列。透過設定中的 `models.providers` 或 `~/.openclaw/agents/<agentId>/agent/models.json` 新增自訂供應商。

設定自訂/本機供應商 `baseUrl` 也是模型 HTTP 請求的狹義網路信任決策：OpenClaw 會透過受保護的 fetch 路徑允許該確切的 `scheme://host:port` 來源，而不新增個別設定選項或信任其他私有來源。

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | etc.
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Auth and merge precedence">
    - 對自訂驗證需求使用 `authHeader: true` + `headers`。
    - 使用 `OPENCLAW_AGENT_DIR` 覆寫 agent 設定根目錄。
    - 相符供應商 ID 的合併優先順序：
      - 非空的 agent `models.json` `baseUrl` 值優先。
      - 非空的 agent `apiKey` 值僅在該供應商於目前設定/驗證設定檔情境中未由 SecretRef 管理時優先。
      - SecretRef 管理的供應商 `apiKey` 值會從來源標記（環境參照為 `ENV_VAR_NAME`，檔案/exec 參照為 `secretref-managed`）重新整理，而不是持久化已解析的祕密。
      - SecretRef 管理的供應商標頭值會從來源標記（環境參照為 `secretref-env:ENV_VAR_NAME`，檔案/exec 參照為 `secretref-managed`）重新整理。
      - 空白或缺少的 agent `apiKey`/`baseUrl` 會退回到設定中的 `models.providers`。
      - 相符模型的 `contextWindow`/`maxTokens`：當明確設定值存在且有效（正有限數）時，明確設定值優先；否則使用隱含/產生的目錄值。
      - 相符模型的 `contextTokens` 遵循相同的明確值優先、否則隱含值規則；可用於限制有效上下文，而不變更原生模型中繼資料。
      - 供應商外掛目錄會以產生的外掛擁有目錄分片形式，儲存在 agent 的外掛狀態下。
      - 當你想讓設定完整重寫 `models.json`，並略過合併外掛擁有目錄分片時，請使用 `models.mode: "replace"`。
      - 標記持久化以來源為準：標記會從作用中來源設定快照（解析前）寫入，而不是從已解析的執行階段祕密值寫入。

  </Accordion>
</AccordionGroup>

### 供應商欄位詳細資料

<AccordionGroup>
  <Accordion title="頂層目錄">
    - `models.mode`: 提供者目錄行為（`merge` 或 `replace`）。
    - `models.providers`: 依提供者 ID 鍵控的自訂提供者對應。
      - 安全編輯：若要進行增量更新，請使用 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 或 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge`。除非你傳入 `--replace`，否則 `config set` 會拒絕破壞性取代。

  </Accordion>
  <Accordion title="提供者連線與驗證">
    - `models.providers.*.api`: 請求配接器（`openai-completions`、`openai-responses`、`openai-chatgpt-responses`、`anthropic-messages`、`google-generative-ai`、`google-vertex`、`github-copilot`、`bedrock-converse-stream`、`ollama`、`azure-openai-responses`）。對於自架的 `/v1/chat/completions` 後端，例如 MLX、vLLM、SGLang，以及多數與 OpenAI 相容的本機伺服器，請使用 `openai-completions`。具有 `baseUrl` 但沒有 `api` 的自訂提供者預設為 `openai-completions`；只有在後端支援 `/v1/responses` 時才設定 `openai-responses`。
    - `models.providers.*.apiKey`: 提供者憑證（建議使用 SecretRef/env 替換）。
    - `models.providers.*.auth`: 驗證策略（`api-key`、`token`、`oauth`、`aws-sdk`）。
    - `models.providers.*.contextWindow`: 當模型項目未設定 `contextWindow` 時，此提供者下模型的預設原生脈絡視窗。
    - `models.providers.*.contextTokens`: 當模型項目未設定 `contextTokens` 時，此提供者下模型的預設有效執行階段脈絡上限。
    - `models.providers.*.maxTokens`: 當模型項目未設定 `maxTokens` 時，此提供者下模型的預設輸出權杖上限。
    - `models.providers.*.timeoutSeconds`: 選用的每提供者模型 HTTP 請求逾時秒數，包含連線、標頭、本文，以及整體請求中止處理。
    - `models.providers.*.injectNumCtxForOpenAICompat`: 對 Ollama + `openai-completions`，將 `options.num_ctx` 注入請求（預設：`true`）。
    - `models.providers.*.authHeader`: 在必要時強制透過 `Authorization` 標頭傳輸憑證。
    - `models.providers.*.baseUrl`: 上游 API 基底 URL。
    - `models.providers.*.headers`: 用於代理/租戶路由的額外靜態標頭。

  </Accordion>
  <Accordion title="請求傳輸覆寫">
    `models.providers.*.request`: 模型提供者 HTTP 請求的傳輸覆寫。

    - `request.headers`: 額外標頭（與提供者預設值合併）。值接受 SecretRef。
    - `request.auth`: 驗證策略覆寫。模式：`"provider-default"`（使用提供者內建驗證）、`"authorization-bearer"`（搭配 `token`）、`"header"`（搭配 `headerName`、`value`、選用的 `prefix`）。
    - `request.proxy`: HTTP 代理覆寫。模式：`"env-proxy"`（使用 `HTTP_PROXY`/`HTTPS_PROXY` 環境變數）、`"explicit-proxy"`（搭配 `url`）。兩種模式都接受選用的 `tls` 子物件。
    - `request.tls`: 直接連線的 TLS 覆寫。欄位：`ca`、`cert`、`key`、`passphrase`（全部接受 SecretRef）、`serverName`、`insecureSkipVerify`。
    - `request.allowPrivateNetwork`: 當為 `true` 時，允許模型提供者 HTTP 請求透過提供者 HTTP 擷取防護存取私人、CGNAT 或類似範圍。自訂/本機提供者基底 URL 已信任精確設定的來源，但中繼資料/link-local 來源除外，這些來源在未明確選擇加入時仍會被封鎖。將此設定為 `false` 可選擇退出精確來源信任。WebSocket 會使用相同的 `request` 來處理標頭/TLS，但不使用該擷取 SSRF 閘門。預設為 `false`。

  </Accordion>
  <Accordion title="模型目錄項目">
    - `models.providers.*.models`: 明確的提供者模型目錄項目。
    - `models.providers.*.models.*.input`: 模型輸入模態。文字限定模型請使用 `["text"]`，原生圖片/視覺模型請使用 `["text", "image"]`。只有在所選模型標記為具備圖片能力時，圖片附件才會注入代理回合。
    - `models.providers.*.models.*.contextWindow`: 原生模型脈絡視窗中繼資料。這會覆寫該模型的提供者層級 `contextWindow`。
    - `models.providers.*.models.*.contextTokens`: 選用的執行階段脈絡上限。這會覆寫提供者層級的 `contextTokens`；當你想要比模型原生 `contextWindow` 更小的有效脈絡預算時使用；當兩個值不同時，`openclaw models list` 會顯示兩者。
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: 選用的相容性提示。對於具有非空、非原生 `baseUrl`（主機不是 `api.openai.com`）的 `api: "openai-completions"`，OpenClaw 會在執行階段強制將此設為 `false`。空白/省略的 `baseUrl` 會保留預設 OpenAI 行為。
    - `models.providers.*.models.*.compat.requiresStringContent`: 字串限定、與 OpenAI 相容的聊天端點的選用相容性提示。當為 `true` 時，OpenClaw 會在傳送請求前，將純文字 `messages[].content` 陣列壓平成一般字串。
    - `models.providers.*.models.*.compat.strictMessageKeys`: 嚴格、與 OpenAI 相容的聊天端點的選用相容性提示。當為 `true` 時，OpenClaw 會在傳送請求前，將傳出的 Chat Completions 訊息物件剝除到只剩 `role` 和 `content`。
    - `models.providers.*.models.*.compat.thinkingFormat`: 選用的思考酬載提示。對 Together 風格的 `reasoning.enabled` 使用 `"together"`，對頂層 `enable_thinking` 使用 `"qwen"`，或對支援請求層級 chat-template kwargs 的 Qwen 系列、與 OpenAI 相容伺服器（例如 vLLM）上的 `chat_template_kwargs.enable_thinking` 使用 `"qwen-chat-template"`。已設定的 vLLM Qwen 模型會針對這些格式公開二元 `/think` 選項（`off`、`on`）。
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: DeepSeek 風格 Chat Completions 後端的選用相容性提示，這類後端要求先前的 assistant 訊息在重放時保留 `reasoning_content`。當為 `true` 時，OpenClaw 會在傳出的 assistant 訊息上保留該欄位。當你串接自訂、與 DeepSeek 相容且會拒絕剝除推理後請求的代理時使用此項。預設為 `false`。

  </Accordion>
  <Accordion title="Amazon Bedrock 探索">
    - `plugins.entries.amazon-bedrock.config.discovery`: Bedrock 自動探索設定根。
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: 開啟/關閉隱式探索。
    - `plugins.entries.amazon-bedrock.config.discovery.region`: 用於探索的 AWS 區域。
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: 用於目標探索的選用提供者 ID 篩選器。
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: 探索重新整理的輪詢間隔。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: 已探索模型的備援脈絡視窗。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: 已探索模型的備援最大輸出權杖數。

  </Accordion>
</AccordionGroup>

互動式自訂提供者上手流程會針對已知視覺模型 ID 模式推斷圖片輸入，包括 GPT-4o/GPT-4.1/GPT-5+、`o1`/`o3`/`o4` 推理系列、Claude、Gemini、任何以 `-vl` 結尾的 ID（Qwen-VL 與類似模型），以及具名系列，例如 LLaVA、Pixtral、InternVL、Mllama、MiniCPM-V 和 GLM-4V；對已知文字限定系列（Llama、DeepSeek、Mistral/Mixtral、Kimi/Moonshot、Codestral、Devstral、Phi、QwQ、CodeLlama，以及沒有 vl/vision 後綴的裸 Qwen ID）則會跳過額外問題。未知模型 ID 仍會提示是否支援圖片。非互動式上手流程使用相同推斷；傳入 `--custom-image-input` 可強制使用具備圖片能力的中繼資料，或傳入 `--custom-text-input` 可強制使用文字限定中繼資料。

### 提供者範例

<AccordionGroup>
  <Accordion title="Cerebras（GLM 4.7 / GPT OSS）">
    官方外部 `cerebras` 提供者外掛可透過 `openclaw onboard --auth-choice cerebras-api-key` 設定此項。只有在覆寫預設值時才使用明確的提供者設定。

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Cerebras 請使用 `cerebras/zai-glm-4.7`；Z.AI 直連請使用 `zai/glm-4.7`。

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    與 Anthropic 相容的內建提供者。捷徑：`openclaw onboard --auth-choice kimi-code-api-key`。

  </Accordion>
  <Accordion title="本機模型（LM Studio）">
    請參閱[本機模型](/zh-TW/gateway/local-models)。簡而言之：在強大的硬體上透過 LM Studio Responses API 執行大型本機模型；保留合併的託管模型作為備援。
  </Accordion>
  <Accordion title="MiniMax M3（直連）">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    設定 `MINIMAX_API_KEY`。捷徑：`openclaw onboard --auth-choice minimax-global-api` 或 `openclaw onboard --auth-choice minimax-cn-api`。模型目錄預設為 M3，並且也包含 M2.7 變體。在與 Anthropic 相容的串流路徑上，OpenClaw 預設會停用 MiniMax M2.x 思考，除非你明確自行設定 `thinking`；MiniMax-M3（以及 M3.x）預設會保留提供者省略/自適應思考路徑。`/fast on` 或 `params.fastMode: true` 會將 `MiniMax-M2.7` 重寫為 `MiniMax-M2.7-highspeed`。

  </Accordion>
  <Accordion title="Moonshot AI（Kimi）">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    針對中國端點：`baseUrl: "https://api.moonshot.cn/v1"` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`。

    原生 Moonshot 端點會在共用的 `openai-completions` 傳輸上宣告串流用量相容性，而 OpenClaw 會根據端點能力判斷，不只依賴內建提供者 ID。

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    設定 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）。Zen 目錄請使用 `opencode/...` 參照，Go 目錄請使用 `opencode-go/...` 參照。捷徑：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`。

  </Accordion>
  <Accordion title="Synthetic（Anthropic 相容）">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    基礎 URL 應省略 `/v1`（Anthropic 用戶端會附加它）。捷徑：`openclaw onboard --auth-choice synthetic-api-key`。

  </Accordion>
  <Accordion title="Z.AI（GLM-4.7）">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    設定 `ZAI_API_KEY`。模型參照使用標準的 `zai/*` 提供者 ID。捷徑：`openclaw onboard --auth-choice zai-api-key`。

    - 一般端點：`https://api.z.ai/api/paas/v4`
    - 程式碼端點：`https://api.z.ai/api/coding/paas/v4`
    - 預設的 `zai-api-key` 驗證選項會探測你的金鑰，並自動偵測它屬於哪個端點（如果偵測結果不明確，則退回提示，預設為 Global）。也提供專用的 CN 與 Coding-Plan 驗證選項，可供明確選擇。
    - 對於一般端點，請定義帶有基礎 URL 覆寫的自訂提供者。

  </Accordion>
</AccordionGroup>

---

## 相關

- [設定 — 代理](/zh-TW/gateway/config-agents)
- [設定 — 頻道](/zh-TW/gateway/config-channels)
- [設定參考](/zh-TW/gateway/configuration-reference) — 其他頂層鍵
- [工具和外掛](/zh-TW/tools)
