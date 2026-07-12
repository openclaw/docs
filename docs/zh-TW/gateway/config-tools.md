---
read_when:
    - 設定 `tools.*` 原則、允許清單或實驗性功能
    - 註冊自訂提供者或覆寫基礎 URL
    - 設定與 OpenAI 相容的自託管端點
sidebarTitle: Tools and custom providers
summary: 工具設定（政策、實驗性切換選項、供應商支援的工具）與自訂供應商／基礎 URL 設定
title: 設定 — 工具與自訂供應商
x-i18n:
    generated_at: "2026-07-11T21:19:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` 設定鍵與自訂提供者／基礎 URL 設定。關於代理程式、頻道及其他頂層設定鍵，請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## 工具

### 工具設定檔

`tools.profile` 會在套用 `tools.allow`/`tools.deny` 前設定基礎允許清單：

<Note>
本機初始設定會在未設定時，將新的本機設定預設為 `tools.profile: "coding"`（既有的明確設定檔會予以保留）。
</Note>

| 設定檔      | 包含項目                                                                                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | 僅限 `session_status`                                                                                                                                                                                                        |
| `coding`    | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`get_goal`、`create_goal`、`update_goal`、`update_plan`、`skill_workshop`、`image`、`image_generate`、`music_generate`、`video_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                                                                                                                                    |
| `full`      | 無限制（與未設定相同）                                                                                                                                                                                               |

`coding` 和 `messaging` 也會隱含允許 `bundle-mcp`（已設定的 MCP 伺服器）。

### 工具群組

| 群組               | 工具                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`、`process`、`code_execution`（`bash` 可作為 `exec` 的別名）                                                                       |
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
| `group:openclaw`   | 上述所有內建工具，但不包含 `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas`（不含外掛工具）                                 |
| `group:plugins`    | 由已載入外掛擁有的工具，包括透過 `bundle-mcp` 公開的已設定 MCP 伺服器                                                          |

`spawn_task` 可讓程式設計代理程式提出經確認的後續工作，而不會立即開始執行。控制介面會將標題和摘要顯示為可操作的籌碼；由閘道支援的終端介面則會顯示功能等同的互動式提示。接受其中任一項後，系統會建立新的受管理工作樹工作階段，並將完整提示傳送至該處，同時目前的回合繼續進行。`dismiss_task` 會使用 `spawn_task` 傳回的暫時性 `task_id`，撤回仍在等待中的建議。

只有在發起操作的介面能接收並處理閘道工作建議事件時，才會提供這些工具。頻道工作階段和本機／嵌入式終端介面工作階段不會接收這些事件；頻道傳輸需要可攜式且具型別的工作操作，才能安全地公開此流程。建議僅存在於程序本機，並會在閘道重新啟動時消失。這兩項工具仍會包含在 `coding` 設定檔與 `group:sessions` 中，因此當介面支援時，一般的 `tools.allow` 和 `tools.deny` 原則會自動設定它們。

### 沙箱工具原則中的 MCP 與外掛工具

已設定的 MCP 伺服器會以 `bundle-mcp` 外掛 ID 下由外掛擁有的工具形式公開。一般工具設定檔可以允許它們，但對於沙箱化工作階段，`tools.sandbox.tools` 是額外的管控層。如果沙箱模式為 `"all"` 或 `"non-main"`，當 MCP／外掛工具應可見時，請在沙箱工具允許清單中加入下列其中一個項目：

- `bundle-mcp`：用於來自 `mcp.servers`、由 OpenClaw 管理的 MCP 伺服器
- 特定原生外掛的外掛 ID
- `group:plugins`：用於所有已載入、由外掛擁有的工具
- 當您只想允許單一伺服器時，可使用確切的 MCP 伺服器工具名稱或伺服器萬用字元模式，例如 `outlook__send_mail` 或 `outlook__*`

伺服器萬用字元模式使用對提供者安全的 MCP 伺服器前綴，不一定是原始的 `mcp.servers` 鍵。非 `[A-Za-z0-9_-]` 字元會轉為 `-`，不是以字母開頭的名稱會加上 `mcp-` 前綴，而過長或重複的前綴可能會被截短或加上後綴；例如，`mcp.servers["Outlook Graph"]` 會使用類似 `outlook-graph__*` 的萬用字元模式。

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

若沒有該沙箱層項目，MCP 伺服器仍可成功載入，但其工具會在提供者請求前被篩除。請使用 `openclaw doctor` 檢查 `mcp.servers` 中由 OpenClaw 管理之伺服器的這類設定。從隨附外掛資訊清單或 Claude `.mcp.json` 載入的 MCP 伺服器也使用相同的沙箱管控層，但此診斷目前尚未列舉這些來源；如果它們的工具在沙箱化回合中消失，請使用相同的允許清單項目。

### `tools.codeMode`

`tools.codeMode` 會啟用通用的 OpenClaw 程式碼模式介面。若在含有工具的執行中啟用，一般 OpenClaw 工具會移至沙箱內的 `tools.*` 目錄橋接器後方，而 MCP 工具則可透過產生的 `MCP` 命名空間使用。模型通常會看到 `exec` 和 `wait`；像 `computer` 這類結構化結果無法通過僅限 JSON 的橋接器之工具，則會維持直接提供。

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

在程式碼模式中，MCP 宣告會透過唯讀的虛擬 API 檔案介面公開。客體程式碼可呼叫 `API.list("mcp")` 和 `API.read("mcp/<server>.d.ts")`，在呼叫 `MCP.<server>.<tool>()` 前檢查 TypeScript 風格的簽章。關於執行階段契約、限制與偵錯步驟，請參閱[程式碼模式](/zh-TW/reference/code-mode)。

### `tools.allow` / `tools.deny`

全域工具允許／拒絕原則（拒絕優先）。不區分大小寫，支援 `*` 萬用字元。即使 Docker 沙箱已關閉，仍會套用此原則。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` 與 `apply_patch` 是不同的工具 ID。對相容的模型而言，`allow: ["write"]` 也會啟用 `apply_patch`，但 `deny: ["write"]` 不會拒絕 `apply_patch`。若要封鎖所有檔案修改，請拒絕 `group:fs`，或明確列出每個會進行修改的工具：

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
同一個範圍（`tools`、`tools.byProvider.<id>`、`agents.list[].tools`）內不能同時設定 `allow` 與 `alsoAllow`，否則設定驗證會拒絕。請將 `alsoAllow` 項目合併至 `allow`，或移除 `allow`，改用 `profile` + `alsoAllow`。
</Note>

### `tools.byProvider`

進一步限制特定供應商或模型可使用的工具。順序：基礎設定檔 → 供應商設定檔 → 允許／拒絕。

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

限制特定請求者身分可使用的工具。這是在頻道存取控制之上的縱深防禦；傳送者值必須來自頻道配接器，而非訊息文字。

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

鍵使用明確前綴：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 或 `"*"`。頻道 ID 是 OpenClaw 的標準 ID；`teams` 等別名會正規化為 `msteams`。舊式無前綴鍵僅會被視為 `id:`。比對順序依次為頻道 + ID、ID、e164、使用者名稱、顯示名稱，最後是萬用字元。

當每個代理程式的 `agents.list[].tools.toolsBySender` 符合時，即使原則是空的 `{}`，也會覆寫全域傳送者比對結果。

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

- 每個代理程式的覆寫設定（`agents.list[].tools.elevated`）只能進一步限制權限。
- `/elevated on|off|ask|full` 會依工作階段儲存狀態；行內指令僅套用至單一訊息。
- 提升權限的 `exec` 會繞過沙箱，並使用已設定的逸出路徑（預設為 `gateway`；當執行目標為 `node` 時則使用 `node`）。

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

除 `applyPatch.allowModels` 外，所示值皆為預設值（預設為空或未設定，表示任何相容模型都可使用 `apply_patch`）。當需要核准的 `exec` 執行時間過長時，`approvalRunningNoticeMs` 會發出執行中通知；設為 `0` 可停用。

### `tools.loopDetection`

工具迴圈安全檢查**預設為停用**。設定 `enabled: true` 即可啟用偵測。設定可全域定義於 `tools.loopDetection`，並可由每個代理程式的 `agents.list[].tools.loopDetection` 覆寫。

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
  針對重複且無進展模式發出警告的閾值。
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  在發生此數量的未命中後，封鎖對同一個不可用或未知工具名稱的重複呼叫。
</ParamField>
<ParamField path="criticalThreshold" type="number">
  用於封鎖嚴重迴圈的較高重複閾值。
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  任何無進展執行的強制停止閾值。
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  對使用相同工具及相同引數的重複呼叫發出警告。
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  對已知的輪詢工具（`process.poll`、`command_status` 等）發出警告或予以封鎖。
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  對交替出現且無進展的成對模式發出警告或予以封鎖。
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  自動壓縮後，防護機制維持啟用的嘗試次數；若代理程式在此視窗內重複相同的（工具、引數、結果），便會中止。
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

除 `provider` 和 `userAgent` 外，顯示的值皆為預設值。`maxResponseBytes` 會限制在 32000–10000000 之間；`maxChars` 會受限於 `maxCharsCap`（提高 `maxCharsCap` 可允許更大的回應）。

### `tools.media`

設定傳入媒體的理解功能（圖片／音訊／影片）：

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

`concurrency`（預設為 `2`）、`audio.maxBytes`（預設為 20 MB）及 `video.maxBytes`（預設為 50 MB）均以其預設值顯示；`image.maxBytes` 預設為 10 MB。各功能的請求逾時預設值：圖片／音訊為 `60` 秒，影片為 `120` 秒。

<AccordionGroup>
  <Accordion title="Media model entry fields">
    **提供者項目**（`type: "provider"` 或省略）：

    - `provider`：API 提供者識別碼（`openai`、`anthropic`、`google`/`gemini`、`groq` 等）
    - `model`：模型識別碼覆寫值
    - `profile` / `preferredProfile`：選取 `auth-profiles.json` 設定檔

    **命令列介面項目**（`type: "cli"`）：

    - `command`：要執行的可執行檔
    - `args`：樣板化引數（支援 `{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` 等；`openclaw doctor --fix` 會將已棄用的 `{input}` 預留位置遷移至 `{{MediaPath}}`）

    **共用欄位：**

    - `capabilities`：選用清單（`image`、`audio`、`video`）。每個提供者外掛會宣告自己的預設功能集合；例如，隨附的 `openai` 提供者預設支援圖片與音訊，`anthropic`/`minimax` 預設支援圖片，`google` 預設支援圖片、音訊及影片，而 `groq` 預設支援音訊。
    - `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：各項目的覆寫值。
    - 當代理程式明確呼叫 `image` 工具時，`tools.media.image.timeoutSeconds` 及相符圖片模型項目的 `timeoutSeconds` 也會套用。對於圖片理解，此逾時值套用於請求本身，不會因先前的準備工作而縮短。
    - 發生失敗時，會改用下一個項目。

    提供者驗證會依照標準順序進行：`auth-profiles.json` → 環境變數 → `models.providers.*.apiKey`。

    **非同步完成欄位：**

    - `asyncCompletion.directSend`：已棄用的相容性旗標。已完成的非同步媒體工作仍由請求者工作階段居中處理，讓代理程式接收結果、決定如何告知使用者，並在來源傳遞需要時使用訊息工具。

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

預設值：`tree`（目前工作階段及其衍生的工作階段，例如子代理程式）。

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
    - `self`：僅目前的工作階段金鑰。
    - `tree`：目前工作階段及由目前工作階段衍生的工作階段（子代理程式）。
    - `agent`：屬於目前代理程式識別碼的任何工作階段（如果你在相同代理程式識別碼下依傳送者執行工作階段，可能會包含其他使用者）。
    - `all`：任何工作階段。跨代理程式指定目標仍需要 `tools.agentToAgent`。
    - 沙箱限制：當目前工作階段位於沙箱中，且 `agents.defaults.sandbox.sessionToolsVisibility="spawned"`（預設值）時，即使 `tools.sessions.visibility="all"`，可見範圍也會強制設為 `tree`。
    - 當值不是 `all` 時，`sessions_list` 會包含精簡的 `visibility` 欄位，
      說明實際生效的模式，並警告目前範圍外的部分工作階段可能會被
      省略。

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

控制 `sessions_spawn` 的行內附件支援。

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
    - 附件需要設定 `enabled: true`。
    - 子代理程式附件會具現化至子工作區的 `.openclaw/attachments/<uuid>/`，並包含 `.manifest.json`。
    - ACP 附件僅支援圖片，並會在相同的檔案數量、單一檔案位元組數及總位元組數限制均通過後，以行內方式轉送至 ACP 執行環境。
    - 附件內容會自動從逐字記錄的持久化資料中遮蔽。
    - Base64 輸入會以嚴格的字母表／填補檢查，以及解碼前的大小防護機制進行驗證。
    - 子代理程式附件的檔案權限為：目錄使用 `0700`，檔案使用 `0600`。
    - 子代理程式清理會遵循 `cleanup` 原則：`delete` 一律移除附件；`keep` 僅在 `retainOnSessionKeep: true` 時保留附件。

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

實驗性內建工具旗標。除非符合嚴格代理式 GPT-5 自動啟用規則，否則預設關閉。

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`：啟用結構化的 `update_plan` 工具，以追蹤非簡單的多步驟工作。
- 預設值：`false`；但若針對 `openai` 提供者執行 GPT-5 系列模型識別碼時，`agents.defaults.embeddedAgent.executionContract`（或各代理程式的覆寫值）設為 `"strict-agentic"`，則不在此限（這也涵蓋 OpenAI Codex 命令列介面的執行，因為 Codex 的驗證與模型路由位於 `openai` 提供者之下）。設為 `true` 可在此範圍外強制啟用該工具，設為 `false` 則即使是嚴格代理式 GPT-5 執行也維持關閉。
- 啟用時，系統提示也會加入使用指引，使模型僅將其用於實質性工作，並且最多只保留一個步驟處於 `in_progress` 狀態。

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

- `model`：衍生子代理程式的預設模型。若省略，子代理程式會繼承呼叫者的模型。
- `allowAgents`：當請求代理程式未設定自己的 `subagents.allowAgents` 時，`sessions_spawn` 可使用的已設定目標代理程式識別碼預設允許清單（`["*"]` = 任何已設定的目標；預設值：僅限相同代理程式）。代理程式設定已刪除的過時項目會遭 `sessions_spawn` 拒絕，且不會出現在 `agents_list` 中；請執行 `openclaw doctor --fix` 進行清理。
- `maxConcurrent`：子代理程式同時執行數上限。預設值：`8`。
- `runTimeoutSeconds`：當呼叫者未傳入自己的覆寫值時，`sessions_spawn` 的逾時時間（秒）。預設值：`0`（不逾時）；上述 `900` 是常見的選用值，而非內建預設值。
- `announceTimeoutMs`：閘道 `agent` 公告傳遞嘗試的單次呼叫逾時時間（毫秒）。預設值：`120000`。暫時性重試可能使公告的總等待時間超過單次設定的逾時時間。
- `archiveAfterMinutes`：子代理程式工作階段完成後，經過多少分鐘自動封存。預設值：`60`；`0` 會停用自動封存。
- 各子代理程式的工具原則：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## 自訂提供者與基底 URL

提供者外掛會發布自己的模型目錄資料列。可透過設定中的 `models.providers` 或 `~/.openclaw/agents/<agentId>/agent/models.json` 新增自訂提供者。

為自訂／本機提供者設定 `baseUrl`，同時也是模型 HTTP 請求範圍有限的網路信任決策：OpenClaw 允許該確切的 `scheme://host:port` 來源通過受防護的擷取路徑，而不必新增個別設定選項，也不會信任其他私人來源。

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
  <Accordion title="驗證與合併優先順序">
    - 如有自訂驗證需求，請使用 `authHeader: true` + `headers`。
    - 使用 `OPENCLAW_AGENT_DIR` 覆寫代理程式設定根目錄。
    - 符合相同提供者 ID 時的合併優先順序：
      - 代理程式 `models.json` 中非空白的 `baseUrl` 值優先。
      - 只有當目前設定／驗證設定檔情境中的該提供者並非由 SecretRef 管理時，代理程式中非空白的 `apiKey` 值才會優先。
      - 由 SecretRef 管理的提供者 `apiKey` 值會從來源標記重新整理（環境變數參照使用 `ENV_VAR_NAME`，檔案／執行參照使用 `secretref-managed`），而不會保存已解析的密鑰。
      - 由 SecretRef 管理的提供者標頭值會從來源標記重新整理（環境變數參照使用 `secretref-env:ENV_VAR_NAME`，檔案／執行參照使用 `secretref-managed`）。
      - 代理程式中空白或缺少的 `apiKey`／`baseUrl` 會回退至設定中的 `models.providers`。
      - 相符模型的 `contextWindow`／`maxTokens`：若明確設定值存在且有效（有限的正數），則該值優先；否則使用隱含／產生的目錄值。
      - 相符模型的 `contextTokens` 遵循相同的「明確值優先，否則使用隱含值」規則；可用它限制有效內容範圍，而不變更模型的原生中繼資料。
      - 提供者外掛目錄會以產生且由外掛擁有的目錄分片形式，儲存在代理程式的外掛狀態下。
      - 若要讓設定完整重寫 `models.json` 並略過合併由外掛擁有的目錄分片，請使用 `models.mode: "replace"`。
      - 標記保存以來源為準：標記取自作用中來源設定快照（解析前）並寫入，而非取自執行階段已解析的密鑰值。

  </Accordion>
</AccordionGroup>

### 提供者欄位詳細資料

<AccordionGroup>
  <Accordion title="頂層目錄">
    - `models.mode`：提供者目錄行為（`merge` 或 `replace`）。
    - `models.providers`：以提供者 ID 為索引鍵的自訂提供者對應表。
      - 安全編輯：若要進行附加式更新，請使用 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 或 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge`。除非傳入 `--replace`，否則 `config set` 會拒絕破壞性的取代操作。

  </Accordion>
  <Accordion title="提供者連線與驗證">
    - `models.providers.*.api`：請求配接器（`openai-completions`、`openai-responses`、`openai-chatgpt-responses`、`anthropic-messages`、`google-generative-ai`、`google-vertex`、`github-copilot`、`bedrock-converse-stream`、`ollama`、`azure-openai-responses`）。對於 MLX、vLLM、SGLang 及大多數與 OpenAI 相容的本機伺服器等自行託管的 `/v1/chat/completions` 後端，請使用 `openai-completions`。具有 `baseUrl` 但未設定 `api` 的自訂提供者預設使用 `openai-completions`；只有在後端支援 `/v1/responses` 時才設定 `openai-responses`。
    - `models.providers.*.apiKey`：提供者憑證（建議使用 SecretRef／環境變數替代）。
    - `models.providers.*.auth`：驗證策略（`api-key`、`token`、`oauth`、`aws-sdk`）。
    - `models.providers.*.contextWindow`：當此提供者下的模型項目未設定 `contextWindow` 時，使用的預設原生內容範圍。
    - `models.providers.*.contextTokens`：當此提供者下的模型項目未設定 `contextTokens` 時，使用的預設有效執行階段內容上限。
    - `models.providers.*.maxTokens`：當此提供者下的模型項目未設定 `maxTokens` 時，使用的預設輸出權杖上限。
    - `models.providers.*.timeoutSeconds`：選用的個別提供者模型 HTTP 請求逾時秒數，涵蓋連線、標頭、本文及整體請求中止處理。
    - `models.providers.*.injectNumCtxForOpenAICompat`：針對 Ollama + `openai-completions`，將 `options.num_ctx` 注入請求（預設值：`true`）。
    - `models.providers.*.authHeader`：需要時強制透過 `Authorization` 標頭傳送憑證。
    - `models.providers.*.baseUrl`：上游 API 基底 URL。
    - `models.providers.*.headers`：用於代理伺服器／租戶路由的額外靜態標頭。

  </Accordion>
  <Accordion title="請求傳輸覆寫">
    `models.providers.*.request`：模型提供者 HTTP 請求的傳輸覆寫。

    - `request.headers`：額外標頭（與提供者預設值合併）。值可接受 SecretRef。
    - `request.auth`：驗證策略覆寫。模式：`"provider-default"`（使用提供者內建驗證）、`"authorization-bearer"`（搭配 `token`）、`"header"`（搭配 `headerName`、`value` 及選用的 `prefix`）。
    - `request.proxy`：HTTP 代理伺服器覆寫。模式：`"env-proxy"`（使用 `HTTP_PROXY`／`HTTPS_PROXY` 環境變數）、`"explicit-proxy"`（搭配 `url`）。兩種模式都可接受選用的 `tls` 子物件。
    - `request.tls`：直接連線的 TLS 覆寫。欄位：`ca`、`cert`、`key`、`passphrase`（全部可接受 SecretRef）、`serverName`、`insecureSkipVerify`。
    - `request.allowPrivateNetwork`：設為 `true` 時，允許模型提供者 HTTP 請求透過提供者 HTTP 擷取防護存取私人、CGNAT 或類似的位址範圍。自訂／本機提供者的基底 URL 已預設信任所設定的確切來源，但中繼資料／鏈路本機來源除外；若未明確選擇加入，這些來源仍會遭到封鎖。設為 `false` 可停用確切來源信任。WebSocket 會使用相同的 `request` 設定處理標頭／TLS，但不會套用該擷取 SSRF 防護。預設值為 `false`。

  </Accordion>
  <Accordion title="模型目錄項目">
    - `models.providers.*.models`：明確的提供者模型目錄項目。
    - `models.providers.*.models.*.input`：模型輸入模態。純文字模型請使用 `["text"]`，原生影像／視覺模型請使用 `["text", "image"]`。只有當所選模型標示為具備影像能力時，才會將影像附件注入代理程式輪次。
    - `models.providers.*.models.*.contextWindow`：原生模型內容範圍中繼資料。此值會覆寫該模型的提供者層級 `contextWindow`。
    - `models.providers.*.models.*.contextTokens`：選用的執行階段內容上限。此值會覆寫提供者層級的 `contextTokens`；若希望有效內容預算小於模型原生的 `contextWindow`，請使用此值；當兩個值不同時，`openclaw models list` 會同時顯示兩者。
    - `models.providers.*.models.*.compat.supportsDeveloperRole`：選用的相容性提示。對於具有非空白且非原生 `baseUrl`（主機不是 `api.openai.com`）的 `api: "openai-completions"`，OpenClaw 會在執行階段強制將此值設為 `false`。空白／省略的 `baseUrl` 會保留 OpenAI 的預設行為。
    - `models.providers.*.models.*.compat.requiresStringContent`：針對僅接受字串且與 OpenAI 相容的聊天端點提供的選用相容性提示。設為 `true` 時，OpenClaw 會在傳送請求前，將純文字 `messages[].content` 陣列扁平化為一般字串。
    - `models.providers.*.models.*.compat.strictMessageKeys`：針對嚴格且與 OpenAI 相容的聊天端點提供的選用相容性提示。設為 `true` 時，OpenClaw 會在傳送請求前，將傳出的 Chat Completions 訊息物件精簡為 `role` 和 `content`。
    - `models.providers.*.models.*.compat.thinkingFormat`：選用的思考承載資料提示。Together 風格的 `reasoning.enabled` 請使用 `"together"`，頂層 `enable_thinking` 請使用 `"qwen"`；對於支援請求層級聊天範本關鍵字引數的 Qwen 系列 OpenAI 相容伺服器（例如 vLLM），其 `chat_template_kwargs.enable_thinking` 請使用 `"qwen-chat-template"`。已設定的 vLLM Qwen 模型會為這些格式提供二元 `/think` 選項（`off`、`on`）。
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`：針對 DeepSeek 風格 Chat Completions 後端提供的選用相容性提示；這類後端要求先前的助理訊息在重播時保留 `reasoning_content`。設為 `true` 時，OpenClaw 會在傳出的助理訊息中保留該欄位。連接自訂且與 DeepSeek 相容的代理伺服器時，若該代理伺服器會拒絕推理內容遭移除後的請求，請使用此設定。預設值為 `false`。

  </Accordion>
  <Accordion title="Amazon Bedrock 探索">
    - `plugins.entries.amazon-bedrock.config.discovery`：Bedrock 自動探索設定根目錄。
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`：開啟／關閉隱含探索。
    - `plugins.entries.amazon-bedrock.config.discovery.region`：用於探索的 AWS 區域。
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`：用於定向探索的選用提供者 ID 篩選器。
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`：探索重新整理的輪詢間隔。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`：已探索模型的備用內容範圍。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`：已探索模型的備用最大輸出權杖數。

  </Accordion>
</AccordionGroup>

互動式自訂提供者上手流程會根據已知的視覺模型 ID 模式推斷影像輸入能力，包括 GPT-4o／GPT-4.1／GPT-5+、`o1`／`o3`／`o4` 推理系列、Claude、Gemini、任何帶有 `-vl` 後綴的 ID（Qwen-VL 及類似模型），以及 LLaVA、Pixtral、InternVL、Mllama、MiniCPM-V 和 GLM-4V 等具名系列；對於已知的純文字系列（Llama、DeepSeek、Mistral／Mixtral、Kimi／Moonshot、Codestral、Devstral、Phi、QwQ、CodeLlama，以及沒有 vl／vision 後綴的純 Qwen ID），則會略過額外問題。未知的模型 ID 仍會提示是否支援影像。非互動式上手流程使用相同的推斷方式；傳入 `--custom-image-input` 可強制設定具備影像能力的中繼資料，傳入 `--custom-text-input` 則可強制設定純文字中繼資料。

### 提供者範例

<AccordionGroup>
  <Accordion title="Cerebras（GLM 4.7／GPT OSS）">
    官方外部 `cerebras` 提供者外掛可透過 `openclaw onboard --auth-choice cerebras-api-key` 進行設定。只有在覆寫預設值時，才使用明確的提供者設定。

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

    與 Anthropic 相容的內建提供者。快速方式：`openclaw onboard --auth-choice kimi-code-api-key`。

  </Accordion>
  <Accordion title="本機模型（LM Studio）">
    請參閱[本機模型](/zh-TW/gateway/local-models)。簡而言之：在效能強大的硬體上，透過 LM Studio Responses API 執行大型本機模型；同時保留合併的託管模型以供備援。
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

    設定 `MINIMAX_API_KEY`。快速方式：`openclaw onboard --auth-choice minimax-global-api` 或 `openclaw onboard --auth-choice minimax-cn-api`。模型目錄預設使用 M3，並且也包含 M2.7 變體。在 Anthropic 相容的串流路徑上，除非你自行明確設定 `thinking`，否則 OpenClaw 預設會停用 MiniMax M2.x 的思考功能；MiniMax-M3（及 M3.x）預設則會維持供應商的省略／自適應思考路徑。`/fast on` 或 `params.fastMode: true` 會將 `MiniMax-M2.7` 改寫為 `MiniMax-M2.7-highspeed`。

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

    若要使用中國端點：`baseUrl: "https://api.moonshot.cn/v1"` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`。

    Moonshot 原生端點會在共用的 `openai-completions` 傳輸上宣告串流用量相容性，而 OpenClaw 會根據端點能力啟用此功能，而不會只依據內建供應商 ID。

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

    設定 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）。Zen 目錄請使用 `opencode/...` 參照，Go 目錄請使用 `opencode-go/...` 參照。快速方式：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`。

  </Accordion>
  <Accordion title="Synthetic（與 Anthropic 相容）">
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

    基礎 URL 不應包含 `/v1`（Anthropic 用戶端會自動附加）。快速方式：`openclaw onboard --auth-choice synthetic-api-key`。

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

    設定 `ZAI_API_KEY`。模型參照使用標準的 `zai/*` 供應商 ID。快速方式：`openclaw onboard --auth-choice zai-api-key`。

    - 一般端點：`https://api.z.ai/api/paas/v4`
    - 程式設計端點：`https://api.z.ai/api/coding/paas/v4`
    - 預設的 `zai-api-key` 驗證選項會探測你的金鑰，並自動偵測其所屬端點（若偵測結果不明確，則改為顯示提示，並預設選擇 Global）。也可使用專用的 CN 與 Coding-Plan 驗證選項進行明確選擇。
    - 若使用一般端點，請定義自訂供應商並覆寫基礎 URL。

  </Accordion>
</AccordionGroup>

---

## 相關內容

- [設定 — 代理程式](/zh-TW/gateway/config-agents)
- [設定 — 頻道](/zh-TW/gateway/config-channels)
- [設定參考](/zh-TW/gateway/configuration-reference) — 其他頂層鍵
- [工具與外掛](/zh-TW/tools)
