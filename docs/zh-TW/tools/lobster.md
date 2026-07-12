---
read_when:
    - 你需要具備明確核准機制、且結果可預期的多步驟工作流程
    - 你需要在不重新執行先前步驟的情況下繼續工作流程
summary: 具備可恢復核准閘門的 OpenClaw 型別化工作流程執行環境。
title: 龍蝦
x-i18n:
    generated_at: "2026-07-11T21:51:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster 將多步驟工具管線作為單一確定性的工具呼叫執行，並提供明確的核准檢查點與恢復權杖。它位於分離式背景工作的上一層：若要協調跨越多個分離式任務的流程，請參閱[任務流程](/zh-TW/automation/taskflow)（`openclaw tasks flow`）；若要查看任務活動帳本，請參閱[背景任務](/zh-TW/automation/tasks)。

## 原因

若沒有 Lobster，多步驟工作會需要多次往返工具呼叫，並由模型協調每個步驟。Lobster 將此協調工作移至具型別的執行階段：

- **一次呼叫取代多次呼叫**：單一 Lobster 工具呼叫會傳回整條管線的結構化結果。
- **內建核准機制**：副作用（傳送、發布、刪除）會暫停工作流程，直到獲得明確核准。
- **可恢復**：暫停的工作流程會傳回權杖；核准並恢復即可，無須重新執行先前步驟。

Lobster 是一種小型且受限制的領域特定語言，而非通用指令碼語言：核准／恢復是持久且內建的基本操作；管線以資料表示（易於記錄、比較差異、重播及審查）；精簡的文法限制了「創意式」程式碼路徑，使驗證保持切合實際；逾時、輸出上限、沙箱檢查及允許清單均由執行階段強制執行，而非由各個指令碼處理。每個步驟仍可呼叫任何命令列介面或指令碼；若想使用功能更豐富的編寫語言，可以透過其他工具產生 `.lobster` 檔案。

若沒有 Lobster，定期電子郵件分類流程如下：

```text
使用者：「檢查我的電子郵件並草擬回覆」
→ openclaw 呼叫 gmail.list
→ LLM 摘要內容
→ 使用者：「草擬給第 2 封和第 5 封的回覆」
→ LLM 草擬回覆
→ 使用者：「傳送第 2 封」
→ openclaw 呼叫 gmail.send
（每天重複，且不記得哪些郵件已完成分類）
```

使用 Lobster 後，同一項工作只需一次呼叫，並會暫停以等待核准，之後再恢復：

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

OpenClaw 使用隨附的 `@clawdbot/lobster` 套件作為嵌入式執行器，**在處理序內**執行 Lobster 工作流程。不會產生外部 `lobster` 子處理序；工具呼叫會直接傳回 JSON 封裝。若管線暫停以等待核准，封裝中會包含恢復權杖（或簡短的核准 ID），讓你稍後繼續執行。

## 啟用

Lobster 是**選用的**外掛工具，預設不會啟用。它已隨附提供，因此不需要額外安裝，只需允許使用此工具：

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

或者針對各代理程式設定：

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
`alsoAllow` 會在目前使用中的工具設定檔上加入 `lobster`，而不限制其他核心工具。只有在你想使用限制性允許清單模式時，才改用 `tools.allow`。
</Note>

在沙箱化工具環境中，此工具會完全停用。

若你需要獨立版 Lobster 命令列介面來進行開發或執行外部管線（位於嵌入式閘道執行器之外），請從 [Lobster 儲存庫](https://github.com/openclaw/lobster)安裝，並將 `lobster` 加入 `PATH`。

## 模式：小型命令列介面 + JSON 管線 + 核准

建立以 JSON 溝通的小型命令，然後將它們串接成一次 Lobster 呼叫。（以下為命令名稱範例，請替換為你自己的命令。）

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

若管線要求核准，請使用權杖恢復：

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

範例：將輸入項目對應為工具呼叫：

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## 僅限 JSON 的 LLM 步驟（llm-task）

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

隨附的 Lobster 外掛會在閘道內部**以處理序內方式**執行工作流程。在此嵌入式模式下，`openclaw.invoke` 不會自動繼承供巢狀 OpenClaw 命令列介面工具呼叫使用的閘道 URL／驗證環境。

這表示目前無法在嵌入式執行器中可靠地使用下列模式：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

只有在執行**獨立版 Lobster 命令列介面**，且環境中的 `openclaw.invoke` 已設定正確的閘道／驗證環境時，才使用下列範例。

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

若目前使用嵌入式 Lobster 外掛，建議選擇以下任一方式：

- 在 Lobster 之外直接呼叫 `llm-task` 工具，或
- 在加入受支援的嵌入式橋接機制之前，於 Lobster 管線中使用非 `openclaw.invoke` 步驟。

如需詳細資訊及設定選項，請參閱 [LLM 任務](/zh-TW/tools/llm-task)。

## 工作流程檔案（.lobster）

Lobster 可以執行包含 `name`、`args`、`steps`、`env`、`condition` 及 `approval` 欄位的 YAML／JSON 工作流程檔案。在工具呼叫中，將 `pipeline` 設為檔案路徑。

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
- `condition`（或 `when`）可根據 `$step.approved` 控制是否執行步驟。

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

| 欄位             | 預設值       | 注意事項                                                                                                  |
| ---------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| `pipeline`       | 必填         | 內嵌管線字串，或以 `.lobster`／`.yaml`／`.yml`／`.json` 結尾的工作流程檔案路徑。                          |
| `cwd`            | 閘道 cwd     | 相對工作目錄；解析結果必須位於閘道工作目錄內（不接受絕對路徑）。                                        |
| `timeoutMs`      | `20000`      | 超過此時間即中止執行。                                                                                    |
| `maxStdoutBytes` | `512000`     | 若擷取到的標準輸出或標準錯誤超過此大小，即中止執行。                                                      |
| `argsJson`       | -            | 工作流程檔案的 JSON 引數字串（內嵌管線會忽略此項）。                                                      |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` 可接受 `token`（來自 `requiresApproval` 的完整恢復權杖）或 `approvalId`（來自同一物件的簡短 ID），請使用暫停執行時所傳回的項目。`approve` 為必填。

### 受管理的任務流程模式

在 `run` 中傳入 `flowControllerId` 和 `flowGoal`（或在 `resume` 中傳入 `flowId` 和 `flowExpectedRevision`），會透過外掛執行階段的受管理[任務流程](/zh-TW/automation/taskflow) API 驅動呼叫，而非傳回單純封裝：OpenClaw 會建立或恢復持久流程記錄、將 Lobster 封裝套用至該記錄（等待核准時為 `waiting`，完成時為 `succeeded`／`failed`），並傳回 `{ ok, envelope, flow, mutation }`。此模式需要繫結任務流程執行階段，適用於需要在閘道重新啟動後仍能保有持久流程狀態的外掛／控制器程式碼，而不適用於一般的臨時代理程式用途。

## 輸出封裝

Lobster 會傳回具有下列三種狀態之一的 JSON 封裝：

- `ok`：成功完成
- `needs_approval`：已暫停；`requiresApproval` 包含 `resumeToken` 和簡短的 `approvalId`，兩者皆可用於恢復執行
- `cancelled`：已明確拒絕或取消

此工具會同時在 `content`（格式化 JSON）和 `details`（原始物件）中提供封裝。

## 核准

若存在 `requiresApproval`，請檢查提示並決定：

- `approve: true`：恢復並繼續執行副作用
- `approve: false`：取消並結束工作流程

使用 `approve --preview-from-stdin --limit N` 可將 JSON 預覽附加至核准要求，而不需要自訂 jq／heredoc 串接邏輯。恢復狀態會以小型 JSON 檔案儲存在 Lobster 狀態目錄下（預設為 `~/.lobster/state`，可透過 `LOBSTER_STATE_DIR` 覆寫）；權杖本身只會編碼指向該狀態的指標，不會包含完整的管線狀態。

## OpenProse

OpenProse 很適合搭配 Lobster 使用：先使用 `/prose` 協調多代理程式的準備工作，再執行 Lobster 管線以進行確定性的核准。若 Prose 程式需要 Lobster，請透過 `tools.subagents.tools` 允許子代理程式使用 `lobster` 工具。請參閱 [OpenProse](/zh-TW/prose)。

## 安全性

- **僅限本機處理序內執行**：工作流程在閘道處理序內執行；外掛本身不會發出網路呼叫。
- **不管理祕密資訊**：Lobster 不管理 OAuth；它會呼叫負責此作業的 OpenClaw 工具。
- **支援沙箱環境感知**：工具環境經過沙箱化時會停用。
- **強化防護**：嵌入式執行器會強制執行逾時與輸出上限。

## 疑難排解

| 錯誤                                                          | 原因／修正方式                                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | 管線超過 `timeoutMs`。請提高此值或拆分管線。                                    |
| `lobster stdout exceeded maxStdoutBytes`（或 `stderr`）       | 擷取到的輸出超過上限。請提高 `maxStdoutBytes` 或減少輸出。                      |
| `run --args-json must be valid JSON`                          | 無法剖析 `argsJson`（工作流程檔案執行）。請修正 JSON 字串。                     |
| `lobster runtime failed`（或其他 `runtime_error` 訊息）       | 嵌入式執行階段傳回錯誤封裝。請查看閘道記錄以取得詳細資訊。                      |

## 深入瞭解

- [外掛](/zh-TW/tools/plugin)
- [外掛工具編寫方式](/zh-TW/plugins/building-plugins#registering-agent-tools)

## 案例研究：社群工作流程

一個公開範例：使用「第二大腦」命令列介面與 Lobster 管線管理三個
Markdown 資料庫（個人、伴侶、共用）。命令列介面會輸出統計資料、
收件匣清單及過期掃描的 JSON；Lobster 將這些命令串接成
`weekly-review`、`inbox-triage`、`memory-consolidation` 和
`shared-task-sync` 等工作流程，每個流程皆設有核准關卡。AI 可用時會負責判斷
（分類），不可用時則改用確定性規則。

- 討論串：[https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- 程式碼儲存庫：[https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 相關內容

- [自動化](/zh-TW/automation) - 所有自動化機制
- [工具概覽](/zh-TW/tools) - 所有可用的代理程式工具
