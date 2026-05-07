---
read_when:
    - 您想要檢查、稽核或取消背景任務記錄
    - 你正在撰寫 `openclaw tasks flow` 下的 TaskFlow 命令文件
summary: '`openclaw tasks` 的 CLI 參考（背景任務記錄與任務流程狀態）'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-07T13:15:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca3f05d7c2a3fa7790ad6059ce15721ebffb548ac4a2c627188ac17986442dc6
    source_path: cli/tasks.md
    workflow: 16
---

檢查持久背景工作與 Task Flow 狀態。未指定子命令時，`openclaw tasks` 等同於 `openclaw tasks list`。

請參閱[背景工作](/zh-TW/automation/tasks)了解生命週期與交付模型。

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

列出已追蹤的背景工作，最新的在前。

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

依工作 ID、執行 ID 或工作階段鍵顯示單一工作。

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

顯示過時、遺失、交付失敗或其他不一致的工作與 Task Flow 記錄。保留到 `cleanupAfter` 的遺失工作是警告；已過期或未加蓋戳記的遺失工作是錯誤。

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

預覽或套用工作與 Task Flow 的重新協調、清理戳記與修剪。
對於 cron 工作，重新協調會先使用持久化的執行記錄/工作狀態，再將舊的作用中工作標記為 `lost`，因此已完成的 cron 執行不會只因為記憶體中的 Gateway 執行階段狀態消失就變成錯誤的稽核錯誤。離線 CLI 稽核不是 Gateway 行程本機 cron 作用中工作集合的權威來源。具有執行 ID/來源 ID 的 CLI 工作，會在其即時 Gateway 執行內容消失時標記為 `lost`，即使仍保留舊的子工作階段資料列也是如此。

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

檢查或取消工作帳本下的持久 Task Flow 狀態。

## 相關

- [CLI 參考](/zh-TW/cli)
- [背景工作](/zh-TW/automation/tasks)
