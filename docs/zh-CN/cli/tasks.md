---
read_when:
    - 你想检查、审计或取消后台任务记录
    - 你正在为 `openclaw tasks flow` 下的 Task Flow 命令编写文档
summary: '`openclaw tasks` 的 CLI 参考（后台任务台账和任务流状态）'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-07T13:14:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca3f05d7c2a3fa7790ad6059ce15721ebffb548ac4a2c627188ac17986442dc6
    source_path: cli/tasks.md
    workflow: 16
---

检查持久后台任务和任务流状态。不带子命令时，
`openclaw tasks` 等同于 `openclaw tasks list`。

生命周期和交付模型请参阅[后台任务](/zh-CN/automation/tasks)。

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

按最新优先列出被跟踪的后台任务。

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

按任务 ID、运行 ID 或会话键显示单个任务。

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

更改正在运行的任务的通知策略。

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

取消正在运行的后台任务。

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

暴露过期、丢失、交付失败或其他不一致的任务和任务流记录。保留到 `cleanupAfter` 的丢失任务为警告；已过期或未盖戳的丢失任务为错误。

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

预览或应用任务和任务流的对账、清理盖戳和剪除。
对于 cron 任务，对账会先使用持久化的运行日志/作业状态，再将旧的活跃任务标记为 `lost`，因此已完成的 cron 运行不会仅因为内存中的 Gateway 网关运行时状态消失而变成误报审计错误。离线 CLI 审计对于 Gateway 网关进程本地的 cron 活跃作业集合不具权威性。带有运行 ID/来源 ID 的 CLI 任务会在其实时 Gateway 网关运行上下文消失时标记为 `lost`，即使仍存在旧的子会话行。

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

检查或取消任务账本下的持久任务流状态。

## 相关

- [CLI 参考](/zh-CN/cli)
- [后台任务](/zh-CN/automation/tasks)
