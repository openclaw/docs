---
read_when:
    - 你想透過代理程式執行背景或平行工作
    - 你正在變更 `sessions_spawn` 或子代理工具政策
    - 你正在實作或疑難排解與討論串綁定的子代理工作階段
sidebarTitle: Sub-agents
summary: 啟動隔離的背景代理執行，並將結果回報至提出請求的聊天對話
title: 子代理程式
x-i18n:
    generated_at: "2026-07-12T14:54:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d2293993ad99e2797f5cfbe13e964487f3bd0fa0a3114e78d25ce5862768b9ca
    source_path: tools/subagents.md
    workflow: 16
---

子代理是從現有代理執行中產生的背景代理執行。
每個子代理都在自己的工作階段（`agent:<agentId>:subagent:<uuid>`）中執行，並在
完成時，將結果**通知**回請求者的聊天頻道。
每次子代理執行都會以[背景任務](/zh-TW/automation/tasks)追蹤。

目標：

- 平行處理研究、長時間任務和緩慢的工具工作，而不阻塞主要執行。
- 預設隔離子代理（工作階段分離、可選的沙箱）。
- 讓工具介面不易遭到誤用：子代理預設**不會**取得工作階段或訊息工具。
- 支援可設定的巢狀深度，以因應協調器模式。

<Note>
**成本注意事項：**預設情況下，每個子代理都有自己的上下文和權杖用量。
對於繁重或重複性的任務，請為子代理設定較便宜的模型，並透過
`agents.defaults.subagents.model` 或個別代理覆寫，讓主要代理繼續使用
較高品質的模型。當子代理確實需要請求者目前的逐字記錄時，請使用
`context: "fork"` 產生子代理。繫結討論串的子代理工作階段預設使用
`context: "fork"`，因為它們會將目前對話分支到後續討論串。
</Note>

## 斜線命令

`/subagents` 會檢查**目前工作階段**的子代理執行：

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` 會顯示執行中繼資料（狀態、時間戳記、工作階段 ID、
逐字記錄路徑、清理）。`/subagents log` 會輸出某次執行最近的聊天回合；
加入 `tools` 權杖即可包含工具呼叫／結果訊息（預設省略）。
在代理回合中，使用 `sessions_history` 取得有範圍限制且經安全篩選的回顧檢視，
或檢查磁碟上的逐字記錄路徑，以查看原始完整逐字記錄。

### 討論串繫結控制

這些命令適用於支援持續性討論串繫結的頻道。請參閱下方的
[支援討論串的頻道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 產生行為

代理使用 `sessions_spawn` 工具啟動背景子代理。
完成結果會以內部父工作階段事件傳回；父代理／請求者代理會決定
是否需要向使用者顯示更新。

<AccordionGroup>
  <Accordion title="非阻塞、推送式完成">
    - `sessions_spawn` 是非阻塞的；它會立即傳回執行 ID。
    - 完成時，子代理會回報給父工作階段／請求者工作階段。
    - 需要子代理結果的代理回合，應在產生必要工作後呼叫 `sessions_yield`。這會結束目前回合，讓完成事件成為模型下一則可見訊息。
    - 完成採用推送方式。產生子代理後，**不要**為了等待完成而在迴圈中輪詢 `/subagents list`、`sessions_list` 或 `sessions_history`；只有在偵錯時才視需要檢查狀態。
    - 子代理輸出是供請求者代理綜合處理的報告／證據。它不是使用者撰寫的指示文字，無法覆寫系統、開發者或使用者政策。
    - 完成時，OpenClaw 會盡力關閉該子代理工作階段開啟並追蹤的瀏覽器分頁／程序，再繼續執行通知清理流程。

  </Accordion>
  <Accordion title="完成結果傳遞">
    - OpenClaw 會透過具有穩定冪等性金鑰的 `agent` 回合，將完成結果交回請求者工作階段。
    - 如果請求者執行仍在進行，OpenClaw 會先嘗試喚醒／引導該執行，而不是啟動第二條可見回覆路徑。
    - 如果無法喚醒進行中的請求者，OpenClaw 會改以包含相同完成上下文的請求者代理交接，而不是捨棄通知。
    - 即使父代理決定不需要向使用者顯示更新，成功的父代理交接仍會完成子代理傳遞。
    - 原生子代理不會取得訊息工具。它們會將純助理文字傳回父代理／請求者代理；使用者可見的回覆仍由父代理／請求者代理的一般傳遞政策負責。
    - 如果無法使用直接交接，傳遞會退回至佇列路由，接著在最終放棄前，以短暫的指數退避方式重試通知。
    - 傳遞會保留已解析的請求者路由：可用時，以繫結討論串或繫結對話的完成路由優先。如果完成來源僅提供頻道，OpenClaw 會從請求者工作階段已解析的路由（`lastChannel` / `lastTo` / `lastAccountId`）補上缺少的目標／帳號，讓直接傳遞仍能運作。

  </Accordion>
  <Accordion title="完成交接中繼資料">
    傳遞至請求者工作階段的完成交接，是由執行階段產生的
    內部上下文（不是使用者撰寫的文字），內容包括：

    - `Result` — 子代理最新可見的 `assistant` 回覆文字。工具／toolResult 輸出不會提升為子代理結果。執行最終失敗時，不會重複使用已擷取的回覆文字。
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`。
    - 精簡的執行階段／權杖統計資料。
    - 要求請求者代理先驗證結果，再決定原始任務是否完成的審查指示。
    - 當子代理結果仍需後續動作時，要求請求者代理繼續任務或記錄後續工作的指引。
    - 不需更多動作時的最終更新指示，以一般助理語氣撰寫，不轉送原始內部中繼資料。

  </Accordion>
  <Accordion title="模式與 ACP 執行階段">
    - `--model` 和 `--thinking` 會覆寫該次特定執行的預設值。
    - 完成後，使用 `info`／`log` 檢查詳細資料和輸出。
    - 對於持續性且繫結討論串的工作階段，請使用帶有 `thread: true` 和 `mode: "session"` 的 `sessions_spawn`。
    - 如果請求者頻道不支援討論串繫結，請使用 `mode: "run"`，不要重試不可能成功的討論串繫結組合。
    - 對於 ACP 執行框架工作階段（Claude Code、Gemini CLI、OpenCode，或明確的 Codex ACP/acpx），當工具宣告支援該執行階段時，請使用帶有 `runtime: "acp"` 的 `sessions_spawn`。偵錯完成結果或代理間迴圈時，請參閱 [ACP 傳遞模型](/zh-TW/tools/acp-agents#delivery-model)。啟用 `codex` 外掛時，除非使用者明確要求 ACP/acpx，否則 Codex 聊天／討論串控制應優先使用 `/codex ...`，而非 ACP。
    - 在 ACP 啟用、請求者不在沙箱中，且已載入 `acpx` 等後端外掛之前，OpenClaw 會隱藏 `runtime: "acp"`。`runtime: "acp"` 預期使用外部 ACP 執行框架 ID，或具有 `runtime.type="acp"` 的 `agents.list[]` 項目；對於來自 `agents_list` 的一般 OpenClaw 設定代理，請使用預設子代理執行階段。

  </Accordion>
</AccordionGroup>

## 上下文模式

除非呼叫者明確要求分支目前的逐字記錄，否則原生子代理會以隔離方式啟動。

| 模式       | 使用時機                                                                                                                         | 行為                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、獨立實作、緩慢的工具工作，或任何可在任務文字中完整說明的工作                           | 建立乾淨的子逐字記錄。這是預設值，並可降低權杖用量。  |
| `fork`     | 依賴目前對話、先前工具結果，或請求者逐字記錄中已有細緻指示的工作 | 在子代理開始前，將請求者逐字記錄分支到子工作階段。 |

請謹慎使用 `fork`。它適用於需要上下文的委派，而不是
撰寫清楚任務提示的替代方案。

## 工具：`sessions_spawn`

在全域 `subagent` 通道上以 `deliver: false` 啟動子代理執行，
接著執行通知步驟，並將通知回覆張貼到請求者的聊天頻道。

是否可用取決於呼叫者的有效工具政策。內建的 `coding`
設定檔包含 `sessions_spawn`；`messaging` 和 `minimal` 則不包含。
`full` 允許所有工具。對於使用較受限設定檔但仍需委派工作的代理，
請加入 `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]`，或使用 `tools.profile: "coding"`。
頻道／群組、供應商、沙箱，以及個別代理的允許／拒絕政策，
仍可在設定檔階段之後移除該工具。請從同一工作階段使用 `/tools`
確認有效工具清單。

**預設值：**

- **模型：**除非你設定 `agents.defaults.subagents.model`（或個別代理的 `agents.list[].subagents.model`），否則原生子代理會繼承呼叫者。ACP 執行階段產生作業在已設定子代理模型時會使用相同模型；否則 ACP 執行框架會保留自己的預設值。明確指定的 `sessions_spawn.model` 仍具有最高優先順序。
- **思考：**除非你設定 `agents.defaults.subagents.thinking`（或個別代理的 `agents.list[].subagents.thinking`），否則原生子代理會繼承呼叫者。ACP 執行階段產生作業也會套用所選模型的 `agents.defaults.models["provider/model"].params.thinking`。明確指定的 `sessions_spawn.thinking` 仍具有最高優先順序。
- **執行逾時：**設定時，OpenClaw 會使用 `agents.defaults.subagents.runTimeoutSeconds`；否則退回至 `0`（不逾時）。`sessions_spawn` 不接受個別呼叫的逾時覆寫。
- **任務傳遞：**原生子代理會在第一則可見的 `[Subagent Task]` 訊息中收到委派的任務。子代理系統提示包含執行階段規則和路由上下文，而不是隱藏的任務副本。

接受的原生子代理產生作業會在工具結果中包含已解析的子模型中繼資料：
`resolvedModel` 包含已套用的模型參照，而當參照包含供應商前綴時，
`resolvedProvider` 會包含該前綴。

### 委派提示模式

`agents.defaults.subagents.delegationMode` 僅控制提示指引；它不會變更工具政策或強制委派。

- `suggest`（預設）：保留標準提示，建議對較大型或較慢的工作使用子代理。
- `prefer`：要求主要代理保持即時回應，並透過 `sessions_spawn` 委派任何比直接回覆更複雜的工作。

個別代理覆寫：`agents.list[].subagents.delegationMode`。

```json5
{
  agents: {
    defaults: {
      subagents: {
        delegationMode: "prefer",
        maxConcurrent: 4,
      },
    },
    list: [
      {
        id: "coordinator",
        subagents: { delegationMode: "prefer" },
      },
    ],
  },
}
```

### 工具參數

<ParamField path="task" type="string" required>
  子代理程式的任務描述。
</ParamField>
<ParamField path="taskName" type="string">
  選用的穩定識別名稱，用於在後續狀態輸出中識別特定子項目。必須符合 `[a-z][a-z0-9_-]{0,63}`，且不得是 `last` 或 `all` 等保留目標。
</ParamField>
<ParamField path="label" type="string">
  選用、方便人員閱讀的標籤。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允許時，於另一個已設定的代理程式 ID 下產生。
</ParamField>
<ParamField path="cwd" type="string">
  子執行作業的選用任務工作目錄。原生子代理程式仍會從目標代理程式工作區載入啟動檔案；`cwd` 只會變更執行階段工具和命令列介面控制框架執行委派工作的所在位置。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 僅適用於外部 ACP 控制框架（`claude`、`droid`、`gemini`、`opencode`，或明確要求的 Codex ACP/acpx），以及 `runtime.type` 為 `acp` 的 `agents.list[]` 項目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  僅限 ACP。當 `runtime: "acp"` 時繼續既有的 ACP 控制框架工作階段；原生子代理程式產生作業會忽略此值。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  僅限 ACP。當 `runtime: "acp"` 時，將 ACP 執行輸出串流至父工作階段；原生子代理程式產生作業請省略此項。
</ParamField>
<ParamField path="model" type="string">
  覆寫子代理程式模型。無效值會被略過，子代理程式將使用預設模型執行，並在工具結果中顯示警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆寫子代理程式執行的思考層級。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  設為 `true` 時，為此子代理程式工作階段要求頻道討論串繫結。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，預設值會變成 `session`。`mode: "session"` 需要 `thread: true`。
  如果要求者頻道無法使用討論串繫結，請改用 `mode: "run"`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 會在宣告後立即封存工作階段（仍會透過重新命名保留逐字記錄）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  除非目標子執行階段位於沙箱中，否則 `require` 會拒絕產生作業。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 會將要求者目前的逐字記錄分支到子工作階段。僅限原生子代理程式。繫結至討論串的產生作業預設為 `fork`；未繫結討論串的產生作業預設為 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受頻道傳遞參數（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）。原生子代理程式會將
其最新的助理回合回報給要求者；外部傳遞仍由
父代理程式／要求者代理程式負責。
</Warning>

### 任務名稱與目標指定

`taskName` 是供模型進行協調的識別名稱，不是工作階段金鑰。
當協調者之後可能需要檢查某個子項目時，請用它設定穩定的子項目名稱，例如 `review_subagents`、
`linux_validation` 或 `docs_update`。

目標解析接受完全相符的 `taskName` 和無歧義的
前綴。比對範圍限定於編號式 `/subagents` 目標所使用的相同
作用中／近期目標時間範圍，因此已過期的已完成子項目不會讓
重複使用的識別名稱產生歧義。如果兩個作用中或近期子項目共用相同的
`taskName`，目標便有歧義；請改用清單索引、工作階段金鑰或
執行 ID。

保留目標 `last` 和 `all` 不是有效的 `taskName` 值，
因為它們已有控制用途。

## 工具：`sessions_yield`

結束目前的模型回合並等待執行階段事件（主要是
子代理程式完成事件）作為下一則訊息抵達。產生必要的子項目工作後，如果
要求者必須等到這些工作完成才能產生最終答案，請使用此工具。

`sessions_yield` 是等待的基本操作。請勿僅為偵測子項目是否完成，而以
對 `subagents`、`sessions_list`、`sessions_history` 的輪詢迴圈、Shell
`sleep` 或處理程序輪詢取代它。

只有在工作階段的有效工具清單包含 `sessions_yield` 時才能使用。
某些精簡或自訂工具設定檔可能會提供 `sessions_spawn` 和
`subagents`，但不提供 `sessions_yield`；在此情況下，請勿自行建立
輪詢迴圈來等待完成。

存在作用中子項目時，OpenClaw 會在一般回合中插入精簡的、由執行階段產生的
`Active Subagents` 提示區塊，讓要求者無須輪詢即可查看
目前的子工作階段、執行 ID、狀態、標籤、任務，以及
`taskName` 別名。該區塊中的任務和標籤欄位會以資料形式加上引號，而非作為指示，
因為它們可能源自使用者／模型提供的產生引數。

## 工具：`subagents`

列出由要求者工作階段擁有、已產生的子代理程式執行作業。其範圍限定於
目前的要求者；子項目只能看到自己所控制的子項目。

使用 `subagents` 隨需查看狀態及進行偵錯。使用 `sessions_yield`
等待完成事件。

## 討論串繫結工作階段

當頻道已啟用討論串繫結時，子代理程式可持續繫結至
某個討論串，因此該討論串中的後續使用者訊息會繼續路由至相同的
子代理程式工作階段。

### 支援討論串的頻道

當頻道註冊對話繫結轉接器時，即支援持續性的討論串繫結子代理程式工作階段
（使用 `thread: true` 的 `sessions_spawn`）。內建支援此功能的頻道：**Discord**、
**iMessage**、**Matrix** 和 **Telegram**。Discord 和 Matrix 預設會
建立子討論串；Telegram 和 iMessage 預設會繫結
目前的對話。請使用各頻道的 `threadBindings` 設定鍵來控制
啟用狀態、逾時和 `spawnSessions`。

### 快速流程

<Steps>
  <Step title="產生">
    使用 `thread: true` 的 `sessions_spawn`（並可選擇設定 `mode: "session"`）。
  </Step>
  <Step title="繫結">
    OpenClaw 會在作用中的頻道內建立討論串，或將討論串繫結至該工作階段目標。
  </Step>
  <Step title="路由後續訊息">
    該討論串中的回覆和後續訊息會路由至繫結的工作階段。
  </Step>
  <Step title="檢查逾時">
    使用 `/session idle` 檢查／更新閒置時自動取消聚焦的設定，並使用
    `/session max-age` 控制硬性上限。
  </Step>
  <Step title="解除繫結">
    使用 `/unfocus` 手動解除繫結。
  </Step>
</Steps>

### 手動控制

| 命令               | 效果                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | 將目前的討論串（或建立一個討論串）繫結至子代理程式／工作階段目標                         |
| `/unfocus`         | 移除目前已繫結討論串的繫結                                                                |
| `/agents`          | 列出作用中的執行作業與繫結狀態（`binding:<id>`、`unbound` 或 `bindings unavailable`）     |
| `/session idle`    | 檢查／更新閒置時自動取消聚焦的設定（僅限已聚焦的繫結討論串）                              |
| `/session max-age` | 檢查／更新硬性上限（僅限已聚焦的繫結討論串）                                              |

### 設定開關

- **全域預設值：**`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **頻道覆寫與產生時自動繫結的設定鍵**依轉接器而異。請參閱上方的[支援討論串的頻道](#thread-supporting-channels)。

如需目前的轉接器詳細資訊，請參閱[設定參考](/zh-TW/gateway/configuration-reference)和
[斜線命令](/zh-TW/tools/slash-commands)。

### 允許清單

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可透過明確的 `agentId` 指定為目標的已設定代理程式 ID 清單（`["*"]` 允許任何已設定的目標）。預設值：僅要求者代理程式。如果你設定了清單，並仍希望要求者能使用 `agentId` 產生自身，請將要求者 ID 納入清單。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  當要求者代理程式未設定自己的 `subagents.allowAgents` 時所使用的預設已設定目標代理程式允許清單。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  阻擋省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選擇設定檔）。各代理程式覆寫：`agents.list[].subagents.requireAgentId`。
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  每次呼叫的閘道 `agent` 宣告傳遞嘗試逾時。值為正整數毫秒，並會限制在平台安全的計時器最大值內。暫時性重試可能使宣告的總等待時間超過單次設定的逾時。
</ParamField>

如果要求者工作階段位於沙箱中，`sessions_spawn` 會拒絕
將在非沙箱環境中執行的目標。

### 探索

使用 `agents_list` 查看目前允許供
`sessions_spawn` 使用的代理程式 ID。回應會包含每個列出代理程式的有效
模型和內嵌執行階段中繼資料，讓呼叫者可以區分 OpenClaw、Codex
app-server 和其他已設定的原生執行階段。

`allowAgents` 項目必須指向 `agents.list[]` 中已設定的代理程式 ID。
`["*"]` 表示任何已設定的目標代理程式以及要求者。如果某個代理程式設定
已刪除，但其 ID 仍留在 `allowAgents` 中，`sessions_spawn` 會拒絕該 ID，
而 `agents_list` 會省略它。執行 `openclaw doctor --fix` 以清除過期的
允許清單項目；若目標應在繼承預設值的同時保持可產生，則可新增最小化的
`agents.list[]` 項目。

### 自動封存

- 子代理程式工作階段會在 `agents.defaults.subagents.archiveAfterMinutes` 後自動封存（預設值為 `60`）。
- 封存會使用 `sessions.delete`，並將逐字記錄重新命名為 `*.deleted.<timestamp>`（位於相同資料夾）。
- `cleanup: "delete"` 會在宣告後立即封存（仍會透過重新命名保留逐字記錄）。
- 自動封存採盡力而為；如果閘道重新啟動，待處理的計時器會遺失。
- 已設定的執行逾時**不會**自動封存；它們只會停止執行。工作階段會保留至自動封存。
- 自動封存同樣適用於深度 1 和深度 2 的工作階段。
- 瀏覽器清理與封存清理彼此獨立：執行完成時，會盡力關閉受追蹤的瀏覽器分頁／處理程序，即使逐字記錄／工作階段紀錄仍予以保留。

## 巢狀子代理程式

依預設，子代理程式無法產生自己的子代理程式
（`maxSpawnDepth: 1`）。將 `maxSpawnDepth: 2` 設定為啟用一層
巢狀結構，即**協調器模式**：主代理程式 → 協調器子代理程式 →
工作者子子代理程式。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允許子代理程式產生子項目（預設值：1，範圍 1-5）
        maxChildrenPerAgent: 5, // 每個代理程式工作階段的作用中子項目上限（預設值：5，範圍 1-20）
        maxConcurrent: 8, // 全域並行通道上限（預設值：8）
        runTimeoutSeconds: 900, // sessions_spawn 的預設逾時（0 = 無逾時）
        announceTimeoutMs: 120000, // 每次呼叫的閘道宣告逾時
      },
    },
  },
}
```

### 深度層級

| 深度 | 工作階段鍵格式                               | 角色                                            | 可否產生？                   |
| ----- | -------------------------------------------- | ----------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主代理                                          | 一律可以                     |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子代理（允許深度 2 時為協調器）                 | 僅限 `maxSpawnDepth >= 2`    |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 次級子代理（葉節點工作代理）                    | 絕不可以                     |

### 通知鏈

結果會沿著鏈向上回傳：

1. 深度 2 工作代理完成 → 通知其父代理（深度 1 協調器）。
2. 深度 1 協調器收到通知、彙整結果並完成 → 通知主代理。
3. 主代理收到通知並交付給使用者。

每一層只會看到其直屬子代理的通知。

<Note>
**操作指引：**只啟動子代理工作一次，並等待完成事件，而不是圍繞 `sessions_list`、
`sessions_history`、`/subagents list` 或 `exec` 睡眠命令建立輪詢迴圈。
`sessions_list` 和 `/subagents list` 會讓子工作階段關係聚焦於進行中的工作——
仍在執行的子代理會維持附加狀態，已結束的子代理會在近期時間窗內短暫保持可見，
而僅存在於儲存區中的過時子代理連結，則會在超過其新鮮度時間窗後被忽略。
這可防止舊的 `spawnedBy` / `parentSessionKey` 中繼資料在重新啟動後重新喚回幽靈子代理。
如果你已送出最終答案後才收到子代理完成事件，正確的後續處理是輸出完全一致的靜默權杖
`NO_REPLY` / `no_reply`。
</Note>

### 各深度的工具政策

- 角色與控制範圍會在產生時寫入工作階段中繼資料。這可避免扁平化或還原的工作階段鍵意外重新取得協調器權限。
- **深度 1（協調器，當 `maxSpawnDepth >= 2` 時）：**可使用 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，因此能產生子代理並檢查其狀態。其他工作階段／系統工具仍會被拒絕。
- **深度 1（葉節點，當 `maxSpawnDepth == 1` 時）：**無工作階段工具（目前的預設行為）。
- **深度 2（葉節點工作代理）：**無工作階段工具——深度 2 一律拒絕 `sessions_spawn`。無法再產生子代理。

### 每個代理的產生上限

每個代理工作階段（無論深度）同時最多可有 `maxChildrenPerAgent`
（預設為 `5`）個作用中的子代理。這可防止單一協調器無限制地扇出。

### 級聯停止

停止深度 1 協調器時，會自動停止其所有深度 2 子代理：

- 在主聊天中傳送 `/stop` 會停止所有深度 1 代理，並級聯停止其深度 2 子代理。

## 驗證

子代理的驗證是依據**代理 ID**解析，而非工作階段類型：

- 子代理工作階段鍵為 `agent:<agentId>:subagent:<uuid>`。
- 驗證資訊儲存區會從該代理的 `agentDir` 載入。
- 主代理的驗證設定檔會合併為**備援**；發生衝突時，代理設定檔會覆寫主代理設定檔。

此合併採累加方式，因此主代理設定檔一律可作為備援。
目前尚不支援每個代理完全隔離的驗證。

## 通知

子代理透過通知步驟回報：

- 通知步驟會在子代理工作階段內執行（而非請求者工作階段）。
- 如果子代理回覆完全一致的 `ANNOUNCE_SKIP`，則不會發布任何內容。
- 如果最新的助理文字是完全一致的靜默權杖 `NO_REPLY` / `no_reply`，即使先前已有可見的進度，也會抑制通知輸出。

交付方式取決於請求者深度：

- 頂層請求者工作階段會使用具有外部交付功能的後續 `agent` 呼叫（`deliver=true`）。
- 巢狀請求者子代理工作階段會收到內部後續注入（`deliver=false`），讓協調器可在工作階段內彙整子代理結果。
- 如果巢狀請求者子代理工作階段已不存在，OpenClaw 會在可用時回退到該工作階段的請求者。

對於頂層請求者工作階段，完成模式的直接交付會先解析任何已繫結的對話／討論串路由與鉤子覆寫，接著以請求者工作階段儲存的路由補齊缺少的頻道目標欄位。
如此即使完成事件的來源僅識別頻道，也能將完成結果保留在正確的聊天／主題中。

建立巢狀完成結果時，子代理完成彙整僅限於目前的請求者執行，
以防止先前執行中的過時子代理輸出洩漏到目前的通知中。頻道介面卡可用時，
通知回覆會保留討論串／主題路由。

### 通知內容

通知內容會正規化為穩定的內部事件區塊：

| 欄位           | 來源                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| 來源           | `subagent` 或 `cron`                                                                                     |
| 工作階段 ID    | 子工作階段鍵／ID                                                                                         |
| 類型           | 通知類型 + 任務標籤                                                                                      |
| 狀態           | 從執行階段結果衍生（`ok`、`error`、`timeout` 或 `unknown`）——**不會**從模型文字推斷                     |
| 結果內容       | 子代理最新的可見助理文字                                                                                 |
| 後續處理       | 說明何時應回覆、何時應保持靜默的指示                                                                     |

以失敗結束的執行會回報失敗狀態，但不會重播擷取到的回覆文字。
工具／toolResult 輸出不會提升為子代理結果文字。

### 統計資料行

通知承載內容的結尾會包含統計資料行（即使經過包裝也是如此）：

- 執行時間（例如 `runtime 5m12s`）。
- 權杖用量（輸入／輸出／總計）。
- 設定模型定價時的預估成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 與逐字稿路徑，讓主代理可透過 `sessions_history` 擷取歷程記錄，或檢查磁碟上的檔案。

內部中繼資料僅供協調使用；面向使用者的回覆應以正常的助理語氣重寫。

### 為何偏好 `sessions_history`

在代理回合內讀取子代理逐字稿時，`sessions_history` 是較安全的協調路徑：

- 即使已停用一般用途的記錄遮蔽，仍會遮蔽類似認證資訊／權杖的文字。
- 截斷過長的文字區塊（每個區塊 4000 個字元），並捨棄思考簽章、推理重播承載內容與行內圖片資料。
- 強制執行 80 KB 回應上限；過大的資料列會替換為 `[sessions_history omitted: message too large]`。
- 若有 `nextOffset`，可使用它向後翻頁，查看更早的逐字稿時間窗。
- `sessions_history` **不會**從訊息文字中移除推理標籤、`<relevant-memories>` 輔助結構或工具呼叫 XML——它會回傳接近原始逐字稿格式的結構化內容區塊，只進行遮蔽及大小限制。`/subagents log` 會套用較強的散文清理器（移除推理標籤、記憶輔助結構與工具呼叫 XML），因為它呈現的是純聊天文字行，而不是結構化區塊。
- 當你需要完整且逐位元組一致的逐字稿時，可改為直接檢查磁碟上的原始逐字稿。

## 工具政策

子代理會先使用與父代理或目標代理相同的設定檔與工具政策管線。
之後，OpenClaw 才會套用子代理限制層。

無論深度或角色為何，子代理一律無法使用 `gateway`、`agents_list`、`session_status` 和
`cron`（系統層級／互動式工具，或應由主代理協調的工具）。葉節點子代理（預設的深度 1
行為，以及深度 2 的所有情況）還會無法使用 `subagents`、
`sessions_list`、`sessions_history` 和 `sessions_spawn`。子代理永遠不會取得
`message` 工具——它會在產生時停用，而不是由此拒絕清單篩除——且 `sessions_send`
維持拒絕狀態，因此子代理只能透過通知鏈通訊。

此處的 `sessions_history` 同樣維持為受限且經過清理的回憶檢視——
不是原始逐字稿傾印。

當 `maxSpawnDepth >= 2` 時，深度 1 協調器子代理還會取得
`sessions_spawn`、`subagents`、`sessions_list` 和
`sessions_history`，以便管理其子代理。

### 透過設定覆寫

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // 拒絕規則優先
        deny: ["gateway", "cron"],
        // 若設定 allow，便會成為僅允許清單（拒絕規則仍優先）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` 是最終的僅允許篩選器。它可以縮小
已解析的工具集合，但無法**加回**已被 `tools.profile` 移除的工具。
例如，`tools.profile: "coding"` 包含 `web_search`／`web_fetch`，
但不包含 `browser` 工具。若要讓使用 coding 設定檔的子代理使用瀏覽器自動化，
請在設定檔階段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

只有單一代理應取得瀏覽器自動化時，請使用每個代理的
`agents.list[].tools.alsoAllow: ["browser"]`。

## 並行處理

子代理使用專用的程序內佇列通道：

- **通道名稱：**`subagent`
- **並行數：**`agents.defaults.subagents.maxConcurrent`（預設為 `8`）

## 存活狀態與復原

OpenClaw 不會將缺少 `endedAt` 視為子代理仍然存活的永久證明。
未結束且早於過時執行時間窗的執行（2 小時，或設定的執行逾時加上一小段寬限時間，
取兩者中較長者）將不再於 `/subagents list`、狀態摘要、
後代完成閘門與每工作階段並行檢查中計為作用中／待處理。

閘道重新啟動後，過時且未結束的已還原執行會被清除，除非其子工作階段標記為
`abortedLastRun: true`。因重新啟動而中止的執行仍會為子代理孤立復原流程保持註冊：
過時執行會直接完成而不恢復，仍在新鮮度時間窗內的子工作階段則會先收到合成的恢復訊息，
再清除中止標記。

自動重新啟動復原會以每個子工作階段為界限。如果同一個子代理子工作階段在快速重複卡住的時間窗內，
反覆獲准進行孤立復原，OpenClaw 會在該工作階段上保存復原墓碑，並停止在後續重新啟動時自動恢復它。
執行 `openclaw tasks maintenance --apply` 以調整任務記錄，或執行
`openclaw doctor --fix` 以清除已設墓碑工作階段上過時的中止復原旗標。

<Note>
如果產生子代理時因閘道 `PAIRING_REQUIRED` /
`scope-upgrade` 而失敗，請先檢查 RPC 呼叫者，再編輯配對狀態。
當呼叫者已在閘道請求內容中執行時，內部 `sessions_spawn` 協調會在程序內派送，
因此不會開啟迴路 WebSocket，也不依賴命令列介面的已配對裝置範圍基準。
閘道程序外部的呼叫者仍會使用 WebSocket 備援，以
`client.id: "gateway-client"` 與 `client.mode: "backend"`，
透過直接迴路共用權杖／密碼驗證進行連線。遠端呼叫者、明確的
`deviceIdentity`、明確的裝置權杖路徑，以及瀏覽器／節點用戶端，
仍需經過一般裝置核准才能升級範圍。
</Note>

## 停止

- 在請求者聊天中傳送 `/stop` 會中止請求者工作階段，並停止從該工作階段產生的所有作用中子代理執行，且會級聯至巢狀子代理。

## 限制

- 子代理的宣告是**盡力而為**。如果閘道重新啟動，待處理的「回傳宣告」工作將會遺失。
- 子代理仍共用同一個閘道程序的資源；請將 `maxConcurrent` 視為安全閥。
- `sessions_spawn` 一律不會阻塞：它會立即傳回 `{ status: "accepted", runId, childSessionKey }`。
- 子代理的上下文僅注入 `AGENTS.md` 和 `TOOLS.md`（不包含 `SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。Codex 原生子代理遵循相同邊界：`TOOLS.md` 會保留在繼承的 Codex 執行緒指示中，而僅限父代理使用的人設、身分與使用者檔案，則會以僅限當次回合的協作指示注入，避免子代理複製這些內容。
- 最大巢狀深度為 5（`maxSpawnDepth` 範圍：1-5）。大多數使用情境建議使用深度 2。
- `maxChildrenPerAgent` 限制每個工作階段的作用中子代理數量（預設為 `5`，範圍為 `1-20`）。

## 相關內容

- [工作階段工具與狀態變更](/zh-TW/concepts/session-tool)
- [ACP 代理](/zh-TW/tools/acp-agents)
- [代理傳送](/zh-TW/tools/agent-send)
- [背景任務](/zh-TW/automation/tasks)
- [多代理沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
