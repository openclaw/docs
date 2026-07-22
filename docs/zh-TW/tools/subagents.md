---
read_when:
    - 你想透過代理程式在背景或平行執行工作
    - 你正在變更 `sessions_spawn` 或子代理工具政策
    - 你正在實作或疑難排解綁定討論串的子代理工作階段
sidebarTitle: Sub-agents
summary: 啟動隔離的背景代理執行，並將結果回報至請求者的聊天對話中
title: 子代理程式
x-i18n:
    generated_at: "2026-07-22T10:53:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e45b32fdb177c52ed785287712b9b6c2c30bbe392f0ce975970910ff91ed30ed
    source_path: tools/subagents.md
    workflow: 16
---

子代理是由現有代理執行所衍生的背景代理執行。
每個子代理都在自己的工作階段（`agent:<agentId>:subagent:<uuid>`）中執行，並且
在完成時，會將結果**公告**回請求者的聊天頻道。
每次子代理執行都會以[背景任務](/zh-TW/automation/tasks)追蹤。

目標：

- 平行處理研究、長時間任務及緩慢的工具作業，而不阻塞主要執行。
- 預設隔離子代理（分離工作階段，可選擇使用沙箱）。
- 讓工具介面不易遭到誤用：子代理預設**不會**取得工作階段或訊息工具。
- 支援可設定的巢狀深度，以用於協調器模式。

<Note>
**成本注意事項：**預設情況下，每個子代理都有自己的上下文和權杖用量。
對於繁重或重複性的任務，請為子代理設定成本較低的模型，
並透過 `agents.defaults.subagents.model` 或個別代理覆寫，讓主要代理使用品質較高的模型。
當子代理確實需要請求者目前的對話記錄時，請使用
`context: "fork"` 衍生它。繫結至討論串的子代理工作階段預設為
`context: "fork"`，因為它們會將目前對話分支至後續討論串。
</Note>

## 斜線命令

`/subagents` 會檢查**目前工作階段**的子代理執行：

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` 會顯示執行中繼資料（狀態、時間戳記、工作階段 ID、
對話記錄路徑、清理）。`/subagents log` 會列印某次執行最近的聊天輪次；
加入 `tools` 權杖即可包含工具呼叫／結果訊息（預設省略）。
在代理輪次中使用 `sessions_history` 可取得有範圍限制且經過安全篩選的回顧檢視，
或檢查磁碟上的對話記錄路徑，以取得未加工的完整對話記錄。

在控制介面中，最近有子執行的父工作階段會在側邊欄中顯示可展開的資料列。
巢狀資料列會顯示子執行的狀態和執行時間；選取其中一個資料列會開啟該子代理的聊天，
同時保留父層階層。

### 討論串繫結控制

這些命令適用於具有持續性討論串繫結的頻道。請參閱下方的
[支援討論串的頻道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 衍生行為

代理使用 `sessions_spawn` 工具啟動背景子代理。
完成結果會以內部父工作階段事件傳回；父代理／請求者代理會決定是否需要面向使用者的更新。

<AccordionGroup>
  <Accordion title="非阻塞、推送式完成">
    - `sessions_spawn` 是非阻塞的；它會立即傳回執行 ID。
    - 完成時，子代理會回報給父工作階段／請求者工作階段。
    - 需要子代理結果的代理輪次，應在衍生必要工作後呼叫 `sessions_yield`。這會結束目前輪次，並讓完成事件作為下一則模型可見訊息抵達。
    - 完成採用推送方式。衍生後，請**不要**僅為了等待完成而在迴圈中輪詢 `/subagents list`、`sessions_list` 或 `sessions_history`；只有在偵錯時才依需求檢查狀態。
    - 子代理輸出是供請求者代理整合的報告／證據。它不是使用者撰寫的指示文字，也無法覆寫系統、開發者或使用者政策。
    - 完成時，在公告清理流程繼續之前，OpenClaw 會盡力關閉該子代理工作階段所開啟並追蹤的瀏覽器分頁／程序。

  </Accordion>
  <Accordion title="完成結果傳遞">
    - OpenClaw 會透過具有穩定冪等性金鑰的 `agent` 輪次，將完成結果交還給請求者工作階段。
    - 如果請求者執行仍在進行中，OpenClaw 會先嘗試喚醒／引導該執行，而不是啟動第二條可見回覆路徑。
    - 如果無法喚醒進行中的請求者，OpenClaw 會改用具有相同完成上下文的請求者代理轉交，而不是捨棄公告。
    - 即使父代理決定不需要提供可見的使用者更新，只要成功轉交給父代理，就會完成子代理結果的傳遞。
    - 原生子代理不會取得訊息工具。它們會將純助理文字傳回父代理／請求者代理；人類可見的回覆仍由父代理／請求者代理的一般傳遞政策負責。
    - 如果無法使用直接轉交，傳遞會改用佇列路由，然後在最終放棄前，對公告進行短暫的指數退避重試。
    - 傳遞會保留解析後的請求者路由：若有可用的討論串繫結或對話繫結完成路由，會優先使用。如果完成來源只提供頻道，OpenClaw 會從請求者工作階段的解析路由（`lastChannel` / `lastTo` / `lastAccountId`）補上缺少的目標／帳號，使直接傳遞仍可運作。

  </Accordion>
  <Accordion title="完成結果轉交中繼資料">
    傳給請求者工作階段的完成結果轉交，是由執行階段產生的
    內部上下文（不是使用者撰寫的文字），其中包含：

    - `Result` — 子代理最新的可見 `assistant` 回覆文字。tool/toolResult 輸出不會提升為子代理結果。以失敗告終的執行不會重複使用擷取的回覆文字。
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`。
    - 精簡的執行階段／權杖統計資料。
    - 一項審查指示，要求請求者代理先驗證結果，再決定原始任務是否已完成。
    - 當子代理結果仍有後續行動時，會提供後續指引，要求請求者代理繼續任務或記錄後續事項。
    - 當不再需要任何行動時，會提供最終更新指示，以一般助理語氣撰寫，不轉送未加工的內部中繼資料。

  </Accordion>
  <Accordion title="模式與 ACP 執行階段">
    - `--model` 和 `--thinking` 會覆寫該特定執行的預設值。
    - 完成後，使用 `info`/`log` 檢查詳細資料和輸出。
    - 對於持續性的討論串繫結工作階段，請使用搭配 `thread: true` 和 `mode: "session"` 的 `sessions_spawn`。
    - 如果請求者頻道不支援討論串繫結，請使用 `mode: "run"`，不要重試不可能成功的討論串繫結組合。
    - 對於 ACP 控制環境工作階段（Claude Code、Gemini CLI、OpenCode，或明確的 Codex ACP/acpx），若工具宣告支援該執行階段，請使用搭配 `runtime: "acp"` 的 `sessions_spawn`。偵錯完成結果或代理間迴圈時，請參閱 [ACP 傳遞模型](/zh-TW/tools/acp-agents#delivery-model)。啟用 `codex` 外掛時，除非使用者明確要求 ACP/acpx，否則 Codex 聊天／討論串控制應優先使用 `/codex ...`，而非 ACP。
    - 在 ACP 啟用、請求者未處於沙箱中，且已載入 `acpx` 之類的後端外掛之前，OpenClaw 會隱藏 `runtime: "acp"`。`runtime: "acp"` 預期接收外部 ACP 控制環境 ID，或具有 `runtime.type="acp"` 的 `agents.entries.*` 項目；對於來自 `agents_list` 的一般 OpenClaw 設定代理，請使用預設子代理執行階段。

  </Accordion>
</AccordionGroup>

## 上下文模式

除非呼叫者明確要求分支目前的對話記錄，否則原生子代理會以隔離方式啟動。

| 模式       | 使用時機                                                                                                                         | 行為                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、獨立實作、緩慢的工具作業，或任何可在任務文字中完整交代的工作                           | 建立乾淨的子對話記錄。這是預設模式，且可降低權杖用量。  |
| `fork`     | 依賴目前對話、先前工具結果，或請求者對話記錄中已有細微指示的工作 | 在子代理啟動前，將請求者對話記錄分支至子工作階段。 |

請謹慎使用 `fork`。它用於對上下文敏感的委派，不能取代
撰寫清楚的任務提示。

## 工具：`sessions_spawn`

在全域 `subagent` 通道上，以 `deliver: false` 啟動子代理執行，
接著執行公告步驟，並將公告回覆發佈至請求者的聊天頻道。

可用性取決於呼叫者的有效工具政策。內建的
`coding` 和 `messaging` 設定檔包含 `sessions_spawn`、
`sessions_yield` 和 `subagents`；`minimal` 則不包含。`full` 允許使用所有
工具。對於使用自訂較窄設定檔但仍應能委派工作的代理，
請透過 `tools.alsoAllow` 加入這些工具，或使用上述任一設定檔。
頻道／群組、供應商、沙箱及個別代理的允許／拒絕政策，
仍可能在設定檔階段後移除工具。請從同一工作階段使用 `/tools`
確認有效工具清單。

**預設值：**

- **模型：**除非設定 `agents.defaults.subagents.model`（或個別代理的 `agents.entries.*.subagents.model`），否則原生子代理會繼承呼叫者的模型。ACP 執行階段衍生作業在有設定子代理模型時，會使用相同的設定模型；否則 ACP 控制環境會保留自己的預設值。明確指定的 `sessions_spawn.model` 仍具有優先權。
- **思考：**除非設定 `agents.defaults.subagents.thinking`（或個別代理的 `agents.entries.*.subagents.thinking`），否則原生子代理會繼承呼叫者的設定。ACP 執行階段衍生作業也會將 `agents.defaults.models["provider/model"].params.thinking` 套用至選定模型。明確指定的 `sessions_spawn.thinking` 仍具有優先權。
- **執行逾時：**設定時，OpenClaw 會使用 `agents.defaults.subagents.runTimeoutSeconds`；否則會回復使用 `0`（無逾時）。`sessions_spawn` 不接受個別呼叫的逾時覆寫。
- **程序存續期：**分離的 OpenClaw 子代理有自己的執行生命週期。在外部命令列介面後端內建立的背景任務則不同：它會與父命令列介面子程序共用生命週期，並在該父程序到達 `agents.defaults.timeoutSeconds` 時停止。
- **任務傳遞：**原生子代理會在第一則可見的 `[Subagent Task]` 訊息中收到委派的任務。子代理系統提示包含執行階段規則和路由上下文，而不是隱藏的任務複本。

已接受的原生子代理衍生作業會在工具結果中包含解析後的子代理模型中繼資料：
`resolvedModel` 包含套用的模型參照，而當參照具有供應商前綴時，
`resolvedProvider` 會包含該前綴。

### 委派提示模式

`agents.defaults.subagents.delegationMode` 僅控制提示指引；它不會變更工具政策，也不會強制委派。

- `suggest`（預設）：保留標準提示，引導較大型或較緩慢的工作使用子代理。
- `prefer`：要求主要代理保持即時回應，並透過 `sessions_spawn` 委派任何比直接回覆更複雜的工作。

個別代理覆寫：`agents.entries.*.subagents.delegationMode`。

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
  子代理程式的任務說明。
</ParamField>
<ParamField path="taskName" type="string">
  選用的穩定識別名稱，用於在後續狀態輸出中識別特定子項目。必須符合 `[a-z][a-z0-9_-]{0,63}`，且不可為 `last` 或 `all` 等保留目標。
</ParamField>
<ParamField path="label" type="string">
  選用、可供人閱讀的標籤。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允許時，於另一個已設定的代理程式 ID 下產生。
</ParamField>
<ParamField path="cwd" type="string">
  子執行作業的選用任務工作目錄。原生子代理程式仍會從目標代理程式工作區載入啟動檔案；`cwd` 只會變更執行階段工具與命令列介面框架執行委派工作的所在位置。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 僅用於外部 ACP 框架（`claude`、`droid`、`gemini`、`opencode`，或明確要求的 Codex ACP/acpx），以及 `runtime.type` 為 `acp` 的 `agents.entries.*` 項目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  僅限 ACP。當 `runtime: "acp"` 時恢復既有 ACP 框架工作階段；原生子代理程式產生作業會忽略此項。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  僅限 ACP。當 `runtime: "acp"` 時，將 ACP 執行輸出串流至父工作階段；原生子代理程式產生作業請省略此項。
</ParamField>
<ParamField path="model" type="string">
  覆寫子代理程式模型。無效值會被略過，子代理程式將使用預設模型執行，且工具結果中會顯示警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆寫子代理程式執行的思考層級。不適用於 `visible: true`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  當 `true` 時，為此子代理程式工作階段要求頻道討論串繫結。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  若為 `thread: true` 且省略 `mode`，預設值會變成 `session`。`mode: "session"` 需要 `thread: true`。
  若要求者頻道無法使用討論串繫結，請改用 `mode: "run"`。
  使用 `visible: true` 時，請省略 `mode`；可見工作階段會持續存在，且不支援 `mode: "run"`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 會在公告後立即封存工作階段（仍會透過重新命名保留逐字記錄）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  除非目標子執行階段已置於沙箱中，否則 `require` 會拒絕產生作業。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 會將要求者目前的逐字記錄分支至子工作階段。僅限原生子代理程式。繫結討論串的產生作業預設為 `fork`；未繫結討論串的產生作業預設為 `isolated`。可見分支必須以與要求者相同的代理程式為目標。
</ParamField>
<ParamField path="visible" type="boolean" default="false">
  建立使用者可在控制介面中開啟的持續性儀表板工作階段。可見產生作業僅支援 `runtime: "subagent"`，且一律保留所建立的工作階段。
</ParamField>
<ParamField path="worktree" type="boolean" default="false">
  為新的儀表板工作階段佈建受管理的 git 工作樹。需要 `visible: true`。
</ParamField>
<ParamField path="worktreeName" type="string">
  選用的受管理工作樹名稱。需要 `visible: true` 和 `worktree: true`。
</ParamField>
<ParamField path="worktreeBaseRef" type="string">
  受管理工作樹的選用 git 基底參照。需要 `visible: true` 和 `worktree: true`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受頻道傳遞參數（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）。原生子代理程式會將其
最新的助理回合回報給要求者；外部傳遞仍由
父代理程式／要求者代理程式負責。
</Warning>

使用 `visible: true` 時，支援 `model`、`cwd`，以及相同代理程式的 `context: "fork"`。沙箱化目標會將 `cwd` 限制在該代理程式的工作區內。此路徑無法使用討論串繫結、`mode`、思考覆寫、`lightContext`、`attachments` 和 `attachAs`，因為可見工作階段是透過 `sessions.create` 建立的持續性儀表板工作階段。若要求者本身是以繼承的工具允許清單或拒絕清單產生，則會拒絕可見產生作業；此限制在產生時即已固定，沒有設定可覆寫。工作階段清單與定址遵循 `tools.sessions.visibility`；預設的 `tree` 範圍涵蓋目前工作階段及其自身的產生子樹。關於簽出命名、設定、清理與還原行為，請參閱[受管理的工作樹](/zh-TW/concepts/managed-worktrees)。

### 任務名稱與目標指定

`taskName` 是供模型進行協調的識別名稱，而非工作階段金鑰。
當協調者之後可能需要檢查該子項目時，請使用 `review_subagents`、
`linux_validation` 或 `docs_update` 等穩定的子項目名稱。

目標解析接受完全符合的 `taskName` 和無歧義的
前綴。比對範圍與編號 `/subagents` 目標所使用的相同有效／近期目標視窗一致，因此過期且已完成的子項目不會使
重複使用的識別名稱產生歧義。如果兩個有效或近期子項目具有相同的
`taskName`，該目標便有歧義；請改用清單索引、工作階段金鑰或
執行 ID。

保留目標 `last` 和 `all` 不是有效的 `taskName` 值，
因為它們已有控制用途。

## 工具：`sessions_yield`

結束目前的模型回合並等待執行階段事件（主要是
子代理程式完成事件）作為下一則訊息抵達。當產生必要的子工作後，若要求者必須等到這些工作完成才能產生最終
答案，請使用此工具。

`sessions_yield` 是等待原語。請勿以輪詢
`subagents`、`sessions_list`、`sessions_history`、殼層
`sleep` 或程序的迴圈取代它，只為了偵測子項目是否完成。

僅當工作階段的有效工具清單包含
`sessions_yield` 時才使用它。某些最小或自訂工具設定檔可能會提供 `sessions_spawn` 和
`subagents`，卻不提供 `sessions_yield`；在此情況下，請勿杜撰
輪詢迴圈來等待完成。

當有有效子項目時，OpenClaw 會將精簡、由執行階段產生的
`Active Subagents` 提示區塊注入一般回合，讓要求者無須輪詢即可查看
目前的子工作階段、執行 ID、狀態、標籤、任務和
`taskName` 別名。該區塊中的任務與標籤欄位會被引號括起並視為資料，而非指示，因為它們可能源自
使用者／模型提供的產生引數。

## 工具：`subagents`

列出要求者工作階段樹所擁有的已產生子代理程式執行作業與背景任務記錄。任務列涵蓋原生子代理程式、ACP 執行作業、
閘道命令列介面／媒體工作，以及排程執行作業。其範圍限於目前的
要求者；子項目只能查看其自行控制的子項目。

使用 `subagents` 進行隨選狀態查詢與偵錯。使用 `sessions_yield`
等待完成事件。

搭配 `action: "list"` 傳回的 `taskId` 使用 `action: "cancel"`，即可停止
任務。取消操作僅限於受控工作階段樹；葉節點
子代理程式無法取消其他工作階段所擁有的工作。

## 繫結討論串的工作階段

當頻道啟用討論串繫結時，子代理程式可持續繫結至
討論串，使該討論串中的後續使用者訊息持續路由至
同一個子代理程式工作階段。

### 支援討論串的頻道

當頻道註冊交談
繫結配接器時，即支援持續性、繫結討論串的子代理程式工作階段
（`sessions_spawn` 搭配 `thread: true`）。內建支援此功能的頻道包括：**Discord**、
**iMessage**、**Matrix** 和 **Telegram**。Discord 和 Matrix 預設會
建立子討論串；Telegram 和 iMessage 預設會繫結
目前的交談。使用各頻道的 `threadBindings` 設定鍵來控制
啟用、逾時和 `spawnSessions`。

### 快速流程

<Steps>
  <Step title="產生">
    使用 `sessions_spawn` 搭配 `thread: true`（並可選擇搭配 `mode: "session"`）。
  </Step>
  <Step title="繫結">
    OpenClaw 會在有效頻道中建立討論串或將其繫結至該工作階段目標。
  </Step>
  <Step title="路由後續訊息">
    該討論串中的回覆與後續訊息會路由至已繫結的工作階段。
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

| 命令            | 效果                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | 將目前討論串（或建立一個討論串）繫結至子代理程式／工作階段目標                     |
| `/unfocus`         | 移除目前已繫結討論串的繫結                                           |
| `/agents`          | 列出有效執行作業與繫結狀態（`binding:<id>`、`unbound` 或 `bindings unavailable`） |
| `/session idle`    | 檢查／更新閒置時自動取消聚焦的設定（僅限已聚焦的繫結討論串）                             |
| `/session max-age` | 檢查／更新硬性上限（僅限已聚焦的繫結討論串）                                      |

### 設定開關

- **全域預設值：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **頻道覆寫與產生作業自動繫結鍵**依配接器而異。請參閱上方的[支援討論串的頻道](#thread-supporting-channels)。

如需目前的配接器詳細資料，請參閱[設定參考](/zh-TW/gateway/configuration-reference)和
[斜線命令](/zh-TW/tools/slash-commands)。

### 允許清單

<ParamField path="agents.entries.*.subagents.allowAgents" type="string[]">
  可透過明確的 `agentId` 指定為目標的已設定代理程式 ID 清單（`["*"]` 允許任何已設定目標）。預設：僅限要求者代理程式。如果設定了清單，且仍希望要求者使用 `agentId` 產生自身，請將要求者 ID 納入清單。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  當要求者代理程式未設定自己的 `subagents.allowAgents` 時，所使用的預設已設定目標代理程式允許清單。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選取設定檔）。各代理程式覆寫：`agents.entries.*.subagents.requireAgentId`。
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  閘道 `agent` 公告傳遞嘗試的每次呼叫逾時。值必須為正整數毫秒，並會限制在平台安全的計時器最大值內。暫時性重試可能使公告等待總時間超過單次設定的逾時。
</ParamField>

若要求者工作階段已置於沙箱中，`sessions_spawn` 會拒絕
將在未沙箱化環境中執行的目標。

### 探索

使用 `agents_list` 查看目前允許哪些代理程式 ID 用於
`sessions_spawn`。回應會包含每個列出代理程式的有效
模型與內嵌執行階段中繼資料，讓呼叫者能區分 OpenClaw、Codex
app-server，以及其他已設定的原生執行階段。

`allowAgents` 項目必須指向 `agents.entries.*` 中已設定的代理程式 ID。
`["*"]` 表示任何已設定的目標代理程式加上請求者。如果代理程式設定
已刪除，但其 ID 仍留在 `allowAgents` 中，`sessions_spawn` 會拒絕該 ID，
而 `agents_list` 會將其省略。執行 `openclaw doctor --fix` 以清理過時的
允許清單項目；若目標應在繼承預設值的同時仍可被生成，則新增最小的 `agents.entries.*` 項目。

### 自動封存

- 子代理程式工作階段會在 `agents.defaults.subagents.archiveAfterMinutes` 後自動封存（預設為 `60`）。
- 封存會使用 `sessions.delete`，並將逐字記錄重新命名為 `*.deleted.<timestamp>`（位於同一資料夾）。
- `cleanup: "delete"` 會在公告後立即封存（仍會透過重新命名保留逐字記錄）。
- 自動封存採盡力而為；若閘道重新啟動，待處理的計時器將會遺失。
- 已設定的執行逾時**不會**自動封存；它們只會停止執行。工作階段會一直保留到自動封存。
- 自動封存同樣適用於深度 1 與深度 2 的工作階段。
- 瀏覽器清理與封存清理彼此獨立：執行結束時，系統會盡力關閉追蹤中的瀏覽器分頁／處理程序，即使逐字記錄／工作階段紀錄仍被保留。

## 巢狀子代理程式

預設情況下，子代理程式無法生成自己的子代理程式
（`maxSpawnDepth: 1`）。將 `maxSpawnDepth: 2` 設為啟用一層
巢狀結構，也就是**協調器模式**：主要代理程式 → 協調器子代理程式 →
工作者子子代理程式。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允許子代理程式生成子項（預設：1，範圍 1-5）
        maxChildrenPerAgent: 5, // 每個代理程式工作階段的最大作用中子項數（預設：5，範圍 1-20）
        maxConcurrent: 8, // 全域並行通道上限（預設：8）
        runTimeoutSeconds: 900, // sessions_spawn 的預設逾時（0 = 不逾時）
        announceTimeoutMs: 120000, // 每次呼叫的閘道公告逾時
      },
    },
  },
}
```

### 深度層級

| 深度 | 工作階段金鑰形式                            | 角色                                          | 可以生成嗎？                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主要代理程式                                    | 一律可以                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子代理程式（允許深度 2 時為協調器） | 僅當 `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子代理程式（葉節點工作者）                   | 永遠不行                        |

### 公告鏈

結果會沿鏈向上傳回：

1. 深度 2 工作者完成 → 向其父項（深度 1 協調器）公告。
2. 深度 1 協調器收到公告、整合結果並完成 → 向主要代理程式公告。
3. 主要代理程式收到公告並傳遞給使用者。

每個層級只會看到其直接子項的公告。

<Note>
**操作指引：**只啟動一次子項工作並等待完成
事件，而不是圍繞 `sessions_list`、
`sessions_history`、`/subagents list` 或 `exec` 睡眠命令建立輪詢迴圈。
`sessions_list` 和 `/subagents list` 會讓子工作階段關聯
專注於即時工作：仍在執行的子項會保持附加，已結束的子項會在短暫的近期時間範圍內
維持可見，而僅存在於儲存區中的過時子項連結會在其有效時間範圍後
遭到忽略。這可避免舊的 `spawnedBy` /
`parentSessionKey` 中繼資料在重新啟動後讓幽靈子項復現。
如果子項完成事件在你已傳送最終答案後才抵達，正確的後續處理是使用完全相符的靜默權杖
`NO_REPLY` / `no_reply`。
</Note>

### 依深度套用的工具政策

- 子項在生成時會擷取請求者的有效傳送者政策。無傳送者的子項執行與經驗證的操作員恢復，即使 `toolsBySender` 之後變更，也會保留該快照；目前的全域、代理程式、供應商、沙箱及子代理程式限制仍然適用。以子項為目標的新外部頻道輪次則會重新解析目前的傳送者政策。
- 角色與控制範圍會在生成時寫入工作階段中繼資料。這可避免扁平化或還原的工作階段金鑰意外重新取得協調器權限。
- **深度 1（協調器，當 `maxSpawnDepth >= 2` 時）：**可取得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，因此能生成子項並檢查其狀態。其他工作階段／系統工具仍會遭拒。
- **深度 1（葉節點，當 `maxSpawnDepth == 1` 時）：**沒有工作階段工具（目前的預設行為）。
- **深度 2（葉節點工作者）：**沒有工作階段工具；在深度 2，`sessions_spawn` 一律遭拒。無法繼續生成子項。

### 每個代理程式的生成限制

每個代理程式工作階段（不論深度）同一時間最多可有 `maxChildrenPerAgent`
（預設為 `5`）個作用中子項。這可避免單一協調器無限制地向外擴張。

### 串聯停止

停止深度 1 協調器時，會自動停止其所有深度 2
子項：

- 主要聊天中的 `/stop` 會停止所有深度 1 代理程式，並串聯停止其深度 2 子項。

## 驗證

子代理程式驗證是依**代理程式 ID**解析，而不是依工作階段類型：

- 子代理程式工作階段金鑰為 `agent:<agentId>:subagent:<uuid>`。
- 驗證儲存區會從該代理程式的 `agentDir` 載入。
- 主要代理程式的驗證設定檔會合併為**後備選項**；發生衝突時，代理程式設定檔會覆寫主要代理程式設定檔。

此合併採加成方式，因此主要設定檔永遠可作為
後備選項。目前尚不支援每個代理程式完全隔離的驗證。

## 公告

子代理程式透過公告步驟回報：

- 公告步驟會在子代理程式工作階段內執行（而非請求者工作階段）。
- 如果子代理程式的回覆與 `ANNOUNCE_SKIP` 完全相符，則不會張貼任何內容。
- 如果最新的助理文字是完全相符的靜默權杖 `NO_REPLY` / `no_reply`，即使先前曾有可見的進度，公告輸出仍會受到抑制。

傳遞方式取決於請求者深度：

- 頂層請求者工作階段會使用後續的 `agent` 呼叫進行外部傳遞（`deliver=true`）。
- 巢狀請求者子代理程式工作階段會收到內部後續注入（`deliver=false`），讓協調器能在工作階段內整合子項結果。
- 如果巢狀請求者子代理程式工作階段已不存在，OpenClaw 會在可用時退回該工作階段的請求者。

對於頂層請求者工作階段，完成模式的直接傳遞會先
解析任何繫結的對話／討論串路由與鉤點覆寫，然後從請求者工作階段儲存的路由
填入缺少的頻道目標欄位。如此一來，即使完成來源
只識別頻道，完成結果仍會送至正確的聊天／主題。

建立巢狀完成結果時，子項完成彙總的範圍會限定於目前請求者執行，
避免先前執行中過時的子項輸出洩漏到目前的公告。若頻道轉接器提供
討論串／主題路由，公告回覆會予以保留。

### 公告內容

公告內容會正規化為穩定的內部事件區塊：

| 欄位          | 來源                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| 來源         | `subagent` 或 `cron`                                                                                     |
| 工作階段 ID    | 子工作階段金鑰／ID                                                                                     |
| 類型           | 公告類型 + 任務標籤                                                                               |
| 狀態         | 從執行階段結果衍生（`ok`、`error`、`timeout` 或 `unknown`）— **不會**從模型文字推斷 |
| 結果內容 | 子項最新的可見助理文字                                                             |
| 後續處理      | 說明何時回覆或保持靜默的指示                                                      |

以失敗告終的執行會回報失敗狀態，而不重播擷取的
回覆文字。工具／工具結果輸出不會提升為子項結果文字。

### 統計資料行

公告承載內容最後會包含一行統計資料（即使經過包裝）：

- 執行時間（例如 `runtime 5m12s`）。
- 權杖用量（輸入／輸出／總計）。
- 已設定模型定價時的估算成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 以及逐字記錄路徑，讓主要代理程式可透過 `sessions_history` 擷取歷程記錄，或檢查磁碟上的檔案。

內部中繼資料僅供協調使用；面向使用者的回覆
應以一般助理語氣重新撰寫。

### 為何偏好 `sessions_history`

`sessions_history` 是在代理程式輪次中讀取子項
逐字記錄時更安全的協調方式：

- 即使一般用途的記錄遮蔽已停用，也會遮蔽類似認證資訊／權杖的文字。
- 截斷過長的文字區塊（每個區塊 4000 個字元），並捨棄思考簽章、推理重播承載內容與行內影像資料。
- 強制執行 80 KB 回應上限；過大的資料列會替換為 `[sessions_history omitted: message too large]`。
- 若有 `nextOffset`，可使用它向後分頁至較舊的逐字記錄時間範圍。
- `sessions_history` **不會**從訊息文字中移除推理標籤、`<relevant-memories>` 鷹架或工具呼叫 XML；它會傳回接近原始逐字記錄形式的結構化內容區塊，僅進行遮蔽與大小限制。`/subagents log` 會套用較完整的文字清理器（移除推理標籤、記憶鷹架與工具呼叫 XML），因為它呈現的是純聊天文字行，而非結構化區塊。
- 當你需要完整且逐位元組相符的逐字記錄時，直接檢查磁碟上的原始逐字記錄是後備方式。

## 工具政策

子代理程式會先使用與父代理程式或目標代理程式相同的設定檔及工具政策
管線。之後，OpenClaw 才會套用子代理程式限制
層。

不論深度或角色，子代理程式一律無法使用 `gateway`、`agents_list`、`session_status` 和
`cron`（系統層級／互動式工具，或
應由主要代理程式協調的工具）。葉節點子代理程式（預設的深度 1
行為，以及所有深度 2 工作階段）也無法使用 `subagents`、
`sessions_list`、`sessions_history` 和 `sessions_spawn`。子代理程式永遠
不會取得 `message` 工具；該工具在生成時即停用，而非由
此拒絕清單篩除；`sessions_send` 也會維持遭拒狀態，因此子代理程式
只能透過公告鏈進行通訊。

`sessions_history` 在此同樣維持為有界且經過清理的回溯檢視，而
不是原始逐字記錄傾印。

當 `maxSpawnDepth >= 2` 時，深度 1 協調器子代理程式還會
取得 `sessions_spawn`、`subagents`、`sessions_list` 和
`sessions_history`，使其能管理自己的子項。

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
        // 若設定 allow，便會變成僅允許清單（拒絕規則仍優先）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` 是最終的僅允許篩選器。它可以縮小
已解析的工具集合，但無法**重新加入**被
`tools.profile` 移除的工具。例如，`tools.profile: "coding"` 包含
`web_search`/`web_fetch`，但不包含 `browser` 工具。若要讓
程式設計設定檔的子代理程式使用瀏覽器自動化，請在
設定檔階段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

若只有一個代理程式應取得瀏覽器自動化功能，請使用各代理程式的
`agents.entries.*.tools.alsoAllow: ["browser"]`。

## 並行處理

子代理程式使用專用的處理程序內佇列通道：

- **通道名稱：** `subagent`
- **並行數：** `agents.defaults.subagents.maxConcurrent`（預設為 `8`）

## 存活狀態與復原

OpenClaw 不會將缺少 `endedAt` 視為子代理程式仍然存活的永久證明。
未結束且超過過時執行時間範圍的執行
（2 小時，或設定的執行逾時加上一小段寬限期，
取兩者中較長者）將不再計入 `/subagents list`、
狀態摘要、後代完成閘控及各工作階段的
並行檢查中的作用中／待處理項目。

閘道重新啟動後，過時且未結束的已還原執行會被清除，除非
其子工作階段標記為 `abortedLastRun: true`。因重新啟動而中止的
執行會繼續登記於子代理程式孤兒復原流程中：過時的
執行將在不恢復的情況下完成，而近期的子工作階段則會在清除
中止標記之前收到一則合成的恢復訊息。

每個子工作階段的自動重新啟動復原次數都有上限。如果同一個
子代理程式子項目在快速再次卡住的時間範圍內重複獲准進行孤兒復原，
OpenClaw 會在該工作階段中保存復原墓碑，並停止在後續重新啟動時
自動恢復該工作階段。請執行
`openclaw tasks maintenance --apply` 來校正任務記錄，或執行
`openclaw doctor --fix` 來清除帶有墓碑之工作階段中
過時的中止復原旗標。

<Note>
如果產生子代理程式時因閘道 `PAIRING_REQUIRED` /
`scope-upgrade` 而失敗，請先檢查 RPC 呼叫端，再編輯配對狀態。
當呼叫端已在閘道要求內容中執行時，內部 `sessions_spawn`
協調會在處理程序內分派，因此不會開啟回送 WebSocket，也不依賴
命令列介面的已配對裝置範圍基準。閘道處理程序外的呼叫端仍會透過
WebSocket 備援，以 `client.id: "gateway-client"` 身分搭配 `client.mode: "backend"`，
透過直接回送的共用權杖／密碼驗證。遠端呼叫端、明確的
`deviceIdentity`、明確的裝置權杖路徑，以及瀏覽器／節點用戶端，
仍需一般裝置核准才能升級範圍。
</Note>

## 停止

- 在要求者聊天中傳送 `/stop`，會中止要求者工作階段，並停止由其產生的所有作用中子代理程式執行，且會連鎖停止巢狀子項目。

## 限制

- 子代理程式公告為**盡力而為**。如果閘道重新啟動，待處理的「回傳公告」工作將會遺失。
- 子代理程式仍會共用相同的閘道處理程序資源；請將 `maxConcurrent` 視為安全閥。
- `sessions_spawn` 一律為非阻塞：它會立即傳回 `{ status: "accepted", runId, childSessionKey }`。
- 子代理程式內容僅注入 `AGENTS.md` 和 `TOOLS.md`（不含 `SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。Codex 原生子代理程式遵循相同界線：`TOOLS.md` 會保留在繼承的 Codex 執行緒指示中，而僅限父項目的角色設定、身分與使用者檔案，會作為限於當輪的協作指示注入，以免子項目複製這些內容。
- 最大巢狀深度為 5（`maxSpawnDepth` 範圍：1-5）。大多數使用情境建議使用深度 2。
- `maxChildrenPerAgent` 限制每個工作階段的作用中子項目數量（預設為 `5`，範圍為 `1-20`）。

## 相關內容

- [工作階段工具與狀態變更](/zh-TW/concepts/session-tool)
- [ACP 代理程式](/zh-TW/tools/acp-agents)
- [代理程式傳送](/zh-TW/tools/agent-send)
- [背景任務](/zh-TW/automation/tasks)
- [多代理程式沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
