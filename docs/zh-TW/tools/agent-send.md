---
read_when:
    - 你想要從指令碼或命令列觸發代理程式執行
    - 你需要以程式化方式將代理程式的回覆傳送至聊天頻道
summary: 從命令列介面執行代理回合，並可選擇將回覆傳送至頻道
title: 代理程式傳送
x-i18n:
    generated_at: "2026-07-19T14:05:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c7928ee5d7d4d6abf1b5580df96d4856cff71a2ffbf7b414fed82dbe7fab5ff5
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` 可從命令列執行單次代理程式回合，不需要接收
傳入的聊天訊息。適用於指令碼工作流程、測試及
程式化傳送。完整旗標與行為參考：
[代理程式命令列介面參考](/zh-TW/cli/agent)。

## 快速開始

<Steps>
  <Step title="執行簡單的代理程式回合">
    ```bash
    openclaw agent --agent main --message "今天天氣如何？"
    ```

    透過閘道傳送訊息並印出回覆。

  </Step>

  <Step title="從檔案傳送多行提示詞">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    讀取有效的 UTF-8 檔案作為代理程式訊息本文。

  </Step>

  <Step title="指定特定代理程式或工作階段">
    ```bash
    # 指定特定代理程式
    openclaw agent --agent ops --message "摘要記錄"

    # 指定電話號碼（衍生工作階段金鑰）
    openclaw agent --to +15555550123 --message "狀態更新"

    # 重複使用現有工作階段
    openclaw agent --session-id abc123 --message "繼續執行工作"

    # 指定確切的工作階段金鑰
    openclaw agent --session-key agent:ops:incident-42 --message "摘要狀態"
    ```

  </Step>

  <Step title="將回覆傳送至頻道">
    ```bash
    # 傳送至 WhatsApp（預設頻道）
    openclaw agent --to +15555550123 --message "報告已準備完成" --deliver

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
| `--message-file <path>`     | 從有效的 UTF-8 檔案讀取訊息（上限 4 MiB）                 |
| `--to <dest>`               | 從目標（電話、聊天 ID）衍生工作階段金鑰                    |
| `--session-key <key>`       | 使用明確指定的工作階段金鑰                                          |
| `--agent <id>`              | 指定已設定的代理程式（使用其 `main` 工作階段）                  |
| `--session-id <id>`         | 依 ID 重複使用現有工作階段                                      |
| `--model <id>`              | 覆寫此次執行的模型（`provider/model` 或模型 ID）           |
| `--local`                   | 強制使用本機嵌入式執行環境（略過閘道）                          |
| `--deliver`                 | 將回覆傳送至聊天頻道                                     |
| `--channel <name>`          | 傳送頻道；與 `--agent` + `--to` 搭配使用時，也會套用私訊範圍     |
| `--reply-to <target>`       | 覆寫傳送目標                                             |
| `--reply-channel <name>`    | 覆寫傳送頻道                                            |
| `--reply-account <id>`      | 覆寫傳送帳號 ID                                         |
| `--thinking <level>`        | 設定所選模型設定檔的思考層級                    |
| `--verbose <on\|full\|off>` | 保存工作階段的詳細程度（`full` 也會記錄工具輸出） |
| `--timeout <seconds>`       | 覆寫代理程式逾時時間（預設為 600，或使用設定值）                |
| `--json`                    | 輸出結構化 JSON                                               |

## 行為

- 命令列介面預設會**透過閘道**執行。加入 `--local` 可強制使用
  目前機器上的嵌入式執行環境。
- 必須且只能傳入 `--message` 或 `--message-file` 其中之一。檔案訊息會在移除
  選用的 UTF-8 BOM 後保留多行內容。超過
  4 MiB 的檔案會在分派前遭到拒絕。
- 如果閘道要求失敗，命令列介面會**改用**本機嵌入式
  執行；閘道逾時時會使用新的工作階段改用本機執行，而不會與
  原始逐字記錄競速。
- 工作階段選擇：`--to` 會衍生工作階段金鑰（群組／頻道目標
  會維持隔離；直接聊天則會合併至 `main`）。同時使用 `--agent`、
  `--channel` 和 `--to` 時，路由會依循頻道的標準
  收件者與 `session.dmScope`。僅用於穩定傳出的身分會使用
  由供應商擁有、且與代理程式主要工作階段隔離的工作階段。
- `--session-key` 會選取明確指定的金鑰。以代理程式為前綴的金鑰必須使用
  `agent:<agent-id>:<session-key>`，同時提供兩者時，`--agent` 必須符合該代理程式 ID。
  若提供 `--agent`，不含哨兵值的純金鑰會限定於其範圍；
  例如，`--agent ops --session-key incident-42` 會路由至
  `agent:ops:incident-42`。若未提供 `--agent`，不含哨兵值的純金鑰會限定於
  已設定的預設代理程式。只有在未提供 `--agent` 時，字面值
  `global` 和 `unknown` 才會維持不限定範圍；嵌入式備援路徑
  會將這些哨兵工作階段解析為已設定的預設代理程式。
- `--reply-channel` 和 `--reply-account` 僅影響傳送。
- 思考與詳細程度旗標會保存至工作階段儲存區。
- 輸出：預設為純文字，也可使用 `--json` 輸出結構化承載資料與中繼資料。
- 使用 `--json --deliver` 時，JSON 會包含已傳送、
  已抑制、部分完成及傳送失敗的傳送狀態。請參閱
  [JSON 傳送狀態](/zh-TW/cli/agent#json-delivery-status)。

## 範例

```bash
# 使用 JSON 輸出的簡單回合
openclaw agent --to +15555550123 --message "追蹤記錄" --verbose on --json

# 覆寫模型的回合
openclaw agent --agent ops --model openai/gpt-5.4 --message "摘要記錄"

# 指定思考層級的回合
openclaw agent --session-id 1234 --message "摘要收件匣" --thinking medium

# 從檔案讀取多行提示詞
openclaw agent --agent ops --message-file ./task.md

# 確切的工作階段金鑰
openclaw agent --session-key agent:ops:incident-42 --message "摘要狀態"

# 限定於代理程式的舊版金鑰
openclaw agent --agent ops --session-key incident-42 --message "摘要狀態"

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
    工作階段金鑰的運作方式，以及 `--to`、`--agent` 和 `--session-id` 如何解析這些金鑰。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="slash">
    代理程式工作階段內使用的原生命令目錄。
  </Card>
</CardGroup>
