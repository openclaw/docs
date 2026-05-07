---
read_when:
    - 你想要透過代理程式執行背景或並行工作
    - 你正在變更 sessions_spawn 或子代理工具政策
    - 您正在實作或疑難排解與討論串繫結的子代理程式工作階段
sidebarTitle: Sub-agents
summary: 啟動隔離的背景代理執行，並將結果回報到請求者的聊天
title: 子代理
x-i18n:
    generated_at: "2026-05-07T01:54:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 901311ae7766640ff6991f66a63070fddef47d79ef5385d2c1af84be34a5140e
    source_path: tools/subagents.md
    workflow: 16
---

子代理是在現有代理執行中產生的背景代理執行。
它們在自己的工作階段（`agent:<agentId>:subagent:<uuid>`）中執行，完成時會將結果**公告**回請求者聊天通道。每個子代理執行都會被追蹤為一個[背景任務](/zh-TW/automation/tasks)。

如需了解委派背後的安全模型，請參閱
[多代理與子代理邊界](/zh-TW/gateway/security#multi-agent-and-sub-agent-boundaries)。
子代理是有用的隔離與工作流程單元，但它們不是一個共用 Gateway 內部用於抵禦敵意多租戶的授權邊界。

主要目標：

- 平行化「研究 / 長任務 / 慢工具」工作，而不阻塞主要執行。
- 預設隔離子代理（工作階段分離 + 選用沙盒）。
- 讓工具介面難以誤用：子代理預設**不會**取得工作階段工具。
- 支援可設定的巢狀深度，以供協調器模式使用。

<Note>
**成本注意事項：** 每個子代理預設都有自己的內容脈絡與權杖用量。對於繁重或重複性的任務，請為子代理設定較便宜的模型，並讓你的主要代理使用品質較高的模型。可透過 `agents.defaults.subagents.model` 或每個代理的覆寫設定進行設定。當子代理確實需要請求者目前的逐字稿時，代理可以在該次產生時請求 `context: "fork"`。執行緒綁定的子代理工作階段預設使用 `context: "fork"`，因為它們會將目前對話分支到後續執行緒中。
</Note>

## 斜線命令

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

`/subagents info` 會顯示執行中繼資料（狀態、時間戳記、工作階段 ID、逐字稿路徑、清理）。使用 `sessions_history` 取得有界限且經安全篩選的回想檢視；當你需要原始完整逐字稿時，請檢查磁碟上的逐字稿路徑。

### 執行緒綁定控制

這些命令適用於支援持續性執行緒綁定的通道。
請參閱下方的[支援執行緒的通道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 產生行為

`/subagents spawn` 會以使用者命令（不是內部轉送）啟動背景子代理，並在執行完成時將一則最終完成更新傳送回請求者聊天。

<AccordionGroup>
  <Accordion title="非阻塞、推送式完成">
    - 產生命令是非阻塞的；它會立即回傳執行 ID。
    - 完成時，子代理會將摘要/結果訊息公告回請求者聊天通道。
    - 完成是推送式的。產生後，**不要**為了等待它完成而在迴圈中輪詢 `/subagents list`、`sessions_list` 或 `sessions_history`；只在需要偵錯或介入時按需檢查狀態。
    - 完成時，OpenClaw 會盡力關閉由該子代理工作階段開啟且已追蹤的瀏覽器分頁/程序，然後才繼續公告清理流程。

  </Accordion>
  <Accordion title="手動產生的傳遞韌性">
    - OpenClaw 會先嘗試使用穩定的冪等性金鑰進行直接 `agent` 傳遞。
    - 如果請求者代理的完成回合失敗、沒有產生可見輸出，或回傳的內容明顯只是已擷取子結果的不完整前綴，OpenClaw 會改用已擷取的子結果進行直接完成傳遞。
    - 如果無法使用直接傳遞，則會退回到佇列路由。
    - 如果佇列路由仍不可用，公告會以短暫的指數退避重試，然後才最終放棄。
    - 完成傳遞會保留已解析的請求者路由：可用時，執行緒綁定或對話綁定的完成路由會優先；如果完成來源只提供通道，OpenClaw 會從請求者工作階段已解析的路由（`lastChannel` / `lastTo` / `lastAccountId`）補上缺少的目標/帳號，讓直接傳遞仍可運作。

  </Accordion>
  <Accordion title="完成交接中繼資料">
    交接給請求者工作階段的完成內容是執行階段產生的內部內容脈絡（不是使用者撰寫的文字），並包含：

    - `Result` — 最新可見的 `assistant` 回覆文字，否則為已清理的最新工具/toolResult 文字。終止失敗的執行不會重用已擷取的回覆文字。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - 精簡的執行階段/權杖統計資料。
    - 一則傳遞指示，要求請求者代理以一般助理語氣改寫（不要轉送原始內部中繼資料）。

  </Accordion>
  <Accordion title="模式與 ACP 執行階段">
    - `--model` 和 `--thinking` 會覆寫該特定執行的預設值。
    - 使用 `info`/`log` 在完成後檢查詳細資料與輸出。
    - `/subagents spawn` 是一次性模式（`mode: "run"`）。若要使用持續性的執行緒綁定工作階段，請搭配 `thread: true` 和 `mode: "session"` 使用 `sessions_spawn`。
    - 對於 ACP 控制器工作階段（Claude Code、Gemini CLI、OpenCode，或明確的 Codex ACP/acpx），當工具宣告該執行階段時，請搭配 `runtime: "acp"` 使用 `sessions_spawn`。偵錯完成或代理對代理迴圈時，請參閱 [ACP 傳遞模型](/zh-TW/tools/acp-agents#delivery-model)。當 `codex` Plugin 啟用時，Codex 聊天/執行緒控制應優先使用 `/codex ...`，而不是 ACP，除非使用者明確要求 ACP/acpx。
    - OpenClaw 會隱藏 `runtime: "acp"`，直到 ACP 已啟用、請求者未被沙盒化，且已載入像 `acpx` 這類後端 Plugin。`runtime: "acp"` 需要外部 ACP 控制器 ID，或 `agents.list[]` 中具有 `runtime.type="acp"` 的項目；一般 OpenClaw 設定代理若來自 `agents_list`，請使用預設子代理執行階段。

  </Accordion>
</AccordionGroup>

## 內容脈絡模式

原生子代理會以隔離狀態啟動，除非呼叫者明確要求分支目前逐字稿。

| 模式       | 使用時機                                                                                                                         | 行為                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、獨立實作、慢工具工作，或任何可在任務文字中簡述的事項                           | 建立乾淨的子逐字稿。這是預設值，並可降低權杖用量。  |
| `fork`     | 取決於目前對話、先前工具結果，或請求者逐字稿中既有細緻指示的工作 | 在子代理啟動前，將請求者逐字稿分支到子工作階段。 |

請謹慎使用 `fork`。它是用於需要內容脈絡的委派，不是撰寫清楚任務提示的替代品。

## 工具：`sessions_spawn`

在全域 `subagent` 通道上以 `deliver: false` 啟動子代理執行，接著執行公告步驟，並將公告回覆張貼到請求者聊天通道。

可用性取決於呼叫者的有效工具政策。`coding` 和 `full` 設定檔預設公開 `sessions_spawn`。`messaging` 設定檔不公開；請新增 `tools.alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"]`，或對應該委派工作的代理使用 `tools.profile: "coding"`。通道/群組、提供者、沙盒，以及每個代理的允許/拒絕政策，在設定檔階段之後仍可移除該工具。請從相同工作階段使用 `/tools` 來確認有效工具清單。

**預設值：**

- **模型：** 繼承呼叫者，除非你設定 `agents.defaults.subagents.model`（或每個代理的 `agents.list[].subagents.model`）；明確的 `sessions_spawn.model` 仍會優先。
- **思考：** 繼承呼叫者，除非你設定 `agents.defaults.subagents.thinking`（或每個代理的 `agents.list[].subagents.thinking`）；明確的 `sessions_spawn.thinking` 仍會優先。
- **執行逾時：** 如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 會在已設定時使用 `agents.defaults.subagents.runTimeoutSeconds`；否則會退回到 `0`（無逾時）。

### 工具參數

<ParamField path="task" type="string" required>
  子代理的任務描述。
</ParamField>
<ParamField path="label" type="string">
  選用的人類可讀標籤。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允許時，在另一個代理 ID 底下產生。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 僅適用於外部 ACP 控制器（`claude`、`droid`、`gemini`、`opencode`，或明確要求的 Codex ACP/acpx），以及 `agents.list[]` 中 `runtime.type` 為 `acp` 的項目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  僅限 ACP。當 `runtime: "acp"` 時繼續既有 ACP 控制器工作階段；對原生子代理產生會被忽略。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  僅限 ACP。當 `runtime: "acp"` 時，將 ACP 執行輸出串流到父工作階段；原生子代理產生請省略。
</ParamField>
<ParamField path="model" type="string">
  覆寫子代理模型。無效值會被略過，且子代理會使用預設模型執行，並在工具結果中顯示警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆寫子代理執行的思考層級。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  已設定時預設為 `agents.defaults.subagents.runTimeoutSeconds`，否則為 `0`。設定後，子代理執行會在 N 秒後中止。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  當為 `true` 時，為此子代理工作階段請求通道執行緒綁定。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，預設會變成 `session`。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 會在公告後立即封存（仍會透過重新命名保留逐字稿）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` 會拒絕產生，除非目標子執行階段已沙盒化。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 會將請求者目前逐字稿分支到子工作階段。僅限原生子代理。執行緒綁定的產生預設為 `fork`；非執行緒產生預設為 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受通道傳遞參數（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）。若要傳遞，請從已產生的執行使用 `message`/`sessions_send`。
</Warning>

## 執行緒綁定工作階段

當某個通道啟用執行緒綁定時，子代理可以持續綁定到某個執行緒，讓該執行緒中的後續使用者訊息繼續路由到相同子代理工作階段。

### 支援執行緒的通道

**Discord** 目前是唯一支援的通道。它支援持續性的執行緒綁定子代理工作階段（搭配 `thread: true` 的 `sessions_spawn`）、手動執行緒控制（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`），以及介面卡金鑰 `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours` 和 `channels.discord.threadBindings.spawnSessions`。

### 快速流程

<Steps>
  <Step title="產生">
    使用 `sessions_spawn`，並設定 `thread: true`（也可選擇設定 `mode: "session"`）。
  </Step>
  <Step title="繫結">
    OpenClaw 會在目前作用中的通道中，為該 session 目標建立或繫結一個討論串。
  </Step>
  <Step title="路由後續訊息">
    該討論串中的回覆與後續訊息會路由到已繫結的 session。
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
| `/focus <target>`  | 將目前討論串（或建立一個討論串）繫結到子代理/session 目標            |
| `/unfocus`         | 移除目前已繫結討論串的繫結                                           |
| `/agents`          | 列出作用中的執行與繫結狀態（`thread:<id>` 或 `unbound`）              |
| `/session idle`    | 檢查/更新閒置自動取消聚焦（僅限已聚焦的繫結討論串）                  |
| `/session max-age` | 檢查/更新硬性上限（僅限已聚焦的繫結討論串）                          |

### 設定開關

- **全域預設值：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **通道覆寫與產生時自動繫結鍵** 依配接器而定。請參閱上方的[支援討論串的通道](#thread-supporting-channels)。

請參閱[設定參考](/zh-TW/gateway/configuration-reference)與
[Slash 指令](/zh-TW/tools/slash-commands)，以取得目前的配接器詳細資訊。

### 允許清單

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可透過明確 `agentId` 指定的代理 id 清單（`["*"]` 允許任何項目）。預設值：僅限請求者代理。如果你設定了清單，且仍希望請求者可使用 `agentId` 產生自身，請將請求者 id 納入清單。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  當請求者代理未設定自己的 `subagents.allowAgents` 時使用的預設目標代理允許清單。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選擇設定檔）。個別代理覆寫：`agents.list[].subagents.requireAgentId`。
</ParamField>

如果請求者 session 受沙箱限制，`sessions_spawn` 會拒絕
將在非沙箱環境中執行的目標。

### 探索

使用 `agents_list` 查看目前允許用於
`sessions_spawn` 的代理 id。回應包含每個列出代理的有效
模型與嵌入式執行階段中繼資料，因此呼叫者可以區分 PI、Codex
app-server，以及其他已設定的原生執行階段。

### 自動封存

- 子代理 session 會在 `agents.defaults.subagents.archiveAfterMinutes` 後自動封存（預設 `60`）。
- 封存會使用 `sessions.delete`，並將轉錄重新命名為 `*.deleted.<timestamp>`（相同資料夾）。
- `cleanup: "delete"` 會在公告後立即封存（仍會透過重新命名保留轉錄）。
- 自動封存採盡力而為；如果 gateway 重新啟動，待處理的計時器會遺失。
- `runTimeoutSeconds` **不會** 自動封存；它只會停止執行。session 會保留到自動封存為止。
- 自動封存同樣適用於深度 1 與深度 2 的 session。
- 瀏覽器清理與封存清理是分開的：被追蹤的瀏覽器分頁/程序會在執行完成時盡力關閉，即使轉錄/session 記錄仍保留。

## 巢狀子代理

預設情況下，子代理無法產生自己的子代理
（`maxSpawnDepth: 1`）。設定 `maxSpawnDepth: 2` 可啟用一層
巢狀結構，也就是**協調器模式**：主代理 → 協調器子代理 →
工作子代理的子代理。

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

| 深度 | Session 鍵形狀                                | 角色                                          | 可以產生嗎？                 |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主代理                                        | 一律可以                     |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子代理（允許深度 2 時為協調器）              | 僅在 `maxSpawnDepth >= 2` 時 |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子代理的子代理（葉節點工作者）               | 永遠不可以                   |

### 公告鏈

結果會沿鏈往上回傳：

1. 深度 2 工作者完成 → 公告給其父層（深度 1 協調器）。
2. 深度 1 協調器收到公告、綜整結果、完成 → 公告給主代理。
3. 主代理收到公告並傳遞給使用者。

每一層只會看到其直接子層的公告。

<Note>
**操作指引：**啟動子工作一次，然後等待完成
事件，而不是圍繞 `sessions_list`、
`sessions_history`、`/subagents list` 或 `exec` sleep 指令建立輪詢迴圈。
`sessions_list` 與 `/subagents list` 會讓子 session 關係
聚焦於即時工作：即時子層會保持附加，已結束的子層會在短暫的近期視窗中保持
可見，而過舊的僅儲存子層連結會在其新鮮度視窗後被
忽略。這可防止舊的 `spawnedBy` /
`parentSessionKey` 中繼資料在重新啟動後復活幽靈子層。
如果子層完成事件在你已傳送
最終答案後才抵達，正確的後續回覆是精確的靜默 token
`NO_REPLY` / `no_reply`。
</Note>

### 依深度區分的工具政策

- 角色與控制範圍會在產生時寫入 session 中繼資料。這可避免扁平或還原的 session 鍵意外重新取得協調器權限。
- **深度 1（協調器，當 `maxSpawnDepth >= 2` 時）：** 取得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子層。其他 session/系統工具仍會被拒絕。
- **深度 1（葉節點，當 `maxSpawnDepth == 1` 時）：** 沒有 session 工具（目前預設行為）。
- **深度 2（葉節點工作者）：** 沒有 session 工具，`sessions_spawn` 在深度 2 一律會被拒絕。無法再產生更多子層。

### 每個代理的產生限制

每個代理 session（任何深度）同時最多可有 `maxChildrenPerAgent`
（預設 `5`）個作用中的子層。這可防止單一協調器失控展開。

### 串聯停止

停止深度 1 協調器會自動停止其所有深度 2
子層：

- 主聊天中的 `/stop` 會停止所有深度 1 代理，並串聯停止其深度 2 子層。
- `/subagents kill <id>` 會停止特定子代理，並串聯停止其子層。
- `/subagents kill all` 會停止請求者的所有子代理，並串聯停止。

## 驗證

子代理驗證會依**代理 id**解析，而不是依 session 類型解析：

- 子代理 session 鍵是 `agent:<agentId>:subagent:<uuid>`。
- 驗證儲存會從該代理的 `agentDir` 載入。
- 主代理的驗證設定檔會合併為**備援**；發生衝突時，代理設定檔會覆寫主設定檔。

此合併為加成式，因此主設定檔一律可作為
備援使用。目前尚不支援每個代理完全隔離的驗證。

## 公告

子代理會透過公告步驟回報：

- 公告步驟在子代理 session 內執行（不是請求者 session）。
- 如果子代理精確回覆 `ANNOUNCE_SKIP`，不會發布任何內容。
- 如果最新的助理文字是精確的靜默 token `NO_REPLY` / `no_reply`，即使先前已有可見進度，也會抑制公告輸出。

傳遞取決於請求者深度：

- 最上層請求者 session 使用帶有外部傳遞的後續 `agent` 呼叫（`deliver=true`）。
- 巢狀請求者子代理 session 會收到內部後續注入（`deliver=false`），讓協調器能在 session 內綜整子層結果。
- 如果巢狀請求者子代理 session 已不存在，OpenClaw 會在可用時退回到該 session 的請求者。

對最上層請求者 session，completion 模式的直接傳遞會先
解析任何已繫結的對話/討論串路由與 hook 覆寫，然後從
請求者 session 儲存的路由填補缺少的通道目標欄位。
這會確保 completion 位於正確的聊天/主題，即使 completion
來源只識別通道。

建立巢狀 completion 發現項目時，子層 completion 彙總會限定於目前請求者執行，
避免過舊的先前執行子層
輸出洩漏到目前公告中。當通道配接器可用時，公告回覆會保留
討論串/主題路由。

### 公告脈絡

公告脈絡會正規化為穩定的內部事件區塊：

| 欄位           | 來源                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| 來源           | `subagent` 或 `cron`                                                                                          |
| Session ids    | 子 session 鍵/id                                                                                              |
| 類型           | 公告類型 + 工作標籤                                                                                           |
| 狀態           | 從執行階段結果衍生（`success`、`error`、`timeout` 或 `unknown`）— **不是** 從模型文字推斷 |
| 結果內容       | 最新可見助理文字，否則為已清理的最新工具/toolResult 文字                                                      |
| 後續           | 說明何時回覆與何時保持靜默的指示                                                                              |

終端失敗的執行會報告失敗狀態，而不會重播擷取到的
回覆文字。逾時時，如果子層只進行到工具呼叫，公告
可以將該歷史壓縮成簡短的部分進度摘要，而不是
重播原始工具輸出。

### 統計列

公告 payload 會在末尾包含統計列（即使被換行包覆）：

- 執行時間（例如 `runtime 5m12s`）。
- Token 使用量（輸入/輸出/總計）。
- 設定模型價格時的預估成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 與轉錄路徑，讓主代理可以透過 `sessions_history` 擷取歷史，或檢查磁碟上的檔案。

內部中繼資料僅供協調使用；面向使用者的回覆
應以一般助理語氣重寫。

### 為何偏好 `sessions_history`

`sessions_history` 是較安全的協調路徑：

- 助理回想會先正規化：移除 thinking 標籤；移除 `<relevant-memories>` / `<relevant_memories>` 骨架；移除純文字工具呼叫 XML payload 區塊（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`），包含從未乾淨關閉的截斷 payload；移除降級的工具呼叫/結果骨架與歷史脈絡標記；移除洩漏的模型控制 token（`<|assistant|>`、其他 ASCII `<|...|>`、全形 `<｜...｜>`）；移除格式錯誤的 MiniMax 工具呼叫 XML。
- 類似憑證/token 的文字會被遮蔽。
- 長區塊可能會被截斷。
- 非常大的歷史可丟棄較舊的列，或以 `[sessions_history omitted: message too large]` 取代過大的列。
- 當你需要完整逐位元組轉錄時，原始磁碟上轉錄檢查是備援方案。

## 工具政策

子代理會先使用與父代理或目標代理相同的設定檔與工具政策管線。之後，OpenClaw 會套用子代理限制層。

若沒有具限制性的 `tools.profile`，子代理會取得**除工作階段工具**與系統工具之外的所有工具：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` 在這裡也仍然是有界且經過淨化的回憶檢視，而不是原始逐字稿傾印。

當 `maxSpawnDepth >= 2` 時，第 1 層深度的協調器子代理還會額外收到 `sessions_spawn`、`subagents`、`sessions_list` 與 `sessions_history`，讓它們可以管理自己的子項。

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

`tools.subagents.tools.allow` 是最終的僅允許篩選器。它可以縮小已解析的工具集合，但無法**加回**已被 `tools.profile` 移除的工具。例如，`tools.profile: "coding"` 包含 `web_search`/`web_fetch`，但不包含 `browser` 工具。若要讓 coding 設定檔的子代理使用瀏覽器自動化，請在設定檔階段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

當只有一個代理需要取得瀏覽器自動化時，請使用每代理的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 並行

子代理使用專用的進程內佇列通道：

- **通道名稱：** `subagent`
- **並行度：** `agents.defaults.subagents.maxConcurrent`（預設 `8`）

## 存活性與復原

OpenClaw 不會把缺少 `endedAt` 視為子代理仍然存活的永久證據。超過過期執行時間窗且尚未結束的執行，在 `/subagents list`、狀態摘要、後代完成閘控，以及每工作階段並行檢查中，會停止計為作用中/待處理。

Gateway 重新啟動後，過期且尚未結束的已還原執行會被修剪，除非其子工作階段標記為 `abortedLastRun: true`。這些因重新啟動而中止的子工作階段，仍可透過子代理孤兒復原流程復原；該流程會在清除中止標記前傳送合成的恢復訊息。

自動重新啟動復原會以每個子工作階段為界限。若同一個子代理子項在快速重新卡住時間窗內反覆被接受進行孤兒復原，OpenClaw 會在該工作階段持久化復原墓碑，並在後續重新啟動時停止自動恢復它。執行 `openclaw tasks maintenance --apply` 以協調任務記錄，或執行 `openclaw doctor --fix` 以清除已設墓碑工作階段上的過期中止復原旗標。

<Note>
如果子代理產生因 Gateway `PAIRING_REQUIRED` / `scope-upgrade` 而失敗，請在編輯配對狀態前檢查 RPC 呼叫端。內部 `sessions_spawn` 協調應以 `client.id: "gateway-client"` 與 `client.mode: "backend"`，透過直接 loopback 共享權杖/密碼驗證連線；該路徑不依賴 CLI 的已配對裝置範圍基準。遠端呼叫端、明確的 `deviceIdentity`、明確的裝置權杖路徑，以及瀏覽器/Node 用戶端，仍需要一般裝置核准才能進行範圍升級。
</Note>

## 停止

- 在請求者聊天中傳送 `/stop` 會中止請求者工作階段，並停止由它產生的任何作用中子代理執行，且會串連到巢狀子項。
- `/subagents kill <id>` 會停止特定子代理，並串連到其子項。

## 限制

- 子代理公告是**盡力而為**。如果 Gateway 重新啟動，待處理的「回報公告」工作會遺失。
- 子代理仍共享相同的 Gateway 進程資源；請將 `maxConcurrent` 視為安全閥。
- `sessions_spawn` 一律為非阻塞：它會立即傳回 `{ status: "accepted", runId, childSessionKey }`。
- 子代理內容只會注入 `AGENTS.md` + `TOOLS.md`（沒有 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大巢狀深度為 5（`maxSpawnDepth` 範圍：1–5）。大多數使用情境建議使用深度 2。
- `maxChildrenPerAgent` 會限制每個工作階段的作用中子項數量（預設 `5`，範圍 `1–20`）。

## 相關

- [ACP 代理](/zh-TW/tools/acp-agents)
- [代理傳送](/zh-TW/tools/agent-send)
- [背景任務](/zh-TW/automation/tasks)
- [多代理沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
