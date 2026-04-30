---
read_when:
    - 你想透過代理程式進行背景或並行工作
    - 您正在變更 sessions_spawn 或子代理工具政策
    - 你正在實作或疑難排解執行緒繫結的子代理工作階段
sidebarTitle: Sub-agents
summary: 啟動隔離的背景代理程式執行作業，並將結果回報到請求者的聊天室
title: 子代理
x-i18n:
    generated_at: "2026-04-30T03:48:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84386ea706873cf9f2ea03261f916c8fb01304999f2d9fa86e037e734a62bf7e
    source_path: tools/subagents.md
    workflow: 16
---

子代理是在現有代理執行中產生的背景代理執行。
它們會在自己的工作階段（`agent:<agentId>:subagent:<uuid>`）中執行，
完成時會將結果**公告**回請求者聊天通道。
每個子代理執行都會被追蹤為一個
[背景工作](/zh-TW/automation/tasks)。

主要目標：

- 平行化「研究 / 長時間工作 / 慢速工具」工作，而不阻塞主要執行。
- 預設保持子代理隔離（工作階段分離 + 可選的沙箱）。
- 讓工具介面難以誤用：子代理預設**不會**取得工作階段工具。
- 支援可設定的巢狀深度，以便使用編排器模式。

<Note>
**成本注意事項：**每個子代理預設都有自己的內容脈絡和 token 用量。
對於繁重或重複性的工作，請為子代理設定較便宜的模型，
並讓主要代理使用品質較高的模型。可透過
`agents.defaults.subagents.model` 或每個代理的覆寫設定進行設定。
當子代理確實需要請求者目前的逐字稿時，代理可以在那次產生中要求
`context: "fork"`。
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

`/subagents info` 會顯示執行中繼資料（狀態、時間戳記、工作階段 id、
逐字稿路徑、清理）。使用 `sessions_history` 可取得有界且經安全篩選的回憶檢視；當你需要原始完整逐字稿時，請檢查磁碟上的逐字稿路徑。

### 討論串繫結控制

這些命令適用於支援持久討論串繫結的通道。
請參閱下方的[支援討論串的通道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 產生行為

`/subagents spawn` 會以使用者命令啟動背景子代理（不是內部轉送），並在執行完成時，將一則最終完成更新傳送回請求者聊天。

<AccordionGroup>
  <Accordion title="非阻塞、推送式完成">
    - 產生命令是非阻塞的；它會立即傳回執行 id。
    - 完成時，子代理會向請求者聊天通道公告摘要/結果訊息。
    - 完成採用推送式。產生後，請**不要**在迴圈中輪詢 `/subagents list`、`sessions_list` 或 `sessions_history` 只是為了等待它完成；只在需要除錯或介入時按需檢查狀態。
    - 完成時，OpenClaw 會盡力關閉該子代理工作階段開啟並被追蹤的瀏覽器分頁/程序，然後公告清理流程才會繼續。

  </Accordion>
  <Accordion title="手動產生的交付韌性">
    - OpenClaw 會先嘗試使用穩定的冪等性金鑰進行直接 `agent` 交付。
    - 如果直接交付失敗，會退回使用佇列路由。
    - 如果佇列路由仍不可用，公告會以短暫的指數退避重試，然後才最終放棄。
    - 完成交付會保留已解析的請求者路由：可用時，以討論串繫結或對話繫結的完成路由為準；如果完成來源只提供通道，OpenClaw 會從請求者工作階段已解析的路由（`lastChannel` / `lastTo` / `lastAccountId`）補上缺少的目標/帳號，因此直接交付仍可運作。

  </Accordion>
  <Accordion title="完成交接中繼資料">
    對請求者工作階段的完成交接是執行階段產生的內部內容脈絡（不是使用者撰寫的文字），並包含：

    - `Result` — 最新可見的 `assistant` 回覆文字，否則為經清理的最新工具/toolResult 文字。終止且失敗的執行不會重複使用擷取到的回覆文字。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - 精簡的執行階段/token 統計資料。
    - 一項交付指示，要求請求者代理以一般助理語氣重寫（而不是轉發原始內部中繼資料）。

  </Accordion>
  <Accordion title="模式與 ACP 執行階段">
    - `--model` 和 `--thinking` 會覆寫該特定執行的預設值。
    - 使用 `info`/`log` 在完成後檢查詳細資料與輸出。
    - `/subagents spawn` 是一次性模式（`mode: "run"`）。若要使用持久的討論串繫結工作階段，請使用 `sessions_spawn` 搭配 `thread: true` 和 `mode: "session"`。
    - 對於 ACP harness 工作階段（Claude Code、Gemini CLI、OpenCode，或明確指定的 Codex ACP/acpx），當工具宣告支援該執行階段時，請使用 `sessions_spawn` 搭配 `runtime: "acp"`。除錯完成或代理對代理迴圈時，請參閱 [ACP 交付模型](/zh-TW/tools/acp-agents#delivery-model)。啟用 `codex` Plugin 時，除非使用者明確要求 ACP/acpx，否則 Codex 聊天/討論串控制應優先使用 `/codex ...`，而不是 ACP。
    - OpenClaw 會隱藏 `runtime: "acp"`，直到 ACP 已啟用、請求者未被沙箱化，且已載入像 `acpx` 這樣的後端 Plugin。`runtime: "acp"` 需要外部 ACP harness id，或包含 `runtime.type="acp"` 的 `agents.list[]` 項目；對於來自 `agents_list` 的一般 OpenClaw 設定代理，請使用預設子代理執行階段。

  </Accordion>
</AccordionGroup>

## 內容脈絡模式

原生子代理會以隔離狀態啟動，除非呼叫者明確要求分支目前逐字稿。

| 模式       | 使用時機                                                                                                                         | 行為                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、獨立實作、慢速工具工作，或任何可在工作文字中清楚交代的事項                           | 建立乾淨的子逐字稿。這是預設值，可降低 token 用量。  |
| `fork`     | 依賴目前對話、先前工具結果，或請求者逐字稿中既有細微指示的工作 | 在子代理啟動前，將請求者逐字稿分支到子工作階段中。 |

請謹慎使用 `fork`。它適用於對內容脈絡敏感的委派，不是撰寫清楚工作提示的替代品。

## 工具：`sessions_spawn`

在全域 `subagent` 通道上以 `deliver: false` 啟動子代理執行，
然後執行公告步驟，並將公告回覆張貼到請求者聊天通道。

可用性取決於呼叫者的有效工具政策。`coding` 和
`full` 設定檔預設會公開 `sessions_spawn`。`messaging` 設定檔
不會；若代理應委派工作，請新增 `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` 或使用 `tools.profile: "coding"`。
通道/群組、提供者、沙箱，以及每個代理的允許/拒絕政策，
仍可在設定檔階段後移除該工具。請從同一個工作階段使用 `/tools`
確認有效工具清單。

**預設值：**

- **模型：**除非你設定 `agents.defaults.subagents.model`（或每個代理的 `agents.list[].subagents.model`），否則會繼承呼叫者；明確的 `sessions_spawn.model` 仍會優先。
- **Thinking：**除非你設定 `agents.defaults.subagents.thinking`（或每個代理的 `agents.list[].subagents.thinking`），否則會繼承呼叫者；明確的 `sessions_spawn.thinking` 仍會優先。
- **執行逾時：**如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 會在已設定時使用 `agents.defaults.subagents.runTimeoutSeconds`；否則退回到 `0`（無逾時）。

### 工具參數

<ParamField path="task" type="string" required>
  子代理的工作描述。
</ParamField>
<ParamField path="label" type="string">
  選用的人類可讀標籤。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允許時，於另一個代理 id 下產生。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 僅用於外部 ACP harness（`claude`、`droid`、`gemini`、`opencode`，或明確要求的 Codex ACP/acpx），以及 `runtime.type` 為 `acp` 的 `agents.list[]` 項目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  僅限 ACP。當 `runtime: "acp"` 時，恢復現有 ACP harness 工作階段；原生子代理產生會忽略此項。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  僅限 ACP。當 `runtime: "acp"` 時，將 ACP 執行輸出串流到父工作階段；原生子代理產生請省略此項。
</ParamField>
<ParamField path="model" type="string">
  覆寫子代理模型。無效值會被略過，且子代理會在預設模型上執行，並在工具結果中顯示警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆寫子代理執行的 thinking 層級。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  已設定時預設為 `agents.defaults.subagents.runTimeoutSeconds`，否則為 `0`。設定後，子代理執行會在 N 秒後中止。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  當為 `true` 時，要求為此子代理工作階段進行通道討論串繫結。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，預設會變成 `session`。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 會在公告後立即封存（仍會透過重新命名保留逐字稿）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` 會拒絕產生，除非目標子執行階段已被沙箱化。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 會將請求者目前逐字稿分支到子工作階段。僅限原生子代理。只有在子代理需要目前逐字稿時才使用 `fork`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受通道交付參數（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）。若要交付，請從產生的執行使用
`message`/`sessions_send`。
</Warning>

## 討論串繫結工作階段

當通道已啟用討論串繫結時，子代理可以持續繫結到討論串，
讓該討論串中的後續使用者訊息持續路由到同一個子代理工作階段。

### 支援討論串的通道

**Discord** 目前是唯一支援的通道。它支援持久的討論串繫結子代理工作階段（`sessions_spawn` 搭配
`thread: true`）、手動討論串控制（`/focus`、`/unfocus`、`/agents`、
`/session idle`、`/session max-age`），以及配接器鍵
`channels.discord.threadBindings.enabled`、
`channels.discord.threadBindings.idleHours`、
`channels.discord.threadBindings.maxAgeHours` 和
`channels.discord.threadBindings.spawnSubagentSessions`。

### 快速流程

<Steps>
  <Step title="產生">
    `sessions_spawn` 搭配 `thread: true`（以及選用的 `mode: "session"`）。
  </Step>
  <Step title="繫結">
    OpenClaw 會在作用中的通道中建立或繫結討論串到該工作階段目標。
  </Step>
  <Step title="路由後續訊息">
    該討論串中的回覆和後續訊息會路由到繫結的工作階段。
  </Step>
  <Step title="檢查逾時">
    使用 `/session idle` 檢查/更新非活動自動取消聚焦，並使用
    `/session max-age` 控制硬性上限。
  </Step>
  <Step title="分離">
    使用 `/unfocus` 手動分離。
  </Step>
</Steps>

### 手動控制

| 命令               | 效果                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 將目前對話串（或建立一個）繫結到子代理/工作階段目標                  |
| `/unfocus`         | 移除目前已繫結對話串的繫結                                           |
| `/agents`          | 列出作用中的執行和繫結狀態（`thread:<id>` 或 `unbound`）              |
| `/session idle`    | 檢查/更新閒置自動取消聚焦（僅限已聚焦且已繫結的對話串）              |
| `/session max-age` | 檢查/更新硬性上限（僅限已聚焦且已繫結的對話串）                      |

### 設定開關

- **全域預設值：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **頻道覆寫和產生時自動繫結鍵** 依配接器而定。請參閱上方的[支援對話串的頻道](#thread-supporting-channels)。

請參閱[設定參考](/zh-TW/gateway/configuration-reference)和
[斜線命令](/zh-TW/tools/slash-commands)，以取得目前的配接器詳細資訊。

### 允許清單

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可透過明確 `agentId` 作為目標的代理 ID 清單（`["*"]` 允許任何代理）。預設值：僅限請求者代理。如果你設定清單，且仍希望請求者使用 `agentId` 產生自己，請將請求者 ID 加入清單。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  當請求者代理未設定自己的 `subagents.allowAgents` 時使用的預設目標代理允許清單。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選取設定檔）。每個代理覆寫：`agents.list[].subagents.requireAgentId`。
</ParamField>

如果請求者工作階段受到沙盒限制，`sessions_spawn` 會拒絕將在無沙盒狀態下執行的目標。

### 探索

使用 `agents_list` 查看目前允許用於 `sessions_spawn` 的代理 ID。回應會包含每個列出代理的有效模型和嵌入式執行階段中繼資料，讓呼叫者可以區分 PI、Codex 應用程式伺服器，以及其他已設定的原生執行階段。

### 自動封存

- 子代理工作階段會在 `agents.defaults.subagents.archiveAfterMinutes` 之後自動封存（預設為 `60`）。
- 封存使用 `sessions.delete`，並將逐字稿重新命名為 `*.deleted.<timestamp>`（同一資料夾）。
- `cleanup: "delete"` 會在宣告後立即封存（仍會透過重新命名保留逐字稿）。
- 自動封存是盡力而為；如果 gateway 重新啟動，待處理計時器會遺失。
- `runTimeoutSeconds` **不會** 自動封存；它只會停止執行。工作階段會保留到自動封存為止。
- 自動封存同樣適用於深度 1 和深度 2 工作階段。
- 瀏覽器清理與封存清理彼此獨立：受追蹤的瀏覽器分頁/程序會在執行完成時盡力關閉，即使逐字稿/工作階段記錄仍保留。

## 巢狀子代理

預設情況下，子代理無法產生自己的子代理
（`maxSpawnDepth: 1`）。設定 `maxSpawnDepth: 2` 可啟用一層
巢狀結構，也就是 **協調器模式**：主要 → 協調器子代理 →
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

| 深度 | 工作階段鍵形狀                             | 角色                                          | 可以產生嗎？                 |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主要代理                                      | 一律可以                     |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子代理（允許深度 2 時為協調器）              | 僅當 `maxSpawnDepth >= 2`    |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子代理（葉節點工作者）                     | 永不                         |

### 宣告鏈

結果會沿鏈往上回傳：

1. 深度 2 工作者完成 → 向其父項（深度 1 協調器）宣告。
2. 深度 1 協調器接收宣告、彙整結果、完成 → 向主要代理宣告。
3. 主要代理接收宣告並交付給使用者。

每個層級只會看到其直接子項的宣告。

<Note>
**操作指引：** 子工作只啟動一次，然後等待完成事件，而不是圍繞 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` 睡眠命令建立輪詢迴圈。
`sessions_list` 和 `/subagents list` 會讓子工作階段關係聚焦於即時工作，作用中的子項會維持附加，已結束的子項會在短暫的近期視窗內保持可見，而陳舊且僅存在於儲存區的子連結會在其新鮮度視窗後被忽略。這可防止舊的 `spawnedBy` /
`parentSessionKey` 中繼資料在重新啟動後復活幽靈子項。如果子項完成事件在你已送出最終答案後才抵達，正確的後續回應是精確的靜默權杖
`NO_REPLY` / `no_reply`。
</Note>

### 依深度的工具政策

- 角色和控制範圍會在產生時寫入工作階段中繼資料。這可避免扁平或已還原的工作階段鍵意外重新取得協調器權限。
- **深度 1（協調器，當 `maxSpawnDepth >= 2` 時）：** 取得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子項。其他工作階段/系統工具仍會被拒絕。
- **深度 1（葉節點，當 `maxSpawnDepth == 1` 時）：** 沒有工作階段工具（目前預設行為）。
- **深度 2（葉節點工作者）：** 沒有工作階段工具，`sessions_spawn` 在深度 2 一律被拒絕。無法再產生更多子項。

### 每個代理的產生限制

每個代理工作階段（任何深度）同一時間最多可有 `maxChildrenPerAgent`
（預設 `5`）個作用中子項。這可防止單一協調器失控擴散。

### 串級停止

停止深度 1 協調器會自動停止其所有深度 2 子項：

- 主要聊天中的 `/stop` 會停止所有深度 1 代理，並串級停止其深度 2 子項。
- `/subagents kill <id>` 會停止特定子代理，並串級停止其子項。
- `/subagents kill all` 會停止請求者的所有子代理並串級停止。

## 驗證

子代理驗證依 **代理 ID** 解析，而不是依工作階段類型：

- 子代理工作階段鍵為 `agent:<agentId>:subagent:<uuid>`。
- 驗證儲存區會從該代理的 `agentDir` 載入。
- 主要代理的驗證設定檔會作為 **後援** 合併；發生衝突時，代理設定檔會覆寫主要設定檔。

合併是加成式，因此主要設定檔一律可作為後援使用。尚不支援每個代理完全隔離的驗證。

## 宣告

子代理會透過宣告步驟回報：

- 宣告步驟在子代理工作階段內執行（不是請求者工作階段）。
- 如果子代理精確回覆 `ANNOUNCE_SKIP`，就不會張貼任何內容。
- 如果最新的助理文字是精確的靜默權杖 `NO_REPLY` / `no_reply`，即使先前已有可見進度，也會抑制宣告輸出。

交付取決於請求者深度：

- 最上層請求者工作階段會使用後續 `agent` 呼叫並進行外部交付（`deliver=true`）。
- 巢狀請求者子代理工作階段會接收內部後續注入（`deliver=false`），讓協調器可以在工作階段內彙整子項結果。
- 如果巢狀請求者子代理工作階段已不存在，OpenClaw 會在可用時退回到該工作階段的請求者。

對於最上層請求者工作階段，完成模式直接交付會先解析任何已繫結的對話/對話串路由和 hook 覆寫，然後從請求者工作階段儲存的路由填入缺少的頻道目標欄位。這可讓完成訊息留在正確的聊天/主題中，即使完成來源只識別了頻道。

建置巢狀完成發現時，子項完成彙總會限定於目前請求者執行，避免先前執行的陳舊子項輸出洩漏到目前宣告中。當頻道配接器可用時，宣告回覆會保留對話串/主題路由。

### 宣告內容

宣告內容會正規化為穩定的內部事件區塊：

| 欄位         | 來源                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| 來源         | `subagent` 或 `cron`                                                                                           |
| 工作階段 ID  | 子工作階段鍵/ID                                                                                                 |
| 類型         | 宣告類型 + 任務標籤                                                                                             |
| 狀態         | 衍生自執行階段結果（`success`、`error`、`timeout` 或 `unknown`），**不是** 從模型文字推斷 |
| 結果內容     | 最新可見的助理文字，否則為已清理的最新工具/toolResult 文字                                                      |
| 後續         | 描述何時回覆與何時保持靜默的指示                                                                                 |

終止的失敗執行會回報失敗狀態，而不重播擷取到的回覆文字。逾時時，如果子項只完成了工具呼叫，宣告可將該歷史壓縮成簡短的部分進度摘要，而不是重播原始工具輸出。

### 統計行

宣告承載資料會在結尾包含統計行（即使已換行包裹）：

- 執行時間（例如 `runtime 5m12s`）。
- 權杖使用量（輸入/輸出/總計）。
- 設定模型定價時的估計成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 和逐字稿路徑，讓主要代理可透過 `sessions_history` 擷取歷史，或檢查磁碟上的檔案。

內部中繼資料僅供協調使用；面向使用者的回覆應以一般助理語氣重寫。

### 為何偏好 `sessions_history`

`sessions_history` 是較安全的協調路徑：

- 助理回憶會先正規化：移除 thinking 標籤；移除 `<relevant-memories>` / `<relevant_memories>` 鷹架；移除純文字工具呼叫 XML 承載區塊（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`），包括從未乾淨關閉的截斷承載；移除降級的工具呼叫/結果鷹架和歷史內容標記；移除外洩的模型控制權杖（`<|assistant|>`、其他 ASCII `<|...|>`、全形 `<｜...｜>`）；移除格式錯誤的 MiniMax 工具呼叫 XML。
- 憑證/類權杖文字會被遮蔽。
- 長區塊可以被截斷。
- 非常大的歷史可以捨棄較舊列，或以 `[sessions_history omitted: message too large]` 取代過大的列。
- 當你需要完整逐位元組一致的逐字稿時，原始磁碟逐字稿檢查是後援方式。

## 工具政策

子代理會先使用與父項或目標代理相同的設定檔和工具政策管線。之後，OpenClaw 會套用子代理限制層。

若沒有具限制性的 `tools.profile`，子代理會取得 **除了工作階段工具** 和系統工具以外的所有工具：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` 在此處仍是有界且已清理的回憶檢視，並非原始逐字稿傾印。

當 `maxSpawnDepth >= 2` 時，深度 1 協調器子代理還會額外接收 `sessions_spawn`、`subagents`、`sessions_list` 和
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
已解析的工具集，但無法**加回**被 `tools.profile` 移除的工具。
例如，`tools.profile: "coding"` 包含
`web_search`/`web_fetch`，但不包含 `browser` 工具。若要讓
coding 設定檔的子代理使用 browser 自動化，請在
profile 階段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

當只有單一代理應取得 browser 自動化時，請使用個別代理的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 並行

子代理使用專用的程序內佇列通道：

- **通道名稱：** `subagent`
- **並行數：** `agents.defaults.subagents.maxConcurrent`（預設 `8`）

## 存活狀態與復原

OpenClaw 不會將缺少 `endedAt` 視為
子代理仍存活的永久證明。早於過期執行時間窗口的未結束執行，
在 `/subagents list`、狀態摘要、
後代完成門檻，以及各工作階段並行檢查中，將不再計為作用中/待處理。

Gateway 重新啟動後，過期且未結束的已還原執行會被修剪，除非
其子工作階段標記為 `abortedLastRun: true`。這些
由重新啟動中止的子工作階段仍可透過子代理
孤立復原流程復原；該流程會先傳送合成的繼續訊息，
再清除已中止標記。

<Note>
如果子代理產生失敗並出現 Gateway `PAIRING_REQUIRED` /
`scope-upgrade`，請在編輯配對狀態前檢查 RPC 呼叫端。
內部 `sessions_spawn` 協調應以
`client.id: "gateway-client"` 搭配 `client.mode: "backend"` 透過直接
loopback 共享權杖/密碼驗證連線；該路徑不依賴
CLI 的已配對裝置 scope 基準。遠端呼叫端、明確的
`deviceIdentity`、明確的裝置權杖路徑，以及瀏覽器/Node 用戶端
仍需一般裝置核准才能升級 scope。
</Note>

## 停止

- 在請求者聊天中傳送 `/stop` 會中止請求者工作階段，並停止從中產生的任何作用中子代理執行，且會連鎖至巢狀子項。
- `/subagents kill <id>` 會停止指定子代理，並連鎖至其子項。

## 限制

- 子代理公告是**盡力而為**。如果 Gateway 重新啟動，待處理的「announce back」工作會遺失。
- 子代理仍共用相同的 Gateway 程序資源；請將 `maxConcurrent` 視為安全閥。
- `sessions_spawn` 一律非阻塞：它會立即傳回 `{ status: "accepted", runId, childSessionKey }`。
- 子代理內容僅注入 `AGENTS.md` + `TOOLS.md`（不含 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大巢狀深度為 5（`maxSpawnDepth` 範圍：1–5）。大多數使用情境建議使用深度 2。
- `maxChildrenPerAgent` 會限制每個工作階段的作用中子項數量（預設 `5`，範圍 `1–20`）。

## 相關

- [ACP 代理](/zh-TW/tools/acp-agents)
- [代理傳送](/zh-TW/tools/agent-send)
- [背景工作](/zh-TW/automation/tasks)
- [多代理沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
