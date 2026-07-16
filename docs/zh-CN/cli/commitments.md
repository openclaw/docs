---
read_when:
    - 你想检查推断式跟进承诺
    - 你想忽略待处理的签到提醒
    - 你正在审计 Heartbeat 可能交付的内容
summary: '`openclaw commitments` 的 CLI 参考（检查并取消推断式跟进事项）'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T11:30:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

列出并管理推断式跟进承诺。

跟进承诺是选择启用的（`commitments.enabled`）、短期的跟进记忆，
根据对话上下文创建并由 Heartbeat 交付。概念指南和配置请参阅
[推断式跟进承诺](/zh-CN/concepts/commitments)。

不带子命令时，`openclaw commitments` 会列出待处理的跟进承诺。

## 用法

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## 选项

- `--all`：显示所有状态，而不是仅显示待处理的跟进承诺。
- `--agent <id>`：筛选到一个 Agent ID。
- `--status <status>`：按状态筛选。值为：`pending`、`sent`、
  `dismissed`、`snoozed` 或 `expired`。未知值会导致程序报错退出。
- `--json`：输出机器可读的 JSON。

`dismiss` 会将给定的跟进承诺 ID 标记为 `dismissed`，使 Heartbeat 不再
交付它们。

## 示例

列出待处理的跟进承诺：

```bash
openclaw commitments
```

列出所有已存储的跟进承诺：

```bash
openclaw commitments --all
```

筛选到一个 Agent：

```bash
openclaw commitments --agent main
```

查找已暂缓的跟进承诺：

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

文本输出会显示跟进承诺数量、共享 SQLite 数据库路径、所有有效筛选条件，
以及每个跟进承诺对应的一行：

- 跟进承诺 ID
- 状态
- 类型（`event_check_in`、`deadline_check`、`care_check_in` 或 `open_loop`）
- 最早到期时间
- 作用域（Agent/渠道/目标）
- 建议的跟进文本

JSON 输出包括数量、有效的状态和 Agent 筛选条件、
共享 SQLite 数据库路径以及完整的存储记录。

## 相关内容

- [推断式跟进承诺](/zh-CN/concepts/commitments)
- [记忆概览](/zh-CN/concepts/memory)
- [Heartbeat](/zh-CN/gateway/heartbeat)
- [定时任务](/zh-CN/automation/cron-jobs)
