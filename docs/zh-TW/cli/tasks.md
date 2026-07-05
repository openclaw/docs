---
read_when:
    - 您想要檢查、稽核或取消背景工作記錄
    - 你正在記錄 `openclaw tasks flow` 下的 TaskFlow 命令
summary: '`openclaw tasks` 的命令列介面參考（背景工作分類帳與 Task Flow 狀態）'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-05T11:11:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

檢查持久背景工作與 Task Flow 狀態。若不帶子命令，
`openclaw tasks` 等同於 `openclaw tasks list`。

請參閱[背景工作](/zh-TW/automation/tasks)了解生命週期與傳遞
模型，並參閱其 `tasks audit` 章節取得完整的發現項描述。

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

## 根選項

| 旗標               | 說明                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | 輸出 JSON。                                                                                       |
| `--runtime <name>` | 依類型篩選：`subagent`、`acp`、`cron` 或 `cli`。                                               |
| `--status <name>`  | 依狀態篩選：`queued`、`running`、`succeeded`、`failed`、`timed_out`、`cancelled` 或 `lost`。 |

## 子命令

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

列出追蹤中的背景工作，最新的在前。

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

依工作 ID、執行 ID 或工作階段鍵顯示一個工作。

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

變更執行中工作的通知政策。

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

取消執行中的背景工作。

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

顯示過期、遺失、傳遞失敗，或其他不一致的工作與
Task Flow 記錄。保留至 `cleanupAfter` 的遺失工作是警告；
已過期或未標記時間戳記的遺失工作是錯誤。

`--code` 接受工作代碼（`stale_queued`、`stale_running`、`lost`、
`delivery_failed`、`missing_cleanup`、`inconsistent_timestamps`）與 Task
Flow 代碼（`restore_failed`、`stale_waiting`、`stale_blocked`、
`cancel_stuck`、`missing_linked_tasks`、`blocked_task_missing`）。請參閱
[背景工作](/zh-TW/automation/tasks)了解每個代碼的嚴重性與觸發細節。

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

預覽或套用工作與 Task Flow 的協調、清理標記、
修剪，以及過期的 Cron 執行工作階段登錄清理。

對於 Cron 工作，協調會先使用持久化的執行記錄/作業狀態，
再將舊的作用中工作標記為 `lost`，因此已完成的 Cron 執行不會只因
記憶體中的閘道執行階段狀態消失，就變成錯誤的稽核錯誤。
離線命令列介面稽核並非閘道行程本機 Cron 作用中作業集合的權威來源。
具有執行 ID/來源 ID 的命令列介面工作，會在其即時閘道執行脈絡消失時
標記為 `lost`，即使仍有舊的子工作階段列存在。

套用後，維護也會修剪超過 7 天的 `cron:<jobId>:run:<uuid>` 工作階段
登錄列，同時保留目前執行中的 Cron 作業，並讓非 Cron 工作階段列保持不變。

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

檢查或取消工作分類帳下的持久 Task Flow 狀態。
`flow list --status` 接受 `queued`、`running`、`waiting`、`blocked`、
`succeeded`、`failed`、`cancelled` 或 `lost`。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [背景工作](/zh-TW/automation/tasks)
