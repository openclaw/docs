---
read_when:
    - 你想透過代理程式執行背景或並行工作
    - 你正在變更 `sessions_spawn` 或子代理工具政策
    - 你正在實作或疑難排解執行緒綁定的子代理工作階段
sidebarTitle: Sub-agents
summary: 啟動隔離的背景代理程式執行，並將結果回報至請求者聊天
title: 子代理
x-i18n:
    generated_at: "2026-05-11T20:38:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02b03bdfd5cddf5618fddf0804f017400c36751095166dac18fa35fa3bfd4c6e
    source_path: tools/subagents.md
    workflow: 16
---

子代理是從現有代理執行中衍生的背景代理執行。
它們會在自己的工作階段中執行（`agent:<agentId>:subagent:<uuid>`），並在完成時將結果**公告**回請求者聊天頻道。每個子代理執行都會被追蹤為一個[背景任務](/zh-TW/automation/tasks)。

主要目標：

- 平行處理「研究 / 長時間任務 / 慢速工具」工作，而不阻塞主要執行。
- 預設保持子代理隔離（工作階段分離 + 選用沙盒）。
- 讓工具介面難以誤用：子代理預設**不會**取得工作階段工具。
- 支援可設定的巢狀深度，以配合編排器模式。

<Note>
**成本注意事項：**每個子代理預設都有自己的脈絡與 token 使用量。對於繁重或重複性任務，請為子代理設定較便宜的模型，並讓主要代理使用品質較高的模型。透過 `agents.defaults.subagents.model` 或每個代理的覆寫設定進行設定。當子代理確實需要請求者目前的逐字稿時，代理可以在該次衍生中要求 `context: "fork"`。繫結執行緒的子代理工作階段預設為 `context: "fork"`，因為它們會將目前對話分支到後續執行緒中。
</Note>

## 斜線命令

使用 `/subagents` 檢查或控制**目前工作階段**的子代理執行：

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

使用頂層 [`/steer <message>`](/zh-TW/tools/steer) 引導目前請求者工作階段的作用中執行。當目標是子執行時，使用 `/subagents steer <id|#> <message>`。

`/subagents info` 會顯示執行中繼資料（狀態、時間戳記、工作階段 ID、逐字稿路徑、清理）。使用 `sessions_history` 取得有界且經安全篩選的回想檢視；當你需要原始完整逐字稿時，請檢查磁碟上的逐字稿路徑。

### 執行緒繫結控制項

這些命令可用於支援持久執行緒繫結的頻道。
請參閱下方的[支援執行緒的頻道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 衍生行為

`/subagents spawn` 會以使用者命令（不是內部轉送）啟動背景子代理，並在執行完成時將一則最終完成更新傳送回請求者聊天。

<AccordionGroup>
  <Accordion title="非阻塞、推送式完成">
    - 衍生命令是非阻塞的；它會立即傳回執行 ID。
    - 完成時，子代理會將摘要/結果訊息公告回請求者聊天頻道。
    - 需要子執行結果的代理回合，應在衍生必要工作後呼叫 `sessions_yield`。這會結束目前回合，並讓完成事件以下一則模型可見訊息的形式送達。
    - 完成採用推送式。衍生後，請**不要**為了等待完成而在迴圈中輪詢 `/subagents list`、`sessions_list` 或 `sessions_history`；只在除錯或介入時按需檢查狀態。
    - 子輸出是給請求者代理彙整的報告/證據。它不是使用者撰寫的指示文字，且不能覆寫系統、開發者或使用者政策。
    - 完成時，OpenClaw 會盡最大努力關閉該子代理工作階段開啟並被追蹤的瀏覽器分頁/程序，然後公告清理流程才會繼續。

  </Accordion>
  <Accordion title="手動衍生交付韌性">
    - OpenClaw 會透過具有穩定冪等鍵的 `agent` 回合，將完成結果交回請求者工作階段。
    - 如果請求者執行仍在作用中，OpenClaw 會先嘗試喚醒/引導該執行，而不是啟動第二條可見回覆路徑。
    - 如果請求者代理完成交接失敗或沒有產生可見輸出，OpenClaw 會將交付視為失敗，並退回到佇列路由/重試。它不會將子結果直接原始傳送到外部聊天。
    - 如果無法使用直接交接，則會退回到佇列路由。
    - 如果佇列路由仍不可用，公告會以短暫指數退避重試，之後才最終放棄。
    - 完成交付會保留已解析的請求者路由：可用時，繫結執行緒或繫結對話的完成路由會優先；如果完成來源只提供頻道，OpenClaw 會從請求者工作階段已解析的路由（`lastChannel` / `lastTo` / `lastAccountId`）填入缺少的目標/帳號，因此直接交付仍可運作。

  </Accordion>
  <Accordion title="完成交接中繼資料">
    交給請求者工作階段的完成交接是執行階段產生的內部脈絡（不是使用者撰寫文字），並包含：

    - `Result` — 最新可見的 `assistant` 回覆文字，否則為經清理的最新工具/toolResult 文字。終止且失敗的執行不會重用擷取到的回覆文字。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - 精簡的執行階段/token 統計資料。
    - 一則交付指示，要求請求者代理以一般助理語氣重寫（不要轉送原始內部中繼資料）。

  </Accordion>
  <Accordion title="模式與 ACP 執行階段">
    - `--model` 與 `--thinking` 會覆寫該特定執行的預設值。
    - 完成後使用 `info`/`log` 檢查詳細資料與輸出。
    - `/subagents spawn` 是一次性模式（`mode: "run"`）。若要使用持久的繫結執行緒工作階段，請搭配 `thread: true` 和 `mode: "session"` 使用 `sessions_spawn`。
    - 對於 ACP harness 工作階段（Claude Code、Gemini CLI、OpenCode，或明確的 Codex ACP/acpx），當工具宣告該執行階段時，請搭配 `runtime: "acp"` 使用 `sessions_spawn`。除錯完成結果或代理對代理迴圈時，請參閱 [ACP 交付模型](/zh-TW/tools/acp-agents#delivery-model)。啟用 `codex` plugin 時，除非使用者明確要求 ACP/acpx，否則 Codex 聊天/執行緒控制應優先使用 `/codex ...` 而非 ACP。
    - OpenClaw 會隱藏 `runtime: "acp"`，直到 ACP 已啟用、請求者未被沙盒化，且已載入例如 `acpx` 的後端 plugin。`runtime: "acp"` 需要外部 ACP harness ID，或是具有 `runtime.type="acp"` 的 `agents.list[]` 項目；對於來自 `agents_list` 的一般 OpenClaw 設定代理，請使用預設子代理執行階段。

  </Accordion>
</AccordionGroup>

## 脈絡模式

原生子代理會以隔離狀態啟動，除非呼叫者明確要求分支目前逐字稿。

| 模式       | 使用時機                                                                                                                         | 行為                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 新研究、獨立實作、慢速工具工作，或任何可在任務文字中簡述的事項                           | 建立乾淨的子逐字稿。這是預設值，並能降低 token 使用量。  |
| `fork`     | 依賴目前對話、先前工具結果，或請求者逐字稿中已有細緻指示的工作 | 在子代理啟動前，將請求者逐字稿分支到子工作階段中。 |

請謹慎使用 `fork`。它是用於對脈絡敏感的委派，而不是取代清楚撰寫任務提示。

## 工具：`sessions_spawn`

在全域 `subagent` 通道上以 `deliver: false` 啟動子代理執行，然後執行公告步驟，並將公告回覆張貼到請求者聊天頻道。

可用性取決於呼叫者的有效工具政策。`coding` 與 `full` 設定檔預設會公開 `sessions_spawn`。`messaging` 設定檔不會；對於應委派工作的代理，請加入 `tools.alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"]`，或使用 `tools.profile: "coding"`。頻道/群組、提供者、沙盒，以及每個代理的允許/拒絕政策，仍可在設定檔階段之後移除該工具。請從同一工作階段使用 `/tools` 確認有效工具清單。

**預設值：**

- **模型：**除非你設定 `agents.defaults.subagents.model`（或每個代理的 `agents.list[].subagents.model`），否則會繼承呼叫者；明確的 `sessions_spawn.model` 仍會優先。
- **Thinking：**除非你設定 `agents.defaults.subagents.thinking`（或每個代理的 `agents.list[].subagents.thinking`），否則會繼承呼叫者；明確的 `sessions_spawn.thinking` 仍會優先。
- **執行逾時：**如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 會在有設定時使用 `agents.defaults.subagents.runTimeoutSeconds`；否則退回到 `0`（無逾時）。

### 委派提示模式

`agents.defaults.subagents.delegationMode` 只控制提示指引；它不會變更工具政策或強制委派。

- `suggest`（預設）：保留標準提示提醒，以便在較大或較慢的工作中使用子代理。
- `prefer`：告訴主要代理保持回應性，並透過 `sessions_spawn` 委派任何比直接回覆更複雜的工作。

每個代理的覆寫使用 `agents.list[].subagents.delegationMode`。

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
  選用的穩定控制代稱，用於稍後的 `subagents` 目標指定。必須符合 `[a-z][a-z0-9_]{0,63}`，且不能是 `last` 或 `all` 等保留目標。當協調者在產生多個子項後，可能需要引導、終止或識別特定子項時，請優先使用它。
</ParamField>
<ParamField path="label" type="string">
  選用的人類可讀標籤。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允許時，於另一個代理 id 下產生。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 僅適用於外部 ACP 控制框架（`claude`、`droid`、`gemini`、`opencode`，或明確要求的 Codex ACP/acpx），以及 `runtime.type` 為 `acp` 的 `agents.list[]` 項目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  僅限 ACP。當 `runtime: "acp"` 時恢復現有 ACP 控制框架工作階段；原生子代理產生會忽略此項。
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
<ParamField path="runTimeoutSeconds" type="number">
  設定時預設為 `agents.defaults.subagents.runTimeoutSeconds`，否則為 `0`。設定後，子代理執行會在 N 秒後中止。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  為 `true` 時，會為此子代理工作階段要求頻道討論串繫結。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，預設會變成 `session`。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 會在宣告後立即封存（仍會透過重新命名保留逐字稿）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` 會拒絕產生，除非目標子執行階段已沙箱化。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 會將請求者目前的逐字稿分支到子工作階段。僅限原生子代理。繫結討論串的產生預設為 `fork`；非討論串產生預設為 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受頻道傳遞參數（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）。若要傳遞，請從產生的執行使用
`message`/`sessions_send`。
</Warning>

### 任務名稱與目標指定

`taskName` 是面向模型的協調控制代稱，不是工作階段金鑰。
當協調者稍後可能需要引導或終止該子項時，請將它用於穩定的子項名稱，例如 `review_subagents`、
`linux_validation` 或 `docs_update`。

目標解析接受完全相符的 `taskName`，以及不含歧義的前綴。
比對範圍限於編號 `/subagents` 目標所使用的相同作用中/近期目標視窗，因此過期的已完成子項不會讓重複使用的控制代稱產生歧義。如果兩個作用中或近期子項共用相同
`taskName`，目標就有歧義；請改用清單索引、工作階段金鑰或執行 id。

保留目標 `last` 和 `all` 不是有效的 `taskName` 值，因為它們已經具有控制意義。

## 工具：`sessions_yield`

結束目前模型回合並等待執行階段事件，主要是子代理完成事件，作為下一則訊息到達。當請求者必須等這些完成事件到達後才能產生最終答案時，請在產生必要子項工作後使用它。

`sessions_yield` 是等待原語。不要為了偵測子項完成，就用輪詢 `subagents`、`sessions_list`、`sessions_history`、shell
`sleep` 或程序輪詢迴圈取代它。

只有在工作階段的有效工具清單包含 `sessions_yield` 時才使用它。某些最小或自訂工具設定檔可能會公開 `sessions_spawn` 和
`subagents`，但不公開 `sessions_yield`；在這種情況下，不要為了等待完成而自創輪詢迴圈。

當存在作用中的子項時，OpenClaw 會將精簡、由執行階段產生的
`Active Subagents` 提示區塊注入一般回合，讓請求者不需輪詢即可看到目前子工作階段、執行 id、狀態、標籤、任務和
`taskName` 別名。該區塊中的任務和標籤欄位會以資料形式加上引號，而不是作為指令，因為它們可能來自使用者/模型提供的產生引數。

## 工具：`subagents`

列出、引導或終止請求者工作階段所擁有的已產生子代理執行。它的範圍限於目前請求者；子項只能看到/控制自己所控制的子項。

使用 `subagents` 進行隨選狀態查詢、偵錯、引導或終止。
使用 `sessions_yield` 等待完成事件。

## 繫結討論串的工作階段

當頻道啟用討論串繫結時，子代理可以持續繫結到討論串，讓該討論串中的後續使用者訊息繼續路由到相同的子代理工作階段。

### 支援討論串的頻道

**Discord** 目前是唯一支援的頻道。它支援持久化的繫結討論串子代理工作階段（使用
`sessions_spawn` 搭配 `thread: true`）、手動討論串控制（`/focus`、`/unfocus`、`/agents`、
`/session idle`、`/session max-age`），以及配接器金鑰
`channels.discord.threadBindings.enabled`、
`channels.discord.threadBindings.idleHours`、
`channels.discord.threadBindings.maxAgeHours` 和
`channels.discord.threadBindings.spawnSessions`。

### 快速流程

<Steps>
  <Step title="產生">
    使用 `sessions_spawn` 搭配 `thread: true`（並可選擇加上 `mode: "session"`）。
  </Step>
  <Step title="繫結">
    OpenClaw 會在作用中頻道中建立討論串，或將討論串繫結到該工作階段目標。
  </Step>
  <Step title="路由後續訊息">
    該討論串中的回覆和後續訊息會路由到已繫結的工作階段。
  </Step>
  <Step title="檢查逾時">
    使用 `/session idle` 檢查/更新閒置自動取消聚焦，並使用
    `/session max-age` 控制硬性上限。
  </Step>
  <Step title="卸離">
    使用 `/unfocus` 手動卸離。
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
- **頻道覆寫與產生自動繫結金鑰**為配接器專屬。請參閱上方的[支援討論串的頻道](#thread-supporting-channels)。

請參閱[設定參考](/zh-TW/gateway/configuration-reference)和
[斜線命令](/zh-TW/tools/slash-commands)以取得目前的配接器詳細資訊。

### 允許清單

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可透過明確 `agentId` 指定為目標的代理 id 清單（`["*"]` 允許任何代理）。預設：僅請求者代理。如果你設定了清單，而且仍希望請求者能使用 `agentId` 產生自身，請在清單中包含請求者 id。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  當請求者代理未設定自己的 `subagents.allowAgents` 時使用的預設目標代理允許清單。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選擇設定檔）。每代理覆寫：`agents.list[].subagents.requireAgentId`。
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Gateway `agent` 宣告傳遞嘗試的每次呼叫逾時。值為正整數毫秒，並會限制在平台安全計時器最大值內。暫時性重試可能讓總宣告等待時間比單一設定逾時更長。
</ParamField>

如果請求者工作階段已沙箱化，`sessions_spawn` 會拒絕會以非沙箱方式執行的目標。

### 探索

使用 `agents_list` 查看目前允許用於 `sessions_spawn` 的代理 id。回應包含每個列出代理的有效模型和嵌入式執行階段中繼資料，讓呼叫者可以區分 PI、Codex 應用程式伺服器，以及其他已設定的原生執行階段。

### 自動封存

- 子代理工作階段會在 `agents.defaults.subagents.archiveAfterMinutes` 後自動封存（預設 `60`）。
- 封存使用 `sessions.delete`，並將逐字稿重新命名為 `*.deleted.<timestamp>`（同一資料夾）。
- `cleanup: "delete"` 會在宣告後立即封存（仍會透過重新命名保留逐字稿）。
- 自動封存為盡力而為；如果 gateway 重新啟動，待處理的計時器會遺失。
- `runTimeoutSeconds` **不會**自動封存；它只會停止執行。工作階段會保留到自動封存為止。
- 自動封存同等適用於深度 1 和深度 2 工作階段。
- 瀏覽器清理與封存清理是分開的：追蹤的瀏覽器分頁/程序會在執行完成時盡力關閉，即使逐字稿/工作階段記錄被保留也是如此。

## 巢狀子代理

預設情況下，子代理不能產生自己的子代理
（`maxSpawnDepth: 1`）。設定 `maxSpawnDepth: 2` 可啟用一層巢狀
，也就是**協調者模式**：主代理 → 協調者子代理 →
工作者子子代理。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### 深度層級

| 深度 | 工作階段金鑰形狀                             | 角色                                          | 可以產生？                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主代理                                        | 一律可以                     |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子代理（允許深度 2 時為協調者）              | 僅當 `maxSpawnDepth >= 2`    |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子代理（葉節點工作者）                     | 永不                         |

### 宣告鏈

結果會沿鏈向上流動：

1. 深度 2 工作者完成 → 宣告給其父項（深度 1 協調者）。
2. 深度 1 協調者接收宣告、合成結果、完成 → 宣告給主代理。
3. 主代理接收宣告並傳遞給使用者。

每一層只會看到其直接子項的宣告。

<Note>
**操作指引：**只啟動一次子工作，並等待完成事件，而不是圍繞 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` sleep 命令建立輪詢迴圈。`sessions_list` 和 `/subagents list` 會讓子工作階段關係專注於執行中的工作：執行中的子項會保持附加，已結束的子項會在短暫的最近視窗中保持可見，而過時且僅存在於儲存區的子項連結會在其新鮮度視窗後被忽略。這可防止舊的 `spawnedBy` / `parentSessionKey` 中繼資料在重新啟動後復活幽靈子項。如果子項完成事件在你已送出最終回答後才抵達，正確的後續回應是精確的靜默權杖 `NO_REPLY` / `no_reply`。
</Note>

### 依深度的工具策略

- 角色與控制範圍會在產生時寫入工作階段中繼資料。這可避免扁平化或還原的工作階段金鑰意外重新取得協調器權限。
- **深度 1（協調器，當 `maxSpawnDepth >= 2` 時）：**取得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子項。其他工作階段/系統工具仍會被拒絕。
- **深度 1（葉節點，當 `maxSpawnDepth == 1` 時）：**沒有工作階段工具（目前的預設行為）。
- **深度 2（葉節點工作器）：**沒有工作階段工具；在深度 2 時一律拒絕 `sessions_spawn`。無法再產生更多子項。

### 每個代理的產生限制

每個代理工作階段（任何深度）同一時間最多可有 `maxChildrenPerAgent`（預設 `5`）個作用中子項。這可防止單一協調器造成失控的扇出。

### 串聯停止

停止深度 1 協調器會自動停止其所有深度 2 子項：

- 主聊天中的 `/stop` 會停止所有深度 1 代理，並串聯停止其深度 2 子項。
- `/subagents kill <id>` 會停止特定子代理，並串聯停止其子項。
- `/subagents kill all` 會停止請求者的所有子代理，並進行串聯停止。

## 驗證

子代理驗證會依 **代理 ID** 解析，而不是依工作階段類型：

- 子代理工作階段金鑰為 `agent:<agentId>:subagent:<uuid>`。
- 驗證儲存區會從該代理的 `agentDir` 載入。
- 主代理的驗證設定檔會合併作為**備援**；發生衝突時，代理設定檔會覆寫主設定檔。

合併是加成式的，因此主設定檔永遠可作為備援。目前尚未支援每個代理完全隔離的驗證。

## 通告

子代理會透過通告步驟回報：

- 通告步驟在子代理工作階段內執行（不是請求者工作階段）。
- 如果子代理精確回覆 `ANNOUNCE_SKIP`，就不會發布任何內容。
- 如果最新的助理文字是精確的靜默權杖 `NO_REPLY` / `no_reply`，即使先前曾有可見進度，也會抑制通告輸出。

傳遞取決於請求者深度：

- 頂層請求者工作階段會使用帶有外部傳遞的後續 `agent` 呼叫（`deliver=true`）。
- 巢狀請求者子代理工作階段會接收內部後續注入（`deliver=false`），讓協調器可在工作階段內合成子項結果。
- 如果巢狀請求者子代理工作階段已不存在，OpenClaw 會在可用時退回使用該工作階段的請求者。

對於頂層請求者工作階段，完成模式的直接傳遞會先解析任何已繫結的對話/執行緒路由與 hook 覆寫，然後從請求者工作階段儲存的路由填入缺少的頻道目標欄位。這可確保即使完成來源只識別頻道，完成內容仍會送到正確的聊天/主題。

建立巢狀完成發現項目時，子項完成彙總會限定於目前的請求者執行，防止先前執行的過時子項輸出洩漏到目前通告中。當頻道配接器上有可用的執行緒/主題路由時，通告回覆會保留該路由。

### 通告內容

通告內容會正規化為穩定的內部事件區塊：

| 欄位 | 來源 |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| 來源 | `subagent` 或 `cron` |
| 工作階段 ID | 子工作階段金鑰/ID |
| 類型 | 通告類型 + 任務標籤 |
| 狀態 | 從執行階段結果衍生（`success`、`error`、`timeout` 或 `unknown`）；**不是**從模型文字推斷 |
| 結果內容 | 最新可見的助理文字，否則為已清理的最新工具/toolResult 文字 |
| 後續 | 描述何時回覆與何時保持靜默的指示 |

終止且失敗的執行會回報失敗狀態，而不重播擷取到的回覆文字。逾時時，如果子項只完成了工具呼叫，通告可將該歷史壓縮成簡短的部分進度摘要，而不是重播原始工具輸出。

### 統計列

通告承載內容會在結尾包含統計列（即使已換行包覆）：

- 執行時間（例如 `runtime 5m12s`）。
- 權杖用量（輸入/輸出/總計）。
- 設定模型定價時的預估成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 與轉錄路徑，讓主代理可透過 `sessions_history` 擷取歷史，或檢查磁碟上的檔案。

內部中繼資料僅供協調使用；面向使用者的回覆應改寫成一般助理語氣。

### 為什麼偏好 `sessions_history`

`sessions_history` 是較安全的協調路徑：

- 助理回憶會先正規化：移除 thinking 標籤；移除 `<relevant-memories>` / `<relevant_memories>` 鷹架；移除純文字工具呼叫 XML 承載區塊（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`），包括從未乾淨關閉的截斷承載；移除降級的工具呼叫/結果鷹架與歷史內容標記；移除洩漏的模型控制權杖（`<|assistant|>`、其他 ASCII `<|...|>`、全形 `<｜...｜>`）；移除格式錯誤的 MiniMax 工具呼叫 XML。
- 類似認證/權杖的文字會被遮蔽。
- 長區塊可被截斷。
- 非常大的歷史可丟棄較舊的列，或以 `[sessions_history omitted: message too large]` 取代過大的列。
- 當你需要完整逐位元組一致的轉錄時，原始磁碟轉錄檢查是備援方式。

## 工具策略

子代理會先使用與父代理或目標代理相同的設定檔與工具策略管線。之後，OpenClaw 會套用子代理限制層。

若沒有具限制性的 `tools.profile`，子代理會取得**除工作階段工具與系統工具以外的所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` 在這裡仍是有界且已清理的回憶檢視；它不是原始轉錄傾印。

當 `maxSpawnDepth >= 2` 時，深度 1 協調器子代理還會收到 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理其子項。

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

`tools.subagents.tools.allow` 是最終的僅允許篩選器。它可以縮小已解析的工具集合，但無法**加回**被 `tools.profile` 移除的工具。例如，`tools.profile: "coding"` 包含 `web_search`/`web_fetch`，但不包含 `browser` 工具。若要讓 coding 設定檔的子代理使用瀏覽器自動化，請在設定檔階段加入 browser：

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

子代理使用專用的進程內佇列通道：

- **通道名稱：**`subagent`
- **並行度：**`agents.defaults.subagents.maxConcurrent`（預設 `8`）

## 存活性與復原

OpenClaw 不會將缺少 `endedAt` 視為子代理仍存活的永久證明。早於過時執行視窗且尚未結束的執行，將不再於 `/subagents list`、狀態摘要、後代完成閘控與每工作階段並行檢查中計為作用中/待處理。

Gateway 重新啟動後，過時且未結束的已還原執行會被修剪，除非其子工作階段標記為 `abortedLastRun: true`。這些因重新啟動而中止的子工作階段仍可透過子代理孤兒復原流程復原；該流程會在清除中止標記前送出合成的恢復訊息。

自動重新啟動復原會依每個子工作階段設限。如果同一個子代理子項在快速重新卡住視窗內反覆被接受進行孤兒復原，OpenClaw 會在該工作階段上保存復原墓碑，並在之後重新啟動時停止自動恢復它。執行 `openclaw tasks maintenance --apply` 來協調任務記錄，或執行 `openclaw doctor --fix` 來清除墓碑工作階段上的過時中止復原旗標。

<Note>
如果子代理產生失敗並出現 Gateway `PAIRING_REQUIRED` / `scope-upgrade`，請先檢查 RPC 呼叫者，再編輯配對狀態。內部 `sessions_spawn` 協調應以 `client.id: "gateway-client"` 搭配 `client.mode: "backend"`，透過直接 loopback 共享權杖/密碼驗證連線；該路徑不依賴 CLI 的已配對裝置範圍基準線。遠端呼叫者、明確的 `deviceIdentity`、明確的裝置權杖路徑，以及 browser/Node 用戶端，仍需要一般裝置核准才能進行範圍升級。
</Note>

## 停止

- 在請求者聊天中送出 `/stop` 會中止請求者工作階段，並停止從中產生的任何作用中子代理執行，且串聯至巢狀子項。
- `/subagents kill <id>` 會停止特定子代理，並串聯停止其子項。

## 限制

- 子代理通告是**盡力而為**。如果 Gateway 重新啟動，待處理的「回傳通告」工作會遺失。
- 子代理仍共享相同的 Gateway 行程資源；請將 `maxConcurrent` 視為安全閥。
- `sessions_spawn` 一律為非阻塞：它會立即傳回 `{ status: "accepted", runId, childSessionKey }`。
- 子代理內容只會注入 `AGENTS.md`、`TOOLS.md`、`SOUL.md`、`IDENTITY.md` 和 `USER.md`（不包含 `MEMORY.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大巢狀深度為 5（`maxSpawnDepth` 範圍：1–5）。大多數使用情境建議使用深度 2。
- `maxChildrenPerAgent` 會限制每個工作階段的作用中子項數量（預設 `5`，範圍 `1–20`）。

## 相關

- [ACP 代理](/zh-TW/tools/acp-agents)
- [代理傳送](/zh-TW/tools/agent-send)
- [背景任務](/zh-TW/automation/tasks)
- [多代理沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
