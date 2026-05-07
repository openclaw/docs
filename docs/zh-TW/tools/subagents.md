---
read_when:
    - 你想透過代理程式進行背景或平行工作
    - 你正在變更 sessions_spawn 或子代理工具政策
    - 你正在實作或疑難排解執行緒綁定的子代理工作階段
sidebarTitle: Sub-agents
summary: 產生隔離的背景代理執行個體，並將結果回報到發出請求的聊天
title: 子代理
x-i18n:
    generated_at: "2026-05-07T13:26:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b112f9c45bcb9cdc5d3b856f2fe2a36617606ad278b0ccc3db8830f0e847ba9
    source_path: tools/subagents.md
    workflow: 16
---

子代理是在既有代理執行中產生的背景代理執行。
它們會在自己的工作階段（`agent:<agentId>:subagent:<uuid>`）中執行，並在完成時將結果**公告**回請求者的聊天頻道。每個子代理執行都會被追蹤為一個
[背景任務](/zh-TW/automation/tasks)。

主要目標：

- 平行處理「研究／長時間任務／慢速工具」工作，而不阻塞主要執行。
- 預設讓子代理保持隔離（工作階段分離 + 選用沙箱）。
- 讓工具介面難以被誤用：子代理預設**不會**取得工作階段工具。
- 支援可設定的巢狀深度，以便使用協調器模式。

<Note>
**成本注意事項：**每個子代理預設都有自己的內容脈絡與權杖使用量。對於繁重或重複性的任務，請為子代理設定成本較低的模型，並讓主要代理使用品質較高的模型。可透過 `agents.defaults.subagents.model` 或個別代理覆寫來設定。當子代理確實需要請求者目前的逐字稿時，代理可以在該次產生請求中指定 `context: "fork"`。繫結討論串的子代理工作階段預設為 `context: "fork"`，因為它們會將目前對話分支到後續討論串中。
</Note>

## 斜線指令

使用 `/subagents` 來檢查或控制**目前工作階段**的子代理執行：

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

使用頂層 [`/steer <message>`](/zh-TW/tools/steer) 來引導目前請求者工作階段的作用中執行。當目標是子執行時，請使用 `/subagents steer <id|#> <message>`。

`/subagents info` 會顯示執行中繼資料（狀態、時間戳記、工作階段 id、逐字稿路徑、清理）。使用 `sessions_history` 取得有界限且經安全篩選的回溯檢視；當你需要原始完整逐字稿時，請檢查磁碟上的逐字稿路徑。

### 討論串繫結控制

這些指令可用於支援持久討論串繫結的頻道。請參閱下方的[支援討論串的頻道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 產生行為

`/subagents spawn` 會以使用者指令（不是內部轉送）的形式啟動背景子代理，並在執行完成時將一次最終完成更新傳回請求者聊天。

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - 產生指令不會阻塞；它會立即傳回執行 id。
    - 完成時，子代理會向請求者聊天頻道公告摘要／結果訊息。
    - 完成採用推送方式。產生後，請**不要**在迴圈中輪詢 `/subagents list`、`sessions_list` 或 `sessions_history` 只為等待它完成；僅在需要偵錯或介入時按需檢查狀態。
    - 完成時，在公告清理流程繼續之前，OpenClaw 會盡力關閉該子代理工作階段開啟並被追蹤的瀏覽器分頁／程序。

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw 會透過帶有穩定冪等鍵的 `agent` 回合，將完成結果交回請求者工作階段。
    - 如果請求者執行仍在作用中，OpenClaw 會先嘗試喚醒／引導該執行，而不是啟動第二條可見回覆路徑。
    - 如果請求者代理的完成交接失敗或未產生可見輸出，OpenClaw 會將遞送視為失敗，並退回到佇列路由／重試。它不會將子代理結果直接原始傳送到外部聊天。
    - 如果無法使用直接交接，則會退回到佇列路由。
    - 如果佇列路由仍不可用，公告會以短暫的指數退避重試，然後才最終放棄。
    - 完成遞送會保留解析後的請求者路由：繫結討論串或繫結對話的完成路由在可用時優先；如果完成來源只提供頻道，OpenClaw 會從請求者工作階段解析後的路由（`lastChannel` / `lastTo` / `lastAccountId`）補齊缺少的目標／帳戶，讓直接遞送仍可運作。

  </Accordion>
  <Accordion title="Completion handoff metadata">
    給請求者工作階段的完成交接是執行階段產生的內部內容脈絡（不是使用者撰寫的文字），並包含：

    - `Result` — 最新可見的 `assistant` 回覆文字，否則為已清理的最新工具／toolResult 文字。終端失敗的執行不會重複使用已擷取的回覆文字。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - 精簡的執行階段／權杖統計。
    - 一則遞送指示，要求請求者代理以一般助理語氣重寫（而不是轉送原始內部中繼資料）。

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` 與 `--thinking` 會覆寫該特定執行的預設值。
    - 使用 `info`/`log` 在完成後檢查詳細資料與輸出。
    - `/subagents spawn` 是一次性模式（`mode: "run"`）。若要使用持久的繫結討論串工作階段，請搭配 `thread: true` 與 `mode: "session"` 使用 `sessions_spawn`。
    - 對於 ACP 控制器工作階段（Claude Code、Gemini CLI、OpenCode，或明確的 Codex ACP/acpx），當工具宣告該執行階段時，請使用 `runtime: "acp"` 的 `sessions_spawn`。在偵錯完成或代理對代理迴圈時，請參閱 [ACP 遞送模型](/zh-TW/tools/acp-agents#delivery-model)。啟用 `codex` Plugin 時，除非使用者明確要求 ACP/acpx，否則 Codex 聊天／討論串控制應偏好使用 `/codex ...` 而不是 ACP。
    - OpenClaw 會隱藏 `runtime: "acp"`，直到 ACP 已啟用、請求者未被沙箱化，且已載入如 `acpx` 的後端 Plugin。`runtime: "acp"` 需要外部 ACP 控制器 id，或 `runtime.type="acp"` 的 `agents.list[]` 項目；對於來自 `agents_list` 的一般 OpenClaw 設定代理，請使用預設子代理執行階段。

  </Accordion>
</AccordionGroup>

## 內容脈絡模式

原生子代理會以隔離狀態啟動，除非呼叫者明確要求分支目前逐字稿。

| 模式       | 使用時機                                                                                                                         | 行為                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、獨立實作、慢速工具工作，或任何可在任務文字中簡要說明的事項                           | 建立乾淨的子逐字稿。這是預設值，並可降低權杖使用量。  |
| `fork`     | 依賴目前對話、先前工具結果，或已存在於請求者逐字稿中的細緻指示的工作 | 在子代理啟動前，將請求者逐字稿分支到子工作階段。 |

請節制使用 `fork`。它是用於對內容脈絡敏感的委派，而不是用來取代撰寫清楚的任務提示。

## 工具：`sessions_spawn`

在全域 `subagent` 通道上以 `deliver: false` 啟動子代理執行，接著執行公告步驟，並將公告回覆張貼到請求者聊天頻道。

可用性取決於呼叫者的有效工具政策。`coding` 與 `full` 設定檔預設公開 `sessions_spawn`。`messaging` 設定檔不會；對於應該委派工作的代理，請加入 `tools.alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"]`，或使用 `tools.profile: "coding"`。頻道／群組、提供者、沙箱，以及個別代理的允許／拒絕政策，仍可能在設定檔階段後移除此工具。請在同一工作階段使用 `/tools` 確認有效工具清單。

**預設值：**

- **模型：** 除非你設定 `agents.defaults.subagents.model`（或個別代理的 `agents.list[].subagents.model`），否則會繼承呼叫者；明確的 `sessions_spawn.model` 仍會優先。
- **思考：** 除非你設定 `agents.defaults.subagents.thinking`（或個別代理的 `agents.list[].subagents.thinking`），否則會繼承呼叫者；明確的 `sessions_spawn.thinking` 仍會優先。
- **執行逾時：** 如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 會在已設定時使用 `agents.defaults.subagents.runTimeoutSeconds`；否則退回到 `0`（無逾時）。

### 工具參數

<ParamField path="task" type="string" required>
  子代理的任務描述。
</ParamField>
<ParamField path="label" type="string">
  選用的人類可讀標籤。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允許時，於另一個代理 id 底下產生。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 僅適用於外部 ACP 控制器（`claude`、`droid`、`gemini`、`opencode`，或明確要求的 Codex ACP/acpx），以及 `runtime.type` 為 `acp` 的 `agents.list[]` 項目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  僅限 ACP。當 `runtime: "acp"` 時恢復既有 ACP 控制器工作階段；對原生子代理產生會被忽略。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  僅限 ACP。當 `runtime: "acp"` 時，將 ACP 執行輸出串流到父工作階段；原生子代理產生請省略。
</ParamField>
<ParamField path="model" type="string">
  覆寫子代理模型。無效值會被略過，子代理會在預設模型上執行，並在工具結果中附帶警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆寫子代理執行的思考層級。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  已設定時預設為 `agents.defaults.subagents.runTimeoutSeconds`，否則為 `0`。設定後，子代理執行會在 N 秒後中止。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  當為 `true` 時，為此子代理工作階段要求頻道討論串繫結。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，預設會變成 `session`。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 會在公告後立即封存（仍會透過重新命名保留逐字稿）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` 會拒絕產生，除非目標子執行階段已沙箱化。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 會將請求者目前的逐字稿分支到子工作階段。僅限原生子代理。繫結討論串的產生預設為 `fork`；非討論串產生預設為 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` 不接受頻道遞送參數（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）。若要遞送，請從產生的執行使用 `message`/`sessions_send`。
</Warning>

## 繫結討論串的工作階段

當某個頻道啟用討論串繫結時，子代理可以持續繫結到討論串，讓該討論串中的後續使用者訊息持續路由到同一個子代理工作階段。

### 支援討論串的頻道

**Discord** 目前是唯一支援的頻道。它支援持久的繫結討論串子代理工作階段（搭配 `thread: true` 的 `sessions_spawn`）、手動討論串控制（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`），以及配接器鍵 `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours` 和 `channels.discord.threadBindings.spawnSessions`。

### 快速流程

<Steps>
  <Step title="產生">
    使用 `thread: true`（也可選擇加上 `mode: "session"`）呼叫 `sessions_spawn`。
  </Step>
  <Step title="繫結">
    OpenClaw 會在目前作用中的頻道中，為該工作階段目標建立或繫結一個對話串。
  </Step>
  <Step title="路由後續訊息">
    該對話串中的回覆與後續訊息會路由至已繫結的工作階段。
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

| 指令               | 效果                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 將目前對話串（或建立一個）繫結至子代理/工作階段目標                  |
| `/unfocus`         | 移除目前已繫結對話串的繫結                                           |
| `/agents`          | 列出作用中的執行與繫結狀態（`thread:<id>` 或 `unbound`）              |
| `/session idle`    | 檢查/更新閒置自動取消聚焦（僅限已聚焦的已繫結對話串）                |
| `/session max-age` | 檢查/更新硬性上限（僅限已聚焦的已繫結對話串）                        |

### 設定開關

- **全域預設值：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **頻道覆寫與產生時自動繫結鍵** 依介面卡而定。請參閱上方的[支援對話串的頻道](#thread-supporting-channels)。

請參閱[設定參考](/zh-TW/gateway/configuration-reference)與
[斜線指令](/zh-TW/tools/slash-commands)，了解目前介面卡詳細資訊。

### 允許清單

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可透過明確 `agentId` 指定為目標的代理 ID 清單（`["*"]` 允許任何代理）。預設：僅限請求者代理。如果你設定清單，且仍希望請求者能使用 `agentId` 產生自身，請將請求者 ID 加入清單。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  當請求者代理未設定自己的 `subagents.allowAgents` 時使用的預設目標代理允許清單。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選取設定檔）。逐代理覆寫：`agents.list[].subagents.requireAgentId`。
</ParamField>

如果請求者工作階段已沙盒化，`sessions_spawn` 會拒絕會在未沙盒化狀態下執行的目標。

### 探索

使用 `agents_list` 查看目前允許 `sessions_spawn` 使用哪些代理 ID。回應會包含每個列出代理的有效模型與嵌入式執行階段中繼資料，讓呼叫端能區分 PI、Codex app-server，以及其他已設定的原生執行階段。

### 自動封存

- 子代理工作階段會在 `agents.defaults.subagents.archiveAfterMinutes` 之後自動封存（預設 `60`）。
- 封存會使用 `sessions.delete`，並將逐字稿重新命名為 `*.deleted.<timestamp>`（同一資料夾）。
- `cleanup: "delete"` 會在宣告後立即封存（仍會透過重新命名保留逐字稿）。
- 自動封存是盡力而為；如果 Gateway 重新啟動，待執行的計時器會遺失。
- `runTimeoutSeconds` **不會**自動封存；它只會停止執行。工作階段會保留到自動封存。
- 自動封存同樣適用於深度 1 與深度 2 工作階段。
- 瀏覽器清理與封存清理是分開的：執行完成時，受追蹤的瀏覽器分頁/程序會盡力關閉，即使逐字稿/工作階段記錄仍保留。

## 巢狀子代理

預設情況下，子代理無法產生自己的子代理（`maxSpawnDepth: 1`）。設定 `maxSpawnDepth: 2` 可啟用一層巢狀結構，也就是**協調器模式**：主代理 → 協調器子代理 → 工作子子代理。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### 深度層級

| 深度 | 工作階段鍵形狀                               | 角色                                            | 可以產生？                   |
| ---- | -------------------------------------------- | ----------------------------------------------- | ---------------------------- |
| 0    | `agent:<id>:main`                            | 主代理                                          | 一律可以                     |
| 1    | `agent:<id>:subagent:<uuid>`                 | 子代理（允許深度 2 時為協調器）                 | 僅限 `maxSpawnDepth >= 2`    |
| 2    | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子代理（葉節點工作者）                        | 絕不可以                     |

### 宣告鏈

結果會沿鏈往回流動：

1. 深度 2 工作者完成 → 向其父項（深度 1 協調器）宣告。
2. 深度 1 協調器接收宣告、彙整結果、完成 → 向主代理宣告。
3. 主代理接收宣告並傳遞給使用者。

每個層級只會看到其直接子項的宣告。

<Note>
**操作指引：**只啟動一次子工作，然後等待完成事件，而不是圍繞 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` sleep 指令建立輪詢迴圈。`sessions_list` 與 `/subagents list` 會讓子工作階段關係聚焦於即時工作：即時子項會保持附加，已結束子項會在短暫的近期視窗內維持可見，而過期的僅存放區子項連結會在新鮮度視窗之後被忽略。這可防止舊的 `spawnedBy` / `parentSessionKey` 中繼資料在重新啟動後讓幽靈子項復現。如果子項完成事件在你已送出最終答案後才抵達，正確的後續回應是完全靜默權杖 `NO_REPLY` / `no_reply`。
</Note>

### 依深度決定的工具政策

- 角色與控制範圍會在產生時寫入工作階段中繼資料。這可避免扁平或已還原的工作階段鍵意外重新取得協調器權限。
- **深度 1（協調器，當 `maxSpawnDepth >= 2` 時）：**取得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子項。其他工作階段/系統工具仍會被拒絕。
- **深度 1（葉節點，當 `maxSpawnDepth == 1` 時）：**沒有工作階段工具（目前預設行為）。
- **深度 2（葉節點工作者）：**沒有工作階段工具，`sessions_spawn` 在深度 2 一律遭拒。無法再產生更多子項。

### 逐代理產生限制

每個代理工作階段（任何深度）同一時間最多可以有 `maxChildrenPerAgent` 個作用中的子項（預設 `5`）。這可防止單一協調器失控扇出。

### 級聯停止

停止深度 1 協調器會自動停止其所有深度 2 子項：

- 主聊天中的 `/stop` 會停止所有深度 1 代理，並級聯至其深度 2 子項。
- `/subagents kill <id>` 會停止特定子代理，並級聯至其子項。
- `/subagents kill all` 會停止請求者的所有子代理，並級聯。

## 驗證

子代理驗證會依**代理 ID**解析，而不是依工作階段類型：

- 子代理工作階段鍵為 `agent:<agentId>:subagent:<uuid>`。
- 驗證存放區會從該代理的 `agentDir` 載入。
- 主代理的驗證設定檔會合併為**備援**；衝突時代理設定檔會覆寫主設定檔。

合併是累加的，因此主設定檔一律可作為備援使用。目前尚不支援每個代理完全隔離的驗證。

## 宣告

子代理會透過宣告步驟回報：

- 宣告步驟會在子代理工作階段內執行（不是請求者工作階段）。
- 如果子代理精確回覆 `ANNOUNCE_SKIP`，就不會發佈任何內容。
- 如果最新的助理文字是完全靜默權杖 `NO_REPLY` / `no_reply`，即使先前已有可見進度，宣告輸出也會被抑制。

傳遞方式取決於請求者深度：

- 頂層請求者工作階段會使用帶有外部傳遞的後續 `agent` 呼叫（`deliver=true`）。
- 巢狀請求者子代理工作階段會接收內部後續注入（`deliver=false`），讓協調器能在工作階段內彙整子項結果。
- 如果巢狀請求者子代理工作階段已不存在，OpenClaw 會在可用時回退至該工作階段的請求者。

對於頂層請求者工作階段，完成模式直接傳遞會先解析任何已繫結的對話/對話串路由與 hook 覆寫，然後從請求者工作階段儲存的路由填補缺少的頻道目標欄位。這可讓完成結果保持在正確聊天/主題中，即使完成來源只識別頻道也一樣。

建立巢狀完成結果時，子項完成彙總會限縮於目前請求者執行，防止舊的先前執行子項輸出外洩到目前宣告中。宣告回覆會在頻道介面卡可用時保留對話串/主題路由。

### 宣告情境

宣告情境會正規化為穩定的內部事件區塊：

| 欄位     | 來源                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| 來源     | `subagent` 或 `cron`                                                                                          |
| 工作階段 ID | 子工作階段鍵/ID                                                                                               |
| 類型     | 宣告類型 + 工作標籤                                                                                           |
| 狀態     | 從執行階段結果衍生（`success`、`error`、`timeout` 或 `unknown`），**不是**從模型文字推斷                 |
| 結果內容 | 最新可見助理文字，否則為經清理的最新工具/toolResult 文字                                                     |
| 後續     | 說明何時回覆與何時保持靜默的指示                                                                               |

終端失敗執行會回報失敗狀態，而不重播擷取到的回覆文字。逾時時，如果子項只完成工具呼叫，宣告可以將該歷程摺疊成簡短的部分進度摘要，而不是重播原始工具輸出。

### 統計列

宣告承載內容會在結尾包含統計列（即使被包裝）：

- 執行時間（例如 `runtime 5m12s`）。
- 權杖用量（輸入/輸出/總計）。
- 當模型價格已設定時的預估成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 與逐字稿路徑，讓主代理可以透過 `sessions_history` 擷取歷史，或檢查磁碟上的檔案。

內部中繼資料僅供協調使用；面向使用者的回覆應以一般助理語氣重寫。

### 為什麼偏好 `sessions_history`

`sessions_history` 是更安全的協調路徑：

- 助理回憶會先正規化：移除 thinking 標籤；移除 `<relevant-memories>` / `<relevant_memories>` 鷹架；移除純文字工具呼叫 XML 承載區塊（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`），包含從未正常關閉的截斷承載；移除降級的工具呼叫/結果鷹架與歷史情境標記；移除外洩的模型控制權杖（`<|assistant|>`、其他 ASCII `<|...|>`、全形 `<｜...｜>`）；移除格式錯誤的 MiniMax 工具呼叫 XML。
- 類似憑證/權杖的文字會被遮蔽。
- 長區塊可以被截斷。
- 非常大型的歷史可以捨棄較舊列，或用 `[sessions_history omitted: message too large]` 取代過大的列。
- 當你需要完整逐位元組逐字稿時，檢查磁碟上的原始逐字稿是備援方式。

## 工具政策

子代理會先使用與父代理或目標代理相同的設定檔與工具政策管線。之後，OpenClaw 會套用子代理限制層。

在沒有具限制性的 `tools.profile` 時，子代理會取得**除了工作階段工具**與系統工具之外的所有工具：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` 在這裡也仍是有界限且經過清理的回溯檢視，不是原始逐字記錄傾印。

當 `maxSpawnDepth >= 2` 時，深度 1 的協調器子代理會額外收到 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，讓它們可以管理自己的子項。

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

`tools.subagents.tools.allow` 是最終的僅允許篩選器。它可以縮小已解析的工具集合，但無法將已被 `tools.profile` 移除的工具**加回來**。例如，`tools.profile: "coding"` 包含 `web_search`/`web_fetch`，但不包含 `browser` 工具。若要讓 coding 設定檔的子代理使用瀏覽器自動化，請在設定檔階段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

當只有單一代理應取得瀏覽器自動化時，請使用個別代理的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 並行

子代理使用專用的處理程序內佇列通道：

- **通道名稱：** `subagent`
- **並行數：** `agents.defaults.subagents.maxConcurrent`（預設 `8`）

## 活性與復原

OpenClaw 不會將缺少 `endedAt` 視為子代理仍然存活的永久證明。超過陳舊執行時間窗口且未結束的執行，在 `/subagents list`、狀態摘要、後代完成閘門，以及每個工作階段的並行檢查中，會停止計入 active/pending。

Gateway 重新啟動後，會剪除陳舊且未結束的已還原執行，除非其子工作階段標記為 `abortedLastRun: true`。這些因重新啟動而中止的子工作階段，仍可透過子代理孤立復原流程復原；該流程會先傳送合成的恢復訊息，再清除中止標記。

自動重新啟動復原會以每個子工作階段為界限。若同一個子代理子項在快速重新卡住窗口內反覆被接受進行孤立復原，OpenClaw 會在該工作階段上保存復原墓碑，並在之後的重新啟動中停止自動恢復它。執行 `openclaw tasks maintenance --apply` 以協調任務記錄，或執行 `openclaw doctor --fix` 以清除已設墓碑工作階段上的陳舊中止復原旗標。

<Note>
如果子代理產生失敗並出現 Gateway `PAIRING_REQUIRED` /
`scope-upgrade`，請先檢查 RPC 呼叫端，再編輯配對狀態。內部 `sessions_spawn` 協調應以 `client.id: "gateway-client"` 搭配 `client.mode: "backend"`，透過直接回送的共享權杖/密碼驗證連線；該路徑不依賴 CLI 的已配對裝置範圍基準。遠端呼叫端、明確的 `deviceIdentity`、明確的裝置權杖路徑，以及瀏覽器/Node 用戶端，仍需要一般裝置核准才能升級範圍。
</Note>

## 停止

- 在請求者聊天中傳送 `/stop` 會中止請求者工作階段，並停止由其產生的任何作用中子代理執行，且會串聯至巢狀子項。
- `/subagents kill <id>` 會停止指定的子代理，並串聯至其子項。

## 限制

- 子代理公告是**盡力而為**。如果 Gateway 重新啟動，待處理的「公告回傳」工作會遺失。
- 子代理仍共用相同的 Gateway 處理程序資源；請將 `maxConcurrent` 視為安全閥。
- `sessions_spawn` 一律為非阻塞：它會立即傳回 `{ status: "accepted", runId, childSessionKey }`。
- 子代理內容只會注入 `AGENTS.md` + `TOOLS.md`（不含 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大巢狀深度為 5（`maxSpawnDepth` 範圍：1–5）。大多數使用情境建議使用深度 2。
- `maxChildrenPerAgent` 會限制每個工作階段的作用中子項數量（預設 `5`，範圍 `1–20`）。

## 相關

- [ACP 代理](/zh-TW/tools/acp-agents)
- [代理傳送](/zh-TW/tools/agent-send)
- [背景任務](/zh-TW/automation/tasks)
- [多代理沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
