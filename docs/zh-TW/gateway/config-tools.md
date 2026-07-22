---
read_when:
    - 設定 `tools.*` 政策、允許清單或實驗性功能
    - 註冊自訂供應商或覆寫基礎 URL
    - 設定與 OpenAI 相容的自行託管端點
sidebarTitle: Tools and custom providers
summary: 工具設定（政策、實驗性切換選項、供應商支援的工具）與自訂供應商／基礎 URL 設定
title: 設定 — 工具與自訂供應商
x-i18n:
    generated_at: "2026-07-22T10:33:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61bd7428ba7a5e2241829952863fcf3f6f50ff0d3a6d60509c0e842a65d2bb1f
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` 設定鍵與自訂供應商／基礎 URL 設定。如需代理程式、頻道及其他頂層設定鍵，請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## 工具

### 工具設定檔

`tools.profile` 會在 `tools.allow`/`tools.deny` 之前設定基礎允許清單：

<Note>
未設定時，本機初始設定預設會將新的本機設定設為 `tools.profile: "coding"`（保留現有的明確設定檔）。
</Note>

| 設定檔     | 包含                                                                                                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | 僅 `session_status`                                                                                                                                                                                                                                   |
| `coding`    | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`get_goal`、`create_goal`、`update_goal`、`update_plan`、`ask_user`、`skill_workshop`、`image`、`image_generate`、`music_generate`、`video_generate`                |
| `messaging` | `group:messaging`、`sessions`、`sessions_list`、`sessions_history`、`sessions_search`、`conversations_list`、`conversations_send`、`conversations_turn`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status`、`ask_user` |
| `full`      | 無限制（等同於未設定）                                                                                                                                                                                                                          |

`coding` 和 `messaging` 也會隱含允許 `bundle-mcp`（已設定的 MCP 伺服器）。

### 工具群組

| 群組              | 工具                                                                                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`、`process`、`code_execution`（接受 `bash` 作為 `exec` 的別名）                                                                                                                                                                        |
| `group:fs`         | `read`、`write`、`edit`、`apply_patch`                                                                                                                                                                                                                 |
| `group:sessions`   | `sessions`、`sessions_list`、`sessions_history`、`sessions_search`、`conversations_list`、`conversations_send`、`conversations_turn`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status`、`spawn_task`、`dismiss_task` |
| `group:memory`     | `memory_search`、`memory_get`                                                                                                                                                                                                                          |
| `group:web`        | `web_search`、`x_search`、`web_fetch`                                                                                                                                                                                                                  |
| `group:ui`         | `browser`、`screen`、`terminal`、`canvas`、`show_widget`                                                                                                                                                                                               |
| `group:automation` | `heartbeat_respond`、`cron`、`gateway`                                                                                                                                                                                                                 |
| `group:messaging`  | `message`                                                                                                                                                                                                                                              |
| `group:nodes`      | `nodes`、`computer`                                                                                                                                                                                                                                    |
| `group:agents`     | `agents_list`、`get_goal`、`create_goal`、`update_goal`、`update_plan`、`ask_user`、`skill_workshop`                                                                                                                                                   |
| `group:media`      | `image`、`image_generate`、`music_generate`、`video_generate`、`tts`                                                                                                                                                                                   |
| `group:openclaw`   | 上述所有內建工具，但不包含 `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas`（排除外掛工具）                                                                                                                                  |
| `group:plugins`    | 由已載入外掛擁有的工具，包括透過 `bundle-mcp` 公開的已設定 MCP 伺服器                                                                                                                                                           |

`spawn_task` 可讓程式設計代理程式提出已確認的後續工作，而不會立即開始執行。控制 UI 會將標題與摘要顯示為可操作的方塊；由閘道支援的終端介面則會顯示等效的互動式提示。接受其中任一項後，系統會建立新的受管理工作樹工作階段，並將完整提示傳送至該處，同時目前回合會繼續進行。`dismiss_task` 會使用 `spawn_task` 傳回的暫時性 `task_id`，撤回仍在等候中的建議。

只有當發起操作的介面能夠接收並處理閘道任務建議事件時，才會提供這些工具。頻道工作階段及本機／嵌入式終端介面工作階段不會接收這些事件；頻道傳輸需要可攜式的型別化任務動作，才能安全地公開此流程。建議僅存在於處理程序本機，並會在閘道重新啟動時消失。這兩項工具仍包含在 `coding` 設定檔與 `group:sessions` 中，因此當介面支援時，一般的 `tools.allow` 與 `tools.deny` 原則會自動設定它們。

### 沙箱工具原則中的 MCP 與外掛工具

已設定的 MCP 伺服器會以 `bundle-mcp` 外掛 ID 之下的外掛自有工具形式公開。一般工具設定檔可以允許它們，但 `tools.sandbox.tools` 是沙箱工作階段的額外閘門。若沙箱模式為 `"all"` 或 `"non-main"`，且應顯示 MCP／外掛工具，請在沙箱工具允許清單中加入下列其中一個項目：

- 來自 `mcp.servers`、由 OpenClaw 管理之 MCP 伺服器的 `bundle-mcp`
- 特定原生外掛的外掛 ID
- 適用於所有已載入外掛自有工具的 `group:plugins`
- 當你只需要一部伺服器時，使用確切的 MCP 伺服器工具名稱或伺服器 glob，例如 `outlook__send_mail` 或 `outlook__*`

伺服器 glob 使用供應商安全的 MCP 伺服器前置詞，不一定是原始的 `mcp.servers` 鍵。非 `[A-Za-z0-9_-]` 字元會變成 `-`，並非以字母開頭的名稱會加上 `mcp-` 前置詞，而過長或重複的前置詞可能會遭到截斷或加上後綴；例如，`mcp.servers["Outlook Graph"]` 會使用類似 `outlook-graph__*` 的 glob。

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

若沒有該沙箱層項目，MCP 伺服器仍可成功載入，但其工具會在傳送供應商要求前被篩除。使用 `openclaw doctor` 可偵測 `mcp.servers` 中由 OpenClaw 管理之伺服器的這種情況。從隨附外掛資訊清單或 Claude `.mcp.json` 載入的 MCP 伺服器使用相同的沙箱閘門，但此診斷目前尚未列舉這些來源；若其工具在沙箱回合中消失，請使用相同的允許清單項目。

### `tools.codeMode`

`tools.codeMode` 會啟用通用的 OpenClaw 程式碼模式介面。啟用後，
在具有工具的執行中，一般 OpenClaw 工具會移至沙箱內的 `tools.*`
目錄橋接器後方，而 MCP 工具則可透過產生的 `MCP`
命名空間使用。模型通常會看到 `exec` 和 `wait`；像 `computer`
這類結構化結果無法通過僅限 JSON 的橋接器之工具，則會保持直接提供。

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

在程式碼模式中，MCP 宣告會透過唯讀的虛擬 API 檔案介面公開。
客體程式碼可以呼叫 `API.list("mcp")` 和
`API.read("mcp/<server>.d.ts")`，以便在呼叫 `MCP.<server>.<tool>()`
之前檢查 TypeScript 形式的簽章。如需執行階段合約、限制及偵錯步驟，請參閱[程式碼模式](/zh-TW/tools/code-mode)。

### `tools.allow` / `tools.deny`

全域工具允許／拒絕原則（拒絕優先）。不區分大小寫，並支援 `*` 萬用字元。即使 Docker 沙箱已關閉也會套用。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` 和 `apply_patch` 是不同的工具 ID。`allow: ["write"]` 也會為相容模型啟用 `apply_patch`，但 `deny: ["write"]` 不會拒絕 `apply_patch`。若要封鎖所有檔案異動，請拒絕 `group:fs`，或明確列出每項可進行異動的工具：

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` 和 `alsoAllow` 不能在同一範圍（`tools`、`tools.byProvider.<id>`、`agents.entries.*.tools`）中同時設定，否則設定驗證會拒絕。請將 `alsoAllow` 項目合併至 `allow`，或移除 `allow`，改用 `profile` + `alsoAllow`。
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

限制特定請求者身分可使用的工具。這是在頻道存取控制之上的縱深防禦；傳送者值必須來自頻道轉接器，而非訊息文字。

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

鍵使用明確的前綴：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 或 `"*"`。頻道 ID 是標準 OpenClaw ID；`teams` 等別名會正規化為 `msteams`。舊版無前綴鍵僅接受為 `id:`。比對順序為頻道 + ID、ID、e164、使用者名稱、名稱，最後是萬用字元。

個別代理程式的 `agents.entries.*.tools.toolsBySender` 在相符時會覆寫全域傳送者比對，即使 `{}` 原則為空亦然。

### `tools.elevated`

控制沙箱外的提升權限執行存取：

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

- 個別代理程式的覆寫（`agents.entries.*.tools.elevated`）只能進一步限制。
- `/elevated on|off|ask|full` 會依工作階段儲存狀態；行內指令僅套用至單一訊息。
- 提升權限的 `exec` 會略過沙箱機制，並使用設定的逸出路徑（預設為 `gateway`；當執行目標為 `node` 時則為 `node`）。

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

顯示的值皆為預設值，但 `applyPatch.allowModels` 除外（預設為空白／未設定，表示任何相容模型都可使用 `apply_patch`）。當需要核准的執行持續較久時，`approvalRunningNoticeMs` 會發出執行中通知；`0` 則會停用該通知。

### `tools.loopDetection`

工具迴圈安全檢查**預設為停用**。設定 `enabled: true` 以啟用偵測。設定可在 `tools.loopDetection` 中全域定義，並可於個別代理程式的 `agents.entries.*.tools.loopDetection` 中覆寫。

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
    },
  },
}
```

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

顯示的值皆為預設值，但 `provider` 與 `userAgent` 除外。`maxResponseBytes` 會限制在 32000–10000000；`maxChars` 會限制為 `maxCharsCap`（提高 `maxCharsCap` 以允許更大的回應）。

### `tools.media`

設定傳入媒體的理解功能（影像／音訊／影片）：

```json5
{
  tools: {
    media: {
      concurrency: 2,
      models: [
        { provider: "openai", model: "gpt-4o-mini-transcribe", capabilities: ["audio"] },
        {
          type: "cli",
          command: "whisper",
          args: ["--model", "base", "{{MediaPath}}"],
          capabilities: ["audio"],
        },
        { provider: "ollama", model: "gemma4:26b", capabilities: ["image"] },
        { provider: "google", model: "gemini-3-flash-preview", capabilities: ["video"] },
      ],
      audio: { enabled: true, preferredModel: "openai/gpt-4o-mini-transcribe" },
      image: { enabled: true, preferredModel: "ollama/gemma4:26b" },
      video: { enabled: true },
    },
  },
}
```

`tools.media.models` 是唯一設定的模型清單。每個項目都會宣告其處理的能力。選用的 `preferredModel` 選擇器接受 `provider/model`、模型 ID、用於供應商預設項目的 `provider:<id>`，或 `cli:command`；相符項目會移至該能力備援順序的最前方。對於已設定及自動偵測的模型，各能力的提示、限制、請求設定、範圍、附件原則及音訊逐字稿回顯皆維持預設值；模型項目可覆寫模型特定欄位。

<AccordionGroup>
  <Accordion title="媒體模型項目欄位">
    **供應商項目**（`type: "provider"` 或省略）：

    - `provider`：API 供應商 ID（`openai`、`anthropic`、`google`/`gemini`、`groq` 等）
    - `model`：模型 ID 覆寫
    - `profile` / `preferredProfile`：`auth-profiles.json` 設定檔選擇

    **命令列介面項目**（`type: "cli"`）：

    - `command`：要執行的可執行檔
    - `args`：範本化引數（支援 `{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` 等；`openclaw doctor --fix` 會將已棄用的 `{input}` 預留位置遷移至 `{{MediaPath}}`）

    **共用欄位：**

    - `capabilities`：包含 `image`、`audio` 及 `video` 中一項或多項的清單。
    - `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：個別項目的覆寫。
    - 當代理程式呼叫明確的 `image` 工具時，相符影像模型的 `timeoutSeconds` 項目也會套用。對於影像理解，此逾時套用至請求本身，不會因先前的準備工作而縮短。
    - 失敗時會改用下一個項目。

    供應商驗證依照標準順序進行：`auth-profiles.json` → 環境變數 → `models.providers.*.apiKey`。

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

預設值：`tree`（目前工作階段 + 由其產生的工作階段，例如子代理程式，以及同一代理程式中受環境群組感知監看的群組工作階段）。

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
    - `self`：僅限目前工作階段鍵。
    - `tree`：目前工作階段 + 由目前工作階段產生的工作階段（子代理程式）。對於讀取操作，這也包括目前工作階段透過環境群組感知監看的同一代理程式群組工作階段。
    - `agent`：屬於目前代理程式 ID 的任何工作階段（如果你在同一代理程式 ID 下依傳送者執行工作階段，可能會包含其他使用者）。
    - `all`：任何工作階段。跨代理程式指定目標仍需要 `tools.agentToAgent`。
    - 沙箱限制：當目前工作階段位於沙箱中且 `agents.defaults.sandbox.sessionToolsVisibility="spawned"`（預設值）時，即使 `tools.sessions.visibility="all"`，可見性仍會強制設為 `tree`。
    - 當不是 `all` 時，`sessions_list` 會包含精簡的 `visibility` 欄位，說明實際模式，並警告目前範圍以外的部分工作階段可能會被省略。

  </Accordion>
</AccordionGroup>

使用預設的 `session.dmScope: "main"` 時，群組中的人員活動會讓同一代理程式的該群組工作階段對代理程式的主要工作階段呈現環境可見狀態。在多使用者設定中，`"main"` 也會讓多位使用者共用一個私訊工作階段，因此路由至該處的每位使用者都能讀取受環境監看的群組，包括透過工作階段記憶體 `memory_search` 讀取。請使用每位對象各自的 `dmScope` 來隔離私訊，或設定 `tools.sessions.visibility: "self"` 以停用讀取受環境監看的工作階段。

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
  <Accordion title="附件注意事項">
    - 附件需要 `enabled: true`。
    - 子代理程式附件會具體化至子工作區的 `.openclaw/attachments/<uuid>/`，並附有 `.manifest.json`。
    - ACP 附件僅限影像，並會在通過相同的檔案數量、單檔位元組數及總位元組數限制後，以行內方式轉送至 ACP 執行階段。
    - 附件內容會自動從逐字稿持久化資料中遮蔽。
    - Base64 輸入會接受嚴格的字母表／填補檢查，以及解碼前大小防護。
    - 子代理程式附件的檔案權限，目錄為 `0700`，檔案為 `0600`。
    - 子代理程式清理遵循 `cleanup` 原則：`delete` 一律移除附件；只有在 `retainOnSessionKeep: true` 時，`keep` 才會保留附件。

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
- 預設值：`false`，除非 `agents.defaults.embeddedAgent.executionContract`（或個別代理程式覆寫）針對使用 GPT-5 系列模型 ID 的 `openai` 供應商執行設為 `"strict-agentic"`（這也涵蓋 OpenAI Codex 命令列介面的執行，因為 Codex 驗證／模型路由位於 `openai` 供應商下）。設定 `true` 可強制在該範圍外啟用此工具，或設定 `false`，即使是嚴格代理式 GPT-5 執行也保持關閉。
- 啟用後，系統提示也會加入使用指引，讓模型只在大量工作時使用此工具，且最多僅讓一個步驟處於 `in_progress` 狀態。

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

- `model`：產生子代理程式時使用的預設模型。若省略，子代理程式會繼承呼叫端的模型。
- `allowAgents`：當請求代理程式未設定自己的 `subagents.allowAgents` 時，供 `sessions_spawn` 使用的已設定目標代理程式 ID 預設允許清單（`["*"]` = 任何已設定的目標；預設：僅限同一代理程式）。若某項目的代理程式設定已刪除，`sessions_spawn` 會拒絕該過時項目，且 `agents_list` 會省略該項目；執行 `openclaw doctor --fix` 以清除它們。
- `maxConcurrent`：子代理程式同時執行的最大數量。預設值：`8`。
- `runTimeoutSeconds`：呼叫端未傳入自己的覆寫值時，`sessions_spawn` 的逾時時間（秒）。預設值：`0`（不逾時）；上方所示的 `900` 是常見的選用值，並非內建預設值。
- `announceTimeoutMs`：閘道 `agent` 公告傳遞嘗試的單次呼叫逾時時間（毫秒）。預設值：`120000`。暫時性重試可能會使公告的總等待時間超過單次設定的逾時時間。
- `archiveAfterMinutes`：子代理程式工作階段完成後，經過多少分鐘自動封存。預設值：`60`；`0` 會停用自動封存。
- 各子代理程式的工具原則：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## 自訂供應商與基底 URL

供應商外掛會發布自己的模型目錄資料列。透過設定中的 `models.providers` 或 `~/.openclaw/agents/<agentId>/agent/models.json` 新增自訂供應商。

設定自訂／本機供應商的 `baseUrl`，同時也是模型 HTTP 請求的限縮網路信任決策：OpenClaw 允許該確切的 `scheme://host:port` 來源通過受保護的擷取路徑，無須新增另一個設定選項，也不會信任其他私有來源。

```json5
{
  models: {
    mode: "merge", // 合併（預設）| 取代
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
    - 若有自訂驗證需求，請使用 `authHeader: true` + `headers`。
    - 使用 `OPENCLAW_AGENT_DIR` 覆寫代理程式設定根目錄。
    - 相符供應商 ID 的合併優先順序：
      - 代理程式中非空的 `models.json` `baseUrl` 值優先。
      - 僅當該供應商在目前的設定／驗證設定檔情境中不受 SecretRef 管理時，代理程式中非空的 `apiKey` 值才優先。
      - 受 SecretRef 管理的供應商 `apiKey` 值會從來源標記重新整理（環境變數參照使用 `ENV_VAR_NAME`，檔案／執行參照使用 `secretref-managed`），而不會保存解析後的祕密。
      - 受 SecretRef 管理的供應商標頭值會從來源標記重新整理（環境變數參照使用 `secretref-env:ENV_VAR_NAME`，檔案／執行參照使用 `secretref-managed`）。
      - 代理程式的 `apiKey`/`baseUrl` 為空或缺少時，會退回使用設定中的 `models.providers`。
      - 相符模型的 `contextWindow`/`maxTokens`：若明確設定值存在且有效（正的有限數值），則該值優先；否則使用隱含／產生的目錄值。
      - 相符模型的 `contextTokens` 遵循相同的「明確值優先，否則使用隱含值」規則；可用它限制有效情境，而不變更原生模型中繼資料。
      - 供應商外掛目錄會以產生的外掛自有目錄分片形式，儲存在代理程式的外掛狀態下。
      - 若要讓設定完整重寫 `models.json`，並略過合併外掛自有的目錄分片，請使用 `models.mode: "replace"`。
      - 標記保存以來源為準：標記是從作用中的來源設定快照（解析前）寫入，而不是從解析後的執行階段祕密值寫入。

  </Accordion>
</AccordionGroup>

### 供應商欄位詳細資料

<AccordionGroup>
  <Accordion title="頂層目錄">
    - `models.mode`：供應商目錄行為（`merge` 或 `replace`）。
    - `models.providers`：以供應商 ID 為鍵的自訂供應商對應表。
      - 安全編輯：使用 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 或 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` 進行增量更新。除非傳入 `--replace`，否則 `config set` 會拒絕破壞性取代。

  </Accordion>
  <Accordion title="供應商連線與驗證">
    - `models.providers.*.api`：請求轉接器（`openai-completions`、`openai-responses`、`openai-chatgpt-responses`、`anthropic-messages`、`google-generative-ai`、`google-vertex`、`github-copilot`、`bedrock-converse-stream`、`ollama`、`azure-openai-responses`）。對於 MLX、vLLM、SGLang 及多數與 OpenAI 相容的本機伺服器等自行託管的 `/v1/chat/completions` 後端，請使用 `openai-completions`。具有 `baseUrl` 但沒有 `api` 的自訂供應商，預設使用 `openai-completions`；僅當後端支援 `/v1/responses` 時，才設定 `openai-responses`。
    - `models.providers.*.apiKey`：供應商認證資訊（建議使用 SecretRef／環境變數替換）。
    - `models.providers.*.auth`：驗證策略（`api-key`、`token`、`oauth`、`aws-sdk`）。
    - `models.providers.*.contextWindow`：當模型項目未設定 `contextWindow` 時，此供應商旗下模型的預設原生情境視窗。
    - `models.providers.*.contextTokens`：當模型項目未設定 `contextTokens` 時，此供應商旗下模型的預設有效執行階段情境上限。
    - `models.providers.*.maxTokens`：當模型項目未設定 `maxTokens` 時，此供應商旗下模型的預設輸出權杖上限。
    - `models.providers.*.timeoutSeconds`：選用的各供應商模型 HTTP 請求逾時秒數，涵蓋連線、標頭、本文與整體請求中止處理。
    - `models.providers.*.injectNumCtxForOpenAICompat`：對於 Ollama + `openai-completions`，將 `options.num_ctx` 注入請求（預設值：`true`）。
    - `models.providers.*.authHeader`：需要時，強制透過 `Authorization` 標頭傳輸認證資訊。
    - `models.providers.*.baseUrl`：上游 API 基底 URL。
    - `models.providers.*.headers`：用於 Proxy／租戶路由的額外靜態標頭。

  </Accordion>
  <Accordion title="請求傳輸覆寫">
    `models.providers.*.request`：模型供應商 HTTP 請求的傳輸覆寫。

    - `request.headers`：額外標頭（與供應商預設值合併）。值可接受 SecretRef。
    - `request.auth`：驗證策略覆寫。模式：`"provider-default"`（使用供應商的內建驗證）、`"authorization-bearer"`（搭配 `token`）、`"header"`（搭配 `headerName`、`value`，以及選用的 `prefix`）。
    - `request.proxy`：HTTP Proxy 覆寫。模式：`"env-proxy"`（使用 `HTTP_PROXY`/`HTTPS_PROXY` 環境變數）、`"explicit-proxy"`（搭配 `url`）。兩種模式都可接受選用的 `tls` 子物件。
    - `request.tls`：直接連線的 TLS 覆寫。欄位：`ca`、`cert`、`key`、`passphrase`（皆可接受 SecretRef）、`serverName`、`insecureSkipVerify`。
    - `request.allowPrivateNetwork`：當為 `true` 時，允許模型供應商 HTTP 請求透過供應商 HTTP 擷取防護存取私有、CGNAT 或類似範圍。自訂／本機供應商的基底 URL 已信任確切設定的來源，但中繼資料／連結本機來源除外；若未明確選用，這些來源仍會遭到封鎖。將此項設為 `false`，可停用確切來源信任。WebSocket 會使用相同的 `request` 處理標頭／TLS，但不使用該擷取 SSRF 防護。預設值為 `false`。

  </Accordion>
  <Accordion title="模型目錄項目">
    - `models.providers.*.models`：明確的供應商模型目錄項目。
    - `models.providers.*.models.*.input`：模型輸入模態。純文字模型使用 `["text"]`，原生圖片／視覺模型使用 `["text", "image"]`。僅當所選模型標示為支援圖片時，圖片附件才會注入代理程式回合。
    - `models.providers.*.models.*.contextWindow`：原生模型情境視窗中繼資料。這會覆寫該模型的供應商層級 `contextWindow`。
    - `models.providers.*.models.*.contextTokens`：選用的執行階段情境上限。這會覆寫供應商層級的 `contextTokens`；若要使用比模型原生 `contextWindow` 更小的有效情境預算，請使用此項；當兩個值不同時，`openclaw models list` 會同時顯示兩者。

    #### 自訂供應商能力宣告

    對於內建和目錄已知的模型路由，供應商目錄擁有 `compat`。請勿將這些旗標複製到設定中：只要已設定的 `api` 與 `baseUrl` 仍指向該路由，OpenClaw 就會使用目錄資料列。`openclaw doctor --fix` 會移除相符的舊版覆寫，並回報不一致的值以供審查。

    對於真正的自訂供應商、自訂模型，或路由至不同端點的目錄模型，仍支援 `compat` 區塊。僅設定已針對該端點驗證的能力：

    | 自訂路由鍵 | 執行階段合約 |
    | --- | --- |
    | `supportsStore` | 接受 OpenAI `store` 請求欄位。 |
    | `supportsPromptCacheKey` | 接受 OpenAI 提示快取／工作階段親和性鍵。 |
    | `supportsDeveloperRole` | 接受 `developer` 訊息，而不要求 `system`。 |
    | `supportsReasoningEffort` | 接受推理強度控制。 |
    | `supportsTemperature` | 此模型與轉接器接受 `temperature`。 |
    | `supportsUsageInStreaming` | 在串流回應中發出用量中繼資料。 |
    | `supportsTools` | 支援結構化工具／函式呼叫。設為 `false` 可停用工具。 |
    | `supportsStrictMode` | 接受嚴格工具結構描述。 |
    | `requiresStringContent` | 要求純字串的 Chat Completions 訊息內容。 |
    | `strictMessageKeys` | 要求傳出訊息只能包含可接受的鍵。 |
    | `visibleReasoningDetailTypes` | 指定可安全顯示於逐字稿中的推理詳細資料區塊類型。 |
    | `supportedReasoningEfforts` | 列出端點可接受的推理標籤。 |
    | `reasoningEffortMap` | 將 OpenClaw 思考標籤對應至端點專用標籤。 |
    | `maxTokensField` | 選取 `max_tokens` 或 `max_completion_tokens`。 |
    | `thinkingFormat` | 選取端點的推理承載資料方言。 |
    | `requiresToolResultName` | 要求工具結果訊息包含工具名稱。 |
    | `requiresAssistantAfterToolResult` | 要求工具結果後接續一則助理訊息。 |
    | `requiresThinkingAsText` | 將推理重播為文字，而不是結構化內容。 |
    | `requiresReasoningContentOnAssistantMessages` | 重播期間保留 DeepSeek 樣式的 `reasoning_content`。 |
    | `toolSchemaProfile` | 選取供應商定義的工具結構描述正規化設定檔。 |
    | `unsupportedToolSchemaKeywords` | 移除端點拒絕的指定 JSON Schema 關鍵字。 |
    | `toolCallArgumentsEncoding` | 選取端點的工具呼叫引數編碼。 |
    | `requiresOpenAiAnthropicToolPayload` | 將 OpenAI 格式的工具呼叫轉換為 Anthropic 系列承載資料。 |

  </Accordion>
  <Accordion title="Amazon Bedrock 探索">
    - `plugins.entries.amazon-bedrock.config.discovery`：Bedrock 自動探索設定根節點。
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`：開啟／關閉隱式探索。
    - `plugins.entries.amazon-bedrock.config.discovery.region`：用於探索的 AWS 區域。
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`：用於定向探索的選用提供者 ID 篩選器。
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`：探索重新整理的輪詢間隔。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`：已探索模型的備援上下文視窗。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`：已探索模型的備援最大輸出權杖數。

  </Accordion>
</AccordionGroup>

互動式自訂提供者引導會根據已知的視覺模型 ID 模式推斷影像輸入，包括 GPT-4o/GPT-4.1/GPT-5+、`o1`/`o3`/`o4` 推理系列、Claude、Gemini、任何以 `-vl` 為後綴的 ID（Qwen-VL 及類似模型），以及 LLaVA、Pixtral、InternVL、Mllama、MiniCPM-V 和 GLM-4V 等具名系列；對於已知的純文字系列（Llama、DeepSeek、Mistral/Mixtral、Kimi/Moonshot、Codestral、Devstral、Phi、QwQ、CodeLlama，以及不含 vl/vision 後綴的基本 Qwen ID），則會略過額外問題。對於未知的模型 ID，仍會詢問是否支援影像。非互動式引導會使用相同的推斷方式；傳入 `--custom-image-input` 可強制使用支援影像的中繼資料，傳入 `--custom-text-input` 則可強制使用純文字中繼資料。

### 提供者範例

<AccordionGroup>
  <Accordion title="Cerebras（GLM 4.7 / GPT OSS）">
    官方外部 `cerebras` 提供者外掛可透過 `openclaw onboard --auth-choice cerebras-api-key` 進行設定。只有在覆寫預設值時才使用明確的提供者設定。

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

    內建且與 Anthropic 相容的提供者。捷徑：`openclaw onboard --auth-choice kimi-code-api-key`。

  </Accordion>
  <Accordion title="本機模型（LM Studio）">
    請參閱[本機模型](/zh-TW/gateway/local-models)。簡而言之：在高效能硬體上透過 LM Studio Responses API 執行大型本機模型；保留已合併的託管模型作為備援。
  </Accordion>
  <Accordion title="MiniMax M3（直接使用）">
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

    設定 `MINIMAX_API_KEY`。捷徑：`openclaw onboard --auth-choice minimax-global-api` 或 `openclaw onboard --auth-choice minimax-cn-api`。模型目錄預設為 M3，也包含 M2.7 變體。在與 Anthropic 相容的串流路徑上，除非你自行明確設定 `thinking`，否則 OpenClaw 預設會停用 MiniMax M2.x 的思考功能；MiniMax-M3（及 M3.x）預設仍使用提供者省略／自適應的思考路徑。`/fast on` 或 `params.fastMode: true` 會將 `MiniMax-M2.7` 改寫為 `MiniMax-M2.7-highspeed`。

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

    中國端點請使用：`baseUrl: "https://api.moonshot.cn/v1"` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`。

    原生 Moonshot 端點會在共用的 `openai-completions` 傳輸層上宣告串流用量相容性，而 OpenClaw 會依據端點功能決定是否啟用，不會只依據內建提供者 ID。

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

    設定 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）。Zen 目錄請使用 `opencode/...` 參照，Go 目錄則使用 `opencode-go/...` 參照。捷徑：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`。

  </Accordion>
  <Accordion title="Synthetic（與 Anthropic 相容）">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M3" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M3": { alias: "MiniMax M3" } },
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
                id: "hf:MiniMaxAI/MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    基底 URL 應省略 `/v1`（Anthropic 用戶端會附加該部分）。捷徑：`openclaw onboard --auth-choice synthetic-api-key`。

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
    - 程式設計端點：`https://api.z.ai/api/coding/paas/v4`
    - 預設的 `zai-api-key` 驗證選項會探測你的金鑰，並自動偵測其所屬端點（若偵測結果不明確，則會改為提示你選擇，預設為 Global）。另有專用的 CN 與 Coding-Plan 驗證選項，可供明確選取。
    - 若使用一般端點，請定義自訂提供者並覆寫基底 URL。

  </Accordion>
</AccordionGroup>

---

## 相關內容

- [設定 — 代理程式](/zh-TW/gateway/config-agents)
- [設定 — 頻道](/zh-TW/gateway/config-channels)
- [設定參考](/zh-TW/gateway/configuration-reference) — 其他頂層鍵
- [工具與外掛](/zh-TW/tools)
