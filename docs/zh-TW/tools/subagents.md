---
read_when:
    - 你想透過代理程式執行背景或平行工作
    - 你正在變更 `sessions_spawn` 或子代理工具政策
    - 你正在實作或疑難排解綁定討論串的子代理工作階段
sidebarTitle: Sub-agents
summary: 啟動隔離的背景代理程式執行，並將結果回報至請求者的聊天對話中
title: 子代理程式
x-i18n:
    generated_at: "2026-07-20T00:56:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c8f63a6c1cd6a34f9bae067bbd63d1e3c8223beffb52f06b6689f161c8f9a1ce
    source_path: tools/subagents.md
    workflow: 16
---

子代理是從現有代理執行中產生的背景代理執行。
每個子代理都在自己的工作階段（`agent:<agentId>:subagent:<uuid>`）中執行，並且
完成後會將結果**通知**回請求者的聊天頻道。
每次子代理執行都會追蹤為一個[背景任務](/zh-TW/automation/tasks)。

目標：

- 平行處理研究、長時間任務和耗時的工具工作，而不阻塞主要執行。
- 預設隔離子代理（工作階段分離，可選擇使用沙箱）。
- 讓工具介面不易被誤用：子代理預設**不會**取得工作階段或訊息工具。
- 支援可設定的巢狀深度，以用於協調器模式。

<Note>
**成本注意事項：**每個子代理預設都有自己的上下文和權杖用量。
對於繁重或重複性任務，請為子代理設定成本較低的模型，
並透過 `agents.defaults.subagents.model` 或個別代理覆寫，讓主要代理繼續使用品質較高的模型。
當子代理確實需要請求者目前的逐字稿時，請使用
`context: "fork"` 產生它。繫結至討論串的子代理工作階段預設為
`context: "fork"`，因為它們會將目前對話分支至後續討論串。
</Note>

## 斜線命令

`/subagents` 會檢查**目前工作階段**的子代理執行：

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` 會顯示執行中繼資料（狀態、時間戳記、工作階段 ID、
逐字稿路徑、清理）。`/subagents log` 會輸出某次執行最近的聊天輪次；
加入 `tools` 權杖即可包含工具呼叫／結果訊息（預設省略）。
在代理輪次中，使用 `sessions_history` 可取得有範圍限制且經過安全篩選的回顧檢視；
若要查看原始完整逐字稿，請檢查磁碟上的逐字稿路徑。

在控制介面中，最近有子執行的父工作階段會顯示可展開的
側邊欄列。巢狀列會顯示子代理的狀態與執行時間，選取其中一列
會開啟該子代理的聊天，同時保留父層階層。

### 討論串繫結控制

這些命令適用於具有持久討論串繫結的頻道。請參閱下方的
[支援討論串的頻道](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 產生行為

代理會使用 `sessions_spawn` 工具啟動背景子代理。
完成結果會以父工作階段內部事件的形式傳回；父代理／請求者代理
會決定是否需要向使用者顯示更新。

<AccordionGroup>
  <Accordion title="非阻塞、推送式完成">
    - `sessions_spawn` 為非阻塞；它會立即傳回執行 ID。
    - 完成時，子代理會向父工作階段／請求者工作階段回報。
    - 需要子代理結果的代理輪次，應在產生必要工作後呼叫 `sessions_yield`。這會結束目前輪次，並讓完成事件成為模型下一則可見訊息。
    - 完成採用推送方式。產生後，**不要**為了等待完成而在迴圈中輪詢 `/subagents list`、`sessions_list` 或 `sessions_history`；只有在偵錯時才視需要檢查狀態。
    - 子代理輸出是供請求者代理彙整的報告／證據。它不是使用者撰寫的指示文字，且無法覆寫系統、開發者或使用者政策。
    - 完成時，OpenClaw 會盡力關閉該子代理工作階段所開啟且受追蹤的瀏覽器分頁／程序，之後才繼續執行通知清理流程。

  </Accordion>
  <Accordion title="完成結果傳遞">
    - OpenClaw 會透過具有穩定冪等鍵的 `agent` 輪次，將完成結果交回請求者工作階段。
    - 如果請求者執行仍在進行中，OpenClaw 會先嘗試喚醒／引導該執行，而不是啟動第二條可見回覆路徑。
    - 如果無法喚醒進行中的請求者，OpenClaw 會改為使用相同的完成上下文交接給請求者代理，而不是捨棄通知。
    - 即使父代理決定不需要向使用者顯示更新，成功的父代理交接仍會完成子代理傳遞。
    - 原生子代理不會取得訊息工具。它們會將純助理文字傳回父代理／請求者代理；人類可見的回覆仍由父代理／請求者代理的一般傳遞政策負責。
    - 如果無法直接交接，傳遞會改用佇列路由，接著對通知進行短暫的指數退避重試，最後才放棄。
    - 傳遞會保留已解析的請求者路由：若有可用路由，以繫結至討論串或對話的完成路由優先。如果完成來源只提供頻道，OpenClaw 會從請求者工作階段的已解析路由（`lastChannel` / `lastTo` / `lastAccountId`）補上缺少的目標／帳號，讓直接傳遞仍可運作。

  </Accordion>
  <Accordion title="完成交接中繼資料">
    傳遞給請求者工作階段的完成交接是執行階段產生的
    內部上下文（並非使用者撰寫的文字），其中包含：

    - `Result` — 子代理最新可見的 `assistant` 回覆文字。tool/toolResult 輸出不會提升為子代理結果。以失敗告終的執行不會重複使用已擷取的回覆文字。
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`。
    - 精簡的執行階段／權杖統計資料。
    - 一項審查指示，要求請求者代理先驗證結果，再決定原始任務是否完成。
    - 一項後續指引，要求請求者代理在子代理結果仍需進一步處理時，繼續執行任務或記錄後續工作。
    - 一項用於無需進一步處理路徑的最終更新指示，以一般助理語氣撰寫，不會轉送原始內部中繼資料。

  </Accordion>
  <Accordion title="模式與 ACP 執行階段">
    - `--model` 和 `--thinking` 會覆寫該次特定執行的預設值。
    - 完成後，使用 `info`/`log` 檢查詳細資料與輸出。
    - 對於繫結至持久討論串的工作階段，請搭配 `thread: true` 和 `mode: "session"` 使用 `sessions_spawn`。
    - 如果請求者頻道不支援討論串繫結，請使用 `mode: "run"`，不要重試不可能成功的討論串繫結組合。
    - 對於 ACP 控制框架工作階段（Claude Code、Gemini CLI、OpenCode，或明確指定的 Codex ACP/acpx），當工具宣告支援該執行階段時，請搭配 `runtime: "acp"` 使用 `sessions_spawn`。偵錯完成結果或代理間迴圈時，請參閱 [ACP 傳遞模型](/zh-TW/tools/acp-agents#delivery-model)。啟用 `codex` 外掛時，除非使用者明確要求 ACP/acpx，否則 Codex 聊天／討論串控制應優先使用 `/codex ...`，而非 ACP。
    - 在啟用 ACP、請求者未使用沙箱，且已載入 `acpx` 等後端外掛之前，OpenClaw 會隱藏 `runtime: "acp"`。`runtime: "acp"` 需要外部 ACP 控制框架 ID，或包含 `runtime.type="acp"` 的 `agents.list[]` 項目；對於來自 `agents_list` 的一般 OpenClaw 設定代理，請使用預設子代理執行階段。

  </Accordion>
</AccordionGroup>

## 上下文模式

除非呼叫者明確要求分支目前的逐字稿，否則原生子代理會以隔離方式啟動。

| 模式       | 使用時機                                                                                                                         | 行為                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 全新研究、獨立實作、耗時的工具工作，或任何可在任務文字中簡要說明的工作                           | 建立乾淨的子代理逐字稿。這是預設值，可降低權杖用量。  |
| `fork`     | 依賴目前對話、先前工具結果，或請求者逐字稿中既有細微指示的工作 | 在子代理啟動前，將請求者逐字稿分支至子代理工作階段。 |

請謹慎使用 `fork`。它適用於需要上下文的委派，不是撰寫清楚任務提示的
替代方式。

## 工具：`sessions_spawn`

在全域 `subagent` 執行通道上使用 `deliver: false` 啟動子代理執行，
接著執行通知步驟，並將通知回覆發佈到請求者的
聊天頻道。

是否可用取決於呼叫者的有效工具政策。內建的
`coding` 和 `messaging` 設定檔包含 `sessions_spawn`、
`sessions_yield` 和 `subagents`；`minimal` 則不包含。`full` 允許使用所有
工具。若使用自訂且較嚴格的設定檔，但仍希望代理能夠
委派工作，請透過 `tools.alsoAllow` 加入這些工具，或使用上述任一設定檔。
頻道／群組、供應商、沙箱和個別代理允許／拒絕政策，
仍可在設定檔階段後移除工具。請從相同工作階段使用 `/tools`
確認有效工具清單。

**預設值：**

- **模型：**除非設定 `agents.defaults.subagents.model`（或個別代理的 `agents.list[].subagents.model`），否則原生子代理會繼承呼叫者。ACP 執行階段產生作業若有設定子代理模型，也會使用相同模型；否則 ACP 控制框架會保留自己的預設值。明確指定的 `sessions_spawn.model` 仍具有最高優先權。
- **思考：**除非設定 `agents.defaults.subagents.thinking`（或個別代理的 `agents.list[].subagents.thinking`），否則原生子代理會繼承呼叫者。ACP 執行階段產生作業也會將 `agents.defaults.models["provider/model"].params.thinking` 套用到所選模型。明確指定的 `sessions_spawn.thinking` 仍具有最高優先權。
- **執行逾時：**若已設定 `agents.defaults.subagents.runTimeoutSeconds`，OpenClaw 會使用該值；否則會退回 `0`（無逾時）。`sessions_spawn` 不接受個別呼叫的逾時覆寫。
- **程序生命週期：**分離的 OpenClaw 子代理具有自己的執行生命週期。在外部命令列介面後端內建立的背景任務則不同：它會共用父命令列介面子程序，並在父程序到達 `agents.defaults.timeoutSeconds` 時停止。
- **任務傳遞：**原生子代理會在第一則可見的 `[Subagent Task]` 訊息中收到委派任務。子代理系統提示包含執行階段規則和路由上下文，而不是隱藏的任務副本。

已接受的原生子代理產生作業，會在工具結果中包含已解析的子代理模型中繼資料：
`resolvedModel` 包含已套用的模型參照，
而當該參照具有供應商前綴時，`resolvedProvider` 會包含該前綴。

### 委派提示模式

`agents.defaults.subagents.delegationMode` 只控制提示指引；它不會變更工具政策，也不會強制委派。

- `suggest`（預設）：保留標準提示，建議對較大型或耗時的工作使用子代理。
- `prefer`：指示主要代理保持回應能力，並透過 `sessions_spawn` 委派任何比直接回覆更複雜的工作。

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
  子代理的任務描述。
</ParamField>
<ParamField path="taskName" type="string">
  選用的穩定代稱，用於在後續狀態輸出中識別特定子項。必須符合 `[a-z][a-z0-9_-]{0,63}`，且不得為 `last` 或 `all` 等保留目標。
</ParamField>
<ParamField path="label" type="string">
  選用的易讀標籤。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允許時，於另一個已設定的代理 ID 下產生。
</ParamField>
<ParamField path="cwd" type="string">
  子項執行時選用的任務工作目錄。原生子代理仍會從目標代理工作區載入啟動檔案；`cwd` 僅會變更執行階段工具與命令列介面控管器執行委派工作的所在位置。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 僅適用於外部 ACP 控管器（`claude`、`droid`、`gemini`、`opencode`，或明確要求的 Codex ACP/acpx），以及 `agents.list[]` 中其 `runtime.type` 為 `acp` 的項目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  僅限 ACP。當 `runtime: "acp"` 時繼續既有的 ACP 控管器工作階段；原生子代理產生時會忽略此項。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  僅限 ACP。當 `runtime: "acp"` 時，將 ACP 執行輸出串流至父工作階段；原生子代理產生時請省略。
</ParamField>
<ParamField path="model" type="string">
  覆寫子代理模型。無效值會被略過，子代理將使用預設模型執行，並在工具結果中顯示警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆寫子代理執行的思考層級。搭配 `visible: true` 時無法使用。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  當 `true` 時，要求將此子代理工作階段繫結至頻道討論串。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  若為 `thread: true` 且省略 `mode`，預設值會變為 `session`。`mode: "session"` 需要 `thread: true`。
  若要求方頻道無法使用討論串繫結，請改用 `mode: "run"`。
  搭配 `visible: true` 時，請省略 `mode`；可見工作階段為持續性工作階段，不支援 `mode: "run"`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 會在宣告後立即封存工作階段（仍會透過重新命名保留轉錄記錄）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  除非目標子項執行階段已沙箱化，否則 `require` 會拒絕產生。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 會將要求方目前的轉錄記錄分支至子工作階段。僅限原生子代理。繫結討論串的產生作業預設為 `fork`；未繫結討論串的產生作業預設為 `isolated`。可見分支必須以與要求方相同的代理為目標。
</ParamField>
<ParamField path="visible" type="boolean" default="false">
  建立使用者可在 Control UI 中開啟的持續性儀表板工作階段。可見產生作業僅支援 `runtime: "subagent"`，且一律保留所建立的工作階段。
</ParamField>
<ParamField path="worktree" type="boolean" default="false">
  為新的儀表板工作階段佈建受管理的 git 工作樹。需要 `visible: true`。
</ParamField>
<ParamField path="worktreeName" type="string">
  選用的受管理工作樹名稱。需要 `visible: true` 和 `worktree: true`。
</ParamField>
<ParamField path="worktreeBaseRef" type="string">
  受管理工作樹選用的 git 基底參照。需要 `visible: true` 和 `worktree: true`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受頻道傳遞參數（`target`、
`channel`、`to`、`threadId`、`replyTo`、`transport`）。原生子代理會將
其最新的助理回合回報給要求方；外部傳遞仍由
父代理／要求方代理負責。
</Warning>

支援 `visible: true`、`model`、`cwd`，以及相同代理的 `context: "fork"`。沙箱化目標會將 `cwd` 限制在該代理的工作區內。此路徑無法使用討論串繫結、`mode`、思考覆寫、`lightContext`、`attachments` 和 `attachAs`，因為可見工作階段是透過 `sessions.create` 建立的持續性儀表板工作階段。如果要求方本身是以繼承的工具允許清單或拒絕清單產生，則會拒絕可見產生作業；此限制在產生時即固定，沒有任何設定可覆寫。工作階段的列出與定址遵循 `tools.sessions.visibility`；預設的 `tree` 範圍涵蓋目前工作階段及其自身的產生子樹。如需瞭解簽出命名、設定、清理與還原行為，請參閱[受管理的工作樹](/zh-TW/concepts/managed-worktrees)。

### 任務名稱與目標指定

`taskName` 是供模型協調使用的代稱，而非工作階段金鑰。
當協調器之後可能需要檢查該子項時，請將其用於 `review_subagents`、
`linux_validation` 或 `docs_update` 等穩定子項名稱。

目標解析接受完全相符的 `taskName` 和無歧義的
前綴。比對範圍限定於編號 `/subagents` 目標所使用的相同
作用中／近期目標時窗，因此過期且已完成的子項不會讓
重複使用的代稱產生歧義。如果兩個作用中或近期子項共用相同的
`taskName`，目標便會產生歧義；請改用清單索引、工作階段金鑰或
執行 ID。

保留目標 `last` 和 `all` 不是有效的 `taskName` 值，
因為它們已有控制用途。

## 工具：`sessions_yield`

結束目前的模型回合並等待執行階段事件（主要為
子代理完成事件）作為下一則訊息送達。當必要的子項工作已產生，
但要求方必須等到這些工作完成後才能產生最終
答案時，請使用此工具。

`sessions_yield` 是等待原語。請勿僅為偵測子項完成，
就以輪詢 `subagents`、`sessions_list`、`sessions_history`、shell
`sleep` 或處理程序的迴圈取代它。

僅當工作階段的有效工具清單包含
`sessions_yield` 時才使用它。某些最小化或自訂工具設定檔可能會公開 `sessions_spawn` 和
`subagents`，但不公開 `sessions_yield`；在這種情況下，請勿自行建立
輪詢迴圈來等待完成。

當存在作用中子項時，OpenClaw 會在一般回合中注入精簡的執行階段產生
`Active Subagents` 提示區塊，讓要求方無須輪詢即可查看
目前的子工作階段、執行 ID、狀態、標籤、任務，以及
`taskName` 別名。該區塊中的任務與標籤欄位會以資料形式加上引號，
而非當作指示，因為它們可能源自使用者／模型提供的產生引數。

## 工具：`subagents`

列出由要求方工作階段樹所擁有的已產生子代理執行與背景任務記錄。
任務資料列涵蓋原生子代理、ACP 執行、
閘道命令列介面／媒體工作，以及排程執行。其範圍限定於目前的
要求方；子項只能看到自己控制的子項。

使用 `subagents` 進行隨選狀態查詢與偵錯。使用 `sessions_yield`
等待完成事件。

搭配 `action: "list"` 傳回的 `taskId` 使用 `action: "cancel"`，以停止
任務。取消操作僅限於受控制的工作階段樹；末端
子代理無法取消由其他工作階段擁有的工作。

## 繫結討論串的工作階段

當頻道已啟用討論串繫結時，子代理可持續繫結至
討論串，讓該討論串中的後續使用者訊息繼續路由至
同一個子代理工作階段。

### 支援討論串的頻道

當頻道註冊對話
繫結配接器時，即支援持續性討論串繫結子代理工作階段
（`sessions_spawn` 搭配 `thread: true`）。內建且支援此功能的頻道：**Discord**、
**iMessage**、**Matrix** 和 **Telegram**。Discord 和 Matrix 預設會
建立子討論串；Telegram 和 iMessage 預設會繫結
目前對話。使用各頻道的 `threadBindings` 設定鍵來控制
啟用、逾時和 `spawnSessions`。

### 快速流程

<Steps>
  <Step title="產生">
    `sessions_spawn` 搭配 `thread: true`（並可選擇搭配 `mode: "session"`）。
  </Step>
  <Step title="繫結">
    OpenClaw 會在作用中的頻道內建立討論串或將討論串繫結至該工作階段目標。
  </Step>
  <Step title="路由後續訊息">
    該討論串中的回覆與後續訊息會路由至已繫結的工作階段。
  </Step>
  <Step title="檢查逾時">
    使用 `/session idle` 檢查／更新閒置時自動取消聚焦，並使用
    `/session max-age` 控制硬性上限。
  </Step>
  <Step title="解除連結">
    使用 `/unfocus` 手動解除連結。
  </Step>
</Steps>

### 手動控制

| 命令            | 效果                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | 將目前討論串（或建立一個討論串）繫結至子代理／工作階段目標                     |
| `/unfocus`         | 移除目前已繫結討論串的繫結                                           |
| `/agents`          | 列出作用中執行與繫結狀態（`binding:<id>`、`unbound` 或 `bindings unavailable`） |
| `/session idle`    | 檢查／更新閒置時自動取消聚焦（僅限已聚焦的繫結討論串）                             |
| `/session max-age` | 檢查／更新硬性上限（僅限已聚焦的繫結討論串）                                      |

### 設定開關

- **全域預設值：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **頻道覆寫與產生時自動繫結的設定鍵**依配接器而異。請參閱上方的[支援討論串的頻道](#thread-supporting-channels)。

如需目前的配接器詳細資訊，請參閱[設定參考](/zh-TW/gateway/configuration-reference)和
[斜線命令](/zh-TW/tools/slash-commands)。

### 允許清單

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可透過明確的 `agentId` 指定為目標的已設定代理 ID 清單（`["*"]` 允許任何已設定的目標）。預設：僅限要求方代理。如果設定了清單，但仍希望要求方能使用 `agentId` 產生自身，請將要求方 ID 納入清單。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  當要求方代理未設定自己的 `subagents.allowAgents` 時所使用的預設已設定目標代理允許清單。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選擇設定檔）。個別代理覆寫：`agents.list[].subagents.requireAgentId`。
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  閘道 `agent` 宣告傳遞嘗試的每次呼叫逾時。值須為正整數毫秒，且會限制在平台安全的計時器上限內。暫時性重試可能使宣告的總等待時間超過單次設定的逾時。
</ParamField>

如果要求方工作階段已沙箱化，`sessions_spawn` 會拒絕
將以非沙箱化方式執行的目標。

### 探索

使用 `agents_list` 查看目前允許哪些代理程式 ID 用於
`sessions_spawn`。回應包含每個列出代理程式的有效
模型及內嵌執行階段中繼資料，讓呼叫端能區分 OpenClaw、Codex
app-server，以及其他已設定的原生執行階段。

`allowAgents` 項目必須指向 `agents.list[]` 中已設定的代理程式 ID。
`["*"]` 表示任何已設定的目標代理程式加上請求者。如果代理程式設定
已刪除，但其 ID 仍保留在 `allowAgents` 中，`sessions_spawn` 會拒絕該 ID，
而 `agents_list` 會將其省略。執行 `openclaw doctor --fix` 以清除過時的
允許清單項目；若目標應在繼承預設值的同時維持可生成狀態，則新增最小化的 `agents.list[]` 項目。

### 自動封存

- 子代理程式工作階段會在 `agents.defaults.subagents.archiveAfterMinutes` 後自動封存（預設為 `60`）。
- 封存會使用 `sessions.delete`，並將逐字稿重新命名為 `*.deleted.<timestamp>`（位於相同資料夾）。
- `cleanup: "delete"` 會在公告後立即封存（仍會透過重新命名保留逐字稿）。
- 自動封存採盡力而為；若閘道重新啟動，待處理的計時器將會遺失。
- 已設定的執行逾時**不會**自動封存；它們只會停止執行。工作階段會保留到自動封存為止。
- 自動封存同樣適用於深度 1 和深度 2 的工作階段。
- 瀏覽器清理與封存清理互相獨立：執行結束時，系統會盡力關閉受追蹤的瀏覽器分頁／程序，即使逐字稿／工作階段記錄仍予以保留。

## 巢狀子代理程式

依預設，子代理程式無法生成自己的子代理程式
（`maxSpawnDepth: 1`）。將 `maxSpawnDepth: 2` 設定為啟用一層
巢狀結構，即**協調器模式**：主要代理程式 → 協調器子代理程式 →
工作者子子代理程式。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允許子代理程式生成子代理程式（預設：1，範圍 1-5）
        maxChildrenPerAgent: 5, // 每個代理程式工作階段的作用中子代理程式數量上限（預設：5，範圍 1-20）
        maxConcurrent: 8, // 全域並行通道上限（預設：8）
        runTimeoutSeconds: 900, // sessions_spawn 的預設工作階段逾時（0 = 不逾時）
        announceTimeoutMs: 120000, // 每次呼叫的閘道公告逾時
      },
    },
  },
}
```

### 深度層級

| 深度 | 工作階段金鑰格式                            | 角色                                          | 可以生成嗎？                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 主要代理程式                                    | 一律可以                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | 子代理程式（允許深度 2 時為協調器） | 僅限 `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子代理程式（葉節點工作者）                   | 永不可以                        |

### 公告鏈

結果會沿鏈向上傳遞：

1. 深度 2 工作者完成 → 向其父項（深度 1 協調器）公告。
2. 深度 1 協調器收到公告、綜整結果並完成 → 向主要代理程式公告。
3. 主要代理程式收到公告並傳送給使用者。

每個層級只會看到其直接子項的公告。

<Note>
**操作指南：**子項工作只需啟動一次，然後等待完成
事件，而不要圍繞 `sessions_list`、
`sessions_history`、`/subagents list` 或 `exec` 睡眠命令建立輪詢迴圈。
`sessions_list` 和 `/subagents list` 會讓子工作階段關係
專注於目前進行中的工作——作用中的子項會保持附加，已結束的子項會在
短暫的近期視窗內保持可見，而僅存在於儲存區的過時子項連結
會在超過其有效期視窗後被忽略。這可防止舊的 `spawnedBy` /
`parentSessionKey` 中繼資料在重新啟動後讓幽靈子項重新出現。
如果子項完成事件在你已傳送最終答案後才抵達，正確的後續回應是完全一致的靜默權杖
`NO_REPLY` / `no_reply`。
</Note>

### 依深度區分的工具政策

- 生成時會將角色與控制範圍寫入工作階段中繼資料。這可避免扁平化或還原後的工作階段金鑰意外重新取得協調器權限。
- **深度 1（協調器，當 `maxSpawnDepth >= 2` 時）：**可取得 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便生成子項並檢查其狀態。其他工作階段／系統工具仍會被拒絕。
- **深度 1（葉節點，當 `maxSpawnDepth == 1` 時）：**沒有工作階段工具（目前的預設行為）。
- **深度 2（葉節點工作者）：**沒有工作階段工具——在深度 2 時，一律拒絕 `sessions_spawn`。無法繼續生成子項。

### 每個代理程式的生成上限

每個代理程式工作階段（無論深度為何）同時最多可以有 `maxChildrenPerAgent`
個（預設為 `5`）作用中子項。這可避免單一協調器不受控制地扇出。

### 串聯停止

停止深度 1 協調器時，會自動停止其所有深度 2
子項：

- 主要聊天中的 `/stop` 會停止所有深度 1 代理程式，並連帶停止其深度 2 子項。

## 驗證

子代理程式的驗證會依**代理程式 ID**解析，而非依工作階段類型：

- 子代理程式工作階段金鑰為 `agent:<agentId>:subagent:<uuid>`。
- 驗證儲存區會從該代理程式的 `agentDir` 載入。
- 主要代理程式的驗證設定檔會合併作為**後援**；發生衝突時，代理程式設定檔會覆寫主要代理程式設定檔。

此合併為附加式，因此主要代理程式的設定檔一律可作為
後援。目前尚不支援每個代理程式完全隔離的驗證。

## 公告

子代理程式會透過公告步驟回報：

- 公告步驟會在子代理程式工作階段內執行（而非請求者工作階段）。
- 如果子代理程式的回覆完全等於 `ANNOUNCE_SKIP`，則不會發布任何內容。
- 如果最新的助理文字是完全一致的靜默權杖 `NO_REPLY` / `no_reply`，即使先前已有可見的進度，公告輸出仍會受到抑制。

傳送方式取決於請求者深度：

- 頂層請求者工作階段會使用後續的 `agent` 呼叫，並進行外部傳送（`deliver=true`）。
- 巢狀請求者子代理程式工作階段會收到內部後續注入（`deliver=false`），讓協調器可在工作階段內綜整子項結果。
- 如果巢狀請求者子代理程式工作階段已不存在，OpenClaw 會在可用時改用該工作階段的請求者。

對於頂層請求者工作階段，完成模式的直接傳送會先
解析任何已繫結的對話／討論串路由與鉤子覆寫，然後從請求者工作階段儲存的路由
填入缺少的頻道目標欄位。
即使完成來源僅識別出頻道，也能讓完成結果維持在正確的聊天／主題中。

建立巢狀完成結果時，子項完成彙總僅限於目前的請求者執行，
可防止先前執行的過時子項輸出洩漏到目前公告中。頻道轉接器有提供時，
公告回覆會保留討論串／主題路由。

### 公告內容

公告內容會正規化為穩定的內部事件區塊：

| 欄位          | 來源                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| 來源         | `subagent` 或 `cron`                                                                                     |
| 工作階段 ID    | 子工作階段金鑰／ID                                                                                     |
| 類型           | 公告類型 + 任務標籤                                                                               |
| 狀態         | 衍生自執行階段結果（`ok`、`error`、`timeout` 或 `unknown`）——**不會**根據模型文字推斷 |
| 結果內容 | 子項最新可見的助理文字                                                             |
| 後續動作      | 說明何時應回覆或保持靜默的指示                                                      |

以失敗狀態結束的執行會回報失敗狀態，而不會重播擷取的
回覆文字。工具／toolResult 輸出不會提升為子項結果文字。

### 統計資料行

公告承載內容最後會包含統計資料行（即使經過包裝）：

- 執行時間（例如 `runtime 5m12s`）。
- 權杖用量（輸入／輸出／總計）。
- 已設定模型定價時的預估成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 和逐字稿路徑，讓主要代理程式可透過 `sessions_history` 擷取歷程記錄，或檢查磁碟上的檔案。

內部中繼資料僅供協調用途；面向使用者的回覆
應改寫成一般的助理語氣。

### 為何偏好 `sessions_history`

`sessions_history` 是在代理程式回合內讀取子項
逐字稿時更安全的協調路徑：

- 即使一般用途的記錄遮蔽已停用，仍會遮蔽類似認證資訊／權杖的文字。
- 截斷過長的文字區塊（每個區塊 4000 個字元），並捨棄思考簽章、推理重播承載內容和內嵌圖片資料。
- 強制執行 80 KB 回應上限；過大的資料列會替換為 `[sessions_history omitted: message too large]`。
- 若有 `nextOffset`，請使用它向後翻閱較舊的逐字稿視窗。
- `sessions_history` **不會**從訊息文字中移除推理標籤、`<relevant-memories>` 鷹架或工具呼叫 XML——它會傳回接近原始逐字稿格式的結構化內容區塊，只進行遮蔽和大小限制。`/subagents log` 會套用更徹底的散文清理器（移除推理標籤、記憶鷹架和工具呼叫 XML），因為它呈現的是純文字聊天行，而非結構化區塊。
- 需要完整且逐位元組一致的逐字稿時，檢查磁碟上的原始逐字稿是後援方式。

## 工具政策

子代理程式會先使用與父項或目標代理程式相同的設定檔和工具政策
管線。之後，OpenClaw 會套用子代理程式限制
層。

無論深度或角色為何，子代理程式一律無法使用 `gateway`、`agents_list`、`session_status` 和
`cron`（系統層級／互動式工具，或
應由主要代理程式協調的工具）。葉節點子代理程式（預設的深度 1
行為，以及深度 2 的所有情況）還會失去 `subagents`、
`sessions_list`、`sessions_history` 和 `sessions_spawn`。子代理程式永遠不會
取得 `message` 工具——它會在生成時停用，而不是由
此拒絕清單篩選——且 `sessions_send` 會維持拒絕狀態，讓子代理程式
只能透過公告鏈通訊。

`sessions_history` 在此也仍是有範圍限制且經過清理的回顧檢視——它
不是原始逐字稿傾印。

當 `maxSpawnDepth >= 2` 時，深度 1 協調器子代理程式還會
取得 `sessions_spawn`、`subagents`、`sessions_list` 和
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
        // deny 優先
        deny: ["gateway", "cron"],
        // 如果設定 allow，則會變成僅允許清單（deny 仍然優先）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` 是最終的僅允許篩選器。它可以縮小
已解析的工具集，但無法**重新加入**被
`tools.profile` 移除的工具。例如，`tools.profile: "coding"` 包含
`web_search`/`web_fetch`，但不包含 `browser` 工具。若要讓
編碼設定檔的子代理程式使用瀏覽器自動化，請在
設定檔階段加入 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

只有一個代理程式應取得瀏覽器自動化時，請使用每個代理程式各自的
`agents.list[].tools.alsoAllow: ["browser"]`。

## 並行處理

子代理程式使用專用的程序內佇列通道：

- **通道名稱：** `subagent`
- **並行數：** `agents.defaults.subagents.maxConcurrent`（預設為 `8`）

## 存活狀態與復原

OpenClaw 不會將缺少 `endedAt` 視為子代理程式仍在執行的
永久證明。超過過期執行時間範圍仍未結束的執行
（2 小時，或已設定的執行逾時時間加上一小段寬限期，
以較長者為準），不再於 `/subagents list`、
狀態摘要、後代完成閘控及每工作階段
並行檢查中計為作用中／待處理。

閘道重新啟動後，還原但已過期且未結束的執行會被清除，除非
其子工作階段標記為 `abortedLastRun: true`。因重新啟動而中止的
執行仍會保留註冊，以供子代理程式孤立項目復原流程使用：過期的
執行會在不繼續執行的情況下完成，而近期的子工作階段會先收到
一則合成的繼續執行訊息，之後才清除中止標記。

每個子工作階段的自動重新啟動復原次數皆有限制。如果同一個
子代理程式子項目在快速再次卡住的時間範圍內，重複獲准進行孤立項目復原，
OpenClaw 會在該工作階段保存復原墓碑，並在之後重新啟動時停止
自動繼續該工作階段。執行
`openclaw tasks maintenance --apply` 以協調一致工作記錄，或執行
`openclaw doctor --fix` 以清除
已建立墓碑之工作階段上的過期中止復原旗標。

<Note>
如果產生子代理程式時因閘道 `PAIRING_REQUIRED` /
`scope-upgrade` 而失敗，請先檢查 RPC 呼叫端，再編輯配對狀態。
當呼叫端已在閘道要求內容中執行時，內部 `sessions_spawn`
協調作業會在程序內分派，因此不會開啟回送 WebSocket，也不依賴
命令列介面的已配對裝置範圍基準。閘道程序外的呼叫端仍會使用 WebSocket
後援機制，透過直接回送共用權杖／密碼驗證，以 `client.id: "gateway-client"`
搭配 `client.mode: "backend"`。遠端呼叫端、明確指定的
`deviceIdentity`、明確的裝置權杖路徑，以及瀏覽器／節點用戶端，
仍需要一般裝置核准才能升級範圍。
</Note>

## 停止

- 在要求端聊天中傳送 `/stop`，會中止要求端工作階段，並停止由其產生的任何作用中子代理程式執行，且會連鎖停止巢狀子項目。

## 限制

- 子代理程式通知為**盡力而為**。如果閘道重新啟動，待處理的「回傳通知」工作將會遺失。
- 子代理程式仍共用同一個閘道程序資源；請將 `maxConcurrent` 視為安全閥。
- `sessions_spawn` 一律為非阻塞：它會立即傳回 `{ status: "accepted", runId, childSessionKey }`。
- 子代理程式內容只會注入 `AGENTS.md` 和 `TOOLS.md`（不包含 `SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。Codex 原生子代理程式遵循相同界線：`TOOLS.md` 會保留在繼承的 Codex 執行緒指示中，而僅限父項目的角色設定、身分和使用者檔案則會以限於當次互動的協作指示注入，因此子項目不會複製這些內容。
- 最大巢狀深度為 5（`maxSpawnDepth` 範圍：1-5）。建議大多數使用案例使用深度 2。
- `maxChildrenPerAgent` 會限制每個工作階段的作用中子項目數量（預設為 `5`，範圍為 `1-20`）。

## 相關內容

- [工作階段工具與狀態變更](/zh-TW/concepts/session-tool)
- [ACP 代理程式](/zh-TW/tools/acp-agents)
- [代理程式傳送](/zh-TW/tools/agent-send)
- [背景工作](/zh-TW/automation/tasks)
- [多代理程式沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
