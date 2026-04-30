---
read_when:
    - 你想從指令碼或命令列觸發代理程式執行
    - 你需要以程式方式將代理回覆傳送到聊天頻道
summary: 從 CLI 執行代理回合，並可選擇將回覆傳送到頻道
title: 代理程式傳送
x-i18n:
    generated_at: "2026-04-30T03:42:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f29ab906ed8179b265138ee27312c8f4b318d09b73ad61843fca6809c32bd31
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` 可從命令列執行單一代理回合，無需傳入的聊天訊息。可用於指令碼工作流程、測試，以及程式化傳遞。

## 快速開始

<Steps>
  <Step title="執行簡單的代理回合">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    這會透過 Gateway 傳送訊息並列印回覆。

  </Step>

  <Step title="指定特定代理或工作階段">
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
| `--message \<text\>`          | 要傳送的訊息（必要）                                  |
| `--to \<dest\>`               | 從目標（電話、聊天 ID）衍生工作階段金鑰           |
| `--agent \<id\>`              | 指定已設定的代理（使用其 `main` 工作階段）         |
| `--session-id \<id\>`         | 依 ID 重複使用現有工作階段                             |
| `--local`                     | 強制使用本機嵌入式執行階段（略過 Gateway）                 |
| `--deliver`                   | 將回覆傳送到聊天頻道                            |
| `--channel \<name\>`          | 傳遞頻道（whatsapp、telegram、discord、slack 等） |
| `--reply-to \<target\>`       | 覆寫傳遞目標                                    |
| `--reply-channel \<name\>`    | 覆寫傳遞頻道                                   |
| `--reply-account \<id\>`      | 覆寫傳遞帳號 ID                                |
| `--thinking \<level\>`        | 設定所選模型設定檔的思考層級           |
| `--verbose \<on\|full\|off\>` | 設定詳細程度                                           |
| `--timeout \<seconds\>`       | 覆寫代理逾時時間                                      |
| `--json`                      | 輸出結構化 JSON                                      |

## 行為

- 預設情況下，CLI 會**透過 Gateway**。加入 `--local` 可強制使用目前機器上的嵌入式執行階段。
- 如果無法連線到 Gateway，CLI 會**退回**本機嵌入式執行。
- 工作階段選擇：`--to` 會衍生工作階段金鑰（群組/頻道目標會保留隔離；直接聊天會摺疊到 `main`）。
- 思考與詳細旗標會持久化到工作階段儲存區。
- 輸出：預設為純文字，或使用 `--json` 取得結構化承載 + 中繼資料。

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

- [代理 CLI 參考](/zh-TW/cli/agent)
- [子代理](/zh-TW/tools/subagents) — 背景子代理產生
- [工作階段](/zh-TW/concepts/session) — 工作階段金鑰的運作方式
