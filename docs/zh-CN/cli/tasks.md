---
read_when:
    - 你想检查、审计或取消后台任务记录
    - 你正在为 `openclaw tasks flow` 下的 Task Flow 命令编写文档
summary: '`openclaw tasks` 的 CLI 参考（后台任务账本和 Task Flow 状态）'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-24T04:01:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55aab29821578bf8c09e1b6cd5bbeb5e3dae4438e453b418fa7e8420412c8152
    source_path: cli/tasks.md
    workflow: 15
---

检查持久化后台任务和 Task Flow 状态。不带子命令时，
`openclaw tasks` 等同于 `openclaw tasks list`。

有关生命周期和投递模型，请参阅 [后台任务](/zh-CN/automation/tasks)。

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

按任务 ID、运行 ID 或会话键显示单个任务。

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

显示陈旧、丢失、投递失败或其他不一致的任务和 Task Flow 记录。

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

预览或应用任务和 Task Flow 对账、清理标记以及修剪。

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

检查或取消任务账本下的持久化 Task Flow 状态。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [后台任务](/zh-CN/automation/tasks)
