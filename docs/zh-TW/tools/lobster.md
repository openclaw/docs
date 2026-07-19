---
read_when:
    - 你想要具備明確核准機制的確定性多步驟工作流程
    - 你需要在不重新執行先前步驟的情況下繼續工作流程
summary: 適用於 OpenClaw、具備可續接核准關卡的型別化工作流程執行階段。
title: Lobster
x-i18n:
    generated_at: "2026-07-19T14:09:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 85b7900f86bfedc9d73fcc91c3d0dac37b81f7413b1e68c54dd8a797b70f79fc
    source_path: tools/lobster.md
    workflow: 16
---

Lobster 將多步驟工具流水線作為一次確定性的工具呼叫執行，並提供
明確的核准檢查點與恢復權杖。它位於分離式背景工作之上的一層：
若要協調跨越多個分離式工作的流程，請參閱 [Task Flow](/zh-TW/automation/taskflow) (`openclaw tasks flow`)；
若要查看工作活動帳本，請參閱[背景工作](/zh-TW/automation/tasks)。

## 原因

若沒有 Lobster，多步驟工作表示需要多次往返工具呼叫，並由模型
協調每個步驟。Lobster 將這項協調移入具型別的執行階段：

- **一次呼叫取代多次呼叫**：單次 Lobster 工具呼叫會傳回整個流水線的結構化
  結果。
- **內建核准機制**：副作用（傳送、發布、刪除）會暫停工作流程，
  直到獲得明確核准。
- **可恢復**：暫停的工作流程會傳回權杖；核准並恢復時，
  不會重新執行先前的步驟。

Lobster 是一種小型且受限的 DSL，而不是通用指令碼語言：
核准／恢復是一項持久且內建的原語；流水線是資料（易於
記錄、比較差異、重播、審查）；精簡的文法會限制「創意式」程式碼路徑，
讓驗證維持實際可行；逾時、輸出上限、沙箱檢查及
允許清單均由執行階段強制執行，而非由各指令碼自行處理。每個步驟仍可
呼叫任何命令列介面或指令碼；若想使用更豐富的撰寫語言，可透過其他工具產生 `.lobster` 檔案。

若沒有 Lobster，週期性的電子郵件分類流程如下：

```text
使用者：「檢查我的電子郵件並草擬回覆」
→ openclaw 呼叫 gmail.list
→ LLM 進行摘要
→ 使用者：「為第 2 封和第 5 封草擬回覆」
→ LLM 草擬回覆
→ 使用者：「傳送第 2 封」
→ openclaw 呼叫 gmail.send
（每天重複，且不會記得哪些郵件已分類）
```

使用 Lobster 時，相同工作只需一次呼叫，並會暫停以等待核准，之後再恢復：

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 封需要回覆，2 封需要處理" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "要傳送 2 封回覆草稿嗎？",
    "items": [],
    "resumeToken": "..."
  }
}
```

## 運作方式

OpenClaw 使用隨附的
`@clawdbot/lobster` 套件作為嵌入式執行器，**在處理程序內**執行 Lobster 工作流程。不會產生外部 `lobster`
子處理程序；工具呼叫會直接傳回 JSON 信封。若
流水線因等待核准而暫停，信封會攜帶恢復權杖（或簡短的
核准 ID），讓你稍後可以繼續。

## 啟用

Lobster 是**選用的**外掛工具，預設不會啟用。它已隨附於套件中，
因此不需要另外安裝，只需允許使用此工具：

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

或針對個別代理程式設定：

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
`alsoAllow` 會在作用中的工具設定檔之上新增 `lobster`，
而不限制其他核心工具。只有在你想使用限制性的
允許清單模式時，才改用 `tools.allow`。
</Note>

在沙箱化工具內容中，此工具會完全停用。

如果你需要獨立的 Lobster 命令列介面進行開發或執行外部流水線
（位於嵌入式閘道執行器之外），請從
[Lobster 儲存庫](https://github.com/openclaw/lobster)安裝，並將 `lobster` 放入
`PATH`。

## 模式：小型命令列介面 + JSON 管線 + 核准

建立使用 JSON 溝通的小型命令，再將它們串接成一次 Lobster 呼叫。
（以下為命令名稱範例，請替換成你自己的命令。）

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt '套用變更？'",
  "timeoutMs": 30000
}
```

若流水線要求核准，請使用權杖恢復：

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

範例：將輸入項目對應至工具呼叫：

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## 僅限 JSON 的 LLM 步驟（llm-task）

若要在工作流程中使用**結構化 LLM 步驟**，請啟用選用的
`llm-task` 外掛工具，並從 Lobster 呼叫它：

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

隨附的 Lobster 外掛會在閘道內**以處理程序內模式**執行工作流程。
在此嵌入式模式下，`openclaw.invoke` **不會**自動繼承
巢狀 OpenClaw 命令列介面工具呼叫所需的閘道 URL／驗證內容。

這表示下列模式目前在嵌入式執行器中**並不可靠**：

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

只有在環境中已使用正確的
閘道／驗證內容設定 `openclaw.invoke`，並執行**獨立 Lobster 命令列介面**時，
才使用下列範例。

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "根據輸入的電子郵件，傳回意圖與草稿。",
  "thinking": "low",
  "input": { "subject": "你好", "body": "你可以幫忙嗎？" },
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

如果你目前使用嵌入式 Lobster 外掛，建議選擇以下任一方式：

- 在 Lobster 外直接呼叫 `llm-task` 工具，或
- 在 Lobster 流水線中使用非 `openclaw.invoke` 步驟，直到加入受支援的
  嵌入式橋接機制。

如需詳細資訊與設定選項，請參閱 [LLM 工作](/zh-TW/tools/llm-task)。

## 工作流程檔案（.lobster）

Lobster 可以執行包含 `name`、`args`、`steps`、`env`、
`condition` 及 `approval` 欄位的 YAML／JSON 工作流程檔案。在工具
呼叫中將 `pipeline` 設為檔案路徑。

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

- `stdin: $step.stdout` 與 `stdin: $step.json` 會傳遞先前步驟的輸出。
- `condition`（或 `when`）可以根據 `$step.approved` 控制步驟是否執行。

### 注入的環境變數

每個步驟的 shell 都會繼承父環境以及下列由 Lobster 注入的
變數，因此命令可以參照已解析的工作流程引數，而不必將
原始值嵌入命令字串：

- `LOBSTER_ARG_<NAME>`：每個工作流程引數各一個。名稱會轉為大寫，並將每段
  連續的非英數字元縮合為 `_`，因此引數 `user-id` 會變成
  `LOBSTER_ARG_USER_ID`。
- `LOBSTER_ARGS_JSON`：將所有已解析的引數合併為單一 JSON 字串。

以上就是完整的注入集合。**不會**提供每個步驟專屬的輸出變數，
例如 `LOBSTER_STEP_<id>_STDOUT` 或 `LOBSTER_STEP_<id>_JSON_<field>`；shell
會將這些名稱視為未設定，因此參數展開的預設值可能會掩蓋錯誤。
請改為透過步驟參照讀取先前步驟的輸出：在 `stdin:`、`env:` 或 `condition:`
值中使用 `$step.stdout`、
`$step.json` 或 `$step.json.<field>`。（`LOBSTER_STATE_DIR` 是狀態
目錄的獨立執行階段設定，而不是每次執行的引數。）

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

| 欄位             | 預設值       | 注意事項                                                                                                     |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| `pipeline`       | 必填         | 行內流水線字串，或以 `.lobster`/`.yaml`/`.yml`/`.json` 結尾的工作流程檔案路徑。 |
| `cwd`            | 閘道 cwd     | 相對工作目錄；必須解析至閘道工作目錄內（拒絕絕對路徑）。                                                     |
| `timeoutMs`      | `20000`     | 超過此時間即中止執行。                                                                                       |
| `maxStdoutBytes` | `512000`    | 擷取的 stdout 或 stderr 超過此大小即中止執行。                                                               |
| `argsJson`       | -           | 工作流程檔案的 JSON 引數字串（行內流水線會忽略此值）。                                                       |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` 接受 `token`（來自 `requiresApproval` 的完整恢復權杖）
或 `approvalId`（來自同一物件的簡短 ID），請使用暫停執行所傳回的項目。
`approve` 為必填。

### 受管理的 Task Flow 模式

在 `run` 上傳遞 `flowControllerId` 與 `flowGoal`（或在 `resume` 上傳遞 `flowId` 與
`flowExpectedRevision`），會讓呼叫透過外掛
執行階段受管理的 [Task Flow](/zh-TW/automation/taskflow) API 執行，而不是傳回
單純的信封：OpenClaw 會建立或恢復持久流程記錄，將
Lobster 信封套用至其中（核准時使用 `waiting`，完成時使用 `succeeded`/`failed`），
並傳回 `{ ok, envelope, flow, mutation }`。此模式需要
已繫結的 Task Flow 執行階段，適用於需要在
閘道重新啟動後仍保留持久流程狀態的外掛／控制器程式碼，而非一般的臨時代理程式用途。

## 輸出信封

Lobster 會傳回具有以下三種狀態之一的 JSON 信封：

- `ok`：已成功完成
- `needs_approval`：已暫停；`requiresApproval` 包含 `resumeToken` 與簡短的
  `approvalId`，兩者皆可用於恢復執行
- `cancelled`：已明確拒絕或取消

此工具會同時在 `content`（格式化 JSON）與 `details`
（原始物件）中提供信封。

## 核准

若存在 `requiresApproval`，請檢查提示並決定：

- `approve: true`：恢復並繼續執行副作用
- `approve: false`：取消並結束工作流程

使用 `approve --preview-from-stdin --limit N` 可將 JSON 預覽附加至
核准要求，無須自訂 jq／heredoc 黏合程式碼。恢復狀態會儲存為
Lobster 狀態目錄下的小型 JSON 檔案（預設為 `~/.lobster/state`，
可使用 `LOBSTER_STATE_DIR` 覆寫）；權杖本身只會編碼
指向該狀態的指標，而不包含完整的流水線狀態。

## OpenProse

OpenProse 與 Lobster 能良好搭配：使用 `/prose` 協調多代理程式
準備工作，接著執行 Lobster 流水線進行確定性核准。如果 Prose
程式需要 Lobster，請透過 `tools.subagents.tools` 允許子代理程式使用
`lobster` 工具。請參閱 [OpenProse](/zh-TW/prose)。

## 安全性

- **僅限本機程序內** - 工作流程在閘道程序內執行；外掛本身不會發出
  網路呼叫。
- **不含密鑰** - Lobster 不管理 OAuth；它會呼叫負責此工作的 OpenClaw 工具。
- **可感知沙箱** - 工具內容在沙箱中執行時停用。
- **強化保護** - 由嵌入式執行器強制實施逾時與輸出上限。

## 疑難排解

| 錯誤                                                         | 原因／修正方式                                                                      |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | 流水線超過 `timeoutMs`。請提高此值或拆分流水線。                |
| `lobster stdout exceeded maxStdoutBytes`（或 `stderr`）        | 擷取的輸出超過上限。請提高 `maxStdoutBytes` 或減少輸出。       |
| `run --args-json must be valid JSON`                          | 無法剖析 `argsJson`（工作流程檔案執行）。請修正 JSON 字串。            |
| `lobster runtime failed`（或其他 `runtime_error` 訊息） | 嵌入式執行階段傳回錯誤封套。請查看閘道日誌以取得詳細資訊。 |

## 深入瞭解

- [外掛](/zh-TW/tools/plugin)
- [外掛工具編寫](/zh-TW/plugins/building-plugins#registering-agent-tools)

## 案例研究：社群工作流程

一個公開範例是使用「第二大腦」命令列介面與 Lobster 流水線，管理三個
Markdown 資料庫（個人、伴侶、共用）。命令列介面會針對統計資料、
收件匣清單與過期掃描輸出 JSON；Lobster 會將這些命令串接成
`weekly-review`、`inbox-triage`、`memory-consolidation` 和
`shared-task-sync` 等工作流程，每個工作流程都設有核准關卡。AI 可用時會負責判斷
（分類），不可用時則改用確定性規則。

- 討論串：[https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- 儲存庫：[https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 相關內容

- [自動化](/zh-TW/automation) - 所有自動化機制
- [工具概覽](/zh-TW/tools) - 所有可用的代理程式工具
