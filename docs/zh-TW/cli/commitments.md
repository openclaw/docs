---
read_when:
    - 您想檢視推斷出的後續承諾
    - 你想要關閉待處理的簽到
    - 你正在稽核 Heartbeat 可能傳遞的內容
summary: '`openclaw commitments` 的 CLI 參考（檢查並關閉推斷出的後續追蹤事項）'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-04-30T02:52:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

列出並管理推斷出的後續承諾。

承諾是選用、短期存在的後續記憶，從對話情境建立。概念指南請參閱[推斷承諾](/zh-TW/concepts/commitments)。

未指定子命令時，`openclaw commitments` 會列出待處理的承諾。

## 用法

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## 選項

- `--all`：顯示所有狀態，而不只顯示待處理的承諾。
- `--agent <id>`：篩選至一個代理程式 ID。
- `--status <status>`：依狀態篩選。值：`pending`、`sent`、
  `dismissed`、`snoozed` 或 `expired`。
- `--json`：輸出機器可讀的 JSON。

## 範例

列出待處理的承諾：

```bash
openclaw commitments
```

列出每個已儲存的承諾：

```bash
openclaw commitments --all
```

篩選至一個代理程式：

```bash
openclaw commitments --agent main
```

尋找已延後的承諾：

```bash
openclaw commitments --status snoozed
```

關閉一或多個承諾：

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

匯出為 JSON：

```bash
openclaw commitments --all --json
```

## 輸出

文字輸出包含：

- 承諾 ID
- 狀態
- 種類
- 最早到期時間
- 範圍
- 建議的確認文字

JSON 輸出也包含承諾儲存區路徑和完整的已儲存記錄。

## 相關

- [推斷承諾](/zh-TW/concepts/commitments)
- [記憶概觀](/zh-TW/concepts/memory)
- [Heartbeat](/zh-TW/gateway/heartbeat)
- [排程工作](/zh-TW/automation/cron-jobs)
