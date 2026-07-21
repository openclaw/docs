---
read_when:
    - 你想要從指令碼或命令列觸發代理程式執行
    - 你需要以程式化方式將代理程式回覆傳送至聊天頻道
summary: 從命令列介面執行代理回合，並可選擇將回覆傳送至頻道
title: 代理傳送
x-i18n:
    generated_at: "2026-07-21T09:03:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ad3da0feea102725ebb5555e0dd375ed6f3a0396d8ffd0ab916ced303201eabc
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` 可從命令列執行單次代理程式回合，不需要傳入的聊天訊息。適用於指令碼工作流程、測試及程式化傳送。完整的旗標與行為參考：
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

    將有效的 UTF-8 檔案內容讀取為代理程式訊息本文。

  </Step>

  <Step title="指定特定代理程式或工作階段">
    ```bash
    # 指定特定代理程式
    openclaw agent --agent ops --message "彙整記錄"

    # 指定電話號碼（衍生工作階段金鑰）
    openclaw agent --to +15555550123 --message "狀態更新"

    # 重複使用現有工作階段
    openclaw agent --session-id abc123 --message "繼續執行工作"

    # 指定確切的工作階段金鑰
    openclaw agent --session-key agent:ops:incident-42 --message "彙整狀態"
    ```

  </Step>

  <Step title="將回覆傳送至頻道">
    ```bash
    # 傳送至 WhatsApp（預設頻道）
    openclaw agent --to +15555550123 --message "報告已就緒" --deliver

    # 傳送至 Slack
    openclaw agent --agent ops --message "產生報告" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## 旗標

| 旗標                        | 說明                                                          |
| --------------------------- | -------------------------------------------------------------------- |
| `--message <text>`          | 要傳送的行內訊息                                               |
| `--message-file <path>`     | 從有效的 UTF-8 檔案讀取訊息（上限為 4 MiB）                 |
| `--to <dest>`               | 從目標（電話號碼、聊天 ID）衍生工作階段金鑰                    |
| `--session-key <key>`       | 使用明確的工作階段金鑰                                          |
| `--agent <id>`              | 指定已設定的代理程式（使用其 `main` 工作階段）                  |
| `--session-id <id>`         | 依 ID 重複使用現有工作階段                                      |
| `--model <id>`              | 覆寫此回合的模型（`provider/model` 或模型 ID）           |
| `--local`                   | 強制使用本機嵌入式執行階段（略過閘道）                          |
| `--deliver`                 | 將回覆傳送至聊天頻道                                     |
| `--channel <name>`          | 傳送頻道；搭配 `--agent` + `--to` 時，也會套用私訊範圍     |
| `--reply-to <target>`       | 覆寫傳送目標                                             |
| `--reply-channel <name>`    | 覆寫傳送頻道                                            |
| `--reply-account <id>`      | 覆寫傳送帳號 ID                                         |
| `--thinking <level>`        | 設定所選模型設定檔的思考層級                    |
| `--verbose <on\|full\|off>` | 保存工作階段的詳細程度（`full` 也會記錄工具輸出） |
| `--timeout <seconds>`       | 覆寫代理程式逾時時間（預設為 600，或使用設定值）                |
| `--json`                    | 輸出結構化 JSON                                               |

## 行為

- 根據預設，命令列介面會**透過閘道**執行。加入 `--local` 可強制使用目前機器上的
  嵌入式執行階段。
- `--message` 或 `--message-file` 必須且只能傳入其中一個。移除可選的 UTF-8 BOM 後，檔案訊息會保留
  多行內容。大於
  4 MiB 的檔案會在分派前遭拒絕。
- 短暫性握手重試後，若閘道逾時或連線關閉，
  命令會失敗，並在 stderr 顯示提示；命令列介面絕不會無提示地改用嵌入式執行階段重新執行該回合。
  閘道仍可能完成已接受的回合，因此在重試或使用 `--local` 重新執行前，
  請先確認閘道與工作階段狀態。
- 工作階段選擇：`--to` 會衍生工作階段金鑰（群組／頻道目標會
  維持隔離；直接聊天則會歸併至 `main`）。同時使用 `--agent`、
  `--channel` 與 `--to` 時，路由會依循頻道的標準
  收件者與 `session.dmScope`。僅用於輸出的穩定身分會使用由供應商擁有的
  工作階段，與代理程式的主要工作階段隔離。
- `--session-key` 會選擇明確的金鑰。以代理程式為前綴的金鑰必須使用
  `agent:<agent-id>:<session-key>`，而同時提供兩者時，`--agent` 必須與該代理程式 ID 相符。
  提供 `--agent` 時，不含哨兵值的裸金鑰會限定於其範圍；
  例如，`--agent ops --session-key incident-42` 會路由至
  `agent:ops:incident-42`。若未提供 `--agent`，不含哨兵值的裸金鑰會限定於
  已設定的預設代理程式範圍。常值 `global` 與 `unknown`
  只有在未提供 `--agent` 時才不限定範圍。
- `--reply-channel` 與 `--reply-account` 僅影響傳送。
- 思考與詳細旗標會保存至工作階段儲存區。
- 輸出：預設為純文字，或使用 `--json` 輸出結構化承載資料與中繼資料。
- 使用 `--json --deliver` 時，JSON 會包含已傳送、
  已抑制、部分傳送及傳送失敗的傳送狀態。請參閱
  [JSON 傳送狀態](/zh-TW/cli/agent#json-delivery-status)。

## 範例

```bash
# 使用 JSON 輸出的簡單回合
openclaw agent --to +15555550123 --message "追蹤記錄" --verbose on --json

# 覆寫模型的回合
openclaw agent --agent ops --model openai/gpt-5.4 --message "彙整記錄"

# 設定思考層級的回合
openclaw agent --session-id 1234 --message "彙整收件匣" --thinking medium

# 從檔案讀取多行提示詞
openclaw agent --agent ops --message-file ./task.md

# 確切的工作階段金鑰
openclaw agent --session-key agent:ops:incident-42 --message "彙整狀態"

# 限定於代理程式範圍的舊版金鑰
openclaw agent --agent ops --session-key incident-42 --message "彙整狀態"

# 傳送至與工作階段不同的頻道
openclaw agent --agent ops --message "警示" --deliver --reply-channel telegram --reply-to "@admin"
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
    工作階段金鑰的運作方式，以及 `--to`、`--agent` 與 `--session-id` 如何解析這些金鑰。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="slash">
    代理程式工作階段內使用的原生命令目錄。
  </Card>
</CardGroup>
