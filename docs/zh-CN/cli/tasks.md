---
read_when:
    - 你想检查、审计或取消后台任务记录
    - 你正在为 `openclaw tasks flow` 下的 Task Flow 命令编写文档。
summary: 用于 `openclaw tasks` 的 CLI 参考（后台任务台账和任务流状态）
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-10T19:29:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bbb97690124a8e59ec5e6a517f33166ad449ee6268894ab132ad9cb69dcaa81
    source_path: cli/tasks.md
    workflow: 16
---

检查持久后台任务和 Task Flow 状态。没有子命令时，
`openclaw tasks` 等同于 `openclaw tasks list`。

生命周期和投递模型见 [后台任务](/zh-CN/automation/tasks)。

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
- `--runtime <name>`：按类型过滤：`subagent`、`acp`、`cron` 或 `cli`。
- `--status <name>`：按状态过滤：`queued`、`running`、`succeeded`、`failed`、`timed_out`、`cancelled` 或 `lost`。

## 子命令

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

列出跟踪的后台任务，最新的排在最前。

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

通过任务 ID、运行 ID 或会话键显示一个任务。

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

更改运行中任务的通知策略。

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

取消一个运行中的后台任务。

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

显示陈旧、丢失、投递失败或其他不一致的任务和 Task Flow 记录。保留到 `cleanupAfter` 的丢失任务为警告；已过期或未加时间戳的丢失任务为错误。

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

预览或应用任务和 Task Flow 对账、清理标记、修剪，
以及陈旧 cron 运行会话注册表清理。
对于 cron 任务，对账会先使用持久化的运行日志/作业状态，再将
旧的活跃任务标记为 `lost`，因此已完成的 cron 运行不会仅因为内存中的 Gateway 网关运行时状态消失而变成错误的审计错误。离线 CLI 审计对 Gateway 网关进程本地的 cron 活跃作业集
不具有权威性。带有运行 ID/来源 ID 的 CLI 任务在其实时 Gateway 网关运行上下文
消失时会标记为 `lost`，即使仍保留旧的子会话行。
应用后，维护还会修剪超过 7 天的 `cron:<jobId>:run:<uuid>` 会话注册表
行，同时保留当前正在运行的 cron 作业，并让
非 cron 会话行保持不变。

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

检查或取消任务账本下的持久 Task Flow 状态。

## 相关

- [CLI 参考](/zh-CN/cli)
- [后台任务](/zh-CN/automation/tasks)
