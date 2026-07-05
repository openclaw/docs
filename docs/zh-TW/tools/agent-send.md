---
read_when:
    - 你想要從指令碼或命令列觸發代理執行
    - 你需要以程式化方式將代理回覆傳送到聊天頻道
summary: 從命令列介面執行代理回合，並可選擇將回覆傳送至頻道
title: 代理程式傳送
x-i18n:
    generated_at: "2026-07-05T11:43:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d18acce5a6925463d6fb97c2cbf1d6392611cbeced604a821fa1edaa7fbc5b01
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` 會從命令列執行單次代理程式回合，且不需要傳入的聊天訊息。可用於指令碼工作流程、測試與程式化交付。完整旗標與行為參考：
[代理程式命令列介面參考](/zh-TW/cli/agent).

## 快速開始

<Steps>
  <Step title="執行簡單的代理程式回合">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    透過閘道傳送訊息並列印回覆。

  </Step>

  <Step title="從檔案傳送多行提示">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    將有效的 UTF-8 檔案讀取為代理程式訊息本文。

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

  <Step title="將回覆傳送到頻道">
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
| `--session-key <key>`       | 使用明確的工作階段金鑰                                          |
| `--agent <id>`              | 指定已設定的代理程式（使用其 `main` 工作階段）                  |
| `--session-id <id>`         | 依 ID 重用現有工作階段                                      |
| `--model <id>`              | 此次執行的模型覆寫（`provider/model` 或模型 ID）           |
| `--local`                   | 強制使用本機嵌入式執行階段（略過閘道）                          |
| `--deliver`                 | 將回覆傳送到聊天頻道                                     |
| `--channel <name>`          | 交付頻道（discord、slack、telegram、whatsapp 等）          |
| `--reply-to <target>`       | 交付目標覆寫                                             |
| `--reply-channel <name>`    | 交付頻道覆寫                                            |
| `--reply-account <id>`      | 交付帳戶 ID 覆寫                                         |
| `--thinking <level>`        | 設定所選模型設定檔的思考等級                    |
| `--verbose <on\|full\|off>` | 保存工作階段的詳細程度（`full` 也會記錄工具輸出） |
| `--timeout <seconds>`       | 覆寫代理程式逾時（預設 600，或設定值）                |
| `--json`                    | 輸出結構化 JSON                                               |

## 行為

- 預設情況下，命令列介面會**經由閘道**。加入 `--local` 可強制在目前機器上使用嵌入式執行階段。
- 只能傳入 `--message` 或 `--message-file` 其中之一。檔案訊息會在移除選用的 UTF-8 BOM 後保留多行內容。
- 如果閘道請求失敗，命令列介面會**退回**到本機嵌入式執行；閘道逾時會改用全新的工作階段退回，而不是與原始逐字稿競速。
- 工作階段選擇：`--to` 會衍生工作階段金鑰（群組/頻道目標會保留隔離；直接聊天會收斂到 `main`）。
- `--session-key` 會選取明確的金鑰。代理程式前綴金鑰必須使用 `agent:<agent-id>:<session-key>`，且同時提供 `--agent` 時必須符合該代理程式 ID。裸露的非哨兵金鑰會在提供 `--agent` 時限定於該代理程式；例如，`--agent ops --session-key incident-42` 會路由至 `agent:ops:incident-42`。若沒有 `--agent`，裸露的非哨兵金鑰會限定於已設定的預設代理程式。字面值 `global` 和 `unknown` 只有在未提供 `--agent` 時才保持未限定；嵌入式退回路徑會將這些哨兵工作階段解析為已設定的預設代理程式。
- `--channel`、`--reply-channel` 和 `--reply-account` 會影響回覆交付，而不是工作階段路由。
- 思考與詳細旗標會保存到工作階段儲存區。
- 輸出：預設為純文字，或使用 `--json` 取得結構化承載資料與中繼資料。
- 使用 `--json --deliver` 時，JSON 會包含已傳送、已抑制、部分和失敗傳送的交付狀態。請參閱
  [JSON 交付狀態](/zh-TW/cli/agent#json-delivery-status)。

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

## 相關

<CardGroup cols={2}>
  <Card title="代理程式命令列介面參考" href="/zh-TW/cli/agent" icon="terminal">
    完整的 `openclaw agent` 旗標與選項參考。
  </Card>
  <Card title="子代理程式" href="/zh-TW/tools/subagents" icon="users">
    背景子代理程式產生。
  </Card>
  <Card title="工作階段" href="/zh-TW/concepts/session" icon="comments">
    工作階段金鑰如何運作，以及 `--to`、`--agent` 和 `--session-id` 如何解析它們。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="slash">
    代理程式工作階段內使用的原生命令目錄。
  </Card>
</CardGroup>
