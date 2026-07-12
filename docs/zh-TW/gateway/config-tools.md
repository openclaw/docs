---
read_when:
    - 設定 `tools.*` 政策、允許清單或實驗性功能
    - 註冊自訂供應商或覆寫基礎 URL
    - 設定 OpenAI 相容的自架端點
sidebarTitle: Tools and custom providers
summary: 工具設定（政策、實驗性開關、供應商支援的工具）與自訂供應商／基礎 URL 設定
title: 設定 — 工具與自訂提供者
x-i18n:
    generated_at: "2026-07-12T14:29:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` 設定鍵與自訂供應商／基礎 URL 設定。如需代理程式、頻道與其他頂層設定鍵的資訊，請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## 工具

### 工具設定檔

`tools.profile` 會在套用 `tools.allow`/`tools.deny` 前設定基礎允許清單：

<Note>
本機初始設定會在未設定時，將新的本機設定預設為 `tools.profile: "coding"`（現有明確指定的設定檔會予以保留）。
</Note>

| 設定檔      | 包含                                                                                                                                                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | 僅限 `session_status`                                                                                                                                                                                                        |
| `coding`    | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`get_goal`、`create_goal`、`update_goal`、`update_plan`、`skill_workshop`、`image`、`image_generate`、`music_generate`、`video_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                                                                                                                                    |
| `full`      | 無限制（與未設定相同）                                                                                                                                                                                                       |

`coding` 與 `messaging` 也會隱含允許 `bundle-mcp`（已設定的 MCP 伺服器）。

### 工具群組

| 群組               | 工具                                                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`、`process`、`code_execution`（接受 `bash` 作為 `exec` 的別名）                                                                                 |
| `group:fs`         | `read`、`write`、`edit`、`apply_patch`                                                                                                                |
| `group:sessions`   | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status`、`spawn_task`、`dismiss_task` |
| `group:memory`     | `memory_search`、`memory_get`                                                                                                                         |
| `group:web`        | `web_search`、`x_search`、`web_fetch`                                                                                                                 |
| `group:ui`         | `browser`、`canvas`                                                                                                                                   |
| `group:automation` | `heartbeat_respond`、`cron`、`gateway`                                                                                                                |
| `group:messaging`  | `message`                                                                                                                                             |
| `group:nodes`      | `nodes`、`computer`                                                                                                                                   |
| `group:agents`     | `agents_list`、`get_goal`、`create_goal`、`update_goal`、`update_plan`、`skill_workshop`                                                              |
| `group:media`      | `image`、`image_generate`、`music_generate`、`video_generate`、`tts`                                                                                  |
| `group:openclaw`   | 上述所有內建工具，但不包括 `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas`（不含外掛工具）                                              |
| `group:plugins`    | 由已載入外掛擁有的工具，包括透過 `bundle-mcp` 公開的已設定 MCP 伺服器                                                                                |

`spawn_task` 可讓程式開發代理程式提出經確認的後續工作，而不立即開始執行。Control UI 會將標題與摘要顯示為可操作的方塊；由閘道支援的終端介面則會顯示功能相同的互動式提示。接受任一提示都會建立新的受管理工作樹工作階段，並將完整提示傳送至該處，同時目前回合會繼續執行。`dismiss_task` 會使用 `spawn_task` 傳回的暫時性 `task_id`，撤回仍在等待中的建議。

只有在發起操作的介面可接收並處理閘道工作建議事件時，才會提供這些工具。頻道工作階段及本機／嵌入式終端介面工作階段不會收到這些事件；頻道傳輸必須先具備可攜式的型別化工作動作，才能安全地公開此流程。建議僅存在於程序本機，並會在閘道重新啟動時消失。這兩項工具仍包含在 `coding` 設定檔與 `group:sessions` 中，因此當介面支援時，一般的 `tools.allow` 與 `tools.deny` 政策會自動設定它們。

### 沙箱工具政策中的 MCP 與外掛工具

已設定的 MCP 伺服器會以 `bundle-mcp` 外掛 ID 下由外掛擁有的工具形式公開。一般工具設定檔可以允許這些工具，但 `tools.sandbox.tools` 是沙箱工作階段的額外關卡。如果沙箱模式為 `"all"` 或 `"non-main"`，當 MCP／外掛工具應可見時，請在沙箱工具允許清單中加入下列其中一個項目：

- `bundle-mcp`：用於來自 `mcp.servers`、由 OpenClaw 管理的 MCP 伺服器
- 特定原生外掛的外掛 ID
- `group:plugins`：用於所有已載入且由外掛擁有的工具
- 當你只想要某一個伺服器時，可使用確切的 MCP 伺服器工具名稱或伺服器萬用模式，例如 `outlook__send_mail` 或 `outlook__*`

伺服器萬用模式使用供應商安全的 MCP 伺服器前綴，不一定是原始的 `mcp.servers` 鍵。非 `[A-Za-z0-9_-]` 字元會變成 `-`，不是以字母開頭的名稱會加上 `mcp-` 前綴，而過長或重複的前綴可能會被截短或加上後綴；例如，`mcp.servers["Outlook Graph"]` 會使用類似 `outlook-graph__*` 的萬用模式。

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

若缺少該沙箱層項目，MCP 伺服器仍可成功載入，但其工具會在供應商請求前遭到篩除。使用 `openclaw doctor` 可偵測 `mcp.servers` 中由 OpenClaw 管理之伺服器的這種設定結構。從隨附外掛資訊清單或 Claude `.mcp.json` 載入的 MCP 伺服器也使用相同的沙箱關卡，但此診斷目前尚未列舉這些來源；如果其工具在沙箱回合中消失，請使用相同的允許清單項目。

### `tools.codeMode`

`tools.codeMode` 會啟用通用 OpenClaw 程式碼模式介面。針對啟用工具的執行，啟用後，一般 OpenClaw 工具會移至沙箱內的 `tools.*` 目錄橋接器後方，而 MCP 工具則可透過產生的 `MCP` 命名空間使用。模型通常會看到 `exec` 與 `wait`；像 `computer` 這類結構化結果無法通過僅限 JSON 的橋接器之工具，則會維持直接提供。

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

也接受簡寫形式：

```json5
{
  tools: { codeMode: true },
}
```

在程式碼模式中，MCP 宣告會透過唯讀虛擬 API 檔案介面公開。訪客程式碼可呼叫 `API.list("mcp")` 與 `API.read("mcp/<server>.d.ts")`，在呼叫 `MCP.<server>.<tool>()` 前檢查 TypeScript 風格的簽章。如需執行階段合約、限制與偵錯步驟，請參閱[程式碼模式](/zh-TW/reference/code-mode)。

### `tools.allow` / `tools.deny`

全域工具允許／拒絕政策（拒絕優先）。不區分大小寫，支援 `*` 萬用字元。即使 Docker 沙箱已關閉，仍會套用此政策。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` 和 `apply_patch` 是不同的工具 ID。`allow: ["write"]` 也會為相容的模型啟用 `apply_patch`，但 `deny: ["write"]` 不會拒絕 `apply_patch`。若要封鎖所有檔案變更，請拒絕 `group:fs`，或明確列出每個會進行變更的工具：

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
同一個範圍（`tools`、`tools.byProvider.<id>`、`agents.list[].tools`）中不能同時設定 `allow` 和 `alsoAllow`，否則設定驗證會拒絕該設定。請將 `alsoAllow` 項目合併至 `allow`，或移除 `allow`，改用 `profile` + `alsoAllow`。
</Note>

### `tools.byProvider`

進一步限制特定供應商或模型可使用的工具。套用順序：基礎設定檔 → 供應商設定檔 → 允許／拒絕。

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

限制特定請求者身分可使用的工具。這是在頻道存取控制之上的縱深防禦；傳送者值必須來自頻道介接器，而不是訊息文字。

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

鍵使用明確的前綴：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 或 `"*"`。頻道 ID 是 OpenClaw 的標準 ID；`teams` 等別名會正規化為 `msteams`。未加前綴的舊版鍵僅會視為 `id:` 接受。比對順序依序為頻道加 ID、ID、e164、使用者名稱、顯示名稱，最後是萬用字元。

當個別代理程式的 `agents.list[].tools.toolsBySender` 相符時，會覆寫全域的傳送者比對，即使其政策為空的 `{}` 也一樣。

### `tools.elevated`

控制沙箱外的提升權限 exec 存取：

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

- 個別代理程式覆寫（`agents.list[].tools.elevated`）只能進一步限制。
- `/elevated on|off|ask|full` 會依工作階段儲存狀態；行內指令僅套用於單一訊息。
- 提升權限的 `exec` 會略過沙箱機制，並使用已設定的逸出路徑（預設為 `gateway`；當 exec 目標為 `node` 時則使用 `node`）。

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
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

顯示的值皆為預設值，但 `applyPatch.allowModels` 除外（預設為空或未設定，表示任何相容的模型都可以使用 `apply_patch`）。當由核准支援的 exec 執行時間較長時，`approvalRunningNoticeMs` 會發出執行中通知；設為 `0` 可停用此通知。

### `tools.loopDetection`

工具迴圈安全檢查**預設為停用**。設定 `enabled: true` 即可啟用偵測。設定可在 `tools.loopDetection` 中進行全域定義，並可由個別代理程式的 `agents.list[].tools.loopDetection` 覆寫。

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
  為迴圈分析保留的工具呼叫歷程記錄上限。
</ParamField>
<ParamField path="warningThreshold" type="number">
  發出警告的重複無進展模式門檻。
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  對同一個無法使用或未知的工具名稱呼叫失敗達此次數後，封鎖後續的重複呼叫。
</ParamField>
<ParamField path="criticalThreshold" type="number">
  用於封鎖嚴重迴圈的較高重複門檻。
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  任何無進展執行的強制停止門檻。
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  對使用相同工具及相同引數的重複呼叫發出警告。
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  對已知的輪詢工具（`process.poll`、`command_status` 等）發出警告或進行封鎖。
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  對交替出現的無進展成對模式發出警告或進行封鎖。
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  自動壓縮後防護機制保持啟用的嘗試次數；如果代理在此視窗內重複相同的（工具、引數、結果），便會中止。
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
        apiKey: "brave_api_key", // 或 BRAVE_API_KEY 環境變數（Brave 提供者）
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // 選用；省略即可自動偵測
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

除了 `provider` 和 `userAgent` 之外，顯示的值皆為預設值。`maxResponseBytes` 會限制在 32000–10000000；`maxChars` 會限制在 `maxCharsCap`（提高 `maxCharsCap` 可允許更大的回應）。

### `tools.media`

設定傳入媒體的理解功能（圖片／音訊／影片）：

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // 已淘汰：完成結果仍由代理轉介
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

`concurrency`（預設為 `2`）、`audio.maxBytes`（預設為 20 MB）和 `video.maxBytes`（預設為 50 MB）均顯示其預設值；`image.maxBytes` 預設為 10 MB。各功能的請求逾時預設值：圖片／音訊為 `60` 秒，影片為 `120` 秒。

<AccordionGroup>
  <Accordion title="媒體模型項目欄位">
    **提供者項目**（`type: "provider"` 或省略）：

    - `provider`：API 提供者 ID（`openai`、`anthropic`、`google`/`gemini`、`groq` 等）
    - `model`：模型 ID 覆寫值
    - `profile` / `preferredProfile`：選取 `auth-profiles.json` 設定檔

    **命令列介面項目**（`type: "cli"`）：

    - `command`：要執行的可執行檔
    - `args`：樣板化引數（支援 `{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` 等；`openclaw doctor --fix` 會將已淘汰的 `{input}` 預留位置遷移至 `{{MediaPath}}`）

    **通用欄位：**

    - `capabilities`：選用清單（`image`、`audio`、`video`）。每個提供者外掛會宣告自己的預設功能集合；例如，隨附的 `openai` 提供者預設支援圖片和音訊，`anthropic`/`minimax` 預設支援圖片，`google` 預設支援圖片、音訊和影片，而 `groq` 預設支援音訊。
    - `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：各項目的覆寫值。
    - 當代理明確呼叫 `image` 工具時，`tools.media.image.timeoutSeconds` 及相符圖片模型項目中的 `timeoutSeconds` 也會套用。對於圖片理解，此逾時套用於請求本身，不會因先前的準備工作而縮短。
    - 失敗時會回退至下一個項目。

    提供者驗證會依照標準順序進行：`auth-profiles.json` → 環境變數 → `models.providers.*.apiKey`。

    **非同步完成欄位：**

    - `asyncCompletion.directSend`：已淘汰的相容性旗標。完成的非同步媒體工作仍會透過請求者的工作階段轉介，讓代理接收結果、決定如何告知使用者，並在來源傳遞要求使用訊息工具時使用該工具。

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

控制工作階段工具（`sessions_list`、`sessions_history`、`sessions_send`）可將哪些工作階段設為目標。

預設值：`tree`（目前工作階段 + 由其衍生的工作階段，例如子代理）。

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
  <Accordion title="可見性範圍">
    - `self`：僅限目前的工作階段金鑰。
    - `tree`：目前工作階段 + 由目前工作階段衍生的工作階段（子代理）。
    - `agent`：屬於目前代理 ID 的任何工作階段（如果你在同一代理 ID 下按傳送者執行工作階段，可能包含其他使用者）。
    - `all`：任何工作階段。跨代理指定目標仍需要 `tools.agentToAgent`。
    - 沙箱限制：當目前工作階段位於沙箱中，且 `agents.defaults.sandbox.sessionToolsVisibility="spawned"`（預設值）時，即使 `tools.sessions.visibility="all"`，可見性仍會強制設為 `tree`。
    - 當值不是 `all` 時，`sessions_list` 會包含精簡的 `visibility` 欄位，
      說明實際生效的模式，並警告目前範圍之外的部分工作階段可能會
      被省略。

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

控制 `sessions_spawn` 的內嵌附件支援。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // 選擇啟用：設為 true 以允許內嵌檔案附件
        maxTotalBytes: 5242880, // 所有檔案合計 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 每個檔案 1 MB
        retainOnSessionKeep: false, // 當 cleanup="keep" 時保留附件
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="附件注意事項">
    - 附件需要設定 `enabled: true`。
    - 子代理附件會具體化至子工作區的 `.openclaw/attachments/<uuid>/`，並附有 `.manifest.json`。
    - ACP 附件僅限圖片，並在通過相同的檔案數量、單檔位元組及總位元組限制後，以內嵌方式轉送至 ACP 執行階段。
    - 附件內容會自動從對話記錄持久化資料中遮蔽。
    - Base64 輸入會透過嚴格的字母表／填補檢查及解碼前大小防護進行驗證。
    - 子代理附件的檔案權限為：目錄 `0700`，檔案 `0600`。
    - 子代理清理會遵循 `cleanup` 政策：`delete` 一律移除附件；僅當 `retainOnSessionKeep: true` 時，`keep` 才會保留附件。

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

實驗性內建工具旗標。除非套用嚴格代理型 GPT-5 自動啟用規則，否則預設為關閉。

```json5
{
  tools: {
    experimental: {
      planTool: true, // 啟用實驗性的 update_plan
    },
  },
}
```

- `planTool`：啟用結構化的 `update_plan` 工具，以追蹤非簡單的多步驟工作。
- 預設值：`false`，但如果針對使用 `openai` 提供者及 GPT-5 系列模型 ID 的執行，將 `agents.defaults.embeddedAgent.executionContract`（或各代理覆寫值）設為 `"strict-agentic"`，則不在此限（這也涵蓋 OpenAI Codex 命令列介面執行，因為 Codex 驗證／模型路由位於 `openai` 提供者之下）。設為 `true` 可強制在該範圍外啟用工具；設為 `false` 則即使是嚴格代理型 GPT-5 執行也維持關閉。
- 啟用後，系統提示也會加入使用指引，使模型僅在實質工作中使用此工具，並且最多只讓一個步驟處於 `in_progress` 狀態。

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

- `model`：衍生子代理的預設模型。如果省略，子代理會繼承呼叫者的模型。
- `allowAgents`：當請求代理未設定自己的 `subagents.allowAgents` 時，`sessions_spawn` 所使用的已設定目標代理 ID 預設允許清單（`["*"]` = 任何已設定的目標；預設：僅限同一代理）。已刪除代理設定的過期項目會遭 `sessions_spawn` 拒絕，並從 `agents_list` 中省略；請執行 `openclaw doctor --fix` 進行清理。
- `maxConcurrent`：子代理同時執行數上限。預設值：`8`。
- `runTimeoutSeconds`：呼叫者未傳入自己的覆寫值時，`sessions_spawn` 的逾時時間（秒）。預設值：`0`（無逾時）；上方顯示的 `900` 是常見的選擇啟用值，並非內建預設值。
- `announceTimeoutMs`：閘道 `agent` 宣告傳遞嘗試的單次呼叫逾時時間（毫秒）。預設值：`120000`。暫時性重試可能使宣告的總等待時間超過單次設定的逾時時間。
- `archiveAfterMinutes`：子代理工作階段完成後，經過多少分鐘自動封存。預設值：`60`；`0` 會停用自動封存。
- 各子代理工具政策：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## 自訂提供者與基底 URL

提供者外掛會發佈自己的模型目錄資料列。請透過設定中的 `models.providers` 或 `~/.openclaw/agents/<agentId>/agent/models.json` 新增自訂提供者。

設定自訂／本機提供者的 `baseUrl`，同時也是針對模型 HTTP 請求的狹義網路信任決策：OpenClaw 允許該確切的 `scheme://host:port` 來源通過受防護的擷取路徑，而不會新增個別的設定選項或信任其他私人來源。

```json5
{
  models: {
    mode: "merge", // merge（預設）| replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | 等
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
  <Accordion title="驗證與合併優先順序">
    - 如有自訂驗證需求，請使用 `authHeader: true` + `headers`。
    - 使用 `OPENCLAW_AGENT_DIR` 覆寫代理程式設定根目錄。
    - 相符供應商 ID 的合併優先順序：
      - 非空白的代理程式 `models.json` `baseUrl` 值優先。
      - 僅當該供應商在目前設定／驗證設定檔情境中並非由 SecretRef 管理時，非空白的代理程式 `apiKey` 值才會優先。
      - 由 SecretRef 管理的供應商 `apiKey` 值會從來源標記重新整理（環境變數參照使用 `ENV_VAR_NAME`，檔案／執行參照使用 `secretref-managed`），而非持久儲存已解析的密鑰。
      - 由 SecretRef 管理的供應商標頭值會從來源標記重新整理（環境變數參照使用 `secretref-env:ENV_VAR_NAME`，檔案／執行參照使用 `secretref-managed`）。
      - 空白或缺少的代理程式 `apiKey`／`baseUrl` 會退回使用設定中的 `models.providers`。
      - 相符模型的 `contextWindow`／`maxTokens`：若明確設定值存在且有效（正的有限數字），則以該值優先；否則使用隱含／產生的目錄值。
      - 相符模型的 `contextTokens` 遵循相同的「明確值優先，否則使用隱含值」規則；可用它限制有效情境，而不變更原生模型中繼資料。
      - 供應商外掛目錄會以產生的外掛自有目錄分片，儲存在代理程式的外掛狀態下。
      - 若要讓設定完全重寫 `models.json` 並略過合併外掛自有目錄分片，請使用 `models.mode: "replace"`。
      - 標記的持久儲存以來源為準：標記是從作用中的來源設定快照（解析前）寫入，而非從已解析的執行階段密鑰值寫入。

  </Accordion>
</AccordionGroup>

### 供應商欄位詳細資料

<AccordionGroup>
  <Accordion title="頂層目錄">
    - `models.mode`：供應商目錄行為（`merge` 或 `replace`）。
    - `models.providers`：以供應商 ID 為鍵的自訂供應商對應表。
      - 安全編輯：若要進行附加式更新，請使用 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 或 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge`。除非傳入 `--replace`，否則 `config set` 會拒絕破壞性取代。

  </Accordion>
  <Accordion title="供應商連線與驗證">
    - `models.providers.*.api`：要求介接器（`openai-completions`、`openai-responses`、`openai-chatgpt-responses`、`anthropic-messages`、`google-generative-ai`、`google-vertex`、`github-copilot`、`bedrock-converse-stream`、`ollama`、`azure-openai-responses`）。對於 MLX、vLLM、SGLang 及大多數 OpenAI 相容本機伺服器等自行託管的 `/v1/chat/completions` 後端，請使用 `openai-completions`。具有 `baseUrl` 但沒有 `api` 的自訂供應商預設使用 `openai-completions`；只有在後端支援 `/v1/responses` 時才設定 `openai-responses`。
    - `models.providers.*.apiKey`：供應商認證資訊（建議使用 SecretRef／環境變數替代）。
    - `models.providers.*.auth`：驗證策略（`api-key`、`token`、`oauth`、`aws-sdk`）。
    - `models.providers.*.contextWindow`：當此供應商下的模型項目未設定 `contextWindow` 時，模型的預設原生情境視窗。
    - `models.providers.*.contextTokens`：當此供應商下的模型項目未設定 `contextTokens` 時，預設的有效執行階段情境上限。
    - `models.providers.*.maxTokens`：當此供應商下的模型項目未設定 `maxTokens` 時，預設的輸出權杖上限。
    - `models.providers.*.timeoutSeconds`：選用的每供應商模型 HTTP 要求逾時秒數，包括連線、標頭、本文及整體要求中止處理。
    - `models.providers.*.injectNumCtxForOpenAICompat`：針對 Ollama + `openai-completions`，將 `options.num_ctx` 注入要求中（預設：`true`）。
    - `models.providers.*.authHeader`：必要時強制透過 `Authorization` 標頭傳輸認證資訊。
    - `models.providers.*.baseUrl`：上游 API 基底 URL。
    - `models.providers.*.headers`：用於代理伺服器／租戶路由的額外靜態標頭。

  </Accordion>
  <Accordion title="要求傳輸覆寫">
    `models.providers.*.request`：模型供應商 HTTP 要求的傳輸覆寫。

    - `request.headers`：額外標頭（與供應商預設值合併）。值可接受 SecretRef。
    - `request.auth`：驗證策略覆寫。模式：`"provider-default"`（使用供應商的內建驗證）、`"authorization-bearer"`（搭配 `token`）、`"header"`（搭配 `headerName`、`value`，以及選用的 `prefix`）。
    - `request.proxy`：HTTP 代理伺服器覆寫。模式：`"env-proxy"`（使用 `HTTP_PROXY`／`HTTPS_PROXY` 環境變數）、`"explicit-proxy"`（搭配 `url`）。兩種模式都可接受選用的 `tls` 子物件。
    - `request.tls`：直接連線的 TLS 覆寫。欄位：`ca`、`cert`、`key`、`passphrase`（均可接受 SecretRef）、`serverName`、`insecureSkipVerify`。
    - `request.allowPrivateNetwork`：設為 `true` 時，允許模型供應商 HTTP 要求透過供應商 HTTP 擷取防護存取私有、CGNAT 或類似範圍。自訂／本機供應商基底 URL 已信任明確設定的來源，但中繼資料／鏈路本機來源除外；若未明確選擇加入，這些來源仍會遭封鎖。將此值設為 `false` 可選擇退出明確來源信任。WebSocket 會使用相同的 `request` 來處理標頭／TLS，但不使用該擷取 SSRF 閘門。預設為 `false`。

  </Accordion>
  <Accordion title="模型目錄項目">
    - `models.providers.*.models`：明確的供應商模型目錄項目。
    - `models.providers.*.models.*.input`：模型輸入模態。純文字模型使用 `["text"]`，原生圖片／視覺模型使用 `["text", "image"]`。只有在所選模型標示為具備圖片處理能力時，圖片附件才會注入代理程式回合。
    - `models.providers.*.models.*.contextWindow`：原生模型情境視窗中繼資料。這會覆寫該模型的供應商層級 `contextWindow`。
    - `models.providers.*.models.*.contextTokens`：選用的執行階段情境上限。這會覆寫供應商層級的 `contextTokens`；若你希望有效情境預算小於模型的原生 `contextWindow`，請使用此欄位；當兩個值不同時，`openclaw models list` 會同時顯示兩者。
    - `models.providers.*.models.*.compat.supportsDeveloperRole`：選用的相容性提示。對於具有非空白且非原生 `baseUrl`（主機不是 `api.openai.com`）的 `api: "openai-completions"`，OpenClaw 會在執行階段強制將此值設為 `false`。空白／省略的 `baseUrl` 會保留預設 OpenAI 行為。
    - `models.providers.*.models.*.compat.requiresStringContent`：適用於僅接受字串之 OpenAI 相容聊天端點的選用相容性提示。設為 `true` 時，OpenClaw 會在傳送要求前，將純文字 `messages[].content` 陣列攤平成純字串。
    - `models.providers.*.models.*.compat.strictMessageKeys`：適用於嚴格 OpenAI 相容聊天端點的選用相容性提示。設為 `true` 時，OpenClaw 會在傳送要求前，將傳出的 Chat Completions 訊息物件縮減為 `role` 和 `content`。
    - `models.providers.*.models.*.compat.thinkingFormat`：選用的思考承載資料提示。Together 風格的 `reasoning.enabled` 使用 `"together"`，頂層 `enable_thinking` 使用 `"qwen"`；對於支援要求層級聊天範本關鍵字引數的 Qwen 系列 OpenAI 相容伺服器（例如 vLLM），其 `chat_template_kwargs.enable_thinking` 使用 `"qwen-chat-template"`。針對這些格式，已設定的 vLLM Qwen 模型會提供二元 `/think` 選項（`off`、`on`）。
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`：適用於 DeepSeek 風格 Chat Completions 後端的選用相容性提示；這類後端要求先前的助理訊息在重播時保留 `reasoning_content`。設為 `true` 時，OpenClaw 會在傳出的助理訊息上保留該欄位。連接自訂的 DeepSeek 相容代理伺服器，而其會拒絕移除推理內容後的要求時，請使用此設定。預設為 `false`。

  </Accordion>
  <Accordion title="Amazon Bedrock 探索">
    - `plugins.entries.amazon-bedrock.config.discovery`：Bedrock 自動探索設定根目錄。
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`：開啟／關閉隱含探索。
    - `plugins.entries.amazon-bedrock.config.discovery.region`：用於探索的 AWS 區域。
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`：用於定向探索的選用供應商 ID 篩選器。
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`：探索重新整理的輪詢間隔。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`：已探索模型的備用情境視窗。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`：已探索模型的備用最大輸出權杖數。

  </Accordion>
</AccordionGroup>

互動式自訂供應商上線設定會根據已知的視覺模型 ID 模式推斷圖片輸入能力，包括 GPT-4o／GPT-4.1／GPT-5+、`o1`／`o3`／`o4` 推理系列、Claude、Gemini、任何以 `-vl` 結尾的 ID（Qwen-VL 及類似模型），以及 LLaVA、Pixtral、InternVL、Mllama、MiniCPM-V 和 GLM-4V 等具名系列；對於已知的純文字系列（Llama、DeepSeek、Mistral／Mixtral、Kimi／Moonshot、Codestral、Devstral、Phi、QwQ、CodeLlama，以及不含 vl／vision 後綴的單純 Qwen ID），則會略過額外問題。未知模型 ID 仍會詢問是否支援圖片。非互動式上線設定使用相同的推斷方式；傳入 `--custom-image-input` 可強制使用具備圖片處理能力的中繼資料，傳入 `--custom-text-input` 則可強制使用純文字中繼資料。

### 供應商範例

<AccordionGroup>
  <Accordion title="Cerebras（GLM 4.7／GPT OSS）">
    官方外部 `cerebras` 供應商外掛可透過 `openclaw onboard --auth-choice cerebras-api-key` 進行設定。只有在覆寫預設值時，才使用明確的供應商設定。

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

    Cerebras 請使用 `cerebras/zai-glm-4.7`；直接使用 Z.AI 則請使用 `zai/glm-4.7`。

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

    相容 Anthropic 的內建供應商。捷徑：`openclaw onboard --auth-choice kimi-code-api-key`。

  </Accordion>
  <Accordion title="本機模型 (LM Studio)">
    請參閱[本機模型](/zh-TW/gateway/local-models)。簡而言之：在高階硬體上透過 LM Studio Responses API 執行大型本機模型；保留合併的託管模型以供備援。
  </Accordion>
  <Accordion title="MiniMax M3（直接連線）">
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

    設定 `MINIMAX_API_KEY`。捷徑：`openclaw onboard --auth-choice minimax-global-api` 或 `openclaw onboard --auth-choice minimax-cn-api`。模型目錄預設使用 M3，也包含 M2.7 變體。在 Anthropic 相容的串流路徑上，除非你自行明確設定 `thinking`，否則 OpenClaw 預設會停用 MiniMax M2.x 的思考功能；MiniMax-M3（以及 M3.x）預設仍採用供應商的省略／自適應思考路徑。`/fast on` 或 `params.fastMode: true` 會將 `MiniMax-M2.7` 改寫為 `MiniMax-M2.7-highspeed`。

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
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

    若使用中國端點：`baseUrl: "https://api.moonshot.cn/v1"` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`。

    原生 Moonshot 端點會在共用的 `openai-completions` 傳輸上宣告串流用量相容性，而 OpenClaw 會依據端點能力啟用此功能，而不僅依賴內建供應商 ID。

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
  <Accordion title="Z.AI (GLM-4.7)">
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

    設定 `ZAI_API_KEY`。模型參照使用標準的 `zai/*` 供應商 ID。捷徑：`openclaw onboard --auth-choice zai-api-key`。

    - 一般端點：`https://api.z.ai/api/paas/v4`
    - 程式開發端點：`https://api.z.ai/api/coding/paas/v4`
    - 預設的 `zai-api-key` 驗證選項會探測你的金鑰，並自動偵測其所屬端點（若偵測結果不明確，則改為提示你選擇，預設為 Global）。此外，也提供專用的 CN 和 Coding-Plan 驗證選項，供你明確選取。
    - 若使用一般端點，請定義自訂供應商並覆寫基礎 URL。

  </Accordion>
</AccordionGroup>

---

## 相關內容

- [設定 — 代理程式](/zh-TW/gateway/config-agents)
- [設定 — 頻道](/zh-TW/gateway/config-channels)
- [設定參考](/zh-TW/gateway/configuration-reference) — 其他頂層鍵
- [工具與外掛](/zh-TW/tools)
