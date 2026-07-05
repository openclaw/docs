---
read_when:
    - 你想检查推断式跟进承诺
    - 你想要取消待处理的签到
    - 你正在审核 Heartbeat 可能会递送的内容
summary: CLI 参考：`openclaw commitments`（检查并忽略推断的后续跟进）
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-05T11:08:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

列出并管理推断式跟进承诺。

跟进承诺是可选启用的（`commitments.enabled`）、短期存在的跟进记忆，
会根据对话上下文创建，并由 Heartbeat 递送。概念指南和配置请参阅
[推断式跟进承诺](/zh-CN/concepts/commitments)。

没有子命令时，`openclaw commitments` 会列出待处理的跟进承诺。

## 用法

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## 选项

- `--all`：显示所有状态，而不只是待处理的跟进承诺。
- `--agent <id>`：筛选到一个智能体 ID。
- `--status <status>`：按状态筛选。取值：`pending`、`sent`、
  `dismissed`、`snoozed` 或 `expired`。未知值会以错误退出。
- `--json`：输出机器可读的 JSON。

`dismiss` 会将给定的跟进承诺 ID 标记为 `dismissed`，这样 Heartbeat 将不会
递送它们。

## 示例

列出待处理的跟进承诺：

```bash
openclaw commitments
```

列出每个已存储的跟进承诺：

```bash
openclaw commitments --all
```

筛选到一个智能体：

```bash
openclaw commitments --agent main
```

查找已暂停的跟进承诺：

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

文本输出会打印跟进承诺数量、存储路径、任何有效筛选器，
以及每个跟进承诺一行：

- 跟进承诺 ID
- 状态
- 类型（`event_check_in`、`deadline_check`、`care_check_in` 或 `open_loop`）
- 最早到期时间
- 范围（智能体/渠道/目标）
- 建议的问候文本

JSON 输出包含数量、有效的状态和智能体筛选器、
跟进承诺存储路径，以及完整的已存储记录。

## 相关

- [推断式跟进承诺](/zh-CN/concepts/commitments)
- [记忆概览](/zh-CN/concepts/memory)
- [Heartbeat](/zh-CN/gateway/heartbeat)
- [定时任务](/zh-CN/automation/cron-jobs)
