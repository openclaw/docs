---
read_when:
    - 你想檢查推斷出的後續承諾
    - 您想要忽略待處理的簽到
    - 你正在稽核心跳偵測可能傳遞的內容
summary: '`openclaw commitments` 的命令列介面參考（檢查並關閉推斷出的後續事項）'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-05T11:10:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

列出並管理推斷出的後續承諾。

承諾是選擇啟用的（`commitments.enabled`）、短期存在的後續記憶，
會從對話脈絡建立，並由心跳偵測送達。概念指南與設定請參閱
[推斷出的承諾](/zh-TW/concepts/commitments)。

沒有子命令時，`openclaw commitments` 會列出待處理的承諾。

## 用法

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## 選項

- `--all`：顯示所有狀態，而不是只顯示待處理的承諾。
- `--agent <id>`：篩選到單一代理 id。
- `--status <status>`：依狀態篩選。值：`pending`、`sent`、
  `dismissed`、`snoozed` 或 `expired`。未知值會以錯誤結束。
- `--json`：輸出機器可讀的 JSON。

`dismiss` 會將指定的承諾 id 標記為 `dismissed`，使心跳偵測不會
送達它們。

## 範例

列出待處理的承諾：

```bash
openclaw commitments
```

列出每個已儲存的承諾：

```bash
openclaw commitments --all
```

篩選到單一代理：

```bash
openclaw commitments --agent main
```

尋找已延後的承諾：

```bash
openclaw commitments --status snoozed
```

解除一個或多個承諾：

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

匯出為 JSON：

```bash
openclaw commitments --all --json
```

## 輸出

文字輸出會印出承諾數量、儲存路徑、任何作用中的篩選器，
以及每個承諾一列：

- 承諾 id
- 狀態
- 種類（`event_check_in`、`deadline_check`、`care_check_in` 或 `open_loop`）
- 最早到期時間
- 範圍（代理/頻道/目標）
- 建議的確認文字

JSON 輸出包含數量、作用中的狀態與代理篩選器、
承諾儲存路徑，以及完整的已儲存記錄。

## 相關

- [推斷出的承諾](/zh-TW/concepts/commitments)
- [記憶概覽](/zh-TW/concepts/memory)
- [心跳偵測](/zh-TW/gateway/heartbeat)
- [排程工作](/zh-TW/automation/cron-jobs)
