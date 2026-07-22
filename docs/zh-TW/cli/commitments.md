---
read_when:
    - 你想要檢查推斷出的後續承諾
    - 你想要略過待處理的簽到作業
    - 你正在稽核心跳偵測可能傳送的內容
summary: '`openclaw commitments` 的命令列介面參考（檢查並解除推斷出的後續事項）'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-22T10:29:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a7c573daad6a9bc6ce4532514c8cc22b3c510b4fc0cf9d1a79048413f08c1a2
    source_path: cli/commitments.md
    workflow: 16
---

檢查並清除已停用的推斷承諾實驗所留下的記錄。
OpenClaw 不再建立或傳送新的承諾，但仍保留維護
命令，讓升級作業可以稽核並清理現有的 SQLite 資料列。

未指定子命令時，`openclaw commitments` 會列出待處理的承諾。

## 用法

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## 選項

- `--all`：顯示所有狀態，而非僅顯示待處理的承諾。
- `--agent <id>`：篩選至單一代理程式 ID。
- `--status <status>`：依狀態篩選。值：`pending`、`sent`、
  `dismissed`、`snoozed` 或 `expired`。未知值會以錯誤結束。
- `--json`：輸出機器可讀的 JSON。

`dismiss` 會將指定的承諾 ID 標記為 `dismissed`。

## 範例

列出待處理的承諾：

```bash
openclaw commitments
```

列出所有已儲存的承諾：

```bash
openclaw commitments --all
```

篩選至單一代理程式：

```bash
openclaw commitments --agent main
```

尋找已延後的承諾：

```bash
openclaw commitments --status snoozed
```

清除一或多個承諾：

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

匯出為 JSON：

```bash
openclaw commitments --all --json
```

## 輸出

文字輸出會列印承諾數量、共用 SQLite 資料庫路徑、任何作用中的篩選條件，
以及每個承諾各一列：

- 承諾 ID
- 狀態
- 種類（`event_check_in`、`deadline_check`、`care_check_in` 或 `open_loop`）
- 最早到期時間
- 範圍（代理程式／頻道／目標）
- 建議的確認文字

JSON 輸出包含數量、作用中的狀態與代理程式篩選條件、
共用 SQLite 資料庫路徑，以及完整的已儲存記錄。

## 相關內容

- [推斷承諾](/zh-TW/concepts/commitments)
- [記憶體概觀](/zh-TW/concepts/memory)
- [心跳偵測](/zh-TW/gateway/heartbeat)
- [排程工作](/zh-TW/automation/cron-jobs)
