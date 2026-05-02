---
read_when:
    - 您想透過代理程式進行背景或平行工作
    - 你正在變更 sessions_spawn 或子代理工具政策
    - 你正在實作或疑難排解綁定執行緒的子代理工作階段
sidebarTitle: Sub-agents
summary: 啟動隔離的背景代理執行工作，並將結果回報至發出請求的聊天
title: 子代理
x-i18n:
    generated_at: "2026-05-02T21:06:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e964df543bd19435daf94f2c85a34b9d32e07662405d2eac7635935f1e7bf64
    source_path: tools/subagents.md
    workflow: 16
---

子代理是從現有代理執行中產生的背景代理執行。
它們會在自己的工作階段中執行（`agent:<agentId>:subagent:<uuid>`），並在完成時將結果**公告**回請求者聊天頻道。每個子代理執行都會被追蹤為一個[背景工作](/zh-TW/automation/tasks)。

主要目標：

- 平行處理「研究 / 長時間工作 / 慢速工具」工作，而不阻塞主要執行。
- 預設保持子代理隔離（工作階段分離 + 選用沙盒）。
- 讓工具介面難以誤用：子代理預設**不會**取得工作階段工具。
- 支援可設定的巢狀深度，以用於協調器模式。

<Note>
**成本注意事項：**每個子代理預設都有自己的脈絡與權杖使用量。對於繁重或重複性的工作，請為子代理設定較便宜的模型，並讓主要代理使用較高品質的模型。可透過 `agents.defaults.subagents.model` 或個別代理覆寫進行設定。當子代理確實需要請求者目前的逐字稿時，代理可以在該次產生時要求 `context: "fork"`。繫結執行緒的子代理工作階段預設為 `context: "fork"`，因為它們會將目前對話分支到後續執行緒。
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

`/subagents info` 會顯示執行中繼資料（狀態、時間戳記、工作階段 id、逐字稿路徑、清理）。使用 `sessions_history` 取得有界且經安全篩選的回想檢視；需要原始完整逐字稿時，請檢查磁碟上的逐字稿路徑。

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

`/subagents spawn` 會以使用者命令啟動背景子代理（不是內部轉送），並在執行完成時將一則最終完成更新傳回請求者聊天。

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - 產生命令是非阻塞的；它會立即傳回執行 id。
    - 完成時，子代理會向請求者聊天頻道公告摘要/結果訊息。
    - 完成採用推送式。產生後，請**不要**為了等待完成而迴圈輪詢 `/subagents list`、`sessions_list` 或 `sessions_history`；只有在除錯或介入時才按需檢查狀態。
    - 完成時，在公告清理流程繼續之前，OpenClaw 會盡力關閉該子代理工作階段開啟並追蹤的瀏覽器分頁/程序。

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw 會先嘗試使用穩定的冪等性金鑰直接 `agent` 傳遞。
    - 如果直接傳遞失敗，會退回佇列路由。
    - 如果佇列路由仍不可用，公告會以短暫的指數退避重試，然後才最終放棄。
    - 完成傳遞會保留已解析的請求者路由：可用時，繫結執行緒或繫結對話的完成路由優先；如果完成來源只提供頻道，OpenClaw 會從請求者工作階段已解析的路由（`lastChannel` / `lastTo` / `lastAccountId`）補上缺少的目標/帳號，讓直接傳遞仍可運作。

  </Accordion>
  <Accordion title="Completion handoff metadata">
    交還給請求者工作階段的完成交接內容，是執行階段產生的內部脈絡（不是使用者撰寫的文字），並包含：

    - `Result` — 最新可見的 `assistant` 回覆文字，否則為已清理的最新工具/toolResult 文字。終止失敗的執行不會重用擷取到的回覆文字。
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`。
    - 精簡的執行階段/權杖統計。
    - 一項傳遞指示，要求請求者代理以一般助理語氣改寫（而不是轉送原始內部中繼資料）。

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` 和 `--thinking` 會覆寫該特定執行的預設值。
    - 使用 `info`/`log` 在完成後檢查詳細資料與輸出。
    - `/subagents spawn` 是一次性模式（`mode: "run"`）。若要使用持久的繫結執行緒工作階段，請使用 `sessions_spawn` 搭配 `thread: true` 和 `mode: "session"`。
    - 對於 ACP 控制程式工作階段（Claude Code、Gemini CLI、OpenCode，或明確的 Codex ACP/acpx），當工具宣告該執行階段時，請使用 `sessions_spawn` 搭配 `runtime: "acp"`。除錯完成或代理對代理迴圈時，請參閱 [ACP 傳遞模型](/zh-TW/tools/acp-agents#delivery-model)。啟用 `codex` Plugin 時，Codex 聊天/執行緒控制應優先使用 `/codex ...`，而不是 ACP，除非使用者明確要求 ACP/acpx。
    - OpenClaw 會隱藏 `runtime: "acp"`，直到 ACP 已啟用、請求者未被沙盒化，且已載入如 `acpx` 這類後端 Plugin。`runtime: "acp"` 需要外部 ACP 控制程式 id，或 `runtime.type="acp"` 的 `agents.list[]` 項目；對於來自 `agents_list` 的一般 OpenClaw 設定代理，請使用預設子代理執行階段。

  </Accordion>
</AccordionGroup>

## 脈絡模式

原生子代理會以隔離狀態啟動，除非呼叫端明確要求分支目前逐字稿。

| 模式       | 使用時機                                                                                                                         | 行為                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、獨立實作、慢速工具工作，或任何可在工作文字中簡要說明的事項                           | 建立乾淨的子逐字稿。這是預設值，並能降低權杖使用量。  |
| `fork`     | 依賴目前對話、先前工具結果，或請求者逐字稿中既有細緻指示的工作 | 在子代理開始前，將請求者逐字稿分支到子工作階段。 |

請謹慎使用 `fork`。它用於對脈絡敏感的委派，而不是取代清楚撰寫工作提示。

## 工具：`sessions_spawn`

在全域 `subagent` 通道上以 `deliver: false` 啟動子代理執行，然後執行公告步驟，並將公告回覆發布到請求者聊天頻道。

可用性取決於呼叫端的有效工具政策。`coding` 和 `full` 設定檔預設公開 `sessions_spawn`。`messaging` 設定檔不會；若應委派工作的代理需要，請加入 `tools.alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"]` 或使用 `tools.profile: "coding"`。頻道/群組、提供者、沙盒，以及個別代理的允許/拒絕政策，仍可在設定檔階段後移除此工具。從相同工作階段使用 `/tools` 確認有效工具清單。

**預設值：**

- **模型：**繼承呼叫端，除非你設定 `agents.defaults.subagents.model`（或個別代理的 `agents.list[].subagents.model`）；明確的 `sessions_spawn.model` 仍會優先。
- **思考：**繼承呼叫端，除非你設定 `agents.defaults.subagents.thinking`（或個別代理的 `agents.list[].subagents.thinking`）；明確的 `sessions_spawn.thinking` 仍會優先。
- **執行逾時：**如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 會在已設定時使用 `agents.defaults.subagents.runTimeoutSeconds`；否則退回 `0`（無逾時）。

### 工具參數

<ParamField path="task" type="string" required>
  子代理的工作說明。
</ParamField>
<ParamField path="label" type="string">
  選用的人類可讀標籤。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允許時，於另一個代理 id 底下產生。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 僅適用於外部 ACP 控制程式（`claude`、`droid`、`gemini`、`opencode`，或明確要求的 Codex ACP/acpx），以及 `runtime.type` 為 `acp` 的 `agents.list[]` 項目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  僅限 ACP。當 `runtime: "acp"` 時恢復現有 ACP 控制程式工作階段；原生子代理產生會忽略此項。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  僅限 ACP。當 `runtime: "acp"` 時，將 ACP 執行輸出串流到父工作階段；原生子代理產生請省略。
</ParamField>
<ParamField path="model" type="string">
  覆寫子代理模型。無效值會被略過，子代理會在預設模型上執行，並在工具結果中附上警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆寫子代理執行的思考層級。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  已設定時預設為 `agents.defaults.subagents.runTimeoutSeconds`，否則為 `0`。設定後，子代理執行會在 N 秒後中止。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  當為 `true` 時，會為此子代理工作階段要求頻道執行緒繫結。
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
  `fork` 會將請求者目前逐字稿分支到子工作階段。僅限原生子代理。繫結執行緒的產生預設為 `fork`；非執行緒產生預設為 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受頻道傳遞參數（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）。如需傳遞，請從已產生的執行使用 `message`/`sessions_send`。
</Warning>

## 繫結執行緒的工作階段

當頻道啟用執行緒繫結時，子代理可以保持繫結到某個執行緒，讓該執行緒中的後續使用者訊息持續路由到相同的子代理工作階段。

### 支援執行緒的頻道

**Discord** 目前是唯一支援的頻道。它支援持久的繫結執行緒子代理工作階段（`sessions_spawn` 搭配 `thread: true`）、手動執行緒控制（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`），以及配接器金鑰 `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours` 和 `channels.discord.threadBindings.spawnSessions`。

### 快速流程

<Steps>
  <Step title="Spawn">
    `sessions_spawn` 搭配 `thread: true`（並可選擇搭配 `mode: "session"`）。
  </Step>
  <Step title="Bind">
    OpenClaw 會在作用中的頻道中建立執行緒，或將執行緒繫結到該工作階段目標。
  </Step>
  <Step title="Route follow-ups">
    該執行緒中的回覆與後續訊息會路由到已繫結的工作階段。
  </Step>
  <Step title="Inspect timeouts">
    使用 `/session idle` 檢查/更新因閒置而自動取消聚焦的設定，並使用 `/session max-age` 控制硬性上限。
  </Step>
  <Step title="Detach">
    使用 `/unfocus` 手動分離。
  </Step>
</Steps>

### 手動控制

| 指令               | 效果                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 將目前執行緒（或建立一個）綁定到子代理/session 目標                  |
| `/unfocus`         | 移除目前已綁定執行緒的綁定                                           |
| `/agents`          | 列出作用中的執行與綁定狀態（`thread:<id>` 或 `unbound`）             |
| `/session idle`    | 檢查/更新閒置自動解除焦點（僅限已聚焦的綁定執行緒）                 |
| `/session max-age` | 檢查/更新硬性上限（僅限已聚焦的綁定執行緒）                         |

### 設定開關

- **全域預設值：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **頻道覆寫與生成自動綁定鍵** 視配接器而定。請參閱上方的[支援執行緒的頻道](#thread-supporting-channels)。

請參閱[設定參考](/zh-TW/gateway/configuration-reference)與
[斜線指令](/zh-TW/tools/slash-commands)，了解目前的配接器詳細資訊。

### 允許清單

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可透過明確 `agentId` 指定為目標的 agent ID 清單（`["*"]` 允許任何項目）。預設值：僅限請求者 agent。如果你設定了清單，且仍希望請求者能以 `agentId` 生成自身，請在清單中包含請求者 ID。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  當請求者 agent 未設定自己的 `subagents.allowAgents` 時使用的預設目標 agent 允許清單。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選擇設定檔）。每個 agent 的覆寫：`agents.list[].subagents.requireAgentId`。
</ParamField>

如果請求者 session 受沙箱限制，`sessions_spawn` 會拒絕
可能以非沙箱方式執行的目標。

### 探索

使用 `agents_list` 查看哪些 agent ID 目前允許用於
`sessions_spawn`。回應會包含每個列出 agent 的有效
模型與嵌入式執行階段中繼資料，讓呼叫者能區分 Pi、Codex
app-server 與其他已設定的原生執行階段。

### 自動封存

- 子代理 session 會在 `agents.defaults.subagents.archiveAfterMinutes` 之後自動封存（預設 `60`）。
- 封存會使用 `sessions.delete`，並將逐字稿重新命名為 `*.deleted.<timestamp>`（同一資料夾）。
- `cleanup: "delete"` 會在 announce 後立即封存（仍會透過重新命名保留逐字稿）。
- 自動封存是盡力而為；如果 Gateway 重新啟動，待處理的計時器會遺失。
- `runTimeoutSeconds` **不會** 自動封存；它只會停止執行。session 會保留到自動封存為止。
- 自動封存同樣適用於深度 1 與深度 2 的 session。
- 瀏覽器清理與封存清理是分開的：追蹤的瀏覽器分頁/程序會在執行完成時盡力關閉，即使逐字稿/session 記錄仍被保留。

## 巢狀子代理

預設情況下，子代理不能生成自己的子代理
（`maxSpawnDepth: 1`）。設定 `maxSpawnDepth: 2` 可啟用一層
巢狀結構，也就是**協調器模式**：主要 → 協調器子代理 →
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

| 深度 | Session 鍵形狀                                | 角色                                          | 可以生成？                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主要 agent                                    | 一律可以                     |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子代理（允許深度 2 時為協調器）              | 僅當 `maxSpawnDepth >= 2`    |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子代理（葉節點工作者）                     | 永不                         |

### Announce 鏈

結果會沿著鏈往上回傳：

1. 深度 2 工作者完成 → announce 給其父層（深度 1 協調器）。
2. 深度 1 協調器收到 announce、彙整結果並完成 → announce 給主要項目。
3. 主要 agent 收到 announce，並交付給使用者。

每一層只會看到其直接子層的 announce。

<Note>
**操作指引：** 啟動子工作一次，然後等待完成
事件，而不是圍繞 `sessions_list`、
`sessions_history`、`/subagents list` 或 `exec` sleep 指令建立輪詢迴圈。
`sessions_list` 與 `/subagents list` 會讓子 session 關係
聚焦在即時工作上：即時子項會保持附加，已結束子項會在短暫的近期視窗中保持
可見，而過期的僅儲存子連結會在其新鮮度視窗後被
忽略。這可防止舊的 `spawnedBy` /
`parentSessionKey` 中繼資料在
重新啟動後重新喚回幽靈子項。如果子項完成事件在你已送出
最終答案後才抵達，正確的後續動作是精確的靜默 token
`NO_REPLY` / `no_reply`。
</Note>

### 依深度區分的工具政策

- 角色與控制範圍會在生成時寫入 session 中繼資料。這可避免扁平或還原的 session 鍵意外重新取得協調器權限。
- **深度 1（協調器，當 `maxSpawnDepth >= 2`）：** 取得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子項。其他 session/系統工具仍會被拒絕。
- **深度 1（葉節點，當 `maxSpawnDepth == 1`）：** 沒有 session 工具（目前的預設行為）。
- **深度 2（葉節點工作者）：** 沒有 session 工具，`sessions_spawn` 在深度 2 一律會被拒絕。無法再生成更多子項。

### 每個 agent 的生成限制

每個 agent session（任何深度）一次最多可以有 `maxChildrenPerAgent`
個作用中子項（預設 `5`）。這可防止單一協調器造成失控扇出。

### 級聯停止

停止深度 1 協調器會自動停止其所有深度 2
子項：

- 主要聊天中的 `/stop` 會停止所有深度 1 agent，並級聯到其深度 2 子項。
- `/subagents kill <id>` 會停止特定子代理，並級聯到其子項。
- `/subagents kill all` 會停止請求者的所有子代理並級聯。

## 驗證

子代理驗證是依 **agent ID** 解析，而不是依 session 類型：

- 子代理 session 鍵為 `agent:<agentId>:subagent:<uuid>`。
- 驗證儲存會從該 agent 的 `agentDir` 載入。
- 主要 agent 的驗證設定檔會合併為**備援**；發生衝突時，agent 設定檔會覆寫主要設定檔。

合併是加成式的，因此主要設定檔一律可作為
備援使用。尚不支援每個 agent 完全隔離的驗證。

## Announce

子代理會透過 announce 步驟回報：

- announce 步驟在子代理 session 內執行（不是請求者 session）。
- 如果子代理精確回覆 `ANNOUNCE_SKIP`，則不會張貼任何內容。
- 如果最新的 assistant 文字是精確的靜默 token `NO_REPLY` / `no_reply`，即使先前存在可見進度，也會抑制 announce 輸出。

交付取決於請求者深度：

- 頂層請求者 session 會使用帶有外部交付的後續 `agent` 呼叫（`deliver=true`）。
- 巢狀請求者 subagent session 會收到內部後續注入（`deliver=false`），讓協調器能在 session 內彙整子項結果。
- 如果巢狀請求者 subagent session 已不存在，OpenClaw 會在可用時退回到該 session 的請求者。

對於頂層請求者 session，完成模式的直接交付會先
解析任何已綁定的對話/執行緒路由與 hook 覆寫，然後從
請求者 session 儲存的路由填入缺少的頻道目標欄位。
這可確保完成結果留在正確的聊天/主題中，即使完成
來源只識別了頻道。

建立巢狀完成發現項目時，子項完成彙總會限定在目前請求者執行範圍內，
防止過去執行的過期子項
輸出洩漏到目前 announce。當頻道配接器可用時，announce 回覆會保留
執行緒/主題路由。

### Announce 內容脈絡

Announce 內容脈絡會正規化為穩定的內部事件區塊：

| 欄位         | 來源                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| 來源           | `subagent` 或 `cron`                                                                                          |
| Session ID     | 子 session 鍵/ID                                                                                              |
| 類型           | Announce 類型 + 任務標籤                                                                                      |
| 狀態           | 從執行階段結果衍生（`success`、`error`、`timeout` 或 `unknown`）— **不是** 從模型文字推斷 |
| 結果內容       | 最新可見的 assistant 文字，否則為已清理的最新 tool/toolResult 文字                                           |
| 後續動作       | 描述何時回覆與何時保持靜默的指示                                                                             |

終端失敗執行會回報失敗狀態，而不重播擷取到的
回覆文字。逾時時，如果子項只完成了工具呼叫，announce
可以將該歷史壓縮成簡短的部分進度摘要，而不是
重播原始工具輸出。

### 統計列

Announce 承載內容會在結尾包含統計列（即使被包裝時也是如此）：

- 執行階段（例如 `runtime 5m12s`）。
- Token 使用量（輸入/輸出/總計）。
- 設定模型定價時的估計成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 與逐字稿路徑，讓主要 agent 能透過 `sessions_history` 擷取歷史，或檢查磁碟上的檔案。

內部中繼資料僅用於協調；面向使用者的回覆
應以一般 assistant 語氣重寫。

### 為何偏好 `sessions_history`

`sessions_history` 是較安全的協調路徑：

- Assistant 回憶會先正規化：移除 thinking 標籤；移除 `<relevant-memories>` / `<relevant_memories>` 腳手架；移除純文字工具呼叫 XML 承載區塊（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`），包括從未乾淨關閉的截斷承載；移除降級的工具呼叫/結果腳手架與歷史脈絡標記；移除洩漏的模型控制 token（`<|assistant|>`、其他 ASCII `<|...|>`、全形 `<｜...｜>`）；移除格式錯誤的 MiniMax 工具呼叫 XML。
- 類似憑證/token 的文字會被遮蔽。
- 長區塊可以被截斷。
- 非常大的歷史可以丟棄較舊的列，或用 `[sessions_history omitted: message too large]` 取代過大的列。
- 當你需要完整逐位元組一致的逐字稿時，原始磁碟逐字稿檢查是備援方式。

## 工具政策

子代理會先使用與父層或目標 agent 相同的設定檔與工具政策
管線。之後，OpenClaw 會套用子代理限制
層。

在沒有具限制性的 `tools.profile` 時，子代理會取得**除了
session 工具**與系統工具以外的**所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` 在這裡也仍是有界且已清理的回憶視圖，
不是原始逐字稿傾印。

當 `maxSpawnDepth >= 2` 時，深度 1 協調器子代理會額外
收到 `sessions_spawn`、`subagents`、`sessions_list` 與
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
已解析的工具集，但無法**加回**已被 `tools.profile` 移除的工具。
例如，`tools.profile: "coding"` 包含 `web_search`/`web_fetch`，
但不包含 `browser` 工具。若要讓 coding-profile 子代理使用瀏覽器自動化，
請在設定檔階段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

當只有一個代理應取得瀏覽器自動化能力時，請使用每代理的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 並行

子代理使用專用的進程內佇列通道：

- **通道名稱：** `subagent`
- **並行數：** `agents.defaults.subagents.maxConcurrent`（預設為 `8`）

## 活性與復原

OpenClaw 不會將缺少 `endedAt` 視為子代理仍然存活的永久證明。
早於過時執行時間窗的未結束執行，不再於 `/subagents list`、狀態摘要、
後代完成閘控，以及每工作階段並行檢查中計為作用中/待處理。

Gateway 重新啟動後，過時且未結束的已還原執行會被修剪，除非其子工作階段
標記為 `abortedLastRun: true`。這些因重新啟動而中止的子工作階段仍可透過
子代理孤立復原流程恢復；該流程會先傳送合成的恢復訊息，再清除中止標記。

自動重新啟動復原會按每個子工作階段設限。若同一個子代理子項在快速重新卡住
時間窗內反覆被接受進行孤立復原，OpenClaw 會在該工作階段上持久化復原墓碑，
並在後續重新啟動時停止自動恢復它。執行 `openclaw tasks maintenance --apply`
以協調任務記錄，或執行 `openclaw doctor --fix` 以清除墓碑工作階段上過時的
中止復原旗標。

<Note>
如果子代理生成因 Gateway `PAIRING_REQUIRED` / `scope-upgrade` 而失敗，
請先檢查 RPC 呼叫端，再編輯配對狀態。內部 `sessions_spawn` 協調應以
`client.id: "gateway-client"` 搭配 `client.mode: "backend"`，透過直接
loopback 共享 token/密碼驗證進行連線；該路徑不依賴 CLI 的已配對裝置範圍基準。
遠端呼叫端、明確的 `deviceIdentity`、明確的裝置 token 路徑，以及瀏覽器/node
用戶端仍需一般裝置核准才能進行範圍升級。
</Note>

## 停止

- 在請求者聊天中傳送 `/stop` 會中止請求者工作階段，並停止由其生成的任何作用中子代理執行，連鎖套用至巢狀子項。
- `/subagents kill <id>` 會停止指定的子代理，並連鎖停止其子項。

## 限制

- 子代理公告是**盡力而為**。如果 gateway 重新啟動，待處理的「公告回傳」工作會遺失。
- 子代理仍共用相同的 gateway 行程資源；請將 `maxConcurrent` 視為安全閥。
- `sessions_spawn` 一律為非阻塞：它會立即回傳 `{ status: "accepted", runId, childSessionKey }`。
- 子代理內容脈絡只注入 `AGENTS.md` + `TOOLS.md`（沒有 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大巢狀深度為 5（`maxSpawnDepth` 範圍：1–5）。大多數使用案例建議使用深度 2。
- `maxChildrenPerAgent` 限制每個工作階段的作用中子項數量（預設 `5`，範圍 `1–20`）。

## 相關

- [ACP 代理](/zh-TW/tools/acp-agents)
- [代理傳送](/zh-TW/tools/agent-send)
- [背景任務](/zh-TW/automation/tasks)
- [多代理沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
