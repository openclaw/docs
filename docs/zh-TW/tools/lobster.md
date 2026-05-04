---
read_when:
    - 您需要具備明確核准機制的確定性多步驟工作流程
    - 你需要在不重新執行先前步驟的情況下恢復工作流程
summary: 具備可恢復核准閘門的 OpenClaw 型別化工作流程執行階段。
title: 龍蝦
x-i18n:
    generated_at: "2026-05-04T02:46:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67f5145b11f2d6e07e9d78a44a389ae5f236c85ec8c287ab0f217a18b622ece0
    source_path: tools/lobster.md
    workflow: 16
---

Lobster 是一個工作流程 shell，讓 OpenClaw 能將多步驟工具序列作為單一、確定性的操作執行，並具有明確的核准檢查點。

Lobster 是高於 detached background work 的一層編寫層。若要了解個別任務之上的流程編排，請參閱 [TaskFlow](/zh-TW/automation/taskflow)（`openclaw tasks flow`）。若要了解任務活動帳本，請參閱 [`openclaw tasks`](/zh-TW/automation/tasks)。

## Hook

你的助理可以建構管理自身的工具。要求一個工作流程，30 分鐘後你就會有一個 CLI 加上可作為一次呼叫執行的管線。Lobster 是缺少的那一塊：確定性管線、明確核准，以及可恢復的狀態。

## 為什麼

如今，複雜工作流程需要許多來回工具呼叫。每次呼叫都會耗費 tokens，而 LLM 必須編排每個步驟。Lobster 將該編排移入具型別的執行階段：

- **一次呼叫取代多次呼叫**：OpenClaw 執行一次 Lobster 工具呼叫，並取得結構化結果。
- **內建核准**：副作用（寄送電子郵件、發布留言）會暫停工作流程，直到明確核准。
- **可恢復**：暫停的工作流程會回傳 token；核准後即可恢復，而不必重新執行所有內容。

## 為什麼使用 DSL 而不是一般程式？

Lobster 刻意保持小而精。目標不是「一種新語言」，而是一個可預測、AI 友善的管線規格，並具備一等公民的核准與恢復 tokens。

- **內建核准/恢復**：一般程式可以提示人類，但無法在沒有自行發明執行階段的情況下，使用持久 token _暫停並恢復_。
- **確定性 + 可稽核性**：管線是資料，因此容易記錄、比較差異、重播與審查。
- **為 AI 限縮表面**：極小文法 + JSON 管道可減少「創意」程式碼路徑，並讓驗證變得實際可行。
- **內建安全政策**：逾時、輸出上限、沙盒檢查與 allowlists 由執行階段強制執行，而不是由每個腳本各自處理。
- **仍可程式化**：每個步驟都可以呼叫任何 CLI 或腳本。如果你想使用 JS/TS，可以從程式碼產生 `.lobster` 檔案。

## 運作方式

OpenClaw 使用嵌入式 runner **在程序內**執行 Lobster 工作流程。不會產生外部 CLI 子程序；工作流程引擎會在 gateway 程序內執行，並直接回傳 JSON envelope。
如果管線因核准而暫停，工具會回傳 `resumeToken`，讓你稍後繼續。

## 模式：小型 CLI + JSON 管道 + 核准

建構會說 JSON 的小型命令，然後將它們串接成單一 Lobster 呼叫。（以下範例命令名稱僅供參考，請替換成你自己的命令。）

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

範例：將輸入項目映射為工具呼叫：

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## 僅 JSON 的 LLM 步驟（llm-task）

對於需要**結構化 LLM 步驟**的工作流程，請啟用選用的
`llm-task` Plugin 工具，並從 Lobster 呼叫它。這能讓工作流程保持
確定性，同時仍能使用模型進行分類/摘要/草擬。

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

在管線中使用它：

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

詳情與設定選項請參閱 [LLM Task](/zh-TW/tools/llm-task)。

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
- `condition`（或 `when`）可以根據 `$step.approved` 為步驟設閘。

## 安裝 Lobster

隨附的 Lobster 工作流程會在程序內執行；不需要單獨的 `lobster` 二進位檔。嵌入式 runner 會隨 Lobster Plugin 一起提供。

如果你需要獨立的 Lobster CLI 進行開發或外部管線，請從 [Lobster repo](https://github.com/openclaw/lobster) 安裝，並確保 `lobster` 位於 `PATH`。

## 啟用工具

Lobster 是**選用**的 Plugin 工具（預設未啟用）。

建議方式（加法式、安全）：

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

或按代理程式設定：

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

除非你打算在限制性 allowlist 模式中執行，否則請避免使用 `tools.allow: ["lobster"]`。

<Note>
選用 Plugins 的 allowlists 是選擇加入。`alsoAllow` 只會啟用具名的選用 Plugin 工具，同時保留一般核心工具集。若要限制核心工具，請將 `tools.allow` 與你想要的核心工具或群組搭配使用。
</Note>

## 範例：電子郵件分診

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

在核准後繼續已暫停的工作流程。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 選用輸入

- `cwd`：管線的相對工作目錄（必須保持在 gateway 工作目錄內）。
- `timeoutMs`：如果工作流程超過此時長，則中止（預設：20000）。
- `maxStdoutBytes`：如果輸出超過此大小，則中止（預設：512000）。
- `argsJson`：傳遞給 `lobster run --args-json` 的 JSON 字串（僅限工作流程檔案）。

## 輸出 envelope

Lobster 會回傳具有三種狀態之一的 JSON envelope：

- `ok` → 已成功完成
- `needs_approval` → 已暫停；需要 `requiresApproval.resumeToken` 才能恢復
- `cancelled` → 已明確拒絕或取消

此工具會同時在 `content`（美化 JSON）和 `details`（原始物件）中公開 envelope。

## 核准

如果存在 `requiresApproval`，請檢查提示並決定：

- `approve: true` → 恢復並繼續副作用
- `approve: false` → 取消並完成工作流程

使用 `approve --preview-from-stdin --limit N`，即可將 JSON 預覽附加到核准要求，而不需要自訂 jq/heredoc 黏合程式碼。恢復 tokens 現在很精簡：Lobster 會將工作流程恢復狀態儲存在其狀態目錄下，並回傳一個小型 token key。

## OpenProse

OpenProse 與 Lobster 搭配得很好：使用 `/prose` 編排多代理程式準備工作，然後執行 Lobster 管線以取得確定性的核准。如果 Prose 程式需要 Lobster，請透過 `tools.subagents.tools` 為子代理程式允許 `lobster` 工具。請參閱 [OpenProse](/zh-TW/prose)。

## 安全性

- **僅限本機程序內** — 工作流程在 gateway 程序內執行；Plugin 本身不會發出網路呼叫。
- **無秘密** — Lobster 不管理 OAuth；它會呼叫負責處理的 OpenClaw 工具。
- **沙盒感知** — 當工具情境處於沙盒中時會停用。
- **已強化** — 逾時與輸出上限由嵌入式 runner 強制執行。

## 疑難排解

- **`lobster timed out`** → 增加 `timeoutMs`，或拆分較長的管線。
- **`lobster output exceeded maxStdoutBytes`** → 提高 `maxStdoutBytes` 或減少輸出大小。
- **`lobster returned invalid JSON`** → 確保管線以工具模式執行，且只列印 JSON。
- **`lobster failed`** → 檢查 gateway 記錄以取得嵌入式 runner 錯誤詳細資訊。

## 深入了解

- [Plugins](/zh-TW/tools/plugin)
- [Plugin 工具編寫](/zh-TW/plugins/building-plugins#registering-agent-tools)

## 案例研究：社群工作流程

一個公開範例：一個「第二大腦」CLI + Lobster 管線，用來管理三個 Markdown vault（個人、夥伴、共享）。該 CLI 會為統計資料、收件匣清單與過期掃描輸出 JSON；Lobster 會將這些命令串接成 `weekly-review`、`inbox-triage`、`memory-consolidation` 和 `shared-task-sync` 等工作流程，每個都有核准閘門。AI 會在可用時處理判斷（分類），不可用時則回退到確定性規則。

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 相關

- [自動化與任務](/zh-TW/automation) — 排程 Lobster 工作流程
- [自動化概覽](/zh-TW/automation) — 所有自動化機制
- [工具概覽](/zh-TW/tools) — 所有可用的代理程式工具
