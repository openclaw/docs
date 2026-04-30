---
read_when:
    - 你想查詢某個通道的聯絡人/群組/自身 ID
    - 你正在開發通道目錄配接器
summary: '`openclaw directory` 的 CLI 參考（self、peers、groups）'
title: 目錄
x-i18n:
    generated_at: "2026-04-30T02:53:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: f63ed92469738501ae1f8f08aec3edf01d1f0f46008571ed38ccd9c77e5ba15e
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

支援目錄查詢的通道查詢（聯絡人/對等方、群組，以及「me」）。

## 常用旗標

- `--channel <name>`：通道 ID/別名（設定多個通道時為必要；只設定一個通道時自動使用）
- `--account <id>`：帳號 ID（預設：通道預設值）
- `--json`：輸出 JSON

## 注意事項

- `directory` 用於協助你找出可貼到其他命令中的 ID（特別是 `openclaw message send --target ...`）。
- 對許多通道而言，結果是由設定支援（允許清單/已設定的群組），而不是即時提供者目錄。
- 預設輸出是以 Tab 分隔的 `id`（有時也包含 `name`）；編寫指令碼時請使用 `--json`。

## 搭配 `message send` 使用結果

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID 格式（依通道）

- WhatsApp：`+15551234567`（DM）、`1234567890-1234567890@g.us`（群組）
- Telegram：`@username` 或數字聊天 ID；群組為數字 ID
- Slack：`user:U…` 和 `channel:C…`
- Discord：`user:<id>` 和 `channel:<id>`
- Matrix（Plugin）：`user:@user:server`、`room:!roomId:server`，或 `#alias:server`
- Microsoft Teams（Plugin）：`user:<id>` 和 `conversation:<id>`
- Zalo（Plugin）：使用者 ID（Bot API）
- Zalo Personal / `zalouser`（Plugin）：來自 `zca` 的對話串 ID（DM/群組）（`me`、`friend list`、`group list`）

## 自己（"me"）

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

- [CLI 參考](/zh-TW/cli)
