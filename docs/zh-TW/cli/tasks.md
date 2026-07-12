---
read_when:
    - 您想要檢查、稽核或取消背景工作記錄
    - 您正在記錄 `openclaw tasks flow` 下的 TaskFlow 指令
summary: '`openclaw tasks` 的命令列介面參考（背景任務記錄與 Task Flow 狀態）'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-11T21:16:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

檢查持久化背景任務與 TaskFlow 狀態。未指定子命令時，
`openclaw tasks` 等同於 `openclaw tasks list`。

如需瞭解生命週期與傳遞模型，請參閱[背景任務](/zh-TW/automation/tasks)；
如需完整的發現項目說明，請參閱其中的 `tasks audit` 章節。

## 用法

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## 根層級選項

| 旗標               | 說明                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | 輸出 JSON。                                                                                        |
| `--runtime <name>` | 依類型篩選：`subagent`、`acp`、`cron` 或 `cli`。                                                   |
| `--status <name>`  | 依狀態篩選：`queued`、`running`、`succeeded`、`failed`、`timed_out`、`cancelled` 或 `lost`。       |

## 子命令

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

列出追蹤中的背景任務，最新的優先顯示。

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

依任務 ID、執行 ID 或工作階段索引鍵顯示單一任務。

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

變更執行中任務的通知原則。

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

取消執行中的背景任務。

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

顯示過時、遺失、傳遞失敗或其他不一致的任務與
TaskFlow 記錄。保留至 `cleanupAfter` 的遺失任務會列為警告；
已過期或未加上時間戳記的遺失任務則列為錯誤。

`--code` 接受任務代碼（`stale_queued`、`stale_running`、`lost`、
`delivery_failed`、`missing_cleanup`、`inconsistent_timestamps`）及 TaskFlow
代碼（`restore_failed`、`stale_waiting`、`stale_blocked`、
`cancel_stuck`、`missing_linked_tasks`、`blocked_task_missing`）。各代碼的
嚴重性與觸發條件詳情，請參閱[背景任務](/zh-TW/automation/tasks)。

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

預覽或套用任務與 TaskFlow 的協調、清理時間戳記、
修剪，以及過時排程執行工作階段登錄的清理作業。

對於排程任務，協調程序會先使用已持久化的執行記錄／工作狀態，再將舊的
作用中任務標記為 `lost`，因此已完成的排程執行不會僅因閘道記憶體內的
執行階段狀態消失而成為誤報的稽核錯誤。離線命令列介面稽核對閘道的
處理程序本機排程作用中工作集合不具權威性。具有執行 ID／來源 ID 的
命令列介面任務，在其即時閘道執行內容消失時會標記為 `lost`，即使舊的
子工作階段資料列仍然存在。

套用維護作業時，也會修剪超過 7 天的 `cron:<jobId>:run:<uuid>` 工作階段
登錄資料列，同時保留目前執行中的排程工作，且不變更非排程工作階段的資料列。

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

檢查或取消任務帳本下的持久化 TaskFlow 狀態。
`flow list --status` 接受 `queued`、`running`、`waiting`、`blocked`、
`succeeded`、`failed`、`cancelled` 或 `lost`。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [背景任務](/zh-TW/automation/tasks)
