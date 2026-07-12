---
read_when:
    - 你想要检查推断出的跟进承诺
    - 你想忽略待处理的签到请求
    - 你正在审计 Heartbeat 可能交付的内容
summary: '`openclaw commitments` 的 CLI 参考（检查并取消推断出的后续事项）'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-11T20:25:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

列出并管理推断式跟进承诺。

跟进承诺是通过 `commitments.enabled` 选择启用的短期跟进记忆，根据对话上下文创建，并由 Heartbeat 传递。有关概念指南和配置，请参阅[推断式跟进承诺](/zh-CN/concepts/commitments)。

不带子命令时，`openclaw commitments` 会列出待处理的跟进承诺。

## 用法

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## 选项

- `--all`：显示所有状态，而不是仅显示待处理的跟进承诺。
- `--agent <id>`：按单个智能体 ID 筛选。
- `--status <status>`：按状态筛选。可选值：`pending`、`sent`、`dismissed`、`snoozed` 或 `expired`。传入未知值时将报错退出。
- `--json`：输出机器可读的 JSON。

`dismiss` 会将指定的跟进承诺 ID 标记为 `dismissed`，使 Heartbeat 不再传递这些跟进承诺。

## 示例

列出待处理的跟进承诺：

```bash
openclaw commitments
```

列出所有已存储的跟进承诺：

```bash
openclaw commitments --all
```

按单个智能体筛选：

```bash
openclaw commitments --agent main
```

查找已推迟的跟进承诺：

```bash
openclaw commitments --status snoozed
```

解除一个或多个跟进承诺：

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

导出为 JSON：

```bash
openclaw commitments --all --json
```

## 输出

文本输出会显示跟进承诺数量、存储路径、所有生效的筛选条件，并为每个跟进承诺显示一行：

- 跟进承诺 ID
- 状态
- 类型（`event_check_in`、`deadline_check`、`care_check_in` 或 `open_loop`）
- 最早到期时间
- 作用域（智能体/渠道/目标）
- 建议的跟进文本

JSON 输出包括数量、生效的状态和智能体筛选条件、跟进承诺存储路径，以及完整的已存储记录。

## 相关内容

- [推断式跟进承诺](/zh-CN/concepts/commitments)
- [记忆概览](/zh-CN/concepts/memory)
- [Heartbeat](/zh-CN/gateway/heartbeat)
- [定时任务](/zh-CN/automation/cron-jobs)
