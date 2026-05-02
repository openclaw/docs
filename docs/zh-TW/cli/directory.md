---
read_when:
    - 您想查詢某個通道的聯絡人/群組/自身 ID
    - 你正在開發頻道目錄介接器
summary: '`openclaw directory` 的 CLI 參考資料（自己、對等節點、群組）'
title: 目錄
x-i18n:
    generated_at: "2026-05-02T20:44:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 011f762d6f53605a37bd12b31c767594c0efa5681da4b2aabe7fb358751b1542
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

支援此功能的頻道目錄查詢（聯絡人/對等端、群組，以及「我」）。

## 常用旗標

- `--channel <name>`：頻道 id/別名（設定多個頻道時為必填；只設定一個時會自動使用）
- `--account <id>`：帳號 id（預設：頻道預設值）
- `--json`：輸出 JSON

## 備註

- `directory` 旨在協助你尋找可貼到其他命令中的 ID（尤其是 `openclaw message send --target ...`）。
- 對許多頻道而言，結果是由設定支援（允許清單 / 已設定群組），而不是即時提供者目錄。
- 已安裝的頻道 Plugin 仍可省略目錄支援；在這種情況下，命令會回報不支援的目錄操作，而不是重新安裝 Plugin。
- 預設輸出為以 tab 分隔的 `id`（有時也包含 `name`）；使用 `--json` 以便撰寫腳本。

## 搭配 `message send` 使用結果

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID 格式（依頻道）

- WhatsApp：`+15551234567`（私訊）、`1234567890-1234567890@g.us`（群組）、`120363123456789@newsletter`（頻道/電子報傳出目標）
- Telegram：`@username` 或數字聊天 id；群組為數字 id
- Slack：`user:U…` 和 `channel:C…`
- Discord：`user:<id>` 和 `channel:<id>`
- Matrix（Plugin）：`user:@user:server`、`room:!roomId:server`，或 `#alias:server`
- Microsoft Teams（Plugin）：`user:<id>` 和 `conversation:<id>`
- Zalo（Plugin）：使用者 id（Bot API）
- Zalo Personal / `zalouser`（Plugin）：來自 `zca` 的執行緒 id（私訊/群組）（`me`、`friend list`、`group list`）

## 自己（"me"）

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

- [CLI 參考](/zh-TW/cli)
