---
read_when:
    - 你想要檢查推斷出的後續承諾事項
    - 你想要取消待處理的報到提醒
    - 你正在稽核心跳偵測可能傳遞的內容
summary: '`openclaw commitments` 的命令列介面參考（檢查並略過推斷的後續工作）'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T11:31:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

列出並管理推斷出的後續承諾。

承諾為選擇性啟用（`commitments.enabled`）的短期後續記憶，
根據對話情境建立，並由心跳偵測傳遞。概念指南與設定請參閱
[推斷出的承諾](/zh-TW/concepts/commitments)。

未指定子命令時，`openclaw commitments` 會列出待處理的承諾。

## 用法

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## 選項

- `--all`：顯示所有狀態，而非僅顯示待處理的承諾。
- `--agent <id>`：篩選指定的代理程式 ID。
- `--status <status>`：依狀態篩選。值：`pending`、`sent`、
  `dismissed`、`snoozed` 或 `expired`。未知的值會導致程式結束並回報錯誤。
- `--json`：輸出機器可讀的 JSON。

`dismiss` 會將指定的承諾 ID 標記為 `dismissed`，使心跳偵測不會
傳遞這些承諾。

## 範例

列出待處理的承諾：

```bash
openclaw commitments
```

列出所有已儲存的承諾：

```bash
openclaw commitments --all
```

篩選指定的代理程式：

```bash
openclaw commitments --agent main
```

尋找已延後的承諾：

```bash
openclaw commitments --status snoozed
```

解除一或多個承諾：

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

匯出為 JSON：

```bash
openclaw commitments --all --json
```

## 輸出

文字輸出會顯示承諾數量、共用 SQLite 資料庫路徑、任何作用中的篩選條件，
以及每項承諾各一列：

- 承諾 ID
- 狀態
- 種類（`event_check_in`、`deadline_check`、`care_check_in` 或 `open_loop`）
- 最早到期時間
- 範圍（代理程式／頻道／目標）
- 建議的確認文字

JSON 輸出包含數量、作用中的狀態與代理程式篩選條件、
共用 SQLite 資料庫路徑，以及完整的已儲存記錄。

## 相關內容

- [推斷出的承諾](/zh-TW/concepts/commitments)
- [記憶概覽](/zh-TW/concepts/memory)
- [心跳偵測](/zh-TW/gateway/heartbeat)
- [排程任務](/zh-TW/automation/cron-jobs)
