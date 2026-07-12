---
read_when:
    - 您想要從指令碼或命令列觸發代理程式執行
    - 您需要以程式化方式將代理程式回覆傳送到聊天頻道
summary: 從命令列介面執行代理回合，並可選擇將回覆傳送至頻道
title: 代理傳送
x-i18n:
    generated_at: "2026-07-11T21:52:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` 可從命令列執行單次代理程式回合，無須接收傳入的聊天訊息。它適用於指令碼化工作流程、測試及程式化傳遞。完整的旗標與行為參考：
[代理程式命令列介面參考](/zh-TW/cli/agent)。

## 快速開始

<Steps>
  <Step title="執行簡單的代理程式回合">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    透過閘道傳送訊息並印出回覆。

  </Step>

  <Step title="從檔案傳送多行提示詞">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    讀取有效的 UTF-8 檔案，作為代理程式訊息的本文。

  </Step>

  <Step title="指定特定代理程式或工作階段">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"

    # Target an exact session key
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
    ```

  </Step>

  <Step title="將回覆傳遞至頻道">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## 旗標

| 旗標                        | 說明                                                          |
| --------------------------- | -------------------------------------------------------------------- |
| `--message <text>`          | 要傳送的行內訊息                                               |
| `--message-file <path>`     | 從有效的 UTF-8 檔案讀取訊息                             |
| `--to <dest>`               | 從目標（電話、聊天 ID）衍生工作階段金鑰                    |
| `--session-key <key>`       | 使用明確指定的工作階段金鑰                                          |
| `--agent <id>`              | 指定已設定的代理程式（使用其 `main` 工作階段）                  |
| `--session-id <id>`         | 依 ID 重複使用現有工作階段                                      |
| `--model <id>`              | 覆寫此回合使用的模型（`provider/model` 或模型 ID）           |
| `--local`                   | 強制使用本機內嵌執行階段（略過閘道）                          |
| `--deliver`                 | 將回覆傳送至聊天頻道                                     |
| `--channel <name>`          | 傳遞頻道；搭配 `--agent` + `--to` 時，也會套用私訊範圍     |
| `--reply-to <target>`       | 覆寫傳遞目標                                             |
| `--reply-channel <name>`    | 覆寫傳遞頻道                                            |
| `--reply-account <id>`      | 覆寫傳遞帳戶 ID                                         |
| `--thinking <level>`        | 設定所選模型設定檔的思考層級                    |
| `--verbose <on\|full\|off>` | 將詳細程度持續保存於工作階段中（`full` 也會記錄工具輸出） |
| `--timeout <seconds>`       | 覆寫代理程式逾時時間（預設為 600，或使用設定值）                |
| `--json`                    | 輸出結構化 JSON                                               |

## 行為

- 命令列介面預設會**透過閘道**執行。加入 `--local` 可強制使用目前機器上的
  內嵌執行階段。
- `--message` 與 `--message-file` 必須且只能傳入其中一個。檔案訊息會在移除可選的
  UTF-8 BOM 後保留多行內容。
- 如果閘道請求失敗，命令列介面會**退回**至本機內嵌執行；
  閘道逾時時，會使用全新的工作階段退回執行，而不是與原始對話記錄競速。
- 工作階段選擇：`--to` 會衍生工作階段金鑰（群組／頻道目標會
  保持隔離；直接聊天則會合併至 `main`）。同時使用 `--agent`、
  `--channel` 和 `--to` 時，路由會遵循頻道的標準收件者
  及 `session.dmScope`。僅用於穩定外送的身分會使用供應商擁有的工作階段，
  並與代理程式的主要工作階段隔離。
- `--session-key` 會選取明確指定的金鑰。以代理程式為前綴的金鑰必須使用
  `agent:<agent-id>:<session-key>`；同時提供 `--agent` 時，其代理程式 ID
  必須相符。若提供 `--agent`，不含前綴且非哨兵值的金鑰會限定於該代理程式；
  例如，`--agent ops --session-key incident-42` 會路由至
  `agent:ops:incident-42`。若未提供 `--agent`，不含前綴且非哨兵值的金鑰會限定於
  已設定的預設代理程式。只有在未提供 `--agent` 時，字面值 `global` 與
  `unknown` 才會保持不限定範圍；內嵌退回路徑會將這些哨兵工作階段解析至
  已設定的預設代理程式。
- `--reply-channel` 與 `--reply-account` 只會影響傳遞。
- 思考與詳細程度旗標會持續保存至工作階段儲存區。
- 輸出：預設為純文字；使用 `--json` 則會輸出結構化承載資料與中繼資料。
- 使用 `--json --deliver` 時，JSON 會包含已傳送、已抑制、部分成功及失敗傳送的
  傳遞狀態。請參閱
  [JSON 傳遞狀態](/zh-TW/cli/agent#json-delivery-status)。

## 範例

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with a model override
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Multiline prompt from a file
openclaw agent --agent ops --message-file ./task.md

# Exact session key
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Legacy key scoped to an agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## 相關內容

<CardGroup cols={2}>
  <Card title="代理程式命令列介面參考" href="/zh-TW/cli/agent" icon="terminal">
    完整的 `openclaw agent` 旗標與選項參考。
  </Card>
  <Card title="子代理程式" href="/zh-TW/tools/subagents" icon="users">
    在背景產生子代理程式。
  </Card>
  <Card title="工作階段" href="/zh-TW/concepts/session" icon="comments">
    工作階段金鑰的運作方式，以及 `--to`、`--agent` 和 `--session-id` 如何解析這些金鑰。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="slash">
    代理程式工作階段內使用的原生命令目錄。
  </Card>
</CardGroup>
