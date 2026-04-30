---
read_when:
    - 你需要具備明確核准機制的確定性多步驟工作流程
    - 您需要繼續某個工作流程，而不重新執行先前的步驟
summary: 適用於 OpenClaw 的型別化工作流程執行階段，具備可恢復的核准閘門。
title: 龍蝦
x-i18n:
    generated_at: "2026-04-30T03:45:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1700bcfdbcf4558cb908935834e9059221d0d26ad78ed6f9e2158f7e0b83edbd
    source_path: tools/lobster.md
    workflow: 16
---

Lobster 是一個工作流程 shell，讓 OpenClaw 能將多步驟工具序列作為單一、確定性的操作執行，並具備明確的核准檢查點。

Lobster 是位於卸離背景工作之上的一層編寫層。若要了解個別任務之上的流程協調，請參閱 [Task Flow](/zh-TW/automation/taskflow)（`openclaw tasks flow`）。若要了解任務活動帳本，請參閱 [`openclaw tasks`](/zh-TW/automation/tasks)。

## Hook

你的助理可以建置管理自身的工具。提出一個工作流程需求，30 分鐘後你就會有一個 CLI 加上一組能以一次呼叫執行的管線。Lobster 就是缺少的那一塊：確定性的管線、明確核准，以及可恢復的狀態。

## 為什麼

如今，複雜工作流程需要多次來回工具呼叫。每次呼叫都會消耗 token，而 LLM 必須協調每個步驟。Lobster 將這種協調移入具型別的執行階段：

- **一次呼叫取代多次呼叫**：OpenClaw 執行一次 Lobster 工具呼叫並取得結構化結果。
- **內建核准**：副作用（傳送電子郵件、發布留言）會暫停工作流程，直到明確核准為止。
- **可恢復**：暫停的工作流程會回傳 token；核准後可恢復，而不必重新執行所有內容。

## 為什麼使用 DSL 而不是普通程式？

Lobster 刻意保持小巧。目標不是「一種新語言」，而是一種可預測、AI 友善的管線規格，並將核准與恢復 token 作為一等功能。

- **內建核准/恢復**：一般程式可以提示人類，但若沒有你自己發明該執行階段，它無法透過持久 token _暫停並恢復_。
- **確定性 + 可稽核性**：管線是資料，因此很容易記錄、比較差異、重播與審查。
- **為 AI 限縮的介面**：微小文法 + JSON 管線可減少「創意」程式路徑，並讓驗證變得務實可行。
- **內建安全政策**：逾時、輸出上限、沙箱檢查與 allowlist 由執行階段強制執行，而不是由每個指令碼各自處理。
- **仍可程式化**：每個步驟都能呼叫任何 CLI 或指令碼。若你想使用 JS/TS，可從程式碼產生 `.lobster` 檔案。

## 運作方式

OpenClaw 使用內嵌 runner **於行程內**執行 Lobster 工作流程。不會產生外部 CLI 子行程；工作流程引擎在 Gateway 行程內執行，並直接回傳 JSON envelope。
如果管線因核准而暫停，工具會回傳 `resumeToken`，讓你稍後繼續。

## 模式：小型 CLI + JSON 管線 + 核准

建置會輸出 JSON 的小型命令，然後將它們串接成單一 Lobster 呼叫。（以下範例命令名稱請替換成你自己的。）

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

如果管線要求核准，使用 token 恢復：

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI 觸發工作流程；Lobster 執行步驟。核准閘門讓副作用保持明確且可稽核。

範例：將輸入項目映射成工具呼叫：

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## 僅 JSON 的 LLM 步驟（llm-task）

對於需要**結構化 LLM 步驟**的工作流程，啟用選用的
`llm-task` plugin 工具，並從 Lobster 呼叫它。這能讓工作流程
保持確定性，同時仍可用模型進行分類、摘要與草擬。

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
        "tools": { "allow": ["llm-task"] }
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

Lobster 可以執行包含 `name`、`args`、`steps`、`env`、`condition` 與 `approval` 欄位的 YAML/JSON 工作流程檔案。在 OpenClaw 工具呼叫中，將 `pipeline` 設為檔案路徑。

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

注意：

- `stdin: $step.stdout` 和 `stdin: $step.json` 會傳遞前一個步驟的輸出。
- `condition`（或 `when`）可依據 `$step.approved` 控制步驟是否執行。

## 安裝 Lobster

內建的 Lobster 工作流程會於行程內執行；不需要個別的 `lobster` 二進位檔。內嵌 runner 隨 Lobster plugin 一起提供。

如果你需要獨立的 Lobster CLI 來開發或執行外部管線，請從 [Lobster repo](https://github.com/openclaw/lobster) 安裝，並確保 `lobster` 位於 `PATH`。

## 啟用工具

Lobster 是**選用**的 plugin 工具（預設未啟用）。

建議做法（累加且安全）：

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

除非你打算以限制性 allowlist 模式執行，否則請避免使用 `tools.allow: ["lobster"]`。

<Note>
allowlist 對選用 plugin 採用選擇啟用。如果你的 allowlist 只列出 plugin 工具（例如 `lobster`），OpenClaw 會保持核心工具啟用。若要限制核心工具，也請將你想要的核心工具或群組納入 allowlist。
</Note>

## 範例：電子郵件分類處理

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

有 Lobster：

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

使用引數執行工作流程檔案：

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

- `cwd`：管線的相對工作目錄（必須保持在 Gateway 工作目錄內）。
- `timeoutMs`：如果工作流程超過此持續時間則中止（預設：20000）。
- `maxStdoutBytes`：如果輸出超過此大小則中止工作流程（預設：512000）。
- `argsJson`：傳遞給 `lobster run --args-json` 的 JSON 字串（僅限工作流程檔案）。

## 輸出 envelope

Lobster 會回傳 JSON envelope，其狀態為以下三者之一：

- `ok` → 已成功完成
- `needs_approval` → 已暫停；需要 `requiresApproval.resumeToken` 才能恢復
- `cancelled` → 已明確拒絕或取消

工具會同時在 `content`（格式化 JSON）與 `details`（原始物件）中公開 envelope。

## 核准

如果存在 `requiresApproval`，請檢查提示並決定：

- `approve: true` → 恢復並繼續副作用
- `approve: false` → 取消並完成工作流程

使用 `approve --preview-from-stdin --limit N` 可將 JSON 預覽附加到核准要求，而不需要自訂 jq/heredoc 黏合邏輯。恢復 token 現在很精簡：Lobster 會將工作流程恢復狀態儲存在其狀態目錄下，並回傳一個小型 token key。

## OpenProse

OpenProse 與 Lobster 搭配良好：使用 `/prose` 協調多 agent 準備工作，然後執行 Lobster 管線以取得確定性核准。如果 Prose 程式需要 Lobster，請透過 `tools.subagents.tools` 允許子 agent 使用 `lobster` 工具。請參閱 [OpenProse](/zh-TW/prose)。

## 安全性

- **僅限本機行程內** — 工作流程在 Gateway 行程內執行；plugin 本身不會進行網路呼叫。
- **不處理密鑰** — Lobster 不管理 OAuth；它會呼叫負責這些工作的 OpenClaw 工具。
- **沙箱感知** — 當工具內容在沙箱中時會停用。
- **已強化** — 逾時與輸出上限由內嵌 runner 強制執行。

## 疑難排解

- **`lobster timed out`** → 增加 `timeoutMs`，或拆分長管線。
- **`lobster output exceeded maxStdoutBytes`** → 提高 `maxStdoutBytes` 或減少輸出大小。
- **`lobster returned invalid JSON`** → 確保管線以工具模式執行，且只列印 JSON。
- **`lobster failed`** → 查看 Gateway 記錄，以取得內嵌 runner 錯誤詳細資料。

## 了解更多

- [Plugins](/zh-TW/tools/plugin)
- [Plugin 工具編寫](/zh-TW/plugins/building-plugins#registering-agent-tools)

## 案例研究：社群工作流程

一個公開範例：「第二大腦」CLI + Lobster 管線，用於管理三個 Markdown vault（個人、伴侶、共享）。CLI 會為統計資料、收件匣列表與過期掃描輸出 JSON；Lobster 則將這些命令串接成 `weekly-review`、`inbox-triage`、`memory-consolidation` 與 `shared-task-sync` 等工作流程，每個都具備核准閘門。可用時，AI 會處理判斷（分類）；不可用時，則退回確定性規則。

- 討論串：[https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo：[https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 相關

- [自動化與任務](/zh-TW/automation) — 排程 Lobster 工作流程
- [自動化概覽](/zh-TW/automation) — 所有自動化機制
- [工具概覽](/zh-TW/tools) — 所有可用的 agent 工具
