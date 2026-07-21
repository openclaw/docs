---
read_when:
    - 你想透過代理程式進行背景或平行工作
    - 你正在變更 `sessions_spawn` 或子代理工具政策
    - 你正在實作或疑難排解綁定討論串的子代理工作階段
sidebarTitle: Sub-agents
summary: 啟動隔離的背景代理程式執行，並將結果回報至請求者的聊天中
title: 子代理程式
x-i18n:
    generated_at: "2026-07-21T09:11:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 06981261069714dd1ca4c426ce73d5e6dbdebb4dc5d77f2f9adef59bce29cb0d
    source_path: tools/subagents.md
    workflow: 16
---

子代理程式是在現有代理程式執行中產生的背景代理程式執行。
每個子代理程式都在自己的工作階段（`agent:<agentId>:subagent:<uuid>`）中執行，並且
完成後會將結果**公告**回請求者的聊天頻道。
每次子代理程式執行都會作為[背景工作](/zh-TW/automation/tasks)追蹤。

目標：

- 將研究、長時間工作和緩慢的工具作業平行化，而不阻塞主要執行。
- 預設將子代理程式隔離（工作階段分離、選用的沙箱隔離）。
- 讓工具介面難以遭到誤用：子代理程式預設**不會**取得工作階段或訊息工具。
- 支援可設定的巢狀深度，以供協調器模式使用。

<Note>
**成本注意事項：**預設情況下，每個子代理程式都有自己的上下文和權杖用量。
對於繁重或重複性的工作，請為子代理程式設定成本較低的模型，
並透過 `agents.defaults.subagents.model` 或個別代理程式覆寫，
讓主要代理程式繼續使用品質較高的模型。當子代理程式
確實需要請求者目前的逐字稿時，請使用
`context: "fork"` 產生它。綁定討論串的子代理程式工作階段預設為
`context: "fork"`，因為它們會將目前的對話分支至
後續討論串。
</Note>

## 斜線命令

`/subagents` 會檢查**目前工作階段**的子代理程式執行：

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` 會顯示執行中繼資料（狀態、時間戳記、工作階段 ID、
逐字稿路徑、清理）。`/subagents log` 會列印某次執行最近的聊天回合；
加入 `tools` 權杖即可包含工具呼叫／結果訊息（預設省略）。
請使用 `sessions_history`，在代理程式回合內取得有界且經安全篩選的回憶檢視，
或檢查磁碟上的逐字稿路徑以取得原始完整逐字稿。

在控制介面中，最近有子執行的父工作階段會有可展開的
側邊欄列。巢狀列會顯示子項目的狀態與執行時間，選取其中一個
便會開啟該子項目的聊天，同時保留父項目階層。

### 討論串綁定控制

這些命令適用於具有持久討論串綁定的頻道。請參閱下方的
[支援討論串的頻道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 產生行為

代理程式會使用 `sessions_spawn` 工具啟動背景子代理程式。
完成結果會以內部父工作階段事件傳回；父／請求者
代理程式會決定是否需要向使用者顯示更新。

<AccordionGroup>
  <Accordion title="非阻塞、推送式完成">
    - `sessions_spawn` 是非阻塞的；它會立即傳回執行 ID。
    - 完成時，子代理程式會向父／請求者工作階段回報。
    - 需要子項目結果的代理程式回合，應在產生必要工作後呼叫 `sessions_yield`。這會結束目前回合，並讓完成事件成為下一則模型可見訊息。
    - 完成採用推送方式。產生後，**不要**為了等待其完成而循環輪詢 `/subagents list`、`sessions_list` 或 `sessions_history`；只有在偵錯時才應視需要檢查狀態。
    - 子項目輸出是供請求者代理程式彙整的報告／證據。它不是使用者撰寫的指示文字，也無法覆寫系統、開發者或使用者政策。
    - 完成時，在公告清理流程繼續之前，OpenClaw 會盡力關閉由該子代理程式工作階段開啟且受追蹤的瀏覽器分頁／程序。

  </Accordion>
  <Accordion title="完成結果傳遞">
    - OpenClaw 會透過具有穩定冪等性金鑰的 `agent` 回合，將完成結果交回請求者工作階段。
    - 如果請求者執行仍在進行中，OpenClaw 會先嘗試喚醒／引導該執行，而不是啟動第二條可見回覆路徑。
    - 如果無法喚醒進行中的請求者，OpenClaw 會改用具有相同完成上下文的請求者代理程式移交，而不會捨棄公告。
    - 即使父代理程式決定不需要向使用者顯示更新，成功的父項目移交仍會完成子代理程式的傳遞。
    - 原生子代理程式不會取得訊息工具。它們會將純助理文字傳回父／請求者代理程式；人類可見的回覆仍由父／請求者代理程式的一般傳遞政策負責。
    - 如果無法使用直接移交，傳遞會先退回佇列路由，接著在最終放棄前對公告進行短暫的指數退避重試。
    - 傳遞會保留解析後的請求者路由：可用時，以綁定討論串或綁定對話的完成路由優先。如果完成來源只提供頻道，OpenClaw 會從請求者工作階段解析後的路由（`lastChannel` / `lastTo` / `lastAccountId`）補上缺少的目標／帳號，讓直接傳遞仍可運作。

  </Accordion>
  <Accordion title="完成結果移交中繼資料">
    向請求者工作階段進行的完成結果移交是由執行階段產生的
    內部上下文（不是使用者撰寫的文字），其中包含：

    - `Result` — 子項目最新可見的 `assistant` 回覆文字。工具／工具結果輸出不會提升為子項目結果。以失敗告終的執行不會重複使用擷取的回覆文字。
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`。
    - 精簡的執行時間／權杖統計資料。
    - 要求請求者代理程式在判斷原始工作是否完成前先驗證結果的審查指示。
    - 當子項目結果仍有後續動作時，要求請求者代理程式繼續工作或記錄後續事項的指引。
    - 適用於不再需要任何動作之路徑的最終更新指示，以一般助理語氣撰寫，不轉送原始內部中繼資料。

  </Accordion>
  <Accordion title="模式與 ACP 執行階段">
    - `--model` 和 `--thinking` 會覆寫該次特定執行的預設值。
    - 使用 `info`/`log` 檢查完成後的詳細資料與輸出。
    - 對於持久且綁定討論串的工作階段，請搭配 `thread: true` 和 `mode: "session"` 使用 `sessions_spawn`。
    - 如果請求者頻道不支援討論串綁定，請改用 `mode: "run"`，而不要重試不可能成立的討論串綁定組合。
    - 對於 ACP 控制框架工作階段（Claude Code、Gemini CLI、OpenCode 或明確指定的 Codex ACP/acpx），當工具公告該執行階段時，請搭配 `runtime: "acp"` 使用 `sessions_spawn`。偵錯完成結果或代理程式間迴圈時，請參閱 [ACP 傳遞模型](/zh-TW/tools/acp-agents#delivery-model)。啟用 `codex` 外掛時，除非使用者明確要求 ACP/acpx，否則 Codex 聊天／討論串控制應優先使用 `/codex ...`，而不是 ACP。
    - 在啟用 ACP、請求者未置於沙箱中，且已載入 `acpx` 等後端外掛之前，OpenClaw 會隱藏 `runtime: "acp"`。`runtime: "acp"` 預期取得外部 ACP 控制框架 ID，或具有 `runtime.type="acp"` 的 `agents.list[]` 項目；對於來自 `agents_list` 的一般 OpenClaw 設定代理程式，請使用預設子代理程式執行階段。

  </Accordion>
</AccordionGroup>

## 上下文模式

除非呼叫端明確要求分支目前的逐字稿，否則原生子代理程式會以隔離方式啟動。

| 模式       | 使用時機                                                                                                                         | 行為                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、獨立實作、緩慢的工具作業，或任何可在工作文字中充分說明的事項                           | 建立乾淨的子逐字稿。這是預設值，並可降低權杖用量。  |
| `fork`     | 依賴目前對話、先前工具結果，或請求者逐字稿中既有細緻指示的工作 | 在子項目啟動前，將請求者逐字稿分支至子工作階段。 |

請謹慎使用 `fork`。它適用於對上下文敏感的委派，不能取代
撰寫清楚的工作提示。

## 工具：`sessions_spawn`

在全域 `subagent` 執行通道上使用 `deliver: false` 啟動子代理程式執行，
接著執行公告步驟，並將公告回覆張貼至請求者
聊天頻道。

可用性取決於呼叫端的有效工具政策。內建的
`coding` 和 `messaging` 設定檔包含 `sessions_spawn`、
`sessions_yield` 和 `subagents`；`minimal` 則不包含。`full` 允許所有
工具。對於使用自訂且範圍較窄、但仍應能
委派工作的設定檔之代理程式，請透過 `tools.alsoAllow` 加入這些工具，
或使用上述其中一個設定檔。
在設定檔階段之後，頻道／群組、供應商、沙箱，以及個別代理程式的允許／拒絕政策
仍可能移除工具。請在相同工作階段中使用 `/tools`
確認有效工具清單。

**預設值：**

- **模型：**除非設定 `agents.defaults.subagents.model`（或個別代理程式的 `agents.list[].subagents.model`），否則原生子代理程式會繼承呼叫端。ACP 執行階段產生程序在有設定時會使用相同的子代理程式模型；否則 ACP 控制框架會保留自己的預設值。明確設定的 `sessions_spawn.model` 仍具有最高優先權。
- **思考：**除非設定 `agents.defaults.subagents.thinking`（或個別代理程式的 `agents.list[].subagents.thinking`），否則原生子代理程式會繼承呼叫端。ACP 執行階段產生程序也會將 `agents.defaults.models["provider/model"].params.thinking` 套用至所選模型。明確設定的 `sessions_spawn.thinking` 仍具有最高優先權。
- **執行逾時：**設定時，OpenClaw 會使用 `agents.defaults.subagents.runTimeoutSeconds`；否則會退回 `0`（無逾時）。`sessions_spawn` 不接受每次呼叫的逾時覆寫。
- **程序生命週期：**中斷連結的 OpenClaw 子代理程式有自己的執行生命週期。在外部命令列介面後端內建立的背景工作則不同：它會共用父命令列介面子程序，並在該父程序到達 `agents.defaults.timeoutSeconds` 時停止。
- **工作傳遞：**原生子代理程式會在第一則可見的 `[Subagent Task]` 訊息中收到委派的工作。子代理程式系統提示帶有執行階段規則與路由上下文，而不是工作的隱藏複本。

已接受的原生子代理程式產生操作，會在工具結果中包含解析後的子模型中繼資料：
`resolvedModel` 包含套用的模型參照，而當參照具有供應商前綴時，
`resolvedProvider` 會包含該前綴。

### 委派提示模式

`agents.defaults.subagents.delegationMode` 只控制提示指引；它不會變更工具政策或強制委派。

- `suggest`（預設）：保留標準提示引導，建議對較大型或較緩慢的工作使用子代理程式。
- `prefer`：指示主要代理程式保持即時回應，並透過 `sessions_spawn` 委派任何比直接回覆更複雜的工作。

個別代理程式覆寫：`agents.list[].subagents.delegationMode`。

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
  選用的穩定識別名稱，用於在後續狀態輸出中識別特定子代理。必須符合 `[a-z][a-z0-9_-]{0,63}`，且不能是 `last` 或 `all` 等保留目標。
</ParamField>
<ParamField path="label" type="string">
  選用、可供人閱讀的標籤。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允許時，於另一個已設定的代理 ID 下產生。
</ParamField>
<ParamField path="cwd" type="string">
  子執行的選用任務工作目錄。原生子代理仍會從目標代理工作區載入啟動檔案；`cwd` 僅變更執行階段工具和命令列介面框架執行委派工作的所在位置。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 僅適用於外部 ACP 框架（`claude`、`droid`、`gemini`、`opencode`，或明確要求的 Codex ACP/acpx），以及 `runtime.type` 為 `acp` 的 `agents.list[]` 項目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  僅限 ACP。當 `runtime: "acp"` 時，繼續既有的 ACP 框架工作階段；原生子代理產生作業會忽略此項。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  僅限 ACP。當 `runtime: "acp"` 時，將 ACP 執行輸出串流至父工作階段；原生子代理產生作業請省略。
</ParamField>
<ParamField path="model" type="string">
  覆寫子代理模型。無效值會被略過，子代理將以預設模型執行，且工具結果中會顯示警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆寫子代理執行的思考層級。搭配 `visible: true` 時無法使用。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  當 `true` 時，要求將此子代理工作階段綁定至頻道討論串。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  若為 `thread: true` 且省略 `mode`，預設值會變為 `session`。`mode: "session"` 需要 `thread: true`。
  如果要求者頻道無法使用討論串綁定，請改用 `mode: "run"`。
  使用 `visible: true` 時，請省略 `mode`；可見工作階段是持久性的，且不支援 `mode: "run"`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 會在公告後立即封存工作階段（仍會透過重新命名保留文字記錄）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  除非目標子執行階段已在沙箱中，否則 `require` 會拒絕產生作業。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 會將要求者目前的文字記錄分支至子工作階段。僅限原生子代理。綁定討論串的產生作業預設為 `fork`；未綁定討論串的產生作業預設為 `isolated`。可見分支必須以與要求者相同的代理為目標。
</ParamField>
<ParamField path="visible" type="boolean" default="false">
  建立使用者可在控制介面中開啟的持久性儀表板工作階段。可見產生作業僅支援 `runtime: "subagent"`，且一律保留所建立的工作階段。
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
`channel`、`to`、`threadId`、`replyTo`、`transport`）。原生子代理會將
其最新的助理回合回報給要求者；外部傳遞仍由
父代理／要求者代理負責。
</Warning>

搭配 `visible: true` 時，支援 `model`、`cwd`，以及同一代理的 `context: "fork"`。沙箱化的目標會將 `cwd` 限制在該代理的工作區內。此路徑無法使用討論串綁定、`mode`、思考覆寫、`lightContext`、`attachments` 和 `attachAs`，因為可見工作階段是透過 `sessions.create` 建立的持久性儀表板工作階段。若要求者本身是以繼承的工具允許清單或拒絕清單產生，則會拒絕可見產生作業；該限制會在產生時固定，且沒有設定覆寫方式。工作階段的列出與定址遵循 `tools.sessions.visibility`；預設的 `tree` 範圍涵蓋目前工作階段及其自身的產生子樹。關於簽出命名、設定、清理與還原行為，請參閱[受管理的工作樹](/zh-TW/concepts/managed-worktrees)。

### 任務名稱與目標指定

`taskName` 是供模型進行協調的識別名稱，而非工作階段金鑰。
當協調代理稍後可能需要檢查該子代理時，請用它設定穩定的子代理名稱，例如 `review_subagents`、
`linux_validation` 或 `docs_update`。

目標解析接受完全符合的 `taskName` 與無歧義的
前綴。比對範圍會限制在編號 `/subagents` 目標所使用的相同作用中／近期目標視窗內，因此過時且已完成的子代理不會讓
重複使用的識別名稱產生歧義。若兩個作用中或近期子代理共用相同的
`taskName`，目標即有歧義；請改用清單索引、工作階段金鑰或
執行 ID。

保留目標 `last` 和 `all` 不是有效的 `taskName` 值，
因為它們已有控制用途。

## 工具：`sessions_yield`

結束目前的模型回合並等待執行階段事件（主要是
子代理完成事件）作為下一則訊息送達。在產生必要的子工作後，
若要求者必須等到這些工作完成才能產生最終
答案，請使用此工具。

`sessions_yield` 是等待原語。請勿改用針對 `subagents`、`sessions_list`、`sessions_history`、shell
`sleep` 或程序輪詢的迴圈，僅為偵測子代理是否完成。

僅當工作階段的有效工具清單包含
`sessions_yield` 時才使用它。某些最小化或自訂工具設定檔可能會公開 `sessions_spawn` 和
`subagents`，但不公開 `sessions_yield`；此時請勿自創
輪詢迴圈，只為等待工作完成。

當存在作用中的子代理時，OpenClaw 會將精簡、由執行階段產生的
`Active Subagents` 提示區塊注入一般回合中，讓要求者無須輪詢即可查看
目前的子工作階段、執行 ID、狀態、標籤、任務與
`taskName` 別名。該區塊中的任務與標籤欄位會以資料形式加上引號，而非視為指令，因為它們可能
來自使用者／模型提供的產生參數。

## 工具：`subagents`

列出由要求者工作階段樹擁有的已產生子代理執行與背景任務記錄。任務資料列涵蓋原生子代理、ACP 執行、
閘道命令列介面／媒體工作，以及排程執行。其範圍限制於目前的
要求者；子代理只能查看自己控制的子代理。

使用 `subagents` 進行隨選狀態檢查與偵錯。使用 `sessions_yield`
等待完成事件。

使用 `action: "cancel"` 搭配 `action: "list"` 傳回的 `taskId` 來停止
任務。取消僅限於受控制的工作階段樹；葉節點
子代理無法取消其他工作階段擁有的工作。

## 綁定討論串的工作階段

當頻道啟用討論串綁定時，子代理可以持續綁定至
討論串，使該討論串中的後續使用者訊息繼續路由至
同一個子代理工作階段。

### 支援討論串的頻道

當頻道註冊對話
綁定轉接器時，便支援持久性、綁定討論串的子代理工作階段
（`sessions_spawn` 搭配 `thread: true`）。提供此支援的內建頻道包括：**Discord**、
**iMessage**、**Matrix** 和 **Telegram**。Discord 和 Matrix 預設會
建立子討論串；Telegram 和 iMessage 預設會綁定
目前對話。請使用各頻道的 `threadBindings` 設定鍵來控制
啟用、逾時與 `spawnSessions`。

### 快速流程

<Steps>
  <Step title="產生">
    `sessions_spawn` 搭配 `thread: true`（也可選擇搭配 `mode: "session"`）。
  </Step>
  <Step title="綁定">
    OpenClaw 會在作用中的頻道內建立討論串，或將討論串綁定至該工作階段目標。
  </Step>
  <Step title="路由後續訊息">
    該討論串中的回覆與後續訊息會路由至已綁定的工作階段。
  </Step>
  <Step title="檢查逾時">
    使用 `/session idle` 檢查／更新閒置時自動取消聚焦，並使用
    `/session max-age` 控制硬性上限。
  </Step>
  <Step title="解除連結">
    使用 `/unfocus` 手動解除連結。
  </Step>
</Steps>

### 手動控制

| 命令            | 效果                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | 將目前討論串（或建立一個討論串）綁定至子代理／工作階段目標                     |
| `/unfocus`         | 移除目前已綁定討論串的綁定                                           |
| `/agents`          | 列出作用中的執行與綁定狀態（`binding:<id>`、`unbound` 或 `bindings unavailable`） |
| `/session idle`    | 檢查／更新閒置時自動取消聚焦（僅限已聚焦的綁定討論串）                             |
| `/session max-age` | 檢查／更新硬性上限（僅限已聚焦的綁定討論串）                                      |

### 設定開關

- **全域預設值：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **頻道覆寫與產生時自動綁定鍵**依轉接器而異。請參閱上方的[支援討論串的頻道](#thread-supporting-channels)。

關於目前的轉接器詳細資訊，請參閱[設定參考](/zh-TW/gateway/configuration-reference)與
[斜線命令](/zh-TW/tools/slash-commands)。

### 允許清單

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可透過明確的 `agentId` 指定為目標的已設定代理 ID 清單（`["*"]` 允許任何已設定目標）。預設：僅要求者代理。若你設定了清單，但仍希望要求者透過 `agentId` 產生自身，請將要求者 ID 納入清單。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  當要求者代理未設定自己的 `subagents.allowAgents` 時使用的預設已設定目標代理允許清單。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選擇設定檔）。個別代理覆寫：`agents.list[].subagents.requireAgentId`。
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  閘道 `agent` 公告傳遞嘗試的每次呼叫逾時。值為正整數毫秒，並會限制在平台安全的計時器上限內。暫時性重試可能使公告等待總時間超過單次設定的逾時。
</ParamField>

若要求者工作階段已在沙箱中，`sessions_spawn` 會拒絕
將在沙箱外執行的目標。

### 探索

使用 `agents_list` 查看目前哪些代理程式 ID 可用於
`sessions_spawn`。回應包含每個列出代理程式的有效
模型與內嵌執行階段中繼資料，讓呼叫端能區分 OpenClaw、Codex
app-server，以及其他已設定的原生執行階段。

`allowAgents` 項目必須指向 `agents.list[]` 中已設定的代理程式 ID。
`["*"]` 表示任何已設定的目標代理程式加上要求者。如果代理程式設定
已刪除，但其 ID 仍保留在 `allowAgents` 中，`sessions_spawn` 會拒絕該 ID，
而 `agents_list` 會將其省略。執行 `openclaw doctor --fix` 以清除過時的
允許清單項目，或者當目標應在繼承預設值的同時仍可被衍生時，新增最小化的
`agents.list[]` 項目。

### 自動封存

- 子代理程式工作階段會在 `agents.defaults.subagents.archiveAfterMinutes` 後自動封存（預設為 `60`）。
- 封存會使用 `sessions.delete`，並將逐字稿重新命名為 `*.deleted.<timestamp>`（位於同一資料夾）。
- `cleanup: "delete"` 會在宣告後立即封存（仍會透過重新命名保留逐字稿）。
- 自動封存採盡力而為；如果閘道重新啟動，待處理的計時器將會遺失。
- 已設定的執行逾時**不會**自動封存；它們只會停止執行。工作階段會保留至自動封存為止。
- 自動封存同樣適用於深度 1 和深度 2 的工作階段。
- 瀏覽器清理與封存清理彼此獨立：執行完成時，系統會盡力關閉所追蹤的瀏覽器分頁／程序，即使逐字稿／工作階段記錄仍予保留。

## 巢狀子代理程式

根據預設，子代理程式無法衍生自己的子代理程式
（`maxSpawnDepth: 1`）。將 `maxSpawnDepth: 2` 設定為啟用一層
巢狀結構，也就是**協調器模式**：主要代理程式 → 協調器子代理程式 →
工作者子子代理程式。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允許子代理程式衍生子項（預設：1，範圍 1-5）
        maxChildrenPerAgent: 5, // 每個代理程式工作階段的作用中子項上限（預設：5，範圍 1-20）
        maxConcurrent: 8, // 全域並行通道上限（預設：8）
        runTimeoutSeconds: 900, // sessions_spawn 的預設逾時（0 = 不逾時）
        announceTimeoutMs: 120000, // 每次呼叫的閘道宣告逾時
      },
    },
  },
}
```

### 深度層級

| 深度 | 工作階段金鑰形式                            | 角色                                          | 可以衍生嗎？                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主要代理程式                                    | 一律可以                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子代理程式（允許深度 2 時為協調器） | 僅限 `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子代理程式（葉節點工作者）                   | 永遠不行                        |

### 宣告鏈

結果沿鏈向上回傳：

1. 深度 2 工作者完成 → 向其父項（深度 1 協調器）宣告。
2. 深度 1 協調器收到宣告、綜整結果並完成 → 向主要代理程式宣告。
3. 主要代理程式收到宣告並傳送給使用者。

每一層只會看到其直接子項的宣告。

<Note>
**操作指引：**只啟動一次子項工作並等待完成
事件，不要圍繞 `sessions_list`、
`sessions_history`、`/subagents list` 或 `exec` 休眠命令建立輪詢迴圈。
`sessions_list` 和 `/subagents list` 會使子工作階段關係
聚焦於進行中的工作——作用中子項會保持附加，已結束的子項會在短暫的近期視窗內
維持可見，而僅存在於儲存區的過時子項連結則會在超出其新鮮度視窗後
遭到忽略。這可防止舊的 `spawnedBy` /
`parentSessionKey` 中繼資料在重新啟動後讓幽靈子項重新出現。
如果你已送出最終答案後才收到子項完成事件，正確的後續動作是使用完全一致的靜默權杖
`NO_REPLY` / `no_reply`。
</Note>

### 依深度套用的工具政策

- 子項在衍生時會擷取要求者的有效傳送者政策。即使 `toolsBySender` 之後有所變更，無傳送者的子項執行及經驗證的操作員恢復仍會保留該快照；目前的全域、代理程式、提供者、沙箱及子代理程式限制仍然適用。新的外部頻道回合若以該子項為目標，則會改為重新解析目前的傳送者政策。
- 角色與控制範圍會在衍生時寫入工作階段中繼資料。這能避免扁平化或還原的工作階段金鑰意外重新取得協調器權限。
- **深度 1（協調器，當 `maxSpawnDepth >= 2` 時）：**取得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，因此可衍生子項並檢查其狀態。其他工作階段／系統工具仍會遭到拒絕。
- **深度 1（葉節點，當 `maxSpawnDepth == 1` 時）：**沒有工作階段工具（目前的預設行為）。
- **深度 2（葉節點工作者）：**沒有工作階段工具——`sessions_spawn` 在深度 2 一律遭到拒絕。無法繼續衍生子項。

### 每個代理程式的衍生上限

每個代理程式工作階段（無論任何深度）同一時間最多可以有 `maxChildrenPerAgent`
個（預設為 `5`）作用中子項。這可防止單一協調器無限制地向外擴散。

### 級聯停止

停止深度 1 協調器時，會自動停止其所有深度 2
子項：

- 在主要聊天中執行 `/stop`，會停止所有深度 1 代理程式，並級聯停止其深度 2 子項。

## 驗證

子代理程式的驗證會依**代理程式 ID**解析，而非依工作階段類型：

- 子代理程式工作階段金鑰為 `agent:<agentId>:subagent:<uuid>`。
- 驗證儲存區會從該代理程式的 `agentDir` 載入。
- 主要代理程式的驗證設定檔會作為**備援**合併；發生衝突時，代理程式設定檔會覆寫主要代理程式設定檔。

此合併為附加式，因此主要代理程式設定檔一律可作為
備援使用。目前尚不支援每個代理程式完全隔離的驗證。

## 宣告

子代理程式會透過宣告步驟回報：

- 宣告步驟在子代理程式工作階段內執行（而非要求者工作階段）。
- 如果子代理程式的回覆完全等於 `ANNOUNCE_SKIP`，則不會發布任何內容。
- 如果最新的助理文字是完全一致的靜默權杖 `NO_REPLY` / `no_reply`，即使先前存在可見的進度，也會抑制宣告輸出。

傳送方式取決於要求者深度：

- 頂層要求者工作階段會使用後續的 `agent` 呼叫進行外部傳送（`deliver=true`）。
- 巢狀要求者子代理程式工作階段會收到內部後續注入（`deliver=false`），讓協調器可在工作階段內綜整子項結果。
- 如果巢狀要求者子代理程式工作階段已不存在，OpenClaw 會在可用時退回至該工作階段的要求者。

對於頂層要求者工作階段，完成模式的直接傳送會先
解析任何已繫結的對話／討論串路由與鉤子覆寫，接著再從要求者工作階段儲存的路由
補齊缺少的頻道目標欄位。如此即使完成事件的來源
只識別出頻道，也能讓完成事件傳送到正確的聊天／主題。

建立巢狀完成發現項目時，子項完成彙整的範圍會限制在目前的要求者執行，
避免先前執行中過時的子項輸出洩漏至目前的宣告。頻道配接器可用時，
宣告回覆會保留討論串／主題路由。

### 宣告內容

宣告內容會正規化為穩定的內部事件區塊：

| 欄位          | 來源                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| 來源         | `subagent` 或 `cron`                                                                                     |
| 工作階段 ID    | 子工作階段金鑰／ID                                                                                     |
| 類型           | 宣告類型 + 工作標籤                                                                               |
| 狀態         | 衍生自執行階段結果（`ok`、`error`、`timeout` 或 `unknown`）——**並非**根據模型文字推斷 |
| 結果內容 | 子項最新的可見助理文字                                                             |
| 後續動作      | 說明何時回覆或保持靜默的指示                                                      |

最終失敗的執行會回報失敗狀態，而不會重播已擷取的
回覆文字。工具／toolResult 輸出不會提升為子項結果文字。

### 統計資料行

宣告承載資料的末尾會包含統計資料行（即使經過換行包裝）：

- 執行時間（例如 `runtime 5m12s`）。
- 權杖用量（輸入／輸出／總計）。
- 已設定模型定價時的估計成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 和逐字稿路徑，讓主要代理程式可透過 `sessions_history` 擷取歷程記錄，或檢查磁碟上的檔案。

內部中繼資料僅供協調作業使用；面向使用者的回覆
應改寫為一般的助理語氣。

### 為何偏好 `sessions_history`

`sessions_history` 是在代理程式回合內讀取子項
逐字稿時較安全的協調路徑：

- 即使一般用途的記錄遮蔽功能已停用，也會遮蔽類似認證資訊／權杖的文字。
- 截斷過長的文字區塊（每個區塊 4000 個字元），並捨棄思考簽章、推理重播承載資料及內嵌圖片資料。
- 強制執行 80 KB 的回應上限；過大的資料列會替換為 `[sessions_history omitted: message too large]`。
- 若有 `nextOffset`，使用它向後分頁瀏覽較舊的逐字稿視窗。
- `sessions_history` **不會**從訊息文字中移除推理標籤、`<relevant-memories>` 框架或工具呼叫 XML——它會傳回接近原始逐字稿形式的結構化內容區塊，只進行遮蔽及大小限制。`/subagents log` 會套用更強的散文清理器（移除推理標籤、記憶框架及工具呼叫 XML），因為它呈現的是純文字聊天行，而非結構化區塊。
- 當你需要完整且逐位元組相符的逐字稿時，直接檢查磁碟上的原始逐字稿是備援方式。

## 工具政策

子代理程式會先使用與父代理程式或
目標代理程式相同的設定檔與工具政策管線。之後，OpenClaw 會套用子代理程式限制
層。

無論深度或角色為何，子代理程式一律無法使用 `gateway`、`agents_list`、`session_status` 和
`cron`（系統層級／互動式工具，或
應由主要代理程式協調的工具）。葉節點子代理程式（預設的深度 1
行為，以及深度 2 的所有情況）還會失去 `subagents`、
`sessions_list`、`sessions_history` 和 `sessions_spawn`。子代理程式永遠
不會取得 `message` 工具——該工具是在衍生時停用，而不是由
此拒絕清單篩除——而 `sessions_send` 會維持拒絕狀態，讓子代理程式
只能透過宣告鏈進行通訊。

`sessions_history` 在此也仍是有界且經清理的回溯檢視——它
不是原始逐字稿傾印。

當 `maxSpawnDepth >= 2` 時，深度 1 協調器子代理程式會額外
取得 `sessions_spawn`、`subagents`、`sessions_list` 和
`sessions_history`，以便管理其子項。

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
        // 若設定 allow，便只允許其中項目（拒絕規則仍優先）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` 是最終的僅允許篩選器。它可以縮小
已解析的工具集合，但無法**加回**已由
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

只有單一代理程式應取得瀏覽器自動化功能時，請使用每個代理程式的
`agents.list[].tools.alsoAllow: ["browser"]`。

## 並行處理

子代理程式使用專用的處理序內佇列通道：

- **通道名稱：** `subagent`
- **並行數：** `agents.defaults.subagents.maxConcurrent`（預設 `8`）

## 存活狀態與復原

OpenClaw 不會將缺少 `endedAt` 視為子代理程式仍然
存活的永久證明。未結束且超過過時執行時間範圍的執行
（2 小時，或設定的執行逾時加上一小段寬限期，
取兩者中較長者）不再於 `/subagents list`、
狀態摘要、後代完成閘控及每個工作階段的
並行檢查中計為作用中／待處理。

閘道重新啟動後，系統會清除已還原但過時且未結束的執行，除非
其子工作階段標記為 `abortedLastRun: true`。因重新啟動而中止的
執行仍會保留註冊，以供子代理程式孤立項目復原流程使用：過時的
執行會直接完成而不續行，而近期的子工作階段會先收到
合成的續行訊息，之後才清除中止標記。

每個子工作階段的自動重新啟動復原次數有限。如果同一個
子代理程式的子項目在快速再次卡住的時間範圍內反覆獲准進行孤立項目復原，
OpenClaw 會在該工作階段保留復原墓碑，並停止在後續重新啟動時
自動續行該工作階段。請執行
`openclaw tasks maintenance --apply` 來調整任務記錄，或執行
`openclaw doctor --fix` 來清除已有墓碑之工作階段上過時的
中止復原旗標。

<Note>
如果產生子代理程式時因閘道 `PAIRING_REQUIRED` /
`scope-upgrade` 而失敗，請先檢查 RPC 呼叫端，再編輯配對狀態。
當呼叫端已在閘道要求情境中執行時，內部
`sessions_spawn` 協調會在處理序內分派，因此不會
開啟迴路 WebSocket，也不依賴命令列介面的已配對裝置範圍
基準線。閘道處理序外的呼叫端仍會使用 WebSocket
後援，並以 `client.id: "gateway-client"` 搭配 `client.mode: "backend"`
，透過直接迴路共用權杖／密碼驗證。遠端呼叫端、明確的
`deviceIdentity`、明確的裝置權杖路徑，以及瀏覽器／節點用戶端，
在升級範圍時仍需經過正常的裝置核准。
</Note>

## 停止

- 在要求者聊天中傳送 `/stop` 會中止要求者工作階段，並停止由該工作階段產生的所有作用中子代理程式執行，且會連鎖停止巢狀子項目。

## 限制

- 子代理程式通知採**盡力而為**。若閘道重新啟動，待處理的「回報通知」工作將會遺失。
- 子代理程式仍共用相同的閘道處理序資源；請將 `maxConcurrent` 視為安全閥。
- `sessions_spawn` 一律不會阻塞：它會立即傳回 `{ status: "accepted", runId, childSessionKey }`。
- 子代理程式情境只會注入 `AGENTS.md` 與 `TOOLS.md`（不包含 `SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。Codex 原生子代理程式遵循相同邊界：`TOOLS.md` 會保留在繼承的 Codex 對話串指示中，而僅屬於父項目的角色設定、身分與使用者檔案，則會以限定於該輪的協作指示注入，避免子項目複製這些內容。
- 最大巢狀深度為 5（`maxSpawnDepth` 範圍：1-5）。大多數使用情境建議使用深度 2。
- `maxChildrenPerAgent` 會限制每個工作階段的作用中子項目數量（預設 `5`，範圍 `1-20`）。

## 相關內容

- [工作階段工具與狀態變更](/zh-TW/concepts/session-tool)
- [ACP 代理程式](/zh-TW/tools/acp-agents)
- [代理程式傳送](/zh-TW/tools/agent-send)
- [背景工作](/zh-TW/automation/tasks)
- [多代理程式沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
