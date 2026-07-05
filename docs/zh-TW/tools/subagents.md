---
read_when:
    - 你想要透過代理程式進行背景或平行工作
    - 你正在變更 sessions_spawn 或子代理工具政策
    - 你正在實作或疑難排解繫結於執行緒的子代理工作階段
sidebarTitle: Sub-agents
summary: 啟動隔離的背景代理執行，並將結果回報到請求者的聊天
title: 子代理
x-i18n:
    generated_at: "2026-07-05T11:52:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 937ff806dc0dc5f5de5e80b03835131d66c37762cd2be215b17d622720183379
    source_path: tools/subagents.md
    workflow: 16
---

子代理是從既有代理執行衍生出的背景代理執行。
每個子代理都在自己的工作階段中執行（`agent:<agentId>:subagent:<uuid>`），
完成後會將其結果**公告**回請求者的聊天頻道。
每個子代理執行都會被追蹤為一個[背景工作](/zh-TW/automation/tasks)。

目標：

- 平行化研究、長時間工作，以及緩慢的工具工作，而不阻塞主要執行。
- 預設保持子代理隔離（工作階段分離、可選沙盒）。
- 讓工具介面難以誤用：子代理預設**不會**取得工作階段或訊息工具。
- 支援可設定的巢狀深度，以配合協調器模式。

<Note>
**成本注意事項：**每個子代理預設都有自己的脈絡和權杖用量。對於繁重或重複的工作，請透過 `agents.defaults.subagents.model` 或個別代理覆寫，為子代理設定較便宜的模型，並讓主要代理保留較高品質的模型。當子代理確實需要請求者目前的逐字稿時，請用 `context: "fork"` 衍生它。繫結討論串的子代理工作階段預設為 `context: "fork"`，因為它們會將目前對話分支成後續討論串。
</Note>

## 斜線命令

`/subagents` 會檢查**目前工作階段**的子代理執行：

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` 會顯示執行中繼資料（狀態、時間戳記、工作階段 id、逐字稿路徑、清理）。`/subagents log` 會列印某次執行近期的聊天回合；加入 `tools` 權杖可包含工具呼叫/結果訊息（預設省略）。若要在代理回合中取得有界且經安全篩選的回想檢視，請使用 `sessions_history`；若要查看原始完整逐字稿，請檢查磁碟上的逐字稿路徑。

### 討論串繫結控制

這些命令適用於具有持久討論串繫結的頻道。請參閱下方的[支援討論串的頻道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 衍生行為

代理會使用 `sessions_spawn` 工具啟動背景子代理。
完成結果會以內部父工作階段事件傳回；父代理/請求者代理會決定是否需要面向使用者的更新。

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - `sessions_spawn` 是非阻塞的；它會立即傳回執行 id。
    - 完成時，子代理會回報給父工作階段/請求者工作階段。
    - 需要子代理結果的代理回合，應在衍生必要工作後呼叫 `sessions_yield`。這會結束目前回合，並讓完成事件以下一則模型可見訊息的形式抵達。
    - 完成是推送式的。衍生後，**不要**為了等待它完成而在迴圈中輪詢 `/subagents list`、`sessions_list` 或 `sessions_history`；僅在偵錯時按需檢查狀態。
    - 子代理輸出是供請求者代理統整的報告/證據。它不是使用者撰寫的指令文字，也不能覆寫系統、開發者或使用者政策。
    - 完成時，OpenClaw 會盡力關閉該子代理工作階段開啟並受追蹤的瀏覽器分頁/程序，然後再繼續公告清理流程。

  </Accordion>
  <Accordion title="Completion delivery">
    - OpenClaw 會透過具有穩定冪等鍵的 `agent` 回合，將完成結果交回請求者工作階段。
    - 如果請求者執行仍在作用中，OpenClaw 會先嘗試喚醒/引導該執行，而不是啟動第二條可見回覆路徑。
    - 如果無法喚醒作用中的請求者，OpenClaw 會改用帶有相同完成脈絡的請求者代理交接，而不是丟棄公告。
    - 成功的父代理交接會完成子代理交付，即使父代理決定不需要可見的使用者更新也是如此。
    - 原生子代理不會取得訊息工具。它們會將純助理文字傳回父代理/請求者代理；人類可見的回覆仍由父代理/請求者代理的一般交付政策擁有。
    - 如果無法使用直接交接，交付會退回到佇列路由，接著在最終放棄前對公告進行短暫的指數退避重試。
    - 交付會保留已解析的請求者路由：有討論串繫結或對話繫結的完成路由可用時會優先採用。如果完成來源只提供頻道，OpenClaw 會從請求者工作階段已解析的路由（`lastChannel` / `lastTo` / `lastAccountId`）補齊缺少的目標/帳號，使直接交付仍可運作。

  </Accordion>
  <Accordion title="Completion handoff metadata">
    對請求者工作階段的完成交接是執行階段產生的內部脈絡（不是使用者撰寫的文字），並包含：

    - `Result` — 子代理最新可見的 `assistant` 回覆文字。Tool/toolResult 輸出不會被提升為子代理結果。終端失敗的執行不會重用擷取到的回覆文字。
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`。
    - 精簡的執行階段/權杖統計。
    - 一則審查指令，要求請求者代理在判定原始工作是否完成前先驗證結果。
    - 後續指引，要求請求者代理在子代理結果仍留下更多動作時繼續工作或記錄後續項目。
    - 一則用於沒有更多動作路徑的最終更新指令，以一般助理語氣撰寫，不轉送原始內部中繼資料。

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` 和 `--thinking` 會覆寫該特定執行的預設值。
    - 完成後使用 `info`/`log` 檢查詳細資料和輸出。
    - 對於持久的討論串繫結工作階段，請搭配 `thread: true` 和 `mode: "session"` 使用 `sessions_spawn`。
    - 如果請求者頻道不支援討論串繫結，請使用 `mode: "run"`，而不是重試不可能成功的討論串繫結組合。
    - 對於 ACP 控制框架工作階段（Claude Code、Gemini CLI、OpenCode，或明確的 Codex ACP/acpx），當工具宣告該執行階段時，請搭配 `runtime: "acp"` 使用 `sessions_spawn`。偵錯完成結果或代理對代理迴圈時，請參閱 [ACP 交付模型](/zh-TW/tools/acp-agents#delivery-model)。啟用 `codex` 外掛時，Codex 聊天/討論串控制應優先使用 `/codex ...` 而非 ACP，除非使用者明確要求 ACP/acpx。
    - OpenClaw 會隱藏 `runtime: "acp"`，直到 ACP 已啟用、請求者未被沙盒化，且已載入像 `acpx` 這樣的後端外掛。`runtime: "acp"` 預期使用外部 ACP 控制框架 id，或使用帶有 `runtime.type="acp"` 的 `agents.list[]` 項目；對於來自 `agents_list` 的一般 OpenClaw 設定代理，請使用預設子代理執行階段。

  </Accordion>
</AccordionGroup>

## 脈絡模式

原生子代理會以隔離狀態啟動，除非呼叫者明確要求分支目前逐字稿。

| 模式       | 使用時機                                                                                                                         | 行為                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、獨立實作、緩慢工具工作，或任何可在工作文字中簡要說明的事項                           | 建立乾淨的子逐字稿。這是預設值，並可降低權杖使用量。  |
| `fork`     | 依賴目前對話、先前工具結果，或請求者逐字稿中已有細緻指令的工作 | 在子代理啟動前，將請求者逐字稿分支到子工作階段。 |

請謹慎使用 `fork`。它用於對脈絡敏感的委派，而不是取代撰寫清楚的工作提示。

## 工具：`sessions_spawn`

在全域 `subagent` 通道上以 `deliver: false` 啟動子代理執行，
接著執行公告步驟，並將公告回覆張貼到請求者聊天頻道。

可用性取決於呼叫者的有效工具政策。內建的 `coding` 設定檔包含 `sessions_spawn`；`messaging` 和 `minimal` 不包含。`full` 允許所有工具。對於使用較窄設定檔但仍應委派工作的代理，請加入 `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]`，或使用 `tools.profile: "coding"`。
頻道/群組、提供者、沙盒，以及個別代理的允許/拒絕政策，仍可在設定檔階段後移除該工具。請從同一工作階段使用 `/tools` 確認有效工具清單。

**預設值：**

- **模型：**原生子代理會繼承呼叫者，除非你設定 `agents.defaults.subagents.model`（或個別代理的 `agents.list[].subagents.model`）。ACP 執行階段衍生在存在已設定的子代理模型時會使用相同模型；否則 ACP 控制框架會保留自己的預設值。明確的 `sessions_spawn.model` 仍會優先。
- **思考：**原生子代理會繼承呼叫者，除非你設定 `agents.defaults.subagents.thinking`（或個別代理的 `agents.list[].subagents.thinking`）。ACP 執行階段衍生也會針對所選模型套用 `agents.defaults.models["provider/model"].params.thinking`。明確的 `sessions_spawn.thinking` 仍會優先。
- **執行逾時：**設定時，OpenClaw 會使用 `agents.defaults.subagents.runTimeoutSeconds`；否則會退回到 `0`（不逾時）。`sessions_spawn` 不接受逐次呼叫的逾時覆寫。
- **工作交付：**原生子代理會在第一則可見的 `[Subagent Task]` 訊息中收到委派工作。子代理系統提示會攜帶執行階段規則和路由脈絡，而不是工作的隱藏副本。

接受的原生子代理衍生會在工具結果中包含已解析的子模型中繼資料：`resolvedModel` 包含已套用的模型參照，而當參照具有提供者前綴時，`resolvedProvider` 會包含提供者前綴。

### 委派提示模式

`agents.defaults.subagents.delegationMode` 只控制提示指引；它不會變更工具政策或強制委派。

- `suggest`（預設）：保留標準提示提醒，建議對較大或較慢的工作使用子代理。
- `prefer`：告訴主要代理保持回應性，並透過 `sessions_spawn` 委派任何比直接回覆更複雜的事項。

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
  子代理的任務說明。
</ParamField>
<ParamField path="taskName" type="string">
  可選的穩定代稱，用於在後續狀態輸出中識別特定子項。必須符合 `[a-z][a-z0-9_-]{0,63}`，且不能是 `last` 或 `all` 等保留目標。
</ParamField>
<ParamField path="label" type="string">
  可選的人類可讀標籤。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允許時，在另一個已設定的代理 id 底下產生。
</ParamField>
<ParamField path="cwd" type="string">
  可選的子執行任務工作目錄。原生子代理仍會從目標代理工作區載入啟動檔案；`cwd` 只會變更執行階段工具和命令列介面測試框架執行委派工作的地方。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 僅適用於外部 ACP 測試框架（`claude`、`droid`、`gemini`、`opencode`，或明確要求的 Codex ACP/acpx），以及 `runtime.type` 為 `acp` 的 `agents.list[]` 項目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  僅限 ACP。當 `runtime: "acp"` 時，恢復既有 ACP 測試框架工作階段；原生子代理產生時會忽略。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  僅限 ACP。當 `runtime: "acp"` 時，將 ACP 執行輸出串流到父工作階段；原生子代理產生時請省略。
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
  如果要求者頻道無法使用討論串繫結，請改用 `mode: "run"`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 會在公告後立即封存工作階段（仍會透過重新命名保留逐字稿）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` 會拒絕產生，除非目標子執行階段位於沙盒中。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 會將要求者目前的逐字稿分支到子工作階段。僅限原生子代理。討論串繫結的產生預設為 `fork`；非討論串產生預設為 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受頻道傳遞參數（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）。原生子代理會將
其最新的助理回合回報給要求者；外部傳遞仍由
父／要求者代理處理。
</Warning>

### 任務名稱和目標指定

`taskName` 是面向模型的編排代稱，不是工作階段金鑰。
當協調者之後可能需要檢查該子項時，請用它作為穩定子項名稱，例如 `review_subagents`、
`linux_validation` 或 `docs_update`。

目標解析接受精確的 `taskName` 相符項，以及不含歧義的
前綴。比對範圍限定在與編號 `/subagents` 目標所用相同的作用中／近期目標視窗，
因此過時的已完成子項不會讓重複使用的代稱變得含糊。如果兩個作用中或近期子項共用相同
`taskName`，目標就會有歧義；請改用清單索引、工作階段金鑰或
執行 id。

保留目標 `last` 和 `all` 不是有效的 `taskName` 值，
因為它們已經具有控制含義。

## 工具：`sessions_yield`

結束目前模型回合並等待執行階段事件，主要是
子代理完成事件，作為下一則訊息到達。在產生必要的子項工作後，
如果要求者必須等到這些完成事件到達才能產生最終
答案，請使用它。

`sessions_yield` 是等待原語。不要用輪詢
`subagents`、`sessions_list`、`sessions_history`、shell
`sleep` 或程序輪詢的迴圈取代它，只為了偵測子項完成。

只有在工作階段的有效工具清單包含
它時才使用 `sessions_yield`。某些極簡或自訂工具設定檔可能會公開 `sessions_spawn` 和
`subagents`，但不公開 `sessions_yield`；在這種情況下，不要發明
輪詢迴圈只為了等待完成。

當存在作用中子項時，OpenClaw 會將精簡的執行階段生成
`Active Subagents` 提示區塊注入一般回合，讓要求者可以看到
目前的子工作階段、執行 id、狀態、標籤、任務和
`taskName` 別名，而不需要輪詢。該區塊中的任務和標籤欄位
會以資料形式加上引號，而不是指令，因為它們可能來自
使用者／模型提供的產生引數。

## 工具：`subagents`

列出由要求者工作階段擁有的已產生子代理執行。其範圍限定在
目前要求者；子項只能看到自己控制的子項。

使用 `subagents` 進行隨需狀態查詢和除錯。使用 `sessions_yield` 
等待完成事件。

## 討論串繫結工作階段

當頻道啟用討論串繫結時，子代理可以持續繫結
到某個討論串，使該討論串中的後續使用者訊息繼續路由到
同一個子代理工作階段。

### 支援討論串的頻道

當頻道註冊了對話繫結配接器時，就支援持久的討論串繫結子代理工作階段
（使用 `thread: true` 的 `sessions_spawn`）。具備該支援的內建頻道：**Discord**、
**iMessage**、**Matrix** 和 **Telegram**。Discord 和 Matrix 預設會
建立子討論串；Telegram 和 iMessage 預設會繫結
目前對話。使用各頻道的 `threadBindings` 設定鍵來控制
啟用、逾時和 `spawnSessions`。

### 快速流程

<Steps>
  <Step title="產生">
    使用帶有 `thread: true` 的 `sessions_spawn`（並可選擇加入 `mode: "session"`）。
  </Step>
  <Step title="繫結">
    OpenClaw 會在作用中頻道中建立討論串，或將討論串繫結到該工作階段目標。
  </Step>
  <Step title="路由後續訊息">
    該討論串中的回覆和後續訊息會路由到已繫結的工作階段。
  </Step>
  <Step title="檢查逾時">
    使用 `/session idle` 檢查／更新閒置自動取消聚焦，並使用
    `/session max-age` 控制硬性上限。
  </Step>
  <Step title="分離">
    使用 `/unfocus` 手動分離。
  </Step>
</Steps>

### 手動控制

| 命令               | 效果                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | 將目前討論串（或建立一個）繫結到子代理／工作階段目標                                     |
| `/unfocus`         | 移除目前已繫結討論串的繫結                                                               |
| `/agents`          | 列出作用中執行和繫結狀態（`binding:<id>`、`unbound` 或 `bindings unavailable`）           |
| `/session idle`    | 檢查／更新閒置自動取消聚焦（僅限已聚焦的繫結討論串）                                     |
| `/session max-age` | 檢查／更新硬性上限（僅限已聚焦的繫結討論串）                                             |

### 設定開關

- **全域預設：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **頻道覆寫和產生自動繫結鍵** 視配接器而定。請參閱上方的[支援討論串的頻道](#thread-supporting-channels)。

請參閱[設定參考](/zh-TW/gateway/configuration-reference)和
[斜線命令](/zh-TW/tools/slash-commands)，了解目前的配接器詳細資訊。

### 允許清單

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可透過明確 `agentId` 指定為目標的已設定代理 id 清單（`["*"]` 允許任何已設定目標）。預設：僅限要求者代理。如果你設定清單後仍希望要求者用 `agentId` 產生自身，請將要求者 id 納入清單。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  當要求者代理未設定自己的 `subagents.allowAgents` 時，所使用的預設已設定目標代理允許清單。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選取設定檔）。各代理覆寫：`agents.list[].subagents.requireAgentId`。
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  每次呼叫的閘道 `agent` 公告傳遞嘗試逾時。值為正整數毫秒，並會限制在平台安全的計時器最大值內。暫時性重試可能會讓公告總等待時間長於單一設定逾時。
</ParamField>

如果要求者工作階段位於沙盒中，`sessions_spawn` 會拒絕
將以非沙盒方式執行的目標。

### 探索

使用 `agents_list` 查看目前允許用於
`sessions_spawn` 的代理 id。回應包含每個列出代理的有效
模型和嵌入式執行階段中繼資料，讓呼叫者可以區分 OpenClaw、Codex
app-server 和其他已設定的原生執行階段。

`allowAgents` 項目必須指向 `agents.list[]` 中已設定的代理 id。
`["*"]` 表示任何已設定目標代理加上要求者。如果某個代理設定
已刪除，但其 id 仍留在 `allowAgents` 中，`sessions_spawn` 會拒絕該 id，
且 `agents_list` 會省略它。執行 `openclaw doctor --fix` 以清理過時的
允許清單項目，或在目標應該
維持可被產生並繼承預設值時，加入最小的 `agents.list[]` 項目。

### 自動封存

- 子代理工作階段會在 `agents.defaults.subagents.archiveAfterMinutes` 後自動封存（預設 `60`）。
- 封存使用 `sessions.delete`，並將逐字稿重新命名為 `*.deleted.<timestamp>`（同一資料夾）。
- `cleanup: "delete"` 會在公告後立即封存（仍會透過重新命名保留逐字稿）。
- 自動封存是盡力而為；如果閘道重新啟動，待處理的計時器會遺失。
- 已設定的執行逾時**不會**自動封存；它們只會停止執行。工作階段會保留到自動封存。
- 自動封存同樣適用於深度 1 和深度 2 工作階段。
- 瀏覽器清理與封存清理是分開的：受追蹤的瀏覽器分頁／程序會在執行完成時盡力關閉，即使逐字稿／工作階段記錄被保留也是如此。

## 巢狀子代理

依預設，子代理不能產生自己的子代理
（`maxSpawnDepth: 1`）。設定 `maxSpawnDepth: 2` 可啟用一層
巢狀，也就是**編排器模式**：主代理 → 編排器子代理 →
工作者子子代理。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1, range 1-5)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5, range 1-20)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### 深度層級

| 深度 | 工作階段金鑰形狀                         | 角色                                     | 可生成？                     |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主代理                                    | 一律可以                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子代理（允許深度 2 時為協調器） | 僅在 `maxSpawnDepth >= 2` 時 |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子代理（葉節點工作者）                   | 永不                        |

### 宣告鏈

結果會沿著鏈往回流動：

1. 深度 2 工作者完成 → 宣告給其父層（深度 1 協調器）。
2. 深度 1 協調器收到宣告、彙整結果、完成 → 宣告給主代理。
3. 主代理收到宣告並交付給使用者。

每一層只會看到其直接子層的宣告。

<Note>
**操作指引：**只啟動一次子工作，然後等待完成
事件，而不是圍繞 `sessions_list`、
`sessions_history`、`/subagents list` 或 `exec` 睡眠命令建立輪詢迴圈。
`sessions_list` 和 `/subagents list` 會讓子工作階段關係
聚焦於即時工作 — 即時子層會維持附加，已結束的子層會在短暫的近期視窗內
保持可見，而過時且僅存在於儲存中的子層連結會在其新鮮度視窗後
被忽略。這可防止舊的 `spawnedBy` /
`parentSessionKey` 中繼資料在
重新啟動後復活幽靈子層。如果子層完成事件在你已傳送
最終答案後抵達，正確的後續動作是確切的靜默權杖
`NO_REPLY` / `no_reply`。
</Note>

### 依深度區分的工具政策

- 角色與控制範圍會在生成時寫入工作階段中繼資料。這可避免扁平或還原的工作階段金鑰意外重新取得協調器權限。
- **深度 1（協調器，當 `maxSpawnDepth >= 2` 時）：**取得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便生成子層並檢查其狀態。其他工作階段/系統工具仍會被拒絕。
- **深度 1（葉節點，當 `maxSpawnDepth == 1` 時）：**沒有工作階段工具（目前預設行為）。
- **深度 2（葉節點工作者）：**沒有工作階段工具 — `sessions_spawn` 在深度 2 一律被拒絕。無法再生成更多子層。

### 每個代理的生成上限

每個代理工作階段（任何深度）同時最多可有 `maxChildrenPerAgent`
（預設 `5`）個作用中的子層。這可防止單一協調器
失控扇出。

### 級聯停止

停止深度 1 協調器會自動停止其所有深度 2
子層：

- 主聊天中的 `/stop` 會停止所有深度 1 代理，並級聯至其深度 2 子層。

## 認證

子代理認證是依 **代理 id** 解析，而不是依工作階段類型：

- 子代理工作階段金鑰是 `agent:<agentId>:subagent:<uuid>`。
- 認證儲存會從該代理的 `agentDir` 載入。
- 主代理的認證設定檔會合併為**備援**；發生衝突時，代理設定檔會覆寫主設定檔。

合併是加成式的，因此主設定檔一律可作為
備援使用。目前尚不支援每個代理完全隔離的認證。

## 宣告

子代理透過宣告步驟回報：

- 宣告步驟在子代理工作階段內執行（不是請求者工作階段）。
- 如果子代理精確回覆 `ANNOUNCE_SKIP`，則不會發佈任何內容。
- 如果最新的助理文字是確切的靜默權杖 `NO_REPLY` / `no_reply`，即使先前已有可見進度，宣告輸出也會被抑制。

交付取決於請求者深度：

- 頂層請求者工作階段使用具有外部交付的後續 `agent` 呼叫（`deliver=true`）。
- 巢狀請求者子代理工作階段會接收內部後續注入（`deliver=false`），讓協調器可在工作階段內彙整子層結果。
- 如果巢狀請求者子代理工作階段已不存在，OpenClaw 會在可用時退回使用該工作階段的請求者。

對於頂層請求者工作階段，完成模式的直接交付會先
解析任何已繫結的對話/執行緒路由與鉤子覆寫，然後從請求者工作階段儲存的路由
填入缺少的頻道目標欄位。
這可讓完成結果保持在正確的聊天/主題中，即使完成來源
只識別了頻道。

建立巢狀完成發現時，子層完成彙總會限定在目前請求者執行範圍內，
以防止過時的先前執行子層
輸出洩漏到目前宣告中。當頻道配接器可用時，宣告回覆會保留
執行緒/主題路由。

### 宣告內容

宣告內容會正規化為穩定的內部事件區塊：

| 欄位          | 來源                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| 來源         | `subagent` 或 `cron`                                                                                     |
| 工作階段 id    | 子工作階段金鑰/id                                                                                     |
| 類型           | 宣告類型 + 任務標籤                                                                               |
| 狀態         | 從執行階段結果衍生（`ok`、`error`、`timeout` 或 `unknown`）— **不是**從模型文字推斷 |
| 結果內容 | 子層最新可見的助理文字                                                             |
| 後續      | 說明何時回覆與何時保持靜默的指示                                                      |

終端失敗執行會回報失敗狀態，而不重播已擷取的
回覆文字。工具/toolResult 輸出不會提升為子層結果文字。

### 統計行

宣告酬載會在結尾包含統計行（即使經過包裝）：

- 執行時間（例如 `runtime 5m12s`）。
- 權杖用量（輸入/輸出/總計）。
- 設定模型定價時的估計成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 與逐字稿路徑，讓主代理可透過 `sessions_history` 擷取歷史，或檢查磁碟上的檔案。

內部中繼資料僅供協調使用；面向使用者的回覆
應改寫為一般助理語氣。

### 為什麼偏好 `sessions_history`

`sessions_history` 是在代理回合內讀取子層
逐字稿時較安全的協調路徑：

- 即使一般用途的記錄遮罩已停用，也會遮罩類似憑證/權杖的文字。
- 截斷長文字區塊（每個區塊 4000 個字元），並丟棄思考簽章、推理重播酬載與內嵌圖片資料。
- 強制套用 80 KB 回應上限；過大的列會以 `[sessions_history omitted: message too large]` 取代。
- 當 `nextOffset` 存在時，用它向後分頁瀏覽較舊的逐字稿視窗。
- `sessions_history` **不會**從訊息文字中移除推理標籤、`<relevant-memories>` 鷹架或工具呼叫 XML — 它會回傳接近原始逐字稿形狀的結構化內容區塊，只是已遮罩且受大小限制。`/subagents log` 會套用較重的散文清理器（移除推理標籤、記憶鷹架與工具呼叫 XML），因為它呈現的是純聊天列，而不是結構化區塊。
- 當你需要完整逐位元組相同的逐字稿時，原始磁碟逐字稿檢查是備援方案。

## 工具政策

子代理會先使用與父層或目標代理相同的設定檔與工具政策管線。
之後，OpenClaw 會套用子代理限制
層。

無論深度或角色為何，子代理一律會失去 `gateway`、`agents_list`、`session_status` 與
`cron`（系統層級/互動式工具，或
應由主代理協調的工具）。葉節點子代理（預設深度 1
行為，以及深度 2 一律如此）還會失去 `subagents`、
`sessions_list`、`sessions_history` 與 `sessions_spawn`。子代理永遠
不會取得 `message` 工具 — 它在生成時就已停用，而不是由
此拒絕清單過濾 — 且 `sessions_send` 仍會被拒絕，因此子代理
只會透過宣告鏈溝通。

`sessions_history` 在這裡也仍然是有界且經過清理的回想檢視 —
它不是原始逐字稿傾印。

當 `maxSpawnDepth >= 2` 時，深度 1 協調器子代理還會
接收 `sessions_spawn`、`subagents`、`sessions_list` 與
`sessions_history`，以便管理其子層。

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

`tools.subagents.tools.allow` 是最終的僅允許篩選器。它可以縮窄
已解析的工具集，但不能**加回**被
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

當只有一個代理應取得瀏覽器自動化時，請使用每個代理的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 並行

子代理使用專用的程序內佇列通道：

- **通道名稱：**`subagent`
- **並行數：**`agents.defaults.subagents.maxConcurrent`（預設 `8`）

## 存活性與復原

OpenClaw 不會將缺少 `endedAt` 視為
子代理仍然存活的永久證明。早於過時執行視窗的未結束執行
（2 小時，或設定的執行逾時加上一小段寬限期，
以較長者為準）不再在 `/subagents list`、
狀態摘要、後代完成閘控與每工作階段
並行檢查中計為作用中/待處理。

閘道重新啟動後，過時的未結束已還原執行會被修剪，除非
其子工作階段標記為 `abortedLastRun: true`。這些
重新啟動中止的子工作階段仍可透過子代理
孤兒復原流程復原，該流程會在
清除中止標記前傳送合成的恢復訊息。

自動重新啟動復原以每個子工作階段為界。如果同一個
子代理子層在快速再次卡住視窗內反覆被接受進行孤兒復原，
OpenClaw 會在該
工作階段上持久化復原墓碑，並在後續重新啟動時停止自動恢復它。執行
`openclaw tasks maintenance --apply` 以協調任務記錄，或執行
`openclaw doctor --fix` 以清除
已加墓碑工作階段上的過時中止復原旗標。

<Note>
如果子代理生成因閘道 `PAIRING_REQUIRED` /
`scope-upgrade` 失敗，請先檢查 RPC 呼叫者，再編輯配對狀態。
當呼叫者已在閘道請求內容內執行時，內部 `sessions_spawn` 協調會在程序內分派，因此它不會
開啟迴送 WebSocket，也不依賴命令列介面的已配對裝置範圍
基準線。閘道程序外的呼叫者仍會使用 WebSocket
備援，作為 `client.id: "gateway-client"` 搭配 `client.mode: "backend"`，
透過直接迴送共享權杖/密碼認證。遠端呼叫者、明確的
`deviceIdentity`、明確的裝置權杖路徑，以及瀏覽器/node 用戶端
仍需一般裝置核准才能進行範圍升級。
</Note>

## 停止

- 在請求者聊天中傳送 `/stop` 會中止請求者工作階段，並停止從中生成的任何作用中子代理執行，且會級聯至巢狀子層。

## 限制

- 子代理公告是**盡力而為**。如果閘道重新啟動，待處理的「回覆公告」工作會遺失。
- 子代理仍會共用相同的閘道程序資源；請將 `maxConcurrent` 視為安全閥。
- `sessions_spawn` 一律為非阻塞：它會立即回傳 `{ status: "accepted", runId, childSessionKey }`。
- 子代理情境只會注入 `AGENTS.md` 和 `TOOLS.md`（不包含 `SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。Codex 原生子代理遵循相同邊界：`TOOLS.md` 保留在繼承的 Codex 執行緒指示中，而僅限父代理的人格、身分和使用者檔案會以回合範圍的協作指示注入，讓子代理不會複製它們。
- 最大巢狀深度為 5（`maxSpawnDepth` 範圍：1-5）。大多數使用案例建議使用深度 2。
- `maxChildrenPerAgent` 會限制每個工作階段的作用中子代理數量（預設值 `5`，範圍 `1-20`）。

## 相關

- [ACP 代理](/zh-TW/tools/acp-agents)
- [代理傳送](/zh-TW/tools/agent-send)
- [背景工作](/zh-TW/automation/tasks)
- [多代理沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
