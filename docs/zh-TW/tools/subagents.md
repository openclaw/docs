---
read_when:
    - 你想透過代理程式在背景執行工作或進行平行處理
    - 你正在變更 `sessions_spawn` 或子代理工具政策
    - 你正在實作或疑難排解綁定討論串的子代理工作階段
sidebarTitle: Sub-agents
summary: 啟動隔離的背景代理程式執行，並將結果通知回請求者的聊天對話
title: 子代理程式
x-i18n:
    generated_at: "2026-07-16T12:07:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8c670d5c7f92d5be8ebce7b1140d9bfd7956b10f38144d275ec84c6af98ae04b
    source_path: tools/subagents.md
    workflow: 16
---

子代理是從現有代理執行中產生的背景代理執行。
每個子代理都在自己的工作階段（`agent:<agentId>:subagent:<uuid>`）中執行，並在完成後將結果**回報**至請求者的聊天頻道。
每次子代理執行都會以[背景任務](/zh-TW/automation/tasks)追蹤。

目標：

- 平行處理研究、長時間任務和緩慢的工具工作，而不阻塞主要執行。
- 預設讓子代理彼此隔離（工作階段分離、可選的沙箱隔離）。
- 讓工具介面不易遭到誤用：子代理預設**不會**取得工作階段或訊息工具。
- 支援可設定的巢狀深度，以供協調器模式使用。

<Note>
**成本注意事項：**每個子代理預設都有自己的上下文和權杖用量。
對於繁重或重複性的任務，請為子代理設定成本較低的模型，並透過
`agents.defaults.subagents.model` 或各代理覆寫設定，讓主要代理使用品質較高的模型。
當子代理確實需要請求者目前的對話記錄時，請使用
`context: "fork"` 產生子代理。綁定討論串的子代理工作階段預設為
`context: "fork"`，因為它們會將目前的對話分支至後續討論串。
</Note>

## 斜線命令

`/subagents` 會檢查**目前工作階段**的子代理執行：

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` 會顯示執行中繼資料（狀態、時間戳記、工作階段 ID、
對話記錄路徑、清理）。`/subagents log` 會列印某次執行近期的聊天輪次；
加入 `tools` 權杖可包含工具呼叫／結果訊息（預設省略）。
若要在代理輪次中取得範圍受限且經安全篩選的回顧檢視，請使用
`sessions_history`；若要查看原始完整對話記錄，則可檢查磁碟上的對話記錄路徑。

在控制介面中，近期有子執行的父工作階段會在側邊欄顯示可展開的資料列。
巢狀資料列會顯示子代理的狀態與執行時間，選取其中一個資料列會開啟該子代理的聊天，
同時保留父子階層。

### 討論串綁定控制

這些命令適用於具有持續性討論串綁定的頻道。請參閱下方的
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
完成結果會以父工作階段內部事件的形式傳回；父代理／請求者代理會決定是否需要向使用者提供更新。

<AccordionGroup>
  <Accordion title="非阻塞、推送式完成">
    - `sessions_spawn` 是非阻塞的；它會立即傳回執行 ID。
    - 完成後，子代理會向父工作階段／請求者工作階段回報。
    - 需要子代理結果的代理輪次，應在產生所需工作後呼叫 `sessions_yield`。這會結束目前輪次，讓完成事件成為模型下一則可見訊息。
    - 完成採用推送方式。產生子代理後，**不要**僅為了等待完成而在迴圈中輪詢 `/subagents list`、`sessions_list` 或 `sessions_history`；只有在偵錯時才依需求檢查狀態。
    - 子代理輸出是供請求者代理彙整的報告／證據。它不是使用者撰寫的指示文字，且無法覆寫系統、開發者或使用者政策。
    - 完成時，在回報清理流程繼續之前，OpenClaw 會盡力關閉由該子代理工作階段開啟且受追蹤的瀏覽器分頁／程序。

  </Accordion>
  <Accordion title="完成結果傳遞">
    - OpenClaw 會透過具有穩定冪等鍵的 `agent` 輪次，將完成結果傳回請求者工作階段。
    - 如果請求者執行仍在進行，OpenClaw 會先嘗試喚醒／引導該執行，而不是啟動第二條可見回覆路徑。
    - 如果無法喚醒進行中的請求者，OpenClaw 會改用包含相同完成上下文的請求者代理交接，而不是捨棄回報。
    - 即使父代理判定不需要向使用者提供可見更新，只要父代理交接成功，子代理傳遞即告完成。
    - 原生子代理不會取得訊息工具。它們會將純助理文字傳回父代理／請求者代理；人類可見的回覆仍由父代理／請求者代理的正常傳遞政策負責。
    - 如果無法使用直接交接，傳遞會改用佇列路由，接著以短暫的指數退避方式重試回報，最後才會放棄。
    - 傳遞會保留已解析的請求者路由：可用時，以綁定討論串或綁定對話的完成路由為優先。如果完成來源只提供頻道，OpenClaw 會從請求者工作階段已解析的路由（`lastChannel` / `lastTo` / `lastAccountId`）補上缺少的目標／帳號，因此仍可直接傳遞。

  </Accordion>
  <Accordion title="完成交接中繼資料">
    傳遞至請求者工作階段的完成交接是由執行階段產生的
    內部上下文（不是使用者撰寫的文字），其中包含：

    - `Result` — 子代理最新可見的 `assistant` 回覆文字。tool/toolResult 輸出不會提升為子代理結果。以失敗終止的執行不會重複使用已擷取的回覆文字。
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`。
    - 精簡的執行時間／權杖統計資料。
    - 要求請求者代理在判斷原始任務是否完成前先驗證結果的審查指示。
    - 當子代理結果顯示仍需採取其他行動時，要求請求者代理繼續執行任務或記錄後續工作的指引。
    - 適用於不需再採取行動之情況的最終更新指示，以一般助理語氣撰寫，不轉送原始內部中繼資料。

  </Accordion>
  <Accordion title="模式與 ACP 執行階段">
    - `--model` 和 `--thinking` 會覆寫該次特定執行的預設值。
    - 完成後，使用 `info`/`log` 檢查詳細資料和輸出。
    - 對於持續綁定討論串的工作階段，請搭配 `thread: true` 和 `mode: "session"` 使用 `sessions_spawn`。
    - 如果請求者頻道不支援討論串綁定，請使用 `mode: "run"`，而不要重試不可能成功的討論串綁定組合。
    - 對於 ACP 控制框架工作階段（Claude Code、Gemini CLI、OpenCode，或明確指定的 Codex ACP/acpx），當工具宣告該執行階段時，請搭配 `runtime: "acp"` 使用 `sessions_spawn`。偵錯完成結果或代理對代理迴圈時，請參閱 [ACP 傳遞模型](/zh-TW/tools/acp-agents#delivery-model)。啟用 `codex` 外掛時，除非使用者明確要求 ACP/acpx，否則 Codex 聊天／討論串控制應優先使用 `/codex ...`，而非 ACP。
    - 在 ACP 尚未啟用、請求者仍處於沙箱中，或尚未載入 `acpx` 等後端外掛前，OpenClaw 會隱藏 `runtime: "acp"`。`runtime: "acp"` 預期接收外部 ACP 控制框架 ID，或包含 `runtime.type="acp"` 的 `agents.list[]` 項目；一般 OpenClaw 設定代理應使用來自 `agents_list` 的預設子代理執行階段。

  </Accordion>
</AccordionGroup>

## 上下文模式

除非呼叫者明確要求分支目前的對話記錄，否則原生子代理會以隔離方式啟動。

| 模式       | 使用時機                                                                                                                         | 行為                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、獨立實作、緩慢的工具工作，或任何可在任務文字中完整說明的工作                           | 建立乾淨的子對話記錄。這是預設模式，可降低權杖用量。  |
| `fork`     | 依賴目前對話、先前工具結果，或請求者對話記錄中既有細緻指示的工作 | 在子代理啟動前，將請求者對話記錄分支至子工作階段。 |

請謹慎使用 `fork`。它適用於需要上下文的委派，不是撰寫清楚任務提示的替代方案。

## 工具：`sessions_spawn`

在全域 `subagent` 通道上使用 `deliver: false` 啟動子代理執行，
接著執行回報步驟，並將回報內容張貼至請求者的聊天頻道。

是否可用取決於呼叫者的有效工具政策。內建
`coding` 設定檔包含 `sessions_spawn`；`messaging` 和 `minimal`
則不包含。`full` 允許所有工具。對於使用較受限設定檔但仍應能委派工作的代理，
請加入 `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]`，或使用 `tools.profile: "coding"`。
頻道／群組、提供者、沙箱及各代理允許／拒絕政策，
仍可在設定檔階段後移除該工具。請從同一工作階段使用 `/tools`
確認有效工具清單。

**預設值：**

- **模型：**除非設定 `agents.defaults.subagents.model`（或各代理的 `agents.list[].subagents.model`），否則原生子代理會繼承呼叫者的模型。ACP 執行階段產生作業在有設定子代理模型時會使用相同模型；否則 ACP 控制框架會保留自己的預設值。明確指定的 `sessions_spawn.model` 仍具有優先權。
- **思考：**除非設定 `agents.defaults.subagents.thinking`（或各代理的 `agents.list[].subagents.thinking`），否則原生子代理會繼承呼叫者的設定。ACP 執行階段產生作業也會將 `agents.defaults.models["provider/model"].params.thinking` 套用至所選模型。明確指定的 `sessions_spawn.thinking` 仍具有優先權。
- **執行逾時：**設定 `agents.defaults.subagents.runTimeoutSeconds` 時，OpenClaw 會使用該值；否則會改用 `0`（不設逾時）。`sessions_spawn` 不接受每次呼叫的逾時覆寫值。
- **任務傳遞：**原生子代理會在第一則可見的 `[Subagent Task]` 訊息中接收委派任務。子代理系統提示包含執行階段規則與路由上下文，不包含隱藏的重複任務內容。

接受的原生子代理產生作業會在工具結果中包含已解析的子代理模型中繼資料：
`resolvedModel` 包含套用的模型參照，而當參照包含提供者前綴時，
`resolvedProvider` 會包含該前綴。

### 委派提示模式

`agents.defaults.subagents.delegationMode` 只控制提示指引；它不會變更工具政策或強制進行委派。

- `suggest`（預設）：保留標準提示，建議對規模較大或耗時較長的工作使用子代理。
- `prefer`：指示主要代理保持回應能力，並透過 `sessions_spawn` 委派所有比直接回覆更複雜的工作。

各代理覆寫設定：`agents.list[].subagents.delegationMode`。

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
  子代理的任務描述。
</ParamField>
<ParamField path="taskName" type="string">
  選用的穩定識別名稱，用於在後續狀態輸出中識別特定子項目。必須符合 `[a-z][a-z0-9_-]{0,63}`，且不可為 `last` 或 `all` 等保留目標。
</ParamField>
<ParamField path="label" type="string">
  選用、方便人類閱讀的標籤。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允許時，於另一個已設定的代理 ID 下衍生。
</ParamField>
<ParamField path="cwd" type="string">
  子執行作業的選用任務工作目錄。原生子代理仍會從目標代理工作區載入啟動檔案；`cwd` 只會變更執行階段工具與命令列介面控制框架執行委派工作的所在位置。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 僅適用於外部 ACP 控制框架（`claude`、`droid`、`gemini`、`opencode`，或明確要求的 Codex ACP/acpx），以及 `runtime.type` 為 `acp` 的 `agents.list[]` 項目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  僅限 ACP。於 `runtime: "acp"` 時恢復現有的 ACP 控制框架工作階段；原生子代理衍生會忽略此項。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  僅限 ACP。於 `runtime: "acp"` 時，將 ACP 執行輸出串流至父工作階段；原生子代理衍生請省略此項。
</ParamField>
<ParamField path="model" type="string">
  覆寫子代理模型。無效值會被略過，子代理將使用預設模型執行，且工具結果中會顯示警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆寫子代理執行的思考層級。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  當 `true` 時，要求為此子代理工作階段繫結頻道討論串。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，預設值會變為 `session`。`mode: "session"` 需要 `thread: true`。
  如果要求者頻道無法使用討論串繫結，請改用 `mode: "run"`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 會在公告後立即封存工作階段（仍會透過重新命名保留逐字記錄）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  除非目標子執行階段位於沙箱中，否則 `require` 會拒絕衍生。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 會將要求者目前的逐字記錄分支至子工作階段。僅限原生子代理。繫結討論串的衍生預設為 `fork`；未繫結討論串的衍生預設為 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受頻道傳遞參數（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）。原生子代理會將
其最新的助理回合回報給要求者；外部傳遞仍由
父代理／要求者代理負責。
</Warning>

### 任務名稱與目標指定

`taskName` 是供模型協調使用的識別名稱，而非工作階段金鑰。
當協調者之後可能需要檢查該子項目時，請用它設定穩定的子項目名稱，例如 `review_subagents`、
`linux_validation` 或 `docs_update`。

目標解析接受完全相符的 `taskName` 及無歧義的
前綴。比對範圍限定於編號 `/subagents` 目標所使用的相同作用中／近期目標視窗，
因此已完成的過期子項目不會使重複使用的識別名稱
產生歧義。如果兩個作用中或近期子項目共用相同的
`taskName`，目標便有歧義；請改用清單索引、工作階段金鑰或
執行 ID。

保留目標 `last` 與 `all` 不是有效的 `taskName` 值，
因為它們已有控制用途。

## 工具：`sessions_yield`

結束目前的模型回合並等待執行階段事件（主要是
子代理完成事件）作為下一則訊息到達。當已衍生必要的子項目工作，
但要求者必須等這些工作完成後才能產生最終
答案時，請使用此工具。

`sessions_yield` 是等待用的基本操作。不要以輪詢
`subagents`、`sessions_list`、`sessions_history` 的迴圈、殼層
`sleep` 或程序輪詢取代它，只為偵測子項目是否完成。

僅當工作階段的有效工具清單包含
`sessions_yield` 時才使用它。部分精簡或自訂工具設定檔可能會提供 `sessions_spawn` 與
`subagents`，但不提供 `sessions_yield`；在此情況下，不要自行設計
輪詢迴圈來等待完成。

當存在作用中的子項目時，OpenClaw 會將精簡且由執行階段產生的
`Active Subagents` 提示區塊注入一般回合，讓要求者無須輪詢即可查看
目前的子工作階段、執行 ID、狀態、標籤、任務及
`taskName` 別名。該區塊中的任務與標籤欄位會以資料形式
加上引號，而非作為指令，因為它們可能源自
使用者／模型提供的衍生引數。

## 工具：`subagents`

列出由要求者工作階段擁有的已衍生子代理執行作業。其範圍限定於
目前要求者；子項目只能查看自己控制的子項目。

使用 `subagents` 進行隨需狀態查詢與偵錯。使用 `sessions_yield`
等待完成事件。

## 討論串繫結工作階段

為頻道啟用討論串繫結後，子代理可以持續繫結至
某個討論串，使該討論串中的後續使用者訊息繼續路由至
同一個子代理工作階段。

### 支援討論串的頻道

當頻道註冊對話
繫結配接器時，即支援持續的討論串繫結子代理工作階段
（`sessions_spawn` 搭配 `thread: true`）。內建且支援此功能的頻道：**Discord**、
**iMessage**、**Matrix** 與 **Telegram**。Discord 與 Matrix 預設會
建立子討論串；Telegram 與 iMessage 預設會繫結
目前的對話。請使用各頻道的 `threadBindings` 設定鍵來控制
啟用狀態、逾時及 `spawnSessions`。

### 快速流程

<Steps>
  <Step title="衍生">
    使用 `sessions_spawn` 搭配 `thread: true`（也可選擇搭配 `mode: "session"`）。
  </Step>
  <Step title="繫結">
    OpenClaw 會在作用中頻道建立討論串或將討論串繫結至該工作階段目標。
  </Step>
  <Step title="路由後續訊息">
    該討論串中的回覆與後續訊息會路由至已繫結的工作階段。
  </Step>
  <Step title="檢查逾時">
    使用 `/session idle` 檢查／更新閒置時自動取消聚焦的設定，並
    使用 `/session max-age` 控制硬性上限。
  </Step>
  <Step title="解除連結">
    使用 `/unfocus` 手動解除連結。
  </Step>
</Steps>

### 手動控制

| 命令            | 效果                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | 將目前討論串（或建立一個討論串）繫結至子代理／工作階段目標                     |
| `/unfocus`         | 移除目前已繫結討論串的繫結                                           |
| `/agents`          | 列出作用中的執行作業及繫結狀態（`binding:<id>`、`unbound` 或 `bindings unavailable`） |
| `/session idle`    | 檢查／更新閒置時自動取消聚焦（僅限已聚焦的繫結討論串）                             |
| `/session max-age` | 檢查／更新硬性上限（僅限已聚焦的繫結討論串）                                      |

### 設定開關

- **全域預設值：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **頻道覆寫與衍生時自動繫結的設定鍵**因配接器而異。請參閱上方的[支援討論串的頻道](#thread-supporting-channels)。

如需目前配接器的詳細資料，請參閱[設定參考](/zh-TW/gateway/configuration-reference)與
[斜線命令](/zh-TW/tools/slash-commands)。

### 允許清單

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可透過明確的 `agentId` 指定為目標的已設定代理 ID 清單（`["*"]` 允許任何已設定的目標）。預設值：僅要求者代理。如果設定清單後仍希望要求者能以 `agentId` 衍生自身，請將要求者 ID 納入清單。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  當要求者代理未設定自己的 `subagents.allowAgents` 時所使用的預設目標代理允許清單。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選取設定檔）。各代理覆寫：`agents.list[].subagents.requireAgentId`。
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  閘道 `agent` 公告傳遞嘗試的單次呼叫逾時。值為正整數毫秒，且會限制於平台安全的計時器最大值。暫時性重試可能使公告的總等待時間超過一次設定的逾時。
</ParamField>

如果要求者工作階段位於沙箱中，`sessions_spawn` 會拒絕
將在非沙箱環境執行的目標。

### 探索

使用 `agents_list` 查看目前允許用於
`sessions_spawn` 的代理 ID。回應會包含列出的每個代理之有效
模型與內嵌執行階段中繼資料，讓呼叫端能區分 OpenClaw、Codex
應用程式伺服器及其他已設定的原生執行階段。

`allowAgents` 項目必須指向 `agents.list[]` 中已設定的代理 ID。
`["*"]` 表示任何已設定的目標代理加上要求者。如果刪除某個代理設定，
但其 ID 仍存在於 `allowAgents`，`sessions_spawn` 會拒絕該 ID，
且 `agents_list` 會將其省略。執行 `openclaw doctor --fix` 以清除過期的
允許清單項目；若目標應在繼承預設值的同時仍可被衍生，則可新增最精簡的 `agents.list[]` 項目。

### 自動封存

- 子代理工作階段會在 `agents.defaults.subagents.archiveAfterMinutes` 後自動封存（預設為 `60`）。
- 封存使用 `sessions.delete`，並將逐字記錄重新命名為 `*.deleted.<timestamp>`（位於相同資料夾）。
- `cleanup: "delete"` 會在公告後立即封存（仍會透過重新命名保留逐字記錄）。
- 自動封存採盡力而為；如果閘道重新啟動，待處理的計時器將會遺失。
- 設定的執行逾時**不會**自動封存；它們只會停止執行。工作階段會保留至自動封存。
- 自動封存同樣適用於深度 1 與深度 2 的工作階段。
- 瀏覽器清理與封存清理彼此獨立：執行完成時會盡力關閉受追蹤的瀏覽器分頁／程序，即使逐字記錄／工作階段紀錄仍保留亦然。

## 巢狀子代理

子代理預設無法衍生自己的子代理
（`maxSpawnDepth: 1`）。設定 `maxSpawnDepth: 2` 可啟用一層
巢狀結構，也就是**協調器模式**：主代理 → 協調器子代理 →
工作者子子代理。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允許子代理衍生子項目（預設值：1，範圍 1-5）
        maxChildrenPerAgent: 5, // 每個代理工作階段的作用中子項目數量上限（預設值：5，範圍 1-20）
        maxConcurrent: 8, // 全域並行通道上限（預設值：8）
        runTimeoutSeconds: 900, // sessions_spawn 的預設逾時（0 = 無逾時）
        announceTimeoutMs: 120000, // 每次呼叫的閘道公告逾時
      },
    },
  },
}
```

### 深度層級

| 深度 | 工作階段鍵格式                            | 角色                                          | 可衍生？                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主代理                                    | 一律可以                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子代理（允許深度 2 時為協調代理） | 僅當 `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 孫代理（葉節點工作代理）                   | 絕不                        |

### 宣告鏈

結果會沿鏈向上回傳：

1. 深度 2 工作代理完成 → 向其父代理（深度 1 協調代理）宣告。
2. 深度 1 協調代理收到宣告、彙整結果並完成 → 向主代理宣告。
3. 主代理收到宣告並傳遞給使用者。

每一層只會看到其直接子代理的宣告。

<Note>
**操作指引：**只啟動子工作一次，並等待完成事件，而不要圍繞 `sessions_list`、
`sessions_history`、`/subagents list` 或 `exec` 睡眠命令建立輪詢迴圈。
`sessions_list` 和 `/subagents list` 會讓子工作階段關係聚焦於進行中的工作——仍在運作的子代理會保持附加，已結束的子代理會在短暫的近期視窗內維持可見，而僅存在於過時儲存區的子代理連結則會在超過新鮮度視窗後被忽略。這可防止舊的 `spawnedBy` /
`parentSessionKey` 中繼資料在重新啟動後使幽靈子代理死灰復燃。如果你在已傳送最終答案後才收到子代理完成事件，正確的後續動作是使用完全一致的靜默權杖
`NO_REPLY` / `no_reply`。
</Note>

### 依深度區分的工具政策

- 角色與控制範圍會在衍生時寫入工作階段中繼資料。這可避免扁平化或還原後的工作階段鍵意外重新取得協調代理權限。
- **深度 1（協調代理，當 `maxSpawnDepth >= 2`）：**會取得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便衍生子代理並檢查其狀態。其他工作階段／系統工具仍會遭拒。
- **深度 1（葉節點，當 `maxSpawnDepth == 1`）：**沒有工作階段工具（目前的預設行為）。
- **深度 2（葉節點工作代理）：**沒有工作階段工具——在深度 2 一律拒絕 `sessions_spawn`。無法進一步衍生子代理。

### 每個代理的衍生限制

每個代理工作階段（無論深度）同時最多可有 `maxChildrenPerAgent`
個（預設 `5`）作用中的子代理。這可防止單一協調代理失控地扇出。

### 級聯停止

停止深度 1 協調代理時，會自動停止其所有深度 2
子代理：

- 主聊天中的 `/stop` 會停止所有深度 1 代理，並級聯停止其深度 2 子代理。

## 驗證

子代理的驗證是依 **代理 ID** 解析，而非依工作階段類型：

- 子代理工作階段鍵為 `agent:<agentId>:subagent:<uuid>`。
- 驗證儲存區會從該代理的 `agentDir` 載入。
- 主代理的驗證設定檔會合併為**備援**；發生衝突時，以代理設定檔覆寫主代理設定檔。

此合併採累加方式，因此主代理設定檔一律可作為
備援。目前尚不支援每個代理完全隔離的驗證。

## 宣告

子代理會透過宣告步驟回報：

- 宣告步驟會在子代理工作階段內執行（而非請求者工作階段）。
- 如果子代理的回覆與 `ANNOUNCE_SKIP` 完全一致，便不會發布任何內容。
- 如果最新的助理文字是完全一致的靜默權杖 `NO_REPLY` / `no_reply`，即使先前曾有可見的進度，也會抑制宣告輸出。

傳遞方式取決於請求者深度：

- 頂層請求者工作階段會使用具外部傳遞功能（`deliver=true`）的後續 `agent` 呼叫。
- 巢狀請求者子代理工作階段會收到內部後續注入（`deliver=false`），讓協調代理能在工作階段內彙整子代理結果。
- 如果巢狀請求者子代理工作階段已不存在，OpenClaw 會在可用時改用該工作階段的請求者。

對於頂層請求者工作階段，完成模式的直接傳遞會先解析任何綁定的對話／討論串路由及鉤子覆寫，接著從請求者工作階段儲存的路由補入缺少的頻道目標欄位。如此一來，即使完成來源只識別出頻道，完成訊息仍會送到正確的聊天／主題。

建構巢狀完成發現項目時，子代理完成彙整的範圍僅限於目前的請求者執行，避免先前執行中過時的子代理輸出洩漏至目前宣告。頻道轉接器可用時，宣告回覆會保留討論串／主題路由。

### 宣告內容

宣告內容會正規化為穩定的內部事件區塊：

| 欄位          | 來源                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| 來源         | `subagent` 或 `cron`                                                                                     |
| 工作階段 ID    | 子工作階段鍵／ID                                                                                     |
| 類型           | 宣告類型 + 任務標籤                                                                               |
| 狀態         | 從執行階段結果衍生（`ok`、`error`、`timeout` 或 `unknown`）——**不會**從模型文字推斷 |
| 結果內容 | 子代理最新的可見助理文字                                                             |
| 後續動作      | 說明何時應回覆或保持靜默的指示                                                      |

終止時失敗的執行會回報失敗狀態，而不會重播擷取到的
回覆文字。工具／工具結果輸出不會提升為子代理結果文字。

### 統計資料行

宣告承載內容的末尾會包含統計資料行（即使經過包裝也一樣）：

- 執行時間（例如 `runtime 5m12s`）。
- 權杖用量（輸入／輸出／總計）。
- 設定模型定價時的預估成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 及逐字記錄路徑，讓主代理能透過 `sessions_history` 擷取歷程記錄，或檢查磁碟上的檔案。

內部中繼資料僅供協調用途；面向使用者的回覆
應改寫為一般助理語氣。

### 為何偏好 `sessions_history`

`sessions_history` 是在代理回合中讀取子代理
逐字記錄時較安全的協調路徑：

- 即使停用一般用途的記錄遮罩，仍會遮罩類似認證資訊／權杖的文字。
- 截斷過長的文字區塊（每個區塊 4000 個字元），並捨棄思考簽章、推理重播承載內容及行內圖片資料。
- 強制執行 80 KB 的回應上限；過大的資料列會替換為 `[sessions_history omitted: message too large]`。
- 若有 `nextOffset`，可用它向後翻閱較舊的逐字記錄視窗。
- `sessions_history` **不會**移除訊息文字中的推理標籤、`<relevant-memories>` 鷹架或工具呼叫 XML——它會傳回接近原始逐字記錄格式的結構化內容區塊，只進行遮罩並限制大小。`/subagents log` 則會套用較重的散文清理器（移除推理標籤、記憶鷹架及工具呼叫 XML），因為它呈現的是純文字聊天行，而非結構化區塊。
- 需要完整、逐位元組一致的逐字記錄時，最後手段是直接檢查磁碟上的原始逐字記錄。

## 工具政策

子代理一開始會使用與父代理或目標代理相同的設定檔和工具政策管線。之後，OpenClaw 才會套用子代理限制
層。

無論深度或角色為何，子代理一律無法使用 `gateway`、`agents_list`、`session_status` 及
`cron`（系統層級／互動式工具，或應由主代理協調的
工具）。葉節點子代理（預設的深度 1
行為，以及深度 2 的一切情況）還會額外無法使用 `subagents`、
`sessions_list`、`sessions_history` 及 `sessions_spawn`。子代理絕不會
取得 `message` 工具——它會在衍生時停用，而非由
此拒絕清單篩除——且 `sessions_send` 仍遭拒絕，讓子代理
只能透過宣告鏈進行通訊。

此處的 `sessions_history` 也仍是受限且經過清理的回想檢視——它
不是原始逐字記錄傾印。

當 `maxSpawnDepth >= 2` 時，深度 1 協調子代理還會額外
取得 `sessions_spawn`、`subagents`、`sessions_list` 及
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
        // 拒絕優先
        deny: ["gateway", "cron"],
        // 若設定 allow，便會變成僅允許清單（deny 仍然優先）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` 是最終的僅允許篩選器。它可以縮小
已解析的工具集，但無法**加回**已由 `tools.profile` 移除的工具。例如，`tools.profile: "coding"` 包含
`web_search`/`web_fetch`，但不包含 `browser` 工具。若要讓
程式設計設定檔的子代理使用瀏覽器自動化，請在
設定檔階段加入瀏覽器：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

只有一個代理應取得瀏覽器自動化時，請使用每個代理各自的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 並行處理

子代理會使用專用的程序內佇列通道：

- **通道名稱：**`subagent`
- **並行數：**`agents.defaults.subagents.maxConcurrent`（預設 `8`）

## 存活性與復原

OpenClaw 不會將缺少 `endedAt` 視為子代理仍然存活的永久證明。未結束且早於過時執行視窗的執行
（2 小時，或設定的執行逾時加上一小段寬限期，
取兩者中較長者）不再於 `/subagents list`、
狀態摘要、後代完成閘控及每工作階段
並行檢查中計為作用中／待處理。

閘道重新啟動後，除非其子工作階段標記為 `abortedLastRun: true`，
否則會修剪過時且未結束的已還原執行。因重新啟動而中止的
執行仍會保留註冊，以供子代理孤兒復原流程使用：過時的
執行會直接完成，而不會恢復；仍屬新鮮的子工作階段則會先收到
合成的恢復訊息，之後才清除中止標記。

每個子工作階段的自動重新啟動復原次數有限。如果同一個
子代理在快速再次卡死的視窗內重複獲准進行孤兒復原，OpenClaw 會在該
工作階段持久儲存復原墓碑，並停止在之後的重新啟動中自動恢復它。請執行
`openclaw tasks maintenance --apply` 以協調任務記錄，或執行
`openclaw doctor --fix` 以清除已設墓碑工作階段中
過時的中止復原旗標。

<Note>
如果產生子代理失敗，並顯示閘道 `PAIRING_REQUIRED` /
`scope-upgrade`，請先檢查 RPC 呼叫端，再編輯配對狀態。
當呼叫端已在閘道請求情境中執行時，內部 `sessions_spawn` 協調會在程序內分派，因此不會
開啟迴路 WebSocket，也不依賴命令列介面的已配對裝置範圍基準。
閘道程序之外的呼叫端仍會使用 WebSocket 備援，其方式為透過直接迴路的
共用權杖／密碼驗證，以 `client.id: "gateway-client"` 搭配 `client.mode: "backend"`。
遠端呼叫端、明確的 `deviceIdentity`、明確的裝置權杖路徑，以及瀏覽器／節點用戶端，
仍需一般裝置核准才能提升範圍。
</Note>

## 停止

- 在請求端聊天中傳送 `/stop`，會中止請求端工作階段，並停止由其產生的所有作用中子代理執行，且會連鎖停止巢狀子代理。

## 限制

- 子代理宣告採用**盡力而為**。若閘道重新啟動，待處理的「回傳宣告」工作將會遺失。
- 子代理仍共用相同的閘道程序資源；請將 `maxConcurrent` 視為安全閥。
- `sessions_spawn` 一律為非阻塞：它會立即傳回 `{ status: "accepted", runId, childSessionKey }`。
- 子代理情境只會注入 `AGENTS.md` 和 `TOOLS.md`（不包含 `SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。Codex 原生子代理遵循相同邊界：`TOOLS.md` 會保留在繼承的 Codex 對話串指示中，而僅限父代理使用的人格、身分與使用者檔案，則會以限定於該回合的協作指示注入，使子代理不會複製它們。
- 最大巢狀深度為 5（`maxSpawnDepth` 範圍：1-5）。大多數使用情境建議使用深度 2。
- `maxChildrenPerAgent` 會限制每個工作階段的作用中子代理數量（預設為 `5`，範圍為 `1-20`）。

## 相關內容

- [工作階段工具與狀態變更](/zh-TW/concepts/session-tool)
- [ACP 代理](/zh-TW/tools/acp-agents)
- [代理傳送](/zh-TW/tools/agent-send)
- [背景工作](/zh-TW/automation/tasks)
- [多代理沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
