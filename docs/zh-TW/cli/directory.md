---
read_when:
    - 你想查詢某個頻道的聯絡人、群組或自己的 ID
    - 你正在開發頻道目錄配接器
summary: '`openclaw directory`（自己、對等端、群組）的命令列介面參考'
title: 目錄
x-i18n:
    generated_at: "2026-07-03T15:19:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d17f545ce0bbe23a6c1ba74e4d1b44b103cc985b52affe4b25fbc6a6d1121045
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

支援目錄查詢的通道可使用此命令查詢（聯絡人/對等端、群組和「我」）。

## 常用旗標

- `--channel <name>`：通道 ID/別名（設定多個通道時為必要；僅設定一個通道時會自動使用）
- `--account <id>`：帳號 ID（預設：通道預設值）
- `--json`：輸出 JSON

## 注意事項

- `directory` 旨在協助你找到可貼到其他命令中的 ID（特別是 `openclaw message send --target ...`）。
- 對許多通道而言，結果是由設定支援（允許清單/已設定群組），而不是即時的提供者目錄。
- 已安裝的通道外掛仍可省略目錄支援；在這種情況下，命令會回報不支援的目錄操作，而不是重新安裝外掛。
- 預設輸出是以定位字元分隔的 `id`（有時也包含 `name`）；若要用於腳本，請使用 `--json`。

## 搭配 `message send` 使用結果

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID 格式（依通道）

- WhatsApp：`+15551234567`（DM）、`1234567890-1234567890@g.us`（群組）、`120363123456789@newsletter`（頻道/電子報傳出目標）
- Signal：已設定的別名會解析為 E.164/UUID DM 目標，或 `group:<id>` 群組目標
- Telegram：`@username` 或數字聊天 ID；群組為數字 ID
- Slack：`user:U…` 和 `channel:C…`
- Discord：`user:<id>` 和 `channel:<id>`
- Matrix（外掛）：`user:@user:server`、`room:!roomId:server`，或 `#alias:server`
- Microsoft Teams（外掛）：`user:<id>` 和 `conversation:<id>`
- Zalo（外掛）：使用者 ID（Bot API）
- Zalo Personal / `zalouser`（外掛）：來自 `zca` 的執行緒 ID（DM/群組）（`me`、`friend list`、`group list`）

## 自己（「我」）

```bash
openclaw directory self --channel zalouser
```

## 對等端（聯絡人/使用者）

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
