---
read_when:
    - 你想查詢某個頻道的聯絡人／群組／自己的 ID
    - 你正在開發頻道目錄介接器
summary: '`openclaw directory`（自身、對等節點、群組）的命令列介面參考資料'
title: 目錄
x-i18n:
    generated_at: "2026-07-19T13:39:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 33f1cabd0954f2e6e6affbfbff9f8e1f543bffebc54baff7c1ffaa21778744a0
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

針對支援目錄查詢的頻道：聯絡人／對等端、群組，以及「我」（自己）。

查詢結果可貼入其他命令中使用，尤其是 `openclaw message send --target ...`。

## 通用旗標

- `--channel <name>`：頻道 ID／別名（設定多個頻道時為必填；僅設定一個頻道時會自動選取）
- `--account <id>`：帳號 ID（預設：頻道預設值）
- `--json`：輸出 JSON

預設（非 JSON）輸出為 `id`（有時也包含 `name`），並以定位字元分隔。

## 注意事項

- 對許多頻道而言，結果來自設定（允許清單／已設定的群組），而不是即時的提供者目錄。
- WhatsApp 群組清單是即時取得的。閘道查詢會重複使用其擁有的連線；只有在沒有其他程序擁有該帳號時，獨立命令才會開啟已連結的工作階段，否則會回報無法取得即時群組。
- 已安裝的頻道外掛可能不支援目錄。在這種情況下，命令會回報不支援的操作；不會嘗試重新安裝或升級外掛以新增支援。

## 搭配 `message send` 使用結果

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## 各頻道的 ID 格式

| 頻道                             | 目標 ID 格式                                                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567`（私訊）、`1234567890-1234567890@g.us`（群組）、`120363123456789@newsletter`（頻道／電子報，僅限傳出） |
| Signal                              | 已設定的別名會解析為 E.164／UUID 私訊目標或 `group:<id>` 群組目標                                           |
| Telegram                            | `@username` 或數字聊天 ID；群組使用數字 ID                                                                      |
| Slack                               | `user:U…` 和 `channel:C…`                                                                                                  |
| Discord                             | `user:<id>` 和 `channel:<id>`                                                                                              |
| Matrix（外掛）                     | `user:@user:server`、`room:!roomId:server` 或 `#alias:server`                                                              |
| Microsoft Teams（外掛）            | `user:<id>` 和 `conversation:<id>`                                                                                         |
| Zalo（外掛）                       | 使用者 ID（Bot API）                                                                                                           |
| Zalo Personal／`zalouser`（外掛） | 對話串 ID（私訊／群組），來自 `zca`（`me`、`friend list`、`group list`）                                                        |

## 自己（「我」）

```bash
openclaw directory self --channel zalouser
```

## 對等端（聯絡人／使用者）

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## 群組

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## 相關內容

- [命令列介面參考](/zh-TW/cli)
