---
read_when:
    - 你想透過代理程式進行背景或平行工作
    - 你正在變更 sessions_spawn 或子代理工具政策
    - 你正在實作或疑難排解與對話串綁定的子代理工作階段
sidebarTitle: Sub-agents
summary: 產生隔離的背景代理程式執行，並將結果公告回請求者聊天
title: 子代理
x-i18n:
    generated_at: "2026-06-27T20:10:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf8b819b1bb478c5161a7493f6a806aefb8df252e6c3d9faeee94a66689a5f5f
    source_path: tools/subagents.md
    workflow: 16
---

子代理是從既有代理執行中產生的背景代理執行。
它們會在自己的工作階段（`agent:<agentId>:subagent:<uuid>`）中執行，
完成後會將結果**公告**回請求者聊天
頻道。每個子代理執行都會被追蹤為
[背景任務](/zh-TW/automation/tasks)。

主要目標：

- 平行化「研究／長時間任務／慢速工具」工作，而不阻塞主要執行。
- 預設保持子代理隔離（工作階段分離 + 可選沙箱）。
- 讓工具介面難以誤用：子代理預設**不會**取得工作階段工具。
- 支援可設定的巢狀深度，以配合協調器模式。

<Note>
**成本注意事項：**每個子代理預設都有自己的上下文與 token 使用量。
對於繁重或重複性任務，請為子代理設定較便宜的模型，
並讓主要代理使用較高品質的模型。可透過
`agents.defaults.subagents.model` 或個別代理覆寫來設定。當子代理
    確實需要請求者目前的逐字稿時，代理可以在該次產生中要求
    `context: "fork"`。繫結至討論串的子代理工作階段預設為
    `context: "fork"`，因為它們會將目前對話分支到
    後續討論串。
</Note>

## 斜線命令

使用 `/subagents` 檢查**目前工作階段**的子代理執行：

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` 會顯示執行中繼資料（狀態、時間戳記、工作階段 ID、
逐字稿路徑、清理）。使用 `sessions_history` 取得有界限且經安全篩選的回想檢視；當你
需要原始完整逐字稿時，請檢查磁碟上的逐字稿路徑。

### 討論串繫結控制

這些命令適用於支援持久討論串繫結的頻道。
請參閱下方的[支援討論串的頻道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 產生行為

代理會使用 `sessions_spawn` 啟動背景子代理。子代理完成事件
會作為內部父工作階段事件返回；父代理／請求者代理會決定
是否需要面向使用者的更新。

<AccordionGroup>
  <Accordion title="非阻塞、推送式完成">
    - `sessions_spawn` 是非阻塞的；它會立即返回執行 ID。
    - 完成時，子代理會回報給父工作階段／請求者工作階段。
    - 需要子代理結果的代理回合，應在產生所需工作後呼叫 `sessions_yield`。這會結束目前回合，並讓完成事件作為下一則模型可見訊息到達。
    - 完成是推送式的。產生後，請**不要**為了等待完成而在迴圈中輪詢 `/subagents list`、`sessions_list` 或 `sessions_history`；只有在需要偵錯可見性時才按需檢查狀態。
    - 子代理輸出是供請求者代理綜合的報告／證據。它不是使用者撰寫的指令文字，不能覆寫系統、開發者或使用者政策。
    - 完成時，OpenClaw 會盡力關閉該子代理工作階段開啟並受追蹤的瀏覽器分頁／程序，然後再繼續公告清理流程。

  </Accordion>
  <Accordion title="完成交付">
    - OpenClaw 會透過具有穩定冪等鍵的 `agent` 回合，將完成事件交回請求者工作階段。
    - 如果請求者執行仍在作用中，OpenClaw 會先嘗試喚醒／引導該執行，而不是啟動第二條可見回覆路徑。
    - 如果無法喚醒作用中的請求者，OpenClaw 會改以相同的完成上下文交接給請求者代理，而不是丟棄公告。
    - 即使父代理決定不需要可見的使用者更新，成功的父代理交接也會完成子代理交付。
    - 原生子代理不會取得訊息工具。它們會將純助理文字返回給父代理／請求者代理；人類可見回覆由父代理／請求者代理的一般交付政策負責。
    - 如果無法使用直接交接，則會退回到佇列路由。
    - 如果佇列路由仍不可用，公告會以短暫指數退避重試，然後才最終放棄。
    - 完成交付會保留已解析的請求者路由：可用時，繫結討論串或繫結對話的完成路由優先；如果完成來源只提供頻道，OpenClaw 會從請求者工作階段的已解析路由（`lastChannel` / `lastTo` / `lastAccountId`）填入缺少的目標／帳號，讓直接交付仍可運作。

  </Accordion>
  <Accordion title="完成交接中繼資料">
    交接給請求者工作階段的完成資料是執行階段產生的
    內部上下文（不是使用者撰寫的文字），並包含：

    - `Result` — 子代理最新可見的 `assistant` 回覆文字。工具／toolResult 輸出不會提升為子代理結果。終端失敗的執行不會重用擷取的回覆文字。
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`。
    - 精簡的執行階段／token 統計資料。
    - 一則審查指令，告知請求者代理在判斷原始任務是否完成前先驗證結果。
    - 後續指引，告知請求者代理在子代理結果仍有更多動作時繼續任務或記錄後續事項。
    - 一則用於無更多動作路徑的最終更新指令，以一般助理語氣撰寫，不轉發原始內部中繼資料。

  </Accordion>
  <Accordion title="模式與 ACP 執行階段">
    - `--model` 和 `--thinking` 會覆寫該特定執行的預設值。
    - 使用 `info`/`log` 在完成後檢查詳細資訊與輸出。
    - 對於持久的討論串繫結工作階段，請使用帶有 `thread: true` 和 `mode: "session"` 的 `sessions_spawn`。
    - 如果請求者頻道不支援討論串繫結，請使用 `mode: "run"`，而不是重試不可能的討論串繫結組合。
    - 對於 ACP harness 工作階段（Claude Code、Gemini CLI、OpenCode，或明確的 Codex ACP/acpx），當工具宣告該執行階段時，請使用帶有 `runtime: "acp"` 的 `sessions_spawn`。偵錯完成事件或代理對代理迴圈時，請參閱 [ACP 交付模型](/zh-TW/tools/acp-agents#delivery-model)。啟用 `codex` 外掛時，除非使用者明確要求 ACP/acpx，否則 Codex 聊天／討論串控制應優先使用 `/codex ...` 而不是 ACP。
    - OpenClaw 會隱藏 `runtime: "acp"`，直到 ACP 已啟用、請求者未被沙箱化，且已載入如 `acpx` 的後端外掛。`runtime: "acp"` 需要外部 ACP harness ID，或具有 `runtime.type="acp"` 的 `agents.list[]` 項目；一般 OpenClaw 設定代理（來自 `agents_list`）請使用預設子代理執行階段。

  </Accordion>
</AccordionGroup>

## 上下文模式

除非呼叫者明確要求分支目前逐字稿，否則原生子代理會以隔離模式啟動。

| 模式       | 使用時機                                                                                                                         | 行為                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、獨立實作、慢速工具工作，或任何可在任務文字中簡述的事項                           | 建立乾淨的子代理逐字稿。這是預設值，並可降低 token 使用量。  |
| `fork`     | 依賴目前對話、先前工具結果，或請求者逐字稿中已有的細微指令的工作 | 在子代理啟動前，將請求者逐字稿分支到子代理工作階段。 |

請節制使用 `fork`。它用於對上下文敏感的委派，
不是撰寫清楚任務提示的替代品。

## 工具：`sessions_spawn`

在全域 `subagent` 通道上以 `deliver: false` 啟動子代理執行，
然後執行公告步驟，並將公告回覆張貼到請求者
聊天頻道。

可用性取決於呼叫者的有效工具政策。`coding` 和
`full` 設定檔預設會公開 `sessions_spawn`。`messaging` 設定檔
則不會；若代理應能委派工作，請新增 `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]`，或使用 `tools.profile: "coding"`。
頻道／群組、提供者、沙箱，以及個別代理的允許／拒絕政策
仍可在設定檔階段後移除該工具。請在相同
工作階段中使用 `/tools` 確認有效工具清單。

**預設值：**

- **模型：**原生子代理會繼承呼叫者，除非你設定 `agents.defaults.subagents.model`（或個別代理的 `agents.list[].subagents.model`）。ACP 執行階段產生在有設定時會使用相同的子代理模型；否則 ACP harness 會保留自己的預設值。明確的 `sessions_spawn.model` 仍會優先。
- **思考：**原生子代理會繼承呼叫者，除非你設定 `agents.defaults.subagents.thinking`（或個別代理的 `agents.list[].subagents.thinking`）。ACP 執行階段產生也會套用所選模型的 `agents.defaults.models["provider/model"].params.thinking`。明確的 `sessions_spawn.thinking` 仍會優先。
- **執行逾時：**設定時，OpenClaw 會使用 `agents.defaults.subagents.runTimeoutSeconds`；否則會退回到 `0`（無逾時）。`sessions_spawn` 不接受每次呼叫的逾時覆寫。
- **任務交付：**原生子代理會在第一則可見的 `[Subagent Task]` 訊息中收到委派任務。子代理系統提示會帶有執行階段規則與路由上下文，而不是任務的隱藏副本。

已接受的原生子代理產生，會在工具結果中包含已解析的子代理模型中繼資料：
`resolvedModel` 包含套用的模型參照，
`resolvedProvider` 則在參照含有提供者前綴時包含該前綴。

### 委派提示模式

`agents.defaults.subagents.delegationMode` 只控制提示指引；它不會改變工具政策或強制委派。

- `suggest`（預設）：保留標準提示提醒，建議對較大或較慢的工作使用子代理。
- `prefer`：告訴主要代理保持回應性，並將任何比直接回覆更複雜的事項透過 `sessions_spawn` 委派出去。

個別代理覆寫使用 `agents.list[].subagents.delegationMode`。

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
  可選的穩定控制代碼，用於在後續狀態輸出中識別特定子項。必須符合 `[a-z][a-z0-9_-]{0,63}`，且不能是 `last` 或 `all` 等保留目標。
</ParamField>
<ParamField path="label" type="string">
  可選的人類可讀標籤。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允許時，於另一個已設定的代理 ID 底下產生。
</ParamField>
<ParamField path="cwd" type="string">
  可選的子執行任務工作目錄。原生子代理仍會從目標代理工作區載入啟動檔案；`cwd` 只會變更執行階段工具和命令列介面控制框架執行委派工作的所在位置。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 僅適用於外部 ACP 控制框架（`claude`、`droid`、`gemini`、`opencode`，或明確要求的 Codex ACP/acpx），以及 `runtime.type` 為 `acp` 的 `agents.list[]` 項目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  僅限 ACP。當 `runtime: "acp"` 時恢復現有 ACP 控制框架工作階段；原生子代理產生時會忽略。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  僅限 ACP。當 `runtime: "acp"` 時，將 ACP 執行輸出串流至父工作階段；原生子代理產生時省略。
</ParamField>
<ParamField path="model" type="string">
  覆寫子代理模型。無效值會被略過，子代理會在預設模型上執行，並在工具結果中顯示警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆寫子代理執行的思考層級。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  當為 `true` 時，為此子代理工作階段要求頻道討論串繫結。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，預設會變成 `session`。`mode: "session"` 需要 `thread: true`。
  如果請求者頻道無法使用討論串繫結，請改用 `mode: "run"`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 會在宣布後立即封存（仍會透過重新命名保留文字記錄）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` 會拒絕產生，除非目標子執行階段已沙盒化。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 會將請求者目前的文字記錄分支到子工作階段。僅限原生子代理。繫結討論串的產生預設為 `fork`；非討論串產生預設為 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受頻道遞送參數（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）。原生子代理會將
其最新的助理回合回報給請求者；外部遞送仍由
父/請求者代理處理。
</Warning>

### 任務名稱與目標指定

`taskName` 是面向模型的編排控制代碼，不是工作階段金鑰。
當協調器之後可能需要檢查該子項時，請將它用於穩定的子項名稱，例如 `review_subagents`、
`linux_validation` 或 `docs_update`。

目標解析接受精確的 `taskName` 符合，以及明確無歧義的
前綴。比對範圍限於編號 `/subagents` 目標所使用的相同作用中/近期目標視窗，因此過期的已完成子項不會讓
重複使用的控制代碼變得有歧義。如果兩個作用中或近期子項共用相同的
`taskName`，該目標即有歧義；請改用清單索引、工作階段金鑰或
執行 ID。

保留目標 `last` 和 `all` 不是有效的 `taskName` 值，
因為它們已經具有控制含義。

## 工具：`sessions_yield`

結束目前模型回合並等待執行階段事件，主要是
子代理完成事件，作為下一則訊息抵達。當請求者必須等到必要子項工作完成後
才能產生最終答案時，請在產生這些子項工作後使用它。

`sessions_yield` 是等待原語。不要為了偵測子項完成，就用對 `subagents`、`sessions_list`、`sessions_history`、shell
`sleep` 或程序輪詢的輪詢迴圈取代它。

僅在工作階段的有效工具清單包含
`sessions_yield` 時使用。有些最小或自訂工具設定檔可能會公開 `sessions_spawn` 和
`subagents`，但不公開 `sessions_yield`；在這種情況下，不要為了等待完成而發明
輪詢迴圈。

當存在作用中子項時，OpenClaw 會將精簡的執行階段產生
`Active Subagents` 提示區塊注入一般回合，讓請求者可以在不輪詢的情況下看見
目前的子工作階段、執行 ID、狀態、標籤、任務和
`taskName` 別名。該區塊中的任務和標籤欄位會以資料形式加上引號，
而不是指令，因為它們可能來自使用者/模型提供的產生引數。

## 工具：`subagents`

列出由請求者工作階段擁有的已產生子代理執行。其範圍限於
目前請求者；子項只能看見自己控制的子項。

使用 `subagents` 進行隨選狀態查看與偵錯。使用 `sessions_yield` 來
等待完成事件。

## 繫結討論串的工作階段

當某個頻道啟用討論串繫結時，子代理可以保持繫結
到討論串，讓該討論串中的後續使用者訊息持續路由到
同一個子代理工作階段。

### 支援討論串的頻道

任何具有工作階段繫結配接器的頻道都可以支援持久的
繫結討論串子代理工作階段（使用 `thread: true` 的 `sessions_spawn`）。
目前內建配接器包含 Discord 討論串、Matrix 討論串、
Telegram 論壇主題，以及 Feishu 的目前對話繫結。
使用各頻道的 `threadBindings` 設定鍵來啟用、
設定逾時和 `spawnSessions`。

### 快速流程

<Steps>
  <Step title="產生">
    使用帶有 `thread: true`（以及可選的 `mode: "session"`）的 `sessions_spawn`。
  </Step>
  <Step title="繫結">
    OpenClaw 會在作用中頻道中建立討論串，或將討論串繫結到該工作階段目標。
  </Step>
  <Step title="路由後續訊息">
    該討論串中的回覆與後續訊息會路由到繫結的工作階段。
  </Step>
  <Step title="檢查逾時">
    使用 `/session idle` 檢查/更新閒置自動取消聚焦，並
    使用 `/session max-age` 控制硬性上限。
  </Step>
  <Step title="分離">
    使用 `/unfocus` 手動分離。
  </Step>
</Steps>

### 手動控制

| 命令               | 效果                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 將目前討論串（或建立一個）繫結到子代理/工作階段目標                  |
| `/unfocus`         | 移除目前已繫結討論串的繫結                                            |
| `/agents`          | 列出作用中執行與繫結狀態（`thread:<id>` 或 `unbound`）                |
| `/session idle`    | 檢查/更新閒置自動取消聚焦（僅限已聚焦的繫結討論串）                  |
| `/session max-age` | 檢查/更新硬性上限（僅限已聚焦的繫結討論串）                          |

### 設定開關

- **全域預設值：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **頻道覆寫與產生自動繫結鍵** 依配接器而定。請參閱上方的[支援討論串的頻道](#thread-supporting-channels)。

請參閱[設定參考](/zh-TW/gateway/configuration-reference)和
[斜線命令](/zh-TW/tools/slash-commands)以取得目前的配接器詳細資訊。

### 允許清單

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可透過明確 `agentId` 指定的已設定代理 ID 清單（`["*"]` 允許任何已設定目標）。預設：僅限請求者代理。如果你設定了清單，且仍希望請求者能用 `agentId` 產生自身，請將請求者 ID 包含在清單中。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  當請求者代理未設定自己的 `subagents.allowAgents` 時使用的預設已設定目標代理允許清單。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選擇設定檔）。各代理覆寫：`agents.list[].subagents.requireAgentId`。
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  閘道 `agent` 宣布遞送嘗試的每次呼叫逾時。值為正整數毫秒，並會限制在平台安全的計時器最大值內。暫時性重試可能讓總宣布等待時間長於一個設定的逾時。
</ParamField>

如果請求者工作階段已沙盒化，`sessions_spawn` 會拒絕
會在未沙盒化環境中執行的目標。

### 探索

使用 `agents_list` 查看目前允許用於
`sessions_spawn` 的代理 ID。回應會包含每個列出代理的有效
模型與嵌入式執行階段中繼資料，讓呼叫者可以區分 OpenClaw、Codex
應用程式伺服器與其他已設定的原生執行階段。

`allowAgents` 項目必須指向 `agents.list[]` 中已設定的代理 ID。
`["*"]` 表示任何已設定的目標代理加上請求者。如果刪除了代理設定
但其 ID 仍保留在 `allowAgents` 中，`sessions_spawn` 會拒絕該 ID，
而 `agents_list` 會省略它。執行 `openclaw doctor --fix` 來清理過期的
允許清單項目，或在目標應保持可產生並繼承預設值時，加入最小的 `agents.list[]` 項目。

### 自動封存

- 子代理工作階段會在 `agents.defaults.subagents.archiveAfterMinutes` 之後自動封存（預設 `60`）。
- 封存使用 `sessions.delete`，並將文字記錄重新命名為 `*.deleted.<timestamp>`（同一資料夾）。
- `cleanup: "delete"` 會在宣布後立即封存（仍會透過重新命名保留文字記錄）。
- 自動封存是盡力而為；如果閘道重新啟動，待處理計時器會遺失。
- 已設定的執行逾時**不會**自動封存；它們只會停止執行。工作階段會保留到自動封存。
- 自動封存同樣適用於深度 1 和深度 2 工作階段。
- 瀏覽器清理與封存清理是分開的：追蹤的瀏覽器分頁/程序會在執行完成時盡力關閉，即使文字記錄/工作階段記錄被保留。

## 巢狀子代理

預設情況下，子代理無法產生自己的子代理
（`maxSpawnDepth: 1`）。設定 `maxSpawnDepth: 2` 可啟用一層
巢狀結構，也就是**編排器模式**：主項 → 編排器子代理 →
工作者子子代理。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允許子代理產生子項（預設：1）
        maxChildrenPerAgent: 5, // 每個代理工作階段的最大作用中子項數（預設：5）
        maxConcurrent: 8, // 全域並行通道上限（預設：8）
        runTimeoutSeconds: 900, // sessions_spawn 的預設逾時（0 = 無逾時）
        announceTimeoutMs: 120000, // 每次呼叫的閘道宣布逾時
      },
    },
  },
}
```

### 深度層級

| 深度 | 工作階段金鑰形狀                             | 角色                                          | 可產生？                     |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主代理                                        | 一律可以                     |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子代理（允許深度 2 時為編排器）              | 僅當 `maxSpawnDepth >= 2`    |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子代理（葉工作者）                          | 永不                         |

### 宣布鏈

結果會沿著鏈往上回流：

1. 深度 2 工作程式完成 → 向其父層（深度 1 協調器）公告。
2. 深度 1 協調器收到公告、彙整結果並完成 → 向主層公告。
3. 主代理收到公告並交付給使用者。

每一層只會看到其直接子層的公告。

<Note>
**操作指引：**啟動子工作一次，然後等待完成
事件，而不是圍繞 `sessions_list`、
`sessions_history`、`/subagents list` 或 `exec` 睡眠命令建立輪詢迴圈。
`sessions_list` 和 `/subagents list` 讓子工作階段關係
聚焦於即時工作 — 即時子層會保持附加，已結束子層會在短暫的近期視窗內
保持可見，而過時的僅儲存子層連結會在其新鮮度視窗後被
忽略。這會防止舊的 `spawnedBy` /
`parentSessionKey` 中繼資料在重新啟動後復活幽靈子層。
如果子層完成事件在你已送出
最終答案後才抵達，正確的後續回應是精確的靜默權杖
`NO_REPLY` / `no_reply`。
</Note>

### 依深度的工具政策

- 角色和控制範圍會在生成時寫入工作階段中繼資料。這可避免扁平或還原的工作階段金鑰意外重新取得協調器權限。
- **深度 1（協調器，當 `maxSpawnDepth >= 2` 時）：**取得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，因此可生成子層並檢查其狀態。其他工作階段/系統工具仍會被拒絕。
- **深度 1（葉節點，當 `maxSpawnDepth == 1` 時）：**沒有工作階段工具（目前的預設行為）。
- **深度 2（葉節點工作程式）：**沒有工作階段工具 — `sessions_spawn` 在深度 2 一律被拒絕。無法再生成更深層的子層。

### 每個代理的生成限制

每個代理工作階段（任意深度）同時最多可有 `maxChildrenPerAgent`
（預設 `5`）個活躍子層。這可防止單一協調器失控扇出。

### 級聯停止

停止深度 1 協調器會自動停止其所有深度 2
子層：

- 在主聊天中輸入 `/stop` 會停止所有深度 1 代理，並級聯停止其深度 2 子層。

## 驗證

子代理驗證是依 **代理 ID** 解析，而不是依工作階段類型：

- 子代理工作階段金鑰是 `agent:<agentId>:subagent:<uuid>`。
- 驗證存放區會從該代理的 `agentDir` 載入。
- 主代理的驗證設定檔會作為**備援**合併；發生衝突時，代理設定檔會覆寫主設定檔。

此合併是加成式的，因此主設定檔永遠可作為
備援使用。目前尚不支援每個代理完全隔離的驗證。

## 公告

子代理會透過公告步驟回報：

- 公告步驟在子代理工作階段內執行（不是在請求者工作階段內）。
- 如果子代理精確回覆 `ANNOUNCE_SKIP`，則不會發布任何內容。
- 如果最新的助理文字是精確的靜默權杖 `NO_REPLY` / `no_reply`，即使先前已有可見進度，也會抑制公告輸出。

交付取決於請求者深度：

- 頂層請求者工作階段使用帶有外部交付的後續 `agent` 呼叫（`deliver=true`）。
- 巢狀請求者子代理工作階段會收到內部後續注入（`deliver=false`），讓協調器可在工作階段內彙整子層結果。
- 如果巢狀請求者子代理工作階段已不存在，OpenClaw 會在可用時退回到該工作階段的請求者。

對於頂層請求者工作階段，完成模式的直接交付會先
解析任何已綁定的對話/執行緒路由與鉤子覆寫，然後從請求者工作階段儲存的路由
填補缺少的頻道目標欄位。
這可讓完成結果維持在正確的聊天/主題中，即使完成
來源只識別了頻道。

建立巢狀完成發現時，子層完成彙總會限定於目前請求者執行，
避免過時的先前執行子層
輸出洩漏到目前公告中。公告回覆會在頻道配接器可用時保留
執行緒/主題路由。

### 公告內容

公告內容會正規化為穩定的內部事件區塊：

| 欄位          | 來源                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| 來源         | `subagent` 或 `cron`                                                                                          |
| 工作階段 ID    | 子工作階段金鑰/ID                                                                                          |
| 類型           | 公告類型 + 工作標籤                                                                                    |
| 狀態         | 從執行階段結果衍生（`success`、`error`、`timeout` 或 `unknown`）— **不是** 從模型文字推論 |
| 結果內容 | 子層最新可見的助理文字                                                                  |
| 後續      | 描述何時回覆與何時保持靜默的指示                                                           |

終端失敗的執行會回報失敗狀態，而不會重播已擷取的
回覆文字。工具/toolResult 輸出不會提升為子層結果文字。

### 統計資料行

公告承載會在結尾包含統計資料行（即使已包裝）：

- 執行時間（例如 `runtime 5m12s`）。
- 權杖用量（輸入/輸出/總計）。
- 當模型定價已設定時的估計成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 和逐字稿路徑，讓主代理可透過 `sessions_history` 擷取歷史記錄，或檢查磁碟上的檔案。

內部中繼資料僅用於協調；面向使用者的回覆
應以一般助理語氣重寫。

### 為何偏好 `sessions_history`

`sessions_history` 是較安全的協調路徑：

- 助理回想會先正規化：移除 thinking 標籤；移除 `<relevant-memories>` / `<relevant_memories>` 鷹架；移除純文字工具呼叫 XML 承載區塊（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`），包含從未正常關閉的截斷承載；移除降級的工具呼叫/結果鷹架與歷史內容標記；移除洩漏的模型控制權杖（`<|assistant|>`、其他 ASCII `<|...|>`、全形 `<｜...｜>`）；移除格式錯誤的 MiniMax 工具呼叫 XML。
- 認證/類權杖文字會被遮蔽。
- 長區塊可被截斷。
- 非常大的歷史記錄可丟棄較舊列，或以 `[sessions_history omitted: message too large]` 取代過大的列。
- 當你需要完整逐位元組逐字稿時，原始磁碟逐字稿檢查是備援方式。

## 工具政策

子代理會先使用與父層或目標代理相同的設定檔與工具政策管線。之後，OpenClaw 會套用子代理限制
層。

在沒有具限制性的 `tools.profile` 時，子代理會取得**除了
訊息工具、工作階段工具和系統工具之外的所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` 在這裡也仍是有界且已清理的回想視圖 —
它不是原始逐字稿傾印。

當 `maxSpawnDepth >= 2` 時，深度 1 協調器子代理會額外
收到 `sessions_spawn`、`subagents`、`sessions_list` 和
`sessions_history`，讓它們可管理自己的子層。

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
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` 是最終的僅允許篩選器。它可縮小
已解析的工具集合，但無法**加回**已由
`tools.profile` 移除的工具。例如，`tools.profile: "coding"` 包含
`web_search`/`web_fetch`，但不包含 `browser` 工具。若要讓
coding-profile 子代理使用瀏覽器自動化，請在
設定檔階段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

當只有一個代理應取得瀏覽器自動化時，請使用每代理 `agents.list[].tools.alsoAllow: ["browser"]`。

## 並行

子代理使用專用的進程內佇列通道：

- **通道名稱：**`subagent`
- **並行數：**`agents.defaults.subagents.maxConcurrent`（預設 `8`）

## 存活性與復原

OpenClaw 不會將 `endedAt` 缺失視為子代理仍然存活的
永久證明。早於過時執行視窗且尚未結束的執行，
在 `/subagents list`、狀態摘要、
後代完成閘控與每工作階段並行檢查中不再計為活躍/待處理。

閘道重新啟動後，過時且尚未結束的還原執行會被修剪，除非
其子工作階段標記為 `abortedLastRun: true`。這些
重新啟動中止的子工作階段仍可透過子代理
孤兒復原流程復原；該流程會在
清除中止標記前傳送合成的恢復訊息。

自動重新啟動復原會依每個子工作階段設限。如果同一個
子代理子層在快速重新卡住視窗內重複被接受進行孤兒復原，
OpenClaw 會在該工作階段上保留復原墓碑，並在之後的重新啟動中停止自動恢復它。執行
`openclaw tasks maintenance --apply` 以協調工作記錄，或執行
`openclaw doctor --fix` 以清除墓碑工作階段上的過時中止復原旗標。

<Note>
如果子代理生成因閘道 `PAIRING_REQUIRED` /
`scope-upgrade` 而失敗，請先檢查 RPC 呼叫者，再編輯配對狀態。
當呼叫者已在閘道請求內容內執行時，內部 `sessions_spawn` 協調會在進程內派送，因此不會
開啟 loopback WebSocket，也不依賴命令列介面的已配對裝置範圍
基準。閘道進程外部的呼叫者仍會使用 WebSocket
備援，作為 `client.id: "gateway-client"` 並搭配 `client.mode: "backend"`
透過直接 loopback 共享權杖/密碼驗證。遠端呼叫者、明確的
`deviceIdentity`、明確的裝置權杖路徑，以及瀏覽器/節點用戶端
仍需要正常的裝置核准才能升級範圍。
</Note>

## 停止

- 在請求者聊天中傳送 `/stop` 會中止請求者工作階段，並停止任何從其生成的活躍子代理執行，級聯至巢狀子層。

## 限制

- 子代理公告是**盡力而為**。如果閘道重新啟動，待處理的「回頭公告」工作會遺失。
- 子代理仍共享相同的閘道進程資源；請將 `maxConcurrent` 視為安全閥。
- `sessions_spawn` 一律為非阻塞：它會立即回傳 `{ status: "accepted", runId, childSessionKey }`。
- 子代理內容只注入 `AGENTS.md` 和 `TOOLS.md`（沒有 `SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。Codex 原生子代理遵循相同邊界：`TOOLS.md` 會保留在繼承的 Codex 對話串指示中，而僅限父層的人格、身分與使用者檔案會作為回合範圍協作指示注入，因此子層不會複製它們。
- 最大巢狀深度為 5（`maxSpawnDepth` 範圍：1–5）。建議大多數使用情境使用深度 2。
- `maxChildrenPerAgent` 會限制每個工作階段的活躍子層數（預設 `5`，範圍 `1–20`）。

## 相關

- [ACP agents](/zh-TW/tools/acp-agents)
- [Agent send](/zh-TW/tools/agent-send)
- [Background tasks](/zh-TW/automation/tasks)
- [Multi-agent sandbox tools](/zh-TW/tools/multi-agent-sandbox-tools)
