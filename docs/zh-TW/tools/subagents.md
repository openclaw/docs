---
read_when:
    - 你想透過代理程式進行背景或平行工作
    - 你正在變更 sessions_spawn 或子代理工具政策
    - 您正在實作或疑難排解綁定執行緒的子代理工作階段
sidebarTitle: Sub-agents
summary: 啟動隔離的背景代理執行，並將結果回報至請求者的聊天對話
title: 子代理
x-i18n:
    generated_at: "2026-05-04T02:46:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0df39e06b952def3eb0b296f36c7dc8c0b0a115785d865236a970c5d453fc37
    source_path: tools/subagents.md
    workflow: 16
---

子代理是在既有代理執行中生成的背景代理執行。
它們會在自己的工作階段（`agent:<agentId>:subagent:<uuid>`）中執行，
並在完成後將結果**公告**回請求者聊天
頻道。每次子代理執行都會作為
[背景任務](/zh-TW/automation/tasks)追蹤。

主要目標：

- 平行處理「研究／長任務／慢速工具」工作，而不阻塞主要執行。
- 預設讓子代理保持隔離（工作階段分離 + 選用沙箱）。
- 讓工具介面難以被誤用：子代理預設**不會**取得工作階段工具。
- 支援可設定的巢狀深度，以配合協調器模式。

<Note>
**成本注意事項：**每個子代理預設都有自己的上下文與權杖用量。對於繁重或重複性任務，請為子代理設定較便宜的模型，並讓主要代理使用較高品質的模型。可透過 `agents.defaults.subagents.model` 或個別代理覆寫設定。當子執行確實需要請求者目前的對話紀錄時，代理可以在該次生成時要求 `context: "fork"`。執行緒綁定的子代理工作階段預設為 `context: "fork"`，因為它們會把目前對話分支到後續執行緒。
</Note>

## 斜線命令

使用 `/subagents` 檢查或控制**目前
工作階段**的子代理執行：

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

`/subagents info` 會顯示執行中繼資料（狀態、時間戳記、工作階段 ID、
對話紀錄路徑、清理）。使用 `sessions_history` 取得有界且經安全篩選的回想檢視；當你需要原始完整對話紀錄時，請檢查磁碟上的對話紀錄路徑。

### 執行緒綁定控制

這些命令可用於支援持久執行緒綁定的頻道。
請參閱下方的[支援執行緒的頻道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 生成行為

`/subagents spawn` 會以使用者命令（而非內部轉送）啟動一個背景子代理，並在執行完成時將一則最終完成更新送回
請求者聊天。

<AccordionGroup>
  <Accordion title="非阻塞、推送式完成">
    - 生成命令是非阻塞的；它會立即傳回執行 ID。
    - 完成時，子代理會將摘要／結果訊息公告回請求者聊天頻道。
    - 完成是推送式的。一旦生成後，請**不要**為了等待它完成而循環輪詢 `/subagents list`、`sessions_list` 或 `sessions_history`；只在除錯或介入時按需檢查狀態。
    - 完成時，OpenClaw 會盡最大努力在公告清理流程繼續前，關閉該子代理工作階段開啟且已追蹤的瀏覽器分頁／程序。

  </Accordion>
  <Accordion title="手動生成交付韌性">
    - OpenClaw 會先嘗試使用穩定的冪等性鍵進行直接 `agent` 交付。
    - 如果直接交付失敗，會退回佇列路由。
    - 如果佇列路由仍不可用，公告會以短暫的指數退避重試，然後才最終放棄。
    - 完成交付會保留已解析的請求者路由：可用時，執行緒綁定或對話綁定的完成路由優先；如果完成來源只提供頻道，OpenClaw 會從請求者工作階段已解析的路由（`lastChannel` / `lastTo` / `lastAccountId`）補齊遺失的目標／帳戶，讓直接交付仍可運作。

  </Accordion>
  <Accordion title="完成交接中繼資料">
    給請求者工作階段的完成交接是執行階段產生的內部上下文（不是使用者撰寫文字），並包含：

    - `Result` — 最新可見的 `assistant` 回覆文字；否則為經清理的最新工具／toolResult 文字。終止且失敗的執行不會重用已擷取的回覆文字。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - 精簡的執行階段／權杖統計。
    - 一則交付指示，要求請求者代理以一般助理語氣重寫（不要轉發原始內部中繼資料）。

  </Accordion>
  <Accordion title="模式與 ACP 執行階段">
    - `--model` 和 `--thinking` 會覆寫該特定執行的預設值。
    - 使用 `info`/`log` 在完成後檢查詳細資料與輸出。
    - `/subagents spawn` 是一次性模式（`mode: "run"`）。若要使用持久執行緒綁定工作階段，請搭配 `thread: true` 和 `mode: "session"` 使用 `sessions_spawn`。
    - 對於 ACP 控制器工作階段（Claude Code、Gemini CLI、OpenCode，或明確的 Codex ACP/acpx），當工具宣告該執行階段時，請搭配 `runtime: "acp"` 使用 `sessions_spawn`。除錯完成或代理對代理迴圈時，請參閱 [ACP 交付模型](/zh-TW/tools/acp-agents#delivery-model)。啟用 `codex` Plugin 時，除非使用者明確要求 ACP/acpx，否則 Codex 聊天／執行緒控制應偏好 `/codex ...` 而非 ACP。
    - OpenClaw 會隱藏 `runtime: "acp"`，直到 ACP 已啟用、請求者未被沙箱化，且已載入例如 `acpx` 的後端 Plugin。`runtime: "acp"` 預期使用外部 ACP 控制器 ID，或具有 `runtime.type="acp"` 的 `agents.list[]` 項目；一般 OpenClaw 設定代理從 `agents_list` 使用預設子代理執行階段。

  </Accordion>
</AccordionGroup>

## 上下文模式

原生子代理會以隔離方式啟動，除非呼叫端明確要求分支目前的對話紀錄。

| 模式       | 使用時機                                                                                                                         | 行為                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、獨立實作、慢速工具工作，或任何可在任務文字中簡報的事項                           | 建立乾淨的子對話紀錄。這是預設值，並可降低權杖使用量。  |
| `fork`     | 依賴目前對話、先前工具結果，或請求者對話紀錄中已存在的細緻指示的工作 | 在子執行開始前，將請求者對話紀錄分支到子工作階段。 |

請節制使用 `fork`。它是為了上下文敏感的委派，不是撰寫清楚任務提示的替代品。

## 工具：`sessions_spawn`

在全域 `subagent` 通道上以 `deliver: false` 啟動子代理執行，
然後執行公告步驟，並將公告回覆發布到請求者
聊天頻道。

可用性取決於呼叫端的有效工具政策。`coding` 和
`full` 設定檔預設會公開 `sessions_spawn`。`messaging` 設定檔
不會；請加入 `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]`，或對應該委派工作的代理使用 `tools.profile: "coding"`。
頻道／群組、提供者、沙箱，以及個別代理的允許／拒絕政策，
仍可在設定檔階段後移除該工具。請在相同工作階段使用 `/tools`
確認有效工具清單。

**預設值：**

- **模型：**除非你設定 `agents.defaults.subagents.model`（或個別代理的 `agents.list[].subagents.model`），否則會繼承呼叫端；明確的 `sessions_spawn.model` 仍會優先。
- **Thinking：**除非你設定 `agents.defaults.subagents.thinking`（或個別代理的 `agents.list[].subagents.thinking`），否則會繼承呼叫端；明確的 `sessions_spawn.thinking` 仍會優先。
- **執行逾時：**如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 會在已設定時使用 `agents.defaults.subagents.runTimeoutSeconds`；否則退回 `0`（無逾時）。

### 工具參數

<ParamField path="task" type="string" required>
  子代理的任務描述。
</ParamField>
<ParamField path="label" type="string">
  選用的人類可讀標籤。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允許時，於另一個代理 ID 之下生成。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 僅用於外部 ACP 控制器（`claude`、`droid`、`gemini`、`opencode`，或明確要求的 Codex ACP/acpx），以及其 `runtime.type` 為 `acp` 的 `agents.list[]` 項目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  僅限 ACP。當 `runtime: "acp"` 時，繼續既有 ACP 控制器工作階段；原生子代理生成會忽略此參數。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  僅限 ACP。當 `runtime: "acp"` 時，將 ACP 執行輸出串流到父工作階段；原生子代理生成請省略。
</ParamField>
<ParamField path="model" type="string">
  覆寫子代理模型。無效值會被略過，子代理會在預設模型上執行，並在工具結果中顯示警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆寫子代理執行的 thinking 等級。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  已設定時預設為 `agents.defaults.subagents.runTimeoutSeconds`，否則為 `0`。設定後，子代理執行會在 N 秒後中止。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  當為 `true` 時，會為此子代理工作階段要求頻道執行緒綁定。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，預設會變成 `session`。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 會在公告後立即封存（仍會透過重新命名保留對話紀錄）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` 會拒絕生成，除非目標子執行階段已沙箱化。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 會將請求者目前的對話紀錄分支到子工作階段。僅限原生子代理。執行緒綁定生成預設為 `fork`；非執行緒生成預設為 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受頻道交付參數（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）。若要交付，請從生成的執行使用
`message`/`sessions_send`。
</Warning>

## 執行緒綁定工作階段

當頻道啟用執行緒綁定時，子代理可以保持綁定到
某個執行緒，讓該執行緒中的後續使用者訊息持續路由到
同一個子代理工作階段。

### 支援執行緒的頻道

**Discord** 目前是唯一支援的頻道。它支援
持久執行緒綁定的子代理工作階段（搭配
`thread: true` 的 `sessions_spawn`）、手動執行緒控制（`/focus`、`/unfocus`、`/agents`、
`/session idle`、`/session max-age`），以及配接器鍵
`channels.discord.threadBindings.enabled`、
`channels.discord.threadBindings.idleHours`、
`channels.discord.threadBindings.maxAgeHours` 和
`channels.discord.threadBindings.spawnSessions`。

### 快速流程

<Steps>
  <Step title="生成">
    搭配 `thread: true`（並可選擇搭配 `mode: "session"`）使用 `sessions_spawn`。
  </Step>
  <Step title="綁定">
    OpenClaw 會在作用中頻道中建立或綁定一個執行緒到該工作階段目標。
  </Step>
  <Step title="路由後續訊息">
    該執行緒中的回覆與後續訊息會路由到已綁定的工作階段。
  </Step>
  <Step title="檢查逾時">
    使用 `/session idle` 檢查／更新非作用狀態自動取消聚焦，並使用
    `/session max-age` 控制硬性上限。
  </Step>
  <Step title="解除附加">
    使用 `/unfocus` 手動解除附加。
  </Step>
</Steps>

### 手動控制

| 指令               | 效果                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 將目前執行緒（或建立一個）繫結至子代理/工作階段目標                  |
| `/unfocus`         | 移除目前已繫結執行緒的繫結                                            |
| `/agents`          | 列出作用中的執行與繫結狀態（`thread:<id>` 或 `unbound`）              |
| `/session idle`    | 檢查/更新閒置自動解除聚焦（僅限已聚焦的已繫結執行緒）                |
| `/session max-age` | 檢查/更新硬性上限（僅限已聚焦的已繫結執行緒）                        |

### 設定開關

- **全域預設值：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **頻道覆寫與產生時自動繫結鍵** 視配接器而定。請參閱上方的[支援執行緒的頻道](#thread-supporting-channels)。

請參閱[設定參考](/zh-TW/gateway/configuration-reference)和
[斜線指令](/zh-TW/tools/slash-commands)，以取得目前的配接器詳細資料。

### 允許清單

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可透過明確 `agentId` 指定為目標的代理 ID 清單（`["*"]` 允許任何代理）。預設值：僅限請求端代理。如果你設定清單，且仍希望請求端能使用 `agentId` 產生自身，請在清單中加入請求端 ID。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  當請求端代理未設定自己的 `subagents.allowAgents` 時使用的預設目標代理允許清單。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選擇設定檔）。單一代理覆寫：`agents.list[].subagents.requireAgentId`。
</ParamField>

如果請求端工作階段在沙箱中執行，`sessions_spawn` 會拒絕
將在非沙箱中執行的目標。

### 探索

使用 `agents_list` 查看目前允許 `sessions_spawn` 的代理 ID。
回應會包含每個列出代理的有效模型與嵌入式執行階段中繼資料，
讓呼叫端能區分 Pi、Codex 應用程式伺服器，以及其他已設定的原生執行階段。

### 自動封存

- 子代理工作階段會在 `agents.defaults.subagents.archiveAfterMinutes` 後自動封存（預設為 `60`）。
- 封存會使用 `sessions.delete`，並將記錄重新命名為 `*.deleted.<timestamp>`（同一資料夾）。
- `cleanup: "delete"` 會在回報後立即封存（仍會透過重新命名保留記錄）。
- 自動封存是盡力而為；如果 gateway 重新啟動，待處理的計時器會遺失。
- `runTimeoutSeconds` **不會**自動封存；它只會停止執行。工作階段會保留到自動封存為止。
- 自動封存同樣適用於深度 1 和深度 2 工作階段。
- 瀏覽器清理與封存清理是分開的：追蹤中的瀏覽器分頁/程序會在執行完成時盡力關閉，即使記錄/工作階段紀錄被保留也一樣。

## 巢狀子代理

預設情況下，子代理無法產生自己的子代理
（`maxSpawnDepth: 1`）。設定 `maxSpawnDepth: 2` 可啟用一層巢狀
結構，即**協調器模式**：主代理 → 協調器子代理 →
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

| 深度 | 工作階段鍵形狀                               | 角色                                          | 可以產生嗎？                 |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主代理                                        | 一律可以                     |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子代理（允許深度 2 時為協調器）              | 僅當 `maxSpawnDepth >= 2`    |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子代理的子代理（葉節點工作代理）             | 永不                         |

### 回報鏈

結果會沿著鏈向上流動：

1. 深度 2 工作代理完成 → 回報給其父層（深度 1 協調器）。
2. 深度 1 協調器收到回報、整合結果、完成 → 回報給主代理。
3. 主代理收到回報並傳遞給使用者。

每一層只會看到來自其直接子層的回報。

<Note>
**操作指南：**啟動子層工作一次，然後等待完成事件，
而不是圍繞 `sessions_list`、`sessions_history`、`/subagents list`
或 `exec` 睡眠指令建立輪詢迴圈。
`sessions_list` 和 `/subagents list` 會讓子工作階段關係
聚焦於即時工作：即時子工作階段會保持附加，已結束的子工作階段會在短暫的近期視窗中保持可見，
而過時的僅儲存子連結會在其新鮮度視窗後被忽略。這能避免舊的 `spawnedBy` /
`parentSessionKey` 中繼資料在重新啟動後復活幽靈子層。
如果子層完成事件在你已送出最終答案後才抵達，正確的後續回應是完全靜默權杖
`NO_REPLY` / `no_reply`。
</Note>

### 依深度的工具政策

- 角色與控制範圍會在產生時寫入工作階段中繼資料。這可避免扁平或已還原的工作階段鍵意外重新取得協調器權限。
- **深度 1（協調器，當 `maxSpawnDepth >= 2` 時）：**取得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，因此可以管理其子層。其他工作階段/系統工具仍會被拒絕。
- **深度 1（葉節點，當 `maxSpawnDepth == 1` 時）：**沒有工作階段工具（目前預設行為）。
- **深度 2（葉節點工作代理）：**沒有工作階段工具，`sessions_spawn` 在深度 2 一律被拒絕。不能再產生更多子層。

### 單一代理產生限制

每個代理工作階段（任何深度）同一時間最多可有 `maxChildrenPerAgent`
（預設 `5`）個作用中子層。這可避免單一協調器造成失控的扇出。

### 串聯停止

停止深度 1 協調器會自動停止其所有深度 2
子層：

- 主聊天中的 `/stop` 會停止所有深度 1 代理，並串聯停止其深度 2 子層。
- `/subagents kill <id>` 會停止特定子代理，並串聯停止其子層。
- `/subagents kill all` 會停止請求端的所有子代理並串聯停止。

## 驗證

子代理驗證會依**代理 ID**解析，而不是依工作階段類型：

- 子代理工作階段鍵為 `agent:<agentId>:subagent:<uuid>`。
- 驗證儲存會從該代理的 `agentDir` 載入。
- 主代理的驗證設定檔會作為**備援**合併；發生衝突時，代理設定檔會覆寫主設定檔。

合併是加成式的，因此主設定檔永遠可作為備援使用。
尚未支援每個代理完全隔離的驗證。

## 回報

子代理會透過回報步驟回傳：

- 回報步驟在子代理工作階段內執行（不是請求端工作階段）。
- 如果子代理精確回覆 `ANNOUNCE_SKIP`，就不會發布任何內容。
- 如果最新的助理文字是完全靜默權杖 `NO_REPLY` / `no_reply`，即使先前已有可見進度，回報輸出也會被抑制。

傳遞方式取決於請求端深度：

- 最上層請求端工作階段會使用帶外部傳遞的後續 `agent` 呼叫（`deliver=true`）。
- 巢狀請求端子代理工作階段會收到內部後續注入（`deliver=false`），讓協調器能在工作階段內整合子層結果。
- 如果巢狀請求端子代理工作階段已不存在，OpenClaw 會在可用時退回使用該工作階段的請求端。

對最上層請求端工作階段而言，完成模式的直接傳遞會先
解析任何已繫結的對話/執行緒路由和 hook 覆寫，然後從
請求端工作階段儲存的路由補齊缺少的頻道目標欄位。
這能讓完成訊息停留在正確的聊天/主題中，即使完成來源
只識別頻道也是如此。

建立巢狀完成發現時，子層完成彙總會限定於目前請求端執行，
避免過時的先前執行子層輸出洩漏到目前回報中。當頻道配接器
提供執行緒/主題路由時，回報回覆會保留該路由。

### 回報內容

回報內容會正規化為穩定的內部事件區塊：

| 欄位       | 來源                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| 來源       | `subagent` 或 `cron`                                                                                          |
| 工作階段 ID | 子工作階段鍵/ID                                                                                               |
| 類型       | 回報類型 + 工作標籤                                                                                           |
| 狀態       | 從執行階段結果衍生（`success`、`error`、`timeout` 或 `unknown`），**不是**從模型文字推斷 |
| 結果內容   | 最新可見助理文字，否則為經清理的最新工具/toolResult 文字                                                     |
| 後續       | 描述何時回覆與何時保持靜默的指示                                                                               |

終端失敗執行會回報失敗狀態，而不重播擷取到的
回覆文字。逾時時，如果子層只完成工具呼叫，回報
可以將該歷史折疊成簡短的部分進度摘要，而不是
重播原始工具輸出。

### 統計行

回報承載會在結尾包含統計行（即使被包裝也一樣）：

- 執行階段（例如 `runtime 5m12s`）。
- 權杖使用量（輸入/輸出/總計）。
- 當已設定模型定價時的估算成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 和記錄路徑，讓主代理可透過 `sessions_history` 擷取歷史，或檢查磁碟上的檔案。

內部中繼資料僅供協調使用；面向使用者的回覆
應以一般助理語氣重寫。

### 為何偏好 `sessions_history`

`sessions_history` 是較安全的協調路徑：

- 助理回憶會先正規化：移除 thinking 標籤；移除 `<relevant-memories>` / `<relevant_memories>` 鷹架；移除純文字工具呼叫 XML 承載區塊（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`），包含永遠未乾淨閉合的截斷承載；移除降級的工具呼叫/結果鷹架和歷史內容標記；移除洩漏的模型控制權杖（`<|assistant|>`、其他 ASCII `<|...|>`、全形 `<｜...｜>`）；移除格式錯誤的 MiniMax 工具呼叫 XML。
- 憑證/類似權杖的文字會被遮蔽。
- 長區塊可被截斷。
- 非常大的歷史可捨棄較舊列，或用 `[sessions_history omitted: message too large]` 取代過大的列。
- 當你需要完整逐位元組一致的記錄時，原始磁碟記錄檢查是備援方式。

## 工具政策

子代理會先使用與父代理或目標代理相同的設定檔和工具政策
管線。之後，OpenClaw 會套用子代理限制層。

若沒有具限制性的 `tools.profile`，子代理會取得**除了
工作階段工具**和系統工具之外的所有工具：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` 在此仍是有界且經清理的回憶檢視，並
不是原始記錄傾印。

當 `maxSpawnDepth >= 2` 時，深度 1 協調器子代理會額外
收到 `sessions_spawn`、`subagents`、`sessions_list` 和
`sessions_history`，因此可以管理其子層。

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

`tools.subagents.tools.allow` 是最終的僅允許篩選器。它可以縮小
已解析的工具集，但無法**加回**已由 `tools.profile` 移除的工具。
例如，`tools.profile: "coding"` 包含 `web_search`/`web_fetch`，
但不包含 `browser` 工具。若要讓 coding-profile 子代理使用瀏覽器自動化，
請在 profile 階段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

當只有單一代理應取得瀏覽器自動化時，請使用每個代理的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 並行

子代理使用專用的程序內佇列通道：

- **通道名稱：** `subagent`
- **並行數：** `agents.defaults.subagents.maxConcurrent`（預設 `8`）

## 存活性與復原

OpenClaw 不會把缺少 `endedAt` 視為子代理仍然存活的永久證明。
早於過期執行時間窗且未結束的執行，會停止在 `/subagents list`、狀態摘要、
子代完成門檻，以及每個工作階段的並行檢查中計為作用中/待處理。

Gateway 重新啟動後，除非其子工作階段標記為 `abortedLastRun: true`，
否則過期且未結束的已還原執行會被剪除。這些因重新啟動而中止的子工作階段，
仍可透過子代理孤兒復原流程復原；該流程會先傳送合成的恢復訊息，
再清除中止標記。

自動重新啟動復原會以每個子工作階段為界限。如果同一個子代理子項在快速重卡住時間窗內
反覆被接受進行孤兒復原，OpenClaw 會在該工作階段上保留復原墓碑，
並在後續重新啟動時停止自動恢復它。執行 `openclaw tasks maintenance --apply`
以協調任務記錄，或執行 `openclaw doctor --fix` 以清除已設墓碑工作階段上的
過期中止復原旗標。

<Note>
如果子代理產生失敗並出現 Gateway `PAIRING_REQUIRED` /
`scope-upgrade`，請先檢查 RPC 呼叫端，再編輯配對狀態。
內部 `sessions_spawn` 協調應透過直接 loopback 共享權杖/密碼驗證，
以 `client.id: "gateway-client"` 和 `client.mode: "backend"` 連線；
該路徑不依賴 CLI 的已配對裝置範圍基準。遠端呼叫端、明確的
`deviceIdentity`、明確的裝置權杖路徑，以及瀏覽器/node 用戶端，
仍需要一般裝置核准才能進行範圍升級。
</Note>

## 停止

- 在請求者聊天中傳送 `/stop` 會中止請求者工作階段，並停止從中產生的任何作用中子代理執行，連鎖套用至巢狀子項。
- `/subagents kill <id>` 會停止特定子代理，並連鎖停止其子項。

## 限制

- 子代理公告是**盡力而為**。如果 gateway 重新啟動，待處理的「回報公告」工作會遺失。
- 子代理仍共用相同的 gateway 程序資源；請將 `maxConcurrent` 視為安全閥。
- `sessions_spawn` 一律為非阻塞：它會立即傳回 `{ status: "accepted", runId, childSessionKey }`。
- 子代理內容只注入 `AGENTS.md` + `TOOLS.md`（沒有 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大巢狀深度為 5（`maxSpawnDepth` 範圍：1–5）。大多數使用案例建議使用深度 2。
- `maxChildrenPerAgent` 會限制每個工作階段的作用中子項數量（預設 `5`，範圍 `1–20`）。

## 相關

- [ACP 代理](/zh-TW/tools/acp-agents)
- [代理傳送](/zh-TW/tools/agent-send)
- [背景任務](/zh-TW/automation/tasks)
- [多代理沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
