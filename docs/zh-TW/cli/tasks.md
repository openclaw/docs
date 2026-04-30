---
read_when:
    - 你想要檢查、稽核或取消背景任務記錄
    - 你正在撰寫 `openclaw tasks flow` 底下的任務流程命令文件。
summary: '`openclaw tasks` 的 CLI 參考（背景工作記錄與工作流程狀態）'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-30T02:57:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e61fb0b67a2bdd932b29543199fb219890f256260a66881c8e7ffeb9fadee33
    source_path: cli/tasks.md
    workflow: 16
---

檢查持久背景任務與 Task Flow 狀態。沒有子命令時，
`openclaw tasks` 等同於 `openclaw tasks list`。

請參閱[背景任務](/zh-TW/automation/tasks)以了解生命週期與交付模型。

## 使用方式

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

- `--json`：輸出 JSON。
- `--runtime <name>`：依種類篩選：`subagent`、`acp`、`cron` 或 `cli`。
- `--status <name>`：依狀態篩選：`queued`、`running`、`succeeded`、`failed`、`timed_out`、`cancelled` 或 `lost`。

## 子命令

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

列出追蹤的背景任務，最新的在前。

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

依任務 ID、執行 ID 或工作階段金鑰顯示單一任務。

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

變更執行中任務的通知政策。

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

取消執行中的背景任務。

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

顯示過時、遺失、交付失敗或其他不一致的任務與 Task Flow 記錄。保留到 `cleanupAfter` 的遺失任務是警告；已過期或未加蓋戳記的遺失任務是錯誤。

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

預覽或套用任務與 Task Flow 對帳、清理戳記，以及修剪。
對於 Cron 任務，對帳會先使用已持久保存的執行記錄/工作狀態，再將舊的作用中任務標記為 `lost`，因此已完成的 Cron 執行不會只因為記憶體內的 Gateway 執行階段狀態消失而變成錯誤的稽核錯誤。離線 CLI 稽核對於 Gateway 的行程本機 Cron 作用中工作集合不具權威性。

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

檢查或取消任務分類帳下的持久 Task Flow 狀態。

## 相關

- [CLI 參考](/zh-TW/cli)
- [背景任務](/zh-TW/automation/tasks)
