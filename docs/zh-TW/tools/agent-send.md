---
read_when:
    - 您想要從指令碼或命令列觸發代理程式執行
    - 您需要以程式方式將代理程式回覆傳送到聊天頻道
summary: 從 CLI 執行代理回合，並可選擇將回覆傳送至頻道
title: 代理程式傳送
x-i18n:
    generated_at: "2026-05-06T02:57:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1339ebd74e2349669942ff93f200b53a69ad05f2186d6ff76437c779f312a291
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` 會從命令列執行單一代理程式回合，不需要
傳入的聊天訊息。可用於腳本化工作流程、測試，以及
程式化傳遞。

## 快速開始

<Steps>
  <Step title="執行簡單的代理程式回合">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    這會透過 Gateway 傳送訊息並印出回覆。

  </Step>

  <Step title="指定特定代理程式或工作階段">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
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

| 旗標                          | 說明                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | 要傳送的訊息（必填）                                  |
| `--to \<dest\>`               | 從目標（電話、聊天 ID）衍生工作階段金鑰           |
| `--agent \<id\>`              | 指定已設定的代理程式（使用其 `main` 工作階段）         |
| `--session-id \<id\>`         | 依 ID 重用現有工作階段                             |
| `--local`                     | 強制使用本機嵌入式執行階段（略過 Gateway）                 |
| `--deliver`                   | 將回覆傳送到聊天頻道                            |
| `--channel \<name\>`          | 傳遞頻道（whatsapp、telegram、discord、slack 等） |
| `--reply-to \<target\>`       | 覆寫傳遞目標                                    |
| `--reply-channel \<name\>`    | 覆寫傳遞頻道                                   |
| `--reply-account \<id\>`      | 覆寫傳遞帳戶 ID                                |
| `--thinking \<level\>`        | 設定所選模型設定檔的思考層級           |
| `--verbose \<on\|full\|off\>` | 設定詳細程度                                           |
| `--timeout \<seconds\>`       | 覆寫代理程式逾時                                      |
| `--json`                      | 輸出結構化 JSON                                      |

## 行為

- 預設情況下，CLI 會**透過 Gateway**。加入 `--local` 可強制使用目前機器上的
  嵌入式執行階段。
- 如果 Gateway 無法連線，CLI 會**退回**本機嵌入式執行。
- 工作階段選取：`--to` 會衍生工作階段金鑰（群組/頻道目標
  會保留隔離；直接聊天會收斂到 `main`）。
- 思考與詳細旗標會持久保存到工作階段儲存區。
- 輸出：預設為純文字，或使用 `--json` 取得結構化承載資料與中繼資料。

## 範例

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## 相關

<CardGroup cols={2}>
  <Card title="代理程式 CLI 參考" href="/zh-TW/cli/agent" icon="terminal">
    完整的 `openclaw agent` 旗標與選項參考。
  </Card>
  <Card title="子代理程式" href="/zh-TW/tools/subagents" icon="users">
    背景子代理程式產生。
  </Card>
  <Card title="工作階段" href="/zh-TW/concepts/session" icon="comments">
    工作階段金鑰的運作方式，以及 `--to`、`--agent` 和 `--session-id` 如何解析它們。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="slash">
    代理程式工作階段內使用的原生命令目錄。
  </Card>
</CardGroup>
