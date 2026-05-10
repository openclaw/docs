---
read_when:
    - 您想要檢視、稽核或取消背景任務記錄
    - 你正在撰寫 `openclaw tasks flow` 下任務流程指令的文件
summary: '`openclaw tasks` 的 CLI 參考（背景任務記錄簿與任務流程狀態）'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-10T19:29:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bbb97690124a8e59ec5e6a517f33166ad449ee6268894ab132ad9cb69dcaa81
    source_path: cli/tasks.md
    workflow: 16
---

檢查持久性背景任務與 Task Flow 狀態。沒有子命令時，`openclaw tasks` 等同於 `openclaw tasks list`。

請參閱 [背景任務](/zh-TW/automation/tasks) 了解生命週期與傳遞模型。

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

- `--json`: 輸出 JSON。
- `--runtime <name>`: 依類型篩選：`subagent`、`acp`、`cron` 或 `cli`。
- `--status <name>`: 依狀態篩選：`queued`、`running`、`succeeded`、`failed`、`timed_out`、`cancelled` 或 `lost`。

## 子命令

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

列出追蹤中的背景任務，最新的在前。

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

顯示過期、遺失、傳遞失敗，或其他不一致的任務與 Task Flow 記錄。保留到 `cleanupAfter` 的遺失任務為警告；已過期或未蓋章的遺失任務為錯誤。

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

預覽或套用任務與 Task Flow 協調、清理蓋章、修剪，
以及過期的 Cron 執行工作階段登錄清理。
對於 Cron 任務，協調會先使用持久化的執行記錄/工作狀態，然後才將
舊的作用中任務標記為 `lost`，因此已完成的 Cron 執行不會只因記憶體中的 Gateway 執行階段狀態消失
就變成錯誤的稽核錯誤。離線 CLI 稽核對 Gateway 的程序本機 Cron 作用中工作集合
不具權威性。具有執行 ID/來源 ID 的 CLI 任務會在其即時 Gateway 執行內容
消失時標記為 `lost`，即使仍有舊的子工作階段資料列存在。
套用後，維護也會修剪早於 7 天的 `cron:<jobId>:run:<uuid>` 工作階段登錄
資料列，同時保留目前執行中的 Cron 工作，並讓
非 Cron 工作階段資料列保持不變。

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

檢查或取消任務分類帳下的持久性 Task Flow 狀態。

## 相關

- [CLI 參考](/zh-TW/cli)
- [背景任務](/zh-TW/automation/tasks)
