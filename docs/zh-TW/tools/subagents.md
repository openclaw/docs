---
read_when:
    - 你想透過代理程式進行背景或平行工作
    - 你正在變更 sessions_spawn 或子代理工具政策
    - 你正在實作或疑難排解對話串綁定的子代理工作階段
sidebarTitle: Sub-agents
summary: 啟動隔離的背景代理程式執行，並將結果回報至請求者聊天
title: 子代理
x-i18n:
    generated_at: "2026-04-30T16:30:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c46d2c6d9ddac23653dcbfaf20df0ff5be9619035a1b115a3b49fd48fd8280
    source_path: tools/subagents.md
    workflow: 16
---

子代理是在現有代理執行中產生的背景代理執行。
它們會在自己的工作階段（`agent:<agentId>:subagent:<uuid>`）中執行，並在完成時將結果**公告**回請求者的聊天
頻道。每次子代理執行都會被追蹤為
[背景任務](/zh-TW/automation/tasks)。

主要目標：

- 平行處理「研究／長時間任務／慢速工具」工作，而不阻塞主執行。
- 預設隔離子代理（工作階段分離 + 選用沙盒）。
- 讓工具介面難以誤用：子代理預設**不會**取得工作階段工具。
- 支援可設定的巢狀深度，以用於協調器模式。

<Note>
**成本注意事項：**預設情況下，每個子代理都有自己的上下文與 token 用量。對於繁重或重複性的任務，請為子代理設定較便宜的模型，並讓主代理使用較高品質的模型。可透過 `agents.defaults.subagents.model` 或每個代理的覆寫設定進行設定。當子代理確實需要請求者目前的逐字稿時，代理可在該次產生中要求 `context: "fork"`。
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

`/subagents info` 會顯示執行中繼資料（狀態、時間戳記、工作階段 id、逐字稿路徑、清理）。使用 `sessions_history` 取得有界且經安全篩選的回顧檢視；當你需要原始完整逐字稿時，請檢查磁碟上的逐字稿路徑。

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

`/subagents spawn` 會以使用者命令（而非內部轉送）的形式啟動背景子代理，並在執行完成時將一則最終完成更新傳送回請求者聊天。

<AccordionGroup>
  <Accordion title="非阻塞、推送式完成">
    - 產生命令是非阻塞的；它會立即傳回一個執行 id。
    - 完成時，子代理會將摘要／結果訊息公告回請求者聊天頻道。
    - 完成是推送式的。產生後，請**不要**為了等待它完成而在迴圈中輪詢 `/subagents list`、`sessions_list` 或 `sessions_history`；僅在偵錯或介入時按需檢查狀態。
    - 完成時，在公告清理流程繼續之前，OpenClaw 會盡力關閉該子代理工作階段開啟並受追蹤的瀏覽器分頁／程序。

  </Accordion>
  <Accordion title="手動產生的傳遞韌性">
    - OpenClaw 會先嘗試使用穩定的冪等鍵進行直接 `agent` 傳遞。
    - 如果直接傳遞失敗，會退回到佇列路由。
    - 如果佇列路由仍不可用，公告會在最終放棄前以短暫的指數退避重試。
    - 完成傳遞會保留已解析的請求者路由：當執行緒繫結或對話繫結的完成路由可用時會優先使用；如果完成來源只提供頻道，OpenClaw 會從請求者工作階段已解析的路由（`lastChannel` / `lastTo` / `lastAccountId`）補齊缺少的目標／帳戶，讓直接傳遞仍可運作。

  </Accordion>
  <Accordion title="完成交接中繼資料">
    傳給請求者工作階段的完成交接是執行階段產生的內部上下文（不是使用者撰寫的文字），並包含：

    - `Result` — 最新可見的 `assistant` 回覆文字，否則為經清理的最新工具／toolResult 文字。終止且失敗的執行不會重用擷取到的回覆文字。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - 精簡的執行階段／token 統計資料。
    - 一則傳遞指示，要求請求者代理以一般助理語氣改寫（而不是轉發原始內部中繼資料）。

  </Accordion>
  <Accordion title="模式與 ACP 執行階段">
    - `--model` 和 `--thinking` 會覆寫該特定執行的預設值。
    - 使用 `info`/`log` 在完成後檢查詳細資料與輸出。
    - `/subagents spawn` 是一次性模式（`mode: "run"`）。對於持久的執行緒繫結工作階段，請使用 `sessions_spawn` 搭配 `thread: true` 和 `mode: "session"`。
    - 對於 ACP 控制架構工作階段（Claude Code、Gemini CLI、OpenCode，或明確要求的 Codex ACP/acpx），當工具公告該執行階段時，請使用 `sessions_spawn` 搭配 `runtime: "acp"`。偵錯完成或代理對代理迴圈時，請參閱 [ACP 傳遞模型](/zh-TW/tools/acp-agents#delivery-model)。啟用 `codex` plugin 時，除非使用者明確要求 ACP/acpx，否則 Codex 聊天／執行緒控制應優先使用 `/codex ...` 而不是 ACP。
    - OpenClaw 會隱藏 `runtime: "acp"`，直到 ACP 已啟用、請求者未被沙盒化，且已載入後端 plugin（例如 `acpx`）。`runtime: "acp"` 預期使用外部 ACP 控制架構 id，或 `runtime.type="acp"` 的 `agents.list[]` 項目；對於來自 `agents_list` 的一般 OpenClaw 設定代理，請使用預設的子代理執行階段。

  </Accordion>
</AccordionGroup>

## 上下文模式

原生子代理會以隔離狀態啟動，除非呼叫者明確要求 fork
目前逐字稿。

| 模式       | 使用時機                                                                                                                         | 行為                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、獨立實作、慢速工具工作，或任何可在任務文字中簡要說明的內容                           | 建立乾淨的子逐字稿。這是預設值，並能降低 token 使用量。  |
| `fork`     | 依賴目前對話、先前工具結果，或已存在於請求者逐字稿中的細微指示的工作 | 在子工作階段啟動前，將請求者逐字稿分支到子工作階段。 |

請謹慎使用 `fork`。它用於對上下文敏感的委派，而不是取代撰寫清楚任務提示。

## 工具：`sessions_spawn`

在全域 `subagent` 通道上以 `deliver: false` 啟動子代理執行，接著執行公告步驟，並將公告回覆張貼到請求者聊天頻道。

可用性取決於呼叫者的有效工具政策。`coding` 和
`full` 設定檔預設會公開 `sessions_spawn`。`messaging` 設定檔
不會；若代理應委派工作，請加入 `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]`，或使用 `tools.profile: "coding"`。
頻道／群組、提供者、沙盒，以及每個代理的允許／拒絕政策仍可在設定檔階段後移除該工具。請在同一
工作階段中使用 `/tools` 確認有效工具清單。

**預設值：**

- **模型：**除非你設定 `agents.defaults.subagents.model`（或每個代理的 `agents.list[].subagents.model`），否則會繼承呼叫者；明確的 `sessions_spawn.model` 仍會優先。
- **Thinking：**除非你設定 `agents.defaults.subagents.thinking`（或每個代理的 `agents.list[].subagents.thinking`），否則會繼承呼叫者；明確的 `sessions_spawn.thinking` 仍會優先。
- **執行逾時：**如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 會在有設定時使用 `agents.defaults.subagents.runTimeoutSeconds`；否則會退回到 `0`（無逾時）。

### 工具參數

<ParamField path="task" type="string" required>
  子代理的任務說明。
</ParamField>
<ParamField path="label" type="string">
  選用的人類可讀標籤。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允許時，於另一個代理 id 下產生。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 僅用於外部 ACP 控制架構（`claude`、`droid`、`gemini`、`opencode`，或明確要求的 Codex ACP/acpx），以及 `runtime.type` 為 `acp` 的 `agents.list[]` 項目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  僅限 ACP。當 `runtime: "acp"` 時恢復現有 ACP 控制架構工作階段；對原生子代理產生會被忽略。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  僅限 ACP。當 `runtime: "acp"` 時，將 ACP 執行輸出串流到父工作階段；原生子代理產生時請省略。
</ParamField>
<ParamField path="model" type="string">
  覆寫子代理模型。無效值會被略過，子代理會在預設模型上執行，並在工具結果中顯示警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆寫子代理執行的 thinking 層級。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  有設定時預設為 `agents.defaults.subagents.runTimeoutSeconds`，否則為 `0`。設定後，子代理執行會在 N 秒後中止。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  當為 `true` 時，要求為此子代理工作階段進行頻道執行緒繫結。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，預設會變為 `session`。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 會在公告後立即封存（仍會透過重新命名保留逐字稿）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` 會拒絕產生，除非目標子執行階段已被沙盒化。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 會將請求者目前的逐字稿分支到子工作階段。僅限原生子代理。只有在子代理需要目前逐字稿時才使用 `fork`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受頻道傳遞參數（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）。若要傳遞，請從產生的執行使用
`message`/`sessions_send`。
</Warning>

## 執行緒繫結工作階段

當頻道已啟用執行緒繫結時，子代理可以保持繫結到執行緒，讓該執行緒中的後續使用者訊息持續路由到同一個子代理工作階段。

### 支援執行緒的頻道

**Discord** 目前是唯一支援的頻道。它支援
持久的執行緒繫結子代理工作階段（`sessions_spawn` 搭配
`thread: true`）、手動執行緒控制（`/focus`、`/unfocus`、`/agents`、
`/session idle`、`/session max-age`），以及轉接器鍵
`channels.discord.threadBindings.enabled`、
`channels.discord.threadBindings.idleHours`、
`channels.discord.threadBindings.maxAgeHours` 和
`channels.discord.threadBindings.spawnSubagentSessions`。

### 快速流程

<Steps>
  <Step title="產生">
    `sessions_spawn` 搭配 `thread: true`（並可選擇搭配 `mode: "session"`）。
  </Step>
  <Step title="繫結">
    OpenClaw 會在作用中頻道中建立或繫結一個執行緒到該工作階段目標。
  </Step>
  <Step title="路由後續訊息">
    該執行緒中的回覆與後續訊息會路由到已繫結的工作階段。
  </Step>
  <Step title="檢查逾時">
    使用 `/session idle` 檢查／更新閒置自動取消焦點，並使用
    `/session max-age` 控制硬性上限。
  </Step>
  <Step title="分離">
    使用 `/unfocus` 手動分離。
  </Step>
</Steps>

### 手動控制

| 指令               | 效果                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 將目前執行緒（或建立一個執行緒）繫結到子代理/工作階段目標            |
| `/unfocus`         | 移除目前已繫結執行緒的繫結                                           |
| `/agents`          | 列出作用中的執行和繫結狀態（`thread:<id>` 或 `unbound`）              |
| `/session idle`    | 檢查/更新閒置自動取消聚焦（僅限已聚焦且已繫結的執行緒）              |
| `/session max-age` | 檢查/更新硬性上限（僅限已聚焦且已繫結的執行緒）                      |

### 設定開關

- **全域預設值：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **通道覆寫與產生時自動繫結鍵** 依轉接器而定。請參閱上方的[支援執行緒的通道](#thread-supporting-channels)。

請參閱[設定參考](/zh-TW/gateway/configuration-reference)和
[斜線指令](/zh-TW/tools/slash-commands)以取得目前的轉接器詳細資訊。

### 允許清單

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可透過明確 `agentId` 指定為目標的代理 ID 清單（`["*"]` 允許任何代理）。預設值：僅限請求者代理。如果你設定清單，但仍希望請求者能以 `agentId` 產生自己，請將請求者 ID 加入清單。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  當請求者代理未設定自己的 `subagents.allowAgents` 時使用的預設目標代理允許清單。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選擇設定檔）。個別代理覆寫：`agents.list[].subagents.requireAgentId`。
</ParamField>

如果請求者工作階段受沙箱限制，`sessions_spawn` 會拒絕將在非沙箱環境中執行的目標。

### 探索

使用 `agents_list` 查看目前允許用於 `sessions_spawn` 的代理 ID。回應包含每個列出代理的有效模型與內嵌執行階段中繼資料，讓呼叫者能區分 PI、Codex app-server 和其他已設定的原生執行階段。

### 自動封存

- 子代理工作階段會在 `agents.defaults.subagents.archiveAfterMinutes` 後自動封存（預設 `60`）。
- 封存使用 `sessions.delete`，並將逐字稿重新命名為 `*.deleted.<timestamp>`（同一資料夾）。
- `cleanup: "delete"` 會在宣布後立即封存（仍透過重新命名保留逐字稿）。
- 自動封存採盡力而為；如果 Gateway 重新啟動，待執行的計時器會遺失。
- `runTimeoutSeconds` **不會** 自動封存；它只會停止執行。工作階段會保留到自動封存為止。
- 自動封存同樣適用於深度 1 與深度 2 工作階段。
- 瀏覽器清理與封存清理是分開的：追蹤的瀏覽器分頁/程序會在執行完成時盡力關閉，即使逐字稿/工作階段記錄仍被保留。

## 巢狀子代理

預設情況下，子代理無法產生自己的子代理
（`maxSpawnDepth: 1`）。設定 `maxSpawnDepth: 2` 可啟用一層
巢狀結構 — **協調器模式**：主要 → 協調器子代理 →
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
      },
    },
  },
}
```

### 深度層級

| 深度 | 工作階段鍵形狀                               | 角色                                          | 可產生？                     |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主要代理                                      | 一律可以                     |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子代理（允許深度 2 時為協調器）               | 僅當 `maxSpawnDepth >= 2`    |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子代理（葉節點工作者）                      | 永不                         |

### 宣布鏈

結果會沿鏈向上回傳：

1. 深度 2 工作者完成 → 向其父層（深度 1 協調器）宣布。
2. 深度 1 協調器收到宣布、彙整結果並完成 → 向主要代理宣布。
3. 主要代理收到宣布並傳遞給使用者。

每一層只會看到其直接子層的宣布。

<Note>
**操作指引：** 啟動子工作一次，然後等待完成
事件，而不是圍繞 `sessions_list`、
`sessions_history`、`/subagents list` 或 `exec` sleep 指令建立輪詢迴圈。
`sessions_list` 和 `/subagents list` 會讓子工作階段關係
聚焦於即時工作 — 即時子層會保持附加，已結束子層會在短暫的近期視窗內
保持可見，而過時的僅存放區子層連結會在其新鮮度視窗後
被忽略。這可防止舊的 `spawnedBy` /
`parentSessionKey` 中繼資料在重新啟動後復活幽靈子層。
如果你已送出最終答案後才收到子層完成事件，正確的後續回應是精確的靜默權杖
`NO_REPLY` / `no_reply`。
</Note>

### 依深度的工具政策

- 角色與控制範圍會在產生時寫入工作階段中繼資料。這可避免扁平或還原的工作階段鍵意外重新取得協調器權限。
- **深度 1（協調器，當 `maxSpawnDepth >= 2` 時）：** 取得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子層。其他工作階段/系統工具仍會被拒絕。
- **深度 1（葉節點，當 `maxSpawnDepth == 1` 時）：** 沒有工作階段工具（目前預設行為）。
- **深度 2（葉節點工作者）：** 沒有工作階段工具 — `sessions_spawn` 在深度 2 一律被拒絕。無法再產生更多子層。

### 個別代理產生限制

每個代理工作階段（任何深度）一次最多可有 `maxChildrenPerAgent`
（預設 `5`）個作用中子層。這可防止單一協調器失控展開。

### 級聯停止

停止深度 1 協調器會自動停止其所有深度 2
子層：

- 主要聊天中的 `/stop` 會停止所有深度 1 代理，並級聯至其深度 2 子層。
- `/subagents kill <id>` 會停止特定子代理，並級聯至其子層。
- `/subagents kill all` 會停止請求者的所有子代理，並級聯。

## 驗證

子代理驗證依 **代理 ID** 解析，而不是依工作階段類型：

- 子代理工作階段鍵為 `agent:<agentId>:subagent:<uuid>`。
- 驗證存放區會從該代理的 `agentDir` 載入。
- 主要代理的驗證設定檔會作為**備援**合併；衝突時代理設定檔會覆寫主要設定檔。

合併是加成式的，因此主要設定檔永遠可作為備援使用。
尚不支援每個代理完全隔離的驗證。

## 宣布

子代理會透過宣布步驟回報：

- 宣布步驟在子代理工作階段內執行（不是請求者工作階段）。
- 如果子代理精確回覆 `ANNOUNCE_SKIP`，則不會張貼任何內容。
- 如果最新助理文字是精確的靜默權杖 `NO_REPLY` / `no_reply`，即使先前已有可見進度，宣布輸出也會被抑制。

傳遞取決於請求者深度：

- 頂層請求者工作階段會使用帶有外部傳遞的後續 `agent` 呼叫（`deliver=true`）。
- 巢狀請求者子代理工作階段會收到內部後續注入（`deliver=false`），讓協調器能在工作階段內彙整子層結果。
- 如果巢狀請求者子代理工作階段已不存在，OpenClaw 會在可用時退回到該工作階段的請求者。

對於頂層請求者工作階段，完成模式的直接傳遞會先解析任何已繫結的對話/執行緒路由與掛鉤覆寫，然後從請求者工作階段儲存的路由補齊缺少的通道目標欄位。
這可讓完成結果留在正確的聊天/主題中，即使完成來源只識別通道。

建立巢狀完成發現項目時，子層完成彙總會限定在目前請求者執行範圍內，防止過時的先前執行子層輸出洩漏到目前宣布中。當通道轉接器上有執行緒/主題路由時，宣布回覆會保留該路由。

### 宣布內容

宣布內容會正規化為穩定的內部事件區塊：

| 欄位       | 來源                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| 來源       | `subagent` 或 `cron`                                                                                          |
| 工作階段 ID    | 子工作階段鍵/ID                                                                                               |
| 類型       | 宣布類型 + 任務標籤                                                                                           |
| 狀態       | 從執行階段結果衍生（`success`、`error`、`timeout` 或 `unknown`）— **不是** 從模型文字推斷 |
| 結果內容   | 最新可見助理文字，否則為已清理的最新工具/toolResult 文字                                                     |
| 後續       | 描述何時回覆或保持靜默的指示                                                                                  |

終止且失敗的執行會回報失敗狀態，而不重播擷取的
回覆文字。逾時時，如果子層只完成到工具呼叫，宣布
可將該歷史壓縮成簡短的部分進度摘要，而不是
重播原始工具輸出。

### 統計行

宣布承載會在結尾包含統計行（即使被包裝）：

- 執行時間（例如 `runtime 5m12s`）。
- 權杖使用量（輸入/輸出/總計）。
- 當已設定模型定價時的估計成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 和逐字稿路徑，讓主要代理可透過 `sessions_history` 擷取歷史，或檢查磁碟上的檔案。

內部中繼資料僅供協調使用；面向使用者的回覆應以一般助理語氣重寫。

### 為何偏好 `sessions_history`

`sessions_history` 是較安全的協調路徑：

- 助理回憶會先正規化：移除思考標籤；移除 `<relevant-memories>` / `<relevant_memories>` 鷹架；移除純文字工具呼叫 XML 承載區塊（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`），包括從未乾淨關閉的截斷承載；移除降級的工具呼叫/結果鷹架與歷史內容標記；移除洩漏的模型控制權杖（`<|assistant|>`、其他 ASCII `<|...|>`、全形 `<｜...｜>`）；移除格式錯誤的 MiniMax 工具呼叫 XML。
- 憑證/類權杖文字會被遮蔽。
- 長區塊可能會被截斷。
- 非常大的歷史可以捨棄較舊列，或以 `[sessions_history omitted: message too large]` 取代過大的列。
- 需要完整逐位元組逐字稿時，原始磁碟逐字稿檢查是備援方式。

## 工具政策

子代理會先使用與父層或目標代理相同的設定檔與工具政策管線。
之後，OpenClaw 會套用子代理限制層。

若沒有限制性的 `tools.profile`，子代理會取得**除了工作階段工具**與系統工具以外的所有工具：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` 在這裡也仍是有界且已清理的回憶檢視 —
它不是原始逐字稿傾印。

當 `maxSpawnDepth >= 2` 時，深度 1 協調器子代理會額外
接收 `sessions_spawn`、`subagents`、`sessions_list` 和
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

`tools.subagents.tools.allow` 是最終的僅允許篩選器。它可以縮小已解析的工具集，但無法**加回**已被 `tools.profile` 移除的工具。例如，`tools.profile: "coding"` 包含 `web_search`/`web_fetch`，但不包含 `browser` 工具。若要讓使用 coding 設定檔的子代理使用瀏覽器自動化，請在設定檔階段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

當只有一個代理應取得瀏覽器自動化時，請使用個別代理的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 並行

子代理使用專用的程序內佇列通道：

- **通道名稱：** `subagent`
- **並行數：** `agents.defaults.subagents.maxConcurrent`（預設 `8`）

## 存活性與復原

OpenClaw 不會將缺少 `endedAt` 視為子代理仍然存活的永久證明。超過過期執行視窗且尚未結束的執行，會停止在 `/subagents list`、狀態摘要、後代完成門檻，以及個別工作階段並行檢查中計為作用中/待處理。

Gateway 重新啟動後，過期且未結束的已還原執行會被修剪，除非其子工作階段標示為 `abortedLastRun: true`。這些因重新啟動而中止的子工作階段仍可透過子代理孤兒復原流程復原；該流程會先傳送合成的恢復訊息，再清除中止標記。

自動重新啟動復原會以每個子工作階段為界限。如果同一個子代理子項在快速重新卡住視窗內反覆被接受進行孤兒復原，OpenClaw 會在該工作階段上持久化復原墓碑，並在後續重新啟動時停止自動恢復它。執行 `openclaw tasks maintenance --apply` 來調和任務記錄，或執行 `openclaw doctor --fix` 來清除已加墓碑工作階段上的過期中止復原旗標。

<Note>
如果子代理產生失敗並顯示 Gateway `PAIRING_REQUIRED` /
`scope-upgrade`，請先檢查 RPC 呼叫端，再編輯配對狀態。
內部 `sessions_spawn` 協調應以 `client.id: "gateway-client"` 搭配 `client.mode: "backend"`，透過直接 loopback 共用權杖/密碼驗證連線；該路徑不依賴 CLI 的已配對裝置範圍基準。遠端呼叫端、明確的 `deviceIdentity`、明確的裝置權杖路徑，以及瀏覽器/node 用戶端，仍需要一般裝置核准才能進行範圍升級。
</Note>

## 停止

- 在請求者聊天中傳送 `/stop` 會中止請求者工作階段，並停止由其產生的任何作用中子代理執行，且會串連到巢狀子項。
- `/subagents kill <id>` 會停止特定子代理，並串連到其子項。

## 限制

- 子代理公告是**盡力而為**。如果 Gateway 重新啟動，待處理的「回覆公告」工作會遺失。
- 子代理仍共用同一個 Gateway 程序資源；請將 `maxConcurrent` 視為安全閥。
- `sessions_spawn` 一律為非阻塞：它會立即回傳 `{ status: "accepted", runId, childSessionKey }`。
- 子代理內容只會注入 `AGENTS.md` + `TOOLS.md`（不含 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大巢狀深度為 5（`maxSpawnDepth` 範圍：1–5）。多數使用案例建議使用深度 2。
- `maxChildrenPerAgent` 限制每個工作階段的作用中子項數量（預設 `5`，範圍 `1–20`）。

## 相關

- [ACP 代理](/zh-TW/tools/acp-agents)
- [代理傳送](/zh-TW/tools/agent-send)
- [背景任務](/zh-TW/automation/tasks)
- [多代理沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
