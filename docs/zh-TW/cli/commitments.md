---
read_when:
    - 您想檢查推斷出的後續承諾
    - 您想略過待處理的簽到提醒
    - 你正在稽核心跳偵測可能傳送的內容
summary: '`openclaw commitments` 的命令列介面參考（檢查並關閉推斷的後續事項）'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-11T21:13:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

列出並管理推斷出的後續承諾。

承諾功能需選擇啟用（`commitments.enabled`），它是根據對話情境建立、由心跳偵測傳遞的短期後續記憶。概念指南與設定請參閱[推斷承諾](/zh-TW/concepts/commitments)。

若未指定子命令，`openclaw commitments` 會列出待處理的承諾。

## 用法

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## 選項

- `--all`：顯示所有狀態，而非僅顯示待處理的承諾。
- `--agent <id>`：篩選特定代理程式 ID。
- `--status <status>`：依狀態篩選。可用值：`pending`、`sent`、
  `dismissed`、`snoozed` 或 `expired`。若指定未知值，程式會回報錯誤並結束。
- `--json`：輸出機器可讀的 JSON。

`dismiss` 會將指定的承諾 ID 標記為 `dismissed`，使心跳偵測不再傳遞這些承諾。

## 範例

列出待處理的承諾：

```bash
openclaw commitments
```

列出所有已儲存的承諾：

```bash
openclaw commitments --all
```

篩選特定代理程式：

```bash
openclaw commitments --agent main
```

尋找已延後的承諾：

```bash
openclaw commitments --status snoozed
```

略過一或多個承諾：

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

匯出為 JSON：

```bash
openclaw commitments --all --json
```

## 輸出

文字輸出會顯示承諾數量、儲存區路徑、任何使用中的篩選條件，以及每項承諾各一列：

- 承諾 ID
- 狀態
- 類型（`event_check_in`、`deadline_check`、`care_check_in` 或 `open_loop`）
- 最早到期時間
- 範圍（代理程式／頻道／目標）
- 建議的跟進文字

JSON 輸出包含數量、使用中的狀態與代理程式篩選條件、承諾儲存區路徑，以及完整的已儲存記錄。

## 相關內容

- [推斷承諾](/zh-TW/concepts/commitments)
- [記憶體概覽](/zh-TW/concepts/memory)
- [心跳偵測](/zh-TW/gateway/heartbeat)
- [排程任務](/zh-TW/automation/cron-jobs)
