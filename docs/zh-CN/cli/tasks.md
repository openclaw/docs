---
read_when:
    - 你想要检查、审计或取消后台任务记录
    - 你正在记录 `openclaw tasks flow` 下的 Task Flow 命令
summary: '`openclaw tasks` 的 CLI 参考（后台任务账本和 Task Flow 状态）'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-11T20:27:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

检查持久化后台任务和 Task Flow 状态。不带子命令时，
`openclaw tasks` 等同于 `openclaw tasks list`。

有关生命周期和交付模型，请参阅[后台任务](/zh-CN/automation/tasks)；有关完整的发现项说明，
请参阅其中的 `tasks audit` 章节。

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

| 标志               | 说明                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | 输出 JSON。                                                                                        |
| `--runtime <name>` | 按类型筛选：`subagent`、`acp`、`cron` 或 `cli`。                                                    |
| `--status <name>`  | 按状态筛选：`queued`、`running`、`succeeded`、`failed`、`timed_out`、`cancelled` 或 `lost`。         |

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

按任务 ID、运行 ID 或会话键显示一个任务。

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

更改运行中任务的通知策略。

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

取消运行中的后台任务。

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

显示过期、丢失、交付失败或存在其他不一致情况的任务和
Task Flow 记录。保留至 `cleanupAfter` 的丢失任务属于警告；
已过期或未加时间戳的丢失任务属于错误。

`--code` 接受任务代码（`stale_queued`、`stale_running`、`lost`、
`delivery_failed`、`missing_cleanup`、`inconsistent_timestamps`）和 Task
Flow 代码（`restore_failed`、`stale_waiting`、`stale_blocked`、
`cancel_stuck`、`missing_linked_tasks`、`blocked_task_missing`）。有关每个
代码的严重性和触发条件详情，请参阅[后台任务](/zh-CN/automation/tasks)。

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

预览或应用任务和 Task Flow 协调、清理标记、修剪以及过期 cron
运行会话注册表清理。

对于 cron 任务，协调过程会先使用持久化的运行日志和作业状态，再将旧的活动任务
标记为 `lost`，因此已完成的 cron 运行不会仅仅因为内存中的 Gateway 网关运行时
状态已消失而成为错误的审计错误。离线 CLI 审计无法对 Gateway 网关进程本地的
cron 活动作业集合做出权威判断。具有运行 ID/源 ID 的 CLI 任务在其有效的
Gateway 网关运行上下文消失时会被标记为 `lost`，即使旧的子会话行仍然存在。

应用维护操作时，还会修剪超过 7 天的 `cron:<jobId>:run:<uuid>` 会话
注册表行，同时保留当前正在运行的 cron 作业，并且不改动非 cron 会话行。

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

检查或取消任务账本中的持久化 Task Flow 状态。
`flow list --status` 接受 `queued`、`running`、`waiting`、`blocked`、
`succeeded`、`failed`、`cancelled` 或 `lost`。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [后台任务](/zh-CN/automation/tasks)
