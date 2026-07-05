---
read_when:
    - 你想要具備明確核准機制的可決定性多步驟工作流程
    - 你需要在不重新執行先前步驟的情況下恢復工作流程
summary: OpenClaw 的型別化工作流程執行階段，具備可恢復的核准閘門。
title: 龍蝦
x-i18n:
    generated_at: "2026-07-05T11:51:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster 會將多步驟工具管線作為一次確定性的工具呼叫執行，並具備明確的核准檢查點與續接權杖。它位於分離式背景工作的上一層：若要跨多個分離式任務編排流程，請參閱 [TaskFlow](/zh-TW/automation/taskflow) (`openclaw tasks flow`)；若要查看任務活動帳本，請參閱[背景任務](/zh-TW/automation/tasks)。

## 為什麼

沒有 Lobster 時，多步驟作業意味著多次往返工具呼叫，由模型編排每個步驟。Lobster 會把這種編排移入具型別的執行階段：

- **一次呼叫取代多次呼叫**：單次 Lobster 工具呼叫會回傳整個管線的結構化結果。
- **內建核准**：副作用（傳送、發布、刪除）會暫停工作流程，直到明確核准。
- **可續接**：暫停的工作流程會回傳權杖；核准後即可續接，無需重新執行先前步驟。

Lobster 是小型且受限的 DSL，而不是通用指令碼語言：核准/續接是持久且內建的原語；管線是資料（易於記錄、比較差異、重播、檢閱）；精簡的文法限制了「創意」程式碼路徑，讓驗證保持實際可行；逾時、輸出上限、沙盒檢查與允許清單由執行階段強制執行，而非由每個指令碼自行處理。每個步驟仍可呼叫任何命令列介面或指令碼 - 如果你想要更豐富的撰寫語言，可以從其他工具產生 `.lobster` 檔案。

沒有 Lobster 時，週期性的電子郵件分流會像這樣：

```text
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

有了 Lobster，同一項作業會成為一次呼叫，暫停等待核准後再續接：

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

## 運作方式

OpenClaw 使用隨附的 `@clawdbot/lobster` 套件作為嵌入式執行器，在**同一程序內**執行 Lobster 工作流程。不會產生外部 `lobster` 子程序；工具呼叫會直接回傳 JSON 封套。如果管線暫停等待核准，封套會攜帶續接權杖（或簡短的核准 ID），讓你稍後繼續。

## 啟用

Lobster 是**選用**外掛工具，預設未啟用。它已隨附提供，因此不需要額外安裝步驟 - 只需允許該工具：

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

或針對每個代理：

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

<Note>
`alsoAllow` 會在作用中的工具設定檔之上加入 `lobster`，不會限制其他核心工具。只有在你想改用限制性允許清單模式時，才使用 `tools.allow`。
</Note>

此工具在沙盒化工具情境中會完全停用。

如果你需要獨立的 Lobster 命令列介面進行開發或外部管線（位於嵌入式閘道執行器之外），請從 [Lobster repo](https://github.com/openclaw/lobster) 安裝，並將 `lobster` 放到 `PATH`。

## 模式：小型命令列介面 + JSON 管線 + 核准

建置會使用 JSON 溝通的小型命令，然後把它們串成一次 Lobster 呼叫。（以下範例命令名稱 - 請替換為你自己的命令。）

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

如果管線要求核准，請用權杖續接：

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

範例：將輸入項目對應成工具呼叫：

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## 僅 JSON 的 LLM 步驟 (llm-task)

若要在工作流程內使用**結構化 LLM 步驟**，請啟用選用的 `llm-task` 外掛工具，並從 Lobster 呼叫它：

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "alsoAllow": ["llm-task"] }
      }
    ]
  }
}
```

### 重要限制：嵌入式 Lobster 與 `openclaw.invoke`

隨附的 Lobster 外掛會在閘道內**同一程序內**執行工作流程。在該嵌入式模式中，`openclaw.invoke` **不會**自動繼承用於巢狀 OpenClaw 命令列介面工具呼叫的閘道 URL/驗證情境。

這表示此模式**目前在嵌入式執行器中不可靠**：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

只有在執行**獨立 Lobster 命令列介面**，且 `openclaw.invoke` 已在環境中設定正確閘道/驗證情境時，才使用下方範例。

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

如果你目前使用嵌入式 Lobster 外掛，請優先採用以下任一方式：

- 在 Lobster 外部直接呼叫 `llm-task` 工具，或
- 在支援的嵌入式橋接加入之前，在 Lobster 管線內使用非 `openclaw.invoke` 步驟。

請參閱 [LLM Task](/zh-TW/tools/llm-task) 以了解詳細資訊與設定選項。

## 工作流程檔案 (.lobster)

Lobster 可以執行含有 `name`、`args`、`steps`、`env`、`condition` 與 `approval` 欄位的 YAML/JSON 工作流程檔案。在工具呼叫中將 `pipeline` 設為檔案路徑。

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

備註：

- `stdin: $step.stdout` 和 `stdin: $step.json` 會傳遞先前步驟的輸出。
- `condition`（或 `when`）可依 `$step.approved` 對步驟設閘。

## 工具參數

### `run`

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

使用引數執行工作流程檔案：

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

| 欄位             | 預設        | 備註                                                                                                         |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| `pipeline`       | required    | 內嵌管線字串，或以 `.lobster`/`.yaml`/`.yml`/`.json` 結尾的工作流程檔案路徑。                                |
| `cwd`            | gateway cwd | 相對工作目錄；必須解析在閘道工作目錄內（絕對路徑會被拒絕）。                                                 |
| `timeoutMs`      | `20000`     | 若超過則中止執行。                                                                                           |
| `maxStdoutBytes` | `512000`    | 若擷取的 stdout 或 stderr 超過此大小，則中止執行。                                                           |
| `argsJson`       | -           | 工作流程檔案引數的 JSON 字串（內嵌管線會忽略）。                                                             |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` 可接受 `token`（來自 `requiresApproval` 的完整續接權杖）或 `approvalId`（來自同一物件的簡短 ID）- 請使用暫停執行回傳的任一項。`approve` 為必填。

### 受管理的 TaskFlow 模式

在 `run` 傳入 `flowControllerId` 和 `flowGoal`（或在 `resume` 傳入 `flowId` 和 `flowExpectedRevision`）會透過外掛執行階段的受管理 [TaskFlow](/zh-TW/automation/taskflow) API 驅動該呼叫，而不是回傳裸封套：OpenClaw 會建立或續接持久流程記錄，將 Lobster 封套套用到其中（核准時為 `waiting`，完成時為 `succeeded`/`failed`），並回傳 `{ ok, envelope, flow, mutation }`。此模式需要已繫結的 TaskFlow 執行階段，適用於需要在閘道重新啟動之間保留持久流程狀態的外掛/控制器程式碼，而非典型臨時代理使用。

## 輸出封套

Lobster 會回傳 JSON 封套，狀態為以下三者之一：

- `ok` - 成功完成
- `needs_approval` - 已暫停；`requiresApproval` 攜帶 `resumeToken` 和簡短的 `approvalId`，任一者都可續接執行
- `cancelled` - 明確拒絕或取消

工具會同時在 `content`（格式化 JSON）和 `details`（原始物件）中呈現封套。

## 核准

如果存在 `requiresApproval`，請檢查提示並決定：

- `approve: true` - 續接並繼續副作用
- `approve: false` - 取消並完成工作流程

使用 `approve --preview-from-stdin --limit N` 可將 JSON 預覽附加到核准要求，無需自訂 jq/heredoc 黏合。續接狀態會儲存為 Lobster 狀態目錄下的小型 JSON 檔案（預設為 `~/.lobster/state`，可用 `LOBSTER_STATE_DIR` 覆寫）；權杖本身只編碼指向該狀態的指標，而不是完整管線狀態。

## OpenProse

OpenProse 與 Lobster 搭配良好：使用 `/prose` 編排多代理準備工作，然後執行 Lobster 管線以取得確定性核准。如果 Prose 程式需要 Lobster，請透過 `tools.subagents.tools` 為子代理允許 `lobster` 工具。請參閱 [OpenProse](/zh-TW/prose)。

## 安全性

- **僅本機同一程序** - 工作流程在閘道程序內執行；外掛本身不發出網路呼叫。
- **不含秘密** - Lobster 不管理 OAuth；它會呼叫負責管理的 OpenClaw 工具。
- **沙盒感知** - 當工具情境為沙盒化時停用。
- **已強化** - 逾時與輸出上限由嵌入式執行器強制執行。

## 疑難排解

| 錯誤                                                          | 原因 / 修正                                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | 管線超過 `timeoutMs`。提高它或拆分管線。                                        |
| `lobster stdout exceeded maxStdoutBytes`（或 `stderr`）       | 擷取的輸出超過上限。提高 `maxStdoutBytes` 或減少輸出。                          |
| `run --args-json must be valid JSON`                          | `argsJson`（工作流程檔案執行）剖析失敗。修正 JSON 字串。                        |
| `lobster runtime failed`（或其他 `runtime_error` 訊息）       | 嵌入式執行階段回傳錯誤封套。請檢查閘道記錄以取得詳細資訊。                     |

## 深入了解

- [外掛](/zh-TW/tools/plugin)
- [外掛工具撰寫](/zh-TW/plugins/building-plugins#registering-agent-tools)

## 案例研究：社群工作流程

一個公開範例：「第二大腦」命令列介面 + Lobster 管線，用來管理三個
Markdown 知識庫（個人、伴侶、共享）。命令列介面會輸出 JSON，用於統計、
收件匣列表，以及過期掃描；Lobster 會將這些命令串接成工作流程，
例如 `weekly-review`、`inbox-triage`、`memory-consolidation` 和
`shared-task-sync`，每個流程都有核准關卡。AI 在可用時負責判斷
（分類），不可用時則退回使用確定性規則。

- 討論串：[https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- 儲存庫：[https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 相關

- [自動化](/zh-TW/automation) - 所有自動化機制
- [工具概覽](/zh-TW/tools) - 所有可用的代理工具
