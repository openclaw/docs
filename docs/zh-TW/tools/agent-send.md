---
read_when:
    - 你想要從指令碼或命令列觸發代理程式執行
    - 你需要以程式化方式將代理回覆傳送到聊天頻道
summary: 從命令列介面執行代理回合，並可選擇將回覆傳送到頻道
title: 代理傳送
x-i18n:
    generated_at: "2026-06-27T20:04:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` 可從命令列執行單一代理回合，不需要
傳入的聊天訊息。可用於腳本化工作流程、測試，以及
程式化傳遞。

## 快速開始

<Steps>
  <Step title="執行簡單的代理回合">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    這會透過閘道傳送訊息並列印回覆。

  </Step>

  <Step title="從檔案傳送多行提示">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    這會將有效的 UTF-8 檔案讀取為代理訊息本文。

  </Step>

  <Step title="指定特定代理或工作階段">
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

  <Step title="將回覆傳遞到頻道">
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

| 旗標                          | 說明                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | 要傳送的內嵌訊息                                            |
| `--message-file \<path\>`     | 從有效的 UTF-8 檔案讀取訊息                                 |
| `--to \<dest\>`               | 從目標（電話、聊天 ID）衍生工作階段金鑰                     |
| `--session-key \<key\>`       | 使用明確的工作階段金鑰                                      |
| `--agent \<id\>`              | 指定已設定的代理（使用其 `main` 工作階段）                  |
| `--session-id \<id\>`         | 依 ID 重用現有工作階段                                      |
| `--local`                     | 強制使用本機內嵌執行階段（略過閘道）                       |
| `--deliver`                   | 將回覆傳送到聊天頻道                                        |
| `--channel \<name\>`          | 傳遞頻道（whatsapp、telegram、discord、slack 等）           |
| `--reply-to \<target\>`       | 覆寫傳遞目標                                                |
| `--reply-channel \<name\>`    | 覆寫傳遞頻道                                                |
| `--reply-account \<id\>`      | 覆寫傳遞帳戶 ID                                             |
| `--thinking \<level\>`        | 為所選模型設定檔設定思考等級                                |
| `--verbose \<on\|full\|off\>` | 設定詳細程度                                                |
| `--timeout \<seconds\>`       | 覆寫代理逾時                                                |
| `--json`                      | 輸出結構化 JSON                                             |

## 行為

- 預設情況下，命令列介面會**透過閘道**。加入 `--local` 以強制在目前機器上使用
  內嵌執行階段。
- 在 `--message` 或 `--message-file` 中恰好傳入其中一個。檔案訊息會在移除選用的 UTF-8 BOM 後保留
  多行內容。
- 如果閘道無法連線，命令列介面會**退回**到本機內嵌執行。
- 工作階段選擇：`--to` 會衍生工作階段金鑰（群組/頻道目標
  保留隔離；直接聊天會收斂到 `main`）。
- `--session-key` 會選擇明確的金鑰。代理前綴金鑰必須使用
  `agent:<agent-id>:<session-key>`，且同時提供 `--agent` 時，其值必須符合該代理 ID。
  未加前哨詞的裸金鑰會在提供 `--agent` 時限縮至該代理；例如
  `--agent ops --session-key incident-42` 會路由至
  `agent:ops:incident-42`。若沒有 `--agent`，未加前哨詞的裸金鑰會限縮至
  已設定的預設代理。字面值 `global` 和 `unknown` 只有在未提供 `--agent` 時才會保持
  不限縮；在此情況下，內嵌退回和儲存區擁有權會使用已設定的預設代理。
- 思考與詳細旗標會持久化到工作階段儲存區。
- 輸出：預設為純文字，或使用 `--json` 取得結構化酬載 + 中繼資料。
- 使用 `--json --deliver` 時，JSON 會包含已傳送、已抑制、部分傳送與傳送失敗的傳遞狀態。請參閱
  [JSON 傳遞狀態](/zh-TW/cli/agent#json-delivery-status)。

## 範例

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

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
  <Card title="代理命令列介面參考" href="/zh-TW/cli/agent" icon="terminal">
    完整的 `openclaw agent` 旗標與選項參考。
  </Card>
  <Card title="子代理" href="/zh-TW/tools/subagents" icon="users">
    背景子代理產生。
  </Card>
  <Card title="工作階段" href="/zh-TW/concepts/session" icon="comments">
    工作階段金鑰的運作方式，以及 `--to`、`--agent` 和 `--session-id` 如何解析它們。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="slash">
    代理工作階段內使用的原生命令目錄。
  </Card>
</CardGroup>
