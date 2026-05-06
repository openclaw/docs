---
read_when:
    - 你需要具備明確核准機制的確定性多步驟工作流程
    - 你需要繼續執行工作流程，而不重新執行先前的步驟
summary: OpenClaw 的型別化工作流程執行環境，具備可續行的核准閘門。
title: 龍蝦
x-i18n:
    generated_at: "2026-05-06T09:21:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6da8c7ca213dd4e9f85bcedabdb74da172bd3d82eceaf2c001f1a2692b01ca8
    source_path: tools/lobster.md
    workflow: 16
---

Lobster 是一個工作流程 shell，可讓 OpenClaw 將多步驟工具序列作為單一、確定性的操作執行，並具有明確的核准檢查點。

Lobster 是位於分離式背景工作之上的一層編寫層。若要在個別任務之上進行流程編排，請參閱 [Task Flow](/zh-TW/automation/taskflow)（`openclaw tasks flow`）。若要查看任務活動帳本，請參閱 [`openclaw tasks`](/zh-TW/automation/tasks)。

## 掛鉤

你的助手可以建構用來管理自身的工具。提出一個工作流程需求，30 分鐘後你就會有一個 CLI 加上可作為一次呼叫執行的管線。Lobster 是缺少的那一塊：確定性管線、明確核准，以及可恢復狀態。

## 為什麼

目前，複雜工作流程需要許多來回的工具呼叫。每次呼叫都會消耗 tokens，而 LLM 必須編排每個步驟。Lobster 將這種編排移入型別化執行階段：

- **一次呼叫取代多次呼叫**：OpenClaw 執行一次 Lobster 工具呼叫並取得結構化結果。
- **內建核准**：副作用（傳送電子郵件、發佈留言）會暫停工作流程，直到明確核准為止。
- **可恢復**：暫停的工作流程會傳回 token；核准後即可恢復，而不必重新執行所有內容。

## 為什麼使用 DSL，而不是普通程式？

Lobster 刻意保持小巧。目標不是「一種新語言」，而是可預測、AI 友善的管線規格，並將核准與恢復 token 作為一級功能。

- **內建核准/恢復**：一般程式可以提示人類，但如果不自行發明執行階段，它無法使用持久 token _暫停並恢復_。
- **確定性 + 可稽核性**：管線是資料，因此容易記錄、比較差異、重播和審查。
- **受限的 AI 介面**：極小的語法 + JSON 管線可減少「創意」程式碼路徑，並讓驗證變得實際可行。
- **內建安全政策**：逾時、輸出上限、沙盒檢查和允許清單由執行階段強制執行，而不是由每個腳本自行處理。
- **仍可程式化**：每個步驟都可以呼叫任何 CLI 或腳本。如果你想使用 JS/TS，可以從程式碼產生 `.lobster` 檔案。

## 運作方式

OpenClaw 使用嵌入式執行器 **在程序內** 執行 Lobster 工作流程。不會產生外部 CLI 子程序；工作流程引擎在 gateway 程序內執行，並直接傳回 JSON 封套。
如果管線因核准而暫停，工具會傳回 `resumeToken`，讓你稍後繼續。

## 模式：小型 CLI + JSON 管線 + 核准

建構會使用 JSON 溝通的小型命令，然後將它們串接成單一 Lobster 呼叫。（以下範例命令名稱可替換為你自己的。）

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

如果管線請求核准，請使用 token 恢復：

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

對於需要**結構化 LLM 步驟**的工作流程，啟用選用的
`llm-task` plugin 工具，並從 Lobster 呼叫它。這可讓工作流程
保持確定性，同時仍可使用模型進行分類/摘要/草稿撰寫。

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

在管線中使用：

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
- `condition`（或 `when`）可根據 `$step.approved` 控制步驟是否執行。

## 安裝 Lobster

內建的 Lobster 工作流程會在程序內執行；不需要單獨的 `lobster` 二進位檔。嵌入式執行器隨 Lobster plugin 一起提供。

如果你需要獨立的 Lobster CLI 來進行開發或外部管線，請從 [Lobster repo](https://github.com/openclaw/lobster) 安裝，並確保 `lobster` 位於 `PATH`。

## 啟用工具

Lobster 是**選用** plugin 工具（預設未啟用）。

建議方式（增量且安全）：

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

或依代理程式設定：

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
允許清單對選用 plugins 採用選擇加入。`alsoAllow` 只會啟用指定的選用 plugin 工具，同時保留一般核心工具集。若要限制核心工具，請搭配你想要的核心工具或群組使用 `tools.allow`。
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

傳回 JSON 封套（已截斷）：

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

以參數執行工作流程檔案：

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

核准後繼續暫停的工作流程。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 選用輸入

- `cwd`：管線的相對工作目錄（必須保持在 gateway 工作目錄內）。
- `timeoutMs`：如果工作流程超過此持續時間則中止（預設：20000）。
- `maxStdoutBytes`：如果輸出超過此大小則中止工作流程（預設：512000）。
- `argsJson`：傳遞給 `lobster run --args-json` 的 JSON 字串（僅限工作流程檔案）。

## 輸出封套

Lobster 會傳回 JSON 封套，且具有下列三種狀態之一：

- `ok` → 成功完成
- `needs_approval` → 已暫停；需要 `requiresApproval.resumeToken` 才能恢復
- `cancelled` → 已明確拒絕或取消

工具會同時在 `content`（美化 JSON）和 `details`（原始物件）中公開此封套。

## 核准

如果存在 `requiresApproval`，請檢查提示並決定：

- `approve: true` → 恢復並繼續副作用
- `approve: false` → 取消並完成工作流程

使用 `approve --preview-from-stdin --limit N` 可將 JSON 預覽附加至核准請求，而不需要自訂 jq/heredoc 黏合程式碼。恢復 token 現在很精簡：Lobster 會將工作流程恢復狀態儲存在其狀態目錄下，並傳回一個小型 token key。

## OpenProse

OpenProse 與 Lobster 搭配良好：使用 `/prose` 編排多代理程式準備工作，然後執行 Lobster 管線以進行確定性核准。如果 Prose 程式需要 Lobster，請透過 `tools.subagents.tools` 為子代理程式允許 `lobster` 工具。請參閱 [OpenProse](/zh-TW/prose)。

## 安全性

- **僅限本機程序內** - 工作流程在 gateway 程序內執行；plugin 本身不會發出網路呼叫。
- **無秘密資訊** - Lobster 不管理 OAuth；它會呼叫負責該工作的 OpenClaw 工具。
- **感知沙盒** - 當工具內容受到沙盒限制時會停用。
- **已強化** - 逾時和輸出上限由嵌入式執行器強制執行。

## 疑難排解

- **`lobster timed out`** → 增加 `timeoutMs`，或拆分較長的管線。
- **`lobster output exceeded maxStdoutBytes`** → 提高 `maxStdoutBytes` 或減少輸出大小。
- **`lobster returned invalid JSON`** → 確保管線以工具模式執行，且只輸出 JSON。
- **`lobster failed`** → 檢查 gateway 日誌以取得嵌入式執行器錯誤詳細資料。

## 深入了解

- [Plugins](/zh-TW/tools/plugin)
- [Plugin 工具編寫](/zh-TW/plugins/building-plugins#registering-agent-tools)

## 案例研究：社群工作流程

一個公開範例：「第二大腦」CLI + Lobster 管線，用來管理三個 Markdown vault（個人、夥伴、共享）。CLI 會為統計資料、收件匣清單和過期掃描輸出 JSON；Lobster 將這些命令串接成 `weekly-review`、`inbox-triage`、`memory-consolidation` 和 `shared-task-sync` 等工作流程，每個都有核准閘門。可用時由 AI 處理判斷（分類），不可用時則回退至確定性規則。

- 討論串：[https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo：[https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 相關

- [Automation 與任務](/zh-TW/automation) - 排程 Lobster 工作流程
- [Automation 概觀](/zh-TW/automation) - 所有自動化機制
- [工具概觀](/zh-TW/tools) - 所有可用的代理程式工具
