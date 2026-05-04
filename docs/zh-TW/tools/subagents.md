---
read_when:
    - 你想透過代理程式進行背景或平行工作
    - 您正在變更 sessions_spawn 或子代理工具政策
    - 你正在實作或疑難排解執行緒繫結的子代理工作階段
sidebarTitle: Sub-agents
summary: 啟動隔離的背景代理程式執行作業，並將結果回報至請求者的聊天
title: 子代理
x-i18n:
    generated_at: "2026-05-04T07:06:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65d60bf6813d667b7311aa28109d4bd6be012a16e638c64cfff130831db88cd8
    source_path: tools/subagents.md
    workflow: 16
---

子代理是從現有代理執行產生的背景代理執行。
它們會在自己的工作階段（`agent:<agentId>:subagent:<uuid>`）中執行，並在完成時將結果**公告**回請求者聊天頻道。每個子代理執行都會追蹤為
[背景工作](/zh-TW/automation/tasks)。

主要目標：

- 平行化「研究／長時間工作／緩慢工具」工作，而不阻塞主要執行。
- 預設隔離子代理（工作階段分離 + 選用沙箱）。
- 讓工具介面不易誤用：子代理預設**不會**取得工作階段工具。
- 支援可設定的巢狀深度，以配合協調器模式。

<Note>
**成本注意事項：**每個子代理預設都有自己的上下文與權杖用量。對於繁重或重複的工作，請為子代理設定較便宜的模型，並讓主要代理使用較高品質的模型。可透過 `agents.defaults.subagents.model` 或個別代理覆寫進行設定。當子項確實需要請求者目前的轉錄內容時，代理可以在該次產生時要求 `context: "fork"`。繫結討論串的子代理工作階段預設為 `context: "fork"`，因為它們會將目前對話分支到後續討論串。
</Note>

## 斜線指令

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

使用頂層 [`/steer <message>`](/zh-TW/tools/steer) 來引導目前請求者工作階段中的作用中執行。當目標是子項執行時，使用 `/subagents steer <id|#> <message>`。

`/subagents info` 會顯示執行中繼資料（狀態、時間戳記、工作階段 ID、轉錄路徑、清理）。使用 `sessions_history` 取得有界限且經安全篩選的回憶檢視；當你需要原始完整轉錄時，檢查磁碟上的轉錄路徑。

### 討論串繫結控制

這些指令適用於支援持久討論串繫結的頻道。
請參閱下方的[支援討論串的頻道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 產生行為

`/subagents spawn` 會以使用者指令（而非內部轉送）的形式啟動背景子代理，並在執行完成時，將一則最終完成更新傳回請求者聊天。

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - 產生指令不會阻塞；它會立即傳回執行 ID。
    - 完成時，子代理會將摘要／結果訊息公告回請求者聊天頻道。
    - 完成採推送式。產生後，請**不要**為了等待它完成而在迴圈中輪詢 `/subagents list`、`sessions_list` 或 `sessions_history`；僅在需要除錯或介入時按需檢查狀態。
    - 完成時，OpenClaw 會在公告清理流程繼續前，盡最大努力關閉該子代理工作階段開啟且受追蹤的瀏覽器分頁／程序。

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw 會先嘗試使用穩定等冪鍵進行直接 `agent` 遞送。
    - 如果請求者代理的完成回合失敗、沒有產生可見輸出，或回傳的是已擷取子項結果的明顯不完整前綴，OpenClaw 會退回使用已擷取子項結果進行直接完成遞送。
    - 如果無法使用直接遞送，則退回佇列路由。
    - 如果佇列路由仍不可用，公告會以短暫指數退避重試，然後才最終放棄。
    - 完成遞送會保留已解析的請求者路由：有可用的繫結討論串或繫結對話完成路由時會優先使用；如果完成來源只提供頻道，OpenClaw 會從請求者工作階段已解析的路由（`lastChannel` / `lastTo` / `lastAccountId`）補上缺少的目標／帳戶，使直接遞送仍可運作。

  </Accordion>
  <Accordion title="Completion handoff metadata">
    對請求者工作階段的完成交接是執行階段產生的內部上下文（不是使用者撰寫的文字），並包含：

    - `Result` — 最新可見的 `assistant` 回覆文字，否則為已清理的最新工具／toolResult 文字。終端失敗的執行不會重用已擷取的回覆文字。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - 精簡的執行階段／權杖統計資料。
    - 一則遞送指示，要求請求者代理以一般助理語氣改寫（不要轉發原始內部中繼資料）。

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` 和 `--thinking` 會覆寫該特定執行的預設值。
    - 使用 `info`/`log` 在完成後檢查詳細資料與輸出。
    - `/subagents spawn` 是一次性模式（`mode: "run"`）。對於持久且繫結討論串的工作階段，請搭配 `thread: true` 與 `mode: "session"` 使用 `sessions_spawn`。
    - 對於 ACP 控制用具工作階段（Claude Code、Gemini CLI、OpenCode，或明確的 Codex ACP/acpx），當工具宣告該執行階段時，請搭配 `runtime: "acp"` 使用 `sessions_spawn`。在除錯完成或代理對代理迴圈時，請參閱 [ACP 遞送模型](/zh-TW/tools/acp-agents#delivery-model)。當 `codex` Plugin 已啟用時，Codex 聊天／討論串控制應優先使用 `/codex ...` 而不是 ACP，除非使用者明確要求 ACP/acpx。
    - OpenClaw 會隱藏 `runtime: "acp"`，直到 ACP 已啟用、請求者不在沙箱中，且已載入像 `acpx` 這樣的後端 Plugin。`runtime: "acp"` 需要外部 ACP 控制用具 ID，或具有 `runtime.type="acp"` 的 `agents.list[]` 項目；一般 OpenClaw 設定代理若來自 `agents_list`，請使用預設子代理執行階段。

  </Accordion>
</AccordionGroup>

## 上下文模式

原生子代理會以隔離狀態啟動，除非呼叫端明確要求分支目前轉錄。

| 模式       | 使用時機                                                                                                                         | 行為                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、獨立實作、緩慢工具工作，或任何可在工作文字中簡述的事項                           | 建立乾淨的子項轉錄。這是預設值，可降低權杖用量。  |
| `fork`     | 依賴目前對話、先前工具結果，或請求者轉錄中已有細微指示的工作 | 在子項啟動前，將請求者轉錄分支到子項工作階段。 |

請謹慎使用 `fork`。它用於對上下文敏感的委派，不是撰寫清楚工作提示的替代品。

## 工具：`sessions_spawn`

在全域 `subagent` 通道上以 `deliver: false` 啟動子代理執行，接著執行公告步驟，並將公告回覆張貼到請求者聊天頻道。

可用性取決於呼叫端的有效工具政策。`coding` 和 `full` 設定檔預設會公開 `sessions_spawn`。`messaging` 設定檔不會；對應該要委派工作的代理，新增 `tools.alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"]` 或使用 `tools.profile: "coding"`。頻道／群組、提供者、沙箱，以及個別代理允許／拒絕政策，仍可在設定檔階段後移除該工具。請從同一個工作階段使用 `/tools` 確認有效工具清單。

**預設值：**

- **模型：**繼承呼叫端，除非你設定 `agents.defaults.subagents.model`（或個別代理的 `agents.list[].subagents.model`）；明確的 `sessions_spawn.model` 仍會優先。
- **思考：**繼承呼叫端，除非你設定 `agents.defaults.subagents.thinking`（或個別代理的 `agents.list[].subagents.thinking`）；明確的 `sessions_spawn.thinking` 仍會優先。
- **執行逾時：**如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 會在已設定時使用 `agents.defaults.subagents.runTimeoutSeconds`；否則退回 `0`（不逾時）。

### 工具參數

<ParamField path="task" type="string" required>
  子代理的工作描述。
</ParamField>
<ParamField path="label" type="string">
  選用的人類可讀標籤。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允許時，於另一個代理 ID 下產生。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 僅適用於外部 ACP 控制用具（`claude`、`droid`、`gemini`、`opencode`，或明確要求的 Codex ACP/acpx），以及其 `runtime.type` 為 `acp` 的 `agents.list[]` 項目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  僅限 ACP。當 `runtime: "acp"` 時繼續現有 ACP 控制用具工作階段；原生子代理產生會忽略此項。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  僅限 ACP。當 `runtime: "acp"` 時，將 ACP 執行輸出串流到父工作階段；原生子代理產生請省略。
</ParamField>
<ParamField path="model" type="string">
  覆寫子代理模型。無效值會被略過，且子代理會在預設模型上執行，並在工具結果中顯示警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆寫子代理執行的思考層級。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  已設定時預設為 `agents.defaults.subagents.runTimeoutSeconds`，否則為 `0`。設定後，子代理執行會在 N 秒後中止。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  當為 `true` 時，要求為此子代理工作階段進行頻道討論串繫結。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，預設會變成 `session`。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 會在公告後立即封存（仍會透過重新命名保留轉錄）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` 會拒絕產生，除非目標子項執行階段位於沙箱中。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 會將請求者目前的轉錄分支到子項工作階段。僅限原生子代理。繫結討論串的產生預設為 `fork`；非討論串產生預設為 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` 不接受頻道遞送參數（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）。若要遞送，請從已產生的執行使用 `message`/`sessions_send`。
</Warning>

## 繫結討論串的工作階段

當某個頻道已啟用討論串繫結時，子代理可以保持繫結到討論串，讓該討論串中的後續使用者訊息持續路由到同一個子代理工作階段。

### 支援討論串的頻道

**Discord** 目前是唯一支援的頻道。它支援持久的繫結討論串子代理工作階段（搭配 `thread: true` 的 `sessions_spawn`）、手動討論串控制（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`），以及配接器鍵 `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours` 和 `channels.discord.threadBindings.spawnSessions`。

### 快速流程

<Steps>
  <Step title="產生">
    使用 `sessions_spawn` 並搭配 `thread: true`（也可選擇搭配 `mode: "session"`）。
  </Step>
  <Step title="繫結">
    OpenClaw 會在作用中的頻道中，為該工作階段目標建立或繫結執行緒。
  </Step>
  <Step title="路由後續訊息">
    該執行緒中的回覆和後續訊息會路由至已繫結的工作階段。
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

| 命令               | 效果                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 將目前執行緒（或建立一個）繫結到子代理／工作階段目標                  |
| `/unfocus`         | 移除目前已繫結執行緒的繫結                                            |
| `/agents`          | 列出作用中的執行和繫結狀態（`thread:<id>` 或 `unbound`）              |
| `/session idle`    | 檢查／更新閒置自動取消聚焦（僅限已聚焦的繫結執行緒）                  |
| `/session max-age` | 檢查／更新硬性上限（僅限已聚焦的繫結執行緒）                          |

### 設定開關

- **全域預設值：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **頻道覆寫與產生時自動繫結鍵** 依轉接器而異。請參閱上方的[支援執行緒的頻道](#thread-supporting-channels)。

請參閱[設定參考](/zh-TW/gateway/configuration-reference)和
[斜線命令](/zh-TW/tools/slash-commands)以取得目前的轉接器詳細資訊。

### 允許清單

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可透過明確 `agentId` 指定的代理 ID 清單（`["*"]` 允許任何代理）。預設：僅限請求者代理。如果你設定清單且仍希望請求者以 `agentId` 產生自身，請將請求者 ID 納入清單。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  當請求者代理未設定自己的 `subagents.allowAgents` 時使用的預設目標代理允許清單。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選擇設定檔）。各代理覆寫：`agents.list[].subagents.requireAgentId`。
</ParamField>

如果請求者工作階段已沙盒化，`sessions_spawn` 會拒絕將以非沙盒方式執行的目標。

### 探索

使用 `agents_list` 查看目前允許 `sessions_spawn` 的代理 ID。回應會包含每個列出代理的有效模型和嵌入式執行階段中繼資料，讓呼叫端能區分 PI、Codex 應用程式伺服器，以及其他已設定的原生執行階段。

### 自動封存

- 子代理工作階段會在 `agents.defaults.subagents.archiveAfterMinutes` 後自動封存（預設 `60`）。
- 封存會使用 `sessions.delete`，並將轉錄重新命名為 `*.deleted.<timestamp>`（同一資料夾）。
- `cleanup: "delete"` 會在公告後立即封存（仍會透過重新命名保留轉錄）。
- 自動封存採最佳努力；如果 gateway 重新啟動，待處理計時器會遺失。
- `runTimeoutSeconds` **不會** 自動封存；它只會停止執行。工作階段會保留到自動封存為止。
- 自動封存同樣套用於深度 1 和深度 2 的工作階段。
- 瀏覽器清理與封存清理是分開的：追蹤的瀏覽器分頁／程序會在執行完成時以最佳努力方式關閉，即使轉錄／工作階段記錄仍保留。

## 巢狀子代理

預設情況下，子代理無法產生自己的子代理
（`maxSpawnDepth: 1`）。設定 `maxSpawnDepth: 2` 可啟用一層
巢狀結構 — **協調器模式**：主代理 → 協調器子代理 →
工作子子代理。

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

| 深度 | 工作階段鍵形狀                               | 角色                                          | 可以產生？                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主代理                                        | 一律可以                     |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子代理（允許深度 2 時為協調器）               | 僅當 `maxSpawnDepth >= 2`    |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子代理（葉節點工作者）                      | 永不                         |

### 公告鏈

結果會沿鏈往上流動：

1. 深度 2 工作者完成 → 公告給其父層（深度 1 協調器）。
2. 深度 1 協調器收到公告、整合結果、完成 → 公告給主代理。
3. 主代理收到公告並傳遞給使用者。

每一層只會看到來自其直接子層的公告。

<Note>
**作業指引：** 啟動一次子層工作並等待完成事件，而不是圍繞 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` sleep 命令建立輪詢迴圈。
`sessions_list` 和 `/subagents list` 會讓子工作階段關係聚焦於即時工作 — 即時子層會保持附加，已結束子層會在短暫的近期視窗中保持可見，而過期的僅儲存子層連結會在其新鮮度視窗後被忽略。這可防止舊的 `spawnedBy` /
`parentSessionKey` 中繼資料在重新啟動後復活幽靈子層。如果子層完成事件在你已傳送最終答案後抵達，正確的後續回應是精確的靜默權杖
`NO_REPLY` / `no_reply`。
</Note>

### 依深度而定的工具政策

- 角色和控制範圍會在產生時寫入工作階段中繼資料。這可避免扁平或還原後的工作階段鍵意外重新取得協調器權限。
- **深度 1（協調器，當 `maxSpawnDepth >= 2` 時）：** 取得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子層。其他工作階段／系統工具仍會被拒絕。
- **深度 1（葉節點，當 `maxSpawnDepth == 1` 時）：** 沒有工作階段工具（目前預設行為）。
- **深度 2（葉節點工作者）：** 沒有工作階段工具 — `sessions_spawn` 在深度 2 一律被拒絕。不能再產生更多子層。

### 每代理產生限制

每個代理工作階段（任何深度）同時最多可有 `maxChildrenPerAgent`
（預設 `5`）個作用中子層。這可防止單一協調器失控扇出。

### 級聯停止

停止深度 1 協調器會自動停止其所有深度 2 子層：

- 主聊天中的 `/stop` 會停止所有深度 1 代理，並級聯到其深度 2 子層。
- `/subagents kill <id>` 會停止特定子代理，並級聯到其子層。
- `/subagents kill all` 會停止請求者的所有子代理並級聯。

## 驗證

子代理驗證依 **代理 ID** 解析，而不是依工作階段類型：

- 子代理工作階段鍵為 `agent:<agentId>:subagent:<uuid>`。
- 驗證儲存區會從該代理的 `agentDir` 載入。
- 主代理的驗證設定檔會作為**備援**合併進來；代理設定檔在衝突時會覆寫主設定檔。

此合併是附加式的，因此主設定檔一律可作為備援使用。尚不支援每個代理完全隔離的驗證。

## 公告

子代理會透過公告步驟回報：

- 公告步驟會在子代理工作階段內執行（不是請求者工作階段）。
- 如果子代理精確回覆 `ANNOUNCE_SKIP`，就不會張貼任何內容。
- 如果最新的助理文字是精確的靜默權杖 `NO_REPLY` / `no_reply`，即使先前存在可見進度，也會抑制公告輸出。

傳遞取決於請求者深度：

- 頂層請求者工作階段會使用具外部傳遞的後續 `agent` 呼叫（`deliver=true`）。
- 巢狀請求者子代理工作階段會接收內部後續注入（`deliver=false`），讓協調器能在工作階段內整合子層結果。
- 如果巢狀請求者子代理工作階段已不存在，OpenClaw 會在可用時退回到該工作階段的請求者。

對於頂層請求者工作階段，完成模式的直接傳遞會先解析任何已繫結的對話／執行緒路由和 Hook 覆寫，然後從請求者工作階段儲存的路由填入缺少的頻道目標欄位。這會讓完成結果保持在正確的聊天／主題中，即使完成來源只識別出頻道也是如此。

建立巢狀完成發現項目時，子層完成彙總會限定在目前請求者執行範圍內，防止過去執行的過期子層輸出洩漏到目前公告中。公告回覆會在頻道轉接器可用時保留執行緒／主題路由。

### 公告內容

公告內容會正規化為穩定的內部事件區塊：

| 欄位         | 來源                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| 來源         | `subagent` 或 `cron`                                                                                          |
| 工作階段 ID  | 子工作階段鍵／ID                                                                                              |
| 類型         | 公告類型 + 任務標籤                                                                                           |
| 狀態         | 衍生自執行階段結果（`success`、`error`、`timeout` 或 `unknown`）— **不是** 從模型文字推斷 |
| 結果內容     | 最新可見的助理文字，否則為已清理的最新工具／toolResult 文字                                                   |
| 後續         | 說明何時回覆與何時保持靜默的指令                                                                              |

終止的失敗執行會回報失敗狀態，而不重播擷取到的回覆文字。逾時時，如果子層只完成到工具呼叫，公告可以將該歷史壓縮為短的部分進度摘要，而不是重播原始工具輸出。

### 統計行

公告承載內容會在結尾包含統計行（即使已換行包裹）：

- 執行時間（例如 `runtime 5m12s`）。
- 權杖用量（輸入／輸出／總計）。
- 設定模型定價時的預估成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 和轉錄路徑，讓主代理可以透過 `sessions_history` 擷取歷史，或檢查磁碟上的檔案。

內部中繼資料僅供協調使用；面向使用者的回覆應以一般助理語氣重新撰寫。

### 為何偏好 `sessions_history`

`sessions_history` 是較安全的協調路徑：

- 助理回憶會先正規化：移除 thinking 標籤；移除 `<relevant-memories>` / `<relevant_memories>` 鷹架；移除純文字工具呼叫 XML 承載區塊（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`），包含從未乾淨關閉的截斷承載；移除降級的工具呼叫／結果鷹架和歷史內容標記；移除洩漏的模型控制權杖（`<|assistant|>`、其他 ASCII `<|...|>`、全形 `<｜...｜>`）；移除格式錯誤的 MiniMax 工具呼叫 XML。
- 類似憑證／權杖的文字會被遮蔽。
- 長區塊可以被截斷。
- 非常大的歷史可以丟棄較舊的列，或以 `[sessions_history omitted: message too large]` 取代過大的列。
- 當你需要完整逐位元組一致的轉錄時，原始磁碟轉錄檢查是備援方式。

## 工具政策

子代理會先使用與父代理或目標代理相同的設定檔與工具政策管線。之後，OpenClaw 會套用子代理限制層。

在沒有具限制性的 `tools.profile` 時，子代理會取得**除了 session 工具**與系統工具以外的所有工具：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` 在這裡也仍然是有界且經過清理的回憶檢視，而不是原始逐字記錄傾印。

當 `maxSpawnDepth >= 2` 時，深度 1 的協調者子代理還會額外收到 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，讓它們可以管理自己的子代理。

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

`tools.subagents.tools.allow` 是最終的僅允許篩選器。它可以縮小已解析完成的工具集合，但無法**加回**已被 `tools.profile` 移除的工具。例如，`tools.profile: "coding"` 包含 `web_search`/`web_fetch`，但不包含 `browser` 工具。若要讓 `coding` profile 的子代理使用瀏覽器自動化，請在 profile 階段加入 browser：

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

子代理使用專用的進程內佇列通道：

- **通道名稱：** `subagent`
- **並行數：** `agents.defaults.subagents.maxConcurrent`（預設 `8`）

## 存活狀態與復原

OpenClaw 不會將沒有 `endedAt` 視為子代理仍然存活的永久證據。早於過期執行時間窗的未結束執行，在 `/subagents list`、狀態摘要、後代完成閘門，以及每個 session 的並行檢查中，將不再被計為 active/pending。

Gateway 重新啟動後，過期且未結束的已還原執行會被清除，除非其子 session 標記為 `abortedLastRun: true`。這些因重新啟動而中止的子 session 仍可透過子代理孤立復原流程復原；該流程會在清除中止標記前送出合成的繼續訊息。

自動重新啟動復原會以每個子 session 為單位設限。如果同一個子代理子項在快速重新卡住時間窗內反覆被接受進行孤立復原，OpenClaw 會在該 session 上持久化一個復原墓碑，並在後續重新啟動時停止自動繼續它。執行 `openclaw tasks maintenance --apply` 以調和任務記錄，或執行 `openclaw doctor --fix` 以清除墓碑 session 上過期的中止復原旗標。

<Note>
如果子代理產生失敗並顯示 Gateway `PAIRING_REQUIRED` / `scope-upgrade`，請先檢查 RPC 呼叫端，再編輯配對狀態。內部 `sessions_spawn` 協調應透過直接 loopback 共享權杖/密碼驗證，以 `client.id: "gateway-client"` 且 `client.mode: "backend"` 連線；該路徑不依賴 CLI 的已配對裝置範圍基準。遠端呼叫端、明確的 `deviceIdentity`、明確的裝置權杖路徑，以及瀏覽器/node 用戶端，仍需要一般裝置核准才能進行範圍升級。
</Note>

## 停止

- 在請求者聊天中傳送 `/stop` 會中止請求者 session，並停止由它產生的任何作用中子代理執行，且會串級套用至巢狀子項。
- `/subagents kill <id>` 會停止指定的子代理，並串級套用至其子項。

## 限制

- 子代理公告是**盡力而為**。如果 gateway 重新啟動，待處理的「回覆公告」工作會遺失。
- 子代理仍共用相同的 gateway 行程資源；請將 `maxConcurrent` 視為安全閥。
- `sessions_spawn` 一律為非阻塞：它會立即回傳 `{ status: "accepted", runId, childSessionKey }`。
- 子代理內容只注入 `AGENTS.md` + `TOOLS.md`（沒有 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大巢狀深度為 5（`maxSpawnDepth` 範圍：1–5）。建議大多數使用情境使用深度 2。
- `maxChildrenPerAgent` 會限制每個 session 的作用中子項數量（預設 `5`，範圍 `1–20`）。

## 相關

- [ACP 代理](/zh-TW/tools/acp-agents)
- [代理傳送](/zh-TW/tools/agent-send)
- [背景任務](/zh-TW/automation/tasks)
- [多代理沙盒工具](/zh-TW/tools/multi-agent-sandbox-tools)
