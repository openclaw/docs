---
read_when:
    - 您想透過代理程式進行背景或平行工作
    - 你正在變更 sessions_spawn 或子代理工具政策
    - 你正在實作或疑難排解與執行緒綁定的子代理工作階段
sidebarTitle: Sub-agents
summary: 啟動隔離的背景代理執行，並將結果回報到請求者聊天
title: 子代理
x-i18n:
    generated_at: "2026-06-28T00:13:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 144af6e020c86d171fe6c5734efaad229adaea35f8d1c1b07e37c549805c88ff
    source_path: tools/subagents.md
    workflow: 16
---

子代理是在現有代理執行中產生的背景代理執行。
它們會在自己的工作階段（`agent:<agentId>:subagent:<uuid>`）中執行，並在完成時將結果**宣告**回請求端聊天
頻道。每個子代理執行都會被追蹤為一項
[背景任務](/zh-TW/automation/tasks)。

主要目標：

- 平行化「研究／長時間任務／緩慢工具」工作，而不阻塞主要執行。
- 預設讓子代理保持隔離（工作階段分離 + 選用沙箱）。
- 讓工具介面難以誤用：子代理預設**不會**取得工作階段工具。
- 支援可設定的巢狀深度，以便使用協調器模式。

<Note>
**成本注意事項：**每個子代理預設都有自己的上下文與 token 用量。對於繁重或重複性的任務，請為子代理設定較便宜的模型，並讓主要代理使用較高品質的模型。透過
`agents.defaults.subagents.model` 或各代理覆寫進行設定。當子代理
    確實需要請求端目前的文字紀錄時，代理可以在該次產生時要求
    `context: "fork"`。繫結執行緒的子代理工作階段預設為
    `context: "fork"`，因為它們會將目前對話分支到
    後續執行緒。
</Note>

## 斜線命令

使用 `/subagents` 檢查**目前工作階段**的子代理執行：

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` 會顯示執行中繼資料（狀態、時間戳記、工作階段 ID、
文字紀錄路徑、清理）。使用 `sessions_history` 取得有界且經過安全篩選的回顧檢視；當你需要原始完整文字紀錄時，請檢查磁碟上的文字紀錄路徑。

### 執行緒繫結控制

這些命令適用於支援持久執行緒繫結的頻道。
請參閱下方的[支援執行緒的頻道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 產生行為

代理會使用 `sessions_spawn` 啟動背景子代理。子代理完成後
會以內部父工作階段事件傳回；父代理／請求端代理會決定
是否需要面向使用者的更新。

<AccordionGroup>
  <Accordion title="非阻塞、推送式完成">
    - `sessions_spawn` 是非阻塞的；它會立即傳回執行 ID。
    - 完成時，子代理會回報給父工作階段／請求端工作階段。
    - 需要子代理結果的代理回合，應在產生必要工作後呼叫 `sessions_yield`。這會結束目前回合，並讓完成事件作為下一則模型可見訊息抵達。
    - 完成採推送式。一旦產生後，**不要**在迴圈中輪詢 `/subagents list`、`sessions_list` 或 `sessions_history` 只為等待它完成；僅在需要除錯可見性時按需檢查狀態。
    - 子輸出是提供給請求端代理彙整的報告／證據。它不是使用者撰寫的指示文字，也不能覆寫系統、開發者或使用者政策。
    - 完成時，OpenClaw 會盡力關閉該子代理工作階段開啟並追蹤的瀏覽器分頁／程序，然後再繼續宣告清理流程。

  </Accordion>
  <Accordion title="完成交付">
    - OpenClaw 會透過帶有穩定冪等鍵的 `agent` 回合，將完成結果交回請求端工作階段。
    - 如果請求端執行仍在作用中，OpenClaw 會先嘗試喚醒／引導該執行，而不是啟動第二條可見回覆路徑。
    - 如果無法喚醒作用中的請求端，OpenClaw 會改用帶有相同完成上下文的請求端代理交接，而不是丟棄宣告。
    - 成功的父工作階段交接會完成子代理交付，即使父代理決定不需要可見的使用者更新也是如此。
    - 原生子代理不會取得訊息工具。它們會將純助理文字傳回父代理／請求端代理；人類可見回覆由父代理／請求端代理的一般交付政策負責。
    - 如果無法使用直接交接，則會退回佇列路由。
    - 如果佇列路由仍不可用，宣告會以短暫的指數退避重試，然後才最終放棄。
    - 完成交付會保留已解析的請求端路由：可用時，以繫結執行緒或繫結對話的完成路由為優先；如果完成來源只提供頻道，OpenClaw 會從請求端工作階段已解析的路由（`lastChannel` / `lastTo` / `lastAccountId`）補齊缺少的目標／帳號，讓直接交付仍可運作。

  </Accordion>
  <Accordion title="完成交接中繼資料">
    給請求端工作階段的完成交接是執行階段產生的
    內部上下文（不是使用者撰寫的文字），並包含：

    - `Result` — 子代理最新可見的 `assistant` 回覆文字。工具／toolResult 輸出不會提升為子結果。終端失敗的執行不會重用擷取到的回覆文字。
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`。
    - 精簡的執行階段／token 統計資料。
    - 一項審查指示，要求請求端代理先驗證結果，再決定原始任務是否完成。
    - 後續指引，告訴請求端代理在子結果留下更多動作時繼續任務或記錄後續事項。
    - 一項用於無更多動作路徑的最終更新指示，以一般助理語氣撰寫，不轉送原始內部中繼資料。

  </Accordion>
  <Accordion title="模式與 ACP 執行階段">
    - `--model` 和 `--thinking` 會覆寫該特定執行的預設值。
    - 完成後使用 `info`/`log` 檢查詳細資訊與輸出。
    - 對於持久的執行緒繫結工作階段，請使用帶有 `thread: true` 和 `mode: "session"` 的 `sessions_spawn`。
    - 如果請求端頻道不支援執行緒繫結，請使用 `mode: "run"`，而不是重試不可能的執行緒繫結組合。
    - 對於 ACP 執行器工作階段（Claude Code、Gemini CLI、OpenCode，或明確的 Codex ACP/acpx），當工具宣告該執行階段時，請使用帶有 `runtime: "acp"` 的 `sessions_spawn`。在除錯完成或代理對代理迴圈時，請參閱 [ACP 交付模型](/zh-TW/tools/acp-agents#delivery-model)。當 `codex` 外掛啟用時，除非使用者明確要求 ACP/acpx，否則 Codex 聊天／執行緒控制應優先使用 `/codex ...` 而不是 ACP。
    - OpenClaw 會隱藏 `runtime: "acp"`，直到 ACP 已啟用、請求端未被沙箱化，且已載入如 `acpx` 這類後端外掛。`runtime: "acp"` 需要外部 ACP 執行器 ID，或一個帶有 `runtime.type="acp"` 的 `agents.list[]` 項目；對於來自 `agents_list` 的一般 OpenClaw 設定代理，請使用預設子代理執行階段。

  </Accordion>
</AccordionGroup>

## 上下文模式

原生子代理一開始會保持隔離，除非呼叫端明確要求分支
目前文字紀錄。

| 模式       | 使用時機                                                                                                                         | 行為                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 新研究、獨立實作、緩慢工具工作，或任何可在任務文字中簡要說明的工作                           | 建立乾淨的子文字紀錄。這是預設值，並可降低 token 用量。  |
| `fork`     | 依賴目前對話、先前工具結果，或請求端文字紀錄中已存在的細緻指示的工作 | 在子代理開始前，將請求端文字紀錄分支到子工作階段。 |

請謹慎使用 `fork`。它用於上下文敏感的委派，不是
取代撰寫清楚任務提示的方式。

## 工具：`sessions_spawn`

在全域 `subagent` 通道上以 `deliver: false` 啟動子代理執行，
接著執行宣告步驟，並將宣告回覆張貼到請求端
聊天頻道。

可用性取決於呼叫端的有效工具政策。`coding` 和
`full` 設定檔預設會公開 `sessions_spawn`。`messaging` 設定檔
不會；請加入 `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]`，或對應該委派工作的代理使用 `tools.profile: "coding"`。
頻道／群組、供應商、沙箱，以及各代理的允許／拒絕政策，仍可能在設定檔階段後移除該工具。請從相同
工作階段使用 `/tools` 確認有效工具清單。

**預設值：**

- **模型：**原生子代理會繼承呼叫端，除非你設定 `agents.defaults.subagents.model`（或各代理的 `agents.list[].subagents.model`）。ACP 執行階段產生在設定子代理模型時會使用相同模型；否則 ACP 執行器會保留自己的預設值。明確的 `sessions_spawn.model` 仍會優先。
- **思考：**原生子代理會繼承呼叫端，除非你設定 `agents.defaults.subagents.thinking`（或各代理的 `agents.list[].subagents.thinking`）。ACP 執行階段產生也會套用所選模型的 `agents.defaults.models["provider/model"].params.thinking`。明確的 `sessions_spawn.thinking` 仍會優先。
- **執行逾時：**OpenClaw 會在已設定時使用 `agents.defaults.subagents.runTimeoutSeconds`；否則會退回 `0`（無逾時）。`sessions_spawn` 不接受每次呼叫的逾時覆寫。
- **任務交付：**原生子代理會在第一則可見的 `[Subagent Task]` 訊息中收到委派任務。子代理系統提示會攜帶執行階段規則與路由上下文，而不是任務的隱藏副本。

已接受的原生子代理產生會在工具結果中包含已解析的子模型中繼資料：
`resolvedModel` 包含套用的模型參照，而
`resolvedProvider` 會在參照含有供應商前綴時包含該前綴。

### 委派提示模式

`agents.defaults.subagents.delegationMode` 只控制提示指引；它不會變更工具政策或強制委派。

- `suggest`（預設）：保留標準提示提醒，建議對較大或較慢的工作使用子代理。
- `prefer`：告訴主要代理保持回應性，並將比直接回覆更複雜的任何工作透過 `sessions_spawn` 委派。

各代理覆寫使用 `agents.list[].subagents.delegationMode`。

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
  選用的穩定識別名稱，用於在稍後的狀態輸出中識別特定子項。必須符合 `[a-z][a-z0-9_-]{0,63}`，且不能是 `last` 或 `all` 等保留目標。
</ParamField>
<ParamField path="label" type="string">
  選用的人類可讀標籤。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允許時，於另一個已設定代理 ID 下產生。
</ParamField>
<ParamField path="cwd" type="string">
  子執行的選用任務工作目錄。原生子代理仍會從目標代理工作區載入啟動檔；`cwd` 只會變更執行階段工具與命令列介面 harness 進行委派工作的所在位置。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 僅用於外部 ACP harness（`claude`、`droid`、`gemini`、`opencode`，或明確要求的 Codex ACP/acpx），以及 `runtime.type` 為 `acp` 的 `agents.list[]` 項目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  僅限 ACP。當 `runtime: "acp"` 時恢復既有 ACP harness 工作階段；原生子代理產生時會忽略。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  僅限 ACP。當 `runtime: "acp"` 時，將 ACP 執行輸出串流到父工作階段；原生子代理產生時省略。
</ParamField>
<ParamField path="model" type="string">
  覆寫子代理模型。無效值會被略過，且子代理會使用預設模型執行，並在工具結果中顯示警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆寫子代理執行的思考層級。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  當為 `true` 時，要求此子代理工作階段使用頻道討論串綁定。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，預設會變為 `session`。`mode: "session"` 需要 `thread: true`。
  如果請求者頻道無法使用討論串綁定，請改用 `mode: "run"`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 會在宣布後立即封存（仍會透過重新命名保留逐字稿）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` 會拒絕產生，除非目標子執行階段已沙箱化。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 會將請求者目前的逐字稿分支到子工作階段。僅限原生子代理。綁定討論串的產生預設為 `fork`；非討論串產生預設為 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受頻道傳遞參數（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）。原生子代理會將
其最新的助理回合回報給請求者；外部傳遞仍由父/請求者代理處理。
</Warning>

### 任務名稱與目標指定

`taskName` 是面向模型的編排識別名稱，不是工作階段金鑰。
當協調者稍後可能需要檢查該子項時，可將其用於穩定的子項名稱，例如 `review_subagents`、
`linux_validation` 或 `docs_update`。

目標解析接受精確的 `taskName` 相符項與不含歧義的
前綴。比對範圍限於編號 `/subagents` 目標所使用的相同作用中/近期目標視窗，
因此過期的已完成子項不會讓重複使用的識別名稱變得模稜兩可。如果兩個作用中或近期子項共用相同的
`taskName`，該目標就有歧義；請改用清單索引、工作階段金鑰或
執行 ID。

保留目標 `last` 與 `all` 不是有效的 `taskName` 值，
因為它們已具有控制含義。

## 工具：`sessions_yield`

結束目前模型回合並等待執行階段事件，主要是
子代理完成事件，作為下一則訊息送達。當請求者必須等到這些完成事件送達後才能產生最終
答案時，請在產生必要的子項工作後使用它。

`sessions_yield` 是等待原語。不要只為了偵測子項完成，就用輪詢
`subagents`、`sessions_list`、`sessions_history`、shell
`sleep` 或程序輪詢的迴圈取代它。

僅在工作階段的有效工具清單包含 `sessions_yield` 時使用它。
某些精簡或自訂工具設定檔可能會公開 `sessions_spawn` 與
`subagents`，但不公開 `sessions_yield`；在這種情況下，不要只為了等待完成而發明
輪詢迴圈。

當存在作用中子項時，OpenClaw 會將精簡的執行階段產生
`Active Subagents` 提示區塊注入一般回合，讓請求者無須輪詢即可看到
目前的子工作階段、執行 ID、狀態、標籤、任務與
`taskName` 別名。該區塊中的任務與標籤欄位會作為資料加上引號，
而不是指令，因為它們可能來自使用者/模型提供的產生引數。

## 工具：`subagents`

列出請求者工作階段擁有的已產生子代理執行。其範圍限於
目前請求者；子項只能看到自己控制的子項。

使用 `subagents` 進行按需狀態查詢與除錯。使用 `sessions_yield`
等待完成事件。

## 綁定討論串的工作階段

當頻道已啟用討論串綁定時，子代理可以保持綁定到
討論串，使該討論串中的後續使用者訊息持續路由到
相同的子代理工作階段。

### 支援討論串的頻道

任何具有工作階段綁定配接器的頻道都可以支援持續性的
綁定討論串子代理工作階段（使用 `thread: true` 的 `sessions_spawn`）。
目前內建配接器包含 Discord 討論串、Matrix 討論串、
Telegram 論壇主題，以及 Feishu 的目前對話綁定。
使用各頻道的 `threadBindings` 設定鍵來控制啟用、
逾時與 `spawnSessions`。

### 快速流程

<Steps>
  <Step title="產生">
    使用帶有 `thread: true` 的 `sessions_spawn`（並可選擇性加入 `mode: "session"`）。
  </Step>
  <Step title="綁定">
    OpenClaw 會在作用中頻道中建立討論串，或將討論串綁定到該工作階段目標。
  </Step>
  <Step title="路由後續訊息">
    該討論串中的回覆與後續訊息會路由到綁定的工作階段。
  </Step>
  <Step title="檢查逾時">
    使用 `/session idle` 檢查/更新閒置自動取消聚焦，並使用
    `/session max-age` 控制硬性上限。
  </Step>
  <Step title="分離">
    使用 `/unfocus` 手動分離。
  </Step>
</Steps>

### 手動控制

| 命令               | 效果                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 將目前討論串（或建立一個）綁定到子代理/工作階段目標                  |
| `/unfocus`         | 移除目前已綁定討論串的綁定                                            |
| `/agents`          | 列出作用中執行與綁定狀態（`thread:<id>` 或 `unbound`）                |
| `/session idle`    | 檢查/更新閒置自動取消聚焦（僅限已聚焦的綁定討論串）                  |
| `/session max-age` | 檢查/更新硬性上限（僅限已聚焦的綁定討論串）                          |

### 設定開關

- **全域預設：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **頻道覆寫與產生自動綁定鍵** 依配接器而異。請參閱上方的[支援討論串的頻道](#thread-supporting-channels)。

請參閱[設定參考](/zh-TW/gateway/configuration-reference)與
[斜線命令](/zh-TW/tools/slash-commands)，了解目前的配接器詳細資訊。

### 允許清單

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可透過明確 `agentId` 指定為目標的已設定代理 ID 清單（`["*"]` 允許任何已設定目標）。預設：僅請求者代理。如果你設定清單後仍想讓請求者使用 `agentId` 產生自身，請將請求者 ID 納入清單。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  當請求者代理未設定自己的 `subagents.allowAgents` 時使用的預設已設定目標代理允許清單。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選取設定檔）。每個代理的覆寫：`agents.list[].subagents.requireAgentId`。
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  閘道 `agent` 宣布傳遞嘗試的每次呼叫逾時。值為正整數毫秒，並會被限制在平台安全的計時器最大值內。暫時性重試可能使總宣布等待時間長於單一已設定逾時。
</ParamField>

如果請求者工作階段已沙箱化，`sessions_spawn` 會拒絕
會以非沙箱方式執行的目標。

### 探索

使用 `agents_list` 查看目前允許哪些代理 ID 用於
`sessions_spawn`。回應包含每個列出代理的有效
模型與嵌入式執行階段中繼資料，讓呼叫者可以區分 OpenClaw、Codex
應用程式伺服器，以及其他已設定的原生執行階段。

`allowAgents` 項目必須指向 `agents.list[]` 中已設定的代理 ID。
`["*"]` 表示任何已設定目標代理加上請求者。如果代理設定
已刪除但其 ID 仍保留在 `allowAgents` 中，`sessions_spawn` 會拒絕該 ID，
且 `agents_list` 會省略它。執行 `openclaw doctor --fix` 來清理過期的
允許清單項目，或在目標應保持可產生且繼承預設值時，加入最小化的 `agents.list[]` 項目。

### 自動封存

- 子代理工作階段會在 `agents.defaults.subagents.archiveAfterMinutes` 後自動封存（預設 `60`）。
- 封存會使用 `sessions.delete`，並將逐字稿重新命名為 `*.deleted.<timestamp>`（相同資料夾）。
- `cleanup: "delete"` 會在宣布後立即封存（仍會透過重新命名保留逐字稿）。
- 自動封存是盡力而為；如果閘道重新啟動，待處理的計時器會遺失。
- 已設定的執行逾時**不會**自動封存；它們只會停止執行。工作階段會保留到自動封存。
- 自動封存同樣適用於深度 1 與深度 2 的工作階段。
- 瀏覽器清理與封存清理分開：當執行完成時，追蹤中的瀏覽器分頁/程序會盡力關閉，即使逐字稿/工作階段記錄被保留也是如此。

## 巢狀子代理

預設情況下，子代理不能產生自己的子代理
（`maxSpawnDepth: 1`）。將 `maxSpawnDepth: 2` 設為啟用一層
巢狀，也就是**編排器模式**：主代理 → 編排器子代理 →
工作者子子代理。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### 深度層級

| 深度 | 工作階段金鑰形狀                             | 角色                                          | 可產生？                     |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主代理                                        | 一律可以                     |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子代理（允許深度 2 時為編排器）               | 僅當 `maxSpawnDepth >= 2`    |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子代理（葉節點工作者）                      | 永不                         |

### 宣布鏈

結果會沿鏈向上回流：

1. 深度 2 worker 完成 → 向其父層（深度 1 orchestrator）宣告。
2. 深度 1 orchestrator 收到宣告，彙整結果，完成 → 向 main 宣告。
3. Main agent 收到宣告並傳遞給使用者。

每一層只會看到其直接子項的宣告。

<Note>
**操作指引：**只啟動一次子項工作，並等待完成
事件，而不是圍繞 `sessions_list`、
`sessions_history`、`/subagents list` 或 `exec` sleep 命令建立輪詢迴圈。
`sessions_list` 和 `/subagents list` 會讓子工作階段關係
聚焦於即時工作 — 即時子項保持附加，已結束子項會在短暫的近期視窗內保持
可見，而過了新鮮度視窗後，僅存在於儲存區的陳舊子項連結會被
忽略。這可避免舊的 `spawnedBy` /
`parentSessionKey` 中繼資料在
重新啟動後讓幽靈子項復活。如果子項完成事件在你已送出
最終答案後才抵達，正確的後續動作是精確的靜默 token
`NO_REPLY` / `no_reply`。
</Note>

### 依深度區分的工具政策

- 角色與控制範圍會在 spawn 時寫入工作階段中繼資料。這可避免扁平或已還原的工作階段 key 意外重新取得 orchestrator 權限。
- **深度 1（orchestrator，當 `maxSpawnDepth >= 2`）：**取得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，因此可以 spawn 子項並檢查其狀態。其他工作階段/系統工具仍被拒絕。
- **深度 1（leaf，當 `maxSpawnDepth == 1`）：**沒有工作階段工具（目前預設行為）。
- **深度 2（leaf worker）：**沒有工作階段工具 — `sessions_spawn` 在深度 2 一律被拒絕。無法再 spawn 更深的子項。

### 每個 agent 的 spawn 限制

每個 agent 工作階段（任何深度）同一時間最多可有 `maxChildrenPerAgent`
（預設 `5`）個作用中子項。這可防止單一 orchestrator
無限制向外扇出。

### 串聯停止

停止深度 1 orchestrator 會自動停止其所有深度 2
子項：

- main chat 中的 `/stop` 會停止所有深度 1 agent，並串聯停止其深度 2 子項。

## 驗證

子 agent 驗證依 **agent id** 解析，而不是依工作階段類型：

- 子 agent 工作階段 key 為 `agent:<agentId>:subagent:<uuid>`。
- 驗證儲存區會從該 agent 的 `agentDir` 載入。
- main agent 的驗證 profiles 會作為**備援**合併進來；發生衝突時 agent profiles 會覆寫 main profiles。

此合併為加成式，因此 main profiles 永遠可作為
備援使用。目前尚不支援每個 agent 完全隔離的驗證。

## 宣告

子 agent 透過宣告步驟回報：

- 宣告步驟在子 agent 工作階段內執行（不是 requester 工作階段）。
- 如果子 agent 精確回覆 `ANNOUNCE_SKIP`，就不會張貼任何內容。
- 如果最新 assistant 文字是精確的靜默 token `NO_REPLY` / `no_reply`，即使先前曾有可見進度，也會抑制宣告輸出。

傳遞取決於 requester 深度：

- 頂層 requester 工作階段使用帶有外部傳遞的後續 `agent` call（`deliver=true`）。
- 巢狀 requester subagent 工作階段會收到內部後續注入（`deliver=false`），讓 orchestrator 可以在工作階段內彙整子項結果。
- 如果巢狀 requester subagent 工作階段已不存在，OpenClaw 會在可用時退回到該工作階段的 requester。

對於頂層 requester 工作階段，completion-mode 直接傳遞會先
解析任何綁定的 conversation/thread route 與 hook override，然後從 requester 工作階段儲存的 route 補齊
缺少的 channel-target 欄位。
這可讓 completion 保持在正確的 chat/topic，即使 completion
來源只識別 channel。

建立巢狀 completion findings 時，子項完成彙總會限定於目前 requester run，
防止陳舊的先前 run 子項
輸出洩漏到目前宣告中。宣告回覆會在 channel adapters 可用時保留
thread/topic 路由。

### 宣告內容

宣告內容會正規化為穩定的內部事件區塊：

| 欄位           | 來源                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| 來源           | `subagent` 或 `cron`                                                                                          |
| 工作階段 ids   | 子項工作階段 key/id                                                                                           |
| 類型           | 宣告類型 + task label                                                                                         |
| 狀態           | 從 runtime outcome 衍生（`success`、`error`、`timeout` 或 `unknown`）— **不是**從模型文字推斷 |
| 結果內容       | 子項最新的可見 assistant 文字                                                                                 |
| 後續           | 描述何時回覆與何時保持靜默的指令                                                                               |

終端失敗的 run 會回報失敗狀態，而不重播已擷取的
回覆文字。Tool/toolResult 輸出不會提升為子項結果文字。

### 統計行

宣告 payloads 會在結尾包含統計行（即使被包裝）：

- Runtime（例如 `runtime 5m12s`）。
- Token 用量（input/output/total）。
- 設定模型定價時的估計成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 與 transcript path，讓 main agent 可透過 `sessions_history` 擷取歷史，或檢查磁碟上的檔案。

內部中繼資料僅供協調使用；面向使用者的回覆
應以一般 assistant 語氣重寫。

### 為何偏好 `sessions_history`

`sessions_history` 是較安全的協調路徑：

- Assistant recall 會先正規化：移除 thinking tags；移除 `<relevant-memories>` / `<relevant_memories>` scaffolding；移除純文字 tool-call XML payload blocks（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`），包括從未乾淨關閉的截斷 payloads；移除降級的 tool-call/result scaffolding 與 historical-context markers；移除洩漏的模型控制 tokens（`<|assistant|>`、其他 ASCII `<|...|>`、全形 `<｜...｜>`）；移除格式錯誤的 MiniMax tool-call XML。
- 類似 credential/token 的文字會被遮蔽。
- 長區塊可被截斷。
- 非常大的 histories 可捨棄較舊的 rows，或以 `[sessions_history omitted: message too large]` 取代過大的 row。
- 當 `nextOffset` 存在時，用它往回分頁瀏覽較舊的 transcript windows。
- 當你需要完整逐位元組 transcript 時，原始磁碟 transcript 檢查是備援方式。

## 工具政策

子 agent 會先使用與父層或
目標 agent 相同的 profile 和 tool-policy pipeline。之後，OpenClaw 會套用子 agent 限制
層。

若沒有限制性的 `tools.profile`，子 agent 會取得**除了
message 工具、工作階段工具與系統工具之外的所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` 在這裡仍是有界且經過清理的 recall view —
它不是原始 transcript dump。

當 `maxSpawnDepth >= 2` 時，深度 1 orchestrator 子 agent 還會
額外收到 `sessions_spawn`、`subagents`、`sessions_list` 與
`sessions_history`，以便管理其子項。

### 透過 config 覆寫

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

`tools.subagents.tools.allow` 是最終的 allow-only filter。它可以縮小
已解析的工具集，但無法**加回**被
`tools.profile` 移除的工具。例如，`tools.profile: "coding"` 包含
`web_search`/`web_fetch`，但不包含 `browser` 工具。若要讓
coding-profile 子 agent 使用 browser automation，請在
profile 階段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

當只有一個 agent 應取得 browser automation 時，使用每個 agent 的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 並行

子 agent 使用專用的 in-process queue lane：

- **Lane name：**`subagent`
- **並行度：**`agents.defaults.subagents.maxConcurrent`（預設 `8`）

## 存活性與復原

OpenClaw 不會將缺少 `endedAt` 視為
子 agent 仍然存活的永久證明。超過 stale-run window 的未結束 run
會停止在 `/subagents list`、status summaries、
descendant completion gating 與每個工作階段並行檢查中計為 active/pending。

Gateway 重新啟動後，陳舊的未結束還原 run 會被修剪，除非
其子項工作階段標記為 `abortedLastRun: true`。這些
restart-aborted 子項工作階段仍可透過子 agent
orphan recovery flow 復原，該流程會在
清除 aborted marker 前傳送 synthetic resume message。

自動重新啟動復原會針對每個子項工作階段設有界限。如果同一個
子 agent 子項在 rapid re-wedge window 內反覆被接受進行 orphan recovery，
OpenClaw 會在該
工作階段上持久化 recovery tombstone，並在後續重新啟動時停止自動恢復它。執行
`openclaw tasks maintenance --apply` 來調和 task record，或執行
`openclaw doctor --fix` 來清除 tombstoned 工作階段上的陳舊 aborted recovery flags。

<Note>
如果子 agent spawn 因 Gateway `PAIRING_REQUIRED` /
`scope-upgrade` 失敗，請先檢查 RPC caller，再編輯 pairing state。
當 caller 已在 gateway request context 內執行時，內部 `sessions_spawn` 協調會在 process 內 dispatch，因此不會
開啟 loopback WebSocket，也不依賴命令列介面的 paired-device scope
baseline。gateway process 外部的 callers 仍會使用 WebSocket
fallback，以 `client.id: "gateway-client"` 和 `client.mode: "backend"`
透過 direct loopback shared-token/password auth。遠端 callers、明確的
`deviceIdentity`、明確的 device-token paths，以及 browser/node clients
仍需要一般 device approval 才能進行 scope upgrades。
</Note>

## 停止

- 在 requester chat 中傳送 `/stop` 會 abort requester 工作階段，並停止由其 spawn 的任何作用中子 agent runs，且串聯至巢狀子項。

## 限制

- 子 agent 宣告是**盡力而為**。如果 gateway 重新啟動，pending 的「announce back」工作會遺失。
- 子 agent 仍共用相同 gateway process resources；請將 `maxConcurrent` 視為安全閥。
- `sessions_spawn` 一律為非阻塞：它會立即回傳 `{ status: "accepted", runId, childSessionKey }`。
- 子 agent context 只注入 `AGENTS.md` 和 `TOOLS.md`（沒有 `SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。Codex-native subagents 遵循相同邊界：`TOOLS.md` 保留在繼承的 Codex thread instructions 中，而 parent-only persona、identity 與 user files 會作為 turn-scoped collaboration instructions 注入，讓子項不會複製它們。
- 最大巢狀深度為 5（`maxSpawnDepth` 範圍：1–5）。多數使用情境建議使用深度 2。
- `maxChildrenPerAgent` 限制每個工作階段的作用中子項數量（預設 `5`，範圍 `1–20`）。

## 相關

- [ACP agents](/zh-TW/tools/acp-agents)
- [Agent send](/zh-TW/tools/agent-send)
- [背景工作](/zh-TW/automation/tasks)
- [多 agent sandbox tools](/zh-TW/tools/multi-agent-sandbox-tools)
