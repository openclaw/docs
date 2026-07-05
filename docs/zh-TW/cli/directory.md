---
read_when:
    - 你想查詢某個頻道的聯絡人、群組和自己的 ID
    - 你正在開發 channel directory adapter
summary: '`openclaw directory` 的命令列介面參考（自身、對等端、群組）'
title: 目錄
x-i18n:
    generated_at: "2026-07-05T11:11:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

支援目錄查詢的頻道可用於查找：聯絡人/對等方、群組，以及「me」（自己）。

結果設計為可貼到其他命令中使用，特別是 `openclaw message send --target ...`。

## 常用旗標

- `--channel <name>`：頻道 ID/別名（設定多個頻道時為必填；只設定一個頻道時會自動選取）
- `--account <id>`：帳號 ID（預設：頻道預設值）
- `--json`：輸出 JSON

預設（非 JSON）輸出是以定位字元分隔的 `id`（有時也包含 `name`）。

## 注意事項

- 對許多頻道而言，結果是由設定支援（允許清單 / 已設定群組），而不是即時提供者目錄。
- 已安裝的頻道外掛可能不支援目錄。在這種情況下，命令會回報不支援的操作；它不會嘗試重新安裝或升級外掛來新增支援。

## 搭配 `message send` 使用結果

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## 各頻道的 ID 格式

| 頻道                                | 目標 ID 格式                                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567`（DM）、`1234567890-1234567890@g.us`（群組）、`120363123456789@newsletter`（頻道/電子報，僅限傳出） |
| Signal                              | 已設定的別名會解析為 E.164/UUID DM 目標或 `group:<id>` 群組目標                                           |
| Telegram                            | `@username` 或數字聊天 ID；群組使用數字 ID                                                                      |
| Slack                               | `user:U…` 和 `channel:C…`                                                                                                  |
| Discord                             | `user:<id>` 和 `channel:<id>`                                                                                              |
| Matrix（外掛）                     | `user:@user:server`、`room:!roomId:server` 或 `#alias:server`                                                              |
| Microsoft Teams（外掛）            | `user:<id>` 和 `conversation:<id>`                                                                                         |
| Zalo（外掛）                       | 使用者 ID（Bot API）                                                                                                           |
| Zalo Personal / `zalouser`（外掛） | 執行緒 ID（DM/群組），來自 `zca`（`me`、`friend list`、`group list`）                                                        |

## 自己（「me」）

```bash
openclaw directory self --channel zalouser
```

## 對等方（聯絡人/使用者）

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

## 相關

- [命令列介面參考](/zh-TW/cli)
