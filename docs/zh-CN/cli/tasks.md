---
read_when:
    - 你想要检查、审计或取消后台任务记录
    - 你正在记录 `openclaw tasks flow` 下的 Task Flow 命令
summary: '`openclaw tasks` 的 CLI 参考（后台任务分类账和 Task Flow 状态）'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-26T03:01:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: e87f64c2e41704b73cac60924be0f52dad9addec29d543cf5bab06c3045761a0
    source_path: cli/tasks.md
    workflow: 15
---

检查持久化后台任务和 Task Flow 状态。若不带子命令，
`openclaw tasks` 等同于 `openclaw tasks list`。

有关生命周期和传递模型，请参阅 [后台任务](/zh-CN/automation/tasks)。

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

## 根选项

- `--json`：输出 JSON。
- `--runtime <name>`：按类型筛选：`subagent`、`acp`、`cron` 或 `cli`。
- `--status <name>`：按状态筛选：`queued`、`running`、`succeeded`、`failed`、`timed_out`、`cancelled` 或 `lost`。

## 子命令

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

按从新到旧的顺序列出已跟踪的后台任务。

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

通过任务 ID、运行 ID 或会话键显示单个任务。

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

更改正在运行任务的通知策略。

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

取消正在运行的后台任务。

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

显示陈旧、丢失、传递失败或其他不一致的任务和 Task Flow 记录。保留到 `cleanupAfter` 的丢失任务属于警告；已过期或未加时间戳的丢失任务属于错误。

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

预览或应用任务和 Task Flow 对账、清理时间戳标记以及修剪。

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

检查或取消任务分类账下持久化的 Task Flow 状态。

## 相关

- [CLI 参考](/zh-CN/cli)
- [后台任务](/zh-CN/automation/tasks)
