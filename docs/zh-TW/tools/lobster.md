---
read_when:
    - 你需要具備明確核准機制的確定性多步驟工作流程
    - 你需要繼續工作流程，而不重新執行先前的步驟
summary: 適用於 OpenClaw 的型別化工作流程執行階段，具備可續接的核准閘門。
title: 龍蝦
x-i18n:
    generated_at: "2026-05-07T13:26:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 859cc29bd5b91d30e9f91a5b00a06d0fcf6f80d501aaaa7a7e266a4240573927
    source_path: tools/lobster.md
    workflow: 16
---

Lobster 是一個工作流程 shell，可讓 OpenClaw 將多步驟工具序列作為單一、確定性的操作執行，並包含明確的核准檢查點。

Lobster 是位於 detached 背景工作之上的一層編寫層。若要了解個別任務之上的流程編排，請參閱[任務流程](/zh-TW/automation/taskflow)（`openclaw tasks flow`）。若要了解任務活動帳本，請參閱 [`openclaw tasks`](/zh-TW/automation/tasks)。

## Hook

你的助理可以建置用來管理自己的工具。提出一個工作流程需求，30 分鐘後你就會有一個 CLI，加上一組可透過一次呼叫執行的管線。Lobster 是缺少的那一塊：確定性管線、明確核准，以及可恢復的狀態。

## 為什麼

如今，複雜工作流程需要許多來回的工具呼叫。每次呼叫都會消耗 token，而 LLM 必須編排每個步驟。Lobster 會將該編排移到一個具型別的執行階段中：

- **一次呼叫取代多次呼叫**：OpenClaw 執行一次 Lobster 工具呼叫並取得結構化結果。
- **內建核准**：副作用（傳送電子郵件、發布留言）會使工作流程暫停，直到明確核准。
- **可恢復**：暫停的工作流程會回傳 token；核准後即可恢復，而不必重新執行所有內容。

## 為什麼使用 DSL 而不是一般程式？

Lobster 刻意保持小而精簡。目標不是「一種新語言」，而是一個可預測、對 AI 友善的管線規格，具備一級核准與恢復 token。

- **內建核准/恢復**：一般程式可以提示人類，但如果不自行發明該執行階段，就無法使用持久 token _暫停並恢復_。
- **確定性 + 可稽核性**：管線是資料，因此容易記錄、比對差異、重播和審查。
- **為 AI 限縮介面**：微小的文法 + JSON 管線可減少「創意」程式碼路徑，並讓驗證變得實際可行。
- **內建安全政策**：逾時、輸出上限、沙箱檢查和允許清單都由執行階段強制執行，而不是由每個腳本各自處理。
- **仍可程式化**：每個步驟都可以呼叫任何 CLI 或腳本。如果你想使用 JS/TS，可以從程式碼產生 `.lobster` 檔案。

## 運作方式

OpenClaw 使用嵌入式 runner **在處理序內**執行 Lobster 工作流程。不會產生外部 CLI 子處理序；工作流程引擎會在 gateway 處理序內執行，並直接回傳 JSON envelope。
如果管線因核准而暫停，工具會回傳 `resumeToken`，讓你稍後繼續。

## 模式：小型 CLI + JSON 管線 + 核准

建置會使用 JSON 溝通的小型命令，然後將它們串接成單一 Lobster 呼叫。（以下範例命令名稱請替換成你自己的。）

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

如果管線要求核准，請使用 token 恢復：

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI 觸發工作流程；Lobster 執行步驟。核准閘門讓副作用保持明確且可稽核。

範例：將輸入項目對應為工具呼叫：

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## 僅 JSON 的 LLM 步驟（llm-task）

對於需要**結構化 LLM 步驟**的工作流程，請啟用選用的
`llm-task` plugin 工具，並從 Lobster 呼叫它。這可讓工作流程保持
確定性，同時仍可使用模型進行分類、摘要或草擬。

啟用工具：

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

內建的 Lobster plugin 會在 gateway 內部**以處理序內**方式執行工作流程。在該嵌入式模式中，`openclaw.invoke` **不會**自動繼承 gateway URL/auth context 供巢狀 OpenClaw CLI 工具呼叫使用。

這表示以下模式**目前在嵌入式 runner 中並不可靠**：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

只有在執行**獨立 Lobster CLI**，且 `openclaw.invoke` 已在環境中以正確的 gateway/auth context 設定完成時，才使用下方範例。

在獨立 Lobster CLI 管線中使用：

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

如果你目前使用嵌入式 Lobster plugin，請優先使用以下任一方式：

- 在 Lobster 外部直接呼叫 `llm-task` 工具，或
- 在支援的嵌入式橋接加入之前，在 Lobster 管線內使用非 `openclaw.invoke` 步驟。

如需詳細資訊和設定選項，請參閱 [LLM Task](/zh-TW/tools/llm-task)。

## 工作流程檔案（.lobster）

Lobster 可以執行具有 `name`、`args`、`steps`、`env`、`condition` 和 `approval` 欄位的 YAML/JSON 工作流程檔案。在 OpenClaw 工具呼叫中，將 `pipeline` 設為檔案路徑。

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

注意事項：

- `stdin: $step.stdout` 和 `stdin: $step.json` 會傳遞先前步驟的輸出。
- `condition`（或 `when`）可以根據 `$step.approved` 控制步驟閘門。

## 安裝 Lobster

內建 Lobster 工作流程會在處理序內執行；不需要個別的 `lobster` binary。嵌入式 runner 會隨 Lobster plugin 一起提供。

如果你需要獨立 Lobster CLI 來進行開發或外部管線，請從 [Lobster repo](https://github.com/openclaw/lobster) 安裝，並確保 `lobster` 位於 `PATH`。

## 啟用工具

Lobster 是一個**選用** plugin 工具（預設不啟用）。

建議方式（加成式、安全）：

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

或依 agent 設定：

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

除非你打算以限制性允許清單模式執行，否則請避免使用 `tools.allow: ["lobster"]`。

<Note>
允許清單對選用 plugins 採用選擇加入。`alsoAllow` 只會啟用具名的選用 plugin 工具，同時保留一般核心工具集。若要限制核心工具，請使用 `tools.allow` 搭配你想要的核心工具或群組。
</Note>

## 範例：電子郵件分流

沒有 Lobster：

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

使用 Lobster：

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

回傳 JSON envelope（已截斷）：

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

使用者核准 → 恢復：

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

一個工作流程。確定性。安全。

## 工具參數

### `run`

以工具模式執行管線。

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

使用 args 執行工作流程檔案：

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

在核准後繼續暫停的工作流程。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 選用輸入

- `cwd`：管線的相對工作目錄（必須維持在 gateway 工作目錄內）。
- `timeoutMs`：如果工作流程超過此持續時間，則中止（預設：20000）。
- `maxStdoutBytes`：如果輸出超過此大小，則中止工作流程（預設：512000）。
- `argsJson`：傳遞給 `lobster run --args-json` 的 JSON 字串（僅限工作流程檔案）。

## 輸出 envelope

Lobster 會回傳具有三種狀態之一的 JSON envelope：

- `ok` → 已成功完成
- `needs_approval` → 已暫停；需要 `requiresApproval.resumeToken` 才能恢復
- `cancelled` → 已明確拒絕或取消

此工具會同時在 `content`（格式化 JSON）和 `details`（原始物件）中呈現 envelope。

## 核准

如果存在 `requiresApproval`，請檢查提示並決定：

- `approve: true` → 恢復並繼續副作用
- `approve: false` → 取消並完成工作流程

使用 `approve --preview-from-stdin --limit N` 可將 JSON 預覽附加到核准要求，而不需要自訂 jq/heredoc 黏合邏輯。恢復 token 現在很精簡：Lobster 會將工作流程恢復狀態儲存在其狀態目錄下，並回傳小型 token key。

## OpenProse

OpenProse 與 Lobster 搭配良好：使用 `/prose` 編排多 agent 準備工作，然後執行 Lobster 管線以取得確定性核准。如果 Prose 程式需要 Lobster，請透過 `tools.subagents.tools` 為子 agents 允許 `lobster` 工具。請參閱 [OpenProse](/zh-TW/prose)。

## 安全性

- **僅限本機處理序內** - 工作流程在 gateway 處理序內執行；plugin 本身不會發出網路呼叫。
- **沒有 secrets** - Lobster 不管理 OAuth；它會呼叫負責此事的 OpenClaw 工具。
- **感知沙箱** - 當工具 context 處於沙箱中時停用。
- **強化** - 嵌入式 runner 會強制執行逾時與輸出上限。

## 疑難排解

- **`lobster timed out`** → 增加 `timeoutMs`，或拆分較長的管線。
- **`lobster output exceeded maxStdoutBytes`** → 提高 `maxStdoutBytes` 或減少輸出大小。
- **`lobster returned invalid JSON`** → 確保管線以工具模式執行，且只列印 JSON。
- **`lobster failed`** → 檢查 gateway 記錄以取得嵌入式 runner 錯誤詳細資料。

## 了解更多

- [Plugins](/zh-TW/tools/plugin)
- [Plugin 工具編寫](/zh-TW/plugins/building-plugins#registering-agent-tools)

## 案例研究：社群工作流程

一個公開範例：一個「第二大腦」CLI + Lobster 管線，用來管理三個 Markdown vault（個人、伴侶、共享）。CLI 會針對統計資料、收件匣清單和過期掃描輸出 JSON；Lobster 會將這些命令串接成 `weekly-review`、`inbox-triage`、`memory-consolidation` 和 `shared-task-sync` 等工作流程，每個都具備核准閘門。AI 在可用時處理判斷（分類），不可用時則退回到確定性規則。

- 討論串：[https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo：[https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 相關

- [自動化與任務](/zh-TW/automation) - 排程 Lobster 工作流程
- [自動化概覽](/zh-TW/automation) - 所有自動化機制
- [工具概覽](/zh-TW/tools) - 所有可用的 agent 工具
